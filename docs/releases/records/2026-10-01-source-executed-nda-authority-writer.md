# 2026-10-01 - Event-scoped executed NDA authority writer

## Release ID

`2026-10-01-source-executed-nda-authority-writer`

## Status

`candidate`

## Plain-English Summary

Adds an authenticated, in-step capture path for executed NDA authority. It records an event-only agreement only when a canonical supplier is accepted on that exact event, the uploaded artifact is current and hashed on that event with a recorded uploader, a Legal-published template was applicable when signed, bilateral signature metadata is complete, and certificate or private signed-evidence provenance is present. The route binds tenant and named reviewer from the signed-in session; the form appears only after the template, supplier and uploaded file prerequisites are readable.

## Layer Impact

- Release lane: `global-control-lane`.
- Layer 3 authority: writes the existing governed NDA authority relation; it does not create supplier identity or contractual terms.
- Layer 4 Source: the Stage 05 panel presents a capture form only when governed prerequisites are present, then refreshes its existing coverage projection.

## Client Applicability

- All clients: signed-in Source users with stage-approval authority may use the capture path when its evidence prerequisites exist.
- Specific clients: None.
- Internal only: Yes; the path is not a supplier-facing action.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- One transaction-scoped, tenant- and event-fenced authority insert.
- Authenticated event route and a prerequisite-gated Stage 05 form; uploader identity comes from the registered artifact, not the request.
- Refusal of absent candidate, foreign-event artifact, incomplete signature or provenance evidence, unpublished template, and unverified affiliate scope.
- Focused writer, route, projection and component behavior suites, with removal mutations of the event and permission predicates.

## QA / Validation

The writer and route suites were red before implementation and green afterward. Removing the candidate event fence turned the foreign-event case red; the fence was restored. The affected suites pass 78/78, full TypeScript and scoped ESLint pass, and the library-orphan audit is green after wiring the authenticated route. The new route has behavioral tenancy-fence coverage. The capture form has focused render/submit behavior tests; it is not counted by the separate three-screen builder-vocabulary render control, whose measured unaudited remainder increases by one. Release validation and applicable CI are recorded separately as they complete. No live executed NDA row or positive signed-in coverage is claimed.

## Rollout Plan

Squash merge after applicable CI and release through the repo-owned ACA main deploy workflow. This change has no schema migration, data build, executed-document upload, waiver decision, supplier contact, or external release. A later positive capture requires real Legal-published template and executed-document evidence.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml` on main.
- Shared runtime mutators: None outside that workflow.
- Approved image digest: Record after the workflow succeeds.
- ACA runtime invariant: Verify the web template and sole 100%-traffic revision use the approved digest.
- Worker image invariant: Verify both required worker jobs use the same approved digest.
- Live signed-in proof required: Yes; first verify prerequisite refusal, then capture and fresh readback only when genuine evidence exists.

## Rollback Plan

Revert the route and form through a PR to main. Existing executed-NDA authority rows are immutable and must not be deleted or rewritten during rollback.

## Audit Evidence

PR/CI results, focused tests and mutation run, official deploy run, and digest/runtime readback will be recorded in the private execution ledger.

## Known Gaps

Legal template publication, executed artifact collection and signed-in positive readback remain separate work. The capture path does not infer execution from a filename, hash alone, or a candidate-panel acceptance.
