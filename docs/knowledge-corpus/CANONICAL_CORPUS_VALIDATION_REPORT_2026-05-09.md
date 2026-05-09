# Canonical Corpus Validation Report - 2026-05-09

Generated at: `2026-05-09T22:06:29.136Z`

Input: `docs/knowledge-corpus/generated/canonical-corpus-backfill-preview.json`

Mode: report-only

## Summary

- Patterns validated: 323
- Error issues: 1800
- Warning issues: 0
- Patterns with errors: 192
- Patterns with warnings: 0
- DB/backfill status: DB credentials were unavailable or query failed; DB-backed pattern rows were skipped.

## Phase Coverage

| Strategic Move phase | Pattern count |
| --- | --- |
| originate | 93 |
| charter | 109 |
| diagnose_discover | 113 |
| design | 115 |
| roadmap_business_case_change_value_plan | 115 |
| mobilize_handoff | 108 |

## Source System Counts

| Source system | Pattern count |
| --- | --- |
| generated_pattern_manifest | 17 |
| pattern_seed | 306 |

## Issue Summary

| Severity | Rule | Count |
| --- | --- | --- |
| error | failure_mitigations_required | 203 |
| error | minimum_data_requirements | 203 |
| error | minimum_kpis | 203 |
| error | recommended_artifacts_required | 203 |
| error | recommended_workshops_required | 203 |
| error | required_array | 203 |
| error | required_identity | 203 |
| error | failure_modes_required | 192 |
| error | provenance_required | 187 |

## Sample Issues

