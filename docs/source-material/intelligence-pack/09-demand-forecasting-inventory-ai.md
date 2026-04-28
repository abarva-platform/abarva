# Part 3.2b · Demand Forecasting & Inventory AI (Retail)

## 3.2b · Demand Forecasting & Inventory AI

### YAML front-matter

```yaml
pattern_id: pattern_demand_forecasting_inventory_ai
slug: demand-forecasting-inventory-ai
name: Demand Forecasting & Inventory AI
version: 1.0.0
status: active
category: Retail Planning & Supply Chain
cross_industry: false
sector_applicability: [retail]
primary_sector: retail
short_description: >
  The integrated program to modernize retail demand forecasting and inventory
  management with AI — probabilistic forecasting, hierarchical reconciliation,
  causal factor modeling, promotional lift, new product forecasting, assortment
  allocation, replenishment automation, and fresh / perishable optimization —
  addressing the failure mode of legacy planning stacks that produce point
  forecasts by moving averages, miss causal drivers, overreact to noise, and
  rely on safety stock inflation as the compensating mechanism.
long_description: >
  Demand forecasting sits upstream of almost every retail operating decision:
  buying, replenishment, store allocation, warehouse sizing, labor planning,
  promotional planning, assortment depth, markdown cadence, vendor negotiation.
  The quality of that forecast determines whether the retailer runs with tight
  working capital and high in-stocks, or bloated working capital and chronic
  stockouts — often both, in different categories, in the same week. Legacy
  planning stacks (Blue Yonder / JDA, SAP APO, Oracle Retail, Manhattan, home-
  grown systems) were architected around moving averages, category-level
  forecasts, and manual planner override cultures. They struggle with causal
  factor decomposition, promotional lift attribution, new product forecasting,
  substitution and halo modeling, and SKU × store × day / week granularity.
  The modern stack — RELEX, o9, Symphony / SymphonyAI, Blue Yonder's AI-native
  rearchitecture, ToolsGroup, Antuit, Invent Analytics, Impact Analytics,
  combined with custom ML — addresses these through probabilistic forecasts,
  hierarchical reconciliation, causal feature libraries, and closed-loop
  learning. The pattern captures the integrated modernization program across
  technology, data, planner operating model, and the organizational changes
  required to convert forecast accuracy gains into working capital, in-stock,
  and margin outcomes.
confidence_floor: 0.70
n_observations_floor: 6
related_patterns:
  - { id: pattern_owned_brand_margin_recovery, relationship: associative }
  - { id: pattern_analytics_modernization, relationship: parent }
  - { id: pattern_ai_use_case_portfolio, relationship: associative }
  - { id: pattern_vendor_sprawl_ai_tool_rationalization, relationship: associative }
regulatory_frameworks:
  - id: framework_fda_fsma
    applicability: us_food
  - id: framework_usda_country_of_origin
    applicability: us_food
  - id: framework_sec_climate_disclosure
    applicability: waste_and_scope3
  - id: framework_ftc_deceptive_advertising
    applicability: availability_promises
authored_by: anand + claude
last_curated_by: anand
```

### Part A · Pattern Identity

**ID:** `pattern_demand_forecasting_inventory_ai`
**Name:** Demand Forecasting & Inventory AI
**Short description:** Modernization program for retail demand forecasting and inventory with probabilistic forecasting, hierarchical reconciliation, causal factor modeling, promotional lift, new product forecasting, assortment allocation, fresh/perishable optimization, and closed-loop planner workflow.

**Long description:** The forecast is the most leveraged number in the retail enterprise. A one-point accuracy gain at the SKU × store × week grain cascades into working capital, in-stock, markdown, and waste outcomes that compound across thousands of SKUs and hundreds to thousands of stores. Legacy planning stacks built on moving averages, category-level aggregations, and planner override cultures structurally underperform on the dimensions that matter most in modern retail: promotional responsiveness, new product introduction, fresh and perishable optimization, weather and event sensitivity, omnichannel substitution, and cross-SKU halo and cannibalization effects. The pattern captures the integrated modernization program: technology (platform selection or custom stack), data (causal feature libraries, clean historicals, hierarchy governance), model development (probabilistic, hierarchical, causal), planner operating model (override governance, exception management, learning loops), and the organizational changes required for the forecast to actually drive decisions downstream in replenishment, allocation, labor planning, and vendor commitments.

