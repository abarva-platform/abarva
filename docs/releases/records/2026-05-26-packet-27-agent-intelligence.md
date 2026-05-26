# Packet 27 Agent Intelligence Fixes

Date: 2026-05-26
Branch: codex/p27-agent-intelligence

## Summary

Packet 27 hardens Northstar Sentinel against the post-demo dry-run gaps:

- Adds 150 Northstar named-entity fact chunks covering executives, FY26 IT spend, critical applications, vendor renewals, active initiatives, board context, regulatory exposure, strategy, supplier risk, workforce context, and the context-layer ingestion story.
- Makes the normal substrate loader ingest the base corpus, demo-critical overlay, and named-entity overlay together so `--only-chunks` no longer deletes the demo overlay.
- Adds explicit structured-fact retrieval for top applications, retiring applications, top vendors, renewal windows, active initiatives, initiatives by stage, and kill candidates.
- Injects a FACT AVAILABILITY block into Sentinel synthesis so unavailable named-entity classes are handled with an explicit no-fabrication rule.
- Adds a `demo-question-readiness` audit script that classifies Northstar demo questions as GROUNDED / PATTERN / CONFESSED / HALLUCINATED and fails if hallucinations are detected or fewer than seven questions are grounded.

## Live Data Load

Northstar live substrate load completed:

- `enterprise_context_chunks`: 878 total
- `NST-DEMO-FACT-%`: 8
- `NST-FACT-%`: 150
- embedded: 878
- failed embeddings: 0

## Verification

Commands run:

- `TENANT_KEY=northstar npx tsx scripts/seed/load-tenant-substrate.ts --only-chunks --dry-run`
- `TENANT_KEY=northstar npx tsx scripts/seed/load-tenant-substrate.ts --only-chunks --concurrency=8`
- `npm test -- --runTestsByPath src/lib/knowledge/__tests__/tenant-enterprise-context.test.ts src/lib/intelligence/ask/__tests__/no-fabrication.test.ts src/lib/intelligence-v3/__tests__/sentinel-intel-context.test.ts --runInBand`
- `npx eslint src/lib/knowledge/tenant-enterprise-context.ts src/lib/knowledge/__tests__/tenant-enterprise-context.test.ts src/lib/intelligence/ask/index.ts src/lib/intelligence/ask/synthesizer.ts src/lib/intelligence/ask/tenant-fact-fingerprint.ts src/lib/intelligence/ask/__tests__/no-fabrication.test.ts scripts/seed/load-tenant-substrate.ts scripts/smoke/northstar-context-layer-live-data.spec.ts scripts/audit/demo-question-readiness.mjs`
- `npm run smoke:sentinel-tenant-pin`
- `npm run smoke:northstar-context-ingestion`
- `npm run smoke:northstar-context-layer-live-data`
- `node scripts/audit/demo-question-readiness.mjs --tenant northstar`

Demo-readiness result:

- GROUNDED: 10
- PATTERN: 0
- CONFESSED: 0
- HALLUCINATED: 0

Known local validation caveat:

- Full local `npx tsc --noEmit --pretty false` remains blocked by pre-existing optional dependency declarations for `@azure/*`, `pptxgenjs`, and `@resvg/resvg-js`. CI typecheck is expected to run in the provisioned environment.
