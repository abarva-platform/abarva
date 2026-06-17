# Model risk management committee minutes

Document type: Vendor renewal brief
Prepared for: SVP Wealth Technology
Evidence date: 2026-03-07
Primary system: FCF-APP-DATA-PLATFORM-079 - First Capital Data Platform Service 079
Owning team: TEAM-FCF-DATA
Related dependency: FCF-APP-COMMERCIAL-LENDING-040
Vendor exposure: Tableau / $7,284,000 annual run-rate
Classification: confidential

## Situation

First Capital Data Platform Service 079 is carried as a medium data platform platform with $4,773,000 in FY25 run cost and a maintain modernization posture. The application is not a stand-alone decision: it sits in a dependency chain that includes FCF-APP-COMMERCIAL-LENDING-040, Tableau, and the Cybersecurity and IAM control owner group.

## Evidence Observed

- Current architecture: cloud deployment with 57 cataloged upstream/downstream relationships.
- Program tie: FCF-INIT-WEALTH-COPILOT-SHADOW - Wealth advisor copilot shadow rollout; committed funding $3,100,000, projected value $1,700,000, Sentinel posture Kill.
- Vendor condition: standard annual renewal notice; AI/data-use clause: standard data-processing and confidentiality restrictions.
- Risk lens: OCC/FFIEC operational resilience, GLBA safeguarding, BSA/AML evidence where customer or transaction data is in scope, and SR 11-7 model-risk expectations for AI-assisted decisions.

## Decision Implication

The steering group should not treat committed spend as proof of value; adoption and control evidence are both weak. Any recommendation must cite the application id, initiative id, vendor exposure, and the dependency above. If any of those facts are unavailable in the live context layer, Sentinel should answer that it cannot complete the recommendation yet.

## Open Evidence Requests

- Confirm whether FCF-APP-COMMERCIAL-LENDING-040 has a tested rollback or parallel-run pattern.
- Reconcile FCF-APP-DATA-PLATFORM-079 run cost to the latest finance allocation workbook.
- Attach latest ServiceNow change/problem records for the last two high-risk release windows.
- Confirm whether second-line risk has accepted the evidence basis for FCF-INIT-WEALTH-COPILOT-SHADOW.
