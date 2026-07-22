# 2026-07-20-source-guidebook-workspace-ui — Read-only Guidebook workspace tab on the Source event shell

## Release ID

`2026-07-20-source-guidebook-workspace-ui`

## Status

`live-proven` — updated 2026-07-21. All four proof states below are now closed;
`SOURCE-GUIDEBOOK-002` is resolved (see Audit Evidence for the signed-in proof that
closes the row that was previously pending):

| Proof state | Status |
|---|---|
| Migration + seed applied to the live database | **Proven** — real apply run 29789097644, real repository readback (see `2026-07-20-db-migration-lab-workflow.md`) |
| Component rendering (real RTL tests, real props, no mocks on the code under test) | **Proven** — 13/13 tests passing, see QA / Validation |
| Deployment invariant (image built, pushed, serving traffic) | **Proven** — ACA revision `ca-abarva-web-lab-eastus--m4a429034` confirmed matching the merge commit at ship time; re-confirmed live at the current runtime (`ca-abarva-web-lab-eastus--m01723ef0`, commit `01723ef0123a4e7d85716f1133ae67cd58f72263`, `Healthy`) as of the 2026-07-21 signed-in proof below |
| Signed-in, live server-to-database rendering (a real user opening the tab and seeing real content) | **Proven** 2026-07-21 — real signed-in session (Anand Sundaram · Healthcare Demo tenant), real Source event `cea10d0a-6d5d-49d2-8522-173c2d6fd520`, Strategy stage. See Audit Evidence. |

## Plain-English Summary

The first Source stage guidebooks slice
(`docs/releases/records/2026-07-20-source-stage-guidebooks-foundation.md`) shipped the
schema, repository function, and one real authored guidebook (Strategy), but its own
Known Gaps flagged "no read surface exists yet." This release closes that gap with the
minimal read-only view that record called for: a new "Guidebook" workspace tab on the
Source event shell (`/source/events/[eventId]`), following the exact same pattern the
existing `steps` / `files` / `intelligence` / `approvals` workspaces already use.

A user viewing a Source event's Strategy stage now sees a "Guidebook" tab in the left
rail. Opening it renders the real facilitator content — purpose, agenda, talking
points, decision-capture worksheet — read live from `source_stage_guidebooks` via
`getSourceStageGuidebook()`. For the other 10 stages (no guidebook authored yet), the
tab is simply not shown — a deliberate choice over showing an always-empty tab for
10/11 stages (the alternative the foundation record's Known Gaps explicitly flagged as
undecided).

## Layer Impact

- `global-control-lane`: extends the shared Source event shell (`source-event-shell-v2.ts`,
  `SourceAnalyticsCanvas.tsx`) used by every tenant. No tenant-specific behavior — the
  guidebook itself is either the tenant's own override or the shared global default
  (`client_key IS NULL`), resolved the same way `getSourceStageGuidebook()` already
  resolves it.

## Client Applicability

- All clients: yes — no gate, no flag. The tab appears automatically wherever a
  guidebook exists for the viewed stage (today: Strategy only, global default).
- Specific clients: none.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none — inert (tab hidden) until a guidebook exists for the viewed
  stage, so there is no observable behavior change for the 10 stages with no content.

## Changes Included

- `src/lib/source/source-event-shell-v2.ts`:
  - `SourceShellWorkspace` union extended with `"guidebook"`.
  - New `SourceShellGuidebookWorkspace` interface (`available`, `record`,
    `emptyMessage`) and `SourceEventShellView.guidebook` field.
  - `BuildSourceEventShellViewInput.guidebook?: SourceStageGuidebookRecord | null`
    threaded into `buildSourceEventShellView`; `"guidebook"` added to
    `workspaces.available`.
- `src/components/source/canvas/analytics/SourceAnalyticsCanvas.tsx`:
  - New `guidebook` prop, threaded into `buildSourceEventShellView`.
  - New `GuidebookWorkspace` render function (same shape as the existing
    `ApprovalsWorkspace`/`FilesWorkspace`: `WorkspaceTitle` header, `EmptyCard`
    fallback, one card per guidebook section rendering title/time-box/body).
  - New branch in `SourceWorkspace`'s workspace switch.
  - New `WorkspaceButton` in `SourceShellRail`'s "Workspace" group, rendered only
    when `view.guidebook.available` — the tab is absent entirely for stages with no
    authored guidebook, not shown-and-empty.
- `src/app/(maestro)/source/events/[eventId]/page.tsx`:
  - Server-side `getSourceStageGuidebook(viewStage, activeClient.key)` call, guarded
    by `activeClient?.key` (same pattern as the adjacent `approvals inbox`/`event
    facts` reads), passed as the new `guidebook` prop.
- `src/lib/source/__tests__/source-event-shell-v2.test.ts` — 2 new tests: guidebook
  unavailable → `emptyMessage` + `available: false`; guidebook present → surfaced
  as-is on the view.
- `src/components/source/canvas/analytics/__tests__/SourceAnalyticsCanvas.guidebook.test.tsx`
  (new) — 2 RTL tests: the real (unmocked) canvas renders the Guidebook tab and its
  content when a guidebook is passed; the tab is entirely absent when none is.
- This release record.

## QA / Validation

- `pass` — `NODE_OPTIONS=--max-old-space-size=8192 npx tsc --noEmit --pretty false -p
  tsconfig.json` — clean.
