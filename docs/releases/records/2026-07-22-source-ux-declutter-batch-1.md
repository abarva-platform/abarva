# 2026-07-22-source-ux-declutter-batch-1 — Source UI/UX: P0 fixes + Stripe-style declutter (batch 1)

## Release ID

`2026-07-22-source-ux-declutter-batch-1`

## Status

`live-proven` — merged, deployed, and verified against the real production page with a
signed-in session. See Audit Evidence.

## Plain-English Summary

First incremental batch from a broad UI/UX quality audit of Source (5 parallel-agent audits
covering UI/UX, aVa chat analytics capability, artifact narrative quality, guidebook content,
and upload/persistence). Ships the confirmed real P0 bugs plus a first Stripe-style
decluttering pass — reducing how much unrelated or redundant content the page always shows,
without removing any functionality.

- **P0 fix**: the per-event Approvals workspace tab was rendering every other event's pending
  approval items (there's a separate, dedicated portfolio-level `/source/approvals` page for
  that) and rendering its own featured item a second time in the list below it. Both were real
  bugs in `buildSourceEventShellView`'s approvals composition, confirmed by direct code
  inspection (not just the audit's description) and fixed with a scope + dedup filter.
- **UX fix**: the featured approval card's CTA linked to the exact page already open (a
  same-URL `<Link>` that visibly did nothing when it was the current stage's own item). It now
  switches to the Steps workspace tab, where the real decision controls live.
- **Declutter**: a single sentence explaining "content not scored yet" was repeated on every
  not-yet-registered row in the Evidence ledger (often 25+ times) — collapsed to the one
  summary-level explainer that already existed for this exact purpose.
- **Declutter**: the Evidence ledger's artifact-standards matrix (33 rows across all 11
  stages) now defaults to the stage the user is actually viewing, with one click to expand to
  all 11 — instead of always showing the full wall regardless of context.
- **Declutter**: the raw "Quality score 2/100, 28 hard fails" KPI strip now leads with an
  honest, stage-relative line ("N of M artifacts due through [current stage] are registered")
  before the global score, so an early-stage event doesn't read as broken.

One audit finding was investigated and disproven before any code was touched: the "✦
Intelligence" tab was reported as silently redirecting out of Source. Direct live click-testing
(via a dispatched click event, then a screenshot) showed it correctly switches to an in-canvas
Intelligence panel with no navigation at all — a real, working feature with a genuinely
well-built value-lever chart. No fix was made; this is recorded so the false finding isn't
rediscovered later.

## Layer Impact

- `global-control-lane`: changes the shared Source event shell (`source-event-shell-v2.ts`)
  and canvas component (`SourceAnalyticsCanvas.tsx`), used by every tenant. No new schema, no
  new data source — all changes read data the shell already had.

## Client Applicability

- All clients: yes — no gate, no flag.
- Specific clients: none.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- `src/lib/source/source-event-shell-v2.ts`:
  - `buildSourceEventShellView`'s approvals composition now filters `input.approvalItems` to
    `item.eventId === input.event.id` before deriving `currentStageItem`, and excludes
    `currentStageItem` from the `items` list passed to the UI — fixes both the cross-event
    leak and the duplicate render.
- `src/components/source/canvas/analytics/SourceAnalyticsCanvas.tsx`:
  - `ApprovalsWorkspace` takes a new `onGoToSteps` callback, wired from the existing
    `onWorkspaceChange` already available at the call site.
  - `ApprovalCard` — when `featured && item.kind === 'stage_gate'`, renders a button that
    calls `onGoToSteps()` (switches to Steps) instead of a `<Link href={item.href}>` to the
    page already open. Intake approvals keep their real, distinct `/approval` decision-page
    link unchanged.
  - `LifecycleStageRows` — dropped the per-row fallback to the boilerplate
    `contentQuality.nextAction` sentence; only real blockers/warnings render per row now.
  - `ArtifactLifecyclePanel` — new `showAllStages` state (default `false`); the
    artifact-standards table filters to `view.stage.label` by default with a
    "Show all 11 stages" / "Show [stage] only" toggle button; added an honest empty state for
    a viewed stage with zero standards rows; added a new stage-relative progress line
    ("N of M artifacts due through [current stage] are registered") computed from
    `view.journey` (stages with `state !== "future"`) and `lifecycle.rows`, shown above the
    existing quality-rubric scope line.
- `src/lib/source/__tests__/source-event-shell-v2.test.ts` — new regression test:
  cross-event exclusion + no-duplicate-featured-item, using 3 items (this event's featured
  item, this event's second item, another event's item) and asserting the exact expected
  `items` array.
- `src/components/source/canvas/analytics/__tests__/SourceAnalyticsCanvas.approvalLedger.test.tsx` —
  new test: real render confirms the featured item's text appears exactly once, the other
  event's item never appears, the CTA is a real button (not a same-page link), and clicking it
  switches to the Steps workspace.
