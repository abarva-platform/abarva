import path from 'node:path';
import { pathToFileURL } from 'node:url';
import type { SupabaseClient } from '@supabase/supabase-js';
import { deterministicUuid } from './contradiction-engine-lib';
import { createSeedClient, loadSeedEnv, TENANTS } from './seed-wave-lib';

interface ClientRow {
  id: string;
  name: string;
  legal_name: string | null;
}

interface UseCaseSeed {
  key: string;
  name: string;
  description: string;
  businessUnit: string;
  domain: string;
  stage: 'idea' | 'qualify' | 'design' | 'evidence' | 'review' | 'execute' | 'realize' | 'stalled';
  aiType: string;
  scope: string;
  vendor: string;
  systems: string[];
  relatedPatterns: string[];
}

interface ContradictionSeed {
  key: string;
  type: 'strategy_allocation' | 'commitment_pace' | 'sponsor_behavior' | 'budget_priority' | 'external_internal_messaging';
  severity: 'high' | 'medium' | 'low';
  category: 'A_strategy_allocation' | 'B_commitment_pace' | 'C_sponsor_behavior' | 'D_budget_priority' | 'E_external_internal_messaging';
  shortTitle: string;
  summary: string;
  longDescription: string;
  suggestedAction: string;
  relatedUseCaseKeys: string[];
  relatedPatterns: string[];
  surfacingPriority: number;
}

