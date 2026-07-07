# Data governance and lineage attestation

Document type: Model risk committee note
Prepared for: SVP Wealth Technology
Evidence date: 2026-04-10
Primary system: FCF-APP-BRANCH-ATM-082 - First Capital Branch Atm Service 082
Owning team: TEAM-FCF-BRANCH
Related dependency: FCF-APP-CONTACT-CENTER-131
Vendor exposure: Kyndryl / $4,823,000 annual run-rate
Classification: confidential

## Situation

First Capital Branch Atm Service 082 is carried as a medium branch atm platform with $5,184,000 in FY25 run cost and a maintain modernization posture. The application is not a stand-alone decision: it sits in a dependency chain that includes FCF-APP-CONTACT-CENTER-131, Kyndryl, and the Branch and ATM Technology control owner group.

## Evidence Observed

- Current architecture: on_prem deployment with 78 cataloged upstream/downstream relationships.
- Program tie: FCF-INIT-008 - SAP S/4HANA finance future decision; committed funding $1,200,000, projected value $2,500,000, Sentinel posture Watch.
- Vendor condition: standard annual renewal notice; AI/data-use clause: standard data-processing and confidentiality restrictions.
- Risk lens: OCC/FFIEC operational resilience, GLBA safeguarding, BSA/AML evidence where customer or transaction data is in scope, and SR 11-7 model-risk expectations for AI-assisted decisions.

## Decision Implication

The program is eligible to continue only while value measurement remains tied to the named control and operating metrics. Any recommendation must cite the application id, initiative id, vendor exposure, and the dependency above. If any of those facts are unavailable in the live context layer, Sentinel should answer that it cannot complete the recommendation yet.

## Open Evidence Requests

- Confirm whether FCF-APP-CONTACT-CENTER-131 has a tested rollback or parallel-run pattern.
- Reconcile FCF-APP-BRANCH-ATM-082 run cost to the latest finance allocation workbook.
- Attach latest ServiceNow change/problem records for the last two high-risk release windows.
- Confirm whether second-line risk has accepted the evidence basis for FCF-INIT-008.
