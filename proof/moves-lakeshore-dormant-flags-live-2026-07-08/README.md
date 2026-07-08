# Moves dormant-flag first-proof — Lakeshore (2026-07-08)

Signed-in browser proof, tenant Lakeshore Holdings, Move `RETAIL-LEGAL-2026` (id `908c9bf8-e745-45dc-9ad8-3d493a2a1c8a`), testing `moves_workforce_economics` and `moves_decision_storytelling`.

## Result: page loads cleanly, but honest fallback prevents visual confirmation of the new content

URL: `https://app.abarva.ai/api/v1/moves/board-grade-business-case?moveId=908c9bf8-e745-45dc-9ad8-3d493a2a1c8a`

The route rendered a "Costed Business-Case Pack" in an explicit, honest **UNBOUND** state:

> "No curated Domain Function Pack covers this Move's function — the kernel cannot produce a board-grade business case... This Move does not resolve to a curated Domain Function Pack — its industry code or charter carries no function identity. The agent falls back to general reasoning for this task; this is a known curated-depth gap, surfaced honestly, not fabricated depth."

`moves_workforce_economics` and `moves_decision_storytelling` both attach to the kernel-derived Costed Business-Case Pack (per their flag summaries: "DERIVED from the kernel's own effort skeleton" / "the SAME governed generation"). Since this Move's kernel path is itself unbound (no curated Domain Function Pack for Lakeshore's function), there is no kernel deck for either flag to attach content to — so nothing new can render regardless of whether the flags are on or off. This is the same honest-fallback discipline observed elsewhere in this system (no fabricated numbers), not a bug.

**Checked:** all 5 of Lakeshore's active Moves are in the same `RETAIL-*` family; did not find one that resolves to a bound kernel deck. No console errors were observed on the page that did load.

## What this proves and doesn't prove

- Proves: the flags are live in deployed code (registry change confirmed via the ACA runtime invariant), and turning them on did not break or change behavior for a Move that has no kernel binding — no crash, no console error, no fabricated content appeared.
- Does not prove: what the workforce-economics estimate-twice view or the decision-storytelling exhibit deck actually look like when they do have something to attach to — that requires a Lakeshore (or other) Move that resolves to a curated Domain Function Pack, which was not found in this pass.

## Follow-up

Identify or create a kernel-bound Move (checking a tenant/function combination that has curated Domain Function Pack coverage) to complete visual proof of `moves_workforce_economics` and `moves_decision_storytelling`. Left as an open item in the rollout report.
