# Part 3.2a · Owned Brand Margin Recovery (Retail)

## 3.2a · Owned Brand Margin Recovery

### YAML front-matter

```yaml
pattern_id: pattern_owned_brand_margin_recovery
slug: owned-brand-margin-recovery
name: Owned Brand Margin Recovery
version: 1.0.0
status: active
category: Merchandising & Margin Management
cross_industry: false
sector_applicability: [retail]
primary_sector: retail
short_description: >
  The integrated program to recover owned-brand (private label, store brand,
  exclusive brand) margin performance through AI-augmented SKU rationalization,
  cost-of-goods analysis, sourcing optimization, assortment intelligence,
  pricing intelligence, and new-product-development acceleration. Pattern
  addresses the common failure mode of under-resourced owned-brand organizations
  treating owned-brand as a line-extension afterthought rather than a strategic
  margin and differentiation lever.
long_description: >
  Owned brands (private label, store brand, exclusive brand — terminology varies
  by retailer) represent the single largest untapped margin and differentiation
  lever in most mass and grocery retailers. National peer benchmarks show
  owned-brand penetration ranging from 18% (traditional grocers with thin
  investment) to 60%+ (Aldi, Trader Joe's, Costco — operators who built their
  brand on it). Owned-brand margins typically run 2-3x national brand margins
  on comparable SKUs. Owned-brand is also the primary mechanism for
  differentiation in an age when national brands are available everywhere.
  Despite this, many traditional retailers run owned-brand programs with
  small teams, limited analytics, under-optimized sourcing, thin assortment
  development, and inherited pricing logic that gives away much of the
  margin advantage. The pattern captures the integrated program required
  to recover owned-brand margin performance: SKU rationalization to focus
  scale and velocity; cost-of-goods analysis with AI-augmented sourcing
  intelligence; assortment intelligence informed by trend, price, and
  regional signal; pricing optimization that captures the margin headroom;
  new product development acceleration; and the operating model that
  elevates owned-brand from line-extension afterthought to strategic
  merchandising pillar.
confidence_floor: 0.70
n_observations_floor: 6
related_patterns:
  - { id: pattern_demand_forecasting_inventory_ai, relationship: associative }
  - { id: pattern_ai_use_case_portfolio, relationship: associative }
  - { id: pattern_analytics_modernization, relationship: associative }
regulatory_frameworks:
  - id: framework_ftc_made_in_usa
    applicability: us_operations
  - id: framework_ftc_deceptive_advertising
    applicability: always
  - id: framework_usda_labeling
    applicability: us_food
  - id: framework_fda_fsma
    applicability: us_food_safety
  - id: framework_nist_ai_rmf
    applicability: indirect
authored_by: anand + claude
last_curated_by: anand
```

### Part A · Pattern Identity

**ID:** `pattern_owned_brand_margin_recovery`
**Name:** Owned Brand Margin Recovery
**Short description:** Integrated AI-augmented program to recover owned-brand margin through SKU rationalization, sourcing optimization, assortment intelligence, pricing intelligence, NPD acceleration, and operating model elevation.

