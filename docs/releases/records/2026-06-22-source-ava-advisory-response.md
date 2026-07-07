# 2026-06-22-source-ava-advisory-response — Source aVa Advisory Response

## Release ID

`2026-06-22-source-ava-advisory-response`

## Status

`candidate`

## Plain-English Summary

Source's front-line sourcing agent is being moved from a prose-only Sentinel experience toward the aVa advisory experience. The active Source event canvas can now receive structured response parts from the Source answer API and render them as native tables, chart bars, citations, metrics, and next actions in the response window. The artifact-generation voice was also updated so aVa drafts story-led sourcing artifacts with visual reasoning instead of short validator-style memos.

## Layer Impact

- `global-control-lane`: Updates shared Source canvas UI, shared AgentDock rendering, Source answer API response shape, deterministic Source answer assembly, and artifact prompt templates.
- No `client-data-lane` change: no schema, RLS, ingestion, retrieval index, seed, or private client data-plane mutation is included.
- No `internal-admin` change: admin loaders, setup flows, queues, and ingestion receipts are not touched.

## Client Applicability

- All clients: Source event canvas users receive the structured aVa response renderer once this branch ships.
- Specific clients: None.
- Internal only: None.
- Public/demo only: None.
- Feature flag: None in this candidate.

## Changes Included

- `src/lib/agent/response-parts.ts`: shared typed contract for text, metrics, tables, bar charts, citations, and next actions.
- `src/components/agent/AgentResponseParts.tsx`: native React renderer for structured agent response parts.
- `src/components/agent/AgentDock.tsx`: renders structured parts for agent turns when supplied, with prose fallback preserved.
- `src/lib/source/source-answer-engine.ts`: builds aVa response parts from current-state evidence, sourcing implications, delivery gate, should-cost, proposal normalization, risks, citations, and next action.
- `src/lib/source/nexus-api.ts`: exposes `agentResponseParts` in the Source Nexus API response, including intake-guidance table output.
- `src/components/source/canvas/UniversalCanvasShell.tsx`: passes API response parts into the active Source chat lane and labels Sentinel-stage canvas as `aVa Source` for users.
- `src/components/source/canvas/workspace-tabs/DocumentTab.tsx`: updates visible generation controls from Sentinel to aVa.
- `src/lib/source/agent-generation/prompt-registry.ts`: updates generation voice to aVa's story-led sourcing advisor posture and removes the hard 600-1200 word cap.
- `scripts/audit/source-ava-crawl.mjs`: crawler/smoke artifact for Source/aVa route, response-window, and static contract checks.
- `docs/testing/source-ava-crawl/README.md`: runbook for the Source/aVa crawler.

## QA / Validation

- `node --check scripts/audit/source-ava-crawl.mjs` passed.
- `node scripts/audit/source-ava-crawl.mjs --no-browser --timestamp smoke-static` passed with `ACCEPT=0 DEFER=21 REJECT=0`; no browser/auth was available, so runtime browser steps deferred without false pass/fail claims.
- `DOTENV_CONFIG_PATH=.env.local node -r dotenv/config scripts/audit/source-ava-crawl.mjs --base-url http://localhost:3000 --auth-client apex --timestamp apex-auth-2026-06-22-r5 --timeout-ms 30000` ran against the local branch dev server and produced `ACCEPT=0 DEFER=21 REJECT=0`; Clerk ticket auth selected `anand.sundaram+apex@thesundaram.com` and `apexretail`, but browser route proof was blocked by `ERR_TOO_MANY_REDIRECTS`.
- `DOTENV_CONFIG_PATH=.env.local node -r dotenv/config scripts/audit/source-ava-crawl.mjs --base-url http://localhost:3000 --auth-client skyharbor --timestamp skyharbor-auth-2026-06-22 --timeout-ms 30000` ran against the local branch dev server and produced `ACCEPT=0 DEFER=21 REJECT=0`; Clerk ticket auth selected `anand.sundaram+skyharbor@thesundaram.com` and `skyharbor`, but browser route proof was blocked by `ERR_TOO_MANY_REDIRECTS`.
- `npx jest src/lib/source/__tests__/source-answer-engine.test.ts src/lib/source/__tests__/nexus-api-live-context.test.ts src/components/agent/__tests__/AgentDock.test.tsx --runInBand` passed: 3 suites, 75 tests.
- `npx eslint src/lib/agent/response-parts.ts src/components/agent/AgentResponseParts.tsx src/components/agent/AgentDock.tsx src/components/agent/__tests__/AgentDock.test.tsx src/lib/source/source-answer-engine.ts src/lib/source/nexus-api.ts src/lib/source/__tests__/source-answer-engine.test.ts src/lib/source/__tests__/nexus-api-live-context.test.ts src/components/source/canvas/UniversalCanvasShell.tsx src/components/source/canvas/workspace-tabs/DocumentTab.tsx src/lib/source/agent-generation/prompt-registry.ts scripts/audit/source-ava-crawl.mjs` passed.
- `npm run test:behaviors` was attempted after the focused pass. It failed in existing tenant-onboarding behavior tests because `CLIENT_KEY_TO_DB_SLUGS` was not found by `src/scripts/tenants/add-tenant.ts`; this is outside the Source/aVa files changed in this candidate.

## Rollout Plan

Deploy by pushing the approved release commit to `main`, which triggers the repo-owned Azure Container Apps main deployment workflow for the web runtime. No database migration, queue run, Azure data-plane operation, or client corpus refresh is required.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml` builds and deploys the web image to Azure Container Apps on pushes to `main`.
- Shared runtime mutators: web runtime image/revision only; no database, queue, storage, search index, worker, DNS, or environment-variable mutation is included.
- Approved image digest: to be produced by the ACA main deploy workflow after the release commit is pushed.
- ACA runtime invariant: active `ca-abarva-web-lab-eastus` revision must receive 100% traffic only after the workflow deploys and `/api/health` passes.
- Worker image invariant: no worker image change.
- Feature/env flag update path: none.
- Live signed-in proof required: yes for final user-visible Source canvas confidence; current local Apex/Skyharbor browser crawls deferred on Clerk redirect loops, so production health/deploy proof and any available signed-in Source crawl must be reported separately.

## Rollback Plan

Revert the Source/aVa advisory response PR. Because the legacy `summary` and `nexusSummary.summary` prose fields remain intact, rollback can restore prose-only rendering without data repair. No migration rollback is required.

## Audit Evidence

- Source/aVa crawler output: `reports/source-ava-crawl/smoke-static/source-ava-crawl.md`.
- Source/aVa crawler JSON: `reports/source-ava-crawl/smoke-static/source-ava-crawl.json`.
- Targeted Jest output from the commands listed above.
- ESLint output from the command listed above.

## Known Gaps

- Browser-authenticated Source canvas crawl was attempted for Apex and Skyharbor against the local branch dev server. Both auth runs deferred because local Clerk session refresh entered an infinite redirect loop after server-ticket sign-in. Signed-in Source canvas behavior remains unproven until the local Clerk key/session configuration is corrected or the in-app browser exposes an already-authenticated local session.
- User-facing Sentinel text remains in older Source dashboards, learn pages, and compatibility surfaces outside the active Source event canvas/generation controls. This candidate does not attempt a global rename.
- Broader `npm run test:behaviors` currently fails in tenant-onboarding coverage unrelated to this Source/aVa candidate.
