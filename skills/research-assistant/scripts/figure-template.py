#!/usr/bin/env python3
"""
Publication-quality figure template.

Usage:
  python figure-template.py                          # generates example figure
  python figure-template.py --data results.csv       # plot from CSV
  python figure-template.py --style ieee             # use IEEE style

Requirements:
  pip install matplotlib scienceplots numpy pandas
"""

import argparse
import sys
from pathlib import Path

import numpy as np


def main():
    parser = argparse.ArgumentParser(description="Generate publication-quality figures")
    parser.add_argument("--data", type=Path, help="CSV file with data to plot")
    parser.add_argument("--output", type=Path, default=Path("results/figures/result.pdf"),
                        help="Output path (default: results/figures/result.pdf)")
    parser.add_argument("--style", choices=["science", "ieee", "nature"],
                        default="science", help="Plot style")
    parser.add_argument("--dpi", type=int, default=300, help="Figure DPI")
    parser.add_argument("--width", type=float, default=3.5,
                        help="Figure width in inches (single column ~3.5, double ~7.0)")
    args = parser.parse_args()

    # --- Style setup ---
    try:
        import scienceplots  # noqa: F401
        plt_styles = [args.style, "no-latex"]  # no-latex if LaTeX not available
    except ImportError:
        plt_styles = ["default"]
        print("Tip: pip install SciencePlots for publication-quality styles",
              file=sys.stderr)

    import matplotlib.pyplot as plt
    plt.style.use(plt_styles)

    # Also try seaborn colorblind palette
    try:
        import seaborn as sns
        sns.set_palette("colorblind")
    except ImportError:
        pass

    # --- Create figure ---
    fig, ax = plt.subplots(1, 1, figsize=(args.width, args.width * 0.72))

    # --- Load or generate data ---
    if args.data and args.data.exists():
        import pandas as pd
        df = pd.read_csv(args.data)
        # Example: assume columns named 'x', 'y', 'y_err'
        x = df["x"].values
        y = df["y"].values
        y_err = df.get("y_err", None)
    else:
        # Generate synthetic data as example
        np.random.seed(42)
        x = np.linspace(0, 10, 50)
        y = 1.0 - np.exp(-0.3 * x) + 0.05 * np.random.randn(50)
        y_err = 0.05 * np.ones_like(x)

    # --- Plot ---
    if y_err is not None:
        ax.errorbar(x, y, yerr=y_err, fmt="o-", capsize=3, markersize=4,
                    label="Our method")
    else:
        ax.plot(x, y, "o-", markersize=4, label="Our method")

    # Add baseline if available (example)
    # ax.plot(x, 1 - np.exp(-0.2 * x), "--", label="Baseline")

    # --- Labels & legend ---
    ax.set_xlabel("Epochs")
    ax.set_ylabel("Accuracy")
    ax.set_title("Training curve")
    ax.legend(frameon=True, fontsize=8)
    ax.set_xlim(x.min(), x.max())
    # ax.set_ylim(0, 1)

    # --- Grid (subtle) ---
    ax.grid(True, alpha=0.3)

    # --- Tight layout ---
    fig.tight_layout()

    # --- Save ---
    args.output.parent.mkdir(parents=True, exist_ok=True)
    fig.savefig(str(args.output), bbox_inches="tight", dpi=args.dpi)
    print(f"Figure saved to: {args.output}")

    # --- Also show if interactive ---
    plt.show()


if __name__ == "__main__":
    main()
