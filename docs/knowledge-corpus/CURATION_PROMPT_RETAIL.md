# Curation Prompt · Retail

**Hand this to Claude Code (or research-augmented agent) to populate the retail substrate of the corpus.**

---

## You are doing v0 hand-curation for the retail industry slice of the AbarVa knowledge corpus.

**Required reading before starting:**
1. `docs/knowledge-corpus/KNOWLEDGE_CORPUS_SCHEMA.md`
2. `docs/knowledge-corpus/PROVENANCE_AND_VERSIONING.md`
3. `docs/knowledge-corpus/CROSS_REFERENCE_GRAPH.md`

**Your output:** Populated JSON files in:
- `docs/knowledge-corpus/use-cases/UC-RTL-*.json`
- `docs/knowledge-corpus/patterns/P-RTL-*.json` and `P-CROSS-*.json` for cross-industry retail-relevant patterns
- `docs/knowledge-corpus/vendors/V-RTL-*.json` and `V-CROSS-*.json`
- `docs/knowledge-corpus/sis/SI-RTL-*.json` and `SI-CROSS-*.json`
- `docs/knowledge-corpus/regulatory/REG-*.json` (regulatory entries that touch retail use cases)

**Total scope:**
- ~22 retail use cases
- ~25 patterns (mix of retail-specific and cross-industry)
- ~30-40 vendors (mix of retail-specific and cross-industry)
- ~10-15 SIs
- ~10 regulatory entries

---

## Use case inventory · retail

Populate one Use Case entity per item below. Each gets full schema treatment per KNOWLEDGE_CORPUS_SCHEMA.md.

### Front Office (8 use cases)

1. **UC-RTL-FRONT-001 · Store Associate Copilot**
   AI copilots embedded in associate-facing tools. M365 Copilot, Salesforce Einstein, custom retail copilots.

2. **UC-RTL-FRONT-002 · Conversational Commerce / Shopping Assistant**
   AI shopping assistants on e-commerce surfaces. Sierra, Decagon, Ada, custom.

3. **UC-RTL-FRONT-003 · Personalization Engine Modernization**
   LLM-augmented product recommendations, content personalization. Bloomreach, Algolia, Constructor, custom.

4. **UC-RTL-FRONT-004 · CX Service Deflection (autonomous chat agents)**
   Autonomous AI for customer service tickets. Sierra, Ada, Cresta, Forethought.

5. **UC-RTL-FRONT-005 · Voice AI for Service Centers**
   Voice-based AI in call centers. PolyAI, Cognigy, Replicant, custom.

6. **UC-RTL-FRONT-006 · Visual Search**
   Image-driven product discovery. Algolia visual, Vue.ai, Syte, custom.

7. **UC-RTL-FRONT-007 · AI-Powered Loyalty**
   Personalized loyalty programs with AI-driven offers. Built typically on personalization stacks.

8. **UC-RTL-FRONT-008 · In-Store Associate AI**
   Handheld AI assistants for floor staff (different from store associate copilot — focused on in-store fulfillment, BOPIS, ship-from-store).

### Middle Office (7 use cases)

9. **UC-RTL-MIDDLE-001 · Demand Forecasting Modernization**
   Legacy ARIMA → ML/transformer hybrid. Vendors: o9, Blue Yonder, RELEX, custom.

10. **UC-RTL-MIDDLE-002 · Dynamic Pricing AI**
    Price optimization via ML. Dynamic Yield, Wise Athena, custom.

11. **UC-RTL-MIDDLE-003 · Markdown Optimization**
    End-of-life and seasonal markdown decisions. Symphony RetailAI, Daisy Intelligence, RELEX.

12. **UC-RTL-MIDDLE-004 · Assortment Intelligence**
    Localized assortment decisions. Symphony, Daisy, custom.

13. **UC-RTL-MIDDLE-005 · Fraud Detection Refresh**
    Modernized fraud detection with ML. Riskified, Signifyd, Forter.

14. **UC-RTL-MIDDLE-006 · Customer Churn Prediction**
    Predictive churn for loyalty programs and CRM. Custom on data warehouses + ML platforms.

15. **UC-RTL-MIDDLE-007 · Marketing Mix Modeling AI**
    AI-driven attribution and MMM. Custom + analytics vendors.

### Back Office (7 use cases)

16. **UC-RTL-BACK-001 · Supply Chain Visibility AI**
    End-to-end supply chain visibility with AI signals. o9, Blue Yonder, ToolsGroup, project44.