- `src/components/source/canvas/analytics/__tests__/SourceAnalyticsCanvas.chat.test.tsx` — 2
  existing tests updated (not weakened) to click the new "Show all 11 stages" toggle before
  asserting on rows/buttons that belong to a stage other than the one being viewed — this is
  the new default-scoping behavior working as intended, not a broken test papered over.

## QA / Validation

- `pass` — `NODE_OPTIONS=--max-old-space-size=8192 npx tsc --noEmit --pretty false -p
  tsconfig.json` — clean on every changed file (only the pre-existing, unrelated
  `@xyflow/react`/`@dagrejs/dagre` baseline errors remain).
- `pass` — `npx eslint` on all 5 changed/new files — 0 errors.
- `pass` — full regression sweep, `npx jest src/lib/source src/components/source
  src/app/api/v1/source` — 13 failing suites both before (confirmed via `git stash` against a
  clean baseline) and after this change, identical set — zero regressions. Two of the 13
  pre-existing failures live in files this change touches
  (`SourceAnalyticsCanvas.chat.test.tsx`'s 2 affected cases were fixed forward, not left
  broken — see Changes Included).
- `pass` — new/updated tests: `source-event-shell-v2.test.ts` (1 new case, 12/12 total pass),
  `SourceAnalyticsCanvas.approvalLedger.test.tsx` (1 new case, 3/3 total pass),
  `SourceAnalyticsCanvas.chat.test.tsx` (2 cases updated for the new default-scoping
  behavior, 14/14 total pass).
- `manual` — the "✦ Intelligence tab redirects" audit finding was live-tested via a dispatched
  click event against the real production page (`app.abarva.ai`, signed-in session) before any
  code was written — confirmed as a false finding (in-canvas panel switch, no navigation),
  not fixed.

## Rollout Plan

Merge to `main` via the repo-owned ACA main-deploy workflow. Pure UI/behavior change to an
existing, already-shipped workspace — no migration, no flag.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`.
- Shared runtime mutators: none.
- Approved image digest: to be recorded after merge and deploy.
- ACA runtime invariant: to be verified after merge and deploy.
- Worker image invariant: N/A.
- Feature/env flag update path: none.
- Live signed-in proof required: yes.

## Rollback Plan

Revert the merge commit. Reverting restores the prior approvals-workspace cross-event
rendering, the same-page CTA link, the per-row boilerplate repetition, and the always-all-
stages lifecycle matrix — no data migration involved either direction.

## Audit Evidence

- PR: [abarva-platform/abarva#5322](https://github.com/abarva-platform/abarva/pull/5322),
  squash-merged as `1d01c16d82c8eee057a32bfe6ba2922c09d15cfd`.
- Deploy run: [aca-main-deploy 29931599144](https://github.com/abarva-platform/abarva/actions/runs/29931599144), conclusion `success`.
- ACA runtime invariant: confirmed — template image and 100%-traffic revision
  (`ca-abarva-web-lab-eastus--m1d01c16d`) both on digest
  `sha256:4e3d1d4d76aea1467b56876906c822630654e6ec4bfad03db0ea93d7bcdf9cbb`, `Healthy`.
- Live signed-in proof (Anand Sundaram, Healthcare Demo tenant, event
  `cea10d0a-6d5d-49d2-8522-173c2d6fd520`):
  - Evidence ledger shows the real stage-relative line: "1 of 8 artifacts due through Scope
    are registered — the quality score below is scored against the full 11-stage set, so it
    stays low by design until the event nears completion," with the "Show all 11 stages"
    toggle visible. The per-row Approval column shows real blocker text, not the removed
    boilerplate sentence.
  - Approvals tab shows exactly one card for this event (no duplicate, no other events mixed
    in) with a real "Go to steps to decide" button. Clicking it switches to the Steps tab in
    place (same URL, real step content rendered) — confirmed not a dead/same-page link.
- Test/typecheck/lint logs: see QA / Validation.

## Known Gaps

This is batch 1 of a larger incremental sequence covering the full 6-area audit (UI/UX, aVa
chat analytics, artifact narrative quality, guidebook dynamic content, upload/persistence).
Explicitly not in this batch, tracked as follow-on work:
- aVa chat wiring to the existing `AgentAnswerRenderer`/Recharts pipeline for Source (real,
  already-computed vendor-coverage and value-waterfall data, not yet chat-rendered).
- Narrative-quality gate coverage expansion beyond the one hard-gated artifact code.
- Per-client/per-event guidebook content (currently one static global record for 1 of 11
  stages).
- A dedicated workshop/session-notes ingestion surface and a parser/worker for PDF/XLSX/PPTX
  uploads currently stuck at `parse_status: "pending"` with no consumer.
