# 2026-06-20-scb-experts-wave4-verticals — Consilium wave 4: vertical depth (healthcare, airline, retail)

## Release ID

`2026-06-20-scb-experts-wave4-verticals`

## Status

`candidate`

## Plain-English Summary

Deepens the three priority verticals (healthcare, airline, retail) instead of adding new industries — because they map to the demo tenants (Meridian, SkyHarbor, Apex) and pilot targets. Adds eight industry-specific functional experts and registers all twenty-five. New: Healthcare Care Management & VBC, Patient Access & Digital Front Door, Pharmacy Operations; Airline Network & Schedule Planning, Loyalty & Customer, Ground & Airport Operations; Retail Store Operations, Omnichannel Fulfillment. **Additive and dormant — no product route serves these to clients yet.**

## Layer Impact

- **global-control-lane (additive, dormant):** eight new `ExpertPack` data modules + the `registry.ts` list. Consumed only by the dormant router/engine; no runtime route imports them.

## Client Applicability

- All clients: No runtime change — dormant content + registry.
- Specific clients: None (verticals align to Meridian/SkyHarbor/Apex demo tenants but nothing is wired).
- Internal only: Yes — build-time expert content for later wiring.
- Public/demo only: None.
- Feature flag: None in this release.

## Changes Included

- `src/lib/intelligence/expert-pack/packs/healthcare-care-management-vbc.ts`
- `src/lib/intelligence/expert-pack/packs/healthcare-patient-access.ts`
- `src/lib/intelligence/expert-pack/packs/healthcare-pharmacy-operations.ts`
- `src/lib/intelligence/expert-pack/packs/airline-network-planning.ts`
- `src/lib/intelligence/expert-pack/packs/airline-loyalty-customer.ts`
- `src/lib/intelligence/expert-pack/packs/airline-ground-operations.ts`
- `src/lib/intelligence/expert-pack/packs/retail-store-operations.ts`
- `src/lib/intelligence/expert-pack/packs/retail-omnichannel-fulfillment.ts`
- `src/lib/intelligence/expert-pack/registry.ts` (now lists all 25 experts)

## QA / Validation

Validation: Pass. `tsc --noEmit` clean across registry + router + gate + the 8 new packs; `gateExpertPack` PASS (0 blockers) for all 25 registered packs (25 unique ids); router resolves each of the 8 new vertical domains to its expert (8/8 verified). Automated unit tests: not-run (dormant data, no executable path).

## Rollout Plan

Merge to `main`. No runtime rollout — dormant data consumed only by the unwired router/engine.

## Deployment Authority

Not applicable — additive build-time data with no runtime call sites.

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

- AI/parallel-authored, deterministic-gate-passed, no human SME review (per AI-gate-only decision) and no live retrieval/answer proof.
- Verticals not yet complete: healthcare/airline/retail still have functions to add (quality/safety, clinical supply, nursing; MRO, cargo, crew; e-commerce, marketing, customer service).
- Router precision is v1 keyword-overlap.

## Audit Evidence

- PR URL: (filled on PR creation) `claude/scb-experts-wave4` → `main`.
- CI: `npm run release:check`, `tsc` clean, 25-pack gate + 8-domain routing verification output in PR description.
