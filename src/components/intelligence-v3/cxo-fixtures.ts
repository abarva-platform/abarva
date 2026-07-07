// Intelligence v3 · Meridian Healthcare CXO fixtures (PR-K2.4).
//
// Fixture data for the 8 non-corpus surfaces (Today, By function,
// Patterns, Vendors, Peer activity, My Strategy, Sessions). Reads as
// the portfolio actually is — honest asymmetry preserved across every
// surface (workforce heavy · margin thin · clinical empty · foundation
// blocking via MH-07).
//
// Replaced by live AgentContextBroker bindings once population runs
// (PR-K3+). For now these let the UI ship at locked-design fidelity.

// ─── Today ───────────────────────────────────────────────────────

export type AttentionTone = 'urgent' | 'attn' | 'opp';

export interface AttentionItem {
  tone: AttentionTone;
  toneLabel: string;
  title: string;
  body: string;
  dependency?: string;
}

export const MERIDIAN_TODAY_ITEMS: ReadonlyArray<AttentionItem> = [
  {
    tone: 'urgent',
    toneLabel: 'Urgent',
    title: 'MH-07 (foundation) data quality at risk',
    body:
      'Two slip indicators in the last 14 days · vendor escalation pending · cascades into clinical AI sequencing if not addressed by next steering.',
    dependency: 'Blocks · clinical AI band (MH-09 / MH-12)',
  },
  {
    tone: 'attn',
    toneLabel: 'Attention',
    title: 'Bring CMIO into MH-01 shaping',
    body:
      'Pattern P-HC-005 binds: CIO-only sponsorship → 25–40% adoption. With CMIO co-sponsor → 65–75%. Conversation hasn\'t happened yet for the ambient AI rollout.',
  },
  {
    tone: 'opp',
    toneLabel: 'Opportunity',
    title: 'Population Health → CFO pitch ready',
    body:
      'CMS-MSSP attribution model + your network leakage data point at $4–6M MLR lift. Three peer IDNs landed similar wins. CFO ask: $1.8M / 18 months.',
    dependency: 'Cascade · MH-04 → MH-06 → MH-09',
  },
];

// ─── By function ─────────────────────────────────────────────────

export type ByFnCellState = 'in-flight' | 'candidate' | 'risk' | 'empty';

export interface ByFnCell {
  state: ByFnCellState;
  /** Optional initiative ID shown in-cell. */
  ref?: string;
}

export interface ByFnRow {
  function: string;
  cells: [ByFnCell, ByFnCell, ByFnCell, ByFnCell]; // workforce · margin · clinical · foundation
}

export interface ByFnOutcome {
  key: string;
  label: string;
}

export const BY_FN_OUTCOMES: ReadonlyArray<ByFnOutcome> = [
  { key: 'workforce', label: 'Workforce' },
  { key: 'margin', label: 'Margin' },
  { key: 'clinical', label: 'Clinical' },
  { key: 'foundation', label: 'Foundation' },
];

export const MERIDIAN_BY_FN_ROWS: ReadonlyArray<ByFnRow> = [
  {
    function: 'Front office · access + scheduling',
    cells: [
      { state: 'in-flight', ref: 'MH-02' },
      { state: 'candidate' },
      { state: 'empty' },
      { state: 'in-flight', ref: 'MH-03' },
    ],
  },
  {
    function: 'Clinical care · ambient + decisioning',
    cells: [
      { state: 'in-flight', ref: 'MH-01' },
      { state: 'empty' },
      { state: 'candidate', ref: 'MH-12' },
      { state: 'risk', ref: 'MH-07' },
    ],
  },
  {
    function: 'Revenue cycle · coding + denials',
    cells: [
      { state: 'empty' },
      { state: 'in-flight', ref: 'MH-04' },
      { state: 'candidate' },
      { state: 'empty' },
    ],
  },
  {
    function: 'Population health · risk + attribution',
    cells: [
      { state: 'empty' },
      { state: 'candidate', ref: 'MH-06' },
      { state: 'candidate', ref: 'MH-09' },
      { state: 'empty' },
    ],
  },
  {
    function: 'Workforce · scheduling + retention',
    cells: [
      { state: 'in-flight', ref: 'MH-05' },
      { state: 'empty' },
      { state: 'empty' },
      { state: 'candidate' },
    ],
  },
  {
    function: 'IT + back office · service ops',
    cells: [
      { state: 'candidate' },
      { state: 'candidate' },
      { state: 'empty' },
      { state: 'in-flight', ref: 'MH-08' },
    ],
  },
];

export const APEX_RETAIL_BY_FN_OUTCOMES: ReadonlyArray<ByFnOutcome> = [
  { key: 'customer', label: 'Customer growth' },
  { key: 'margin', label: 'Merch margin' },
  { key: 'operations', label: 'Store ops' },
  { key: 'foundation', label: 'Data foundation' },
];

