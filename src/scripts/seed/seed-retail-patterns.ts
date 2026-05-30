import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { deterministicUuid } from './contradiction-engine-lib';
import { createSeedClient, loadSeedEnv, slugify, type SeedClient } from './seed-wave-lib';

type OfficeCategory = 'front_office' | 'middle_office' | 'back_office';

interface RetailPatternSeed {
  code: string;
  name: string;
  officeCategory: OfficeCategory;
  failureRatePct: number;
  description: string;
  keywords: string[];
}

const RETAIL_PATTERNS: RetailPatternSeed[] = [
  {
    code: 'F200',
    name: 'Loyalty AI Built On Fragmented Identity',
    officeCategory: 'front_office',
    failureRatePct: 72,
    description: 'Retail loyalty personalization stalls when loyalty IDs, ecommerce IDs, POS tenders, and mobile app profiles are not resolved into a governed customer identity graph before model launch.',
    keywords: ['loyalty', 'identity resolution', 'customer 360', 'personalization'],
  },
  {
    code: 'F201',
    name: 'Promotion Optimization Without Incrementality Guardrails',
    officeCategory: 'front_office',
    failureRatePct: 66,
    description: 'Offer engines over-credit redemptions when holdouts, cannibalization, and vendor-funded trade spend rules are missing, causing margin leakage despite higher campaign response.',
    keywords: ['promotion', 'incrementality', 'margin', 'trade spend'],
  },
  {
    code: 'F202',
    name: 'Clienteling Copilot Detached From Store Workflow',
    officeCategory: 'front_office',
    failureRatePct: 64,
    description: 'Associate copilots underperform when recommendations are not embedded in the store task rhythm, inventory view, and manager coaching cadence.',
    keywords: ['clienteling', 'store associate', 'copilot', 'workflow'],
  },
  {
    code: 'F203',
    name: 'Commerce Search AI Missing Product Attribution',
    officeCategory: 'front_office',
    failureRatePct: 61,
    description: 'Retail search and recommendation AI creates low-confidence experiences when product attributes, substitutions, availability, and taxonomy governance are incomplete.',
    keywords: ['commerce search', 'recommendations', 'product data', 'taxonomy'],
  },
  {
    code: 'F204',
    name: 'Customer Service Bot Without Returns Authority',
    officeCategory: 'front_office',
    failureRatePct: 58,
    description: 'Service automation disappoints customers when the bot can explain policy but cannot execute returns, appeasements, order changes, or escalation with clear authority.',
    keywords: ['customer service', 'returns', 'bot', 'authority'],
  },
  {
    code: 'F205',
    name: 'Retail Media Targeting Outruns Consent Posture',
    officeCategory: 'front_office',
    failureRatePct: 69,
    description: 'Retail media growth creates privacy and trust risk when clean rooms, consent flags, opt-outs, and partner activation rules are not tied to the same customer data controls.',
    keywords: ['retail media', 'privacy', 'consent', 'clean room'],
  },
  {
    code: 'F206',
    name: 'Next Best Action Without Channel Arbitration',
    officeCategory: 'front_office',
    failureRatePct: 63,
    description: 'Next-best-action systems produce channel conflict when email, SMS, paid media, store associates, and call center teams optimize against separate contact policies.',
    keywords: ['next best action', 'channel', 'marketing', 'contact policy'],
  },
  {
    code: 'F207',
    name: 'Personalization Engine Starved Of Real-Time Signals',
    officeCategory: 'front_office',
    failureRatePct: 67,
    description: 'Personalization remains generic when cart, browse, price, inventory, loyalty, and service signals arrive in batch windows that miss the shopping moment.',
    keywords: ['personalization', 'real time', 'event streaming', 'shopper signals'],
  },
  {
    code: 'F208',
    name: 'Omnichannel Promise Without ATP Integrity',
    officeCategory: 'front_office',
    failureRatePct: 71,
    description: 'Buy-online-pickup and ship-from-store promises break when available-to-promise logic is not reconciled with shelf accuracy, reservations, and fulfillment labor.',
    keywords: ['omnichannel', 'available to promise', 'BOPIS', 'fulfillment'],
  },
  {
    code: 'F209',
    name: 'Dynamic Pricing Without Merchant Trust',
    officeCategory: 'front_office',
    failureRatePct: 62,
    description: 'Pricing AI is bypassed when merchants cannot inspect elasticity, competitive signals, margin constraints, and guardrails before accepting recommendations.',
    keywords: ['pricing', 'merchant', 'elasticity', 'guardrails'],
  },
  {
    code: 'F210',
    name: 'Store Experience AI Ignoring Local Operating Reality',
    officeCategory: 'front_office',
    failureRatePct: 59,
    description: 'Experience recommendations fail when local staffing, weather, event calendars, shrink hot spots, and assortment differences are absent from the model context.',
    keywords: ['store experience', 'localization', 'operations', 'store'],
  },
  {
    code: 'F211',
    name: 'Voice Of Customer Analytics Without Closed Loop Ownership',
    officeCategory: 'front_office',
    failureRatePct: 57,
    description: 'Sentiment analytics identifies issues but fails to improve CX when no owner is accountable for root-cause fixes across product, fulfillment, store, and service teams.',
    keywords: ['voice of customer', 'sentiment', 'closed loop', 'CX'],
  },
  {
    code: 'F212',
    name: 'Returns Personalization That Triggers Fraud Exposure',
    officeCategory: 'front_office',
    failureRatePct: 65,
    description: 'Flexible return experiences leak value when personalization logic is not connected to fraud patterns, policy abuse, item condition data, and customer lifetime value.',
    keywords: ['returns', 'fraud', 'personalization', 'policy'],
  },
  {
    code: 'F213',
    name: 'Marketplace Recommendations Without Seller Governance',
    officeCategory: 'front_office',
    failureRatePct: 60,
    description: 'Marketplace AI can damage trust when ranking, sponsored placement, counterfeit controls, and seller quality signals are governed by separate teams.',
    keywords: ['marketplace', 'seller governance', 'recommendations', 'trust'],
  },
  {
    code: 'F214',
    name: 'Loyalty Economics Measured As Enrollment Instead Of Behavior',
    officeCategory: 'front_office',
    failureRatePct: 68,
    description: 'Loyalty programs overstate impact when dashboards focus on member count and redemptions rather than retained margin, frequency, share of wallet, and churn prevention.',
    keywords: ['loyalty economics', 'retention', 'frequency', 'margin'],
  },
  {
    code: 'F215',
    name: 'Demand Forecasting Without Causal Event Discipline',
    officeCategory: 'middle_office',
    failureRatePct: 70,
    description: 'Forecasting AI drifts when promotion calendars, weather, local events, assortment resets, and competitor actions are not captured as governed causal features.',
    keywords: ['demand forecasting', 'causal features', 'weather', 'events'],
  },
  {
    code: 'F216',
    name: 'Inventory Optimization Masking Shelf Inaccuracy',
    officeCategory: 'middle_office',
    failureRatePct: 73,
    description: 'Optimization models recommend the wrong stock position when book inventory, shelf counts, RFID, and exception workflows disagree without a correction loop.',
    keywords: ['inventory optimization', 'shelf accuracy', 'RFID', 'exceptions'],
  },
  {
    code: 'F217',
    name: 'Replenishment Automation Without Store Labor Constraint',
    officeCategory: 'middle_office',
    failureRatePct: 64,
    description: 'Automated replenishment creates backroom congestion and missed shelf availability when labor capacity and unload windows are not part of ordering logic.',
    keywords: ['replenishment', 'labor', 'store operations', 'shelf availability'],
  },
  {
    code: 'F218',
    name: 'Supply Chain Control Tower Without Exception Rights',
    officeCategory: 'middle_office',
    failureRatePct: 66,
    description: 'Control towers surface exceptions but do not change outcomes when teams lack decision rights for substitutions, expedite spend, allocation, and vendor escalation.',
    keywords: ['supply chain visibility', 'control tower', 'exceptions', 'decision rights'],
  },
  {
    code: 'F219',
    name: 'Shrink Analytics Isolated From Store Action',
    officeCategory: 'middle_office',
    failureRatePct: 69,
    description: 'Shrink models stay theoretical when they are not connected to store tasking, camera/RFID evidence, associate safety protocols, and loss-prevention case management.',
    keywords: ['shrink', 'loss prevention', 'store tasking', 'case management'],
  },
  {
    code: 'F220',
    name: 'Vendor Fill Rate AI Blind To Contract Terms',
    officeCategory: 'middle_office',
    failureRatePct: 61,
    description: 'Supplier risk scoring misses recoverable value when purchase-order performance is not tied to chargebacks, service levels, allowances, and vendor compliance clauses.',
    keywords: ['vendor compliance', 'fill rate', 'chargebacks', 'supplier'],
  },
  {
    code: 'F221',
    name: 'Allocation AI Overfits Historical Store Clusters',
    officeCategory: 'middle_office',
    failureRatePct: 58,
    description: 'Allocation recommendations lag demand shifts when store clusters are based on stale history rather than current demographics, traffic, climate, and channel behavior.',
    keywords: ['allocation', 'store clustering', 'demand', 'assortment'],
  },
  {
    code: 'F222',
    name: 'Markdown Optimization Without Exit Inventory Rules',
    officeCategory: 'middle_office',
    failureRatePct: 63,
    description: 'Markdown engines protect margin on paper but miss cash recovery when terminal inventory, pack-and-hold rules, clearance capacity, and vendor funding are not modeled.',
    keywords: ['markdown', 'clearance', 'inventory', 'margin'],
  },
  {
    code: 'F223',
    name: 'Assortment AI Missing Space And Planogram Feasibility',
    officeCategory: 'middle_office',
    failureRatePct: 60,
    description: 'Assortment recommendations fail at execution when shelf space, fixture constraints, minimum presentation, and planogram change effort are not included.',
    keywords: ['assortment', 'planogram', 'space planning', 'execution'],
  },
  {
    code: 'F224',
    name: 'Order Routing Optimizes Cost While Breaking CX',
    officeCategory: 'middle_office',
    failureRatePct: 67,
    description: 'Fulfillment routing saves freight but erodes customer trust when delivery promise, split shipments, cancellation risk, and store pick labor are not balanced.',
    keywords: ['order routing', 'fulfillment', 'customer promise', 'freight'],
  },
  {
    code: 'F225',
    name: 'Fresh Forecasting Without Waste Feedback',
    officeCategory: 'middle_office',
    failureRatePct: 71,
    description: 'Grocery and fresh forecasting misses profit targets when spoilage, donations, substitutions, shrink, and on-shelf availability are measured in separate loops.',
    keywords: ['fresh', 'waste', 'grocery', 'forecasting'],
  },
  {
    code: 'F226',
    name: 'Supply Chain Risk Signals Missing Supplier Alternatives',
    officeCategory: 'middle_office',
    failureRatePct: 62,
    description: 'Risk dashboards create awareness without resilience when alternate suppliers, lead-time tradeoffs, quality constraints, and landed-cost impacts are not pre-modeled.',
    keywords: ['supply chain risk', 'supplier alternatives', 'resilience', 'lead time'],
  },
  {
    code: 'F227',
    name: 'Warehouse Labor AI Detached From Slotting Strategy',
    officeCategory: 'middle_office',
    failureRatePct: 56,
    description: 'Warehouse productivity models underperform when pick paths, slotting, inbound variability, automation constraints, and labor planning are optimized separately.',
    keywords: ['warehouse', 'slotting', 'labor planning', 'productivity'],
  },
  {
    code: 'F228',
    name: 'Merchandise Planning AI Without Scenario Governance',
    officeCategory: 'middle_office',
    failureRatePct: 59,
    description: 'Planning models create competing truths when finance, merchandising, supply chain, and stores run separate scenarios without version control and decision cadence.',
    keywords: ['merchandise planning', 'scenario planning', 'governance', 'S&OP'],
  },
  {
    code: 'F229',
    name: 'Reverse Logistics Optimization Missing Policy Economics',
    officeCategory: 'middle_office',
    failureRatePct: 62,
    description: 'Returns routing fails to recover margin when refurbishment, liquidation, vendor return rights, store handling costs, and fraud rules are not connected.',
    keywords: ['reverse logistics', 'returns', 'liquidation', 'policy economics'],
  },
  {
    code: 'F230',
    name: 'Finance Close Automation Without Retail Calendar Mapping',
    officeCategory: 'back_office',
    failureRatePct: 57,
    description: 'Close automation breaks on retail-specific calendars, store accruals, vendor allowances, and inventory adjustments when accounting rules are not encoded up front.',
    keywords: ['finance close', 'retail calendar', 'accruals', 'allowances'],
  },
  {
    code: 'F231',
    name: 'Workforce Scheduling AI Without Labor Rule Fidelity',
    officeCategory: 'back_office',
    failureRatePct: 68,
    description: 'Scheduling optimization loses trust when labor laws, union rules, availability preferences, skills, task demand, and manager overrides are poorly represented.',
    keywords: ['workforce scheduling', 'labor rules', 'skills', 'manager override'],
  },
  {
    code: 'F232',
    name: 'Loss Prevention Case AI Without Privacy Boundaries',
    officeCategory: 'back_office',
    failureRatePct: 64,
    description: 'LP analytics creates legal and associate trust risk when surveillance, exception reporting, biometrics, and case workflows lack explicit privacy controls.',
    keywords: ['loss prevention', 'privacy', 'surveillance', 'case management'],
  },
  {
    code: 'F233',
    name: 'ERP Modernization Sequenced After AI Commitments',
    officeCategory: 'back_office',
    failureRatePct: 74,
    description: 'AI roadmaps overpromise when master data, finance, procurement, inventory, and order-management modernization are scheduled after dependent AI releases.',
    keywords: ['ERP modernization', 'AI roadmap', 'master data', 'dependencies'],
  },
  {
    code: 'F234',
    name: 'Data Platform Migration Without Retail Semantic Layer',
    officeCategory: 'back_office',
    failureRatePct: 69,
    description: 'Cloud data migrations fail to unlock retail AI when metrics such as sales, margin, inventory, traffic, and loyalty value keep conflicting definitions.',
    keywords: ['data platform', 'semantic layer', 'metrics', 'cloud migration'],
  },
  {
    code: 'F235',
    name: 'IT Modernization Ignores Store Edge Constraints',
    officeCategory: 'back_office',
    failureRatePct: 61,
    description: 'Modern architectures underdeliver when store bandwidth, POS uptime, offline mode, device management, and edge compute constraints are treated as afterthoughts.',
    keywords: ['IT modernization', 'store edge', 'POS', 'offline mode'],
  },
  {
    code: 'F236',
    name: 'AI Governance Detached From Merchandising Cadence',
    officeCategory: 'back_office',
    failureRatePct: 58,
    description: 'Governance boards slow adoption when model approvals, exceptions, and monitoring do not match weekly retail decision cycles and seasonal planning gates.',
    keywords: ['AI governance', 'merchandising', 'cadence', 'approval'],
  },
  {
    code: 'F237',
    name: 'Cyber Risk Model Missing Payment Page Scripts',
    officeCategory: 'back_office',
    failureRatePct: 63,
    description: 'Retail cyber programs miss checkout exposure when third-party payment scripts, tag managers, consent tools, and fraud services are not continuously monitored.',
    keywords: ['cyber', 'payment page', 'PCI', 'third-party scripts'],
  },
  {
    code: 'F238',
    name: 'ESG Reporting AI Without Product And Supplier Lineage',
    officeCategory: 'back_office',
    failureRatePct: 60,
    description: 'Sustainability analytics becomes narrative-only when product lineage, supplier attestations, logistics emissions, and audit evidence are not linked to SKU economics.',
    keywords: ['ESG', 'supplier lineage', 'product data', 'sustainability'],
  },
  {
    code: 'F239',
    name: 'Portfolio Value Tracking Without Benefits Ownership',
    officeCategory: 'back_office',
    failureRatePct: 65,
    description: 'Retail AI portfolios show activity but not value when benefits are not assigned to owners, baselines, measurement windows, and controllable KPIs.',
    keywords: ['portfolio value', 'benefits ownership', 'KPI', 'measurement'],
  },
];

