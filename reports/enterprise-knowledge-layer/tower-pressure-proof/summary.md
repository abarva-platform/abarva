# Tower Knowledge Layer Pressure Test

Generated: 2026-07-15T00:00:00.000Z
Verdict: PASS

## Truth Split

- defaultTowerMigratedToKnowledgeLayer: false
- knowledgeLayerMeasurementContextProven: true
- defaultTowerBehaviorChanged: false
- tenantDataWritten: false
- activeTenantAccessUpdated: false
- candidatePromoted: false
- defaultClaudeBehaviorChanged: false
- productionRolloutChanged: false
- realizedValueClaimsAllowedWithoutMeasuredEvidence: false

## Scenario Readiness

| Scenario | Status | Knowledge Path | Default Path | Profiles | Relationships | Metrics | Evidence | Realized Value Allowed |
| --- | --- | --- | --- | ---: | ---: | ---: | ---: | --- |
| What budget, spend, value, and metric context exists for Finance Analytics modernization? | legacy_behavior | measurement_context_ready | seeded_or_standardized_path | 53 | 52 | 3 | 5 | false |
| What value tracking context exists for Agent Assist in member service? | legacy_behavior | measurement_context_ready | seeded_or_standardized_path | 36 | 35 | 3 | 5 | false |
| What budget and value context exists for a unified clinical and claims lakehouse? | legacy_behavior | generic_context_risk | seeded_or_standardized_path | 53 | 52 | 3 | 5 | false |
| What spend and value context exists for analytics managed services? | legacy_behavior | measurement_context_ready | seeded_or_standardized_path | 53 | 52 | 3 | 5 | false |
| What value tracking context exists for a Fraud Analyst Copilot? | legacy_behavior | measurement_context_ready | seeded_or_standardized_path | 37 | 36 | 3 | 5 | false |
| What spend and value context exists for Core Banking Modernization? | legacy_behavior | generic_context_risk | seeded_or_standardized_path | 37 | 36 | 3 | 5 | false |
| What budget and value context exists for Digital Onboarding? | legacy_behavior | measurement_context_ready | seeded_or_standardized_path | 37 | 36 | 3 | 5 | false |
| What spend and value context exists for Payments analytics? | legacy_behavior | generic_context_risk | seeded_or_standardized_path | 37 | 36 | 3 | 5 | false |

## Quality Assessment

Tower can use the Knowledge Layer audit path as measurement context where the semantic cluster is specific enough. It must not claim realized savings, ROI, spend reduction, or value captured unless measured value evidence exists and Tower calculation rules validate it.

The default Tower page/API path is not changed by this PR. The pressure proof distinguishes existing Tower/CIO paths from the Knowledge Layer measurement-context path.

## Recommended Remediation PRs

- TOWER-KNOWLEDGE-MIGRATION-PR16: add a default-off Tower preview path that reads Knowledge Layer measurement context.
- TOWER-VALUE-CLAIM-GUARD-PR17: block realized-value language unless measured evidence and calculation basis are present.
- TOWER-MEASUREMENT-PACKET-PR18: render budget, spend, metric definitions, evidence, gaps, and unsupported claims as a Tower measurement packet.
