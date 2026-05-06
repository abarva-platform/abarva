export interface PressureItem {
  id: string;
  title: string;
  severity: 'high' | 'medium' | 'low';
  heroStat: string;
  heroLabel: string;
  delta: string;
  deltaDir: 'up' | 'down' | 'flat';
  topDriver: string;
  atlasSentence: string;
  status: 'active' | 'watching' | 'resolved';
}

export const PRESSURE_AI_CLOUD_SPEND: PressureItem = {
  id: 'twr-ai-cloud-spend',
  title: 'AI Cloud Spend',
  severity: 'high',
  heroStat: 'Restricted',
  heroLabel: 'over budget · exact values hidden',
  delta: 'over plan',
  deltaDir: 'up',
  topDriver: 'LLM API inference spike · 3 new integrations launched in Q2',
  atlasSentence:
    'Spend is over budget; LLM inference is the top driver — a negotiated rate card with the primary provider would recover material run-rate value.',
  status: 'active',
};

export const PRESSURE_VENDOR_RISK: PressureItem = {
  id: 'twr-vendor-risk',
  title: 'Vendor Risk',
  severity: 'medium',
  heroStat: '4 of 12',
  heroLabel: 'vendors amber or red',
  delta: '+2 since last month',
  deltaDir: 'up',
  topDriver: 'ServiceNow auth degraded · 2 BAFO vendors pending SOC-2',
  atlasSentence:
    'Vendor risk is creeping up; the AMS Vendor Consolidation BAFO decision will resolve 2 of 4 amber items.',
  status: 'active',
};

export const PRESSURE_CUSTOMER_CHURN: PressureItem = {
  id: 'twr-customer-churn',
  title: 'Customer Churn Signal',
  severity: 'low',
  heroStat: '8.2%',
  heroLabel: 'quarterly churn rate',
  delta: '-0.4pp vs last quarter',
  deltaDir: 'down',
  topDriver: 'Contact Center AI program showing early retention improvement',
  atlasSentence:
    'Churn is improving slightly; the Contact Center AI program is the most likely positive driver. Watch for 2 more quarters before drawing a causal conclusion.',
  status: 'watching',
};

// ---------------------------------------------------------------------------
// Pressure detail types and constants
// ---------------------------------------------------------------------------

export interface PressureDetail extends PressureItem {
  agentQuote: string;
  agentContext: string;
  actions: Array<{ letter: 'A' | 'B' | 'C'; text: string; detail?: string }>;
  timeline: Array<{ date: string; event: string; actor: string }>;
  relatedPrograms: Array<{ displayId: string; name: string; href: string }>;
}

export const PRESSURE_DETAIL_VENDOR_RISK: PressureDetail = {
  ...PRESSURE_VENDOR_RISK,
  agentQuote:
    '4 of 12 vendors are amber or red — ServiceNow auth degraded 3 days ago, and 2 BAFO vendors have pending SOC-2 reports. The AMS Vendor Consolidation BAFO decision (Stage 7) will resolve 2 of the 4 amber items. Recommend fast-tracking the AMS selection.',
  agentContext: 'Atlas · Vendor Risk · medium severity',
  actions: [
    { letter: 'A' as const, text: 'Resolve ServiceNow auth', detail: 'Reconnect OAuth — Setup → Connectors → ServiceNow' },
    { letter: 'B' as const, text: 'Fast-track AMS BAFO decision', detail: 'Resolves Vendor B and Vendor C amber status' },
    { letter: 'C' as const, text: 'Request SOC-2 reports', detail: '2 vendors pending — deadline in 2 weeks' },
  ],
  timeline: [
    { date: 'Apr 24', event: 'ServiceNow OAuth token expired — connector degraded', actor: 'Steward' },
    { date: 'Apr 22', event: 'Vendor B SOC-2 report flagged as overdue', actor: 'Atlas' },
    { date: 'Apr 19', event: 'AMS BAFO entered Stage 7 — 3 vendors shortlisted', actor: 'Nexus' },
    { date: 'Apr 15', event: 'Vendor risk level elevated from low to medium', actor: 'Atlas' },
  ],
  relatedPrograms: [
    { displayId: 'APX-CDP-2026', name: 'Apex Retail CDP Activation', href: '/programs/apx-cdp-2026' },
  ],
};