function graphEdgesFor(pattern: RetailPatternSeed): Array<Record<string, unknown>> {
  const officeNode = `retail:${pattern.officeCategory}`;
  const capabilityNode = `retail:${slugify(pattern.keywords[0] ?? pattern.name)}`;
  return [
    {
      id: deterministicUuid(`edge:${pattern.code}:belongs_to:${officeNode}`),
      from_node_type: 'genome_pattern',
      from_node_id: pattern.code,
      edge_type: 'belongs_to',
      to_node_type: 'office_category',
      to_node_id: officeNode,
      vertical: 'retail',
      weight: 1,
      evidence: { seeded_by: 'seed-retail-patterns', office_category: pattern.officeCategory },
      source_key: 'retail_genome_patterns',
    },
    {
      id: deterministicUuid(`edge:${pattern.code}:applies_to:${capabilityNode}`),
      from_node_type: 'genome_pattern',
      from_node_id: pattern.code,
      edge_type: 'applies_to',
      to_node_type: 'retail_capability',
      to_node_id: capabilityNode,
      vertical: 'retail',
      weight: 0.82,
      evidence: { seeded_by: 'seed-retail-patterns', keywords: pattern.keywords },
      source_key: 'retail_genome_patterns',
    },
  ];
}

async function upsertRows(
  sb: SeedClient,
  table: string,
  rows: Array<Record<string, unknown>>,
  onConflict: string,
): Promise<void> {
  const batchSize = 50;
  for (let index = 0; index < rows.length; index += batchSize) {
    const { error } = await sb.from(table).upsert(rows.slice(index, index + batchSize), { onConflict });
    if (error) throw error;
  }
}

