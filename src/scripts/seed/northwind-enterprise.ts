// Synthetic-pilot tenant: Northwind Retail.
//
// Northwind is a FICTIONAL retail tenant used for the Synthetic Pilot
// Rehearsal — it is *not* a real customer and not a demo tenant in the
// canonical roster. The purpose is to walk a brand-new tenant end-to-end
// through every step a real pilot customer would experience, surfacing gaps
// before a real customer is in the room.
//
// Tenant key: `northwind` (canonical)
// Display:    "Northwind Retail"
// Industry:   RETAIL
// Function:   customer_care (retail customer-care Function Pack)
//
// The enterprise AI portfolio below mirrors the shape Apex/Meridian/First
// Capital carry (production / pilots / stalled / research / shadow) so the
// rehearsal walks the same data paths a real seeded tenant would. The
// metrics chosen for the contact-centre customer_care pack map cleanly to
// the pack's `operatingMetrics` keys via name normalisation — 6 of 12 are
// recorded, the rest become honest seed gaps when the binding runs.

import type { ClientSeed, UseCaseSeed } from './_shared/types';

const PRODUCTION: UseCaseSeed[] = [
  {
    name: 'M365 Copilot — corporate',
    description: '3,800 corporate seats; 41% DAU. Adoption flag — 39% inactive past 30 days.',
    business_unit: 'Enterprise IT',
    domain: 'Productivity',
    stage: 'realize',
    systems: ['Microsoft Copilot'],
    ai_type: 'GenAI',
    scope: 'enterprise',
    vendor: 'Microsoft Copilot',
    usage: { dau: 1560, wau: 2210, penetration_pct: 41, drop_off_rate_pct: 39, interactions_total: 360000 },
    value: {
      metric: 'meeting time savings (pct)',
      baseline: 0,
      target: 12,
      observed: 8,
      unit: 'percent',
      confidence: 'medium',
      driver: 'capacity_creation',
    },
    risk: { data: ['internal', 'PII'], risk_level: 'medium', governance: 'approved', hitl: false, vendor_posture: 'enterprise_tier' },
    cost: { llm: 56000, compute: 20000, storage: 5000, license: 34000, integration: 0, projected_6mo: 690000 },
  },
  {
    name: 'Contact-center agent assist',
    description: 'Cresta for 940 contact-centre agents; 31s AHT reduction; CSAT +3 pts.',
    business_unit: 'Customer Care',
    domain: 'Customer Service',
    stage: 'realize',
    systems: ['Cresta', 'Salesforce Service Cloud'],
    ai_type: 'GenAI',
    scope: 'department',
    vendor: 'Cresta',
    usage: { dau: 880, wau: 940, penetration_pct: 94, drop_off_rate_pct: 5, interactions_total: 460000 },
    value: {
      metric: 'average handle time (sec)',
      baseline: 318,
      target: 270,
      observed: 287,
      unit: 'seconds',
      confidence: 'high',
      driver: 'capacity_creation',
    },
    risk: { data: ['PII'], risk_level: 'medium', governance: 'approved', hitl: true, vendor_posture: 'enterprise_tier' },
    cost: { llm: 22000, compute: 14000, storage: 4000, license: 38000, integration: 0, projected_6mo: 468000 },
  },
  {
    name: 'Site search + on-site recs',
    description: 'Algolia + Constructor.io across northwind.com; 540M queries/mo.',
    business_unit: 'Digital',
    domain: 'E-commerce',
    stage: 'realize',
    systems: ['Algolia', 'Constructor.io'],
    ai_type: 'Predictive',
    scope: 'enterprise',
    vendor: 'Algolia',
    risk: { data: ['public'], risk_level: 'low', governance: 'approved', hitl: false, vendor_posture: 'enterprise_tier' },
    cost: { llm: 0, compute: 28000, storage: 9000, license: 42000, integration: 0, projected_6mo: 474000 },
  },
  {
    name: 'Fraud detection — e-commerce',
    description: 'Signifyd on all online transactions; 33% fraud loss reduction.',
    business_unit: 'Risk',
    domain: 'Fraud',
    stage: 'realize',
    systems: ['Signifyd'],
    ai_type: 'ML',
    scope: 'enterprise',
    vendor: 'Signifyd',
    value: { metric: 'fraud loss reduction (pct)', baseline: 0, target: 30, observed: 33, unit: 'percent', confidence: 'high', driver: 'risk_reduction' },
    risk: { data: ['PII', 'financial'], risk_level: 'high', governance: 'approved', hitl: false, vendor_posture: 'enterprise_tier' },
    cost: { llm: 0, compute: 90000, storage: 36000, license: 92000, integration: 0, projected_6mo: 1308000 },
  },
  {
    name: 'Demand forecasting',
    description: 'o9 Solutions across planning + merchandising; +3pt forecast accuracy.',
    business_unit: 'Supply Chain',
    domain: 'Planning',
    stage: 'realize',
    systems: ['o9 Solutions'],
    ai_type: 'Predictive',
    scope: 'enterprise',
    vendor: 'o9 Solutions',
    value: { metric: 'demand forecast accuracy (pct pt lift)', baseline: 66, target: 73, observed: 69, unit: 'percent', confidence: 'high', driver: 'cost_takeout' },
    risk: { data: ['internal'], risk_level: 'low', governance: 'approved', hitl: false, vendor_posture: 'enterprise_tier' },
    cost: { llm: 0, compute: 70000, storage: 24000, license: 180000, integration: 0, projected_6mo: 1644000 },
  },
];