export const APEX_RETAIL_BY_FN_ROWS: ReadonlyArray<ByFnRow> = [
  {
    function: 'Customer + loyalty',
    cells: [
      { state: 'in-flight', ref: 'AR-LOYALTY_AI' },
      { state: 'candidate', ref: 'AR-PERSONALIZATION_ENGINE' },
      { state: 'empty' },
      { state: 'risk', ref: 'CDP' },
    ],
  },
  {
    function: 'Digital commerce',
    cells: [
      { state: 'in-flight', ref: 'AR-OMNICHANNEL_FULFILLMENT' },
      { state: 'candidate', ref: 'AR-PRICING_OPTIMIZATION' },
      { state: 'candidate', ref: 'RETURNS' },
      { state: 'risk', ref: 'DATA' },
    ],
  },
  {
    function: 'Store operations',
    cells: [
      { state: 'candidate', ref: 'CLIENTELING' },
      { state: 'candidate', ref: 'AR-WORKFORCE_SCHEDULING' },
      { state: 'in-flight', ref: 'ASSOCIATE_AI' },
      { state: 'empty' },
    ],
  },
  {
    function: 'Merchandising + pricing',
    cells: [
      { state: 'empty' },
      { state: 'in-flight', ref: 'AR-MARKDOWN_OPTIMIZATION' },
      { state: 'candidate', ref: 'PLANOGRAM' },
      { state: 'risk', ref: 'ITEM_MASTER' },
    ],
  },
  {
    function: 'Supply chain + inventory',
    cells: [
      { state: 'empty' },
      { state: 'candidate', ref: 'AR-DEMAND_SENSING' },
      { state: 'in-flight', ref: 'AR-SUPPLY_CHAIN_CONTROL_TOWER' },
      { state: 'candidate', ref: 'VENDOR_DATA' },
    ],
  },
  {
    function: 'Finance, risk + IT',
    cells: [
      { state: 'empty' },
      { state: 'candidate', ref: 'AR-VENDOR_COMPLIANCE' },
      { state: 'risk', ref: 'AR-SHRINK_ANALYTICS' },
      { state: 'in-flight', ref: 'PLATFORM' },
    ],
  },
];

// ─── Patterns ────────────────────────────────────────────────────

export interface PatternRow {
  id: string;
  name: string;
  description: string;
  /** With-pattern outcome, e.g. "65–75% adoption". */
  withLabel: string;
  /** Without-pattern outcome, e.g. "25–40% adoption". */
  withoutLabel: string;
  /** Numeric for the bar visualization. */
  withPct: number;
  withoutPct: number;
  bindsTo: string;
  officeCategory?: string;
  failureRatePct?: number;
  sourceTitles?: string[];
  contradictionTitles?: string[];
  useCaseNames?: string[];
}

export const MERIDIAN_PATTERNS: ReadonlyArray<PatternRow> = [
  {
    id: 'P-HC-005',
    name: 'CMIO co-sponsorship for ambient AI',
    description:
      'Adoption fails when sponsorship is CIO-only. CMIO presence in shaping doubles clinician uptake.',
    withLabel: '65–75% adoption',
    withoutLabel: '25–40% adoption',
    withPct: 70,
    withoutPct: 33,
    bindsTo: 'MH-01 · MH-04',
  },
  {
    id: 'P-HC-007',
    name: 'Foundation-first sequencing',
    description:
      'Identity + data quality landing before clinical AI · cascade risk drops by an order of magnitude.',
    withLabel: '11% slip rate',
    withoutLabel: '54% slip rate',
    withPct: 89,
    withoutPct: 46,
    bindsTo: 'MH-07 · MH-09',
  },
  {
    id: 'P-HC-014',
    name: 'Detection without intervention protocol',
    description:
      'Alert without an ops protocol produces no outcome change · drop the program if intervention isn\'t scoped.',
    withLabel: '38% MLR lift',
    withoutLabel: '0% lift',
    withPct: 38,
    withoutPct: 0,
    bindsTo: 'MH-09 · MH-12',
  },
  {
    id: 'P-HC-019',
    name: 'Vendor-first vs. capability-first',
    description:
      'Buying around an incumbent\'s roadmap dominates outcomes when capability is core · 2:1 success ratio.',
    withLabel: '64% on-time',
    withoutLabel: '32% on-time',
    withPct: 64,
    withoutPct: 32,
    bindsTo: 'MH-04 · vendor renewals',
  },
  {
    id: 'P-HC-022',
    name: 'Threshold tuning loop',
    description:
      '60% of failed deployments tie back to alert-fatigue · explicit threshold-tuning cycle is the fix.',
    withLabel: '85% retention',
    withoutLabel: '40% retention',
    withPct: 85,
    withoutPct: 40,
    bindsTo: 'MH-09 · MH-12',
  },
  {
    id: 'P-HC-028',
    name: 'Risk-adjustment first VBC sequencing',
    description:
      'VBC programs that lead with HCC accuracy capture 2–3x more MLR lift in year 1.',
    withLabel: '$5.4M MLR',
    withoutLabel: '$1.8M MLR',
    withPct: 75,
    withoutPct: 25,
    bindsTo: 'MH-06 · MH-09',
  },
];