### Part B · Classification

**Category:** Retail Planning & Supply Chain
**Cross-industry:** No — retail-native (adaptable to CPG, distributor/wholesaler, QSR supply chains)
**Primary sector:** Retail (grocery, mass, specialty, club, convenience, drug, restaurant retail)
**Sector applicability:** Retail only
**Variant of:** None (foundational retail pattern paired with Analytics Modernization)

### Part C · Detection — Signals

Pattern activates when ≥3 signals present with sufficient severity:

1. **Forecast accuracy plateau.** SKU-level weighted MAPE stuck at 40%+ despite multiple technology refreshes. Category-level accuracy masks SKU-store grain failures.

2. **Safety stock inflation as compensating mechanism.** Inventory days of supply trending up, not down, over multi-year horizon. Working capital tied up in inventory growing faster than sales.

3. **Chronic in-stock vs. overstock coexistence.** In-stock percentage stuck below 96% despite inventory levels that should support 98%+. Signals structural mismatch between forecast distribution and stocking logic.

4. **Promotional plan disconnect from forecast.** Promotion calendar built in merchandising, forecast adjusted manually by planners, no systematic promotional lift modeling. Post-promotion accuracy far worse than base accuracy.

5. **New product forecasting by analogy without rigor.** New SKU forecasts produced by picking a "similar" existing SKU and applying a subjective adjustment. No feature-based similarity, no attribute-level forecasting, no early-signal learning.

6. **Planner override rate elevated with no learning loop.** 40%+ of forecasts manually overridden by planners; overrides not tracked, not evaluated for accuracy, not fed back to model improvement.

7. **Fresh / perishable category underperformance.** Waste as a percent of sales in fresh categories (produce, meat, deli, bakery) 2-3x best-in-class benchmarks. Shrink attributed to "fresh nature" rather than forecast inadequacy.

8. **Event and weather insensitivity.** Forecasts fail systematically around weather events, holidays, local events (sports, school schedules, paydays). Post-event explanations rather than predictive integration.

### Part D · Detection — Diagnostic Questions

1. What is your SKU × store × week forecast accuracy (weighted MAPE or bias) for the top 80% of SKUs? For fresh categories specifically?

2. How is promotional lift modeled? Baseline forecast + multiplicative lift factor per promotion type, or causal features per promotion, or planner manual adjustment?

3. How do you forecast new products? Analogy by planner selection, attribute-based similarity, hierarchical feature models, test-and-learn early signal extraction?

4. What is your planner override rate? Is override accuracy tracked vs. model prediction? Does the override become a feature for model learning?

5. How is fresh / perishable waste measured and attributed? Forecast error, ordering logic, shelf-life assumptions, or "cost of doing business"?

6. How do you handle substitution when a SKU is out-of-stock? Customer walks, substitutes within brand family, substitutes across categories, delays purchase? Is substitution modeled in forecasts?

7. How is cannibalization and halo handled across SKUs? (New SKU launches, promotional events, owned-brand vs. national brand dynamics, pack size proliferation.)

8. How is the forecast consumed downstream? Replenishment, allocation, labor planning, vendor commitments, DC sizing, capital planning. Is the forecast a single source of truth, or are multiple forecasts used for different downstream purposes?

### Part E · Causal Structure

**Root causes:**

- **Legacy technology architecture** built around moving averages, category aggregations, point forecasts, and batch cycles. Cannot produce probabilistic, hierarchical, or causal forecasts without re-architecting.
- **Data fragmentation and quality.** Causal features (weather, events, price, promotion, inventory position, competitive activity, macro) scattered across systems or unavailable. Historical data contaminated by out-of-stock periods, promotional periods, pricing changes without flagging.
- **Planner operating model evolved for override, not governance.** Planners developed workarounds for forecast inadequacy; override cultures entrenched. Override governance absent.
- **Organizational forecast fragmentation.** Merchandising, supply chain, finance, and marketing each maintain separate forecasts for different purposes. No single source of truth.
- **Under-investment in promotional lift modeling.** Promotions planned in one system, forecast adjusted in another, lift measurement a post-hoc exercise rather than a systematic learning loop.
- **New product forecasting under-resourced.** Treated as a one-off planner task rather than a systematic capability. No investment in attribute-based forecasting or early-signal learning.

