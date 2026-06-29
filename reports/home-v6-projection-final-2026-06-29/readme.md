# Home V6 Backend Correctness Projection

Generated: 2026-06-29T15:04:16.209Z

Backend V6 projected correctness audit. This predicts answerability from V6 coverage and Home KNOW rules; it does not replace live API/browser proof.

## Summary

- Total projected questions: 1000
- Projected pass rate: 100%
- Projected decision-ready rate: 68%
- Projected thin/gap/handoff rate: 32%
- Low-score projected questions: 0
- Strict money/value/adoption failures: 0
- Strict money/value/adoption caveat-required questions: 0
- Questions with raw old-name leak risk before API sanitization: 0

## Answer Classes

| Class | Count | Avg Score |
| --- | ---: | ---: |
| DECISION_READY_ADVISORY_PACKET | 680 | 5 |
| HANDOFF_EXPECTED | 240 | 4.42 |
| DATA_THIN | 80 | 4 |

## Tenant Results

| Tenant | Count | Avg Score | Decision-ready | Thin | Data-thin | Handoff | Old-name risk |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| apex-retail-synthetic-v6 | 208 | 4.79 | 144 | 0 | 16 | 48 | 0 |
| first-capital-financial-synthetic-v6 | 208 | 4.79 | 144 | 0 | 16 | 48 | 0 |
| lakeshore-industries-synthetic-v6 | 200 | 4.78 | 136 | 0 | 16 | 48 | 0 |
| meridian-health-synthetic-v6 | 192 | 4.77 | 128 | 0 | 16 | 48 | 0 |
| skyharbor-air-synthetic-v6 | 192 | 4.77 | 128 | 0 | 16 | 48 | 0 |

## Highest-Risk Live Smoke Sample

- apex-retail-synthetic-v6 / enterprise_profile / score 5: What enterprise profile context is loaded, and what can Home safely answer from it?
- apex-retail-synthetic-v6 / business_function / score 5: What business function context is loaded, and what can Home safely answer from it?
- apex-retail-synthetic-v6 / org_ownership / score 5: What org ownership context is loaded, and what can Home safely answer from it?
- apex-retail-synthetic-v6 / workforce_persona / score 5: What workforce persona context is loaded, and what can Home safely answer from it?
- apex-retail-synthetic-v6 / application_system / score 5: What application system context is loaded, and what can Home safely answer from it?
- apex-retail-synthetic-v6 / data_asset_integration / score 5: What data asset integration context is loaded, and what can Home safely answer from it?
- apex-retail-synthetic-v6 / vendor_contract / score 5: What vendor contract context is loaded, and what can Home safely answer from it?
- apex-retail-synthetic-v6 / spend_value / score 5: What spend value context is loaded, and what can Home safely answer from it?
- apex-retail-synthetic-v6 / program_initiative / score 5: What program initiative context is loaded, and what can Home safely answer from it?
- apex-retail-synthetic-v6 / ai_initiative / score 5: What ai initiative context is loaded, and what can Home safely answer from it?
- apex-retail-synthetic-v6 / operations_risk_control / score 5: What operations risk control context is loaded, and what can Home safely answer from it?
- apex-retail-synthetic-v6 / relationship / score 5: What relationship context is loaded, and what can Home safely answer from it?
- apex-retail-synthetic-v6 / evidence_source / score 5: What evidence source context is loaded, and what can Home safely answer from it?
- apex-retail-synthetic-v6 / metric_definition / score 5: What metric definition context is loaded, and what can Home safely answer from it?
- apex-retail-synthetic-v6 / industry_corpus_pattern / score 5: What industry corpus pattern context is loaded, and what can Home safely answer from it?
- apex-retail-synthetic-v6 / expert_lens / score 5: What expert lens context is loaded, and what can Home safely answer from it?
- first-capital-financial-synthetic-v6 / enterprise_profile / score 5: What enterprise profile context is loaded, and what can Home safely answer from it?
- first-capital-financial-synthetic-v6 / business_function / score 5: What business function context is loaded, and what can Home safely answer from it?
- first-capital-financial-synthetic-v6 / org_ownership / score 5: What org ownership context is loaded, and what can Home safely answer from it?
- first-capital-financial-synthetic-v6 / workforce_persona / score 5: What workforce persona context is loaded, and what can Home safely answer from it?

## Low-Score Reasons


## Strict Money/Value/Adoption Failures


## Method Boundary

This audit does not call Claude and does not prove renderer behavior. It projects the expected Home aVa answer class from V6 row coverage, critical column completeness, data-thin markers, source-owner gaps, old-name risk, and surface routing rules. Use the recommended smoke sample for live API/browser proof.

## Example Projected Questions

- apex-retail-synthetic-v6:enterprise_profile:inventory: What enterprise profile context is loaded, and what can Home safely answer from it? -> DECISION_READY_ADVISORY_PACKET (5)
- apex-retail-synthetic-v6:business_function:inventory: What business function context is loaded, and what can Home safely answer from it? -> DECISION_READY_ADVISORY_PACKET (5)
- apex-retail-synthetic-v6:org_ownership:inventory: What org ownership context is loaded, and what can Home safely answer from it? -> DECISION_READY_ADVISORY_PACKET (5)
- apex-retail-synthetic-v6:workforce_persona:inventory: What workforce persona context is loaded, and what can Home safely answer from it? -> DECISION_READY_ADVISORY_PACKET (5)
- apex-retail-synthetic-v6:application_system:inventory: What application system context is loaded, and what can Home safely answer from it? -> DECISION_READY_ADVISORY_PACKET (5)
