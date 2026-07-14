# Digital account-opening abandonment analysis

Document type: Executive decision memo
Prepared for: Chief Data and Analytics Officer
Evidence date: 2026-10-16
Primary system: FCF-APP-COMMERCIAL-LENDING-064 - First Capital Commercial Lending Service 064
Owning team: TEAM-FCF-COMMLEND
Related dependency: FCF-APP-WEALTH-125
Vendor exposure: ACI Worldwide / $8,600,000 annual run-rate
Classification: confidential

## Situation

First Capital Commercial Lending Service 064 is carried as a medium commercial lending platform with $2,718,000 in FY25 run cost and a maintain modernization posture. The application is not a stand-alone decision: it sits in a dependency chain that includes FCF-APP-WEALTH-125, ACI Worldwide, and the Regulatory Remediation PMO control owner group.

## Evidence Observed

- Current architecture: saas deployment with 36 cataloged upstream/downstream relationships.
- Program tie: FCF-INIT-010 - Commercial credit memo automation; committed funding $2,782,000, projected value $5,480,000, Sentinel posture Healthy.
- Vendor condition: FedNow module removal after stabilization; AI/data-use clause: AI-generated payment rules prohibited.
- Risk lens: OCC/FFIEC operational resilience, GLBA safeguarding, BSA/AML evidence where customer or transaction data is in scope, and SR 11-7 model-risk expectations for AI-assisted decisions.

## Decision Implication

The program is eligible to continue only while value measurement remains tied to the named control and operating metrics. Any recommendation must cite the application id, initiative id, vendor exposure, and the dependency above. If any of those facts are unavailable in the live context layer, Sentinel should answer that it cannot complete the recommendation yet.

## Open Evidence Requests

- Confirm whether FCF-APP-WEALTH-125 has a tested rollback or parallel-run pattern.
- Reconcile FCF-APP-COMMERCIAL-LENDING-064 run cost to the latest finance allocation workbook.
- Attach latest ServiceNow change/problem records for the last two high-risk release windows.
- Confirm whether second-line risk has accepted the evidence basis for FCF-INIT-010.
