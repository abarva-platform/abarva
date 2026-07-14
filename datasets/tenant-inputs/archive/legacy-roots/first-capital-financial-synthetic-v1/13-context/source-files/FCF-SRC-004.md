# FedNow and RTP board update

Document type: Architecture review record
Prepared for: SVP Cards
Evidence date: 2026-05-13
Primary system: FCF-APP-SNOWFLAKE - Snowflake Financial Data Cloud
Owning team: TEAM-FCF-DATA
Related dependency: FCF-APP-SERVICENOW
Vendor exposure: Broadridge / $5,006,000 annual run-rate
Classification: confidential

## Situation

Snowflake Financial Data Cloud is carried as a critical data platform platform with $7,400,000 in FY25 run cost and an invest modernization posture. The application is not a stand-alone decision: it sits in a dependency chain that includes FCF-APP-SERVICENOW, Broadridge, and the Cybersecurity and IAM control owner group.

## Evidence Observed

- Current architecture: cloud deployment with 117 cataloged upstream/downstream relationships.
- Program tie: FCF-INIT-021 - Open banking developer portal; committed funding $11,483,000, projected value $21,870,000, Sentinel posture Healthy.
- Vendor condition: standard annual renewal notice; AI/data-use clause: AI use requires prior written approval and audit evidence.
- Risk lens: OCC/FFIEC operational resilience, GLBA safeguarding, BSA/AML evidence where customer or transaction data is in scope, and SR 11-7 model-risk expectations for AI-assisted decisions.

## Decision Implication

The program is eligible to continue only while value measurement remains tied to the named control and operating metrics. Any recommendation must cite the application id, initiative id, vendor exposure, and the dependency above. If any of those facts are unavailable in the live context layer, Sentinel should answer that it cannot complete the recommendation yet.

## Open Evidence Requests

- Confirm whether FCF-APP-SERVICENOW has a tested rollback or parallel-run pattern.
- Reconcile FCF-APP-SNOWFLAKE run cost to the latest finance allocation workbook.
- Attach latest ServiceNow change/problem records for the last two high-risk release windows.
- Confirm whether second-line risk has accepted the evidence basis for FCF-INIT-021.