export const PRESSURE_DETAIL_CUSTOMER_CHURN: PressureDetail = {
  ...PRESSURE_CUSTOMER_CHURN,
  agentQuote:
    'Quarterly churn is at 8.2% — down 0.4pp from last quarter. The Contact Center AI program is the most likely driver of this improvement, though causal attribution requires 2 more quarters of data. This is a watch item, not a blocker.',
  agentContext: 'Atlas · Customer Churn Signal · watching',
  actions: [
    { letter: 'A' as const, text: 'Brief sponsor on churn trend', detail: 'Early signal — worth a 60-second update' },
    { letter: 'B' as const, text: 'Link churn metric to CC-AI outcome model', detail: 'Atlas can track attribution from Execution Roadmap → Approval / Mobilization' },
    { letter: 'C' as const, text: 'Set churn alert threshold', detail: 'Watch at 8.5% · escalate at 9%' },
  ],
  timeline: [
    { date: 'Apr 27', event: 'Q1 churn finalized at 8.2% — 0.4pp improvement', actor: 'Atlas' },
    { date: 'Mar 31', event: 'Contact Center AI NLP hit 94% accuracy in Build', actor: 'Nexus' },
    { date: 'Jan 27', event: 'Churn watch item created — Q4 baseline 8.6%', actor: 'Atlas' },
  ],
  relatedPrograms: [
    { displayId: 'APX-CC-2026', name: 'Contact Center AI', href: '/programs/apx-cc-2026' },
  ],
};

export const PRESSURE_DETAIL_AI_CLOUD_SPEND: PressureDetail = {
  ...PRESSURE_AI_CLOUD_SPEND,
  agentQuote:
    'LLM inference spend is materially over budget. The spike is concentrated in the three Q2 integrations: CDP personalization, Contact Center NLP, and Demand Forecasting. A negotiated rate card with the primary provider is the single highest-leverage action. No new model deployments should be approved until rate card is in place.',
  agentContext: 'Atlas · AI Cloud Spend · high severity',
  actions: [
    { letter: 'A' as const, text: 'Initiate rate card negotiation', detail: 'Material run-rate recovery · primary LLM provider · 2-week lead' },
    { letter: 'B' as const, text: 'Pause non-critical model deployments', detail: 'Hold until rate card signed — 3 pending requests' },
    { letter: 'C' as const, text: 'Brief CFO on budget variance', detail: 'Restricted budget gap — needs executive visibility this week' },
  ],
  timeline: [
    { date: 'Apr 27', event: 'AI Cloud Spend pressure escalated to high severity', actor: 'Atlas' },
    { date: 'Apr 20', event: 'CDP personalization layer deployed — inference volume spiked +18%', actor: 'Nexus' },
    { date: 'Apr 10', event: 'Contact Center NLP promoted to staging — incremental inference load added', actor: 'Nexus' },
    { date: 'Mar 15', event: 'Cloud spend crossed restricted annual run-rate threshold', actor: 'Atlas' },
    { date: 'Feb 28', event: 'LLM provider rate card renewal deferred to Q2', actor: 'David Chen' },
  ],
  relatedPrograms: [
    { displayId: 'APX-CDP-2026', name: 'Apex Retail CDP Activation', href: '/programs/apx-cdp-2026' },
    { displayId: 'APX-CC-2026', name: 'Contact Center AI', href: '/programs/apx-cc-2026' },
  ],
};

export const PRESSURE_DETAIL_MAP: Record<string, PressureDetail> = {
  'twr-ai-cloud-spend': PRESSURE_DETAIL_AI_CLOUD_SPEND,
  'twr-vendor-risk': PRESSURE_DETAIL_VENDOR_RISK,
  'twr-customer-churn': PRESSURE_DETAIL_CUSTOMER_CHURN,
};

// ---------------------------------------------------------------------------
// Broadsheet Portfolio Index fixture (Tower Portfolio.html design)
// ---------------------------------------------------------------------------

export type ConfLevel = 'high' | 'med' | 'low';

export interface BroadsheetKpi {
  label: string;
  value: string;
  unit?: string;
  conf: ConfLevel;
  confTag?: string;
  delta: string;
  deltaDir: 'up' | 'down' | 'flat';
  footnote: string;
  missingChip?: { label: string };
  hero?: boolean;
}

