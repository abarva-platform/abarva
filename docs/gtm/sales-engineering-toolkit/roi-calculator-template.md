# ROI Calculator Template

Status: sales-engineering draft
Audience: CFO, COO, CDO, pilot sponsor

This is a markdown worksheet for early discovery. Convert it to a spreadsheet
only after the buyer agrees on assumptions and the value driver. Do not present
the output as guaranteed savings.

## Inputs

| Input | Symbol | Example placeholder | Buyer source |
| --- | --- | --- | --- |
| AI / transformation portfolio annual spend | `portfolio_spend` | TBD | CFO / PMO |
| Number of active initiatives in pilot scope | `initiative_count` | TBD | PMO / AI lead |
| Average annual run-rate per initiative | `initiative_run_rate` | `portfolio_spend / initiative_count` | Derived |
| Value at stake for selected initiative | `value_at_stake` | TBD | Sponsor business case |
| Expected decision-cycle reduction | `cycle_reduction_pct` | TBD | Sponsor estimate |
| Expected leakage / rework reduction | `rework_reduction_pct` | TBD | Sponsor estimate |
| Vendor/procurement savings opportunity | `vendor_savings` | TBD | Procurement / finance |
| AbarVa pilot cost | `pilot_cost` | TBD | Current commercial proposal |
| Internal implementation effort | `internal_hours` | TBD | Sponsor / IT |
| Internal blended hourly cost | `internal_hourly_cost` | TBD | Finance |

## Derived Calculations

| Metric | Formula | Notes |
| --- | --- | --- |
| Internal implementation cost | `internal_hours * internal_hourly_cost` | Include security, identity, data, and pilot operations time. |
| Total pilot investment | `pilot_cost + internal_implementation_cost` | Include only pilot-specific incremental cost. |
| Decision-cycle value | `value_at_stake * cycle_reduction_pct` | Use only if the sponsor accepts time-to-decision as a value driver. |
| Rework/leakage value | `value_at_stake * rework_reduction_pct` | Use only when delayed or unsupported decisions create measurable waste. |
| Vendor savings value | `vendor_savings` | Use Source/procurement evidence where available. |
| Total quantified value | `decision_cycle_value + rework_value + vendor_savings_value` | Keep unquantified benefits separate. |
| Net value | `total_quantified_value - total_pilot_investment` | Do not include speculative enterprise-wide expansion. |
| Payback ratio | `total_quantified_value / total_pilot_investment` | Report as ratio, not a guarantee. |

## Value Driver Menu

| Driver | When to use | Evidence needed |
| --- | --- | --- |
| Faster executive decision | Initiative is stalled by unclear evidence, ownership, or gates. | Baseline decision cycle, meeting cadence, approval path. |
| Reduced duplicate work | Multiple teams are creating overlapping AI business cases or vendor analyses. | Portfolio list, duplicate vendor/tool inventory, PMO evidence. |
| Vendor / sourcing leverage | Source events or vendor concentration are central to the pilot. | Contract dates, renewal values, vendor shortlist, procurement timeline. |
| Better auditability | Buyer needs a defensible decision record for board, finance, or risk review. | Required audit evidence, approval owners, compliance review criteria. |
| Higher initiative throughput | Sponsor wants more initiatives moved through phase gates with same staff. | Current throughput, blocker taxonomy, target cadence. |

## Spreadsheet Layout

When converting this into Excel, use these tabs:

| Tab | Purpose |
| --- | --- |
| `Inputs` | Buyer-entered assumptions, owner, source, confidence. |
| `Value Model` | Formulas above, with sensitivity for conservative/base/upside. |
| `Evidence` | Links to buyer documents, AbarVa evidence ids, and assumptions. |
| `Scenario Summary` | One-page CFO view with quantified and unquantified benefits. |

## Discovery Prompts

- "Which decision loop is expensive enough that a better operating substrate is
  worth funding?"
- "Where does value leak today: slow decisions, rework, vendor sprawl, missing
  evidence, or lack of accountable owner?"
- "What number would finance accept as the baseline?"
- "Which assumptions are acceptable for a pilot business case, and which need
  post-pilot measurement?"
- "What would make this a renewal/expansion case instead of a one-time pilot?"

## Output Format

Use this structure in the buyer recap:

| Section | Content |
| --- | --- |
| Pilot value hypothesis | One sentence naming the decision loop and value driver. |
| Baseline | Current spend, cycle time, rework, or sourcing exposure. |
| AbarVa impact path | How evidence-backed moves reduce the baseline problem. |
| Quantified model | Conservative/base/upside values with assumptions. |
| Unquantified benefits | Auditability, repeatability, board confidence, operating rhythm. |
| Measurement plan | What the pilot will measure weekly. |

## Guardrails

- Do not use ROI numbers without buyer-provided or explicitly labeled
  placeholder assumptions.
- Do not roll enterprise-wide value into a pilot unless the buyer asks for an
  expansion scenario.
- Keep unquantified benefits separate from quantified payback.
- Every assumption needs an owner and confidence rating.
