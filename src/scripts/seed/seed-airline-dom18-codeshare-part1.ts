// pilot-data-loader-exception: global-static-corpus
// eslint-disable-next-line @typescript-eslint/no-explicit-any
// Airline genome patterns - Codeshare, Alliance & Interlining
// Code range: A5400-A5459
// Run: npx tsx src/scripts/seed/seed-airline-dom18-codeshare-part1.ts

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

export const AIRLINE_CODESHARE_PATTERNS: AirlineCodesharePatternSeed[] = [
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
  {
    code: 'A5430',
    name: 'Partner Disruption Waiver Not Propagated To Retail Channels',
    officeCategory: 'front_office',
    failureRatePct: 53,
    description:
      'A disruption waiver agreed with an alliance partner is loaded into agent servicing rules but not propagated into mobile, web, or partner self-service channels. Customers eligible for no-fee changes are routed into paid-change flows or call-center queues, creating avoidable complaints during the disruption peak.',
    keywords: ['disruption waiver', 'self-service', 'alliance partner', 'retail channel', 'IROPS'],
    demoRelevant: true,
  },
  {
    code: 'A5431',
    name: 'Codeshare Accessibility Evidence Missing From Audit File',
    officeCategory: 'back_office',
    failureRatePct: 50,
    description:
      'Accessibility requests appear complete in SkyHarbor records, but partner acknowledgement, station handoff, and day-of-service evidence are stored outside the audit file. Compliance teams cannot prove the end-to-end assistance chain when a DOT complaint arrives.',
    keywords: ['accessibility', 'DOT complaint', 'partner acknowledgment', 'audit evidence', 'SSR'],
    demoRelevant: true,
  },
  {
    code: 'A5432',
    name: 'Interline Refund Queue Excludes Partner Coupon State',
    officeCategory: 'back_office',
    failureRatePct: 56,
    description:
      'Refund automation evaluates SkyHarbor ticket rules without checking whether partner coupons are open, flown, suspended, or under dispute. The airline either delays valid refunds or issues money before settlement evidence confirms partner liability.',
    keywords: ['interline refund', 'coupon status', 'settlement', 'IATA SIS', 'refund automation'],
  },
  {
    code: 'A5433',
    name: 'Alliance API Contract Missing Degradation Playbook',
    officeCategory: 'back_office',
    failureRatePct: 54,
    description:
      'Partner API agreements define uptime but not graceful degradation steps when shopping, servicing, or disruption endpoints slow down. Source teams have no enforceable playbook for cache freshness, manual fallback, customer messaging, or settlement of failure costs.',
    keywords: ['partner API', 'degradation playbook', 'Source', 'SLA', 'fallback'],
    demoRelevant: true,
  },
  {
    code: 'A5434',
    name: 'Partner Seat Map Drift Breaks Paid Seat Promise',
    officeCategory: 'front_office',
    failureRatePct: 57,
    description:
      'SkyHarbor sells partner-operated paid seats using cached seat maps that lag aircraft swaps, blocked seats, and partner inventory controls. Customers pay for a seat attribute that cannot be honored by the operating carrier.',
    keywords: ['seat map', 'paid seat', 'codeshare', 'aircraft swap', 'ancillary'],
  },
  {
    code: 'A5435',
    name: 'Joint Venture KPI Hides High-Value Customer Friction',
    officeCategory: 'middle_office',
    failureRatePct: 48,
    description:
      'Joint venture scorecards average operational performance across all passengers and do not isolate elite, premium-cabin, corporate, or accessibility-sensitive journeys. The partnership can hit aggregate KPIs while failing the customer segments most important to strategic value.',
    keywords: ['joint venture', 'KPI', 'premium customer', 'corporate travel', 'customer friction'],
    demoRelevant: true,
  },
  {
    code: 'A5436',
    name: 'Partner Waiver AI Applies Wrong Jurisdiction Rule',
    officeCategory: 'middle_office',
    failureRatePct: 55,
    description:
      'A waiver AI recommends refund or exchange treatment without distinguishing DOT, EU261, UK261, and local consumer-protection rules across partner-operated segments. The servicing action looks consistent but violates the jurisdiction attached to the operating flight.',
    keywords: ['waiver AI', 'EU261', 'DOT', 'consumer protection', 'partner segment'],
    demoRelevant: true,
  },
  {
    code: 'A5437',
    name: 'Alliance GenAI Summary Drops Operating Carrier Caveat',
    officeCategory: 'front_office',
    failureRatePct: 52,
    description:
      'GenAI servicing summaries compress complex interline itineraries into simple customer-facing guidance and omit the operating-carrier caveat. Agents and customers rely on a clean answer that hides which carrier actually controls seats, bags, refunds, or boarding rules.',
    keywords: ['GenAI summary', 'operating carrier', 'policy caveat', 'customer service', 'codeshare'],
    demoRelevant: true,
  },
  {
    code: 'A5438',
    name: 'Codeshare Loyalty AI Optimizes Credit Not Trust',
    officeCategory: 'middle_office',
    failureRatePct: 49,
    description:
      'Loyalty AI prioritizes mileage-credit closure rates but not the customer effort required to resolve partner accrual misses. The model improves a finance-facing metric while elite members experience repeated proof requests and manual claims.',
    keywords: ['loyalty AI', 'partner accrual', 'elite member', 'customer effort', 'mileage credit'],
    demoRelevant: true,
  },
  {
    code: 'A5439',
    name: 'Partner Baggage Evidence Not Linked To Claims Automation',
    officeCategory: 'back_office',
    failureRatePct: 53,
    description:
      'Baggage scan evidence from partner carriers is available in operations feeds but not linked to claims automation or customer relations. The airline pays, denies, or delays claims without a complete chain-of-custody view.',
    keywords: ['baggage evidence', 'claims automation', 'chain of custody', 'partner carrier', 'bag scan'],
  },
  {
    code: 'A5440',
    name: 'Interline Offer Cache Sells Expired Partner Fares',
    officeCategory: 'front_office',
    failureRatePct: 54,
    description:
      'Shopping cache rules keep partner fares available after a partner files an update, closes a class, or changes private fare terms. Customers see attractive itineraries that fail at pricing or ticketing, increasing look-to-book waste.',
    keywords: ['interline offer', 'fare cache', 'partner fare', 'ticketing failure', 'shopping'],
  },
  {
    code: 'A5441',
    name: 'Alliance Move Gate Missing Partner Readiness Evidence',
    officeCategory: 'middle_office',
    failureRatePct: 58,
    description:
      'A Move that depends on partner channels proceeds through internal gates without requiring partner test evidence, API maturity, operations playbooks, or customer-support readiness. The initiative is approved as if SkyHarbor controls the whole journey when value depends on shared execution.',
    keywords: ['alliance Move', 'approval gate', 'partner readiness', 'API maturity', 'value realization'],
    demoRelevant: true,
  },
  {
    code: 'A5442',
    name: 'Operating Carrier Data Masking Blocks Root Cause Analysis',
    officeCategory: 'back_office',
    failureRatePct: 47,
    description:
      'Partner data-sharing controls mask delay, seat, bag, or servicing details needed to diagnose recurring customer failures. Privacy protections are valid, but the partnership never defines a de-identified evidence package for operational root cause analysis.',
    keywords: ['data masking', 'root cause analysis', 'partner data', 'privacy', 'operational evidence'],
  },
  {
    code: 'A5443',
    name: 'Codeshare AI Personalization Uses Unapproved Partner Attributes',
    officeCategory: 'front_office',
    failureRatePct: 51,
    description:
      'Personalization AI uses partner loyalty status, disruption history, or service-request attributes without explicit authorization in the data-sharing agreement. The model creates relevant offers but exposes the alliance to privacy and contract-use disputes.',
    keywords: ['personalization AI', 'data sharing', 'partner attributes', 'privacy', 'contract use'],
    demoRelevant: true,
  },
  {
    code: 'A5444',
    name: 'Partner Recovery Cost Not Charged To Failure Source',
    officeCategory: 'back_office',
    failureRatePct: 46,
    description:
      'Reaccommodation, hotel, meal, and call-center costs triggered by partner disruption are booked to generic recovery accounts. Finance cannot connect cost leakage to the partner, route, station, or contract clause that caused the failure.',
    keywords: ['recovery cost', 'partner disruption', 'cost allocation', 'contract clause', 'finance'],
  },
  {
    code: 'A5445',
    name: 'Alliance RFP Ignores Day-Two Servicing Burden',
    officeCategory: 'back_office',
    failureRatePct: 52,
    description:
      'RFPs for alliance technology emphasize shopping, selling, and conversion while underweighting changes, refunds, accessibility, baggage, complaint evidence, and disruption servicing. Source teams pick a strong booking platform that leaves day-two operations under-supported.',
    keywords: ['alliance RFP', 'Source', 'servicing burden', 'refund', 'accessibility'],
    demoRelevant: true,
  },
  {
    code: 'A5446',
    name: 'Partner Schedule Quality Excluded From Corporate SLAs',
    officeCategory: 'middle_office',
    failureRatePct: 45,
    description:
      'Corporate travel SLAs report SkyHarbor-operated performance but exclude partner-operated schedule changes, misconnections, and downgrade outcomes. Corporate accounts experience the full itinerary while account teams defend only the SkyHarbor slice.',
    keywords: ['corporate travel', 'partner schedule', 'SLA', 'misconnect', 'downgrade'],
  },
  {
    code: 'A5447',
    name: 'Interline Servicing Bot Cannot Escalate With Evidence Bundle',
    officeCategory: 'front_office',
    failureRatePct: 50,
    description:
      'A servicing bot can recognize interline exceptions but cannot package ticket, coupon, partner policy, bag, and disruption evidence for escalation. Human agents inherit an incomplete case and restart investigation from scratch.',
    keywords: ['servicing bot', 'interline', 'evidence bundle', 'escalation', 'customer service'],
    demoRelevant: true,
  },
  {
    code: 'A5448',
    name: 'Codeshare Security Review Misses Partner Token Scope',
    officeCategory: 'back_office',
    failureRatePct: 49,
    description:
      'Security review validates SkyHarbor APIs but not partner token scopes, refresh behavior, or least-privilege access in joint servicing flows. A compromised integration credential can expose more itinerary or loyalty data than the partnership intended.',
    keywords: ['security review', 'partner token', 'least privilege', 'API access', 'loyalty data'],
  },
  {
    code: 'A5449',
    name: 'Alliance Control Tower Lacks Exception Owner',
    officeCategory: 'middle_office',
    failureRatePct: 47,
    description:
      'Control Tower reporting shows alliance revenue, volume, and operational incidents but does not assign accountable owners for recurring cross-carrier exceptions. Problems stay visible without becoming Moves with sponsors, gates, and value outcomes.',
    keywords: ['Control Tower', 'exception owner', 'alliance', 'Moves', 'accountability'],
    demoRelevant: true,
  },
  {
    code: 'A5450',
    name: 'Partner Settlement AI Learns From Disputed Memos',
    officeCategory: 'back_office',
    failureRatePct: 48,
    description:
      'Settlement AI trains on historical debit memos that include unresolved or incorrectly coded partner disputes. The model automates past disagreement patterns and creates new settlement friction at higher speed.',
    keywords: ['settlement AI', 'debit memo', 'IATA SIS', 'training data', 'partner dispute'],
    demoRelevant: true,
  },
  {
    code: 'A5451',
    name: 'Codeshare Customer Promise Not Versioned By Channel',
    officeCategory: 'front_office',
    failureRatePct: 44,
    description:
      'Customer promises for partner-operated flights differ across web, app, call center, GDS, and partner channels because wording and policy versions are managed separately. A promise made at booking cannot be defended at airport servicing.',
    keywords: ['customer promise', 'channel versioning', 'codeshare', 'GDS', 'airport servicing'],
  },
  {
    code: 'A5452',
    name: 'Alliance Analytics Excludes Negative Partner Signals',
    officeCategory: 'middle_office',
    failureRatePct: 46,
    description:
      'Alliance analytics consumes partner sales and schedule feeds but not complaints, denied benefits, failed seat assignments, or refund friction. Strategy teams optimize the partnership using positive demand signals while the operating debt compounds.',
    keywords: ['alliance analytics', 'partner signals', 'complaints', 'refund friction', 'operating debt'],
  },
  {
    code: 'A5453',
    name: 'Partner Data Product Missing Freshness Contract',
    officeCategory: 'back_office',
    failureRatePct: 51,
    description:
      'Partner data products are treated as available if the feed lands, but freshness, completeness, late-arrival, and schema-change contracts are not enforced. Intelligence answers cite partner facts that are technically loaded and operationally stale.',
    keywords: ['data product', 'freshness contract', 'partner feed', 'schema change', 'Intelligence'],
    demoRelevant: true,
  },
  {
    code: 'A5454',
    name: 'Interline Accessibility AI Overlooks Human Confirmation Gate',
    officeCategory: 'front_office',
    failureRatePct: 56,
    description:
      'Accessibility AI predicts assistance needs and sends SSRs, but there is no human confirmation gate with the operating carrier for complex mobility or medical scenarios. The AI improves request creation while the actual partner service remains unconfirmed.',
    keywords: ['accessibility AI', 'SSR', 'human confirmation', 'operating carrier', 'DOT'],
    demoRelevant: true,
  },
  {
    code: 'A5455',
    name: 'Alliance Commercial Model Ignores Cyber Incident Boundary',
    officeCategory: 'back_office',
    failureRatePct: 45,
    description:
      'Commercial partnership agreements define revenue, benefits, and servicing but not cyber incident boundaries, notification clocks, evidence sharing, or customer remediation ownership. A partner breach becomes a customer-trust issue before the legal operating model is clear.',
    keywords: ['cyber incident', 'alliance contract', 'notification', 'evidence sharing', 'customer remediation'],
  },
  {
    code: 'A5456',
    name: 'Partner Recovery Move Lacks Value-Ledger Tieout',
    officeCategory: 'middle_office',
    failureRatePct: 43,
    description:
      'A Move to improve partner recovery is funded on customer-experience logic but not tied to avoided refunds, lower call volume, fewer claims, or retained corporate revenue. The initiative feels right but cannot prove value after implementation.',
    keywords: ['partner recovery', 'Move', 'value ledger', 'refund avoidance', 'call volume'],
    demoRelevant: true,
  },
  {
    code: 'A5457',
    name: 'Codeshare Consent Capture Missing For AI Grounding',
    officeCategory: 'front_office',
    failureRatePct: 50,
    description:
      'Customer consent language covers partner servicing and loyalty operations but not use of shared itinerary or complaint data to ground GenAI answers. Legal blocks the AI workflow after product teams have already designed the experience.',
    keywords: ['consent capture', 'AI grounding', 'GenAI', 'partner data', 'privacy'],
    demoRelevant: true,
  },
  {
    code: 'A5458',
    name: 'Interline Downgrade Evidence Missing From Premium Recovery',
    officeCategory: 'front_office',
    failureRatePct: 47,
    description:
      'Premium-cabin downgrades on partner-operated segments are recorded by the operating carrier but not captured in SkyHarbor customer recovery workflows. The airline misses proactive compensation moments for customers it still owns commercially.',
    keywords: ['premium downgrade', 'partner segment', 'customer recovery', 'compensation', 'commercial ownership'],
  },
  {
    code: 'A5459',
    name: 'Alliance Source Negotiation Lacks Pattern Evidence',
    officeCategory: 'back_office',
    failureRatePct: 45,
    description:
      'Alliance renegotiations rely on relationship history and traffic volume but not pattern evidence from servicing failures, API degradation, settlement disputes, and customer friction. Source cannot turn operational pain into stronger evidence rights, SLAs, or remediation clauses.',
    keywords: ['Source', 'alliance negotiation', 'pattern evidence', 'SLA', 'remediation clause'],
    demoRelevant: true,
  },
];