export interface BroadsheetPressureRow {
  id: string;
  type: 'cost' | 'adopt' | 'dupl' | 'vend' | 'value';
  typeLabel: string;
  headline: string;
  lede: string;
  meta: Array<{ label: string; value: string }>;
  magnitude: string;
  magnitudeUnit: string;
  magnitudeConf: ConfLevel;
  magnitudeLabel: string;
  nextAction: string;
  watch?: boolean;
}

export interface MatrixDot {
  id: string;
  name: string;
  value: string;
  quadrant: 'tl' | 'tr' | 'bl' | 'br';
  left: string;
  top: string;
}

export interface TfowCard {
  name: string;
  meta: string;
  desc: string;
  chip?: { label: string; warn?: boolean };
}

export interface AtlasObservation {
  label: string;
  body: string;
  action?: string;
  special?: boolean;
}

export interface BroadsheetAtlas {
  headline: string;
  meta: string;
  observations: AtlasObservation[];
  prompts: string[];
}

export const BROADSHEET_KPIS: BroadsheetKpi[] = [
  {
    hero: true,
    label: 'Portfolio ROI · 12-month rolling',
    value: '2.8',
    unit: '×',
    conf: 'high',
    delta: '0.4× vs Q1 · target 3.5×',
    deltaDir: 'down',
    footnote: '35% of programs measured. 41% modeled.',
    missingChip: { label: '+24% pending baseline →' },
  },
  {
    label: 'Active pressures',
    value: '7',
    conf: 'high',
    delta: '2 new this week',
    deltaDir: 'up',
    footnote: '3 high-magnitude · 4 watch',
  },
  {
    label: 'Spend at risk',
    value: '$8.4',
    unit: 'M',
    conf: 'med',
    confTag: 'MED',
    delta: '$1.2M MoM',
    deltaDir: 'up',
    footnote: 'Cost overrun + duplication exposure',
  },
  {
    label: 'Renewals · 90d',
    value: '4',
    conf: 'high',
    delta: '$48.2M aggregate',
    deltaDir: 'flat',
    footnote: 'EA · 47d · brief due',
  },
  {
    label: 'Adoption',
    value: '53',
    unit: '%',
    conf: 'low',
    confTag: 'LOW',
    delta: '2 sources missing',
    deltaDir: 'flat',
    footnote: '',
    missingChip: { label: 'Connect Okta + EntraID →' },
  },
];

