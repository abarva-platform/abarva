# 2026-10-03-source-nda-synthetic-template-publication - Lab template authority

## Release ID

`2026-10-03-source-nda-synthetic-template-publication`

## Status

`candidate`

## Plain-English Summary

A named Source stage approver can publish a hash-verified, visibly synthetic NDA template for one lab event. The record is explicitly a synthetic admin decision, not Legal publication or a signed NDA. Production Legal publication remains unchanged. NDA coverage is evaluated as of the current UTC date, not the event value ledger's last update. The accepted-supplier NDA panel uses a fixed-query authority read instead of opening a database session per supplier.

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

- A signed-in publication route, a hash and PDF-text verifier, event-scoped NDA reads, and the Source New capture panel. The Stage 05 coverage read uses today's UTC date while the historical value-ledger snapshot remains unchanged. Accepted suppliers are checked through one tenant- and event-scoped panel read with a fixed number of queries. The schema is tracked in its own release.

## QA / Validation

- PASS: red-first behavioral tests showed an unmarked PDF and a cross-event blob path could be published; the production verifier now rejects both.
- PASS: focused unit and route tests cover tenant, event, actor, file type, byte hash, visible synthetic marker, and lack of downstream signed-NDA authority.
- PASS: focused ESLint, TypeScript typecheck, and all 11 release gates.
- PASS: tenancy-fence census regenerated from the guarded route and its behavioral test; all 15 census tests and the shape check pass.
- PASS: the page-route test failed first when Stage 05 used an older value-ledger date, then passed with the current UTC date without changing the historical event snapshot.
- PASS: the behavior coverage check caught a stale Legal-only message assertion. It now checks the event-scoped no-template refusal and still requires `not_covered`.
- PASS: a 60-supplier, mixed-archetype panel test proves one authority read and one result per accepted supplier. Repository tests assert one session and four fixed calls, fail closed on an authority error, and reject an out-of-event row. A temporary removal of the event-scope filter failed the negative test and was restored.
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
- The fixed-query panel read is not a 50-supplier live load test or a bulk envelope-send workflow. Supplier-by-supplier document capture and provider delivery still need separate end-to-end proof.
