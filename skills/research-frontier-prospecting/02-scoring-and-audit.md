# 02 — Scoring axes, ranking rules, and the pre-delivery self-audit

Scoring is a transparent ordinal heuristic, **not** an acceptance probability. Every cell
carries a one-sentence justification; a number without a justification counts as
unverified. Scores run 1–5, 5 = favourable.

---

## The ten axes

| # | Axis | What it measures | Question to check |
|---|---|---|---|
| 1 | **Need / consumer** | who wants the answer and why | a named consumer (organiser, lab, benchmark users, the researcher's own paper) — not just "interesting" |
| 2 | **Unresolved** | what exactly is not done | is the gap "task not posed" / "posed but unsolved" / "solved but narrowly"? |
| 3 | **Novelty-of-claim risk** | who has made *this exact claim* | prior claim = risk; parent-task popularity is irrelevant here |
| 4 | **Demand + deadline** | is there a date the project can hit | shared task, benchmark release, lab collaboration, venue window |
| 5 | **Data readiness** | does the data exist, is it open, verified | canonical repo, license, public test, saturation, claimed-vs-actual |
| 6 | **Feasibility** | resources and skills suffice | passes the persona gates (compute, time, skills)? |
| 7 | **Head start** | what the researcher already has | skills, code, data, access, a ready metric, domain language |
| 8 | **Risk floor** | worst case still publishable/defensible | metric critique, benchmark audit, reproducibility, negative result survive failure? |
| 9 | **Expert independence** | validatable without a domain specialist | is ground truth machine-checkable, or must an expert judge? (unknown collaborator ⇒ this axis is a gate) |
| 10 | **Non-obviousness** | will the outcome be surprising | predictable "did the obvious thing" vs a new fact |

Interpretation for theory-heavy or empirical-light fields (pure/applied maths, theory):
"consumer" is the community or line of work that would use the theorem, counterexample,
method or dataset — not necessarily an organiser; "demand + deadline" is satisfied by a
live venue/defence window and an active research line. Do not let these two axes bias the
portfolio toward applied topics when the request is theoretical; conversely, if the user
asked for applicable work, a theory-only candidate is a gate failure.

Notes that repeatedly matter:

- **Need ≠ non-obviousness** (a needed task can yield a predictable result).
- **Unresolved ≠ competition** (a task can be unsolved yet crowded — that is fine).
- **Do not treat competitor density/velocity as negatives.** Demand produces competitors.
  The real risk axis is #3 (novelty of claim). Velocity is a *planning* variable ("how fast
  must I run?"), not a score.
- Axis 3 in older templates ("few competitors") systematically ranks down exactly the
  topics with shared tasks, test collections and co-authors waiting. Do not use it.

## Ranking rules

1. Never rank by a single axis. A weighted geometric mean (e.g.
   $\mathrm{Priority} = N^{0.20} \cdot D^{0.20} \cdot H^{0.20} \cdot U^{0.10} \cdot R^{0.10}
   \cdot C^{0.10}$ over need, demand, head start, unresolved, floor, novelty-risk) is
   acceptable as a transparent heuristic — state that it orders, it does not predict.
2. **Rank separately per horizon.** A 2-year bachelor project and a 6-month senior-researcher
   sprint want different optima: short horizons prioritise demand + data + floor; long
   horizons prioritise a defensible research programme. One scoring pass, two rankings.
3. Tie-breaks in order: demand+deadline, floor strength, feasibility, non-obviousness.
4. Always deliver a **portfolio**, not a single winner: primary + backup + insurance task.

## Per-task-definition requirements (all mandatory)

checkable research question · input/output/success · why open (with evidence + confidence
class) · fit per requirement gate · data + license · compute · milestones against **live**
venue dates · floor deliverable · risks + explicit withdrawal condition.

---

## Pre-delivery self-audit checklist (run before the report is delivered)

**Catalog health**

- [ ] ≥3 subareas represented; the sweep was not scope-captured by one neighbourhood.
- [ ] ≤60% of candidates are "extension of paper P" deltas (delta-of-delta check: if most
      candidates cite the same ~10 parent papers, reject and re-scout).
- [ ] ≥2 perpendicular-axis candidates (measurement / benchmark hygiene / negative result /
      data audit).
- [ ] Every candidate: input/output/success + named consumer + create-vs-study label.

**Source hygiene**

- [ ] Every "occupied" has ≥1 source with a confidence class.
- [ ] Every "not found" lists the passes run.
- [ ] No SOTA claim without benchmark name and date.
- [ ] Key works have two readings (promise vs tables/limitations).

**Requirements and risk**

- [ ] Requirement-gate table complete: every user requirement × every recommended
      candidate has a verdict; no criterion passed on assumption.
- [ ] If some candidates fail user disqualifiers: re-scouting was done and the catalog still
      contains candidates passing ALL gates (documented).
- [ ] Every task definition has a floor deliverable and a withdrawal condition.

**Report shape**

- [ ] Ends with a verification ledger ([v]/[i]/[u]).
- [ ] Contains ranked task definitions with milestones and venue windows + portfolio plan.
- [ ] **Output-shape test:** if the report reads as a literature review with a shortlist at
      the end, it fails — go back and produce task definitions.

**Final conclusion vocabulary** (only these are allowed):

- "this claim is settled (evidence class)" ·
- "this neighbourhood is crowded; the open questions are perpendicular" ·
- "no candidate passes the stated constraints — here are the unsearched perpendicular axes".

The phrase "the field is closed / solved / everything is taken" is **never** an allowed
conclusion.
