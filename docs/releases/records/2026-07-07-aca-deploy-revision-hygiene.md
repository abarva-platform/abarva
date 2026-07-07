# 2026-07-07-aca-deploy-revision-hygiene — Post-deploy revision hygiene + robust traffic pin

## Release ID

`2026-07-07-aca-deploy-revision-hygiene`

## Status

`candidate`

## Plain-English Summary

Post-deploy revision hygiene: deactivate stale revisions + robust traffic pin so old builds can never
serve; single deploy authority.

The shared web Container App `ca-abarva-web-lab-eastus` runs in multi-revision mode and had
accumulated 48 active revisions. Because old revisions stayed active, during deploy churn ingress
traffic could land on a stale revision and serve an old build — a user saw an old create-event page
for exactly this reason. This change makes the fix durable and automatic inside the one approved
deploy workflow, instead of relying on operators to hand-deactivate revisions.

Two changes to `.github/workflows/aca-main-deploy.yml`:

1. **New post-deploy revision-hygiene step.** After the new revision is healthy, traffic is pinned to
   it, and the ACA runtime invariant is verified, the workflow deactivates every other active
   revision except the 100%-traffic revision and the N most-recent prior revisions kept as a rollback
   window (`REVISION_ROLLBACK_WINDOW`, default `3`, overridable via the `ACA_REVISION_ROLLBACK_WINDOW`
   repo variable). This means stale revisions can no longer serve traffic during churn.

2. **Hardened health-wait + traffic-pin.** The health-wait now polls the revision's `healthState`
   directly with a generous 30-minute timeout and bails early on a persistent `Failed` provisioning
   state. The traffic-shift step now verifies the target revision actually holds sole 100% weight
   before declaring success. Because the workflow reliably pins traffic itself, operators no longer
   need to run manual `az ... ingress traffic set` — and parallel manual traffic edits were themselves
   a churn source.

## Layer Impact

- `global-control-lane`: shared app/control-plane deploy behavior. This changes only the CI deploy
  workflow and operator docs; no application/runtime code, schema, or client data changes. It affects
  how the shared web Container App's revisions are managed after every main deploy.

## Client Applicability

- All clients: Yes — indirectly. Every client served by `app.abarva.ai` benefits because stale
  revisions can no longer serve old builds during deploy churn. No client-visible feature change.
- Specific clients: None specifically.
- Internal only: The change itself is internal CI/ops plumbing.
- Public/demo only: No.
- Feature flag: None. Rollback window is a config var (`ACA_REVISION_ROLLBACK_WINDOW`, default 3).

## Changes Included

- `.github/workflows/aca-main-deploy.yml`
  - New `REVISION_ROLLBACK_WINDOW` env (default `3`).
  - New step `Post-deploy revision hygiene (deactivate stale revisions)` after `Verify ACA runtime
    invariant`, using `az containerapp revision list` + `az containerapp revision deactivate`.
  - Hardened `Wait for revision to become healthy` (30-min direct `healthState` poll, early abort on
    persistent `Failed`).
  - Hardened `Shift traffic to new revision` (verifies sole-100% pin took effect before success).
- `docs/runbooks/azure-container-apps-deploy.md`
  - New "Post-Deploy Revision Hygiene (Automatic)" section; workflow bullet noting auto-purge.
- `docs/releases/records/2026-07-07-aca-deploy-revision-hygiene.md` (this record).

## QA / Validation

- `node -e` js-yaml parse of the workflow: valid.
- Hygiene keep/deactivate shell logic validated under bash 5.3 (the GitHub Actions ubuntu-latest
  runtime) with mock `az containerapp revision list` / `ingress traffic show` JSON: with 5 active
  revisions and window=3, the step keeps the 100%-traffic revision + the 3 most-recent priors and
  deactivates only the oldest, and it refuses to deactivate any revision with `trafficWeight != 0`.
- `node scripts/release-check.mjs --base origin/main --head HEAD` passes (Deploy Authority Gate +
  Release Control Gate).
- `node scripts/audit/architecture-rules.mjs` run to confirm no provider/deploy rule regressions.
- Cannot execute the workflow itself from this environment; verified by reading the YAML and the
  guardrail logic. The step is idempotent and safe to re-run.

## Rollout Plan

Merge to `main`. The change is inert until the next `aca-main-deploy.yml` run, at which point the new
hygiene step runs at the end of the deploy and prunes accumulated stale revisions down to the rollback
window. No migration, no runtime image change, no flag flip required.

## Deployment Authority

Required — this changes the deploy workflow itself.

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml` remains the single deploy
  authority. All new logic lives inside it; the repo-owned deploy workflow is still the only mutator
  of shared web traffic and revision state.
- Shared runtime mutators: unchanged — only this workflow shifts traffic or deactivates revisions.
  The hygiene step uses `az containerapp revision deactivate` (not a traffic mutator) and never runs
  `az containerapp ingress traffic set` outside the workflow's existing pin step.
- Approved image digest: unchanged. Deploys still use the digest-pinned
  `acrabarvalab001.azurecr.io/abarva/web:main-<sha>@sha256:<digest>` image. No mutable tags
  introduced.
- ACA runtime invariant: preserved and strengthened. The hygiene step re-confirms the ACA runtime
  invariant (single 100%-traffic revision = the new revision) BEFORE deactivating anything, and fails
  if traffic is not on the new revision.
- Worker image invariant: unchanged — worker jobs are still pinned to the same digest via
  `scripts/deploy/update-worker-jobs.sh`.
- ACR build and registry policy: preserved. `acrabarvalab001` is still asserted Premium; builds still
  use Docker Buildx with GitHub Actions cache (`cache-from: type=gha`, `cache-to: type=gha,mode=max`);
  no ad-hoc `az acr build`; no `acr purge`. This change touches ACA revision lifecycle only, not the
  ACR build path.
- Feature/env flag update path: `ACA_REVISION_ROLLBACK_WINDOW` repo variable (default 3) tunes the
  rollback window; no secret or app env change.
- Live signed-in proof required: The first main deploy after merge should be observed to confirm the
  hygiene step keeps the new + 3 prior revisions and deactivates the rest, followed by the standard
  live signed-in client proof on `app.abarva.ai`.

## Rollback Plan

Revert the workflow change (single-file revert of `.github/workflows/aca-main-deploy.yml`) via a
follow-up PR to `main`. The hygiene step only deactivates revisions; deactivation is reversible with
`az containerapp revision activate`. No data or image state is destroyed (nothing is purged from ACR),
so there is no irreversible action to undo.

## Audit Evidence

- PR URL (to be filled on open).
- Workflow evidence artifact `aca-main-deploy` now includes
  `audit-artifacts/aca-main-deploy/revision-hygiene.txt` (keep-list vs deactivated list) and
  `hygiene-traffic.json` / `hygiene-revision-list.json`.
- `release-check` and `architecture-rules` output from local runs.

## Known Gaps

- The workflow cannot be executed from the authoring environment; the hygiene + hardened-pin steps
  are verified by YAML parse, mock-data shell validation under bash 5, and the CI gates. First live
  run should be observed. No other gaps known.
