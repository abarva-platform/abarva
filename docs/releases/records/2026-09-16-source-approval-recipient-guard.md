# 2026-09-16 Source Approval Recipient Guard

## Release ID

`2026-09-16-source-approval-recipient-guard`

## Status

`candidate`

## Plain-English Summary

Source approval notifications can only be addressed to the sole named approver assigned to the event. The request body cannot supply an email address, and the mailer no longer chooses a default recipient. The current pilot lane also limits delivery to an explicit internal recipient allowlist.

## Layer Impact

- Layer 4, Source: the approval-request route validates the event, caller scope, participant assignment, identity and recipient before sending.
- Control plane: the notification helper requires an explicit recipient. No Layer 1-3 data or schema changes.

## Client Applicability

- All clients: recipient resolution and event authorization are required.
- Internal only: outbound pilot recipients must match the internal test allowlist.
- Feature flag: none.

## Changes Included

- Source event approval-request route and notification recipient policy.
- Approval notification helper and focused behavior tests.
- No migrations or data builds.

## QA / Validation

- Focused Jest route, policy and mailer tests: 14 passed.
- TypeScript, scoped ESLint and release check are required before PR creation.
- No outbound email was sent in validation; the mail channel was mocked.

## Rollout Plan

Merge through a reviewed PR. The repo-owned ACA main deploy workflow builds and deploys the digest-pinned image. Configure `SOURCE_APPROVAL_TEST_RECIPIENT_ALLOWLIST` only with approved internal addresses if additional test recipients are needed. Prove the ACA runtime invariant and a signed-in, non-sending authorization check before marking live-proven.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`.
- Shared runtime mutators: none outside that workflow.
- Approved image digest: pending deploy.
- ACA runtime invariant: pending deploy.
- Worker image invariant: unchanged; verify after deploy.
- Feature/env flag update path: repo-owned workflow with digest pin; no direct runtime edit.
- Live signed-in proof required: yes.

## Rollback Plan

Roll back to the last approved ACA image digest through the repo-owned workflow. No database rollback is required. Keep outbound delivery disabled during investigation if participant resolution cannot be trusted.

## Audit Evidence

- PR and CI links: pending.
- Local test output and release check: captured in the task summary.
- Signed-in proof: pending.

## Known Gaps

The current pilot policy intentionally blocks recipients outside the internal test allowlist. A separate reviewed policy and authoritative tenant classification are required before external approver email delivery is enabled.
