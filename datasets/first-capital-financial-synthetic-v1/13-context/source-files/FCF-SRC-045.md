# FIS core API assessment

Document type: Operations review excerpt
Prepared for: SVP Client Service
Evidence date: 2026-10-16
Primary system: FCF-APP-COMMERCIAL-LENDING-136 - First Capital Commercial Lending Service 136
Owning team: TEAM-FCF-COMMLEND
Related dependency: FCF-APP-MUREX-TREASURY
Vendor exposure: Visa DPS / $2,545,000 annual run-rate
Classification: confidential

## Situation

First Capital Commercial Lending Service 136 is carried as a medium commercial lending platform with $6,182,000 in FY25 run cost and a retire modernization posture. The application is not a stand-alone decision: it sits in a dependency chain that includes FCF-APP-MUREX-TREASURY, Visa DPS, and the Digital Banking and Client Experience control owner group.

## Evidence Observed

- Current architecture: saas deployment with 36 cataloged upstream/downstream relationships.
- Program tie: FCF-INIT-CONTACT-SENTIMENT-V1 - Contact center sentiment AI v1; committed funding $2,400,000, projected value $800,000, Sentinel posture Kill.
- Vendor condition: 90-day module removal with transition support; AI/data-use clause: standard data-processing and confidentiality restrictions.
- Risk lens: OCC/FFIEC operational resilience, GLBA safeguarding, BSA/AML evidence where customer or transaction data is in scope, and SR 11-7 model-risk expectations for AI-assisted decisions.

## Decision Implication

The steering group should not treat committed spend as proof of value; adoption and control evidence are both weak. Any recommendation must cite the application id, initiative id, vendor exposure, and the dependency above. If any of those facts are unavailable in the live context layer, Sentinel should answer that it cannot complete the recommendation yet.

## Open Evidence Requests

- Confirm whether FCF-APP-MUREX-TREASURY has a tested rollback or parallel-run pattern.
- Reconcile FCF-APP-COMMERCIAL-LENDING-136 run cost to the latest finance allocation workbook.
- Attach latest ServiceNow change/problem records for the last two high-risk release windows.
- Confirm whether second-line risk has accepted the evidence basis for FCF-INIT-CONTACT-SENTIMENT-V1.
