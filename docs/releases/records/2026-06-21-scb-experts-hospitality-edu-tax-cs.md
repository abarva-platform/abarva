# 2026-06-21-scb-experts-hospitality-edu-tax-cs — Hospitality + Higher-Ed + Tax + Customer-Success experts (faculty 67)

## Release ID

`2026-06-21-scb-experts-hospitality-edu-tax-cs`

## Status

`candidate`

## Plain-English Summary

Adds four Consilium experts — Hospitality & Lodging Operations and Higher Education & Research Institutions (two new industries), plus Corporate Tax and Customer Success & Account Management (two cross-cutting functions) — taking the faculty to 67. Adds `hospitality` and `higher_education` to the canonical industry list so the two industry experts type via `satisfies` (no casts). Additive + dormant — consumed only by the default-off router/engine.

## Layer Impact

- **global-control-lane (additive, dormant):** four new `ExpertPack` modules + `registry.ts`; two new values in `CANONICAL_INDUSTRIES` (`hospitality`, `higher_education`). Consumed only by the (default-off) Shared Context Brain router/engine.

## Client Applicability

- All clients: No runtime change — dormant content + registry.
- Specific clients: None.
- Internal only: Yes — build-time expert content.
- Public/demo only: None.
- Feature flag: None (engine gated by `scb_shared_engine_*`, default OFF).

## Changes Included

- `src/lib/intelligence/expert-pack/packs/hospitality-lodging-operations.ts`
- `src/lib/intelligence/expert-pack/packs/higher-education-operations.ts`
- `src/lib/intelligence/expert-pack/packs/corporate-tax.ts`
- `src/lib/intelligence/expert-pack/packs/customer-success-account-management.ts`
- `src/lib/intelligence/expert-pack/registry.ts` (67)
- `src/lib/intelligence/canonical/industry-ai-pattern.ts` (+`hospitality`, +`higher_education`)

## QA / Validation

Validation: Pass. `tsc --noEmit` clean over all touched files (both industry identities via `satisfies ExpertPackIdentity` against the widened canonical union; no casts; no test asserts `CANONICAL_INDUSTRIES` exact contents). `gateExpertPack` PASS (0 blockers) for all 67 registered packs (67 unique ids, no duplicates). Dimensional router (`routeQuestion`) selects each new expert top-1 on its domain question with healthy margins (hospitality 10 vs 5 · higher-ed 12 vs 4 · tax 10 vs 3 · customer-success 10 vs 5).

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

- `gateExpertPack` 0-blocker pass across 67 packs; 67 unique ids, no dup-ids (verify script output).
- Router smoke: 4/4 new experts win their domain question top-1.
- `tsc --noEmit` clean on the six touched files (incl. the canonical-industry widening).

## Known Gaps

- AI/parallel-authored, deterministic-gate-passed, no human SME review, no live retrieval proof.