**Immediate causes:**

- Buying decisions made on category-level forecasts that mask SKU-level failures.
- Safety stock inflated to compensate for forecast inaccuracy, consuming working capital and increasing waste.
- Promotion ROI measured inconsistently because base forecast (the denominator) is unreliable.
- Planner time consumed by firefighting overrides rather than exception management and learning.

**Effects:**

- Working capital tied up in inventory that doesn't turn.
- Chronic stockouts in categories that should have supported higher in-stock.
- Margin compression from reactive markdowns on overstocked SKUs.
- Fresh category waste far above best-in-class.
- Vendor negotiations constrained by demand uncertainty.
- Labor scheduling disconnected from actual demand drivers.

### Part F · Interventions

Eight interventions form the full program:

1. **Platform decision: modernize-in-place vs. replace.** Evaluate whether the incumbent planning platform (Blue Yonder, SAP, Oracle, Manhattan) supports the capability requirements or whether replacement with a modern alternative (RELEX, o9, SymphonyAI, or custom) is warranted. Base the decision on capability gap, migration cost, and data architecture alignment — not vendor relationship inertia. Success rate 60% when capability gap is assessed rigorously.

2. **Causal feature library investment.** Build a curated library of causal features: weather (multiple horizons and aggregations), local events, holidays, school calendars, paydays, competitive activity, pricing changes, promotional periods, inventory position, out-of-stock flags, media exposure. Treat this as a first-class data product with SLAs. Success rate 75% on forecast improvement from feature expansion alone.

3. **Probabilistic and hierarchical forecasting.** Move from point forecasts to probabilistic distributions (median, confidence intervals, full distribution where needed). Reconcile forecasts across hierarchy (SKU → category → department → total; store → market → chain). Success rate 70% on working capital improvement from distribution-aware stocking.

4. **Promotional lift modeling as systematic capability.** Build causal promotional lift models that decompose promotional response into base lift, cannibalization, halo, cross-period effects, and interaction with other promotions. Tie to promotional planning workflow. Success rate 60% on promotional ROI accuracy.

5. **New product forecasting discipline.** Deploy attribute-based similarity models, hierarchical attribute feature models, and early-signal learning (first 4-8 weeks of actuals update the forecast aggressively). Remove "planner analogy selection" as the primary method. Success rate 55% on new product forecast accuracy.

6. **Planner operating model redesign.** Reframe planner role from "override the forecast" to "govern the forecast — investigate exceptions, contribute market intelligence as features, validate outlier predictions." Establish override governance: threshold-based approval, override tracking, override accuracy measurement, feedback loop to model team. Success rate 50% (most difficult intervention because cultural).

7. **Fresh / perishable optimization.** Apply shelf-life-aware ordering, day-of-week demand profiling, weather sensitivity, and waste-aware optimization to fresh categories specifically. Fresh requires different model architectures and faster cycle times than center-store. Success rate 65% on waste reduction.

8. **Forecast consumption governance.** Establish a single source of truth for the demand forecast, with downstream consumers (replenishment, allocation, labor, finance, vendor planning) drawing from the same forecast with documented transformations. Eliminates forecast fragmentation. Success rate 70% on cross-functional alignment.

### Part G · Anti-Patterns

1. **"Buy the vendor, get the capability" assumption.** Replacing the planning platform without addressing data, feature library, promotional lift modeling, and planner operating model produces a new platform with the same outcomes.

2. **Category-level accuracy reporting.** Measuring forecast accuracy at category level hides SKU-store grain failures where the operational pain actually lives.

3. **Planner override without governance.** Planners override forecasts freely with no tracking, no accuracy measurement, and no feedback. Override becomes the forecast.

4. **Safety stock as compensation.** Inflating safety stock to compensate for forecast error rather than improving the forecast. Treats working capital as free.

5. **Promotional planning disconnected from forecast.** Promotions planned on calendar by merchandising without quantitative base/lift forecasts. Creates systematic post-promotion error.

