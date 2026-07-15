# Intelligence Knowledge Layer Pressure Test

Generated: 2026-07-15T00:00:00.000Z
Verdict: PASS

## Truth Split

- defaultIntelligenceMigratedToKnowledgeLayer: false
- flaggedKnowledgeRuntimeProven: true
- defaultIntelligenceBehaviorChanged: false
- tenantDataWritten: false
- activeTenantAccessUpdated: false
- candidatePromoted: false
- defaultClaudeBehaviorChanged: false
- productionRolloutChanged: false

## Question Readiness

| Question | Status | Knowledge Path | Default Path | Profiles | Relationships | Evidence | Gaps |
| --- | --- | --- | --- | ---: | ---: | ---: | ---: |
| How ready are we for Agent Assist in member service? | legacy_behavior | ready | legacy_behavior | 36 | 35 | 5 | 4 |
| What is the Finance Analytics modernization opportunity? | legacy_behavior | ready | legacy_behavior | 53 | 52 | 5 | 4 |
| What systems, data, and controls would block Agent Assist? | legacy_behavior | ready | legacy_behavior | 36 | 35 | 5 | 4 |
| What evidence is missing before we can make an executive decision? | legacy_behavior | ready | legacy_behavior | 53 | 52 | 5 | 4 |
| What are the highest-value AI opportunities based on current enterprise context? | legacy_behavior | generic_answer_risk | legacy_behavior | 53 | 52 | 5 | 4 |
| Can AI help fraud analysts triage alerts safely? | legacy_behavior | ready | legacy_behavior | 36 | 35 | 5 | 4 |
| What are the key risks and controls for a fraud analyst copilot? | legacy_behavior | ready | legacy_behavior | 36 | 35 | 5 | 4 |
| What data and system context do we have for Customer 360? | legacy_behavior | ready | legacy_behavior | 36 | 35 | 5 | 4 |
| What is missing before digital onboarding modernization can be scoped? | legacy_behavior | ready | legacy_behavior | 36 | 35 | 5 | 4 |
| What context do we have for vendor onboarding modernization? | legacy_behavior | ready | legacy_behavior | 33 | 32 | 4 | 4 |
| Where should we focus if we want to reduce manual work in back office operations? | legacy_behavior | ready | legacy_behavior | 33 | 32 | 4 | 4 |

## Latency Summary

