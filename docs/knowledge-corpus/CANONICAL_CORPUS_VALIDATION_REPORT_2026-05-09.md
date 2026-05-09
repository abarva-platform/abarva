# Canonical Corpus Validation Report - 2026-05-09

Generated at: `2026-05-09T20:37:31.043Z`

Input: `docs/knowledge-corpus/generated/canonical-corpus-backfill-preview.json`

Mode: report-only

## Summary

- Patterns validated: 271
- Error issues: 2297
- Warning issues: 40
- Patterns with errors: 260
- Patterns with warnings: 40
- DB/backfill status: DB credentials were available; pattern_packs and genome_patterns were included read-only.

## Phase Coverage

| Strategic Move phase | Pattern count |
| --- | --- |
| originate | 0 |
| charter | 23 |
| diagnose_discover | 11 |
| design | 25 |
| roadmap_business_case_change_value_plan | 25 |
| mobilize_handoff | 0 |

## Source System Counts

| Source system | Pattern count |
| --- | --- |
| generated_pattern_manifest | 17 |
| genome_patterns | 40 |
| pattern_packs | 28 |
| pattern_seed | 186 |

## Issue Summary

| Severity | Rule | Count |
| --- | --- | --- |
| error | failure_mitigations_required | 271 |
| error | minimum_data_requirements | 271 |
| error | minimum_kpis | 271 |
| error | recommended_workshops_required | 271 |
| error | provenance_required | 255 |
| error | recommended_artifacts_required | 246 |
| error | required_array | 246 |
| error | required_identity | 246 |
| error | failure_modes_required | 220 |
| warning | unsupported_claim_flags_present | 40 |

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
