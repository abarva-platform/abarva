# BSA AML consent-order progress pack

Document type: Board technology appendix
Prepared for: Chief Risk Officer
Evidence date: 2026-09-13
Primary system: FCF-APP-CORE-BANKING-061 - First Capital Core Banking Service 061
Owning team: TEAM-FCF-CORE
Related dependency: FCF-APP-BRANCH-ATM-034
Vendor exposure: FIS / $38,000,000 annual run-rate
Classification: confidential

## Situation

First Capital Core Banking Service 061 is carried as a medium core banking platform with $2,307,000 in FY25 run cost and a maintain modernization posture. The application is not a stand-alone decision: it sits in a dependency chain that includes FCF-APP-BRANCH-ATM-034, FIS, and the Engineering Productivity Office control owner group.

## Evidence Observed

- Current architecture: mainframe deployment with 15 cataloged upstream/downstream relationships.
- Program tie: FCF-INIT-AML-TRIAGE-AI - AML case triage automation; committed funding $8,900,000, projected value $21,000,000, Sentinel posture Restructure.
- Vendor condition: 180-day core transition; termination assistance capped at 12 months; AI/data-use clause: requires model-risk approval for generated code.
- Risk lens: OCC/FFIEC operational resilience, GLBA safeguarding, BSA/AML evidence where customer or transaction data is in scope, and SR 11-7 model-risk expectations for AI-assisted decisions.

## Decision Implication

The value case is credible, but the scope must be narrowed to the evidence-backed cohort before additional funding. Any recommendation must cite the application id, initiative id, vendor exposure, and the dependency above. If any of those facts are unavailable in the live context layer, Sentinel should answer that it cannot complete the recommendation yet.

## Open Evidence Requests

- Confirm whether FCF-APP-BRANCH-ATM-034 has a tested rollback or parallel-run pattern.
- Reconcile FCF-APP-CORE-BANKING-061 run cost to the latest finance allocation workbook.
- Attach latest ServiceNow change/problem records for the last two high-risk release windows.
- Confirm whether second-line risk has accepted the evidence basis for FCF-INIT-AML-TRIAGE-AI.
