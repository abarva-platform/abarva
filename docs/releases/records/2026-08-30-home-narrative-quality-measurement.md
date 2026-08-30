# 2026-08-30-home-narrative-quality-measurement — Home Narrative Quality Measurement

## Release ID

`2026-08-30-home-narrative-quality-measurement`

## Status

`candidate`

## Plain-English Summary

Adds a measurable Home narrative-quality gate so the executive opening path is checked before render-time cleanup. The change keeps the existing render safety net, but now also checks the raw claim text selected for the page and provides a plan-only measurement command to compare current chapter width against wider context and a larger synthesis budget.

## Layer Impact

Release lane: `global-control-lane`.

Layer 3 / Canonical Enterprise Model: no schema or data change. The canonical facts and generated thesis remain the source for the Home chapter writer.

Layer 4 / Products: Home rendering keeps its final text cleanup, but tests now assert the selected raw executive-story claims are already free of implementation vocabulary before cleanup. The chapter writer exposes named assembly limits and a measurement-only mode.

## Client Applicability

- All clients: Home narrative-quality guard applies to the shared Home preview path.
- Specific clients: None named in this public record.
- Internal only: The measurement command is operator/developer-only.
- Public/demo only: No public route change.
- Feature flag: None.

## Changes Included

- `scripts/data-build/build-home-chapters.ts`: named chapter assembly limits, configurable synthesis budget, raw generation-language measurement, and a `--measure-quality` plan-only mode.
- `scripts/data-build/build-enterprise-thesis.ts`: Claude call telemetry now returns stop reason and thinking-token metadata for measurement.
- `src/components/home/v4/ExecutiveStoryPage.tsx`: exported raw Tier 1 claim collector and generation-language detector; scoped broad render cleanup rules that could alter legitimate business prose.
- `src/components/home/v4/__tests__/HomeV4App.tier1.test.tsx`: raw-input assertion and planted failure proving the gate catches terms not laundered by render cleanup.
- `package.json`: `data-build:home-chapters:measure` command.

## QA / Validation

- PASS: `npx jest src/components/home/v4/__tests__/HomeV4App.tier1.test.tsx --runInBand`
- PASS: `NODE_OPTIONS=--max-old-space-size=8192 ./node_modules/.bin/tsc --noEmit --pretty false --skipLibCheck --project tsconfig.json`
- PASS: `npm run data-build:home-chapters:measure -- --out-dir /tmp/home-chapters-measurement-no-key` exits safely before generation when `ANTHROPIC_API_KEY` is absent.
- Observed raw-input gate on current checked-in snapshot: 21 selected Tier 1 raw claim statements, 0 requiring render-time laundering, 0 forbidden generation-language hits.
- Planted failure test proves an uncovered builder phrase is rejected before render cleanup.

## Rollout Plan

Merge through PR. No Azure data-plane mutation, no database migration, no route repoint, no traffic shift, and no deployment is required for this measurement/gate slice. A live measurement run requires an Anthropic-enabled operator environment and remains plan-only.

## Deployment Authority

- Repo-owned deploy workflow: Not required.
- Shared runtime mutators: None.
- Approved image digest: Not applicable.
- ACA runtime invariant: Not applicable.
- Worker image invariant: Not applicable.
- Feature/env flag update path: None.
- Live signed-in proof required: No, because no runtime rollout occurs in this slice.

## Rollback Plan

Revert the PR. Since this is a test and plan-only writer measurement change with no persisted data mutation, rollback is source-only.

## Audit Evidence

- PR URL: to be added after PR creation.
- Local focused Jest output.
- Local TypeScript output.
- No-key measurement command output.

## Known Gaps

- The three-way baseline / width / width-plus-budget measurement was not executed locally because the shell did not have `ANTHROPIC_API_KEY`.
- The measurement command is present and safe, but its result table must be captured from an Anthropic-enabled operator run before changing default assembly limits or synthesis budget.