**Long description:** Owned brand is the highest-leverage margin recovery opportunity available to traditional mass and grocery retailers in 2026. The opportunity is structural: national brand margins compressed by private label competition, channel fragmentation, and consumer trading behavior; owned brand margins protected by vertical control over sourcing, manufacturing (or captive suppliers), packaging, and distribution. The gap between current owned-brand performance and best-in-class performance (Aldi, Trader Joe's, Costco model) represents the addressable opportunity. AI capability compounds the opportunity: demand forecasting at SKU × store × week granularity; cost-of-goods intelligence across supplier base; assortment intelligence from competitive and regional signal; pricing intelligence with elasticity modeling; NPD acceleration from trend identification through launch; performance measurement from shelf to member loyalty. The pattern captures the integrated program and the operating model evolution required to convert the structural opportunity into realized margin.

### Part B · Classification

**Category:** Merchandising & Margin Management
**Cross-industry:** No — retail-specific (adaptable to distributor/wholesaler contexts)
**Primary sector:** Retail (grocery, mass, specialty)
**Sector applicability:** Retail only
**Variant of:** None (foundational retail vertical pattern)
**Related patterns:**
- `pattern_demand_forecasting_inventory_ai` (associative; SKU-level demand forecasting is an ingredient of owned brand SKU rationalization and assortment)
- `pattern_ai_use_case_portfolio` (associative; owned brand margin recovery is usually a portfolio theme not a single use case)
- `pattern_analytics_modernization` (associative; SKU × store × week analytics demand drives modernization scope)

### Part C · Detection

#### C.1 · Trigger symptoms

- Owned brand penetration significantly below peer benchmark (e.g., <22% where peers average 28%+)
- Owned brand margin dollars growth flat or declining while national brand margin pressure increasing
- Owned brand SKU count high (broad assortment) but velocity distribution skewed (long tail of low-velocity SKUs)
- Owned brand program managed by small team (often 3-8 merchants) with limited analytics support
- Owned brand cost of goods analysis done manually; sourcing relationships static for multiple years
- Owned brand pricing typically set as fixed percentage below national brand (e.g., 20% below equivalent national brand) rather than elasticity-optimized
- NPD velocity slow; new owned-brand launches 2-4 per year; traditional concept-to-shelf cycle 18+ months
- Owned brand quality perception lagging (consumer research cites "cheap / second-tier" association)
- Owned brand data fragmented; no single SKU-level P&L view; category leaders cannot quickly answer "is this SKU earning its shelf space?"
- Executive attention on owned brand limited; CMO focus on marketing, CFO focus on overall margin, Chief Merchant focus on national brand negotiations

#### C.2 · Detection signals

**Signal 1 · Penetration gap.**
- Type: `kpi_deviation`
- Threshold: Owned brand penetration (% of sales or unit volume) trailing peer benchmark by 4+ points
- Evidence: internal sales reports, IRI/Circana benchmarks, retailer filings

**Signal 2 · Margin dollars flat.**
- Type: `kpi_deviation`
- Threshold: Owned brand margin dollars growth trailing total margin dollars growth for 4+ quarters
- Evidence: financial reports, category P&L

**Signal 3 · SKU velocity skew.**
- Type: `kpi_deviation`
- Threshold: Bottom 40% of owned brand SKUs generate less than 10% of owned brand margin dollars
- Evidence: SKU-level P&L analysis

**Signal 4 · Sourcing stasis.**
- Type: `evidence_pattern`
- Threshold: >60% of owned brand COGS tied to supplier relationships unchanged for 5+ years; no systematic COGS reassessment cadence
- Evidence: procurement records, sourcing strategy documentation

**Signal 5 · Pricing logic static.**
- Type: `evidence_pattern`
- Threshold: Owned brand pricing set as fixed % below national brand across categories; no category-level elasticity modeling; no regional/seasonal variation
- Evidence: pricing strategy documentation, pricing audit

**Signal 6 · NPD velocity low.**
- Type: `kpi_deviation`
- Threshold: New owned-brand SKU launches <5 per category per year; concept-to-shelf cycle >15 months
- Evidence: NPD pipeline records, launch calendar

**Signal 7 · Analytics underpowering.**
- Type: `evidence_pattern`
- Threshold: Owned brand team <5 analytics FTEs per $1B owned brand revenue; no dedicated owned brand data platform or dashboard
- Evidence: org chart, analytics capability audit

**Signal 8 · SKU-level P&L unavailable.**
- Type: `evidence_pattern`
- Threshold: Category leaders cannot produce SKU-level P&L (including allocation of shelf, marketing, supply chain) within same business day
- Evidence: analytics capability test, category leader interviews

#### C.3 · Diagnostic questions

1. What is your owned brand penetration today, what is the peer benchmark, and what is the strategic target?
2. For each major owned brand category, can you produce SKU-level P&L with allocated costs, and how recent is the data?
3. How is owned brand pricing set? Category-by-category? Elasticity-modeled? Regional/seasonal variation?
4. How is owned brand COGS optimized? Cadence of supplier reassessment? Cost-down negotiation program?
5. What is your NPD pipeline and velocity? Concept-to-shelf cycle time?
6. What is your SKU rationalization discipline? How often is the tail pruned?
7. How much analytics capacity supports the owned brand program, and what analytics capability exists today?
8. Who owns owned brand in the executive team, and what's the investment trajectory?

#### C.4 · Evidence requirements

- Owned brand P&L (category, SKU-level ideally)
- Penetration trend data (vs peer benchmarks)
- Pricing strategy documentation
- Sourcing documentation and supplier relationships
- NPD pipeline and launch records
- Analytics capability audit
- Org chart and decision rights

#### C.5 · Confidence rubric

- **0.9+:** Penetration gap, margin flat, SKU velocity skew, sourcing stasis, static pricing, low NPD velocity, analytics underpowered, no SKU P&L
- **0.75-0.9:** 4-5 signals present; some investment in progress
- **0.6-0.75:** Partial maturity; worth probing
- **Below 0.6:** Not surfaceable

### Part D · Causal Structure

**Root cause 1 · Owned brand treated as line extension rather than strategic lever.**
Traditional merchant culture: national brand negotiation is the merchant's "real work"; owned brand is the cheap alternative that exists for margin. Without strategic elevation, investment and talent flow to national brand, starving owned brand.

**Root cause 2 · Under-resourced analytics.**
Owned brand benefits disproportionately from SKU-level analytics (cost, velocity, margin, substitution, cannibalization). Under-resourcing means decisions made on intuition and past practice rather than data.

**Root cause 3 · Static sourcing relationships.**
Owned brand often sourced from a small set of captive or long-relationship suppliers. Without systematic reassessment, cost-of-goods drifts higher, innovation stalls, and supplier leverage increases.

**Root cause 4 · Pricing logic inherited from national brand parity.**
Owned brand priced as fixed % below national brand equivalent. Leaves margin on the table in categories where consumer willingness-to-pay exceeds the fixed-discount logic. In categories where consumer would pay closer to national brand for equivalent quality, retailer captures only the fixed discount.

**Root cause 5 · NPD velocity slow because pipeline disjointed.**
Trend identification, concept development, supplier selection, formulation, packaging, launch — each phase often owned by different functions with handoffs that add time. Without integrated operating model, NPD velocity stays slow.

**Root cause 6 · Quality perception anchor.**
Historic "store brand = cheaper but lower quality" positioning anchors consumer perception. Some retailers break it (Costco Kirkland, Trader Joe's, Whole Foods 365); most don't. Without deliberate quality positioning, owned brand remains discount-only in consumer mind.

**Causal chain:**

```
treated_as_line_extension
  + under_resourced_analytics
  + static_sourcing
  + pricing_logic_inherited
  + NPD_velocity_slow
  + quality_perception_anchor
  → penetration_gap
  → margin_dollars_flat
  → SKU_velocity_skew
  → owned_brand_margin_recovery_unrealized
```

### Part E · Interventions

**Intervention 1 · Executive elevation of owned brand.**
Owned brand ownership elevated to dedicated executive (Chief Own Brand Officer, EVP Own Brand, or Chief Merchant with explicit owned brand mandate). Strategic targets set (penetration, margin dollars, differentiation). Investment trajectory committed.
- *Success rate:* 0.74 (n=8 programs)
- *Effort:* Medium · 4-8 weeks to designate; ongoing
- *Conditions:* CEO sponsorship; recognition of owned brand as strategic lever; willingness to elevate talent and budget

**Intervention 2 · SKU rationalization program.**
Systematic SKU rationalization based on velocity × margin × strategic fit. Target: bottom 20-30% of SKUs by velocity evaluated for delist, consolidation, or reformulation. Freed-up shelf and complexity redirected to high-velocity SKU growth and new product launches. Repeated annually.
- *Success rate:* 0.78 (n=10 programs) — high success rate because fairly mechanical once data available
- *Effort:* Medium · 6-9 months initial; annual refresh
- *Conditions:* SKU-level P&L available; category leadership engagement; store operations partnership for delist execution

**Intervention 3 · Cost-of-goods intelligence.**
AI-augmented cost-of-goods analysis: commodity cost tracking, supplier benchmark intelligence, alternative-supplier identification, formulation cost optimization. Supplier reassessment cadence (e.g., 3-year cycle for each owned brand SKU). Strategic sourcing capability built or partnered.
- *Success rate:* 0.68 (n=9 programs)
- *Effort:* Large · 9-18 months for initial maturity
- *Conditions:* Sourcing organization engagement; analytics capacity; willingness to shift supplier relationships; contract discipline

**Intervention 4 · Assortment intelligence.**
AI-augmented assortment decisions: regional signal (what's trending in competitive regions), consumer signal (shopper behavior, loyalty data), competitive signal (peer owned-brand launches, national brand gaps), macro signal (commodity trends, dietary trends). Assortment decisions data-informed rather than category-team-intuitive.
- *Success rate:* 0.66 (n=7 programs)
- *Effort:* Medium-Large · 9-12 months
- *Conditions:* Analytics platform; competitive intelligence subscription; category team training

**Intervention 5 · Pricing intelligence and elasticity optimization.**
Owned brand pricing moved from fixed-discount logic to category-specific elasticity modeling. Pricing varies by category (where consumer willingness-to-pay differs), by region (where competitive intensity differs), and by season (where demand elasticity differs). Test-and-learn discipline.
- *Success rate:* 0.62 (n=6 programs)
- *Effort:* Medium-Large · 9-15 months
- *Conditions:* Pricing science capacity; POS data; testing discipline; pricing governance

**Intervention 6 · NPD acceleration program.**
Integrated NPD operating model across trend identification, concept development, sourcing, formulation, packaging, launch. Target concept-to-shelf cycle reduction (e.g., 18 months baseline to 8 months target). Launch cadence increase (e.g., 4 launches/category/year to 12+).
- *Success rate:* 0.60 (n=5 programs — newer territory)
- *Effort:* Large · 12-18 months
- *Conditions:* Cross-functional NPD team; innovation investment; supplier partnership; category leadership

**Intervention 7 · Quality positioning evolution.**
Deliberate strategy for quality positioning beyond discount. Tiered owned brand architecture (value / core / premium tiers); quality markers and certifications; marketing communication. Consumer research informs and validates. Best practice examples (Costco Kirkland, Target Good & Gather, Whole Foods 365) referenced.
- *Success rate:* 0.58 (n=5 programs)
- *Effort:* Large · 18-24 months
- *Conditions:* Marketing partnership; brand strategy capacity; investment in quality; consumer research

**Intervention 8 · Analytics platform and SKU P&L.**
Dedicated owned brand analytics platform with SKU × store × week P&L, trend intelligence, competitive monitoring, pricing elasticity view, sourcing cost view. Category leaders have self-service access. Data refresh cadence appropriate (daily for velocity, weekly for margin, monthly for strategic).
- *Success rate:* 0.70 (n=8 programs)
- *Effort:* Medium-Large · 9-15 months
- *Conditions:* Analytics modernization; data engineering capacity; platform selection; change management

### Part F · Anti-Patterns

- **Line-extension mindset.** Owned brand treated as cheap alternative to national brand; strategic investment under-prioritized. *Severity: high — most common root cause.*
- **SKU proliferation without rationalization.** New owned brand SKUs added without tail cleanup; complexity compounds. *Severity: high.*
- **Fixed-discount pricing.** Pricing logic inherited from earlier era; margin headroom unrealized. *Severity: high.*
- **Sourcing stasis.** Supplier relationships unchanged for years; COGS drift; innovation stalled. *Severity: high.*
- **NPD silo disjunction.** NPD pipeline fragmented across functions; velocity slow. *Severity: medium-high.*
- **Premium tier denial.** Retailer assumes owned brand must be value-only; Kirkland/Good&Gather evidence ignored. *Severity: medium.*
- **Analytics under-resourcing.** Owned brand team denied analytics capacity; decisions driven by intuition. *Severity: high.*
- **Quality perception inertia.** No deliberate brand positioning work; consumer perception remains discount-anchored. *Severity: medium-high.*

### Part G · Vendor Landscape

**Retail analytics and category management:**
- **Circana (formerly IRI + NPD)** — market measurement, share data, category insights
- **NielsenIQ (NIQ)** — market measurement, panel data, owned-brand benchmarks
- **Numerator** — shopper behavior data
- **Revionics (Aptos)** — pricing and promotion AI
- **Eversight** — pricing / promotion AI
- **Wiser Solutions** — pricing intelligence
- **Blue Yonder** — assortment, pricing, promotion, supply chain
- **Relex** — demand forecasting, replenishment, assortment
- **SymphonyAI** — retail AI platform
- **o9 Solutions** — integrated planning
- **Antuit.ai** (Zebra Technologies) — demand, pricing
- **Toolio, NextRetail** — merchandising platforms

**Own brand specialty:**
- **Daymon (acquired by Bain)** — owned brand consulting and NPD services
- **Mintel, SPINS** — trend intelligence
- **Label Insight (NielsenIQ)** — product attribute data
- **Syndigo** — master data for retail
- **Innova Market Insights** — food innovation intelligence

**Sourcing / procurement AI:**
- **Keelvar, Jaggaer, GEP, Coupa** — strategic sourcing platforms
- **Ivalua, SAP Ariba** — procurement
- **Scoutbee** — supplier discovery AI
- **Tradeshift, Mondu** — supply chain finance with supplier insights

**NPD / innovation:**
- **Traceone, GoProcure** — owned brand NPD workflow
- **Specright** — specification management

**AI / data platforms (underlying):**
- **Databricks Retail Industry Cloud, Snowflake Retail Data Cloud** — data platforms
- **Google Cloud Retail AI, AWS for Retail, Azure for Retail** — cloud AI for retail
- **dbt Labs, Atlan** — data engineering tooling

**AbarVa positioning:** Platform-agnostic; scored on program-level integration (cross-functional operating model, SKU P&L discipline, NPD velocity, quality positioning). Owned brand margin recovery is the highest-leverage retail pattern AbarVa surfaces because of the size of the margin opportunity and the degree of under-investment at most retailers.

### Part H · Regulatory Considerations

- **FTC "Made in USA" labeling rules** — origin claims on owned brand products
- **FTC deceptive advertising** — comparisons to national brand, quality claims, endorsements
- **USDA / FDA labeling** — food owned brand subject to specific labeling requirements
- **FSMA (Food Safety Modernization Act)** — supplier verification and traceability for food
- **State food safety laws** — California Prop 65, state-specific additive/labeling rules
- **CPSC (Consumer Product Safety Commission)** — non-food product safety
- **Environmental labeling (EPR, recyclability claims)** — state-specific and emerging
- **Animal testing laws** — state-specific (California, Illinois, others)
- **Kosher/Halal/Organic certifications** — third-party compliance where claimed
- **International trade** — tariffs, duties, country-of-origin affect sourcing strategy

### Part I · Observations

**Obs 1 · Mass grocer owned brand program transformation (primary reference — Morrison).**
Mid-sized US regional grocer (composite, "Morrison" in AbarVa demo) with owned brand penetration at 19%, trailing peer benchmark of 28%. Owned brand program managed by 6-person team with 2 analysts. Deployed integrated owned brand margin recovery program over 24 months: named EVP Own Brand; SKU rationalization reduced SKU count 22% while growing margin dollars; cost-of-goods intelligence program identified supplier reassessment for 40% of SKUs with average COGS reduction in 4-8% range; assortment intelligence drove targeted category launches; pricing optimization shifted from fixed-discount logic to category-elasticity model; NPD pipeline accelerated from 3 launches/category/year to 9+; analytics capacity grew from 2 to 14 FTEs with dedicated owned brand platform. Year 2 outcomes: owned brand penetration 23% (200bps gain), owned brand margin dollars up 34%, consumer quality perception improved 18 points on internal research. Full program realized 4-year margin impact estimated in $180-240M range.

**Obs 2 · Mass merchant owned brand premium tier launch.**
Large mass merchant (composite, national scale) launched premium owned brand tier as deliberate quality positioning play, following Target Good & Gather and Costco Kirkland blueprint. Tier anchored on sustainability attributes, curated ingredients, specialty SKUs. 3-year program: premium tier reached 8% of owned brand SKUs, 14% of owned brand margin dollars; halo effect on core tier measured in consumer research; owned brand penetration up 300bps.

**Obs 3 · Grocery co-op NPD velocity acceleration.**
Grocery retailer co-op (composite) with slow NPD pipeline (2 launches/category/year, 22-month concept-to-shelf) redesigned NPD operating model: integrated team, parallel workstreams, supplier partnership acceleration. Year 1 outcomes: concept-to-shelf cycle compressed to 11 months; launch velocity up to 8 launches/category/year; new launch hit rate improved (measure: SKUs meeting 12-month velocity target).

**Obs 4 · Specialty retailer SKU rationalization.**
Specialty retailer (composite) ran SKU rationalization after 5 years of SKU proliferation. Removed 1,400 low-velocity SKUs; redistributed shelf space to top SKUs and new launches. Margin dollars up 11% in quarter following implementation; consumer confusion about owned brand (too many SKUs) reduced in shopper research.

**Obs 5 · Retailer sourcing transformation.**
National grocer (composite) built strategic sourcing capability for owned brand: commodity tracking, supplier base expansion, alternative-supplier identification. Result: average owned brand COGS reduction 5-9% across categories touched; supplier innovation increased (new SKU proposals up); sourcing risk reduced via supplier base diversification.

**Obs 6 · Pricing elasticity optimization.**
Mid-sized grocer (composite) moved from fixed-discount pricing to category elasticity modeling on owned brand. Categories with low national-brand substitution intensity saw price moves closer to national brand parity (margin gain); categories with high substitution intensity saw more aggressive pricing (velocity gain). Portfolio-level margin and unit volume both improved.

### Part J · Success Measures

**Leading indicators (monthly):**
- Owned brand penetration (% of sales, % of units)
- SKU-level velocity and margin distribution
- NPD pipeline status (concepts in development, launches planned)
- Supplier reassessment cadence
- Pricing elasticity test results

**Lagging indicators (quarterly):**
- Owned brand margin dollars growth
- Category penetration by category
- New launch 12-month velocity hit rate
- Consumer quality perception (from research)
- SKU count trend (rationalization effect)
- Supplier concentration and diversification

**Maturity thresholds:**
- **Emerging:** owned brand under-resourced; no SKU rationalization; static pricing; slow NPD
- **Scaling:** executive elevation; SKU rationalization underway; analytics building; pricing pilots
- **Mature:** integrated operating model; NPD accelerated; elasticity pricing; quality positioning
- **Optimized:** best-in-class penetration; continuous rationalization; rapid NPD; differentiated quality tiers

### Part K · Timeline & Sequencing

**Months 0-6 · Foundation**
- Executive elevation; EVP Own Brand or equivalent
- SKU-level P&L capability built
- Penetration and margin baseline
- Strategic targets set
- Analytics capacity expansion

**Months 6-12 · First waves**
- SKU rationalization program launched
- Cost-of-goods intelligence program launched
- Pricing elasticity pilot in 1-2 categories
- Analytics platform deployed

**Months 12-24 · Scale**
- SKU rationalization extended across categories
- Sourcing transformation across largest categories
- Pricing elasticity expanded
- NPD operating model redesign
- Quality positioning strategy developed

**Months 24-36 · Compound**
- Premium tier launch (if strategic fit)
- Assortment intelligence mature
- Quality positioning realized in consumer perception
- Sustained investment and measurement

### Part L · Governance Mechanism

| Decision | Owner | Review body | Cadence |
|---|---|---|---|
| Owned brand strategy | EVP Own Brand | Executive committee | Annual + strategic reviews |
| SKU rationalization | EVP Own Brand + Category leaders | Merchandising committee | Semi-annual |
| NPD pipeline | EVP Own Brand + Chief Innovation Officer | Innovation committee | Monthly |
| Pricing strategy | EVP Own Brand + Chief Pricing Officer | Merchandising committee | Quarterly |
| Sourcing strategy | Chief Procurement Officer + EVP Own Brand | Procurement committee | Quarterly |
| Quality positioning | EVP Own Brand + CMO | Brand committee | Semi-annual |
| Performance review | EVP Own Brand | Executive committee | Monthly |

### Part M · Sector Sub-Variants

**Grocery (primary context):** Largest owned brand opportunity; highest complexity; food safety regulation.
**Mass merchant:** Broad category mix; premium tier opportunity (Target model); general merchandise owned brand distinct from grocery.
**Specialty retail:** Category-deep owned brand; differentiation-led rather than margin-led (Trader Joe's model).
**Club retail:** High-velocity, curated assortment (Costco Kirkland); extreme SKU rationalization discipline.
**Hard discount:** Owned brand as majority of assortment (Aldi, Lidl); national brand secondary.
**Online retail:** Owned brand amplified by marketplace economics; direct-to-consumer capabilities.
**Drug retail:** Owned brand across OTC + consumables + beauty.
**Convenience:** Owned brand emerging; smaller scale.

### Part N · Related Patterns

- **`pattern_demand_forecasting_inventory_ai`** (associative) — SKU × store × week demand forecasting is an ingredient for SKU rationalization and assortment intelligence
- **`pattern_ai_use_case_portfolio`** (associative) — owned brand margin recovery is a portfolio theme, not a single use case; portfolio discipline applies
- **`pattern_analytics_modernization`** (associative) — SKU × store × week analytics demand drives modernization scope

### Part O · Graph Contribution

```cypher
MERGE (p:Pattern {id: 'pattern_owned_brand_margin_recovery'})
SET p.slug = 'owned-brand-margin-recovery',
    p.name = 'Owned Brand Margin Recovery',
    p.version = '1.0.0',
    p.category = 'Merchandising & Margin Management',
    p.cross_industry = false,
    p.primary_sector = 'retail',
    p.confidence_floor = 0.70,
    p.n_observations_floor = 6,
    p.status = 'active';

MERGE (s:Sector {id: 'retail'})
MERGE (p)-[:APPLIES_TO_SECTOR {primary: true}]->(s);

// Vendors
MERGE (v_circana:Vendor {id: 'vendor_circana'})
ON CREATE SET v_circana.name = 'Circana', v_circana.category = 'Retail Market Measurement';
MERGE (v_circana)-[:APPEARS_IN]->(p);

MERGE (v_niq:Vendor {id: 'vendor_nielseniq'})
ON CREATE SET v_niq.name = 'NielsenIQ', v_niq.category = 'Retail Market Measurement';
MERGE (v_niq)-[:APPEARS_IN]->(p);

MERGE (v_blueyonder:Vendor {id: 'vendor_blue_yonder'})
ON CREATE SET v_blueyonder.name = 'Blue Yonder', v_blueyonder.category = 'Retail Planning';
MERGE (v_blueyonder)-[:APPEARS_IN]->(p);

MERGE (v_relex:Vendor {id: 'vendor_relex'})
ON CREATE SET v_relex.name = 'Relex', v_relex.category = 'Demand Forecasting & Replenishment';
MERGE (v_relex)-[:APPEARS_IN]->(p);

MERGE (v_revionics:Vendor {id: 'vendor_revionics'})
ON CREATE SET v_revionics.name = 'Revionics (Aptos)', v_revionics.category = 'Pricing AI';
MERGE (v_revionics)-[:APPEARS_IN]->(p);

// Regulatory frameworks
MERGE (f_ftc_mia:RegulatoryFramework {id: 'framework_ftc_made_in_usa'})
ON CREATE SET f_ftc_mia.name = 'FTC Made in USA Labeling Standard';
MERGE (f_ftc_mia)-[:APPLIES_TO]->(p);

MERGE (f_fsma:RegulatoryFramework {id: 'framework_fda_fsma'})
ON CREATE SET f_fsma.name = 'FDA Food Safety Modernization Act';
MERGE (f_fsma)-[:APPLIES_TO]->(p);
```

### Part P · Retrieval Contribution

~58 chunks. Namespace `global:patterns:retail`. Sub-variants across grocery / mass / specialty / club / hard discount / online / drug / convenience.

### Part Q · Prompting Contract

**Detection fragment:**

```
PATTERN: pattern_owned_brand_margin_recovery (RETAIL)
Summary: Integrated AI-augmented program to recover owned brand margin through SKU rationalization, cost-of-goods intelligence, assortment intelligence, pricing elasticity, NPD acceleration, quality positioning.
Activates when:
- Owned brand penetration <22% where peers average 28%+
- Owned brand margin dollars growth flat
- SKU velocity skew (bottom 40% generating <10% margin)
- Sourcing stasis (supplier relationships static 5+ years)
- Fixed-discount pricing logic
- NPD velocity low (<5 launches/category/year)
- Analytics underpowering (<5 FTEs / $1B owned brand revenue)
- SKU-level P&L unavailable
Diagnostic questions focus on penetration, SKU P&L, pricing logic, sourcing cadence, NPD velocity, analytics capacity, executive ownership.
If active, output pattern_id, confidence, signals_triggered, rationale.
```

**Injection fragment:** Interventions emphasizing executive elevation, SKU rationalization, cost-of-goods intelligence, assortment intelligence, pricing elasticity, NPD acceleration, quality positioning, analytics platform. Observations: Morrison primary reference (composite grocer 19% → 23% penetration, $180-240M 4-year margin impact); mass merchant premium tier launch; grocery co-op NPD; specialty retailer SKU rationalization; retailer sourcing transformation; pricing elasticity optimization. Anti-patterns: line-extension mindset, SKU proliferation, fixed-discount pricing, sourcing stasis, NPD silo, premium tier denial, analytics under-resourcing, quality perception inertia.

**Diagnostic fragment:** Sequenced probing: current penetration + benchmark gap; SKU P&L capability; pricing logic; sourcing cadence; NPD velocity; analytics capacity; executive ownership; investment trajectory.

### Part R · Rendering Contract

`/intelligence/patterns/owned-brand-margin-recovery`. Light hero + dark working zone.

Hero copy: **"Owned brand is the highest-leverage margin lever you're not pulling."**

Unique rendering element: interactive owned brand margin recovery calculator — inputs (current penetration, peer benchmark, owned brand revenue, avg margin delta vs national brand) → outputs (addressable margin opportunity, recovery trajectory, program components with sizing). Complements the Morrison demo reference program.

Right sidebar (tenant): current penetration + benchmark; SKU count + rationalization candidates; sourcing cadence status; NPD velocity; analytics capacity score.

Cross-links to demand forecasting / inventory AI pattern and AI use case portfolio.

**Morrison demo reference callout:** Primary observation references the composite Morrison program. Page shows Morrison as live reference with outcome metrics. Other observations shown as "composite organization built from real-world data" chips.

---

*End of Part 3.2a · Owned Brand Margin Recovery*

*Next in file sequence: `09-demand-forecasting-inventory-ai.md` — Part 3.2b Retail*

---
