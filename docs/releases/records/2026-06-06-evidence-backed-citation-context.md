# 2026-06-06-evidence-backed-citation-context — Evidence-Backed Citation Context

## Release ID

`2026-06-06-evidence-backed-citation-context`

## Status

`candidate`

## Plain-English Summary

Intelligence pages that carry loader-backed Enterprise Context evidence no longer show the misleading "citation gap" warning on Sentinel chat text simply because the opener lacks inline citation tokens. The page now passes structured evidence coverage into the shared agent dock, and the citation-gap guard treats usable Enterprise Context evidence as a valid source basis while preserving the warning for substantive uncited text that has no evidence context.

## Layer Impact

- `global-control-lane`: updates the shared AgentDock citation-gap rule used across agent surfaces.
- `client-data-lane`: reads only already-loaded Enterprise Context evidence counts passed through the page context; no data writes, resets, reloads, or migrations.

## Client Applicability

- All clients: shared AgentDock behavior applies wherever a surface passes evidence-backed context.
- Specific clients: first validated for Meridian Health System/PHS Enterprise Context.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- Adds structured `evidenceContext` metadata to the Intelligence Sentinel surface context when Enterprise Context has usable evidence rows.
- Extends the plain-text citation-gap helper to consider evidence-backed surface context.
- Passes `surfaceContext` into the AgentDock citation-gap decision.
- Adds focused regression coverage for normal uncited warning behavior and evidence-backed suppression behavior.

## QA / Validation

- `pass`: `npx jest src/components/agent/__tests__/AgentDock.test.tsx src/lib/intelligence-v3/__tests__/sentinel-intel-context.test.ts --runInBand` — 2 suites, 40 tests passed.
- `pass`: `npx eslint src/components/agent/AgentDock.tsx src/lib/agent/citation-gap.ts src/lib/intelligence-v3/sentinel-intel-context.ts src/components/agent/__tests__/AgentDock.test.tsx src/lib/intelligence-v3/__tests__/sentinel-intel-context.test.ts`.
- `pass`: `npm run release:check -- --base origin/main --head HEAD`.
- `pass`: `git diff --check`.
- `not run`: production browser crawl is pending until merge/deploy.

## Rollout Plan

Merge to main, deploy to Vercel production, then rerun the signed-in Meridian Intelligence crawl and confirm the Enterprise Context panel remains loaded while the false citation-gap banner is gone.

## Rollback Plan

Revert the PR or roll back the Vercel deployment. There are no schema, migration, or data-load changes.

## Audit Evidence

- PR URL: pending.
- CI run: pending.
- Deployment URL: pending.
- Focused Jest/lint output: local validation passed on 2026-06-06.
- Meridian signed-in screenshot after deploy: pending.

## Known Gaps

This change removes a false-positive warning for evidence-backed surfaces. It does not add inline per-sentence citation chips to every Sentinel response; that remains a separate citation-rendering enhancement.
