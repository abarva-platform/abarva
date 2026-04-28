# Part 6 · Delivery Order

This part defines the ordering in which the intelligence layer ships — what must be production-ready before the Prat demo, what ships in the weeks that follow to support the seed fundraise, what ships in the seed-funded buildout toward Series A, and the dependency graph that governs sequence.

The intelligence layer is a significant body of work. Delivering it all before the Prat demo is neither possible nor required — what must be true before the demo is different from what must be true before Series A. The decomposition below is calibrated to the specific milestones AbarVa faces.

## 6.1 · Philosophy

Three delivery principles govern:

1. **Ship evidence of depth before completeness.** A few fully-operational patterns with live tenant data, intelligent detection, and working graph traversal beat a shallow coverage of all 13 patterns. Demo credibility comes from depth where the audience probes.

2. **Anchor to Morrison as the demo reference program.** All demo-critical paths converge on Morrison Owned Brand Margin Recovery inside the Apex Retail composite tenant. That program exercises four patterns end-to-end: `pattern_owned_brand_margin_recovery`, `pattern_demand_forecasting_inventory_ai`, `pattern_analytics_modernization`, and `pattern_ai_use_case_portfolio`. Demo gravity sits here.

3. **Preserve authoring velocity post-demo.** The pattern authoring pipeline, ingestion pipeline, and prompt library must be operational (not just designed) so that post-demo content expansion doesn't require engineering intervention.

## 6.2 · Demo-Critical Path (Prat demo readiness)

**Target:** Prat demo (Target Fortune 40 CIPO). Window: post-April 22 execution sprint.

### 6.2.1 · Scope

Must be production-ready, live in `nexus-vert-kappa.vercel.app`, operating against the Apex Retail composite tenant, exercised through the Morrison program.

**Patterns in demo scope (4):**
- `pattern_owned_brand_margin_recovery` — the hero pattern; Morrison is the reference program
- `pattern_demand_forecasting_inventory_ai` — composite tenant program second reference; linked to Owned Brand
- `pattern_analytics_modernization` — universal pattern sitting underneath Morrison
- `pattern_ai_use_case_portfolio` — universal pattern; shapes Morrison's portfolio view

**Surfaces live:**
- `/intelligence/patterns/owned-brand-margin-recovery` — fully rendered, with tenant-bound right sidebar and interactive Owned Brand margin recovery calculator
- `/intelligence/patterns/demand-forecasting-inventory-ai` — rendered with Apex Retail tenant binding
- `/intelligence/patterns/analytics-modernization` — rendered with program cross-linkage
- `/intelligence/patterns/ai-use-case-portfolio` — rendered with Apex Retail portfolio binding
- `/intelligence` — index landing page showing the four active patterns + pattern-adoption overview

**Runtime capabilities live:**
- Detection working on Morrison program intake through Nexus
- Injection working — Nexus uses Owned Brand pattern's operational knowledge when shaping Morrison
- Diagnostic conversation flow for at least one pattern
- Analogous-programs graph traversal returning composite observations
- Tenant-bound right-sidebar metrics on all four pattern pages (pulling from Apex Retail program data)

**Infrastructure live:**
- Postgres schema (all `intel_*` tables) created and populated for the four patterns
- Pinecone namespaces seeded: `global:patterns`, `global:patterns:retail`, `client:tnt_apex_retail:observations`
- Apache AGE graph initialized with the four patterns' nodes + relationships
- Ingestion pipeline functional for the four patterns (markdown → Postgres → Pinecone → graph)
- Basic quality monitoring: detection runs captured in `intel_detection_runs`, retrieval calls in `intel_retrieval_calls`
- RLS policies on tenant-scoped tables

### 6.2.2 · Explicitly NOT in demo scope

- The other 9 patterns — present as "coming soon" page stubs with short descriptions, no full content
- Sentinel-driven pattern scans across all tenants
- Atlas portfolio roll-ups across tenants (Atlas exists at basic surface only)
- Prompt version champion-challenger infrastructure (single active version per library in demo)
- Full eval harness (manual spot-check in demo sprint)
- Neo4j migration (AGE-only in demo)
- External auth / tenant onboarding self-service (Anand-managed tenant provisioning)

### 6.2.3 · Sequencing inside the demo sprint

