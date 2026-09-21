# 2026-09-20-source-tenant-key-readback — Read-only Source identity vocabulary diagnostic

## Release ID

`2026-09-20-source-tenant-key-readback`

## Status

`candidate`

## Plain-English Summary

Source workflow reads and writes pass a text client key through several tables.
The repository had a broad stale-alias checker, but it could not show the full
set of values actually stored in the small group of tables used by approval,
artifact-generation, activity, and participant paths. This change adds an
operator diagnostic that reports those exact stored values and row counts.

The diagnostic has no write mode. It begins a PostgreSQL read-only transaction,
checks that the server reports read-only state, queries only a fixed allowlist,
and rolls the transaction back on success or failure. The core client registry
key is required. Source tables that may not exist in an older schema are
reported explicitly as an absent relation or absent column instead of being
silently skipped.

## Layer Impact

Release lane: `internal-admin`.

- Layer 1 (client intake): unchanged.
- Layer 2 (source adapters): unchanged.
- Layer 3 (canonical model): read-only inspection only; no rows or schema are
  changed.
- Layer 4 (products): unchanged. No route, component, or runtime read path is
  modified.

## Client Applicability

- All clients: no product behavior change.
- Specific clients: none.
- Internal only: yes, this is an operator-run database diagnostic.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- `scripts/source/readback-source-tenant-key-vocabulary.mjs` adds the
  fixed-target, read-only JSON diagnostic.
- `scripts/source/__tests__/readback-source-tenant-key-vocabulary.test.mjs`
  proves transaction-state enforcement, deterministic key ordering, explicit
  optional-target absence, required-anchor failure, rollback behavior, and that
  the database URL's TLS policy is not weakened by the diagnostic.

No package script, workflow, migration, product runtime, tenant data, or
generated census is changed.

## QA / Validation

- `node --test scripts/source/__tests__/readback-source-tenant-key-vocabulary.test.mjs`
  — **PASS**, 7 tests passed, 0 failed.
- `npm run test:behaviors`
  — **PASS**, 80 suites and 732 tests passed, 0 failed.
- `NODE_OPTIONS=--max-old-space-size=6144 npx tsc --noEmit --pretty false`
  — **PASS**, exit code 0 with no diagnostics.
- `npx eslint scripts/source/readback-source-tenant-key-vocabulary.mjs scripts/source/__tests__/readback-source-tenant-key-vocabulary.test.mjs`
  — **PASS**, exit code 0.
- `npx prettier --check scripts/source/readback-source-tenant-key-vocabulary.mjs scripts/source/__tests__/readback-source-tenant-key-vocabulary.test.mjs docs/releases/records/2026-09-20-source-tenant-key-readback.md`
  — **PASS**, all files matched repository style.
- `npm run release:check`
  — **PASS**, release control and deploy-authority gates passed.

Live database readback — **NOT RUN**. Azure commands — **NOT RUN**. Neither is
part of repository validation for this release candidate.

## Rollout Plan

Merge makes the diagnostic available to an authorized operator. Running it
against any deployed database is a separate governed operation and is not part
of this release candidate.

## Deployment Authority

- Repo-owned deploy workflow: unchanged.
- Shared runtime mutators: none.
- Approved image digest: not applicable to repository-only validation.
- ACA runtime invariant: unchanged.
- Worker image invariant: unchanged.
- Feature/env flag update path: not applicable.
- Live signed-in proof required: no product surface changes. A future database
  readback must be reported separately from this repository change.

## Rollback Plan

Remove the diagnostic, its focused tests, and this release record. There is no
schema, data, configuration, or runtime state to reverse.

## Audit Evidence

- The focused test output and local validation commands listed above.
- The script's fixed target list and transaction control.
- Any future diagnostic JSON must be retained in the private governed proof
  location for that operator run, not committed to the public repository.

## Known Gaps

- This release does not establish which values are stored in a deployed
  database; it only supplies the repository-side diagnostic needed to perform
  that separate readback.
- The diagnostic intentionally does not recommend or apply canonical values.
  Remediation requires an independently reviewed plan after the stored
  vocabulary is known.
