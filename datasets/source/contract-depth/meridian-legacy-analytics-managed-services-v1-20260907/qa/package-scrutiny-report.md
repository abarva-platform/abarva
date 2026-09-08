# Package scrutiny report

Status: `PASS`

This report is intentionally plain English. It exists so the package cannot drift back into a thin or economically incoherent managed-services example before Layer 2/3/4 loading.

## Executive sizing check

- Contract signed date: 2024-07-15
- Annual contract value: $7,850,000
- Committed annual run base: $7,620,000
- Trailing actual annual spend: $8,335,000
- Total FTE: 51.8
- Onshore/offshore: 9.8 / 42.0 FTE (18.9% / 81.1%)
- Blended annual contract bill rate: $151,544 per FTE, or $72.86/hour
- Labor billed: $7,179,500; vendor labor cost basis: $4,392,000; margin/overhead bridge: $2,787,500

## Scrutiny dimensions

### commercial sizing

Status: `PASS`

Annual value is sized as a credible analytics managed-services SOW, not enterprise-wide infrastructure outsourcing.

Evidence: Contract value $7.85M; committed run base $7.62M; actual trailing spend $8.335M.

### resource economics

Status: `PASS`

The 15 rows are role categories, not 15 people. FTE, location mix, bill rates, cost rates, and overhead reconcile.

Evidence: 51.8 total FTE; 9.8 onshore; 42.0 offshore; $7.1795M labor billed; $4.392M vendor labor cost.

### application and infrastructure scope

Status: `PASS`

The SOW footprint is tied to named systems and operating volumes rather than a generic managed-services label.

Evidence: 8 scoped systems: SQL reporting marts, Tableau, Power BI, SAS, Epic Clarity, claims extracts, finance close marts, and ServiceNow integration.

### invoice tie-out

Status: `PASS`

Every monthly invoice total ties exactly to AP invoice line detail; no negative balancing rows are used.

Evidence: 56 invoice lines reconcile to 12 monthly spend rows.

### SLA and service-credit math

Status: `PASS`

Service credits are calculated from the contract clause and breached months, not inferred by the UI.

Evidence: $63,500 total credit owed across four breached periods; credit_claimed is false on each breached row.

### change-order trap

Status: `PASS`

Recurring run-support change orders are separated from true transformation work so Optimize can challenge scope creep.

Evidence: 8 change orders, including 5 rows marked in_scope_disputed.

### opportunity posture

Status: `PASS`

All Optimize amounts are candidate opportunities only; no realized savings are claimed.

Evidence: $897,500 candidate value; finance_confirmation_state is not_confirmed on every opportunity.

### evidence lineage

Status: `PASS`

Every source_file_id used by source rows resolves to a document in the evidence manifest.

Evidence: 8 synthetic evidence documents; missing source_file_id count is zero.

## No-overclaim rule

Source may say this contract has calculated unclaimed credits, recurring change-order challenge candidates, and a resource-mix negotiation candidate. Source must not say realized savings until a finance-confirmed approval record exists.

## Load readiness

Layer 1 is ready for adapter review. Layer 2/3/4 loading must still use the governed ACA data-build job path with readback, quality gate, release record, and signed-in product proof before any product page treats these rows as live.
