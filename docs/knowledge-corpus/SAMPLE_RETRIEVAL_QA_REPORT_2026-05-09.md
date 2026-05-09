# Sample Retrieval QA Report - 2026-05-09

Generated at: `2026-05-09T20:48:56.231Z`

Input: `docs/knowledge-corpus/generated/canonical-corpus-backfill-preview.json`

Mode: deterministic canonical preview retrieval fallback. This does not mutate database content.

## Summary

- Target queries: 6
- Passing target queries: 3
- Failing target queries: 3
- Target queries with no match: 0
- No-match control: pass

## Target Query Results

| Status | Query | Expected facets | Top canonical id | Top hit | Notes |
| --- | --- | --- | --- | --- | --- |
| pass | AI use cases for retail store operations | industry=retail; function_terms=store/operations/allocation/clienteling; process_terms=store/operations/clustering; title_terms=store/operations/allocation/clienteling | AIP-RETAIL-ALLOCATION_AI_OVERFITS_HISTORICAL_STORE_CLUSTERS | Allocation AI Overfits Historical Store Clusters (1.3) | Top hit satisfied configured expectations. |
| pass | How should a payer use agentic AI for prior auth? | industry=healthcare; title_terms=prior/authorization; function_terms=utilization/industry_specific; process_terms=utilization/authorization/industry_specific | AIP-HEALTHCARE-PRIOR_AUTHORIZATION_AUTOMATION | Prior Authorization Automation (1.4) | Top hit satisfied configured expectations. |
| fail | Financial services AML agentic workflow | industry=financial_services; title_terms=aml/bsa/compliance; function_terms=financial_crimes/compliance; process_terms=financial_crimes/compliance | AIP-FINANCIAL-SERVICES-FRAUD_DETECTION_MODERNIZATION | Fraud Detection Modernization (0.9) | Top hit missed: title_terms. |
| fail | Back office AI productivity use cases for healthcare | industry=healthcare; enterprise_area=back_office; function_terms=productivity/finance/hr/it/operations; process_terms=productivity/finance/hr/it/operations | AIP-HEALTHCARE-REVENUE_CYCLE_DENIAL_CASCADE | Revenue Cycle Denial Cascade (1) | Top hit missed: enterprise_area:back_office. |
| pass | How should a retailer reimagine merchandising with AI? | industry=retail; function_terms=merchandising/merchandise; process_terms=merchandising/scenario/margin; title_terms=merchandise/merchandising/margin | AIP-RETAIL-OWNED_BRAND_MARGIN_RECOVERY | Owned Brand Margin Recovery (1.3) | Top hit satisfied configured expectations. |
| fail | What are the KPIs for AI-enabled contact center transformation? | title_terms=contact/center; function_terms=contact/service/ai_programs; process_terms=contact/service/ai_programs; kpi_minimum=3 | AIP-RETAIL-CONTACT_TO_EXPERIENCE_OPERATING_MODEL | Contact-to-Experience Operating Model (1) | Top hit missed: kpi_minimum:3. |

## No-Match Behavior

| Status | Query | Top canonical id | Notes |
| --- | --- | --- | --- |
| pass | zzzxqv ploonth narvix | none | No-match control behaved correctly. |

## Interpretation

- `pass` means the top deterministic hit satisfied the configured industry/function/process/title/KPI expectations.
- `fail` means retrieval found a plausible pattern, but the current corpus does not yet satisfy the expected facet for that executive query.
- `no_match` on target queries means the canonical preview has no usable pattern for the query under the deterministic fallback.
- Current failures should drive Wave 3 content enrichment before strict retrieval QA is made a hard CI gate.
