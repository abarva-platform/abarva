# 2026-06-20-scb-experts-industries — Consilium new-industry experts (faculty 41)

## Release ID

`2026-06-20-scb-experts-industries`

## Status

`candidate`

## Plain-English Summary

Extends the faculty's breadth into six industries it did not cover: Insurance (underwriting & claims), Manufacturing (operations & smart factory), Pharma/Life Sciences (R&D & commercial), Telecom (network & customer ops), Media & Entertainment (content & audience), and Public Sector (citizen services). Registers all 41 experts. Kept as cross-cutting-domain to avoid touching the shared `CanonicalIndustry` enum. All generic/reusable. **Additive and dormant — no product route serves these to clients yet.**

## Layer Impact

- **global-control-lane (additive, dormant):** six new `ExpertPack` data modules + the `registry.ts` list. Consumed only by the dormant router/engine.

## Client Applicability

- All clients: No runtime change — dormant content + registry.
- Specific clients: None.
- Internal only: Yes — build-time expert content.
- Public/demo only: None.
- Feature flag: None.

## Changes Included

- `src/lib/intelligence/expert-pack/packs/insurance-underwriting-claims.ts`
- `src/lib/intelligence/expert-pack/packs/manufacturing-operations.ts`
- `src/lib/intelligence/expert-pack/packs/life-sciences-rd-commercial.ts`
- `src/lib/intelligence/expert-pack/packs/telecom-network-operations.ts`
- `src/lib/intelligence/expert-pack/packs/media-entertainment.ts`
- `src/lib/intelligence/expert-pack/packs/public-sector-citizen-services.ts`
- `src/lib/intelligence/expert-pack/registry.ts` (now lists all 41 experts)

## QA / Validation

Validation: Pass. `tsc --noEmit` clean across registry + router + gate + the 6 new packs; `gateExpertPack` PASS (0 blockers) for all 41 registered packs (41 unique ids); router resolves each of the 6 new domains; the W5.2 golden eval still passes 35/35 (new experts did not regress existing routing). Automated unit tests: not run as jest (covered by the inline tsx verification captured here).

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
- New industries are modeled as cross-cutting-domain rather than first-class `CanonicalIndustry` values; promoting them is a later optional enum change.
- Router precision is v1 keyword-overlap.

## Audit Evidence

- PR URL: (filled on creation) `claude/scb-experts-industries` → `main`.
- CI: `npm run release:check`, `tsc` clean, 41-pack gate + routing + 35/35 golden verification.
