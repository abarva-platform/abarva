# Meridian Tower Synthetic Source Data - Layer 1 Signoff

Package: `tower-layer1-v2026-08-business-case`
Tenant key: `meridian-health`
Status: synthetic review package only; not loaded to runtime
As of: 2026-08-24

## Layer 1 Purpose

Layer 1 represents what Meridian would provide or maintain as client-owned source inputs. It is organized by data owner and business workflow, not by Tower screens or internal canonical tables.

The source layer answers five simple executive questions:

1. What is the overall IT budget?
2. Which approved projects are under review?
3. Which projects are explicitly AI or AI-enabled?
4. What value did the sponsor project, and what proof is needed?
5. What has Finance reviewed, approved, validated, or rejected?

## Included Source Files

| File | Owner | Purpose | Refresh |
| --- | --- | --- | --- |
| `20_it_budget_by_domain.csv` | IT Finance / FP&A | Total IT budget by function/domain | Monthly close |
| `21_it_project_portfolio.csv` | PMO | Approved IT project portfolio, including AI flags | Monthly |
| `22_ai_business_cases.csv` | Business sponsors + Finance | One business case per explicit AI / AI-enabled project | Monthly |
| `23_ai_tool_rollout.csv` | Platform administrators | Tool rollout goals, target users, enabled users, active users | Monthly |
| `24_monthly_value_tracking.csv` | Business sponsors + Finance | Sponsor, Finance, and board-claimable value tracking | Monthly |
| `25_finance_approval_ledger.csv` | Finance | Sponsor claims, CFO target approvals, challenges, and actual validation events | Monthly |
| `26_evidence_register.csv` | Initiative owners | Source evidence tied to projects, business cases, value observations, and finance events | Monthly |

## Source-Layer Economics

| Measure | Value | Source-layer meaning |
| --- | ---: | --- |
| Total IT budget | `$1.05B` | Full IT budget context for a Meridian-scale organization |
| Reviewed IT project portfolio | `$703.1M` | Approved project portfolio in Tower scope |
| Explicit AI / AI-enabled investment | `$211.8M` | Subset of reviewed portfolio where `is_ai_related=true` |
| Projected annual AI value, low case | `$677.8M` | Sponsor-projected annual value after business-case challenge |
| Projected annual AI value, high case | `$847.2M` | Upper planning case; not board-claimable without evidence |
| AI portfolio ROI range | `3.2x-4.0x` | Projected annual value divided by explicit AI / AI-enabled investment |

These measures must remain separate:

- Approved spend is not value.
- Projected value is not Finance-validated actual value.
- Finance-validated actual value is not automatically board-claimable.
- Foundation work carries no direct ROI until linked downstream use cases prove value.

## Top Investment Reality Check

The top 10 approved projects are intentionally not all AI. This preserves the executive question a CFO would ask: where does AI sit inside the broader IT portfolio?

| Rank | Project | Domain | Classification | AI-related | Approved budget |
| ---: | --- | --- | --- | --- | ---: |
| 1 | Epic revenue cycle modernization | Clinical / Epic | clinical_epic | false | `$58.0M` |
| 2 | Cloud resilience and network modernization | Infrastructure & Cloud | infrastructure | false | `$46.5M` |
| 3 | Enterprise identity and access modernization | Cybersecurity & Risk | security | false | `$39.5M` |
| 4 | Enterprise AI platform foundation | Data & AI | platform_foundation | true | `$18.0M` |
| 5 | Provider data quality remediation | Enterprise Applications | ordinary_it_project | false | `$11.3M` |
| 6 | Digital front door personalization | Digital & Member Experience | ai_use_case | true | `$11.2M` |
| 7 | ServiceNow operations AI rollout | Enterprise Applications | ai_enabled_tool_rollout | true | `$10.4M` |
| 8 | Data quality and interoperability foundation | Data & AI | data_readiness | true | `$9.8M` |
| 9 | Epic ambulatory access optimization | Clinical / Epic | ai_assisted_automation | true | `$8.9M` |
| 10 | Contact center AI assist | Digital & Member Experience | ai_use_case | true | `$8.6M` |

## Business Case Simplicity

Every explicit AI / AI-enabled project has one business case. The value story uses plain categories:

| Value type | Cases | Build cost, high case | Projected annual value |
| --- | ---: | ---: | ---: |
| Reduce cost | 18 | `$96.3M` | `$416.3M-$509.8M` |
| Create capacity | 6 | `$36.0M` | `$164.7M-$217.7M` |
| Grow revenue | 3 | `$20.6M` | `$82.3M-$100.3M` |
| Build faster | 1 | `$3.3M` | `$14.4M-$19.5M` |
| Foundation | 14 | `$81.1M` | `$0.0M-$0.0M` |

Direct-value cases clear the investment hurdle: low-case annual value is at least 3x high-case build cost. Foundation/readiness cases are shown separately because they enable downstream use cases but should not be counted as standalone value.

## Finance And Proof Workflow

The source layer tracks value as a monthly workflow:

1. Sponsor states the target value.
2. Finance can challenge or approve the target.
3. Monthly tracking records actual movement against the baseline.
4. Finance validates actual value when evidence is sufficient.
5. Board-claimable value is released only after the Finance validation gate.

Finance ledger coverage:

| Approval state | Rows |
| --- | ---: |
| sponsor_claimed | 51 |
| finance_challenged | 9 |
| cfo_approved_target | 8 |
| not_submitted | 8 |
| finance_validated_actual | 8 |

## Layer 1 Validation Gates

Layer 1 is ready for signoff if the following remain true:

- All rows use tenant key `meridian-health`.
- Total IT budget equals `$1.05B`.
- Reviewed project portfolio equals `$703.1M`.
- Explicit AI / AI-enabled investment equals `$211.8M`.
- AI is explicit through `is_ai_related`; BI is not automatically AI.
- There are 140 project rows and 42 AI business cases.
- Every explicit AI / AI-enabled project has exactly one business case.
- Tool rollouts include goals, target users, enabled users, and active users.
- Projected annual AI value remains in the 3x-4x portfolio range.
- Sponsor value, Finance-reviewed value, Finance-validated value, and board-claimable value stay separate.

## Open Signoff Decisions

Before moving to Layer 2 adapters, sign off or revise these choices:

1. Is `$211.8M` the right synthetic AI / AI-enabled investment pool inside a `$703.1M` reviewed IT project portfolio?
2. Is `3.2x-4.0x` the right projected annual AI value range for the demo story?
3. Are the five value types simple enough: Reduce cost, Create capacity, Grow revenue, Build faster, Foundation?
4. Should foundation/readiness work stay at zero direct ROI until linked use cases prove value?
5. Are monthly Finance states sufficient for the demo: sponsor claimed, challenged, CFO-approved target, not submitted, finance-validated actual?

Layer 1 signoff means the source inputs are credible enough to map forward. It does not mean the data has been loaded, projected, deployed, or proven in the live Tower UI.
