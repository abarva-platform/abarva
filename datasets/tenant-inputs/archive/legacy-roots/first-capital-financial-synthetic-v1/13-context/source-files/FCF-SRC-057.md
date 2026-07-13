# Data governance and lineage attestation

Document type: Model risk committee note
Prepared for: SVP Wealth Technology
Evidence date: 2026-10-04
Primary system: FCF-APP-COMMERCIAL-LENDING-172 - First Capital Commercial Lending Service 172
Owning team: TEAM-FCF-COMMLEND
Related dependency: FCF-APP-ERP-FINANCE-021
Vendor exposure: Kyndryl / $4,823,000 annual run-rate
Classification: confidential

## Situation

First Capital Commercial Lending Service 172 is carried as a medium commercial lending platform with $4,714,000 in FY25 run cost and a maintain modernization posture. The application is not a stand-alone decision: it sits in a dependency chain that includes FCF-APP-ERP-FINANCE-021, Kyndryl, and the Wealth and Private Bank Technology control owner group.

## Evidence Observed

- Current architecture: saas deployment with 36 cataloged upstream/downstream relationships.
- Program tie: FCF-INIT-030 - Payment exceptions workflow modernization; committed funding $4,802,000, projected value $3,280,000, Sentinel posture Healthy.
- Vendor condition: standard annual renewal notice; AI/data-use clause: standard data-processing and confidentiality restrictions.
- Risk lens: OCC/FFIEC operational resilience, GLBA safeguarding, BSA/AML evidence where customer or transaction data is in scope, and SR 11-7 model-risk expectations for AI-assisted decisions.

## Decision Implication

The program is eligible to continue only while value measurement remains tied to the named control and operating metrics. Any recommendation must cite the application id, initiative id, vendor exposure, and the dependency above. If any of those facts are unavailable in the live context layer, Sentinel should answer that it cannot complete the recommendation yet.

## Open Evidence Requests

- Confirm whether FCF-APP-ERP-FINANCE-021 has a tested rollback or parallel-run pattern.
- Reconcile FCF-APP-COMMERCIAL-LENDING-172 run cost to the latest finance allocation workbook.
- Attach latest ServiceNow change/problem records for the last two high-risk release windows.
- Confirm whether second-line risk has accepted the evidence basis for FCF-INIT-030.
