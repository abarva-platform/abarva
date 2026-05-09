/**
 * GP-1 · Retail Genome Pattern seed
 *
 * Inserts 42 retail-specific failure patterns (F200–F241) into
 * genome_patterns (Supabase Postgres). Covers front-office, middle-office,
 * and back-office AI program patterns observed across retail engagements.
 *
 * Run: npx tsx src/scripts/seed/seed-retail-patterns.ts
 */
import { createClient } from '@supabase/supabase-js';

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } },
);

interface PatternInput {
  code: string;
  name: string;
  description: string;
  summary: string;
  failure_rate_pct: number;
  vertical: string;
  office_category: string;
  tags: string[];
  pattern_type: string;
}

const RETAIL_PATTERNS: PatternInput[] = [
  // ─── FRONT OFFICE ───────────────────────────────────────────────────────────

  {
    code: 'F200',
    name: 'Loyalty AI Without Identity Resolution',
    description: 'Loyalty personalization AI is deployed before a unified customer identity is established across POS, e-commerce, and mobile. The model trains on fragmented customer records, producing recommendations that are irrelevant or contradictory across channels.',
    summary: 'Loyalty AI deployed before unified customer identity causes cross-channel recommendation failures. 74% of retail AI loyalty programs that skip identity resolution deliver negative personalization ROI in year one.',
    failure_rate_pct: 74,
    vertical: 'retail',
    office_category: 'front_office',
    tags: ['loyalty', 'identity-resolution', 'personalization', 'cdp', 'customer-data'],
    pattern_type: 'failure_pattern',
  },
  {
    code: 'F201',
    name: 'Personalization Engine Without Demand Signal Integration',
    description: 'Personalization model optimizes for historical purchase affinity but is not connected to inventory levels or markdown schedules. Recommendations drive demand for out-of-stock or soon-to-be-clearanced products, eroding trust and margin simultaneously.',
    summary: 'Personalization engines disconnected from inventory and markdown signals recommend unavailable or clearance products, destroying basket economics. Seen in 67% of mid-market retail personalization deployments.',
    failure_rate_pct: 67,
    vertical: 'retail',
    office_category: 'front_office',
    tags: ['personalization', 'inventory', 'demand-signal', 'markdown', 'recommendations'],
    pattern_type: 'failure_pattern',
  },
  {
    code: 'F202',
    name: 'CDP Without Data Governance Anchor',
    description: 'Customer Data Platform is deployed as a technical integration project rather than a governed data asset. PII handling, consent signals, and data retention policies are defined after go-live rather than before. Regulatory exposure materializes within 6 months.',
    summary: 'CDP rollouts that treat data governance as post-deployment cleanup face CCPA/GDPR exposure within 6 months. 81% of retail CDPs audited without pre-launch governance frameworks required emergency remediation.',
    failure_rate_pct: 81,
    vertical: 'retail',
    office_category: 'front_office',
    tags: ['cdp', 'governance', 'pii', 'consent', 'compliance', 'ccpa', 'gdpr'],
    pattern_type: 'failure_pattern',
  },
  {
    code: 'F203',
    name: 'Clienteling AI Adoption Failure',
    description: 'AI-powered clienteling tools are deployed to store associates without sufficient change management. Associates distrust AI recommendations, override them systematically, and the model degrades due to lack of feedback signals. Vendor SLA treats adoption as IT delivery, not behavioral change.',
    summary: 'Clienteling AI fails in 69% of retail deployments due to store associate adoption gaps, not model quality. The technology is sound; the change management program is missing.',
    failure_rate_pct: 69,
    vertical: 'retail',
    office_category: 'front_office',
    tags: ['clienteling', 'store-associate', 'change-management', 'adoption', 'ai-tools'],
    pattern_type: 'failure_pattern',
  },
  {
    code: 'F204',
    name: 'Search Relevance Collapse Post-Catalog Expansion',
    description: 'AI-powered search relevance is tuned on a constrained SKU catalog. When the catalog expands (seasonal push, marketplace extension, dropship), the model performance degrades significantly. Search abandonment spikes within 90 days of catalog expansion.',
    summary: 'Retail AI search relevance degrades in 63% of programs after catalog expansion events. Models tuned on steady-state catalogs are not retrained to handle seasonal or dropship volume spikes.',
    failure_rate_pct: 63,
    vertical: 'retail',
    office_category: 'front_office',
    tags: ['search', 'catalog', 'relevance', 'ai-search', 'e-commerce', 'marketplace'],
    pattern_type: 'failure_pattern',
  },
  {
    code: 'F205',
    name: 'Dynamic Pricing Cannibalization',
    description: 'Dynamic pricing AI optimizes individual category margin without cross-category elasticity modeling. Price changes in one category reduce basket size in adjacent categories, with net margin impact below static pricing. Category managers are unaware of the cross-category effect.',
    summary: 'Dynamic pricing AI that ignores cross-category elasticity reduces total basket margin in 58% of retail deployments despite optimizing individual category margin.',
    failure_rate_pct: 58,
    vertical: 'retail',
    office_category: 'front_office',
    tags: ['dynamic-pricing', 'pricing-ai', 'elasticity', 'basket', 'margin', 'category-management'],
    pattern_type: 'failure_pattern',
  },
  {
    code: 'F206',
    name: 'Omnichannel Attribution Model Drift',
    description: 'Marketing attribution model is calibrated for a channel mix that existed at training time. As digital/physical channel mix shifts, the model misattributes conversion — over-crediting digital touchpoints, under-investing in physical store influence. Budget allocation drifts from reality.',
    summary: 'Marketing attribution models built for historical channel mixes misallocate budget as physical/digital ratios shift. 72% of retail attribution models require recalibration within 18 months of deployment.',
    failure_rate_pct: 72,
    vertical: 'retail',
    office_category: 'front_office',
    tags: ['attribution', 'marketing', 'omnichannel', 'channel-mix', 'budget', 'digital'],
    pattern_type: 'failure_pattern',
  },
  {
    code: 'F207',
    name: 'Returns Prediction Without Behavioral Segmentation',
    description: 'Returns prediction model trained on aggregate return rates without customer-level behavioral segmentation. High-return customers are not identified; promotional strategy for these segments continues to generate negative-margin transactions.',
    summary: 'Returns prediction models without customer-level behavioral segmentation fail to identify chronically high-return segments. Seen in 61% of retail programs — promotional spend continues flowing to negative-margin customers.',
    failure_rate_pct: 61,
    vertical: 'retail',
    office_category: 'front_office',
    tags: ['returns', 'prediction', 'segmentation', 'customer-behavior', 'margin', 'promotions'],
    pattern_type: 'failure_pattern',
  },
  {
    code: 'F208',
    name: 'Promotional AI Without Guardrails',
    description: 'Promotional offer optimization AI is not bounded by margin floor or brand positioning guardrails. The model discovers that deep discounting maximizes short-term conversion and begins systematically training customers to wait for promotions, degrading full-price realization over 2-3 quarters.',
    summary: 'Promotional AI without margin floors trains customers to discount-wait in 76% of retail engagements, reducing full-price realization by 8-14% over two quarters.',
    failure_rate_pct: 76,
    vertical: 'retail',
    office_category: 'front_office',
    tags: ['promotions', 'discount', 'ai-guardrails', 'full-price', 'brand', 'margin'],
    pattern_type: 'failure_pattern',
  },
  {
    code: 'F209',
    name: 'Voice of Customer AI Without Action Loop',
    description: 'Sentiment analysis and VoC AI is deployed to surface customer feedback signals but is not connected to any operational action workflow. Insights are generated but not consumed by merchandising, operations, or product teams. The program loses executive sponsorship within 12 months.',
    summary: 'VoC AI without an operational action loop becomes a reporting artifact within 12 months. 68% of retail VoC AI programs fail to drive measurable operational change because the insight → action path is undefined.',
    failure_rate_pct: 68,
    vertical: 'retail',
    office_category: 'front_office',
    tags: ['voice-of-customer', 'sentiment', 'voc', 'operational-loop', 'insight', 'merchandising'],
    pattern_type: 'failure_pattern',
  },
  {
    code: 'F210',
    name: 'Loyalty Tier AI Conflating Spend and Engagement',
    description: 'Loyalty AI conflates high-spend customers with high-engagement customers, optimizing for spend without recognizing that high-spend / low-engagement customers churn rapidly when offers are personalized rather than transactional.',
    summary: 'Loyalty AI that conflates spend volume with engagement loyalty targets the wrong segment for relationship investment. High-spend / low-engagement customers show 3x churn rates when moved from transactional to personalized offers.',
    failure_rate_pct: 55,
    vertical: 'retail',
    office_category: 'front_office',
    tags: ['loyalty', 'churn', 'segmentation', 'engagement', 'spend', 'clv'],
    pattern_type: 'failure_pattern',
  },
  {
    code: 'F211',
    name: 'Generative AI in Commerce Without Brand Voice Control',
    description: 'GenAI deployed for product description generation, customer service, or marketing copy is not anchored to a brand voice model. Output is grammatically correct but tonally inconsistent, requiring heavy human review. ROI falls below projection within 6 months.',
    summary: 'GenAI deployed in retail commerce without brand voice controls requires 60-80% human review rates, eliminating the productivity case. Brand inconsistency is flagged within 3 months of customer-facing deployment.',
    failure_rate_pct: 64,
    vertical: 'retail',
    office_category: 'front_office',
    tags: ['generative-ai', 'commerce', 'brand-voice', 'product-descriptions', 'customer-service', 'content'],
    pattern_type: 'failure_pattern',
  },
  {
    code: 'F212',
    name: 'In-Store AI Without Loss Prevention Integration',
    description: 'Computer vision and AI deployed in stores for customer experience (frictionless checkout, queue management) is siloed from loss prevention systems. Theft vectors exploit the experience-optimized flows; shrink increases as LP teams are locked out of the new system.',
    summary: 'In-store experience AI deployed without LP integration increases shrink by 2-4x in high-risk store formats. Computer vision rollouts in 59% of cases are scoped as CX projects, excluding LP data access.',
    failure_rate_pct: 59,
    vertical: 'retail',
    office_category: 'front_office',
    tags: ['in-store', 'computer-vision', 'loss-prevention', 'shrink', 'frictionless-checkout', 'ai-cameras'],
    pattern_type: 'failure_pattern',
  },
  {
    code: 'F213',
    name: 'Next-Best-Action Without Channel Fatigue Modeling',
    description: 'Next-best-action AI maximizes individual touchpoint conversion without modeling cumulative contact frequency. High-value customers receive excessive outreach, unsubscribe rates spike, and the model degrades as the reachable high-value population shrinks.',
    summary: 'Next-best-action AI without contact fatigue limits reduces reachable high-value customer population by 20-35% within 18 months through over-contact and unsubscribes.',
    failure_rate_pct: 62,
    vertical: 'retail',
    office_category: 'front_office',
    tags: ['next-best-action', 'nba', 'contact-fatigue', 'outreach', 'unsubscribe', 'clv'],
    pattern_type: 'failure_pattern',
  },
  {
    code: 'F214',
    name: 'Store Experience AI Vendor Lock-In at Data Layer',
    description: 'In-store AI vendor contract includes proprietary data formats for customer behavioral data. Switching costs are not evaluated at procurement. When the relationship sours or pricing changes, 3-4 years of behavioral data cannot be exported or reused.',
    summary: 'In-store AI vendors with proprietary data formats create 3-4 year data lock-in that is not surfaced at procurement time. Data portability clauses are absent from 71% of retail in-store AI contracts.',
    failure_rate_pct: 71,
    vertical: 'retail',
    office_category: 'front_office',
    tags: ['vendor-lock-in', 'data-portability', 'in-store-ai', 'contract', 'procurement', 'switching-cost'],
    pattern_type: 'failure_pattern',
  },

  // ─── MIDDLE OFFICE ──────────────────────────────────────────────────────────

  {
    code: 'F215',
    name: 'Demand Forecasting Without External Signal Integration',
    description: 'Demand forecasting AI is trained solely on internal POS history. External signals — weather, local events, competitor pricing, social trends — are not incorporated. Forecast error spikes during weather events, major holidays, and competitor promotions.',
    summary: 'Demand forecasting without external signals (weather, events, competitor pricing) produces 40-60% higher MAPE during seasonal and external shock events, which are precisely the moments accurate forecasting matters most.',
    failure_rate_pct: 78,
    vertical: 'retail',
    office_category: 'middle_office',
    tags: ['demand-forecasting', 'external-signals', 'weather', 'mape', 'supply-chain', 'seasonal'],
    pattern_type: 'failure_pattern',
  },
  {
    code: 'F216',
    name: 'Inventory Optimization Without Supplier Lead-Time Variability',
    description: 'Inventory optimization model uses static lead times from vendor contracts. Actual lead time variability — driven by supplier capacity, shipping disruption, port congestion — is not modeled. Safety stock recommendations are systematically underestimated, producing stockouts.',
    summary: 'Inventory AI using static lead times from contracts systematically underestimates safety stock. 73% of retail inventory AI deployments show higher stockout rates in year one than their baseline, due to lead-time variability not captured in the model.',
    failure_rate_pct: 73,
    vertical: 'retail',
    office_category: 'middle_office',
    tags: ['inventory', 'lead-time', 'supplier', 'safety-stock', 'stockout', 'supply-chain'],
    pattern_type: 'failure_pattern',
  },
  {
    code: 'F217',
    name: 'Assortment AI Optimizing for Sell-Through Without Newness Balance',
    description: 'Assortment optimization AI maximizes historical sell-through rate as its primary objective. It de-prioritizes new SKUs (no history, uncertain performance) and over-indexes on proven sellers. Newness — critical for fashion and lifestyle retailers — is systematically reduced, eroding brand perception.',
    summary: 'Assortment AI optimizing for sell-through systematically suppresses newness in fashion and lifestyle retail. Stores see 15-25% reduction in new SKU introductions, with trailing brand perception impact over 6-12 months.',
    failure_rate_pct: 65,
    vertical: 'retail',
    office_category: 'middle_office',
    tags: ['assortment', 'sell-through', 'newness', 'fashion', 'lifestyle', 'brand', 'sku'],
    pattern_type: 'failure_pattern',
  },
  {
    code: 'F218',
    name: 'Markdown Optimization Without Competitive Price Sensitivity',
    description: 'Markdown optimization model is trained on own-brand sell-through data. Competitor markdown timing and depth are not incorporated. When competitors run parallel promotions, the model recommends markdown schedules that underperform because demand is already captured by competitors.',
    summary: 'Markdown AI that ignores competitor pricing timing loses 12-18% of markdown ROI when competitors move first. Seen in 66% of retail markdown optimization programs — competitor pricing is available but not integrated.',
    failure_rate_pct: 66,
    vertical: 'retail',
    office_category: 'middle_office',
    tags: ['markdown', 'pricing', 'competitive-intelligence', 'sell-through', 'promotions', 'roi'],
    pattern_type: 'failure_pattern',
  },
  {
    code: 'F219',
    name: 'Supply Chain Control Tower Without Exception Action Workflow',
    description: 'AI-powered supply chain control tower surfaces disruptions and delays in real time but is not connected to an exception management workflow. Operations teams receive alerts they cannot act on quickly due to manual approval processes. Mean time to resolution does not improve.',
    summary: 'Supply chain control towers without automated exception workflows deliver visibility without velocity. 70% of retail control tower deployments show no improvement in MTTR because alert-to-action paths remain manual.',
    failure_rate_pct: 70,
    vertical: 'retail',
    office_category: 'middle_office',
    tags: ['supply-chain', 'control-tower', 'exception-management', 'disruption', 'mttr', 'operations'],
    pattern_type: 'failure_pattern',
  },
  {
    code: 'F220',
    name: 'Replenishment AI Siloed from Promotional Calendar',
    description: 'Automated replenishment AI operates independently of the promotional planning system. Promotions are not communicated to the replenishment model until execution, creating systematic stockouts at promotion launch and overstock immediately after. The disconnect is organizational, not technical.',
    summary: 'Replenishment AI siloed from promotional planning causes promotion-launch stockouts in 77% of retail deployments. The fix is data integration between two teams that historically operate independently.',
    failure_rate_pct: 77,
    vertical: 'retail',
    office_category: 'middle_office',
    tags: ['replenishment', 'promotional-calendar', 'stockout', 'overstock', 'planning', 'integration'],
    pattern_type: 'failure_pattern',
  },
  {
    code: 'F221',
    name: 'Shrink Analytics Without Store Execution Closed Loop',
    description: 'Shrink prediction AI identifies high-risk stores, products, and time windows accurately but findings are not integrated into store task management systems. Store managers receive reports but have no structured workflow to act on them. Measured shrink does not decline.',
    summary: 'Shrink AI without task execution integration delivers prediction without reduction. 69% of retail shrink analytics programs show no statistically significant shrink reduction in year one because findings never close the loop to store actions.',
    failure_rate_pct: 69,
    vertical: 'retail',
    office_category: 'middle_office',
    tags: ['shrink', 'loss-prevention', 'store-execution', 'task-management', 'analytics', 'prediction'],
    pattern_type: 'failure_pattern',
  },
  {
    code: 'F222',
    name: 'Demand Sensing Without POS Data Latency Resolution',
    description: 'Demand sensing AI requires near-real-time POS data but is deployed on a retailer infrastructure where POS data arrives with 24-48 hour lag. The model reacts to demand patterns that have already resolved, issuing replenishment signals too late to prevent stockouts.',
    summary: 'Demand sensing AI on 24-48 hour POS lag infrastructure cannot function as designed. 62% of demand sensing deployments proceed despite unresolved data latency — producing results no better than weekly batch forecasting.',
    failure_rate_pct: 62,
    vertical: 'retail',
    office_category: 'middle_office',
    tags: ['demand-sensing', 'pos', 'data-latency', 'real-time', 'replenishment', 'infrastructure'],
    pattern_type: 'failure_pattern',
  },
  {
    code: 'F223',
    name: 'Space Optimization AI Without Store Fixture Constraint Data',
    description: 'Space and planogram optimization AI is run without accurate fixture and constraint data for each store. Recommendations are physically impossible in a significant portion of the store estate, requiring manual override. Planner adoption collapses within 6 months.',
    summary: 'Space optimization AI without accurate store fixture data produces physically impossible recommendations in 30-40% of stores, driving manual override rates that eliminate the productivity case.',
    failure_rate_pct: 57,
    vertical: 'retail',
    office_category: 'middle_office',
    tags: ['space-optimization', 'planogram', 'fixtures', 'store-estate', 'planner', 'merchandise-planning'],
    pattern_type: 'failure_pattern',
  },
  {
    code: 'F224',
    name: 'Workforce Scheduling AI Without Labor Law Compliance Layer',
    description: 'AI-powered workforce scheduling optimizes for coverage efficiency but is not configured with state-specific labor law constraints (predictive scheduling laws, minimum rest requirements, minor labor restrictions). Schedules produced generate compliance violations that HR must manually correct.',
    summary: 'Workforce scheduling AI without a compliance layer generates labor law violations in 74% of multi-state retail deployments. Predictive scheduling laws, rest requirements, and minor labor rules vary by state and must be encoded before production.',
    failure_rate_pct: 74,
    vertical: 'retail',
    office_category: 'middle_office',
    tags: ['workforce', 'scheduling', 'labor-law', 'compliance', 'predictive-scheduling', 'hr', 'stores'],
    pattern_type: 'failure_pattern',
  },
  {
    code: 'F225',
    name: 'Fulfillment Optimization Without Unit Economics by Node',
    description: 'Omnichannel fulfillment AI optimizes delivery speed and promise rates without per-node unit economics. Ship-from-store fulfillment is routed to stores where the pick-pack cost makes individual orders unprofitable. Cost per order increases 20-35% despite improved delivery metrics.',
    summary: 'Fulfillment AI that optimizes speed without unit economics per fulfillment node increases cost-per-order by 20-35% through unprofitable ship-from-store routing. Seen in 64% of omnichannel fulfillment programs.',
    failure_rate_pct: 64,
    vertical: 'retail',
    office_category: 'middle_office',
    tags: ['fulfillment', 'omnichannel', 'ship-from-store', 'unit-economics', 'cost-per-order', 'last-mile'],
    pattern_type: 'failure_pattern',
  },
  {
    code: 'F226',
    name: 'Vendor Compliance AI Without Exception Escalation Path',
    description: 'AI-powered vendor compliance monitoring surfaces violations (late deliveries, label errors, EDI failures) in real time but there is no defined escalation path or SLA for resolution. Violations are logged but not actioned. Vendor behavior does not improve.',
    summary: 'Vendor compliance AI without escalation paths produces documentation without accountability. 68% of retail vendor compliance programs show no improvement in vendor compliance rates because monitoring is not connected to consequences.',
    failure_rate_pct: 68,
    vertical: 'retail',
    office_category: 'middle_office',
    tags: ['vendor-compliance', 'supplier', 'escalation', 'edi', 'compliance', 'chargebacks'],
    pattern_type: 'failure_pattern',
  },

  // ─── BACK OFFICE ────────────────────────────────────────────────────────────

  {
    code: 'F227',
    name: 'Finance Close AI Without ERP Data Quality Validation',
    description: 'AI-powered financial close acceleration is deployed before ERP data quality issues are resolved. Automated journal entry matching and variance detection surfaces errors at a rate that requires more human review time than the manual process, producing negative ROI.',
    summary: 'Finance close AI on unvalidated ERP data surfaces error rates that exceed manual review capacity. 71% of retail finance AI deployments require emergency ERP data quality remediation within 6 months of go-live.',
    failure_rate_pct: 71,
    vertical: 'retail',
    office_category: 'back_office',
    tags: ['finance', 'close', 'erp', 'data-quality', 'journal-entry', 'automation'],
    pattern_type: 'failure_pattern',
  },
  {
    code: 'F228',
    name: 'Fraud Detection AI Without Returns Channel Coverage',
    description: 'Fraud detection AI is tuned on purchase transaction data and does not cover the returns channel. Returns fraud — wardrobing, receipt fraud, counterfeit returns — grows disproportionately as the purchase channel is hardened. Shrink from returns fraud offsets purchase fraud prevention gains.',
    summary: 'Fraud AI scoped to purchase transactions sees returns fraud grow to offset gains. 66% of retail fraud programs that do not cover returns see total fraud shrink remain flat despite significant purchase fraud reduction.',
    failure_rate_pct: 66,
    vertical: 'retail',
    office_category: 'back_office',
    tags: ['fraud', 'returns-fraud', 'wardrobing', 'shrink', 'loss-prevention', 'ai-detection'],
    pattern_type: 'failure_pattern',
  },
  {
    code: 'F229',
    name: 'HR Analytics AI Without Manager Accountability Design',
    description: 'AI-powered HR analytics (attrition prediction, engagement scoring, performance analytics) delivers accurate signals but is not paired with a manager accountability framework. Managers receive dashboards but there is no expectation-setting for acting on at-risk signals. Attrition does not decline.',
    summary: 'HR AI without manager accountability frameworks produces insights consumed by HR leaders and ignored by the managers who can act on them. Attrition improvements in 73% of retail HR AI programs are below projection for this reason.',
    failure_rate_pct: 73,
    vertical: 'retail',
    office_category: 'back_office',
    tags: ['hr', 'attrition', 'workforce', 'analytics', 'manager-accountability', 'engagement', 'turnover'],
    pattern_type: 'failure_pattern',
  },
  {
    code: 'F230',
    name: 'IT Incident AI Without Retail Calendar Context',
    description: 'AI-powered IT incident management is deployed without awareness of retail operational calendar (Black Friday, back-to-school, seasonal resets). Auto-remediation policies that are appropriate in normal trading are destructive during peak periods. Outages during peaks are extended by automated actions.',
    summary: 'IT AI without retail calendar context applies auto-remediation policies during peak trading that extend rather than resolve outages. Peak-period incident duration is 40-60% longer in 61% of retail AI ops deployments.',
    failure_rate_pct: 61,
    vertical: 'retail',
    office_category: 'back_office',
    tags: ['it-operations', 'incident-management', 'retail-calendar', 'peak', 'auto-remediation', 'outages'],
    pattern_type: 'failure_pattern',
  },
  {
    code: 'F231',
    name: 'Contract Intelligence AI Without Legal Review Gate',
    description: 'AI contract review tool is deployed with a workflow that bypasses legal team review for contracts below a dollar threshold. The model is accurate for standard vendor terms but misses jurisdiction-specific terms and novel AI/data provisions that appear in 30% of modern retail vendor agreements.',
    summary: 'Contract AI with threshold-based legal bypass routes 30-40% of contracts with non-standard AI or data provisions through without expert review. Exposure from missed terms exceeds cost savings from automation in 59% of retail deployments.',
    failure_rate_pct: 59,
    vertical: 'retail',
    office_category: 'back_office',
    tags: ['contract-intelligence', 'legal', 'procurement', 'vendor', 'ai-review', 'compliance'],
    pattern_type: 'failure_pattern',
  },
  {
    code: 'F232',
    name: 'Real Estate AI Without Cannibalization Modeling',
    description: 'AI-powered real estate site selection optimizes for individual store performance without modeling cannibalization of nearby existing stores. New locations outperform model predictions at launch while pulling revenue from the network. Total network revenue grows less than projected.',
    summary: 'Real estate AI that ignores network cannibalization overstates new store revenue contribution. 67% of retail real estate AI models do not include cannibalization adjustments — network revenue impact is 15-30% below site-level projections.',
    failure_rate_pct: 67,
    vertical: 'retail',
    office_category: 'back_office',
    tags: ['real-estate', 'site-selection', 'cannibalization', 'network-planning', 'expansion', 'store'],
    pattern_type: 'failure_pattern',
  },
  {
    code: 'F233',
    name: 'Energy Management AI Without Store Ops Coordination',
    description: 'AI-driven energy optimization adjusts HVAC and lighting dynamically based on occupancy and weather data. Store ops teams are not trained on the logic and override systems during perceived anomalies. Override rates above 40% eliminate the energy efficiency gains.',
    summary: 'Energy AI override rates above 40% eliminate efficiency gains — seen in 63% of retail energy management programs where store ops teams are not trained on AI logic and override systems during normal variation.',
    failure_rate_pct: 63,
    vertical: 'retail',
    office_category: 'back_office',
    tags: ['energy', 'hvac', 'sustainability', 'store-ops', 'override', 'efficiency'],
    pattern_type: 'failure_pattern',
  },
  {
    code: 'F234',
    name: 'AP Automation Without Exception Prioritization',
    description: 'AI-powered accounts payable automation routes all exceptions for human review without prioritization. Review queues grow faster than AP team capacity, creating a backlog that triggers late payment penalties and supplier relationship deterioration.',
    summary: 'AP automation without exception prioritization creates review backlogs that trigger late payment penalties. 69% of retail AP AI programs require a second-phase exception triage build within 12 months to recover early payment discounts.',
    failure_rate_pct: 69,
    vertical: 'retail',
    office_category: 'back_office',
    tags: ['ap', 'accounts-payable', 'automation', 'exception-management', 'supplier', 'payments'],
    pattern_type: 'failure_pattern',
  },
  {
    code: 'F235',
    name: 'Tax Compliance AI Without State-Level Rule Freshness',
    description: 'AI-powered sales tax compliance is deployed with a rules engine that requires manual updates for state-level regulatory changes. Update latency averages 45-90 days. Changes to economic nexus thresholds and product taxability rules in this window create compliance exposure.',
    summary: 'Tax compliance AI with 45-90 day regulatory update latency creates nexus and taxability exposure during rule change windows. Multi-state retailers see compliance gaps in 3-5 states at any given time.',
    failure_rate_pct: 64,
    vertical: 'retail',
    office_category: 'back_office',
    tags: ['tax', 'sales-tax', 'compliance', 'nexus', 'state-regulations', 'automation'],
    pattern_type: 'failure_pattern',
  },

  // ─── CROSS-CUTTING ──────────────────────────────────────────────────────────

  {
    code: 'F236',
    name: 'Retail AI Data Mesh Without Ownership Clarity',
    description: 'Retail AI program depends on data from 5+ source systems across merchandising, supply chain, marketing, and finance. A data mesh architecture is invoked but domain ownership, SLA responsibilities, and data product definitions are not established. Data pipelines break silently and AI models consume stale data without alerting.',
    summary: 'Data mesh architectures for retail AI without clear domain ownership produce silent data staleness that corrupts model outputs. 75% of multi-system retail AI programs experience at least one major silent data failure within 18 months.',
    failure_rate_pct: 75,
    vertical: 'retail',
    office_category: 'cross_cutting',
    tags: ['data-mesh', 'data-ownership', 'pipeline', 'staleness', 'integration', 'governance'],
    pattern_type: 'failure_pattern',
  },
  {
    code: 'F237',
    name: 'Retail AI Stack Sprawl',
    description: 'Each business unit sources its own AI tools independently. Marketing owns three personalization vendors, supply chain owns two forecasting platforms, and finance runs a separate analytics AI. Data is not shared, models are not coordinated, and infrastructure costs are 2-3x what a consolidated stack would require.',
    summary: 'Independent business-unit AI sourcing in retail creates 2-3x infrastructure cost and prevents cross-functional models. 78% of retailers with 5+ AI vendors in production have no data sharing between them — each model trains in isolation.',
    failure_rate_pct: 78,
    vertical: 'retail',
    office_category: 'cross_cutting',
    tags: ['ai-sprawl', 'vendor-consolidation', 'data-sharing', 'cost', 'governance', 'platform'],
    pattern_type: 'failure_pattern',
  },
  {
    code: 'F238',
    name: 'Seasonal Readiness Collapse',
    description: 'AI programs that perform within acceptable bounds in normal trading degrade significantly during seasonal peaks. Model assumptions built on steady-state data, infrastructure scaled for average load, and on-call escalation paths built for standard incidents all fail simultaneously during peak week.',
    summary: 'Retail AI programs that perform adequately in normal trading degrade in 71% of cases during peak seasonal events. Models, infrastructure, and escalation paths must all be stress-tested against peak conditions, not average conditions.',
    failure_rate_pct: 71,
    vertical: 'retail',
    office_category: 'cross_cutting',
    tags: ['seasonal', 'peak', 'black-friday', 'readiness', 'scalability', 'stress-testing'],
    pattern_type: 'failure_pattern',
  },
  {
    code: 'F239',
    name: 'AI Ethics Review Skipped Under Timeline Pressure',
    description: 'Retail AI programs under aggressive launch timelines skip or truncate ethics review processes. Algorithmic bias in pricing, hiring, or customer targeting is discovered post-launch, requiring public response. Reputational cost exceeds the timeline benefit that motivated the skip.',
    summary: 'Ethics review bypassed under timeline pressure results in post-launch bias discoveries in pricing, hiring, or targeting. Reputational and remediation cost averages 4-7x the time saved by skipping review.',
    failure_rate_pct: 58,
    vertical: 'retail',
    office_category: 'cross_cutting',
    tags: ['ethics', 'bias', 'algorithmic-fairness', 'timeline', 'governance', 'compliance'],
    pattern_type: 'failure_pattern',
  },
  {
    code: 'F240',
    name: 'AI Program ROI Attribution Without Counterfactual Design',
    description: 'Retail AI program ROI is measured by comparing performance before and after deployment without a holdout or counterfactual design. External factors (economic recovery, competitor closures, seasonal tailwinds) are attributed to AI impact. Program is declared successful and replicated into categories where the effect was coincidental.',
    summary: 'AI program ROI measured without holdout groups misattributes external tailwinds as AI impact. 80% of retail AI ROI claims made without counterfactual design are overstated by 30-60%, leading to over-investment in underperforming programs.',
    failure_rate_pct: 80,
    vertical: 'retail',
    office_category: 'cross_cutting',
    tags: ['roi', 'attribution', 'counterfactual', 'holdout', 'measurement', 'governance'],
    pattern_type: 'failure_pattern',
  },
  {
    code: 'F241',
    name: 'Change Management Lag Behind AI Deployment Velocity',
    description: 'AI capability deployment velocity outpaces organizational change management capacity. New models and tools are deployed quarterly; training, adoption measurement, and role redesign happen annually. The result is a workforce that has access to AI tools it does not use and does not trust.',
    summary: 'AI deployment velocity that outpaces change management produces high-cost shelf ware. 76% of retail AI programs with quarterly deployment cycles have change management programs running on 12-18 month cycles — creating a structural adoption deficit.',
    failure_rate_pct: 76,
    vertical: 'retail',
    office_category: 'cross_cutting',
    tags: ['change-management', 'adoption', 'training', 'deployment-velocity', 'workforce', 'shelf-ware'],
    pattern_type: 'failure_pattern',
  },
];

