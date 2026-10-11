---
name: "research-frontier-prospecting"
description: "Prospect a research (sub)field and produce validated, auditable project task definitions — not a literature survey. Use when the user asks to propose/find/evaluate research topics or task definitions for a project (bachelor, master's, PhD, or senior researcher) in some field, e.g. \"Propose a number of task definitions in <subfield of applied maths> for a 2-year project that also meets the following requirements: ...\"; when a previous search concluded \"the area is closed / solved / saturated\" and needs re-examination; when a topic must satisfy profile, resource, expert-collaboration and publication constraints. Also for \"is this area worth entering\", \"what can be studied or created in X\", \"scout opportunities in X\". NOT for plain literature surveys (\"summarize papers on X\"), single-paper questions, or writing the research itself."
version: 2
created: "2026-10-11"
updated: "2026-10-11"
---
## When to Use

When the deliverable is candidate research tasks with evidence: checkable problem
statements, validated against explicit criteria, with floor deliverables, withdrawal
conditions and publication windows. Trigger phrasings: "propose task definitions in ...",
"find a topic for a project/thesis", "what can be studied or created in ...", "the area
seems closed, is it?", "evaluate topic candidates", "scout a wider field".
Wide scouting is the default even when the user names one subfield; requirements that can
invalidate candidates must be verified, and failing candidates replaced by suitable ones
found through new passes.

## Support files (read as needed; all paths relative to this skill folder)

- **01-prospecting-passes.md** — the seven prospecting passes (demand-side, indexed, non-indexed, contradiction, isomorphism, own-negatives, perpendicular axes), the challenge-the-claim protocol, occupancy discipline and query recipes.
- **02-scoring-and-audit.md** — the ten scoring axes with justification requirements, ranking rules for multiple horizons, and the pre-delivery self-audit checklist.
- **03-templates.md** — intake question list, requirement-gate table, candidate statement and task-definition templates, publication-window table, report outline, verification-ledger template.
- **04-worked-example.md** — a condensed real worked example (including the diagnosis of a prior "the area is closed" search) and a contrast example of a failing, survey-shaped output.
- **05-delegation-protocol.md** — harness-agnostic protocol for delegating search/reading to workers (subagents, other frameworks, separate chats, scripts): split rule, worker briefs, return schema, spot-checks.

## Procedure

0. **Anchor time first**: obtain today's date from the environment (system clock, session
   context) or, failing that, from a web search — never from model memory — and state it in
   the report header with its source. All time windows ("recent", "last 2 years", the
   horizon, milestones, deadline lookups, search query years) are computed from that date.
1. **Intake interview first** (ask the crucial questions once, in one message, then proceed
   without re-asking): target persona (bachelor / master's / PhD / senior researcher),
   horizon in months and deliverable (coursework, thesis chapter, tech report, publication),
   background and prior work (request the paper/thesis/prior agent reports if they exist),
   compute and data-access budget, domain-expert collaborators (who can validate claims — or
   nobody), languages, publication goals and hard deadlines, forbidden topics, desired
   properties (expert-independence, create-vs-study preference, multimodal/multilingual,
   …), and **known related works or systems** (papers, tools, benchmarks, links and prior
   search outputs the researcher has already seen — every one must receive an explicit
   overlap verdict at step 7). Question list:
   03-templates.md §1. HARD RULE: if the user supplies none of this,
   assume nothing about the user — record `unknown` and flag every unknown as an unmet
   criterion; never silently pass a candidate on an unverified criterion.
2. **Turn every stated or persona-implied requirement into requirement gates R1..Rn**:
   each checkable, each getting a per-candidate verdict column later. Horizon/persona gates
   (e.g. "finishable in N months on one GPU", "validatable without domain experts") are
   mandatory gates. If a requirement is itself infeasible or self-contradictory, say so with
   evidence and propose an adjusted requirement before scouting — do not silently relax it.
3. **Read the researcher's own artifacts BEFORE searching outward** (paper, thesis, prior
   findings, prior agent reports): mine (a) head start — skills, code, datasets, access;
   (b) stated future work; (c) negative/null results (a component that did not help, a
   dropped hypothesis) — these are prime candidate seeds. If prior search reports exist,
   diagnose why they concluded what they did (e.g. "the area is closed") and record the
   diagnosis in the report.
4. **Scope the field wide by default**: state the target (sub)field's boundaries, at least
   3 adjacent subfields, and at least 2 isomorphic fields in other disciplines (transfer
   table in 01-prospecting-passes.md Pass 5). Even if the user named one subfield, the
   catalog must span >=3 subareas.