17. **UC-RTL-BACK-002 · Inventory Optimization**
    Multi-echelon inventory optimization. RELEX, Logility, Manhattan, ToolsGroup.

18. **UC-RTL-BACK-003 · SAP Joule for Merchandising / Finance**
    SAP's Joule agents for retail back-office. SAP-specific.

19. **UC-RTL-BACK-004 · Workday Agents for HR**
    Workday's AI agents for recruiting, onboarding, employee experience.

20. **UC-RTL-BACK-005 · GitHub Copilot / Cursor for Engineering Velocity**
    AI coding assistants in retailer engineering teams.

21. **UC-RTL-BACK-006 · ServiceNow Now Assist for IT Operations**
    ServiceNow's AI for IT helpdesk and operations.

22. **UC-RTL-BACK-007 · Process Automation Expansion / Agentic Process Redesign**
    RPA expansion + agentic workflow tools. UiPath, Automation Anywhere, Microsoft.

---

## Pattern inventory · retail

Populate ~25 pattern entities. Mix of:
- Retail-specific patterns (P-RTL-*)
- Cross-industry patterns relevant to retail (P-CROSS-*)

Suggested pattern themes (refine and expand based on research):

**Sponsorship / governance patterns:**
- "Personalization without consent infrastructure fails"
- "Voice AI without recorded-call QA produces escalation cliffs"
- "Loyalty AI requires marketing + IT co-sponsorship, not IT-led"

**Adoption patterns:**
- "Store associate copilot adoption pattern: peaks week 2, valley week 4-6"
- "Pilot site selection: median-store conditions, not flagship"
- "Manager reinforcement is the binding adoption pattern"

**Vendor selection patterns:**
- "Bundled vendor solutions vs best-of-breed: tradeoffs by retailer size"
- "Salesforce Commerce Cloud + Einstein vs custom: fit by maturity"
- "Demand forecasting model choice should follow category, not enterprise standard"

**Failure mode patterns:**
- "ML beats ARIMA on volatile categories; ARIMA wins on stable; one-size-fits-all loses both"
- "Fraud detection refresh: adversarial evolution requires continuous model retrain (not annual)"
- "Markdown optimization without store-level ground truth produces theoretical wins, not realized ones"

**Cross-industry patterns:**
- "Vendor pricing model lock-in (per-seat vs outcome-based)"
- "AI rollout sponsorship: business + IT co-sponsorship dominates IT-only"
- "Change management investment ratio: 30% of total budget minimum"

Ground each pattern in evidence (multiple use case observations, analyst data, customer signal where available).

---

## Vendor inventory · retail

Populate vendor entities for ~30-40 vendors across all use cases. Some are cross-industry (Microsoft, Salesforce, ServiceNow, Workday, SAP, GitHub, OpenAI, Anthropic) — use V-CROSS-* IDs.

**Specific retail vendors** (V-RTL-*) include:
- Sierra (autonomous customer service)
- Decagon (CX agents)
- Ada (CX agents)
- Cresta (sales/service AI)
- Forethought (CX)
- Bloomreach (commerce)
- Algolia (search + visual search)
- Constructor (commerce search)
- Vue.ai (retail AI)
- Syte (visual search)
- Dynamic Yield (personalization, pricing — Mastercard-owned)
- Wise Athena (pricing)
- Symphony RetailAI (assortment)
- Daisy Intelligence (assortment, markdown)
- o9 Solutions (planning)
- Blue Yonder (planning, supply chain)
- RELEX (planning, inventory)
- Logility (inventory)
- ToolsGroup (planning)
- project44 (visibility)
- Riskified (fraud)
- Signifyd (fraud)
- Forter (fraud)
- PolyAI (voice)
- Cognigy (voice/chat)
- Replicant (voice)

**Cross-industry vendors** (V-CROSS-*) include:
- Microsoft (M365 Copilot, GitHub Copilot, Dynamics, Fabric)
- Salesforce (Einstein, Commerce Cloud, Service Cloud, Data Cloud)
- SAP (Joule, S/4HANA, customer experience)
- Workday (AI agents, HR, finance)
- ServiceNow (Now Assist)
- Oracle (Fusion AI)
- UiPath (RPA + agents)
- Automation Anywhere
- OpenAI / Anthropic (foundation models — relevant when retailers build custom)

