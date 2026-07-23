# 2026-07-23-source-evidence-readiness-panel — Source Evidence Readiness Panel

## Release ID

`2026-07-23-source-evidence-readiness-panel`

## Status

`deployed-signed-in-proven`

## Plain-English Summary

Source Files now separates evidence storage from evidence readiness. A compact Files panel shows how many artifacts are stored, parsed, still waiting on a parser, and search-ready, and each file card carries a processing chip. This makes the Azure/Postgres evidence layer more honest: uploaded is not the same as parsed, indexed, enterprise-promoted, or agent-ready.

## Layer Impact

- Release lane: `global-control-lane`.
- Source Files workspace: adds a read-only evidence-readiness panel and per-file processing chip.
- Source event shell view model: carries existing `parseStatus`, `embeddingStatus`, and `graphStatus` values from durable Source artifact rows into the client component.
- Data layer: no schema change, no upload behavior change, no data mutation, no worker/job execution.
- aVa / enterprise context readiness: improves user-visible state separation before future parse-worker, search indexing, or enterprise-context promotion slices.

## Client Applicability

- All clients: yes, for Source event Files workspaces.
- Specific clients: none.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- `src/lib/source/source-event-shell-v2.ts`: preserves artifact parse/search/graph statuses in `SourceShellFileItem`.
- `src/components/source/canvas/analytics/SourceAnalyticsCanvas.tsx`: adds the Evidence readiness panel and per-file processing chips.
- `src/components/source/canvas/analytics/__tests__/SourceAnalyticsCanvas.chat.test.tsx`: proves parsed, registered-only, and search-ready states render honestly.
- `docs/backlog/source-product-backlog.md`: records `SOURCE-INGEST-001c`.

## QA / Validation

- `npm test -- --runTestsByPath src/components/source/canvas/analytics/__tests__/SourceAnalyticsCanvas.chat.test.tsx --runInBand` passed on 2026-07-23: 16/16. Jest reported pre-existing duplicate manual mock warnings for mdast/micromark helpers.
- `npm test -- --runTestsByPath src/lib/source/artifact-registry/__tests__/upload-text-extraction.test.ts 'src/app/api/v1/source/[eventId]/artifacts/upload/__tests__/route.test.ts' src/components/source/canvas/analytics/__tests__/SourceAnalyticsCanvas.chat.test.tsx src/lib/source/artifact-registry/__tests__/upload-contract.test.ts --runInBand` — pass on 2026-07-23, 34/34 across the combined ingest regression set. Same pre-existing duplicate Jest manual mock warnings observed.
- `npx eslint src/components/source/canvas/analytics/SourceAnalyticsCanvas.tsx src/components/source/canvas/analytics/__tests__/SourceAnalyticsCanvas.chat.test.tsx src/lib/source/source-event-shell-v2.ts` passed on 2026-07-23.
- `NODE_OPTIONS=--max-old-space-size=8192 npx tsc --noEmit --pretty false -p tsconfig.json` passed on 2026-07-23.
- `npm run release:check -- --base origin/main --head HEAD` passed on 2026-07-23.

## Rollout Plan

Merge through PR into `main`; the repo-owned ACA main deploy workflow builds and deploys the digest-pinned image to `app.abarva.ai`. After deploy, verify the ACA runtime invariant and complete signed-in Source Files workspace proof showing the readiness panel.

## Deployment Authority

- Repo-owned deploy workflow: required for production rollout.
- Shared runtime mutators: none in this PR.
- Approved image digest: later independently verified production revision
  `ca-abarva-web-lab-eastus--me89b7e4d`, image
  `acrabarvalab001.azurecr.io/abarva/web@sha256:24e692b4213213fede4a7921ffe8a53d3a1b9215989c0f81bb2cd308b3ff5185`,
  tag `main-e89b7e4d`, contains PR #5454.
- ACA runtime invariant: passed independently on 2026-07-23 for the superseding
  production revision above; web and worker images matched and 100% traffic was on
  that revision.
- Worker image invariant: no worker changes expected.
- Feature/env flag update path: none.
- Live signed-in proof required: yes.

## Rollback Plan

Revert the PR and redeploy through the repo-owned ACA main workflow. That removes the read-only panel/chips and returns Files to the previous display. No data rollback is required.

## Audit Evidence

- PR URL: https://github.com/abarva-platform/abarva/pull/5454.
- Merge SHA: `d436d4b654dc6e920db9fb2753ecd8867b846205`.
- ACA deploy run / digest: ACA main run `29991443166` succeeded for the merge SHA;
  later same-SHA/superseding retry run `29991922890` also succeeded. Current
  production revision `ca-abarva-web-lab-eastus--me89b7e4d` was independently
  invariant-proven with digest
  `sha256:24e692b4213213fede4a7921ffe8a53d3a1b9215989c0f81bb2cd308b3ff5185`.
- Signed-in proof: non-mutating Files workspace proof captured in
  `audit-artifacts/source-ingest-files-workspace-live-proof-20260723/ui-proof-summary.json`;
  it confirms Stored, Parsed, Needs parser, and Search-ready states render on
  `app.abarva.ai` and that the UI says search indexing and enterprise-context
  promotion remain separate governed steps.

## Known Gaps

- This does not run OCR/transcription.
- This does not add or execute an async parse worker/backfill job.
- This does not vector-index Source artifacts.
- This does not promote Source evidence into enterprise context or mark anything `agent_ready`.
