# 2026-06-18-meridian-lakeshore-read-model-binding — Meridian/Lakeshore Intelligence and Tower Read Binding

## Release ID

`2026-06-18-meridian-lakeshore-read-model-binding`

## Status

`candidate`

## Plain-English Summary

Restores the live Intelligence and AI Control Tower read paths so Meridian and Lakeshore can surface the V2 context and AI Control Tower data already committed by the backend refresh lane. The prior deployed pages authenticated correctly, but Intelligence still showed the old "corpus not seeded" Brief and Tower still read legacy initiative/vendor tables, causing all-zero metrics. This candidate points `/intelligence` at the Context & Corpus Explorer and points `/tower` at the normalized `ai_control_*` read model.

## Layer Impact

- `global-control-lane`: Changes the shared `/intelligence` and `/tower` page bindings and components used by all tenants.
- `client-data-lane`: Reads tenant-scoped `enterprise_context_*`, `context_insights`, and `ai_control_*` rows. It does not write or delete data.

## Client Applicability

- All clients: Receive the restored read-model binding and honest empty states.
- Specific clients: Meridian Health and Lakeshore Holdings are the immediate verification targets because their V2 backend refresh committed context and AI Control Tower rows.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- Restores `src/lib/ai-control-tower/read-model.ts`.
- Restores `src/components/intelligence-v4/ContextCorpusExplorerPage.tsx`.
- Rebinds `src/app/intelligence/page.tsx` to the Context & Corpus Explorer.
- Rebinds `src/app/(maestro)/tower/page.tsx` to `getAiControlTowerReadModel`.
- Restores/updates focused tests for the read model, Tower page component, and Intelligence route binding.

## QA / Validation

- PASS: `./node_modules/.bin/jest src/__tests__/integration/intelligence/context-corpus-explorer-route.test.ts src/lib/ai-control-tower/__tests__/read-model.test.ts src/components/tower/__tests__/AiControlTowerPage.test.tsx --runInBand`
- PASS: `./node_modules/.bin/tsc --noEmit --pretty false --incremental false`
- PASS: `./node_modules/.bin/eslint src/app/intelligence/page.tsx 'src/app/(maestro)/tower/page.tsx' src/components/intelligence-v4/ContextCorpusExplorerPage.tsx src/components/tower/AiControlTowerPage.tsx src/lib/ai-control-tower/read-model.ts src/lib/ai-control-tower/__tests__/read-model.test.ts src/components/tower/__tests__/AiControlTowerPage.test.tsx src/__tests__/integration/intelligence/context-corpus-explorer-route.test.ts`
- PASS: `npm run release:check`
- PASS: `git diff --check`
- NOT RUN/PENDING: Production browser QA after deploy. Required before marking released.
- BLOCKED LOCALLY: `npm run build` in this temp worktree hit a Turbopack panic because `node_modules` is a symlink outside the project root. The production ACR build runs `npm ci` inside the Docker build context and remains the build gate for rollout.

## Rollout Plan

Merge after CI passes, build a new ACR image from the merge commit, deploy to the lab ACA web app, verify revision-specific `/api/health`, shift traffic to the new revision only after it is active and healthy, then run signed-in Meridian and Lakeshore crawls across `/intelligence` and `/tower`.

## Rollback Plan

Shift ACA traffic back to the previous healthy revision, then revert this release commit. No database rollback is required because the change is read-only.

## Audit Evidence

- Branch: `codex/meridian-lakeshore-live-read-models`
- Prior backend refresh evidence: `docs/releases/records/2026-06-18-meridian-lakeshore-v2-refresh-scaffold.md`
- Prior materializer evidence: `docs/releases/records/2026-06-18-context-insight-materializer.md`
- Focused test output: 3 suites / 7 tests passed.
- Typecheck and ESLint passed locally.

## Context Ingestion Evidence

This release does not perform ingestion. It restores UI/read-model visibility for already committed client-scoped rows.

- Local artifact generated: Not applicable.
- Local parse/preflight: Not applicable.
- Product loader/API accepted upload: Not applicable.
- Azure Blob/object storage staged originals: Not applicable.
- Queue/private worker handoff: Not applicable.
- Parser extracted text/tables/facts with source citations: Not applicable.
- Review/approval queue: Not applicable.
- Context rows/facts/chunks committed: Previously completed by the Meridian/Lakeshore V2 refresh lane.
- Embeddings/search refreshed: Not part of this release.
- Live signed-in retrieval or answer QA proved context usable: Pending post-deploy signed-in crawl.

## Known Gaps

- This does not run embeddings/search refresh.
- This does not run Blob staging or rich document parser/review queues.
- SkyHarbor is not refreshed by this release.
- Signed-in Meridian/Lakeshore browser proof remains pending until the candidate is deployed.
