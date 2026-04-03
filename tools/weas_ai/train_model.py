#!/usr/bin/env python3
from __future__ import annotations

import argparse
from pathlib import Path

import torch
from torch import nn
from torch.utils.data import DataLoader, random_split

from weas_ai.config import WorkspacePaths
from weas_ai.dataset import WeasTrainingDataset
from weas_ai.model import WeasSpectrumTempoModel


def train_epoch(
    model: WeasSpectrumTempoModel,
    loader: DataLoader,
    device: torch.device,
    optimizer: torch.optim.Optimizer,
    beat_loss_fn: nn.Module,
    tempo_loss_fn: nn.Module,
) -> float:
    model.train()
    total_loss = 0.0

    for features, beat_target, tempo_target in loader:
        features = features.to(device)
        beat_target = beat_target.to(device)
        tempo_target = tempo_target.to(device)
        optimizer.zero_grad(set_to_none=True)
        beat_logits, tempo_logits = model(features)
        beat_loss = beat_loss_fn(beat_logits, beat_target)
        tempo_loss = tempo_loss_fn(tempo_logits, tempo_target)
        loss = beat_loss + tempo_loss
        loss.backward()
        optimizer.step()
        total_loss += float(loss.item())

    return total_loss / max(1, len(loader))


@torch.no_grad()
def evaluate(
    model: WeasSpectrumTempoModel,
    loader: DataLoader,
    device: torch.device,
    beat_loss_fn: nn.Module,
    tempo_loss_fn: nn.Module,
) -> float:
    model.eval()
    total_loss = 0.0

    for features, beat_target, tempo_target in loader:
        features = features.to(device)
        beat_target = beat_target.to(device)
        tempo_target = tempo_target.to(device)
        beat_logits, tempo_logits = model(features)
        beat_loss = beat_loss_fn(beat_logits, beat_target)
        tempo_loss = tempo_loss_fn(tempo_logits, tempo_target)
        total_loss += float((beat_loss + tempo_loss).item())

    return total_loss / max(1, len(loader))


def main() -> None:
    parser = argparse.ArgumentParser(description="Train the WEAS spectrum tempo model.")
    parser.add_argument("--workspace", type=Path, default=Path(__file__).resolve().parent, help="tools/weas_ai workspace root.")
    parser.add_argument("--epochs", type=int, default=12)
    parser.add_argument("--batch-size", type=int, default=24)
    parser.add_argument("--learning-rate", type=float, default=1e-3)
    parser.add_argument("--val-split", type=float, default=0.1)
    args = parser.parse_args()

    paths = WorkspacePaths.from_root(args.workspace)
    paths.ensure()
    dataset = WeasTrainingDataset(paths.labels / "training_index.jsonl")

    if len(dataset) < 2:
        raise RuntimeError("training_index.jsonl must contain at least 2 samples before training.")

    val_size = int(len(dataset) * args.val_split)
    val_size = max(1, min(len(dataset) - 1, val_size))
    train_size = len(dataset) - val_size
    train_dataset, val_dataset = random_split(dataset, [train_size, val_size])

    train_loader = DataLoader(train_dataset, batch_size=args.batch_size, shuffle=True, num_workers=0)
    val_loader = DataLoader(val_dataset, batch_size=args.batch_size, shuffle=False, num_workers=0)

    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    model = WeasSpectrumTempoModel().to(device)
    optimizer = torch.optim.AdamW(model.parameters(), lr=args.learning_rate)
    beat_loss_fn = nn.BCEWithLogitsLoss()
    tempo_loss_fn = nn.CrossEntropyLoss()

    best_loss = float("inf")
    checkpoint_path = paths.artifacts / "weas_spectrum_model.pt"

    for epoch in range(1, args.epochs + 1):
        train_loss = train_epoch(model, train_loader, device, optimizer, beat_loss_fn, tempo_loss_fn)
        val_loss = evaluate(model, val_loader, device, beat_loss_fn, tempo_loss_fn)
        print(f"epoch={epoch} train_loss={train_loss:.4f} val_loss={val_loss:.4f}")

        if val_loss < best_loss:
            best_loss = val_loss
            torch.save(
                {
                    "model_state_dict": model.state_dict(),
                    "config": {
                        "epochs": args.epochs,
                        "batch_size": args.batch_size,
                        "learning_rate": args.learning_rate,
                    },
                },
                checkpoint_path,
            )
            print(f"saved checkpoint to {checkpoint_path}")


if __name__ == "__main__":
    main()
