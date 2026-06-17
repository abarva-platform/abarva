# FIS core API assessment

Document type: Board technology appendix
Prepared for: VP Technology Service Mgmt
Evidence date: 2026-07-19
Primary system: FCF-APP-DATA-PLATFORM-091 - First Capital Data Platform Service 091
Owning team: TEAM-FCF-DATA
Related dependency: FCF-APP-MODEL-RISK-084
Vendor exposure: FIS / $38,000,000 annual run-rate
Classification: confidential

## Situation

First Capital Data Platform Service 091 is carried as a medium data platform platform with $6,417,000 in FY25 run cost and a restructure modernization posture. The application is not a stand-alone decision: it sits in a dependency chain that includes FCF-APP-MODEL-RISK-084, FIS, and the Mortgage and Consumer Lending control owner group.

## Evidence Observed

- Current architecture: cloud deployment with 57 cataloged upstream/downstream relationships.
- Program tie: FCF-INIT-023 - IAM privileged access cleanup; committed funding $13,065,000, projected value $24,850,000, Sentinel posture Restructure.
- Vendor condition: 180-day core transition; termination assistance capped at 12 months; AI/data-use clause: requires model-risk approval for generated code.
- Risk lens: OCC/FFIEC operational resilience, GLBA safeguarding, BSA/AML evidence where customer or transaction data is in scope, and SR 11-7 model-risk expectations for AI-assisted decisions.

## Decision Implication

The value case is credible, but the scope must be narrowed to the evidence-backed cohort before additional funding. Any recommendation must cite the application id, initiative id, vendor exposure, and the dependency above. If any of those facts are unavailable in the live context layer, Sentinel should answer that it cannot complete the recommendation yet.

## Open Evidence Requests

- Confirm whether FCF-APP-MODEL-RISK-084 has a tested rollback or parallel-run pattern.
- Reconcile FCF-APP-DATA-PLATFORM-091 run cost to the latest finance allocation workbook.
- Attach latest ServiceNow change/problem records for the last two high-risk release windows.
- Confirm whether second-line risk has accepted the evidence basis for FCF-INIT-023.
