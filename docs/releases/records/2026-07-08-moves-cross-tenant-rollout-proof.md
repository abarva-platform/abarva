# 2026-07-08-moves-cross-tenant-rollout-proof — Moves cross-tenant flag proof + dormant-flag enrollment

## Release ID

`2026-07-08-moves-cross-tenant-rollout-proof`

## Status

`candidate`

## Plain-English Summary

Moves (Strategic Moves) is functionally complete end-to-end — data layer, P0–P5 workflow, gates, deliverable generation, and agent chat all work — but every advanced capability had only ever been proven on one tenant each. This release does not add features. It moves five existing, already-shipped Moves feature flags along the controlled-rollout ladder (single-tenant proof → cross-tenant proof) by adding tenants to their `includeTenants` allowlists in `src/lib/features/registry.ts`:

- `moves_phase_workspace_v2` and `moves_pattern_assembly` — previously Lakeshore-only, now also enabled for SkyHarbor, to prove the phase-workspace guidance and Claude pattern-assembly are not overfit to Lakeshore's Legal Contract Intake use case.
- `moves_orchestrated_deliverables` — previously SkyHarbor-only, now also enabled for Lakeshore, to prove the orchestrated board-grade deliverable path is not overfit to SkyHarbor's use case.
- `moves_workforce_economics` and `moves_decision_storytelling` — previously built and tested but enabled for zero tenants (dormant). Now enabled for Lakeshore only, as a first proof tenant, per the controlled-rollout plan (Step 2).

No code paths changed — only tenant allowlists. Every flag remains `tenant` policy (default OFF for everyone else); nothing is platform-wide or default-on. Strict gate-approval mode (`GATE_APPROVAL_STRICT_MODE`) was deliberately left untouched — that decision (self-approve vs strict for production tenants) is called out as a follow-up governance decision, not flipped in this release.

## Layer Impact

- **global-control-lane**: `src/lib/features/registry.ts` is shared control-plane code (the canonical flag registry read by every tenant/request). The edit is additive-only to `includeTenants` arrays; no flag's `policy` or gating logic changed.
- No schema, migration, or route-handler changes.

## Client Applicability

- All clients: No — every touched flag remains tenant-policy (default OFF).
- Specific clients: SkyHarbor (`moves_phase_workspace_v2`, `moves_pattern_assembly` newly added); Lakeshore (`moves_orchestrated_deliverables`, `moves_workforce_economics`, `moves_decision_storytelling` newly added).
- Internal only: No.
- Public/demo only: No.
- Feature flag: `moves_phase_workspace_v2`, `moves_pattern_assembly`, `moves_orchestrated_deliverables`, `moves_workforce_economics`, `moves_decision_storytelling` (all `tenant` policy, all pre-existing).

## Changes Included

- `src/lib/features/registry.ts` — five `includeTenants` array edits (see above); summaries updated to record the 2026-07-08 cross-tenant/proof-mode enrollment and why.
- `docs/releases/records/2026-07-08-moves-cross-tenant-rollout-proof.md` (this record).
- `reports/moves-controlled-rollout-readiness-2026-07-08.md` (rollout matrix + readiness report).

## QA / Validation

- `npx jest src/lib/features/__tests__/is-feature-enabled.test.ts src/components/strategic-moves/phase-workspace/__tests__ src/lib/programs/phase-templates --runInBand` — 11 suites / 103 tests passed.
- `NODE_OPTIONS='--max-old-space-size=6144' ./node_modules/.bin/tsc --noEmit --pretty false --incremental false` — 0 errors (full repo, confirms baseline health from PR #4584 holds).
- `npx eslint src/lib/features/registry.ts` — 0 issues.
- `npm run release:check` — see PR for result.
- Live signed-in browser smoke test — see Audit Evidence; run post-deploy for both Lakeshore and SkyHarbor.

## Rollout Plan

Standard Code-lane PR → squash-merge to `main` → `aca-main-deploy.yml` auto-builds and deploys to `ca-abarva-web-lab-eastus` (no manual `az` commands, no manual traffic shift). Flag changes take effect immediately on the new revision for the newly-included tenants only; no migration, no worker job, no env var change.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml` (unchanged; this PR does not touch CI/CD config).
- Shared runtime mutators: None — no `az containerapp update` run by this change; deploy happens only via the repo-owned workflow on merge.
- Approved image digest: whatever `aca-main-deploy.yml` produces for this merge commit (verify post-merge per runtime invariant below).
- ACA runtime invariant: to be confirmed post-deploy — template image, 100%-traffic revision image, and worker job images must match the digest built from this merge commit.
- Worker image invariant: N/A (no worker-job code touched).
- Feature/env flag update path: in-code `includeTenants` array, shipped via normal deploy — no separate env var flip required for this change (env allowlist vars mentioned in flag summaries are an alternate override path, not used here).
- Live signed-in proof required: Yes — signed-in Lakeshore and signed-in SkyHarbor, both post-deploy.

## Rollback Plan

Revert the single commit that edits `src/lib/features/registry.ts` (restores prior `includeTenants` arrays), merge, and let `aca-main-deploy.yml` redeploy. No data migration involved, so rollback is a pure code revert with no backfill/cleanup step. Because each flag independently gates its own code path with a proven deterministic fallback, an individual tenant can also be pulled from one `includeTenants` array without touching the others.

## Audit Evidence

- PR URL: (added when opened)
- CI run: (added when opened)
- Live smoke-test proof: signed-in Lakeshore + SkyHarbor browser checks (page loads, no console errors, no network 5xxs, phase workflow intact, deliverable generation/fallback intact, no internal ID/schema leakage, tenant data isolation) — captured under `proof/` per this repo's convention.
- Rollout matrix: `reports/moves-controlled-rollout-readiness-2026-07-08.md`.

## Known Gaps

- Strict gate-approval mode (`GATE_APPROVAL_STRICT_MODE`) is not flipped by this release. Self-approve remains the default for every tenant, including any future client-production tenant. This is flagged as an explicit open governance decision in the rollout report, not resolved here.
- No new cohort beyond Lakeshore/SkyHarbor is enrolled in any flag by this release — third-tenant/cohort rollout and eventual platform-default-on are future releases, contingent on this cross-tenant proof holding up.
- `moves_workforce_economics` and `moves_decision_storytelling` are enabled for exactly one tenant (Lakeshore) as first proof, not yet cross-tenant proven.
