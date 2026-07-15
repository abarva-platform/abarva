# 2026-07-15-intelligence-ava-stream-polish — Intelligence aVa Stream and Language Polish

## Release ID

`2026-07-15-intelligence-ava-stream-polish`

## Status

`candidate`

## Plain-English Summary

Intelligence aVa now treats the whole browser-visible answer path as client-facing, not just the final answer packet. The stream suppresses raw advisory trace objects, replaces internal data-state language such as "not loaded" with business-safe evidence language, preserves structured table/chart artifacts, and keeps chat prose visible when markdown tables are converted into governed visual blocks.

## Layer Impact

- Global control lane: shared Intelligence answer streaming, aVa answer packet validation, and AgentDock rendering behavior.
- Product experience layer: visible chat events, rendered answer body, structured table/chart rendering, and export audit harness.
- No data-plane change: retrieval behavior, data-layer promotion, tenant access, and source ingestion are unchanged.

## Client Applicability

- All clients: yes, for Intelligence/aVa chat answer rendering and public-language scrub behavior.
- Specific clients: Meridian proof question is the primary validation scenario.
- Internal only: audit scripts and generated reports are operator evidence.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- Stream route now suppresses raw `intelligence-dossier` and `advisory-packet` browser events and emits a sanitized `context-summary` only when trace is explicitly requested.
- Public aVa scrubber rewrites "not loaded" / `not_loaded` / loaded-source phrasing to evidence-safe business language.
- CXO quality gate now emits category-level scorecards for executive tone, evidence grounding, caveat quality, decision usefulness, internal-language cleanliness, visual usefulness, module handoff clarity, and concision.
- AgentDock no longer blanks the whole message body when a markdown table is replaced by structured artifacts; it strips only duplicate table rows and keeps the narrative.
- Shared AgentDock aVa chrome now uses the dark two-tone wordmark on light surfaces so the leading `a` stays visible in expanded and collapsed assistant states.
- Added deterministic audit harness and npm commands for stream polish, visual contract, and CXO narrative checks.

## QA / Validation

- Pass: `npx jest src/lib/ava-answer/__tests__/public-answer-scrub.test.ts src/lib/ava-answer/__tests__/cxo-quality-gate.test.ts src/app/api/intelligence/ask/__tests__/route.telemetry.test.ts --runInBand`
- Pass: `npx jest src/components/agent/__tests__/AgentDock.test.tsx --runInBand -t "suppresses raw markdown table fragments"`
- Pass: `npx jest src/components/strategic-moves/__tests__/StrategicMoveOriginateClient.test.tsx --runInBand -t "requires all seven Move brief sections before promotion"`
- Pass: `npx jest src/components/agent-answer/__tests__/AvaAskMark.assets.test.ts src/components/agent-answer/__tests__/AvaAsk.test.tsx src/components/ava-chat/__tests__/AvaChatShell.test.tsx src/components/home/know/__tests__/HomeKnowAsk.test.tsx --runInBand`
- Pass: `npm run audit:intelligence-ava-stream-polish`
- Pass: `npm run audit:intelligence-ava-visual-contract`
- Pass: `npm run audit:intelligence-ava-cxo-narrative`
- Pass: `npm run release:check`
- Pass: `npm run audit:enterprise-naming`
- Pass: `npm run audit:meridian-data-state-reconciliation`
- Pass: `NODE_OPTIONS=--max-old-space-size=8192 npx tsc --noEmit --pretty false`
- Pass: `git diff --check`
- Not run yet: full signed-in pixel-level production UI proof.

## Rollout Plan

Merge to main through PR. The change becomes active after the repo-owned Azure Container Apps main deploy workflow builds and deploys the new main image to `app.abarva.ai`.

## Deployment Authority

- Repo-owned deploy workflow: required for production runtime.
- Shared runtime mutators: none in this PR.
- Approved image digest: pending deploy.
- ACA runtime invariant: pending deploy.
- Worker image invariant: not affected.
- Feature/env flag update path: none.
- Live signed-in proof required: yes, Meridian Intelligence UI proof before marking live-proven.

## Rollback Plan

Revert the PR or roll back the ACA web revision to the prior digest. No migration rollback or data repair is required.

## Audit Evidence

- Local report bundle: `reports/intelligence-ava-stream-polish/`
- PR URL: https://github.com/abarva-platform/abarva/pull/4844
- Production proof: pending signed-in browser UI proof

## Known Gaps

- This release does not change retrieval behavior, data-layer promotion, Home, Moves, Source, Tower, or Tower outcome claims.
- Signed-in pixel-level proof must still verify the actual Intelligence chat bubble, table artifact, chart artifact, HTML export, and PDF export after deployment.