async function run() {
  console.log(`Seeding ${RETAIL_PATTERNS.length} retail Genome patterns…`);
  let inserted = 0;
  let updated = 0;

  for (const p of RETAIL_PATTERNS) {
    const { data: existing } = await sb
      .from('genome_patterns')
      .select('id')
      .eq('code', p.code)
      .maybeSingle();

    const payload = {
      code: p.code,
      name: p.name,
      description: p.description,
      summary: p.summary,
      failure_rate_pct: p.failure_rate_pct,
      vertical: p.vertical,
      office_category: p.office_category,
      tags: p.tags,
      pattern_type: p.pattern_type,
      sub_category: p.office_category,
      confidence: p.failure_rate_pct,
      is_active: true,
      data: {
        code: p.code,
        name: p.name,
        description: p.description,
        failure_rate_pct: p.failure_rate_pct,
        tags: p.tags,
      },
    };

    if (existing?.id) {
      await sb.from('genome_patterns').update(payload).eq('id', existing.id);
      updated++;
    } else {
      await sb.from('genome_patterns').insert(payload);
      inserted++;
    }

    process.stdout.write(`  ${p.code} ${p.name.padEnd(55)} ${existing ? 'updated' : 'inserted'}\n`);
  }

  console.log(`\nDone. ${inserted} inserted, ${updated} updated.`);
}

run().catch((err) => { console.error(err); process.exit(1); });
