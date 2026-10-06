# 2026-10-03-governed-demo-tenant-resolution — Declared tenant alias resolution

## Release ID

`2026-10-03-governed-demo-tenant-resolution`

## Status

`candidate`

## Plain-English Summary

Aligns a governed synthetic-data job's client-row lookup with the canonical
tenant alias registry. A run still requires exactly one matching client row;
both stored identity fields must resolve to the requested canonical tenant.
This changes lookup behavior only and does not rewrite tenant registry rows or
tenant-scoped data.

## Layer Impact

- Release lane: `public-demo`; execution remains `internal-admin`.
- Layer 3: reads the canonical tenant declaration and its code-owned aliases;
  it does not mutate client identity or existing canonical records.
- Layer 4: allows the governed demo loader to bind new candidate rows to the
  uniquely resolved client ID while preserving its existing no-clobber,
  archive-plan, transaction, and validation checks.

## Client Applicability

- All clients: no.
- Specific clients: none; this behavior is used only by an explicitly invoked
  synthetic demo data-build job.
- Internal only: operator implementation and proof output.
- Public/demo only: yes.
- Feature flag: none.

## Changes Included

- Resolves the loader's client row using aliases declared by the canonical
  tenant registry and rejects mismatched or ambiguous identity fields.
- Adds positive and fail-closed tests and updates the operator instructions.

## QA / Validation

- Focused unit tests: `PASS` — 12 tests across the loader and planner suites.
- Typecheck: `PASS` — `npm run typecheck`.
- Focused lint: `PASS` — `npx eslint` on the changed TypeScript files.
- Architecture rules: `PASS` — changed-file scan, zero violations.
- Release checks: `PASS` — all 11 release-check gates.
- Live read-only preflight, apply, Blob proof, database readback, and signed-in
  board verification: `NOT RUN` — they require this change to merge and deploy.

## Rollout Plan

Merge through a protected PR and deploy only through
`.github/workflows/aca-main-deploy.yml`. First run the digest-pinned governed
job in plan mode, inspect the exact archive list and plan hash, and apply only
that same plan after validation.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`.
- Shared runtime mutators: none outside the repo-owned workflow.
- Approved image digest: pending.
- ACA runtime invariant: pending.
- Worker image invariant: pending.
- Feature/env flag update path: none.
- Live signed-in proof required: yes.

## Rollback Plan

This lookup-only change has no database rollback. If validation fails, revert
the code through a protected PR and do not run apply. Any later data mutation
uses the governed compensating archive path recorded by the clean-demo Moves
release; never hard-delete rows.

## Audit Evidence

- PR URL: pending.
- ACA main deploy run, exact digest, active revision, and traffic proof: pending.
- Data-build preflight, apply contract, validation, quality gate, and Blob
  proof URI: pending.
- Signed-in board verification: pending.

## Known Gaps

- The production client registry may still contain historical aliases; this
  release deliberately does not canonicalize or repair those rows.
- The clean demo Moves remain synthetic shaping candidates with open evidence,
  null projected values, pending value verification, and empty gates.
