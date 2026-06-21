# 2026-06-21-scb-experts-logistics-pricing — Logistics + Pricing experts (faculty 56)

## Release ID

`2026-06-21-scb-experts-logistics-pricing`

## Status

`candidate`

## Plain-English Summary

Adds two Consilium experts — Logistics & Transportation Operations (a new industry) and Pricing & Revenue Management (cross-cutting commercial) — taking the faculty to 56. Adds `logistics_transportation` to the canonical industry list so the logistics expert types cleanly (replacing a sub-agent's `as unknown` cast with a `satisfies` check). Additive + dormant.

## Layer Impact

- **global-control-lane (additive, dormant):** two new `ExpertPack` modules + `registry.ts`; one new value in `CANONICAL_INDUSTRIES`. Consumed only by the (default-off) router/engine.

## Client Applicability

- All clients: No runtime change — dormant content + registry.
- Specific clients: None.
- Internal only: Yes — build-time expert content.
- Public/demo only: None.
- Feature flag: None.

## Changes Included

- `src/lib/intelligence/expert-pack/packs/logistics-transportation-operations.ts`
- `src/lib/intelligence/expert-pack/packs/pricing-revenue-management.ts`
- `src/lib/intelligence/expert-pack/registry.ts` (56)
- `src/lib/intelligence/canonical/industry-ai-pattern.ts` (+`logistics_transportation`)

## QA / Validation

Validation: Pass. `tsc --noEmit` clean (incl. the `satisfies ExpertPackIdentity` typing and the canonical-industry widening); no test asserts `CANONICAL_INDUSTRIES` exact contents. `gateExpertPack` PASS (0 blockers) for all 56 registered packs (56 unique ids); router resolves both new domains; W5.2 golden eval still 35/35.

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

## Known Gaps

- AI/parallel-authored, deterministic-gate-passed, no human SME review, no live retrieval proof.

## Audit Evidence

- PR URL: (filled on creation) `claude/scb-parallel-wave` → `main`.
- CI: `npm run release:check`, tsc clean, 56-pack gate + routing + 35/35 golden.
