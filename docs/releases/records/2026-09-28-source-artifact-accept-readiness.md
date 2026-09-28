# 2026-09-28 Source Artifact Acceptance Readiness

## Release ID

`2026-09-28-source-artifact-accept-readiness`

## Status

`candidate`

## Plain-English Summary

An uploaded file can no longer be accepted as authoritative while it is only registered, parsing, failed, or awaiting parser review. The acceptance control remains visible but disabled with a short next-step explanation. Rendered generated work products keep their existing human-review path while parsing is pending.

## Layer Impact

- `global-control-lane`, Layer 4 Source workflow: the artifact acceptance route and Files view enforce the same reviewability boundary. No canonical enterprise fact, source adapter, or intake record is changed.

## Client Applicability

- All clients using Source artifact acceptance; no tenant-specific rule or feature flag.

## Changes Included

- Acceptance route rejects non-generated files unless the registry parse state is `parsed`.
- Files view projects registry origin and disables the action for unparsed uploaded evidence.
- Focused route, component, and Source shell regression tests.
- No migration or data build.

## QA / Validation

- Pass: red-first route test reproduced HTTP 200 for a pending upload before the guard; the corrected route returns HTTP 409 without inserting an acceptance.
- Pass: red-first component test reproduced an enabled action for a pending upload; the corrected control is disabled and opens no form.
- Pass: six focused suites, 117 tests; Node 24 TypeScript check; scoped ESLint.
- Pass: removing the route guard failed four negative tests; removing the disabled state failed the component test. Both mutations were restored.
- Not run: signed-in post-deploy replay, pending PR and official ACA runtime.

## Rollout Plan

Squash-merge after applicable CI/review, then allow only the repo-owned ACA main workflow to deploy. No database migration or flag change is needed.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`.
- Shared runtime mutators: none outside that workflow.
- Approved image digest: pending official main deploy.
- ACA runtime invariant: pending digest-pinned web template and 100%-traffic revision readback.
- Worker image invariant: pending both required delivery worker checks.
- Feature/env flag update path: none.
- Live signed-in proof required: confirm the uploaded evidence control stays disabled before parsing, generated review remains available, and the event's stage gate remains independent.

## Rollback Plan

Revert the merge through a new PR and let the official main workflow deploy the reversal. No schema or data rollback is involved.

## Audit Evidence

Focused test output, local mutation failures, PR checks, official ACA main run, digest/runtime readback, and the private synthetic journey smoke ledger.

## Known Gaps

This does not parse registered files or turn a registered upload into a client-final deliverable. Acceptance remains distinct from stage approval and external release. The separate requirement-applicability database migration remains pending its own authorization.
