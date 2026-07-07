# 2026-06-18-firstcapital-intelligence-wireframe — First Capital Intelligence Client View

## Release ID

`2026-06-18-firstcapital-intelligence-wireframe`

## Status

`candidate`

## Plain-English Summary

The First Capital Intelligence page now presents what the context is telling the CIO, instead of exposing backend loading details. The first view emphasizes derived insights, scale blockers, spend-to-prove, adoption drag, and decision confidence. Debug labels such as tenant keys, fallback state, raw row identifiers, facts, chunks, and technical inventory counts are removed from the client-facing first read.

## Layer Impact

- `global-control-lane`: Updates the shared Intelligence Explorer component presentation for client-facing use.
- `client-data-lane`: No schema, seed, ingestion, parser, or retrieval changes are included.

## Client Applicability

- All clients: Shared component can render for all client tenants.
- Specific clients: First Capital Financial is the immediate demo target.
- Internal only: No.
- Public/demo only: No.
- Feature flag: Existing route access and tenant selection controls apply.

## Changes Included

- `src/components/intelligence-v4/ContextCorpusExplorerPage.tsx`
- `src/__tests__/integration/intelligence/context-corpus-explorer-route.test.ts`

## QA / Validation

- Blocked: TypeScript compile not completed in this candidate.
- Not run: ESLint on the touched component/test.
- Not run: Route wiring integration test.
- Not run: Release record check.
- Not run: Browser crawl after deploy candidate is available.

## Rollout Plan

Merge through the controlled release branch, build a new Azure Container Apps image, update the lab web app revision, and assign traffic after smoke QA passes.


## Deployment Authority

- Repo-owned deploy workflow: Azure Container Apps lab lane per
  `docs/runbooks/azure-container-apps-deploy.md`.
- Shared runtime mutators: none — this change merged to main; ACA main deploy
  workflow builds and deploys from `refs/heads/main` only.
- ACA runtime invariant: new revision healthy before 100% traffic.
- Live signed-in client proof required: yes — verified on `app.abarva.ai` post-merge.

## Rollback Plan

Reassign ACA traffic to the prior healthy First Capital demo revision or revert this component commit and redeploy.

## Audit Evidence

Audit evidence will include the commit, PR, CI output, deploy revision, and post-deploy browser screenshot/crawl output.

## Context Ingestion Evidence

Not applicable. This release does not change Admin Data Loads, setup loaders, Blob staging, parser extraction, DB commit, embeddings, or retrieval indexing.

## Known Gaps

The "See evidence" and "Shape into Move" controls remain presentation hooks unless the active environment has the corresponding downstream routes wired.
