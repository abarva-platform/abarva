# 2026-06-20-scb-experts-wave3 — Consilium experts wave 3 (8 experts: 4 cross-cutting + 4 industry verticals)

## Release ID

`2026-06-20-scb-experts-wave3`

## Status

`candidate`

## Plain-English Summary

Adds eight more virtual industry experts ("Consilium" packs) to the Shared Context Brain faculty and registers all seventeen. New cross-cutting experts: Cybersecurity & AI-SecOps, Software/Engineering Productivity, Data & Analytics Platform, Sales & Revenue Operations. New industry verticals: Financial Services — Fraud & Financial Crime, Retail — Merchandising & Pricing, Airline — Operations & Revenue Management, Energy & Utilities — Grid & Asset Operations (adds 4 industries to the faculty). **Additive and dormant — no product route serves these to clients yet.**

## Layer Impact

- **global-control-lane (additive, dormant):** eight new `ExpertPack` data modules + the `registry.ts` list. Consumed only by the dormant router/engine; no runtime route imports them, so no client behavior changes.

## Client Applicability

- All clients: No runtime change — dormant content + registry.
- Specific clients: None.
- Internal only: Yes — build-time expert content for later wiring.
- Public/demo only: None.
- Feature flag: None in this release.

## Changes Included

- `src/lib/intelligence/expert-pack/packs/cybersecurity.ts`
- `src/lib/intelligence/expert-pack/packs/engineering-productivity.ts`
- `src/lib/intelligence/expert-pack/packs/data-analytics-platform.ts`
- `src/lib/intelligence/expert-pack/packs/sales-revenue-operations.ts`
- `src/lib/intelligence/expert-pack/packs/financial-services-fraud.ts`
- `src/lib/intelligence/expert-pack/packs/retail-merchandising-pricing.ts`
- `src/lib/intelligence/expert-pack/packs/airline-operations.ts`
- `src/lib/intelligence/expert-pack/packs/energy-grid-operations.ts`
- `src/lib/intelligence/expert-pack/registry.ts` (now lists all 17 experts)

## QA / Validation

- `tsc --noEmit` clean across registry + router + gate + the 8 new packs.
- `gateExpertPack` PASS (0 blockers) for all 17 registered packs; 17 unique ids.
- Router resolves each new domain to its expert (8/8 verified).

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
- Faculty is now 17 of the ~210 target; bulk authoring (W3.2) continues in waves.
- Router precision is v1 keyword-overlap.
- Insurance, manufacturing, pharma/life-sciences, telecom, media, public-sector verticals + more functions remain to author.

## Audit Evidence

- PR URL: (filled on PR creation) `claude/scb-experts-wave3` → `main`.
- CI: `npm run release:check`, `tsc` clean, 17-pack gate + 8-domain routing verification output in PR description.
