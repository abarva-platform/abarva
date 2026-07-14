# CIO core modernization decision memo

Document type: Vendor renewal brief
Prepared for: Chief Risk Officer
Evidence date: 2026-11-19
Primary system: FCF-APP-DATA-PLATFORM-139 - First Capital Data Platform Service 139
Owning team: TEAM-FCF-DATA
Related dependency: FCF-APP-COMMERCIAL-LENDING-100
Vendor exposure: Tableau / $7,284,000 annual run-rate
Classification: confidential

## Situation

First Capital Data Platform Service 139 is carried as a medium data platform platform with $6,593,000 in FY25 run cost and a maintain modernization posture. The application is not a stand-alone decision: it sits in a dependency chain that includes FCF-APP-COMMERCIAL-LENDING-100, Tableau, and the Wealth and Private Bank Technology control owner group.

## Evidence Observed

- Current architecture: cloud deployment with 57 cataloged upstream/downstream relationships.
- Program tie: FCF-INIT-FRAUD-GRAPH-V2 - Fraud graph analytics v2; committed funding $7,300,000, projected value $28,600,000, Sentinel posture Continue.
- Vendor condition: standard annual renewal notice; AI/data-use clause: standard data-processing and confidentiality restrictions.
- Risk lens: OCC/FFIEC operational resilience, GLBA safeguarding, BSA/AML evidence where customer or transaction data is in scope, and SR 11-7 model-risk expectations for AI-assisted decisions.

## Decision Implication

The program is eligible to continue only while value measurement remains tied to the named control and operating metrics. Any recommendation must cite the application id, initiative id, vendor exposure, and the dependency above. If any of those facts are unavailable in the live context layer, Sentinel should answer that it cannot complete the recommendation yet.

## Open Evidence Requests

- Confirm whether FCF-APP-COMMERCIAL-LENDING-100 has a tested rollback or parallel-run pattern.
- Reconcile FCF-APP-DATA-PLATFORM-139 run cost to the latest finance allocation workbook.
- Attach latest ServiceNow change/problem records for the last two high-risk release windows.
- Confirm whether second-line risk has accepted the evidence basis for FCF-INIT-FRAUD-GRAPH-V2.
