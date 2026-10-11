# 04 — Worked example (condensed from a real run) + contrast: a failing output

## The scenario

Request: *"Propose task definitions in automatic evaluation of generative/multimodal
systems for a 1-year project of a master's student who has worked on image–text evaluation
of radiology report generation; must fit a host lab doing IR evaluation methodology; must
be publishable; no domain experts; 1 GPU."* Prior findings existed: one agent report with
15 scored topics concluding "the area seems closed and solved", and a second set of
unconstrained proposals claiming many niches are "completely free".

## What the run produced (shapes, not the whole report)

### (a) Diagnosis — why the previous search said "closed" (excerpt)

> All 15 topics were generated as deltas of observed 2026 papers and then scored against
> that same evidence; the ranking formula weighted 40% toward few-competitors, which
> rejects exactly the topics with shared tasks and test collections; the sweep covered one
> neighbourhood (visual document retrieval) and never touched the host lab's own agenda
> (LLM-judge validity, RAG evaluation, statistical methodology) nor the student's own
> paper's null result. Verdict: search artifact, not a closed field. Evidence: the same
> report's cells say "exact variant: not found in A+B" on the topics it ranks highest.

### (b) Candidate statement (catalog entry)

> **T-07 — Sample-size design for machine-generated qrels.** Input: per-topic metric
> scores + human and LLM judgments on 2–3 public collections; output: design tables
> ($N$ topics, $M$ replications) and a simulator; success: predicted power matches
> empirical power on a held-out collection within a declared tolerance. Type: study.
> Consumer: evaluation-organisation community (TREC/NTCIR). Surfaced by passes 1 + 4.
> Parent occupancy: classic topic-set-size design **[v: lab publication list]**; power
> analysis for hybrid human+LLM qrels **not found in A+B passes** **[u]**. Horizon fit:
> CPU-only, 3 months to first results.

### (c) Requirement-gate table (excerpt)

| Candidate | R1 1-yr on 1 GPU | R2 no domain expert | R3 host-lab fit | R4 publishable floor | Overall |
|---|---|---|---|---|---|
| T-07 power design | pass | pass (simulation + public qrels) | pass (evaluation methodology) | pass (framework = artefact) | **keep** |
| T-12 clinical metric validation | fail (needs radiologists) | **fail** | conditional | pass | drop → replaced by re-scout (pass 5 transfer: small-n equivalence testing instead of clinical validation) |

### (d) Task definition (condensed)

```
### TD-2 — Topic-set-size design for noisy, biased, machine-generated qrels
One-line: classical IR says how many topics you need to tell two systems apart; nobody
says it when the qrels are partly written by a biased LLM judge.
Research question: given sigma^2, delta, judge noise (b, sigma_J^2, correlation rho),
what N and M achieve power >= 0.8 at alpha = 0.05, and how do paired tests behave when
noise is correlated and biased rather than i.i.d.?
Input/output/success: simulation engine fitted to real qrels + re-analysis of one live
collection; success = tables predicting empirical power within a declared tolerance, or a
documented robustness regime (either direction is publishable).
Why open: judge-validity papers (2606.19544, 2606.00093) document agreement problems
[v]; no power analysis for hybrid qrels found in the passes run [u] -> withdrawal condition.
Gate fit: R1 pass (CPU), R2 pass, R3 pass, R4 pass.
Floor: "conventional tests are robust up to rho < x" is citable for organisers.
Withdrawal: a 2025-26 paper already giving LLM-qrels power analysis.
Venues: SIGIR (deadline [u] tracker-only -> confirm), fallback CIKM/ICTIR.
```

### (e) Verification-ledger excerpt

| Claim | Label | Basis |
|---|---|---|
| host lab runs an NTCIR task on RAG confidence | [v] | task page, read 11 Oct 2026 |
| SIGIR deadline ~22 Jan | [u] | tracker only |
| "no LLM-qrels power analysis exists" | [u] | passes 2–4 run; not found |

---

## Contrast: a FAILING output (do not deliver this)

> "We surveyed the field. Topic A has been studied by [1–20]. Topic B has been studied by
> [21–45]. Topic C is promising. In conclusion, the area is largely solved; we recommend
> Topic C, which is an extension of [45]."

Why it fails the audit: no checkable problem statements; no requirement gates; no consumer
named; "promising" without evidence classes; delta-of-delta (C extends a surveyed paper);
"the area is solved" is a forbidden conclusion; no floor deliverable, no withdrawal
condition, no ledger. A reader cannot act on it, and a supervisor cannot check it.

The desired output always ends in **ranked task definitions with success criteria, floors,
withdrawal conditions and dated milestones** — the literature is evidence for those
definitions, never the deliverable itself.
