# Pattern Packs Classification Export — 28 Rows

Date: 2026-05-29
Status: Founder review required before migration
Source table: public.pattern_packs
Target decision: industry-applicable -> corpus_patterns; client-specific -> client_private_patterns

Rows exported: 28

## Summary

- Recommended industry-applicable: 9
- Recommended client-specific: 19
- No rows are migrated by this export. Founder must approve or edit the recommendation per row.

## Rows

### 1. apex_pattern_owned_brand_margin_underperformance — Owned Brand Margin Underperformance

- Client: Apex Retail (apex-retail, RETAIL)
- Category: Merchandising Strategy — Margin Optimization
- Recommended classification: industry-applicable
- Recommendation rationale: Recommended corpus_patterns because the pattern appears reusable at industry or cross-industry level after provenance is preserved.
- Founder decision: TODO

```json
{
  "id": "apex_pattern_owned_brand_margin_underperformance",
  "client_id": "bb8ed961-a049-4d0c-a38f-f8912138fceb",
  "ordinal_ref": "3.1",
  "name": "Owned Brand Margin Underperformance",
  "short_description": "Variant of foundational cross-sector pattern (variant of Analytics Modernization + sector-specific application).",
  "long_description": "Variant of foundational cross-sector pattern (variant of Analytics Modernization + sector-specific application).",
  "category": "Merchandising Strategy — Margin Optimization",
  "sector_applicability": [
    "retail"
  ],
  "cross_industry": false,
  "variant_of": null,
  "trigger_symptoms": [
    "Owned brand margin differential <800 bps vs national brand (peer median: 1,000+ bps)\n- Owned brand penetration below peer median while margin differential also below\n- Category-level margin variance suggesting uneven execution\n- Sourcing cost vs peer sourcing-cost benchmarks (where available)"
  ],
  "detection_signals": [
    "Owned brand margin differential <800 bps vs national brand (peer median: 1,000+ bps)\n- Owned brand penetration below peer median while margin differential also below\n- Category-level margin variance suggesting uneven execution\n- Sourcing cost vs peer sourcing-cost benchmarks (where available)"
  ],
  "diagnostic_questions": [],
  "evidence_requirements": [],
  "likely_root_causes": [
    "Owned brand product development under-investment",
    "sourcing and supplier strategy not optimized for margin capture",
    "pricing architecture not differentiating owned brand value",
    "marketing investment insufficient to drive penetration",
    "category-level ownership fragmented across merchants"
  ],
  "common_adjacent_contradictions": [],
  "benchmark_signatures": [],
  "intervention_options": [
    "Owned brand product development capability build\n- Sourcing strategy optimization (direct sourcing, consolidated suppliers)\n- Pricing architecture review and owned brand premium/value positioning\n- Marketing investment reallocation toward owned brand\n- Category ownership clarity and accountability redesign"
  ],
  "anti_patterns": [],
  "common_failure_modes": [],
  "phase_1_deliverables": [
    "Owned brand current state audit",
    "margin differential by category",
    "sourcing analysis",
    "competitive benchmarking",
    "marketing investment review"
  ],
  "phase_2_deliverables": [
    "Root cause deep-dive",
    "peer sourcing strategies analysis",
    "pricing architecture review",
    "category ownership review",
    "product development capability assessment"
  ],
  "phase_3_deliverables": [
    "Owned brand strategy",
    "sourcing roadmap",
    "pricing architecture commitments",
    "marketing reallocation",
    "category accountability design"
  ],
  "phase_4_deliverables": [
    "Product development capability build",
    "sourcing renegotiations",
    "pricing implementation",
    "marketing launches",
    "category leadership changes"
  ],
  "expected_time_to_value": {},
  "success_metrics": [],
  "leading_indicators": [],
  "required_sponsor_profile": {},
  "required_capabilities": [],
  "typical_stakeholders": [],
  "common_objections": [],
  "applicable_company_scales": [],
  "cross_pattern_links": [],
  "linked_kpi_ids": [
    "apex_owned_brand_penetration",
    "apex_owned_brand_margin_differential",
    "apex_gross_margin_pct",
    "apex_operating_margin_pct"
  ],
  "evidence_summary": "24% penetration vs 32% target and Target's 35% · 640 bps differential vs 950 bps target and Target's 1,100 bps · category execution variance across 14 merchant teams",
  "confidence_level": "high",
  "last_updated": "2026-04-21T05:00:00.000Z",
  "version": "1.0",
  "author": "AbarVa North Star overlay",
  "reasoning_scope_id": "apex_scope_broad",
  "disclosure_scope_id": "apex_scope_broad",
  "source_id": null,
  "as_of_date": "2026-04-21T05:00:00.000Z",
  "last_verified_at": "2026-04-21T00:00:00.000Z",
  "raw_markdown": "### 3.1 · Owned Brand Margin Underperformance\n\nVariant of foundational cross-sector pattern (variant of Analytics Modernization + sector-specific application).\n\n**Classification.** Category: Merchandising Strategy — Margin Optimization · Sector applicability: retail\n\n**Detection signals.**\n- Owned brand margin differential <800 bps vs national brand (peer median: 1,000+ bps)\n- Owned brand penetration below peer median while margin differential also below\n- Category-level margin variance suggesting uneven execution\n- Sourcing cost vs peer sourcing-cost benchmarks (where available)\n\n**Likely root causes.** Owned brand product development under-investment · sourcing and supplier strategy not optimized for margin capture · pricing architecture not differentiating owned brand value · marketing investment insufficient to drive penetration · category-level ownership fragmented across merchants\n\n**Intervention options.**\n- Owned brand product development capability build\n- Sourcing strategy optimization (direct sourcing, consolidated suppliers)\n- Pricing architecture review and owned brand premium/value positioning\n- Marketing investment reallocation toward owned brand\n- Category ownership clarity and accountability redesign\n\n**Phase-mapped deliverables.**\n\n*Phase 1 — Intake.* Owned brand current state audit · margin differential by category · sourcing analysis · competitive benchmarking · marketing investment review\n\n*Phase 2 — Diagnosis.* Root cause deep-dive · peer sourcing strategies analysis · pricing architecture review · category ownership review · product development capability assessment\n\n*Phase 3 — Decision.* Owned brand strategy · sourcing roadmap · pricing architecture commitments · marketing reallocation · category accountability design\n\n*Phase 4 — Execution.* Product development capability build · sourcing renegotiations · pricing implementation · marketing launches · category leadership changes\n\n**Expected outcomes.** Margin differential up 200+ bps within 18 months · owned brand penetration up 5+ pts within 24 months · gross margin up 60-80 bps enterprise\n\n**Required sponsor profile.** Chief Merchandising Officer with CFO partnership · enterprise scope · high political capital\n\n**Linked KPIs.** Owned Brand Penetration (2.2.1), Owned Brand Margin Differential (2.2.2), Gross Margin (2.1.3), Operating Margin (2.1.4)\n\n**Asterline evidence.** 24% penetration vs 32% target and Target's 35% · 640 bps differential vs 950 bps target and Target's 1,100 bps · category execution variance across 14 merchant teams",
  "metadata": {
    "classification": "Category: Merchandising Strategy — Margin Optimization · Sector applicability: retail",
    "linked_kpi_names": [
      "Owned Brand Penetration %",
      "Owned Brand Gross Margin Differential",
      "Gross Margin %",
      "Operating Margin %"
    ],
    "linked_kpis_text": "Owned Brand Penetration (2.2.1), Owned Brand Margin Differential (2.2.2), Gross Margin (2.1.3), Operating Margin (2.1.4)",
    "expected_outcomes": [
      "Margin differential up 200+ bps within 18 months",
      "owned brand penetration up 5+ pts within 24 months",
      "gross margin up 60-80 bps enterprise"
    ],
    "required_sponsor_profile": "Chief Merchandising Officer with CFO partnership · enterprise scope · high political capital"
  },
  "created_at": "2026-04-21T20:53:47.455Z",
  "updated_at": "2026-05-09T17:17:23.683Z",
  "client_name": "Apex Retail",
  "tenant_key": "apex-retail",
  "industry_code": "RETAIL"
}
```

### 2. apex_pattern_omnichannel_fulfillment_decisioning_gap — Omnichannel Fulfillment Decisioning Gap

- Client: Apex Retail (apex-retail, RETAIL)
- Category: Omnichannel Operations — Fulfillment Logic
- Recommended classification: industry-applicable
- Recommendation rationale: Recommended corpus_patterns because the pattern appears reusable at industry or cross-industry level after provenance is preserved.
- Founder decision: TODO

```json
{
  "id": "apex_pattern_omnichannel_fulfillment_decisioning_gap",
  "client_id": "bb8ed961-a049-4d0c-a38f-f8912138fceb",
  "ordinal_ref": "3.2",
  "name": "Omnichannel Fulfillment Decisioning Gap",
  "short_description": "Foundational pattern pack (#12 in north star top 20) — retail-specific.",
  "long_description": "Foundational pattern pack (#12 in north star top 20) — retail-specific.",
  "category": "Omnichannel Operations — Fulfillment Logic",
  "sector_applicability": [
    "retail"
  ],
  "cross_industry": false,
  "variant_of": null,
  "trigger_symptoms": [
    "Same-day fulfillment <50% while peers at 65%+\n- Out-of-stock rate >5% while inventory turns peer-average\n- Ship-from-store volume <40% of online fulfillment\n- Customer satisfaction top-box gap on fulfillment experience\n- Click-and-collect adoption <30% with friction signals in journey"
  ],
  "detection_signals": [
    "Same-day fulfillment <50% while peers at 65%+\n- Out-of-stock rate >5% while inventory turns peer-average\n- Ship-from-store volume <40% of online fulfillment\n- Customer satisfaction top-box gap on fulfillment experience\n- Click-and-collect adoption <30% with friction signals in journey"
  ],
  "diagnostic_questions": [],
  "evidence_requirements": [],
  "likely_root_causes": [
    "Fulfillment decisioning rules not optimized for margin + customer experience tradeoffs",
    "inventory visibility incomplete across nodes",
    "ship-from-store capability inconsistent by store",
    "labor model not supporting store fulfillment",
    "last-mile partner economics unfavorable"
  ],
  "common_adjacent_contradictions": [],
  "benchmark_signatures": [],
  "intervention_options": [
    "Fulfillment orchestration platform (decisioning engine)\n- Real-time inventory visibility across all nodes\n- Store fulfillment capability standardization\n- Labor model redesign for omnichannel operations\n- Last-mile partner strategy review (owned vs partner)"
  ],
  "anti_patterns": [],
  "common_failure_modes": [],
  "phase_1_deliverables": [
    "Same-day fulfillment <50% while peers at 65%+\n- Out-of-stock rate >5% while inventory turns peer-average\n- Ship-from-store volume <40% of online fulfillment\n- Customer satisfaction top-box gap on fulfillment experience\n- Click-and-collect adoption <30% with friction signals in journey"
  ],
  "phase_2_deliverables": [
    "Fulfillment orchestration platform (decisioning engine)\n- Real-time inventory visibility across all nodes\n- Store fulfillment capability standardization\n- Labor model redesign for omnichannel operations\n- Last-mile partner strategy review (owned vs partner)"
  ],
  "phase_3_deliverables": [
    "Decision package with sponsor tradeoffs",
    "Sequenced roadmap with KPI guardrails",
    "Operating model and ownership alignment"
  ],
  "phase_4_deliverables": [
    "Execution plan and workstream mobilization",
    "Change management and adoption tracking",
    "KPI instrumentation and cadence reviews"
  ],
  "expected_time_to_value": {},
  "success_metrics": [],
  "leading_indicators": [],
  "required_sponsor_profile": {},
  "required_capabilities": [],
  "typical_stakeholders": [],
  "common_objections": [],
  "applicable_company_scales": [],
  "cross_pattern_links": [],
  "linked_kpi_ids": [
    "apex_same_day_fulfillment_pct",
    "apex_click_collect_adoption",
    "apex_sfs_volume",
    "apex_oos_rate",
    "apex_csat_omnichannel"
  ],
  "evidence_summary": "42% same-day vs Target 70%+ · inventory visibility lag of 4-6 hours in peak periods · 31% SFS volume vs 52% target · customer complaints concentrated on fulfillment experience",
  "confidence_level": "high",
  "last_updated": "2026-04-21T05:00:00.000Z",
  "version": "1.0",
  "author": "AbarVa North Star overlay",
  "reasoning_scope_id": "apex_scope_broad",
  "disclosure_scope_id": "apex_scope_broad",
  "source_id": null,
  "as_of_date": "2026-04-21T05:00:00.000Z",
  "last_verified_at": "2026-04-21T00:00:00.000Z",
  "raw_markdown": "### 3.2 · Omnichannel Fulfillment Decisioning Gap\n\nFoundational pattern pack (#12 in north star top 20) — retail-specific.\n\n**Classification.** Category: Omnichannel Operations — Fulfillment Logic · Sector applicability: retail\n\n**Detection signals.**\n- Same-day fulfillment <50% while peers at 65%+\n- Out-of-stock rate >5% while inventory turns peer-average\n- Ship-from-store volume <40% of online fulfillment\n- Customer satisfaction top-box gap on fulfillment experience\n- Click-and-collect adoption <30% with friction signals in journey\n\n**Likely root causes.** Fulfillment decisioning rules not optimized for margin + customer experience tradeoffs · inventory visibility incomplete across nodes · ship-from-store capability inconsistent by store · labor model not supporting store fulfillment · last-mile partner economics unfavorable\n\n**Intervention options.**\n- Fulfillment orchestration platform (decisioning engine)\n- Real-time inventory visibility across all nodes\n- Store fulfillment capability standardization\n- Labor model redesign for omnichannel operations\n- Last-mile partner strategy review (owned vs partner)\n\n**Linked KPIs.** Same-Day Fulfillment (2.4.2), Click-and-Collect (2.4.3), Ship-From-Store (2.4.4), Out-of-Stock (2.6.2), CSAT Omnichannel (2.3.2)\n\n**Asterline evidence.** 42% same-day vs Target 70%+ · inventory visibility lag of 4-6 hours in peak periods · 31% SFS volume vs 52% target · customer complaints concentrated on fulfillment experience",
  "metadata": {
    "classification": "Category: Omnichannel Operations — Fulfillment Logic · Sector applicability: retail",
    "linked_kpi_names": [
      "Same-Day Fulfillment %",
      "Click-and-Collect Adoption",
      "Ship-From-Store Volume",
      "Out-of-Stock Rate",
      "Customer Satisfaction (Omnichannel Survey)"
    ],
    "linked_kpis_text": "Same-Day Fulfillment (2.4.2), Click-and-Collect (2.4.3), Ship-From-Store (2.4.4), Out-of-Stock (2.6.2), CSAT Omnichannel (2.3.2)",
    "expected_outcomes": [],
    "required_sponsor_profile": null
  },
  "created_at": "2026-04-21T20:53:47.455Z",
  "updated_at": "2026-05-09T17:17:23.683Z",
  "client_name": "Apex Retail",
  "tenant_key": "apex-retail",
  "industry_code": "RETAIL"
}
```

### 3. apex_pattern_customer_data_platform_consolidation — Customer Data Platform Consolidation

- Client: Apex Retail (apex-retail, RETAIL)
- Category: unknown
- Recommended classification: industry-applicable
- Recommendation rationale: Recommended corpus_patterns because the pattern appears reusable at industry or cross-industry level after provenance is preserved.
- Founder decision: TODO

```json
{
  "id": "apex_pattern_customer_data_platform_consolidation",
  "client_id": "bb8ed961-a049-4d0c-a38f-f8912138fceb",
  "ordinal_ref": "3.4",
  "name": "Customer Data Platform Consolidation",
  "short_description": "Foundational cross-industry pattern — retail application.",
  "long_description": "Foundational cross-industry pattern — retail application.",
  "category": null,
  "sector_applicability": [
    "retail"
  ],
  "cross_industry": false,
  "variant_of": null,
  "trigger_symptoms": [
    "Multiple customer data stores (CRM, loyalty, e-commerce, stores, marketing) without unified view",
    "segmentation inconsistency across channels",
    "customer experience personalization limited",
    "data quality degradation in 360 views"
  ],
  "detection_signals": [
    "Multiple customer data stores (CRM, loyalty, e-commerce, stores, marketing) without unified view",
    "segmentation inconsistency across channels",
    "customer experience personalization limited",
    "data quality degradation in 360 views"
  ],
  "diagnostic_questions": [],
  "evidence_requirements": [],
  "likely_root_causes": [],
  "common_adjacent_contradictions": [],
  "benchmark_signatures": [],
  "intervention_options": [],
  "anti_patterns": [],
  "common_failure_modes": [],
  "phase_1_deliverables": [
    "Multiple customer data stores (CRM, loyalty, e-commerce, stores, marketing) without unified view",
    "segmentation inconsistency across channels",
    "customer experience personalization limited"
  ],
  "phase_2_deliverables": [],
  "phase_3_deliverables": [
    "Decision package with sponsor tradeoffs",
    "Sequenced roadmap with KPI guardrails",
    "Operating model and ownership alignment"
  ],
  "phase_4_deliverables": [
    "Execution plan and workstream mobilization",
    "Change management and adoption tracking",
    "KPI instrumentation and cadence reviews"
  ],
  "expected_time_to_value": {},
  "success_metrics": [],
  "leading_indicators": [],
  "required_sponsor_profile": {},
  "required_capabilities": [],
  "typical_stakeholders": [],
  "common_objections": [],
  "applicable_company_scales": [],
  "cross_pattern_links": [],
  "linked_kpi_ids": [
    "apex_loyalty_active_members",
    "apex_loyalty_member_spend_premium",
    "apex_retention_12mo",
    "apex_nps"
  ],
  "evidence_summary": "4 customer data stores (enterprise CRM, loyalty platform, e-commerce customer, store clienteling) · segmentation consistency <60% across channels · loyalty penetration stalled at 62M while peers growing",
  "confidence_level": "high",
  "last_updated": "2026-04-21T05:00:00.000Z",
  "version": "1.0",
  "author": "AbarVa North Star overlay",
  "reasoning_scope_id": "apex_scope_broad",
  "disclosure_scope_id": "apex_scope_broad",
  "source_id": null,
  "as_of_date": "2026-04-21T05:00:00.000Z",
  "last_verified_at": "2026-04-21T00:00:00.000Z",
  "raw_markdown": "### 3.4 · Customer Data Platform Consolidation\n\nFoundational cross-industry pattern — retail application.\n\n**Detection signals.** Multiple customer data stores (CRM, loyalty, e-commerce, stores, marketing) without unified view · segmentation inconsistency across channels · customer experience personalization limited · data quality degradation in 360 views\n\n**Asterline evidence.** 4 customer data stores (enterprise CRM, loyalty platform, e-commerce customer, store clienteling) · segmentation consistency <60% across channels · loyalty penetration stalled at 62M while peers growing\n\n**Linked KPIs.** Loyalty Active Members (2.3.7), Loyalty Member Spend Premium (2.3.8), Retention (2.3.9), NPS (2.3.1)",
  "metadata": {
    "classification": null,
    "linked_kpi_names": [
      "Loyalty Active Members",
      "Loyalty Member Spend Premium",
      "Customer Retention (12-Month)",
      "Net Promoter Score"
    ],
    "linked_kpis_text": "Loyalty Active Members (2.3.7), Loyalty Member Spend Premium (2.3.8), Retention (2.3.9), NPS (2.3.1)",
    "expected_outcomes": [],
    "required_sponsor_profile": null
  },
  "created_at": "2026-04-21T20:53:47.455Z",
  "updated_at": "2026-05-09T17:17:23.683Z",
  "client_name": "Apex Retail",
  "tenant_key": "apex-retail",
  "industry_code": "RETAIL"
}
```

### 4. apex_pattern_enterprise_analytics_modernization — Enterprise Analytics Modernization

- Client: Apex Retail (apex-retail, RETAIL)
- Category: unknown
- Recommended classification: industry-applicable
- Recommendation rationale: Recommended corpus_patterns because the pattern appears reusable at industry or cross-industry level after provenance is preserved.
- Founder decision: TODO

