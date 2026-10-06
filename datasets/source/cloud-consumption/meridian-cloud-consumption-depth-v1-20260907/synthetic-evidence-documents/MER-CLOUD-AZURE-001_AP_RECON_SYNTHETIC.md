# MER-CLOUD-AZURE-001 AP RECON

Synthetic demo evidence. Tenant: meridian-health. Dataset: meridian-cloud-consumption-depth-v1-20260907.

Vendor: Microsoft Corporation
Contract: MER-CLOUD-AZURE-001
Document type: AP invoice reconciliation

## What this file is meant to prove
This synthetic file mimics the client-owned source evidence for AP invoice reconciliation. It is not client truth and must not be used as finance-confirmed value.

## Example extracted fields
- Source file id: DOC-MER-CLOUD-AZURE-001-AP-INVOICES
- Expected layer: source.contract_financial_exposure
- Synthetic policy: synthetic_demo_only_not_client_truth
- Related contract value: $16,200,000

## Example action context
- OPT-AZURE-RESERVATION-001: Reserve steady Azure VM and SQL capacity for analytics workloads. Candidate amount: $430,000. Finance state: not_confirmed.
- OPT-AZURE-SYNAPSE-SCHEDULE-001: Schedule non-production analytics pools and retire idle storage attached to old reporting jobs. Candidate amount: $275,000. Finance state: not_confirmed.
- OPT-AZURE-TAG-COVERAGE-001: Close owner and application tag gaps before making business-unit savings claims. Candidate amount: $0. Finance state: not_confirmed.

## Parser notes
The governed loader should preserve source_file_id, contract_id, vendor_ref, source section, row grain, source basis, and synthetic policy. Product pages may cite this file only as synthetic demo evidence.
