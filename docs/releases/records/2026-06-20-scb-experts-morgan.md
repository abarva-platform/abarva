# 2026-06-20-scb-experts-morgan — Consilium experts for Morgan Street fit (Value Office + 3 opco domains)

## Release ID

`2026-06-20-scb-experts-morgan`

## Status

`candidate`

## Plain-English Summary

Adds four Consilium experts that complete AbarVa's fit for the Morgan Street Holdings "Enterprise Innovation, AI Enablement & Value Office" opportunity, and registers all twenty-nine. New: Enterprise Value Office & AI Enablement (the deck's method as a first-class expert — the keystone), Consumer Products / CPG Operations (maps to Stanley), Foodservice & Hospitality Operations (maps to Continental), Marketing & Brand (maps to tms). With the existing faculty, Morgan's Phase-1 Corporate Shared Services and all four operating companies are now covered. All four experts are generic/reusable, not Morgan-specific. **Additive and dormant — no product route serves these to clients yet.**

## Layer Impact

- **global-control-lane (additive, dormant):** four new `ExpertPack` data modules + the `registry.ts` list. Consumed only by the dormant router/engine; no runtime route imports them.

## Client Applicability

- All clients: No runtime change — dormant content + registry.
- Specific clients: None (motivated by the Morgan Street pilot, but the experts are generic and nothing is wired to any tenant).
- Internal only: Yes — build-time expert content for later wiring + the Morgan corpus pack.
- Public/demo only: None.
- Feature flag: None in this release.

## Changes Included

- `src/lib/intelligence/expert-pack/packs/value-office-ai-enablement.ts`
- `src/lib/intelligence/expert-pack/packs/consumer-products-operations.ts`
- `src/lib/intelligence/expert-pack/packs/foodservice-hospitality-operations.ts`
- `src/lib/intelligence/expert-pack/packs/marketing-brand.ts`
- `src/lib/intelligence/expert-pack/registry.ts` (now lists all 29 experts)

## QA / Validation

Validation: Pass. `tsc --noEmit` clean across registry + router + gate + the 4 new packs; `gateExpertPack` PASS (0 blockers) for all 29 registered packs (29 unique ids); router resolves each of the 4 new domains to its expert; Morgan-relevant coverage check = 10/10. Automated unit tests: not-run (dormant data, no executable path).

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
- The Morgan Street corpus pack (tenant context: enterprise profile + 4 opcos + Value Office operating model) and the Surekha-facing showcase are follow-ups, not in this release.
- Router precision is v1 keyword-overlap.

## Audit Evidence

- PR URL: (filled on PR creation) `claude/scb-experts-morgan` → `main`.
- CI: `npm run release:check`, `tsc` clean, 29-pack gate + routing + Morgan-coverage verification output in PR description.
