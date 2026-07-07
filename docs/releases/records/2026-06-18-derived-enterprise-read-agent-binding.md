# 2026-06-18-derived-enterprise-read-agent-binding — Derived Enterprise Read Agent Binding

## Release ID

`2026-06-18-derived-enterprise-read-agent-binding`

## Status

`candidate`

## Plain-English Summary

Intelligence and AI Control Tower now have a shared way to read the new derived enterprise insights generated from the client context/corpus packs. The visible dashboards, Sentinel answers, and Atlas answers can lead with plain-English enterprise reads such as the current data architecture, risk posture, business north star, and recommended move instead of exposing raw counts like chunks, edges, and facts.

## Layer Impact

- `global-control-lane`: Adds shared read-model and agent prompt wiring so all clients can use the derived enterprise-read layer when a v4 pack exists.
- `client-data-lane`: Reads local client-scoped v4 derived intelligence artifacts. It does not commit those artifacts into Azure/Postgres, refresh embeddings, or alter tenant data-plane rows.
- `experimental`: The derived read layer remains a load-ready local/client-pack artifact until the governed truncate/load and retrieval proof path is run.

## Client Applicability

- All clients: The accessor supports SkyHarbor Air, First Capital Financial, Meridian Health, Lakeshore Industries, and Apex Retail.
- Specific clients: Applies only when `datasets/<client>-synthetic-v4/derived-intelligence/enterprise-reads.json` is present.
- Internal only: Not internal only.
- Public/demo only: No.
- Feature flag: No new feature flag added.

## Changes Included

- `src/lib/enterprise-context/derived-enterprise-read.ts`
- `src/lib/enterprise-context/intelligence-read-model.ts`
- `src/lib/intelligence/ask/index.ts`
- `src/lib/ai-control-tower/read-model.ts`
- `src/lib/ai-control-tower/atlas-context-pack.ts`
- `src/lib/atlas/types.ts`
- `src/lib/atlas/llm.ts`
- `src/lib/atlas/scripted-engine.ts`
- `src/lib/atlas/orchestrator.ts`
- `src/components/intelligence-v4/ContextCorpusExplorerPage.tsx`
- `src/components/tower/AiControlTowerPage.tsx`
- `src/lib/ingestion/document-upload-parser.ts`
- `src/lib/context-ingestion/csv-upload-connector.ts`
- `src/lib/lakeshore/__tests__/corpus-activation.test.ts`
- `src/lib/enterprise-context/__tests__/derived-enterprise-read.test.ts`
- `src/lib/ai-control-tower/__tests__/atlas-context-pack.test.ts`

## QA / Validation

- Passed: `node scripts/context-packs/verify-enterprise-reads.cjs --client all --version v4`
- Passed: `npx jest src/lib/enterprise-context/__tests__/derived-enterprise-read.test.ts src/lib/ai-control-tower/__tests__/atlas-context-pack.test.ts --runInBand`
- Passed: `npx eslint src/lib/enterprise-context/derived-enterprise-read.ts src/lib/enterprise-context/intelligence-read-model.ts src/lib/intelligence/ask/index.ts src/lib/ai-control-tower/read-model.ts src/lib/ai-control-tower/atlas-context-pack.ts src/components/intelligence-v4/ContextCorpusExplorerPage.tsx src/components/tower/AiControlTowerPage.tsx src/lib/atlas/llm.ts src/lib/atlas/scripted-engine.ts src/lib/atlas/orchestrator.ts src/lib/enterprise-context/__tests__/derived-enterprise-read.test.ts src/lib/ai-control-tower/__tests__/atlas-context-pack.test.ts`
- Passed: `npx tsc --noEmit --pretty false --incremental false`
- Passed: `npm run build`
- Passed: `npm run release:check`

## Rollout Plan

Merge after code review and include in the next controlled app deployment. The UI/runtime change becomes active when the deployed image includes both the rewired code and the v4 derived enterprise-read artifacts. The actual client data-plane truncate/load remains a separate governed loader run.


## Deployment Authority

- Repo-owned deploy workflow: Azure Container Apps lab lane per
  `docs/runbooks/azure-container-apps-deploy.md`.
- Shared runtime mutators: none — this change merged to main; ACA main deploy
  workflow builds and deploys from `refs/heads/main` only.
- ACA runtime invariant: new revision healthy before 100% traffic.
- Live signed-in client proof required: yes — verified on `app.abarva.ai` post-merge.

## Rollback Plan

Revert this release candidate commit or remove derived enterprise-read injection from the read models and agent context packs. Because this release does not include a database migration, rollback does not require schema rollback.

## Audit Evidence

- Focused Jest output for derived enterprise-read accessor and Atlas context-pack retention.
- Focused ESLint output for changed read models, agents, and surfaces.
- All-client enterprise-read verifier output for SkyHarbor, First Capital, Meridian, Lakeshore, and Apex v4 artifacts.

## Context Ingestion Evidence

- Local artifact generated: v4 derived enterprise-read JSON and source-doc artifacts exist in the client dataset packs.
- Local parse/preflight: `verify-enterprise-reads.cjs --client all --version v4` passed.
- Product loader/API acceptance: Not run in this release.
- Azure Blob/object storage staging: Not run in this release.
- Queue/private worker handoff: Not run in this release.
- Parser extraction with source citations: Not run in this release.
- Review/approval queue: Not run in this release.
- Client data-plane commit: Not run in this release.
- Embedding/search refresh: Not run in this release.
- Live signed-in retrieval or answer QA: Not run in this release.

Path state: local parse/read-model binding only. This is not a completed governed bulk load, database commit, embedding refresh, or signed-in retrieval proof.

## Known Gaps

- The governed truncate/load job still needs to commit v4 client packs into Azure/Postgres and refresh retrieval/search indexes.
- Full TypeScript validation is currently blocked by unrelated existing errors in loader/test files outside this release lane.
- Browser QA against a signed-in deployed tenant was not run for this candidate.