```json
{
  "id": "apex_pattern_enterprise_analytics_modernization",
  "client_id": "bb8ed961-a049-4d0c-a38f-f8912138fceb",
  "ordinal_ref": "3.5",
  "name": "Enterprise Analytics Modernization",
  "short_description": "Foundational cross-industry pattern.",
  "long_description": "Foundational cross-industry pattern.",
  "category": null,
  "sector_applicability": [
    "retail"
  ],
  "cross_industry": false,
  "variant_of": null,
  "trigger_symptoms": [
    "Analytics capability fragmented across BUs",
    "data platform not scaled for current workloads",
    "analytical talent concentration in small team",
    "use case backlog significantly exceeds delivery"
  ],
  "detection_signals": [
    "Analytics capability fragmented across BUs",
    "data platform not scaled for current workloads",
    "analytical talent concentration in small team",
    "use case backlog significantly exceeds delivery"
  ],
  "diagnostic_questions": [],
  "evidence_requirements": [],
  "likely_root_causes": [],
  "common_adjacent_contradictions": [],
  "benchmark_signatures": [],
  "intervention_options": [],
  "anti_patterns": [],
  "common_failure_modes": [],
  "phase_1_deliverables": [
    "Analytics capability fragmented across BUs",
    "data platform not scaled for current workloads",
    "analytical talent concentration in small team"
  ],
  "phase_2_deliverables": [],
  "phase_3_deliverables": [
    "Decision package with sponsor tradeoffs",
    "Sequenced roadmap with KPI guardrails",
    "Operating model and ownership alignment"
  ],
  "phase_4_deliverables": [
    "Execution plan and workstream mobilization",
    "Change management and adoption tracking",
    "KPI instrumentation and cadence reviews"
  ],
  "expected_time_to_value": {},
  "success_metrics": [],
  "leading_indicators": [],
  "required_sponsor_profile": {},
  "required_capabilities": [],
  "typical_stakeholders": [],
  "common_objections": [],
  "applicable_company_scales": [],
  "cross_pattern_links": [],
  "linked_kpi_ids": [
    "apex_ai_governance_maturity",
    "apex_decision_latency_capital"
  ],
  "evidence_summary": "3 distinct analytics platforms across merchandising/customer/supply chain · use case backlog 73 identified, 18 delivered · analytics talent concentrated in 28-person team serving $80B revenue enterprise",
  "confidence_level": "high",
  "last_updated": "2026-04-21T05:00:00.000Z",
  "version": "1.0",
  "author": "AbarVa North Star overlay",
  "reasoning_scope_id": "apex_scope_broad",
  "disclosure_scope_id": "apex_scope_broad",
  "source_id": null,
  "as_of_date": "2026-04-21T05:00:00.000Z",
  "last_verified_at": "2026-04-21T00:00:00.000Z",
  "raw_markdown": "### 3.5 · Enterprise Analytics Modernization\n\nFoundational cross-industry pattern.\n\n**Detection signals.** Analytics capability fragmented across BUs · data platform not scaled for current workloads · analytical talent concentration in small team · use case backlog significantly exceeds delivery\n\n**Asterline evidence.** 3 distinct analytics platforms across merchandising/customer/supply chain · use case backlog 73 identified, 18 delivered · analytics talent concentrated in 28-person team serving $80B revenue enterprise\n\n**Linked KPIs.** AI Governance Maturity (2.8.2), Decision Latency Capital (2.8.3)",
  "metadata": {
    "classification": null,
    "linked_kpi_names": [
      "AI Governance Maturity",
      "Decision Latency (Capital Prioritization)"
    ],
    "linked_kpis_text": "AI Governance Maturity (2.8.2), Decision Latency Capital (2.8.3)",
    "expected_outcomes": [],
    "required_sponsor_profile": null
  },
  "created_at": "2026-04-21T20:53:47.455Z",
  "updated_at": "2026-05-09T17:17:23.683Z",
  "client_name": "Apex Retail",
  "tenant_key": "apex-retail",
  "industry_code": "RETAIL"
}
```

### 5. apex_pattern_loss_prevention_modernization — Loss Prevention Modernization

- Client: Apex Retail (apex-retail, RETAIL)
- Category: unknown
- Recommended classification: industry-applicable
- Recommendation rationale: Recommended corpus_patterns because the pattern appears reusable at industry or cross-industry level after provenance is preserved.
- Founder decision: TODO

```json
{
  "id": "apex_pattern_loss_prevention_modernization",
  "client_id": "bb8ed961-a049-4d0c-a38f-f8912138fceb",
  "ordinal_ref": "3.7",
  "name": "Loss Prevention Modernization",
  "short_description": "Retail-specific pattern (not in core 20, Asterline-specific severity).",
  "long_description": "Retail-specific pattern (not in core 20, Asterline-specific severity).",
  "category": null,
  "sector_applicability": [
    "retail"
  ],
  "cross_industry": false,
  "variant_of": null,
  "trigger_symptoms": [
    "Shrinkage >1.5%",
    "organized retail crime evidence",
    "associate safety concerns",
    "community relations tension",
    "technology investment below industry pace"
  ],
  "detection_signals": [
    "Shrinkage >1.5%",
    "organized retail crime evidence",
    "associate safety concerns",
    "community relations tension",
    "technology investment below industry pace"
  ],
  "diagnostic_questions": [],
  "evidence_requirements": [],
  "likely_root_causes": [],
  "common_adjacent_contradictions": [],
  "benchmark_signatures": [],
  "intervention_options": [],
  "anti_patterns": [],
  "common_failure_modes": [],
  "phase_1_deliverables": [
    "Shrinkage >1.5%",
    "organized retail crime evidence",
    "associate safety concerns"
  ],
  "phase_2_deliverables": [],
  "phase_3_deliverables": [
    "Decision package with sponsor tradeoffs",
    "Sequenced roadmap with KPI guardrails",
    "Operating model and ownership alignment"
  ],
  "phase_4_deliverables": [
    "Execution plan and workstream mobilization",
    "Change management and adoption tracking",
    "KPI instrumentation and cadence reviews"
  ],
  "expected_time_to_value": {},
  "success_metrics": [],
  "leading_indicators": [],
  "required_sponsor_profile": {},
  "required_capabilities": [],
  "typical_stakeholders": [],
  "common_objections": [],
  "applicable_company_scales": [],
  "cross_pattern_links": [],
  "linked_kpi_ids": [
    "apex_shrinkage_pct",
    "apex_store_engagement",
    "apex_store_operational_availability"
  ],
  "evidence_summary": "1.8% shrinkage vs 1.3% target and 1.5% median · concentrated ORC in 40 high-priority stores · associate safety incident rate up 40% YoY · technology investment trailing peer pace",
  "confidence_level": "high",
  "last_updated": "2026-04-21T05:00:00.000Z",
  "version": "1.0",
  "author": "AbarVa North Star overlay",
  "reasoning_scope_id": "apex_scope_broad",
  "disclosure_scope_id": "apex_scope_broad",
  "source_id": null,
  "as_of_date": "2026-04-21T05:00:00.000Z",
  "last_verified_at": "2026-04-21T00:00:00.000Z",
  "raw_markdown": "### 3.7 · Loss Prevention Modernization\n\nRetail-specific pattern (not in core 20, Asterline-specific severity).\n\n**Detection signals.** Shrinkage >1.5% · organized retail crime evidence · associate safety concerns · community relations tension · technology investment below industry pace\n\n**Asterline evidence.** 1.8% shrinkage vs 1.3% target and 1.5% median · concentrated ORC in 40 high-priority stores · associate safety incident rate up 40% YoY · technology investment trailing peer pace\n\n**Linked KPIs.** Shrinkage (2.5.2), Store Engagement (2.7.1), Store Operational Availability (2.5.5)\n\n---",
  "metadata": {
    "classification": null,
    "linked_kpi_names": [
      "Shrinkage %",
      "Store Team Engagement",
      "Store Operational Availability"
    ],
    "linked_kpis_text": "Shrinkage (2.5.2), Store Engagement (2.7.1), Store Operational Availability (2.5.5)",
    "expected_outcomes": [],
    "required_sponsor_profile": null
  },
  "created_at": "2026-04-21T20:53:47.455Z",
  "updated_at": "2026-05-09T17:17:23.683Z",
  "client_name": "Apex Retail",
  "tenant_key": "apex-retail",
  "industry_code": "RETAIL"
}
```

### 6. apex_pattern_shadow_ai_in_merchandising_and_customer_operations — Shadow AI in Merchandising and Customer Operations

- Client: Apex Retail (apex-retail, RETAIL)
- Category: unknown
- Recommended classification: industry-applicable
- Recommendation rationale: Recommended corpus_patterns because the pattern appears reusable at industry or cross-industry level after provenance is preserved.
- Founder decision: TODO

```json
{
  "id": "apex_pattern_shadow_ai_in_merchandising_and_customer_operations",
  "client_id": "bb8ed961-a049-4d0c-a38f-f8912138fceb",
  "ordinal_ref": "3.3",
  "name": "Shadow AI in Merchandising and Customer Operations",
  "short_description": "Retail-specific instantiation of the cross-industry Shadow AI Governance foundational pattern pack (#1 in north star top 20).",
  "long_description": "Retail-specific instantiation of the cross-industry Shadow AI Governance foundational pattern pack (#1 in north star top 20).",
  "category": null,
  "sector_applicability": [
    "retail"
  ],
  "cross_industry": true,
  "variant_of": "Shadow AI Governance",
  "trigger_symptoms": [
    "AI tool procurement below governance threshold",
    "AI governance policy vs practice contradiction",
    "customer-facing AI without model governance",
    "price optimization tools with limited oversight"
  ],
  "detection_signals": [
    "AI tool procurement below governance threshold",
    "AI governance policy vs practice contradiction",
    "customer-facing AI without model governance",
    "price optimization tools with limited oversight"
  ],
  "diagnostic_questions": [],
  "evidence_requirements": [],
  "likely_root_causes": [],
  "common_adjacent_contradictions": [],
  "benchmark_signatures": [],
  "intervention_options": [],
  "anti_patterns": [],
  "common_failure_modes": [],
  "phase_1_deliverables": [
    "AI tool procurement below governance threshold",
    "AI governance policy vs practice contradiction",
    "customer-facing AI without model governance"
  ],
  "phase_2_deliverables": [],
  "phase_3_deliverables": [
    "Decision package with sponsor tradeoffs",
    "Sequenced roadmap with KPI guardrails",
    "Operating model and ownership alignment"
  ],
  "phase_4_deliverables": [
    "Execution plan and workstream mobilization",
    "Change management and adoption tracking",
    "KPI instrumentation and cadence reviews"
  ],
  "expected_time_to_value": {},
  "success_metrics": [],
  "leading_indicators": [],
  "required_sponsor_profile": {},
  "required_capabilities": [],
  "typical_stakeholders": [],
  "common_objections": [],
  "applicable_company_scales": [],
  "cross_pattern_links": [],
  "linked_kpi_ids": [
    "apex_ai_governance_maturity",
    "apex_cybersecurity_maturity",
    "apex_csat_omnichannel",
    "apex_conversion_rate_digital"
  ],
  "evidence_summary": "14 AI tools identified across merchandising, customer ops, pricing, and marketing · $2.1M annualized spend · 9/14 below formal governance threshold · 3 with customer-facing inference · 2 with pricing decision integration",
  "confidence_level": "high",
  "last_updated": "2026-04-21T05:00:00.000Z",
  "version": "1.0",
  "author": "AbarVa North Star overlay",
  "reasoning_scope_id": "apex_scope_broad",
  "disclosure_scope_id": "apex_scope_broad",
  "source_id": null,
  "as_of_date": "2026-04-21T05:00:00.000Z",
  "last_verified_at": "2026-04-21T00:00:00.000Z",
  "raw_markdown": "### 3.3 · Shadow AI in Merchandising and Customer Operations\n\nRetail-specific instantiation of the cross-industry Shadow AI Governance foundational pattern pack (#1 in north star top 20).\n\n**Classification.** Variant of: Shadow AI Governance · Cross-industry: yes · Sector applicability: retail\n\n**Detection signals.** AI tool procurement below governance threshold · AI governance policy vs practice contradiction · customer-facing AI without model governance · price optimization tools with limited oversight\n\n**Asterline evidence.** 14 AI tools identified across merchandising, customer ops, pricing, and marketing · $2.1M annualized spend · 9/14 below formal governance threshold · 3 with customer-facing inference · 2 with pricing decision integration\n\n**Linked KPIs.** AI Governance Maturity (2.8.2), Cybersecurity Maturity (2.8.1), CSAT Omnichannel (2.3.2), Conversion Rate Digital (2.3.6)",
  "metadata": {
    "classification": "Variant of: Shadow AI Governance · Cross-industry: yes · Sector applicability: retail",
    "linked_kpi_names": [
      "AI Governance Maturity",
      "Cybersecurity Maturity (NIST CSF)",
      "Customer Satisfaction (Omnichannel Survey)",
      "Conversion Rate (Digital)"
    ],
    "linked_kpis_text": "AI Governance Maturity (2.8.2), Cybersecurity Maturity (2.8.1), CSAT Omnichannel (2.3.2), Conversion Rate Digital (2.3.6)",
    "expected_outcomes": [],
    "required_sponsor_profile": null
  },
  "created_at": "2026-04-21T20:53:47.455Z",
  "updated_at": "2026-05-09T17:17:23.683Z",
  "client_name": "Apex Retail",
  "tenant_key": "apex-retail",
  "industry_code": "RETAIL"
}
```

### 7. apex_pattern_store_workforce_productivity_and_engagement_gap — Store Workforce Productivity and Engagement Gap

- Client: Apex Retail (apex-retail, RETAIL)
- Category: unknown
- Recommended classification: industry-applicable
- Recommendation rationale: Recommended corpus_patterns because the pattern appears reusable at industry or cross-industry level after provenance is preserved.
- Founder decision: TODO

```json
{
  "id": "apex_pattern_store_workforce_productivity_and_engagement_gap",
  "client_id": "bb8ed961-a049-4d0c-a38f-f8912138fceb",
  "ordinal_ref": "3.6",
  "name": "Store Workforce Productivity and Engagement Gap",
  "short_description": "Foundational cross-industry pattern — retail-specific application.",
  "long_description": "Foundational cross-industry pattern — retail-specific application.",
  "category": null,
  "sector_applicability": [
    "retail"
  ],
  "cross_industry": false,
  "variant_of": null,
  "trigger_symptoms": [
    "Store engagement <70% while retention target-level",
    "productivity below peer median",
    "labor scheduling rigidity",
    "career path clarity issues",
    "compensation competitiveness gaps"
  ],
  "detection_signals": [
    "Store engagement <70% while retention target-level",
    "productivity below peer median",
    "labor scheduling rigidity",
    "career path clarity issues",
    "compensation competitiveness gaps"
  ],
  "diagnostic_questions": [],
  "evidence_requirements": [],
  "likely_root_causes": [],
  "common_adjacent_contradictions": [],
  "benchmark_signatures": [],
  "intervention_options": [],
  "anti_patterns": [],
  "common_failure_modes": [],
  "phase_1_deliverables": [
    "Store engagement <70% while retention target-level",
    "productivity below peer median",
    "labor scheduling rigidity"
  ],
  "phase_2_deliverables": [],
  "phase_3_deliverables": [
    "Decision package with sponsor tradeoffs",
    "Sequenced roadmap with KPI guardrails",
    "Operating model and ownership alignment"
  ],
  "phase_4_deliverables": [
    "Execution plan and workstream mobilization",
    "Change management and adoption tracking",
    "KPI instrumentation and cadence reviews"
  ],
  "expected_time_to_value": {},
  "success_metrics": [],
  "leading_indicators": [],
  "required_sponsor_profile": {},
  "required_capabilities": [],
  "typical_stakeholders": [],
  "common_objections": [],
  "applicable_company_scales": [],
  "cross_pattern_links": [],
  "linked_kpi_ids": [
    "apex_store_engagement",
    "apex_store_retention",
    "apex_store_labor_productivity",
    "apex_csat_omnichannel"
  ],
  "evidence_summary": "68% engagement vs 76% target · 62% retention above industry but below aspiration · labor model designed for stability not flexibility · career progression unclear for 60%+ of store team",
  "confidence_level": "high",
  "last_updated": "2026-04-21T05:00:00.000Z",
  "version": "1.0",
  "author": "AbarVa North Star overlay",
  "reasoning_scope_id": "apex_scope_broad",
  "disclosure_scope_id": "apex_scope_broad",
  "source_id": null,
  "as_of_date": "2026-04-21T05:00:00.000Z",
  "last_verified_at": "2026-04-21T00:00:00.000Z",
  "raw_markdown": "### 3.6 · Store Workforce Productivity and Engagement Gap\n\nFoundational cross-industry pattern — retail-specific application.\n\n**Detection signals.** Store engagement <70% while retention target-level · productivity below peer median · labor scheduling rigidity · career path clarity issues · compensation competitiveness gaps\n\n**Asterline evidence.** 68% engagement vs 76% target · 62% retention above industry but below aspiration · labor model designed for stability not flexibility · career progression unclear for 60%+ of store team\n\n**Linked KPIs.** Store Engagement (2.7.1), Store Retention (2.7.2), Store Labor Productivity (2.5.1), Customer Satisfaction (2.3.2)",
  "metadata": {
    "classification": null,
    "linked_kpi_names": [
      "Store Team Engagement",
      "Store Team Retention",
      "Store Labor Productivity",
      "Customer Satisfaction (Omnichannel Survey)"
    ],
    "linked_kpis_text": "Store Engagement (2.7.1), Store Retention (2.7.2), Store Labor Productivity (2.5.1), Customer Satisfaction (2.3.2)",
    "expected_outcomes": [],
    "required_sponsor_profile": null
  },
  "created_at": "2026-04-21T20:53:47.455Z",
  "updated_at": "2026-05-09T17:17:23.683Z",
  "client_name": "Apex Retail",
  "tenant_key": "apex-retail",
  "industry_code": "RETAIL"
}
```

### 8. firstcap_pattern_deposit_cost_and_franchise_value_erosion — Deposit Cost and Franchise Value Erosion

- Client: Brindlemark Financial (first-capital, FINSERV)
- Category: Balance Sheet Management — Deposit Franchise
- Recommended classification: client-specific
- Recommendation rationale: Recommended client_private_patterns because the row appears tied to a named tenant, local evidence, program context, or client-specific operating condition.
- Founder decision: TODO