const USE_CASES: UseCaseSeed[] = [
  {
    key: 'loyalty_ai',
    name: 'Loyalty AI Next Best Offer',
    description: 'Use loyalty, POS, ecommerce, service, and app behavior to generate next-best offers with incrementality holdouts and margin guardrails.',
    businessUnit: 'Marketing',
    domain: 'Customer loyalty',
    stage: 'design',
    aiType: 'personalization',
    scope: 'Front-office loyalty journey optimization for 42M loyalty members.',
    vendor: 'Salesforce, Snowflake, Braze',
    systems: ['Loyalty platform', 'CDP', 'POS', 'Ecommerce', 'Mobile app'],
    relatedPatterns: ['F200', 'F201', 'F214'],
  },
  {
    key: 'demand_sensing',
    name: 'Demand Sensing For Seasonal Categories',
    description: 'Blend POS, weather, promotions, local events, search, and social signals to improve short-horizon demand sensing for seasonal and fast-turn categories.',
    businessUnit: 'Merchandising',
    domain: 'Demand planning',
    stage: 'qualify',
    aiType: 'forecasting',
    scope: 'Middle-office forecast lift for apparel, home, and seasonal grocery categories.',
    vendor: 'Blue Yonder, Databricks',
    systems: ['Demand planning', 'Promotion calendar', 'Weather feed', 'POS'],
    relatedPatterns: ['F215', 'F221', 'F228'],
  },
  {
    key: 'store_associate_productivity',
    name: 'Store Associate Productivity Copilot',
    description: 'Provide associates and store managers with task prioritization, customer context, product lookup, and exception guidance inside existing handheld workflows.',
    businessUnit: 'Store Operations',
    domain: 'Associate productivity',
    stage: 'evidence',
    aiType: 'copilot',
    scope: 'Pilot in 150 stores across apparel, grocery, and home departments.',
    vendor: 'Microsoft, ServiceNow',
    systems: ['Store task manager', 'Handheld devices', 'Knowledge base', 'Inventory lookup'],
    relatedPatterns: ['F202', 'F210', 'F231'],
  },
  {
    key: 'shrink_analytics',
    name: 'Shrink Analytics And LP Case Prioritization',
    description: 'Detect shrink patterns by linking exception reporting, RFID deltas, returns, POS anomalies, camera events, and loss-prevention case workflows.',
    businessUnit: 'Asset Protection',
    domain: 'Shrink and loss prevention',
    stage: 'design',
    aiType: 'anomaly_detection',
    scope: 'Prioritize high-confidence shrink interventions in the top 300 shrink-risk stores.',
    vendor: 'Sensormatic, Palantir',
    systems: ['POS', 'RFID', 'Returns', 'LP case management', 'Video analytics'],
    relatedPatterns: ['F219', 'F232', 'F237'],
  },
  {
    key: 'personalization_engine',
    name: 'Real-Time Personalization Engine',
    description: 'Serve onsite, app, email, and retail media recommendations using live browse, cart, inventory, loyalty, and consent-state signals.',
    businessUnit: 'Digital Commerce',
    domain: 'Personalization',
    stage: 'qualify',
    aiType: 'recommendation',
    scope: 'Front-office real-time decisioning across app, web, email, and retail media surfaces.',
    vendor: 'Adobe, Salesforce, Snowflake',
    systems: ['CDP', 'Ecommerce', 'Retail media platform', 'Consent platform'],
    relatedPatterns: ['F205', 'F207', 'F214'],
  },
  {
    key: 'supply_chain_control_tower',
    name: 'Supply Chain Control Tower Exception AI',
    description: 'Predict purchase order, transportation, supplier, and distribution center exceptions and route them to accountable decision owners.',
    businessUnit: 'Supply Chain',
    domain: 'Supply chain visibility',
    stage: 'design',
    aiType: 'risk_prediction',
    scope: 'Inbound vendor PO and domestic transportation exception management.',
    vendor: 'o9, Project44, SAP',
    systems: ['TMS', 'WMS', 'ERP', 'Vendor portal'],
    relatedPatterns: ['F218', 'F220', 'F226'],
  },
  {
    key: 'pricing_optimization',
    name: 'Pricing Optimization Workbench',
    description: 'Recommend price moves using elasticity, competitor signals, inventory position, promo calendar, and merchant guardrails.',
    businessUnit: 'Merchandising',
    domain: 'Pricing',
    stage: 'evidence',
    aiType: 'optimization',
    scope: 'Category pricing cockpit for high-velocity discretionary categories.',
    vendor: 'Revionics, Snowflake',
    systems: ['Pricing platform', 'Competitive scraping', 'ERP', 'Promotion calendar'],
    relatedPatterns: ['F209', 'F222', 'F228'],
  },
  {
    key: 'workforce_scheduling',
    name: 'AI Workforce Scheduling',
    description: 'Optimize store labor schedules using traffic, task demand, skills, availability, labor rules, and manager override learning.',
    businessUnit: 'Store Operations',
    domain: 'Workforce planning',
    stage: 'qualify',
    aiType: 'optimization',
    scope: 'Scheduling recommendations for store managers in labor-constrained districts.',
    vendor: 'UKG, Legion',
    systems: ['Workforce management', 'Traffic counters', 'Task manager', 'HRIS'],
    relatedPatterns: ['F217', 'F231', 'F236'],
  },
  {
    key: 'markdown_optimization',
    name: 'Markdown Optimization For Seasonal Exit',
    description: 'Improve markdown timing by linking demand, inventory, clearance capacity, vendor funding, and exit inventory targets.',
    businessUnit: 'Merchandising',
    domain: 'Markdowns',
    stage: 'design',
    aiType: 'optimization',
    scope: 'Seasonal category markdown engine with merchant approval and scenario comparison.',
    vendor: 'Oracle Retail, Databricks',
    systems: ['Merchandise planning', 'Inventory', 'Vendor allowances', 'POS'],
    relatedPatterns: ['F222', 'F228', 'F239'],
  },
  {
    key: 'returns_fraud',
    name: 'Returns Fraud And Policy Abuse Detection',
    description: 'Identify high-risk returns by linking transaction history, item condition, return channel, customer value, and policy abuse patterns.',
    businessUnit: 'Customer Operations',
    domain: 'Returns',
    stage: 'evidence',
    aiType: 'fraud_detection',
    scope: 'Risk scoring for omnichannel return flows before policy exceptions are granted.',
    vendor: 'Riskified, Forter',
    systems: ['Returns platform', 'POS', 'Order management', 'Fraud tools'],
    relatedPatterns: ['F212', 'F229', 'F232'],
  },
  {
    key: 'omnichannel_fulfillment',
    name: 'Omnichannel Fulfillment Routing',
    description: 'Route orders across DC, store, and vendor nodes while balancing promise accuracy, pick labor, margin, freight, and cancellation risk.',
    businessUnit: 'Digital Commerce',
    domain: 'Fulfillment',
    stage: 'design',
    aiType: 'optimization',
    scope: 'Order routing for BOPIS, ship-from-store, and direct-to-consumer fulfillment.',
    vendor: 'Manhattan Associates, Fluent Commerce',
    systems: ['OMS', 'Inventory availability', 'Store labor', 'TMS'],
    relatedPatterns: ['F208', 'F224', 'F229'],
  },
  {
    key: 'vendor_compliance',
    name: 'Vendor Compliance And Fill-Rate Recovery',
    description: 'Connect supplier performance, fill rate, ASN quality, deductions, chargebacks, and contract terms into a compliance recovery workflow.',
    businessUnit: 'Procurement',
    domain: 'Vendor compliance',
    stage: 'qualify',
    aiType: 'analytics',
    scope: 'Recoverable vendor compliance value for top 250 suppliers.',
    vendor: 'SAP Ariba, Coupa',
    systems: ['ERP', 'Vendor portal', 'Contracts', 'Warehouse receiving'],
    relatedPatterns: ['F220', 'F226', 'F239'],
  },
];

