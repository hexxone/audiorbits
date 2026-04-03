from dataclasses import dataclass
from pathlib import Path


FRAME_RATE = 30
FFT_BINS = 64
TENSOR_CHANNELS = 6
TENSOR_FRAMES = 192
MIN_BPM = 55
MAX_BPM = 220
SAMPLE_RATE = 22050
WINDOW_DURATION_SECONDS = TENSOR_FRAMES / FRAME_RATE


@dataclass(frozen=True)
class WorkspacePaths:
    root: Path
    artifacts: Path
    cache: Path
    datasets: Path
    labels: Path

    @classmethod
    def from_root(cls, root: Path) -> "WorkspacePaths":
        return cls(
            root=root,
            artifacts=root / "artifacts",
            cache=root / "cache",
            datasets=root / "datasets",
            labels=root / "labels",
        )

    def ensure(self) -> None:
        self.artifacts.mkdir(parents=True, exist_ok=True)
        self.cache.mkdir(parents=True, exist_ok=True)
        self.datasets.mkdir(parents=True, exist_ok=True)
        self.labels.mkdir(parents=True, exist_ok=True)

