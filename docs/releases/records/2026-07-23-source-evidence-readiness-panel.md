# 2026-07-23-source-evidence-readiness-panel — Source Evidence Readiness Panel

## Release ID

`2026-07-23-source-evidence-readiness-panel`

## Status

`candidate`

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
- `npx eslint src/components/source/canvas/analytics/SourceAnalyticsCanvas.tsx src/components/source/canvas/analytics/__tests__/SourceAnalyticsCanvas.chat.test.tsx src/lib/source/source-event-shell-v2.ts` passed on 2026-07-23.
- `NODE_OPTIONS=--max-old-space-size=8192 npx tsc --noEmit --pretty false -p tsconfig.json` passed on 2026-07-23.
- `npm run release:check -- --base origin/main --head HEAD` passed on 2026-07-23.

## Rollout Plan

Merge through PR into `main`; the repo-owned ACA main deploy workflow builds and deploys the digest-pinned image to `app.abarva.ai`. After deploy, verify the ACA runtime invariant and complete signed-in Source Files workspace proof showing the readiness panel.

## Deployment Authority

- Repo-owned deploy workflow: required for production rollout.
- Shared runtime mutators: none in this PR.
- Approved image digest: assigned by the repo-owned ACA deploy after merge.
- ACA runtime invariant: required after deploy.
- Worker image invariant: no worker changes expected.
- Feature/env flag update path: none.
- Live signed-in proof required: yes.

## Rollback Plan

Revert the PR and redeploy through the repo-owned ACA main workflow. That removes the read-only panel/chips and returns Files to the previous display. No data rollback is required.

## Audit Evidence

- PR URL: pending.
- Merge SHA: pending.
- ACA deploy run / digest: pending.
- Signed-in proof: pending.

## Known Gaps

- This does not run OCR/transcription.
- This does not add or execute an async parse worker/backfill job.
- This does not vector-index Source artifacts.
- This does not promote Source evidence into enterprise context or mark anything `agent_ready`.
