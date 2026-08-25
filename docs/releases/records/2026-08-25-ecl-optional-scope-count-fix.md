# 2026-08-25-ecl-optional-scope-count-fix — ECL Optional Scope Count Guard

## Release ID

`2026-08-25-ecl-optional-scope-count-fix`

## Status

`candidate`

## Plain-English Summary

This release fixes a projection counting bug where an empty semicolon-delimited contract scope
field could be counted as one relationship. The default ECL product path now filters blank optional
scope references before counting them, and a guard test prevents the same pattern from returning.

## Layer Impact

- Release lane: `global-control-lane`
- Layer 3 canonical enterprise model: no schema or canonical data changes.
- Layer 4 products: Home and Intelligence projection facts derived from contract scope now count
  only populated scope references.
- QA/proof layer: adds a focused ECL guard for optional scope counts.

## Client Applicability

- All clients: applies to any ECL projection build using optional semicolon-delimited scope fields.
- Specific clients: none.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- `scripts/ecl/load_dense_source_room_source_projection_layer.py`
- `scripts/ecl/__tests__/run-ecl-optional-scope-count-tests.mjs`
- `package.json`

## QA / Validation

- `npm run test:ecl-optional-scope-counts` — pass
- `npm run test:npm-script-targets` — pass
- `python3 -m py_compile scripts/ecl/load_dense_source_room_source_projection_layer.py` — pass
- `node --check scripts/ecl/__tests__/run-ecl-optional-scope-count-tests.mjs` — pass
- `npm run release:check` — pass after release-record metadata correction

## Rollout Plan

Merge through a PR to `main`. The repo-owned ACA deploy workflow builds and deploys the approved
image. No data-plane mutation, schema migration, tenant promotion, or legacy retirement is included.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`
- Shared runtime mutators: none outside the repo-owned deploy workflow.
- Approved image digest: assigned by the deploy workflow.
- ACA runtime invariant: required before claiming deployed.
- Worker image invariant: required before claiming deployed.
- Feature/env flag update path: none.
- Live signed-in proof required: required before claiming live product proof.

## Rollback Plan

Revert the PR and redeploy through the repo-owned ACA deploy workflow. No schema or data rollback is
required.

## Audit Evidence

To be filled after PR/deploy:

- PR:
- CI:
- Deploy:
- Runtime invariant:
- Browser/default-route proof:

## Known Gaps

- This release fixes one optional-field count class. It does not retire legacy data-plane objects.
- It does not perform the full 40-surface visual crawl.