```json
{
  "id": "firstcap_pattern_deposit_cost_and_franchise_value_erosion",
  "client_id": "a75687bf-71b9-4524-ab4e-68ae3f28d200",
  "ordinal_ref": "3.2",
  "name": "Deposit Cost and Franchise Value Erosion",
  "short_description": "Foundational pattern pack — financial-services-specific.",
  "long_description": "Foundational pattern pack — financial-services-specific.",
  "category": "Balance Sheet Management — Deposit Franchise",
  "sector_applicability": [
    "banking"
  ],
  "cross_industry": false,
  "variant_of": null,
  "trigger_symptoms": [
    "Deposit growth negative while industry flat-to-positive\n- Non-interest-bearing deposit % declining materially\n- Cost of deposits increasing faster than Fed Funds rate\n- Deposit attrition concentrated in specific customer segments\n- Franchise value (deposit premium implied in market cap) contracting"
  ],
  "detection_signals": [
    "Deposit growth negative while industry flat-to-positive\n- Non-interest-bearing deposit % declining materially\n- Cost of deposits increasing faster than Fed Funds rate\n- Deposit attrition concentrated in specific customer segments\n- Franchise value (deposit premium implied in market cap) contracting"
  ],
  "diagnostic_questions": [],
  "evidence_requirements": [],
  "likely_root_causes": [
    "Rate environment + competitive response",
    "digital-native competition",
    "wealth-adjacent customers moving to money market funds",
    "commercial customer liquidity management",
    "branch network vs digital experience asymmetry",
    "loyalty/relationship depth insufficient to resist rate shopping"
  ],
  "common_adjacent_contradictions": [],
  "benchmark_signatures": [],
  "intervention_options": [
    "Deposit pricing strategy refinement (segmented approach)\n- Primary-relationship depth increase (cross-franchise pattern)\n- Digital experience competitiveness acceleration\n- Treasury services expansion for commercial deposits\n- Branch network rationalization with digital substitution"
  ],
  "anti_patterns": [],
  "common_failure_modes": [],
  "phase_1_deliverables": [
    "Deposit growth negative while industry flat-to-positive\n- Non-interest-bearing deposit % declining materially\n- Cost of deposits increasing faster than Fed Funds rate\n- Deposit attrition concentrated in specific customer segments\n- Franchise value (deposit premium implied in market cap) contracting"
  ],
  "phase_2_deliverables": [
    "Deposit pricing strategy refinement (segmented approach)\n- Primary-relationship depth increase (cross-franchise pattern)\n- Digital experience competitiveness acceleration\n- Treasury services expansion for commercial deposits\n- Branch network rationalization with digital substitution"
  ],
  "phase_3_deliverables": [
    "Decision package with sponsor tradeoffs",
    "Sequenced roadmap with KPI guardrails",
    "Operating model and ownership alignment"
  ],
  "phase_4_deliverables": [
    "Execution plan and workstream mobilization",
    "Change management and adoption tracking",
    "KPI instrumentation and cadence reviews"
  ],
  "expected_time_to_value": {},
  "success_metrics": [],
  "leading_indicators": [],
  "required_sponsor_profile": {},
  "required_capabilities": [],
  "typical_stakeholders": [],
  "common_objections": [],
  "applicable_company_scales": [],
  "cross_pattern_links": [],
  "linked_kpi_ids": [
    "firstcap_deposit_growth",
    "firstcap_cost_of_deposits",
    "firstcap_nib_deposit_pct",
    "firstcap_deposit_attrition",
    "firstcap_nim"
  ],
  "evidence_summary": "-2.1% deposit growth · 248 bps cost of deposits up 82 bps · NIB % declining · NIM compression 18 bps YoY",
  "confidence_level": "high",
  "last_updated": "2026-04-21T05:00:00.000Z",
  "version": "1.0",
  "author": "AbarVa North Star overlay",
  "reasoning_scope_id": "firstcap_scope_broad",
  "disclosure_scope_id": "firstcap_scope_broad",
  "source_id": null,
  "as_of_date": "2026-04-21T05:00:00.000Z",
  "last_verified_at": "2026-04-21T00:00:00.000Z",
  "raw_markdown": "### 3.2 · Deposit Cost and Franchise Value Erosion\n\nFoundational pattern pack — financial-services-specific.\n\n**Classification.** Category: Balance Sheet Management — Deposit Franchise · Sector applicability: banking\n\n**Detection signals.**\n- Deposit growth negative while industry flat-to-positive\n- Non-interest-bearing deposit % declining materially\n- Cost of deposits increasing faster than Fed Funds rate\n- Deposit attrition concentrated in specific customer segments\n- Franchise value (deposit premium implied in market cap) contracting\n\n**Likely root causes.** Rate environment + competitive response · digital-native competition · wealth-adjacent customers moving to money market funds · commercial customer liquidity management · branch network vs digital experience asymmetry · loyalty/relationship depth insufficient to resist rate shopping\n\n**Intervention options.**\n- Deposit pricing strategy refinement (segmented approach)\n- Primary-relationship depth increase (cross-franchise pattern)\n- Digital experience competitiveness acceleration\n- Treasury services expansion for commercial deposits\n- Branch network rationalization with digital substitution\n\n**Linked KPIs.** Deposit Growth (2.4.1), Cost of Deposits (2.4.2), NIB Deposit % (2.4.3), Deposit Attrition (2.4.4), NIM (2.1.1)\n\n**Brindlemark evidence.** -2.1% deposit growth · 248 bps cost of deposits up 82 bps · NIB % declining · NIM compression 18 bps YoY",
  "metadata": {
    "classification": "Category: Balance Sheet Management — Deposit Franchise · Sector applicability: banking",
    "linked_kpi_names": [
      "Deposit Growth",
      "Cost of Deposits",
      "Non-Interest-Bearing Deposit %",
      "Deposit Attrition Rate",
      "Net Interest Margin"
    ],
    "linked_kpis_text": "Deposit Growth (2.4.1), Cost of Deposits (2.4.2), NIB Deposit % (2.4.3), Deposit Attrition (2.4.4), NIM (2.1.1)",
    "expected_outcomes": [],
    "required_sponsor_profile": null
  },
  "created_at": "2026-04-21T22:13:45.597Z",
  "updated_at": "2026-05-09T17:13:43.200Z",
  "client_name": "Brindlemark Financial",
  "tenant_key": "first-capital",
  "industry_code": "FINSERV"
}
```

### 9. firstcap_pattern_cross_franchise_relationship_deepening_gap — Cross-Franchise Relationship Deepening Gap

- Client: Brindlemark Financial (first-capital, FINSERV)
- Category: Franchise Integration — Customer Deepening
- Recommended classification: client-specific
- Recommendation rationale: Recommended client_private_patterns because the row appears tied to a named tenant, local evidence, program context, or client-specific operating condition.
- Founder decision: TODO

```json
{
  "id": "firstcap_pattern_cross_franchise_relationship_deepening_gap",
  "client_id": "a75687bf-71b9-4524-ab4e-68ae3f28d200",
  "ordinal_ref": "3.7",
  "name": "Cross-Franchise Relationship Deepening Gap",
  "short_description": "Foundational pattern pack #16 — financial-services-specific (primary franchise-model banks).",
  "long_description": "Foundational pattern pack #16 — financial-services-specific (primary franchise-model banks).",
  "category": "Franchise Integration — Customer Deepening",
  "sector_applicability": [
    "super-regional banks, universal banks"
  ],
  "cross_industry": false,
  "variant_of": null,
  "trigger_symptoms": [
    "Wealth-bank cross-sell rate <5%\n- Commercial-wealth cross-sell rate <15%\n- Net new primary household growth below industry\n- Wealth AUM growth below organic peer benchmark\n- Referral program productivity low\n- Franchise-integration technology incomplete"
  ],
  "detection_signals": [
    "Wealth-bank cross-sell rate <5%\n- Commercial-wealth cross-sell rate <15%\n- Net new primary household growth below industry\n- Wealth AUM growth below organic peer benchmark\n- Referral program productivity low\n- Franchise-integration technology incomplete"
  ],
  "diagnostic_questions": [],
  "evidence_requirements": [],
  "likely_root_causes": [
    "Franchise silos (legacy of M&A integration)",
    "compensation alignment absent across franchises",
    "technology platform separation preventing 360-view",
    "referral processes manual",
    "brand positioning not unified"
  ],
  "common_adjacent_contradictions": [],
  "benchmark_signatures": [],
  "intervention_options": [
    "Cross-franchise technology platform (unified customer 360)\n- Compensation realignment\n- Referral process automation\n- Integrated brand architecture\n- Unified client experience design"
  ],
  "anti_patterns": [],
  "common_failure_modes": [],
  "phase_1_deliverables": [
    "Wealth-bank cross-sell rate <5%\n- Commercial-wealth cross-sell rate <15%\n- Net new primary household growth below industry\n- Wealth AUM growth below organic peer benchmark\n- Referral program productivity low\n- Franchise-integration technology incomplete"
  ],
  "phase_2_deliverables": [
    "Cross-franchise technology platform (unified customer 360)\n- Compensation realignment\n- Referral process automation\n- Integrated brand architecture\n- Unified client experience design"
  ],
  "phase_3_deliverables": [
    "Decision package with sponsor tradeoffs",
    "Sequenced roadmap with KPI guardrails",
    "Operating model and ownership alignment"
  ],
  "phase_4_deliverables": [
    "Execution plan and workstream mobilization",
    "Change management and adoption tracking",
    "KPI instrumentation and cadence reviews"
  ],
  "expected_time_to_value": {},
  "success_metrics": [],
  "leading_indicators": [],
  "required_sponsor_profile": {},
  "required_capabilities": [],
  "typical_stakeholders": [],
  "common_objections": [],
  "applicable_company_scales": [],
  "cross_pattern_links": [],
  "linked_kpi_ids": [
    "firstcap_aum_growth",
    "firstcap_wealth_net_new_households",
    "firstcap_net_new_primary_households"
  ],
  "evidence_summary": "4.2% AUM growth vs 8% target · 1.8K net new wealth households vs 3.5K target · cross-franchise cross-sell rate at 3% · legacy franchise platform separation",
  "confidence_level": "high",
  "last_updated": "2026-04-21T05:00:00.000Z",
  "version": "1.0",
  "author": "AbarVa North Star overlay",
  "reasoning_scope_id": "firstcap_scope_broad",
  "disclosure_scope_id": "firstcap_scope_broad",
  "source_id": null,
  "as_of_date": "2026-04-21T05:00:00.000Z",
  "last_verified_at": "2026-04-21T00:00:00.000Z",
  "raw_markdown": "### 3.7 · Cross-Franchise Relationship Deepening Gap\n\nFoundational pattern pack #16 — financial-services-specific (primary franchise-model banks).\n\n**Classification.** Category: Franchise Integration — Customer Deepening · Sector applicability: super-regional banks, universal banks\n\n**Detection signals.**\n- Wealth-bank cross-sell rate <5%\n- Commercial-wealth cross-sell rate <15%\n- Net new primary household growth below industry\n- Wealth AUM growth below organic peer benchmark\n- Referral program productivity low\n- Franchise-integration technology incomplete\n\n**Likely root causes.** Franchise silos (legacy of M&A integration) · compensation alignment absent across franchises · technology platform separation preventing 360-view · referral processes manual · brand positioning not unified\n\n**Intervention options.**\n- Cross-franchise technology platform (unified customer 360)\n- Compensation realignment\n- Referral process automation\n- Integrated brand architecture\n- Unified client experience design\n\n**Linked KPIs.** AUM Growth (2.6.1), Net New Households Wealth (2.6.3), Net New Primary Households Consumer (2.7.4)\n\n**Brindlemark evidence.** 4.2% AUM growth vs 8% target · 1.8K net new wealth households vs 3.5K target · cross-franchise cross-sell rate at 3% · legacy franchise platform separation\n\n---",
  "metadata": {
    "classification": "Category: Franchise Integration — Customer Deepening · Sector applicability: super-regional banks, universal banks",
    "linked_kpi_names": [
      "AUM Growth",
      "Net New Households (Wealth)",
      "Net New Primary Households (Consumer)"
    ],
    "linked_kpis_text": "AUM Growth (2.6.1), Net New Households Wealth (2.6.3), Net New Primary Households Consumer (2.7.4)",
    "expected_outcomes": [],
    "required_sponsor_profile": null
  },
  "created_at": "2026-04-21T22:13:45.597Z",
  "updated_at": "2026-05-09T17:13:43.200Z",
  "client_name": "Brindlemark Financial",
  "tenant_key": "first-capital",
  "industry_code": "FINSERV"
}
```

### 10. firstcap_pattern_aml_bsa_compliance_modernization — AML/BSA Compliance Modernization

- Client: Brindlemark Financial (first-capital, FINSERV)
- Category: Regulatory Compliance — Financial Crimes
- Recommended classification: client-specific
- Recommendation rationale: Recommended client_private_patterns because the row appears tied to a named tenant, local evidence, program context, or client-specific operating condition.
- Founder decision: TODO

```json
{
  "id": "firstcap_pattern_aml_bsa_compliance_modernization",
  "client_id": "a75687bf-71b9-4524-ab4e-68ae3f28d200",
  "ordinal_ref": "3.1",
  "name": "AML/BSA Compliance Modernization",
  "short_description": "Foundational pattern pack #15 — financial-services-specific.",
  "long_description": "Foundational pattern pack #15 — financial-services-specific.",
  "category": "Regulatory Compliance — Financial Crimes",
  "sector_applicability": [
    "financial services (all depository institutions, broker-dealers, crypto)"
  ],
  "cross_industry": false,
  "variant_of": null,
  "trigger_symptoms": [
    "False positive rate >90% on AML alerts\n- Alert-to-SAR ratio heavily skewed to false positives\n- Investigator workload exceeding benchmark productivity\n- Open MRA or consent order related to BSA/AML\n- Legacy monitoring platform age >5 years\n- Minimal machine learning adoption in transaction monitoring"
  ],
  "detection_signals": [
    "False positive rate >90% on AML alerts\n- Alert-to-SAR ratio heavily skewed to false positives\n- Investigator workload exceeding benchmark productivity\n- Open MRA or consent order related to BSA/AML\n- Legacy monitoring platform age >5 years\n- Minimal machine learning adoption in transaction monitoring"
  ],
  "diagnostic_questions": [],
  "evidence_requirements": [],
  "likely_root_causes": [
    "Legacy rule-based monitoring with excessive false positives",
    "investigator capacity constrained",
    "machine learning adoption blocked by model risk management process",
    "regulatory scrutiny following prior findings",
    "data integration gaps across banking systems"
  ],
  "common_adjacent_contradictions": [],
  "benchmark_signatures": [],
  "intervention_options": [
    "Machine learning model deployment for alert prioritization (MRM-compliant)\n- Investigator workflow automation\n- Platform modernization (typically 24-36 month program)\n- Data integration across transaction sources\n- Regulatory constructive engagement on modernization roadmap"
  ],
  "anti_patterns": [],
  "common_failure_modes": [],
  "phase_1_deliverables": [
    "Current state audit",
    "consent order/MRA mapping",
    "platform assessment",
    "benchmark analysis",
    "regulator relationship mapping"
  ],
  "phase_2_deliverables": [
    "Platform options",
    "ML governance options",
    "workflow automation opportunities",
    "regulatory engagement plan"
  ],
  "phase_3_deliverables": [
    "Platform decision",
    "implementation roadmap",
    "MRM integration plan",
    "regulator engagement strategy"
  ],
  "phase_4_deliverables": [
    "Platform build",
    "model deployment",
    "workflow rollout",
    "regulatory milestone tracking"
  ],
  "expected_time_to_value": {},
  "success_metrics": [],
  "leading_indicators": [],
  "required_sponsor_profile": {},
  "required_capabilities": [],
  "typical_stakeholders": [],
  "common_objections": [],
  "applicable_company_scales": [],
  "cross_pattern_links": [],
  "linked_kpi_ids": [
    "firstcap_aml_alert_volume",
    "firstcap_aml_false_positive_rate",
    "firstcap_sar_filings_monthly",
    "firstcap_regulatory_exam_findings_open",
    "firstcap_efficiency_ratio"
  ],
  "evidence_summary": "Active consent order context (per base seed) · 96% false positive rate vs 85% target · investigator productivity below peer · regulatory remediation commitments outstanding",
  "confidence_level": "high",
  "last_updated": "2026-04-21T05:00:00.000Z",
  "version": "1.0",
  "author": "AbarVa North Star overlay",
  "reasoning_scope_id": "firstcap_scope_broad",
  "disclosure_scope_id": "firstcap_scope_broad",
  "source_id": null,
  "as_of_date": "2026-04-21T05:00:00.000Z",
  "last_verified_at": "2026-04-21T00:00:00.000Z",
  "raw_markdown": "### 3.1 · AML/BSA Compliance Modernization\n\nFoundational pattern pack #15 — financial-services-specific.\n\n**Classification.** Category: Regulatory Compliance — Financial Crimes · Sector applicability: financial services (all depository institutions, broker-dealers, crypto)\n\n**Detection signals.**\n- False positive rate >90% on AML alerts\n- Alert-to-SAR ratio heavily skewed to false positives\n- Investigator workload exceeding benchmark productivity\n- Open MRA or consent order related to BSA/AML\n- Legacy monitoring platform age >5 years\n- Minimal machine learning adoption in transaction monitoring\n\n**Likely root causes.** Legacy rule-based monitoring with excessive false positives · investigator capacity constrained · machine learning adoption blocked by model risk management process · regulatory scrutiny following prior findings · data integration gaps across banking systems\n\n**Intervention options.**\n- Machine learning model deployment for alert prioritization (MRM-compliant)\n- Investigator workflow automation\n- Platform modernization (typically 24-36 month program)\n- Data integration across transaction sources\n- Regulatory constructive engagement on modernization roadmap\n\n**Phase-mapped deliverables.**\n\n*Phase 1.* Current state audit · consent order/MRA mapping · platform assessment · benchmark analysis · regulator relationship mapping\n\n*Phase 2.* Platform options · ML governance options · workflow automation opportunities · regulatory engagement plan\n\n*Phase 3.* Platform decision · implementation roadmap · MRM integration plan · regulator engagement strategy\n\n*Phase 4.* Platform build · model deployment · workflow rollout · regulatory milestone tracking\n\n**Expected outcomes.** False positive rate reduction 20-30 points within 18 months · investigator productivity up 40%+ · consent order/MRA path to closure · efficiency ratio improvement 30-50 bps\n\n**Required sponsor profile.** Chief Compliance Officer with CFO + Chief Risk Officer partnership · enterprise scope · high political capital given regulatory context\n\n**Linked KPIs.** AML Alert Volume (2.8.1), AML False Positive Rate (2.8.2), SAR Filings (2.8.3), Regulatory Exam Findings (2.8.4), Efficiency Ratio (2.1.2)\n\n**Brindlemark evidence.** Active consent order context (per base seed) · 96% false positive rate vs 85% target · investigator productivity below peer · regulatory remediation commitments outstanding\n\n**Sensitivity.** All Brindlemark AML-related work carries **legal-privileged** material handling. Reasoning scope is program-scoped; disclosure scope is strictly program-scoped with external communication prohibited.",
  "metadata": {
    "classification": "Category: Regulatory Compliance — Financial Crimes · Sector applicability: financial services (all depository institutions, broker-dealers, crypto)",
    "linked_kpi_names": [
      "BSA/AML Alert Volume",
      "AML False Positive Rate",
      "SAR Filings (Monthly Average)",
      "Regulatory Exam Findings (Open)",
      "Efficiency Ratio"
    ],
    "linked_kpis_text": "AML Alert Volume (2.8.1), AML False Positive Rate (2.8.2), SAR Filings (2.8.3), Regulatory Exam Findings (2.8.4), Efficiency Ratio (2.1.2)",
    "expected_outcomes": [
      "False positive rate reduction 20-30 points within 18 months",
      "investigator productivity up 40%+",
      "consent order/MRA path to closure",
      "efficiency ratio improvement 30-50 bps"
    ],
    "required_sponsor_profile": "Chief Compliance Officer with CFO + Chief Risk Officer partnership · enterprise scope · high political capital given regulatory context"
  },
  "created_at": "2026-04-21T22:13:45.597Z",
  "updated_at": "2026-05-09T17:13:43.200Z",
  "client_name": "Brindlemark Financial",
  "tenant_key": "first-capital",
  "industry_code": "FINSERV"
}
```

### 11. firstcap_pattern_digital_customer_acquisition_gap — Digital Customer Acquisition Gap

- Client: Brindlemark Financial (first-capital, FINSERV)
- Category: unknown
- Recommended classification: client-specific
- Recommendation rationale: Recommended client_private_patterns because the row appears tied to a named tenant, local evidence, program context, or client-specific operating condition.
- Founder decision: TODO