**Week 1:**
- Postgres migrations 0001-0008 applied
- Ingestion pipeline v1 operational for `pattern_owned_brand_margin_recovery`
- Pinecone + AGE seeded from that one pattern end-to-end
- Sentinel page for Owned Brand rendering statically from Postgres

**Week 2:**
- Add remaining three in-scope patterns through ingestion pipeline
- Tenant-bound right-sidebar metrics wired to Apex Retail program data
- Interactive Owned Brand margin recovery calculator deployed
- `/intelligence` index landing page live
- Detection + injection operational for Nexus on Morrison intake

**Week 3:**
- Analogous-programs graph traversal operational
- Cross-pattern linkage surfaced in Sentinel UI
- First pass quality monitoring dashboards
- End-to-end demo rehearsal against Morrison flow
- Polish pass on copy and animations

**Buffer / pre-demo:**
- Demo dry-run with internal audience
- Prat-profile personalization (already seeded via VIP Profile System)
- Incident-response rehearsal for on-the-fly issues

### 6.2.4 · Risk mitigations for demo

- **AGE performance risk:** if AGE traversal latency fails to meet < 500ms on the analogous-programs query, a static pre-computed fallback is cached for demo paths. Live graph traversal is the target; fallback is insurance.
- **Embedding cost spike:** all demo embedding is pre-run; no runtime embedding during demo execution.
- **Pinecone latency:** warmed namespaces; top retrieval queries cached.
- **Model availability:** primary model + fallback model configured.
- **Internet flakiness at venue:** offline-capable demo fallback videos and screenshots on hand.

## 6.3 · Post-Demo (Weeks following Prat demo, pre-seed-close)

Objective: convert demo interest into investor conviction and Prat design-partnership momentum. Focus on completing the content library, operationalizing quality discipline, and demonstrating platform coherence beyond a single demo path.

### 6.3.1 · Post-demo content expansion

Author and ingest the remaining 9 patterns in this order (lowest-risk, highest-pitch-leverage first):

1. `pattern_ai_governance_operating_model` — universal; appears in every Fortune-class conversation; low sector-risk, high credibility
2. `pattern_vendor_sprawl_ai_tool_rationalization` — universal; highly resonant with CIO audience
3. `pattern_ai_led_pdlc` (umbrella + 4 children as one unit) — universal; defensibility story for AbarVa's positioning
4. `pattern_fraud_detection_modernization` — financial services vertical; for First Capital tenant demos and finserv investors
5. `pattern_customer_onboarding_kyc_ai` — financial services vertical; pairs with fraud for full finserv story
6. `pattern_ambient_clinical_value_chain` — healthcare vertical; for Meridian tenant demos and healthcare investors
7. `pattern_prior_authorization_automation` — healthcare vertical; pairs with ambient for full healthcare story
8. `pattern_predictive_maintenance_modernization` — energy vertical; for Keystone tenant demos
9. `pattern_commodity_trading_ai` — energy vertical; pairs with predictive maintenance

Each pattern gets:
- Full markdown pack per the template (Parts A-R)
- Ingested through the pipeline
- Sentinel page live
- At least 2 composite observations populated
- Graph node + relationships active
- Detection prompt + injection prompt + diagnostic prompt authored and evaluated

### 6.3.2 · Platform maturation

- Prompt version champion-challenger infrastructure live
- Eval harness fully operational with per-pattern fixtures
- Reconciliation job scheduled weekly
- Full RLS canary suite running daily
- Observability dashboards covering all metrics from Part 5.4
- Content authoring runbook published and walkable by a junior content contributor

### 6.3.3 · Prat design-partnership enablement

- Provision a private tenant for Prat's organization
- Seed with patterns relevant to Target's retail operation (Owned Brand, Demand Forecasting, Analytics Modernization, Portfolio Management, AI Governance)
- Capture first live non-composite observations from Target program work
- Demonstrate to Prat how observations flow into the intelligence layer and improve future program shaping

### 6.3.4 · Investor-pitch support

Intelligence layer becomes a core pitch asset:
- "Harvey-for-enterprise-transformation" framing rests on the pattern library as the durable asset
- Anthology Fund pitch: intelligence layer as demonstrable "compounding asset" across the four compounding pillars (Transformation Genome, Adaptive Strategy Intelligence, Outcome Interpretability, Research Publication Program)
- Seed-round materials carry live pattern library screenshots and architecture diagrams

## 6.4 · Seed Build-Out (months post-seed-close through Series A milestone)

