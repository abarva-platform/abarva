# 2026-07-20-decouple-build-queue-approve — Decouple Approve & Build queueing from gate-approval submission

## Release ID

`2026-07-20-decouple-build-queue-approve`

## Status

`candidate`

## Plain-English Summary

Part of the Phase Advancement Control and Override Governance program (follow-up to the MEMBER
AI ASSIST phase-fabrication incident). `PhaseApproveAndBuild.tsx`'s "Approve & Build" button used
to call the parent's gate-approval callback (`onBuildQueued`) the instant generation jobs were
*queued* — before any of them had actually finished (or failed). The parent
(`MovesPhaseStandaloneClient.tsx`'s `approvePhaseGateAfterBuild`) would then immediately submit
`POST /phase-gate-approval`, so gate approval could be requested while real generation was still
in flight, or after it had already failed, with the UI treating "queued" as good enough.

This release replaces `onBuildQueued` with `onBuildSettled`, which fires exactly once, only after
every deliverable in the batch reaches a terminal status (`succeeded`, `blocked`, `failed`, or an
enqueue-time `error`) — read from the same persisted run-status polling the component already
performs, not from optimistic queue-time state. It reports `succeededKeys` and `failedKeys`
separately so the parent can refuse to request gate approval at all when anything failed, instead
of silently treating a partial or failed batch as done.

Server-side, `evaluateGate` (already hardened this session, and no longer fabricatable per the
companion fix in `2026-07-20-phase-gate-fabrication-fix.md`) remains the final authority — this is
a defense-in-depth UX/sequencing correction, not a new server-side check.

## Layer Impact

- **global-control-lane**: `PhaseApproveAndBuild`/`MovesPhaseStandaloneClient` are the shared
  Strategic Moves phase workspace UI used by every client. This changes the client-side sequencing
  of gate-approval requests for all tenants identically.

## Client Applicability

- All clients: Yes
- Specific clients: None
- Internal only: No
- Public/demo only: No
- Feature flag: None

## Changes Included

- `src/components/strategic-moves/PhaseApproveAndBuild.tsx`: replaced `onBuildQueued` prop with
  `onBuildSettled` (new `BuildSettledResult` type: `succeededKeys`/`failedKeys`/`total`); added a
  settle-detection effect that fires the callback once every row in the batch is terminal; the
  batch-queue POST no longer calls the gate-approval callback itself.
- `src/components/strategic-moves/MovesPhaseStandaloneClient.tsx`: `approvePhaseGateAfterBuild`
  now takes `{ succeededKeys, failedKeys, total }`; throws (blocking gate submission) when
  `failedKeys.length > 0` or when nothing succeeded; `approveP0Gate`'s synthetic call updated to
  match; prop/type renamed through `PhaseBody`.
- `src/components/strategic-moves/__tests__/phase-approve-and-build-settle.test.tsx`: new test
  file proving `onBuildSettled` does not fire while a run is queued/running, correctly separates
  succeeded vs. failed keys, and handles an enqueue-time error with no run/poll involved.

## QA / Validation

- `npx jest src/components/strategic-moves/__tests__/phase-approve-and-build-settle.test.tsx` — 3/3 passed.
- `npx jest src/components/strategic-moves/__tests__/MovesPhaseStandaloneClient.test.tsx` — 21/21 passed (existing suite, unmodified, confirms the end-to-end Approve & Build → gate-approval flow still works when generation succeeds).
- `npx eslint` on all three changed files — 0 errors.
- `git diff --check` — clean.
- `npx tsc -p . --noEmit` — crashes on this machine (known, pre-existing local environment issue; CI's typecheck job is authoritative per established session practice).
- `node scripts/release-check.mjs --base origin/main --head HEAD` — pass (after this record was added).
- No live phase transition was run against production data for this change, per the standing
  constraint from the incident follow-up — verification is unit/integration-test-only.

## Rollout Plan

Standard PR → CI → squash merge to `main` → `aca-main-deploy.yml` builds and deploys the shared
web image → 100% traffic shift → ACA runtime-invariant verification → signed-in browser smoke
check of the Moves phase workspace UI rendering and button labels (no new live phase transition
attempted on a real Move).

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml` (unchanged by this PR)
- Shared runtime mutators: none
- Approved image digest: set by the deploy workflow at merge time; verified post-deploy
- ACA runtime invariant: verified post-deploy
- Worker image invariant: not applicable
- Feature/env flag update path: not applicable
- Live signed-in proof required: yes, read-only UI smoke check only (no phase transition)

## Rollback Plan

Revert this PR. Pure client-side sequencing change with no data migration; a revert restores the
prior (buggy) immediate-approval-on-queue behavior, which remains safe from silent false-passes
because the companion fabrication fix (`2026-07-20-phase-gate-fabrication-fix.md`) independently
makes `evaluateGate` reject premature/incomplete evidence regardless of when it is called.

## Audit Evidence

- This release record.
- PR (to be opened) with the diff and CI run link.
- New test file: `src/components/strategic-moves/__tests__/phase-approve-and-build-settle.test.tsx`.
- Companion fix: `docs/releases/records/2026-07-20-phase-gate-fabrication-fix.md` (PR #5158).

## Known Gaps

- This is a client-side UX/sequencing fix, not a new server-side control. The remaining items in
  the Phase Advancement Control and Override Governance program — explicit, governed override
  mechanism (mandatory reason, named approver, immutable audit record) and the full 8-scenario
  regression suite spanning all phase-advancement endpoints — are tracked as separate follow-on
  PRs, not bundled here.
- The stale-type-key free-text loophole found in `phase-capture/route.ts` during the companion
  fix's verification pass (see that record's Known Gaps) is unrelated to this change and remains a
  separate, flagged follow-on item.
