# 2026-06-23-home-know-reality-crawl-quality — Home KNOW Reality Crawl Quality

## Release ID

`2026-06-23-home-know-reality-crawl-quality`

## Status

`candidate`

## Plain-English Summary

Home-mode ask requests now route lookup, table, chart, graph, and gap questions through the backend Home KNOW engine before the strategy engine can run. The backend emits deterministic tables, charts, graphs, citations, and gaps from tenant read models; Ava prose remains a short explanatory layer only. The reality crawl judge now fails missing visual artifacts, DECIDE-template leaks, raw ID prose leaks, and "the cited record" prose leaks.

## Layer Impact

- `global-control-lane`: updates the shared `/api/intelligence/ask` route behavior when the caller is the Home surface and asks a KNOW-mode question.
- `client-data-lane`: reads existing Home KNOW read models and relationship rows for all tenant-specific table/chart/graph artifacts; no schema or data migration is included.

## Client Applicability

- All clients: yes, applies to all tenants using the shared Home KNOW and Intelligence ask route.
- Specific clients: none.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none; this is mode isolation for Home-surface requests only.

## Changes Included

- Extends the shared Home KNOW contract with typed chart metadata and graph artifacts.
- Adds deterministic graph assembly from `enterprise_context_relationships` plus display labels from `enterprise_context_records`.
- Adds deterministic chart assembly from Home read models and explicit caveats for missing fields.
- Adds a Home KNOW to `AgentAnswer` adapter and routes Home KNOW requests through it in `/api/intelligence/ask`.
- Strengthens `scripts/qa/reality-crawl.mjs` to fail missing chart/graph artifacts, DECIDE-template leakage, raw IDs, and unresolved citation labels.

## QA / Validation

- `npx eslint src/lib/home/know/home-know-contract.ts src/lib/home/know/home-know-engine.ts src/lib/home/know/home-know-agent-answer.ts src/app/api/intelligence/ask/route.ts src/app/api/home/know/ask/route.ts scripts/qa/reality-crawl.mjs` passed.
- `npm test -- --runTestsByPath src/lib/home/know/__tests__/home-know-engine.test.ts --runInBand` passed, with pre-existing duplicate manual mock warnings.
- `NODE_OPTIONS=--max-old-space-size=8192 npx tsc --noEmit --pretty false` reached the repo's known ambient declaration gaps (`js-yaml`, `@azure-rest/ai-document-intelligence`, `@axe-core/playwright`) and did not surface touched-file diagnostics.

## Rollout Plan

Merge to `main`, build the exact git SHA into an Azure Container Apps image, deploy to `ca-abarva-web-lab-eastus`, shift 100% traffic to the healthy revision, then rerun the signed-in reality crawl against `https://app.abarva.ai`.

## Deployment Authority

- Repo-owned deploy workflow: required.
- Shared runtime mutators: Azure Container Apps web runtime only.
- Approved image digest: to be recorded after deploy.
- ACA runtime invariant: template image, active revision image, and 100% traffic revision must match.
- Worker image invariant: no worker image change.
- Feature/env flag update path: none.
- Live signed-in proof required: yes, full `scripts/qa/reality-crawl.mjs` plus report refresh.

## Rollback Plan

Rollback the ACA web app to the previous approved digest. No data migration or schema rollback is required.

## Audit Evidence

- PR URL: pending.
- CI run: pending.
- Deploy digest: pending.
- Reality crawl report: pending after deploy.

## Known Gaps

This PR improves backend Home KNOW mode isolation and typed artifacts. It does not wire new frontend surfaces, does not change tenant data, and does not attempt the 100-question stress test. Full acceptance still requires deployed reality crawl scores to meet the target thresholds.