6. **New product forecasting as afterthought.** Treating new SKU forecasting as a planner task rather than a systematic capability. Under-resources a high-variance, high-impact function.

7. **Fresh treated as "just different."** Attributing fresh underperformance to the nature of perishables rather than investing in fresh-specific model architectures and cycle times.

8. **Forecast fragmentation.** Merchandising, supply chain, finance, and marketing maintain separate forecasts. Reconciliation is a quarterly finance exercise rather than operational discipline.

### Part H · Vendor Landscape

**Modern AI-native retail planning platforms:**
- **RELEX Solutions.** Strong in grocery and fresh. Graph-based optimization. Good causal feature integration. Newer entrant in US mass / specialty.
- **o9 Solutions.** Broader enterprise planning (demand, supply, S&OP, revenue). Strong in CPG / manufacturing; growing in retail.
- **SymphonyAI / Symphony RetailAI.** AI-native retail focus. Demand forecasting, pricing, assortment modules integrated.
- **Blue Yonder.** Market incumbent. Undergoing AI-native rearchitecture (Luminate). Migration from JDA / i2 legacy represents its own transformation.
- **Antuit.ai.** Acquired by Zebra. Demand forecasting and assortment focus.
- **ToolsGroup.** Probabilistic demand forecasting specialist. Strong in inventory optimization.
- **Impact Analytics.** Broad retail AI suite (demand, pricing, markdown, assortment, allocation).
- **Invent Analytics.** Demand forecasting, assortment, pricing, inventory — retail-focused.

**Broad planning suites:**
- **SAP IBP.** Enterprise S&OP and integrated business planning. Strong for CPG / manufacturing / retail with SAP backbone.
- **Oracle Retail Planning.** Traditional retail planning suite. AI integration evolving.
- **Manhattan Active Supply Chain.** Supply chain execution with planning extensions.
- **Kinaxis.** Concurrent planning; stronger in CPG / manufacturing than retail.
- **Aera Technology.** "Cognitive automation" positioning; S&OP and inventory focus.

**Point solutions / specialist:**
- **7bridges.** Logistics and supply chain network optimization.
- **Pricer / AI pricing specialists** cross-link with demand forecasting for elasticity.
- **Fourkites, project44.** Freight visibility feeds into demand sensing and inbound planning.

**Custom / hyperscaler:**
- **Amazon Forecast (deprecated in favor of SageMaker Canvas).**
- **Google Vertex AI Forecast, SageMaker Canvas, Azure ML Forecast.**
- **Databricks + custom ML stacks.**

Platform decisions should be made against capability-gap analysis for the specific sub-sector (grocery vs. mass vs. specialty vs. club vs. convenience) and the company's data architecture. Many mid-size retailers build custom stacks on Databricks / Snowflake + ML frameworks once the underlying data is in order — and outperform platform migrations when the data and operating model are addressed.

### Part I · Regulatory Considerations

Demand forecasting and inventory AI are not directly regulated the way credit or medical AI is, but the pattern intersects several regulatory regimes:

- **FDA Food Safety Modernization Act (FSMA) Rule 204.** Traceability requirements for high-risk foods drive inventory management data architecture. Retailers must capture lot-level tracking for certain categories. Demand forecasting and replenishment systems must integrate with lot traceability.

- **USDA country-of-origin labeling (COOL) and labeling compliance.** Assortment and vendor decisions driven partly by demand forecast must preserve labeling compliance.

- **SEC climate disclosure / scope-3 and waste disclosure in some jurisdictions.** Food waste and inventory write-offs are increasingly material disclosure items. Forecast quality materially affects waste metrics.

- **California SB 1383 and similar state-level organic waste mandates.** Drive fresh waste reduction imperatives into forecasting program.

- **FTC availability / advertising compliance.** Promoting a product without sufficient inventory to meet reasonable demand can create FTC exposure. Tight coupling between promotional planning, forecast, and allocation is required.

- **NIST AI RMF.** Applicable to the AI governance layer — model risk management for forecasting models, especially where material financial decisions (vendor commitments, working capital, store-level allocation) depend on them.

- **Vendor AI disclosure obligations.** Several platform vendors expose AI model details at varying levels; AbarVa tracks this in the vendor taxonomy.

