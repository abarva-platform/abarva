# 2026-07-05-moves-evidence-workbench — Evidence Workbench surface for Moves P2–P5

## Release ID

`2026-07-05-moves-evidence-workbench`

## Status

`candidate` — verified live on the Lakeshore Move (P2 workbench + P1 unchanged) before merge.

## Plain-English Summary

Reframes the Strategic Moves phase workspace for **P2–P5** from a chat-first two-pane
layout into an **evidence-and-action surface** ("Evidence Workbench"), following
the founder's direction: after P0/P1 the work is collecting evidence and clearing
a governed gate, not conversing. Chat (aVa / AgentDock) recedes to a **collapsed,
invocable** dock; the workspace becomes three zones:

- **Left — Evidence explorer:** the phase's required/recommended/optional evidence
  needs, one row each, colored by real status (missing / partial / covered /
  waived). Click a row to inspect it.
- **Center — "To advance" action list:** the real gate criteria as steps (done
  ones go quiet; open ones carry their own button — **Build report** wires
  Build-and-approve, hard-gap steps offer **Add evidence**), then the **Advance**
  action. The existing capture UI (Save → Build-and-approve → Advance + the
  section cards) is embedded here **verbatim** as the capture slot, so the proven
  capture/generation flow is unchanged.
- **Right — Selected-evidence detail:** the chosen need's why-it-matters, next
  action, accepted formats, backing files, and a lineage timeline
  (uploaded → extracted → ingested → cited).

**P0 and P1** keep the existing chat-resident canvas exactly as before.

Everything binds to data the server already feeds the workspace — no new
endpoints: the explorer/detail from `evidenceNeedPackets` (`MoveEvidenceNeedPacket`),
the action list from `move.gateCriteria` + the existing `buildAndApprove` /
`advanceGate` handlers.

## Layer Impact

- `global-control-lane`: the shared Strategic Moves phase workspace
  (`StrategicMovePhaseClient` / `CharterWorkflow`) for all clients. New rendering
  path for current-phase P2–P5 only; P0/P1 and non-current phases render exactly
  what they did before (the existing return was hoisted into a `captureCards`
  const and returned unchanged on the non-workbench path). No route/schema/gate
  change; the same capture, generation, and advance handlers are reused.

## Client Applicability

- All clients: yes — every tenant using the Moves phase workspace at P2–P5.
- Specific clients: n/a
- Internal only: no
- Public/demo only: no
- Feature flag: none.

## Changes Included

- `src/components/strategic-moves/EvidenceWorkbench.tsx` (new) — presentational
  three-zone surface (header + explorer + action-list/capture + detail).
- `src/components/strategic-moves/EvidenceWorkbench.module.css` (new) — styles,
  honoring the locked design system (cream ground, Georgia headings, black/ghost
  buttons; semantic status colors separate from the accent).
- `src/components/strategic-moves/StrategicMovePhaseClient.tsx`:
  - `CharterWorkflow` gains optional workbench props; in workbench mode it maps
    real move data + its own actions to `EvidenceWorkbench` props and passes the
    existing capture markup (hoisted to `captureCards`) as `captureSlot`. The
    non-workbench return is `captureCards` — byte-for-byte the prior output.
  - Main component: `useWorkbench` (current-phase P2–P5), AgentDock
    `defaultMode` = `collapsed` there (else `side-rail`), a remount key + `openAva`
    so "Ask aVa" re-opens the dock, and `goAddEvidence` → the File Cabinet upload.

## QA / Validation

Overall status: **static PASS; live verification before merge.**

- `tsc --noEmit` (8GB heap) → **PASS** (0 errors); `eslint` → **PASS**.
- Live proof before merge (Lakeshore Move e0e138d5): P2 shows the workbench with
  real evidence states + real gate criteria; **Build report** and **Advance** fire
  the real handlers; capture Save still works inside the slot; aVa collapses and
  re-opens; **P1 renders unchanged**.

## Rollout Plan

Merge to `main` → ACA "main deploy" → re-verify live. No migration, no flag.

## Deployment Authority

- Repo-owned deploy workflow: "ACA main deploy" (auto on push to `main`).
- Shared runtime mutators: none — presentation + existing handlers only.
- Live signed-in proof required: **yes** — workbench renders real data + actions
  fire; P1 unchanged.

## Rollback Plan

Revert the PR. The workbench is an additive render branch (P2–P5 current phase);
reverting restores the chat-first canvas everywhere. No data to unwind.

## Audit Evidence

- PR URL: (added on open)
- CI: `tsc` clean + eslint clean.
- Backing data contract: `MoveEvidenceNeedPacket` (status/priority/whyItMatters/
  nextAction/evidenceTitles) + `move.gateCriteria` — both already computed
  server-side in `.../phase/[phaseNum]/page.tsx` and `transformers.buildGateCriteria`.

## Known Gaps

- The "diagnosis-as-structured-facts-with-provenance" strip is deferred (no facts
  surface API yet); the center embeds the real editable capture instead.
- `onAddEvidence` / `Open in File Cabinet` route to the existing cabinet upload;
  inline in-workbench upload is a follow-up.
- The status→step action mapping identifies the report/sign-off criterion by label
  match (`/signed off|report|charter|deliverable/i`); verify per phase.
