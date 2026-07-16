# 2026-07-16-tower-v3-default-runtime-cutover — Tower V3 Default Runtime Cutover

## Release ID

`2026-07-16-tower-v3-default-runtime-cutover`

## Status

`candidate`

## Plain-English Summary

Meridian / Healthcare Demo Tower now uses the governed TowerContextPack path as the default visible Tower runtime instead of making the old `cio_tower` bridge read model the default tab source. The visible Tower tabs now show measurement readiness, value hypotheses, evidence blockers, claim-gate status, and CIO/CFO executive insights from the v3 context-derived projection. The legacy `cio_tower` path remains available only as fallback / bridge diagnostics.

## Layer Impact

- `global-control-lane`: Updates shared Tower rendering, Tower aVa prompt context, and audit proof commands.
- `client-data-lane`: No tenant data is written or promoted. Meridian active tenant input files are read-only inputs to the TowerContextPack proof.
- `internal-admin`: No Admin runtime behavior changes.

## Client Applicability

- All clients: No broad default runtime change.
- Specific clients: Meridian / Healthcare Demo receives the default TowerContextPack runtime view.
- Internal only: Proof artifacts under `reports/tower-v3-default-runtime-cutover`.
- Public/demo only: No public route changes.
- Feature flag: No flag is required for the Meridian default runtime path. Non-Meridian clients keep existing behavior.

## Changes Included

- `/tower` now builds the Meridian TowerContextPack runtime view by default.
- `TowerIndexPage` renders the Meridian default Tower tabs from v3-derived/projection-derived data, with `cio_tower` only in bridge diagnostics.
- Tower aVa prompt context includes the Meridian v3 runtime summary and uses a v3 deterministic fallback when model output is invalid.
- `tower-v3-runtime-view` now exposes default tab classifications and CIO/CFO insight blocks.
- Added `npm run audit:tower-tab-data-lineage`.
- Added proof artifacts under `reports/tower-v3-default-runtime-cutover`.

## QA / Validation

- Pass: `npm run audit:tower-tab-data-lineage`
- Pass: `npm run audit:tower-v3-source-of-truth-alignment`
- Pass: `npm run audit:tower-v3-meridian-context-pack`
- Pass: `npm run audit:enterprise-naming`
- Pass: `npx jest src/lib/tower/__tests__/value-claim-gate.test.ts src/lib/tower/__tests__/tower-v3-runtime-view.test.ts src/lib/enterprise-knowledge/tower/__tests__/tower-v3-context-pack-from-tenant-inputs.test.ts src/lib/cio-tower/__tests__/answer.test.ts --runInBand`
- Pass: `NODE_OPTIONS=--max-old-space-size=8192 npx tsc --noEmit --pretty false`
- Not run yet: signed-in browser proof after ACA deploy.

## Rollout Plan

Open a protected PR to `main`. After merge, the repo-owned ACA main deploy workflow must build and deploy the image. Then run signed-in Meridian / Healthcare Demo Tower proof against `https://app.abarva.ai/tower`.

## Deployment Authority

- Repo-owned deploy workflow: Required before live traffic changes.
- Shared runtime mutators: None in this PR.
- Approved image digest: Not available until main ACA deploy.
- ACA runtime invariant: Must be captured after deploy.
- Worker image invariant: Not applicable.
- Feature/env flag update path: Not required for Meridian default runtime.
- Live signed-in proof required: Yes.

## Rollback Plan

Revert this PR or restore the prior conditional runtime flag behavior in `/tower`. Because this PR is read-only and does not mutate tenant data, rollback is code-only.

## Audit Evidence

- `reports/tower-v3-default-runtime-cutover/summary.md`
- `reports/tower-v3-default-runtime-cutover/summary.json`
- `reports/tower-v3-default-runtime-cutover/tab-data-map.csv`
- `reports/tower-v3-default-runtime-cutover/visible-values.csv`
- `reports/tower-v3-default-runtime-cutover/value-claim-gate-results.csv`
- `reports/tower-v3-default-runtime-cutover/source-classification-before-after.csv`
- `reports/tower-v3-default-runtime-cutover/unsupported-claims.csv`
- `reports/tower-v3-default-runtime-cutover/cio-cfo-insights.json`
- `reports/tower-v3-default-runtime-cutover/cio-cfo-insights.md`
- `reports/tower-v3-default-runtime-cutover/cio-cfo-insight-validation.csv`
- `reports/tower-v3-default-runtime-cutover/proof.html`

## Known Gaps

- Signed-in browser proof is not yet run; do not claim live-proven status.
- Tower is not fully migrated for all tenants.
- `cio_tower` remains as fallback / bridge diagnostics until reconciled row by row.