const PILOTS: UseCaseSeed[] = [
  {
    name: 'Self-service chatbot — care deflection',
    description: 'Ada Pilot on top-12 contact reasons; 22% containment target.',
    business_unit: 'Customer Care',
    domain: 'Self-service',
    stage: 'evidence',
    systems: ['Ada'],
    ai_type: 'GenAI',
    scope: 'department',
    vendor: 'Ada',
    risk: { data: ['PII'], risk_level: 'medium', governance: 'conditional', hitl: true, vendor_posture: 'enterprise_tier' },
  },
  {
    name: 'IT service desk copilot',
    description: 'Moveworks pilot across 14,500 enterprise seats.',
    business_unit: 'Enterprise IT',
    domain: 'IT Operations',
    stage: 'execute',
    systems: ['Moveworks'],
    ai_type: 'Agent',
    scope: 'enterprise',
    vendor: 'Moveworks',
    risk: { data: ['internal'], risk_level: 'low', governance: 'approved', hitl: false, vendor_posture: 'enterprise_tier' },
  },
  {
    name: 'Pricing optimization',
    description: 'Blue Yonder pilot in 18 categories.',
    business_unit: 'Merchandising',
    domain: 'Pricing',
    stage: 'evidence',
    systems: ['Blue Yonder'],
    ai_type: 'Predictive',
    scope: 'department',
    vendor: 'Blue Yonder',
    risk: { data: ['internal'], risk_level: 'low', governance: 'approved', hitl: true, vendor_posture: 'enterprise_tier' },
  },
];

const STALLED: UseCaseSeed[] = [
  {
    name: 'Visual search',
    description: 'Syte pilot — conversion lift below threshold.',
    business_unit: 'Digital',
    domain: 'E-commerce',
    stage: 'stalled',
    systems: ['Syte'],
    ai_type: 'CV',
    scope: 'department',
    vendor: 'Syte',
    risk: { data: ['PII'], risk_level: 'low', governance: 'conditional', hitl: false, vendor_posture: 'enterprise_tier' },
  },
];

const RESEARCH: UseCaseSeed[] = [
  {
    name: 'Agentic customer service',
    description: 'Sierra evaluation — sequel to Ada pilot if containment lands.',
    business_unit: 'Customer Care',
    domain: 'Customer Service',
    stage: 'qualify',
    systems: ['Sierra'],
    ai_type: 'Agent',
    scope: 'department',
    vendor: 'Sierra',
  },
];

