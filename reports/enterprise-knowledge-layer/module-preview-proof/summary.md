# Knowledge Module Preview Proof

- Codename: KNOWLEDGE-LAYER-MODULE-PREVIEW-PR5
- Generated at: 2026-07-14T00:00:00.000Z
- Verdict: PASS

## Flags
- moves: `ENABLE_KNOWLEDGE_LAYER_MOVES_PREVIEW` default false
- intelligence: `ENABLE_KNOWLEDGE_LAYER_INTELLIGENCE_PREVIEW` default false

## Truth split
- featureFlaggedOnly: true
- defaultFlagsOff: true
- noDefaultModuleBehaviorChange: true
- noMovesGenerationChange: true
- noIntelligenceChatPathChange: true
- noClaudeCall: true
- noTenantDataWrite: true
- noActiveTenantPromotion: true
- noCandidatePromotion: true
- noAcaDeployRequired: true

## Proof counts
- scenarios: 5
- enabledPreviews: 2
- disabledPreviews: 3
- cacheBackedPreviews: 2
- entityProfileCacheRows: 60
- relationshipCandidates: 58

## Scenarios
- moves-disabled-default: moves, expected disabled, received disabled, cacheBacked=false (moves-preview-disabled-default.json)
- intelligence-disabled-default: intelligence, expected disabled, received disabled, cacheBacked=false (intelligence-preview-disabled-default.json)
- moves-enabled-explicit-flag: moves, expected enabled, received enabled, cacheBacked=true (moves-preview-enabled.json)
- intelligence-enabled-explicit-flag: intelligence, expected enabled, received enabled, cacheBacked=true (intelligence-preview-enabled.json)
- flag-isolation-intelligence-remains-disabled: intelligence, expected disabled, received disabled, cacheBacked=false (flag-isolation.json)

## Validation
- No failures.
