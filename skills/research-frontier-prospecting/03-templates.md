# 03 — Templates: intake questions, gate table, candidate and task-definition forms, report outline

---

## 1. Intake question list (ask ONCE, in one message; then proceed)

**Who and what**

1. Who is the project for — bachelor / master's / PhD / senior researcher? What is the
   horizon in months, and what is the deliverable (coursework, thesis chapter, tech report,
   paper)?
2. What is their background: fields worked in, concrete past tasks, languages (natural and
   programming)? Can they share a paper/thesis/prior agent reports? *(Prior artifacts are
   read before scouting — step 3 of the procedure.)*
3. What must the topic "be like": desired properties (e.g. verifiable without domain
   experts, create-a-benchmark vs study, multimodal/multilingual, not "just another
   +0.1 on a leaderboard", publishable, theory vs experiments)?

**Constraints and collaborators**

4. Domain-expert collaborators: is there a supervisor, a lab, a domain specialist who can
   validate claims? Who exactly, and what is their agenda? (If nobody — expert-independence
   becomes a hard gate.)
5. Resources: compute (GPUs, clusters, API budgets), data access (any public dataset?
   credentialed corpora?), annotation budget (people-hours, second assessor available?).
6. Hard constraints: deadline for topic choice, hard submission dates, acceptable licenses
   (commercial? share-alike?), what must NOT be done (no medical data, no humans in the
   loop, no training runs, …).

**Goals**

7. Publication goals: target venues, shared tasks to enter, "may lead to a publication"
   vs "must", authorship expectations.
8. What matters most when choosing: novelty, feasibility, fit to the supervisor's agenda,
   employability of the result, artefact (dataset/tool) preference?
9. **Known related works**: any papers, systems, benchmarks or links you already know
   (including prior agent search outputs)? Each receives an explicit overlap verdict in the
   report — a paper you know and the agent missed is the worst possible miss.

If the user answers none of these: assume nothing. Mark every unknown as `unknown` in the
constraint table, and treat it as an unmet criterion — candidates are recommended with
explicit conditions attached.

## 2. Requirement-gate table (fill after intake; verdicts after scouting)

| Gate | Source | Checkable statement | Verdict scale |
|---|---|---|---|
| R1 | user request | e.g. "finishable in 24 months by a bachelor on 1 GPU" | pass / fail / conditional |
| R2 | user request | e.g. "result validatable without doctors" | pass / fail / conditional |
| R3 | persona | e.g. "no prior IR background assumed" | pass / fail / conditional |
| … | … | … | … |

Later, in the report:

| Candidate | R1 | R2 | R3 | … | Overall |
|---|---|---|---|---|---|
| T-01 | pass | fail (needs radiologist adjudication) | pass | | drop + replaced |

## 3. Candidate statement (catalog entry)

> **T-NN — short title.** Input: …; output: …; success: … .
> Type: create (artefact) / study (analysis). Consumer: … . Surfaceed by pass: … .
> Parent claims and occupancy: … (confidence classes). Horizon fit: ….

## 4. Task definition (the main deliverable; one per recommended topic)

```
### TD-N — Title
One-line problem statement.
Research question (checkable): ...
Hypotheses / three readings (invalid signal / redundant / underpowered — adapt):
Input / output / success (either-direction success counts):
Why open: evidence with [v]/[i]/[u], and the challenge-the-claim verdict
  (settled / contested / assumed-but-untested).
Gate fit: R1..Rn verdicts.
Data + license + test openness; compute budget.
Milestones vs live venue windows (month-by-month).
Floor deliverable (publishable if the hypothesis fails).
Risks + withdrawal condition — WITH the executed check result (what was searched, when,
found / not found). An unchecked withdrawal condition is a to-do, not a deliverable.
Venue targets (with deadline confidence classes).
```

## 5. Publication-window table (search dates LIVE; label tracker-only claims [u])

| Venue | Deadline | Event date | Fit for this portfolio | Status |
|---|---|---|---|---|

## 6. Report outline

1. Constraints and assumptions (intake summary; unknowns flagged).
2. Diagnosis of prior findings (if any): why previous runs concluded what they did.
3. Landscape: subfields swept, prospecting passes run, search accounting.
4. Candidate catalog (checkable statements, create-vs-study labels).
5. Requirement-gate table.
6. Scored matrix (ten axes, justifications in cells).
7. Two readings of key works (abstract vs tables/limitations).
8. Ranked task definitions (full form of §4) + portfolio plan (primary / backup / insurance).
9. Publication windows and milestones.
10. Verification ledger.
11. Next decisions for the human (what to confirm, whom to email, what to read first).

## 7. Verification-ledger template

| Claim | Label | Basis |
|---|---|---|
| "NTCIR-20 registration opens in month X" | [u] | not announced; inferred from cycle |
| "benchmark B has public test set" | [v] | dataset card, read on <date> |
| "no power analysis for hybrid qrels exists" | [u] | bounded search: <passes run> |

## 8. Chat-summary contract (after the report file is written)

3–7 lines: top recommendations (one line each), the nearest live deadline, and the must-check
items ([u] claims the decision depends on). Do not duplicate the report.
