# OCC MRA remediation status note

Document type: Data lineage attestation
Prepared for: SVP Payments Technology
Evidence date: 2026-07-07
Primary system: FCF-APP-DATA-PLATFORM-055 - First Capital Data Platform Service 055
Owning team: TEAM-FCF-DATA
Related dependency: FCF-APP-CYBERSECURITY-032
Vendor exposure: Q2 / $2,362,000 annual run-rate
Classification: confidential

## Situation

First Capital Data Platform Service 055 is carried as a medium data platform platform with $1,485,000 in FY25 run cost and a migrate modernization posture. The application is not a stand-alone decision: it sits in a dependency chain that includes FCF-APP-CYBERSECURITY-032, Q2, and the Open Banking and API Products control owner group.

## Evidence Observed

- Current architecture: cloud deployment with 57 cataloged upstream/downstream relationships.
- Program tie: FCF-INIT-027 - Loan operations straight-through processing; committed funding $2,429,000, projected value $30,810,000, Sentinel posture Healthy.
- Vendor condition: standard annual renewal notice; AI/data-use clause: AI use requires prior written approval and audit evidence.
- Risk lens: OCC/FFIEC operational resilience, GLBA safeguarding, BSA/AML evidence where customer or transaction data is in scope, and SR 11-7 model-risk expectations for AI-assisted decisions.

## Decision Implication

The program is eligible to continue only while value measurement remains tied to the named control and operating metrics. Any recommendation must cite the application id, initiative id, vendor exposure, and the dependency above. If any of those facts are unavailable in the live context layer, Sentinel should answer that it cannot complete the recommendation yet.

## Open Evidence Requests

- Confirm whether FCF-APP-CYBERSECURITY-032 has a tested rollback or parallel-run pattern.
- Reconcile FCF-APP-DATA-PLATFORM-055 run cost to the latest finance allocation workbook.
- Attach latest ServiceNow change/problem records for the last two high-risk release windows.
- Confirm whether second-line risk has accepted the evidence basis for FCF-INIT-027.
