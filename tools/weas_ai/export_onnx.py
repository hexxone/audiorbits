#!/usr/bin/env python3
from __future__ import annotations

import argparse
import json
from pathlib import Path

import torch

from weas_ai.config import FFT_BINS, FRAME_RATE, MAX_BPM, MIN_BPM, TENSOR_CHANNELS, TENSOR_FRAMES, WorkspacePaths
from weas_ai.model import WeasSpectrumTempoModel


def main() -> None:
    parser = argparse.ArgumentParser(description="Export the WEAS spectrum tempo model to ONNX.")
    parser.add_argument("--workspace", type=Path, default=Path(__file__).resolve().parent, help="tools/weas_ai workspace root.")
    parser.add_argument("--checkpoint", type=Path, default=None, help="Override checkpoint path.")
    parser.add_argument("--output-dir", type=Path, default=None, help="Override export directory.")
    args = parser.parse_args()

    paths = WorkspacePaths.from_root(args.workspace)
    paths.ensure()
    checkpoint_path = args.checkpoint or (paths.artifacts / "weas_spectrum_model.pt")
    output_dir = args.output_dir or paths.artifacts
    output_dir.mkdir(parents=True, exist_ok=True)

    checkpoint = torch.load(checkpoint_path, map_location="cpu")
    model = WeasSpectrumTempoModel()
    model.load_state_dict(checkpoint["model_state_dict"])
    model.eval()

    dummy = torch.zeros((1, TENSOR_CHANNELS, TENSOR_FRAMES, FFT_BINS), dtype=torch.float32)
    onnx_path = output_dir / "model.onnx"
    torch.onnx.export(
        model,
        dummy,
        onnx_path,
        input_names=["spectrum_input"],
        output_names=["beat_logits", "tempo_logits"],
        dynamic_axes=None,
        opset_version=17,
    )

    manifest = {
        "version": 1,
        "ready": True,
        "modelPath": "model.onnx",
        "inputShape": [1, TENSOR_CHANNELS, TENSOR_FRAMES, FFT_BINS],
        "frameRate": FRAME_RATE,
        "bpmMin": MIN_BPM,
        "bpmMax": MAX_BPM,
        "beatOutputName": "beat_logits",
        "tempoOutputName": "tempo_logits",
        "stride": 1,
        "normalization": {
            "inputScale": 1.0,
            "deltaScale": 1.0,
            "salientScale": 1.0,
        },
        "note": "Exported from tools/weas_ai/export_onnx.py",
    }
    manifest_path = output_dir / "manifest.json"
    manifest_path.write_text(json.dumps(manifest, indent=2), encoding="utf-8")

    print(f"wrote {onnx_path}")
    print(f"wrote {manifest_path}")


if __name__ == "__main__":
    main()
