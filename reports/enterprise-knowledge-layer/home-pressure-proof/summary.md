# Home Knowledge Layer Pressure Test

Generated: 2026-07-15T00:00:00.000Z
Verdict: PASS

## Truth Split

- defaultHomeMigratedToKnowledgeLayer: false
- hiddenKnowledgePreviewProven: true
- defaultHomeBehaviorChanged: false
- tenantDataWritten: false
- activeTenantAccessUpdated: false
- candidatePromoted: false
- defaultClaudeBehaviorChanged: false
- defaultNavigationExposureChanged: false

## Dimension Readiness

| Dimension | Status | Summary | Data | Relationships | Gaps | Evidence | aVa |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Enterprise Profile | legacy_behavior | generic_copy | legacy_behavior | missing_relationships | partially_ready | partially_ready | partially_ready |
| Business Functions | legacy_behavior | generic_copy | legacy_behavior | missing_relationships | partially_ready | partially_ready | partially_ready |
| Org Ownership | legacy_behavior | generic_copy | legacy_behavior | missing_relationships | partially_ready | partially_ready | partially_ready |
| Workforce Roles | legacy_behavior | generic_copy | legacy_behavior | missing_relationships | partially_ready | partially_ready | partially_ready |
| Applications & Systems | legacy_behavior | generic_copy | legacy_behavior | missing_relationships | partially_ready | partially_ready | partially_ready |
| Data Assets & Integrations | legacy_behavior | generic_copy | legacy_behavior | missing_relationships | partially_ready | partially_ready | partially_ready |
| Infrastructure & Platforms | legacy_behavior | generic_copy | legacy_behavior | missing_relationships | partially_ready | partially_ready | partially_ready |
| Vendors & Contracts | legacy_behavior | generic_copy | legacy_behavior | missing_relationships | partially_ready | partially_ready | partially_ready |
| IT Budget, Spend & Value | legacy_behavior | generic_copy | legacy_behavior | missing_relationships | partially_ready | partially_ready | partially_ready |
| Programs & Initiatives | legacy_behavior | generic_copy | legacy_behavior | missing_relationships | partially_ready | partially_ready | partially_ready |
| AI & Automation Use Cases | legacy_behavior | generic_copy | legacy_behavior | missing_relationships | partially_ready | partially_ready | partially_ready |
| Risks & Controls | legacy_behavior | generic_copy | legacy_behavior | missing_relationships | partially_ready | partially_ready | partially_ready |
| Relationships | legacy_behavior | generic_copy | legacy_behavior | missing_relationships | partially_ready | partially_ready | partially_ready |
| Evidence Sources | legacy_behavior | generic_copy | legacy_behavior | missing_relationships | partially_ready | partially_ready | partially_ready |
| Metrics & Outcomes | legacy_behavior | generic_copy | legacy_behavior | missing_relationships | partially_ready | partially_ready | partially_ready |
| Managed Services Scope | legacy_behavior | generic_copy | legacy_behavior | missing_relationships | partially_ready | partially_ready | partially_ready |
| Operational Process Evidence | legacy_behavior | generic_copy | legacy_behavior | missing_relationships | partially_ready | partially_ready | partially_ready |

## Scenario Pressure Tests

| Scenario | Profiles | Relationships | Evidence | Gaps | Boundary clean | Unsupported claims blocked |
| --- | ---: | ---: | ---: | ---: | --- | --- |
| Meridian - Agent Assist / Member Service | 36 | 35 | 5 | 4 | true | true |
| Meridian - Finance Analytics | 53 | 52 | 5 | 4 | true | true |
| HarborTrust - Fraud Analyst Copilot | 35 | 34 | 5 | 4 | true | true |
| Generic - Vendor Onboarding Modernization | 32 | 31 | 4 | 4 | true | true |

## Recommended Remediation PRs

- HOME-KNOWLEDGE-MIGRATION-PR13: migrate Home landing and dimension summaries to Knowledge Layer.
- HOME-DIMENSION-TABS-PR14: migrate Data, Relationships, Gaps, and Evidence tabs to entity profiles, graph slices, and evidence refs.
- HOME-AVA-KNOWLEDGE-PR15: make Home/aVa answers consume HomeKnowledgePack behind flag before default enablement.

## Failures

- None
