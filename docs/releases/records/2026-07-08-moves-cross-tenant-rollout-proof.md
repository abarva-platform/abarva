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
- Shared runtime mutators: None — no manual `az containerapp update` was run; deploy happened only via the repo-owned workflow on merge.
- Approved image digest: `sha256:fbfbf6fa994d0ac56e56c6a1d5d03652121654f4afd470473b9ac1efb2f48eba` (`acrabarvalab001.azurecr.io/abarva/web`, tag `main-c334950c`), built by `aca-main-deploy.yml` run [28962009346](https://github.com/abarva-platform/abarva/actions/runs/28962009346) for merge commit `c334950cd9195c9d96d1896e06bbfe78ed80de8f`.
- ACA runtime invariant: **confirmed** — the workflow's own "Verify ACA runtime invariant" step reported `templateImage`, `activeImage`, and `expectedImage` all equal to the digest above; worker jobs updated to the same image ("All present worker jobs updated to ...").
- Worker image invariant: confirmed matching (see above); no worker-job code was touched by this change, only the image tag moved forward with the routine deploy.
- Feature/env flag update path: in-code `includeTenants` array, shipped via normal deploy — no separate env var flip required for this change.
- Live signed-in proof required: Yes — **Lakeshore: captured.** SkyHarbor: **not captured**, see Known Gaps.

## Rollback Plan

Revert the single commit that edits `src/lib/features/registry.ts` (restores prior `includeTenants` arrays), merge, and let `aca-main-deploy.yml` redeploy. No data migration involved, so rollback is a pure code revert with no backfill/cleanup step. Because each flag independently gates its own code path with a proven deterministic fallback, an individual tenant can also be pulled from one `includeTenants` array without touching the others.

## Audit Evidence

- PR URL: https://github.com/abarva-platform/abarva/pull/4587 (merged as `c334950cd9195c9d96d1896e06bbfe78ed80de8f`)
- CI run (all 20 checks passed): https://github.com/abarva-platform/abarva/pull/4587/checks
- Deploy run (success, runtime invariant verified): https://github.com/abarva-platform/abarva/actions/runs/28962009346
- Live smoke-test proof, Lakeshore: `proof/moves-cross-tenant-rollout-lakeshore-live-2026-07-08/README.md` — phase-workspace checklist + approved-Inputs-Pack card confirmed; pattern-assembly "✦ Assemble options" clicked live, returned real Claude-assembled options each labeled (observed "Evidence-backed"), no console errors; orchestrated-deliverable route rendered live "Business Case Readiness Memo" with honest gap-reporting (no fabricated numbers), no console errors.
- Live smoke-test proof, SkyHarbor: not captured this pass — see Known Gaps.
- Rollout matrix: `reports/moves-controlled-rollout-readiness-2026-07-08.md`.

## Known Gaps

- **SkyHarbor live proof not captured.** The available signed-in browser session is scoped to Lakeshore only (confirmed via `/strategic-moves` overview showing only Lakeshore moves, and no cross-tenant switcher under `/setup` → Operations). No SkyHarbor Clerk credentials were available in this session. The code-level flag change is deployed and live for SkyHarbor (confirmed via the ACA runtime invariant above), but has not yet been visually/functionally smoke-tested signed-in as SkyHarbor. Needs either SkyHarbor demo credentials or an operator to run the equivalent of `proof/moves-cross-tenant-rollout-lakeshore-live-2026-07-08/` for SkyHarbor.
- Strict gate-approval mode (`GATE_APPROVAL_STRICT_MODE`) is not flipped by this release. Self-approve remains the default for every tenant, including any future client-production tenant. This is flagged as an explicit open governance decision in the rollout report, not resolved here.
- No new cohort beyond Lakeshore/SkyHarbor is enrolled in any flag by this release — third-tenant/cohort rollout and eventual platform-default-on are future releases, contingent on this cross-tenant proof holding up.
- `moves_workforce_economics` and `moves_decision_storytelling` are enabled for exactly one tenant (Lakeshore) as first proof; not separately smoke-tested this pass and not yet cross-tenant proven.
- Response header verification (`x-deliverable-engine`) for the orchestrated-deliverable proof was not captured — browser network-request inspection timed out on this document-level navigation (tooling limitation). The rendered deliverable content itself (correct, honest, gap-reporting output) is strong evidence the path is functioning correctly regardless of which engine served it.
