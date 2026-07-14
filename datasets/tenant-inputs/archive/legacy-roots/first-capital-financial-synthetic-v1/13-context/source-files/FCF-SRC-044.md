# SAP ECC finance migration options

Document type: Architecture review record
Prepared for: SVP Commercial Bank CIO
Evidence date: 2026-09-13
Primary system: FCF-APP-CORE-BANKING-133 - First Capital Core Banking Service 133
Owning team: TEAM-FCF-CORE
Related dependency: FCF-APP-PAYMENTS-098
Vendor exposure: Broadridge / $5,006,000 annual run-rate
Classification: confidential

## Situation

First Capital Core Banking Service 133 is carried as a medium core banking platform with $5,771,000 in FY25 run cost and a restructure modernization posture. The application is not a stand-alone decision: it sits in a dependency chain that includes FCF-APP-PAYMENTS-098, Broadridge, and the Core Banking Platforms control owner group.

## Evidence Observed

- Current architecture: mainframe deployment with 15 cataloged upstream/downstream relationships.
- Program tie: FCF-INIT-029 - Engineering productivity tooling for legacy apps; committed funding $4,011,000, projected value $33,790,000, Sentinel posture Healthy.
- Vendor condition: standard annual renewal notice; AI/data-use clause: AI use requires prior written approval and audit evidence.
- Risk lens: OCC/FFIEC operational resilience, GLBA safeguarding, BSA/AML evidence where customer or transaction data is in scope, and SR 11-7 model-risk expectations for AI-assisted decisions.

## Decision Implication

The program is eligible to continue only while value measurement remains tied to the named control and operating metrics. Any recommendation must cite the application id, initiative id, vendor exposure, and the dependency above. If any of those facts are unavailable in the live context layer, Sentinel should answer that it cannot complete the recommendation yet.

## Open Evidence Requests

- Confirm whether FCF-APP-PAYMENTS-098 has a tested rollback or parallel-run pattern.
- Reconcile FCF-APP-CORE-BANKING-133 run cost to the latest finance allocation workbook.
- Attach latest ServiceNow change/problem records for the last two high-risk release windows.
- Confirm whether second-line risk has accepted the evidence basis for FCF-INIT-029.
