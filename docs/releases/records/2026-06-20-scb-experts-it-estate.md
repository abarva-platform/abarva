# 2026-06-20-scb-experts-it-estate — Consilium IT/technology-estate experts (faculty 47)

## Release ID

`2026-06-20-scb-experts-it-estate`

## Status

`candidate`

## Plain-English Summary

Adds six technology/IT-estate experts that both serve clients' IT agendas and power AbarVa's own modules: IT Outsourcing & Managed Services (Source/sourcing module), IT Spend Optimization & TBM (Tower/IT investment), AI Engineering & Delivery (the AI-build craft), Cloud & Infrastructure Modernization + FinOps, ERP & Enterprise Platform Modernization (Source ERP-SI events), and Application & Digital Modernization (Tower app rationalization). Registers all 47 experts. **Additive and dormant — no product route serves these yet.**

## Layer Impact

- **global-control-lane (additive, dormant):** six new `ExpertPack` data modules + the `registry.ts` list. Consumed only by the dormant router/engine.

## Client Applicability

- All clients: No runtime change — dormant content + registry.
- Specific clients: None.
- Internal only: Yes — build-time expert content (also intended to ground the Source/Tower modules later).
- Public/demo only: None.
- Feature flag: None.

## Changes Included

- `src/lib/intelligence/expert-pack/packs/it-outsourcing-managed-services.ts`
- `src/lib/intelligence/expert-pack/packs/it-spend-optimization-tbm.ts`
- `src/lib/intelligence/expert-pack/packs/ai-engineering-delivery.ts`
- `src/lib/intelligence/expert-pack/packs/cloud-infrastructure-modernization.ts`
- `src/lib/intelligence/expert-pack/packs/erp-platform-modernization.ts`
- `src/lib/intelligence/expert-pack/packs/application-modernization.ts`
- `src/lib/intelligence/expert-pack/registry.ts` (now lists all 47 experts)

## QA / Validation

Validation: Pass. `tsc --noEmit` clean across registry + router + gate + the 6 new packs; `gateExpertPack` PASS (0 blockers) for all 47 registered packs (47 unique ids); router resolves each of the 6 new domains; the W5.2 golden eval still passes 35/35 (no routing regression). Automated unit tests: not run as jest (covered by the inline tsx verification captured here).

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
- Intended to ground the Source/Tower modules, but that wiring (Source/Tower → faculty) is a later integration, not in this release.
- Router precision is v1 keyword-overlap.

## Audit Evidence

- PR URL: (filled on creation) `claude/scb-experts-it` → `main`.
- CI: `npm run release:check`, `tsc` clean, 47-pack gate + routing + 35/35 golden verification.
