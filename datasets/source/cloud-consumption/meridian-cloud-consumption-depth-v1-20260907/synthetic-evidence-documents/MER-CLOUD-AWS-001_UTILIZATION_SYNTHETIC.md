# MER-CLOUD-AWS-001 UTILIZATION

Synthetic demo evidence. Tenant: meridian-health. Dataset: meridian-cloud-consumption-depth-v1-20260907.

Vendor: Amazon Web Services, Inc.
Contract: MER-CLOUD-AWS-001
Document type: CloudWatch and Compute Optimizer export

## What this file is meant to prove
This synthetic file mimics the client-owned source evidence for CloudWatch and Compute Optimizer export. It is not client truth and must not be used as finance-confirmed value.

## Example extracted fields
- Source file id: DOC-MER-CLOUD-AWS-001-CLOUDWATCH
- Expected layer: source.contract_operational_performance
- Synthetic policy: synthetic_demo_only_not_client_truth
- Related contract value: $23,400,000

## Example action context
- OPT-AWS-COMMIT-STEPUP-001: Convert persistent EC2 and RDS workloads from on-demand into committed-use coverage. Candidate amount: $620,000. Finance state: not_confirmed.
- OPT-AWS-RIGHTSIZE-001: Downsize low-utilization production compute after owner validation. Candidate amount: $410,000. Finance state: not_confirmed.
- OPT-AWS-EGRESS-001: Reduce avoidable cross-region and internet data-transfer charges on patient digital workloads. Candidate amount: $185,000. Finance state: not_confirmed.
- OPT-AWS-SUPPORT-TIER-001: Review enterprise support tier charges against actual support usage and escalation profile. Candidate amount: $240,000. Finance state: not_confirmed.
- OPT-CLOUD-AP-RECON-001: Keep billing export and AP-paid invoice reconciliation matched before any savings claim. Candidate amount: $0. Finance state: not_confirmed.

## Parser notes
The governed loader should preserve source_file_id, contract_id, vendor_ref, source section, row grain, source basis, and synthetic policy. Product pages may cite this file only as synthetic demo evidence.
