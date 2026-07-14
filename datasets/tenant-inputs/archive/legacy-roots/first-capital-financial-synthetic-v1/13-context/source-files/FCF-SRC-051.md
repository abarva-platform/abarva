# Digital account-opening abandonment analysis

Document type: Executive decision memo
Prepared for: Chief Data and Analytics Officer
Evidence date: 2026-04-10
Primary system: FCF-APP-BRANCH-ATM-154 - First Capital Branch Atm Service 154
Owning team: TEAM-FCF-BRANCH
Related dependency: FCF-APP-MOBILE-BANKING
Vendor exposure: ACI Worldwide / $8,600,000 annual run-rate
Classification: confidential

## Situation

First Capital Branch Atm Service 154 is carried as a medium branch atm platform with $2,248,000 in FY25 run cost and a migrate modernization posture. The application is not a stand-alone decision: it sits in a dependency chain that includes FCF-APP-MOBILE-BANKING, ACI Worldwide, and the Open Banking and API Products control owner group.

## Evidence Observed

- Current architecture: on_prem deployment with 78 cataloged upstream/downstream relationships.
- Program tie: FCF-INIT-032 - Third-party risk scoring automation; committed funding $6,384,000, projected value $6,260,000, Sentinel posture Watch.
- Vendor condition: FedNow module removal after stabilization; AI/data-use clause: AI-generated payment rules prohibited.
- Risk lens: OCC/FFIEC operational resilience, GLBA safeguarding, BSA/AML evidence where customer or transaction data is in scope, and SR 11-7 model-risk expectations for AI-assisted decisions.

## Decision Implication

The program is eligible to continue only while value measurement remains tied to the named control and operating metrics. Any recommendation must cite the application id, initiative id, vendor exposure, and the dependency above. If any of those facts are unavailable in the live context layer, Sentinel should answer that it cannot complete the recommendation yet.

## Open Evidence Requests

- Confirm whether FCF-APP-MOBILE-BANKING has a tested rollback or parallel-run pattern.
- Reconcile FCF-APP-BRANCH-ATM-154 run cost to the latest finance allocation workbook.
- Attach latest ServiceNow change/problem records for the last two high-risk release windows.
- Confirm whether second-line risk has accepted the evidence basis for FCF-INIT-032.
