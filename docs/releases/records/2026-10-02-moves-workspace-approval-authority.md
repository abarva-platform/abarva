# Moves Workspace Approval Authority

## Release ID

`2026-10-02-moves-workspace-approval-authority`

## Status

`candidate`

## Plain-English Summary

Moves product approvals are recorded by an authenticated workspace user with approval permission for the specific Move. Sponsors are listed as contacts only. A sponsor receives phase-progress email only when the workspace user explicitly opts that contact in; the email is informational and asks for no approval or signature.

## Layer Impact

- **Release lane:** `global-control-lane`.
- **Products:** Updates Moves approval controls, contact presentation, and phase-progress notifications.
- **Canonical model:** Sponsor participant rows are treated as contributor contacts, not approval authorities. No schema migration is included.
- **Adapters:** Approval endpoints resolve the exact engagement before checking permissions; they fail closed if the program-to-tenant mapping or Move row cannot be resolved.
- **Client intake:** Captures the listed contact and an explicit phase-progress email preference, off by default.

## Client Applicability

- All clients: Moves behavior applies to authenticated users with the corresponding Move-level approval permission.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- Retires separate sponsor workflow-commitment and approval-request writes.
- Retires per-role deliverable approval writes; existing role rows remain read-only history and cannot gate sign-off.
- Removes sponsor approval panels and actions from Moves.
- Enforces Move-scoped approval permission on phase advancement, deliverable sign-off, evidence review, artifact decisions, and option approval.
- Stores sponsor contacts without approval authority and sends phase-progress messages only to opted-in sponsor contacts.
- Adds regression coverage for legacy route scope, sponsor-contact permissions, and notification recipient selection.

## QA / Validation

- Approval-path regression sweep: 24 suites, 305 tests passed.
- Full Programs unit suite: 100 suites, 886 tests passed; legacy client-generated sponsor-approval text remains rejected as non-authoritative.
- AI surface controls: 24 suites, 235 tests passed; all 40 credited controls and 129 named cases were found and passed.
- TypeScript check passed with Node 24 and a 6 GB heap.
- Focused ESLint passed with zero errors; the full-source lint also reported zero errors and repository warnings.
- Test-CI census is current; the library orphan audit reports no change against baseline.
- Local release-check passed all 11 gates against the current `main`; GitHub CI is pending revised-PR validation.
- Signed-in production verification is pending deployment and must not be inferred from these tests.

## Rollout Plan

Merge through the protected `main` PR flow. Deploy only through the repository-owned ACA main deploy workflow. No feature flag or database migration is required.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`
- Shared runtime mutators: None outside the workflow.
- Approved image digest: Pending workflow build.
- ACA runtime invariant: Verify the template image, 100%-traffic revision, and required worker jobs use the same approved digest.
- Worker image invariant: Verify against the exact deployment run.
- Feature/env flag update path: None.
- Live signed-in proof required: Yes. Verify authorized-user approval controls and confirm sponsor contacts cannot approve; verify progress email is sent only for explicitly opted-in contacts.

## Rollback Plan

Revert the release through a follow-up PR and deploy it through the ACA main deploy workflow. If urgent runtime rollback is needed, use the repository runbook to restore the previously approved digest and verify the runtime invariant. No tenant data migration needs reversal.

## Audit Evidence

- Pull request: Pending.
- CI run: Pending.
- ACA deployment run and digest: Pending.
- Signed-in verification: Pending.

## Known Gaps

Production signed-in verification and email-delivery proof have not yet been completed. Historical approval requests remain reviewable by an authorized workspace user; sponsors cannot decide them, and no new sponsor approval requests are created.
