# SkyHarbor Source v4 Question And Evidence Contract

**Status:** required before Source v4 canary generation, lab load, Cube activation or aVa question baseline.

This contract freezes the questions the v4 package must answer before the generator is allowed to create the full 180K-250K row synthetic corpus.

The row-depth verifier proves that rows are source-shaped. This contract proves that the rows are useful.

## Required Artifacts

- `docs/source/skyharbor-v4/source_v4_question_bank.json`
- `docs/source/skyharbor-v4/source_v4_question_coverage_matrix.json`
- `docs/source/skyharbor-v4/source_v4_model_fit_audit.json`
- `scripts/source/verify-skyharbor-v4-question-coverage.mjs`

## Distribution

| Domain                                  | Questions |
| --------------------------------------- | --------: |
| executive_portfolio_concentration       |        12 |
| vendor_360                              |        12 |
| contract_economics_terms                |        18 |
| spend_invoices_commitments              |        15 |
| saas_cloud_consumption_utilization      |        14 |
| sla_incidents_service_credits           |        13 |
| renewals_notice_leverage                |        12 |
| application_platform_dependencies       |        10 |
| workforce_rate_cards                    |         9 |
| cyber_vendor_risk                       |         5 |
| sourcing_events_supplier_bafo           |        10 |
| ai_adoption_productivity_value_proof    |        10 |
| evidence_lineage_conflict_missing_proof |        10 |

Total: 150 questions.

## Required Fields Per Question

Every question carries:

```text
question_id
domain
question
executive_intent
required_source_domains
required_measures
required_dimensions
required_grain
required_story_thread
required_evidence_depth
expected_visual
expected_drill_path
allowed_conclusion
prohibited_overstatement
expected_action
acceptance_rule
```

## Coverage Matrix

Each question maps to source files, columns, planted scenario records, Cube view, drill members, expected answer shape and evidence requirement.

The matrix is deliberately stricter than a question list. A question without files, columns, planted records or evidence behavior is not a load acceptance question.

## Model-Fit Position

Observed Source Cube views in this repo:

- `source_contract_scope_confidence`
- `source_event_execution`
- `source_executive_portfolio`
- `source_opportunity_pipeline`
- `source_performance_and_credits`
- `source_renewal_exposure`
- `source_spend_consumption`
- `source_supplier_comparison`
- `source_vendor_concentration`

The audit separates domains already supportable by current Cube views from domains that need canary-proven successor views. New views should be added because a question path fails, not because a diagram looks incomplete.

## Acceptance

Run:

```bash
npm run source:v4:question-coverage:verify
```

A Source v4 package cannot enter lab unless this gate, the row-depth verifier and the future canary answer proof all pass.

## Non-Goals

- No synthetic data generation in this lane.
- No Postgres, Cube runtime or ACA mutation in this lane.
- No claim that current v3 data can answer all 150 questions.
