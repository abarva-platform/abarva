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
