// Airline genome patterns - NDC, Offer/Order Management & Modern Retailing
// Code range: A1800-A2099
// Run: npx tsx src/scripts/seed/seed-airline-dom06-ndc-oms.ts

import path from 'node:path';
import { pathToFileURL } from 'node:url';
import type { SupabaseClient } from '@supabase/supabase-js';
import { deterministicUuid } from './contradiction-engine-lib';
import { createSeedClient, loadSeedEnv, slugify } from './seed-wave-lib';

type OfficeCategory = 'front_office' | 'middle_office' | 'back_office';

interface AirlineNdcPatternSeed {
  code: string;
  name: string;
  officeCategory: OfficeCategory;
  failureRatePct: number;
  description: string;
  keywords: string[];
  demoRelevant?: boolean;
}

const AIRLINE_NDC_PATTERNS: AirlineNdcPatternSeed[] = [
  {
    code: 'A1800',
    name: 'NDC Adoption Without Agency Tool Readiness',
    officeCategory: 'front_office',
    failureRatePct: 74,
    description:
      'NDC adoption fails when SkyHarbor enables rich offers and bundles but most corporate and leisure bookings still flow through GDS-connected agencies whose desktop and mid-office tools cannot render ancillaries. Agents see incomplete offers, double-bill bags or seats, and push customers back to EDIFACT paths that preserve old distribution cost while damaging channel trust.',
    keywords: ['NDC', 'GDS', 'EDIFACT', 'agency desktop', 'ancillary'],
    demoRelevant: true,
  },
  {
    code: 'A1801',
    name: 'Offer Price Not Reproducible At Order Create',
    officeCategory: 'front_office',
    failureRatePct: 69,
    description:
      'The NDC offer returned to an OTA cannot be recreated when the customer checks out because inventory and tax calculations are re-run without preserving the offer context. The customer sees a price jump at payment, and the partner blames SkyHarbor for violating IATA NDC offer/order traceability expectations.',
    keywords: ['NDC', 'IATA', 'offer/order', 'OTA', 'price traceability'],
    demoRelevant: true,
  },
  {
    code: 'A1802',
    name: 'Order Management Layer Duplicates PNR Truth',
    officeCategory: 'back_office',
    failureRatePct: 67,
    description:
      'Modern order records become a second source of truth when the OMS stores bundle, payment, and servicing state that is not synchronised with Altéa PNR and ticket coupons. Agents servicing a disrupted itinerary cannot tell whether the order or the PNR owns the latest entitlement, so refunds and exchanges are processed inconsistently.',
    keywords: ['OMS', 'PNR', 'Amadeus Altea', 'IATA ONE Order', 'ticket coupon'],
    demoRelevant: true,
  },
  {
    code: 'A1803',
    name: 'Ancillary Bundle Rendered Differently Across Channels',
    officeCategory: 'front_office',
    failureRatePct: 63,
    description:
      'The same branded fare bundle displays one bag, priority boarding, and seat selection on SkyHarbor.com but only a bag and seat on an NDC aggregator. The product attribute catalog is maintained separately by channel, so customers compare inconsistent bundles and accuse the airline or agency of bait-and-switch pricing.',
    keywords: ['branded fares', 'NDC', 'product catalog', 'ancillary bundle', 'IATA'],
  },
  {
    code: 'A1804',
    name: 'Servicing Rights Undefined For NDC Orders',
    officeCategory: 'middle_office',
    failureRatePct: 71,
    description:
      'NDC bookings stall during changes and refunds when the airline, agency, and aggregator have not agreed which party owns servicing after ticketing. Customers are bounced between call centers because the order can be viewed by all parties but exchange authority and waiver-code authority are not delegated in the API contract.',
    keywords: ['NDC servicing', 'IATA', 'refund', 'exchange', 'agency authority'],
    demoRelevant: true,
  },
  {
    code: 'A1805',
    name: 'NDC Schema Version Drift Between Partners',
    officeCategory: 'back_office',
    failureRatePct: 58,
    description:
      'SkyHarbor upgrades to a newer IATA NDC schema while several agency aggregators remain on older message versions. Optional fields become mandatory in practice, error handling degrades into generic failures, and partner certification queues stretch because each partner needs a separate mapping exception.',
    keywords: ['IATA NDC', 'schema version', 'aggregator', 'certification', 'API compatibility'],
  },
  {
    code: 'A1806',
    name: 'Dynamic Offer Engine Missing Fare Filing Guardrails',
    officeCategory: 'middle_office',
    failureRatePct: 60,
    description:
      'The dynamic offer engine creates personalized bundles that conflict with ATPCO-filed fare rules and market-specific restrictions. The customer receives an attractive offer, but ticketing fails because the underlying fare basis cannot legally support the included change right or ancillary entitlement.',
    keywords: ['dynamic offer', 'ATPCO', 'fare rules', 'NDC', 'offer engine'],
  },
  {
    code: 'A1807',
    name: 'Payment Authorization Split From Order State',
    officeCategory: 'back_office',
    failureRatePct: 62,
    description:
      'Payment authorization succeeds in the payment gateway but the OMS does not persist the final order state before the session expires. The customer sees a card hold with no confirmed itinerary, and finance must reconcile orphaned authorizations against orders that never reached ticketing.',
    keywords: ['payment authorization', 'OMS', 'PCI', 'order state', 'ticketing'],
  },
  {
    code: 'A1808',
    name: 'Agency Debit Memo Spike After NDC Launch',
    officeCategory: 'middle_office',
    failureRatePct: 65,
    description:
      'Debit memos spike after NDC launch because agency quality-control tools cannot validate rich offer conditions before ticketing. BSP/ARC audit later identifies missing tour codes, invalid private fare use, or unsupported ancillary exchanges that the agency desktop never surfaced.',
    keywords: ['debit memo', 'BSP', 'ARC', 'NDC', 'agency quality control'],
  },
  {
    code: 'A1809',
    name: 'NDC Content Parity Promised Before Parity Exists',
    officeCategory: 'front_office',
    failureRatePct: 57,
    description:
      'Sales promises corporate buyers that NDC has content parity with direct channels before all fare brands, ancillaries, and servicing flows are certified. Buyers shift volume into the NDC channel and immediately discover missing negotiated fares or missing post-ticketing support.',
    keywords: ['NDC content parity', 'corporate travel', 'negotiated fare', 'TMC', 'servicing'],
  },
  {
    code: 'A1810',
    name: 'One Order Conversion Leaves Coupon Accounting Behind',
    officeCategory: 'back_office',
    failureRatePct: 68,
    description:
      'The order-management roadmap moves commercial logic toward IATA ONE Order, but revenue accounting remains built around ticket coupons, EMDs, and flown-segment settlement. Finance cannot reconcile order-level entitlements to coupon-level revenue recognition without manual bridge tables.',
    keywords: ['IATA ONE Order', 'EMD', 'revenue accounting', 'ticket coupon', 'settlement'],
    demoRelevant: true,
  },
  {
    code: 'A1811',
    name: 'Offer Cache Serves Expired Availability',
    officeCategory: 'front_office',
    failureRatePct: 64,
    description:
      'NDC offer caching improves response time but serves expired inventory after fare buckets close in Altéa. Customers select offers that look available, but order creation fails when the cache is reconciled against live availability.',
    keywords: ['offer cache', 'NDC', 'Amadeus Altea', 'availability', 'fare bucket'],
  },
  {
    code: 'A1812',
    name: 'Corporate Policy Controls Lost In Rich Offers',
    officeCategory: 'front_office',
    failureRatePct: 56,
    description:
      'Corporate booking tools cannot evaluate SkyHarbor rich offers because the NDC response describes amenities but not the policy dimensions the buyer enforces. Travelers buy bundles that violate cabin, refundability, or ancillary rules, and the TMC must unwind the order manually.',
    keywords: ['corporate policy', 'NDC', 'TMC', 'rich offer', 'travel policy'],
  },
  {
    code: 'A1813',
    name: 'Interline NDC Order Cannot Be Serviced End-To-End',
    officeCategory: 'middle_office',
    failureRatePct: 70,
    description:
      'Interline itineraries are sold through NDC before partner airlines can exchange order-servicing messages reliably. A schedule change on the partner segment leaves the SkyHarbor order readable but not changeable, forcing agents back into EDIFACT and manual partner queues.',
    keywords: ['interline', 'NDC', 'EDIFACT', 'order servicing', 'partner carrier'],
  },
  {
    code: 'A1814',
    name: 'NDC Error Codes Too Generic For Agency Recovery',
    officeCategory: 'middle_office',
    failureRatePct: 59,
    description:
      'Agency tools receive generic NDC error responses such as offer not available or unable to price when the real issue is payment, inventory, fare rule, or SSR incompatibility. Agents cannot recover inside the workflow, so failed bookings move to phone support and inflate channel cost.',
    keywords: ['NDC error handling', 'agency workflow', 'SSR', 'fare rule', 'API observability'],
  },
  {
    code: 'A1815',
    name: 'Order Change Fee Logic Diverges From Fare Rule',
    officeCategory: 'middle_office',
    failureRatePct: 61,
    description:
      'The OMS calculates change fees from a product catalog rule while the PSS still enforces ATPCO fare rule text. Customers see one exchange price in the modern retailing layer and a different price when the coupon is reissued.',
    keywords: ['OMS', 'ATPCO', 'change fee', 'fare rule', 'coupon reissue'],
  },
  {
    code: 'A1816',
    name: 'NDC Certification Ignores IROPS Servicing Scenarios',
    officeCategory: 'middle_office',
    failureRatePct: 66,
    description:
      'Partner certification validates happy-path search, price, book, and pay flows but omits IROPS waivers, involuntary exchanges, and split-PNR recovery. The channel looks ready until the first weather event, when NDC orders cannot be reprotected at scale.',
    keywords: ['NDC certification', 'IROPS', 'involuntary exchange', 'waiver', 'reprotection'],
    demoRelevant: true,
  },
  {
    code: 'A1817',
    name: 'Fare Brand Taxonomy Not Governed Across Retail Teams',
    officeCategory: 'back_office',
    failureRatePct: 53,
    description:
      'Commercial teams create fare brands, merchandising teams create bundles, and digital teams create offer labels without a governed taxonomy. NDC responses become semantically inconsistent, making analytics, agency display, and customer comparison unreliable.',
    keywords: ['fare brand', 'taxonomy', 'NDC', 'merchandising', 'product catalog'],
  },
  {
    code: 'A1818',
    name: 'Loyalty Entitlements Missing From NDC Offer Context',
    officeCategory: 'front_office',
    failureRatePct: 60,
    description:
      'The NDC offer engine prices bags, seats, and priority services without consistently applying elite loyalty entitlements. High-value passengers see charges for benefits they should receive free, reducing trust in the direct-connect channel and driving calls to loyalty support.',
    keywords: ['loyalty entitlement', 'NDC', 'FFP', 'ancillary', 'elite status'],
  },
  {
    code: 'A1819',
    name: 'Refund Calculation Loses Bundle Component Traceability',
    officeCategory: 'back_office',
    failureRatePct: 63,
    description:
      'Refund engines struggle when an NDC order bundles fare, seat, bag, and priority boarding into one commercial offer without component-level traceability. Agents cannot explain refundable versus non-refundable portions, and disputes escalate because the customer receipt does not map to revenue-accounting components.',
    keywords: ['refund', 'NDC order', 'bundle component', 'revenue accounting', 'customer receipt'],
  },
  {
    code: 'A1820',
    name: 'NDC Shopping Latency Exceeds OTA Timeout Budget',
    officeCategory: 'front_office',
    failureRatePct: 55,
    description:
      'Rich offer generation calls loyalty, ancillary, pricing, and inventory services synchronously, pushing NDC response latency beyond OTA timeout budgets. Partners suppress SkyHarbor content or rank it lower because the API is too slow for metasearch and comparison-shopping flows.',
    keywords: ['NDC latency', 'OTA', 'metasearch', 'offer generation', 'API performance'],
  },
  {
    code: 'A1821',
    name: 'Order Audit Trail Missing Model Version',
    officeCategory: 'back_office',
    failureRatePct: 51,
    description:
      'Personalized NDC offers are generated by a model, but the order audit trail does not store model version, feature snapshot, or guardrail outcome. When regulators or corporate buyers challenge price fairness, SkyHarbor cannot reconstruct why two customers saw different offers.',
    keywords: ['model version', 'NDC', 'audit trail', 'personalized offer', 'AI governance'],
  },
  {
    code: 'A1822',
    name: 'Agency Incentive Program Not Updated For NDC Economics',
    officeCategory: 'middle_office',
    failureRatePct: 49,
    description:
      'Agency incentives remain tied to legacy GDS segment volume after SkyHarbor asks agencies to adopt NDC. The commercial signal rewards old-channel behavior, so agencies keep booking through EDIFACT even when NDC content is technically available.',
    keywords: ['agency incentive', 'GDS segment', 'NDC adoption', 'EDIFACT', 'distribution economics'],
  },
  {
    code: 'A1823',
    name: 'Split Payment Unsupported In Order Create Flow',
    officeCategory: 'front_office',
    failureRatePct: 52,
    description:
      'The NDC order-create flow assumes one form of payment, but leisure customers often combine voucher, card, and loyalty points. Orders fail or require call-center completion because the modern retailing layer cannot express split tender cleanly to payment and ticketing systems.',
    keywords: ['split payment', 'NDC', 'voucher', 'loyalty points', 'PCI'],
  },
  {
    code: 'A1824',
    name: 'NDC Tax Calculation Not Matched To Ticketing Tax Engine',
    officeCategory: 'back_office',
    failureRatePct: 58,
    description:
      'The NDC offer layer estimates taxes and fees before ticketing, but the PSS tax engine applies a different market rule at coupon issuance. Small differences become large reconciliation problems at scale, especially on international itineraries with airport-specific fees.',
    keywords: ['tax calculation', 'NDC', 'PSS', 'ticketing', 'international fees'],
  },
  {
    code: 'A1825',
    name: 'Rich Content Images Not Governed For Accessibility',
    officeCategory: 'front_office',
    failureRatePct: 46,
    description:
      'NDC rich content includes branded images and amenity descriptions that are not checked for WCAG accessibility or localization before distribution to partners. Customers using assistive technology receive incomplete product information, and partner displays vary by market.',
    keywords: ['rich content', 'WCAG', 'NDC', 'localization', 'accessibility'],
  },
  {
    code: 'A1826',
    name: 'Order Fulfillment Queue Has No Operational Owner',
    officeCategory: 'back_office',
    failureRatePct: 62,
    description:
      'Failed order fulfillment events accumulate in a technical queue owned by neither digital commerce nor airport operations. Customers hold paid orders that need manual repair, but no team has an SLA for clearing the queue before day-of-travel.',
    keywords: ['order fulfillment', 'OMS', 'SLA', 'day-of-travel', 'operations queue'],
  },
  {
    code: 'A1827',
    name: 'NDC Rollout Masks True Distribution Cost',
    officeCategory: 'middle_office',
    failureRatePct: 54,
    description:
      'Distribution dashboards celebrate GDS segment-fee reduction but omit aggregator fees, API support cost, certification spend, and increased call-center handling. The NDC business case appears positive while total cost-to-serve has barely moved.',
    keywords: ['distribution cost', 'NDC', 'GDS', 'aggregator fee', 'business case'],
  },
  {
    code: 'A1828',
    name: 'Offer Personalization Violates Corporate Fare Commitments',
    officeCategory: 'middle_office',
    failureRatePct: 57,
    description:
      'Personalized offers use loyalty and search behavior to vary price or bundle treatment for travelers attached to a corporate account. The result conflicts with negotiated fare commitments, creating buyer distrust and audit disputes during quarterly business reviews.',
    keywords: ['personalized offer', 'corporate fare', 'NDC', 'QBR', 'contract compliance'],
  },
  {
    code: 'A1829',
    name: 'NDC Fallback Path Sends Customers To Legacy Fare Rules',
    officeCategory: 'front_office',
    failureRatePct: 56,
    description:
      'When NDC shopping fails, the fallback redirects customers to legacy EDIFACT fares with a different product display and servicing model. Customers interpret the fallback as a price or benefit change rather than resilience, and agents must explain why the same trip behaves differently by channel.',
    keywords: ['NDC fallback', 'EDIFACT', 'fare rules', 'channel consistency', 'customer experience'],
  },
];

