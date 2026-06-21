# 2026-06-20-scb-experts-cio — Consilium CIO/Technology-office experts (faculty 53)

## Release ID

`2026-06-20-scb-experts-cio`

## Status

`candidate`

## Plain-English Summary

Adds six CIO/technology-office experts: Enterprise Architecture & Technology Strategy, IT Strategy & Operating Model (CIO advisory), Digital Product Management & Operating Model, Integration & API Management, Identity & Access Management, and Technology Resilience/BCDR & IT Risk. Registers all 53 experts. Rounds out the CIO's agenda alongside the existing IT-estate, cybersecurity, data, and AI experts. **Additive and dormant — no product route serves these yet.**

## Layer Impact

- **global-control-lane (additive, dormant):** six new `ExpertPack` data modules + the `registry.ts` list. Consumed only by the dormant router/engine.

## Client Applicability

- All clients: No runtime change — dormant content + registry.
- Specific clients: None.
- Internal only: Yes — build-time expert content.
- Public/demo only: None.
- Feature flag: None.

## Changes Included

- `src/lib/intelligence/expert-pack/packs/enterprise-architecture.ts`
- `src/lib/intelligence/expert-pack/packs/it-strategy-operating-model.ts`
- `src/lib/intelligence/expert-pack/packs/digital-product-management.ts`
- `src/lib/intelligence/expert-pack/packs/integration-api-management.ts`
- `src/lib/intelligence/expert-pack/packs/identity-access-management.ts`
- `src/lib/intelligence/expert-pack/packs/technology-resilience-bcdr.ts`
- `src/lib/intelligence/expert-pack/registry.ts` (now lists all 53 experts)

## QA / Validation

Validation: Pass. `tsc --noEmit` clean across registry + router + gate + the 6 new packs; `gateExpertPack` PASS (0 blockers) for all 53 registered packs (53 unique ids); router resolves each of the 6 new domains; the W5.2 golden eval still passes 35/35 (no routing regression). Automated unit tests: not run as jest (covered by the inline tsx verification captured here).

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
- Source/Tower module wiring to the faculty is a separate task (Source = engine injection; Tower = server endpoint, Codex W1.4).
- Router precision is v1 keyword-overlap.

## Audit Evidence

- PR URL: (filled on creation) `claude/scb-experts-cio` → `main`.
- CI: `npm run release:check`, `tsc` clean, 53-pack gate + routing + 35/35 golden verification.
