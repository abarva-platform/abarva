# 2026-10-03-source-nda-synthetic-template-publication - Lab template authority

## Release ID

`2026-10-03-source-nda-synthetic-template-publication`

## Status

`candidate`

## Plain-English Summary

A named Source stage approver can publish a hash-verified, visibly synthetic NDA template for one lab event. The record is explicitly a synthetic admin decision, not Legal publication or a signed NDA. Production Legal publication remains unchanged.

## Layer Impact

- Release lane: `client-data-lane`, because the authority migration is tenant-scoped. The lab-only UI is also an `experimental` surface within that release.
- Layer 3 canonical model: consumes the separately released event-scoped synthetic authority schema. This PR adds no migration or template row.
- Layer 4 Source: adds a lab-only upload and publication action and reads only templates applicable to the current event.

## Client Applicability

- All clients: event-scoped template reads and existing Legal authority remain in force.
- Specific clients: none.
- Internal only: one synthetic lab tenant can use the admin publication action.
- Public/demo only: no public route.
- Feature flag: the tenant and database constraints prevent other tenants from using synthetic publication.

## Changes Included

- A signed-in publication route, a hash and PDF-text verifier, event-scoped NDA reads, and the Source New capture panel. The schema is tracked in its own release.

## QA / Validation

- PASS: red-first behavioral test showed an unmarked PDF could be published; the production verifier now rejects it.
- PASS: focused unit and route tests cover tenant, event, actor, file type, byte hash, visible synthetic marker, and lack of downstream signed-NDA authority.
- PASS: focused ESLint, TypeScript typecheck, and all 11 release gates.
- PASS: the prerequisite schema was separately proved against disposable PostgreSQL 16, including event-scope rejection. This app PR does not apply it.
- BLOCKED: database apply and signed-in readback remain separate proof layers that need migration authorization.

## Rollout Plan

Merge through a PR only after the prerequisite schema is applied and verified. The repo-owned ACA main workflow deploys the image. Uploading and publishing a template are separate human actions; neither is run by deployment.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`.
- Shared runtime mutators: none in this release.
- Approved image digest: verify after deployment.
- ACA runtime invariant: verify the web template and 100%-traffic revision against the approved digest.
- Worker image invariant: verify required jobs against the same digest.
- Feature/env flag update path: none.
- Live signed-in proof required: yes, for template publication and event-scoped readback after migration apply.

## Rollback Plan

Revert the application through a PR and the official main deploy workflow. The migration is additive; do not drop authority or evidence columns while records could depend on them. A published version is immutable and may be retired through a separately governed path.

## Audit Evidence

- PR and CI links after creation.
- Migration status/apply artifacts, digest and traffic readback, and signed-in NDA-stage evidence after rollout.

## Known Gaps

- The prerequisite schema is not yet applied. A shared-database migration workflow may have unrelated pending migrations; do not bulk-apply without exact-set authorization.
- This does not create an executed NDA, contact a supplier, send a notification, or complete the NDA gate.
