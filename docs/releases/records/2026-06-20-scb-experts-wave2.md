# 2026-06-20-scb-experts-wave2 — Consilium experts wave 2 (Treasury, Legal AI, AI Governance, Supply Chain)

## Release ID

`2026-06-20-scb-experts-wave2`

## Status

`candidate`

## Plain-English Summary

Adds four more virtual industry experts ("Consilium" packs) to the Shared Context Brain faculty — Treasury Transformation, Legal/Contract AI, AI Governance & Model Risk, and Supply Chain Transformation — and registers all nine experts so the dimensional router can summon them. **Additive and dormant — no product route serves these to clients yet** (the engine is unwired pending the flag-gated wiring slice). These are reference-quality expert definitions plus a registry update consumed only by the (also-dormant) router.

## Layer Impact

- **global-control-lane (additive, dormant):** four new `ExpertPack` data modules + the `registry.ts` list. Consumed only by the dormant router/engine; no runtime route imports them, so no client behavior changes.

## Client Applicability

- All clients: No runtime change — dormant content + registry.
- Specific clients: None (though Treasury and Legal AI were prompted by Lakeshore demand signals, nothing is wired to Lakeshore).
- Internal only: Yes — build-time expert content used by later wiring.
- Public/demo only: None.
- Feature flag: None in this release.

## Changes Included

- `src/lib/intelligence/expert-pack/packs/treasury-transformation.ts`
- `src/lib/intelligence/expert-pack/packs/legal-contract-ai.ts`
- `src/lib/intelligence/expert-pack/packs/ai-governance.ts`
- `src/lib/intelligence/expert-pack/packs/supply-chain-transformation.ts`
- `src/lib/intelligence/expert-pack/registry.ts` (now lists all 9 experts)

## QA / Validation

- `tsc --noEmit` clean across registry + router + gate + the 4 new packs.
- `gateExpertPack` PASS (0 blockers) for all 9 registered packs; 9 unique ids.
- Router resolves each new domain to its expert (Kyriba/treasury → treasury; contract review → legal; govern AI models → ai-governance; demand forecast/OTIF → supply-chain).

## Rollout Plan

Merge to `main`. No runtime rollout — packs are dormant data consumed only by the unwired router/engine.

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

- AI/parallel-authored, deterministic-gate-passed, but no human SME review (per the AI-gate-only decision) and no live retrieval/answer proof.
- Faculty is now 9 of the ~210 target; bulk authoring (W3.2) still pending an explicit go.
- Router precision is v1 keyword-overlap.

## Audit Evidence

- PR URL: (filled on PR creation) `claude/scb-experts-wave2` → `main`.
- CI: `npm run release:check`, `tsc` clean, 9-pack gate + routing verification output in PR description.
