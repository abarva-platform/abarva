# Moves Context Pack Dry-Run Proof

Status: PASS
Generated: 2026-07-14T00:00:00.000Z
Source semantic proof: datasets/tenant-inputs/generated/context-template-v3-semantic-depth-fix1-report.json

## Truth Split

- dryRunOnly: true
- defaultMovesBehaviorChanged: false
- productionGenerationBehaviorChanged: false
- claudeCalled: false
- productionTenantDataWritten: false
- activeTenantAccessUpdated: false
- candidatePromoted: false
- moduleRuntimeBehaviorChanged: false
- deployRequired: false

## What This Proves

Moves can ask the Enterprise Knowledge Layer for a governed, phase-scoped context pack before Claude or production generation is involved. The output includes resolved profiles, relationship candidates, evidence references, confidence, gaps, unsupported claims, and phase-specific next evidence. This PR does not attach Move evidence or change default Moves behavior.

## Scenario Results

| Scenario | Tenant | Prompt | Phase | Archetype | Resolved catalog | Fallback | Profiles | Edges | Evidence | Gaps | Audit claims | Claude leaked claims |
| --- | --- | --- | --- | --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| meridian-agent-assist-p2 | meridian-health | We want to explore Agent Assist for member service. | P2 Diagnose & Evidence Pressure-Test | customer_service_ai | meridian-health-agent-assist-member-service | no | 23 | 22 | 5 | 4 | 2 | 0 |
| meridian-finance-analytics-p1 | meridian-health | How should we improve Finance Analytics and reduce reporting pain? | P1 Charter & Baseline | analytics_modernization | meridian-health-finance-analytics | yes | 26 | 25 | 5 | 4 | 2 | 0 |
| harbortrust-fraud-copilot-p2 | harbortrust-bank | Can we use AI to help fraud analysts triage alerts? | P2 Diagnose & Evidence Pressure-Test | risk_ai_copilot | harbortrust-bank-fraud-analyst-copilot | no | 23 | 22 | 5 | 4 | 2 | 0 |
| generic-vendor-onboarding-fallback | meridian-health | How should we modernize the vendor onboarding workflow? | P1 Charter & Baseline | analytics_modernization | meridian-health-finance-analytics | yes | 26 | 25 | 5 | 4 | 2 | 0 |

## Quality Assessment

### Meridian Agent Assist P2

Hits the mark for a dry-run Moves story: it gives usable phase context while clearly naming what cannot be claimed yet.

### Meridian Finance Analytics P1

Hits the mark for a dry-run Moves story: it gives usable phase context while clearly naming what cannot be claimed yet.

### HarborTrust Fraud Copilot P2

Hits the mark for a dry-run Moves story: it gives usable phase context while clearly naming what cannot be claimed yet.

### Generic Vendor Onboarding Fallback

Hits the mark for a dry-run Moves story: it gives usable phase context while clearly naming what cannot be claimed yet.

## Anti-Hardcoding Gate

- pass: true
- forbidden patterns: none
