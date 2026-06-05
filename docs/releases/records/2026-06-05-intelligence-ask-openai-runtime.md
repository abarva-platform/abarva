# 2026-06-05-intelligence-ask-openai-runtime — Sentinel Ask OpenAI Runtime

## Release ID

`2026-06-05-intelligence-ask-openai-runtime`

## Status

`candidate`

## Plain-English Summary

Sentinel/Nexus Intelligence Ask now uses the governed OpenAI egress client for its live model calls. This makes the production Ask surface honor `OPENAI_API_KEY` for intent classification, answer synthesis, and follow-up generation instead of depending on the legacy Anthropic runtime.

## Layer Impact

- `global-control-lane`: shared Intelligence Ask runtime behavior changes for all clients using the Sentinel Ask surface.
- `client-data-lane`: no client data shape changes; tenant prompts still pass through the same egress preflight and audit policy before any model call.

## Client Applicability

- All clients: Intelligence Ask model calls use OpenAI when the route is configured.
- Specific clients: Meridian/PHS crawl validation is the immediate proving lane.
- Internal only: None.
- Public/demo only: None.
- Feature flag: None.

## Changes Included

- Added `src/lib/intelligence/ask/openai-runtime.ts`.
- Rewired `classifier.ts`, `followups.ts`, and `synthesizer.ts` to use OpenAI Responses through `preflightOpenAIDirectClient`.
- Added a contract test preventing the runtime Ask path from drifting back to `ANTHROPIC_API_KEY` / Claude model IDs.

## QA / Validation

- Pass: `npx jest src/lib/intelligence/ask/__tests__/openai-runtime-contract.test.ts --runInBand`
- Pass: `npx eslint src/lib/intelligence/ask/classifier.ts src/lib/intelligence/ask/followups.ts src/lib/intelligence/ask/synthesizer.ts src/lib/intelligence/ask/openai-runtime.ts src/lib/intelligence/ask/__tests__/openai-runtime-contract.test.ts`
- Pass: `npx tsc --noEmit --pretty false`
- Blocked pending deploy/env: Meridian/PHS post-deploy crawl after merge and production `OPENAI_API_KEY` confirmation.

## Rollout Plan

Merge to main and deploy through the normal Vercel production path. Production must have `OPENAI_API_KEY` configured; local `.env` values do not affect Vercel.

## Rollback Plan

Revert the PR if the OpenAI runtime path fails in production. No migration or data rollback is required.

## Audit Evidence

- PR URL: pending.
- Post-deploy Meridian/PHS crawl: pending after production deploy.
- Prior failed evidence: Meridian/PHS 100-turn crawl captured 100 synthesis errors while the runtime was still on the legacy Anthropic path.

## Known Gaps

Production env confirmation is required after merge. This release does not commit or expose any API key.
