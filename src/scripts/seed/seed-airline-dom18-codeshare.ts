// Airline genome patterns - Codeshare, Alliance & Interlining
// Code range: A5400-A5699
// Run: npx tsx src/scripts/seed/seed-airline-dom18-codeshare.ts

import path from 'node:path';
import { pathToFileURL } from 'node:url';
import type { SupabaseClient } from '@supabase/supabase-js';
import { deterministicUuid } from './contradiction-engine-lib';
import { createSeedClient, loadSeedEnv, slugify } from './seed-wave-lib';

type OfficeCategory = 'front_office' | 'middle_office' | 'back_office';

interface AirlineCodesharePatternSeed {
  code: string;
  name: string;
  officeCategory: OfficeCategory;
  failureRatePct: number;
  description: string;
  keywords: string[];
  demoRelevant?: boolean;
}

const AIRLINE_CODESHARE_PATTERNS: AirlineCodesharePatternSeed[] = [
  {
    code: 'A5400',
    name: 'Codeshare Availability Desynchronizes During Schedule Change',
    officeCategory: 'middle_office',
    failureRatePct: 64,
    description:
      'Marketing and operating carrier availability diverge after schedule changes because partner updates arrive later than SkyHarbor inventory changes. Customers book or service an itinerary that one carrier sees as valid and the other sees as stale.',
    keywords: ['codeshare', 'availability', 'schedule change', 'partner CRS', 'GDS'],
    demoRelevant: true,
  },
  {
    code: 'A5401',
    name: 'Interline Baggage Rule Not Preserved At Reissue',
    officeCategory: 'front_office',
    failureRatePct: 58,
    description:
      'A reissued interline itinerary loses the original baggage allowance or through-check rule when fare and ticketing data are recalculated by the validating carrier. The passenger discovers the mismatch at airport bag drop, where neither carrier wants to own the exception.',
    keywords: ['interline baggage', 'reissue', 'IATA Resolution 302', 'validating carrier', 'bag drop'],
  },
  {
    code: 'A5402',
    name: 'Alliance Status Benefits Not Recognized By Partner DCS',
    officeCategory: 'front_office',
    failureRatePct: 55,
    description:
      'Alliance elite benefits are displayed during booking but do not flow into the operating carrier departure control system. Lounge, seat, boarding, and bag benefits must be manually adjudicated at the airport, eroding the alliance promise for high-value customers.',
    keywords: ['alliance status', 'DCS', 'elite benefits', 'lounge', 'partner carrier'],
  },
  {
    code: 'A5403',
    name: 'Prorate Agreement Not Reflected In Route Profitability',
    officeCategory: 'middle_office',
    failureRatePct: 61,
    description:
      'Route profitability dashboards show gross itinerary revenue without applying prorate agreement economics across codeshare and interline partners. Commercial teams grow traffic that looks strategic but sends too much flown value to the partner.',
    keywords: ['prorate agreement', 'IATA SIS', 'route profitability', 'codeshare', 'flown revenue'],
  },
  {
    code: 'A5404',
    name: 'Partner Disruption Data Arrives After Recovery Window',
    officeCategory: 'middle_office',
    failureRatePct: 66,
    description:
      'SkyHarbor receives partner delay and cancellation data after its own reaccommodation window has already closed. Customers on partner-operated segments are protected too late, and agents must manually call partner desks for recovery options.',
    keywords: ['partner disruption', 'reaccommodation', 'IROPS', 'interline', 'operations control'],
    demoRelevant: true,
  },
  {
    code: 'A5405',
    name: 'Marketing Carrier Owns Complaint Without Operating Evidence',
    officeCategory: 'front_office',
    failureRatePct: 52,
    description:
      'Customers complain to the marketing carrier, but operational evidence such as boarding, baggage, seat, and delay reason lives with the operating carrier. Customer relations cannot resolve claims quickly because evidence rights were not built into the partnership process.',
    keywords: ['marketing carrier', 'operating carrier', 'customer complaint', 'evidence rights', 'codeshare'],
  },
  {
    code: 'A5406',
    name: 'Alliance Minimum Connection Time Not Station-Specific',
    officeCategory: 'middle_office',
    failureRatePct: 57,
    description:
      'Alliance connection rules use published MCT but do not incorporate terminal construction, security rescreening, bus gates, and partner transfer-desk constraints. The itinerary is legal in the tariff and unreliable in the airport.',
    keywords: ['MCT', 'alliance connection', 'terminal transfer', 'partner desk', 'misconnect'],
  },
  {
    code: 'A5407',
    name: 'Frequent Flyer Accrual Rules Drift Across Partners',
    officeCategory: 'middle_office',
    failureRatePct: 54,
    description:
      'Partner earning rules change by fare family, booking class, and marketed flight number but are not synchronized across loyalty and booking systems. Customers receive incorrect miles or status credit, and loyalty service teams absorb avoidable manual claims.',
    keywords: ['FFP accrual', 'partner airline', 'fare family', 'booking class', 'loyalty claim'],
  },
  {
    code: 'A5408',
    name: 'Interline Ticketing Authority Missing For Self-Service Change',
    officeCategory: 'front_office',
    failureRatePct: 59,
    description:
      'The app offers self-service change for interline itineraries but lacks ticketing authority for partner-controlled coupons. The customer reaches payment or confirmation and then fails into a call-center path that cannot easily explain the authority gap.',
    keywords: ['interline ticketing', 'self-service change', 'coupon', 'ticketing authority', 'mobile app'],
  },
  {
    code: 'A5409',
    name: 'Alliance Data Sharing Clause Excludes AI Use',
    officeCategory: 'back_office',
    failureRatePct: 51,
    description:
      'Alliance contracts allow operational and loyalty data sharing but do not clarify whether shared partner data can train or ground AI models. Digital teams pause personalization and disruption AI use cases because data rights are ambiguous.',
    keywords: ['alliance data', 'AI use rights', 'contract clause', 'Source', 'data sharing'],
    demoRelevant: true,
  },
  {
    code: 'A5410',
    name: 'Partner Reaccommodation AI Ignores Ticketing Authority',
    officeCategory: 'middle_office',
    failureRatePct: 63,
    description:
      'Reaccommodation AI recommends partner flights during disruption but does not verify ticketing authority, endorsement rules, or partner inventory confirmation. Agents receive seemingly optimal options that cannot be issued without manual partner intervention.',
    keywords: ['reaccommodation AI', 'ticketing authority', 'IROPS', 'interline', 'partner inventory'],
    demoRelevant: true,
  },
  {
    code: 'A5411',
    name: 'Alliance Offer AI Violates Partner Display Rules',
    officeCategory: 'front_office',
    failureRatePct: 55,
    description:
      'Offer AI ranks partner-operated itineraries using conversion and margin signals but ignores alliance display rules and neutrality commitments. The airline risks partner disputes when its retailing algorithm appears to bias traffic away from agreed display treatment.',
    keywords: ['offer AI', 'alliance display', 'partner rules', 'NDC', 'ranking'],
    demoRelevant: true,
  },
  {
    code: 'A5412',
    name: 'Interline Fraud AI Lacks Cross-Carrier Feedback Loop',
    officeCategory: 'middle_office',
    failureRatePct: 54,
    description:
      'Fraud AI scores interline bookings using SkyHarbor data but does not receive timely chargeback, no-show, or fraud-confirmation feedback from partner carriers. The model learns slowly and underestimates fraud patterns that span carriers.',
    keywords: ['fraud AI', 'interline', 'chargeback', 'feedback loop', 'model learning'],
    demoRelevant: true,
  },
  {
    code: 'A5413',
    name: 'Codeshare GenAI Agent Misstates Operating Carrier Policy',
    officeCategory: 'front_office',
    failureRatePct: 58,
    description:
      'A GenAI service agent explains baggage, seat, refund, or lounge rules using SkyHarbor policy even when the operating carrier controls the segment. Customers receive confident answers that are wrong at the partner airport.',
    keywords: ['GenAI agent', 'codeshare', 'operating carrier', 'policy grounding', 'customer service'],
    demoRelevant: true,
  },
  {
    code: 'A5414',
    name: 'AI Connection Optimizer Missing Partner SLA Data',
    officeCategory: 'middle_office',
    failureRatePct: 56,
    description:
      'Connection optimization AI scores itineraries using schedule and airport data but not partner transfer-desk staffing, baggage transfer SLA, or historical partner delay recovery. The model sells connections that are mathematically legal and operationally fragile.',
    keywords: ['connection AI', 'partner SLA', 'baggage transfer', 'MCT', 'model feature'],
    demoRelevant: true,
  },
  {
    code: 'A5415',
    name: 'Alliance AI Contract Missing Incident Cooperation Rights',
    officeCategory: 'back_office',
    failureRatePct: 52,
    description:
      'AI tools that optimize alliance traffic, servicing, or recovery are procured without partner incident-cooperation rights. When a model-influenced decision fails across carriers, Source teams cannot compel partner evidence quickly enough for audit or customer remediation.',
    keywords: ['alliance AI', 'incident cooperation', 'Source', 'partner evidence', 'contract rights'],
    demoRelevant: true,
  },
  {
    code: 'A5416',
    name: 'Codeshare AI Forecast Double-Counts Partner Demand',
    officeCategory: 'middle_office',
    failureRatePct: 53,
    description:
      'Demand AI ingests both SkyHarbor bookings and partner codeshare bookings without de-duplicating shared itineraries. Forecasts overstate demand, causing inventory protection and pricing decisions to skew toward phantom partner traffic.',
    keywords: ['demand AI', 'codeshare', 'deduplication', 'forecast', 'inventory protection'],
    demoRelevant: true,
  },
  {
    code: 'A5417',
    name: 'Partner API Latency Hidden By Average Response Metrics',
    officeCategory: 'back_office',
    failureRatePct: 49,
    description:
      'Partner API performance is reported as average response time, hiding tail latency that breaks shopping, servicing, and disruption recovery flows. The alliance looks technically healthy while high-value exception workflows time out.',
    keywords: ['partner API', 'tail latency', 'servicing', 'NDC', 'exception workflow'],
  },
  {
    code: 'A5418',
    name: 'Joint Venture Revenue Share Not Linked To Customer Promise',
    officeCategory: 'middle_office',
    failureRatePct: 47,
    description:
      'Joint venture economics are optimized at the revenue-share level while service failures, baggage misses, and lounge access disputes are measured separately. The partnership grows revenue while customer trust erodes in the seams between carriers.',
    keywords: ['joint venture', 'revenue share', 'customer promise', 'baggage', 'lounge access'],
  },
  {
    code: 'A5419',
    name: 'Partner Schedule Change Queue Not Prioritized By Customer Value',
    officeCategory: 'middle_office',
    failureRatePct: 50,
    description:
      'Schedule change queues for partner-operated segments are processed FIFO rather than by customer value, misconnect risk, or departure proximity. High-value and near-term customers wait behind low-risk changes, increasing avoidable escalations.',
    keywords: ['schedule change', 'partner segment', 'queue priority', 'customer value', 'misconnect'],
  },
  {
    code: 'A5420',
    name: 'Interline Settlement Dispute Data Not Fed To Sourcing',
    officeCategory: 'back_office',
    failureRatePct: 46,
    description:
      'Settlement disputes, debit memos, and partner recovery friction are handled in finance and operations but not fed into sourcing or alliance renewal decisions. Commercial teams renew partner terms without evidence of operational cost-to-serve.',
    keywords: ['interline settlement', 'debit memo', 'IATA SIS', 'Source', 'partner renewal'],
  },
  {
    code: 'A5421',
    name: 'Partner Lounge Entitlement Not Synced To Day-Of-Travel',
    officeCategory: 'front_office',
    failureRatePct: 48,
    description:
      'Partner lounge entitlements are checked at booking and loyalty profile sync, but day-of-travel changes such as upgrades, disruptions, and status changes are not reflected at lounge entry. Premium customers are denied benefits the airline believes it has granted.',
    keywords: ['lounge entitlement', 'loyalty status', 'day-of-travel', 'partner carrier', 'premium customer'],
  },
  {
    code: 'A5422',
    name: 'Codeshare Complaint Ownership Not Defined By Failure Type',
    officeCategory: 'front_office',
    failureRatePct: 45,
    description:
      'Complaint ownership is defined by marketing versus operating carrier but not by failure type such as bag, seat, refund, lounge, delay, or accessibility issue. Customers are transferred across carriers because each team owns only part of the problem.',
    keywords: ['complaint ownership', 'codeshare', 'operating carrier', 'accessibility', 'refund'],
  },
  {
    code: 'A5423',
    name: 'Interline Accessibility Request Dropped At Partner Boundary',
    officeCategory: 'front_office',
    failureRatePct: 57,
    description:
      'Wheelchair, medical, or assistance SSRs are captured by SkyHarbor but not acknowledged by the operating partner within the required servicing window. The customer itinerary looks confirmed while accessibility support is unconfirmed at the connection point.',
    keywords: ['accessibility SSR', 'interline', 'partner acknowledgment', 'PRM', 'connection'],
  },
  {
    code: 'A5424',
    name: 'Alliance Dashboard Measures Volume Not Exception Quality',
    officeCategory: 'middle_office',
    failureRatePct: 44,
    description:
      'Alliance dashboards emphasize passenger volume, revenue share, and load factor while exception quality is invisible. The partnership looks healthy until disruption, baggage, refund, and complaint data reveal poor seam management.',
    keywords: ['alliance dashboard', 'exception quality', 'revenue share', 'baggage', 'refund'],
  },
  {
    code: 'A5425',
    name: 'Partner Data Retention Conflicts With Subject Access Request',
    officeCategory: 'back_office',
    failureRatePct: 49,
    description:
      'Passenger data is shared across partner carriers with different retention and retrieval policies. A GDPR or privacy access request requires evidence from multiple carriers, and the alliance cannot produce a timely complete record.',
    keywords: ['GDPR', 'data retention', 'partner data', 'subject access request', 'privacy'],
  },
  {
    code: 'A5426',
    name: 'Codeshare Fare Rules Not Translated Into Agent Workflow',
    officeCategory: 'front_office',
    failureRatePct: 51,
    description:
      'Fare rules for partner-operated codeshares are technically loaded but not translated into clear agent workflows for exchanges, refunds, and waivers. Agents interpret rule text manually, creating inconsistent customer outcomes.',
    keywords: ['codeshare fare rule', 'agent workflow', 'exchange', 'waiver', 'refund'],
  },
  {
    code: 'A5427',
    name: 'Alliance Migration Plan Omits Partner Test Windows',
    officeCategory: 'back_office',
    failureRatePct: 54,
    description:
      'PSS or NDC migration plans assume partners can test on SkyHarbor timelines, but alliance partners have their own release freezes and certification queues. Internal readiness is achieved before partner readiness, creating external channel failures.',
    keywords: ['alliance migration', 'partner testing', 'PSS migration', 'certification', 'release freeze'],
    demoRelevant: true,
  },
  {
    code: 'A5428',
    name: 'Interline Tax Handling Diverges By Validating Carrier',
    officeCategory: 'back_office',
    failureRatePct: 46,
    description:
      'Tax and fee handling differs between validating carriers for complex international itineraries, especially after reissue. Customers and finance teams see small discrepancies that become large reconciliation and dispute volumes across the partnership.',
    keywords: ['interline tax', 'validating carrier', 'reissue', 'international itinerary', 'reconciliation'],
  },
  {
    code: 'A5429',
    name: 'Alliance Move Business Case Ignores Operational Seams',
    officeCategory: 'middle_office',
    failureRatePct: 48,
    description:
      'Alliance and codeshare Moves are justified on network reach and revenue but underweight servicing seams, baggage transfer, accessibility, complaint evidence, and partner API maturity. The strategic case is right, yet the operating proof needed for value realization is missing.',
    keywords: ['alliance Move', 'business case', 'operational seam', 'value realization', 'partner API'],
    demoRelevant: true,
  },
];

