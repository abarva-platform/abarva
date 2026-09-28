# 2026-09-28 Source Strategy owner confirmation persistence

## Release ID

`2026-09-28-source-strategy-confirmation-persistence`

## Status

`candidate`

## Plain-English Summary

The Strategy checklist could appear complete in one browser session without saving the human confirmation. This release records the Event Owner's explicit decision in the existing append-only Source activity trail and reads it back against the current event version. A changed mandate invalidates the earlier confirmation. Artifact review and stage approval remain independent.

## Layer Impact

- Release lane: `global-control-lane`.
- Layer 4 Products: Source Strategy checklist, route, and readback only.
- Layer 3 Canonical Model: No schema, supplier, commercial fact, or data migration. The existing Source activity trail records a workflow action, not a sponsor signature or approved strategy artifact.

## Client Applicability

- All clients: Forward `self_v1` Source events at the Strategy stage.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None. Historical strict-policy events retain their external-approval requirements.

## Changes Included

- Bind the confirmation to the current event, client, policy, mandate, owner, value thesis, and revision.
- Require current stage, tenant, owner/client-admin approval rights, explicit confirmation, and a matching version before appending an activity receipt.
- Show checklist completion only after the current receipt is read back. Do not offer a local-only Strategy completion when no governed confirmation path is available.

## QA / Validation

- Pass: red-first tests reproduced the transient client-only completion and missing durable confirmation.
- Pass: focused route, readback, policy and checklist suites, including denied actor, wrong tenant, strict-policy, changed mandate and failed-write cases.
- Pass: a deliberate mutation ignoring the saved version was caught by two readback tests and restored.
- Pass: adjacent Source UI suites, Node 24 TypeScript, scoped ESLint, and release control before PR.
- Not run: signed-in persisted confirmation until the exact main deployment.

## Rollout Plan

Squash merge after applicable CI/review, then use only the repo-owned ACA main deploy workflow. No migration or data build is included.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`.
- Shared runtime mutators: None outside that workflow.
- Approved image digest: Resolve from the successful main workflow.
- ACA runtime invariant: Verify digest-pinned template and 100%-traffic revision.
- Worker image invariant: Verify both required worker jobs match the approved digest.
- Feature/env flag update path: Not applicable.
- Live signed-in proof required: Yes, confirm and fully reload an authorized synthetic Strategy event.

## Rollback Plan

Revert via a reviewed PR and the same main deploy workflow. Existing append-only decision receipts remain audit history but no longer drive task completion after rollback.

## Audit Evidence

PR, CI, main deploy run, runtime digest readback, and signed-in replay are recorded in the private smoke ledger.

## Known Gaps

This action does not accept the strategy memo or value target, satisfy gate criteria, approve the stage, contact suppliers, or advance the event. Those are separate governed decisions.