For each vendor, populate per schema with provenance.

---

## SI inventory · retail

Populate ~10-15 SI entities. Mix of cross-industry SIs (SI-CROSS-*) and retail-specific (SI-RTL-*).

**Cross-industry SIs:**
- Accenture (SI-CROSS-001)
- Deloitte (SI-CROSS-002)
- PwC (SI-CROSS-003)
- EY (SI-CROSS-004)
- KPMG (SI-CROSS-005)
- IBM Consulting (SI-CROSS-006)
- Capgemini (SI-CROSS-007)
- Infosys (SI-CROSS-008)
- Wipro (SI-CROSS-009)
- TCS (SI-CROSS-010)
- Cognizant (SI-CROSS-011)
- Slalom (SI-CROSS-012) — strong in retail digital
- Publicis Sapient (SI-CROSS-013)

**Retail-specific SIs:**
- Bain & Company (retail strategy practice)
- McKinsey (retail tech transformation)
- BCG Platinion
- Smaller specialist retail tech consultancies

For each SI, populate retail practice strength, vendor alliances, use case coverage.

---

## Regulatory inventory · retail

Populate ~10 regulatory entities relevant to retail AI:

1. **REG-US-001 · CCPA / CPRA (California Consumer Privacy)**
2. **REG-US-002 · Other state privacy laws (VA, CO, CT, UT, etc.)**
3. **REG-US-003 · FTC AI Guidance for Retail / Marketing**
4. **REG-US-004 · Section 5 FTC Act (deceptive practices) applied to AI**
5. **REG-EU-001 · GDPR (for global retailers with EU operations)**
6. **REG-EU-002 · EU AI Act (for EU operations)**
7. **REG-EU-003 · Digital Services Act / Digital Markets Act**
8. **REG-US-005 · Employment AI rules (NYC AEDT law, Illinois AI Video Interview Act, etc.)**
9. **REG-CA-001 · Canadian privacy + AI regulations (PIPEDA + AIDA)**
10. **REG-XX-001 · Cross-jurisdictional AI labeling (proposed federal rules)**

For each, populate per schema. Cross-reference to retail use cases that are affected.

---

## Curation rules

1. **Use real names.** "Microsoft," not "Major productivity vendor." Real specificity earns credibility.

2. **Provenance on every claim.** Every value range, every failure mode, every vendor health signal traces to a source. No common-knowledge entries.

3. **Reliability ratings.** HIGH for analyst firms (Gartner, Forrester, KLAS, IDC) on their core areas; HIGH for public earnings; MED for trade press; MED-LOW for vendor case studies (note vendor-curated).

4. **Cross-references bidirectional.** When Use Case X references Pattern Y, Pattern Y must reference Use Case X back. Validation enforces.

5. **Currency dates per claim.** `last_refreshed` on the entity; per-field currency on volatile data (vendor health, pricing patterns, regulatory).

6. **No fabrication.** If a use case lacks credible business value data, mark as `confidence: LOW` and capture what's known. Don't invent ranges.

7. **Three Tests per entity.** Source identifiable, currency tracked, reliability rated. Reject entries that don't pass.

8. **Cross-industry recognition.** Patterns and vendors that span industries get CROSS- IDs and apply across all relevant industries. Don't duplicate as retail-only AND healthcare-only.

---

## Output format

Each entity is a JSON file matching the schema. Example skeleton for a use case:

```json
{
  "id": "UC-RTL-FRONT-001",
  "name": "Store Associate Copilot",
  "industry": "retail",
  "office": "front",
  "domain_tags": ["store_operations", "associate_productivity"],
  "problem_statement": "...",
  "target_business_outcomes": [...],
  "business_value_ranges": {...},
  "success_patterns": [{"pattern_id": "P-RTL-005", "relevance": "HIGH"}],
  "failure_modes": [...],
  "vendor_landscape": {...},
  "si_landscape": {...},
  "regulatory_context": {...},
  "benchmark_metrics": {...},
  "art_of_possible_framing": "...",
  "provenance": {
    "primary_sources": [
      {"source": "Gartner MQ Retail AI 2026", "currency_date": "2026-Q1", "reliability": "HIGH"},
      ...
    ],
    "curation_pass": "v0-bootstrap-2026-05-08"
  },
  "version_history": [{"version": 1, "changed_at": "2026-05-08", "summary": "Initial entry"}],
  "last_refreshed": "2026-05-08",
  "refresh_cadence": "quarterly"
}
```

