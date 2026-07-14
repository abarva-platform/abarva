# Wealth advisor supervision memo

Document type: Cyber resilience evidence note
Prepared for: SVP Payments Technology
Evidence date: 2026-04-22
Primary system: FCF-APP-BRANCH-ATM-118 - First Capital Branch Atm Service 118
Owning team: TEAM-FCF-BRANCH
Related dependency: FCF-APP-FEDWIRE-ACH
Vendor exposure: Socure / $7,101,000 annual run-rate
Classification: confidential

## Situation

First Capital Branch Atm Service 118 is carried as a medium branch atm platform with $3,716,000 in FY25 run cost and a maintain modernization posture. The application is not a stand-alone decision: it sits in a dependency chain that includes FCF-APP-FEDWIRE-ACH, Socure, and the Model Risk and Validation control owner group.

## Evidence Observed

- Current architecture: on_prem deployment with 78 cataloged upstream/downstream relationships.
- Program tie: FCF-INIT-FEDNOW-RTP-MODERNIZATION - FedNow and RTP modernization; committed funding $18,600,000, projected value $42,000,000, Sentinel posture Restructure.
- Vendor condition: standard annual renewal notice; AI/data-use clause: standard data-processing and confidentiality restrictions.
- Risk lens: OCC/FFIEC operational resilience, GLBA safeguarding, BSA/AML evidence where customer or transaction data is in scope, and SR 11-7 model-risk expectations for AI-assisted decisions.

## Decision Implication

The value case is credible, but the scope must be narrowed to the evidence-backed cohort before additional funding. Any recommendation must cite the application id, initiative id, vendor exposure, and the dependency above. If any of those facts are unavailable in the live context layer, Sentinel should answer that it cannot complete the recommendation yet.

## Open Evidence Requests

- Confirm whether FCF-APP-FEDWIRE-ACH has a tested rollback or parallel-run pattern.
- Reconcile FCF-APP-BRANCH-ATM-118 run cost to the latest finance allocation workbook.
- Attach latest ServiceNow change/problem records for the last two high-risk release windows.
- Confirm whether second-line risk has accepted the evidence basis for FCF-INIT-FEDNOW-RTP-MODERNIZATION.