const CONTRADICTIONS: ContradictionSeed[] = [
  {
    key: 'cost_takeout_vs_platform_first',
    type: 'budget_priority',
    severity: 'high',
    category: 'D_budget_priority',
    shortTitle: 'CFO wants cost takeout while CIO is funding platform-first sequencing',
    summary: 'The AI portfolio is being sold as near-term cost takeout, but the CIO roadmap requires data platform and ERP prerequisites before several use cases can safely scale.',
    longDescription: 'Apex executives are using the same AI portfolio to satisfy two incompatible narratives: immediate expense reduction for the CFO and foundational modernization for the CIO. Without explicit phase gates, the demo roadmap will overpromise savings before master data, semantic layer, and integration dependencies are resolved.',
    suggestedAction: 'Separate Wave 1 cash-return use cases from platform-dependent bets and make modernization prerequisites visible in the CXO readout.',
    relatedUseCaseKeys: ['markdown_optimization', 'vendor_compliance', 'supply_chain_control_tower'],
    relatedPatterns: ['F233', 'F234', 'F239'],
    surfacingPriority: 94,
  },
  {
    key: 'cmo_loyalty_vs_cto_cdp',
    type: 'sponsor_behavior',
    severity: 'high',
    category: 'C_sponsor_behavior',
    shortTitle: 'CMO owns loyalty outcomes but IT owns the CDP bottleneck',
    summary: 'Marketing is accountable for personalization lift, but the CDP identity model, consent posture, and activation SLAs sit under the CTO organization.',
    longDescription: 'The loyalty AI and real-time personalization use cases depend on identity resolution, consent flags, event latency, and activation APIs that Marketing does not control. This creates a sponsor gap where the CMO is judged on customer value while IT controls the data readiness sequence.',
    suggestedAction: 'Create a joint CMO/CTO readiness gate for identity, consent, and activation latency before promising personalization ROI.',
    relatedUseCaseKeys: ['loyalty_ai', 'personalization_engine'],
    relatedPatterns: ['F200', 'F205', 'F207'],
    surfacingPriority: 91,
  },
  {
    key: 'vendors_all_claim_integration_hub',
    type: 'external_internal_messaging',
    severity: 'medium',
    category: 'E_external_internal_messaging',
    shortTitle: 'Three vendors all claim to be the integration hub',
    summary: 'Salesforce, Adobe, and Snowflake are each positioned as the activation or decisioning center for customer AI, creating architecture ambiguity.',
    longDescription: 'The personalization roadmap uses vendor language that implies three different systems of intelligence. Unless Apex names the actual decisioning owner, integration pattern, and source of consent truth, teams will duplicate data movement and produce conflicting customer decisions.',
    suggestedAction: 'Force a one-page target architecture that names system of record, system of decision, system of activation, and consent authority.',
    relatedUseCaseKeys: ['loyalty_ai', 'personalization_engine', 'returns_fraud'],
    relatedPatterns: ['F200', 'F205', 'F234'],
    surfacingPriority: 82,
  },
  {
    key: 'ai_timeline_vs_data_readiness',
    type: 'commitment_pace',
    severity: 'high',
    category: 'B_commitment_pace',
    shortTitle: 'AI launch timeline assumes data readiness the audit does not show',
    summary: 'Several Apex AI use cases are planned as if product, inventory, customer, and supplier data are already governed, but the dependency evidence points to unresolved semantics and latency.',
    longDescription: 'The proposed demo narrative compresses discovery, data readiness, model build, workflow integration, and measurement into one track. Demand sensing, order routing, and vendor compliance can generate plausible outputs before they are decision-grade, which is dangerous for a CXO demo if not framed honestly.',
    suggestedAction: 'Tag each use case with readiness status and block any production claim until source freshness, owner, and measurement method are explicit.',
    relatedUseCaseKeys: ['demand_sensing', 'omnichannel_fulfillment', 'vendor_compliance'],
    relatedPatterns: ['F208', 'F215', 'F234'],
    surfacingPriority: 96,
  },
  {
    key: 'sustainability_vs_fulfillment_speed',
    type: 'strategy_allocation',
    severity: 'medium',
    category: 'A_strategy_allocation',
    shortTitle: 'Sustainability KPIs conflict with faster fulfillment promises',
    summary: 'Digital is pushing faster delivery promises while ESG reporting expects lower logistics emissions and supplier-lineage traceability.',
    longDescription: 'The omnichannel fulfillment roadmap optimizes promise speed, split shipment reduction, and store labor, but sustainability goals require emissions visibility and product lineage. Without a tradeoff rule, the optimizer can improve CX while quietly worsening ESG commitments.',
    suggestedAction: 'Add emissions and supplier-lineage constraints to fulfillment routing scenarios and show the CXO tradeoff explicitly.',
    relatedUseCaseKeys: ['omnichannel_fulfillment', 'supply_chain_control_tower'],
    relatedPatterns: ['F224', 'F238', 'F239'],
    surfacingPriority: 77,
  },
];

