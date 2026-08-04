# 2026-08-03-source-v4-operator-diagnostics — Source v4 Operator Diagnostics

## Release ID

`2026-08-03-source-v4-operator-diagnostics`

## Status

`candidate`

## Plain-English Summary

Hardens the Source v4 lab canary operator wrapper so failed child steps print useful diagnostics to the ACA logs and still emit a compact proof bundle containing the step records that were written before failure.

## Layer Impact

- Release lane: `client-data-lane`.
- Source adapters: improves operator observability only.
- Canonical model: no canonical model change.
- Products: no product UI or runtime read path change.

## Client Applicability

- All clients: no.
- Specific clients: synthetic demo tenant operator validation only.
- Internal only: yes.
- Public/demo only: no public route changes.
- Feature flag: none.

## Changes Included

- `scripts/source/run-skyharbor-v4-lab-canary-job.mjs`

## QA / Validation

- Pass: `node --check scripts/source/run-skyharbor-v4-lab-canary-job.mjs`
- Pass: `npm run source:v4:lab-canary:job -- --plan-only --out-dir /tmp/skyharbor-source-v4-lab-canary-diagnostics-plan-20260804T024315Z`
- Pass: `npm run release:check -- --base origin/main --head HEAD`
- Not-run: ACA operator apply. It requires this patch to be merged and deployed first.

## Rollout Plan

Merge to main and allow the repo-owned ACA main deploy workflow to publish the updated image. Retry the Source v4 lab canary operator apply using the digest-pinned image from that deploy.

## Deployment Authority

- Repo-owned deploy workflow: required.
- Shared runtime mutators: none in this PR.
- Data-plane mutator: subsequent ACA operator job only.
- Live signed-in proof required: no product page consumes these canary views yet.

## Rollback Plan

Revert the patch to restore the prior wrapper behavior. No database rollback is required for this diagnostics-only change.

## Audit Evidence

- PR URL and merge commit.
- Local plan-only diagnostics job.
- ACA main deploy run.
- Subsequent ACA operator proof bundle.

## Known Gaps

- This patch does not change loader semantics.
- This patch does not add Cube semantic promotion over the v4 canary views.
