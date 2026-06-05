# PHS Population Health Command Center — Business Case Pattern Setter

Date: 2026-06-05
Status: Value-case contract

## Business Case Thesis

The value case is a baseline-and-forecast decision artifact. It must never claim
realized savings unless a separate synthetic future-state measurement artifact
is loaded and labeled. For the first demo, the value case should help executives
decide whether to fund architecture and mobilization, not declare success.

## Value Spine

Use an integrated payer-provider value spine:

1. MLR / claims trend pressure and avoidable utilization
2. Stars / quality performance and care-gap closure
3. chronic disease management and intervention productivity
4. payment integrity and documentation/coding quality
5. data platform cost, duplicate report retirement, and operational throughput

The model must cite approved evidence for each value driver and show what is
public evidence versus synthetic demo evidence.

## Required Inputs

| Input | Source |
|---|---|
| Public economic and quality context | PHS public evidence register |
| Use-case portfolio | approved Strategy artifact |
| Workload and data product inventory | Setup/Admin loader records |
| Architecture option | approved Architecture artifact |
| Rate cards | loaded rate-card template |
| Effort assumptions | estimation kernel and modernization sizing logic |
| Gate blockers | phase gate criteria |
| Approval owners | synthetic personas and approval records |

## Output Contract

| Section | Required content |
|---|---|
| Decision | proceed, narrow, pause, or request evidence |
| Investment | platform, data engineering, governance, AI/ML, change, SI/partner if in scope |
| Benefits | hard savings, quality revenue, avoided cost, productivity, risk reduction |
| Ranges | low/base/high or P50/P80/P95 with assumptions |
| Confidence | per-line evidence confidence and missing evidence |
| Risk | clinical, compliance, adoption, data quality, cost, delivery |
| Approval | CFO, CDAO, clinical quality, plan quality, architecture review board |

## Forbidden Claims

- realized savings
- exact MLR point value unless loaded as an approved assumption
- exact Stars uplift unless loaded as an approved assumption
- precise ROI from public facts alone
- private PHS operational detail
- vendor implementation performance without loaded bid/SOW evidence

## Next Move Rule

The business case must end with one of:

- approve Phase 4 mobilization planning
- narrow the use-case scope
- request missing evidence
- defer Source until delivery model is approved
- create Source event only if partner-led delivery is explicitly approved
