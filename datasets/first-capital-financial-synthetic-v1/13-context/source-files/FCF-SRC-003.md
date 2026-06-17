# OCC MRA remediation status note

Document type: Regulatory remediation update
Prepared for: Chief Model Risk Officer
Evidence date: 2026-04-10
Primary system: FCF-APP-SAP-ECC - SAP ECC Finance and Procurement
Owning team: TEAM-FCF-ERP
Related dependency: FCF-APP-CONTACT-CENTER-107
Vendor exposure: NCR / $7,467,000 annual run-rate
Classification: confidential

## Situation

SAP ECC Finance and Procurement is carried as a critical erp finance platform with $10,300,000 in FY25 run cost and a migrate modernization posture. The application is not a stand-alone decision: it sits in a dependency chain that includes FCF-APP-CONTACT-CENTER-107, NCR, and the Enterprise Data and AI control owner group.

## Evidence Observed

- Current architecture: on_prem deployment with 88 cataloged upstream/downstream relationships.
- Program tie: FCF-INIT-016 - ServiceNow CMDB truth remediation; committed funding $7,528,000, projected value $14,420,000, Sentinel posture Watch.
- Vendor condition: standard annual renewal notice; AI/data-use clause: standard data-processing and confidentiality restrictions.
- Risk lens: OCC/FFIEC operational resilience, GLBA safeguarding, BSA/AML evidence where customer or transaction data is in scope, and SR 11-7 model-risk expectations for AI-assisted decisions.

## Decision Implication

The program is eligible to continue only while value measurement remains tied to the named control and operating metrics. Any recommendation must cite the application id, initiative id, vendor exposure, and the dependency above. If any of those facts are unavailable in the live context layer, Sentinel should answer that it cannot complete the recommendation yet.

## Open Evidence Requests

- Confirm whether FCF-APP-CONTACT-CENTER-107 has a tested rollback or parallel-run pattern.
- Reconcile FCF-APP-SAP-ECC run cost to the latest finance allocation workbook.
- Attach latest ServiceNow change/problem records for the last two high-risk release windows.
- Confirm whether second-line risk has accepted the evidence basis for FCF-INIT-016.