function graphEdgesFor(pattern: AirlineNdcPatternSeed): Array<Record<string, unknown>> {
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
      evidence: { seeded_by: 'seed-airline-dom06-ndc-oms', office_category: pattern.officeCategory },
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
      evidence: { seeded_by: 'seed-airline-dom06-ndc-oms', keywords: pattern.keywords },
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

  const patternRows = AIRLINE_NDC_PATTERNS.map((pattern) => ({
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

  const graphEdges = AIRLINE_NDC_PATTERNS.flatMap(graphEdgesFor);

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
    .gte('code', 'A1800')
    .lte('code', 'A2099');
  if (patternCountError) throw patternCountError;

  const { count: edgeCount, error: edgeCountError } = await sb
    .from('intelligence_graph_edges')
    .select('id', { count: 'exact', head: true })
    .eq('vertical', 'airline')
    .in('from_node_id', AIRLINE_NDC_PATTERNS.map((pattern) => pattern.code));
  if (edgeCountError) throw edgeCountError;

  console.log(`Seeded airline NDC/OMS Genome patterns: ${patternCount ?? 0}`);
  console.log(`Seeded airline NDC/OMS Genome graph edges: ${edgeCount ?? 0}`);
}

const isDirect = process.argv[1] ? import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href : false;
if (isDirect) {
  main().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}