export const BROADSHEET_PRESSURES: BroadsheetPressureRow[] = [
  {
    id: 'P-COST-2026-04',
    type: 'cost',
    typeLabel: 'Cost\nOverrun',
    headline: 'LLM inference burn is on pace to overrun the AI envelope by $2.4M before Q3.',
    lede: 'Five programs share the budget pool. Joule and the internal Copilot pilot are 71% of token volume but 38% of measured value. Sentinel raised the flag 12 days ago; it\'s been trending faster since the Q1 model swap.',
    meta: [
      { label: 'Programs affected', value: '5' },
      { label: 'First seen', value: '12 days ago' },
      { label: 'Owner', value: 'P. Iyer · CTO office' },
    ],
    magnitude: '$2.4',
    magnitudeUnit: 'M',
    magnitudeConf: 'high',
    magnitudeLabel: 'Q3 projected overrun · HIGH conf',
    nextAction: 'Atlas suggests opening a Move on token-routing policy — would deflect ~$1.6M without touching the rate cards.',
  },
  {
    id: 'P-DUPL-2026-02',
    type: 'dupl',
    typeLabel: 'Capability\nDuplication',
    headline: 'Now Assist and M365 Copilot are converging on the same internal helpdesk use case.',
    lede: 'Both tools are being adopted by IT support, with overlapping deflection metrics and conflicting analytics. ServiceNow renewal is Q4 ($4.1M ARR); the duplication is real but attribution to either tool is currently low-confidence.',
    meta: [
      { label: 'Programs affected', value: '2' },
      { label: 'First seen', value: '28 days ago' },
      { label: 'Owner', value: 'J. Park · Steward' },
    ],
    magnitude: '$1.2',
    magnitudeUnit: 'M',
    magnitudeConf: 'med',
    magnitudeLabel: 'Annual exposure · attribution loose',
    nextAction: 'Atlas wants to run a 6-week clean attribution study before recommending consolidation.',
  },
  {
    id: 'P-VEND-2026-01',
    type: 'vend',
    typeLabel: 'Vendor\nClock',
    headline: 'Microsoft EA renewal closes in 47 days. Brief is open in Source. Decision posture undefined.',
    lede: '$31.4M aggregate spend. Three product lines in scope (M365, Azure consumption, Copilot E5). Atlas\'s pre-brief surfaced two negotiation levers tied to current pressures: tie EA volume to inference deflection (P-COST), and use the Now Assist overlap (P-DUPL) as a swap argument on Copilot quantity.',
    meta: [
      { label: 'Programs touched', value: '11' },
      { label: 'Lead', value: 'M. Desai · Source' },
      { label: 'Brief', value: 'draft v2 in Source' },
    ],
    magnitude: '47',
    magnitudeUnit: 'd',
    magnitudeConf: 'high',
    magnitudeLabel: 'Until close · HIGH conf · CFO posture due',
    nextAction: 'Atlas drafted a negotiation thesis tying the EA to two open pressures. Read in Source brief.',
  },
  {
    id: 'P-ADOPT-2026-03',
    type: 'adopt',
    typeLabel: 'Adoption\nGap',
    headline: 'M365 Copilot adoption is at 24% of seats licensed. Plan was 60% by month 6.',
    lede: 'Six months in. Two functions over 50% (Finance, Legal); IT and Sales under 15%. Steward is preparing a re-baseline proposal. This is not a decision today — it\'s a watch item until the EA brief lands.',
    meta: [
      { label: 'Seats licensed', value: '8,400' },
      { label: 'Active seats', value: '2,016' },
      { label: 'Watch since', value: '2 weeks' },
    ],
    magnitude: '24',
    magnitudeUnit: '%',
    magnitudeConf: 'med',
    magnitudeLabel: 'Active rate · vs 60% target',
    nextAction: 'Watch · re-baseline pending. Tied to EA brief.',
    watch: true,
  },
  {
    id: 'P-VALUE-2026-05',
    type: 'value',
    typeLabel: 'Value\nLag',
    headline: 'Joule rollout is under-realizing on the projected efficiency line.',
    lede: 'Committed $3.2M annual; measured $1.4M after 9 months. Steward attributes 60% of the gap to slower-than-planned RPA pipeline migration. Re-baseline expected at next governance review.',
    meta: [
      { label: 'Tied program', value: 'SAP Joule rollout' },
      { label: 'Owner', value: 'SAP COE' },
    ],
    magnitude: '$1.8',
    magnitudeUnit: 'M',
    magnitudeConf: 'med',
    magnitudeLabel: 'Realization gap · 9 months in',
    nextAction: 'Re-baseline at next governance review.',
    watch: true,
  },
];

export const BROADSHEET_MATRIX: {
  quadrants: Array<{ key: 'tl' | 'tr' | 'bl' | 'br'; label: string; head: string }>;
  dots: MatrixDot[];
} = {
  quadrants: [
    { key: 'tl', label: 'High value · Low alignment', head: 'Useful but off-strategy. Sustain or rationalize.' },
    { key: 'tr', label: 'High value · High alignment · the prize', head: 'Defend, scale, lock baselines.' },
    { key: 'bl', label: 'Low value · Low alignment', head: 'Sunset candidates.' },
    { key: 'br', label: 'Low value · High alignment', head: 'Strategic but not yet earning. Watch closely.' },
  ],
  dots: [
    { id: 'joule', name: 'JOULE', value: '$3.2M', quadrant: 'tl', left: '18%', top: '32%' },
    { id: 'databricks', name: 'DATABRICKS', value: '$2.1M', quadrant: 'tl', left: '56%', top: '14%' },
    { id: 'finops', name: 'FINOPS-CLI', value: '$0.6M', quadrant: 'tl', left: '30%', top: '60%' },
    { id: 'm365', name: 'M365-CORE', value: '$8.4M', quadrant: 'tr', left: '22%', top: '22%' },
    { id: 'azure', name: 'AZURE-PROD', value: '$11.2M', quadrant: 'tr', left: '58%', top: '38%' },
    { id: 'snow', name: 'SNOW-CMDB', value: '$1.4M', quadrant: 'tr', left: '36%', top: '62%' },
    { id: 'vpn', name: 'LEGACY-VPN', value: '$0.4M', quadrant: 'bl', left: '20%', top: '28%' },
    { id: 'crm', name: 'ON-PREM-CRM', value: '$1.1M', quadrant: 'bl', left: '56%', top: '56%' },
    { id: 'copilot', name: 'COPILOT-E5', value: '$2.8M', quadrant: 'br', left: '28%', top: '18%' },
    { id: 'nowassist', name: 'NOW-ASSIST', value: '$0.9M', quadrant: 'br', left: '60%', top: '42%' },
  ],
};

