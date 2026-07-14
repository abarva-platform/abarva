# Enterprise Knowledge Cache Proof

- Codename: KNOWLEDGE-LAYER-RUNTIME-FOUNDATION-PR4
- Generated at: 2026-07-14T00:00:00.000Z
- Verdict: PASS
- Source version: context-template-v3-semantic-depth-fix1
- Context version: enterprise-knowledge-cache-pr4

## Truth split
- cacheOnly: true
- noDefaultModuleBehaviorChange: true
- noHomeUiChange: true
- noMovesGenerationChange: true
- noIntelligenceChatPathChange: true
- noClaudeCall: true
- noTenantDataWrite: true
- noActiveTenantPromotion: true
- noCandidatePromotion: true
- noAcaDeployRequired: true

## Proof counts
- scenarios: 4
- cacheBuilds: 5
- entityProfileCacheRows: 168
- relationshipSliceCaches: 5
- fastContextPackCaches: 5
- deepContextPackCaches: 5
- evidenceRefs: 25
- relationshipCandidates: 163

## Timing
- Max fast cache build: 0.1ms
- Max deep cache build: 0.06ms
- Max total build: 1.59ms
- Average total build: 0.67ms

## Scenarios
- meridian-finance: Home fast cache plus Tower deep cache for finance analytics modernization. (meridian-finance-cache.json)
- meridian-agent-assist: Moves P2 fast and deep cache for member-service agent assist. (meridian-agent-assist-cache.json)
- harbortrust-fraud: Intelligence fast and deep cache for fraud analyst copilot readiness. (harbortrust-fraud-cache.json)
- generic-fallback: Generic fallback cache for a workflow-modernization request without a hardcoded archetype. (generic-fallback-cache.json)

## Validation
- Cache validation: PASS
- Runtime anti-hardcoding scan: PASS
- No failures.