function graphEdgesFor(pattern: AirlineCodesharePatternSeed): Array<Record<string, unknown>> {
  const officeNode = `airline:${pattern.officeCategory}`;
  const capabilityNode = `airline:${slugify(pattern.keywords[0] ?? pattern.name)}`;
  return [
    {
      id: deterministicUuid(`edge:${pattern.code}:belongs_to:${officeNode}`),
      from_node_type: 'genome_pattern',
      from_node_id: pattern.code,
      edge_type: 'belongs_to',
      to_node_type: 'office_category',
      to_node_id: officeNode,
      vertical: 'airline',
      weight: 1,
      evidence: { seeded_by: 'seed-airline-dom18-codeshare', office_category: pattern.officeCategory },
      source_key: 'skyharbor-air',
    },
    {
      id: deterministicUuid(`edge:${pattern.code}:applies_to:${capabilityNode}`),
      from_node_type: 'genome_pattern',
      from_node_id: pattern.code,
      edge_type: 'applies_to',
      to_node_type: 'airline_capability',
      to_node_id: capabilityNode,
      vertical: 'airline',
      weight: 0.82,
      evidence: { seeded_by: 'seed-airline-dom18-codeshare', keywords: pattern.keywords },
      source_key: 'skyharbor-air',
    },
  ];
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

async function main() {
  loadSeedEnv();
  const sb = createSeedClient();

  const patternRows = AIRLINE_CODESHARE_PATTERNS.map((pattern) => ({
    id: deterministicUuid(`airline-genome-pattern:${pattern.code}`),
    pattern_type: 'failure_pattern',
    vertical: 'airline',
    sub_category: pattern.officeCategory,
    data: {
      code: pattern.code,
      name: pattern.name,
      description: pattern.description,
      office_category: pattern.officeCategory,
      keywords: pattern.keywords,
      demo_seed: true,
      demo_relevant: pattern.demoRelevant ?? false,
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

  const graphEdges = AIRLINE_CODESHARE_PATTERNS.flatMap(graphEdgesFor);

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
    .eq('vertical', 'airline')
    .gte('code', 'A5400')
    .lte('code', 'A5699');
  if (patternCountError) throw patternCountError;

  const { count: edgeCount, error: edgeCountError } = await sb
    .from('intelligence_graph_edges')
    .select('id', { count: 'exact', head: true })
    .eq('vertical', 'airline')
    .in('from_node_id', AIRLINE_CODESHARE_PATTERNS.map((pattern) => pattern.code));
  if (edgeCountError) throw edgeCountError;

  console.log(`Seeded airline codeshare/interlining Genome patterns: ${patternCount ?? 0}`);
  console.log(`Seeded airline codeshare/interlining Genome graph edges: ${edgeCount ?? 0}`);
}

const isDirect = process.argv[1] ? import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href : false;
if (isDirect) {
  main().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}
