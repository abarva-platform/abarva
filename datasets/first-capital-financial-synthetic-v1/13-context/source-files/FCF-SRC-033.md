# OCC MRA remediation status note

Document type: Regulatory remediation update
Prepared for: CIO
Evidence date: 2026-10-04
Primary system: FCF-APP-COMMERCIAL-LENDING-100 - First Capital Commercial Lending Service 100
Owning team: TEAM-FCF-COMMLEND
Related dependency: FCF-APP-ERP-FINANCE-177
Vendor exposure: NCR / $7,467,000 annual run-rate
Classification: confidential

## Situation

First Capital Commercial Lending Service 100 is carried as a medium commercial lending platform with $1,250,000 in FY25 run cost and an invest modernization posture. The application is not a stand-alone decision: it sits in a dependency chain that includes FCF-APP-ERP-FINANCE-177, NCR, and the Core Banking Platforms control owner group.

## Evidence Observed

- Current architecture: saas deployment with 36 cataloged upstream/downstream relationships.
- Program tie: FCF-INIT-CORE-BANKING-FUTURE - Core banking future decision; committed funding $14,000,000, projected value $0, Sentinel posture Hold.
- Vendor condition: standard annual renewal notice; AI/data-use clause: standard data-processing and confidentiality restrictions.
- Risk lens: OCC/FFIEC operational resilience, GLBA safeguarding, BSA/AML evidence where customer or transaction data is in scope, and SR 11-7 model-risk expectations for AI-assisted decisions.

## Decision Implication

The decision is blocked until migration sequencing, regulator-facing remediation evidence, and fallback operating procedures are explicit. Any recommendation must cite the application id, initiative id, vendor exposure, and the dependency above. If any of those facts are unavailable in the live context layer, Sentinel should answer that it cannot complete the recommendation yet.

## Open Evidence Requests

- Confirm whether FCF-APP-ERP-FINANCE-177 has a tested rollback or parallel-run pattern.
- Reconcile FCF-APP-COMMERCIAL-LENDING-100 run cost to the latest finance allocation workbook.
- Attach latest ServiceNow change/problem records for the last two high-risk release windows.
- Confirm whether second-line risk has accepted the evidence basis for FCF-INIT-CORE-BANKING-FUTURE.