5. **Run the prospecting passes** in 01-prospecting-passes.md with the tool-equipped agent:
   (1) demand-side mining — shared tasks, lab agendas, benchmark "limitations" read as
   requests; (2) indexed literature — surveys first; (3) non-indexed sources — leaderboards,
   repos, models, blogs, theses, patents; (4) contradiction/instability mining;
   (5) isomorphism transfer searches; (6) own-negative-result mining (from step 3);
   (7) perpendicular axes — measurement, benchmark hygiene, negative results, data audits.
   At least one full search wave per adjacent area. STOPPING RULE: stop searching a pass when
   two consecutive waves yield no new candidate type (not merely no new papers) — record
   what was searched so "not found" stays auditable. If an effort budget caps the search
   before that point, declare "capped-before-saturation" in the pass accounting and carry
   the affected claims (including venue dates not live-checked) as [u] must-check items.
6. **Generate 10–25 candidate topics as CHECKABLE problem statements**: input, output, what
   counts as success. Label each: create-vs-study, named consumer who wants the answer,
   target horizon, and which pass surfaced it. Catalog health targets: >=3 subareas,
   >=2 perpendicular-axis candidates, and <=60% candidates that are "extension of paper P"
   deltas.
7. **Study and verify each candidate**: run the challenge-the-claim protocol
   (community belief -> strongest evidence -> what would falsify -> who has that evidence ->
   who needs it -> verdict: settled / contested / assumed-but-untested); two readings of key
   sources (abstract promise vs tables+limitations); occupancy discipline ("occupied" /
   "not found", confidence classes [v]/[i]/[u], every "not found" lists the passes run);
   verify each dataset/benchmark (canonical repo, license, public vs hidden test,
   saturation, claimed-vs-actual counts). **Execute every withdrawal check inside the run:**
   for each candidate that is likely to be recommended, search for the falsifying prior
   work named in its would-be withdrawal condition and report the result (found / not
   found + passes run). A withdrawal condition left as a future action is a to-do, not a
   deliverable — the recommendation may only be made after its check has run. Also give an
   explicit overlap verdict for every related work the researcher supplied. No experiments
   at this stage — literature, data inspection and reading only.
8. **Apply the requirement gates**. Every candidate failing a user-specified disqualifier is
   recorded with the reason — and then re-scout: reframe, transfer, or replace until the
   report contains enough candidates that pass ALL gates. A requirements-bearing request
   must never end in an empty or all-failing catalog; "no candidates exist" is a search
   failure, not a result.
9. **Score surviving candidates** on the ten axes in 02-scoring-and-audit.md with a
   one-sentence justification per cell; rank separately for each horizon; never by a single
   axis. Competition density is NOT a virtue or a veto: ask "who has made this exact claim?"
   (novelty-of-claim risk) and weight demand + deadline instead.
10. **Compose the comprehensive report** from 03-templates.md §6: (a) diagnosis of prior
    findings if any; (b) landscape + search-pass accounting; (c) requirement-gate table;
    (d) scored matrix; (e) **4–8 full ranked TASK DEFINITIONS** — research question,
    input/output/success, why open with evidence and confidence classes, fit per gate,
    data + license, compute, milestones against live venue dates, floor deliverable, risks
    and withdrawal conditions — plus the wider catalog as a shortlist table; (f) portfolio
    plan (primary / backup / insurance) for the whole horizon; (g) verification ledger of
    [v]/[i]/[u] claims. Save as Markdown file(s) and give a SHORT chat summary: top
    recommendations, deadlines to confirm, must-check items.
11. **Self-audit** with the checklist in 02-scoring-and-audit.md before delivery. If any
    check fails (scope capture, delta-of-delta, unsourced "occupied", missing floor or
    withdrawal condition, report reads like a literature review), fix it — re-running a
    prospecting pass if needed — and only then deliver.

## Pitfalls

- **Literature-survey degeneration**: summaries of papers without candidates, gates and
  verdicts fail the task. Every section must end in a decision-relevant output.
- **Delta-of-delta circularity**: candidates generated as increments of observed papers and
  then killed by that same evidence. Demand-side, contradiction and isomorphism passes must
  each contribute candidates.
- **"The field is closed" is not an allowed conclusion.** Allowed: "this claim is settled
  (evidence class)", "this neighbourhood is crowded", "no candidate passes the stated
  constraints — here are the perpendicular axes".
- **Competition-as-virtue ranking**: formulas that reward few competitors select topics
  nobody wants. Demand and deadline belong in the score; density only multiplies
  novelty-of-claim risk.
- **Assuming the researcher**: do not invent background, compute, collaborators or
  preferences. Unknown is not satisfied; ask once (step 1), then flag.
- **Requirement-blind validation**: user disqualifiers checked late or ignored; invalid
  candidates must be replaced by re-scouting, not by relaxing the requirement. Conversely,
  do not pretend an infeasible requirement is fine — flag it with evidence and propose an
  adjustment.
- **Data-defect hallucination**: when reporting a data defect, describe the exact loading
  pipeline and label "verified by direct inspection" vs "inferred from my pipeline". Many
  defects are the agent's own bugs; a human opening the file is the final authority.