// ─── Vendors ─────────────────────────────────────────────────────
//
// CIO-quality view: IT spend rolls up by category
// (Hardware/Cloud · Software/SaaS · Services/SI), then drills into
// individual vendors. Renewal calendar and risk quadrant are
// secondary views via the chart toggle.

export type VendorTier = 'incumbent' | 'challenger' | 'emerging';
export type VendorHealth = 'healthy' | 'watch' | 'risk';
export type VendorCategory = 'hardware-cloud' | 'software-saas' | 'services-si';

export interface VendorSpendRow {
  vendor: string;
  category: VendorCategory;
  /** Sub-category inside the broader bucket (e.g. "Cloud · IaaS"). */
  subcategory: string;
  /** Annualized spend in USD millions (numeric for sorting/aggregation). */
  spendUsdM: number;
  spendLabel: string;
  tier: VendorTier;
  health: VendorHealth;
  /** Months until renewal · null for evergreen / consumption. */
  renewsInMonths: number | null;
  takeaway: string;
}

export const VENDOR_CATEGORIES: ReadonlyArray<{
  key: VendorCategory;
  label: string;
  shortLabel: string;
  description: string;
  accent: string;
}> = [
  {
    key: 'hardware-cloud',
    label: 'Hardware · private cloud · infrastructure',
    shortLabel: 'Hardware / Cloud',
    description: 'Compute · storage · network · public + private cloud',
    accent: '#1F3A6E',
  },
  {
    key: 'software-saas',
    label: 'Software · SaaS · platforms',
    shortLabel: 'Software / SaaS',
    description: 'Core systems · productivity · domain platforms · vertical apps',
    accent: '#0E8C7E',
  },
  {
    key: 'services-si',
    label: 'Services · SIs · advisory',
    shortLabel: 'Services / SI',
    description: 'Implementation · managed services · staff aug · advisory',
    accent: '#C8881C',
  },
];

