# 2026-09-18-source-self-approval-recorded - Make The Self-Approval Notice True

## Release ID

`2026-09-18-source-self-approval-recorded`

## Status

`candidate`

## Plain-English Summary

When the person approving a sourcing event is the same person who created it, the approval screen shows a self-approval notice. The notice told the approver the audit log would flag the action. The server no longer knew: a 7 July 2026 refactor dropped the creator id from the event read and removed the derived self-approval marker, so nothing about the decision recorded that the approver and the creator were the same person.

The only remaining signal was a client-supplied flag. A caller that omitted it self-approved with no check and no record, including when the strict separation-of-duties mode was enabled.

The server now derives self-approval from the stored creator and the authenticated caller, records it on the append-only approval record, and applies the strict-mode refusal on the derived fact rather than on the caller's flag. The on-screen notice is reworded to state exactly what happens.

## Layer Impact

`global-control-lane`. One API route's read and record composition, and one line of UI copy. No schema, migration, adapter or projection change.

## Client Applicability

- All clients: Source event approval.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: `GATE_APPROVAL_STRICT_MODE` governs the refusal, unchanged; this change decides what the flag is evaluated against.

## Changes Included

- `src/app/api/v1/source/events/[eventId]/approve/route.ts`: selects `created_by_user_id`; derives `isSelfApproval` from it and the authenticated caller; the strict-mode refusal now fires on the derived fact or the client flag; `composeApprovalNotes` prefixes the self-approval notice onto the record.
- `src/components/source/approval/EventApprovalCard.tsx`: the notice states that the decision is marked as a self-approval on the approval record, rather than promising a flag in an audit log view that does not display one.
- `src/app/api/v1/source/events/[eventId]/approve/__tests__/route.test.ts`: three tests.

### Deliberately unchanged

The pilot readiness bypass still keys off the explicit client flag
(`allowComputedReadinessBypass`). Routing it through the derived value would
*widen* who skips readiness checks, which is the wrong direction for a change
about accountability. This change only narrows the refusal and adds the record.

## QA / Validation

- `src/app/api/v1/source/events`: **25 of 25 pass**, including the three new cases — the notice is recorded when the creator approves without any client flag; an ordinary approval is not marked; a strict-mode self-approval is refused (403) even when the client omits the flag, with no approval written.
- Mutation check: reverting the route to trust only the client flag fails two of the three — so the guard is falsifiable.
- `src/components/source/approval`: **9 of 9 pass**.
- Full-project `tsc --noEmit`: **pass**. Scoped ESLint: **pass**.
- **Correction, 18 Sep 2026:** the local typecheck quoted above did not run. `npx tsc --noEmit` on the authoring machine exits 134 — a V8 out-of-memory crash that emits no diagnostics — and its output was filtered for `error TS`, so the crash read as clean. The authoritative typecheck for this change is the CI job on its pull request, which passed. Re-running locally as `NODE_OPTIONS=--max-old-space-size=6144 npx tsc --noEmit` exits 0. The ESLint and test results above were produced by commands that completed and are unaffected.
- Signed-in acceptance: **not run** — blocked, host machine locked.

## Rollout Plan

Squash-merge after required checks pass; the repo-owned ACA main deploy workflow publishes the change. No migration and no data build.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`.
- Shared runtime mutators: None in this change.
- Approved image digest: To be recorded after deploy.
- ACA runtime invariant: Required after deploy.
- Worker image invariant: Required after deploy.
- Feature/env flag update path: None.
- Live signed-in proof required: As the creator of an event, approve it and confirm the approval record carries the self-approval line; with strict mode enabled, confirm the same approval is refused.

## Rollback Plan

Revert through a new PR and the repo-owned deploy workflow. Records already written keep their notice text; nothing is migrated.

## Audit Evidence

PR link, test output and the mutation result to be added when available.

## Known Gaps

- The approval-decision activity-log write that the same refactor removed is **not** restored here. `source_event_approved` has no writer anywhere in the repository, so lifecycle decisions remain absent from the activity table that roughly a dozen sibling Source routes write to. That is a separate change.
- The inline approval queue on the events list still has neither the self-approval notice nor the rationale minimum that the dedicated approval route enforces. Its imports for both are present but unused.
- No signed-in browser proof yet.