### Part J · Observations from Composite Programs

1. **Apex Retail multi-channel demand forecasting modernization.** Composite mass retailer (650 stores + ecommerce, $18B revenue). Legacy stack: Blue Yonder JDA at store level + custom ML at DC level + Excel-heavy promotional planning. Forecast accuracy SKU-store-week MAPE: 47% pre-program. Phase 1: data foundation (causal feature library, historical cleansing, hierarchy governance) — 9 months. Phase 2: modernization decision (retain BY-based core, augment with custom probabilistic layer in Databricks; replace promotional planning in SymphonyAI) — 6 months. Phase 3: planner operating model — 12 months. Outcomes: SKU-store-week MAPE to 34%. In-stock to 97.4%. Inventory DOS down 11%. Working capital release $340M. Composite organization built from real-world data.

2. **Grocery chain fresh category transformation.** Composite regional grocer (180 stores, $4.2B, Northeast US). Fresh waste at 8.2% of fresh sales vs. 3.5% best-in-class benchmark. Program: shelf-life-aware ordering, day-of-week demand profiling, weather integration (particularly for produce and meat), reduce-to-sell markdown optimization tied to forecast. RELEX deployment in fresh; center-store retained on BY. Fresh waste to 4.8% over 24 months. Composite organization.

3. **Specialty retailer seasonal forecasting.** Composite specialty retailer (400 stores, apparel adjacent, $1.8B). Seasonal product forecasting dominated by planner analogy selection — inaccurate, slow, inconsistent. Attribute-based forecasting with early-signal learning deployed (first 3-weeks actuals aggressively update remaining season). New product MAPE from 58% to 39%. Markdown reduction $42M / season. Composite.

4. **Convenience store foodservice demand.** Composite convenience chain (2,100 stores, $6B fuel-and-shop). Foodservice (prepared food, coffee, breakfast) was the fastest-growing category but under-forecast. Day-part × store × SKU forecasting deployed. Waste down 22%; in-stock on breakfast day-part to 95%; foodservice revenue growth accelerated 3 points. Composite.

5. **Omnichannel retailer fulfillment network planning.** Composite retailer (multichannel: stores, ecommerce pick-from-store, DC fulfillment, drop-ship). Demand forecast grain extended to SKU × fulfillment-node × day. Network optimization (which node fulfills which demand) became co-optimized with inventory placement. Inventory effectiveness (right SKU at right node) improved 18%. Last-mile cost down 9%. Composite.

6. **Club warehouse assortment-constrained forecasting.** Composite club retailer (club-format, limited SKU count). Assortment decisions intertwined with forecast: every SKU has to earn its space; forecast drives rotation decisions. Integrated assortment + forecast system deployed. Assortment rotation velocity up 40%; member visit frequency up 2 points. Composite.

7. **Pharmacy / drug retailer prescription-adjacent forecasting.** Composite drug chain. Front-of-store demand partially driven by prescription traffic; forecast integrated prescription volume as causal feature. Front-of-store in-stock on prescription-driven SKUs improved meaningfully. Composite.

8. **Dollar / hard discount chain new store ramp forecasting.** Composite discount chain (aggressive new store opening pace). New store demand forecasting using attribute-based similarity to like-store cluster; ramp-curve learning in first 12 weeks. New store first-year forecast accuracy +8 points. Composite.

### Part K · Success Measures

**Forecast quality:**
- SKU × store × week weighted MAPE (absolute and trend)
- Forecast bias (directional — over- vs. under-forecasting)
- Hierarchy reconciliation error (SKU vs. category vs. department)
- New product MAPE at weeks 4, 8, 12
- Promotional accuracy (actual vs. forecasted lift)
- Fresh category forecast MAPE specifically

**Operational outcomes:**
- In-stock % (chain, category, store-level distribution)
- Inventory days of supply (DOS) and turns
- Working capital invested in inventory
- Fresh waste as % of fresh sales (by sub-category)
- Markdown as % of sales (planned vs. unplanned)
- Labor schedule adherence to demand

**Financial outcomes:**
- Working capital release (one-time)
- Ongoing margin improvement from reduced markdown, waste, and stockouts
- Promotional ROI clarity (attribution on accurate base forecast)
- Vendor negotiation leverage from demand certainty