export const MERIDIAN_VENDOR_SPEND: ReadonlyArray<VendorSpendRow> = [
  // Software/SaaS · the largest bucket
  { vendor: 'Epic Systems', category: 'software-saas', subcategory: 'EHR + revenue cycle', spendUsdM: 28.0, spendLabel: '$28.0M', tier: 'incumbent', health: 'watch', renewsInMonths: 14, takeaway: 'Negotiation leverage thin · MH-04 ties to roadmap · re-evaluate before renewal.' },
  { vendor: 'Microsoft 365 + Azure AD', category: 'software-saas', subcategory: 'Productivity + identity', spendUsdM: 6.4, spendLabel: '$6.4M', tier: 'incumbent', health: 'healthy', renewsInMonths: 18, takeaway: 'Standard EA · co-term with Azure consumption.' },
  { vendor: 'Workday', category: 'software-saas', subcategory: 'HCM + finance', spendUsdM: 5.2, spendLabel: '$5.2M', tier: 'incumbent', health: 'healthy', renewsInMonths: 22, takeaway: 'No friction · HCM consolidation completed in 2024.' },
  { vendor: 'Innovaccer', category: 'software-saas', subcategory: 'Pop health + analytics', spendUsdM: 4.2, spendLabel: '$4.2M', tier: 'incumbent', health: 'risk', renewsInMonths: 8, takeaway: 'Same factor profile as 2023 platform consolidation · alternatives in scan.' },
  { vendor: 'Snowflake', category: 'software-saas', subcategory: 'Data platform', spendUsdM: 3.8, spendLabel: '$3.8M', tier: 'incumbent', health: 'healthy', renewsInMonths: null, takeaway: 'Consumption-priced · compute trended +18% YoY.' },
  { vendor: 'ServiceNow', category: 'software-saas', subcategory: 'ITSM + workflow', spendUsdM: 2.6, spendLabel: '$2.6M', tier: 'incumbent', health: 'healthy', renewsInMonths: 10, takeaway: 'Module sprawl · audit before renewal.' },
  { vendor: 'Okta', category: 'software-saas', subcategory: 'Identity', spendUsdM: 1.4, spendLabel: '$1.4M', tier: 'incumbent', health: 'healthy', renewsInMonths: 16, takeaway: 'Steady · workforce identity standardized.' },
  { vendor: 'Abridge', category: 'software-saas', subcategory: 'Ambient documentation (AI)', spendUsdM: 1.1, spendLabel: '$1.1M (pilot)', tier: 'challenger', health: 'healthy', renewsInMonths: 11, takeaway: 'Pilot landing · expand contingent on CMIO co-sponsorship.' },
  { vendor: 'Tableau', category: 'software-saas', subcategory: 'BI + analytics', spendUsdM: 0.9, spendLabel: '$0.9M', tier: 'incumbent', health: 'watch', renewsInMonths: 6, takeaway: 'Snowflake-native viz alternatives reduce footprint.' },
  { vendor: 'Slack', category: 'software-saas', subcategory: 'Collaboration', spendUsdM: 0.6, spendLabel: '$0.6M', tier: 'incumbent', health: 'healthy', renewsInMonths: 12, takeaway: 'Standard · Salesforce co-term.' },
  // Hardware / Cloud
  { vendor: 'AWS', category: 'hardware-cloud', subcategory: 'Public cloud · primary', spendUsdM: 14.8, spendLabel: '$14.8M', tier: 'incumbent', health: 'healthy', renewsInMonths: null, takeaway: 'Consumption · 2026 commit at $52M · negotiated +15% headroom.' },
  { vendor: 'Cisco', category: 'hardware-cloud', subcategory: 'Network + collab', spendUsdM: 5.6, spendLabel: '$5.6M', tier: 'incumbent', health: 'watch', renewsInMonths: 9, takeaway: 'Refresh due · evaluate Arista in DC tier.' },
  { vendor: 'Dell EMC', category: 'hardware-cloud', subcategory: 'Compute + storage', spendUsdM: 4.9, spendLabel: '$4.9M', tier: 'incumbent', health: 'healthy', renewsInMonths: null, takeaway: 'On-prem footprint shrinking as workloads cloud-shift.' },
  { vendor: 'Pure Storage', category: 'hardware-cloud', subcategory: 'Primary storage', spendUsdM: 3.2, spendLabel: '$3.2M', tier: 'incumbent', health: 'healthy', renewsInMonths: 13, takeaway: 'Subscription · capacity tracking against PACS growth.' },
  { vendor: 'CrowdStrike', category: 'hardware-cloud', subcategory: 'Endpoint security', spendUsdM: 2.1, spendLabel: '$2.1M', tier: 'incumbent', health: 'healthy', renewsInMonths: 7, takeaway: 'Co-term opportunity with Microsoft Defender bundle.' },
  { vendor: 'Palo Alto Networks', category: 'hardware-cloud', subcategory: 'Network security', spendUsdM: 1.8, spendLabel: '$1.8M', tier: 'incumbent', health: 'healthy', renewsInMonths: 11, takeaway: 'Stable · NGFW + Prisma Cloud bundled.' },
  // Services / SI
  { vendor: 'Deloitte', category: 'services-si', subcategory: 'Strategy + advisory', spendUsdM: 6.8, spendLabel: '$6.8M', tier: 'incumbent', health: 'watch', renewsInMonths: 5, takeaway: 'Three concurrent engagements · consolidate or rotate.' },
  { vendor: 'Accenture', category: 'services-si', subcategory: 'Epic implementation', spendUsdM: 5.4, spendLabel: '$5.4M', tier: 'incumbent', health: 'healthy', renewsInMonths: 4, takeaway: 'Tied to Epic AI revenue cycle build · ongoing.' },
  { vendor: 'Infosys', category: 'services-si', subcategory: 'Application managed services', spendUsdM: 4.1, spendLabel: '$4.1M', tier: 'incumbent', health: 'healthy', renewsInMonths: 8, takeaway: 'Steady · 24/7 ops · India + Mexico delivery.' },
  { vendor: 'KPMG', category: 'services-si', subcategory: 'Risk + compliance', spendUsdM: 2.6, spendLabel: '$2.6M', tier: 'incumbent', health: 'healthy', renewsInMonths: 14, takeaway: 'HIPAA + SOC 2 attestation · annual cadence.' },
  { vendor: 'Slalom', category: 'services-si', subcategory: 'Cloud + data engineering', spendUsdM: 1.9, spendLabel: '$1.9M', tier: 'challenger', health: 'healthy', renewsInMonths: 6, takeaway: 'Snowflake + AWS work · expand for Pop Health build.' },
];

