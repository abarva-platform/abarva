# FIS core API assessment

Document type: Board technology appendix
Prepared for: CFO
Evidence date: 2026-01-13
Primary system: FCF-APP-FIS-HORIZON - FIS Horizon Core Deposits
Owning team: TEAM-FCF-CORE
Related dependency: FCF-APP-BRANCH-ATM-154
Vendor exposure: FIS / $38,000,000 annual run-rate
Classification: pci_pii_confidential

## Situation

FIS Horizon Core Deposits is carried as a critical core banking platform with $18,500,000 in FY25 run cost and a maintain modernization posture. The application is not a stand-alone decision: it sits in a dependency chain that includes FCF-APP-BRANCH-ATM-154, FIS, and the Branch and ATM Technology control owner group.

## Evidence Observed

- Current architecture: mainframe deployment with 142 cataloged upstream/downstream relationships.
- Program tie: FCF-INIT-013 - Model inventory evidence automation; committed funding $5,155,000, projected value $9,950,000, Sentinel posture Restructure.
- Vendor condition: 180-day core transition; termination assistance capped at 12 months; AI/data-use clause: requires model-risk approval for generated code.
- Risk lens: OCC/FFIEC operational resilience, GLBA safeguarding, BSA/AML evidence where customer or transaction data is in scope, and SR 11-7 model-risk expectations for AI-assisted decisions.

## Decision Implication

The value case is credible, but the scope must be narrowed to the evidence-backed cohort before additional funding. Any recommendation must cite the application id, initiative id, vendor exposure, and the dependency above. If any of those facts are unavailable in the live context layer, Sentinel should answer that it cannot complete the recommendation yet.

## Open Evidence Requests

- Confirm whether FCF-APP-BRANCH-ATM-154 has a tested rollback or parallel-run pattern.
- Reconcile FCF-APP-FIS-HORIZON run cost to the latest finance allocation workbook.
- Attach latest ServiceNow change/problem records for the last two high-risk release windows.
- Confirm whether second-line risk has accepted the evidence basis for FCF-INIT-013.
