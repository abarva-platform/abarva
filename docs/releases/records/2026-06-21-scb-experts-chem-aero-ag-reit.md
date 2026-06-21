# 2026-06-21-scb-experts-chem-aero-ag-reit — Chemicals + Aerospace/Defense + Agribusiness + Real-Estate/REIT experts (faculty 75)

## Release ID

`2026-06-21-scb-experts-chem-aero-ag-reit`

## Status

`candidate` (HELD + STACKED on `claude/scb-experts-wave4-hold` / PR #3806 — do not merge until #3805 deploys + crawl is browser-clean AND #3806 has merged; this branch's base is the wave-4 branch, so merge order is #3806 → this)

## Plain-English Summary

Adds four new-industry Consilium experts — Chemicals & Process Manufacturing, Aerospace & Defense, Agriculture & Agribusiness, and Real Estate & REIT (owner/investor side) — taking the faculty to 75. Adds `chemicals`, `aerospace_defense`, `agriculture`, `real_estate` to the canonical industry list so all four identities type via `satisfies` (no casts). The Real-Estate/REIT expert is the owner/investor/landlord side and is explicitly fenced against the existing `real-estate-workplace` cross-cutting (corporate-occupier) expert. Additive + dormant — consumed only by the default-off router/engine.

## Layer Impact

- **global-control-lane (additive, dormant):** four new `ExpertPack` modules + `registry.ts`; four new values in `CANONICAL_INDUSTRIES`. No runtime/plumbing/agent-login/crawl/deploy files. Consumed only by the (default-off) Shared Context Brain router/engine.

## Client Applicability

- All clients: No runtime change — dormant content + registry.
- Specific clients: None.
- Internal only: Yes — build-time expert content.
- Public/demo only: None.
- Feature flag: None (engine gated by `scb_shared_engine_*`, default OFF).

## Changes Included

- `src/lib/intelligence/expert-pack/packs/chemicals-process-operations.ts`
- `src/lib/intelligence/expert-pack/packs/aerospace-defense-operations.ts`
- `src/lib/intelligence/expert-pack/packs/agribusiness-operations.ts`
- `src/lib/intelligence/expert-pack/packs/real-estate-reit-operations.ts`
- `src/lib/intelligence/expert-pack/registry.ts` (75)
- `src/lib/intelligence/canonical/industry-ai-pattern.ts` (+`chemicals`, +`aerospace_defense`, +`agriculture`, +`real_estate`)

(Stacked on #3806's wave-4 changes; this PR's own diff is the six files above.)

## QA / Validation

Validation: Pass. `tsc --noEmit` clean over all touched files (all four identities via `satisfies ExpertPackIdentity` against the widened canonical union; no casts). `gateExpertPack` PASS (0 blockers) for all 75 registered packs (75 unique ids, no duplicates). Dimensional router (`routeQuestion`) selects each new expert top-1 on its domain question with healthy margins (chemicals 12 vs 9 over discrete-manufacturing · aerospace 15 vs 6 · agribusiness 12 vs 4 · REIT 13 vs 5 — and the occupier `real-estate-workplace` expert does not surface for the REIT query, confirming the fence).

## Rollout Plan

HELD + STACKED. Merge order: #3806 (wave 4) first, then this PR. Merge only after #3805 is deployed and the post-deploy crawl is browser-clean (P0/P1/P2 zero). No runtime rollout — dormant data consumed only by the default-off router/engine.

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

- `gateExpertPack` 0-blocker pass across 75 packs; 75 unique ids, no dup-ids (verify script output).
- Router smoke: 4/4 new experts win their domain question top-1; REIT fenced from the occupier expert.
- `tsc --noEmit` clean on the six touched files (incl. the canonical-industry widening).

## Known Gaps

- AI/parallel-authored, deterministic-gate-passed, no human SME review, no live retrieval proof.
- HELD + STACKED by sequencing constraint, not by a quality gap.
