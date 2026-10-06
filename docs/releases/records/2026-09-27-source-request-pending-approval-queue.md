# 2026-09-27-source-request-pending-approval-queue - Pending intake decisions

## Release ID

`2026-09-27-source-request-pending-approval-queue`

## Status

`candidate`

## Plain-English Summary

An event awaiting its initial human intake approval now remains in the request queue, with a direct link to the decision page. It no longer appears under accepted event work before approval. Events already past Strategy remain in event work even when a later stage waits on a client decision.

## Layer Impact

`global-control-lane`: Layer 4 Source presentation only. No canonical record, adapter, tenant data, approval policy, or write route changes.

## Client Applicability

- All clients: Source New request-first workspace.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

The Source New request-first page partitions Strategy events waiting on the client from accepted event work. The server page supplies the existing canonical stage key to that projection. No schema or data migration is included.

## QA / Validation

- Pass: red-first component tests reproduced both pending-as-accepted and loss of pending visibility when the imported-request registry is unavailable.
- Pass: 12/12 request-first component tests, 4/4 adjacent page tests, and 21/21 request authority, handoff, repository, and approval-route tests.
- Pass: mutation removing the Strategy fence failed the later-stage client-decision regression, then the restored implementation passed.
- Pass: TypeScript with Node 24 and an 8 GiB heap; scoped ESLint.
- Pass: signed-in pre-deploy readback reproduced the pending event under Accepted work. Post-deploy signed-in readback is required and not yet claimed.
- Not run: live imported-request positive path. No tenant request rows were loaded for this release.

## Rollout Plan

Squash merge after applicable PR checks and review. Only the repo-owned ACA main workflow may deploy the merged image. No database apply, data build, external notification, or traffic command is part of this change.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`.
- Shared runtime mutators: None outside that workflow.
- Approved image digest: Read from the official workflow after merge.
- ACA runtime invariant: Verify web template and 100%-traffic revision match the approved digest.
- Worker image invariant: Verify both required delivery workers match the same digest.
- Feature/env flag update path: None.
- Live signed-in proof required: Yes, pending and accepted work must appear in the correct sections.

## Rollback Plan

Revert this presentation change by PR and let the repo-owned main workflow deploy. No stored decisions or schema need reversal.

## Audit Evidence

Focused tests and mutation proof in this branch; PR, CI, deploy and signed-in readback to be added after they occur.

## Known Gaps

Product-wide request intake is not certified at 100% by this change. Live imported-request positive readback, source-version reconciliation after a linked request changes, and an accountable human approval on a new event are separate acceptance items. This release performs none of those data or decision actions.