```json
{
  "generatedAt": "2026-07-15T00:00:00.000Z",
  "targets": {
    "intentClassificationMs": 500,
    "fastContextPackMs": 2000,
    "initialPayloadMs": 3000,
    "deepContextPackMs": 15000
  },
  "maxIntentClassificationMs": 0.12,
  "maxFastContextPackMs": 0.07,
  "maxInitialPayloadMs": 0.07,
  "maxDeepContextPackMs": 0.08,
  "maxTotalAssemblyMs": 1.72,
  "targetFailures": [],
  "rows": [
    {
      "id": "meridian-agent-assist-readiness",
      "question": "How ready are we for Agent Assist in member service?",
      "timing": {
        "intentClassificationMs": 0.12,
        "fastContextPackMs": 0.07,
        "initialPayloadMs": 0.07,
        "deepContextPackMs": 0.08,
        "totalAssemblyMs": 1.72
      },
      "latencyMisses": []
    },
    {
      "id": "meridian-finance-modernization",
      "question": "What is the Finance Analytics modernization opportunity?",
      "timing": {
        "intentClassificationMs": 0.04,
        "fastContextPackMs": 0.02,
        "initialPayloadMs": 0.02,
        "deepContextPackMs": 0.03,
        "totalAssemblyMs": 0.51
      },
      "latencyMisses": []
    },
    {
      "id": "meridian-agent-assist-blockers",
      "question": "What systems, data, and controls would block Agent Assist?",
      "timing": {
        "intentClassificationMs": 0.03,
        "fastContextPackMs": 0.01,
        "initialPayloadMs": 0.01,
        "deepContextPackMs": 0.01,
        "totalAssemblyMs": 0.38
      },
      "latencyMisses": []
    },
    {
      "id": "meridian-executive-decision-evidence",
      "question": "What evidence is missing before we can make an executive decision?",
      "timing": {
        "intentClassificationMs": 0.03,
        "fastContextPackMs": 0.02,
        "initialPayloadMs": 0.02,
        "deepContextPackMs": 0.01,
        "totalAssemblyMs": 0.49
      },
      "latencyMisses": []
    },
    {
      "id": "meridian-highest-value-ai",
      "question": "What are the highest-value AI opportunities based on current enterprise context?",
      "timing": {
        "intentClassificationMs": 0.03,
        "fastContextPackMs": 0.01,
        "initialPayloadMs": 0.02,
        "deepContextPackMs": 0.01,
        "totalAssemblyMs": 0.42
      },
      "latencyMisses": []
    },
    {
      "id": "harbortrust-fraud-triage",
      "question": "Can AI help fraud analysts triage alerts safely?",
      "timing": {
        "intentClassificationMs": 0.03,
        "fastContextPackMs": 0.01,
        "initialPayloadMs": 0.01,
        "deepContextPackMs": 0.01,
        "totalAssemblyMs": 0.3
      },
      "latencyMisses": []
    },
    {
      "id": "harbortrust-fraud-risks-controls",
      "question": "What are the key risks and controls for a fraud analyst copilot?",
      "timing": {
        "intentClassificationMs": 0.03,
        "fastContextPackMs": 0.01,
        "initialPayloadMs": 0.01,
        "deepContextPackMs": 0.01,
        "totalAssemblyMs": 0.38
      },
      "latencyMisses": []
    },
    {
      "id": "harbortrust-customer-360",
      "question": "What data and system context do we have for Customer 360?",
      "timing": {
        "intentClassificationMs": 0.03,
        "fastContextPackMs": 0.01,
        "initialPayloadMs": 0.01,
        "deepContextPackMs": 0.01,
        "totalAssemblyMs": 0.33
      },
      "latencyMisses": []
    },
    {
      "id": "harbortrust-digital-onboarding",
      "question": "What is missing before digital onboarding modernization can be scoped?",
      "timing": {
        "intentClassificationMs": 0.05,
        "fastContextPackMs": 0.02,
        "initialPayloadMs": 0.01,
        "deepContextPackMs": 0.02,
        "totalAssemblyMs": 0.37
      },
      "latencyMisses": []
    },
    {
      "id": "generic-vendor-onboarding",
      "question": "What context do we have for vendor onboarding modernization?",
      "timing": {
        "intentClassificationMs": 0.04,
        "fastContextPackMs": 0.01,
        "initialPayloadMs": 0.01,
        "deepContextPackMs": 0.01,
        "totalAssemblyMs": 0.3
      },
      "latencyMisses": []
    },
    {
      "id": "generic-back-office-manual-work",
      "question": "Where should we focus if we want to reduce manual work in back office operations?",
      "timing": {
        "intentClassificationMs": 0.03,
        "fastContextPackMs": 0.01,
        "initialPayloadMs": 0.01,
        "deepContextPackMs": 0.01,
        "totalAssemblyMs": 0.25
      },
      "latencyMisses": []
    }
  ]
}
```

## Recommended Remediation PRs

- INTELLIGENCE-KNOWLEDGE-MIGRATION-PR16: wire the Intelligence page/API to the Knowledge runtime behind the existing default-off flag.
- INTELLIGENCE-ANSWER-QUALITY-PR17: render evidence, gaps, confidence, excluded context, and next evidence in the Intelligence answer packet.
- INTELLIGENCE-PROGRESSIVE-CLAUDE-PR18: enable progressive Claude only after signed-in proof shows the governed payload is used end to end.

## Failures

- None
