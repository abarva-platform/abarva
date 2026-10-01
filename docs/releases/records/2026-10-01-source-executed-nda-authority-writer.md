# 2026-10-01 - Event-scoped executed NDA authority writer

## Release ID

`2026-10-01-source-executed-nda-authority-writer`

## Status

`candidate`

## Plain-English Summary

Adds an internal persistence function for executed NDA authority. It records an event-only agreement only when a canonical supplier is accepted on that exact event, the executed artifact is current and hashed on that event, a Legal-published template was applicable when signed, and bilateral signature metadata is complete. No route or form invokes this function yet.

## Layer Impact

- Release lane: `global-control-lane`.
- Layer 3 authority: writes the existing governed NDA authority relation; it does not create supplier identity or contractual terms.
- Layer 4 Source: the current read-only NDA coverage projection is unchanged.

## Client Applicability

- All clients: the function is available to a later authenticated capture route.
- Specific clients: None.
- Internal only: Yes, until a separately reviewed route is connected.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- One transaction-scoped, tenant- and event-fenced authority insert.
- Refusal of absent candidate, foreign-event artifact, incomplete signature evidence, unpublished template, and unverified affiliate scope.
- A focused behavioral suite and a removal mutation of the event predicate.

## QA / Validation

The focused suite was red before the writer existed and green after implementation. Removing the candidate event fence turned the foreign-event case red; the fence was restored. NDA-adjacent suites, TypeScript, scoped ESLint, release validation, and applicable CI are recorded separately as they complete.

## Rollout Plan

Squash merge after applicable CI and release through the repo-owned ACA main deploy workflow. This change has no schema migration, data build, executed-document upload, waiver decision, supplier contact, or external release. The function is not called by a live route in this slice.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml` on main.
- Shared runtime mutators: None outside that workflow.
- Approved image digest: Record after the workflow succeeds.
- ACA runtime invariant: Verify the web template and sole 100%-traffic revision use the approved digest.
- Worker image invariant: Verify both required worker jobs use the same approved digest.
- Live signed-in proof required: Not for this unconnected function; the later capture route requires it.

## Rollback Plan

Revert through a PR to main. No tenant authority row is inserted by this release, so no data rollback is needed.

## Audit Evidence

PR/CI results, focused tests and mutation run, official deploy run, and digest/runtime readback will be recorded in the private execution ledger.

## Known Gaps

The authenticated route, operator form, Legal template publication, executed artifact collection and signed-in positive readback remain separate work. This writer does not infer execution from a filename, hash alone, or a candidate-panel acceptance.
