# How to fill — KPI register

**What this becomes:** `kpi` facts in the tenant context.
**Questions it makes answerable:** "What KPIs does the CFO track?", "What's our denial rate vs target?",
"Which operational metrics are off target?", "What's on the board scorecard?"

## Fields
| Field | Required | Enter | Example |
|---|---|---|---|
| `function` | yes | Enterprise/Finance/Operations/Clinical/Nursing/IT/Data | `Finance` |
| `owner_role` | yes | The role accountable | `CFO` |
| `kpi_name` | yes | Standard name (see catalog) | `Denial rate` |
| `definition` | recommended | One line | `Denied $ / billed $` |
| `current_value` | when known | The number only | `7.8` |
| `unit` | yes | percent/days/USD/ratio/count/minutes | `percent` |
| `target_value` | recommended | The goal | `5.0` |
| `benchmark` | optional | Peer/median | `6.0 (top quartile)` |
| `period` / `frequency` | yes | `FY26 YTD` / `monthly` | |
| `data_source` | recommended | System of record | `Revenue Cycle` |
| `source` | yes | The upload file | `kpi-register.csv` |

## Depth + realism
- Pull the right metric set per role from **`provider-payer-metric-catalog.md`** (provider AND payer).
  A real provider register spans ~150–200 metrics across roles; start with each role's top ~10–15.
- **Targets must be plausible** for the org (e.g. operating margin target 3–4% for an IDN, not 25%).
  The loader warns when a target is outside the catalog's typical band.
- Tie KPIs to an `owner_role` that exists in the **Leadership & Org** template (so "the CFO's KPIs"
  resolves to a real person).