Objective: transition from content-seeded intelligence layer to an evidence-densified, cross-client intelligence platform. Scale content authoring velocity. Begin Atlas cross-tenant roll-ups. Deepen operational maturity. Prepare for Series A "cross-client intelligence" claims.

### 6.4.1 · Content density goals

- Grow observation count per pattern from ~6 (seed) to ≥ 25 by Series A milestone (including ≥ 8 non-composite from real tenant programs)
- Expand pattern library from 13 to ≥ 50 patterns, covering:
  - Additional sector verticals (life sciences, telecom, insurance expansion, public sector)
  - Sub-category depth inside existing verticals
  - Cross-sector patterns (M&A integration, ERP modernization, organizational design)
- Maestro (Nexus) operates with consistent confidence floors across the expanded library

### 6.4.2 · Cross-client intelligence

- Composite observation aggregation across tenants (with redaction) enables Sentinel to publish "across the portfolio" intelligence
- Atlas provides investor-visible portfolio roll-ups
- Research Publication Program begins: quarterly thematic intelligence publications drawn from composite observations
- Benchmark data product: tenants can compare their metrics against anonymized portfolio medians where composite density supports it

### 6.4.3 · Platform depth

- Neo4j migration completed if AGE thresholds exceeded
- Pinecone → alternative vector store evaluation (Turbopuffer, Qdrant, pgvector HNSW) on cost/perf
- Embedding model refresh cycle operational (model changes supported by re-embed pipeline)
- Multi-region replication for Pinecone if tenant concentration justifies
- SOC 2 Type II readiness on intelligence layer specifically

### 6.4.4 · Governance

- Content editorial board with rotation of external domain experts
- Deprecation / retirement flow exercised at least once (proves governance works end-to-end)
- Prompt version lineage auditable and tied to regulatory obligations where applicable (e.g., AI governance patterns with regulated-customer exposure)
- Evidence chain from observation → intervention → outcome queryable

## 6.5 · Series A and Beyond

Objective: the intelligence layer is a defining asset of the company, queryable by both AbarVa personnel and tenant personnel, with predictive flags, cross-client pattern detection, and measurable outcome attribution.

### 6.5.1 · Predictive intelligence

- Predictive flags: "This program looks like 18 analogous programs from the portfolio — 14 had this specific failure mode emerge in month 4. Risk-mitigation recommended."
- Proactive detection: intelligence layer surfaces patterns to tenants before tenants surface them to intelligence layer.
- Portfolio risk signals: cross-tenant movement in a vendor landscape, regulatory change, or model performance drift flagged to affected tenants.

### 6.5.2 · Outcome attribution

- Evidence → observation → intervention → outcome chain causal enough to support outcome-as-a-service pricing at scale
- Third-party measurement harness for outcome validation
- Insurance-grade evidence standard on outcome claims

### 6.5.3 · Ecosystem

- Partner-contributed patterns (systems integrators, sector specialists) with attribution and governance
- API access to the intelligence layer for tenant-embedded workflows
- Published research as industry reference

## 6.6 · Pattern Dependency Graph

Dependencies between patterns that shape authoring and publication order.

```
pattern_analytics_modernization
   │ (parent)
   ├──► pattern_demand_forecasting_inventory_ai
   ├──► pattern_fraud_detection_modernization
   ├──► pattern_customer_onboarding_kyc_ai
   ├──► pattern_ambient_clinical_value_chain
   ├──► pattern_prior_authorization_automation
   ├──► pattern_predictive_maintenance_modernization
   └──► pattern_commodity_trading_ai

pattern_ai_use_case_portfolio
   │ (shapes upstream)
   └──► feeds governance + vendor + modernization patterns

pattern_ai_led_pdlc (umbrella)
   ├──► pattern_ai_led_pdlc_specification_debt
   ├──► pattern_ai_led_pdlc_velocity_without_validation
   ├──► pattern_ai_led_pdlc_context_as_code_underinvestment
   └──► pattern_ai_led_pdlc_senior_bench_decay

pattern_owned_brand_margin_recovery ◄──associative── pattern_demand_forecasting_inventory_ai
pattern_fraud_detection_modernization ◄──associative── pattern_customer_onboarding_kyc_ai
pattern_ambient_clinical_value_chain ◄──associative── pattern_prior_authorization_automation
pattern_predictive_maintenance_modernization ◄──associative── pattern_commodity_trading_ai

pattern_ai_governance_operating_model
   │ (shapes)
   └──► any pattern involving regulated-impact AI (fraud, KYC, commodity trading, clinical, etc.)

pattern_vendor_sprawl_ai_tool_rationalization
   │ (companion)
   └──► every vertical pattern's vendor landscape

pattern_fraud_detection_modernization ◄──analogous── pattern_commodity_trading_ai
   (shared surveillance control discipline)
```

