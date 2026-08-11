# Change Failure Record (Synthetic Fixture)

## CFR-GLD-2024-01: Oracle Health ambulatory rollout rollback
Phase 2 of the ambulatory EHR consolidation was rolled back in Q3 2024 after a three-week
patient-scheduling defect. Root cause: integration contract mismatch between the scheduling
service and Oracle Health's ambulatory module. Retained here as a fixed, reproducible history
item for Golden Move regression testing — do not edit dates or root cause text between runs.

## CFR-GLD-2023-02: Member portal SSO outage
A federation misconfiguration during an Okta tenant migration locked out ~40,000 members for
11 hours. Referenced by evidence item `evid:golden:0031` in the evidence ledger.