- `pass` — `npx eslint` on all 5 changed/new files — 0 errors.
- `pass` — `npx jest src/lib/source/__tests__/source-event-shell-v2.test.ts
  src/components/source/canvas/analytics/__tests__/SourceAnalyticsCanvas.guidebook.test.tsx`
  — 13/13 passed (9 pre-existing shell-builder tests + 2 new + 2 new render tests).
- `pass` — full `src/lib/source/__tests__/source-event-shell-v2.test.ts` +
  `src/components/source/canvas/analytics/__tests__` directory run — same 2
  pre-existing, unrelated failures confirmed present on a clean baseline via `git
  stash` before this change was applied (`StrategyStage.test.tsx`,
  `SourceAnalyticsCanvas.thread.test.tsx`) — zero regressions introduced.
- `pass` — `node scripts/release-check.mjs --base origin/main --head HEAD` — all gates
  pass.
- `pass` (2026-07-21) — **live signed-in browser proof**, `SOURCE-GUIDEBOOK-002`
  closed. Performed via an already-authenticated `claude-in-chrome` session (Anand
  Sundaram, Healthcare Demo tenant — the same session used to live-verify
  `SOURCE-SHELL-006`/`007` earlier the same day), which sidestepped the Clerk
  one-time-email-code wall that blocked the original attempt above (no credentials
  were entered by the agent; the session was already signed in). Acceptance criteria
  from the backlog entry, all met:
  1. Authenticated via existing signed-in session. ✓
  2. Opened Source event `cea10d0a-6d5d-49d2-8522-173c2d6fd520` ("Healthcare Demo In:
     EHR application management and integration engine support") at the Strategy
     stage. ✓
  3. "Guidebook" workspace tab visible in the left rail, alongside Files &
     deliverables / Intelligence Explorer / Approvals. ✓
  4. Rendered title reads exactly "Strategy Gate Review". ✓
  5. All five authored sections render with real content: "What this session is for",
     "Agenda (20 min)", "Facilitator talking points", "Decision to record", "Failure
     modes to watch for". ✓
  6. Navigated to the Scope stage (no guidebook authored) for the same event — the
     Guidebook tab is absent entirely from the workspace list (Files & deliverables /
     Intelligence Explorer / Approvals only) — confirms the tab is hidden, not
     shown-and-empty, for stages without content. ✓
  7. Deployed commit at verification time: `01723ef0123a4e7d85716f1133ae67cd58f72263`
     (ACA revision `ca-abarva-web-lab-eastus--m01723ef0`, `Healthy`, 100% traffic —
     later than the shipping commit `4a4290345db4624bbcee08e4f66f98574b82c5fe`
     because unrelated work merged to `main` in between; the guidebook code path is
     unchanged since ship). ✓
  8. This entry is the evidence record. ✓

## Rollout Plan

Merged to `main` via the repo-owned ACA main-deploy workflow. Pure additive code
change — no migration, no flag, no existing render path altered for the 10 stages
without a guidebook (the tab simply doesn't render).

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`, run
  [29790788429](https://github.com/abarva-platform/abarva/actions/runs/29790788429),
  conclusion `success`.
- Shared runtime mutators: none.
- Approved image digest:
  `acrabarvalab001.azurecr.io/abarva/web@sha256:e6da2026d47c9eb458f1731088cc79f82ec36433449ef9ddfc697893bd592b60`.
- ACA runtime invariant: **proven.** `az containerapp show` confirms the template
  image matches the digest above and the active revision is
  `ca-abarva-web-lab-eastus--m4a429034` (matches merge commit
  `4a4290345db4624bbcee08e4f66f98574b82c5fe`).
- Worker image invariant: N/A — no worker code touched.
- Feature/env flag update path: none.
- Live signed-in proof required: yes — **performed 2026-07-21**, see QA / Validation.

## Rollback Plan

Revert the merge commit. Purely additive UI (new workspace value + render branch +
conditional rail button) — reverting removes the tab with no effect on any other
workspace or on the underlying `source_stage_guidebooks` data.

## Audit Evidence

- PR: [abarva-platform/abarva#5175](https://github.com/abarva-platform/abarva/pull/5175),
  21/21 checks passed, squash-merged as `4a4290345db4624bbcee08e4f66f98574b82c5fe`.
- CI/deploy run: [aca-main-deploy #29790788429](https://github.com/abarva-platform/abarva/actions/runs/29790788429),
  conclusion `success`.
- Deployment: ACA revision `ca-abarva-web-lab-eastus--m4a429034`, image digest
  `sha256:e6da2026d47c9eb458f1731088cc79f82ec36433449ef9ddfc697893bd592b60`.
- Typecheck/lint/test logs: clean (see QA / Validation).

## Known Gaps

- **Only the Strategy stage has content**, so the tab is only visible there today —
  matches the foundation record's own stated scope; authoring guidebooks for the other
  10 stages is separate, future content work, not a code gap.
- **Guidebook section bodies render as plain pre-wrapped text, not parsed Markdown.**
  The stored content is Markdown (per `SourceStageGuidebookSection.body`'s own type
  comment), but a first read-only pass renders it with `whiteSpace: 'pre-wrap'` rather
  than pulling in a Markdown renderer — sufficient for the current short
  facilitator-note content; a real Markdown render pass is a reasonable, contained
  follow-up if authored content grows more complex (headings, lists needing real
  formatting).
- **No authoring/edit UI** — matches the foundation record's own stated scope; this
  release is read-only.
- **Live signed-in browser proof performed 2026-07-21** — see QA / Validation.
  `SOURCE-GUIDEBOOK-002` closed in `docs/backlog/source-product-backlog.md`.