**Operating model:**
- Planner override rate (trending down)
- Override accuracy (when planners override, are they right more than the model?)
- Planner time on exception management vs. firefighting
- Cross-functional forecast alignment (single source of truth adoption)

### Part L · Timeline

**Months 0-6:** Data foundation + causal feature library. Hierarchy governance. Historical cleansing. Platform decision (modernize-in-place vs. replace).
**Months 6-12:** Core forecasting capability deployment. Probabilistic + hierarchical. Initial accuracy gains on base forecast.
**Months 12-18:** Promotional lift modeling. New product forecasting. Fresh optimization. Planner operating model redesign.
**Months 18-24:** Full planner operating model adoption. Override governance in steady state. Forecast-driven downstream process alignment (replenishment, allocation, labor).
**Months 24-36:** Continuous improvement loop. Advanced capabilities: cross-SKU substitution / halo, omnichannel optimization, vendor collaboration.

Total horizon: 24-36 months for full program. First-year working capital and in-stock gains drive business case; years two-three compound.

### Part M · Governance Mechanism

**Forecast Governance Council:** Weekly. Members: VP Supply Chain (chair), VP Merchandising, VP Finance, Head of Data Science, Head of Planning, Head of Store Ops. Reviews: weekly forecast accuracy, override dashboard, exception queue, promotional performance (actual vs. forecast), fresh waste metrics. Authority: approve model changes above defined impact thresholds, adjudicate merchandising-supply chain forecast disputes, prioritize feature library investments.

**Model Change Advisory Board.** Biweekly. Reviews proposed model changes: feature additions, retraining cycles, architectural changes. Prevents silent model drift and ensures lineage is preserved through change.

**Planner Operating Model Review.** Monthly. Reviews override dashboard (rate, accuracy, patterns), planner learning feedback, exception queue health, planner productivity. Adjusts thresholds and workflows.

**Integration with AI Governance.** Forecasting models are enterprise-material AI systems — flow through the enterprise AI governance pattern (pattern 2.3). Demand forecasting changes at the architectural level go through AI Council.

### Part N · Sector Variants

- **Grocery (center store vs. fresh).** Fresh gets its own model architecture, faster cycle time, waste-aware optimization. Center store is closer to mass retail patterns.
- **Mass merchandise.** Category breadth creates hierarchy governance challenges. Seasonal categories (patio, lawn & garden, back-to-school) require event-calendar integration.
- **Specialty retail.** Assortment-forecast coupling is tight. New product forecasting weight is high.
- **Club.** Limited SKU count intensifies per-SKU forecasting stakes. Assortment rotation velocity is a primary KPI.
- **Convenience.** Day-part grain is required. Foodservice and fuel interaction. Small store footprint constrains inventory elasticity.
- **Drug / pharmacy.** Prescription-adjacent forecasting. OTC and front-of-store.
- **Online pure-play / omnichannel.** Fulfillment-node grain. Network optimization co-designed with forecast.
- **Hard discount / dollar.** Aggressive new store pace creates new-store forecasting weight.
- **QSR / restaurant retail.** Day-part × store × menu item. Supply perishability extreme. Labor scheduling tightly coupled.

### Part O · Graph Schema Contribution

