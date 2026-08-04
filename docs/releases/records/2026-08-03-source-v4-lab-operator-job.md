# 2026-08-03-source-v4-lab-operator-job — Source v4 Lab Operator Job

## Release ID

`2026-08-03-source-v4-lab-operator-job`

## Status

`candidate`

## Plain-English Summary

Adds an operator-safe Source v4 lab job that can run end to end inside the Azure Container Apps operator environment. The job generates the synthetic package inside the container, validates row depth, loads the canary raw tables and views, runs the 150-question answer baseline, readbacks the database, and emits a proof bundle for audit.

## Layer Impact

- Release lane: `client-data-lane`.
- Client intake: makes the deterministic v4 package generation portable to `/tmp` or any operator-provided output directory.
- Source adapters: optimizes the raw v4 canary loader with batched inserts and wraps generation, validation, load, baseline, and readback into one operator job.
- Canonical model: no canonical entities or product-owned truth are changed.
- Products: no UI or runtime product surface reads the v4 canary tables in this candidate.

## Client Applicability

- All clients: no.
- Specific clients: the synthetic airline demo tenant only, `skyharbor_global`.
- Internal only: yes, lab/operator validation.
- Public/demo only: no public route changes.
- Feature flag: none.

## Changes Included

- `scripts/source/build-skyharbor-v4-synthetic-package.mjs`
- `scripts/source/load-skyharbor-v4-lab-canary.mjs`
- `scripts/source/run-skyharbor-v4-lab-canary-job.mjs`
- `docs/source/SKYHARBOR_SOURCE_V4_LAB_CANARY_LOAD_AND_BASELINE.md`
- `package.json` Source v4 lab job script

## QA / Validation

- Pass: `node --check scripts/source/build-skyharbor-v4-synthetic-package.mjs`
- Pass: `node --check scripts/source/load-skyharbor-v4-lab-canary.mjs`
- Pass: `node --check scripts/source/run-skyharbor-v4-lab-canary-job.mjs`
- Pass: `npm run source:v4:lab-canary:job -- --plan-only --out-dir /tmp/skyharbor-source-v4-lab-canary-plan-20260804T021215Z`
- Pass: `npm run source:v4:question-coverage:verify`
- Pass: `git diff --check`
- Pass: `npm run release:check -- --base origin/main --head HEAD`
- Not-run: ACA operator apply. It requires this candidate to be merged and deployed to the digest-pinned operator image first, and will be recorded as a separate proof bundle.

## Rollout Plan

Merge to main and allow the repo-owned ACA main deploy workflow to publish the updated image. Then run:

```bash
node scripts/ops/submit-aca-operator-job.mjs \
  --image <digest-pinned-web-image> \
  --script source:v4:lab-canary:job \
  --out-dir <operator-proof-dir>
```

## Deployment Authority

- Repo-owned deploy workflow: required before ACA operator execution so the job image contains this script.
- Shared runtime mutators: the PR itself has none; the later operator job mutates lab/source canary schemas only.
- Approved image digest: resolved by the ACA main deploy workflow after merge.
- ACA runtime invariant: required for the web deploy that publishes the script.
- Worker image invariant: required by the web deploy workflow.
- Feature/env flag update path: none.
- Live signed-in proof required: not for this candidate; required only when a product surface consumes these canary views.

## Rollback Plan

Revert the PR to remove the operator wrapper and batching change. If the operator job has run, drop `consumption_v4_canary` and `raw_source_v4` or delete rows matching `tenant_key = 'skyharbor_global'` and `dataset_id = 'skyharbor-source-v4-202608'`.

## Audit Evidence

- PR URL and merge commit.
- Local plan-only job output.
- ACA deploy run for the merged image.
- ACA operator proof bundle for the subsequent lab apply.

## Known Gaps

- Cube semantic promotion over the v4 canary views is not included.
- Product UI/browser proof is not included because no page consumes `consumption_v4_canary` yet.
