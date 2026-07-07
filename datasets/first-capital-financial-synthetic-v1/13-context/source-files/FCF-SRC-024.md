# Wealth advisor supervision memo

Document type: Architecture review record
Prepared for: Chief Procurement Officer
Evidence date: 2026-01-01
Primary system: FCF-APP-CORE-BANKING-073 - First Capital Core Banking Service 073
Owning team: TEAM-FCF-CORE
Related dependency: FCF-APP-PAYMENTS-038
Vendor exposure: Broadridge / $5,006,000 annual run-rate
Classification: confidential

## Situation

First Capital Core Banking Service 073 is carried as a medium core banking platform with $3,951,000 in FY25 run cost and a maintain modernization posture. The application is not a stand-alone decision: it sits in a dependency chain that includes FCF-APP-PAYMENTS-038, Broadridge, and the Wealth and Private Bank Technology control owner group.

## Evidence Observed

- Current architecture: mainframe deployment with 15 cataloged upstream/downstream relationships.
- Program tie: FCF-INIT-025 - Snowflake cost governance; committed funding $14,647,000, projected value $27,830,000, Sentinel posture Healthy.
- Vendor condition: standard annual renewal notice; AI/data-use clause: AI use requires prior written approval and audit evidence.
- Risk lens: OCC/FFIEC operational resilience, GLBA safeguarding, BSA/AML evidence where customer or transaction data is in scope, and SR 11-7 model-risk expectations for AI-assisted decisions.

## Decision Implication

The program is eligible to continue only while value measurement remains tied to the named control and operating metrics. Any recommendation must cite the application id, initiative id, vendor exposure, and the dependency above. If any of those facts are unavailable in the live context layer, Sentinel should answer that it cannot complete the recommendation yet.

## Open Evidence Requests

- Confirm whether FCF-APP-PAYMENTS-038 has a tested rollback or parallel-run pattern.
- Reconcile FCF-APP-CORE-BANKING-073 run cost to the latest finance allocation workbook.
- Attach latest ServiceNow change/problem records for the last two high-risk release windows.
- Confirm whether second-line risk has accepted the evidence basis for FCF-INIT-025.
