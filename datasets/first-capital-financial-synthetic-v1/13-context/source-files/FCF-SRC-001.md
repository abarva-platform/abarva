# CIO core modernization decision memo

Document type: Executive decision memo
Prepared for: CIO
Evidence date: 2026-02-04
Primary system: FCF-APP-FEDNOW-RTP - FedNow and RTP Gateway
Owning team: TEAM-FCF-PAYMENTS
Related dependency: FCF-APP-ERP-FINANCE-105
Vendor exposure: ACI Worldwide / $8,600,000 annual run-rate
Classification: pci_confidential

## Situation

FedNow and RTP Gateway is carried as a critical payments platform with $6,400,000 in FY25 run cost and an invest modernization posture. The application is not a stand-alone decision: it sits in a dependency chain that includes FCF-APP-ERP-FINANCE-105, ACI Worldwide, and the Digital Banking and Client Experience control owner group.

## Evidence Observed

- Current architecture: cloud deployment with 62 cataloged upstream/downstream relationships.
- Program tie: FCF-INIT-CORE-BANKING-FUTURE - Core banking future decision; committed funding $14,000,000, projected value $0, Sentinel posture Hold.
- Vendor condition: FedNow module removal after stabilization; AI/data-use clause: AI-generated payment rules prohibited.
- Risk lens: OCC/FFIEC operational resilience, GLBA safeguarding, BSA/AML evidence where customer or transaction data is in scope, and SR 11-7 model-risk expectations for AI-assisted decisions.

## Decision Implication

The decision is blocked until migration sequencing, regulator-facing remediation evidence, and fallback operating procedures are explicit. Any recommendation must cite the application id, initiative id, vendor exposure, and the dependency above. If any of those facts are unavailable in the live context layer, Sentinel should answer that it cannot complete the recommendation yet.

## Open Evidence Requests

- Confirm whether FCF-APP-ERP-FINANCE-105 has a tested rollback or parallel-run pattern.
- Reconcile FCF-APP-FEDNOW-RTP run cost to the latest finance allocation workbook.
- Attach latest ServiceNow change/problem records for the last two high-risk release windows.
- Confirm whether second-line risk has accepted the evidence basis for FCF-INIT-CORE-BANKING-FUTURE.
