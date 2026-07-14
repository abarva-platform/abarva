# Vendor concentration risk register

Document type: Operations review excerpt
Prepared for: SVP Wealth Technology
Evidence date: 2026-02-04
Primary system: FCF-APP-COMMERCIAL-LENDING-076 - First Capital Commercial Lending Service 076
Owning team: TEAM-FCF-COMMLEND
Related dependency: FCF-APP-ERP-FINANCE-129
Vendor exposure: Visa DPS / $2,545,000 annual run-rate
Classification: confidential

## Situation

First Capital Commercial Lending Service 076 is carried as a medium commercial lending platform with $4,362,000 in FY25 run cost and a maintain modernization posture. The application is not a stand-alone decision: it sits in a dependency chain that includes FCF-APP-ERP-FINANCE-129, Visa DPS, and the Enterprise Data and AI control owner group.

## Evidence Observed

- Current architecture: saas deployment with 36 cataloged upstream/downstream relationships.
- Program tie: FCF-INIT-030 - Payment exceptions workflow modernization; committed funding $4,802,000, projected value $3,280,000, Sentinel posture Healthy.
- Vendor condition: 90-day module removal with transition support; AI/data-use clause: standard data-processing and confidentiality restrictions.
- Risk lens: OCC/FFIEC operational resilience, GLBA safeguarding, BSA/AML evidence where customer or transaction data is in scope, and SR 11-7 model-risk expectations for AI-assisted decisions.

## Decision Implication

The program is eligible to continue only while value measurement remains tied to the named control and operating metrics. Any recommendation must cite the application id, initiative id, vendor exposure, and the dependency above. If any of those facts are unavailable in the live context layer, Sentinel should answer that it cannot complete the recommendation yet.

## Open Evidence Requests

- Confirm whether FCF-APP-ERP-FINANCE-129 has a tested rollback or parallel-run pattern.
- Reconcile FCF-APP-COMMERCIAL-LENDING-076 run cost to the latest finance allocation workbook.
- Attach latest ServiceNow change/problem records for the last two high-risk release windows.
- Confirm whether second-line risk has accepted the evidence basis for FCF-INIT-030.
