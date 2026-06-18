# 2026-06-18-firstcapital-intelligence-wireframe — First Capital Home and Intelligence Client View

## Release ID

`2026-06-18-firstcapital-intelligence-wireframe`

## Status

`candidate`

## Plain-English Summary

The First Capital Home and Intelligence pages now present what the loaded enterprise context and industry corpus mean for executives, instead of exposing backend loading details. Home orients the viewer on First Capital business KPIs, IT spend, AI spend, product story, module paths, and executive questions now answerable. Intelligence emphasizes derived insights, scale blockers, spend-to-prove, adoption drag, and decision confidence. Debug labels such as tenant keys, fallback state, raw row identifiers, facts, chunks, and technical inventory counts are removed from the client-facing first read.

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

- `src/app/(maestro)/home/page.tsx`
- `src/app/(maestro)/home/__tests__/firstcapital-home-client-view.test.ts`
- `src/components/intelligence-v4/ContextCorpusExplorerPage.tsx`
- `src/__tests__/integration/intelligence/context-corpus-explorer-client-view.test.ts`

## QA / Validation

- Pass: `./node_modules/.bin/eslint 'src/app/(maestro)/home/page.tsx' 'src/app/(maestro)/home/__tests__/firstcapital-home-client-view.test.ts' src/components/intelligence-v4/ContextCorpusExplorerPage.tsx src/__tests__/integration/intelligence/context-corpus-explorer-client-view.test.ts`
- Pass: `./node_modules/.bin/jest 'src/app/(maestro)/home/__tests__/firstcapital-home-client-view.test.ts' src/__tests__/integration/intelligence/context-corpus-explorer-client-view.test.ts --runInBand`
- Pass: `git diff --check`
- Pass: `./node_modules/.bin/next build --webpack`
- Not run yet: post-deploy browser crawl. This requires the candidate image to be deployed first.

## Rollout Plan

Merge through the controlled release branch, build a new Azure Container Apps image, update the lab web app revision, and assign traffic after smoke QA passes.

## Rollback Plan

Reassign ACA traffic to the prior healthy First Capital demo revision or revert this component commit and redeploy.

## Audit Evidence

Audit evidence will include the commit, PR, CI output, deploy revision, and post-deploy browser screenshot/crawl output.

## Context Ingestion Evidence

Not applicable. This release does not change Admin Data Loads, setup loaders, Blob staging, parser extraction, DB commit, embeddings, or retrieval indexing.

## Known Gaps

The "See evidence" and "Shape into Move" controls remain presentation hooks unless the active environment has the corresponding downstream routes wired.