async function resolveApexClient(sb: SupabaseClient): Promise<ClientRow> {
  for (const field of [
    { column: 'name', value: TENANTS.apex.shortName },
    { column: 'name', value: TENANTS.apex.canonicalName },
    { column: 'legal_name', value: TENANTS.apex.legalName },
  ]) {
    const { data, error } = await sb
      .from('clients')
      .select('id, name, legal_name')
      .eq(field.column, field.value)
      .limit(1)
      .maybeSingle();
    if (error) throw error;
    if (data) return data as ClientRow;
  }
  throw new Error('Apex Retail client missing. Run `npm run db:seed:wave -- --tenant apex` first.');
}

async function upsertRows(
  sb: SupabaseClient,
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

function useCaseRows(clientId: string) {
  return USE_CASES.map((useCase) => ({
    id: deterministicUuid(`apex-retail-use-case:${useCase.key}`),
    client_id: clientId,
    name: useCase.name,
    description: useCase.description,
    business_unit: useCase.businessUnit,
    domain: useCase.domain,
    sponsor_person_id: null,
    owner_person_id: null,
    stage: useCase.stage,
    systems: useCase.systems,
    ai_type: useCase.aiType,
    scope: useCase.scope,
    vendor: useCase.vendor,
    source: 'seed',
    external_id: `apex_retail_${useCase.key}`,
    metadata: {
      seeded_by: 'seed-apex-contradictions',
      related_patterns: useCase.relatedPatterns,
    },
  }));
}

function contradictionRows(clientId: string, useCaseIdsByKey: Map<string, string>) {
  return CONTRADICTIONS.map((contradiction) => ({
    id: deterministicUuid(`apex-retail-contradiction:${contradiction.key}`),
    client_id: clientId,
    use_case_id: useCaseIdsByKey.get(contradiction.relatedUseCaseKeys[0] ?? '') ?? null,
    contradiction_type: contradiction.type,
    severity: contradiction.severity,
    description: contradiction.longDescription,
    suggested_action: contradiction.suggestedAction,
    evidence: {
      seeded_by: 'seed-apex-contradictions',
      related_use_cases: contradiction.relatedUseCaseKeys,
      related_patterns: contradiction.relatedPatterns,
    },
    detected_at: '2026-05-09T00:00:00Z',
    resolved_at: null,
    resolution_notes: null,
    triggered_engagement_id: null,
    summary: contradiction.summary,
    impact: {
      demo_critical: contradiction.severity === 'high',
      cxo_surface: true,
      related_use_cases: contradiction.relatedUseCaseKeys,
    },
    short_title: contradiction.shortTitle,
    long_description: contradiction.longDescription,
    category: contradiction.category,
    subcategory: 'retail_ai_demo_readiness',
    temporal_state: contradiction.severity === 'high' ? 'acute' : 'persistent',
    severity_label: contradiction.severity === 'high' ? 'material' : 'significant',
    confidence_level: 'high',
    sensitivity: contradiction.severity === 'high' ? 'high' : 'medium',
    stakes_score: contradiction.surfacingPriority,
    stakes_components: {
      executive_alignment: contradiction.severity === 'high' ? 4 : 3,
      delivery_risk: 4,
      customer_or_regulatory_risk: contradiction.key.includes('sustainability') ? 3 : 2,
    },
    evidence_ids: [],
    source_count: 3,
    implicated_priority_refs: ['apex-retail-ai-demo-readiness'],
    implicated_initiative_refs: contradiction.relatedUseCaseKeys.map((key) => `apex_retail_${key}`),
    implicated_person_ids: [],
    implicated_kpi_ids: [],
    implicated_external_event_ids: [],
    related_pattern_ids: contradiction.relatedPatterns,
    first_detected_at: '2026-05-09T00:00:00Z',
    last_refreshed_at: '2026-05-09T00:00:00Z',
    last_evidence_change_at: '2026-05-09T00:00:00Z',
    resolution_state: 'open',
    resolution_evidence_ids: [],
    reasoning_scope_id: null,
    disclosure_scope_id: null,
    suppress_until: null,
    surfacing_priority: contradiction.surfacingPriority,
    recommended_conversation_context: contradiction.suggestedAction,
    detection_rule_id: null,
    detection_run_id: null,
    created_by: 'agent_proposed',
    reviewer_notes: [],
  }));
}

function graphEdges(clientId: string) {
  return USE_CASES.flatMap((useCase) => [
    ...useCase.relatedPatterns.map((patternCode) => ({
      id: deterministicUuid(`edge:apex:${useCase.key}:applies_pattern:${patternCode}`),
      from_node_type: 'use_case',
      from_node_id: `apex_retail_${useCase.key}`,
      edge_type: 'applies_pattern',
      to_node_type: 'genome_pattern',
      to_node_id: patternCode,
      vertical: 'retail',
      weight: 0.84,
      evidence: { seeded_by: 'seed-apex-contradictions', client_id: clientId },
      source_key: 'apex_retail_demo_use_cases',
    })),
  ]);
}

async function main() {
  loadSeedEnv();
  const sb = createSeedClient();
  const client = await resolveApexClient(sb);

  const useCases = useCaseRows(client.id);
  await upsertRows(sb, 'use_cases', useCases, 'id');

  const useCaseIdsByKey = new Map(USE_CASES.map((useCase) => [useCase.key, deterministicUuid(`apex-retail-use-case:${useCase.key}`)]));
  await upsertRows(sb, 'contradictions', contradictionRows(client.id, useCaseIdsByKey), 'id');
  await upsertRows(
    sb,
    'intelligence_graph_edges',
    graphEdges(client.id),
    'from_node_type,from_node_id,edge_type,to_node_type,to_node_id',
  );

  const { count: useCaseCount, error: useCaseCountError } = await sb
    .from('use_cases')
    .select('id', { count: 'exact', head: true })
    .eq('client_id', client.id)
    .like('external_id', 'apex_retail_%');
  if (useCaseCountError) throw useCaseCountError;

  const { count: contradictionCount, error: contradictionCountError } = await sb
    .from('contradictions')
    .select('id', { count: 'exact', head: true })
    .eq('client_id', client.id)
    .in('id', CONTRADICTIONS.map((contradiction) => deterministicUuid(`apex-retail-contradiction:${contradiction.key}`)))
    .is('resolved_at', null);
  if (contradictionCountError) throw contradictionCountError;

  console.log(`Apex Retail use cases: ${useCaseCount ?? 0}`);
  console.log(`Apex Retail active contradictions: ${contradictionCount ?? 0}`);
}

const isDirect = process.argv[1] ? import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href : false;
if (isDirect) {
  main().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}
