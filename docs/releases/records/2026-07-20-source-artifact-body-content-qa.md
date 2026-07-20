# 2026-07-20-source-artifact-body-content-qa — Source Artifact Body Content QA

## Release ID

`2026-07-20-source-artifact-body-content-qa`

## Status

`candidate`

## Plain-English Summary

Source Files now threads readable artifact body text into the artifact lifecycle matrix. The renderer-output QA added in the prior slice can score real artifact bodies when the registry points to text-like blobs or inline `source_event_artifact_states.body` content. Binary files such as PDF/DOCX remain registry-only unless parsed elsewhere, so Source still reports them as not scored instead of pretending content quality was inspected.

## Layer Impact

- `global-control-lane` / Source registry read path: adds a bounded server-only text-content reader for text, markdown, JSON, and inline artifact-state bodies.
- `global-control-lane` / Source event shell: passes readable body text into the Files lifecycle matrix so deterministic document QA can score real content.
- `global-control-lane` / Source artifact detail path: reuses the same registry text reader to avoid drift in readable-content semantics.

## Client Applicability

- All clients: yes, for the redesigned Source shell Files workspace.
- Specific clients: none.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- `src/lib/source/artifact-registry/index.ts`
- `src/lib/source/artifact-registry/__tests__/artifact-registry.test.ts`
- `src/lib/source/queries.ts`
- `src/app/(maestro)/source/events/[eventId]/page.tsx`

## QA / Validation

- Pass: focused Jest coverage for artifact-registry hydration and lifecycle matrix behavior (`npm test -- --runInBand src/lib/source/artifact-registry/__tests__/artifact-registry.test.ts src/lib/source/__tests__/artifact-lifecycle-matrix.test.ts`) — 29/29 passed. Jest reported existing duplicate manual mock warnings for markdown mocks.
- Pass: ESLint on touched files (`npx eslint src/lib/source/artifact-registry/index.ts src/lib/source/artifact-registry/__tests__/artifact-registry.test.ts src/lib/source/queries.ts 'src/app/(maestro)/source/events/[eventId]/page.tsx'`).
- Pass: TypeScript check with larger local heap (`NODE_OPTIONS=--max-old-space-size=8192 npx tsc --noEmit --pretty false`). A first default-heap run hit local Node heap exhaustion before reporting type results.
- Pending: `npm run release:check`.
- Pending: signed-in proof after merge/deploy.

## Rollout Plan

Merge through PR to `main`. The repo-owned Azure Container Apps main deploy workflow builds and deploys the production image for `app.abarva.ai`. No migration, data build, feature flag, or manual data operation is required.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`
- Shared runtime mutators: none in this PR.
- Approved image digest: assigned by the main deploy workflow after merge.
- ACA runtime invariant: required after deploy.
- Worker image invariant: not affected.
- Feature/env flag update path: none.
- Live signed-in proof required: yes, Source Files workspace should show content-QA scoring for readable bodies when present, while binary/metadata-only rows remain honestly not scored.

## Rollback Plan

Revert the PR and redeploy through the repo-owned ACA main deploy workflow. No database rollback is needed.

## Audit Evidence

- PR: pending.
- ACA deploy run: pending.
- Signed-in screenshot: pending.

## Known Gaps

This slice does not parse binary PDF/DOCX/XLSX/PPTX content into body text. Those artifacts still require a parser/governed extraction path before renderer-output quality can score their prose, visuals, citations, or exhibits.
