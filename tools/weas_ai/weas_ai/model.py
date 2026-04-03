from __future__ import annotations

import torch
from torch import nn

from .config import FFT_BINS, MAX_BPM, MIN_BPM, TENSOR_CHANNELS, TENSOR_FRAMES


class ResidualTemporalBlock(nn.Module):
    def __init__(self, channels: int, dilation: int) -> None:
        super().__init__()
        padding = dilation
        self.net = nn.Sequential(
            nn.Conv1d(channels, channels, kernel_size=3, padding=padding, dilation=dilation),
            nn.GELU(),
            nn.Conv1d(channels, channels, kernel_size=1),
        )
        self.norm = nn.BatchNorm1d(channels)

    def forward(self, inputs: torch.Tensor) -> torch.Tensor:
        outputs = self.net(inputs)
        return torch.gelu(self.norm(outputs + inputs))


class WeasSpectrumTempoModel(nn.Module):
    def __init__(self, tempo_classes: int | None = None) -> None:
        super().__init__()
        self.tempo_classes = tempo_classes or (MAX_BPM - MIN_BPM + 1)
        self.stem = nn.Sequential(
            nn.Conv2d(TENSOR_CHANNELS, 24, kernel_size=(3, 5), padding=(1, 2)),
            nn.GELU(),
            nn.Conv2d(24, 32, kernel_size=(3, 3), padding=1),
            nn.GELU(),
            nn.MaxPool2d(kernel_size=(1, 2)),
        )
        self.project = nn.Sequential(
            nn.Conv1d(32 * (FFT_BINS // 2), 128, kernel_size=1),
            nn.GELU(),
        )
        self.temporal = nn.Sequential(
            ResidualTemporalBlock(128, dilation=1),
            ResidualTemporalBlock(128, dilation=2),
            ResidualTemporalBlock(128, dilation=4),
            ResidualTemporalBlock(128, dilation=8),
        )
        self.beat_head = nn.Sequential(
            nn.Conv1d(128, 64, kernel_size=1),
            nn.GELU(),
            nn.Conv1d(64, 1, kernel_size=1),
        )
        self.tempo_head = nn.Sequential(
            nn.AdaptiveAvgPool1d(1),
            nn.Flatten(),
            nn.Linear(128, 128),
            nn.GELU(),
            nn.Linear(128, self.tempo_classes),
        )

    def forward(self, inputs: torch.Tensor) -> tuple[torch.Tensor, torch.Tensor]:
        if inputs.ndim != 4:
            raise ValueError(f"Expected [batch, {TENSOR_CHANNELS}, {TENSOR_FRAMES}, {FFT_BINS}], got {tuple(inputs.shape)}")

        features = self.stem(inputs)
        batch, channels, frames, freqs = features.shape
        features = features.permute(0, 2, 1, 3).contiguous().view(batch, frames, channels * freqs)
        features = features.transpose(1, 2)
        features = self.project(features)
        features = self.temporal(features)
        beat_logits = self.beat_head(features)[:, :, -1]
        tempo_logits = self.tempo_head(features)
        return beat_logits, tempo_logits

