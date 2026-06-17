# Commercial lending operating review

Document type: Data lineage attestation
Prepared for: Chief Risk Officer
Evidence date: 2026-03-19
Primary system: FCF-APP-DATA-PLATFORM-115 - First Capital Data Platform Service 115
Owning team: TEAM-FCF-DATA
Related dependency: FCF-APP-CYBERSECURITY-092
Vendor exposure: Q2 / $2,362,000 annual run-rate
Classification: confidential

## Situation

First Capital Data Platform Service 115 is carried as a medium data platform platform with $3,305,000 in FY25 run cost and an invest modernization posture. The application is not a stand-alone decision: it sits in a dependency chain that includes FCF-APP-CYBERSECURITY-092, Q2, and the Branch and ATM Technology control owner group.

## Evidence Observed

- Current architecture: cloud deployment with 57 cataloged upstream/downstream relationships.
- Program tie: FCF-INIT-031 - Customer 360 consent and preference hub; committed funding $5,593,000, projected value $4,770,000, Sentinel posture Healthy.
- Vendor condition: standard annual renewal notice; AI/data-use clause: AI use requires prior written approval and audit evidence.
- Risk lens: OCC/FFIEC operational resilience, GLBA safeguarding, BSA/AML evidence where customer or transaction data is in scope, and SR 11-7 model-risk expectations for AI-assisted decisions.

## Decision Implication

The program is eligible to continue only while value measurement remains tied to the named control and operating metrics. Any recommendation must cite the application id, initiative id, vendor exposure, and the dependency above. If any of those facts are unavailable in the live context layer, Sentinel should answer that it cannot complete the recommendation yet.

## Open Evidence Requests

- Confirm whether FCF-APP-CYBERSECURITY-092 has a tested rollback or parallel-run pattern.
- Reconcile FCF-APP-DATA-PLATFORM-115 run cost to the latest finance allocation workbook.
- Attach latest ServiceNow change/problem records for the last two high-risk release windows.
- Confirm whether second-line risk has accepted the evidence basis for FCF-INIT-031.
