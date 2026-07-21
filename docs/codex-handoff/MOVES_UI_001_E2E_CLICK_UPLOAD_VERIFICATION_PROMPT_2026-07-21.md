# Codex handoff — MOVES-UI-001/002 full end-to-end click/upload verification

**Date**: 2026-07-21
**Requested by**: Anand Sundaram
**Context**: MOVES-UI-001 (Finder-style phase-shell rebuild) and MOVES-UI-002 (cross-phase
Approvals overview) have been unit-tested and spot-checked live (rail rendering, one Steps
menu row, the Approvals overview, one "Review & approve" navigation), but not exhaustively
clicked through. This handoff asks for a full, driven, real-browser verification pass covering
every interactive element, not a sample.

Read `docs/backlog/moves-product-backlog.md` (sections `MOVES-UI-001` and `MOVES-UI-002`,
including the "Correction" note) and
`docs/specs/programs/moves-phase-shell-ui-backend-reconciliation.md` before starting — they
explain what's real data vs. intentionally-inert scaffolding in the current build, so you don't
mistake a deliberate no-op for a bug.

---

## Task

Full end-to-end click/upload verification of the MOVES-UI-001/MOVES-UI-002 rollout, live on
app.abarva.ai.

### Context

- Feature flags `moves_finder_shell_v1` and `moves_approvals_overview_v1` are registered in
  `src/lib/features/registry.ts`, currently enabled for tenants: `lakeshore`, `skyharbor`,
  `meridian`.
- The live component is `src/components/strategic-moves/MovesPhaseStandaloneClient.tsx`. When
  the flags are on, it renders: a Finder-style rail (grouped Phases/Workspace, navy labels,
  blue selection tint, collapse/expand toggle), a two-column Steps view (left sub-menu of
  phase-capture inputs + workflow steps, right detail pane), an inline citation toggle on any
  review row that has a real source field, a collapsible "Coming up" next-phase preview, and a
  cross-phase Approvals overview reachable from the rail's "Approvals" link.

### Sign-in

Use one of these two test logins (OTP-based, no password) on
`https://app.abarva.ai/sign-in`:

- `anand.sundaram+meridian@thesundaram.com`
- `anand.sundaram+firstcapital@thesundaram.com`

Wait for the OTP to be supplied to you by the user; do not attempt to bypass or guess it.

### Drive the following

For **each** item, note pass/fail plus a screenshot or console/network log on any failure.
Report every item individually — do not summarize as "all good" without a per-item result.

1. Sign in, land on `/strategic-moves`, open a real Move belonging to the signed-in tenant.
2. **Rail**: click every phase row (confirm navigation to that phase); click the collapse
   toggle (confirm it shrinks to icon rail and expands back); click Files & Evidence, Phase
   Intelligence, and Approvals workspace links (confirm each loads without error).
3. **Steps tab**: click EVERY row in the left sub-menu (every phase-capture input row AND
   every workflow/substep row) — confirm the right detail pane updates each time with real
   content (not blank, not stuck on the previous selection). Note which rows show an inline
   citation toggle ("◈" or similar) — click it and confirm the source caption reveals/hides.
   Note any row where the detail pane fails to update or throws a console error.
4. If any workflow step is an upload-type step (e.g. "Upload & Review"): perform a REAL file
   upload (a small real file, e.g. a `.txt` or `.csv`) via both drag-and-drop (if supported)
   and the file picker. Confirm the upload succeeds (network tab shows a successful request,
   no 4xx/5xx), and that the uploaded file then appears in the Files & Evidence tab/view with
   the correct state.
5. **"Coming up" card** (if it renders): click to expand, confirm real need-tags appear (not
   empty/broken), click again to collapse, confirm it collapses.
6. **Files tab**: confirm the file list renders with real lifecycle states
   (draft/final/locked/advisory etc.), no placeholder or Lorem-ipsum-looking text.
7. **Intelligence tab**: confirm it renders without error (this may show static or
   AI-generated content — note if anything looks broken or empty where it shouldn't be).
8. **Approvals overview**: from the rail, open it. Click "Review & approve" on the current
   in-progress phase — confirm it navigates back to that phase's Steps view correctly. Do NOT
   click a real Approve & Build / gate-approval submit button on a production Move unless
   explicitly told it's safe to do so on this account — flag this instead of executing it,
   since it's an irreversible governed action.
9. **Flag-off control check**: if you can reach a tenant NOT in the enabled list (any tenant
   other than lakeshore/skyharbor/meridian), confirm that Move's phase page still renders the
   ORIGINAL horizontal stepper (not the two-column view) — this proves the flag gate itself
   works, not just the flag-on path.
10. Capture browser console errors and failed network requests throughout the whole pass, not
    just at the end — report every one found, even if the UI visually looked fine.

### Report format

A checklist of every item above with pass/fail and evidence (screenshot path or error text).
Do not summarize as "all good" without listing each checked item individually.