export const BROADSHEET_TFOW: TfowCard[] = [
  {
    name: 'Agent platform foundation',
    meta: 'Year 1 of 3 · $4.2M committed · attribution LOW',
    desc: 'Building the Sentinel/Steward/Atlas substrate that the rest of the AbarVa stack runs on. Won\'t show measured value until programs migrate.',
    chip: { label: 'Set attribution model →' },
  },
  {
    name: 'Data sovereignty re-architecture',
    meta: 'Year 1 of 2 · $1.8M committed · attribution MED',
    desc: 'Tied to EU operations. Compliance value is binary — either it lands by Q4 2026 or we\'re out of compliance, regardless of TCO.',
    chip: { label: 'Reg deadline · Dec 2026', warn: true },
  },
  {
    name: 'Vendor consolidation thesis',
    meta: 'Year 0 · $0.9M committed · attribution LOW',
    desc: 'Hypothesis: 23 strategic suppliers can become 12 by 2027. Atlas is modeling. No measured value until first wave of consolidations.',
    chip: { label: 'Connect Source EA brief →' },
  },
];

export const BROADSHEET_ATLAS: BroadsheetAtlas = {
  headline: 'Three threads run through this morning\'s pressures.',
  meta: '06:42 AM · Read time 90 sec · 3 observations · 4 prompts',
  observations: [
    {
      label: 'Observation · 01',
      body: 'The <strong>EA renewal</strong> isn\'t separate from the <strong>cost overrun</strong> and <strong>capability duplication</strong> — they share root nodes. If you take a posture on the EA without resolving the overlap, you\'ll renew at the wrong volumes.',
      action: '→ Open EA brief in Source',
    },
    {
      label: 'Observation · 02',
      body: 'Your <strong>portfolio ROI is at 2.8×, target 3.5×</strong>. The shortfall is concentrated in three programs (Joule, Copilot E5, Now Assist) where measured value is lagging committed by more than 40%. Two of those three are in the 47-day EA window.',
      action: '→ See programs lagging on value',
    },
    {
      label: 'Observation · 03',
      body: 'Adoption confidence is <strong>LOW</strong> because Okta and EntraID aren\'t connected. Until those land, the 24% Copilot number is directional, not auditable.',
      action: '→ Connect identity sources (5 min)',
    },
    {
      label: 'If you only do one thing today',
      body: '<em>Open the EA brief and read Atlas\'s negotiation thesis.</em> The other pressures route through it. Steward and Sentinel are both aligned on what the brief should ask for.',
      special: true,
    },
  ],
  prompts: [
    'Show me the 3 lagging programs',
    'What if I cut LLM tokens by 30%?',
    'Re-rank pressures by attribution confidence',
    'Brief me for the 9 AM staff meeting',
  ],
};

// ---------------------------------------------------------------------------
// Tower index view
// ---------------------------------------------------------------------------

export const TOWER_INDEX_VIEW = {
  tenant: 'Apex Retail Group',
  agentQuote:
    '3 active pressures. AI Cloud Spend is over budget and needs a decision this week. Vendor Risk is creeping up but the AMS BAFO decision should resolve it. Churn is improving — Contact Center AI is the likely driver.',
  agentContext: 'Atlas · Control Tower · cross-program pressures',
  actions: [
    {
      letter: 'A' as const,
      text: 'Review AI Cloud Spend options',
      detail: 'Path B: negotiate LLM rate card — material run-rate recovery',
    },
    {
      letter: 'B' as const,
      text: 'Clear AMS Vendor Consolidation BAFO',
      detail: 'Resolves 2 of 4 amber vendor risks',
    },
    {
      letter: 'C' as const,
      text: 'Brief sponsor on Churn trajectory',
      detail: 'Contact Center AI showing early signal — worth a 60-second update',
    },
  ],
  pressures: [PRESSURE_AI_CLOUD_SPEND, PRESSURE_VENDOR_RISK, PRESSURE_CUSTOMER_CHURN],
  activeCount: 3,
  highCount: 1,
};
