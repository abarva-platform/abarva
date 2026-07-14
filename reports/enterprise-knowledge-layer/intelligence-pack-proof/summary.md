# Intelligence Progressive Context Pack Dry-Run Proof

Status: PASS
Generated: 2026-07-14T00:00:00.000Z
Source semantic proof: datasets/tenant-inputs/generated/context-template-v3-semantic-depth-fix1-report.json

## Truth Split

- dryRunOnly: true
- runtimeAnswerPathChanged: false
- claudeCalled: false
- productionTenantDataWritten: false
- activeTenantAccessUpdated: false
- candidatePromoted: false
- moduleRuntimeBehaviorChanged: false
- deployRequired: false

## Latency Design Targets

- intentClassificationMs: 500ms
- entityResolutionMs: 1000ms
- fastContextPackMs: 2000ms
- firstClaudeTokenMs: 8000ms
- deepContextEnrichmentMs: 15000ms

## What This Proves

Intelligence can become progressive context assembly instead of chat over retrieved rows. The dry run builds a fast context pack for first response, a deep context pack for evidence enrichment, a streaming trace, a cache plan, and a progressive Claude payload. It does not call Claude or change the runtime answer path.

## Scenario Results

| Scenario | Tenant | Prompt | Audience | Archetype | Catalog | Fast profiles | Edges | Evidence | Gaps | Audit claims | Initial leaked claims |
| --- | --- | --- | --- | --- | --- | ---: | ---: | ---: | ---: | ---: | ---: |
| meridian-agent-assist-readiness | meridian-health | How ready is Meridian for Agent Assist in member service? | CIO | customer_service_ai | meridian-health-agent-assist-member-service | 10 | 22 | 5 | 4 | 2 | 0 |
| meridian-finance-analytics-strategy | meridian-health | How should Meridian improve Finance Analytics and reduce reporting pain? | CDAO | analytics_modernization | meridian-health-finance-analytics | 10 | 25 | 5 | 4 | 2 | 0 |
| harbortrust-fraud-copilot-readiness | harbortrust-bank | Can HarborTrust use AI to help fraud analysts triage alerts? | COO | risk_ai_copilot | harbortrust-bank-fraud-analyst-copilot | 10 | 22 | 5 | 4 | 2 | 0 |
| generic-enterprise-fallback | meridian-health | What should this enterprise focus on next to improve AI value? | EVP | analytics_modernization | meridian-health-finance-analytics | 10 | 25 | 5 | 4 | 2 | 0 |

## Quality Assessment

### meridian-agent-assist-readiness

Hits the mark for design proof: it can start with a compact executive answer and enrich with evidence, caveats, and next evidence without leaking unsupported claims.

### meridian-finance-analytics-strategy

Hits the mark for design proof: it can start with a compact executive answer and enrich with evidence, caveats, and next evidence without leaking unsupported claims.

### harbortrust-fraud-copilot-readiness

Hits the mark for design proof: it can start with a compact executive answer and enrich with evidence, caveats, and next evidence without leaking unsupported claims.

### generic-enterprise-fallback

Hits the mark for design proof: it can start with a compact executive answer and enrich with evidence, caveats, and next evidence without leaking unsupported claims.

## Anti-Hardcoding Gate

- pass: true
- forbidden patterns: none
