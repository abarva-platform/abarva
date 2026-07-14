# Wealth advisor supervision memo

Document type: Cyber resilience evidence note
Prepared for: SVP Retail Bank Ops
Evidence date: 2026-10-04
Primary system: FCF-APP-COMMERCIAL-LENDING-028 - First Capital Commercial Lending Service 028
Owning team: TEAM-FCF-COMMLEND
Related dependency: FCF-APP-WEALTH-113
Vendor exposure: Socure / $7,101,000 annual run-rate
Classification: confidential

## Situation

First Capital Commercial Lending Service 028 is carried as a medium commercial lending platform with $4,186,000 in FY25 run cost and a restructure modernization posture. The application is not a stand-alone decision: it sits in a dependency chain that includes FCF-APP-WEALTH-113, Socure, and the Engineering Productivity Office control owner group.

## Evidence Observed

- Current architecture: saas deployment with 36 cataloged upstream/downstream relationships.
- Program tie: FCF-INIT-014 - M365 Copilot controlled rollout; committed funding $5,946,000, projected value $11,440,000, Sentinel posture Healthy.
- Vendor condition: standard annual renewal notice; AI/data-use clause: standard data-processing and confidentiality restrictions.
- Risk lens: OCC/FFIEC operational resilience, GLBA safeguarding, BSA/AML evidence where customer or transaction data is in scope, and SR 11-7 model-risk expectations for AI-assisted decisions.

## Decision Implication

The program is eligible to continue only while value measurement remains tied to the named control and operating metrics. Any recommendation must cite the application id, initiative id, vendor exposure, and the dependency above. If any of those facts are unavailable in the live context layer, Sentinel should answer that it cannot complete the recommendation yet.

## Open Evidence Requests

- Confirm whether FCF-APP-WEALTH-113 has a tested rollback or parallel-run pattern.
- Reconcile FCF-APP-COMMERCIAL-LENDING-028 run cost to the latest finance allocation workbook.
- Attach latest ServiceNow change/problem records for the last two high-risk release windows.
- Confirm whether second-line risk has accepted the evidence basis for FCF-INIT-014.
