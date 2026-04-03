# WEAS Spectrum AI Workspace (WIP)

This workspace is the offline side of the browser `AI` analyzer mode.

## Intended pipeline

1. Capture browser/WE-style rolling spectrum tensors from local audio.
2. Generate pseudo-labels with `Beat This`.
3. Validate conflicts against secondary sources and manual review.
4. Train a tiny causal CRNN/TCN on the exact deployment tensor.
5. Export a fixed-shape ONNX model and update `public/models/weas-spectrum-ai/manifest.json`.

## Workspace scripts

- `capture_features.py`
  Approximates the WE/browser spectrum stream from local audio files and writes compressed feature tensors under `datasets/features/`.
- `generate_labels.py`
  Builds a frame-level training index from the captured features plus Beat This sidecar JSON files.
- `train_model.py`
  Trains a small causal CRNN/TCN that predicts a current-frame beat logit and a tempo class.
- `export_onnx.py`
  Exports the PyTorch checkpoint to a fixed-shape ONNX model plus a matching runtime manifest.

## Suggested flow

```bash
python tools/weas_ai/capture_features.py --source /path/to/audio/library
python tools/weas_ai/generate_labels.py --labels /path/to/beat_this_sidecars
python tools/weas_ai/train_model.py
python tools/weas_ai/export_onnx.py
```

## Expected outputs

- `artifacts/model.onnx`
- `artifacts/manifest.json`
- dataset tensors and label caches under local ignored folders

## Runtime contract

The browser worker expects:

- input shape: `1 x 6 x 192 x 64`
- channels:
  - left
  - right
  - deltaLeft
  - deltaRight
  - salientLeft
  - salientRight
- output tensors:
  - `beat_logits`
  - `tempo_logits`

## Notes

- The current repo ships only the runtime scaffold and placeholder manifest.
- The trained model is intentionally not committed here.
- When a real model is exported, copy the ONNX file to `public/models/weas-spectrum-ai/model.onnx` and flip `ready` to `true` in the manifest.
