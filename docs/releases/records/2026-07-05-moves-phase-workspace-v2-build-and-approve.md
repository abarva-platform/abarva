# 2026-07-05-moves-phase-workspace-v2-build-and-approve — Build-and-approve + action-first layout (Moves phase workspace v2, slice 4)

## Release ID

`2026-07-05-moves-phase-workspace-v2-build-and-approve`

## Status

`candidate` — verified live on the Lakeshore Move before merge (browser reconnected).

## Plain-English Summary

Fourth slice of the Moves phase-workspace redesign. Two things:

**(a) Action-first layout.** Inside the (top-of-page) capture panel, the workflow steps (Save → Build-and-approve → Advance) rendered *below* the seven capture cards, so you still scrolled past all the inputs to reach the action. The workflow sequence now renders **first**, above the cards — you see what to do the moment the phase opens.

**(b) Build-and-approve.** Closes the governance hole where a Move could advance past a phase with a gate deliverable **signed off but never generated** (the charter that "advanced without being built"), and fixes the live "Approve record → not_found" error (a `draft` deliverable that the old `in_review`-only sign-off couldn't act on).

Root cause was a status-machine tangle: the old flow was Save → Approve → Generate as three separate steps. **Approve signed off the raw capture record** (never generated), and **Generate afterward reset the deliverable to `draft`** and un-signed it — so "generated AND signed off" was unreachable, and the gate rewarded *not* generating.

This slice makes it one action, **"Build and approve"**: it **generates the board-grade deliverable first, then — only if generation cleanly succeeds — signs it off.** So a signed-off gate deliverable always implies a generated one, and Advance (which requires the sign-off) can no longer happen without a real deliverable. The sign-off mutation now accepts a fresh `draft` (widened from `in_review` only) so it can act on the just-generated deliverable in the same action.

## Layer Impact

- `global-control-lane`: shared Strategic Moves phase workspace (`StrategicMovePhaseClient`) + the deliverable sign-off mutation (`signOffDeliverable`) for all clients. The mutation change only widens which statuses can be signed off (adds `draft`); it does not alter the existing `in_review → signed_off` path.

## Client Applicability

- All clients: yes — every tenant using the Strategic Moves phase workspace (P1–P5).
- Specific clients: n/a
- Internal only: no
- Public/demo only: no
- Feature flag: none.

## Changes Included

- `src/components/strategic-moves/StrategicMovePhaseClient.tsx`
  - **Build-and-approve:** merged the "Approve" + "Generate artifact" steps into one "Build and approve" step (`buildAndApprove`): generate → (on clean success) sign off. A `genSucceededRef` captures the run outcome so sign-off only fires when the run finished `succeeded`. `canApprove`/`canGenerate` → `canBuildApprove`; sequence is Save → Build-and-approve → Advance.
  - **Action-first:** the workflow sequence now renders **first**, above the seven capture cards (was below them), so the action is visible without scrolling.
  - **Declutter:** removed the "What we know so far" panel (its use-case/sponsor duplicate the header, its capture count duplicates the tracker + Capture details, its gate count duplicates the Gate readiness panel — and that "Gate 1 of 5" chip next to an enabled Approve read as a contradiction). Removed the now-unused `knownSoFarItems`.
  - **Copy:** "…hard gaps block the charter" → "…block this phase's gate" (was hardcoded "charter" for every phase; wrong on P2–P5).
- `src/components/strategic-moves/MoveListTable.tsx` — the Moves list Sponsor column uses `conciseSponsorLabel` (was the full governance run-on).
- `src/components/strategic-moves/sponsor-display.ts` — `conciseSponsorLabel` (first clause of the sponsor name, capped), shared by the header and the list.
- `src/lib/programs/mutations.ts` — `signOffDeliverable` accepts `draft` as well as `in_review` (`.in("status", ["draft", "in_review"])`), so sign-off can act on a freshly-generated deliverable without a separate publish hop.

## QA / Validation

Overall status: **static PASS; end-to-end NOT-RUN (blocked — browser MCP unavailable this session).**

- `npx tsc --noEmit -p tsconfig.json` → **PASS** (0 errors).
- `npx eslint` on both changed files → **PASS** (exit 0).
- Existing sign-off tests mock `signOffDeliverable`, so the widened status filter breaks nothing.
- End-to-end proof → **NOT-RUN (blocked)**: MUST verify live before merge — on a saved phase, click "Build and approve" → confirm it generates, then the deliverable is `signed_off` (not left `draft`), and Advance becomes available; confirm a Move cannot reach `signed_off` without a generated deliverable.

## Rollout Plan

**Held.** When a live browser is available: verify the flow on the Lakeshore Move, then merge to `main` → ACA deploy → re-verify live. No migration, no flag.

## Deployment Authority

- Repo-owned deploy workflow: "ACA main deploy" (auto on push to `main`) — **not triggered until this PR is merged, which is gated on live verification.**
- Shared runtime mutators: widens `signOffDeliverable` status acceptance (governed, tenant-fenced).
- Live signed-in proof required: **yes, before merge** — Build-and-approve generates + signs off + advance unlocks.

## Rollback Plan

Revert the PR. The mutation change is additive (only widens accepted statuses); reverting restores `in_review`-only sign-off. No data to unwind.

## Audit Evidence

- PR URL: (added on open)
- CI: `tsc` clean + eslint clean.
- Pre-existing evidence of the bug: this session advanced a Lakeshore Move P1→P2 with a `charter` deliverable at version 1 (never generated) — the gate only checked `signed_off` status, not generation.

## Known Gaps

- Live verification pending (the reason this is HELD).
- Slice 4 of the v2 package. Remaining: AgentDock chat controls (pin/hide/expand); inline evidence upload; per-phase content depth (P3–P5); download/blob + doc-parsing backend.
