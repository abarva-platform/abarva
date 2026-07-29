# 2026-07-29-foundation-closure-authority-record — Foundation Closure Authority Record

## Release ID

`2026-07-29-foundation-closure-authority-record`

## Status

`candidate`

## Plain-English Summary

Adds a durable foundation closure authority record for the isolated foundation tenant so future operators do not replay already-completed review, publication, baseline, or projection stages. The record captures the public-safe counts, hashes, active baseline identity, projection identity, job-template preflight result, and the next allowed product-proof gates.

## Layer Impact

- `client-data-lane`: records the governed foundation state and prevents duplicate mutation when readback already matches the accepted baseline.
- `internal-admin`: documents the operator rule that product proof may continue, while review apply, publication, baseline activation, and projection build must not be rerun without a new approved package.

## Client Applicability

- All clients: No.
- Specific clients: Isolated foundation execution tenant only.
- Internal only: Yes.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- `clients/airline-demo-new/21-processing-wave-execution/08-foundation-closure/FOUNDATION_CLOSURE_AUTHORITY_RECORD_20260729.md`
- `clients/airline-demo-new/21-processing-wave-execution/08-foundation-closure/foundation-closure-authority-record-20260729.json`

## QA / Validation

- The record is based on ACA/Postgres readback evidence from the 2026-07-29 foundation recovery run.
- The permanent job-template preflight after PR `#5733` passed: `14` expected jobs, `14` passed jobs, `0` failed jobs, `0` failed checks.
- The active baseline hash and projection hash in this record match the readback values captured by publisher/admin identities.
- `git diff --check` — passed.
- `node -e "const fs=require('fs'); JSON.parse(fs.readFileSync('clients/airline-demo-new/21-processing-wave-execution/08-foundation-closure/foundation-closure-authority-record-20260729.json','utf8')); console.log('json ok')"` — passed.
- `npm run release:check` — passed after staging the closure record.

## Rollout Plan

Merge through PR to `main`. This release does not deploy code, mutate Azure, apply database changes, rerun a data pipeline stage, change provider selection, or activate a tenant in the product. It is an authority/proof record only.

## Deployment Authority

- Repo-owned deploy workflow: Not required for this documentation/control record.
- Shared runtime mutators: None.
- Approved image digest: Not changed.
- ACA runtime invariant: Already captured by the preceding job-template standardization release.
- Worker image invariant: Already captured by the preceding job-template standardization release.
- Feature/env flag update path: None.
- Live signed-in proof required: Required later before tenant-facing activation, not for this record.

## Rollback Plan

Revert this record if a later read-only reconciliation proves the captured foundation state was incorrect. Do not use rollback to rerun data-plane stages; first reconcile the live database state and identify the authoritative source of truth.

## Audit Evidence

- PR URL: Pending.
- CI run: Pending.
- Foundation closure authority record: `clients/airline-demo-new/21-processing-wave-execution/08-foundation-closure/FOUNDATION_CLOSURE_AUTHORITY_RECORD_20260729.md`
- Machine-readable closure record: `clients/airline-demo-new/21-processing-wave-execution/08-foundation-closure/foundation-closure-authority-record-20260729.json`

## Known Gaps

- This does not create Clerk proof users.
- This does not switch the product provider.
- This does not prove signed-in product pages.
- This does not provision Superset or Observable.
- This does not rerun review apply, publication, baseline activation, projection build, reconciliation, or metric parity.
