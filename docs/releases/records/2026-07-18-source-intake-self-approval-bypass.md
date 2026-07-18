# 2026-07-18-source-intake-self-approval-bypass — Source: Fix Self-Approval Blocked at Event Intake

## Release ID

`2026-07-18-source-intake-self-approval-bypass`

## Status

`candidate`

## Plain-English Summary

Found live: a freshly-created Source event's intake approval could not be self-approved by its own creator, even in pilot mode. The approval page showed a hard, red-blocking error — "Sourcing strategy memo signed by sponsor is pending." — and clicking Approve failed with a 409 from the server, every time, for every new event, regardless of user or role.

Root cause: the event-creation approval is designed to advance the event's stage from `strategy` to `scope`, which triggers `GATE-STRATEGY-01` — a gate criterion that checks whether the `d01_strategy_memo` artifact has been authored and approved. But that memo is drafted *inside* the working canvas — the exact thing this approval unlocks. The check was circular: the canvas needed to produce the memo couldn't be reached until the gate requiring the memo cleared.

The server already has the correct escape hatch for exactly this situation: a `selfApproveIfAuthorized` flag that bypasses computed-readiness checks when the approver is the event's own creator, in pilot mode — and the server independently re-verifies this is safe (it flatly rejects the bypass, regardless of what the client sends, whenever `GATE_APPROVAL_STRICT_MODE` is on). This exact mechanism is already used and tested for later-stage advances (`/api/v1/source/[eventId]/stage`). `EventApprovalCard.tsx` — the component behind the event-creation approval specifically — simply never sent it.

## Layer Impact

- `global-control-lane`: `EventApprovalCard.tsx` is the shared Source event-intake approval surface for every tenant.

## Client Applicability

- All clients: yes — this affected every tenant's ability to self-approve a newly-created Source event in pilot mode, not just the tenant it was found on.
- Specific clients: none.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none (server-side `GATE_APPROVAL_STRICT_MODE` continues to govern whether the bypass is ever honored — unchanged by this release).

## Changes Included

- `src/components/source/approval/EventApprovalCard.tsx`: the "approve" POST body now includes `selfApproveIfAuthorized: action === "approve" && isSelfApproval && pilotMode` — reusing the exact `isSelfApproval && pilotMode` condition already used elsewhere in this same component (the "Self-approval notice" banner), for consistency. No new state, no new props.
- `src/components/source/approval/__tests__/EventApprovalCard.test.tsx`: added two tests — one proving the flag is sent as `true` when the approver is the event's own creator in pilot mode, one proving it's `false` when a *different* user is approving (i.e., the fix is correctly scoped, not an unconditional bypass).

## QA / Validation

- Pass: `npx eslint` on both touched files.
- Pass: `NODE_OPTIONS=--max-old-space-size=8192 npx tsc --noEmit --pretty false --incremental false`
- Pass: `npx jest src/components/source/approval/__tests__/EventApprovalCard.test.tsx` — 5/5, including the 2 new tests.
- Pass: `npx jest src/components/source/approval src/lib/source/gate-advance-contract src/app/api/v1/source/events` (broader sweep) — 14/14, no regressions.
- No server-side code changed — `evaluateSourceGateAdvanceContract`/the `/approve` route's handling of `selfApproveIfAuthorized` and `GATE_APPROVAL_STRICT_MODE` were read and confirmed correct as-is; this release only fixes the client's failure to send a flag the server was already built to receive and validate.
- Found and root-caused via a live signed-in walkthrough on the FS Demo (First Capital) tenant — reproduced the exact 409/red-error blocker end to end before diagnosing and fixing it.
- Not run: automated live signed-in browser proof (no valid local Clerk session in this sandboxed environment) — the live reproduction above was done by the user directly in their own real browser session, not by me.

## Rollout Plan

Merge to `main`, deploy through the repo-owned ACA main deploy workflow. No data migration, no flag, no worker job.

## Deployment Authority

- Repo-owned deploy workflow: required.
- Shared runtime mutators: none.
- Approved image digest: produced by the ACA main deploy workflow after merge.
- ACA runtime invariant: required after deploy.
- Worker image invariant: not applicable.
- Feature/env flag update path: none.
- Live signed-in proof required: yes — create a fresh Source event on any pilot tenant, self-approve the intake as the creator, confirm it succeeds and the working canvas unlocks (no more red "Sourcing strategy memo signed by sponsor is pending" blocker on this first approval).

## Rollback Plan

Revert this PR and redeploy through the ACA main deploy workflow. No data or schema changes to unwind.

## Audit Evidence

- This PR's diff.
- `EventApprovalCard.test.tsx` full pass (5/5) plus broader sweep (14/14).
- Live reproduction of the bug end-to-end on FS Demo, screenshots in this session's transcript.
- ACA main deploy run after merge.
- Post-deploy live signed-in proof (pending).

## Known Gaps

- Did not touch whether `GATE-STRATEGY-01`'s `fromStage`/`toStage` scoping is itself correct long-term — the underlying gate criterion is still checked at event-creation time; this release only ensures pilot-mode self-approvers can legitimately bypass it, matching the same pattern already used for every later-stage advance. A cleaner long-term fix might move this specific criterion off the creation-time transition entirely — out of scope here, and lower priority now that the actual blocker is resolved.
- Did not audit whether other approval surfaces in Source (or Moves/Tower) have the same client-side gap (server bypass exists, client never sends it) — this release fixes the one confirmed, live-reproduced instance.
