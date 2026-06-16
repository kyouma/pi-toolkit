---
name: research-assistant
description: >
  Comprehensive research workflow skill for applied maths, image processing,
  ML, and deep learning. Covers literature surveying, mathematical derivation,
  algorithm development, prototyping, experiment management, statistical
  evaluation, and paper-quality figure generation. Enforces structured
  decision gates and anti-overasking guardrails to prevent costly wrong
  assumptions. Use for any research task: reading papers, developing new
  methods, building prototypes, running experiments, analyzing results,
  or preparing publications.
metadata:
  domains: ["general-research", "applied-maths", "image-processing", "ml", "deep-learning"]
  research-levels: ["survey", "derivation", "algorithm-dev", "prototyping", "experiment", "paper"]
  version: "1.2.0"
---

# Research Assistant Skill

This skill provides a complete workflow for conducting research with an AI agent. It combines structured protocols for each research phase with explicit decision gates that prevent the agent from making costly assumptions without your input.

---

## Table of Contents

1. [Environment Setup](#environment-setup)
2. [Notation Conventions](#notation-conventions)
3. [Literature Survey](#literature-survey) *(delegates to [`literature-survey`](#) skill)*
4. [Mathematical Derivation Protocol](#mathematical-derivation-protocol)
5. [Algorithm Development & Prototyping](#algorithm-development--prototyping)
6. [Experiment Management](#experiment-management)
7. [Evaluation & Metrics](#evaluation--metrics)
8. [Paper Output & Figures](#paper-output--figures)
9. [Decision Gates](#decision-gates)
10. [Session State Tracking](#session-state-tracking)
11. [Self-Critique](#self-critique)

---

## Environment Setup

### Quick-start

```bash
# All paths in this skill are relative to the skill's root directory.

# Activate environment
conda activate research  # or: source .venv/bin/activate

# Install/update core stack
pip install -r configs/requirements-research.txt
```

### Core library stack by domain

| Domain | Libraries |
|--------|-----------|
| **Image processing** | opencv-python, scikit-image, scipy.ndimage, kornia, albumentations |
| **ML/DL** | torch, torchvision, pytorch-lightning, transformers, jax, jaxlib, flax, tensorflow |
| **Applied maths** | numpy, scipy, sympy, cvxpy, pyomo, numba, jax |
| **Optimization** | cvxpy, scipy.optimize, pyomo, nevergrad, optuna |
| **Visualization** | matplotlib, seaborn, plotly, vedo (3D), scienceplots |
| **Experiment mgmt** | wandb, mlflow, sacred, hydra |
| **Data handling** | pandas, polars, h5py, zarr, xarray |
| **Paper/API tools** | arxiv, semantic-scholar-api, paperswithcode-client |

### GPU check

```bash
python -c "import torch; print(f'CUDA: {torch.cuda.is_available()}, devices: {torch.cuda.device_count()}')"
python -c "import jax; print(f'JAX devices: {jax.devices()}')"
```

---

## Notation Conventions

When discussing or deriving algorithms, use this consistent notation. When rendering in \(\LaTeX\), the formatting follows these rules:

**Notation rules:**
- Vectors: **bold non-italic lowercase** (e.g., \(\mathbf{x}\), \(\mathbf{y}\))
- Matrices: **non-bold non-italic uppercase** (e.g., \(\mathrm{X}\), \(\mathrm{W}\))
- Scalars: **non-bold italic** (e.g., \(x\), \(y\), \(\theta\), \(\eta\))
- Sets and spaces: **blackboard bold** (e.g., \(\mathbb{R}\), \(\mathbb{N}\))
- UTF-8 encoding is preferred where the environment supports it (e.g., direct Unicode in Markdown, \texttt{inputenc}[utf8] in \(\LaTeX\)).

### General symbols

| Symbol | Meaning |
|--------|---------|
| \(\mathbf{x}\) \\(\in \mathbb{R}^d\) | Input vector, image (flattened or tensor) |
| \(\mathbf{y}\) \\(\in \mathbb{R}^k\) | Target / label |
| \(\mathrm{X}\) \\(\in \mathbb{R}^{n \times d}\) | Design matrix / dataset |
| \(f_\theta(\cdot)\) | Model with parameters \(\theta\) |
| \(\ell(\cdot, \cdot)\) or \(\mathcal{L}\) | Loss function |
| \(\nabla_\theta \ell\) | Gradient w.r.t. parameters |
| \(\eta\) | Learning rate |
| \(\|\cdot\|_p\) | \(\ell_p\) norm |
| \(\mathbb{E}[\cdot]\) | Expectation |
| \(\mathcal{N}(\mu, \sigma^2)\) | Gaussian distribution |
| \(\mathrm{I}\) | Identity matrix |
| \(\odot\) | Element-wise (Hadamard) product |
| \(\ast\) | Convolution |
| \(\langle \cdot, \cdot \rangle\) | Inner product |

### For image processing specifically

| Symbol | Meaning |
|--------|---------|
| \(\mathbf{I}\) \\(\in \mathbb{R}^{H \times W \times C}\) | Input image tensor |
| \(\mathbf{K}\) | Convolution kernel |
| \(\mathbf{F}(\cdot)\) | Forward transform (e.g., FFT, DCT) |
| \(\mathbf{F}^{-1}(\cdot)\) | Inverse transform |
| \(\sigma\) | Noise level |
| \(\lambda\) | Regularization weight |
| \(\mathrm{TV}(\cdot)\) | Total variation |

---

## Literature Survey

### Trigger
Use when the user asks to survey a topic, find related work, read papers,
or understand the state of the art.

Gate 1 (survey scope) fires first — ask the scope question, then load the
full survey workflow from the **literature-survey** skill
(`/skill:literature-survey`).

The literature-survey skill covers: multi-source search strategy (Steps 1–6),
problem isomorphism analysis for adjacent-field discovery, paper reading
protocol with structured critical appraisal, dataset & metrics evaluation
criteria, survey output with PRISMA-style documentation, completeness
checklist, and incremental monitoring via research-log.yaml.

Survey output is saved to `<project-name>/notes/survey-<date>.md`.
The research log is maintained at `<project-name>/notes/research-log.yaml`.

---

## Mathematical Derivation Protocol

### Trigger
Use this when deriving new methods, proving properties, or formalizing a problem.

### Steps

```
1. State the problem formally
   - Minimize/maximize what? Over what domain?
   - Input/output types and shapes
   - Constraints (if any)
   - Write it as an optimization or equation

2. Show the current approach
   - Write the existing formulation
   - Identify its specific failure mode or limitation
   - Be precise: "O(n²) complexity", "fails when X condition", "non-differentiable"

3. Propose modification
   - State the change in mathematical terms
   - Motivate it: why does this fix the limitation?
   - Show the new formulation

4. Justify
   - Convergence: does it still converge? Same rate? Faster?
   - Complexity: what is the new time/space complexity?
   - Invariance: does it preserve any desirable properties?
   - Edge cases: what happens at boundaries, degenerate inputs?

5. Write pseudocode
   - Before any implementation, write algorithm pseudocode
   - Use the notation conventions above
   - Mark differentiable vs non-differentiable steps
```

### Derivation checklist

- [ ] Problem statement is unambiguous
- [ ] Variables and dimensions are defined
- [ ] The limitation of the current approach is quantified
- [ ] The proposed fix addresses it (not just superficially)
- [ ] Complexity is analyzed
- [ ] Edge cases are considered

---

## Algorithm Development & Prototyping

### Trigger
Use when moving from derivation to implementation.

### Pipeline

```
Step 0 — Scaffold prototype directory (run once per project)
  Use the automated scaffolding script:
    bash scripts/scaffold-prototype.sh <project-name>
  This creates the full directory tree (src/, configs/, notebooks/, results/)
  with pre-filled README.md, requirements.txt, .gitignore, and a placeholder model.

Step 1 — Problem formalization doc
  Create <project-name>/notes/problem-<date>.md containing:
  - Problem statement
  - Input/output shapes and types
  - Objective function
  - Constraints
  - Quantitative success criteria

Step 2 — Baseline implementation
  - Implement the simplest working baseline first
  - Verify on synthetic data where ground truth is known
  - Establish a lower bound

Step 3 — Proposed method
  - Start from baseline code and modify one component at a time
  - Justify each change (mathematical or empirical)
  - Test after each modification

Step 4 — Synthetic data validation
  Before touching real data, test on synthetic data:
  - Ground truth is known → can verify correctness
  - Include edge cases: degenerate inputs, extreme values, missing data

Step 5 — Real data experiment
  - Use standard dataset(s) for the domain
  - Run with seeds and logging (see Experiment Management)
  - Report mean ± std over ≥3 seeds
  - Compare against: baseline, ablated versions, SOTA if feasible
```

### Prototype directory structure

```
<project-name>/
├── README.md              # Problem statement + approach overview
├── requirements.txt       # Project-specific dependencies
├── cache/                 # (gitignored) Intermediate files, downloaded datasets,
│                         #   model checkpoints, temporary outputs. Create this
│                         #   folder at project start and place all non-final
│                         #   artifacts here to keep the repo clean.
├── notes/                 # Research documents
│   ├── research-log.yaml  # Literature monitoring log (survey dates, seen papers)
│   ├── survey-<date>.md   # Completed survey notes
│   └── problem-<date>.md  # Problem formalization document
├── data/                  # (gitignored) Small sample data
│   └── sample.py          # Script to download/generate data
├── notebooks/             # Exploration notebooks
│   └── 01-exploration.ipynb
├── src/                   # Modular source code
│   ├── __init__.py
│   ├── model.py
│   ├── train.py
│   ├── evaluate.py
│   └── utils.py
├── configs/               # Experiment configs
│   └── default.yaml
└── results/               # (gitignored) Figures, logs, checkpoints, tables, reports
    ├── figures/
    ├── logs/
    ├── checkpoints/
    ├── tables/
    └── reports/
```

**Tip:** Create \`cache/\` at the project root at the start of your project. Use it for:
- Downloaded datasets (raw copies)
- Preprocessed intermediate files (extracted features, embeddings, augmented samples)
- Model checkpoints from preliminary experiments
- Scratch outputs that are not final results
This keeps your working directory clean and makes git operations faster.

### Scaffolding command

```bash
# Quick scaffold helper
mkdir -p <name>/{notes,data,notebooks,src,configs,results/{figures,logs,checkpoints,tables,reports}}
cp templates/* "$NAME/"
```

See [scripts/scaffold-prototype.sh](scripts/scaffold-prototype.sh) for an automated version.

---

## Experiment Management

### Configuration-driven approach

Use YAML configs (Hydra-style or plain):

```yaml
# configs/experiment.yaml
model:
  architecture: unet
  hidden_dims: [64, 128, 256]
  activation: relu
training:
  lr: 1e-4
  optimizer: adam
  batch_size: 32
  epochs: 100
  scheduler: cosine
data:
  dataset: cifar10
  augmentation: random_flip
  val_split: 0.2
```

### Logging requirements

Every experiment MUST log:
- **Loss curves** (train/val per epoch)
- **Learning rate** schedule
- **Gradient norms** (mean and max per layer)
- **Sample outputs** every N epochs (images, reconstructions, etc.)
- **System metrics** (GPU utilization, memory, temperature)
- **Hyperparameters** (full config dump)

Use either Weights & Biases or MLflow:

```python
# wandb example
import wandb
wandb.init(project="my-research", config=config)
wandb.log({"train/loss": loss, "val/loss": val_loss, "lr": current_lr})
```

### Reproducibility

Every experiment script MUST include:

```python
import random, numpy, torch

def set_seed(seed: int = 42):
    random.seed(seed)
    numpy.random.seed(seed)
    torch.manual_seed(seed)
    torch.cuda.manual_seed_all(seed)
    torch.backends.cudnn.deterministic = True
    torch.backends.cudnn.benchmark = False
```

### Hydra for complex configs (optional)

```bash
pip install hydra-core
python train.py model=unet data=cifar10 training=default
```

### Experiment report — MANDATORY TEMPLATE USAGE

**After each experiment completes:**

1. Open [templates/experiment-report-template.md](templates/experiment-report-template.md)
2. Fill all sections: setup, quantitative results, training dynamics, ablations
3. The Key Takeaways section MUST include at least 1 surprising finding (something you didn't expect)
4. The Proposed Next Steps section MUST include at least one concrete follow-up (ablation, sweep, or pivot)
5. Save to `results/reports/exp-<id>-report.md`
6. Present a one-paragraph summary to the user alongside the structured results

**Do NOT skip the Ablations / Sensitivity table.** If you only ran one config, state that explicitly and note the risk of conclusions being config-specific.

---

## Evaluation & Metrics

### Classification

| Metric | Formula | When to use |
|--------|---------|-------------|
| Accuracy | (TP+TN)/(P+N) | Balanced classes only |
| Precision | TP/(TP+FP) | When false positives are costly |
| Recall | TP/(TP+FN) | When false negatives are costly |
| F1-score | 2·P·R/(P+R) | Imbalanced classes |
| AUC-ROC | ∫ TPR d(FPR) | Ranking / threshold-free |
| Matthews MCC | (TP·TN - FP·FN)/√((TP+FP)(TP+FN)(TN+FP)(TN+FN)) | Imbalanced, any class count |

### Image reconstruction / generation

| Metric | What it measures |
|--------|------------------|
| PSNR / SSIM | Pixel-level fidelity / structural similarity |
| MS-SSIM | Multi-scale structural similarity |
| LPIPS | Learned perceptual similarity (lower is better) |
| FID / KID | Distribution-level quality (generative models) |
| NRMSE | Normalized root mean square error |

### Image segmentation

| Metric | Notes |
|--------|-------|
| IoU (Jaccard) | Standard segmentation metric |
| Dice coefficient | Similar to F1 per pixel |
| Boundary F1 | Edge quality |
| Hausdorff distance | Worst-case boundary error |

### Statistical rigor

- **Report confidence intervals**: mean ± std over ≥3 seeds, or bootstrapped 95% CI
- **Statistical tests**: use paired t-test or Wilcoxon signed-rank for method comparison
- **Multiple comparisons**: Bonferroni or FDR correction when testing >2 methods
- **Effect size**: report Cohen's d or similar alongside p-values
- **Do NOT** cherry-pick the best seed — report the average

```python
from scipy import stats

# Paired t-test between our method and baseline
t_stat, p_value = stats.ttest_rel(results_ours, results_baseline)
```

---

## Paper Output & Figures

### Report format and notation conventions

When writing a survey, report, or paper, use either:
- **LaTeX** (preferred for formal reports, with \texttt{inputenc}[utf8] for UTF-8 support)
- **Markdown with LaTeX math** (for quick drafts, e.g., \texttt{$\backslash$ ( ... \$\backslash$ )} or \texttt{\$\$ ... \$\$})

**Notation rules (from Section 2):**
- Vectors: bold non-italic lowercase, e.g., \\(\mathbf{x}\\), \\(\mathbf{y}\\)
- Matrices: non-bold non-italic uppercase, e.g., \\(\mathrm{X}\\), \\(\mathrm{W}\\)
- Scalars: non-bold italic, e.g., \\(x\\), \\(\theta\\), \\(\eta\\)
- Sets: blackboard bold, e.g., \\(\mathbb{R}\\), \\(\mathbb{N}\\)

**UTF-8 encoding** is preferred. In LaTeX, use \texttt{\\usepackage[utf8]{inputenc}} or simply rely on modern LaTeX engines (\texttt{xelatex}, \texttt{lualatex}) which accept UTF-8 natively.

Use the notation consistently throughout the document. The \texttt{templates/paper-section-template.tex} template follows these conventions.

### Figure standards

```python
import matplotlib.pyplot as plt
# Use science plots style for publication quality
# pip install SciencePlots
plt.style.use(['science', 'ieee'])

# Or seaborn with colorblind palette
import seaborn as sns
sns.set_palette("colorblind")
sns.set_context("paper", font_scale=1.0)
```

- **Font sizes**: 8-10pt for figures (paper), 12-14pt for presentations
- **Resolution**: 300 DPI (paper), 150 DPI (screen), 600 DPI (if required by venue)
- **Format**: PDF (vector) for most figures; PNG/TIFF for photographs
- **Color**: use colorblind-friendly palettes (e.g., seaborn "colorblind")
- **Layout**: keep figures legible when printed at single-column width (~8-9 cm)

```python
fig, ax = plt.subplots(1, 1, figsize=(3.5, 2.5))  # single column
plt.savefig('results/figures/result.pdf', bbox_inches='tight', dpi=300)
```

### Table formatting

Export tables as LaTeX:

```python
df.to_latex(
    'results/tables/results.tex',
    float_format="%.3f",
    caption="Quantitative comparison on Dataset X.",
    label="tab:results",
    position="htbp"
)
```

### Paper section template

See [templates/paper-section-template.tex](templates/paper-section-template.tex) for a structured section template covering Introduction through Conclusion.

### Writing checklist

- [ ] **Introduction**: problem definition, motivation, contribution statement
- [ ] **Related work**: positioning (how is your work different?)
- [ ] **Method**: problem formulation, proposed approach, pseudocode, complexity
- [ ] **Experiments**: datasets, baselines, hyperparameters, implementation details
- [ ] **Results**: tables + figures + analysis + ablations
- [ ] **Discussion**: limitations, failure cases, future work
- [ ] **References**: all citations complete, BibTeX formatted

---

## Decision Gates

This is the most important section. These gates prevent the agent from making costly assumptions without your input. **Follow them strictly.**

### Anti-overasking rules (MANDATORY)

1. **Max 1 question** per decision boundary in normal cases
2. **Max 5 total questions** before the first experiment runs (scope → approach → fidelity)
3. **Never ask the same question twice** in one session — track it in session state
4. If user says "your call" or is brief: use the documented default AND state the assumption explicitly
5. After attempt 2 on the same boundary: stop asking and proceed with the most reversible default

### Gate 0: Ambiguity catch-all (always active)

**Trigger:** You are about to make any decision that:
- Cannot be trivially undone (< 5 minutes to revert), AND
- Has ≥2 plausible options, AND
- No other gate explicitly covers it

**Action:** Ask one short clarifying question. Keep it to 1 sentence + 2-3 options. Max 1 such question per 30 minutes of active conversation. The timer resets after long-running compute jobs (≥5 minutes of wall time) — a new context may have emerged.

**Context tracking for this gate:** Maintain a lightweight log of the last Gate 0 question asked and when. If the user has been waiting for a compute job to finish, treat the post-job conversation as a fresh context for this gate.

---

### Gate 1: Survey scope (ask once per topic)

**Trigger:** Starting a literature survey on a new topic.

**Ask:**

> "For this survey, should I focus on:
>   A) Broad overview — learn the full landscape
>   B) Narrow SOTA comparison — find the best existing method
>   C) Gap hunting — identify open problems and limitations
>   D) Implementation search — find code to build on"

**Default if unclear:** A (Broad overview — most reversible, builds foundation).

**Do NOT re-ask** for the same topic unless the user explicitly pivots.

---

### Gate 2: Approach direction (high-stakes, MUST ask)

**Trigger:** Starting algorithm development when ≥2 plausible approach families exist.

**Ask:**

> "Which approach direction should we take?
>   A) Classical/analytical — optimization-based, convex, closed-form
>   B) Learning-based — train a neural network, deep learning
>   C) Hybrid — learned components + classical pipeline
>   D) Something else: [freeform]"

**Context to include:** For each option, briefly note:
- Rough time estimate
- Data requirements (lots of data? no data needed?)
- Compute requirements (GPU? CPU only?)
- Publication novelty potential

**Do NOT skip this gate.** This is the highest-leverage decision in research.

If the user defers: recommend A if data is scarce or reliability is critical; recommend B if data is abundant and accuracy is the goal. State your assumption.

---

### Gate 3: Implementation tooling (conditional — ask only when ambiguous)

**Trigger:** Before writing implementation code.

**Default stack** (use these unless condition below triggers):

| Task type | Default |
|-----------|---------|
| Neural network training | PyTorch |
| Image processing pipeline | OpenCV + scikit-image |
| Tabular ML | numpy + scipy + sklearn |
| Optimization problem | cvxpy / scipy.optimize |
| GPU-accelerated maths | JAX |
| Symbolic maths | sympy |

**Ask only when:**
1. The user previously stated a preference for a different library (check session state)
2. The default is provably unsuitable (e.g., need distributed training across 8 GPUs — ask if they want PyTorch DDP or JAX pmap)
3. The user explicitly says "pick the best tool" — show options with pros/cons

**Otherwise, just use the default and proceed.**

---

### Gate 4: Fidelity vs speed (ask at each prototype milestone)

**Trigger:** When transitioning from exploration to running experiments.

**Ask:**

> "What fidelity do we need for this round?
>   A) Quick & dirty — 1 seed, minimal metrics, just see if it works (~minutes)
>   B) Solid — 3-5 seeds, full metrics, ablations, logging (~hours)
>   C) Publication-ready — 5+ seeds, statistical tests, all baselines (~days)"

**Default:** B (Solid).

**Context:** Mention the estimated time difference. If the user is clearly exploring, default to A. If they mention "paper" or "submission", default to C.

---

### Gate 5: Comparison baselines (ask once per project)

**Trigger:** Setting up the experiment configuration, before running comparisons.

**Ask:**

> "Which baselines should we compare against?
>   A) SOTA from latest papers (may require reimplementation)
>   B) Simple standard baselines (k-NN, linear model, vanilla CNN)
>   C) The method we're extending (ablate their approach)
>   D) All of the above"

**Default if deferred:** B + C (simple baselines + the method you're extending).

**Do NOT re-ask** for the same project unless results change the comparison needs.

---

### Gate 6: Results → next step (MUST ask every time)

**Trigger:** After an experiment completes and results are available.

**Action:**
1. Present a structured summary (see template below)
2. Ask what to do next

> "Results summary (mean ± std over N seeds):
>   ┌──────────────────┬────────────┐
>   │ Method           │ Metric     │
>   ├──────────────────┼────────────┤
>   │ Our method       │ 0.912±0.08│
>   │ Baseline         │ 0.887±0.011│
>   │ Improvement      │ +2.5% (p…)│
>   └──────────────────┴────────────┘
>
> What next?
>   A) Ablation study — which component drives the gain?
>   B) Hyperparameter sweep — can we push further?
>   C) Harder dataset — does it generalize?
>   D) Write up results — ready to report
>   E) Pivot — try a different approach"

**Default:** Ask every time. This is where human judgment adds the most value.

---

### Gate 7: Data ethics & provenance (ask once per dataset)

**Trigger:** Before using a new dataset for training, evaluation, or fine-tuning. Also trigger when the domain involves cultural heritage, historical artifacts, or potentially sensitive/restricted data.

**Checklist (run silently first, ask only if a flag is raised):**

- [ ] **License**: Is the dataset license known? (e.g., MIT, CC-BY, CC-BY-NC, custom, unknown)
- [ ] **Commercial use**: Does the license permit the intended use (academic vs commercial)?
- [ ] **Attribution**: Is proper attribution required and planned?
- [ ] **Cultural sensitivity**: Does the data involve cultural heritage, sacred symbols, or historically oppressed groups?
- [ ] **Consent**: Was the data collected with appropriate consent (if human subjects)?
- [ ] **Bias scan**: Could the dataset contain systematic biases (e.g., geographic, temporal, gender, class)?

**Ask only when ≥2 checks are unclear or problematic:**

> "I found some data ethics considerations for [dataset name]:
>   - License: [status]
>   - Cultural sensitivity: [status]
>   - Other flags: [summary]
>
> Should I:
>   A) Proceed — flags are minor, document them in the experiment report
>   B) Find an alternative dataset — these issues are blocking
>   C) Contact dataset authors to clarify [specific issue] before proceeding"

**Default if unclear:** A (Proceed with documentation). The assumption is that public research datasets have been vetted, but the agent MUST log any flags raised.

**Do NOT skip this gate for cultural heritage datasets** (e.g., historical manuscripts, archaeological data, indigenous artifacts). Always run the checklist silently and report non-trivial findings.

---

### When the user cancels or is unclear

1. **First time:** Try one narrower follow-up (attempt 2).
2. **Second time / "your call":** Proceed with the documented default. State the assumption explicitly:
   > *"Proceeding with option B (Solid fidelity). If this doesn't match what you need, the main cost is ~2 hours of compute — we can adjust next round."*
3. **If the boundary is high-stakes (Gate 2):** Stop and remain blocked until a clear decision. Do not proceed with assumptions on approach direction.

---

## Session State Tracking

The agent MUST track answered questions in a lightweight session state to avoid re-asking:

```yaml
# Mental session state (reconstructed from conversation)
session-state:
  topic: "image denoising with diffusion models"
  gate-1-survey-scope: "narrow SOTA"       # answered
  gate-2-approach: "learning-based"         # answered
  gate-3-tooling: "PyTorch (default)"       # default, not asked
  gate-4-fidelity: null                     # not yet at this gate
  gate-5-baselines: null                    # not yet at this gate
  gate-6-next-step: null                    # not yet asked
  gate-7-data-ethics: null                  # not yet checked for current dataset
  tooling-preferences:                      # user-stated preferences
    - "prefers JAX for GPU-heavy experiments"
  notes:
    - "User is most interested in conditional generation, not unconditional"
```

Re-read this state before asking any gate question. If the gate is already answered or defaulted, **do not ask again**.

---

## Self-Critique

Before executing any gate decision (after the user answers), pause and ask:

1. **Did I present the options fairly?** Or did my wording bias toward one option?
2. **Is there an option I didn't think of** that might be better?
3. **Am I about to implement something the user didn't explicitly agree to?** Check they didn't just say "ok" to a poorly framed question.
4. **Did I gather enough context before asking?** Did I read the relevant files, papers, or code first?
5. **Is this actually a gate-worthy decision?** Or am I over-asking?

If any answer is "yes" or "maybe" to 1-4, ask one more clarifying question (one attempt only). If "yes" to 5, skip the gate and proceed.

---

## Quick Reference Card

```yaml
## Decision Gate Reference

Gate 0: Ambiguity catch-all     →  Brief question, resets after compute jobs
Gate 1: Survey scope            →  Once per topic, default: broad
Gate 2: Approach direction      →  ALWAYS ask, high stakes
Gate 3: Tooling                 →  Default stack, ask if ambiguous
Gate 4: Fidelity                →  Each milestone, default: solid
Gate 5: Baselines               →  Once per project, default: simple+ablation
Gate 6: Next step               →  After every result, ALWAYS ask
Gate 7: Data ethics & provenance→  Once per dataset, silently check first

Max questions before first experiment: 5
Max 1 question per decision boundary (2 if first is unclear)
After 2 attempts: stop asking, use default, state assumption
```
