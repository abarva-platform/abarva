# FIS core API assessment

Document type: Operations review excerpt
Prepared for: CISO
Evidence date: 2026-04-22
Primary system: FCF-APP-BRANCH-ATM-046 - First Capital Branch Atm Service 046
Owning team: TEAM-FCF-BRANCH
Related dependency: FCF-APP-CONTACT-CENTER-119
Vendor exposure: Visa DPS / $2,545,000 annual run-rate
Classification: confidential

## Situation

First Capital Branch Atm Service 046 is carried as a medium branch atm platform with $6,652,000 in FY25 run cost and a maintain modernization posture. The application is not a stand-alone decision: it sits in a dependency chain that includes FCF-APP-CONTACT-CENTER-119, Visa DPS, and the Cybersecurity and IAM control owner group.

## Evidence Observed

- Current architecture: on_prem deployment with 78 cataloged upstream/downstream relationships.
- Program tie: FCF-INIT-012 - KYC beneficial ownership refresh; committed funding $4,364,000, projected value $8,460,000, Sentinel posture Healthy.
- Vendor condition: 90-day module removal with transition support; AI/data-use clause: standard data-processing and confidentiality restrictions.
- Risk lens: OCC/FFIEC operational resilience, GLBA safeguarding, BSA/AML evidence where customer or transaction data is in scope, and SR 11-7 model-risk expectations for AI-assisted decisions.

## Decision Implication

The program is eligible to continue only while value measurement remains tied to the named control and operating metrics. Any recommendation must cite the application id, initiative id, vendor exposure, and the dependency above. If any of those facts are unavailable in the live context layer, Sentinel should answer that it cannot complete the recommendation yet.

## Open Evidence Requests

- Confirm whether FCF-APP-CONTACT-CENTER-119 has a tested rollback or parallel-run pattern.
- Reconcile FCF-APP-BRANCH-ATM-046 run cost to the latest finance allocation workbook.
- Attach latest ServiceNow change/problem records for the last two high-risk release windows.
- Confirm whether second-line risk has accepted the evidence basis for FCF-INIT-012.
