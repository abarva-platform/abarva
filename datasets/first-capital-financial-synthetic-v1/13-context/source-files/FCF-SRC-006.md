# Digital account-opening abandonment analysis

Document type: Vendor renewal brief
Prepared for: Chief Risk Officer
Evidence date: 2026-07-19
Primary system: FCF-APP-SPLUNK - Splunk Enterprise Security
Owning team: TEAM-FCF-CYBER
Related dependency: FCF-APP-CROWDSTRIKE
Vendor exposure: Tableau / $7,284,000 annual run-rate
Classification: restricted

## Situation

Splunk Enterprise Security is carried as a critical security platform with $6,100,000 in FY25 run cost and a maintain modernization posture. The application is not a stand-alone decision: it sits in a dependency chain that includes FCF-APP-CROWDSTRIKE, Tableau, and the Model Risk and Validation control owner group.

## Evidence Observed

- Current architecture: hybrid deployment with 69 cataloged upstream/downstream relationships.
- Program tie: FCF-INIT-031 - Customer 360 consent and preference hub; committed funding $5,593,000, projected value $4,770,000, Sentinel posture Healthy.
- Vendor condition: standard annual renewal notice; AI/data-use clause: standard data-processing and confidentiality restrictions.
- Risk lens: OCC/FFIEC operational resilience, GLBA safeguarding, BSA/AML evidence where customer or transaction data is in scope, and SR 11-7 model-risk expectations for AI-assisted decisions.

## Decision Implication

The program is eligible to continue only while value measurement remains tied to the named control and operating metrics. Any recommendation must cite the application id, initiative id, vendor exposure, and the dependency above. If any of those facts are unavailable in the live context layer, Sentinel should answer that it cannot complete the recommendation yet.

## Open Evidence Requests

- Confirm whether FCF-APP-CROWDSTRIKE has a tested rollback or parallel-run pattern.
- Reconcile FCF-APP-SPLUNK run cost to the latest finance allocation workbook.
- Attach latest ServiceNow change/problem records for the last two high-risk release windows.
- Confirm whether second-line risk has accepted the evidence basis for FCF-INIT-031.
