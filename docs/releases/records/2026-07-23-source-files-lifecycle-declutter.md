# 2026-07-23-source-files-lifecycle-declutter — Source Files lifecycle declutter

## Release ID

`2026-07-23-source-files-lifecycle-declutter`

## Status

`candidate`

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

## Rollout Plan

Merge through PR into `main`; the repo-owned ACA main deploy workflow builds and deploys the digest-pinned image to `app.abarva.ai`. After deploy, verify the ACA runtime invariant and complete signed-in Source Files workspace proof.

## Deployment Authority

- Repo-owned deploy workflow: required for production rollout.
- Shared runtime mutators: none in this PR.
- Approved image digest: to be recorded after ACA main deploy completes.
- ACA runtime invariant: required after deploy.
- Worker image invariant: no worker image changes expected.
- Feature/env flag update path: none.
- Live signed-in proof required: yes, Source Files workspace should show the four execution metrics by default and full audit metrics after one click.

## Rollback Plan

Revert the PR and redeploy through the repo-owned ACA main workflow. That restores the previous always-visible audit scoreboard. No migration rollback or data cleanup is required.

## Audit Evidence

- PR URL: to be added after PR creation.
- Merge SHA: to be added after merge.
- ACA deploy run / digest: to be added after deployment.
- Signed-in browser proof: to be added after deployment.

## Known Gaps

- This slice does not redesign the FileCard list or lifecycle row table.
- This slice does not change artifact-quality scoring rules.
- This slice does not add Recharts/aVa artifact-quality chat answers; that remains a separate analytics-chat follow-on.
