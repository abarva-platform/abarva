# 2026-10-02 - Event-scoped RFx named-contact approval

## Release ID

`2026-10-02-source-rfx-contact-approval`

## Status

`candidate`

## Plain-English Summary

Adds an authenticated internal action to approve an existing named supplier contact for one sourcing event. The action requires an accepted supplier candidate on that event, a canonical contact with active `contact_allowed` status, a supplier-level contact-allowed policy, a named signed-in reviewer, and an evidence rationale. It records permission only; it does not create a supplier or contact, invite anyone, send email, issue an RFx package, or record a receipt.

## Layer Impact

- Release lane: `global-control-lane`.
- Layer 3: reads canonical supplier and contact identity and policy; does not write them.
- Layer 4 Source: writes only event-specific contact approval authority and refreshes the event projection.

## Client Applicability

- All clients: available to signed-in Source stage approvers when matching governed supplier and contact records exist.
- Specific clients: None.
- Internal only: Yes.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- Transactional, tenant- and event-fenced contact approval writer.
- Signed-in route that binds the tenant, event and reviewer from the session, not submitted form fields.
- Refusal of unknown or foreign-event candidate, supplier or person contact policy that is not allowed, missing rationale, and duplicate active approval.
- Focused repository and route behavior tests.

## QA / Validation

Tests were red before the writer and route implementation and green afterward. Removing the candidate event predicate allowed the foreign-event case to write and made the negative test fail; removing the route permission predicate changed its expected 403 to 201. Both predicates were restored. Final local TypeScript, scoped ESLint, release, orphan, tenancy-census and affected-suite results are recorded with the PR. No live contact approval or external action is claimed.

## Rollout Plan

Squash merge only after applicable CI and review. Deploy only through the repo-owned ACA main workflow. The action has no schema migration, data build, canonical contact write, supplier notification, or package issuance. A future event-page control and prepared-package action must separately consume this authority.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml` on main.
- Shared runtime mutators: None outside that workflow.
- Approved image digest: Record after deployment.
- ACA runtime invariant: Verify the web template, sole 100%-traffic revision and both worker jobs use the approved digest.
- Live signed-in proof required: Yes; verify the refusal path unless an independently sourced active named contact exists for positive approval.

## Rollback Plan

Revert the route and writer through a PR. Existing approved contact-authority rows are immutable; do not delete or rewrite them during rollback.

## Audit Evidence

PR/CI results, local behavior and mutation runs, official deploy run, digest/runtime readback and signed-in replay belong in the private execution ledger.

## Known Gaps

An API action is not an event-page workflow. This release does not register contacts, select respondents, prepare a package, issue it or contact a supplier. Those require separate governed steps.
