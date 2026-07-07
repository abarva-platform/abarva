// pilot-data-loader-exception: global-static-corpus
// eslint-disable-next-line @typescript-eslint/no-explicit-any
// Airline genome patterns - NDC, Offer/Order Management & Modern Retailing
// Code range: A1800-A2099
// Run: npx tsx src/scripts/seed/seed-airline-dom06-ndc-oms.ts

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

export const AIRLINE_NDC_PATTERNS: AirlineNdcPatternSeed[] = [
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
  {
    code: 'A1830',
    name: 'NDC AI Offer Bypasses Inventory Reality Check',
    officeCategory: 'front_office',
    failureRatePct: 67,
    description:
      'NDC offer AI creates a personalized seat-and-bag bundle without a hard live-inventory gate at order creation. The customer buys a bundle containing a seat already sold through another channel, turning AI merchandising uplift into day-of-travel service recovery.',
    keywords: ['NDC AI', 'inventory gate', 'IATA ONE Order', 'seat bundle', 'order creation'],
    demoRelevant: true,
  },
  {
    code: 'A1831',
    name: 'Ancillary AI Pricing Breaches Floor Controls',
    officeCategory: 'middle_office',
    failureRatePct: 60,
    description:
      'Ancillary pricing AI tests seat and bag prices below finance-approved floors to maximize attach rate. Thousands of low-price transactions clear before revenue accounting detects the floor breach, erasing the margin benefit of the AI experiment.',
    keywords: ['ancillary AI', 'price floor', 'revenue accounting', 'attach rate', 'controls'],
    demoRelevant: true,
  },
  {
    code: 'A1832',
    name: 'Offer AI Uses Loyalty Data Without Consent Mapping',
    officeCategory: 'middle_office',
    failureRatePct: 58,
    description:
      'Offer personalization AI uses loyalty behavior and travel history before consent and purpose limits are mapped by market. The NDC channel becomes more relevant, but privacy teams cannot prove that GDPR and state privacy requirements were honored.',
    keywords: ['offer AI', 'loyalty data', 'GDPR', 'consent mapping', 'NDC'],
    demoRelevant: true,
  },
  {
    code: 'A1833',
    name: 'AI Bundle Optimizer Ignores Servicing Cost',
    officeCategory: 'middle_office',
    failureRatePct: 55,
    description:
      'Bundle AI optimizes conversion and ancillary revenue but does not include expected exchange, refund, call-center, and disruption-servicing cost. Source and Moves teams see attractive revenue uplift while the actual cost-to-serve rises in complex itineraries.',
    keywords: ['bundle AI', 'cost-to-serve', 'NDC servicing', 'refund', 'adoption telemetry'],
    demoRelevant: true,
  },
  {
    code: 'A1834',
    name: 'NDC GenAI Agent Quotes Unsupported Entitlements',
    officeCategory: 'front_office',
    failureRatePct: 62,
    description:
      'A generative AI shopping agent explains NDC offers in natural language but claims entitlements not present in the structured offer. Customers rely on the AI explanation, then agents must deny the benefit because the order record never contained it.',
    keywords: ['GenAI agent', 'NDC', 'structured offer', 'entitlement', 'model grounding'],
    demoRelevant: true,
  },
  {
    code: 'A1835',
    name: 'AI Offer Experiment Lacks Agency Holdout',
    officeCategory: 'middle_office',
    failureRatePct: 53,
    description:
      'NDC offer AI is tested only in direct digital channels and then rolled into agency channels without a TMC or OTA holdout. The airline cannot tell whether lower agency conversion is caused by the model, the agency desktop, or corporate policy controls.',
    keywords: ['NDC AI', 'agency holdout', 'TMC', 'OTA', 'experiment design'],
    demoRelevant: true,
  },
  {
    code: 'A1836',
    name: 'Order AI Fraud Signal Not Shared With Payment Controls',
    officeCategory: 'back_office',
    failureRatePct: 57,
    description:
      'Order-risk AI scores NDC transactions but the signal is not integrated with payment authorization, chargeback, or loyalty fraud controls. Suspicious orders receive personalized offers and clear ticketing before fraud teams see the risk.',
    keywords: ['order AI', 'fraud signal', 'payment control', 'chargeback', 'NDC'],
    demoRelevant: true,
  },
  {
    code: 'A1837',
    name: 'NDC AI Vendor Contract Missing Explainability Clause',
    officeCategory: 'back_office',
    failureRatePct: 59,
    description:
      'The AI offer vendor contract measures conversion uplift but does not require explainability for price, bundle, or ranking decisions. Source teams have no contractual basis to demand evidence when corporate buyers challenge why different travelers saw different offers.',
    keywords: ['NDC AI', 'vendor contract', 'explainability', 'corporate buyer', 'Source'],
    demoRelevant: true,
  },
];