Sequencing implication: analytics modernization is the root dependency for all vertical patterns — must be authored and ingested before any vertical pattern that cites it as parent. The pattern pack for analytics modernization was the first universal pattern authored (Part 2.1 in the main design pack) for exactly this reason.

## 6.7 · Resource Requirements by Phase

| Phase | Duration | Content Authoring | Engineering | Product / Anand |
|---|---|---|---|---|
| Demo sprint | 3 weeks | High (4 patterns full depth) | High (pipeline, UI, infra) | High (review, demo rehearsal) |
| Post-demo | 8-12 weeks | High (9 patterns full depth) | Medium (platform maturation) | Medium (investor outreach, Prat) |
| Seed build-out | 9-15 months | Sustained high (50 patterns, 25 obs/pattern target) | High (Neo4j migration, cross-client, platform) | Medium (Series A prep) |
| Series A+ | Ongoing | Sustained | High (predictive, ecosystem) | Strategic |

Assumptions:
- Demo sprint: Anand + Claude + Codex agents working in parallel on content authoring; engineering sprint focused on pipeline + UI
- Post-demo: pattern authoring cadence of ~2 patterns/week sustainable with Claude + Codex assistance; engineering shift toward platform depth
- Seed phase: add content specialists (retail / healthcare / financial services / energy SMEs on retainer); engineering team of 4-6

## 6.8 · Anti-Goals and Risks

- **Do not** author all 13 pattern files before wiring ingestion. Risk: content drifts from pipeline capability.
- **Do not** let composite observations lag pattern authoring. A pattern without observations fails the `n_observations_floor` and cannot drive confident detection.
- **Do not** expose cross-tenant content without redaction discipline. A single isolation leak would be catastrophic for investor and design-partner trust.
- **Do not** make Atlas cross-tenant surfaces self-serve for tenants until the redaction and attribution model is bulletproof.
- **Do not** promise predictive intelligence until the evidence chain and outcome attribution are densified enough to back it.

## 6.9 · Definition-of-Done Checklist (per pattern)

Before a pattern is marked production-ready:

- [ ] Markdown pack complete with all Parts A-R
- [ ] YAML front-matter validates
- [ ] ≥ 8 signals, ≥ 8 diagnostic questions, ≥ 8 interventions, ≥ 8 anti-patterns
- [ ] ≥ `n_observations_floor` composite observations
- [ ] Vendor landscape covers incumbent + AI-native + specialist categories
- [ ] Regulatory frameworks listed and linked
- [ ] Part O Cypher seeds into graph idempotently
- [ ] Part P chunking emitted per schema
- [ ] Part Q prompt fragments authored for detection + injection + diagnostic
- [ ] Part R rendering contract describes page + tenant sidebar
- [ ] Eval fixtures populated with ≥ 5 detection cases
- [ ] Sentinel page renders cleanly
- [ ] Nexus detection active and confidence-calibrated
- [ ] Tenant sidebar data bindings live for at least one composite tenant
- [ ] Cross-links to related patterns functional
- [ ] Content reviewed by Anand

## 6.10 · Summary

- Demo-critical path: 4 patterns fully live, Apex Retail composite tenant, Morrison program exercising end-to-end. Everything else is deferred to post-demo.
- Post-demo: complete the 13-pattern library, operationalize quality discipline, enable Prat design partnership, equip seed-round narrative.
- Seed build-out: scale to 50 patterns, densify observations, enable cross-client intelligence, migrate to Neo4j if needed, prepare for Series A claims.
- Series A+: predictive intelligence, outcome attribution at insurance-grade, ecosystem.
- The pattern dependency graph constrains sequence; analytics modernization is the universal prerequisite.
- Definition-of-done checklist keeps content quality uniform across authors and phases.

---

*End of Part 6 · Delivery Order*

*End of Intelligence Layer Pattern Design Pack.*

---
