# Model risk management committee minutes

Document type: Vendor renewal brief
Prepared for: Chief Procurement Officer
Evidence date: 2026-09-01
Primary system: FCF-APP-CORE-BANKING-169 - First Capital Core Banking Service 169
Owning team: TEAM-FCF-CORE
Related dependency: FCF-APP-PAYMENTS-110
Vendor exposure: Tableau / $7,284,000 annual run-rate
Classification: confidential

## Situation

First Capital Core Banking Service 169 is carried as a medium core banking platform with $4,303,000 in FY25 run cost and a maintain modernization posture. The application is not a stand-alone decision: it sits in a dependency chain that includes FCF-APP-PAYMENTS-110, Tableau, and the Digital Banking and Client Experience control owner group.

## Evidence Observed

- Current architecture: mainframe deployment with 15 cataloged upstream/downstream relationships.
- Program tie: FCF-INIT-025 - Snowflake cost governance; committed funding $14,647,000, projected value $27,830,000, Sentinel posture Healthy.
- Vendor condition: standard annual renewal notice; AI/data-use clause: standard data-processing and confidentiality restrictions.
- Risk lens: OCC/FFIEC operational resilience, GLBA safeguarding, BSA/AML evidence where customer or transaction data is in scope, and SR 11-7 model-risk expectations for AI-assisted decisions.

## Decision Implication

The program is eligible to continue only while value measurement remains tied to the named control and operating metrics. Any recommendation must cite the application id, initiative id, vendor exposure, and the dependency above. If any of those facts are unavailable in the live context layer, Sentinel should answer that it cannot complete the recommendation yet.

## Open Evidence Requests

- Confirm whether FCF-APP-PAYMENTS-110 has a tested rollback or parallel-run pattern.
- Reconcile FCF-APP-CORE-BANKING-169 run cost to the latest finance allocation workbook.
- Attach latest ServiceNow change/problem records for the last two high-risk release windows.
- Confirm whether second-line risk has accepted the evidence basis for FCF-INIT-025.