export const APEX_RETAIL_VENDOR_SPEND: ReadonlyArray<VendorSpendRow> = [
  { vendor: 'Salesforce Commerce + Marketing Cloud', category: 'software-saas', subcategory: 'Commerce + loyalty activation', spendUsdM: 14.6, spendLabel: '$14.6M', tier: 'incumbent', health: 'watch', renewsInMonths: 11, takeaway: 'CMO owns loyalty outcomes, but IT owns CDP plumbing. Renewal leverage depends on the identity cleanup sequence.' },
  { vendor: 'Adobe Experience Platform', category: 'software-saas', subcategory: 'CDP + journey orchestration', spendUsdM: 8.8, spendLabel: '$8.8M', tier: 'incumbent', health: 'risk', renewsInMonths: 7, takeaway: 'Three teams treat AEP as the integration hub; data readiness audit says consent and identity stitching are not ready.' },
  { vendor: 'Blue Yonder', category: 'software-saas', subcategory: 'Demand forecasting + replenishment', spendUsdM: 6.4, spendLabel: '$6.4M', tier: 'incumbent', health: 'healthy', renewsInMonths: 19, takeaway: 'Good fit for demand sensing once item-location history is normalized.' },
  { vendor: 'Manhattan Active Omni', category: 'software-saas', subcategory: 'Order management + fulfillment', spendUsdM: 5.7, spendLabel: '$5.7M', tier: 'incumbent', health: 'watch', renewsInMonths: 9, takeaway: 'Fulfillment promise logic conflicts with sustainability and margin guardrails.' },
  { vendor: 'Microsoft 365 + Entra ID', category: 'software-saas', subcategory: 'Productivity + workforce identity', spendUsdM: 5.2, spendLabel: '$5.2M', tier: 'incumbent', health: 'healthy', renewsInMonths: 18, takeaway: 'Store workforce identity standardization is a useful anchor for associate AI.' },
  { vendor: 'Snowflake', category: 'software-saas', subcategory: 'Retail data cloud', spendUsdM: 3.8, spendLabel: '$3.8M', tier: 'incumbent', health: 'healthy', renewsInMonths: null, takeaway: 'Consumption rising with loyalty and inventory workloads; needs FinOps guardrails before more AI pilots.' },
  { vendor: 'ServiceNow', category: 'software-saas', subcategory: 'ITSM + workflow', spendUsdM: 3.5, spendLabel: '$3.5M', tier: 'incumbent', health: 'healthy', renewsInMonths: 13, takeaway: 'Useful operational backbone for exception workflows and vendor compliance.' },
  { vendor: 'Databricks', category: 'software-saas', subcategory: 'ML platform + feature engineering', spendUsdM: 2.7, spendLabel: '$2.7M', tier: 'challenger', health: 'watch', renewsInMonths: 10, takeaway: 'Promising for personalization and demand sensing, but model governance is still immature.' },
  { vendor: 'Shopify Plus', category: 'software-saas', subcategory: 'Digital storefront expansion', spendUsdM: 1.8, spendLabel: '$1.8M', tier: 'challenger', health: 'healthy', renewsInMonths: 16, takeaway: 'Selective category storefronts, not a core commerce replacement.' },
  { vendor: 'Okta', category: 'software-saas', subcategory: 'Customer + workforce identity', spendUsdM: 1.5, spendLabel: '$1.5M', tier: 'incumbent', health: 'healthy', renewsInMonths: 21, takeaway: 'Identity controls are steady; customer identity ownership still needs a business decision.' },
  { vendor: 'AWS', category: 'hardware-cloud', subcategory: 'Public cloud · analytics primary', spendUsdM: 13.6, spendLabel: '$13.6M', tier: 'incumbent', health: 'healthy', renewsInMonths: null, takeaway: 'Consumption profile supports retail data workloads; commitment should be tied to AI portfolio sequencing.' },
  { vendor: 'Microsoft Azure', category: 'hardware-cloud', subcategory: 'ERP + identity adjacent cloud', spendUsdM: 6.2, spendLabel: '$6.2M', tier: 'incumbent', health: 'healthy', renewsInMonths: null, takeaway: 'Useful for enterprise apps, but not the primary retail ML runtime today.' },
  { vendor: 'Zebra Technologies', category: 'hardware-cloud', subcategory: 'Store devices + inventory scanning', spendUsdM: 4.1, spendLabel: '$4.1M', tier: 'incumbent', health: 'watch', renewsInMonths: 6, takeaway: 'Device refresh can unlock shelf availability and shrink telemetry if stores accept process change.' },
  { vendor: 'Cisco Meraki', category: 'hardware-cloud', subcategory: 'Store network + edge', spendUsdM: 3.8, spendLabel: '$3.8M', tier: 'incumbent', health: 'healthy', renewsInMonths: 14, takeaway: 'Store network health is adequate for associate tooling; edge analytics scope should stay narrow.' },
  { vendor: 'Google Cloud', category: 'hardware-cloud', subcategory: 'Analytics sandbox + media clean rooms', spendUsdM: 2.4, spendLabel: '$2.4M', tier: 'challenger', health: 'watch', renewsInMonths: 8, takeaway: 'Marketing analytics overlap with AEP and Snowflake needs a rationalization decision.' },
  { vendor: 'CrowdStrike', category: 'hardware-cloud', subcategory: 'Endpoint security', spendUsdM: 2.3, spendLabel: '$2.3M', tier: 'incumbent', health: 'healthy', renewsInMonths: 12, takeaway: 'Stable endpoint posture across stores and corporate users.' },
  { vendor: 'Accenture Retail', category: 'services-si', subcategory: 'Commerce + data transformation', spendUsdM: 6.2, spendLabel: '$6.2M', tier: 'incumbent', health: 'risk', renewsInMonths: 5, takeaway: 'Claiming integration-hub ownership alongside Adobe and Salesforce; scope needs a hard decision.' },
  { vendor: 'Deloitte Retail AI', category: 'services-si', subcategory: 'AI governance + operating model', spendUsdM: 5.4, spendLabel: '$5.4M', tier: 'incumbent', health: 'watch', renewsInMonths: 4, takeaway: 'Good governance help, but CFO wants cost-takeout evidence before more advisory spend.' },
  { vendor: 'Infosys Retail AMS', category: 'services-si', subcategory: 'Application managed services', spendUsdM: 4.0, spendLabel: '$4.0M', tier: 'incumbent', health: 'healthy', renewsInMonths: 15, takeaway: 'Stable run support for POS, OMS, and merchandising integrations.' },
  { vendor: 'Publicis Sapient', category: 'services-si', subcategory: 'Experience design + personalization', spendUsdM: 3.1, spendLabel: '$3.1M', tier: 'challenger', health: 'healthy', renewsInMonths: 8, takeaway: 'Useful for customer journeys once CDP ownership is settled.' },
  { vendor: 'Slalom', category: 'services-si', subcategory: 'Data engineering + delivery squads', spendUsdM: 2.3, spendLabel: '$2.3M', tier: 'challenger', health: 'healthy', renewsInMonths: 6, takeaway: 'Focused delivery capacity for demand sensing and inventory quality fixes.' },
];

