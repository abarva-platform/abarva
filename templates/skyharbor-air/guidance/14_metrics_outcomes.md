# Airline Demo 14_metrics_outcomes Guidance

Tenant key: `skyharbor-air`
Display label: `Airline Demo`
Physical source label: `SkyHarbor Air`
Industry: global airline

This template captures flight operations, OCC/IROPS, crew, airport operations, maintenance, baggage, loyalty, revenue management, cargo, and safety operations context as candidate-only V3 planning data. Rows must remain evidence-backed, tenant-scoped, source-linked, and safe for candidate preview only.

Required controls:
- Do not include real customer, passenger, account, payment-card, PHI, or PII records.
- Do not mark rows as active tenant truth.
- Do not claim realized savings, realized ROI, or production outcomes.
- Preserve source_file, source_row_id, evidence_id, confidence, candidate_contract_version, and load_run_id.
- Use Airline Demo on AbarVa-facing pages.