Use exactly this structure. Validate against schema before commit.

---

## Stop conditions

Halt and request human input when:

1. **Source unavailable** for a critical claim (e.g., vendor financial health, no public data accessible)
2. **Vendor status ambiguous** (alive · acquired · defunct unclear from public sources)
3. **Schema gap discovered** — a field is needed that schema doesn't carry
4. **Cross-reference cycle** — references break bidirectional consistency
5. **Conflicting sources** of similar reliability — capture both with disagreement note, surface to reviewer
6. **More than 4 hours of agent run time** elapsed without significant progress — pause for direction

For all stop conditions: capture state, write to `docs/build/corpus-curation-retail-{date}/stop-conditions.md`, halt.

---

## Output reporting

After each entity committed, log to `docs/build/corpus-curation-retail-{date}/commit-log.md`:
- Entity ID, name, type
- Sources used
- Cross-references created
- Time elapsed

After full retail population complete, output summary report at `docs/build/corpus-curation-retail-{date}/COMPLETION_REPORT.md`:
- Total entities created (by type)
- Total cross-references
- Provenance source distribution
- Stop conditions encountered
- Recommended next refresh dates

---

## What this prompt does NOT do

- Does not populate healthcare (separate prompt)
- Does not wire agents to corpus (separate prompt: AGENT_INTEGRATION_PROMPT.md)
- Does not modify schema (schema is locked; if gap, halt and request)
- Does not make competitive judgments ("Vendor A is better than Vendor B")
- Does not include AbarVa-internal data (corpus is industry knowledge, not platform IP)

---

## Begin

Read schema (v1.0 + v1.1 in `SCHEMA_EXTENSIONS_V1_1.md`), provenance discipline, cross-reference graph rules. Order of population: use cases → vendors + SIs → patterns → proof points → personas → cascades → anti-patterns → regulatory.

Take it slow. Provenance discipline is more important than speed. Better to have 15 fully-curated v1.1-complete use cases than 22 sparse ones.

---

## v1.1 ADDITIONS · retail

After v1.0 entities are populated, this prompt extends to the v1.1 entity types. Required reading: `SCHEMA_EXTENSIONS_V1_1.md`.

### v1.1 use case fields · update each Use Case entry

Add to every UC-RTL-* Use Case:
- `lifecycle_stage` · `emerging | scaling | mature | declining`
- `position_history` · per-quarter stage history (last 6 quarters minimum)
- `applicable_personas` · 2–4 PER-* references with relevance HIGH/MED/LOW
- `proof_points` · references to PP-RTL-* entries (populate after Proof Point entities exist)
- `anti_patterns` · references to AP-RTL-* / AP-CROSS-* entries
- `cascades_position` · which cascades this use case is part of, and at what position

### v1.1 vendor field · update each Vendor entry

Add `share_trajectory` (`gaining | holding | losing | retreating`) + `trajectory_signal_basis` (12-month signal) + `trajectory_history` (per-quarter history).

### v1.1 pattern field · update each Pattern entry

Add `quantified_signal` with `with_pattern` and `without_pattern` numbers (range, typical_value, n) and source. Patterns where range claims aren't quantifiable should be flagged for human review.

### Retail Proof Point inventory · ~25 named deployments

Populate one PP-RTL-* per item (per `SCHEMA_EXTENSIONS_V1_1.md` Entity 6). Examples to research:

- Walmart × Microsoft (M365 Copilot) · 2024 enterprise rollout
- Walmart × custom AI · associate productivity (multiple disclosures)
- Lowe's × OpenAI · 2024 advisor copilot
- Home Depot × Sidekick (Walmart-similar associate AI)
- Target × Sierra · customer service deflection
- Best Buy × Salesforce / custom AI · 2023+
- Macy's × custom personalization
- Sephora × Salesforce Einstein (advisor copilot for beauty advisors)
- Nordstrom × custom + Salesforce
- Albertsons × Symphony RetailAI (markdown/assortment)
- Kroger × custom + Microsoft (Sunrise Technology)
- Whole Foods × Amazon (Just Walk Out / Whole Foods Market Online)
- IKEA × custom (search + visual)
- H&M × Algolia
- Ulta Beauty × Salesforce (Service Cloud + custom)
- Carrefour × custom AI
- Tesco × Trigo (computer vision in store)
- Costco × custom (limited public disclosures — may not qualify for HIGH)
- Mastercard × Dynamic Yield · personalization at retail
- Levi's × custom + Bloomreach
- Wayfair × custom (early ML adopter; large engineering team)
- Etsy × custom (search relevance, recommendations)
- Shopify × custom Sidekick (merchant-facing AI)
- The RealReal × custom (visual + authentication AI)
- Stitch Fix × custom (recommendation + styling AI — pioneer)