export interface VendorRenewalRow {
  vendor: string;
  category: string;
  tier: VendorTier;
  spend: string;
  renewsIn: string;
  health: VendorHealth;
  takeaway: string;
}

export interface VendorWatchRow {
  vendor: string;
  category: string;
  signal: string;
}

export const MERIDIAN_VENDOR_RENEWALS: ReadonlyArray<VendorRenewalRow> = [
  {
    vendor: 'Epic',
    category: 'EHR + Revenue Cycle',
    tier: 'incumbent',
    spend: '$28M / yr',
    renewsIn: '14 mo',
    health: 'watch',
    takeaway: 'Negotiation leverage thin · MH-04 ties to their roadmap.',
  },
  {
    vendor: 'Innovaccer',
    category: 'Pop health + analytics',
    tier: 'incumbent',
    spend: '$4.2M / yr',
    renewsIn: '8 mo',
    health: 'risk',
    takeaway: 'Same factor profile as 2023 platform consolidation. Re-evaluate.',
  },
  {
    vendor: 'Abridge',
    category: 'Ambient documentation',
    tier: 'challenger',
    spend: '$1.1M (pilot)',
    renewsIn: '11 mo',
    health: 'healthy',
    takeaway: 'Pilot landing · expand contingent on CMIO co-sponsorship.',
  },
  {
    vendor: 'Hippocratic AI',
    category: 'Patient experience agents',
    tier: 'emerging',
    spend: '$0 (eval)',
    renewsIn: 'n/a',
    health: 'watch',
    takeaway: 'Hyro-class disruptor · adjacent to Epic MyChart UX gaps.',
  },
];

export const MERIDIAN_VENDOR_WATCH: ReadonlyArray<VendorWatchRow> = [
  {
    vendor: 'Suki',
    category: 'Ambient · alt to Abridge',
    signal: 'Closed 3 IDN deals in Q4 · pricing pressure inbound.',
  },
  {
    vendor: 'Notable',
    category: 'Front-office automation',
    signal: 'Two peer IDNs flipped from incumbent in last 90 days.',
  },
  {
    vendor: 'Iodine Software',
    category: 'CDI + HCC',
    signal: 'New attribution model · directly relevant to MH-06.',
  },
];

// ─── Peer activity ───────────────────────────────────────────────

export interface PeerRow {
  cohort: string;
  size: number;
  outcome: string;
  /** Adoption percentage 0-100. */
  adoptionPct: number;
  delta: string;
}

