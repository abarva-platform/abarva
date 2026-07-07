# Meridian / PHA Pilot Strategy Evidence Pack

This pack captures the strategy evidence needed to test Liran's health-plan use
cases in AbarVa without collecting PHI, PII, raw claims, raw EMR rows, pharmacy
transactions, or call transcripts.

The templates are phase-oriented for Moves:

- P0 Originate: define the strategic use case, sponsor role, value hypothesis,
  and evidence family.
- P1 Charter: confirm scope, decision rights, KPI baselines, and guardrails.
- P2 Discover / Diagnose: capture current-state process, system/data landscape,
  gaps, constraints, and evidence quality.
- P3 Design: support option design, operating-model choices, sourcing choices,
  and control design.
- P4 Roadmap: support sequencing, dependencies, investment ranges, and decision
  gates.
- P5 Mobilize: capture owners, workplan evidence, measurement method, and future
  data-access needs.

The pack is intentionally synthetic and de-identified. It is meant to be uploaded
through the governed Admin bulk/template path when testing the pilot workflow.

## Files

- `template-catalog.json`: metadata for the capture templates.
- `use_case_intake.csv`: one row per pilot use case.
- `kpi_baseline.csv`: aggregated baseline and target measures.
- `current_state_process.csv`: current-state workflow evidence.
- `system_data_landscape.csv`: systems, data domains, and integration context.
- `vendor_contract_context.csv`: vendor, BAA, AI clause, renewal, and risk context.
- `operating_model_roles.csv`: role/title-level operating model and decision rights.
- `evidence_register.csv`: source register for citation-ready strategy evidence.
- `decision_log.csv`: open and made decisions for Move gates.
- `data_readiness_summary.csv`: what evidence is available by phase and data domain.
- `risk_guardrail_register.csv`: strategic risks, human controls, and blocked actions.
- `use_case_template_map.csv`: required templates by Liran use case and Move phase.
- `corpus_enhancement_backlog.csv`: corpus patterns needed to strengthen answers.
- `corpus_pattern_starters.jsonl`: starter pattern objects for review and later
  canonical corpus ingestion.

## Pilot Rule

No row in this pack should contain patient names, member IDs, MRNs, dates of
birth, phone numbers, emails, claim IDs tied to individuals, raw transcripts, or
free-text clinical notes. Use role/title, aggregated ranges, synthetic examples,
or de-identified summaries.
