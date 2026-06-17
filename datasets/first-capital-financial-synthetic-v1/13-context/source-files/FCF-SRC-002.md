# CFO technology run-cost workbook excerpt

Document type: Finance workbook narrative
Prepared for: SVP Infrastructure
Evidence date: 2026-03-07
Primary system: FCF-APP-NICE-ACTIMIZE - NICE Actimize AML and Fraud
Owning team: TEAM-FCF-RISK
Related dependency: FCF-APP-ONLINE-ACCOUNT-OPENING
Vendor exposure: Workday / $2,728,000 annual run-rate
Classification: restricted

## Situation

NICE Actimize AML and Fraud is carried as a critical financial crimes platform with $11,200,000 in FY25 run cost and an invest modernization posture. The application is not a stand-alone decision: it sits in a dependency chain that includes FCF-APP-ONLINE-ACCOUNT-OPENING, Workday, and the Wealth and Private Bank Technology control owner group.

## Evidence Observed

- Current architecture: hybrid deployment with 104 cataloged upstream/downstream relationships.
- Program tie: FCF-INIT-011 - Treasury liquidity forecast modernization; committed funding $3,573,000, projected value $6,970,000, Sentinel posture Healthy.
- Vendor condition: standard annual renewal notice; AI/data-use clause: standard data-processing and confidentiality restrictions.
- Risk lens: OCC/FFIEC operational resilience, GLBA safeguarding, BSA/AML evidence where customer or transaction data is in scope, and SR 11-7 model-risk expectations for AI-assisted decisions.

## Decision Implication

The program is eligible to continue only while value measurement remains tied to the named control and operating metrics. Any recommendation must cite the application id, initiative id, vendor exposure, and the dependency above. If any of those facts are unavailable in the live context layer, Sentinel should answer that it cannot complete the recommendation yet.

## Open Evidence Requests

- Confirm whether FCF-APP-ONLINE-ACCOUNT-OPENING has a tested rollback or parallel-run pattern.
- Reconcile FCF-APP-NICE-ACTIMIZE run cost to the latest finance allocation workbook.
- Attach latest ServiceNow change/problem records for the last two high-risk release windows.
- Confirm whether second-line risk has accepted the evidence basis for FCF-INIT-011.
