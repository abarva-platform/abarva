# Cyber resilience board report

Document type: Regulatory remediation update
Prepared for: Chief Compliance Officer
Evidence date: 2026-08-10
Primary system: FCF-APP-BRANCH-ATM-130 - First Capital Branch Atm Service 130
Owning team: TEAM-FCF-BRANCH
Related dependency: FCF-APP-NICE-ACTIMIZE
Vendor exposure: NCR / $7,467,000 annual run-rate
Classification: confidential

## Situation

First Capital Branch Atm Service 130 is carried as a medium branch atm platform with $5,360,000 in FY25 run cost and an invest modernization posture. The application is not a stand-alone decision: it sits in a dependency chain that includes FCF-APP-NICE-ACTIMIZE, NCR, and the Regulatory Remediation PMO control owner group.

## Evidence Observed

- Current architecture: on_prem deployment with 78 cataloged upstream/downstream relationships.
- Program tie: FCF-INIT-024 - SAS model-hosting rationalization; committed funding $13,856,000, projected value $26,340,000, Sentinel posture Watch.
- Vendor condition: standard annual renewal notice; AI/data-use clause: standard data-processing and confidentiality restrictions.
- Risk lens: OCC/FFIEC operational resilience, GLBA safeguarding, BSA/AML evidence where customer or transaction data is in scope, and SR 11-7 model-risk expectations for AI-assisted decisions.

## Decision Implication

The program is eligible to continue only while value measurement remains tied to the named control and operating metrics. Any recommendation must cite the application id, initiative id, vendor exposure, and the dependency above. If any of those facts are unavailable in the live context layer, Sentinel should answer that it cannot complete the recommendation yet.

## Open Evidence Requests

- Confirm whether FCF-APP-NICE-ACTIMIZE has a tested rollback or parallel-run pattern.
- Reconcile FCF-APP-BRANCH-ATM-130 run cost to the latest finance allocation workbook.
- Attach latest ServiceNow change/problem records for the last two high-risk release windows.
- Confirm whether second-line risk has accepted the evidence basis for FCF-INIT-024.
