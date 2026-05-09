# Sample Retrieval QA Report - 2026-05-09

Generated at: `2026-05-09T23:01:05.029Z`

Input: `docs/knowledge-corpus/generated/canonical-corpus-backfill-preview.json`

Mode: deterministic canonical preview retrieval fallback. This does not mutate database content.

## Summary

- Target queries: 6
- Passing target queries: 6
- Failing target queries: 0
- Target queries with no match: 0
- No-match control: pass

## Target Query Results

| Status | Query | Expected facets | Top canonical id | Top hit | Notes |
| --- | --- | --- | --- | --- | --- |
| pass | AI use cases for retail store operations | industry=retail; function_terms=store/operations/allocation/clienteling; process_terms=store/operations/clustering; title_terms=store/operations/allocation/clienteling | AIP-RETAIL-RETAIL_STORE_EDGE_IT_OPERATIONS_AGENT | Retail Store Edge IT Operations Agent (1.4) | Top hit satisfied configured expectations. |
| pass | How should a payer use agentic AI for prior auth? | industry=healthcare; title_terms=prior/authorization; function_terms=utilization/industry_specific; process_terms=utilization/authorization/industry_specific | AIP-HEALTHCARE-PRIOR_AUTHORIZATION_AUTOMATION | Prior Authorization Automation (1.4) | Top hit satisfied configured expectations. |
| pass | Financial services AML agentic workflow | industry=financial_services; title_terms=aml/bsa/compliance; function_terms=financial_crimes/compliance; process_terms=financial_crimes/compliance | AIP-FINANCIAL-SERVICES-AML_ALERT_TRIAGE_AI | AML Alert Triage AI (1.1) | Top hit satisfied configured expectations. |
| pass | Back office AI productivity use cases for healthcare | industry=healthcare; enterprise_area=back_office; function_terms=productivity/finance/hr/it/operations; process_terms=productivity/finance/hr/it/operations | AIP-HEALTHCARE-HEALTHCARE_CLAIMS_PAYMENT_INTEGRITY_AI | Healthcare Claims Payment Integrity AI (1.35) | Top hit satisfied configured expectations. |
| pass | How should a retailer reimagine merchandising with AI? | industry=retail; function_terms=merchandising/merchandise; process_terms=merchandising/scenario/margin; title_terms=merchandise/merchandising/margin | AIP-RETAIL-OWNED_BRAND_MARGIN_RECOVERY | Owned Brand Margin Recovery (1.3) | Top hit satisfied configured expectations. |
| pass | What are the KPIs for AI-enabled contact center transformation? | title_terms=contact/center; function_terms=contact/service/ai_programs; process_terms=contact/service/ai_programs; kpi_minimum=3 | AIP-RETAIL-CONTACT_TO_EXPERIENCE_OPERATING_MODEL | Contact-to-Experience Operating Model (1.2) | Top hit satisfied configured expectations. |

## No-Match Behavior

| Status | Query | Top canonical id | Notes |
| --- | --- | --- | --- |
| pass | zzzxqv ploonth narvix | none | No-match control behaved correctly. |

## Interpretation

- `pass` means the top deterministic hit satisfied the configured industry/function/process/title/KPI expectations.
- `fail` means retrieval found a plausible pattern, but the current corpus does not yet satisfy the expected facet for that executive query.
- `no_match` on target queries means the canonical preview has no usable pattern for the query under the deterministic fallback.
- All configured target queries pass in the deterministic preview fallback; keep this suite green as new content lands.
