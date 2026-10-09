# 2026-06-21-scb-experts-cre-channel-km-rd — Real-Estate/Workplace + Partner/Channel + Knowledge-Mgmt + R&D/Innovation experts (faculty 71)

## Release ID

`2026-06-21-scb-experts-cre-channel-km-rd`

## Status

`candidate` (HELD — do not merge until #3805 deploys + post-deploy crawl is browser-clean; avoids a second in-flight `registry.ts` wave during an active deploy)

## Plain-English Summary

Adds four cross-cutting Consilium experts — Corporate Real Estate & Workplace, Partner/Channel & Ecosystem Management, Knowledge Management & Enterprise Search, and R&D & Innovation Portfolio Management — taking the faculty to 71. All four are cross-cutting (no industry), so there is NO canonical-industry change. Additive + dormant — consumed only by the default-off router/engine.

## Layer Impact

- **global-control-lane (additive, dormant):** four new `ExpertPack` modules + `registry.ts`. No canonical-industry change, no runtime/plumbing/agent-login/crawl/deploy files. Consumed only by the (default-off) Shared Context Brain router/engine.

## Client Applicability

- All clients: No runtime change — dormant content + registry.
- Specific clients: None.
- Internal only: Yes — build-time expert content.
- Public/demo only: None.
- Feature flag: None (engine gated by `scb_shared_engine_*`, default OFF).

## Changes Included

- `src/lib/intelligence/expert-pack/packs/real-estate-workplace.ts`
- `src/lib/intelligence/expert-pack/packs/partner-channel-ecosystem.ts`
- `src/lib/intelligence/expert-pack/packs/knowledge-management.ts`
- `src/lib/intelligence/expert-pack/packs/rd-innovation-portfolio.ts`
- `src/lib/intelligence/expert-pack/registry.ts` (71)

## QA / Validation

Validation: Pass. `tsc --noEmit` clean over all touched files (all four identities are cross-cutting, typed via `satisfies`; no casts). `gateExpertPack` PASS (0 blockers) for all 71 registered packs (71 unique ids, no duplicates). Dimensional router (`routeQuestion`) selects each new expert top-1 on its domain question with healthy margins (real-estate 12 vs 6 · partner-channel 9 vs 6 · knowledge-mgmt 10 vs 6 · R&D 8 vs 4).

## Rollout Plan

HELD. Merge to `main` only after #3805 is deployed and the post-deploy crawl is browser-clean (P0/P1/P2 zero), to avoid two concurrent `registry.ts` waves during an active deploy. No runtime rollout — dormant data consumed only by the default-off router/engine.

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

- `gateExpertPack` 0-blocker pass across 71 packs; 71 unique ids, no dup-ids (verify script output).
- Router smoke: 4/4 new experts win their domain question top-1.
- `tsc --noEmit` clean on the five touched files.

## Known Gaps

- AI/parallel-authored, deterministic-gate-passed, no human SME review, no live retrieval proof.
- HELD by sequencing constraint, not by a quality gap.
