# SkyHarbor Customer Adoption Guide

## Purpose

SkyHarbor shows how AbarVa turns enterprise artifacts into a decision-intelligence context layer. The synthetic pack is not a fake demo; it is a rehearsal of the customer onboarding process.

## Replace synthetic inputs with real inputs

| Customer source | SkyHarbor template |
|---|---|
| ServiceNow CMDB | S03 mainframe/application inventory schema |
| IBM SOW / MSA / change orders | S06 IBM engagement schema |
| AWS account and service inventory | S04 AWS native estate schema |
| Jira / Azure DevOps | S02 modernization ledger and S07 initiative schema |
| Apptio / finance / value tracker | S13 value ledger and S14 KPI schema |
| Vendor repository / CLM | S08 vendor portfolio and S15 sourcing pipeline |
| DORA dashboards | S09 engineering productivity schema |
| Org roster | S10 GCC capability and S12 executive map |

## Process

1. Upload source artifacts.
2. Parse into intermediate outlines.
3. Validate against JSON schemas.
4. Approve records in the data-trust queue.
5. Build graph entities and edges.
6. Emit chunks with provenance.
7. Embed and load into Azure Postgres.
8. Run ground-truth verification.

## Pilot posture

Start with de-identified or synthetic records while security review runs. Replace records with approved production extracts as authorization expands. Synthetic rows are never silently promoted to customer truth; they are superseded with provenance.
