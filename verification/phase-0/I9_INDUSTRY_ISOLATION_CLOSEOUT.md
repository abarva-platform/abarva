# I9 Industry Isolation Closeout

Date: 2026-05-29

## Status

Section 2.1 is code-complete for the Codex master backlog: tenant-facing pattern retrieval now routes through a scoped corpus-pattern compatibility index, the known Context Broker follow-up from PR #2410 is closed, and regression coverage verifies the five canonical tenant matrix.

## What Changed

- Added `searchIndustryScopedCorpusPatternIndex(...)` as the tenant-facing compatibility wrapper for pattern-index consumers that still need `CanonicalPatternIndexResult` response shape.
- Moved the Programs Nexus ask route, Sentinel orchestrator, Atlas value grounding, and Context Broker default corpus retriever away from direct `searchCanonicalPatternIndex(...)` runtime imports.
- Expanded the canonical industry vocabulary to include:
  - `healthcare_provider`
  - `healthcare_medtech`
  - `financial_services_banking`
  - `airline`
- Updated normalization so Meridian, Northstar, First Capital, and SkyHarbor resolve to the canonical Phase 0D industry codes.
- Added an ESLint guard blocking direct `searchCanonicalPatternIndex` imports in tenant-facing grounding callsites.
- Fixed `searchCorpus(...)` so Azure AI Search unavailability does not discard valid Postgres `corpus_patterns` results.
- Added `npm run smoke:i9-industry-isolation` for five-tenant live retrieval smoke.

## Five-Tenant Regression

Focused Jest regression:

```text
npx jest src/lib/corpus/retrieval.test.ts \
  src/lib/intelligence/canonical/scoped-corpus-pattern-index.test.ts \
  src/lib/intelligence/ask/retrievers/pattern.test.ts \
  src/lib/knowledge/context-broker/__tests__/broker.test.ts \
  src/__tests__/integration/programs-nexus-ask-route.test.ts \
  src/__tests__/integration/programs/programs-nexus-mutation-guards.test.ts \
  --runInBand
```

Result:

```text
Test Suites: 6 passed, 6 total
Tests:       54 passed, 54 total
```

Coverage:

- `retrievePattern()` I9 matrix: 5 canonical tenants x 5 query classes = 25 checks.
- Scoped corpus-pattern index matrix: all 5 canonical tenants assert the expected `verticalOverlays` are passed into `searchCorpus(...)`.
- Context Broker: allowlist covers Apex, Meridian, Northstar, First Capital, and SkyHarbor.
- Programs Nexus ask route: scoped wrapper receives tenant key, active client, and industry facts.
- Corpus retrieval: Postgres results survive when Azure AI Search is unavailable.

## Live Smoke

Command:

```text
set -a; source /Users/anand/Projects/nexus/.env.local; set +a
ENV_FILE=/Users/anand/Projects/nexus/.env.local \
ABARVA_AZURE_DATABASE_URL= \
DATABASE_URL="$SESSION_POOLER_URL" \
npm run smoke:i9-industry-isolation
```

Result:

```text
PASS: zero leaked pattern industries across five canonical tenants.
```

Observed payload:

```json
{
  "results": [
    { "tenantKey": "apex-retail", "industry": "retail", "status": "no_match", "retrievedCount": 0, "leaked": [] },
    { "tenantKey": "meridian-health", "industry": "healthcare_provider", "status": "no_match", "retrievedCount": 0, "leaked": [] },
    { "tenantKey": "northstar-clinical", "industry": "healthcare_medtech", "status": "no_match", "retrievedCount": 0, "leaked": [] },
    { "tenantKey": "first-capital", "industry": "financial_services_banking", "status": "no_match", "retrievedCount": 0, "leaked": [] },
    { "tenantKey": "skyharbor-air", "industry": "airline", "status": "no_match", "retrievedCount": 0, "leaked": [] }
  ]
}
```

Interpretation:

- I9 leakage check passes: no tenant received patterns outside its allowed industry plus `cross_industry`.
- The smoke also confirms that the reachable database path currently returns no `corpus_patterns` matches for these five queries. That is not an I9 leak, but it is a corpus-population finding for Section 2.2.
- The private Azure Postgres hostname is not resolvable from this local execution environment, so the live smoke used the public session-pooler path already present in `.env.local`.

## Typecheck

`npx tsc --noEmit --pretty false` remains blocked only by pre-existing optional dependency resolution:

- `@azure/identity`
- `@azure/storage-blob`
- `@azure/service-bus`
- `pptxgenjs`
- `@resvg/resvg-js`

No new type errors from this slice were emitted before the optional-package blocker list.

## Gate Result

Section 2.1 can proceed to PR/CI review. Section 2.2 remains required to audit why the reachable `corpus_patterns` path returns `no_match` across all five canonical tenants.