async function main() {
  loadSeedEnv();
  const sb = createSeedClient();

  const patternRows = RETAIL_PATTERNS.map((pattern) => ({
    id: deterministicUuid(`retail-genome-pattern:${pattern.code}`),
    pattern_type: 'failure_pattern',
    vertical: 'retail',
    sub_category: pattern.officeCategory,
    data: {
      code: pattern.code,
      name: pattern.name,
      description: pattern.description,
      office_category: pattern.officeCategory,
      keywords: pattern.keywords,
      demo_seed: true,
    },
    source_count: 6,
    confidence: 84,
    is_active: true,
    code: pattern.code,
    name: pattern.name,
    description: pattern.description,
    summary: pattern.description,
    failure_rate_pct: pattern.failureRatePct,
    office_category: pattern.officeCategory,
    keywords: pattern.keywords,
  }));

  const graphEdges = RETAIL_PATTERNS.flatMap(graphEdgesFor);

  await upsertRows(sb, 'genome_patterns', patternRows, 'code');
  await upsertRows(
    sb,
    'intelligence_graph_edges',
    graphEdges,
    'from_node_type,from_node_id,edge_type,to_node_type,to_node_id',
  );

  const { count: patternCount, error: patternCountError } = await sb
    .from('genome_patterns')
    .select('id', { count: 'exact', head: true })
    .eq('vertical', 'retail')
    .gte('code', 'F200')
    .lte('code', 'F239');
  if (patternCountError) throw patternCountError;

  const { count: edgeCount, error: edgeCountError } = await sb
    .from('intelligence_graph_edges')
    .select('id', { count: 'exact', head: true })
    .eq('vertical', 'retail')
    .in('from_node_id', RETAIL_PATTERNS.map((pattern) => pattern.code));
  if (edgeCountError) throw edgeCountError;

  console.log(`Seeded retail Genome patterns: ${patternCount ?? 0}`);
  console.log(`Seeded retail Genome graph edges: ${edgeCount ?? 0}`);
}

const isDirect = process.argv[1] ? import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href : false;
if (isDirect) {
  main().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}
