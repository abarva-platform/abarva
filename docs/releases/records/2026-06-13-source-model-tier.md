# 2026-06-13-source-model-tier — Environment-tiered models + gate scope

## Release ID

`2026-06-13-source-model-tier`

## Status

`candidate`

## Release Lane

`global-control-lane`

## Plain-English Summary

Two changes that together make Source deliverable quality both higher and environment-appropriate:

1. **Environment-tiered model selection.** Board-grade (gated/flagship) Source deliverables (d02/d03/d09)
   now use a board-grade model that defaults to `claude-opus-4-8`; non-gated drafts (d01/d05) use a default
   that defaults to `claude-sonnet-4-6`. Both are env-driven (`ABARVA_SOURCE_BOARD_GRADE_MODEL`,
   `ABARVA_SOURCE_DEFAULT_MODEL`), so dev/preprod can dial down to save cost and only prod (and client-prod)
   pays for the top model — the highest quality is reserved for the highest environments, no code change.
2. **Reserve the consulting-grade gate for d09.** The gate's review rubric is RFP-specific (it grades against
   D09 exhibits, the coverage map, and RFP §-structure). d02/d03 were forced through it and always blocked on
   RFP criteria they should not have. They now generate single-pass on the board-grade model + the bound
   uploaded evidence — like d01, which is board-grade with no gate.

## Layer Impact

- `global-control-lane`: Prompt-registry model constants (env-driven) and the gate-code set. No schema, route,
  or runtime-dependency change. d09 keeps the full gate.

## Client Applicability

- All clients: Source board-grade deliverables use the configured top model; d02/d03 now produce a usable
  draft instead of always blocking. No other behaviour change.
- Specific clients: SkyHarbor — where the d09-rubric mismatch and the model gap were found live.
- Internal only: None.
- Public/demo only: None.
- Feature flag: gated generation is reached through `workspace_explorer_source`; model tier is env-driven.

## Changes Included

- `prompt-registry.ts`: `DEFAULT_MODEL` / `BOARD_GRADE_MODEL` env-driven; d02/d03/d09 → board-grade model.
- `quality-review.ts`: `SOURCE_CONSULTING_GRADE_CODES` reduced to `d09_rfp_pack` only.
- Test updated to reflect the gate scope.

## QA / Validation

- PASS: `npx jest … strategy-authoring.test.ts` (4/4) · `npx eslint` clean · `tsc --noEmit` clean.
- Pending: live re-test on ACA — regenerate d02/d03 (single-pass, board-grade model) and confirm a usable
  draft persists with no 504 and no irrelevant gate block.

## Rollout Plan

Merge → CI → rebuild → `containerapp update` → shift 100% traffic. Per-environment, set
`ABARVA_SOURCE_BOARD_GRADE_MODEL` (prod = opus; dev/preprod = sonnet). Lab keeps the Opus default for d02/d03
single-pass (fast, no gate). d09 on Opus + gate remains synchronous — pair with async generation before
relying on it in prod.

## Rollback Plan

Revert the PR — restores Sonnet for all and re-adds d02/d03 to the gate set. No data/schema to unwind. Or set
the env vars back to Sonnet without a code change.

## Audit Evidence

PR diff (model constants + gate-set + test + this record), CI checks, local jest/eslint/tsc output, and the
live gate verdict on d03 ("complete §5 RFP structure" applied to an archetype record) that proved the rubric
mismatch. Generation egress stays audited via `preflightAnthropicDirectClient`.

## Known Gaps

- The proper fix for rigorously gating d02/d03 is an **artifact-aware gate** (review each artifact against its
  own expected structure, not d09's) — tracked follow-up.
- d09 on Opus + synchronous gate may approach the ACA request cut; **async generation** is the durable enabler
  for Opus-grade d09 in prod.