export const MERIDIAN_PEER_ROWS: ReadonlyArray<PeerRow> = [
  {
    cohort: '8 named IDN peers · 200–400 bed',
    size: 8,
    outcome: 'Ambient AI deployment',
    adoptionPct: 75,
    delta: '6 of 8 active · 2 yet to start',
  },
  {
    cohort: '5 VBC-heavy peers',
    size: 5,
    outcome: 'Risk-adjustment AI',
    adoptionPct: 60,
    delta: '3 of 5 in flight · 2 evaluating',
  },
  {
    cohort: '12 academic medical centers',
    size: 12,
    outcome: 'Clinical decision support',
    adoptionPct: 33,
    delta: '4 of 12 · most still piloting',
  },
  {
    cohort: '6 IDN peers · same Epic instance',
    size: 6,
    outcome: 'Revenue-cycle automation',
    adoptionPct: 83,
    delta: '5 of 6 · you\'re the laggard',
  },
  {
    cohort: '4 first-mover IDNs',
    size: 4,
    outcome: 'Conversational patient access',
    adoptionPct: 50,
    delta: '2 of 4 · Hyro / Notable / Hippocratic split',
  },
];

export const APEX_RETAIL_PEER_ROWS: ReadonlyArray<PeerRow> = [
  {
    cohort: '8 specialty retail peers',
    size: 8,
    outcome: 'Loyalty personalization at scale',
    adoptionPct: 63,
    delta: '5 of 8 active · Apex is in flight but blocked by identity stitching',
  },
  {
    cohort: '6 big-box omnichannel peers',
    size: 6,
    outcome: 'Fulfillment promise optimization',
    adoptionPct: 83,
    delta: '5 of 6 active · sustainability trade-offs now surfaced',
  },
  {
    cohort: '10 grocery + pharmacy peers',
    size: 10,
    outcome: 'Demand sensing + automated replenishment',
    adoptionPct: 70,
    delta: '7 of 10 in flight · item-location history separates winners',
  },
  {
    cohort: '5 luxury clienteling peers',
    size: 5,
    outcome: 'Associate copilots + clienteling',
    adoptionPct: 40,
    delta: '2 of 5 active · privacy and store adoption slow rollouts',
  },
  {
    cohort: '7 marketplace-first retailers',
    size: 7,
    outcome: 'Vendor compliance + catalog quality AI',
    adoptionPct: 57,
    delta: '4 of 7 active · supplier data contracts are the gating factor',
  },
];

// ─── My strategy ─────────────────────────────────────────────────

export interface StrategyBullet {
  number: string;
  title: string;
  body: string;
  evidence: string;
  /**
   * Optional Intelligence→Move linkage (loop wiring · GAP-2). When
   * present, the bet-brief bullet renders a "Shape into Move" CTA that
   * deep-links into `/strategic-moves/new` carrying the binding
   * pattern. The originated Move then joins back to Intelligence in
   * the cross-module trace viewer (`/strategic-moves/[moveId]/trace`).
   */
  betLink?: {
    patternId: string;
    patternName: string;
    useCaseName?: string;
  };
}

export const MERIDIAN_STRATEGY_BULLETS: ReadonlyArray<StrategyBullet> = [
  {
    number: '01',
    title: 'Land MH-07 (foundation) before any clinical AI move advances',
    body:
      'MH-07 is a single-point dependency for clinical AI sequencing. Slipping it cascades into MH-09 / MH-12 with an order-of-magnitude impact on slip rates. Every clinical-band move stays "candidate" until MH-07 is green.',
    evidence: 'P-HC-007 · cascade observed in 7 of 11 IDN deployments [KLAS 2025-Q4]',
  },
  {
    number: '02',
    title: 'Bring CMIO into ambient + clinical shaping or stop',
    body:
      'Pattern P-HC-005 is binding · CIO-only sponsorship caps adoption at 25–40%. With CMIO co-sponsorship: 65–75%. MH-01 + MH-04 don\'t justify the spend without that conversation happening first.',
    evidence: 'P-HC-005 · 23 IDN ambient AI deployments · adoption delta 30+ points',
  },
  {
    number: '03',
    title: 'Lead the VBC story with risk-adjustment, not pop-health analytics',
    body:
      'Pattern P-HC-028 favors HCC accuracy first. The CFO pitch lands when the year-1 MLR lift is concrete · Innovaccer renegotiation contingent on this sequencing.',
    evidence: 'P-HC-028 · 14 VBC programs · 2–3x MLR lift sequencing first',
  },
];