```cypher
// Pattern + topics
MERGE (p:Pattern {id: 'pattern_demand_forecasting_inventory_ai'})
ON CREATE SET
  p.name = 'Demand Forecasting & Inventory AI',
  p.category = 'Retail Planning & Supply Chain',
  p.cross_industry = false,
  p.primary_sector = 'retail',
  p.confidence_floor = 0.70,
  p.n_observations_floor = 6,
  p.version = '1.0.0';

MERGE (t_fcst:Topic {id: 'topic_probabilistic_hierarchical_forecasting'})
ON CREATE SET t_fcst.name = 'Probabilistic & Hierarchical Forecasting';
MERGE (t_causal:Topic {id: 'topic_causal_feature_library'})
ON CREATE SET t_causal.name = 'Causal Feature Library';
MERGE (t_promo:Topic {id: 'topic_promotional_lift_modeling'})
ON CREATE SET t_promo.name = 'Promotional Lift Modeling';
MERGE (t_npf:Topic {id: 'topic_new_product_forecasting'})
ON CREATE SET t_npf.name = 'New Product Forecasting';
MERGE (t_fresh:Topic {id: 'topic_fresh_perishable_optimization'})
ON CREATE SET t_fresh.name = 'Fresh & Perishable Optimization';
MERGE (t_planner:Topic {id: 'topic_planner_operating_model'})
ON CREATE SET t_planner.name = 'Planner Operating Model';
MERGE (t_consumption:Topic {id: 'topic_forecast_consumption_governance'})
ON CREATE SET t_consumption.name = 'Forecast Consumption Governance';

MERGE (p)-[:COVERS_TOPIC]->(t_fcst);
MERGE (p)-[:COVERS_TOPIC]->(t_causal);
MERGE (p)-[:COVERS_TOPIC]->(t_promo);
MERGE (p)-[:COVERS_TOPIC]->(t_npf);
MERGE (p)-[:COVERS_TOPIC]->(t_fresh);
MERGE (p)-[:COVERS_TOPIC]->(t_planner);
MERGE (p)-[:COVERS_TOPIC]->(t_consumption);

// Related patterns
MERGE (p_obmr:Pattern {id: 'pattern_owned_brand_margin_recovery'});
MERGE (p)-[:RELATED_TO {relationship_type: 'associative'}]->(p_obmr);

MERGE (p_am:Pattern {id: 'pattern_analytics_modernization'});
MERGE (p)-[:CHILD_OF]->(p_am);

MERGE (p_port:Pattern {id: 'pattern_ai_use_case_portfolio'});
MERGE (p)-[:RELATED_TO {relationship_type: 'associative'}]->(p_port);

// Sector
MERGE (s_ret:Sector {id: 'sector_retail', name: 'Retail'});
MERGE (p)-[:APPLIES_TO]->(s_ret);

// Vendors
MERGE (v_relex:Vendor {id: 'vendor_relex'})
ON CREATE SET v_relex.name = 'RELEX Solutions', v_relex.category = 'Retail Planning & Replenishment';
MERGE (v_relex)-[:APPEARS_IN]->(p);

MERGE (v_o9:Vendor {id: 'vendor_o9_solutions'})
ON CREATE SET v_o9.name = 'o9 Solutions', v_o9.category = 'Integrated Business Planning';
MERGE (v_o9)-[:APPEARS_IN]->(p);

MERGE (v_symph:Vendor {id: 'vendor_symphony_ai'})
ON CREATE SET v_symph.name = 'SymphonyAI', v_symph.category = 'AI-native Retail Planning';
MERGE (v_symph)-[:APPEARS_IN]->(p);

MERGE (v_by:Vendor {id: 'vendor_blue_yonder'})
ON CREATE SET v_by.name = 'Blue Yonder', v_by.category = 'Retail Planning';
MERGE (v_by)-[:APPEARS_IN]->(p);

MERGE (v_tg:Vendor {id: 'vendor_toolsgroup'})
ON CREATE SET v_tg.name = 'ToolsGroup', v_tg.category = 'Probabilistic Demand Forecasting';
MERGE (v_tg)-[:APPEARS_IN]->(p);

MERGE (v_impact:Vendor {id: 'vendor_impact_analytics'})
ON CREATE SET v_impact.name = 'Impact Analytics', v_impact.category = 'Retail AI Suite';
MERGE (v_impact)-[:APPEARS_IN]->(p);

MERGE (v_invent:Vendor {id: 'vendor_invent_analytics'})
ON CREATE SET v_invent.name = 'Invent Analytics', v_invent.category = 'Retail Demand & Assortment';
MERGE (v_invent)-[:APPEARS_IN]->(p);

MERGE (v_sap:Vendor {id: 'vendor_sap_ibp'})
ON CREATE SET v_sap.name = 'SAP IBP', v_sap.category = 'Integrated Business Planning';
MERGE (v_sap)-[:APPEARS_IN]->(p);

MERGE (v_oracle:Vendor {id: 'vendor_oracle_retail'})
ON CREATE SET v_oracle.name = 'Oracle Retail', v_oracle.category = 'Retail Planning Suite';
MERGE (v_oracle)-[:APPEARS_IN]->(p);

// Regulatory frameworks
MERGE (f_fsma:RegulatoryFramework {id: 'framework_fda_fsma'})
ON CREATE SET f_fsma.name = 'FDA Food Safety Modernization Act';
MERGE (f_fsma)-[:APPLIES_TO]->(p);

MERGE (f_cool:RegulatoryFramework {id: 'framework_usda_country_of_origin'})
ON CREATE SET f_cool.name = 'USDA Country of Origin Labeling';
MERGE (f_cool)-[:APPLIES_TO]->(p);

MERGE (f_sec:RegulatoryFramework {id: 'framework_sec_climate_disclosure'})
ON CREATE SET f_sec.name = 'SEC Climate Disclosure Rules';
MERGE (f_sec)-[:APPLIES_TO]->(p);
```

