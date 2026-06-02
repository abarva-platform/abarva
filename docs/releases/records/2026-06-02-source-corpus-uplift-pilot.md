# 2026-06-02-source-corpus-uplift-pilot — Source Pricing and BAFO Corpus Pilot

## Release ID

`2026-06-02-source-corpus-uplift-pilot`

## Status

`candidate`

## Plain-English Summary

This release adds a 204-pattern pilot Source knowledge pack for Apex Retail AMS sourcing. The pack gives Source concrete sourcing expertise around pricing normalization, vendor gaming, sourcing archetypes, failure modes, BAFO negotiation levers, contract value-protection clauses, retail IT operating constraints, vendor-profile evidence requirements, benchmark governance, corpus visibility doctrine, CFO-auditable value proof, RFP/evaluation criteria, and Source artifact quality gates. It is designed to make Apex AMS pricing and BAFO guidance more specific without inventing savings, vendor posture, or numeric benchmark ranges.

## Layer Impact

- `global-control-lane`: Adds deterministic read-model wiring for Source pricing and BAFO outputs. The logic remains dependency-free and does not call external AI or data services.
- `client-data-lane`: Applies the pilot corpus only to the Apex AMS managed-services event shape. It does not write tenant data, load production databases, or claim tenant-specific savings.
- `experimental`: This is a pilot corpus slice, not the full 1,000+ pattern sourcing genome. SME review and production retrieval loading remain separate release steps.

## Client Applicability

- All clients: none directly.
- Specific clients: Apex Retail AMS event shape receives pilot pattern context in seeded/read-model surfaces.
- Internal only: readiness-plan tracking workbook was updated locally for Anand.
- Public/demo only: none.
- Feature flag: none.

## Changes Included

- Added `src/lib/intelligence/seed-patterns-sourcing-pricing-gaming.ts` with 12 Source-1/Retail-1 pilot patterns.
- Added `src/lib/intelligence/seed-patterns-sourcing-bafo-contracts.ts` with 12 Source-2 BAFO/contract-lever pilot patterns.
- Added `src/lib/intelligence/seed-patterns-sourcing-commercial-levers.ts` with 18 additional commercial lever and clause-control patterns.
- Added `src/lib/intelligence/seed-patterns-sourcing-retail-it.ts` with 20 retail IT sourcing overlay patterns.
- Added `src/lib/intelligence/seed-patterns-sourcing-archetypes-failure-modes.ts` with 20 sourcing archetype and vendor failure-mode patterns.
- Added `src/lib/intelligence/seed-patterns-sourcing-vendor-profile-requirements.ts` with 20 source-basis-required vendor profile shells for major IT services and advisory vendors.
- Added `src/lib/intelligence/seed-patterns-sourcing-benchmark-governance.ts` with 16 benchmark/rate-card evidence guardrails that prevent unsupported numeric ranges.
- Added `src/lib/intelligence/seed-patterns-sourcing-corpus-governance.ts` with 16 corpus visibility and source-basis governance patterns.
- Added `src/lib/intelligence/seed-patterns-sourcing-value-proof.ts` with 20 CFO-auditable value-proof patterns.
- Added `src/lib/intelligence/seed-patterns-sourcing-rfp-evaluation.ts` with 24 RFP and evaluation criteria patterns.
- Added `src/lib/intelligence/seed-patterns-sourcing-artifact-templates.ts` with 26 Source artifact quality-gate patterns.
- Added `src/lib/source/source-corpus-uplift.ts` to adapt the pilot corpus into Source pattern sections, pricing traps, BAFO asks, and assumption locks.
- Updated `src/lib/intelligence/seed-patterns-sourcing.ts` to include the new pilot pack in the loaded corpus.
- Updated `src/lib/source/mock-seed.ts` so Apex AMS receives relevant pattern sections.
- Updated `src/lib/source/pricing-normalization.ts` so Apex AMS vendor rows surface corpus-backed commercial traps.
- Updated `src/lib/source/bafo-negotiation.ts` so Apex AMS BAFO plans include corpus-backed asks and assumption locks.
- Updated `src/lib/source/index.ts` exports.
- Added `src/lib/source/__tests__/source-corpus-uplift.test.ts`.
- Updated `tests/intelligence/loader.test.ts` corpus count and pilot pattern assertions.
- Updated `/Users/anand/Downloads/ABARVA_PILOT_READINESS_PLAN.xlsx` with rows T358-T363 for corpus uplift execution tracking.

## QA / Validation

- `npx jest tests/intelligence/loader.test.ts src/lib/source/__tests__/source-corpus-uplift.test.ts src/__tests__/integration/source/source-pricing-normalization.test.ts src/__tests__/integration/source/source-bafo-negotiation.test.ts --runInBand` passed: 4 suites, 29 tests.
- Jest printed pre-existing duplicate manual mock warnings for `mdast-util-from-markdown`, `mdast-util-gfm`, and `micromark-extension-gfm`; they did not block the focused suite.
- Excel readiness workbook was reopened from disk after update. Rows T354-T357 were preserved, rows T358-T363 were present, dashboard totals showed 363 total tasks, and formula-error scan found no matches.

## Rollout Plan

Merge this branch after code review and focused validation. The corpus pack becomes active in deterministic seeded/read-model Source surfaces after deployment. No production database migration, Clerk operation, or data-plane load is included in this release.

## Rollback Plan

Revert the commit that adds the pilot corpus pack and read-model wiring. Because this release does not include migrations or production DB writes, rollback is a code revert plus redeploy.

## Audit Evidence

- Focused Jest command and passing output in local Codex run.
- Updated workbook: `/Users/anand/Downloads/ABARVA_PILOT_READINESS_PLAN.xlsx`.
- Workbook backup: `/Users/anand/Downloads/ABARVA_PILOT_READINESS_PLAN.backup-before-source-corpus-2026-06-02.xlsx`.
- New regression test: `src/lib/source/__tests__/source-corpus-uplift.test.ts`.

## Known Gaps

- Full 1,000+ pattern sourcing corpus is not authored yet.
- SME review is still required before treating the pilot pack as authoritative sourcing doctrine.
- Pilot patterns are not loaded into Azure/Postgres retrieval substrate in this release.
- Source chat prompt-time injection is not fully wired beyond deterministic event context/read-model surfaces.
- CFO-auditable savings proof still requires tenant vendor pricing, contract evidence, BAFO deltas, and value-ledger states.
- Apex and SkyHarbor L6 browser crawls must be rerun after deployment and data/evidence readiness.
