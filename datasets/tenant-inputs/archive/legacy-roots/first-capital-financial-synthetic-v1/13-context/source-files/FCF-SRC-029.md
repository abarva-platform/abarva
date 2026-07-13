# SAP ECC finance migration options

Document type: Cyber resilience evidence note
Prepared for: Chief Product Officer
Evidence date: 2026-06-16
Primary system: FCF-APP-COMMERCIAL-LENDING-088 - First Capital Commercial Lending Service 088
Owning team: TEAM-FCF-COMMLEND
Related dependency: FCF-APP-CORE-BANKING-133
Vendor exposure: Socure / $7,101,000 annual run-rate
Classification: confidential

## Situation

First Capital Commercial Lending Service 088 is carried as a medium commercial lending platform with $6,006,000 in FY25 run cost and a migrate modernization posture. The application is not a stand-alone decision: it sits in a dependency chain that includes FCF-APP-CORE-BANKING-133, Socure, and the Open Banking and API Products control owner group.

## Evidence Observed

- Current architecture: saas deployment with 36 cataloged upstream/downstream relationships.
- Program tie: FCF-INIT-018 - Debit-card disputes automation; committed funding $9,110,000, projected value $17,400,000, Sentinel posture Restructure.
- Vendor condition: standard annual renewal notice; AI/data-use clause: standard data-processing and confidentiality restrictions.
- Risk lens: OCC/FFIEC operational resilience, GLBA safeguarding, BSA/AML evidence where customer or transaction data is in scope, and SR 11-7 model-risk expectations for AI-assisted decisions.

## Decision Implication

The value case is credible, but the scope must be narrowed to the evidence-backed cohort before additional funding. Any recommendation must cite the application id, initiative id, vendor exposure, and the dependency above. If any of those facts are unavailable in the live context layer, Sentinel should answer that it cannot complete the recommendation yet.

## Open Evidence Requests

- Confirm whether FCF-APP-CORE-BANKING-133 has a tested rollback or parallel-run pattern.
- Reconcile FCF-APP-COMMERCIAL-LENDING-088 run cost to the latest finance allocation workbook.
- Attach latest ServiceNow change/problem records for the last two high-risk release windows.
- Confirm whether second-line risk has accepted the evidence basis for FCF-INIT-018.