```json
{
  "id": "firstcap_pattern_digital_customer_acquisition_gap",
  "client_id": "a75687bf-71b9-4524-ab4e-68ae3f28d200",
  "ordinal_ref": "3.6",
  "name": "Digital Customer Acquisition Gap",
  "short_description": "Financial-services-specific pattern.",
  "long_description": "Financial-services-specific pattern.",
  "category": null,
  "sector_applicability": [
    "financial_services"
  ],
  "cross_industry": false,
  "variant_of": null,
  "trigger_symptoms": [
    "Digital account opening % <50%",
    "mobile adoption trailing peers",
    "net new primary household growth insufficient",
    "CAC-LTV ratio unfavorable"
  ],
  "detection_signals": [
    "Digital account opening % <50%",
    "mobile adoption trailing peers",
    "net new primary household growth insufficient",
    "CAC-LTV ratio unfavorable"
  ],
  "diagnostic_questions": [],
  "evidence_requirements": [],
  "likely_root_causes": [],
  "common_adjacent_contradictions": [],
  "benchmark_signatures": [],
  "intervention_options": [],
  "anti_patterns": [],
  "common_failure_modes": [],
  "phase_1_deliverables": [
    "Digital account opening % <50%",
    "mobile adoption trailing peers",
    "net new primary household growth insufficient"
  ],
  "phase_2_deliverables": [],
  "phase_3_deliverables": [
    "Decision package with sponsor tradeoffs",
    "Sequenced roadmap with KPI guardrails",
    "Operating model and ownership alignment"
  ],
  "phase_4_deliverables": [
    "Execution plan and workstream mobilization",
    "Change management and adoption tracking",
    "KPI instrumentation and cadence reviews"
  ],
  "expected_time_to_value": {},
  "success_metrics": [],
  "leading_indicators": [],
  "required_sponsor_profile": {},
  "required_capabilities": [],
  "typical_stakeholders": [],
  "common_objections": [],
  "applicable_company_scales": [],
  "cross_pattern_links": [],
  "linked_kpi_ids": [
    "firstcap_digital_account_opening_pct",
    "firstcap_mobile_mau_growth",
    "firstcap_net_new_primary_households",
    "firstcap_digital_adoption_consumer"
  ],
  "evidence_summary": "42% digital account opening vs 68% target · mobile MAU growth 4% vs 12% target · 14K net new primary households vs 35K target",
  "confidence_level": "high",
  "last_updated": "2026-04-21T05:00:00.000Z",
  "version": "1.0",
  "author": "AbarVa North Star overlay",
  "reasoning_scope_id": "firstcap_scope_broad",
  "disclosure_scope_id": "firstcap_scope_broad",
  "source_id": null,
  "as_of_date": "2026-04-21T05:00:00.000Z",
  "last_verified_at": "2026-04-21T00:00:00.000Z",
  "raw_markdown": "### 3.6 · Digital Customer Acquisition Gap\n\nFinancial-services-specific pattern.\n\n**Detection signals.** Digital account opening % <50% · mobile adoption trailing peers · net new primary household growth insufficient · CAC-LTV ratio unfavorable\n\n**Brindlemark evidence.** 42% digital account opening vs 68% target · mobile MAU growth 4% vs 12% target · 14K net new primary households vs 35K target\n\n**Linked KPIs.** Digital Account Opening (2.7.5), Mobile MAU Growth (2.7.2), Net New Primary Households (2.7.4), Digital Adoption (2.7.1)",
  "metadata": {
    "classification": null,
    "linked_kpi_names": [
      "Digital Account Opening %",
      "Mobile Active User Growth",
      "Net New Primary Households (Consumer)",
      "Digital Adoption (Consumer)"
    ],
    "linked_kpis_text": "Digital Account Opening (2.7.5), Mobile MAU Growth (2.7.2), Net New Primary Households (2.7.4), Digital Adoption (2.7.1)",
    "expected_outcomes": [],
    "required_sponsor_profile": null
  },
  "created_at": "2026-04-21T22:13:45.597Z",
  "updated_at": "2026-05-09T17:13:43.200Z",
  "client_name": "Brindlemark Financial",
  "tenant_key": "first-capital",
  "industry_code": "FINSERV"
}
```

### 12. firstcap_pattern_operating_model_efficiency_gap — Operating Model Efficiency Gap

- Client: Brindlemark Financial (first-capital, FINSERV)
- Category: unknown
- Recommended classification: client-specific
- Recommendation rationale: Recommended client_private_patterns because the row appears tied to a named tenant, local evidence, program context, or client-specific operating condition.
- Founder decision: TODO

```json
{
  "id": "firstcap_pattern_operating_model_efficiency_gap",
  "client_id": "a75687bf-71b9-4524-ab4e-68ae3f28d200",
  "ordinal_ref": "3.5",
  "name": "Operating Model Efficiency Gap",
  "short_description": "Foundational cross-sector pattern — financial-services application.",
  "long_description": "Foundational cross-sector pattern — financial-services application.",
  "category": null,
  "sector_applicability": [
    "financial_services"
  ],
  "cross_industry": false,
  "variant_of": null,
  "trigger_symptoms": [
    "Efficiency ratio >58%",
    "peer efficiency variance",
    "technology debt constraining productivity",
    "operating model fragmentation across business units"
  ],
  "detection_signals": [
    "Efficiency ratio >58%",
    "peer efficiency variance",
    "technology debt constraining productivity",
    "operating model fragmentation across business units"
  ],
  "diagnostic_questions": [],
  "evidence_requirements": [],
  "likely_root_causes": [],
  "common_adjacent_contradictions": [],
  "benchmark_signatures": [],
  "intervention_options": [],
  "anti_patterns": [],
  "common_failure_modes": [],
  "phase_1_deliverables": [
    "Efficiency ratio >58%",
    "peer efficiency variance",
    "technology debt constraining productivity"
  ],
  "phase_2_deliverables": [],
  "phase_3_deliverables": [
    "Decision package with sponsor tradeoffs",
    "Sequenced roadmap with KPI guardrails",
    "Operating model and ownership alignment"
  ],
  "phase_4_deliverables": [
    "Execution plan and workstream mobilization",
    "Change management and adoption tracking",
    "KPI instrumentation and cadence reviews"
  ],
  "expected_time_to_value": {},
  "success_metrics": [],
  "leading_indicators": [],
  "required_sponsor_profile": {},
  "required_capabilities": [],
  "typical_stakeholders": [],
  "common_objections": [],
  "applicable_company_scales": [],
  "cross_pattern_links": [],
  "linked_kpi_ids": [
    "firstcap_efficiency_ratio",
    "firstcap_op_risk_losses_12mo"
  ],
  "evidence_summary": "59.4% efficiency ratio · productivity variance across franchise segments · technology platform fragmentation (legacy core + acquired platforms)",
  "confidence_level": "high",
  "last_updated": "2026-04-21T05:00:00.000Z",
  "version": "1.0",
  "author": "AbarVa North Star overlay",
  "reasoning_scope_id": "firstcap_scope_broad",
  "disclosure_scope_id": "firstcap_scope_broad",
  "source_id": null,
  "as_of_date": "2026-04-21T05:00:00.000Z",
  "last_verified_at": "2026-04-21T00:00:00.000Z",
  "raw_markdown": "### 3.5 · Operating Model Efficiency Gap\n\nFoundational cross-sector pattern — financial-services application.\n\n**Detection signals.** Efficiency ratio >58% · peer efficiency variance · technology debt constraining productivity · operating model fragmentation across business units\n\n**Brindlemark evidence.** 59.4% efficiency ratio · productivity variance across franchise segments · technology platform fragmentation (legacy core + acquired platforms)\n\n**Linked KPIs.** Efficiency Ratio (2.1.2), Operating Risk Losses (2.8.5)",
  "metadata": {
    "classification": null,
    "linked_kpi_names": [
      "Efficiency Ratio",
      "Operational Risk Losses (12-Month)"
    ],
    "linked_kpis_text": "Efficiency Ratio (2.1.2), Operating Risk Losses (2.8.5)",
    "expected_outcomes": [],
    "required_sponsor_profile": null
  },
  "created_at": "2026-04-21T22:13:45.597Z",
  "updated_at": "2026-05-09T17:13:43.200Z",
  "client_name": "Brindlemark Financial",
  "tenant_key": "first-capital",
  "industry_code": "FINSERV"
}
```

### 13. firstcap_pattern_portfolio_concentration_risk_management — Portfolio Concentration Risk Management

- Client: Brindlemark Financial (first-capital, FINSERV)
- Category: unknown
- Recommended classification: client-specific
- Recommendation rationale: Recommended client_private_patterns because the row appears tied to a named tenant, local evidence, program context, or client-specific operating condition.
- Founder decision: TODO

```json
{
  "id": "firstcap_pattern_portfolio_concentration_risk_management",
  "client_id": "a75687bf-71b9-4524-ab4e-68ae3f28d200",
  "ordinal_ref": "3.4",
  "name": "Portfolio Concentration Risk Management",
  "short_description": "Financial-services-specific pattern.",
  "long_description": "Financial-services-specific pattern.",
  "category": null,
  "sector_applicability": [
    "financial_services"
  ],
  "cross_industry": false,
  "variant_of": null,
  "trigger_symptoms": [
    "Commercial real estate concentration >250% of capital",
    "commercial concentration (top 25) >15% of deposits",
    "geographic concentration in specific markets",
    "industry sector concentration",
    "regulatory concentration flag triggers"
  ],
  "detection_signals": [
    "Commercial real estate concentration >250% of capital",
    "commercial concentration (top 25) >15% of deposits",
    "geographic concentration in specific markets",
    "industry sector concentration",
    "regulatory concentration flag triggers"
  ],
  "diagnostic_questions": [],
  "evidence_requirements": [],
  "likely_root_causes": [],
  "common_adjacent_contradictions": [],
  "benchmark_signatures": [],
  "intervention_options": [],
  "anti_patterns": [],
  "common_failure_modes": [],
  "phase_1_deliverables": [
    "Commercial real estate concentration >250% of capital",
    "commercial concentration (top 25) >15% of deposits",
    "geographic concentration in specific markets"
  ],
  "phase_2_deliverables": [],
  "phase_3_deliverables": [
    "Decision package with sponsor tradeoffs",
    "Sequenced roadmap with KPI guardrails",
    "Operating model and ownership alignment"
  ],
  "phase_4_deliverables": [
    "Execution plan and workstream mobilization",
    "Change management and adoption tracking",
    "KPI instrumentation and cadence reviews"
  ],
  "expected_time_to_value": {},
  "success_metrics": [],
  "leading_indicators": [],
  "required_sponsor_profile": {},
  "required_capabilities": [],
  "typical_stakeholders": [],
  "common_objections": [],
  "applicable_company_scales": [],
  "cross_pattern_links": [],
  "linked_kpi_ids": [
    "firstcap_cre_concentration",
    "firstcap_commercial_concentration_top25",
    "firstcap_nco_rate",
    "firstcap_npl_ratio"
  ],
  "evidence_summary": "268% CRE concentration (regulatory threshold 300%) · 18% top-25 commercial concentration · geographic concentration in primary banking markets",
  "confidence_level": "high",
  "last_updated": "2026-04-21T05:00:00.000Z",
  "version": "1.0",
  "author": "AbarVa North Star overlay",
  "reasoning_scope_id": "firstcap_scope_broad",
  "disclosure_scope_id": "firstcap_scope_broad",
  "source_id": null,
  "as_of_date": "2026-04-21T05:00:00.000Z",
  "last_verified_at": "2026-04-21T00:00:00.000Z",
  "raw_markdown": "### 3.4 · Portfolio Concentration Risk Management\n\nFinancial-services-specific pattern.\n\n**Detection signals.** Commercial real estate concentration >250% of capital · commercial concentration (top 25) >15% of deposits · geographic concentration in specific markets · industry sector concentration · regulatory concentration flag triggers\n\n**Brindlemark evidence.** 268% CRE concentration (regulatory threshold 300%) · 18% top-25 commercial concentration · geographic concentration in primary banking markets\n\n**Linked KPIs.** CRE Concentration (2.2.4), Commercial Concentration Top 25 (2.4.5), Net Charge-Off Rate (2.2.1), NPL Ratio (2.2.2)",
  "metadata": {
    "classification": null,
    "linked_kpi_names": [
      "Commercial Real Estate Concentration",
      "Commercial Deposit Concentration (Top 25)",
      "Net Charge-Off Rate",
      "Non-Performing Loan Ratio"
    ],
    "linked_kpis_text": "CRE Concentration (2.2.4), Commercial Concentration Top 25 (2.4.5), Net Charge-Off Rate (2.2.1), NPL Ratio (2.2.2)",
    "expected_outcomes": [],
    "required_sponsor_profile": null
  },
  "created_at": "2026-04-21T22:13:45.597Z",
  "updated_at": "2026-05-09T17:13:43.200Z",
  "client_name": "Brindlemark Financial",
  "tenant_key": "first-capital",
  "industry_code": "FINSERV"
}
```

### 14. firstcap_pattern_shadow_ai_in_lending_and_customer_operations — Shadow AI in Lending and Customer Operations

- Client: Brindlemark Financial (first-capital, FINSERV)
- Category: unknown
- Recommended classification: client-specific
- Recommendation rationale: Recommended client_private_patterns because the row appears tied to a named tenant, local evidence, program context, or client-specific operating condition.
- Founder decision: TODO

```json
{
  "id": "firstcap_pattern_shadow_ai_in_lending_and_customer_operations",
  "client_id": "a75687bf-71b9-4524-ab4e-68ae3f28d200",
  "ordinal_ref": "3.3",
  "name": "Shadow AI in Lending and Customer Operations",
  "short_description": "Financial-services variant of cross-sector Shadow AI Governance pattern.",
  "long_description": "Financial-services variant of cross-sector Shadow AI Governance pattern.",
  "category": null,
  "sector_applicability": [
    "financial_services"
  ],
  "cross_industry": false,
  "variant_of": null,
  "trigger_symptoms": [],
  "detection_signals": [],
  "diagnostic_questions": [],
  "evidence_requirements": [],
  "likely_root_causes": [],
  "common_adjacent_contradictions": [],
  "benchmark_signatures": [],
  "intervention_options": [],
  "anti_patterns": [],
  "common_failure_modes": [],
  "phase_1_deliverables": [],
  "phase_2_deliverables": [],
  "phase_3_deliverables": [
    "Decision package with sponsor tradeoffs",
    "Sequenced roadmap with KPI guardrails",
    "Operating model and ownership alignment"
  ],
  "phase_4_deliverables": [
    "Execution plan and workstream mobilization",
    "Change management and adoption tracking",
    "KPI instrumentation and cadence reviews"
  ],
  "expected_time_to_value": {},
  "success_metrics": [],
  "leading_indicators": [],
  "required_sponsor_profile": {},
  "required_capabilities": [],
  "typical_stakeholders": [],
  "common_objections": [],
  "applicable_company_scales": [],
  "cross_pattern_links": [],
  "linked_kpi_ids": [
    "firstcap_ai_governance_maturity",
    "firstcap_mrm_maturity",
    "firstcap_cybersecurity_maturity_cat"
  ],
  "evidence_summary": "12 AI tools identified · 7 below governance threshold · 3 in credit-adjacent workflows (fair lending risk) · 2 customer-facing without model governance",
  "confidence_level": "high",
  "last_updated": "2026-04-21T05:00:00.000Z",
  "version": "1.0",
  "author": "AbarVa North Star overlay",
  "reasoning_scope_id": "firstcap_scope_broad",
  "disclosure_scope_id": "firstcap_scope_broad",
  "source_id": null,
  "as_of_date": "2026-04-21T05:00:00.000Z",
  "last_verified_at": "2026-04-21T00:00:00.000Z",
  "raw_markdown": "### 3.3 · Shadow AI in Lending and Customer Operations\n\nFinancial-services variant of cross-sector Shadow AI Governance pattern.\n\n**Financial-sector-specific sensitivities.** Fair lending implications (model discrimination risk) · model risk management non-compliance · regulatory scrutiny on AI in credit decisioning · customer-facing AI without fair-treatment oversight\n\n**Brindlemark evidence.** 12 AI tools identified · 7 below governance threshold · 3 in credit-adjacent workflows (fair lending risk) · 2 customer-facing without model governance\n\n**Linked KPIs.** AI Governance Maturity (2.9.2), Model Risk Management Maturity (2.9.3), Cybersecurity Maturity (2.9.1)",
  "metadata": {
    "classification": null,
    "linked_kpi_names": [
      "AI Governance Maturity",
      "Model Risk Management Maturity (SR 11-7)",
      "Cybersecurity Maturity (FFIEC CAT)"
    ],
    "linked_kpis_text": "AI Governance Maturity (2.9.2), Model Risk Management Maturity (2.9.3), Cybersecurity Maturity (2.9.1)",
    "expected_outcomes": [],
    "required_sponsor_profile": null
  },
  "created_at": "2026-04-21T22:13:45.597Z",
  "updated_at": "2026-05-09T17:13:43.200Z",
  "client_name": "Brindlemark Financial",
  "tenant_key": "first-capital",
  "industry_code": "FINSERV"
}
```

### 15. keystone_pattern_shadow_ai_in_customer_operations_and_grid_analytics — Shadow AI in Customer Operations and Grid Analytics

- Client: Keystone Energy Holdings (keystone, ENERGY)
- Category: AI Governance
- Recommended classification: industry-applicable
- Recommendation rationale: Recommended corpus_patterns because the pattern appears reusable at industry or cross-industry level after provenance is preserved.
- Founder decision: TODO

