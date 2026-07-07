# BSA AML consent-order progress pack

Document type: Operations review excerpt
Prepared for: EVP Technology Operations
Evidence date: 2026-06-16
Primary system: FCF-APP-ONLINE-ACCOUNT-OPENING - Digital Account Opening
Owning team: TEAM-FCF-DIGITAL
Related dependency: FCF-APP-CORE-BANKING-109
Vendor exposure: Visa DPS / $2,545,000 annual run-rate
Classification: pii_confidential

## Situation

Digital Account Opening is carried as a critical digital banking platform with $4,300,000 in FY25 run cost and a restructure modernization posture. The application is not a stand-alone decision: it sits in a dependency chain that includes FCF-APP-CORE-BANKING-109, Visa DPS, and the Branch and ATM Technology control owner group.

## Evidence Observed

- Current architecture: hybrid deployment with 70 cataloged upstream/downstream relationships.
- Program tie: FCF-INIT-026 - Client complaint root-cause analytics; committed funding $1,638,000, projected value $29,320,000, Sentinel posture Healthy.
- Vendor condition: 90-day module removal with transition support; AI/data-use clause: standard data-processing and confidentiality restrictions.
- Risk lens: OCC/FFIEC operational resilience, GLBA safeguarding, BSA/AML evidence where customer or transaction data is in scope, and SR 11-7 model-risk expectations for AI-assisted decisions.

## Decision Implication

The program is eligible to continue only while value measurement remains tied to the named control and operating metrics. Any recommendation must cite the application id, initiative id, vendor exposure, and the dependency above. If any of those facts are unavailable in the live context layer, Sentinel should answer that it cannot complete the recommendation yet.

## Open Evidence Requests

- Confirm whether FCF-APP-CORE-BANKING-109 has a tested rollback or parallel-run pattern.
- Reconcile FCF-APP-ONLINE-ACCOUNT-OPENING run cost to the latest finance allocation workbook.
- Attach latest ServiceNow change/problem records for the last two high-risk release windows.
- Confirm whether second-line risk has accepted the evidence basis for FCF-INIT-026.
