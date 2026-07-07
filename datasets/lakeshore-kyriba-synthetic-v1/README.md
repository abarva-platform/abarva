# Lakeshore Kyriba Synthetic Evidence Pack v1

Generated: 2026-06-14

This pack is synthetic demo data. It contains no real client confidential data.

## Purpose

This dataset supports the Surekha Kyriba proof:

1. load realistic client-provided evidence,
2. show how volumetrics, architecture, CMDB, integration topology, controls, and cost baselines change the decision pattern layer,
3. generate a real Source RFP / scoring / cost / risk package from those inputs, and
4. show an evidence to pattern to output-change trace.

## Files

Every `.xlsx` workbook includes a first tab named `Instructions + Masking`
that explains how the synthetic data was generated, what a real client can
provide, and what sensitive fields should be masked or excluded.

The data itself includes masked-value examples where useful: masked account
references, routing references, endpoint/path references, CMDB host/IP fields,
certificate references, credential references, and contract references.

| File | Real-world provider | Plane | What it proves |
|---|---|---|---|
| `00_upload_instructions_and_sensitivity.md` | AbarVa Steward | Demo guidance | Buyer-facing upload guidance for useful fields, masking rules, and sensitive exclusions. |
| `01_treasury_volume_baseline.xlsx` | Treasurer / Treasury Ops | Enterprise context | Entity, bank account, payment, and reconciliation volume drive rollout complexity. |
| `02_bank_connectivity_inventory.xlsx` | Treasury Ops / bank relationship owners | Enterprise context | Bank formats, onboarding waves, certificates, and testing change the RFP and cost. |
| `03_erp_feed_landscape.xlsx` | CIO ERP / finance systems owners | Enterprise context | ERP heterogeneity drives integration, reconciliation, and data-quality effort. |
| `04_cmdb_application_portfolio.csv` | ServiceNow / EA CMDB export | Enterprise context | The system landscape and owners are current-state facts. |
| `05_current_state_architecture.md` | Enterprise architecture | Event evidence / review required | Architecture context for sourcing, reviewed before current-state promotion. |
| `06_api_file_transfer_landscape.csv` | Integration/platform team | Enterprise context | API, SFTP, file, and identity edges drive technical scope. |
| `07_treasury_controls_matrix.xlsx` | Treasury controls / audit | Enterprise context | Dual control, callback, variance, entitlement, and audit requirements shape scoring. |
| `08_current_run_cost_baseline.xlsx` | FP&A / IT finance | Enterprise context | Current run cost and savings hypothesis separate projected vs realized value. |
| `09_rate_card_resource_model.xlsx` | Procurement / SI rate-card input | Enterprise context | Build cost, run cost, hypercare, and role mix assumptions. |
| `10_vendor_contract_inventory.csv` | Procurement / contract repository | Enterprise context | Renewal, data rights, and exit terms. |
| `11_project_roadmap_constraints.md` | PMO / transformation office | Event evidence / review required | Freeze windows and dependencies constrain rollout sequencing. |
| `12_security_network_topology.md` | Security / network architecture | Event evidence / review required | SSO, egress, certificate, audit, and data protection requirements. |
| `13_kyriba_decision_patterns.jsonl` | AbarVa PatternOps | Corpus pattern layer | Evidence-triggered sourcing, cost, scoring, risk, and RFP implications. |
| `14_evidence_pattern_output_trace.csv` | AbarVa Steward | Demo trace | The visible evidence to pattern to output-change proof. |
| `source_uploads/manifest.json` | AbarVa Steward | Load manifest | File ownership, template mapping, and target plane. |

## Load Discipline

- Structured current-state files belong in the governed Admin context upload lane.
- Event-only evidence belongs in the Source event workspace.
- Existing active facts are superseded by logical key when structured context is promoted.
- Prior values remain auditable; do not delete or overwrite history.
- Document-derived facts from markdown/PDF/DOCX/PPTX should be review-required before promotion.
- Generated outputs must show the evidence to pattern to output-change trace.
- Real client files should mask or exclude full account numbers, routing numbers,
  credentials, certificates, API tokens, endpoint URLs, raw transactions,
  firewall rules, IP ranges, vulnerability detail, and PII.
- Use masking when AbarVa needs the shape of the evidence for reasoning
  (`acct-****-0042`, `10.xxx.xxx.xxx`, `api://system/***/resource`). Use
  scrambling when the original shape is unnecessary and stronger
  de-identification is preferred.