```json
{
  "id": "keystone_pattern_shadow_ai_in_customer_operations_and_grid_analytics",
  "client_id": "63931f84-4fc8-4d13-baac-aa16b035bff2",
  "ordinal_ref": "3.1",
  "name": "Shadow AI in Customer Operations and Grid Analytics",
  "short_description": "Extends base pattern 7.1. Utility-specific instantiation of the cross-industry Shadow AI Governance foundational pattern pack (#1 in north star top 20).",
  "long_description": "Extends base pattern 7.1. Utility-specific instantiation of the cross-industry Shadow AI Governance foundational pattern pack (#1 in north star top 20).",
  "category": "AI Governance",
  "sector_applicability": [
    "utility"
  ],
  "cross_industry": true,
  "variant_of": "Shadow AI Governance",
  "trigger_symptoms": [
    "AI tool procurement below governance threshold (>5 AI-adjacent tool purchases under $150K review threshold within 12 months)\n- AI governance policy vs practice contradiction (stated policy contradicted by documented decentralized procurement)"
  ],
  "detection_signals": [
    "AI tool procurement below governance threshold (>5 AI-adjacent tool purchases under $150K review threshold within 12 months)\n- AI governance policy vs practice contradiction (stated policy contradicted by documented decentralized procurement)"
  ],
  "diagnostic_questions": [],
  "evidence_requirements": [],
  "likely_root_causes": [
    "Decentralized procurement under central review thresholds",
    "individual team pressure to adopt AI",
    "governance established but enforcement absent",
    "prior approval philosophy too slow"
  ],
  "common_adjacent_contradictions": [],
  "benchmark_signatures": [],
  "intervention_options": [
    "Enterprise AI platform with sanctioned access\n- AI governance framework with procurement integration\n- Tool consolidation leveraging enterprise contracts\n- Employee AI literacy and sanctioned-use training"
  ],
  "anti_patterns": [],
  "common_failure_modes": [],
  "phase_1_deliverables": [
    "AI tool inventory audit",
    "spend and contract posture analysis",
    "governance-vs-practice contradiction documentation",
    "critical infrastructure data exposure assessment (utility-specific)"
  ],
  "phase_2_deliverables": [
    "Root cause analysis",
    "enterprise AI platform options assessment",
    "governance framework options",
    "tool consolidation targets"
  ],
  "phase_3_deliverables": [
    "Enterprise AI platform commitment",
    "governance framework finalization with enforcement design",
    "tool consolidation roadmap",
    "migration and sunset plan"
  ],
  "phase_4_deliverables": [
    "Platform deployment",
    "governance operationalization",
    "tool consolidation execution",
    "AI governance maturity KPI tracking (2.8.1)"
  ],
  "expected_time_to_value": {},
  "success_metrics": [],
  "leading_indicators": [],
  "required_sponsor_profile": {},
  "required_capabilities": [],
  "typical_stakeholders": [],
  "common_objections": [],
  "applicable_company_scales": [],
  "cross_pattern_links": [],
  "linked_kpi_ids": [
    "keystone_ai_governance_maturity",
    "keystone_cybersecurity_maturity",
    "keystone_fcr_rate",
    "keystone_complaint_rate"
  ],
  "evidence_summary": "11 tools, $1.6M annualized, 17 teams, 7/11 with auto-renewal, 4/11 with unreviewed data sharing (NERC CIP implications)",
  "confidence_level": "high",
  "last_updated": "2026-04-21T05:00:00.000Z",
  "version": "1.0",
  "author": "AbarVa North Star overlay",
  "reasoning_scope_id": "keystone_scope_broad",
  "disclosure_scope_id": "keystone_scope_broad",
  "source_id": null,
  "as_of_date": "2026-04-21T05:00:00.000Z",
  "last_verified_at": "2026-04-21T00:00:00.000Z",
  "raw_markdown": "### 3.1 · Shadow AI in Customer Operations and Grid Analytics\n\nExtends base pattern 7.1. Utility-specific instantiation of the cross-industry Shadow AI Governance foundational pattern pack (#1 in north star top 20).\n\n**Classification.** Category: AI Governance · Variant of: Shadow AI Governance · Cross-industry: yes · Sector applicability: utility\n\n**Detection signals.**\n- AI tool procurement below governance threshold (>5 AI-adjacent tool purchases under $150K review threshold within 12 months)\n- AI governance policy vs practice contradiction (stated policy contradicted by documented decentralized procurement)\n\n**Likely root causes.** Decentralized procurement under central review thresholds · individual team pressure to adopt AI · governance established but enforcement absent · prior approval philosophy too slow\n\n**Intervention options.**\n- Enterprise AI platform with sanctioned access\n- AI governance framework with procurement integration\n- Tool consolidation leveraging enterprise contracts\n- Employee AI literacy and sanctioned-use training\n\n**Phase-mapped deliverables.**\n\n*Phase 1 — Intake.* AI tool inventory audit · spend and contract posture analysis · governance-vs-practice contradiction documentation · critical infrastructure data exposure assessment (utility-specific)\n\n*Phase 2 — Diagnosis.* Root cause analysis · enterprise AI platform options assessment · governance framework options · tool consolidation targets\n\n*Phase 3 — Decision.* Enterprise AI platform commitment · governance framework finalization with enforcement design · tool consolidation roadmap · migration and sunset plan\n\n*Phase 4 — Execution.* Platform deployment · governance operationalization · tool consolidation execution · AI governance maturity KPI tracking (2.8.1)\n\n**Expected outcomes.** Shadow AI spend reduction 40-60% within 12 months · AI governance maturity up one stage within 18 months · 80%+ contract risk remediated within 9 months\n\n**Required sponsor profile.** CIO, CCTO, or CDO · cross-functional enterprise scope · medium political capital\n\n**Linked KPIs (degrades direction).** AI Governance Maturity (2.8.1), Cybersecurity Maturity (2.8.2), First Call Resolution (2.2.2), Customer Complaint Rate (2.2.4)\n\n**Keystone evidence.** 11 tools, $1.6M annualized, 17 teams, 7/11 with auto-renewal, 4/11 with unreviewed data sharing (NERC CIP implications)",
  "metadata": {
    "classification": "Category: AI Governance · Variant of: Shadow AI Governance · Cross-industry: yes · Sector applicability: utility",
    "linked_kpi_names": [
      "AI Governance Maturity Score",
      "Cybersecurity Maturity Score",
      "First Call Resolution Rate",
      "Customer Complaint Rate per 1,000 Customers"
    ],
    "linked_kpis_text": "AI Governance Maturity (2.8.1), Cybersecurity Maturity (2.8.2), First Call Resolution (2.2.2), Customer Complaint Rate (2.2.4)",
    "expected_outcomes": [
      "Shadow AI spend reduction 40-60% within 12 months",
      "AI governance maturity up one stage within 18 months",
      "80%+ contract risk remediated within 9 months"
    ],
    "required_sponsor_profile": "CIO, CCTO, or CDO · cross-functional enterprise scope · medium political capital"
  },
  "created_at": "2026-04-21T20:54:14.049Z",
  "updated_at": "2026-04-21T20:54:14.049Z",
  "client_name": "Keystone Energy Holdings",
  "tenant_key": "keystone",
  "industry_code": "ENERGY"
}
```

### 16. keystone_pattern_ami_data_underutilization — AMI Data Underutilization

- Client: Keystone Energy Holdings (keystone, ENERGY)
- Category: Analytics Modernization — Utility Specific
- Recommended classification: client-specific
- Recommendation rationale: Recommended client_private_patterns because the row appears tied to a named tenant, local evidence, program context, or client-specific operating condition.
- Founder decision: TODO

```json
{
  "id": "keystone_pattern_ami_data_underutilization",
  "client_id": "63931f84-4fc8-4d13-baac-aa16b035bff2",
  "ordinal_ref": "3.5",
  "name": "AMI Data Underutilization",
  "short_description": "Extends base pattern 7.5. Variant of Analytics Modernization foundational pattern pack (#2).",
  "long_description": "Extends base pattern 7.5. Variant of Analytics Modernization foundational pattern pack (#2).",
  "category": "Analytics Modernization — Utility Specific",
  "sector_applicability": [
    "utility (electric, gas)"
  ],
  "cross_industry": false,
  "variant_of": "Analytics Modernization foundational pack",
  "trigger_symptoms": [
    "AMI data utilization <20% of available data\n- Use case inventory with majority unimplemented\n- AMI 2.0 deployment with data platform not scaled\n- Analytical capacity concentration in small team"
  ],
  "detection_signals": [
    "AMI data utilization <20% of available data\n- Use case inventory with majority unimplemented\n- AMI 2.0 deployment with data platform not scaled\n- Analytical capacity concentration in small team"
  ],
  "diagnostic_questions": [],
  "evidence_requirements": [],
  "likely_root_causes": [
    "AMI deployed for operational/billing use, not broader analytics",
    "data platform not architected for AMI data volume",
    "analytics capacity limited relative to use case inventory",
    "customer-facing features require upstream data work not prioritized",
    "DER integration use cases emerging faster than analytical capability"
  ],
  "common_adjacent_contradictions": [],
  "benchmark_signatures": [],
  "intervention_options": [
    "Enterprise data platform scaling\n- Use case prioritization against strategic priorities\n- Analytics capability expansion (talent and tooling)\n- Customer-facing feature rollout coordination\n- DER integration analytical workstream"
  ],
  "anti_patterns": [],
  "common_failure_modes": [],
  "phase_1_deliverables": [],
  "phase_2_deliverables": [],
  "phase_3_deliverables": [],
  "phase_4_deliverables": [],
  "expected_time_to_value": {},
  "success_metrics": [],
  "leading_indicators": [],
  "required_sponsor_profile": {},
  "required_capabilities": [],
  "typical_stakeholders": [],
  "common_objections": [],
  "applicable_company_scales": [],
  "cross_pattern_links": [],
  "linked_kpi_ids": [
    "keystone_ami_data_utilization",
    "keystone_der_interconnection_throughput",
    "keystone_ai_governance_maturity"
  ],
  "evidence_summary": "18 TB annual AMI data · 12% utilization · 34 use cases identified, 7 production, 11 piloted, 16 unimplemented · AMI 2.0 will multiply data volume 4-6x",
  "confidence_level": "high",
  "last_updated": "2026-04-21T05:00:00.000Z",
  "version": "1.0",
  "author": "AbarVa North Star overlay",
  "reasoning_scope_id": "keystone_scope_broad",
  "disclosure_scope_id": "keystone_scope_broad",
  "source_id": null,
  "as_of_date": "2026-04-21T05:00:00.000Z",
  "last_verified_at": "2026-04-21T00:00:00.000Z",
  "raw_markdown": "### 3.5 · AMI Data Underutilization\n\nExtends base pattern 7.5. Variant of Analytics Modernization foundational pattern pack (#2).\n\n**Classification.** Category: Analytics Modernization — Utility Specific · Variant of: Analytics Modernization foundational pack · Sector applicability: utility (electric, gas)\n\n**Detection signals.**\n- AMI data utilization <20% of available data\n- Use case inventory with majority unimplemented\n- AMI 2.0 deployment with data platform not scaled\n- Analytical capacity concentration in small team\n\n**Likely root causes.** AMI deployed for operational/billing use, not broader analytics · data platform not architected for AMI data volume · analytics capacity limited relative to use case inventory · customer-facing features require upstream data work not prioritized · DER integration use cases emerging faster than analytical capability\n\n**Intervention options.**\n- Enterprise data platform scaling\n- Use case prioritization against strategic priorities\n- Analytics capability expansion (talent and tooling)\n- Customer-facing feature rollout coordination\n- DER integration analytical workstream\n\n**Linked KPIs.** AMI Data Utilization (2.4.5), DER Interconnection Throughput (2.4.6), AI Governance Maturity (2.8.1)\n\n**Keystone evidence.** 18 TB annual AMI data · 12% utilization · 34 use cases identified, 7 production, 11 piloted, 16 unimplemented · AMI 2.0 will multiply data volume 4-6x",
  "metadata": {
    "classification": "Category: Analytics Modernization — Utility Specific · Variant of: Analytics Modernization foundational pack · Sector applicability: utility (electric, gas)",
    "linked_kpi_names": [
      "AMI Data Utilization Rate",
      "DER Interconnection Throughput",
      "AI Governance Maturity Score"
    ],
    "linked_kpis_text": "AMI Data Utilization (2.4.5), DER Interconnection Throughput (2.4.6), AI Governance Maturity (2.8.1)",
    "expected_outcomes": [],
    "required_sponsor_profile": null
  },
  "created_at": "2026-04-21T20:54:14.049Z",
  "updated_at": "2026-04-21T20:54:14.049Z",
  "client_name": "Keystone Energy Holdings",
  "tenant_key": "keystone",
  "industry_code": "ENERGY"
}
```

### 17. keystone_pattern_data_center_load_interconnection_queue_bottleneck — Data Center Load Interconnection Queue Bottleneck

- Client: Keystone Energy Holdings (keystone, ENERGY)
- Category: Growth Management — Regulated Infrastructure
- Recommended classification: client-specific
- Recommendation rationale: Recommended client_private_patterns because the row appears tied to a named tenant, local evidence, program context, or client-specific operating condition.
- Founder decision: TODO

```json
{
  "id": "keystone_pattern_data_center_load_interconnection_queue_bottleneck",
  "client_id": "63931f84-4fc8-4d13-baac-aa16b035bff2",
  "ordinal_ref": "3.2",
  "name": "Data Center Load Interconnection Queue Bottleneck",
  "short_description": "Extends base pattern 7.2. New foundational pattern pack (#17 in north star top 20) — utility-specific.",
  "long_description": "Extends base pattern 7.2. New foundational pattern pack (#17 in north star top 20) — utility-specific.",
  "category": "Growth Management — Regulated Infrastructure",
  "sector_applicability": [
    "utility (electric)"
  ],
  "cross_industry": false,
  "variant_of": null,
  "trigger_symptoms": [
    "Interconnection queue growth >50% YoY\n- Study-phase duration >12 months\n- Transmission engineering capacity <70% of needed"
  ],
  "detection_signals": [
    "Interconnection queue growth >50% YoY\n- Study-phase duration >12 months\n- Transmission engineering capacity <70% of needed"
  ],
  "diagnostic_questions": [],
  "evidence_requirements": [],
  "likely_root_causes": [
    "Rapid load growth outpacing engineering capacity",
    "study process designed for smaller loads",
    "cost allocation frameworks not designed for large-load economics",
    "regulatory uncertainty on tariff design",
    "federal-state jurisdictional friction (post-DOE Section 403 Oct 2025)"
  ],
  "common_adjacent_contradictions": [],
  "benchmark_signatures": [],
  "intervention_options": [
    "Study process modernization and engineering capacity expansion\n- Large-load tariff filings across jurisdictions\n- Co-location and flexible load arrangements\n- Transmission expansion capital plan recalibration\n- Engagement with FERC/PJM on large-load rulemaking"
  ],
  "anti_patterns": [],
  "common_failure_modes": [],
  "phase_1_deliverables": [
    "Queue analysis and forecast",
    "engineering capacity assessment",
    "regulatory posture across jurisdictions",
    "customer mix economic analysis"
  ],
  "phase_2_deliverables": [
    "Root cause deep-dive",
    "peer benchmarking on queue management",
    "tariff design options",
    "cost allocation frameworks",
    "stakeholder mapping (developers, regulators, ratepayer advocates)"
  ],
  "phase_3_deliverables": [
    "Tariff filing strategy",
    "engineering capacity build plan",
    "cost allocation framework",
    "co-location policy",
    "regulatory engagement strategy"
  ],
  "phase_4_deliverables": [
    "Tariff filings",
    "engineering hiring and reorganization",
    "regulatory proceedings",
    "ongoing pipeline management"
  ],
  "expected_time_to_value": {},
  "success_metrics": [],
  "leading_indicators": [],
  "required_sponsor_profile": {},
  "required_capabilities": [],
  "typical_stakeholders": [],
  "common_objections": [],
  "applicable_company_scales": [],
  "cross_pattern_links": [],
  "linked_kpi_ids": [
    "keystone_interconnection_queue_duration",
    "keystone_rate_base_growth",
    "keystone_capital_per_customer",
    "keystone_rate_case_cycle_time"
  ],
  "evidence_summary": "32 GW pending (from 14 GW in early 2024) · 18-month study duration vs 9-month target · $1.4B delayed revenue · $340M accelerated transmission investment · 4-6% projected residential rate increase if not large-load-allocated",
  "confidence_level": "high",
  "last_updated": "2026-04-21T05:00:00.000Z",
  "version": "1.0",
  "author": "AbarVa North Star overlay",
  "reasoning_scope_id": "keystone_scope_broad",
  "disclosure_scope_id": "keystone_scope_broad",
  "source_id": null,
  "as_of_date": "2026-04-21T05:00:00.000Z",
  "last_verified_at": "2026-04-21T00:00:00.000Z",
  "raw_markdown": "### 3.2 · Data Center Load Interconnection Queue Bottleneck\n\nExtends base pattern 7.2. New foundational pattern pack (#17 in north star top 20) — utility-specific.\n\n**Classification.** Category: Growth Management — Regulated Infrastructure · Cross-industry: no · Sector applicability: utility (electric)\n\n**Detection signals.**\n- Interconnection queue growth >50% YoY\n- Study-phase duration >12 months\n- Transmission engineering capacity <70% of needed\n\n**Likely root causes.** Rapid load growth outpacing engineering capacity · study process designed for smaller loads · cost allocation frameworks not designed for large-load economics · regulatory uncertainty on tariff design · federal-state jurisdictional friction (post-DOE Section 403 Oct 2025)\n\n**Intervention options.**\n- Study process modernization and engineering capacity expansion\n- Large-load tariff filings across jurisdictions\n- Co-location and flexible load arrangements\n- Transmission expansion capital plan recalibration\n- Engagement with FERC/PJM on large-load rulemaking\n\n**Phase-mapped deliverables.**\n\n*Phase 1 — Intake.* Queue analysis and forecast · engineering capacity assessment · regulatory posture across jurisdictions · customer mix economic analysis\n\n*Phase 2 — Diagnosis.* Root cause deep-dive · peer benchmarking on queue management · tariff design options · cost allocation frameworks · stakeholder mapping (developers, regulators, ratepayer advocates)\n\n*Phase 3 — Decision.* Tariff filing strategy · engineering capacity build plan · cost allocation framework · co-location policy · regulatory engagement strategy\n\n*Phase 4 — Execution.* Tariff filings · engineering hiring and reorganization · regulatory proceedings · ongoing pipeline management\n\n**Expected outcomes.** Queue time reduction from 18 to <12 months within 18 months · clear cost allocation signed off by state PUCs within 12 months · transmission engineering capacity to 90%+ of demand within 24 months\n\n**Required sponsor profile.** Chief Regulatory Officer, Chief Customer and Technology Officer, or CEO · enterprise scope · high political capital · extensive time commitment\n\n**Linked KPIs.** Interconnection Queue Duration (2.1.5), Rate Base Growth (2.3.1), Capital Deployed per Customer (2.3.4), Rate Case Cycle Time (2.3.3)\n\n**Keystone evidence.** 32 GW pending (from 14 GW in early 2024) · 18-month study duration vs 9-month target · $1.4B delayed revenue · $340M accelerated transmission investment · 4-6% projected residential rate increase if not large-load-allocated",
  "metadata": {
    "classification": "Category: Growth Management — Regulated Infrastructure · Cross-industry: no · Sector applicability: utility (electric)",
    "linked_kpi_names": [
      "Interconnection Queue Duration",
      "Rate Base Growth",
      "Capital Deployed per Customer",
      "Rate Case Cycle Time"
    ],
    "linked_kpis_text": "Interconnection Queue Duration (2.1.5), Rate Base Growth (2.3.1), Capital Deployed per Customer (2.3.4), Rate Case Cycle Time (2.3.3)",
    "expected_outcomes": [
      "Queue time reduction from 18 to <12 months within 18 months",
      "clear cost allocation signed off by state PUCs within 12 months",
      "transmission engineering capacity to 90%+ of demand within 24 months"
    ],
    "required_sponsor_profile": "Chief Regulatory Officer, Chief Customer and Technology Officer, or CEO · enterprise scope · high political capital · extensive time commitment"
  },
  "created_at": "2026-04-21T20:54:14.049Z",
  "updated_at": "2026-04-21T20:54:14.049Z",
  "client_name": "Keystone Energy Holdings",
  "tenant_key": "keystone",
  "industry_code": "ENERGY"
}
```

### 18. keystone_pattern_storm_response_coordination_fragmentation — Storm Response Coordination Fragmentation

- Client: Keystone Energy Holdings (keystone, ENERGY)
- Category: Operational Excellence — Multi-Entity Coordination
- Recommended classification: client-specific
- Recommendation rationale: Recommended client_private_patterns because the row appears tied to a named tenant, local evidence, program context, or client-specific operating condition.
- Founder decision: TODO

