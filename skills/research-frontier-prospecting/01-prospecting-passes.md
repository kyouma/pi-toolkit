# 01 — Prospecting passes and the challenge-the-claim protocol

Purpose: stop the agent from producing a *census of what exists* and make it produce
*what is believed, demanded, and breakable*. Run the passes in order; each must contribute
candidates to the catalog (a pass that contributes nothing is reported as "run, no
candidates" — that is an auditable result, not an excuse to skip it).

---

## Tooling and recall (applies to every pass)

- **Use the scholarly tools for Passes 2–3**, not general web search alone:
  `academic_search` (arXiv + OpenAlex + CrossRef in one call) for papers, `code_search`
  for GitHub, then `web_search` for blogs/products/forums/competitions. Web search alone
  under-recalls papers on paper-dense topics.
- **Result depth:** always request the tool MAXIMUM per query (20 results for
  `web_search`; 20 per backend for `academic_search`) — sweeps and falsifier queries
  alike. Never rely on the default 5: five slots fill with keyword matches and fresher
  items and hide the rest of the field.
- **Query by concept, not by title words.** The work that kills a candidate may not carry
  the field's buzzword in its title (e.g. "Decoding Ancient Oracle Bone Script via
  Generative Dictionary Retrieval" contains no "decipherment"). Phrase falsifier queries
  with the concepts the abstract must contain: task + ground-truth form + evaluation form.
- **If a run is budget-capped:** declare "capped-before-saturation" (SKILL.md step 5) and
  promote every unverified novelty claim of top-ranked candidates to a must-check item.

## Pass 1 — Demand-side mining (run FIRST)

Questions here have consumers, deadlines and ready-made data. Sources:

- **shared-task calls and their stated open questions**: NTCIR task descriptions, TREC
  track guidelines, CLEF/ImageCLEF tasks, SemEval, Kaggle/CodaLab, workshop CFPs. A task
  being *created* proves (a) the question is open, (b) somebody wants it answered,
  (c) a deadline and a test collection exist;
- **lab agendas**: the target lab's / supervisor's last 2 years of publications and current
  project pages (for each lab: what tasks do they organise? what do they call "ongoing"?);
- **benchmark "Limitations" sections read as requests**: an organiser advertising a
  weakness (e.g. low inter-annotator agreement) is asking for the measurement paper;
- **industry research blogs and roadmap-adjacent posts**: what practitioners say is
  unsolved (label these [v: vendor blog] — motivation evidence, not peer-reviewed fact);
- **the researcher's own completed work**: stated future work, limitations, ablations that
  came out null.

Query recipe: `<field> shared task 2026/2027 call`, `<lab name> current project task`,
`<benchmark> limitations open problem`, `<field> challenge competition 2026`.

## Pass 2 — Indexed literature (surveys first)

arXiv, DBLP, Semantic Scholar, OpenAlex, Crossref, ACL/EMNLP/NAACL Anthology, ACM DL
(SIGIR/CIKM/WSDM/ECIR/ICTIR), IEEE. Order: **survey/overview → key papers → newest
preprints**. For each candidate parent task, count direct works in the last 2 years and
note the turnover (months vs years). Counts are lower bounds over what was retrieved.

**Non-Western and regional indexes (mandatory when the field has a non-English
literature):** CNKI + Wanfang (Chinese), CiNii + J-STAGE (Japanese), RISS/KCI (Korean),
eLibrary.ru + КиберЛенинка (Russian), SciELO/Redalyc (Spanish/Portuguese), plus
region-specific thesis repositories. Many fields (paleography, local history, medicine,
law) publish primarily there; an English-only sweep cannot support "not found" for them.
Run the searches in the local language as well as English.

## Pass 3 — Non-indexed sources (mandatory, not optional)

Leaderboards and their cards (MTEB, ViDoRe, HELM, LiveBench, …), HuggingFace/GitHub
releases and model cards, Google Patents, competition portals, theses and institutional
repositories, community discussions. For non-Western fields also: national museum/library
portals, local university repositories, specialist databases and dictionaries (e.g. for
Chinese historical scripts: 小学堂-type character databases, hanziyuan.net, zdic), and
local developer/academic forums. Confidence classes: indexed paper / preprint /
patent / product / blog / hearsay — never mixed into one list.

## Pass 4 — Contradiction and instability mining

Methodological research lives where conclusions are unstable. Search explicitly for:

- metrics disagreeing with each other or with humans: `<metric> misleading`,
  `rank flip evaluation`, `agreement overstates`, `reliability without validity`;
- reproducibility failures and protocol confounds: `protocol mismatch`,
  `cannot isolate`, `matched controls`, `reproducibility <venue>`;
- judge/annotation disputes: `inter-annotator agreement low`, `kappa deflation`,
  `judge bias`, `annotation granularity`.

Each instability found is a candidate seed for a *measurement* task definition.

## Pass 5 — Isomorphism transfer

Re-state the question in another field's vocabulary and search there. Ready-made transfers
(use and extend):

| Question in our field | Isomorphic question elsewhere | What to import |
|---|---|---|
| annotation granularity of evidence | graded relevance / unit of judgment in IR evaluation | the whole judgment-granularity vs measure-behaviour debate |
| LLM-judge reliability | psychometrics / inter-rater reliability | generalisability theory: rater × item variance decomposition |
| small-n metric validation | clinical statistics | equivalence tests, minimal detectable effect, power analysis |
| benchmark contamination / leakage | test-theory construct validity | validity-argument structure for a benchmark |
| memory staleness | database view maintenance / belief revision | update-propagation semantics |
| cost of agentic pipelines | decision-theoretic utility / operations research | utility measures with cost budgets |

List 2–3 isomorphic fields per candidate and run one search in each. This pass most often
turns "closed" into "nobody here has read that literature".

## Pass 6 — Own-negative-result mining

For any researcher with prior work, list every non-significant component, discarded
hypothesis and stated limitation; promote each to a candidate question with the
three-reading structure: **invalid signal / redundant with what we have / underpowered**.
Cheap, highest-head-start candidates live here.

## Pass 7 — Perpendicular axes (operationalise the closing strategy note)

In hot fields, accuracy races are lost by construction. Generate candidates on each axis
BEFORE any SOTA-improvement candidate is allowed into the catalog:

1. **measurement** — the metric everyone uses is broken or unvalidated;
2. **benchmark hygiene** — the test set is leaked, saturated, defective or stale;
3. **negative results** — a popular trick does not help (and nobody reports it);
4. **data audits** — claimed vs actual contents, licenses, annotation validity.

Label every candidate with its axis. A catalog with no perpendicular-axis candidates is
incomplete by definition.

---

## Challenge-the-claim protocol (run per candidate)

Write, in this order:

1. **The community's current belief**, one sentence ("automatic metric M is reliable
   enough to rank systems for X").
2. **The strongest evidence for it** (source + confidence class).
3. **What would falsify it or change practice** (a concrete, observable result).
4. **Who already has that evidence** (search) and **who needs it** (consumer).
5. **Verdict**: `settled` / `contested` / `assumed-but-untested`.

Gold category for one-year projects: **assumed-but-untested** — the field acts as if X
holds, nobody checked, and the check is cheap. A `settled` verdict kills the candidate
unless the user's requirement explicitly asks for replication.

## Occupancy discipline (applies to every claim in the report)

- Label each competitor claim **"occupied"** (with ≥1 concrete source + confidence class)
  or **"not found"** (with the list of passes run and what exactly was not found).
- Never write "0 results ⇒ the topic is free". "Not found in the passes run" is the
  strongest allowed statement.
- A competitor is also a funded lab, the dataset's own authors, a patent, a product, a
  competition track or a leaderboard entry.
- For fields with significant non-English literature, "not found" requires the regional-
  index pass (Pass 2) or must explicitly state its absence: "not found in English-language
  indexes only".
- Two readings for key works: (a) what the abstract promises; (b) what the tables and
  limitations show. The discrepancy is a candidate niche.
