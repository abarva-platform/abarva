# 2026-10-06 Source Prospective Supplier Intake

## Release ID

`2026-10-06-source-prospective-supplier-intake`

## Status

`candidate`

## Plain-English Summary

A signed-in Source stage approver can record a prospective supplier that is not yet in an ERP, with a named contact, contact-recording confirmation, and a reason for adding it. The resulting supplier identity is provisional and tenant-scoped. This action does not send a message, approve event-specific contact, create an NDA, or enable payment.

## Layer Impact

`client-data-lane`. Layer 1 captures an operator-declared supplier and contact. The Source intake writer validates and maps that declaration to Layer 3 canonical supplier and contact identities, then records event-specific candidate authority. Layer 4 exposes the action in the Source vendor panel. Source does not become the owner of supplier facts.

## Client Applicability

- All clients: available to authorized Source stage approvers on events with an accepted current Request and a mapped supplier archetype.
- Specific clients: none.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- Adds an authenticated prospective-supplier origination route, transaction writer, and compact Stage 04 operator control.
- Uses existing canonical supplier, contact, and candidate-authority tables; no migration or data load is included.
- Adds exact-path CI selection for writer, route, and form behavior tests.

## QA / Validation

- Focused Jest suites: 11 tests passed locally.
- TypeScript `tsc --noEmit`: passed locally.
- Contact-permission mutation: bypassing the guard made its negative test fail; the guard was restored.
- Coverage census regenerated with all three new suites selected by CI.
- PR CI, runtime, and signed-in acceptance: pending.

## Rollout Plan

Squash-merge after applicable checks and review. Deploy only through the repo-owned ACA main workflow. No migration, tenant data load, or automatic supplier contact is required or authorized by this release.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`.
- Shared runtime mutators: none outside that workflow.
- Approved image digest: pending build.
- ACA runtime invariant: verify digest-pinned web template, 100% traffic revision, and required workers after deploy.
- Worker image invariant: no worker code changed; verify at rollout.
- Feature/env flag update path: none.
- Live signed-in proof required: add a clearly synthetic provisional supplier to a synthetic event, read it back in the panel, and verify no contact was sent.

## Rollback Plan

Revert the route and UI through a new PR and main deploy. Previously written canonical identities and accepted candidate authority remain audit records; retire an incorrect candidate using the governed retirement path rather than deleting history.

## Audit Evidence

The PR diff, focused test output, CI run, deploy run, ACA digest readback, and signed-in synthetic-event replay. These are distinct proofs and are not interchangeable.

## Known Gaps

Prospective supplier intake does not grant event-specific contact authority, send an NDA, create a payable vendor, or onboard an ERP record. Those remain separate governed workflows.
