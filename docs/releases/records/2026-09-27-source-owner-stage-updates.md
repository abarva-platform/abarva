# Source Owner Stage Decisions and Stakeholder Updates

## Release ID

`2026-09-27-source-owner-stage-updates`

## Status

`candidate`

## Plain-English Summary

For events created with Event Owner approval policy, the signed-in event creator or client admin makes the Scope decision. The approval records the sponsor's name, title, role and notification address as context, without attributing a signature or approval to that person. After a stage approval, the named sponsor and eligible event participants receive an informational update rather than an approval request, subject to the approved recipient fence.

## Layer Impact

- Release lane: `global-control-lane`.
- Layer 4 (Source): changes the approval form, server-side decision record, and event-participant notification behavior. It does not write supplier, price, contract or other canonical Layer 3 facts.
- Existing append-only Source approval and activity ledgers retain the approving actor and notification outcome. No schema or intake change.

## Client Applicability

- All clients: newly created events already using the explicit `self_v1` policy receive the Scope form requirement. Stage updates are limited to event participants with sponsor role or `source_event_update` preference and an approved recipient email.
- Historical signed-scope events: existing approval policy and signer controls remain unchanged.
- Internal only: the current recipient allowlist remains a delivery fence until client-specific notification provenance is provisioned.

## Changes Included

- Server validation and append-only attribution for sponsor context at Event Owner Scope approval.
- The mounted Source approval card collects sponsor context and the approver's explicit acknowledgement.
- Event-scoped post-decision email update with separate provider-acceptance audit and address deduplication. SELF events cannot issue sponsor or stage approval-request emails.
- SELF events cannot advance through the direct stage route or let other stage reviewers record criterion or lifecycle decisions.
- Focused route, UI, validation, and notification tests.

## QA / Validation

- Pass: focused Jest suites for approval, request-approval, mounted canvas, sponsor context and stage updates.
- Pass: full TypeScript check with an 8 GB Node heap.
- Pass: scoped ESLint on changed source files.
- Not run: production signed-in approval, email provider delivery, opposite-tenant live readback and full Source lifecycle smoke.

## Rollout Plan

Open a PR, pass applicable CI and review, squash-merge, and let only the repo-owned ACA main workflow deploy the exact merge SHA. Keep the recipient allowlist narrow. A client rollout must provision approved recipient identities and verify an actual provider message receipt separately from the decision record.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml` after merge only.
- Shared runtime mutators: none in this candidate.
- Approved image digest: pending main deploy.
- ACA runtime invariant: pending read-only digest and 100%-traffic verification.
- Worker image invariant: pending read-only verification.
- Feature/env flag update path: no environment change in this candidate.
- Live signed-in proof required: yes, approve a synthetic eligible stage and read back the actor, sponsor context, notification channel and next-stage state.

## Rollback Plan

Revert the PR and redeploy through the repo-owned main workflow. Existing append-only approval and activity records remain; do not delete or rewrite them. No database migration is involved.

## Audit Evidence

- PR, CI and official deploy links: pending.
- Local focused Jest, TypeScript, scoped ESLint and release-check output: candidate validation.
- Signed-in and provider delivery evidence: not yet captured.

## Known Gaps

- Historical signed-scope events retain their immutable policy. Replacing it requires an explicit audited amendment or a new event; this candidate does not silently reclassify them.
- Only allowlisted sponsor or participant emails can be sent. A console fallback is recorded as `logged_fallback`, not delivered mail.
- Other stage evidence and readiness criteria still apply; sponsor context alone cannot advance Scope.