```json
{
  "id": "keystone_pattern_storm_response_coordination_fragmentation",
  "client_id": "63931f84-4fc8-4d13-baac-aa16b035bff2",
  "ordinal_ref": "3.3",
  "name": "Storm Response Coordination Fragmentation",
  "short_description": "Extends base pattern 7.3. Foundational pattern pack (#18) — utility-specific.",
  "long_description": "Extends base pattern 7.3. Foundational pattern pack (#18) — utility-specific.",
  "category": "Operational Excellence — Multi-Entity Coordination",
  "sector_applicability": [
    "utility"
  ],
  "cross_industry": false,
  "variant_of": null,
  "trigger_symptoms": [
    "Multiple OMS platforms across operating units (≥3 distinct platforms)\n- Post-major-event coordination failures recurring\n- Customer notification lag during events (>30 minutes average)\n- Mutual assistance onboarding delays (>4 hours)"
  ],
  "detection_signals": [
    "Multiple OMS platforms across operating units (≥3 distinct platforms)\n- Post-major-event coordination failures recurring\n- Customer notification lag during events (>30 minutes average)\n- Mutual assistance onboarding delays (>4 hours)"
  ],
  "diagnostic_questions": [],
  "evidence_requirements": [],
  "likely_root_causes": [
    "Historical M&A/separation created OMS fragmentation",
    "legacy customer service platforms with distinct IVR/notification scripts",
    "cross-subsidiary handoffs not platform-enabled",
    "mutual assistance coordination processes manual",
    "data synchronization lag during high-velocity events"
  ],
  "common_adjacent_contradictions": [],
  "benchmark_signatures": [],
  "intervention_options": [
    "Unified storm response platform with cross-OpCo visibility\n- OMS rationalization (costly, long-horizon)\n- Communications orchestration layer above OMS fragmentation (faster)\n- Crew coordination workflow modernization\n- Generative AI storm impact prediction\n- Customer communication script unification"
  ],
  "anti_patterns": [],
  "common_failure_modes": [],
  "phase_1_deliverables": [
    "Storm event history analysis",
    "coordination failure mode documentation",
    "cross-OpCo handoff mapping",
    "customer communication audit"
  ],
  "phase_2_deliverables": [
    "Platform options (unified new build, orchestration layer over existing",
    "OMS rationalization)",
    "AI prediction capability assessment",
    "workflow modernization options"
  ],
  "phase_3_deliverables": [
    "Platform decision and architecture",
    "communication orchestration design",
    "AI integration approach",
    "rollout sequencing"
  ],
  "phase_4_deliverables": [
    "Platform deployment",
    "workflow operationalization",
    "training and readiness",
    "measurement via reliability KPIs"
  ],
  "expected_time_to_value": {},
  "success_metrics": [],
  "leading_indicators": [],
  "required_sponsor_profile": {},
  "required_capabilities": [],
  "typical_stakeholders": [],
  "common_objections": [],
  "applicable_company_scales": [],
  "cross_pattern_links": [],
  "linked_kpi_ids": [
    "keystone_saidi_enterprise",
    "keystone_saifi_enterprise",
    "keystone_caidi_enterprise",
    "keystone_outage_notification_timeliness",
    "keystone_jdpower_residential_csat",
    "keystone_storm_restoration_p95"
  ],
  "evidence_summary": "Dec 2024 ice storm after-action: 14 inter-company handoffs · 34-minute average notification lag · 7 recurring coordination failure modes · 4 distinct OMS platforms across 6 subsidiaries",
  "confidence_level": "high",
  "last_updated": "2026-04-21T05:00:00.000Z",
  "version": "1.0",
  "author": "AbarVa North Star overlay",
  "reasoning_scope_id": "keystone_scope_broad",
  "disclosure_scope_id": "keystone_scope_broad",
  "source_id": null,
  "as_of_date": "2026-04-21T05:00:00.000Z",
  "last_verified_at": "2026-04-21T00:00:00.000Z",
  "raw_markdown": "### 3.3 · Storm Response Coordination Fragmentation\n\nExtends base pattern 7.3. Foundational pattern pack (#18) — utility-specific.\n\n**Classification.** Category: Operational Excellence — Multi-Entity Coordination · Sector applicability: utility\n\n**Detection signals.**\n- Multiple OMS platforms across operating units (≥3 distinct platforms)\n- Post-major-event coordination failures recurring\n- Customer notification lag during events (>30 minutes average)\n- Mutual assistance onboarding delays (>4 hours)\n\n**Likely root causes.** Historical M&A/separation created OMS fragmentation · legacy customer service platforms with distinct IVR/notification scripts · cross-subsidiary handoffs not platform-enabled · mutual assistance coordination processes manual · data synchronization lag during high-velocity events\n\n**Intervention options.**\n- Unified storm response platform with cross-OpCo visibility\n- OMS rationalization (costly, long-horizon)\n- Communications orchestration layer above OMS fragmentation (faster)\n- Crew coordination workflow modernization\n- Generative AI storm impact prediction\n- Customer communication script unification\n\n**Phase-mapped deliverables.**\n\n*Phase 1.* Storm event history analysis · coordination failure mode documentation · cross-OpCo handoff mapping · customer communication audit\n\n*Phase 2.* Platform options (unified new build, orchestration layer over existing, OMS rationalization) · AI prediction capability assessment · workflow modernization options\n\n*Phase 3.* Platform decision and architecture · communication orchestration design · AI integration approach · rollout sequencing\n\n*Phase 4.* Platform deployment · workflow operationalization · training and readiness · measurement via reliability KPIs\n\n**Expected outcomes.** Customer notification timeliness from 67% to 94% within 18 months · storm restoration 95th percentile from 78 to 48 hours within 24 months · coordination failure modes reduced 70%+ within 12 months\n\n**Required sponsor profile.** COO with CCTO partnership · enterprise scope · high political capital (OpCo presidents must align)\n\n**Linked KPIs.** SAIDI (2.1.1), SAIFI (2.1.2), CAIDI (2.1.3), Outage Notification Timeliness (2.2.5), Customer Satisfaction (2.2.1), Storm Restoration P95 (2.4.4)\n\n**Keystone evidence.** Dec 2024 ice storm after-action: 14 inter-company handoffs · 34-minute average notification lag · 7 recurring coordination failure modes · 4 distinct OMS platforms across 6 subsidiaries",
  "metadata": {
    "classification": "Category: Operational Excellence — Multi-Entity Coordination · Sector applicability: utility",
    "linked_kpi_names": [
      "SAIDI (System Average Interruption Duration Index)",
      "SAIFI (System Average Interruption Frequency Index)",
      "CAIDI (Customer Average Interruption Duration Index)",
      "Outage Notification Timeliness",
      "J.D. Power Residential Customer Satisfaction",
      "Storm Restoration 95th Percentile Time"
    ],
    "linked_kpis_text": "SAIDI (2.1.1), SAIFI (2.1.2), CAIDI (2.1.3), Outage Notification Timeliness (2.2.5), Customer Satisfaction (2.2.1), Storm Restoration P95 (2.4.4)",
    "expected_outcomes": [
      "Customer notification timeliness from 67% to 94% within 18 months",
      "storm restoration 95th percentile from 78 to 48 hours within 24 months",
      "coordination failure modes reduced 70%+ within 12 months"
    ],
    "required_sponsor_profile": "COO with CCTO partnership · enterprise scope · high political capital (OpCo presidents must align)"
  },
  "created_at": "2026-04-21T20:54:14.049Z",
  "updated_at": "2026-04-21T20:54:14.049Z",
  "client_name": "Keystone Energy Holdings",
  "tenant_key": "keystone",
  "industry_code": "ENERGY"
}
```

### 19. keystone_pattern_grid_modernization_capital_vs_rate_recovery_gap — Grid Modernization Capital vs Rate Recovery Gap

- Client: Keystone Energy Holdings (keystone, ENERGY)
- Category: Regulatory Strategy — Capital Recovery
- Recommended classification: client-specific
- Recommendation rationale: Recommended client_private_patterns because the row appears tied to a named tenant, local evidence, program context, or client-specific operating condition.
- Founder decision: TODO

```json
{
  "id": "keystone_pattern_grid_modernization_capital_vs_rate_recovery_gap",
  "client_id": "63931f84-4fc8-4d13-baac-aa16b035bff2",
  "ordinal_ref": "3.4",
  "name": "Grid Modernization Capital vs Rate Recovery Gap",
  "short_description": "Extends base pattern 7.4. Foundational pattern pack (#19) — utility-specific.",
  "long_description": "Extends base pattern 7.4. Foundational pattern pack (#19) — utility-specific.",
  "category": "Regulatory Strategy — Capital Recovery",
  "sector_applicability": [
    "utility (regulated)"
  ],
  "cross_industry": false,
  "variant_of": null,
  "trigger_symptoms": [
    "Deployed capital vs recognized rate base gap >$500M\n- Regulatory lag >12 months\n- Financing cost of carry on lag capital >$50M annualized\n- Credit agency commentary noting deployment pace concern\n- Multiple concurrent rate case filings"
  ],
  "detection_signals": [
    "Deployed capital vs recognized rate base gap >$500M\n- Regulatory lag >12 months\n- Financing cost of carry on lag capital >$50M annualized\n- Credit agency commentary noting deployment pace concern\n- Multiple concurrent rate case filings"
  ],
  "diagnostic_questions": [],
  "evidence_requirements": [],
  "likely_root_causes": [
    "Capital deployment accelerating ahead of regulatory recovery",
    "rate case cycle time longer than capital cycle",
    "regulatory philosophy in some jurisdictions less constructive on pace",
    "customer affordability concerns constraining ROE",
    "multi-jurisdictional variance complicating coordinated strategy"
  ],
  "common_adjacent_contradictions": [],
  "benchmark_signatures": [],
  "intervention_options": [
    "Rate case strategy optimization (filing cadence, settlement vs litigation",
    "ROE targeting)\n- Capital deployment pace recalibration\n- Rider and tracker recovery mechanisms where available\n- Regulatory constructive engagement programs\n- Financing strategy adjustment (debt/equity mix)"
  ],
  "anti_patterns": [],
  "common_failure_modes": [],
  "phase_1_deliverables": [
    "Capital deployment vs rate base gap analysis",
    "regulatory lag quantification",
    "financing cost of carry",
    "jurisdictional variance analysis"
  ],
  "phase_2_deliverables": [
    "Rate case strategy options",
    "capital pace scenarios",
    "financing strategy options",
    "stakeholder engagement options"
  ],
  "phase_3_deliverables": [
    "Rate case strategy decisions",
    "capital pace commitments",
    "financing strategy",
    "regulatory engagement plan"
  ],
  "phase_4_deliverables": [
    "Rate case execution",
    "financing execution",
    "regulatory engagement operationalization",
    "outcome tracking"
  ],
  "expected_time_to_value": {},
  "success_metrics": [],
  "leading_indicators": [],
  "required_sponsor_profile": {},
  "required_capabilities": [],
  "typical_stakeholders": [],
  "common_objections": [],
  "applicable_company_scales": [],
  "cross_pattern_links": [],
  "linked_kpi_ids": [
    "keystone_rate_base_growth",
    "keystone_allowed_roe_wtd_avg",
    "keystone_rate_case_cycle_time",
    "keystone_capital_per_customer"
  ],
  "evidence_summary": "$1.8B deployed capital in regulatory lag · $92M annualized cost of carry · credit agency commentary on deployment pace · four concurrent rate cases with expected outcomes Q2-Q4 2026",
  "confidence_level": "high",
  "last_updated": "2026-04-21T05:00:00.000Z",
  "version": "1.0",
  "author": "AbarVa North Star overlay",
  "reasoning_scope_id": "keystone_scope_broad",
  "disclosure_scope_id": "keystone_scope_broad",
  "source_id": null,
  "as_of_date": "2026-04-21T05:00:00.000Z",
  "last_verified_at": "2026-04-21T00:00:00.000Z",
  "raw_markdown": "### 3.4 · Grid Modernization Capital vs Rate Recovery Gap\n\nExtends base pattern 7.4. Foundational pattern pack (#19) — utility-specific.\n\n**Classification.** Category: Regulatory Strategy — Capital Recovery · Sector applicability: utility (regulated)\n\n**Detection signals.**\n- Deployed capital vs recognized rate base gap >$500M\n- Regulatory lag >12 months\n- Financing cost of carry on lag capital >$50M annualized\n- Credit agency commentary noting deployment pace concern\n- Multiple concurrent rate case filings\n\n**Likely root causes.** Capital deployment accelerating ahead of regulatory recovery · rate case cycle time longer than capital cycle · regulatory philosophy in some jurisdictions less constructive on pace · customer affordability concerns constraining ROE · multi-jurisdictional variance complicating coordinated strategy\n\n**Intervention options.**\n- Rate case strategy optimization (filing cadence, settlement vs litigation, ROE targeting)\n- Capital deployment pace recalibration\n- Rider and tracker recovery mechanisms where available\n- Regulatory constructive engagement programs\n- Financing strategy adjustment (debt/equity mix)\n\n**Phase-mapped deliverables.**\n\n*Phase 1.* Capital deployment vs rate base gap analysis · regulatory lag quantification · financing cost of carry · jurisdictional variance analysis\n\n*Phase 2.* Rate case strategy options · capital pace scenarios · financing strategy options · stakeholder engagement options\n\n*Phase 3.* Rate case strategy decisions · capital pace commitments · financing strategy · regulatory engagement plan\n\n*Phase 4.* Rate case execution · financing execution · regulatory engagement operationalization · outcome tracking\n\n**Expected outcomes.** Regulatory lag reduction to <10 months within 18 months · deployed-to-recognized gap reduction by 40%+ within 18 months · constructive ROE outcomes in active cases\n\n**Required sponsor profile.** CFO with Chief Regulatory Officer partnership · cross-functional scope · high political capital\n\n**Linked KPIs.** Rate Base Growth (2.3.1), Allowed ROE (2.3.2), Rate Case Cycle Time (2.3.3), Capital Deployed per Customer (2.3.4)\n\n**Keystone evidence.** $1.8B deployed capital in regulatory lag · $92M annualized cost of carry · credit agency commentary on deployment pace · four concurrent rate cases with expected outcomes Q2-Q4 2026",
  "metadata": {
    "classification": "Category: Regulatory Strategy — Capital Recovery · Sector applicability: utility (regulated)",
    "linked_kpi_names": [
      "Rate Base Growth",
      "Allowed ROE Weighted Average",
      "Rate Case Cycle Time",
      "Capital Deployed per Customer"
    ],
    "linked_kpis_text": "Rate Base Growth (2.3.1), Allowed ROE (2.3.2), Rate Case Cycle Time (2.3.3), Capital Deployed per Customer (2.3.4)",
    "expected_outcomes": [
      "Regulatory lag reduction to <10 months within 18 months",
      "deployed-to-recognized gap reduction by 40%+ within 18 months",
      "constructive ROE outcomes in active cases"
    ],
    "required_sponsor_profile": "CFO with Chief Regulatory Officer partnership · cross-functional scope · high political capital"
  },
  "created_at": "2026-04-21T20:54:14.049Z",
  "updated_at": "2026-04-21T20:54:14.049Z",
  "client_name": "Keystone Energy Holdings",
  "tenant_key": "keystone",
  "industry_code": "ENERGY"
}
```

### 20. keystone_pattern_cross_jurisdictional_regulatory_coordination_gap — Cross-Jurisdictional Regulatory Coordination Gap

- Client: Keystone Energy Holdings (keystone, ENERGY)
- Category: Regulatory Strategy — Multi-Jurisdiction
- Recommended classification: client-specific
- Recommendation rationale: Recommended client_private_patterns because the row appears tied to a named tenant, local evidence, program context, or client-specific operating condition.
- Founder decision: TODO

```json
{
  "id": "keystone_pattern_cross_jurisdictional_regulatory_coordination_gap",
  "client_id": "63931f84-4fc8-4d13-baac-aa16b035bff2",
  "ordinal_ref": "3.7",
  "name": "Cross-Jurisdictional Regulatory Coordination Gap",
  "short_description": "Extends base pattern 7.7. Utility-specific (financial services variant #15 on Cross-Franchise regulatory).",
  "long_description": "Extends base pattern 7.7. Utility-specific (financial services variant #15 on Cross-Franchise regulatory).",
  "category": "Regulatory Strategy — Multi-Jurisdiction",
  "sector_applicability": [
    "utility (multi-state regulated)"
  ],
  "cross_industry": false,
  "variant_of": null,
  "trigger_symptoms": [
    "Multi-state operations with 5+ PUCs\n- Filing cycle misalignment across subsidiaries\n- ROE variance across jurisdictions >75 bps\n- Rate case strategy subsidiary-by-subsidiary vs enterprise-coordinated\n- Intervenor coalition overlap across cases"
  ],
  "detection_signals": [
    "Multi-state operations with 5+ PUCs\n- Filing cycle misalignment across subsidiaries\n- ROE variance across jurisdictions >75 bps\n- Rate case strategy subsidiary-by-subsidiary vs enterprise-coordinated\n- Intervenor coalition overlap across cases"
  ],
  "diagnostic_questions": [],
  "evidence_requirements": [],
  "likely_root_causes": [],
  "common_adjacent_contradictions": [],
  "benchmark_signatures": [],
  "intervention_options": [],
  "anti_patterns": [],
  "common_failure_modes": [],
  "phase_1_deliverables": [],
  "phase_2_deliverables": [],
  "phase_3_deliverables": [],
  "phase_4_deliverables": [],
  "expected_time_to_value": {},
  "success_metrics": [],
  "leading_indicators": [],
  "required_sponsor_profile": {},
  "required_capabilities": [],
  "typical_stakeholders": [],
  "common_objections": [],
  "applicable_company_scales": [],
  "cross_pattern_links": [],
  "linked_kpi_ids": [
    "keystone_allowed_roe_wtd_avg",
    "keystone_rate_case_cycle_time",
    "keystone_decision_latency_capital"
  ],
  "evidence_summary": "5 state PUCs + DC PSC + FERC + NERC + PJM · ROE range 9.25% (MD) to 10.10% (PA) · subsidiary-level regulatory teams with limited enterprise coordination · four concurrent rate cases",
  "confidence_level": "high",
  "last_updated": "2026-04-21T05:00:00.000Z",
  "version": "1.0",
  "author": "AbarVa North Star overlay",
  "reasoning_scope_id": "keystone_scope_broad",
  "disclosure_scope_id": "keystone_scope_broad",
  "source_id": null,
  "as_of_date": "2026-04-21T05:00:00.000Z",
  "last_verified_at": "2026-04-21T00:00:00.000Z",
  "raw_markdown": "### 3.7 · Cross-Jurisdictional Regulatory Coordination Gap\n\nExtends base pattern 7.7. Utility-specific (financial services variant #15 on Cross-Franchise regulatory).\n\n**Classification.** Category: Regulatory Strategy — Multi-Jurisdiction · Sector applicability: utility (multi-state regulated) · Cross-industry: partial (financial services parallel pattern)\n\n**Detection signals.**\n- Multi-state operations with 5+ PUCs\n- Filing cycle misalignment across subsidiaries\n- ROE variance across jurisdictions >75 bps\n- Rate case strategy subsidiary-by-subsidiary vs enterprise-coordinated\n- Intervenor coalition overlap across cases\n\n**Keystone evidence.** 5 state PUCs + DC PSC + FERC + NERC + PJM · ROE range 9.25% (MD) to 10.10% (PA) · subsidiary-level regulatory teams with limited enterprise coordination · four concurrent rate cases\n\n**Linked KPIs.** Allowed ROE Weighted Average (2.3.2), Rate Case Cycle Time (2.3.3), Decision Latency — Capital Planning (2.8.3)\n\n---",
  "metadata": {
    "classification": "Category: Regulatory Strategy — Multi-Jurisdiction · Sector applicability: utility (multi-state regulated) · Cross-industry: partial (financial services parallel pattern)",
    "linked_kpi_names": [
      "Allowed ROE Weighted Average",
      "Rate Case Cycle Time",
      "Decision Latency — Capital Planning"
    ],
    "linked_kpis_text": "Allowed ROE Weighted Average (2.3.2), Rate Case Cycle Time (2.3.3), Decision Latency — Capital Planning (2.8.3)",
    "expected_outcomes": [],
    "required_sponsor_profile": null
  },
  "created_at": "2026-04-21T20:54:14.049Z",
  "updated_at": "2026-04-21T20:54:14.049Z",
  "client_name": "Keystone Energy Holdings",
  "tenant_key": "keystone",
  "industry_code": "ENERGY"
}
```

### 21. keystone_pattern_workforce_attrition_in_specialized_grid_operations — Workforce Attrition in Specialized Grid Operations

- Client: Keystone Energy Holdings (keystone, ENERGY)
- Category: Workforce Strategy — Specialized Technical Roles
- Recommended classification: industry-applicable
- Recommendation rationale: Recommended corpus_patterns because the pattern appears reusable at industry or cross-industry level after provenance is preserved.
- Founder decision: TODO

