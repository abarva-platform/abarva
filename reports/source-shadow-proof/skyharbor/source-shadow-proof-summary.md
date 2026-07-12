# Source Shadow Proof

Tenant: `skyharbor-air`
Candidate: `skyharbor-air:skyharbor-air-pr10-candidate:candidate-dry-run`
Generated: `2026-07-12T00:00:00.000Z`

Shadow proof only - inactive candidate data. No Source runtime route changed, no production data was written, no candidate was promoted, and no realized value is claimed.

## Readiness

- Status: shadow_ready
- Candidate facts inspected: 53
- Source workbench facts inspected: 24
- Evidence trace rows: 26
- Leverage findings: 7
- Proposed memory records: 15
- Guardrails held: true

## Evidence Readiness

| Category                             | Status  | Detail                                                                                                           | Missing evidence                                                                       |
| ------------------------------------ | ------- | ---------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| vendor inventory                     | present | 8 vendor records are available in candidate context.                                                             | None                                                                                   |
| contract evidence                    | present | Synthetic executed agreement extract is referenced by the Source event evidence pack.                            | None                                                                                   |
| rate/pricing evidence                | present | Rate card and base monthly fee are present in the agreement extract.                                             | None                                                                                   |
| SLA/obligation evidence              | present | 7 service performance metrics are available.                                                                     | None                                                                                   |
| spend/value evidence                 | present | Invoice baseline and Tower value-signal records are available, but value remains unquantified/proxy-grade.       | None                                                                                   |
| sourcing scope                       | present | Agreement scope, out-of-scope services, and change-order process are available.                                  | None                                                                                   |
| transition/operational risk evidence | partial | Transition assistance clause and staffing/service risk signals are available; a detailed transition plan is not. | Transition plan, retained team model, and exit-risk owner approvals.                   |
| Tower value metric/handoff evidence  | partial | Tower value signals exist as hypotheses and proxy metrics only.                                                  | Outcome Ledger owner, baseline approval, measurement cadence, and attestation process. |

## Leverage Findings

| ID     | Type                                | Summary                                                                                                                                                    | Confidence |
| ------ | ----------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------- |
| LF-001 | spend_concentration                 | AMS base run invoices show a $1,805,000 FY26 variance above contracted baseline in synthetic evidence.                                                     | 0.82       |
| LF-002 | contract_renewal_or_timing_pressure | The agreement contains a 2026-09-30 renewal notice date and annual benchmark/audit rights after year two.                                                  | 0.86       |
| LF-003 | sla_leakage                         | P1 restore is 91.8% against 95% target, and change success is 96.9% against 98% target in synthetic service data.                                          | 0.8        |
| LF-004 | scope_overlap                       | $1,008,000 in recurring change orders are not catalog mapped in synthetic change-order evidence.                                                           | 0.8        |
| LF-005 | transition_risk                     | Staffing attestations show 12 committed-vs-observed FTE gap and coverage gaps in airline operations and data/integration support.                          | 0.78       |
| LF-006 | vendor_consolidation                | 8 vendor records are visible, but the candidate pack does not contain enough approved contract economics to recommend vendor consolidation.                | 0.62       |
| LF-007 | value_tracking_opportunity          | Tower should track only proposed value commitments until Finance, Operations, Technology, and Source owners approve baselines and measurement definitions. | 0.82       |

## Tower Handoff

Potential sourcing value exists in validating $1,805,000 invoice variance, $1,008,000 recurring change-order exposure, SLA remedies, and staffing underfill. This is a proposed commitment only, not measured or realized value.

Realized value claimed: false

## Guardrails

- Source runtime changed: false
- Production tenant data written: false
- Physical Source tables written: false
- Physical Outcome Ledger tables written: false
- Active Tenant Access Layer updated: false
- Candidate promoted: false
- Module runtime consumption changed: false
- Candidate read by default: false
- Realized value claimed: false
- Shadow proof only: true
