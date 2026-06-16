# Experiment Report

**Project:** <name>
**Date:** <YYYY-MM-DD>
**Experiment ID:** <exp-001>
**Config file:** <configs/experiment.yaml>
**Status:** <complete / failed / in-progress>

---

## Setup

| Item | Value |
|------|-------|
| Seed(s) | 42, 43, 44 |
| Dataset | <dataset name, split> |
| Model | <architecture, parameter count> |
| Training | <optimizer, lr, batch size, epochs> |
| Hardware | <GPU type, count, RAM> |
| Time taken | <wall clock time> |

## Results

### Quantitative

| Metric | Our Method | Baseline A | Baseline B | Δ |
|--------|-----------|------------|------------|---|
| Metric 1 | 0.XXX ± 0.XXX | 0.XXX ± 0.XXX | 0.XXX ± 0.XXX | +X% |
| Metric 2 | 0.XXX ± 0.XXX | 0.XXX ± 0.XXX | 0.XXX ± 0.XXX | +X% |

*Statistical test used: <paired t-test / Wilcoxon>, p-value: <X.XXX>*

### Qualitative

<!-- Observations about outputs, failure cases, visual comparison -->

### Training Dynamics

- **Convergence:** Did it converge? At what epoch?
- **Overfitting:** Evidence? (train vs val loss gap)
- **Stability:** Were there gradient spikes, NaN losses, etc.?

---

## Ablations / Sensitivity

| Variation | Metric 1 | Metric 2 | Notes |
|-----------|----------|----------|-------|
| Default config | 0.XXX | 0.XXX |  |
| Without component X | 0.XXX | 0.XXX |  |
| Larger model | 0.XXX | 0.XXX |  |
| Different lr (1e-3) | 0.XXX | 0.XXX |  |

---

## Key Takeaways

1. <What worked?>
2. <What didn't work?>
3. <Surprising findings>

## Proposed Next Steps

- [ ] <Ablation: test component X independently>
- [ ] <Sweep: tune hyperparameter Y>
- [ ] <Pivot: try approach Z instead>

---

*Raw logs: results/logs/exp-001/*
*Checkpoints: results/checkpoints/exp-001/*
