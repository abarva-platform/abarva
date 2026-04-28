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
  heroStat: '$2.4M',
  heroLabel: 'vs $1.8M budget',
  delta: '+33%',
  deltaDir: 'up',
  topDriver: 'LLM API inference spike · 3 new integrations launched in Q2',
  atlasSentence:
    'Spend is 33% over budget; LLM inference is the top driver — a negotiated rate card with the primary provider would recover $180K annually.',
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
    { letter: 'B' as const, text: 'Link churn metric to CC-AI outcome model', detail: 'Atlas can track attribution from Build → Activate' },
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

export const PRESSURE_DETAIL_MAP: Record<string, PressureDetail> = {
  'twr-vendor-risk': PRESSURE_DETAIL_VENDOR_RISK,
  'twr-customer-churn': PRESSURE_DETAIL_CUSTOMER_CHURN,
};

// ---------------------------------------------------------------------------
// Tower index view
// ---------------------------------------------------------------------------

export const TOWER_INDEX_VIEW = {
  tenant: 'Apex Retail Group',
  agentQuote:
    '3 active pressures. AI Cloud Spend is 33% over budget and needs a decision this week. Vendor Risk is creeping up but the AMS BAFO decision should resolve it. Churn is improving — Contact Center AI is the likely driver.',
  agentContext: 'Atlas · Control Tower · cross-program pressures',
  actions: [
    {
      letter: 'A' as const,
      text: 'Review AI Cloud Spend options',
      detail: 'Path B: negotiate LLM rate card — $180K/yr recovery',
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
