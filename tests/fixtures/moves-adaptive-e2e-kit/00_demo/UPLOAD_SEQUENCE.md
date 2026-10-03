# Upload sequence and evidence types

First create/select a disposable synthetic Move. Do not upload the zip. The exact primary-case allowlist is `upload_manifest.json`; P3-P5 reference outputs and QA-only files are excluded.

| Phase | Files | Family |
|---|---|---|
| P1 | charter_decisions.md; business_change_hypothesis.csv; evidence_plan.csv; red_lines_draft.csv | uploaded_evidence |
| P2 | operations_workshop_45m.md; security_controls_session_20m.md | session_artifact |
| P2 | monthly_kpi_baseline.csv; metric_dictionary.csv; conflict_register.csv; workflow_walkthrough.csv; system_inventory.csv; knowledge_inventory.csv; data_quality_lineage.csv; red_lines_validated.csv | uploaded_evidence |
| P3-P5 | Generate in Nexus from approved evidence. Do not upload QA expected outputs as source. | n/a |
| Alternate route test | Files listed in 06_technical_only_case/UPLOAD_ORDER.md | uploaded_evidence |

For each upload, require a stored artifact plus governed evidence and review items. Keep pending until a human checks extraction and source locations.
