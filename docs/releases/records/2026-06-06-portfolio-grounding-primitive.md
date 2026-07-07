# 2026-06-06 — Portfolio grounding primitive + definitive grounding model

## Release ID

`2026-06-06-portfolio-grounding-primitive`

## Status

`candidate`

## Plain-English Summary

Completes the surface-grounding API with the cross-function shape and records the definitive per-surface grounding model. Adds `groundTenantPortfolio()` — aggregate grounding over the set of functions active in a tenant's portfolio — the architecturally-correct primitive for a cross-function surface (Atlas/Tower), which reasons across the whole portfolio rather than one function. A single function-pack bind would be the wrong model for such a surface; this aggregates the curated depth (union of metrics + regulatory frames + per-function grounding) and surfaces unbound functions honestly.

The grounding model report is finalized: Nexus/Moves binds per-function (done, CI-proven); Sentinel/Source has the seam + carrier (live population pending identity threading); Atlas/Tower uses the new aggregate primitive (live wiring pending `ProgramInstance` function identity); Steward/Setup is a config/loader surface that *enables* grounding by loading data and correctly does **not** bind a function pack.

## Layer Impact

- `global-control-lane`: extends the shared surface-grounding helper with the portfolio primitive and finalizes the grounding model doc. Pure additive library function; no behavior change.

## Client Applicability

- All clients: the primitive is domain-general. Internal only: No. Public/demo only: No. Feature flag: N/A.

## Changes Included

- `src/lib/programs/expert-kernel/grounding/surface-grounding.ts` — `groundTenantPortfolio()` + `TenantPortfolioGrounding` type.
- `src/lib/programs/expert-kernel/__tests__/surface-grounding.test.ts` — +2 tests (aggregate grounding; honest unbound within a portfolio).
- `docs/build/grounding/CORPUS_GROUNDING_REPORT.md` — definitive per-surface grounding model + the one honest remaining step.
- `docs/releases/records/2026-06-06-portfolio-grounding-primitive.md` — this record.

## QA / Validation

**Status: PASS.**

- `npx jest …/surface-grounding.test.ts …/corpus-grounding-battery.test.ts` → **2 suites / 8 tests passing.**
- `npx tsc --noEmit` → **0 non-noise errors** (only the 2 pre-existing missing-optional-dependency errors remain).

## Rollout Plan

Merge to main. Library addition; no deploy step.

## Rollback Plan

Revert the PR. Additive only; clean removal.

## Audit Evidence

- `surface-grounding.ts` (`groundTenantPortfolio`), test, and the finalized report.
- Pairs with #3221 (battery), #3225 (single-function seam + Source wiring), the COST function-pack PR.

## Known Gaps

- **Live population (Source + Tower) is a bounded typed-identity plumbing follow-up**, stated plainly in the report: the surfaces' context objects (`SourceTenantContext`, `ProgramInstance`) do not yet carry `(industry, function)`. The seam (single) and primitive (aggregate) are both shipped and tested; threading the identity is the connect step. Not faked as done.
- **Steward/Setup**: by design does not bind a function pack (it is the loader/config surface). This is the correct role, not a gap.