For each: customer · use case ID · vendor ID · scope · measured outcomes with date · HIGH-reliability sources.

### Retail Persona inventory · ~8 personas

Per `SCHEMA_EXTENSIONS_V1_1.md` Entity 7. Standard retail personas:

- PER-CIO-003 · Chief Information Officer · Retail
- PER-CDO-003 · Chief Digital Officer · Retail
- PER-CMO-003 · Chief Marketing Officer · Retail
- PER-CMERCH-001 · Chief Merchandising Officer · Retail
- PER-CSO-001 · Chief Stores Officer / Head of Stores
- PER-CSCO-001 · Chief Supply Chain Officer · Retail
- PER-CCO-003 · Chief Customer Officer · Retail
- PER-CHRO-001 · Chief Human Resources Officer · Retail (relevant for store associate AI + workforce)

For each: primary_concerns · typical_kpi_focus · 3+ typical_objections (each with evidenced_response and proof_point references).

### Retail Move Cascade inventory · ~6 cascades

Per `SCHEMA_EXTENSIONS_V1_1.md` Entity 8. Suggested cascades:

1. **MC-RTL-001 · Personalization → Loyalty AI → Lifecycle marketing AI** (cascade observed in omnichannel retailers with mature personalization stack)
2. **MC-RTL-002 · Demand forecasting → Inventory optimization → Markdown optimization** (planning-stack maturity cascade)
3. **MC-RTL-003 · Store associate copilot → BOPIS/ship-from-store AI → Unified retail ops** (store-side AI maturity cascade)
4. **MC-RTL-004 · CX deflection (chat) → Voice AI → Autonomous service agent** (customer-service AI maturity cascade)
5. **MC-RTL-005 · Engineering velocity (Copilot) → Custom AI products → Differentiated commerce AI** (build-side cascade)
6. **MC-RTL-006 · Process automation expansion → Agentic workflow → AI-driven ops redesign** (back-office cascade)

For each: cascade_steps with success_threshold + enables_step_n_plus_1_via mechanism · failure_modes_at_handoff · cascade_evidence (observation_count + completion_rate).

### Retail Anti-Pattern inventory · ~10 anti-patterns

Per `SCHEMA_EXTENSIONS_V1_1.md` Entity 9. Promote from inline failure_modes that recur across multiple use cases:

1. AP-RTL-001 · Pilot at flagship store (selection bias) — applies across UC-RTL-FRONT-001, FRONT-008, BACK-005
2. AP-RTL-002 · Personalization without consent infrastructure — applies across UC-RTL-FRONT-003, FRONT-007, MIDDLE-007
3. AP-RTL-003 · ML-replacing-ARIMA without category segmentation — applies across UC-RTL-MIDDLE-001, MIDDLE-003
4. AP-RTL-004 · Voice AI without recorded-call QA — UC-RTL-FRONT-004, FRONT-005
5. AP-RTL-005 · Adoption gap (manager reinforcement absent) — UC-RTL-FRONT-001, FRONT-008
6. AP-RTL-006 · Loyalty AI without marketing co-sponsorship — UC-RTL-FRONT-007, FRONT-003
7. AP-RTL-007 · Fraud model staleness (no continuous retrain) — UC-RTL-MIDDLE-005
8. AP-RTL-008 · Markdown optimization without store ground truth — UC-RTL-MIDDLE-003
9. AP-RTL-009 · Visual search without catalog quality investment — UC-RTL-FRONT-006
10. AP-CROSS-003 · Vendor lock-in via foundation-model embeddings (cross-industry) — applies in retail to UC-RTL-FRONT-003, BACK-005

For each: quantified_signal · early_signals[] · typical_recovery · prevention_patterns reference.

### Output reporting · v1.1

Update `COMPLETION_REPORT.md` to include v1.1 entity counts (proof points, personas, cascades, anti-patterns) and cross-reference counts (PP↔UC, AP↔UC, MC↔UC, PER↔UC).
