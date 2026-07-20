# 2026-07-20-source-file-ledger-governance — Source File Ledger Draft Governance

## Release ID

`2026-07-20-source-file-ledger-governance`

## Status

`candidate`

## Plain-English Summary

The new Source event shell file ledger now shows artifact-governance language from structured artifact state. Generated Source deliverables are labeled as AI-prepared drafts that require human review, client-final uploads are labeled as reviewed authoritative finals, and ordinary uploaded evidence remains file evidence.

This closes a gap found during live signed-in proof after PR #5093: the old document workspace carried the new governance wording, but the active SourceAnalyticsCanvas file ledger still hardcoded every artifact as file evidence.

## Layer Impact

- `global-control-lane`: Source event shell rendering and its view-model change for all tenants using the SourceAnalyticsCanvas route.
- No database, migration, ingestion, or tenant-data change.

## Client Applicability

- All clients: yes, for Source event file-ledger rendering.
- Specific clients: none.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- `src/lib/source/source-event-shell-v2.ts`
- `src/components/source/canvas/analytics/SourceAnalyticsCanvas.tsx`
- `src/components/source/canvas/analytics/__tests__/SourceAnalyticsCanvas.chat.test.tsx`
- This release record.

## QA / Validation

- `pass` — Focused Jest: `npm test -- --runTestsByPath src/components/source/canvas/analytics/__tests__/SourceAnalyticsCanvas.chat.test.tsx` passed 12/12.
- `pass` — Focused ESLint: `npx eslint src/lib/source/source-event-shell-v2.ts src/components/source/canvas/analytics/SourceAnalyticsCanvas.tsx src/components/source/canvas/analytics/__tests__/SourceAnalyticsCanvas.chat.test.tsx`.
- `pass` — TypeScript: `NODE_OPTIONS=--max-old-space-size=8192 npx tsc --noEmit`.
- `pass` — Release control: `npm run release:check`.
- `not-run` — Signed-in browser proof waits until this PR is merged and deployed.

## Rollout Plan

Merge through PR to `main`. The repo-owned Azure Container Apps main deploy workflow builds and deploys the exact merge SHA to `app.abarva.ai`.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`
- Shared runtime mutators: none outside the repo-owned workflow.
- Approved image digest: resolved by the deploy workflow after merge.
- ACA runtime invariant: required after deploy.
- Worker image invariant: required by the deploy workflow.
- Feature/env flag update path: none.
- Live signed-in proof required: yes, FS Demo Source event Files workspace must show AI-prepared draft language for generated artifacts.

## Rollback Plan

Revert the PR or redeploy the prior successful ACA revision. No schema rollback is required.

## Audit Evidence

- Candidate PR URL: pending.
- Local focused test output: focused Jest 12/12, ESLint clean, TypeScript clean.
- ACA deploy run: pending after merge.
- Signed-in proof screenshot: pending after deploy.

## Known Gaps

- This does not rewrite historic artifact descriptions stored in the registry. The UI derives the visible governance state from structured artifact fields so old generated drafts are governed without data backfill.
