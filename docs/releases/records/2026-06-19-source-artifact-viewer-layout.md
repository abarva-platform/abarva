# 2026-06-19-source-artifact-viewer-layout — Fix collapsed agent+pane layout on Source artifact & value pages

## Release ID

`2026-06-19-source-artifact-viewer-layout`

## Status

`candidate`

## Plain-English Summary

Opening a generated Source document (the artifact viewer) showed a blank white
pane — the document was loaded but invisible. Root cause: the artifact-viewer and
value pages handed two side-by-side regions (the Sentinel agent column and the
document working pane) directly to AppShell, whose body stacks children in a
vertical column. So the two collapsed into a ~480px-wide column and the document
pane shrank to zero usable size. The scorecard page already wraps these two in a
flex-row container; this applies the same proven wrapper to the artifact-viewer
and value pages, so the agent column sits on the left and the document fills the
rest. Found live during First Capital QA on a real generated Strategy Memo.

## Layer Impact

- `global-control-lane`: two Source route files only
  (`source/events/[eventId]/artifacts/[artifactId]/page.tsx`,
  `source/value/page.tsx`). Pure layout wrapper; no data, API, or logic change.

## Client Applicability

- All clients: yes — anyone opening a Source artifact or the value ledger.
- Specific clients: n/a
- Internal only: no
- Public/demo only: no
- Feature flag: none.

## Changes Included

- Branch `fix/source-artifact-viewer`. Wrap `SentinelAgentColumn` +
  `SourceWorkingPane` in a `<main style={{flex:1,minHeight:0,display:'flex',
  overflow:'hidden'}}>` on both pages, matching the scorecard page's
  `SCORECARD_LAYOUT_STYLE`.

## QA / Validation

- `eslint` on both changed files → **PASS** (exit 0).
- Live diagnosis: measured the working pane collapsing to 424px wide with
  0-height content under AppShell's flex-column; the scorecard page's flex-row
  wrapper renders correctly — **PASS** (root cause confirmed).
- Typecheck — **runs in CI**.
- Post-deploy live re-verification on the First Capital artifact viewer
  (`c8cdad34…/artifacts/03eee721…`) — **pending** the deploy.

## Rollout Plan

Merge to main → ACA image build/deploy → re-pin traffic to the new main revision
(deploy-authority churn means traffic must be set manually). No migration/flag.

## Rollback Plan

Revert the commit. Pure layout change; nothing persistent.

## Audit Evidence

- PR: (filled on open) `fix/source-artifact-viewer`
- Live geometry before fix: working pane 424px wide, content `h:0`; agent + pane
  stacked in a 480px column. After fix: agent left, pane fills remainder.

## Known Gaps

The scorecard page already had the wrapper and is unaffected. Other Source
working surfaces that render a single AppShell child (e.g. the UniversalCanvasShell
canvas, which does its own internal row) are unaffected. Separately tracked: Source
deliverable generation is slow/synchronous with no in-progress feedback — not
addressed here.
