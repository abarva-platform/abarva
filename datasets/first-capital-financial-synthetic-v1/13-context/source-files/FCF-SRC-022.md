# Mobile banking NPS and crash analytics

Document type: Finance workbook narrative
Prepared for: SVP Client Service
Evidence date: 2026-11-19
Primary system: FCF-APP-DATA-PLATFORM-067 - First Capital Data Platform Service 067
Owning team: TEAM-FCF-DATA
Related dependency: FCF-APP-MODEL-RISK-036
Vendor exposure: Workday / $2,728,000 annual run-rate
Classification: confidential

## Situation

First Capital Data Platform Service 067 is carried as a medium data platform platform with $3,129,000 in FY25 run cost and a maintain modernization posture. The application is not a stand-alone decision: it sits in a dependency chain that includes FCF-APP-MODEL-RISK-036, Workday, and the Core Banking Platforms control owner group.

## Evidence Observed

- Current architecture: cloud deployment with 57 cataloged upstream/downstream relationships.
- Program tie: FCF-INIT-015 - Cloud exit-risk reduction; committed funding $6,737,000, projected value $12,930,000, Sentinel posture Healthy.
- Vendor condition: standard annual renewal notice; AI/data-use clause: standard data-processing and confidentiality restrictions.
- Risk lens: OCC/FFIEC operational resilience, GLBA safeguarding, BSA/AML evidence where customer or transaction data is in scope, and SR 11-7 model-risk expectations for AI-assisted decisions.

## Decision Implication

The program is eligible to continue only while value measurement remains tied to the named control and operating metrics. Any recommendation must cite the application id, initiative id, vendor exposure, and the dependency above. If any of those facts are unavailable in the live context layer, Sentinel should answer that it cannot complete the recommendation yet.

## Open Evidence Requests

- Confirm whether FCF-APP-MODEL-RISK-036 has a tested rollback or parallel-run pattern.
- Reconcile FCF-APP-DATA-PLATFORM-067 run cost to the latest finance allocation workbook.
- Attach latest ServiceNow change/problem records for the last two high-risk release windows.
- Confirm whether second-line risk has accepted the evidence basis for FCF-INIT-015.
