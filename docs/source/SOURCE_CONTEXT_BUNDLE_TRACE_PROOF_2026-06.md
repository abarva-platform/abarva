# Source Context-Bundle Trace Proof — SkyHarbor AMS (2026-06)

Proof of the **complete governed reasoning chain** for Source/Sentinel AMS answers — not just "retrieval returned sources." Every answer is produced by a VNet job that: resolves tenant + AMS archetype + sourcing phase + evidence requirements → runs **tenant-scoped Azure AI Search retrieval** → applies the **governed gate** (`governed_object_readiness`: eligible `agent_ready` vs excluded-by-reason) → emits a `SourceContextBundleTrace` → calls Claude **only when `model_call_allowed`**, constrained to the governed bundle → maps claims to sources, flags unsupported, checks tenant leakage, scores wisdom.

- Tenant: `skyharbor-air` / client_id `6f3c8d21-9b45-4f12-8d61-4b8f7c2a9301` · archetype `AMS_MANAGED_SERVICES` · event `evt-skyharbor-ams-2026`
- Retrieval: Azure AI Search `tenant-context-v1`, filter `tenant_key eq 'skyharbor-air'` (mandatory). Model: `claude-opus-4-7`. Run: VNet ACA job, 2026-06-10.
- Trace contract: `src/lib/source/context-bundle-trace.ts`. Runner: `scripts/skyharbor/run-context-bundle-trace.cjs`.

## Summary across 10 AMS questions

| Q | Question | grounding | eligible | missing fams | claims (unsupported) | citations | tenant | wisdom |
|---|---|---|---|---|---|---|---|---|
| Q1 | What evidence is missing before we issue an AM | **warn** | 12 | 10 | 0 (0) | 6 | clean | 3.67 |
| Q2 | What is the current SkyHarbor application and  | **warn** | 12 | 2 | 8 (1) | 6 | clean | 4.11 |
| Q3 | What vendor contracts are relevant to this sou | **pass** | 12 | 0 | 0 (0) | 6 | clean | 4.11 |
| Q4 | What IT financial baseline should shape the pr | **pass** | 12 | 0 | 0 (0) | 6 | clean | 4.11 |
| Q5 | What SLAs and incident data should inform the  | **warn** | 12 | 1 | 0 (0) | 6 | clean | 3.78 |
| Q6 | What should the AMS RFP structure include? | **warn** | 12 | 1 | 0 (0) | 6 | clean | 3.78 |
| Q7 | What vendor questions should we ask? | **warn** | 2 | 1 | 7 (0) | 2 | clean | 4.33 |
| Q8 | What pricing and negotiation levers matter? | **warn** | 4 | 2 | 3 (0) | 4 | clean | 4.11 |
| Q9 | What risks should be protected in the contract | **warn** | 12 | 1 | 0 (0) | 6 | clean | 3.78 |
| Q10 | What cannot yet be answered from current evide | **warn** | 12 | 10 | 0 (0) | 6 | clean | 3.67 |

**Acceptance check:** tenant isolation clean on 10/10 · grounding honest (pass only where required families fully covered; warn names the gaps) · unsupported claims flagged (Q2) · readiness-gap questions (Q1/Q10) correctly report missing families · every answerable question emits citation objects from the governed gate.

---
### Q1 — What evidence is missing before we issue an AMS RFP?

**Trace** `tr-evt-skyharbor-ams-2026-Q1` · intent `readiness_gap` · phase `intake` · grounding **warn** · model_call_allowed **True** · bundle_hash `e6ed4fd6c033…`

- **Evidence required:** application_inventory, service_tower_scope, run_cost_baseline, ticket_volumes, incident_problem_change, sla_baseline, staffing_baseline, tooling_landscape, contract_baseline, transition_constraints, retained_org_model
- **Eligible (agent_ready) families:** sla_baseline
- **Missing families:** application_inventory, service_tower_scope, run_cost_baseline, ticket_volumes, incident_problem_change, staffing_baseline, tooling_landscape, contract_baseline, transition_constraints, retained_org_model
- **Retrieved by family:** apps/systems 0 · vendor_contracts 0 · financial 0 · sla/kpi 12 · itsm/telemetry 0 · org/workforce 0 · corpus 0
- **Excluded by reason:** none of the retrieved set
- **Facts:** current 120 · superseded(excluded) 0 · citation-ready 12 · tenant_leakage **clean**
- **Wisdom:** overall 3.67 (tenant 5 · archetype 5 · evidence 3 · judgment 3 · pricing 2 · risk 3 · usefulness 4 · discipline 3 · no-hallucination 5)