```json
{
  "id": "keystone_pattern_workforce_attrition_in_specialized_grid_operations",
  "client_id": "63931f84-4fc8-4d13-baac-aa16b035bff2",
  "ordinal_ref": "3.6",
  "name": "Workforce Attrition in Specialized Grid Operations",
  "short_description": "Extends base pattern 7.6. Foundational pattern pack (#20) — cross-sector with utility variant.",
  "long_description": "Extends base pattern 7.6. Foundational pattern pack (#20) — cross-sector with utility variant.",
  "category": "Workforce Strategy — Specialized Technical Roles",
  "sector_applicability": [
    "all"
  ],
  "cross_industry": true,
  "variant_of": null,
  "trigger_symptoms": [
    "Specialized role turnover >2x enterprise average\n- Experience-band concentration in departures (8-15 year tenure band >40% of departures)\n- Destination concentration (peer competitors or adjacent industries)\n- Compensation below market in specific roles\n- Replacement time >12 months to full productivity"
  ],
  "detection_signals": [
    "Specialized role turnover >2x enterprise average\n- Experience-band concentration in departures (8-15 year tenure band >40% of departures)\n- Destination concentration (peer competitors or adjacent industries)\n- Compensation below market in specific roles\n- Replacement time >12 months to full productivity"
  ],
  "diagnostic_questions": [],
  "evidence_requirements": [],
  "likely_root_causes": [],
  "common_adjacent_contradictions": [],
  "benchmark_signatures": [],
  "intervention_options": [],
  "anti_patterns": [],
  "common_failure_modes": [],
  "phase_1_deliverables": [],
  "phase_2_deliverables": [],
  "phase_3_deliverables": [],
  "phase_4_deliverables": [],
  "expected_time_to_value": {},
  "success_metrics": [],
  "leading_indicators": [],
  "required_sponsor_profile": {},
  "required_capabilities": [],
  "typical_stakeholders": [],
  "common_objections": [],
  "applicable_company_scales": [],
  "cross_pattern_links": [],
  "linked_kpi_ids": [
    "keystone_transmission_engineering_turnover",
    "keystone_apprenticeship_completion",
    "keystone_turnover_enterprise"
  ],
  "evidence_summary": "27% transmission engineering turnover vs 14% target · 43% of departures in 8-15 year band · 58% moving to renewable developers/IPPs · 18-month replacement time",
  "confidence_level": "high",
  "last_updated": "2026-04-21T05:00:00.000Z",
  "version": "1.0",
  "author": "AbarVa North Star overlay",
  "reasoning_scope_id": "keystone_scope_broad",
  "disclosure_scope_id": "keystone_scope_broad",
  "source_id": null,
  "as_of_date": "2026-04-21T05:00:00.000Z",
  "last_verified_at": "2026-04-21T00:00:00.000Z",
  "raw_markdown": "### 3.6 · Workforce Attrition in Specialized Grid Operations\n\nExtends base pattern 7.6. Foundational pattern pack (#20) — cross-sector with utility variant.\n\n**Classification.** Category: Workforce Strategy — Specialized Technical Roles · Cross-industry: yes (applies to healthcare nursing, financial services quantitative roles, utility grid engineering) · Sector applicability: all\n\n**Detection signals.**\n- Specialized role turnover >2x enterprise average\n- Experience-band concentration in departures (8-15 year tenure band >40% of departures)\n- Destination concentration (peer competitors or adjacent industries)\n- Compensation below market in specific roles\n- Replacement time >12 months to full productivity\n\n**Keystone evidence.** 27% transmission engineering turnover vs 14% target · 43% of departures in 8-15 year band · 58% moving to renewable developers/IPPs · 18-month replacement time\n\n**Linked KPIs.** Transmission Engineering Turnover (2.6.3), Apprenticeship Completion (2.6.4), Enterprise Turnover (2.6.2)",
  "metadata": {
    "classification": "Category: Workforce Strategy — Specialized Technical Roles · Cross-industry: yes (applies to healthcare nursing, financial services quantitative roles, utility grid engineering) · Sector applicability: all",
    "linked_kpi_names": [
      "Transmission Engineering Turnover Rate",
      "Apprenticeship Program Completion Rate",
      "Turnover Rate (Enterprise)"
    ],
    "linked_kpis_text": "Transmission Engineering Turnover (2.6.3), Apprenticeship Completion (2.6.4), Enterprise Turnover (2.6.2)",
    "expected_outcomes": [],
    "required_sponsor_profile": null
  },
  "created_at": "2026-04-21T20:54:14.049Z",
  "updated_at": "2026-04-21T20:54:14.049Z",
  "client_name": "Keystone Energy Holdings",
  "tenant_key": "keystone",
  "industry_code": "ENERGY"
}
```

### 22. meridian_pattern_value_based_care_progression_lag — Value-Based Care Progression Lag

- Client: Meridian Health (meridian-health, HEALTHCARE_IDN)
- Category: Clinical-Financial Integration
- Recommended classification: client-specific
- Recommendation rationale: Recommended client_private_patterns because the row appears tied to a named tenant, local evidence, program context, or client-specific operating condition.
- Founder decision: TODO

```json
{
  "id": "meridian_pattern_value_based_care_progression_lag",
  "client_id": "a20ecef5-f0ea-4890-b9d5-7375fab223ff",
  "ordinal_ref": "3.1",
  "name": "Value-Based Care Progression Lag",
  "short_description": "Foundational pattern pack #13 — healthcare-specific.",
  "long_description": "Foundational pattern pack #13 — healthcare-specific.",
  "category": "Clinical-Financial Integration",
  "sector_applicability": [
    "healthcare (provider and integrated systems)"
  ],
  "cross_industry": false,
  "variant_of": null,
  "trigger_symptoms": [
    "Public commitment to VBC % by date exists\n- Current trajectory (linear extrapolation from trailing 4 quarters) does not reach commitment\n- Infrastructure investments insufficient to support commitment (risk management, care coordination, analytics)\n- Physician attribution and incentive alignment immature relative to commitment"
  ],
  "detection_signals": [
    "Public commitment to VBC % by date exists\n- Current trajectory (linear extrapolation from trailing 4 quarters) does not reach commitment\n- Infrastructure investments insufficient to support commitment (risk management, care coordination, analytics)\n- Physician attribution and incentive alignment immature relative to commitment"
  ],
  "diagnostic_questions": [],
  "evidence_requirements": [],
  "likely_root_causes": [
    "Fee-for-service muscle memory",
    "risk infrastructure gap",
    "physician alignment and compensation model lag",
    "attributed-life growth plateau",
    "payer contract negotiation cycles",
    "data and analytics capability gap"
  ],
  "common_adjacent_contradictions": [],
  "benchmark_signatures": [],
  "intervention_options": [
    "Risk management infrastructure build-out (care coordination, analytics, actuarial)\n- Physician compensation model redesign for risk alignment\n- Attributed-life growth acceleration (contract wins, member retention)\n- Technology platform modernization for risk-bearing operations\n- Partnership strategy (payer, employer, network expansion)\n- Public commitment reforecasting where acceleration not feasible"
  ],
  "anti_patterns": [],
  "common_failure_modes": [],
  "phase_1_deliverables": [
    "VBC current state",
    "commitment gap analysis",
    "trajectory math",
    "infrastructure readiness audit",
    "physician alignment audit",
    "peer benchmarking"
  ],
  "phase_2_deliverables": [
    "Root cause deep-dive",
    "infrastructure options",
    "compensation model options",
    "growth strategy",
    "partnership options"
  ],
  "phase_3_deliverables": [
    "Investment commitments",
    "compensation redesign",
    "growth plan",
    "partnership strategy",
    "timeline reforecasting decision"
  ],
  "phase_4_deliverables": [
    "Infrastructure build",
    "compensation rollout",
    "growth execution",
    "quarterly KPI tracking"
  ],
  "expected_time_to_value": {},
  "success_metrics": [],
  "leading_indicators": [],
  "required_sponsor_profile": {},
  "required_capabilities": [],
  "typical_stakeholders": [],
  "common_objections": [],
  "applicable_company_scales": [],
  "cross_pattern_links": [],
  "linked_kpi_ids": [
    "meridian_vbc_revenue_pct",
    "meridian_shared_savings_achievement",
    "meridian_risk_adjusted_pmpm",
    "meridian_attributed_lives_vbc"
  ],
  "evidence_summary": "CEO Q2 2025 earnings commitment 68% by FY26 end · current 38%, trajectory to 52% · 16pt gap unresourced · infrastructure assessment shows risk management and analytics capability shortfalls",
  "confidence_level": "high",
  "last_updated": "2026-04-21T05:00:00.000Z",
  "version": "1.0",
  "author": "AbarVa North Star overlay",
  "reasoning_scope_id": "meridian_scope_broad",
  "disclosure_scope_id": "meridian_scope_broad",
  "source_id": null,
  "as_of_date": "2026-04-21T05:00:00.000Z",
  "last_verified_at": "2026-04-21T00:00:00.000Z",
  "raw_markdown": "### 3.1 · Value-Based Care Progression Lag\n\nFoundational pattern pack #13 — healthcare-specific.\n\n**Classification.** Category: Clinical-Financial Integration · Sector applicability: healthcare (provider and integrated systems)\n\n**Detection signals.**\n- Public commitment to VBC % by date exists\n- Current trajectory (linear extrapolation from trailing 4 quarters) does not reach commitment\n- Infrastructure investments insufficient to support commitment (risk management, care coordination, analytics)\n- Physician attribution and incentive alignment immature relative to commitment\n\n**Likely root causes.** Fee-for-service muscle memory · risk infrastructure gap · physician alignment and compensation model lag · attributed-life growth plateau · payer contract negotiation cycles · data and analytics capability gap\n\n**Intervention options.**\n- Risk management infrastructure build-out (care coordination, analytics, actuarial)\n- Physician compensation model redesign for risk alignment\n- Attributed-life growth acceleration (contract wins, member retention)\n- Technology platform modernization for risk-bearing operations\n- Partnership strategy (payer, employer, network expansion)\n- Public commitment reforecasting where acceleration not feasible\n\n**Phase-mapped deliverables.**\n\n*Phase 1.* VBC current state · commitment gap analysis · trajectory math · infrastructure readiness audit · physician alignment audit · peer benchmarking\n\n*Phase 2.* Root cause deep-dive · infrastructure options · compensation model options · growth strategy · partnership options\n\n*Phase 3.* Investment commitments · compensation redesign · growth plan · partnership strategy · timeline reforecasting decision\n\n*Phase 4.* Infrastructure build · compensation rollout · growth execution · quarterly KPI tracking\n\n**Expected outcomes.** VBC revenue trajectory inflection within 6 months · commitment credibility preserved or reforecasted transparently · attributed lives up 50%+ within 18 months\n\n**Required sponsor profile.** CEO with CFO + CMO partnership · enterprise scope · very high political capital\n\n**Linked KPIs.** VBC Revenue % (2.6.1), Shared Savings (2.6.2), Risk-Adjusted PMPM (2.6.3), Attributed Lives (2.6.4)\n\n**Meridian evidence.** CEO Q2 2025 earnings commitment 68% by FY26 end · current 38%, trajectory to 52% · 16pt gap unresourced · infrastructure assessment shows risk management and analytics capability shortfalls",
  "metadata": {
    "classification": "Category: Clinical-Financial Integration · Sector applicability: healthcare (provider and integrated systems)",
    "linked_kpi_names": [
      "VBC Revenue %",
      "Shared Savings Achievement",
      "Risk-Adjusted PMPM",
      "Attributed Lives (VBC)"
    ],
    "linked_kpis_text": "VBC Revenue % (2.6.1), Shared Savings (2.6.2), Risk-Adjusted PMPM (2.6.3), Attributed Lives (2.6.4)",
    "expected_outcomes": [
      "VBC revenue trajectory inflection within 6 months",
      "commitment credibility preserved or reforecasted transparently",
      "attributed lives up 50%+ within 18 months"
    ],
    "required_sponsor_profile": "CEO with CFO + CMO partnership · enterprise scope · very high political capital"
  },
  "created_at": "2026-04-21T22:13:41.886Z",
  "updated_at": "2026-05-10T02:01:49.457Z",
  "client_name": "Meridian Health",
  "tenant_key": "meridian-health",
  "industry_code": "HEALTHCARE_IDN"
}
```

### 23. meridian_pattern_revenue_cycle_denial_cascade — Revenue Cycle Denial Cascade

- Client: Meridian Health (meridian-health, HEALTHCARE_IDN)
- Category: Revenue Cycle Operations
- Recommended classification: client-specific
- Recommendation rationale: Recommended client_private_patterns because the row appears tied to a named tenant, local evidence, program context, or client-specific operating condition.
- Founder decision: TODO

```json
{
  "id": "meridian_pattern_revenue_cycle_denial_cascade",
  "client_id": "a20ecef5-f0ea-4890-b9d5-7375fab223ff",
  "ordinal_ref": "3.2",
  "name": "Revenue Cycle Denial Cascade",
  "short_description": "Foundational pattern pack #14 — healthcare-specific.",
  "long_description": "Foundational pattern pack #14 — healthcare-specific.",
  "category": "Revenue Cycle Operations",
  "sector_applicability": [
    "healthcare"
  ],
  "cross_industry": false,
  "variant_of": null,
  "trigger_symptoms": [
    "First-pass denial rate >10%\n- Overall denial rate >5%\n- Denial write-off >1.5% of gross revenue\n- Clean claim rate <90%\n- POS collections <35%\n- Payer-specific denial clustering"
  ],
  "detection_signals": [
    "First-pass denial rate >10%\n- Overall denial rate >5%\n- Denial write-off >1.5% of gross revenue\n- Clean claim rate <90%\n- POS collections <35%\n- Payer-specific denial clustering"
  ],
  "diagnostic_questions": [],
  "evidence_requirements": [],
  "likely_root_causes": [
    "Eligibility verification gap at point of service",
    "prior authorization workflow inefficiency",
    "documentation quality and specificity gap",
    "coding accuracy",
    "payer contract complexity",
    "denial management reactive vs preventive",
    "technology platform fragmentation"
  ],
  "common_adjacent_contradictions": [],
  "benchmark_signatures": [],
  "intervention_options": [
    "Eligibility and prior auth automation\n- Clinical documentation improvement program\n- Coding quality and AI-assisted coding\n- Denial prevention analytics (predictive at submission)\n- Payer contract review and rationalization\n- Technology platform consolidation"
  ],
  "anti_patterns": [],
  "common_failure_modes": [],
  "phase_1_deliverables": [
    "First-pass denial rate >10%\n- Overall denial rate >5%\n- Denial write-off >1.5% of gross revenue\n- Clean claim rate <90%\n- POS collections <35%\n- Payer-specific denial clustering"
  ],
  "phase_2_deliverables": [
    "Eligibility and prior auth automation\n- Clinical documentation improvement program\n- Coding quality and AI-assisted coding\n- Denial prevention analytics (predictive at submission)\n- Payer contract review and rationalization\n- Technology platform consolidation"
  ],
  "phase_3_deliverables": [
    "Decision package with sponsor tradeoffs",
    "Sequenced roadmap with KPI guardrails",
    "Operating model and ownership alignment"
  ],
  "phase_4_deliverables": [
    "Execution plan and workstream mobilization",
    "Change management and adoption tracking",
    "KPI instrumentation and cadence reviews"
  ],
  "expected_time_to_value": {},
  "success_metrics": [],
  "leading_indicators": [],
  "required_sponsor_profile": {},
  "required_capabilities": [],
  "typical_stakeholders": [],
  "common_objections": [],
  "applicable_company_scales": [],
  "cross_pattern_links": [],
  "linked_kpi_ids": [
    "meridian_denial_rate_first_pass",
    "meridian_denial_rate_overall",
    "meridian_denial_writeoff_pct",
    "meridian_clean_claim_rate",
    "meridian_pos_collections_pct",
    "meridian_days_in_ar"
  ],
  "evidence_summary": "12.8% first-pass denial · $140M annual preventable denial impact · POS collections lagging peer median by 8 points",
  "confidence_level": "high",
  "last_updated": "2026-04-21T05:00:00.000Z",
  "version": "1.0",
  "author": "AbarVa North Star overlay",
  "reasoning_scope_id": "meridian_scope_broad",
  "disclosure_scope_id": "meridian_scope_broad",
  "source_id": null,
  "as_of_date": "2026-04-21T05:00:00.000Z",
  "last_verified_at": "2026-04-21T00:00:00.000Z",
  "raw_markdown": "### 3.2 · Revenue Cycle Denial Cascade\n\nFoundational pattern pack #14 — healthcare-specific.\n\n**Classification.** Category: Revenue Cycle Operations · Sector applicability: healthcare\n\n**Detection signals.**\n- First-pass denial rate >10%\n- Overall denial rate >5%\n- Denial write-off >1.5% of gross revenue\n- Clean claim rate <90%\n- POS collections <35%\n- Payer-specific denial clustering\n\n**Likely root causes.** Eligibility verification gap at point of service · prior authorization workflow inefficiency · documentation quality and specificity gap · coding accuracy · payer contract complexity · denial management reactive vs preventive · technology platform fragmentation\n\n**Intervention options.**\n- Eligibility and prior auth automation\n- Clinical documentation improvement program\n- Coding quality and AI-assisted coding\n- Denial prevention analytics (predictive at submission)\n- Payer contract review and rationalization\n- Technology platform consolidation\n\n**Linked KPIs.** First-Pass Denial (2.5.1), Overall Denial (2.5.2), Denial Write-Off (2.5.3), Clean Claim (2.5.4), POS Collections (2.5.5), Days in AR (2.1.3)\n\n**Meridian evidence.** 12.8% first-pass denial · $140M annual preventable denial impact · POS collections lagging peer median by 8 points",
  "metadata": {
    "classification": "Category: Revenue Cycle Operations · Sector applicability: healthcare",
    "linked_kpi_names": [
      "First-Pass Denial Rate",
      "Overall Denial Rate",
      "Denial Write-Off %",
      "Clean Claim Rate",
      "POS Collections %",
      "Days in AR"
    ],
    "linked_kpis_text": "First-Pass Denial (2.5.1), Overall Denial (2.5.2), Denial Write-Off (2.5.3), Clean Claim (2.5.4), POS Collections (2.5.5), Days in AR (2.1.3)",
    "expected_outcomes": [],
    "required_sponsor_profile": null
  },
  "created_at": "2026-04-21T22:13:41.886Z",
  "updated_at": "2026-05-10T02:01:49.457Z",
  "client_name": "Meridian Health",
  "tenant_key": "meridian-health",
  "industry_code": "HEALTHCARE_IDN"
}
```

### 24. meridian_pattern_access_and_capacity_mismatch — Access and Capacity Mismatch

- Client: Meridian Health (meridian-health, HEALTHCARE_IDN)
- Category: unknown
- Recommended classification: client-specific
- Recommendation rationale: Recommended client_private_patterns because the row appears tied to a named tenant, local evidence, program context, or client-specific operating condition.
- Founder decision: TODO

