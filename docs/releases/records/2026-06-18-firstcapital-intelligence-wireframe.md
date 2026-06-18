# 2026-06-18-firstcapital-intelligence-wireframe — First Capital Home, Intelligence, and Tower Client View

## Release ID

`2026-06-18-firstcapital-intelligence-wireframe`

## Status

`candidate`

## Plain-English Summary

The First Capital Home, Intelligence, and Tower pages now present what the loaded enterprise context, industry corpus, and AI Control Tower rows mean for executives, instead of exposing backend loading details. Home orients the viewer on First Capital business KPIs, IT spend, AI spend, product story, module paths, and executive questions now answerable. Intelligence now follows the standalone client-view wireframe more closely: compact header, tabs, Sentinel rail, and cross-context signal cards without oversized summary tiles or raw layer labels. Tower now follows the AI Control Tower standalone wireframe more closely: compact executive question header, dense metric band, clean lens labels, and no client-visible fallback warning copy. Debug labels such as tenant keys, fallback state, raw row identifiers, facts, chunks, and technical inventory counts are removed from the client-facing first read.

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
- `src/components/tower/AiControlTowerPage.tsx`
- `src/__tests__/integration/intelligence/context-corpus-explorer-client-view.test.ts`

## QA / Validation

- Pass: `./node_modules/.bin/eslint 'src/app/(maestro)/home/page.tsx' 'src/app/(maestro)/home/__tests__/firstcapital-home-client-view.test.ts' src/components/intelligence-v4/ContextCorpusExplorerPage.tsx src/components/tower/AiControlTowerPage.tsx src/__tests__/integration/intelligence/context-corpus-explorer-client-view.test.ts`
- Pass: `./node_modules/.bin/eslint src/components/intelligence-v4/ContextCorpusExplorerPage.tsx src/components/tower/AiControlTowerPage.tsx src/__tests__/integration/intelligence/context-corpus-explorer-client-view.test.ts`
- Pass: `./node_modules/.bin/jest 'src/app/(maestro)/home/__tests__/firstcapital-home-client-view.test.ts' src/__tests__/integration/intelligence/context-corpus-explorer-client-view.test.ts --runInBand`
- Pass: `git diff --check`
- Pass: `./node_modules/.bin/next build --webpack`
- Pass: local visual smoke on `http://localhost:3001/intelligence` with screenshot in `audit-artifacts/local-visual-20260618-style-fix/intelligence.png`; verified 42px capped H1, no concatenated tab plumbing text, and no visible tenant/fallback/facts/chunks inventory language.
- Blocked pending auth code/session: signed-in First Capital `/home`, `/intelligence`, and `/tower` crawl. The current production sign-in uses email access code; demo-invite auth did not authenticate the provisioned First Capital emails in local QA.

## Rollout Plan

Merge through the controlled release branch, build a new Azure Container Apps image, update the lab web app revision, and assign traffic after smoke QA passes.

## Rollback Plan

Reassign ACA traffic to the prior healthy First Capital demo revision or revert this component commit and redeploy.

## Audit Evidence

Audit evidence includes the commit, pushed branch, ACA revision/image for the first deployed cut, focused lint/test/build output, local visual screenshot, and any signed-in browser screenshot/crawl output once the one-time code or signed-in Chrome session is available.

## Context Ingestion Evidence

Not applicable. This release does not change Admin Data Loads, setup loaders, Blob staging, parser extraction, DB commit, embeddings, or retrieval indexing.

## Known Gaps

The "See evidence" and "Shape into Move" controls remain presentation hooks unless the active environment has the corresponding downstream routes wired.
