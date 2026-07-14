# Cyber resilience board report

Document type: Data lineage attestation
Prepared for: CFO
Evidence date: 2026-05-13
Primary system: FCF-APP-CORE-BANKING-085 - First Capital Core Banking Service 085
Owning team: TEAM-FCF-CORE
Related dependency: FCF-APP-FINANCIAL-CRIMES-042
Vendor exposure: Q2 / $2,362,000 annual run-rate
Classification: confidential

## Situation

First Capital Core Banking Service 085 is carried as a medium core banking platform with $5,595,000 in FY25 run cost and a retire modernization posture. The application is not a stand-alone decision: it sits in a dependency chain that includes FCF-APP-FINANCIAL-CRIMES-042, Q2, and the Model Risk and Validation control owner group.

## Evidence Observed

- Current architecture: mainframe deployment with 15 cataloged upstream/downstream relationships.
- Program tie: FCF-INIT-013 - Model inventory evidence automation; committed funding $5,155,000, projected value $9,950,000, Sentinel posture Restructure.
- Vendor condition: standard annual renewal notice; AI/data-use clause: AI use requires prior written approval and audit evidence.
- Risk lens: OCC/FFIEC operational resilience, GLBA safeguarding, BSA/AML evidence where customer or transaction data is in scope, and SR 11-7 model-risk expectations for AI-assisted decisions.

## Decision Implication

The value case is credible, but the scope must be narrowed to the evidence-backed cohort before additional funding. Any recommendation must cite the application id, initiative id, vendor exposure, and the dependency above. If any of those facts are unavailable in the live context layer, Sentinel should answer that it cannot complete the recommendation yet.

## Open Evidence Requests

- Confirm whether FCF-APP-FINANCIAL-CRIMES-042 has a tested rollback or parallel-run pattern.
- Reconcile FCF-APP-CORE-BANKING-085 run cost to the latest finance allocation workbook.
- Attach latest ServiceNow change/problem records for the last two high-risk release windows.
- Confirm whether second-line risk has accepted the evidence basis for FCF-INIT-013.
