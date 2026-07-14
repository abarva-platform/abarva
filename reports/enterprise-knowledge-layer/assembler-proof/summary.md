# Context Pack Assembler Dry-Run Proof

Status: PASS
Generated: 2026-07-14T00:00:00.000Z
Source semantic proof: datasets/tenant-inputs/generated/context-template-v3-semantic-depth-fix1-report.json

## Truth Split

- dryRunOnly: true
- runtimeBehaviorChanged: false
- productionTenantDataWritten: false
- activeTenantAccessUpdated: false
- candidatePromoted: false
- deployRequired: false

## Anti-Hardcoding Gate

- pass: true
- forbidden patterns: none

## Dry-Run Requests

| Output | Tenant | Module | Resolved catalog | Archetype | Profiles | Edges | Evidence | Audit claims | Claude leaked claims |
| --- | --- | --- | --- | --- | ---: | ---: | ---: | ---: | ---: |
| home-meridian-finance-analytics | meridian-health | home | meridian-health-finance-analytics | analytics_modernization | 36 | 35 | 5 | 2 | 0 |
| moves-meridian-agent-assist-p2 | meridian-health | moves | meridian-health-agent-assist-member-service | customer_service_ai | 30 | 29 | 5 | 2 | 0 |
| intelligence-harbortrust-fraud-copilot | harbortrust-bank | intelligence | harbortrust-bank-fraud-analyst-copilot | risk_ai_copilot | 30 | 29 | 5 | 2 | 0 |
| tower-meridian-finance-analytics | meridian-health | tower | meridian-health-finance-analytics | analytics_modernization | 36 | 35 | 5 | 3 | 0 |
| source-meridian-analytics-vendor-context | meridian-health | source | meridian-health-finance-analytics | analytics_modernization | 36 | 35 | 5 | 3 | 0 |

## Quality Assessment

The assembler interprets the module request, classifies it to a reusable archetype, resolves the best tenant context cluster, builds entity profiles, creates relationship candidates, records gaps and unsupported claims, and emits a Claude-ready payload that excludes unsupported claims as facts.

This is a dry-run proof only. It does not call Claude, mutate tenant data, promote candidates, or change module runtime behavior.
