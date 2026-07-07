# CFO technology run-cost workbook excerpt

Document type: Model risk committee note
Prepared for: CISO
Evidence date: 2026-12-22
Primary system: FCF-APP-BRANCH-ATM-142 - First Capital Branch Atm Service 142
Owning team: TEAM-FCF-BRANCH
Related dependency: FCF-APP-ORACLE-EBS-REMNANTS
Vendor exposure: Kyndryl / $4,823,000 annual run-rate
Classification: confidential

## Situation

First Capital Branch Atm Service 142 is carried as a medium branch atm platform with $604,000 in FY25 run cost and a maintain modernization posture. The application is not a stand-alone decision: it sits in a dependency chain that includes FCF-APP-ORACLE-EBS-REMNANTS, Kyndryl, and the Enterprise Data and AI control owner group.

## Evidence Observed

- Current architecture: on_prem deployment with 78 cataloged upstream/downstream relationships.
- Program tie: FCF-INIT-012 - KYC beneficial ownership refresh; committed funding $4,364,000, projected value $8,460,000, Sentinel posture Healthy.
- Vendor condition: standard annual renewal notice; AI/data-use clause: standard data-processing and confidentiality restrictions.
- Risk lens: OCC/FFIEC operational resilience, GLBA safeguarding, BSA/AML evidence where customer or transaction data is in scope, and SR 11-7 model-risk expectations for AI-assisted decisions.

## Decision Implication

The program is eligible to continue only while value measurement remains tied to the named control and operating metrics. Any recommendation must cite the application id, initiative id, vendor exposure, and the dependency above. If any of those facts are unavailable in the live context layer, Sentinel should answer that it cannot complete the recommendation yet.

## Open Evidence Requests

- Confirm whether FCF-APP-ORACLE-EBS-REMNANTS has a tested rollback or parallel-run pattern.
- Reconcile FCF-APP-BRANCH-ATM-142 run cost to the latest finance allocation workbook.
- Attach latest ServiceNow change/problem records for the last two high-risk release windows.
- Confirm whether second-line risk has accepted the evidence basis for FCF-INIT-012.
