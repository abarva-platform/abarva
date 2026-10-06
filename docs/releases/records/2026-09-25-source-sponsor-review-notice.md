# 2026-09-25 Source Sponsor Review Notice

## Release ID

`2026-09-25-source-sponsor-review-notice`

## Status

`candidate`

## Plain-English Summary

The Scope sponsor step can request a review email from the event's uniquely assigned sponsor participant. The email opens the authenticated Scope workspace. An ordinary approver is not substituted for the sponsor, and opening the link does not sign or approve anything. The operator sees whether a real email was sent, only logged in the fallback channel, or failed.

## Layer Impact

- Release lane: `global-control-lane` for a shared Source approval notification control.
- Layer 3: reads the existing tenant/event participant assignment and identity; no schema or row changes.
- Layer 4: adds one explicit request action to the Scope sponsor step and fixed sponsor-review email copy.

## Client Applicability

- All clients: the control is available only where a unique sponsor participant with stage-approval access is recorded and the recipient is on the configured pilot allowlist.
- Specific clients: none.
- Internal only: the current recipient allowlist limits delivery to approved test addresses.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- A sponsor-specific request kind selects one named sponsor participant, never a generic admin fallback.
- The server fixes the email subject, stage and destination to Scope instead of trusting caller-supplied copy or stage keys.
- The Scope task offers an explicit request button and distinguishes provider delivery from logged fallback.
- The email says the review link itself does not approve or sign.

## QA / Validation

- Pass: recipient, route, UI, and email-copy tests failed before implementation; four focused suites passed after the change.
- Pass: removing the sponsor-role check made the ordinary-admin negative test fail; allowing a caller-selected stage link made the fixed-Scope-link test fail. Both mutations were restored and the suites returned to green.
- Pass: scoped ESLint and TypeScript typecheck.
- Not run: live email transmission, tenant recipient assignment, signature, or signed-in approval. These remain deployment and governance decisions.

## Rollout Plan

Merge through a PR after applicable CI and review. Only the repo-owned ACA main workflow may deploy shared runtime changes. Do not enable external recipients at deployment until the client sponsor identity, event assignment, consent, and notification policy are verified. No automatic email fires on a stage transition.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml` only.
- Shared runtime mutators: none outside that workflow.
- Approved digest: determined and checked after merge.
- ACA runtime invariant: web template and sole 100%-traffic revision match the approved digest.
- Worker image invariant: required worker jobs match that digest.
- Feature/env flag update path: none in this release; recipient allowlist configuration is a separate deployment decision.
- Live signed-in proof required: Scope action and unchanged gate state must be checked separately from runtime.

## Rollback Plan

Revert the notification and UI changes through a PR. No data rollback is needed. The existing general approval-notice request remains available.

## Audit Evidence

Focused red/green and mutation test output, PR/CI results, official ACA run and independent runtime readback will be recorded separately. Provider delivery receipts and recipient decisions are not claimed by this release record.

## Known Gaps

- This does not create a digital signature, a delegated-signer authority record, or a completed sponsor commitment. The governed gate remains blocked until verified signer proof and all other criteria are satisfied.
- Milestone-triggered automatic emails, retry/idempotency controls, and client-specific external recipient wiring are not included.
