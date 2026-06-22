# Source aVa Advisory Response Uplift

Date: 2026-06-22
Worktree: `/private/tmp/nexus-source-ava-uplift`
Branch: `codex/source-ava-advisory-uplift`

## What Changed

- Added a shared structured agent response contract for text, metric strips, tables, bar charts, citations, and next actions.
- Added a native React renderer for structured response parts in AgentDock.
- Wired the Source Nexus answer API to return `agentResponseParts` alongside the legacy prose summary.
- Wired the Source event canvas to pass those parts into the response window.
- Updated active Source canvas user-facing naming from Sentinel-stage labels to `aVa Source`.
- Updated Source artifact-generation controls from `Generate with Sentinel` to `Generate with aVa`.
- Updated prompt templates so aVa drafts story-led sourcing artifacts with tables and chart-ready summaries, without the prior fixed 600-1200 word cap.
- Added a Source/aVa crawler script plus runbook for static and authenticated route checks.

## Validation Completed

- `node --check scripts/audit/source-ava-crawl.mjs`
- `node scripts/audit/source-ava-crawl.mjs --no-browser --timestamp smoke-static`
- `npx jest src/lib/source/__tests__/source-answer-engine.test.ts src/lib/source/__tests__/nexus-api-live-context.test.ts src/components/agent/__tests__/AgentDock.test.tsx --runInBand`
- `npx eslint src/lib/agent/response-parts.ts src/components/agent/AgentResponseParts.tsx src/components/agent/AgentDock.tsx src/components/agent/__tests__/AgentDock.test.tsx src/lib/source/source-answer-engine.ts src/lib/source/nexus-api.ts src/lib/source/__tests__/source-answer-engine.test.ts src/lib/source/__tests__/nexus-api-live-context.test.ts src/components/source/canvas/UniversalCanvasShell.tsx src/components/source/canvas/workspace-tabs/DocumentTab.tsx src/lib/source/agent-generation/prompt-registry.ts scripts/audit/source-ava-crawl.mjs`
- `npm run release:check`
- Apex authenticated crawl attempted against local branch dev server: `reports/source-ava-crawl/apex-auth-2026-06-22-r5/source-ava-crawl.md`
- Skyharbor authenticated crawl attempted against local branch dev server: `reports/source-ava-crawl/skyharbor-auth-2026-06-22/source-ava-crawl.md`

## Validation Caveat

- `npm run test:behaviors` was attempted and failed in tenant-onboarding behavior tests because `CLIENT_KEY_TO_DB_SLUGS` was not found by `src/scripts/tenants/add-tenant.ts`. That failure is outside the Source/aVa files changed here.

## Runtime Proof Status

- Browser-authenticated Source canvas crawl was attempted for Apex and Skyharbor. Both runs reached Clerk server-ticket auth selection but deferred browser proof because local route navigation hit `ERR_TOO_MANY_REDIRECTS`, and the dev server logged Clerk session refresh redirect-loop warnings.
- The crawler is ready to rerun signed-in proof after local Clerk key/session configuration is corrected:

```bash
npx next dev --webpack -p 3000
DOTENV_CONFIG_PATH=.env.local node -r dotenv/config scripts/audit/source-ava-crawl.mjs --base-url http://localhost:3000 --auth-client apex
DOTENV_CONFIG_PATH=.env.local node -r dotenv/config scripts/audit/source-ava-crawl.mjs --base-url http://localhost:3000 --auth-client skyharbor
```

## Included Evidence

- `reports/source-ava-crawl/smoke-static/source-ava-crawl.md`
- `reports/source-ava-crawl/smoke-static/source-ava-crawl.json`
- `reports/source-ava-crawl/apex-auth-2026-06-22-r5/source-ava-crawl.md`
- `reports/source-ava-crawl/apex-auth-2026-06-22-r5/source-ava-crawl.json`
- `reports/source-ava-crawl/skyharbor-auth-2026-06-22/source-ava-crawl.md`
- `reports/source-ava-crawl/skyharbor-auth-2026-06-22/source-ava-crawl.json`
- `docs/testing/source-ava-crawl/README.md`
- `docs/releases/records/2026-06-22-source-ava-advisory-response.md`
- `source-ava-uplift.patch` inside the Downloads zip