export const APEX_RETAIL_STRATEGY_BULLETS: ReadonlyArray<StrategyBullet> = [
  {
    number: '01',
    title: 'Resolve CDP ownership before scaling loyalty AI',
    body:
      'Apex has enough customer data to shape the loyalty and personalization moves, but the operating model is split: CMO owns the outcome while IT owns the platform. The first move is a decision-rights reset, not another model pilot.',
    evidence: 'F200, F203, F207 · identity and consent controls drive retail AI failure-rate reduction',
    betLink: {
      patternId: 'P-RT-002',
      patternName: 'Identity & consent controls precede loyalty AI scale',
      useCaseName: 'CDP ownership reset',
    },
  },
  {
    number: '02',
    title: 'Sequence demand sensing through item-location data readiness',
    body:
      'Demand sensing can move margin, inventory turns, and service levels, but only if SKU, location, promo, and substitution history are clean enough to trust. Ava should keep this as an evidence-gated move until the data audit is green.',
    evidence: 'F215, F217, F231 · 12 Apex use cases tied to portfolio dependencies',
    betLink: {
      patternId: 'P-RT-005',
      patternName: 'Item-location data readiness gates demand sensing',
      useCaseName: 'Demand sensing',
    },
  },
  {
    number: '03',
    title: 'Force the integration-hub decision before vendor renewal season',
    body:
      'Adobe, Salesforce, and Accenture are all implicitly claiming the same integration layer. Apex should make one architecture decision before renewals, or the AI portfolio will inherit overlapping contracts and unclear accountability.',
    evidence: 'Open contradiction · integration hub claims across AEP, Salesforce, and SI scope',
    betLink: {
      patternId: 'P-RT-009',
      patternName: 'Single integration-hub decision precedes AI portfolio scale',
      useCaseName: 'Integration-hub architecture decision',
    },
  },
];

// ─── Sessions ────────────────────────────────────────────────────

export interface SessionRow {
  pinned: boolean;
  thread: string;
  ageLabel: string;
  exchanges: number;
  lastTurn: string;
}

export const MERIDIAN_SESSIONS: ReadonlyArray<SessionRow> = [
  {
    pinned: true,
    thread: 'Population Health · CFO pitch shaping',
    ageLabel: '2d ago',
    exchanges: 14,
    lastTurn: 'Building the $4–6M MLR case · last on attribution model',
  },
  {
    pinned: true,
    thread: 'MH-07 replan · vendor escalation',
    ageLabel: '4d ago',
    exchanges: 9,
    lastTurn: 'Open: which milestone slip is binding',
  },
  {
    pinned: true,
    thread: 'MH-05 measurement question',
    ageLabel: '11d ago',
    exchanges: 6,
    lastTurn: 'Unresolved · waiting on workforce data refresh',
  },
  {
    pinned: false,
    thread: 'Innovaccer renewal · alternatives scan',
    ageLabel: '6h ago',
    exchanges: 4,
    lastTurn: 'Three challenger profiles loaded · ready for review',
  },
  {
    pinned: false,
    thread: 'Vendor risk · Epic dependency mapping',
    ageLabel: '1d ago',
    exchanges: 7,
    lastTurn: 'MH-04 ties identified · 3 swap candidates',
  },
  {
    pinned: false,
    thread: 'CMIO conversation prep',
    ageLabel: '3d ago',
    exchanges: 5,
    lastTurn: 'P-HC-005 framing locked · agenda drafted',
  },
];

export const APEX_RETAIL_SESSIONS: ReadonlyArray<SessionRow> = [
  {
    pinned: true,
    thread: 'CDP ownership · loyalty AI decision rights',
    ageLabel: '4h ago',
    exchanges: 11,
    lastTurn: 'CMO outcome ownership and CTO platform control need CEO arbitration before scale',
  },
  {
    pinned: true,
    thread: 'Demand sensing · item-location readiness',
    ageLabel: '1d ago',
    exchanges: 8,
    lastTurn: 'Data audit shows promo and substitution history are the gating inputs',
  },
  {
    pinned: true,
    thread: 'Vendor integration hub · renewal prep',
    ageLabel: '2d ago',
    exchanges: 9,
    lastTurn: 'Adobe, Salesforce, and Accenture claims mapped to the same data layer',
  },
  {
    pinned: false,
    thread: 'Shrink analytics · store adoption risk',
    ageLabel: '6h ago',
    exchanges: 5,
    lastTurn: 'Loss prevention and operations need a shared intervention protocol',
  },
  {
    pinned: false,
    thread: 'Sustainability vs fulfillment promises',
    ageLabel: '3d ago',
    exchanges: 6,
    lastTurn: 'Fast-ship targets conflict with emissions and split-shipment KPIs',
  },
  {
    pinned: false,
    thread: 'Markdown optimization · margin proof',
    ageLabel: '5d ago',
    exchanges: 4,
    lastTurn: 'Merchandising wants the test; finance wants baseline leakage quantified first',
  },
];