### Part P · Retrieval Contribution

~64 chunks. Namespace `global:patterns:retail`. Sub-variants across grocery / fresh / mass / specialty / club / convenience / drug / online / hard-discount / QSR. Chunks carry `sub_sector` and `capability_area` metadata (forecasting | promotional | new-product | fresh | planner-operating-model | consumption-governance).

### Part Q · Prompting Contract

**Detection fragment:**

```
PATTERN: pattern_demand_forecasting_inventory_ai (RETAIL)
Summary: Retail demand forecasting and inventory modernization program — probabilistic + hierarchical forecasting, causal feature library, promotional lift modeling, new product forecasting, fresh optimization, planner operating model redesign, forecast consumption governance.
Activates when:
- SKU-store-week MAPE plateau (40%+)
- Safety stock inflation trend
- In-stock and overstock coexistence
- Promotional plan disconnect from forecast
- New product forecasting by analogy without rigor
- Planner override rate 40%+ without tracking
- Fresh waste 2-3x best-in-class
- Event / weather insensitivity in forecast
Diagnostic questions focus on SKU-store-week accuracy, promotional lift modeling, new product method, planner override rate/accuracy/feedback, fresh waste attribution, substitution modeling, cannibalization, forecast consumption.
If active, output pattern_id, confidence, signals_triggered, rationale.
```

**Injection fragment:** Interventions emphasizing causal feature library (foundational), platform decision rigor, probabilistic + hierarchical forecasting, promotional lift modeling, new product forecasting discipline, planner operating model redesign, fresh optimization, forecast consumption governance. Observations: composite mass retailer multi-channel program (Apex Retail reference); grocery fresh transformation; specialty seasonal; convenience foodservice; omnichannel network; club assortment; drug prescription-adjacent; hard discount new store ramp. Anti-patterns: buy-the-vendor assumption, category-level accuracy reporting, override without governance, safety stock as compensation, promotional disconnect, new product afterthought, fresh as "just different," forecast fragmentation.

**Diagnostic fragment:** Sequenced probing: current SKU-store-week accuracy + fresh specifically; promotional lift method; new product method; planner override rate + accuracy + feedback; fresh waste attribution; substitution and cannibalization modeling; downstream consumption integration; existing platform capability gap.

### Part R · Rendering Contract

`/intelligence/patterns/demand-forecasting-inventory-ai`. Light hero + dark working zone.

Hero copy: **"The forecast is the most leveraged number in the retail enterprise."**

Unique rendering element: SKU × store × week forecast accuracy explorer — shows SKU-grain accuracy distribution, causal feature contribution breakdown, promotional lift decomposition, new product ramp learning, and fresh waste attribution. Tenant-connected version pulls live from the Apex Retail composite tenant.

Right sidebar (tenant): current SKU-store-week MAPE with trend, in-stock % with trend, DOS with trend, fresh waste %, override rate with accuracy, promotional lift accuracy, new product MAPE at weeks 4/8/12.

Cross-links to owned brand margin recovery pattern, analytics modernization parent pattern, and AI use case portfolio.

Composite tenant callout: Apex Retail multi-channel forecasting modernization shown as primary reference program. Always labeled "composite organization built from real-world data."

---

*End of Part 3.2b · Demand Forecasting & Inventory AI*

*Next in file sequence: `10-fraud-detection-modernization.md` — Part 3.3a Financial Services*

---
