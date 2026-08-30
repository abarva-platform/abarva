# 2026-08-30-home-data-workload-context — Home Data Workload Context

## Release ID

`2026-08-30-home-data-workload-context`

## Status

`candidate`

## Plain-English Summary

Home now carries data, BI, ETL, report, script, user, and data-volume workload context from the governed ECL projection into the architecture, record-browse, and narrative-packet surfaces. The page no longer displays a blanket missing-source message when segment-level workload evidence is present, and the Claude-facing Home packet receives deterministic category summaries plus page-specific executive writer lenses before page prose is generated.

## Layer Impact

- Release lane: `global-control-lane`.
- Layer 3 — Canonical model: no schema or data mutation.
- Layer 4 — Products: Home maps existing ECL serving rows into the Home technology-estate bundle, renders workload evidence separately from data-movement topology, and passes deterministic category summaries plus page-specific writer lenses into the Home narrative packet.
- Governance/docs: Home V2 contract now requires deterministic source-family and category summaries before page prompts run.

## Client Applicability

- All clients: applies to Home when ECL projection rows include data/BI/ETL workload segments.
- Specific clients: none named.
- Internal only: no.
- Public/demo only: no.
- Feature flag: existing Home/ECL serving path.

## Changes Included

- Home ECL projection bundle maps `data_analytics_workload` rows from the data-assets serving view.
- Home architecture page renders a data workload evidence panel when workload measures exist.
- Home data-flow route filters workload segments out of the movement-topology count.
- Home record browser exposes workload type, technology, workload count, active users, and data volume as browseable fields.
- Home ECL narrative job adds category summaries and workload visual datasets to the Claude-facing packet.
- Home chapter writer adds page-specific executive lenses so Technology & Data is written with a technologist/architect posture while executive and value pages keep business-strategy and CFO lenses.
- Home V2 implementation prompt pack documents deterministic source-family and category summary requirements.

## QA / Validation

- `npm test -- --runTestsByPath src/lib/home/preview/__tests__/ecl-projection-bundle.test.ts src/components/home/v4/__tests__/ArchitecturePage.grain.test.tsx --runInBand` — passed.
- `npx eslint src/lib/home/preview/ecl-projection-bundle.ts src/components/home/v4/ArchitecturePage.tsx src/components/home/v4/HomeV4App.tsx src/components/home/v4/RecordBrowser.tsx src/lib/home/preview/__tests__/ecl-projection-bundle.test.ts src/components/home/v4/__tests__/ArchitecturePage.grain.test.tsx` — passed.
- `node scripts/ecl/__tests__/run-home-ecl-narrative-layer-tests.mjs` — required before merge.
- `NODE_OPTIONS=--max-old-space-size=8192 npx tsc --noEmit --pretty false` — passed.

## Rollout Plan

Open a PR, squash merge to `main`, and let the repo-owned Azure Container Apps main deploy workflow publish the new web image.

## Deployment Authority

- Repo-owned deploy workflow: required after merge.
- Shared runtime mutators: none outside the approved workflow.
- Approved image digest: resolved by deploy workflow.
- ACA runtime invariant: required before live claim.
- Worker image invariant: not affected.
- Feature/env flag update path: none.
- Live signed-in proof required: yes, Home architecture and Data Assets browser.

## Rollback Plan

Revert the PR and redeploy through the repo-owned ACA workflow. No data rollback is required.

## Audit Evidence

- PR URL: https://github.com/abarva-platform/abarva/pull/7131
- CI/run evidence: to be added by release operator.
- Browser screenshots: to be captured after deploy.

## Known Gaps

- This does not generate new source data or mutate Azure data. It makes existing ECL workload context visible where the Home UI and narrative packet previously ignored it.
- Full Home narrative quality, architecture visual redesign, and per-page summary generation remain separate workstreams.
