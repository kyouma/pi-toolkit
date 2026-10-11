# 05 — Delegation protocol (harness-agnostic): splitting the search work across workers

Purpose: keep the orchestrator's context small while the sweeps get *deeper* (20 results
per query, scholarly indexes, multiple passes). Works with any mechanism that can run
side-workers: Pi subagents, multi-agent frameworks, separate chat sessions, scripts, or a
human assistant. The protocol below is defined by **message contracts**, not by any tool.

## When to use

- The pass plan exceeds what one context can hold comfortably (deep result pages × 7
  passes × multiple subfields), or the run is budget-capped on context rather than effort.
- Not worth it for small runs: if the whole sweep fits (≈ ≤15 queries), run it inline —
  delegation adds a lossy hop.

## The split rule (do not break this)

| Stays in the orchestrator | May go to workers |
|---|---|
| intake, requirement gates | passes 2–5 sweeps (indexed, non-indexed, contradiction, isomorphism) |
| candidate formulation (final wording) | raw reading of long result pages / papers |
| challenge-the-claim **verdicts** | evidence for the verdicts (what a source claims) |
| scoring, ranking, portfolio | named-falsifier searches (withdrawal checks) |
| report, ledger, self-audit | dataset card / license / repo inspection |

Workers return **evidence**, never judgments: a worker that writes "therefore this topic is
good" has overstepped. Verdicts need the requester's profile and gates, which live in the
orchestrator.

## Worker brief (must be self-contained)

A worker sees nothing except its brief. Include:

1. **Field scope** for its pass (subfield + adjacent slices it should and should not touch).
2. **The requirement gates** verbatim (so it can label relevance), minus personal data.
3. **Pass assignment** with the query budget and the recall rules: maximum results per
   query, scholarly tools for literature, query-by-concept for falsifier searches.
4. **Return schema** (below) and a hard length cap (e.g. ≤ 10 items + query log).
5. **Confidence labels** `[v]/[i]/[u]` and the occupancy discipline ("occupied" needs a
   source; "not found" needs the passes run).
6. **Output destination**: return text only (orchestrator writes files) or write to its
   own file and return the path — never let two workers write the same file.

## Return schema (machine-checkable)

```
PASS: <name> | WORKER: <id> | DATE: <yyyy-mm-dd> | BUDGET: <queries used / planned>
QUERY LOG: <query> -> <n results> ; ...
ITEMS (max N):
  - KIND: candidate-seed | competitor | claim | dataset | falsifier-hit
    TEXT: one checkable sentence (input/output/success for seeds)
    SOURCE: <url or bibliographic ref>
    CLASS: indexed | preprint | patent | product | blog | hearsay
    LABEL: [v] | [i] | [u]   OCCUPANCY: occupied | not found
    NOTE: one line "what it gives / what would falsify it"
NOTHING-FOUND ENTRIES: for every query family with zero usable hits, state the queries run.
```

## Spot-check rule (the orchestrator's job)

Workers are untrusted measurement instruments. Before delivery: **re-open at least one [v]
source per worker** (random pick) and verify the claim against it. Any discrepancy → mark
that worker's items `[u]` pending re-check and say so in the ledger. Record in the report:
who ran which pass, and the spot-check outcome ("worker W2, 2/2 sampled claims verified").

## Failure handling

- A worker returning nothing is a **result**, not an error: record "pass run, worker
  returned no usable items" + its query log. Do not silently drop the pass.
- Empty or malformed returns → re-run once with a rephrased brief (usually the schema was
  not understood) before treating it as a genuine "not found".
- Independent workers should not see each other's output before returning; correlated
  blind spots are what you are delegating *away* from.

## Harness mapping (examples, not requirements)

- **Pi (`subagent` tool / pi-subagents)**: one parallel workflow with N children, each
  `task` = a worker brief; `output` to per-worker files if large.
- **Other multi-agent frameworks**: same contracts as tasks on a queue; one worker per pass.
- **Plain chat sessions**: paste the brief into fresh chats (they have no shared memory —
  which is the point); paste back the schema-conforming replies.
- **Scripts/crawlers**: fine for pass-2/3 retrieval volume; a model is still needed to
  classify items into the schema.

## Anti-patterns

- Asking a worker "which topic is best?" (verdict leak).
- Passing the whole brief but not the gates (worker cannot label relevance).
- Accepting prose summaries without sources/confidence classes (uncheckable).
- Delegating the self-audit itself (the checklist is the orchestrator's last line).
