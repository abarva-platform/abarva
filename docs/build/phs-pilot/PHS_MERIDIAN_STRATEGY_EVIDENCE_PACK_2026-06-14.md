# PHS / Meridian Strategy Evidence Pack

Date: 2026-06-14

## Purpose

This pack turns Liran's health-plan use-case list into pilot-ready strategy
evidence, templates, and corpus backlog. It is designed for AbarVa as a strategy
platform, not an operational data-science system. The pilot evidence standard is
aggregated, de-identified, synthetic, role/title-based, citation-ready, and
minimum necessary.

## What Was Added

Location:

`datasets/meridian-health-synthetic-v1/19-pilot-strategy-evidence-pack/`

Added:

- 10 capture templates.
- 7 use-case mapping rows.
- 7 corpus enhancement backlog rows.
- 7 starter corpus pattern objects for review and later canonical corpus ingestion.
- Explicit PHI/PII guardrails.
- Move phase alignment from P0 Originate through P5 Mobilize.

## Use-Case Readiness

| Use case | Strategy readiness | Notes |
|---|---|---|
| Payment integrity and leakage reduction | Ready | Best first pilot candidate. Needs strategy-level denial/leakage evidence, not raw claims. |
| Prior auth and denials automation | Ready | Strong with prior-auth workqueue, RCM denials, and governance guardrails. |
| Cost transparency | Ready with gaps | Needs product/provider/population margin bridge as aggregate evidence. |
| Call center optimization | Ready with gaps | Needs intent taxonomy and redacted/synthetic examples, not raw transcripts. |
| Provider quality and performance | Preliminary only | Needs HEDIS/STAR measure catalog and provider attribution summary. |
| Unified clinical and claims data foundation | Ready with gaps | Needs semantic ownership and data-product roadmap, not raw EMR/claims. |
| Automated close and reporting | Preliminary only | Needs close calendar, reconciliation controls, and reporting inventory. |

## Templates Added

- `use_case_intake.csv`
- `kpi_baseline.csv`
- `current_state_process.csv`
- `system_data_landscape.csv`
- `vendor_contract_context.csv`
- `operating_model_roles.csv`
- `evidence_register.csv`
- `decision_log.csv`
- `data_readiness_summary.csv`
- `risk_guardrail_register.csv`

## Corpus Enhancement Backlog

Priority corpus areas:

1. Payment integrity patterns.
2. Prior authorization modernization.
3. Provider quality, HEDIS, and STAR patterns.
4. Member experience and contact-center strategy.
5. Cost transparency patterns.
6. Governed healthcare data foundation.
7. Finance close and reporting patterns.

## Guardrail

Do not request or upload raw PHI, PII, member identifiers, raw EMR rows, raw
claim lines, pharmacy transactions, or raw call transcripts for P0-P4 strategy
work. If execution later requires operational validation, create a separate
client-approved data request under the private data-plane process.
