# 2026-06-18-moves-p0-approval-and-deterministic-capture — Human-executable P0→P1 (in-place approval + deterministic capture)

## Release ID

`2026-06-18-moves-p0-approval-and-deterministic-capture`

## Status

`candidate`

## Plain-English Summary

The state machine for Strategic Moves is now correct (see `2026-06-18-moves-state-reconciliation`), but two things still forced console/API rescue and kept the lifecycle from being demo-safe. This change makes the P0→P1 path executable by a human end-to-end:

1. **In-place P0 brief approval.** Approving the origination brief is what advances a Move P0→P1, but the only surface that decided it was the Admin approvals queue, which redirects to the Setup overview and is effectively unreachable from a Move — so the only way to approve was a direct API call. This adds a tenant-scoped endpoint and an "Approve brief" button on the Move header (shown when the Move is awaiting the decision) that approves the brief in place and refreshes into the P1 state.

2. **Deterministic P0 scaffold capture.** On `/strategic-moves/new`, the scaffold filled only from `brief-progress` artifacts the conversational agent emitted, and the model intermittently narrated a capture ("the brief is ready, click Promote") without emitting the artifact — leaving the scaffold at 0/7 and Promote disabled. Prompt-hardening did not make this reliable. This adds a model-independent fallback: when a turn produces no `brief-progress` artifact, the originate client calls a structured extraction endpoint (cheap JSON-only Haiku call over the conversation) and fills the scaffold from the result. Capture no longer depends on the chat turn emitting the artifact.

## Layer Impact

- **`global-control-lane`** — shared Move app behavior + two new tenant-scoped API routes. No per-client data, no schema/RLS change, no migration.

## Client Applicability

- All clients: **Yes** — shared control-plane behavior, no feature flag.
- Specific clients: No. Internal only: No. Public/demo only: No. Feature flag: None.

## Changes Included

- `src/app/api/v1/programs/[programId]/approve-brief/route.ts` (new) — tenant-scoped POST: finds the Move's pending `program_approval_requests` row, checks `canApproveGates`, and decides it `approved` via `decideApprovalRequest` (which advances `current_phase` 0→1).
- `src/components/strategic-moves/ResolveDecisionButton.tsx` (new) — client island; calls approve-brief and `router.refresh()`.
- `src/components/strategic-moves/StrategicMoveDetailView.tsx` — render the approve button (not a dead Link) when `status.key === 'awaiting_decision'`.
- `src/app/api/v1/programs/originate/extract-brief/route.ts` (new) — structured JSON extraction of the seven scaffold fields from the conversation (Haiku, via `getAuditedAnthropicClient`); only-confident fields, sponsor only if explicitly named.
- `src/components/strategic-moves/StrategicMoveOriginateClient.tsx` — when a turn emits no `brief-progress`, reconcile the scaffold from `extract-brief` (fills empty fields only).

## QA / Validation

- **PASS** — `eslint` changed/new files → 0 errors/0 warnings.
- **PASS** — `tsc --noEmit` → 0 errors in changed/new files.
- **NOT-RUN (pending deploy)** — full fresh-move acceptance re-run on the deployed build: capture (no manual nudge) → promote → **P0 approve via the in-place button** → P1 generate → event worker → File Cabinet artifact → download, confirming all four surfaces agree at each step. To attach before `released`.

## Rollout Plan

Merge to `main` → `aca-main-deploy` builds + deploys the web image and (via the worker-deploy step) updates both worker jobs. No migration.

## Rollback Plan

Revert the PR and redeploy prior `main`. No schema migration. The new endpoints are additive; reverting restores the prior (API-rescue) behavior without data impact.

## Audit Evidence

- PR URL (added on open) for `fix/p0-approval-and-capture`; CI run; the post-deploy four-surface acceptance walk.

## Known Gaps

- The `/admin/programs/approvals` queue still redirects to the Setup overview (separate Admin-routing bug); this change makes that surface unnecessary for the common P0 approval but does not fix the Admin route itself.
- `extract-brief` reconciliation runs only when a turn emits no artifact and fills empty fields only (conservative); it does not override a value the model already set. If `ANTHROPIC_API_KEY` is absent it no-ops gracefully (manual scaffold + chat still work).
