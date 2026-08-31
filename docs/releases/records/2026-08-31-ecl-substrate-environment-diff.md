# ECL - compare substrate shape across environments

## Release ID

`2026-08-31-ecl-substrate-environment-diff`

## Status

`candidate`

## Plain-English Summary

Before adopting a database schema baseline, operators need to know whether the candidate source
environment and the target production environment have the same substrate. A baseline generated
from one environment can look authoritative while preserving drift from another.

This adds a read-only lab-vs-production diff for the ECL substrate. It compares schema counts,
tables, column-shape hashes, constraints, indexes, views, functions, RLS policies and foreign-key
edges. It also checks whether each object appears in repository migrations, so the output separates
"environment drift" from "unversioned object."

The default schema list includes the commercial substrate because the inventory probe found that
ECL projection and review tables depend on it. Omitting it would make the baseline scope incomplete.

## Layer Impact

Layer 3 and Layer 4 database substrate, read-only. This is an internal-admin probe only; it does not
write data, modify schema, alter runtime behavior or change any product surface.

Release lane: `internal-admin`.

## Client Applicability

Internal only. The output contains schema object names, object-shape hashes, counts and dependency
directions. It does not read tenant rows or emit row values.

## Changes Included

- `scripts/ops/probe-ecl-substrate-diff.mjs`
- `scripts/ops/probe-ecl-substrate-inventory.mjs`
- `package.json` - `ops:probe-ecl-substrate-diff`

## QA / Validation

Status: PASS.

| Check | Result |
| --- | --- |
| `node --check scripts/ops/probe-ecl-substrate-diff.mjs` | PASS |
| `node --check scripts/ops/probe-ecl-substrate-inventory.mjs` | PASS |
| Mutating-statement scan | PASS - zero mutating verbs in the probe scripts |
| `npx eslint scripts/ops/probe-ecl-substrate-diff.mjs scripts/ops/probe-ecl-substrate-inventory.mjs` | PASS |
| `node scripts/release-check.mjs` | PASS |

## Rollout Plan

Merge to `main`, let the repo-owned Azure Container Apps deployment workflow build and deploy the
image, then run the probe through `npm run ops:aca-job` with digest-pinned image and two explicit
database URL bindings:

```bash
npm run ops:aca-job -- \
  --script ops:probe-ecl-substrate-diff \
  --secret-env LAB_DATABASE_URL=<lab-database-secret-name> \
  --secret-env PRODUCTION_DATABASE_URL=<production-database-secret-name>
```

For first-pass discovery, set `ECL_SUBSTRATE_DIFF_ALLOW_DRIFT=1` so the job can complete while still
printing `SUBSTRATE_DIFF_FOUND`. For adoption gating, leave that flag unset; drift exits non-zero.

## Deployment Authority

Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml` after merge.

Shared runtime mutators: none in this change.

Approved image digest: supplied by the merge deploy before any ACA job run.

ACA runtime invariant: required before claiming the probe is available in the deployed image.

Worker image invariant: required by the ACA job wrapper.

Feature/env flag update path: none.

Live signed-in proof required: no; this is not a product surface.

## Rollback Plan

Delete the diff script, remove the npm entry and restore the inventory probe's narrower schema list
if needed. No data-plane rollback is required because the scripts are read-only.

## Audit Evidence

Inspect the PR diff, local validation output, release check output, deployment workflow run, ACA
runtime invariant, and the ACA operator job proof bundle from the first diff run.

## Known Gaps

- This compares shape; it does not write the schema baseline.
- The production database secret name must be selected by an operator at run time. The script
  refuses to guess or fall back to a generic `DATABASE_URL`.
- Object hashes identify drift but do not print full definitions, keeping the public and job logs
  compact. Operators can inspect definitions separately when a hash differs.
