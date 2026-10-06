# 2026-09-26-source-delegated-sponsor-ack — Delegated Sponsor Acknowledgement

## Release ID

`2026-09-26-source-delegated-sponsor-ack`

## Status

`candidate`

## Plain-English Summary

An authorized client admin or explicitly assigned event delegate can acknowledge the current approved Scope memo on behalf of the event's named sponsor. The product records the actor separately from the sponsor and sends the sponsor a review notice. A provider-accepted email send is recorded as a second, signed receipt; a console fallback or failed send does not complete the delegated proof. This is an authenticated delegate attestation, not the sponsor's personal signature or a legal e-signature. The separate sponsor-and-EA memo-signature criterion remains unchanged.

## Layer Impact

- Release lane: `global-control-lane`.
- Layer 3: No commercial fact, supplier identity, or contract is created or changed. The existing append-only Source approval ledger stores workflow receipts.
- Layer 4: Scope checklist, gate-readiness evaluation, and a tenant-scoped API expose the delegated path.

## Client Applicability

- All clients: code is available after deployment but fails closed by default.
- Specific clients: none automatically enabled.
- Internal only: no.
- Public/demo only: no.
- Feature flag: `SOURCE_SPONSOR_DELEGATION_SIGNING_KEY` must be provisioned with at least 32 bytes; sponsor email must resolve from exactly one event participant and pass `SOURCE_APPROVAL_TEST_RECIPIENT_ALLOWLIST` until client notification provenance is established.

## Changes Included

- A server-signed, version-bound delegate acknowledgement and a separate provider-accepted sponsor-notice receipt in `source_event_approvals`.
- A signed-in action/readback API, mounted Scope control, and readback into the sponsor checklist task.
- `GATE-SCOPE-02` may use verified delegated proof. `GATE-SCOPE-04` still requires distinct sponsor and EA signer proof; all other Scope evidence and criteria remain governed.

## QA / Validation

- Pass: red-first behavior for the signer-proof path and checklist readback; negative tests for wrong event, sponsor, actor, stale artifact, forged database metadata, absent key, failed or logged-only email, unprivileged actor, and ambiguous sponsor.
- Pass: focused Jest suites, TypeScript, scoped ESLint, and release validation (see PR checks for exact commands and counts).
- Not run: live notification, tenant write, and signed-in delegated action. This release does not assert a changed live Scope gate.

## Rollout Plan

Merge only after CI and review. The repo-owned ACA main workflow deploys code. A client operator must separately provision a high-entropy signing key and approved sponsor-recipient policy through the controlled environment-update path before use. A signed-in synthetic readback should then prove the button, receipt pair, current-file binding, and remaining Scope blockers. No agent-run email or shared-runtime configuration mutation is part of this release.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml` only.
- Shared runtime mutators: none in this release.
- Approved image digest: to be recorded after merge/deploy.
- ACA runtime invariant: web template and sole 100%-traffic healthy revision must match the approved digest.
- Worker image invariant: required workers must match the same digest.
- Feature/env flag update path: separate authorized repo-owned change; never an ad-hoc Container App update.
- Live signed-in proof required: yes, after configuration, and separately from runtime proof.

## Rollback Plan

Keep the signing key unset to disable new delegate actions. If already enabled, disable the controlled configuration and revert the code by PR. Existing append-only receipts remain auditable but cannot satisfy the proof check when the key is absent. A key rotation needs a receipt migration or an explicit old-key verification window; do not silently rotate it.

## Audit Evidence

The PR, red-first/negative tests, CI results, official ACA run, digest readback, and later signed-in action/readback proof are separate evidence layers. No client-identifying record belongs in this public release note.

## Known Gaps

- The email provider's accepted-send response is not proof of inbox delivery; bounce handling and retry/outbox monitoring are not yet implemented.
- Signed-document verification and EA signer proof remain separate and are not fabricated by a delegate action.
- The path is unavailable until a client-specific recipient policy and signing key are provisioned. No migration or data build is required for this code path.
