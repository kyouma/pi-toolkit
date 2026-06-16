---
name: literature-survey
description: >
  Systematic literature survey for any research field — multi-source academic
  search (arXiv, OpenAlex, Crossref, web), paper fetching and deep reading with
  structured critical appraisal, problem isomorphism analysis for adjacent-field
  discovery, dataset and metrics evaluation criteria, incremental monitoring with
  research-log.yaml, and PRISMA-style survey synthesis. Use for surveying a topic,
  finding related work, reading papers, or understanding the state of the art.
metadata:
  domains: ["general-research", "applied-maths", "image-processing", "ml", "deep-learning"]
  version: "2.0.0"
---

# Literature Survey Skill

Systematic literature survey with multi-source search, deep paper reading
with critical appraisal, adjacent-field discovery via problem isomorphism analysis,
dataset and metrics evaluation, and incremental monitoring via research-log.yaml.

---

## Table of Contents

1. [Notation Conventions](#notation-conventions)
2. [Trigger](#trigger)
3. [Search Strategy](#search-strategy)
4. [Domain-Specific Query Templates](#domain-specific-query-templates)
5. [Paper Reading Protocol](#paper-reading-protocol)
6. [Survey Output](#survey-output)
7. [Survey Completeness Checklist](#survey-completeness-checklist)
8. [Dataset and Metrics Evaluation](#dataset-and-metrics-evaluation)
9. [Incremental Literature Monitoring](#incremental-literature-monitoring)

---

## Notation Conventions

When discussing or deriving algorithms, use this consistent notation. When rendering in \(\LaTeX\), the formatting follows these rules:

**Notation rules:**
- Vectors: **bold non-italic lowercase** (e.g., \(\mathbf{x}\), \(\mathbf{y}\))
- Matrices: **non-bold non-italic uppercase** (e.g., \(\mathrm{X}\), \(\mathrm{W}\))
- Scalars: **non-bold italic** (e.g., \(x\), \(y\), \(\theta\), \(\eta\))
- Sets and spaces: **blackboard bold** (e.g., \(\mathbb{R}\), \(\mathbb{N}\))
- UTF-8 encoding is preferred where the environment supports it.

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

## Trigger

Use this workflow when the user asks to survey a topic, find related work, read papers, or understand the state of the art.

## Search strategy

```
Step 1 — Multi-source search (MANDATORY)
  Search across multiple sources. Do NOT rely on a single source.

  Source A — arXiv & Google Scholar (via websearch)
    Query: "<topic>" + "<year_window>"
    Year window: use the most recent 3-5 years (adjust for your field's pace)
    Example: "generative models" + "molecular dynamics" + "2023 2024 2025"
    Tip: If the websearch tool supports site-restricted queries, add
    "site:arxiv.org OR site:scholar.google.com" to focus on academic sources.

    arXiv query syntax: use AND/OR/ANDNOT + parentheses for precision.
    Example: '(transformer OR attention) AND (efficiency OR sparse)'
    Field prefixes: ti: (title), au: (author), abs: (abstract), all: (all fields).
    Wildcard * supported. AND is implicit between bare terms.

  Source B — General web search
    Query: "<topic>" + "<method>" + "<year_window>"
    Purpose: find blog posts, implementation tutorials, dataset announcements,
    and conference talks that may not appear in academic databases.
    Also useful for finding non-English resources (see language note below).

  Source C — Academic databases and non-archival sources (if accessible)
    Academic databases:
    - Google Scholar (general academic search)
    - Semantic Scholar (AI-focused, includes citations/graphs)
    - PapersWithCode (papers + implementations + benchmarks)
    - DBLP, ACM DL, IEEE Xplore (CS/engineering)
    - PubMed, bioRxiv (life sciences)

    OpenAlex supports field filters appended to the query:
    .year:2023-2026  .cited_by:>50  .type:article  .is_paratext:false
    The query text itself is a simple full-text search (no Boolean operators).

    Non-archival sources (conference proceedings, books, theses, technical reports):
    - Conference proceedings: search for specific conference names + year
      (e.g., "ICLR 2025" + "<topic>" — many papers appear at conferences
      months before they hit arXiv)
    - Books and monographs: Google Books, institutional library catalogues
    - Theses and dissertations: ProQuest, institutional repositories
    - Technical reports: institutional repositories, research group pages
    - Tutorials and lecture notes: relevant for understanding field fundamentals
      (not just SOTA)

  Source D — Language-diverse search (if topic is non-English)
    If the topic is strongly associated with a non-English-speaking research
    community (e.g., Chinese historical documents, Japanese materials science,
    German engineering), retry queries with translated keywords in that language.
    Use the same query structure but with localized terms.
    Example: "甲骨文" + "深度学习" + "2025" for Chinese oracle bone research.

  Look for: survey papers first (they give the fastest landscape coverage),
  then recent SOTA papers.

  **Document your search process** for inclusion in the final report:
  Record which sources you searched, which queries, date ranges, and how many
  results each step returned. See [templates/prisma-guidelines.md](templates/prisma-guidelines.md)
  for a PRISMA-style flow template to include in your survey.

Step 2 — Survey-of-surveys check (MANDATORY)
  Before reading individual papers, check whether a survey already exists:
    Query: "survey" + "<topic>" + "<year_window>"
    If a survey exists (even 1-2 years old): read it first for landscape coverage,
    dataset catalogue, and open challenges. Use its references as your
    paper seed list rather than starting from scratch.

Step 3 — Problem isomorphism analysis (MANDATORY)
  Before searching adjacent fields, explicitly map your problem's structure:

  Problem structure map:
    Data type:           <e.g., sequential, graph, grid, point cloud, manifold>
    Task type:           <e.g., classification, generation, retrieval, regression>
    Learning paradigm:   <e.g., supervised, self-supervised, contrastive, generative>
    Temporal dimension:  <yes/no — if yes, discrete or continuous?>
    Key constraint:      <e.g., label scarcity, long-tail, domain gap, missing data>
    Evaluation metric:   <e.g., R@K, F1, IoU, perceptual similarity, accuracy>

  Then find fields with the same (or very similar) map — even if the surface domain is different:
    - Same data type + same task type = HIGH transfer potential
    - Different data type + same task type = MEDIUM (need to adapt representation)
    - Same data type + different task type = MEDIUM (need to adapt objective)
    - Different data + different task = LOW (unlikely to transfer)

Step 4 — Adjacent-field search: two passes (MANDATORY)

  The key insight is that you need TWO passes: a broad pass to find candidate methods
  in any field, then a narrow pass to verify transfer novelty to your domain.

  Pass 1 (broad) — find candidate methods by problem structure:
    Use the problem structure map from Step 3. Search for methods that solve the
    SAME mathematical structure, even in completely different domains.

    Query templates (choose relevant ones):
      - "<data_type>" + "<task_type>" + "<method_family>"
        (e.g., "sequential data" + "generation" + "neural ODE")
      - "<task_type>" + "<key_constraint>" + "<year_window>"
        (e.g., "style transfer" + "few-shot" + "diffusion")
      - "<domain_A_method>" + "<domain_B>"
        (e.g., "Neural ODE" + "protein dynamics" — same math, different domain)
      - "representation learning" + "<problem_structure>"
        (e.g., "representation learning" + "continuous time series")

    Noise management for broad searches:
      Broad searches (e.g., "paleography imaging") will return results from many
      unrelated writing systems (Egyptian, Mayan, cuneiform, Linear B). This is
      EXPECTED and USEFUL — some of those may have transferable techniques.
      To handle this without being overwhelmed:
        a) First skim titles/abstracts and bucket into: {same structure, similar problem, unrelated}
        b) Within "same structure" bucket: read for transferable method
        c) Within "similar problem" bucket: note as potential but don't deep-read yet
        d) Reject "unrelated" quickly
      The cost of one extra skim is far lower than the cost of missing a transferable method.

    For each candidate method found, assess:
      - Does it exploit the SAME mathematical structure as your problem?
      - What assumptions does it make about data (size, dimensionality, noise, missingness)?
      - Would those assumptions hold in your domain? If not, can they be relaxed?
      - Has the method been stress-tested on failure modes analogous to yours?

  Pass 2 (verification) — check if it has been applied to your domain:
    For each promising candidate method from Pass 1, search for its intersection
    with YOUR specific domain:
      Query: "<your_domain_specific_term>" + "<candidate_method>"
        (e.g., "oracle bone" + "neural ODE")
        (e.g., "Chinese characters" + "diffusion model" + "style transfer")

    This tells you whether the transfer is:
      - Novel (no results): the method hasn't been tried on your problem → potential contribution
      - Already explored (results exist): read those papers to see what was done and what gap remains
      - Partial (results in adjacent sub-field): read to understand the gap

    Without this verification pass, you won't know which transfers are novel contributions
    and which have already been attempted. Both outcomes are valuable, but you need to
    know which is which.

Step 5 — Deep search (if API keys available)
  - Semantic Scholar API: get citations, references, influential citations
  - PapersWithCode: find implementations, benchmark results
  - GitHub: search for code repositories

Step 6 — Citation chaining
  Pick the most relevant paper → read its references + citing papers.
```

## Domain-specific query templates

When surveying a topic, use these targeted query templates to ensure coverage beyond the initial broad search:

| Coverage gap | Template query | Generic example |
|---|---|---|
| Data augmentation | `"data augmentation" + "<domain>" + "<year_window>"` | `"data augmentation" + "medical imaging" + "2023 2024 2025"` |
| Representation taxonomy | `"<rep_type> representation" + "<domain>"` | `"graph representation" + "molecular generation"` |
| Adjacent generation | `"<domain> generation" + "<method>"` | `"molecular generation" + "diffusion"` |
| Survey papers | `"survey" + "<domain>"` | `"survey" + "graph neural networks"` |
| Code repositories | `"<domain>" + "GitHub" + "<framework>"` | `"medical imaging" + "GitHub" + "pytorch"` |
| Language-diverse | Translated keyword + `"<domain>"` | `"甲骨文" + "deep learning"` (Chinese oracle bone) |

**Note on years:** Replace `<year_window>` with the 3-5 most recent complete years.
For example, if the current year is 2026, use `"2023 2024 2025 2026"`.
Adjust the window width to match your field's publication pace (faster fields = narrower window).

## Paper reading protocol

```
Triage (30s):
  - Read title, abstract, figures, and conclusion
  - Score relevance: {high, medium, low}
  - Decide read depth

Deep read:
  1. Problem formulation (extract math)
  2. Method: architecture / algorithm / loss / training
  3. Assumptions and limitations (critically important)
  4. Baselines they compare against
  5. Datasets and evaluation metrics
  6. Key results and ablations
  7. Open challenges / future work they mention
  8. **Critical appraisal** — actively challenge the paper:
     - Are the reported metrics comparable to baselines on the same held-out test set?
     - Could the claimed improvement be explained by confounders (more parameters, more training data, different hyperparameter tuning budget)?
     - Is the method reproducible from the description alone? (missing details?)
     - What failure modes or edge cases does the paper NOT discuss?
     - How sensitive are the results to the specific choice of hyperparameters / random seed?
     - If the paper proposes a time/sequence model: is interpolation vs extrapolation clearly distinguished?

Extract to notes:
  - Save to <project-name>/notes/survey-<date>.md using the survey notes template
  - Include: BibTeX citation, arxiv link, code link
  - Structure: Problem → Method → Results → Open Questions → Critical Appraisal
  - The critical appraisal section MUST be filled for every paper read at high/medium relevance
```

## Survey output

**After completing deep reads of all selected papers:**

1. Open [templates/survey-notes-template.md](templates/survey-notes-template.md)
2. Fill one Paper section per paper read (copy the block)
3. Fill the cross-cutting themes table
4. Fill the contradictions & debates table
5. Fill the open research gaps and baseline methods sections
6. Save the completed file to `<project-name>/notes/survey-<date>.md`
7. Report back with: number of papers surveyed, top-3 most relevant works, and the single largest gap you identified

## Survey completeness checklist

Before presenting the survey as complete, run through this checklist and flag any unchecked items:

- [ ] **Domain background** — If the topic is niche or interdisciplinary, did I include a brief background section explaining core phenomena, data characteristics, known challenges, and relevant terminology so a reader outside the field can follow? (If the field is well-known, one paragraph suffices.)
- [ ] **Representation taxonomy** — Did I cover all representation types relevant to this domain? Create a mapping table of methods × representation types (e.g., image, graph, vector, sequence, multi-modal)
- [ ] **Data augmentation** — Is there a section covering augmentation methods specific to this domain? (GAN-based, diffusion-based, traditional, cross-modal)
- [ ] **Adjacent fields** — Did I search for methods in adjacent domains that solve the same technical problem? (identify 2-3 concrete adjacent fields relevant to your topic)
- [ ] **Cross-domain transfer** — Did I explicitly map my problem's structure (data type, task type, constraints) and identify fields with matching structure? Did I assess whether promising methods from those fields transfer to my domain?
- [ ] **Survey papers** — Did I check whether existing surveys cover this topic? If so, cite them and use their reference lists.
- [ ] **Datasets: availability & search** — Did I systematically search for all available datasets in this domain? Did I check what exists beyond the initial seed set?
- [ ] **Datasets: task-suitability evaluation** — For each dataset, did I evaluate: size, class balance, annotation quality, relevance to my task, whether it's a community standard, and its specific limitations?
- [ ] **Metrics: appropriateness** — Did I identify which metrics are standard in this community, and did I justify why each metric is (or isn't) appropriate for my specific task?
- [ ] **Quantitative comparison** — Did I create a table comparing methods head-to-head on shared benchmarks/metrics?
- [ ] **Compute/cost analysis** — Did I note GPU hours, VRAM, model sizes, or other resource requirements for the key methods?
- [ ] **Failure cases** — Did I identify what types of inputs or conditions each method struggles with?
- [ ] **Contradictions & debates** — Did I identify where papers disagree on claims, methods, or interpretations? Did I create the evidence-for/against table?
- [ ] **Code availability** — Did I verify that linked repositories actually exist (not 404)?

If any checkbox is unchecked, address it before presenting the survey. If the gap is unavoidable (e.g., no published method exists for a category), state that explicitly.

**Do NOT skip the cross-cutting themes and contradictions tables.** These are where the survey goes from paper-by-paper notes to genuine synthesis.

## Dataset and metrics evaluation

A survey is incomplete without critically evaluating the datasets and metrics themselves, beyond just listing them.

### Benchmark vs dataset: an important distinction

Not all datasets are benchmarks. A **benchmark** is a dataset that the community has collectively adopted as a standard evaluation platform. This usually means:
- Fixed train/validation/test splits (so results are directly comparable)
- A well-known evaluation protocol (which metrics, which preprocessing)
- A leaderboard or widely-reported baseline numbers
- High community trust (annotations are vetted, the data is stable)

A plain **dataset** may be valuable (large, novel, well-annotated) but hasn't reached benchmark status. Using it makes your results harder to compare against prior work. Using a benchmark but *changing* the splits or preprocessing breaks comparability.

**When surveying, identify both:**
- *Benchmark datasets*: these are where you should run your main comparison
- *New/niche datasets*: these may be better suited to your specific task, but you'll need to justify why you didn't use the standard benchmark

### Dataset evaluation criteria

For each dataset you encounter (or discover), assess every criterion. Then synthesise into a pro/con summary.

| Criterion | What to look for | Why it matters |
|-----------|-----------------|----------------|
| **Availability** | Is it public? Under what license? Does the URL still resolve? | This covers whether you can actually download it. |
| **Size & balance** | Number of samples, classes, class distribution (long-tail?). | A dataset with 10K samples in 1K classes (~10/class) is very different from 100K/10 (~10K/class). |
| **Annotation quality** | Expert-verified? Inter-annotator agreement? Semi-automated pipeline? | Impacts the ceiling on what any method can achieve. |
| **Task relevance** | Does it cover the right classes, periods, modalities for your problem? | A perfect dataset for the wrong task is useless. |
| **Benchmark status** | Is this THE dataset everyone reports on? Does it have fixed splits and a leaderboard? | Using it makes your results directly comparable. Not using it requires justification. |
| **Novelty** | Is it new? Does it offer something existing datasets don't (finer granularity, more classes, a different modality)? | New datasets can enable new research directions, but lack community baselines. |
| **Known limitations** | What are its specific weaknesses? (class imbalance, annotation noise, domain gap, missing periods, small size for certain classes) | Every dataset has blind spots. A method that excels on one dataset may fail on another because of these limitations. |

**Per-dataset pro/con synthesis:** After filling the table, produce a compact summary for each dataset:

```
Dataset X:
  Pros:  large (+), expert annotations (+), 6 historical periods (+)
  Cons:  severe long-tail (100 classes have <5 samples) (-), only rubbing images (-),
         no standard train/test split defined (-)
  Verdict: suitable as training data but NOT a benchmark; use EVOBC for main comparison
```

**Standard workflow:**
1. Search for datasets explicitly: `"<domain>" + "dataset" + "<year_window>"` and `"<domain>" + "benchmark" + "<year_window>"`
2. Separate what you find into two lists: **benchmarks** and **other datasets**
3. For each, fill the evaluation table and produce a pro/con summary
4. Identify: which benchmark(s) will you use for main comparison? which new/niche datasets best match your task?
5. If no suitable public dataset exists, note this as an open gap — creating one may be a contribution in itself

### Metrics evaluation criteria

For each metric used in the papers you read, assess, then produce a pro/con summary:

| Criterion | What to look for |
|-----------|-----------------|
| **Appropriateness** | Does this metric actually measure what I care about? (e.g., Top-1 accuracy on a long-tail dataset hides poor tail performance — macro accuracy or mAP would be better.) |
| **Standard usage / benchmark status** | Is this what the community reports on the standard benchmarks? Using a non-standard metric on a benchmark dataset makes your results incomparable. |
| **Known failure modes** | What pathologies does this metric have? (e.g., FID is sensitive to sample size; SSIM doesn't capture texture statistics; Bleu favours lexical overlap over meaning.) |
| **Interpretability** | Can I explain what a score of X means to someone outside the field? |
| **Task-specific gap** | Is there an important quality dimension that no existing metric captures? (If yes, this is a research gap worth highlighting.) |

**Per-metric pro/con synthesis:**

```
Metric X (e.g., Top-1 accuracy):
  Pros:  standard in the community (+), easy to interpret (+)
  Cons:  misleading on long-tail data (-), doesn't capture retrieval quality (-)
  Verdict: report it for comparability, but also report macro accuracy and R@1
```

**Standard workflow:**
1. For each benchmark dataset, identify the metric(s) the community uses
2. Evaluate each metric's appropriateness for YOUR specific task (not just what everyone else does)
3. Report the standard metric(s) for comparability, plus any additional metric(s) that better capture your task's goal
4. If you identify a gap (no existing metric captures what you need), state it explicitly

---

## Incremental Literature Monitoring

### Trigger
Use this when:
- You completed an initial survey and now want to check if new relevant papers have appeared
- The user says "check for updates on this topic" or "any new papers since my last survey?"
- A configurable period (default: 14 days) has elapsed since the last check on an actively monitored topic

This sub-workflow avoids re-surveying the entire landscape from scratch. Instead, it re-runs the original search queries with a date cut-off, filters out already-seen papers, and presents only the delta.

---

### Research Log File

Every survey creates (or appends to) a research log file at:

```
<project-name>/notes/research-log.yaml
```

This file is the single source of truth for what has been checked, when, and what was found. It is updated automatically at each monitoring pass.

**Structure of `research-log.yaml`:**

```yaml
# Auto-generated research log
# Do not edit manually — updated by the agent on each monitoring pass.

project: "<project-name>"
search_queries:
  # The exact queries from the initial survey, so they can be re-executed
  # with a date filter on subsequent passes.
  - source: "arxiv"
    query: '"<topic>" + "<method>" + "2023 2024 2025"'
  - source: "web"
    query: '"<topic>" + "<method>"'
  - source: "survey"
    query: '"survey" + "<topic>"'
  - source: "adjacent-field-broad"
    query: '"<data_type>" + "<task_type>" + "<method_family>"'
  - source: "adjacent-field-verify"
    query: '"<domain_term>" + "<candidate_method>"'

checks:
  - date: "2026-01-15"            # Date of initial survey
    type: "initial"
    papers_found: 18               # Total papers read in the full survey
    papers_new: 18                 # (all were new on first pass)
    date_lower_bound: null         # No lower bound on the initial pass
    notes: "Full survey completed."

  - date: "2026-02-01"            # Date of first incremental check
    type: "incremental"
    papers_found: 23               # Results returned by re-queries
    papers_new: 3                  # After deduplication against seen set
    date_lower_bound: "2026-01-01" # Searches filtered to ≥ this date
    notes: "3 new papers found. 2 are direct follow-ups to previously read papers; 1 is a new survey."

seen_papers:
  # Consolidated list of all papers ever encountered on this project,
  # so that deduplication can be done without re-reading old notes.
  # Keyed by arXiv ID where available, otherwise by (first_author + year + short_title).
  2301.12345:
    title: "Diffusion Models Beat GANs on Image Synthesis"
    first_seen: "2026-01-15"
    last_seen: "2026-02-01"
    relevance: "high"
  2304.56789:
    title: "Scaling Diffusion Models for High-Resolution Images"
    first_seen: "2026-01-15"
    last_seen: "2026-01-15"
    relevance: "medium"
```

The `seen_papers` section grows monotonically — papers are never removed, only added. The `checks` list grows by one row each time a monitoring pass runs.

---

### Initial Survey — Logging the Baseline

When you complete a full survey (see [Survey output](#survey-output)), you MUST also create or update the research log by running the following steps silently:

1. **Record the survey date**: use the current date in `YYYY-MM-DD` format
2. **Capture search queries**: copy the exact queries used in Steps 1–4 of the search strategy into `search_queries`
3. **Record all papers read**: add each paper to `seen_papers` with its arXiv ID (or a synthetic key if none), title, and relevance score from your triage
4. **Set the initial `date_lower_bound` to `null`**: the first pass has no lower bound
5. **Save the log** to `<project-name>/notes/research-log.yaml`

If the user did not ask for ongoing monitoring, you may skip creating the log file. However, if the topic is likely to produce new results within months, mention that a research log can be created on request.

---

### Incremental Check Workflow

**Step 1 — Load the research log**

Read `<project-name>/notes/research-log.yaml`. If it does not exist, revert to a full survey (the incremental workflow cannot run without a baseline).

**Step 2 — Determine the date lower bound**

```
date_lower_bound = last_check_date - overlap_days
# Default overlap_days = 14 — catches preprints with late arXiv dates
# Set overlap_days = 0 for strict deduplication (only papers strictly after last check)
```

The overlap buffer (default: 14 days) handles the common case where a paper was submitted to arXiv a few days before your last check but only appeared in search results after. If the user wants zero duplicates at the cost of possibly missing some papers, set overlap to 0.

The overlap value is stored in the research log:

```yaml
overlap_days: 14  # configurable per project
```

**Step 3 — Re-execute searches with date filters**

For each query in `search_queries`, re-run it with the date lower bound appended:

```
Original:    '"diffusion models" + "medical imaging" + "2023 2024 2025"'
Filtered:    '"diffusion models" + "medical imaging" + "2026"'
             (only papers from >= date_lower_bound year)
```

Date filtering strategy by source:

| Source | Filtering method |
|--------|-----------------|
| arXiv / Google Scholar | Add year range: `"<start_year>"` or `"<start_year> <end_year>"` to the query string |
| Web search | Add `after:<YYYY-MM-DD>` or `"since <date>"` to the query |
| Semantic Scholar API | Use `year=start_year-end_year` parameter |
| Citation chaining | Re-check citations of the most relevant previously read paper — new citing papers may have appeared |

If the query language does not support fine-grained date filters (some search engines only support year-level filtering), use the coarsest available filter and accept more false positives — the deduplication step handles them.

**Step 4 — Triage and deduplicate**

For each result returned:

1. Check if it already exists in `seen_papers` (by arXiv ID, DOI, or title similarity)
2. If already seen → **skip** (update `last_seen` timestamp if you want to track re-discovery, but this is optional)
3. If new → triage at 30-second skim (title + abstract): high / medium / low relevance
4. If high or medium relevance → add to `seen_papers` and read per the [Paper Reading Protocol](#paper-reading-protocol)
5. If low relevance → add to `seen_papers` with `relevance: "low"` but do not deep-read

**Deduplication matching priority:**
1. arXiv ID (e.g., `2301.12345`) — exact match
2. DOI — exact match
3. Title similarity (case-insensitive, strip punctuation, Levenshtein ratio > 0.85) — approximate match
4. (first_author surname + year) — weak match, flag for manual check

**Step 5 — Update the research log**

Append a new entry to the `checks` list and add new papers to `seen_papers`.

**Step 6 — Present the delta to the user**

Structure the response as follows:

```
## Literature Update: <topic>

**Last checked:** 2026-01-15
**This check:**   2026-02-01
**Date lower bound:** 2026-01-18 (14-day overlap)
**Total results returned:** 23
**New papers found:** 3

### New High-Relevance Papers

1. **<Title>** — <Authors> (arXiv: <id>, <date>)
   - *Summary:* one-sentence description of what they did
   - *Why it matters:* connects to your specific problem / fills a gap you identified
   - *Action:* recommend deep-reading this paper

2. ...

### New Medium-Relevance Papers

- <Title> — brief note on why it's relevant but not critical
- ...

### Previously Seen (skipped)

20 papers were already in the research log and were skipped.

### Recommendation

- [ ] Deep-read the 2 high-relevance papers (estimated: 30 min each)
- [ ] Skim the medium-relevance papers (estimated: 5 min each)
- [ ] No action needed — nothing relevant this period
```

If zero new papers are found, say so explicitly. Do not fabricate relevance.

---

### User-Initiated vs Automatic Checks

| Trigger | Behaviour |
|---------|-----------|
| User explicitly asks (e.g., "any new papers on X?") | Run the incremental check immediately. Present results. |
| User says "monitor this topic" during initial survey | Log the baseline. Ask: "How often should I check? (default: every 14 days)" Store the interval in `research-log.yaml`. |
| Sufficient time has elapsed (≥ interval) and agent is about to do work on the topic | Mention: "It's been 18 days since the last literature check on this topic. Should I check for new papers before we proceed?" |

**Frequency guideline:**

| Field pace | Recommended interval |
|------------|---------------------|
| Fast-moving (generative AI, LLMs, diffusion) | 7–14 days |
| Moderate (medical imaging, computer vision) | 14–30 days |
| Slow-moving (applied maths, theoretical CS) | 30–90 days |

Default interval: **14 days**. Store the interval in the research log so the agent can proactively suggest checks.

---

### Handling Multiple Projects

If the user is tracking multiple projects, maintain one `research-log.yaml` per project:

```
denoising-diffusion/
└── notes/
    └── research-log.yaml
neural-odes/
└── notes/
    └── research-log.yaml
oracle-bone/
└── notes/
    └── research-log.yaml
```

Each log is independent. When the user says "check everything", run incremental checks on all projects that have a research log and whose interval has elapsed. Present results grouped by project.

---

### Edge Cases

| Situation | Handling |
|-----------|----------|
| No `research-log.yaml` exists | Revert to full survey. Offer to create a research log after the survey. |
| User wants to change the search queries mid-monitoring | Update `search_queries` in `research-log.yaml`. The next incremental check will use the new queries with the same `date_lower_bound`. Re-running old queries is unnecessary — the new queries will capture the relevant space going forward. |
| A paper was previously marked low relevance but now seems important | Update its `relevance` field in `seen_papers`. This does not trigger re-reading — the user must explicitly ask. |
| The search engine does not support date filtering | Accept the unfiltered results; the deduplication step will filter out all seen papers. The cost is more results to skim, but no papers are missed. |
| The same paper appears from multiple search sources | Deduplicate across sources (do not count it twice). The research log's `seen_papers` handles this. |
| User asks for update on a topic last checked 2 days ago | Run the check if the user explicitly asks. If the check was automatic (interval-based), skip — the interval has not elapsed. |
| A survey exists but predates this skill version (no `research-log.yaml`) | Offer to backfill the log by extracting paper references from the existing survey notes. This requires manual confirmation since automated extraction may be incomplete. |

---

### Monitoring Checklist (MANDATORY — run after every incremental check)

- [ ] Did I load the existing `research-log.yaml`?
- [ ] Did I compute the `date_lower_bound` with the configured overlap?
- [ ] Did I re-execute all queries from `search_queries` (unless the user changed them)?
- [ ] Did I deduplicate against `seen_papers`?
- [ ] Did I update `seen_papers` with any new papers found?
- [ ] Did I append a new entry to `checks` with today's date?
- [ ] Did I highlight how many papers were skipped (already seen) so the user sees the work that was saved?
- [ ] Did I present a clear recommendation (deep-read / skim / no action)?
