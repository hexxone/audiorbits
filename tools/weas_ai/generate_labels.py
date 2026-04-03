#!/usr/bin/env python3
from __future__ import annotations

import argparse
import json
from pathlib import Path

import numpy as np

from weas_ai.config import MAX_BPM, MIN_BPM, TENSOR_FRAMES, WorkspacePaths


def load_beat_this_sidecar(path: Path) -> tuple[np.ndarray, int]:
    payload = json.loads(path.read_text(encoding="utf-8"))
    beat_times = np.asarray(payload.get("beats", []), dtype=np.float32)
    bpm = payload.get("bpm")

    if bpm is None and beat_times.size >= 2:
        intervals = np.diff(beat_times)
        median_interval = float(np.median(intervals[intervals > 0]))
        bpm = round(60.0 / median_interval) if median_interval > 0 else MIN_BPM

    bpm = int(np.clip(int(round(float(bpm))), MIN_BPM, MAX_BPM))
    return beat_times, bpm


def nearest_beat_distance(frame_time: float, beat_times: np.ndarray) -> float:
    if beat_times.size == 0:
        return 1e9
    index = int(np.searchsorted(beat_times, frame_time))
    distances = []
    if index < beat_times.size:
        distances.append(abs(float(beat_times[index]) - frame_time))
    if index > 0:
        distances.append(abs(float(beat_times[index - 1]) - frame_time))
    return min(distances) if distances else 1e9


def build_training_index(feature_root: Path, label_root: Path, output_path: Path) -> int:
    count = 0
    output_path.parent.mkdir(parents=True, exist_ok=True)

    with output_path.open("w", encoding="utf-8") as handle:
        for feature_path in sorted(feature_root.rglob("*.npz")):
            relative_path = feature_path.relative_to(feature_root).with_suffix(".json")
            sidecar_path = label_root / relative_path

            if not sidecar_path.exists():
                print(f"skip missing beat sidecar: {sidecar_path}")
                continue

            with np.load(feature_path, allow_pickle=False) as data:
                frame_times = data["frame_times"]

            beat_times, tempo_bpm = load_beat_this_sidecar(sidecar_path)
            beat_interval = 60.0 / tempo_bpm
            tolerance = min(0.08, beat_interval * 0.18)

            for frame_index in range(TENSOR_FRAMES - 1, frame_times.shape[0]):
                frame_time = float(frame_times[frame_index])
                beat_target = 1.0 if nearest_beat_distance(frame_time, beat_times) <= tolerance else 0.0
                row = {
                    "feature_path": str(feature_path.resolve()),
                    "frame_index": frame_index,
                    "beat_target": beat_target,
                    "tempo_bpm": tempo_bpm,
                }
                handle.write(json.dumps(row) + "\n")
                count += 1

    return count


def main() -> None:
    parser = argparse.ArgumentParser(description="Build a training index from feature tensors and Beat This sidecars.")
    parser.add_argument("--workspace", type=Path, default=Path(__file__).resolve().parent, help="tools/weas_ai workspace root.")
    parser.add_argument("--labels", type=Path, required=True, help="Directory containing Beat This JSON sidecars.")
    args = parser.parse_args()

    paths = WorkspacePaths.from_root(args.workspace)
    paths.ensure()
    feature_root = paths.datasets / "features"
    output_path = paths.labels / "training_index.jsonl"
    count = build_training_index(feature_root, args.labels, output_path)
    print(f"wrote {count} samples to {output_path}")


if __name__ == "__main__":
    main()