- **Scores-as-probabilities**: weighted scoring heuristics are transparent ordinals; two
  decimal places reproduce arithmetic, not acceptance odds.
- **Stale dates**: venue deadlines and shared-task schedules must be searched live; label
  tracker-only claims [u]. A wrong *current* date is worse than a stale one: a hallucinated
  "today" silently invalidates every window, milestone, search year and conference edition
  in the report. If the run date cannot be established, stop and say so.
- **"0 results = free"**: absence from chosen indexes is "not found in the passes run",
  never "open".
- **Ignoring the researcher's own work**: their null results and stated limitations are the
  highest-head-start candidates and the best motivation examples.
- **Unverified data dependencies**: check license, test-set openness and saturation before a
  candidate depends on a dataset.

## Verification

Run before delivery; all must hold:

1. **Gate coverage**: the report contains a requirement-gate table in which EVERY user
   requirement (and every persona gate) has a verdict per recommended candidate; no
   criterion is passed on assumption.
2. **Source hygiene**: every "occupied" carries >=1 source with a confidence class; every
   "not found" lists the passes run; no SOTA claim without benchmark name and date.
3. **Catalog health**: >=3 subareas represented, >=2 perpendicular-axis candidates, <=60%
   delta-of-delta candidates; every candidate states input/output/success plus a named
   consumer.
4. **Per-task insurance**: every task definition has a floor deliverable (publishable or
   defensible if the hypothesis fails) and an explicit withdrawal condition. "None needed"
   FAILS this check — for audits and artefacts the withdrawal condition is the prior-art
   check that would make the work redundant. Floor, withdrawal and month-based milestones
   (computed from the run date) must appear inside EACH task definition; a portfolio-level
   timeline is not enough.
5. **Ledger present**: the report ends with a verification ledger of claims by confidence
   class [v]/[i]/[u].
6. **Output-shape test**: the report contains 4–8 full ranked task definitions with
   milestones and venue windows and a portfolio plan. If it reads as a literature review
   with a shortlist at the end, it fails — go back to Procedure step 6.
7. **Requirements-rescue test**: if the user gave requirements that invalidate some
   candidates, the final catalog still contains candidates passing ALL gates, with the
   re-scouting passes documented.
8. **Executed withdrawal checks**: every recommended task definition carries the RESULT of
   its falsifying-prior-work search (found / not found + passes run, dated), and every
   researcher-supplied related work has an explicit overlap verdict. A withdrawal condition
   presented as an unchecked future action fails this item.
9. **Time anchor**: the report header states the run date and where it came from; every
   relative time expression ("recent", "this year", "latest") is resolved to absolute dates,
   and venue/conference editions are the ones that are current for that date.

## Confidence labels (use consistently in every report)

- **[v] verified** — checked by direct search/reading this run (give the source).
- **[i] inferred** — reasoning from verified evidence; state the inference.
- **[u] unverified** — plausible but not checked (bounded search, tracker-only dates,
  inaccessible full text). Every [u] a decision depends on becomes a must-check item in the
  chat summary.

## Hard rules (condensed from the researcher's methodology; detail in 01/02)

1. No experiments at topic-selection stage: literature, data inspection and reading only.
2. "Occupied" (evidence found) and "not found" (no evidence in the passes run) are
   different labels; both are mandatory.
3. Competitors include funded labs, dataset authors, patents, products, competition tracks
   and leaderboard entries — not only papers.
4. Two readings per key work: what the abstract promises vs what the tables/limitations
   show; discrepancies are candidate niches.
5. Every topic has a source list for going deeper (surveys first, confidence class per
   source, no filler links).
6. In overheated fields, racing for accuracy loses by construction; look first at
   measurement, benchmark hygiene, negative results and data audits.

## Deliverable contract

Comprehensive report(s) as Markdown files (full detail, tables, formulas allowed), plus a
short chat summary containing: the top recommendations in one line each, live dates to
confirm, and must-check items ([u] claims a decision depends on). If the user asked for a
different delivery (single message, slides), follow the user.

## Delegation mode (optional; any harness)

For deep sweeps, the search-and-read work may be split across workers — subagents, other
multi-agent frameworks, separate chat sessions, or scripts — per **05-delegation-protocol.md**.
Harness-agnostic core rules: (1) workers get self-contained briefs (scope, gates, pass
assignment, recall rules, return schema, confidence labels) and return **evidence, never
verdicts** — formulation, scoring, gates, and the report stay in the orchestrator;
(2) every worker returns a query log and sources with confidence classes; (3) the
orchestrator spot-checks ≥1 [v] claim per worker against its source and records the
outcome in the report; (4) an empty worker return is recorded as "pass run, no usable
items" — never a silently dropped pass.