const SHADOW: UseCaseSeed[] = [
  {
    name: 'Shadow · Care leads on consumer ChatGPT',
    description: 'Care managers drafting policy on personal accounts; no DPA.',
    business_unit: 'Customer Care',
    domain: 'Shadow AI',
    stage: 'stalled',
    systems: ['OpenAI'],
    ai_type: 'GenAI',
    scope: 'single_workflow',
    vendor: 'OpenAI',
    shadow: true,
    risk: { data: ['PII'], risk_level: 'medium', governance: 'pending', hitl: false, vendor_posture: 'consumer' },
  },
];

export const NORTHWIND_ENTERPRISE: ClientSeed = {
  name: 'Northwind Retail',
  useCases: [...PRODUCTION, ...PILOTS, ...STALLED, ...RESEARCH, ...SHADOW],
};

// ─────────────────────────────────────────────────────────────────────────────
// Baseline metrics for the rehearsal Move.
// ─────────────────────────────────────────────────────────────────────────────
//
// The rehearsal Move ("Reduce repeat contact-center transfers") binds the
// retail `customer_care` Function Pack. The pack carries 12 operating metrics
// (FCR, AHT, CSAT, CPC, NPS, escalation, abandonment, etc.). Northwind
// records 7 of them with synthetic-but-realistic values, and the remaining 5
// surface as honest seed gaps when `bindFunctionPackForArtifact` runs.
//
// Names match the pack's metric `name` field (or `key`) under
// `normalizeMetricLabel` — `tenant-metric-inventory.ts` reconciles them.

export interface NorthwindBaselineMetric {
  metric_name: string;
  value: number;
  unit: string;
  source: string;
  as_of: string;
}

export const NORTHWIND_BASELINE_METRICS_CUSTOMER_CARE: NorthwindBaselineMetric[] = [
  {
    metric_name: 'First-contact resolution (FCR)',
    value: 68,
    unit: '% of contacts resolved on the first interaction',
    source: 'Salesforce Service Cloud · Q1 2026 rollup',
    as_of: '2026-03-31',
  },
  {
    metric_name: 'Average handle time (AHT)',
    value: 7.2,
    unit: 'minutes per agent-handled contact',
    source: 'NICE CXone ACD · Q1 2026',
    as_of: '2026-03-31',
  },
  {
    metric_name: 'Cost per contact',
    value: 6.4,
    unit: 'USD per contact',
    source: 'Care finance ledger Q1 2026 allocated to channel mix',
    as_of: '2026-03-31',
  },
  {
    metric_name: 'Customer satisfaction score (CSAT)',
    value: 81,
    unit: '% of surveyed contacts rated satisfied or better',
    source: 'Qualtrics post-contact survey · Q1 2026',
    as_of: '2026-03-31',
  },
  {
    metric_name: 'Service Net Promoter Score',
    value: 28,
    unit: 'NPS points',
    source: 'Qualtrics post-service NPS · Q1 2026',
    as_of: '2026-03-31',
  },
  {
    metric_name: 'Escalation rate',
    value: 14,
    unit: '% of contacts escalated beyond first-tier resolution',
    source: 'Salesforce Service Cloud transfer events · Q1 2026',
    as_of: '2026-03-31',
  },
  {
    metric_name: 'Contact abandonment rate',
    value: 9,
    unit: '% of queued contacts abandoned before resolution',
    source: 'NICE CXone ACD · Q1 2026',
    as_of: '2026-03-31',
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// Charter used by the rehearsal Move.
// ─────────────────────────────────────────────────────────────────────────────

export const NORTHWIND_REHEARSAL_MOVE = {
  name: 'Reduce repeat contact-center transfers',
  problemStatement:
    'Repeat transfers between care tiers run at 14% of contacts. Each escalation adds AHT and erodes CSAT; transfers are concentrated in delivery-exception and returns disputes where first-tier agents lack the authority to resolve.',
  targetOutcome:
    'Cut escalation rate from 14% to 8% within 9 months; recover ~$2.4M of cost-per-contact spend and lift FCR by 4 pts.',
  timeline: 'Phase 0 charter in May; Discover by July; pilot in two contact centres Q3.',
  classification: 'operational_excellence',
  sponsor: 'CDO — Northwind Retail',
  tenantKey: 'northwind',
  industryCode: 'RETAIL',
} as const;
