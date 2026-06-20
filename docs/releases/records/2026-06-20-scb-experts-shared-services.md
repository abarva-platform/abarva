# 2026-06-20-scb-experts-shared-services — Consilium shared-services / corporate-function bench

## Release ID

`2026-06-20-scb-experts-shared-services`

## Status

`candidate`

## Plain-English Summary

Builds out the corporate shared-services bench — the functions an enterprise innovation/value office actually serves (Morgan Street Phase 1). Adds six experts and registers all thirty-five: Finance/FP&A & Controllership (the value-attestation engine), Investments / Corporate Development & M&A (deal & portfolio — the growth engine for a holding company), Human Capital / HR, Procurement & Strategic Sourcing, Enterprise Risk / Compliance / Internal Audit, and IT Operations / Service Management. Combined with existing experts (Legal, Treasury, Cybersecurity, AI Governance, Value Office), the Value Office's slide-9 delivery partners are 6/6 covered. All generic/reusable. **Additive and dormant — no product route serves these to clients yet.**

## Layer Impact

- **global-control-lane (additive, dormant):** six new `ExpertPack` data modules + the `registry.ts` list. Consumed only by the dormant router/engine; no runtime route imports them.

## Client Applicability

- All clients: No runtime change — dormant content + registry.
- Specific clients: None (motivated by the Morgan Street Phase-1 shared-services focus, but the experts are generic; nothing is wired to any tenant).
- Internal only: Yes — build-time expert content for later wiring + corpus packs.
- Public/demo only: None.
- Feature flag: None in this release.

## Changes Included

- `src/lib/intelligence/expert-pack/packs/finance-fpa-controllership.ts`
- `src/lib/intelligence/expert-pack/packs/corporate-development-ma.ts`
- `src/lib/intelligence/expert-pack/packs/human-capital-hr.ts`
- `src/lib/intelligence/expert-pack/packs/procurement-strategic-sourcing.ts`
- `src/lib/intelligence/expert-pack/packs/enterprise-risk-compliance-audit.ts`
- `src/lib/intelligence/expert-pack/packs/it-operations-itsm.ts`
- `src/lib/intelligence/expert-pack/registry.ts` (now lists all 35 experts)

## QA / Validation

Validation: Pass. `tsc --noEmit` clean across registry + router + gate + the 6 new packs; `gateExpertPack` PASS (0 blockers) for all 35 registered packs (35 unique ids); router resolves each of the 6 new domains; Morgan slide-9 delivery-partner bench check = 6/6 (Finance, Treasury, Legal, Investment, HR, Security/Risk). Automated unit tests: not-run (dormant data, no executable path).

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

- AI/parallel-authored, deterministic-gate-passed, no human SME review and no live retrieval/answer proof.
- Morgan corpus context pack + Surekha-facing showcase still pending (follow-ups).
- Router precision is v1 keyword-overlap.

## Audit Evidence

- PR URL: (filled on PR creation) `claude/scb-experts-shared-services` → `main`.
- CI: `npm run release:check`, `tsc` clean, 35-pack gate + routing + slide-9-bench verification output in PR description.
