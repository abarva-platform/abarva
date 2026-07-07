# 2026-06-21-scb-experts-automotive-esg-service — Automotive + ESG + Field/Customer Service experts (faculty 59)

## Release ID

`2026-06-21-scb-experts-automotive-esg-service`

## Status

`candidate`

## Plain-English Summary

Adds three Consilium experts — Automotive Industry Operations (a new industry: OEM/tier-1/dealer/SDV/EV), ESG & Sustainability (cross-cutting), and Field Service & Customer Service Operations (cross-cutting) — taking the faculty to 59. Adds `automotive` to the canonical industry list so the automotive expert types cleanly via a `satisfies` check (replacing a sub-agent's `as unknown` cast). Additive + dormant — consumed only by the default-off router/engine.

## Layer Impact

- **global-control-lane (additive, dormant):** three new `ExpertPack` modules + `registry.ts`; one new value in `CANONICAL_INDUSTRIES`. Consumed only by the (default-off) Shared Context Brain router/engine.

## Client Applicability

- All clients: No runtime change — dormant content + registry.
- Specific clients: None.
- Internal only: Yes — build-time expert content.
- Public/demo only: None.
- Feature flag: None (engine gated by `scb_shared_engine_*`, default OFF).

## Changes Included

- `src/lib/intelligence/expert-pack/packs/automotive-operations.ts`
- `src/lib/intelligence/expert-pack/packs/esg-sustainability.ts`
- `src/lib/intelligence/expert-pack/packs/field-customer-service-operations.ts`
- `src/lib/intelligence/expert-pack/registry.ts` (59)
- `src/lib/intelligence/canonical/industry-ai-pattern.ts` (+`automotive`)

## QA / Validation

Validation: Pass. `tsc --noEmit` clean over all touched files (incl. the `satisfies ExpertPackIdentity` typing and the canonical-industry widening; the only narrow-include diagnostics were the known `process`/node-types scoping artifact, gone with `types:["node"]`). `gateExpertPack` PASS (0 blockers) for all 59 registered packs (59 unique ids, no duplicates). Dimensional router (`routeQuestion`) selects each new expert top-1 on its domain question with healthy margins (automotive 10 vs 4, ESG 9 vs 3, field-service 9 vs 6); expert-pack store test green.

## Rollout Plan

Merge to `main`. No runtime rollout — dormant data consumed only by the default-off router/engine.

## Deployment Authority

Not applicable — additive build-time data, no default-on runtime call sites.

- Repo-owned deploy workflow: n/a
- Shared runtime mutators: none
- Approved image digest: n/a
- ACA runtime invariant: n/a
- Worker image invariant: n/a
- Feature/env flag update path: n/a
- Live signed-in proof required: No.

## Rollback Plan

Revert the PR — no runtime call sites, no migration.

## Audit Evidence

- `gateExpertPack` 0-blocker pass across 59 packs; 59 unique ids, no dup-ids (verify script output).
- Router smoke: 3/3 new experts win their domain question top-1.
- `tsc --noEmit` clean on the five touched files.

## Known Gaps

- AI/parallel-authored, deterministic-gate-passed, no human SME review, no live retrieval proof.
