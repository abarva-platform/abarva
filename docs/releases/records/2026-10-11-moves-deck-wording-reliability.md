# 2026-10-11 — Reference-deck wording reliability

## Release ID

`2026-10-11-moves-deck-wording-reliability`

## Status

`candidate — live fidelity proof pending`

## Plain-English Summary

The signed-in preview now returns both deck editions as PowerPoint and PDF, but one long model wording call can still reach its time limit and leave generic fallback words on several slides. This change requests fewer slides per initial model call and asks for concise slide language. The model calls remain bounded and audited, and failed batches still recover independently.

## Layer Impact

- Release lane: `experimental`, behind the existing demo-only reference-deck flag.
- Layer 3: no canonical data, schema, or read-model change.
- Layer 4: read-only preview wording only. Figure lineage, edition limits, and rendered-file checks are unchanged.

## Client Applicability

Specific clients: only the synthetic demo tenant enrolled in the `moves_reference_deck_v1` feature flag. All other tenants remain refused before the Move read.

## Changes Included

- Use three initial audited batches of at most eight slides for the long edition.
- Bound initial, recovery, and repair model calls to 65, 30, and 15 seconds respectively, with no automatic SDK retry.
- Ask for concise titles, answer bars, and notes to reduce response length while preserving required slot tokens and source checks.
- Preserve failed-batch recovery, slide order, and safe error classification.

## QA / Validation

- **Pass** — Focused words and preview-route tests: 22 passed; typecheck, changed-file ESLint, lib-orphan audit, route/export reachability, tenancy census, manual check, and all 11 release gates passed.
- **Pass** — Refreshed the test-coverage census for four test files already present on current `main`; the committed count now matches the tree.
- **Pass** — A temporary mutation back to larger initial batches made the full-edition batch test fail; the source was restored.
- **Not run** — Post-deploy signed-in walk and file-level fidelity scores.

## Rollout Plan

Merge after local and PR checks and the open Moves coverage-collision review. The repository-owned ACA main deploy workflow owns rollout. The subsequent signed-in walk must upload both editions as PPTX and PDF with fidelity scores.

## Deployment Authority

This candidate does not deploy, shift traffic, run data jobs, or query a database. Model wording continues through audited Anthropic egress.

## Rollback Plan

Revert through the protected PR path or disable the existing demo-only reference-deck flag.

## Audit Evidence

The PR, local and CI checks, the preceding signed-in fidelity report, and the next signed-in deck-fidelity report.

## Known Gaps

- A live high-fidelity investment PPTX has not yet been proven on this candidate.
- External model or audited-egress failures can still produce visible fallback wording, lowering fidelity scores.
