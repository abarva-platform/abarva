# 2026-07-23-source-files-lifecycle-declutter — Source Files lifecycle declutter

## Release ID

`2026-07-23-source-files-lifecycle-declutter`

## Status

`released` — merged in PR #5437, deployed by the repo-owned ACA main workflow,
independently superseded by later healthy main revisions, and signed-in proven on
`app.abarva.ai`.

## Plain-English Summary

Source Files now leads the artifact lifecycle panel with the four numbers a user needs for execution: what is due so far, what is registered, what required artifacts are still missing, and how many client finals exist. The deeper quality/audit counters are still available in one click, and the standards CSV export remains unchanged.

This is a small UI hierarchy change. It does not remove evidence, lifecycle rows, artifact quality checks, approval controls, CSV export fields, or any governed data.

## Layer Impact

- Release lane: `global-control-lane`.
- Source Files workspace: reduces first-paint lifecycle metric clutter and keeps the audit scoreboard behind an explicit drill-in control.
- Source artifact lifecycle matrix: preserves the existing row table, all-stage toggle, standards CSV export, quality findings, and client-final controls.
- Data layer: no schema change, no data mutation, no migration.

## Client Applicability

- All clients: yes, for Source event Files workspaces.
- Specific clients: none.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none added by this slice.

## Changes Included

- `src/components/source/canvas/analytics/SourceAnalyticsCanvas.tsx`: replaces the default 18-tile lifecycle scoreboard with four execution metrics and adds a `Show audit metrics` drill-in for the full quality/export/Gate B counter set.
- `src/components/source/canvas/analytics/__tests__/SourceAnalyticsCanvas.chat.test.tsx`: proves the default summary is execution-first and the full audit metrics remain reachable.
- `docs/backlog/source-product-backlog.md`: records `SOURCE-UX-002`.

## QA / Validation

- `npm test -- --runTestsByPath src/components/source/canvas/analytics/__tests__/SourceAnalyticsCanvas.chat.test.tsx --runInBand` — pass, 15/15. Same pre-existing duplicate Jest manual mock warnings observed.
- `npx eslint src/components/source/canvas/analytics/SourceAnalyticsCanvas.tsx src/components/source/canvas/analytics/__tests__/SourceAnalyticsCanvas.chat.test.tsx` — pass.
- `npm run release:check -- --base origin/main --head HEAD` — pass.
- `NODE_OPTIONS=--max-old-space-size=8192 npx tsc --noEmit --pretty false -p tsconfig.json` — blocked by pre-existing missing optional Home graph packages in unrelated files: `@xyflow/react` and `@dagrejs/dagre`.
- `pass` — proof-closure rerun on current `main`: `npm test -- --runTestsByPath src/components/source/canvas/analytics/__tests__/SourceAnalyticsCanvas.chat.test.tsx --runInBand`
  passed 16/16 on 2026-07-23. Jest printed the same pre-existing duplicate manual mock warnings.
- `pass` — signed-in production proof on `https://app.abarva.ai/source/events/c05872d8-0465-4bc8-8eeb-ff3d42ac6761?workspace=files`
  with Lakeshore agent auth. The Files workspace showed `ARTIFACT LIFECYCLE`, the execution
  line `2 of 8 artifacts due through Scope are registered`, the four default metrics (`Due so
  far`, `Registered`, `Missing required`, `Client finals`), standards CSV export, the all-stage
  toggle, and `Show audit metrics`; after one click the audit detail surfaced `Hard fails` and
  `Gate B`. No upload or mutation was performed.

## Rollout Plan

Completed via PR #5437. The repo-owned ACA main workflow deployed merge SHA
`fef10108e283e8140ed9f292ba5299c40ec60f93`; later healthy main revisions supersede that
image and still contain the slice.

## Deployment Authority

- Repo-owned deploy workflow: required for production rollout.
- Shared runtime mutators: none in this PR.
- Approved image digest: assigned by ACA main deploy run `29984083764`; current production
  proof should use the latest superseding healthy main revision.
- ACA runtime invariant: passed in the original deployment lane and again through later
  superseding Source proof closures.
- Worker image invariant: no worker image changes expected.
- Feature/env flag update path: none.
- Live signed-in proof required: yes, Source Files workspace should show the four execution metrics by default and full audit metrics after one click.

## Rollback Plan

Revert the PR and redeploy through the repo-owned ACA main workflow. That restores the previous always-visible audit scoreboard. No migration rollback or data cleanup is required.

## Audit Evidence

- PR URL: https://github.com/abarva-platform/abarva/pull/5437.
- Merge SHA: `fef10108e283e8140ed9f292ba5299c40ec60f93`.
- ACA deploy run: https://github.com/abarva-platform/abarva/actions/runs/29984083764.
- Signed-in browser proof: local proof bundle under
  `audit-artifacts/source-ux-002-text-proof-20260723/` and screenshot proof under
  `audit-artifacts/source-proof-closure-live-proof-20260723-rerun/`.

## Known Gaps

- This slice does not redesign the FileCard list or lifecycle row table.
- This slice does not change artifact-quality scoring rules.
- This slice does not add Recharts/aVa artifact-quality chat answers; that remains a separate analytics-chat follow-on.
