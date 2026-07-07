# CFO technology run-cost workbook excerpt

Document type: Finance workbook narrative
Prepared for: SVP Retail Bank Ops
Evidence date: 2026-09-01
Primary system: FCF-APP-CORE-BANKING-097 - First Capital Core Banking Service 097
Owning team: TEAM-FCF-CORE
Related dependency: FCF-APP-PAYMENTS-086
Vendor exposure: Workday / $2,728,000 annual run-rate
Classification: confidential

## Situation

First Capital Core Banking Service 097 is carried as a medium core banking platform with $839,000 in FY25 run cost and a maintain modernization posture. The application is not a stand-alone decision: it sits in a dependency chain that includes FCF-APP-PAYMENTS-086, Workday, and the Regulatory Remediation PMO control owner group.

## Evidence Observed

- Current architecture: mainframe deployment with 15 cataloged upstream/downstream relationships.
- Program tie: FCF-INIT-BRANCH-VISION-AI - Branch queue vision AI pilot; committed funding $1,900,000, projected value $600,000, Sentinel posture Kill.
- Vendor condition: standard annual renewal notice; AI/data-use clause: standard data-processing and confidentiality restrictions.
- Risk lens: OCC/FFIEC operational resilience, GLBA safeguarding, BSA/AML evidence where customer or transaction data is in scope, and SR 11-7 model-risk expectations for AI-assisted decisions.

## Decision Implication

The steering group should not treat committed spend as proof of value; adoption and control evidence are both weak. Any recommendation must cite the application id, initiative id, vendor exposure, and the dependency above. If any of those facts are unavailable in the live context layer, Sentinel should answer that it cannot complete the recommendation yet.

## Open Evidence Requests

- Confirm whether FCF-APP-PAYMENTS-086 has a tested rollback or parallel-run pattern.
- Reconcile FCF-APP-CORE-BANKING-097 run cost to the latest finance allocation workbook.
- Attach latest ServiceNow change/problem records for the last two high-risk release windows.
- Confirm whether second-line risk has accepted the evidence basis for FCF-INIT-BRANCH-VISION-AI.
