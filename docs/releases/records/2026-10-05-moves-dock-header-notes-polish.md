# 2026-10-05-moves-dock-header-notes-polish — aVa dock header + capture notes trigger polish

## Release ID

`2026-10-05-moves-dock-header-notes-polish`

## Status

`candidate`

## Plain-English Summary

Two cosmetic fixes found in the signed-in walk of the redesigned Moves capture:

1. **Dock header crowding.** In the narrow agent dock, the eyebrow role label
   (e.g. "Charter partner") wrapped onto a second line and crowded the mode
   icons. The role style now stays on one line and truncates with an ellipsis
   only if a role is genuinely too long — so the header reads cleanly at narrow
   widths. This is in the shared `AgentDock`, so Source and any other surface
   that uses the dock get the same tidy header.

2. **Orphaned "Paste client notes" trigger.** The collapsed fill-from-notes
   control rendered as a small pill floating above the workspace tabs, leaving a
   large empty gap and reading as unanchored. It is now a full-width, left-
   aligned affordance band, so it reads as an intentional part of the capture
   header above the tabs.

Both are presentation only — no field, key, save, gate, evidence, or agent
behaviour changes.

## Layer Impact

Release lane: `global-control-lane` — shared agent-dock presentation plus the
Moves capture notes trigger. The dock header change is surface-agnostic; the
notes trigger only renders where `moves_capture_notes_v1` is enabled.

- `4 PRODUCTS` (shared AgentDock + Moves): CSS/style only.
  - `AgentDock` header role eyebrow: one-line truncation.
  - `CaptureNotesFill` collapsed trigger: full-width band.

## Client Applicability

- All clients: the dock header tidy applies wherever `AgentDock` renders.
- Specific clients: the notes trigger band renders only where
  `moves_capture_notes_v1` is in that flag's `includeTenants` (currently the
  synthetic demo tenant used for the signed-in review).
- Internal only: No.
- Public/demo only: No.
- Feature flag: dock header — none (shared chrome); notes trigger — rides the
  existing `moves_capture_notes_v1` (no new flag).

## Changes Included

- `src/components/agent/AgentDock.tsx` — `AGENT_ROLE_STYLE` gains
  `white-space:nowrap; overflow:hidden; text-overflow:ellipsis` so the role
  eyebrow stays on one line in a narrow dock.
- `src/components/strategic-moves/CaptureNotesFill.tsx` — `.cnf-open` becomes a
  full-width, left-aligned affordance band instead of a floating pill.

## QA / Validation

- `jest` (`AgentDock`, `CaptureNotesFill`) — **PASS**: 79/79.
- `eslint` — **PASS**: 0 errors (1 pre-existing unrelated warning).
- `tsc --noEmit` — **PASS**: 0 errors.
- Static before/after render harness — **PASS**: role stays on one line; notes
  trigger reads as an anchored full-width band.
- Signed-in visual walk — **NOT RUN**: can't render signed-in off the private
  data plane from a dev box; owed as part of the demo-tenant walk.

## Rollout Plan

Merge to `main` via squash PR. Ships with the next ACA web image via the
repo-owned `aca-main-deploy` workflow. No flag change.

## Rollback Plan

Revert the PR — both changes are isolated style tweaks with no data or behaviour
change, so reverting restores the prior rendering immediately. No migration or
flag action.

## Deployment Authority

No ad-hoc Azure action. Ships only via the repo-owned `aca-main-deploy` workflow
on merge to `main`; shifts no shared traffic and touches no Container App
template, revision weight, or secret.

## Known Gaps

- The underlying P1 "Continue" readiness behaviour (the stepper allowing advance
  at 0-answered) is a separate, functional defect being addressed in its own
  change; this record is cosmetic only and does not touch that rule.
- No signed-in visual proof yet (not possible off the private data plane here).

## Audit Evidence

- CI: `jest`, `tsc`, `eslint`, `npm run release:check` on the PR.