**Answer (grounded, Claude `claude-opus-4-7`, bundle-only):**

> {"answer":"Based on the SLA register provided, several material gaps must be closed before SkyHarbor issues an AMS RFP. (1) Root-cause and trend data: the bundle shows point-in-time 'actual' vs target values and breach counts (e.g., Application Mgmt availability at 91.90% vs 99.9% target [SLA-0025], Change success rate at 85% vs 98% [SLA-0029], FCR shown as '73.2h' against a 75% target which appea

**Citations emitted:**
- `ctx:skyharbor-air:it_landscape:sla-register-csv-sla-0014:c0` (it_landscape) src=skyharbor-air/skyharbor-air-synthetic-v2/e5a07d56f89b/sla-register.csv conf=medium
- `ctx:skyharbor-air:it_landscape:sla-register-csv-sla-0025:c0` (it_landscape) src=skyharbor-air/skyharbor-air-synthetic-v2/e5a07d56f89b/sla-register.csv conf=medium
- `ctx:skyharbor-air:it_landscape:sla-register-csv-sla-0026:c0` (it_landscape) src=skyharbor-air/skyharbor-air-synthetic-v2/e5a07d56f89b/sla-register.csv conf=medium
- `ctx:skyharbor-air:it_landscape:sla-register-csv-sla-0027:c0` (it_landscape) src=skyharbor-air/skyharbor-air-synthetic-v2/e5a07d56f89b/sla-register.csv conf=medium

---
### Q2 — What is the current SkyHarbor application and systems baseline?

**Trace** `tr-evt-skyharbor-ams-2026-Q2` · intent `current_state` · phase `scope` · grounding **warn** · model_call_allowed **True** · bundle_hash `a370b2099d07…`

- **Evidence required:** application_inventory, service_tower_scope
- **Eligible (agent_ready) families:** contract_baseline
- **Missing families:** application_inventory, service_tower_scope
- **Retrieved by family:** apps/systems 0 · vendor_contracts 12 · financial 0 · sla/kpi 0 · itsm/telemetry 0 · org/workforce 0 · corpus 0
- **Excluded by reason:** none of the retrieved set
- **Facts:** current 108 · superseded(excluded) 0 · citation-ready 12 · tenant_leakage **clean**
- **Wisdom:** overall 4.11 (tenant 5 · archetype 5 · evidence 3 · judgment 4 · pricing 4 · risk 3 · usefulness 4 · discipline 5 · no-hallucination 4)

**Answer (grounded, Claude `claude-opus-4-7`, bundle-only):**

> The governed evidence bundle does not contain a SkyHarbor application or systems baseline (e.g., application inventory, system counts, technology stack, infrastructure footprint, or architecture documentation). The bundle only includes vendor contract records covering AMS, mainframe managed services, application modernization, SaaS, staff augmentation, licenses, support, and niche AMS scopes across vendors such as IBM Global Services, Accenture, Helios Systems, Northwind Systems, Summit Systems, Cardinal Systems, Beacon Systems, and Vertex Systems. While these contracts imply the presence of mainframe and application portfolios under managed services, no baseline inventory or system-level details are provided.

**Claim → source map:**
- `unsupported` — No application or systems baseline data is present in the bundle.
- `chunk` — IBM Global Services holds a strategic AMS + mainframe managed services contract with SkyHa → ctx:skyharbor-air:it_financials:vendor-contracts-csv-ven-0001:c0
- `chunk` — Accenture holds a strategic contract for application modernization + AMS. → ctx:skyharbor-air:it_financials:vendor-contracts-csv-ven-0003:c0
- `chunk` — Niche AMS scope is also covered by Helios Systems and Cardinal Systems. → ctx:skyharbor-air:it_financials:vendor-contracts-csv-ven-0040:c0
- `chunk` — SaaS scope contracts exist with Northwind Systems and Summit Systems. → ctx:skyharbor-air:it_financials:vendor-contracts-csv-ven-0055:c0
- `chunk` — Staff augmentation contracts are held with Summit Systems and Vertex Systems. → ctx:skyharbor-air:it_financials:vendor-contracts-csv-ven-0077:c0

**Citations emitted:**
- `ctx:skyharbor-air:it_financials:vendor-contracts-csv-ven-0001:c0` (it_financials) src=skyharbor-air/skyharbor-air-synthetic-v2/c2a65b2512d2/vendor-contracts.csv conf=medium
- `ctx:skyharbor-air:it_financials:vendor-contracts-csv-ven-0003:c0` (it_financials) src=skyharbor-air/skyharbor-air-synthetic-v2/c2a65b2512d2/vendor-contracts.csv conf=medium
- `ctx:skyharbor-air:it_financials:vendor-contracts-csv-ven-0040:c0` (it_financials) src=skyharbor-air/skyharbor-air-synthetic-v2/c2a65b2512d2/vendor-contracts.csv conf=medium
- `ctx:skyharbor-air:it_financials:vendor-contracts-csv-ven-0055:c0` (it_financials) src=skyharbor-air/skyharbor-air-synthetic-v2/c2a65b2512d2/vendor-contracts.csv conf=medium

---
### Q3 — What vendor contracts are relevant to this sourcing event?

**Trace** `tr-evt-skyharbor-ams-2026-Q3` · intent `commercial` · phase `strategy` · grounding **pass** · model_call_allowed **True** · bundle_hash `9ee43b3232ce…`

- **Evidence required:** contract_baseline
- **Eligible (agent_ready) families:** contract_baseline
- **Missing families:** none
- **Retrieved by family:** apps/systems 0 · vendor_contracts 12 · financial 0 · sla/kpi 0 · itsm/telemetry 0 · org/workforce 0 · corpus 0
- **Excluded by reason:** none of the retrieved set
- **Facts:** current 108 · superseded(excluded) 0 · citation-ready 12 · tenant_leakage **clean**
- **Wisdom:** overall 4.11 (tenant 5 · archetype 5 · evidence 5 · judgment 3 · pricing 4 · risk 3 · usefulness 4 · discipline 3 · no-hallucination 5)

**Answer (grounded, Claude `claude-opus-4-7`, bundle-only):**

> {"answer":"Based on the governed evidence bundle, the following SkyHarbor vendor contracts are relevant to this AMS sourcing event. Two strategic AMS anchors dominate spend: IBM Global Services (VEN-0001) at $280M/yr for AMS + mainframe managed services, renewing 2027-12-31 with 6mo notice exit, buyer-owned data, no AI clauses; and Accenture (VEN-0003) at $120M/yr for Application modernization + A

**Citations emitted:**
- `ctx:skyharbor-air:it_financials:vendor-contracts-csv-ven-0001:c0` (it_financials) src=skyharbor-air/skyharbor-air-synthetic-v2/c2a65b2512d2/vendor-contracts.csv conf=medium
- `ctx:skyharbor-air:it_financials:vendor-contracts-csv-ven-0003:c0` (it_financials) src=skyharbor-air/skyharbor-air-synthetic-v2/c2a65b2512d2/vendor-contracts.csv conf=medium
- `ctx:skyharbor-air:it_financials:vendor-contracts-csv-ven-0011:c0` (it_financials) src=skyharbor-air/skyharbor-air-synthetic-v2/c2a65b2512d2/vendor-contracts.csv conf=medium
- `ctx:skyharbor-air:it_financials:vendor-contracts-csv-ven-0040:c0` (it_financials) src=skyharbor-air/skyharbor-air-synthetic-v2/c2a65b2512d2/vendor-contracts.csv conf=medium

---
### Q4 — What IT financial baseline should shape the pricing model?

**Trace** `tr-evt-skyharbor-ams-2026-Q4` · intent `pricing` · phase `pricing` · grounding **pass** · model_call_allowed **True** · bundle_hash `21762f02aa79…`

- **Evidence required:** run_cost_baseline
- **Eligible (agent_ready) families:** run_cost_baseline
- **Missing families:** none
- **Retrieved by family:** apps/systems 0 · vendor_contracts 0 · financial 12 · sla/kpi 0 · itsm/telemetry 0 · org/workforce 0 · corpus 0
- **Excluded by reason:** none of the retrieved set
- **Facts:** current 96 · superseded(excluded) 0 · citation-ready 12 · tenant_leakage **clean**
- **Wisdom:** overall 4.11 (tenant 5 · archetype 5 · evidence 5 · judgment 3 · pricing 4 · risk 3 · usefulness 4 · discipline 3 · no-hallucination 5)

**Answer (grounded, Claude `claude-opus-4-7`, bundle-only):**

> {"answer":"For SkyHarbor's FY2026 IT budget, the visible baseline in the bundle is dominated by Application Management, which alone accounts for ~$204.0M across three line items: Labor (internal) $83,015,312 [FIN-0113], Software & License $56,963,487 [FIN-0116], and Depreciation $64,035,668 [FIN-0118]. This concentration should anchor the AMS pricing model — particularly the labor line, which is t

**Citations emitted:**
- `ctx:skyharbor-air:it_financials:it-financials-csv-fin-0091:c0` (it_financials) src=skyharbor-air/skyharbor-air-synthetic-v2/40aed2bdb177/it-financials.csv conf=medium
- `ctx:skyharbor-air:it_financials:it-financials-csv-fin-0102:c0` (it_financials) src=skyharbor-air/skyharbor-air-synthetic-v2/40aed2bdb177/it-financials.csv conf=medium
- `ctx:skyharbor-air:it_financials:it-financials-csv-fin-0108:c0` (it_financials) src=skyharbor-air/skyharbor-air-synthetic-v2/40aed2bdb177/it-financials.csv conf=medium
- `ctx:skyharbor-air:it_financials:it-financials-csv-fin-0113:c0` (it_financials) src=skyharbor-air/skyharbor-air-synthetic-v2/40aed2bdb177/it-financials.csv conf=medium

---
### Q5 — What SLAs and incident data should inform the service model?

**Trace** `tr-evt-skyharbor-ams-2026-Q5` · intent `service_model` · phase `scope` · grounding **warn** · model_call_allowed **True** · bundle_hash `f66d42991e0b…`

- **Evidence required:** sla_baseline, incident_problem_change
- **Eligible (agent_ready) families:** sla_baseline
- **Missing families:** incident_problem_change
- **Retrieved by family:** apps/systems 0 · vendor_contracts 0 · financial 0 · sla/kpi 12 · itsm/telemetry 0 · org/workforce 0 · corpus 0
- **Excluded by reason:** none of the retrieved set
- **Facts:** current 120 · superseded(excluded) 0 · citation-ready 12 · tenant_leakage **clean**
- **Wisdom:** overall 3.78 (tenant 5 · archetype 5 · evidence 3 · judgment 3 · pricing 2 · risk 4 · usefulness 4 · discipline 3 · no-hallucination 5)

**Answer (grounded, Claude `claude-opus-4-7`, bundle-only):**

> {"answer":"For SkyHarbor's service model, the SLA register reveals systemic underperformance across nearly every tower against a 99.9% monthly availability target, which should directly shape service-tier design, credit regimes, and tower scoping. Key inputs:\n\n1) Availability SLAs (all targeted at 99.9% monthly) — every tower is breaching except Integration, which is close but still below target

**Citations emitted:**
- `ctx:skyharbor-air:it_landscape:sla-register-csv-sla-0001:c0` (it_landscape) src=skyharbor-air/skyharbor-air-synthetic-v2/e5a07d56f89b/sla-register.csv conf=medium
- `ctx:skyharbor-air:it_landscape:sla-register-csv-sla-0007:c0` (it_landscape) src=skyharbor-air/skyharbor-air-synthetic-v2/e5a07d56f89b/sla-register.csv conf=medium
- `ctx:skyharbor-air:it_landscape:sla-register-csv-sla-0013:c0` (it_landscape) src=skyharbor-air/skyharbor-air-synthetic-v2/e5a07d56f89b/sla-register.csv conf=medium
- `ctx:skyharbor-air:it_landscape:sla-register-csv-sla-0019:c0` (it_landscape) src=skyharbor-air/skyharbor-air-synthetic-v2/e5a07d56f89b/sla-register.csv conf=medium

---
### Q6 — What should the AMS RFP structure include?

**Trace** `tr-evt-skyharbor-ams-2026-Q6` · intent `rfp_design` · phase `rfp` · grounding **warn** · model_call_allowed **True** · bundle_hash `2e98885c38e0…`

- **Evidence required:** service_tower_scope, sla_baseline
- **Eligible (agent_ready) families:** sla_baseline
- **Missing families:** service_tower_scope
- **Retrieved by family:** apps/systems 0 · vendor_contracts 0 · financial 0 · sla/kpi 12 · itsm/telemetry 0 · org/workforce 0 · corpus 0
- **Excluded by reason:** none of the retrieved set
- **Facts:** current 120 · superseded(excluded) 0 · citation-ready 12 · tenant_leakage **clean**
- **Wisdom:** overall 3.78 (tenant 5 · archetype 5 · evidence 3 · judgment 3 · pricing 2 · risk 4 · usefulness 4 · discipline 3 · no-hallucination 5)

**Answer (grounded, Claude `claude-opus-4-7`, bundle-only):**

> {"answer":"The governed evidence bundle for SkyHarbor contains only the SLA register (service-level breaches, targets, credits at risk by tower). It does not contain RFP structure guidance, procurement templates, sourcing playbooks, or AMS contracting frameworks. Therefore, a specific RFP structure recommendation cannot be produced from the available evidence. What the evidence does support is the

**Citations emitted:**
- `ctx:skyharbor-air:it_landscape:sla-register-csv-sla-0013:c0` (it_landscape) src=skyharbor-air/skyharbor-air-synthetic-v2/e5a07d56f89b/sla-register.csv conf=medium
- `ctx:skyharbor-air:it_landscape:sla-register-csv-sla-0015:c0` (it_landscape) src=skyharbor-air/skyharbor-air-synthetic-v2/e5a07d56f89b/sla-register.csv conf=medium
- `ctx:skyharbor-air:it_landscape:sla-register-csv-sla-0019:c0` (it_landscape) src=skyharbor-air/skyharbor-air-synthetic-v2/e5a07d56f89b/sla-register.csv conf=medium
- `ctx:skyharbor-air:it_landscape:sla-register-csv-sla-0023:c0` (it_landscape) src=skyharbor-air/skyharbor-air-synthetic-v2/e5a07d56f89b/sla-register.csv conf=medium

---
### Q7 — What vendor questions should we ask?

**Trace** `tr-evt-skyharbor-ams-2026-Q7` · intent `vendor_engagement` · phase `responses` · grounding **warn** · model_call_allowed **True** · bundle_hash `9863fb2abfd5…`

- **Evidence required:** service_tower_scope
- **Eligible (agent_ready) families:** contract_baseline, it_landscape
- **Missing families:** service_tower_scope
- **Retrieved by family:** apps/systems 1 · vendor_contracts 1 · financial 0 · sla/kpi 0 · itsm/telemetry 0 · org/workforce 0 · corpus 0
- **Excluded by reason:** not_reviewed:10
- **Facts:** current 16 · superseded(excluded) 0 · citation-ready 2 · tenant_leakage **clean**
- **Wisdom:** overall 4.33 (tenant 5 · archetype 5 · evidence 3 · judgment 4 · pricing 4 · risk 4 · usefulness 4 · discipline 5 · no-hallucination 5)

**Answer (grounded, Claude `claude-opus-4-7`, bundle-only):**

> Based strictly on the governed evidence, I can only anchor vendor questions to two items: the SAP S/4HANA contract (VEN-0007) and the Custom RAG assistant (AIT-016). For SAP, ask: (1) Given the 2026-09-30 renewal and $55M annual value, what is the roadmap for adding AI clauses, since the current contract has none? (2) Can the 12-month termination assistance be extended or tied to specific exit deliverables for S/4HANA migration continuity? (3) How will SAP preserve the buyer-owned data rights as new AI/GenAI features are introduced into S/4HANA? For the Custom RAG assistant (AIT-016, Gemini-based, CDAO-owned, service desk workflow, medium risk, non-regulated), ask: (1) What data rights and model-training terms apply to the Gemini model usage? (2) What controls justify the 'medium' risk classification and would they hold if the workflow expanded to regulated areas? (3) Who is accountable

**Claim → source map:**
- `fact` — SAP contract VEN-0007 has $55M annual value and renews 2026-09-30. → ctx:skyharbor-air:it_financials:vendor-contracts-csv-ven-0007:c0
- `fact` — SAP contract has no AI clauses and buyer-owned data rights. → ctx:skyharbor-air:it_financials:vendor-contracts-csv-ven-0007:c0
- `fact` — SAP exit terms provide 12-month termination assistance. → ctx:skyharbor-air:it_financials:vendor-contracts-csv-ven-0007:c0
- `fact` — SAP scope is S/4HANA + licenses, strategic category. → ctx:skyharbor-air:it_financials:vendor-contracts-csv-ven-0007:c0
- `fact` — AIT-016 is a Custom RAG assistant using Gemini, owned by CDAO, for service desk workflow. → ctx:skyharbor-air:it_landscape:ai-tooling-csv-ait-016:c0
- `fact` — AIT-016 is classified medium risk and is not a regulated workflow. → ctx:skyharbor-air:it_landscape:ai-tooling-csv-ait-016:c0

**Citations emitted:**
- `ctx:skyharbor-air:it_financials:vendor-contracts-csv-ven-0007:c0` (it_financials) src=skyharbor-air/skyharbor-air-synthetic-v2/c2a65b2512d2/vendor-contracts.csv conf=medium
- `ctx:skyharbor-air:it_landscape:ai-tooling-csv-ait-016:c0` (it_landscape) src=skyharbor-air/skyharbor-air-synthetic-v2/72089495735d/ai-tooling.csv conf=medium

---
### Q8 — What pricing and negotiation levers matter?

**Trace** `tr-evt-skyharbor-ams-2026-Q8` · intent `negotiation` · phase `pricing` · grounding **warn** · model_call_allowed **True** · bundle_hash `b4d0b3dc7ac6…`

- **Evidence required:** run_cost_baseline, contract_baseline
- **Eligible (agent_ready) families:** enterprise_profile
- **Missing families:** run_cost_baseline, contract_baseline
- **Retrieved by family:** apps/systems 0 · vendor_contracts 0 · financial 0 · sla/kpi 0 · itsm/telemetry 0 · org/workforce 0 · corpus 4
- **Excluded by reason:** not_reviewed:8
- **Facts:** current 20 · superseded(excluded) 0 · citation-ready 4 · tenant_leakage **clean**
- **Wisdom:** overall 4.11 (tenant 5 · archetype 5 · evidence 3 · judgment 4 · pricing 2 · risk 4 · usefulness 4 · discipline 5 · no-hallucination 5)

**Answer (grounded, Claude `claude-opus-4-7`, bundle-only):**

> The governed evidence bundle for SkyHarbor only contains four 'Pricing & RM' business-capability entries (CAP-021 through CAP-024), each owned by the Director Pricing and mapped to different business functions (Revenue Accounting, DCS, Maintenance, Crew) and value streams (Support, Sell). It does not contain any AMS commercial terms, rate cards, unit pricing, FX/COLA, volume discounts, SLA credits, benchmarks, or negotiation-lever content. Therefore, the specific pricing and negotiation levers that matter for SkyHarbor's AMS sourcing event are missing from the bundle and I cannot enumerate them without inventing terms.

**Claim → source map:**
- `chunk` — SkyHarbor has four Pricing & RM business capabilities (CAP-021 to CAP-024), all owned by t → ctx:skyharbor-air:enterprise_profile:business-capabilities-csv-cap-021:c0; ctx:skyharbor-air:enterprise_profile:business-capabilities-csv-cap-022:c0; ctx:skyharbor-air:enterprise_profile:business-capabilities-csv-cap-023:c0; ctx:skyharbor-air:enterprise_profile:business-capabilities-csv-cap-024:c0
- `chunk` — These pricing capabilities span Revenue Accounting, DCS, Maintenance, and Crew business fu → ctx:skyharbor-air:enterprise_profile:business-capabilities-csv-cap-021:c0; ctx:skyharbor-air:enterprise_profile:business-capabilities-csv-cap-022:c0; ctx:skyharbor-air:enterprise_profile:business-capabilities-csv-cap-023:c0; ctx:skyharbor-air:enterprise_profile:business-capabilities-csv-cap-024:c0
- `fact` — The bundle contains no AMS commercial terms, rate cards, SLA credits, benchmarks, or negot

**Citations emitted:**
- `ctx:skyharbor-air:enterprise_profile:business-capabilities-csv-cap-021:c0` (enterprise_profile) src=skyharbor-air/skyharbor-air-synthetic-v2/90b9d12ef3eb/business-capabilities.csv conf=medium
- `ctx:skyharbor-air:enterprise_profile:business-capabilities-csv-cap-022:c0` (enterprise_profile) src=skyharbor-air/skyharbor-air-synthetic-v2/90b9d12ef3eb/business-capabilities.csv conf=medium
- `ctx:skyharbor-air:enterprise_profile:business-capabilities-csv-cap-023:c0` (enterprise_profile) src=skyharbor-air/skyharbor-air-synthetic-v2/90b9d12ef3eb/business-capabilities.csv conf=medium
- `ctx:skyharbor-air:enterprise_profile:business-capabilities-csv-cap-024:c0` (enterprise_profile) src=skyharbor-air/skyharbor-air-synthetic-v2/90b9d12ef3eb/business-capabilities.csv conf=medium

---
### Q9 — What risks should be protected in the contract?

**Trace** `tr-evt-skyharbor-ams-2026-Q9` · intent `risk` · phase `strategy` · grounding **warn** · model_call_allowed **True** · bundle_hash `77872689ff1b…`

- **Evidence required:** contract_baseline
- **Eligible (agent_ready) families:** sla_baseline
- **Missing families:** contract_baseline
- **Retrieved by family:** apps/systems 0 · vendor_contracts 0 · financial 0 · sla/kpi 12 · itsm/telemetry 0 · org/workforce 0 · corpus 0
- **Excluded by reason:** none of the retrieved set
- **Facts:** current 120 · superseded(excluded) 0 · citation-ready 12 · tenant_leakage **clean**
- **Wisdom:** overall 3.78 (tenant 5 · archetype 5 · evidence 3 · judgment 3 · pricing 2 · risk 4 · usefulness 4 · discipline 3 · no-hallucination 5)

**Answer (grounded, Claude `claude-opus-4-7`, bundle-only):**

> {"answer":"Based on SkyHarbor's SLA register, the contract should protect against the following concrete, evidenced risks:\n\n1) Storage availability shortfall — Storage service is running at 95.72% against a 99.9% target with 2 breaches and $574,585 credit-at-risk (SLA-0013). Protect via firm availability SLA, escalating service credits, and root-cause/exit triggers on repeat breaches.\n\n2) Stor

**Citations emitted:**
- `ctx:skyharbor-air:it_landscape:sla-register-csv-sla-0012:c0` (it_landscape) src=skyharbor-air/skyharbor-air-synthetic-v2/e5a07d56f89b/sla-register.csv conf=medium
- `ctx:skyharbor-air:it_landscape:sla-register-csv-sla-0013:c0` (it_landscape) src=skyharbor-air/skyharbor-air-synthetic-v2/e5a07d56f89b/sla-register.csv conf=medium
- `ctx:skyharbor-air:it_landscape:sla-register-csv-sla-0014:c0` (it_landscape) src=skyharbor-air/skyharbor-air-synthetic-v2/e5a07d56f89b/sla-register.csv conf=medium
- `ctx:skyharbor-air:it_landscape:sla-register-csv-sla-0019:c0` (it_landscape) src=skyharbor-air/skyharbor-air-synthetic-v2/e5a07d56f89b/sla-register.csv conf=medium

---
### Q10 — What cannot yet be answered from current evidence?

**Trace** `tr-evt-skyharbor-ams-2026-Q10` · intent `readiness_gap` · phase `intake` · grounding **warn** · model_call_allowed **True** · bundle_hash `1449a242ed98…`

- **Evidence required:** application_inventory, service_tower_scope, run_cost_baseline, ticket_volumes, incident_problem_change, sla_baseline, staffing_baseline, tooling_landscape, contract_baseline, transition_constraints, retained_org_model
- **Eligible (agent_ready) families:** staffing_baseline
- **Missing families:** application_inventory, service_tower_scope, run_cost_baseline, ticket_volumes, incident_problem_change, sla_baseline, tooling_landscape, contract_baseline, transition_constraints, retained_org_model
- **Retrieved by family:** apps/systems 0 · vendor_contracts 0 · financial 0 · sla/kpi 0 · itsm/telemetry 0 · org/workforce 12 · corpus 0
- **Excluded by reason:** none of the retrieved set
- **Facts:** current 84 · superseded(excluded) 0 · citation-ready 12 · tenant_leakage **clean**
- **Wisdom:** overall 3.67 (tenant 5 · archetype 5 · evidence 3 · judgment 3 · pricing 2 · risk 3 · usefulness 4 · discipline 3 · no-hallucination 5)

**Answer (grounded, Claude `claude-opus-4-7`, bundle-only):**

> {"answer":"Based solely on the GOVERNED EVIDENCE BUNDLE, which contains only 12 individual org-role records (names, levels, manager IDs, cost centers, and locations) for SkyHarbor personnel, a very large set of questions cannot yet be answered. Specifically, the bundle does not contain: (1) any AMS scope, towers, or in-scope applications; (2) incident/ticket volumes, SLAs, or service-level perform

**Citations emitted:**
- `ctx:skyharbor-air:org_structure:org-roles-csv-org-0009:c0` (org_structure) src=skyharbor-air/skyharbor-air-synthetic-v2/0d7b57d60b27/org-roles.csv conf=medium
- `ctx:skyharbor-air:org_structure:org-roles-csv-org-0018:c0` (org_structure) src=skyharbor-air/skyharbor-air-synthetic-v2/0d7b57d60b27/org-roles.csv conf=medium
- `ctx:skyharbor-air:org_structure:org-roles-csv-org-0027:c0` (org_structure) src=skyharbor-air/skyharbor-air-synthetic-v2/0d7b57d60b27/org-roles.csv conf=medium
- `ctx:skyharbor-air:org_structure:org-roles-csv-org-0028:c0` (org_structure) src=skyharbor-air/skyharbor-air-synthetic-v2/0d7b57d60b27/org-roles.csv conf=medium

---
## Raw redacted bundle sample (what the model actually received — Q1)

Bundle hash `e6ed4fd6c0338121`. First chunks of the governed evidence bundle passed to Claude (eligible `agent_ready` only, SkyHarbor-scoped):

```
[chunk_id:ctx:skyharbor-air:it_landscape:sla-register-csv-sla-0014:c0 | service_level | src:sla-register.csv] Storage service (SLA-0014)
sla_id: SLA-0014
service_name: Storage service
metric: P1 resolution
target: 4h
measurement_window: per-incident
actual: 3.4h
breach_count: 6
credit_at_risk_usd: 984312
tower: Storage
owner_role: VP IT Service Management
[chunk_id:ctx:skyharbor-air:it_landscape:sla-register-csv-sla-0025:c0 | service_level | src:sla-register.csv] Application Mgmt service (SLA-0025)
sla_id: SLA-0025
service_name: Application Mgmt service
metric: Availability
target: 99.9%
measurement_window: monthly
actual: 91.90%
breach_count: 0
credit_at_risk_usd: 516049
tower: Application Mgmt
owner_role: VP IT Service Management
[chunk_id:ctx:skyharbor-air:it_landscape:sla-register-csv-sla-0026:c0 | service_level | src:sla-register.csv] Application Mgmt service (SLA-0026)
sla_id: SLA-0026
service_name: Application Mgmt service
metric: P1 resolution
target: 4h
measurement_window: per-incident
actual: 4.1h
breach_count: 0
credit_at_risk_usd: 114396
tower: Application Mgmt
owner_role: VP IT Service Management
[chunk_id:ctx:skyharbor-air:it_landscape:sla-register-csv-sla-0027:c0 | service_level | src:sla-register.csv] Application Mgmt service (SLA-0027)
sla_id: SLA-0027
service_name: Application Mgmt service
metric: P2 resolution
target: 8h
measurement_window: per-incident
actua
```

## Honest notes
- Claim-map JSON parsed cleanly for some questions (Q2/Q7/Q8); for others Claude returned the answer with nested quotes that broke strict JSON parse, so the claim array is partial — the **answer content and the governed citation objects (from the gate) are present for all**. Hardening the structured-output parse is a follow-up.
- "warn" grounding on most questions is correct: a single broad retrieval query does not surface all 11 AMS families at once; the trace names exactly which families are missing rather than hiding it.
- Model was called only with `model_call_allowed=true`; no question hit `block` because v2 evidence is agent_ready and retrievable.