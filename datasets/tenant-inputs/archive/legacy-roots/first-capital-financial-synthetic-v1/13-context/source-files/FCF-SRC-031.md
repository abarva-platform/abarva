# CIO core modernization decision memo

Document type: Executive decision memo
Prepared for: Chief Digital Officer
Evidence date: 2026-08-22
Primary system: FCF-APP-BRANCH-ATM-094 - First Capital Branch Atm Service 094
Owning team: TEAM-FCF-BRANCH
Related dependency: FCF-APP-DATA-PLATFORM-175
Vendor exposure: ACI Worldwide / $8,600,000 annual run-rate
Classification: confidential

## Situation

First Capital Branch Atm Service 094 is carried as a medium branch atm platform with $428,000 in FY25 run cost and a maintain modernization posture. The application is not a stand-alone decision: it sits in a dependency chain that includes FCF-APP-DATA-PLATFORM-175, ACI Worldwide, and the Engineering Productivity Office control owner group.

## Evidence Observed

- Current architecture: on_prem deployment with 78 cataloged upstream/downstream relationships.
- Program tie: FCF-INIT-028 - Data retention and legal hold automation; committed funding $3,220,000, projected value $32,300,000, Sentinel posture Restructure.
- Vendor condition: FedNow module removal after stabilization; AI/data-use clause: AI-generated payment rules prohibited.
- Risk lens: OCC/FFIEC operational resilience, GLBA safeguarding, BSA/AML evidence where customer or transaction data is in scope, and SR 11-7 model-risk expectations for AI-assisted decisions.

## Decision Implication

The value case is credible, but the scope must be narrowed to the evidence-backed cohort before additional funding. Any recommendation must cite the application id, initiative id, vendor exposure, and the dependency above. If any of those facts are unavailable in the live context layer, Sentinel should answer that it cannot complete the recommendation yet.

## Open Evidence Requests

- Confirm whether FCF-APP-DATA-PLATFORM-175 has a tested rollback or parallel-run pattern.
- Reconcile FCF-APP-BRANCH-ATM-094 run cost to the latest finance allocation workbook.
- Attach latest ServiceNow change/problem records for the last two high-risk release windows.
- Confirm whether second-line risk has accepted the evidence basis for FCF-INIT-028.
