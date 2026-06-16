#!/usr/bin/env bash
# scaffold-prototype.sh — Create a new research project directory
# Usage: ./scaffold-prototype.sh <project-name>
# Example: ./scaffold-prototype.sh denoising-diffusion

set -euo pipefail

if [ $# -lt 1 ]; then
    echo "Usage: $0 <project-name>"
    echo "Example: $0 denoising-diffusion"
    exit 1
fi

NAME="$1"
SKILL_DIR="$(cd "$(dirname "$0")/.." && pwd)"
TARGET_DIR="${2:-./${NAME}}"

if [ -d "$TARGET_DIR" ]; then
    echo "Error: Directory '$TARGET_DIR' already exists."
    exit 1
fi

echo "Scaffolding project: $NAME"
echo "Target: $TARGET_DIR"

# Create directory structure
mkdir -p "$TARGET_DIR"/{data,notebooks,src,configs,results/{figures,logs,checkpoints,tables,reports}}

# Create README
cat > "$TARGET_DIR/README.md" << 'READEOF'
# <Project Name>

## Problem Statement



## Approach



## Quick Start

```bash
pip install -r requirements.txt
python src/train.py --config configs/default.yaml
```

## Results

<!-- Add results here -->

## Structure

```
├── notes/         # Surveys, problem docs, research log
├── data/          # (gitignored) Data files
├── notebooks/     # Exploration notebooks
├── src/           # Source code
│   ├── model.py
│   ├── train.py
│   └── evaluate.py
├── configs/       # Experiment configs
└── results/       # (gitignored) Outputs (figures, logs, tables, reports)
```
READEOF

# Create placeholder requirements
cat > "$TARGET_DIR/requirements.txt" << 'REQEOF'
# Project dependencies
torch>=2.1
torchvision>=0.16
numpy>=1.24
scipy>=1.10
matplotlib>=3.7
wandb>=0.15
pyyaml>=6.0
REQEOF

# Create placeholder __init__.py
touch "$TARGET_DIR/src/__init__.py"

# Create placeholder model.py
cat > "$TARGET_DIR/src/model.py" << 'PYEOF'
"""Model definition."""
import torch.nn as nn

class PlaceholderModel(nn.Module):
    """Replace with your actual model."""

    def __init__(self, input_dim: int = 784, hidden_dim: int = 256, num_classes: int = 10):
        super().__init__()
        self.net = nn.Sequential(
            nn.Linear(input_dim, hidden_dim),
            nn.ReLU(),
            nn.Linear(hidden_dim, hidden_dim),
            nn.ReLU(),
            nn.Linear(hidden_dim, num_classes),
        )

    def forward(self, x):
        return self.net(x)
PYEOF

# Create notes directory (for surveys, problem docs, research log)
mkdir -p "$TARGET_DIR/notes"

# Create placeholder config
cp "$SKILL_DIR/configs/default-experiment.yaml" "$TARGET_DIR/configs/default.yaml"

# Create .gitignore
cat > "$TARGET_DIR/.gitignore" << 'GITIGNORE'
data/
results/
*.pyc
__pycache__/
.DS_Store
*.log
checkpoints/
wandb/
mlruns/
GITIGNORE

echo "✅ Scaffolded prototype at: $TARGET_DIR"
echo "   Next: cd $TARGET_DIR"
