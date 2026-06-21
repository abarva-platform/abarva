# 2026-06-21-scb-experts-fs-data — Banking/Payments + Wealth/Asset + Data-Governance + Data-Privacy experts (faculty 63)

## Release ID

`2026-06-21-scb-experts-fs-data`

## Status

`candidate`

## Plain-English Summary

Adds four Consilium experts — Banking & Payments Operations and Wealth & Asset Management (both `financial_services*` industries — directly relevant to the FirstCapital bank tenant), plus two universal CIO cross-cutting domains, Data Governance & MDM and Data Privacy & Protection — taking the faculty to 63. Both FS industries are already canonical, so all four identities type via `satisfies` (no casts, no canonical edits). Additive + dormant — consumed only by the default-off router/engine.

## Layer Impact

- **global-control-lane (additive, dormant):** four new `ExpertPack` modules + `registry.ts`. No canonical-industry change. Consumed only by the (default-off) Shared Context Brain router/engine.

## Client Applicability

- All clients: No runtime change — dormant content + registry.
- Specific clients: None (Banking/Payments + Wealth experts are FirstCapital-relevant but not wired to any tenant).
- Internal only: Yes — build-time expert content.
- Public/demo only: None.
- Feature flag: None (engine gated by `scb_shared_engine_*`, default OFF).

## Changes Included

- `src/lib/intelligence/expert-pack/packs/banking-payments-operations.ts`
- `src/lib/intelligence/expert-pack/packs/wealth-asset-management.ts`
- `src/lib/intelligence/expert-pack/packs/data-governance-mdm.ts`
- `src/lib/intelligence/expert-pack/packs/data-privacy-protection.ts`
- `src/lib/intelligence/expert-pack/registry.ts` (63)

## QA / Validation

Validation: Pass. `tsc --noEmit` clean over all touched files (all four identities via `satisfies ExpertPackIdentity`, no casts). `gateExpertPack` PASS (0 blockers) for all 63 registered packs (63 unique ids, no duplicates). Dimensional router (`routeQuestion`) selects each new expert top-1 on its domain question with healthy margins (banking 10 vs 6 over the existing FS-fraud expert · wealth 8 vs 3 · data-governance 12 vs 6 · data-privacy 9 vs 3).

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

- `gateExpertPack` 0-blocker pass across 63 packs; 63 unique ids, no dup-ids (verify script output).
- Router smoke: 4/4 new experts win their domain question top-1.
- `tsc --noEmit` clean on the five touched files.

## Known Gaps

- AI/parallel-authored, deterministic-gate-passed, no human SME review, no live retrieval proof.
