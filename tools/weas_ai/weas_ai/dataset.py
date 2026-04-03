from __future__ import annotations

import json
from dataclasses import dataclass
from pathlib import Path

import numpy as np
import torch
from torch.utils.data import Dataset

from .config import MIN_BPM, TENSOR_FRAMES


@dataclass(frozen=True)
class TrainingSample:
    feature_path: Path
    frame_index: int
    beat_target: float
    tempo_bpm: int


class WeasTrainingDataset(Dataset[tuple[torch.Tensor, torch.Tensor, torch.Tensor]]):
    def __init__(self, index_path: Path) -> None:
        self.index_path = index_path
        self.samples = self._load_index(index_path)
        self._feature_cache: dict[Path, np.ndarray] = {}

    def __len__(self) -> int:
        return len(self.samples)

    def __getitem__(self, idx: int) -> tuple[torch.Tensor, torch.Tensor, torch.Tensor]:
        sample = self.samples[idx]
        features = self._load_features(sample.feature_path)
        start = sample.frame_index - TENSOR_FRAMES + 1
        end = sample.frame_index + 1
        window = features[start:end]
        window = np.transpose(window, (1, 0, 2))
        beat_target = np.array([sample.beat_target], dtype=np.float32)
        tempo_class = np.array(sample.tempo_bpm - MIN_BPM, dtype=np.int64)
        return (
            torch.from_numpy(window.astype(np.float32)),
            torch.from_numpy(beat_target),
            torch.from_numpy(tempo_class),
        )

    def _load_features(self, path: Path) -> np.ndarray:
        if path not in self._feature_cache:
            with np.load(path, allow_pickle=False) as data:
                self._feature_cache[path] = data["features"]
        return self._feature_cache[path]

    def _load_index(self, index_path: Path) -> list[TrainingSample]:
        samples: list[TrainingSample] = []
        with index_path.open("r", encoding="utf-8") as handle:
            for line in handle:
                if not line.strip():
                    continue
                row = json.loads(line)
                samples.append(
                    TrainingSample(
                        feature_path=Path(row["feature_path"]),
                        frame_index=int(row["frame_index"]),
                        beat_target=float(row["beat_target"]),
                        tempo_bpm=int(row["tempo_bpm"]),
                    )
                )
        return samples

