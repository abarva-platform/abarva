# CFO technology run-cost workbook excerpt

Document type: Model risk committee note
Prepared for: CIO
Evidence date: 2026-06-04
Primary system: FCF-APP-COMMERCIAL-LENDING-052 - First Capital Commercial Lending Service 052
Owning team: TEAM-FCF-COMMLEND
Related dependency: FCF-APP-CORE-BANKING-121
Vendor exposure: Kyndryl / $4,823,000 annual run-rate
Classification: confidential

## Situation

First Capital Commercial Lending Service 052 is carried as a medium commercial lending platform with $1,074,000 in FY25 run cost and a maintain modernization posture. The application is not a stand-alone decision: it sits in a dependency chain that includes FCF-APP-CORE-BANKING-121, Kyndryl, and the Model Risk and Validation control owner group.

## Evidence Observed

- Current architecture: saas deployment with 36 cataloged upstream/downstream relationships.
- Program tie: FCF-INIT-022 - Vendor AI indemnity clause refresh; committed funding $12,274,000, projected value $23,360,000, Sentinel posture Healthy.
- Vendor condition: standard annual renewal notice; AI/data-use clause: standard data-processing and confidentiality restrictions.
- Risk lens: OCC/FFIEC operational resilience, GLBA safeguarding, BSA/AML evidence where customer or transaction data is in scope, and SR 11-7 model-risk expectations for AI-assisted decisions.

## Decision Implication

The program is eligible to continue only while value measurement remains tied to the named control and operating metrics. Any recommendation must cite the application id, initiative id, vendor exposure, and the dependency above. If any of those facts are unavailable in the live context layer, Sentinel should answer that it cannot complete the recommendation yet.

## Open Evidence Requests

- Confirm whether FCF-APP-CORE-BANKING-121 has a tested rollback or parallel-run pattern.
- Reconcile FCF-APP-COMMERCIAL-LENDING-052 run cost to the latest finance allocation workbook.
- Attach latest ServiceNow change/problem records for the last two high-risk release windows.
- Confirm whether second-line risk has accepted the evidence basis for FCF-INIT-022.
