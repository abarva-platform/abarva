# 2026-09-28 Source Evidence Applicability

## Release ID

`2026-09-28-source-evidence-applicability`

## Status

`candidate`

## Plain-English Summary

An Event Owner or client admin can record that a Strategy event has no incumbent agreement or no historical spend record. This is a named, reasoned applicability decision, not a substitute contract, spend value, uploaded document, or approval. Only those two requirements permit this decision. A later matching upload restores the requirement and keeps the decision history.

## Layer Impact

- Release lanes: `client-data-lane` for the schema and `global-control-lane` for the shared Source workflow code.
- Layer 3 canonical model: no contract, spend, supplier, or finance fact is created or changed.
- Layer 4 Source projection: per-event evidence applicability and its append-only audit history are added to Source's governed workflow state. Existing evidence readiness remains separate.

## Client Applicability

- All clients: the schema and code can serve any tenant after the governed migration is applied.
- Specific clients: none.
- Internal only: no.
- Public/demo only: no.
- Feature flag: no; the UI stays hidden and the route returns `schema_pending` until the database column is read back.

## Changes Included

- Add a per-requirement applicability decision and append-only audit table with allowed-requirement and state constraints.
- Add an authenticated Event Owner/client-admin decision route with tenant, stage, confirmation, reason, and concurrent-update checks.
- Include audited absence in Strategy coverage, progression, and gate evaluation without upgrading evidence readiness.
- Offer the decision inline beside the affected requirement and supersede it when a matching artifact is uploaded.

## QA / Validation

- Pass: red-first gate test failed before the governance change, then passed.
- Pass: targeted route, UI, mapping, upload-sync, coverage, progression, evidence-authority, and governance tests.
- Pass: mutation disabling audited absence failed three relevant suites; mutation broadening the allowlist failed both the authority and route suites. Both were restored.
- Pass: the migration executed in a disposable local PostgreSQL 18 database. A valid absence wrote an audit row; an unrelated requirement was rejected by the check constraint; upload supersession wrote a second audit row; an attempted audit deletion was rejected. The local database was stopped.
- Pass: TypeScript typecheck and scoped ESLint.
- Blocked: deployment database migration and live signed-in applicability decision require governed migration authorization and readback.
- Not run: full end-to-end journey; independent Strategy artifacts and later gates remain unproven.

## Rollout Plan

Squash-merge only after applicable CI and review. Let the repo-owned ACA main workflow deploy the image. Apply the migration only in a separately authorized data-plane operation, then read back the schema and replay the signed-in decision on an eligible synthetic event. Code deployment alone must not be reported as live feature acceptance.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml` only.
- Shared runtime mutators: none outside that workflow.
- Approved image digest: Not run; record after main deploy.
- ACA runtime invariant: Not run; verify template, 100% traffic revision, and required workers after deploy.
- Worker image invariant: Not run; verify digest equality after deploy.
- Feature/env flag update path: none.
- Live signed-in proof required: yes, after governed migration readback.

## Rollback Plan

Revert the application PR through the normal main deploy workflow; the route and UI disappear while existing evidence states remain unchanged. Do not drop the audit table. A migration rollback needs its own reviewed data-plane plan because deleting decision history is not an acceptable automatic rollback.

## Audit Evidence

Targeted Jest output, mutation failures, TypeScript and ESLint output, PR and CI checks, ACA main run and digest readback, migration run proof, and signed-in synthetic-event readback. The last four are pending at this candidate checkpoint.

## Known Gaps

- Blocked: the schema migration has not been authorized or applied.
- Strategy deliverable approval and later Source stages still require their own governed evidence and journey proof.
