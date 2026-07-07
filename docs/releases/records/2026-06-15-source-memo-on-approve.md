# 2026-06-15-source-memo-on-approve — Approving the intake also generates the strategy memo

## Release ID

`2026-06-15-source-memo-on-approve`

## Status

`candidate`

## Release Lane

`global-control-lane`

## Plain-English Summary

Completes the Strategy-at-P0 model: clicking **Approve** on the intake now also **generates the strategy memo**,
as part of the same action — so "approve" produces the deliverable *and* (via the prior change) advances the
event to Scope. No separate Strategy stage, no manual draft.

It reuses the existing **governed, heartbeat-protected** generate route (the same one "Draft with Sentinel"
uses) — the approval card chains a call to it after the approval succeeds, showing "Approved — generating your
strategy memo…" during the ~30-60s Anthropic call. It is **best-effort**: if the memo can't be produced, the
approval still stands and the user moves on (the strategy substance lives in the captured intake facts, and the
memo can be drafted later from the Workspace). It is gated by the same `source_strategy_at_p0` flag.

Deliberately implemented as a **client-side chain to the proven generate route**, not by refactoring the
1006-line generate handler into a service called from the approval write path — that refactor would touch the
two most governance-critical subsystems (approval + generation) at once, which this avoids.

## Layer Impact

- `global-control-lane`: `EventApprovalCard` gains a `generateMemoOnApprove` prop; when set, a successful
  `approve` chains `POST /artifacts/d01_strategy_memo/generate` (existing route) before navigating. The approval
  page resolves the `source_strategy_at_p0` flag and passes the prop. No schema, API, or generation-path change.

## Client Applicability

- All clients: no change with the flag off.
- Specific clients: SkyHarbor — where `source_strategy_at_p0` is enabled; approving now also generates the memo.
- Internal only: None.
- Public/demo only: None.
- Feature flag: `source_strategy_at_p0` (same flag as the approve→Scope advance, so the two move together).

## Changes Included

- `EventApprovalCard.tsx`: `generateMemoOnApprove` prop; on successful approve, best-effort chain to the
  governed `d01_strategy_memo` generate route with an in-flight notice.
- `approval/page.tsx`: resolve `source_strategy_at_p0` and pass `generateMemoOnApprove`.

## QA / Validation

- PASS: `npx eslint` clean on both files · `tsc --noEmit` clean.
- Pending: live on ACA — approve a fresh SkyHarbor intake, confirm the "generating your strategy memo" notice,
  that the memo persists, and that you land in Scope.

## Rollout Plan

Merge → CI → rebuild image → `containerapp update` → shift traffic → approve a fresh event and confirm the memo
generates as part of approval (the `source_strategy_at_p0` env flag is already set for SkyHarbor).

## Rollback Plan

Unset `source_strategy_at_p0` (also reverts the approve→Scope advance) or revert the PR. With the flag off the
approval behaves exactly as before.

## Audit Evidence

PR diff (approval-card chain + page flag wiring + this record), CI checks, local eslint/tsc output, and the
post-deploy capture of an approval generating the memo and landing in Scope.

## Known Gaps

- The chain is **best-effort and synchronous in the client** — a slow/failed generation surfaces as the user
  moving on without a memo (recoverable from the Workspace). A durable async approval-time generation (so the
  memo is guaranteed without holding the click) is the longer-term follow-on.
- If the generate route enforces stage at call time, generating `d01` after the event has advanced to Scope
  relies on it keying by artifact code (the observed behavior); worth confirming in the live check.