| Severity | Rule | Canonical id | Message |
| --- | --- | --- | --- |
| error | required_identity | AIP-CROSS-INDUSTRY-ACCOUNTS_PAYABLE_AUTOMATION_AND_INVOICE_TO_PAY_SOURCING | Missing canonical field: strategic_move_phases. |
| error | required_array | AIP-CROSS-INDUSTRY-ACCOUNTS_PAYABLE_AUTOMATION_AND_INVOICE_TO_PAY_SOURCING | strategic_move_phases must contain at least one value. |
| error | minimum_kpis | AIP-CROSS-INDUSTRY-ACCOUNTS_PAYABLE_AUTOMATION_AND_INVOICE_TO_PAY_SOURCING | Requires at least 3 KPIs; found 0. |
| error | minimum_data_requirements | AIP-CROSS-INDUSTRY-ACCOUNTS_PAYABLE_AUTOMATION_AND_INVOICE_TO_PAY_SOURCING | Requires at least 3 required_data_domains; found 0. |
| error | failure_modes_required | AIP-CROSS-INDUSTRY-ACCOUNTS_PAYABLE_AUTOMATION_AND_INVOICE_TO_PAY_SOURCING | Requires at least one common_failure_modes entry. |
| error | failure_mitigations_required | AIP-CROSS-INDUSTRY-ACCOUNTS_PAYABLE_AUTOMATION_AND_INVOICE_TO_PAY_SOURCING | Requires at least one failure_mode_mitigations entry. |
| error | recommended_artifacts_required | AIP-CROSS-INDUSTRY-ACCOUNTS_PAYABLE_AUTOMATION_AND_INVOICE_TO_PAY_SOURCING | Requires at least one recommended_artifacts entry. |
| error | recommended_workshops_required | AIP-CROSS-INDUSTRY-ACCOUNTS_PAYABLE_AUTOMATION_AND_INVOICE_TO_PAY_SOURCING | Requires at least one recommended_workshops entry. |
| error | provenance_required | AIP-CROSS-INDUSTRY-ACCOUNTS_PAYABLE_AUTOMATION_AND_INVOICE_TO_PAY_SOURCING | Requires source_basis and confidence_rationale. |
| error | required_identity | AIP-CROSS-INDUSTRY-ACQUIA_DRUPAL_AND_DIGITAL_EXPERIENCE_PLATFORM_SOURCING_PROFILE | Missing canonical field: strategic_move_phases. |
| error | required_array | AIP-CROSS-INDUSTRY-ACQUIA_DRUPAL_AND_DIGITAL_EXPERIENCE_PLATFORM_SOURCING_PROFILE | strategic_move_phases must contain at least one value. |
| error | minimum_kpis | AIP-CROSS-INDUSTRY-ACQUIA_DRUPAL_AND_DIGITAL_EXPERIENCE_PLATFORM_SOURCING_PROFILE | Requires at least 3 KPIs; found 0. |
| error | minimum_data_requirements | AIP-CROSS-INDUSTRY-ACQUIA_DRUPAL_AND_DIGITAL_EXPERIENCE_PLATFORM_SOURCING_PROFILE | Requires at least 3 required_data_domains; found 0. |
| error | failure_modes_required | AIP-CROSS-INDUSTRY-ACQUIA_DRUPAL_AND_DIGITAL_EXPERIENCE_PLATFORM_SOURCING_PROFILE | Requires at least one common_failure_modes entry. |
| error | failure_mitigations_required | AIP-CROSS-INDUSTRY-ACQUIA_DRUPAL_AND_DIGITAL_EXPERIENCE_PLATFORM_SOURCING_PROFILE | Requires at least one failure_mode_mitigations entry. |
| error | recommended_artifacts_required | AIP-CROSS-INDUSTRY-ACQUIA_DRUPAL_AND_DIGITAL_EXPERIENCE_PLATFORM_SOURCING_PROFILE | Requires at least one recommended_artifacts entry. |
| error | recommended_workshops_required | AIP-CROSS-INDUSTRY-ACQUIA_DRUPAL_AND_DIGITAL_EXPERIENCE_PLATFORM_SOURCING_PROFILE | Requires at least one recommended_workshops entry. |
| error | provenance_required | AIP-CROSS-INDUSTRY-ACQUIA_DRUPAL_AND_DIGITAL_EXPERIENCE_PLATFORM_SOURCING_PROFILE | Requires source_basis and confidence_rationale. |
| error | required_identity | AIP-CROSS-INDUSTRY-ADYEN_ENTERPRISE_PAYMENTS_SOURCING_PROFILE | Missing canonical field: strategic_move_phases. |
| error | required_array | AIP-CROSS-INDUSTRY-ADYEN_ENTERPRISE_PAYMENTS_SOURCING_PROFILE | strategic_move_phases must contain at least one value. |
| error | minimum_kpis | AIP-CROSS-INDUSTRY-ADYEN_ENTERPRISE_PAYMENTS_SOURCING_PROFILE | Requires at least 3 KPIs; found 0. |
| error | minimum_data_requirements | AIP-CROSS-INDUSTRY-ADYEN_ENTERPRISE_PAYMENTS_SOURCING_PROFILE | Requires at least 3 required_data_domains; found 0. |
| error | failure_modes_required | AIP-CROSS-INDUSTRY-ADYEN_ENTERPRISE_PAYMENTS_SOURCING_PROFILE | Requires at least one common_failure_modes entry. |
| error | failure_mitigations_required | AIP-CROSS-INDUSTRY-ADYEN_ENTERPRISE_PAYMENTS_SOURCING_PROFILE | Requires at least one failure_mode_mitigations entry. |
| error | recommended_artifacts_required | AIP-CROSS-INDUSTRY-ADYEN_ENTERPRISE_PAYMENTS_SOURCING_PROFILE | Requires at least one recommended_artifacts entry. |
| error | recommended_workshops_required | AIP-CROSS-INDUSTRY-ADYEN_ENTERPRISE_PAYMENTS_SOURCING_PROFILE | Requires at least one recommended_workshops entry. |
| error | provenance_required | AIP-CROSS-INDUSTRY-ADYEN_ENTERPRISE_PAYMENTS_SOURCING_PROFILE | Requires source_basis and confidence_rationale. |
| error | required_identity | AIP-CROSS-INDUSTRY-AGENT_ASSIST_KNOWLEDGE_QUALITY_GATE | Missing canonical field: strategic_move_phases. |
| error | required_array | AIP-CROSS-INDUSTRY-AGENT_ASSIST_KNOWLEDGE_QUALITY_GATE | strategic_move_phases must contain at least one value. |
| error | minimum_kpis | AIP-CROSS-INDUSTRY-AGENT_ASSIST_KNOWLEDGE_QUALITY_GATE | Requires at least 3 KPIs; found 0. |
| error | minimum_data_requirements | AIP-CROSS-INDUSTRY-AGENT_ASSIST_KNOWLEDGE_QUALITY_GATE | Requires at least 3 required_data_domains; found 0. |
| error | failure_modes_required | AIP-CROSS-INDUSTRY-AGENT_ASSIST_KNOWLEDGE_QUALITY_GATE | Requires at least one common_failure_modes entry. |
| error | failure_mitigations_required | AIP-CROSS-INDUSTRY-AGENT_ASSIST_KNOWLEDGE_QUALITY_GATE | Requires at least one failure_mode_mitigations entry. |
| error | recommended_artifacts_required | AIP-CROSS-INDUSTRY-AGENT_ASSIST_KNOWLEDGE_QUALITY_GATE | Requires at least one recommended_artifacts entry. |
| error | recommended_workshops_required | AIP-CROSS-INDUSTRY-AGENT_ASSIST_KNOWLEDGE_QUALITY_GATE | Requires at least one recommended_workshops entry. |
| error | provenance_required | AIP-CROSS-INDUSTRY-AGENT_ASSIST_KNOWLEDGE_QUALITY_GATE | Requires source_basis and confidence_rationale. |
| error | required_identity | AIP-CROSS-INDUSTRY-AI_GOVERNANCE_OPERATING_MODEL | Missing canonical field: strategic_move_phases. |
| error | required_array | AIP-CROSS-INDUSTRY-AI_GOVERNANCE_OPERATING_MODEL | strategic_move_phases must contain at least one value. |
| error | minimum_kpis | AIP-CROSS-INDUSTRY-AI_GOVERNANCE_OPERATING_MODEL | Requires at least 3 KPIs; found 0. |
| error | minimum_data_requirements | AIP-CROSS-INDUSTRY-AI_GOVERNANCE_OPERATING_MODEL | Requires at least 3 required_data_domains; found 0. |
| error | failure_modes_required | AIP-CROSS-INDUSTRY-AI_GOVERNANCE_OPERATING_MODEL | Requires at least one common_failure_modes entry. |
| error | failure_mitigations_required | AIP-CROSS-INDUSTRY-AI_GOVERNANCE_OPERATING_MODEL | Requires at least one failure_mode_mitigations entry. |
| error | recommended_artifacts_required | AIP-CROSS-INDUSTRY-AI_GOVERNANCE_OPERATING_MODEL | Requires at least one recommended_artifacts entry. |
| error | recommended_workshops_required | AIP-CROSS-INDUSTRY-AI_GOVERNANCE_OPERATING_MODEL | Requires at least one recommended_workshops entry. |
| error | provenance_required | AIP-CROSS-INDUSTRY-AI_GOVERNANCE_OPERATING_MODEL | Requires source_basis and confidence_rationale. |
| error | required_identity | AIP-CROSS-INDUSTRY-AI_GOVERNANCE_OPERATING_MODEL | Missing canonical field: strategic_move_phases. |
| error | required_array | AIP-CROSS-INDUSTRY-AI_GOVERNANCE_OPERATING_MODEL | strategic_move_phases must contain at least one value. |
| error | minimum_kpis | AIP-CROSS-INDUSTRY-AI_GOVERNANCE_OPERATING_MODEL | Requires at least 3 KPIs; found 0. |
| error | minimum_data_requirements | AIP-CROSS-INDUSTRY-AI_GOVERNANCE_OPERATING_MODEL | Requires at least 3 required_data_domains; found 0. |
| error | failure_mitigations_required | AIP-CROSS-INDUSTRY-AI_GOVERNANCE_OPERATING_MODEL | Requires at least one failure_mode_mitigations entry. |

## Gate Notes

- The validator is intentionally report-only by default while the current corpus still contains known Wave 1 and Wave 2 gaps.
- Use `--strict` to make any error fail the command once Wave 3 content remediation is expected to satisfy the quality gates.
- This script does not insert, update, delete, or mutate database content.
