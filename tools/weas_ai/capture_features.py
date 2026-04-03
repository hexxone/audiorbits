#!/usr/bin/env python3
from __future__ import annotations

import argparse
import json
from pathlib import Path

import librosa
import numpy as np
import soundfile as sf

from weas_ai.config import FFT_BINS, FRAME_RATE, SAMPLE_RATE, WorkspacePaths


def compute_log_spectrum(channel: np.ndarray) -> np.ndarray:
    hop_length = max(1, round(SAMPLE_RATE / FRAME_RATE))
    stft = librosa.stft(channel, n_fft=2048, hop_length=hop_length, center=True)
    magnitude = np.abs(stft)
    mel = librosa.feature.melspectrogram(
        S=magnitude ** 2,
        sr=SAMPLE_RATE,
        n_mels=FFT_BINS,
        fmin=20,
        fmax=min(11025, SAMPLE_RATE / 2),
    )
    return np.log1p(mel).T.astype(np.float32)


def compute_salience(log_spectrum: np.ndarray) -> np.ndarray:
    padded = np.pad(log_spectrum, ((0, 0), (1, 1)), mode="edge")
    center = padded[:, 1:-1]
    neighborhood = 0.5 * (padded[:, :-2] + padded[:, 2:])
    contrast = np.maximum(0.0, center - neighborhood)
    baseline = np.maximum(1e-4, np.mean(center, axis=0, keepdims=True))
    return np.clip(contrast / baseline, 0.0, 4.0).astype(np.float32)


def build_feature_tensor(audio_path: Path) -> tuple[np.ndarray, np.ndarray]:
    audio, sample_rate = sf.read(audio_path, always_2d=True)
    audio = audio.astype(np.float32)

    if sample_rate != SAMPLE_RATE:
        left = librosa.resample(audio[:, 0], orig_sr=sample_rate, target_sr=SAMPLE_RATE)
        right = librosa.resample(audio[:, 1] if audio.shape[1] > 1 else audio[:, 0], orig_sr=sample_rate, target_sr=SAMPLE_RATE)
    else:
        left = audio[:, 0]
        right = audio[:, 1] if audio.shape[1] > 1 else audio[:, 0]

    left_spec = compute_log_spectrum(left)
    right_spec = compute_log_spectrum(right)
    frames = min(left_spec.shape[0], right_spec.shape[0])
    left_spec = left_spec[:frames]
    right_spec = right_spec[:frames]
    left_delta = np.vstack([np.zeros((1, FFT_BINS), dtype=np.float32), np.diff(left_spec, axis=0)])
    right_delta = np.vstack([np.zeros((1, FFT_BINS), dtype=np.float32), np.diff(right_spec, axis=0)])
    left_salient = compute_salience(left_spec)
    right_salient = compute_salience(right_spec)
    features = np.stack(
        [left_spec, right_spec, left_delta, right_delta, left_salient, right_salient],
        axis=1,
    ).astype(np.float32)
    frame_times = np.arange(frames, dtype=np.float32) / FRAME_RATE
    return features, frame_times


def capture_audio_tree(source_dir: Path, output_dir: Path) -> list[dict[str, str]]:
    manifests: list[dict[str, str]] = []
    for audio_path in sorted(source_dir.rglob("*")):
        if audio_path.suffix.lower() not in {".mp3", ".wav", ".flac", ".ogg", ".m4a", ".aac"}:
            continue
        relative_path = audio_path.relative_to(source_dir)
        target_path = output_dir / relative_path.with_suffix(".npz")
        target_path.parent.mkdir(parents=True, exist_ok=True)
        features, frame_times = build_feature_tensor(audio_path)
        np.savez_compressed(target_path, features=features, frame_times=frame_times)
        manifests.append(
            {
                "audio_path": str(audio_path.resolve()),
                "feature_path": str(target_path.resolve()),
                "frames": str(features.shape[0]),
            }
        )
        print(f"captured {audio_path} -> {target_path}")
    return manifests


def main() -> None:
    parser = argparse.ArgumentParser(description="Capture WE-style spectrum tensors from local audio.")
    parser.add_argument("--source", type=Path, required=True, help="Directory containing local audio files.")
    parser.add_argument("--workspace", type=Path, default=Path(__file__).resolve().parent, help="tools/weas_ai workspace root.")
    args = parser.parse_args()

    paths = WorkspacePaths.from_root(args.workspace)
    paths.ensure()
    output_dir = paths.datasets / "features"
    output_dir.mkdir(parents=True, exist_ok=True)

    manifests = capture_audio_tree(args.source, output_dir)
    manifest_path = paths.datasets / "feature_manifest.json"
    manifest_path.write_text(json.dumps(manifests, indent=2), encoding="utf-8")
    print(f"wrote feature manifest to {manifest_path}")


if __name__ == "__main__":
    main()