```json
{
  "id": "meridian_pattern_access_and_capacity_mismatch",
  "client_id": "a20ecef5-f0ea-4890-b9d5-7375fab223ff",
  "ordinal_ref": "3.5",
  "name": "Access and Capacity Mismatch",
  "short_description": "Healthcare-specific pattern.",
  "long_description": "Healthcare-specific pattern.",
  "category": null,
  "sector_applicability": [
    "healthcare"
  ],
  "cross_industry": false,
  "variant_of": null,
  "trigger_symptoms": [
    "Days to 3rd next available >10 (primary), >18 (specialty)",
    "ED boarding >3 hours",
    "capacity utilization variance across facilities",
    "telehealth underutilization",
    "specialist network gaps"
  ],
  "detection_signals": [
    "Days to 3rd next available >10 (primary), >18 (specialty)",
    "ED boarding >3 hours",
    "capacity utilization variance across facilities",
    "telehealth underutilization",
    "specialist network gaps"
  ],
  "diagnostic_questions": [],
  "evidence_requirements": [],
  "likely_root_causes": [],
  "common_adjacent_contradictions": [],
  "benchmark_signatures": [],
  "intervention_options": [],
  "anti_patterns": [],
  "common_failure_modes": [],
  "phase_1_deliverables": [
    "Days to 3rd next available >10 (primary), >18 (specialty)",
    "ED boarding >3 hours",
    "capacity utilization variance across facilities"
  ],
  "phase_2_deliverables": [],
  "phase_3_deliverables": [
    "Decision package with sponsor tradeoffs",
    "Sequenced roadmap with KPI guardrails",
    "Operating model and ownership alignment"
  ],
  "phase_4_deliverables": [
    "Execution plan and workstream mobilization",
    "Change management and adoption tracking",
    "KPI instrumentation and cadence reviews"
  ],
  "expected_time_to_value": {},
  "success_metrics": [],
  "leading_indicators": [],
  "required_sponsor_profile": {},
  "required_capabilities": [],
  "typical_stakeholders": [],
  "common_objections": [],
  "applicable_company_scales": [],
  "cross_pattern_links": [],
  "linked_kpi_ids": [
    "meridian_days_3rd_next_available",
    "meridian_ed_boarding_time",
    "meridian_hcahps_top_box",
    "meridian_telehealth_volume"
  ],
  "evidence_summary": "14 days PCP, 22 days specialty · 4.2 hour ED boarding · occupancy 62% (rural) to 91% (flagship) · telehealth at 12% of ambulatory volume",
  "confidence_level": "high",
  "last_updated": "2026-04-21T05:00:00.000Z",
  "version": "1.0",
  "author": "AbarVa North Star overlay",
  "reasoning_scope_id": "meridian_scope_broad",
  "disclosure_scope_id": "meridian_scope_broad",
  "source_id": null,
  "as_of_date": "2026-04-21T05:00:00.000Z",
  "last_verified_at": "2026-04-21T00:00:00.000Z",
  "raw_markdown": "### 3.5 · Access and Capacity Mismatch\n\nHealthcare-specific pattern.\n\n**Detection signals.** Days to 3rd next available >10 (primary), >18 (specialty) · ED boarding >3 hours · capacity utilization variance across facilities · telehealth underutilization · specialist network gaps\n\n**Meridian evidence.** 14 days PCP, 22 days specialty · 4.2 hour ED boarding · occupancy 62% (rural) to 91% (flagship) · telehealth at 12% of ambulatory volume\n\n**Linked KPIs.** Days to 3rd Next Available (2.3.3), ED Boarding (2.3.4), HCAHPS (2.3.1), Telehealth Volume (2.4.5)",
  "metadata": {
    "classification": null,
    "linked_kpi_names": [
      "Days to Third Next Available",
      "ED Boarding Time",
      "HCAHPS Top-Box %",
      "Telehealth Volume"
    ],
    "linked_kpis_text": "Days to 3rd Next Available (2.3.3), ED Boarding (2.3.4), HCAHPS (2.3.1), Telehealth Volume (2.4.5)",
    "expected_outcomes": [],
    "required_sponsor_profile": null
  },
  "created_at": "2026-04-21T22:13:41.886Z",
  "updated_at": "2026-05-10T02:01:49.457Z",
  "client_name": "Meridian Health",
  "tenant_key": "meridian-health",
  "industry_code": "HEALTHCARE_IDN"
}
```

### 25. meridian_pattern_care_transitions_gap — Care Transitions Gap

- Client: Meridian Health (meridian-health, HEALTHCARE_IDN)
- Category: unknown
- Recommended classification: client-specific
- Recommendation rationale: Recommended client_private_patterns because the row appears tied to a named tenant, local evidence, program context, or client-specific operating condition.
- Founder decision: TODO

```json
{
  "id": "meridian_pattern_care_transitions_gap",
  "client_id": "a20ecef5-f0ea-4890-b9d5-7375fab223ff",
  "ordinal_ref": "3.4",
  "name": "Care Transitions Gap",
  "short_description": "Foundational cross-sector pattern — healthcare application.",
  "long_description": "Foundational cross-sector pattern — healthcare application.",
  "category": null,
  "sector_applicability": [
    "healthcare"
  ],
  "cross_industry": false,
  "variant_of": null,
  "trigger_symptoms": [
    "Readmission >12%",
    "ALOS concentration in discharge-ready cohort",
    "care coordination staffing below peer",
    "discharge instruction compliance gaps",
    "post-acute partner performance variance"
  ],
  "detection_signals": [
    "Readmission >12%",
    "ALOS concentration in discharge-ready cohort",
    "care coordination staffing below peer",
    "discharge instruction compliance gaps",
    "post-acute partner performance variance"
  ],
  "diagnostic_questions": [],
  "evidence_requirements": [],
  "likely_root_causes": [],
  "common_adjacent_contradictions": [],
  "benchmark_signatures": [],
  "intervention_options": [],
  "anti_patterns": [],
  "common_failure_modes": [],
  "phase_1_deliverables": [
    "Readmission >12%",
    "ALOS concentration in discharge-ready cohort",
    "care coordination staffing below peer"
  ],
  "phase_2_deliverables": [],
  "phase_3_deliverables": [
    "Decision package with sponsor tradeoffs",
    "Sequenced roadmap with KPI guardrails",
    "Operating model and ownership alignment"
  ],
  "phase_4_deliverables": [
    "Execution plan and workstream mobilization",
    "Change management and adoption tracking",
    "KPI instrumentation and cadence reviews"
  ],
  "expected_time_to_value": {},
  "success_metrics": [],
  "leading_indicators": [],
  "required_sponsor_profile": {},
  "required_capabilities": [],
  "typical_stakeholders": [],
  "common_objections": [],
  "applicable_company_scales": [],
  "cross_pattern_links": [],
  "linked_kpi_ids": [
    "meridian_readmission_30day",
    "meridian_alos",
    "meridian_cost_per_adj_discharge",
    "meridian_hcahps_top_box"
  ],
  "evidence_summary": "14.2% readmission · 1.1 day avg discharge-ready delay · care coordination FTEs at 0.7 per 1000 discharges (peer 1.0)",
  "confidence_level": "high",
  "last_updated": "2026-04-21T05:00:00.000Z",
  "version": "1.0",
  "author": "AbarVa North Star overlay",
  "reasoning_scope_id": "meridian_scope_broad",
  "disclosure_scope_id": "meridian_scope_broad",
  "source_id": null,
  "as_of_date": "2026-04-21T05:00:00.000Z",
  "last_verified_at": "2026-04-21T00:00:00.000Z",
  "raw_markdown": "### 3.4 · Care Transitions Gap\n\nFoundational cross-sector pattern — healthcare application.\n\n**Detection signals.** Readmission >12% · ALOS concentration in discharge-ready cohort · care coordination staffing below peer · discharge instruction compliance gaps · post-acute partner performance variance\n\n**Meridian evidence.** 14.2% readmission · 1.1 day avg discharge-ready delay · care coordination FTEs at 0.7 per 1000 discharges (peer 1.0)\n\n**Linked KPIs.** Readmission (2.2.2), ALOS (2.4.2), Cost per Discharge (2.1.5), HCAHPS (2.3.1)",
  "metadata": {
    "classification": null,
    "linked_kpi_names": [
      "30-Day Readmission Rate",
      "Average Length of Stay",
      "Cost per Adjusted Discharge",
      "HCAHPS Top-Box %"
    ],
    "linked_kpis_text": "Readmission (2.2.2), ALOS (2.4.2), Cost per Discharge (2.1.5), HCAHPS (2.3.1)",
    "expected_outcomes": [],
    "required_sponsor_profile": null
  },
  "created_at": "2026-04-21T22:13:41.886Z",
  "updated_at": "2026-05-10T02:01:49.457Z",
  "client_name": "Meridian Health",
  "tenant_key": "meridian-health",
  "industry_code": "HEALTHCARE_IDN"
}
```

### 26. meridian_pattern_ma_risk_adjustment_maturation_gap — MA Risk Adjustment Maturation Gap

- Client: Meridian Health (meridian-health, HEALTHCARE_IDN)
- Category: unknown
- Recommended classification: client-specific
- Recommendation rationale: Recommended client_private_patterns because the row appears tied to a named tenant, local evidence, program context, or client-specific operating condition.
- Founder decision: TODO

```json
{
  "id": "meridian_pattern_ma_risk_adjustment_maturation_gap",
  "client_id": "a20ecef5-f0ea-4890-b9d5-7375fab223ff",
  "ordinal_ref": "3.7",
  "name": "MA Risk Adjustment Maturation Gap",
  "short_description": "Healthcare payer-specific pattern.",
  "long_description": "Healthcare payer-specific pattern.",
  "category": null,
  "sector_applicability": [
    "healthcare"
  ],
  "cross_industry": false,
  "variant_of": null,
  "trigger_symptoms": [
    "Risk adjustment accuracy <95%",
    "MA revenue trailing benchmark",
    "physician documentation quality variance",
    "HCC recapture rate low",
    "coder-physician collaboration gap"
  ],
  "detection_signals": [
    "Risk adjustment accuracy <95%",
    "MA revenue trailing benchmark",
    "physician documentation quality variance",
    "HCC recapture rate low",
    "coder-physician collaboration gap"
  ],
  "diagnostic_questions": [],
  "evidence_requirements": [],
  "likely_root_causes": [],
  "common_adjacent_contradictions": [],
  "benchmark_signatures": [],
  "intervention_options": [],
  "anti_patterns": [],
  "common_failure_modes": [],
  "phase_1_deliverables": [
    "Risk adjustment accuracy <95%",
    "MA revenue trailing benchmark",
    "physician documentation quality variance"
  ],
  "phase_2_deliverables": [],
  "phase_3_deliverables": [
    "Decision package with sponsor tradeoffs",
    "Sequenced roadmap with KPI guardrails",
    "Operating model and ownership alignment"
  ],
  "phase_4_deliverables": [
    "Execution plan and workstream mobilization",
    "Change management and adoption tracking",
    "KPI instrumentation and cadence reviews"
  ],
  "expected_time_to_value": {},
  "success_metrics": [],
  "leading_indicators": [],
  "required_sponsor_profile": {},
  "required_capabilities": [],
  "typical_stakeholders": [],
  "common_objections": [],
  "applicable_company_scales": [],
  "cross_pattern_links": [],
  "linked_kpi_ids": [
    "meridian_ma_risk_adjustment_accuracy",
    "meridian_ma_star_rating",
    "meridian_plan_mlr"
  ],
  "evidence_summary": "91% accuracy · HCC recapture rate 68% vs 78% benchmark · risk adjustment program staffing below peer",
  "confidence_level": "high",
  "last_updated": "2026-04-21T05:00:00.000Z",
  "version": "1.0",
  "author": "AbarVa North Star overlay",
  "reasoning_scope_id": "meridian_scope_broad",
  "disclosure_scope_id": "meridian_scope_broad",
  "source_id": null,
  "as_of_date": "2026-04-21T05:00:00.000Z",
  "last_verified_at": "2026-04-21T00:00:00.000Z",
  "raw_markdown": "### 3.7 · MA Risk Adjustment Maturation Gap\n\nHealthcare payer-specific pattern.\n\n**Detection signals.** Risk adjustment accuracy <95% · MA revenue trailing benchmark · physician documentation quality variance · HCC recapture rate low · coder-physician collaboration gap\n\n**Meridian evidence.** 91% accuracy · HCC recapture rate 68% vs 78% benchmark · risk adjustment program staffing below peer\n\n**Linked KPIs.** MA Risk Adjustment Accuracy (2.7.4), MA Star Rating (2.7.5), Medical Loss Ratio (2.7.1)\n\n---",
  "metadata": {
    "classification": null,
    "linked_kpi_names": [
      "MA Risk Adjustment Accuracy",
      "MA Star Rating",
      "Medical Loss Ratio (MLR)"
    ],
    "linked_kpis_text": "MA Risk Adjustment Accuracy (2.7.4), MA Star Rating (2.7.5), Medical Loss Ratio (2.7.1)",
    "expected_outcomes": [],
    "required_sponsor_profile": null
  },
  "created_at": "2026-04-21T22:13:41.886Z",
  "updated_at": "2026-05-10T02:01:49.457Z",
  "client_name": "Meridian Health",
  "tenant_key": "meridian-health",
  "industry_code": "HEALTHCARE_IDN"
}
```

### 27. meridian_pattern_physician_burnout_and_engagement_erosion — Physician Burnout and Engagement Erosion

- Client: Meridian Health (meridian-health, HEALTHCARE_IDN)
- Category: unknown
- Recommended classification: client-specific
- Recommendation rationale: Recommended client_private_patterns because the row appears tied to a named tenant, local evidence, program context, or client-specific operating condition.
- Founder decision: TODO

```json
{
  "id": "meridian_pattern_physician_burnout_and_engagement_erosion",
  "client_id": "a20ecef5-f0ea-4890-b9d5-7375fab223ff",
  "ordinal_ref": "3.6",
  "name": "Physician Burnout and Engagement Erosion",
  "short_description": "Healthcare-specific pattern.",
  "long_description": "Healthcare-specific pattern.",
  "category": null,
  "sector_applicability": [
    "healthcare"
  ],
  "cross_industry": false,
  "variant_of": null,
  "trigger_symptoms": [
    "Physician burnout index >40%",
    "wRVU productivity declining",
    "EHR user satisfaction <65%",
    "physician turnover elevated",
    "clinical documentation time exceeding patient-facing time"
  ],
  "detection_signals": [
    "Physician burnout index >40%",
    "wRVU productivity declining",
    "EHR user satisfaction <65%",
    "physician turnover elevated",
    "clinical documentation time exceeding patient-facing time"
  ],
  "diagnostic_questions": [],
  "evidence_requirements": [],
  "likely_root_causes": [],
  "common_adjacent_contradictions": [],
  "benchmark_signatures": [],
  "intervention_options": [],
  "anti_patterns": [],
  "common_failure_modes": [],
  "phase_1_deliverables": [
    "Physician burnout index >40%",
    "wRVU productivity declining",
    "EHR user satisfaction <65%"
  ],
  "phase_2_deliverables": [],
  "phase_3_deliverables": [
    "Decision package with sponsor tradeoffs",
    "Sequenced roadmap with KPI guardrails",
    "Operating model and ownership alignment"
  ],
  "phase_4_deliverables": [
    "Execution plan and workstream mobilization",
    "Change management and adoption tracking",
    "KPI instrumentation and cadence reviews"
  ],
  "expected_time_to_value": {},
  "success_metrics": [],
  "leading_indicators": [],
  "required_sponsor_profile": {},
  "required_capabilities": [],
  "typical_stakeholders": [],
  "common_objections": [],
  "applicable_company_scales": [],
  "cross_pattern_links": [],
  "linked_kpi_ids": [
    "meridian_physician_burnout_index",
    "meridian_wrvu_productivity",
    "meridian_ehr_user_satisfaction"
  ],
  "evidence_summary": "48% burnout · wRVU productivity 4,800 vs 5,200 target · EHR satisfaction 58% · documentation time exceeds patient-facing time in primary care",
  "confidence_level": "high",
  "last_updated": "2026-04-21T05:00:00.000Z",
  "version": "1.0",
  "author": "AbarVa North Star overlay",
  "reasoning_scope_id": "meridian_scope_broad",
  "disclosure_scope_id": "meridian_scope_broad",
  "source_id": null,
  "as_of_date": "2026-04-21T05:00:00.000Z",
  "last_verified_at": "2026-04-21T00:00:00.000Z",
  "raw_markdown": "### 3.6 · Physician Burnout and Engagement Erosion\n\nHealthcare-specific pattern.\n\n**Detection signals.** Physician burnout index >40% · wRVU productivity declining · EHR user satisfaction <65% · physician turnover elevated · clinical documentation time exceeding patient-facing time\n\n**Meridian evidence.** 48% burnout · wRVU productivity 4,800 vs 5,200 target · EHR satisfaction 58% · documentation time exceeds patient-facing time in primary care\n\n**Linked KPIs.** Physician Burnout Index (2.8.1), wRVU Productivity (2.8.3), EHR Satisfaction (2.9.3)",
  "metadata": {
    "classification": null,
    "linked_kpi_names": [
      "Physician Burnout Index",
      "wRVU Productivity",
      "EHR User Satisfaction"
    ],
    "linked_kpis_text": "Physician Burnout Index (2.8.1), wRVU Productivity (2.8.3), EHR Satisfaction (2.9.3)",
    "expected_outcomes": [],
    "required_sponsor_profile": null
  },
  "created_at": "2026-04-21T22:13:41.886Z",
  "updated_at": "2026-05-10T02:01:49.457Z",
  "client_name": "Meridian Health",
  "tenant_key": "meridian-health",
  "industry_code": "HEALTHCARE_IDN"
}
```

### 28. meridian_pattern_shadow_ai_in_clinical_and_revenue_cycle_operations — Shadow AI in Clinical and Revenue Cycle Operations

- Client: Meridian Health (meridian-health, HEALTHCARE_IDN)
- Category: unknown
- Recommended classification: client-specific
- Recommendation rationale: Recommended client_private_patterns because the row appears tied to a named tenant, local evidence, program context, or client-specific operating condition.
- Founder decision: TODO

```json
{
  "id": "meridian_pattern_shadow_ai_in_clinical_and_revenue_cycle_operations",
  "client_id": "a20ecef5-f0ea-4890-b9d5-7375fab223ff",
  "ordinal_ref": "3.3",
  "name": "Shadow AI in Clinical and Revenue Cycle Operations",
  "short_description": "Healthcare-specific variant of cross-sector Shadow AI Governance pattern (#1 of 20 foundational).",
  "long_description": "Healthcare-specific variant of cross-sector Shadow AI Governance pattern (#1 of 20 foundational).",
  "category": null,
  "sector_applicability": [
    "healthcare"
  ],
  "cross_industry": false,
  "variant_of": null,
  "trigger_symptoms": [],
  "detection_signals": [],
  "diagnostic_questions": [],
  "evidence_requirements": [],
  "likely_root_causes": [],
  "common_adjacent_contradictions": [],
  "benchmark_signatures": [],
  "intervention_options": [],
  "anti_patterns": [],
  "common_failure_modes": [],
  "phase_1_deliverables": [],
  "phase_2_deliverables": [],
  "phase_3_deliverables": [
    "Decision package with sponsor tradeoffs",
    "Sequenced roadmap with KPI guardrails",
    "Operating model and ownership alignment"
  ],
  "phase_4_deliverables": [
    "Execution plan and workstream mobilization",
    "Change management and adoption tracking",
    "KPI instrumentation and cadence reviews"
  ],
  "expected_time_to_value": {},
  "success_metrics": [],
  "leading_indicators": [],
  "required_sponsor_profile": {},
  "required_capabilities": [],
  "typical_stakeholders": [],
  "common_objections": [],
  "applicable_company_scales": [],
  "cross_pattern_links": [],
  "linked_kpi_ids": [
    "meridian_ai_governance_maturity",
    "meridian_cybersecurity_maturity"
  ],
  "evidence_summary": "16 AI tools identified · 9 below governance threshold · 4 with PHI exposure (BAA status unclear) · 2 with clinical decision integration · 3 in revenue cycle with payer-audit exposure",
  "confidence_level": "high",
  "last_updated": "2026-04-21T05:00:00.000Z",
  "version": "1.0",
  "author": "AbarVa North Star overlay",
  "reasoning_scope_id": "meridian_scope_broad",
  "disclosure_scope_id": "meridian_scope_broad",
  "source_id": null,
  "as_of_date": "2026-04-21T05:00:00.000Z",
  "last_verified_at": "2026-04-21T00:00:00.000Z",
  "raw_markdown": "### 3.3 · Shadow AI in Clinical and Revenue Cycle Operations\n\nHealthcare-specific variant of cross-sector Shadow AI Governance pattern (#1 of 20 foundational).\n\n**Classification.** Variant of Shadow AI Governance · Sector applicability: healthcare\n\n**Healthcare-specific sensitivities.** PHI handling in AI tools not BAA-covered · HIPAA violation risk · clinical decision influence without validation · payer audit exposure\n\n**Meridian evidence.** 16 AI tools identified · 9 below governance threshold · 4 with PHI exposure (BAA status unclear) · 2 with clinical decision integration · 3 in revenue cycle with payer-audit exposure\n\n**Linked KPIs.** AI Governance Maturity (2.9.1), Cybersecurity Maturity (2.9.2)",
  "metadata": {
    "classification": "Variant of Shadow AI Governance · Sector applicability: healthcare",
    "linked_kpi_names": [
      "AI Governance Maturity",
      "Cybersecurity Maturity (HITRUST+NIST)"
    ],
    "linked_kpis_text": "AI Governance Maturity (2.9.1), Cybersecurity Maturity (2.9.2)",
    "expected_outcomes": [],
    "required_sponsor_profile": null
  },
  "created_at": "2026-04-21T22:13:41.886Z",
  "updated_at": "2026-05-10T02:01:49.457Z",
  "client_name": "Meridian Health",
  "tenant_key": "meridian-health",
  "industry_code": "HEALTHCARE_IDN"
}
```
