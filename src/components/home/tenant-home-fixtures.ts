// Tenant home page fixtures · Meridian / Apex / FirstCap.
//
// Locked design from docs/training/setup-home-{apex,firstcap,meridian}.html.
// Replaces the prior shell-home / HOME_VIEW pattern that another session
// regressed onto. Live overlay for these surfaces lands when substrate
// inventory APIs ship in PR-H13+; for now these fixtures match the
// wireframe verbatim so the page reads at locked design fidelity.

export type ReadinessTone = 'teal' | 'amber' | 'red';
export type PanelStatus = 'ready' | 'attn' | 'locked';
export type PillTone = 'tenant' | 'teal' | 'amber' | 'red' | 'muted' | 'navy';

export interface TenantTheme {
  /** Hex color, e.g. "#0F766E". */
  tenant: string;
  /** rgba color with low alpha for soft fills. */
  tenantSoft: string;
  /** rgba color for thin borders. */
  tenantLine: string;
}

export interface MastheadPill {
  label: string;
  tone: PillTone;
}

export interface ReadinessCard {
  module: string;
  name: string;
  pct: number;
  tone: ReadinessTone;
  note: string;
  href: string;
}

export interface StewardEntry {
  code: string;
  label: string;
  qty: string;
}

export interface StewardData {
  headline: string;
  loaded: ReadonlyArray<StewardEntry>;
  missing: ReadonlyArray<StewardEntry>;
  nextLoad: string;
}

export interface ActionRow {
  num: string;
  title: string;
  meta: string;
  time: string;
  primary?: boolean;
  href?: string;
}

export interface ActivityRow {
  time: string;
  actor: string;
  verb: string;
  target: string;
  context: string;
  isRecent: boolean;
}

export interface PanelCard {
  num: string;
  status: PanelStatus;
  name: string;
  desc: string;
  foot: string;
  href: string;
}

export interface NavItem {
  label: string;
  badge?: string;
  status: 'active' | 'attn' | 'locked' | 'default';
  href: string;
}

export interface NavGroup {
  label: string;
  items: ReadonlyArray<NavItem>;
}

export interface TenantHomeData {
  key: 'meridian' | 'apex' | 'firstcap';
  monogram: string;
  title: string;
  tagline: string;
  theme: TenantTheme;
  pills: ReadonlyArray<MastheadPill>;
  navGroups: ReadonlyArray<NavGroup>;
  navFootLines: ReadonlyArray<string>;
  readiness: ReadonlyArray<ReadinessCard>;
  steward: StewardData;
  actions: ReadonlyArray<ActionRow>;
  activity: ReadonlyArray<ActivityRow>;
  panels: ReadonlyArray<PanelCard>;
}

const SHARED_NAV: ReadonlyArray<NavGroup> = [
  {
    label: 'Workspace',
    items: [{ label: 'Overview', badge: '4', status: 'active', href: '/home' }],
  },
  {
    label: 'Data & Content',
    items: [
      { label: 'Data Trust', badge: '23', status: 'attn', href: '/home/data-trust' },
      { label: 'Connectors', badge: 'live', status: 'attn', href: '/home/connectors' },
      { label: 'AI Initiatives', badge: '7', status: 'attn', href: '/home/initiatives' },
    ],
  },
  {
    label: 'Access',
    items: [{ label: 'Users & Access', badge: 'RLS', status: 'default', href: '/home/users' }],
  },
  {
    label: 'Operations',
    items: [
      { label: 'Agent Readiness', badge: 'L2', status: 'attn', href: '/home/agent-readiness' },
      { label: 'Production Readiness', badge: '4 / 6', status: 'attn', href: '/home/production' },
      { label: 'Compliance', badge: 'locked', status: 'locked', href: '#' },
      { label: 'Activity Log', badge: '400', status: 'default', href: '/home/activity' },
    ],
  },
];

const SHARED_PANELS: ReadonlyArray<PanelCard> = [
  {
    num: '01',
    status: 'attn',
    name: 'Data Trust',
    desc: 'Substrate inventory, segment health, provenance of every record.',
    foot: '23 segments · 1.2k records',
    href: '/home/data-trust',
  },
  {
    num: '02',
    status: 'attn',
    name: 'AI Initiatives',
    desc: 'Registry of every AI bet — stage, owner, confidence, value posture.',
    foot: '7 initiatives · 1 at risk',
    href: '/home/initiatives',
  },
  {
    num: '03',
    status: 'attn',
    name: 'Connectors',
    desc: 'Live integrations: ServiceNow, Workday, Slack, vendor systems.',
    foot: 'live state surfaces in panel · audit shows recent ingest',
    href: '/home/connectors',
  },
  {
    num: '04',
    status: 'ready',
    name: 'Users & Access',
    desc: 'RLS posture, role coverage, scope ownership across roles.',
    foot: 'pilot: any user · production: admin/maestro',
    href: '/home/users',
  },
  {
    num: '05',
    status: 'attn',
    name: 'Agent Readiness',
    desc: 'Per-agent confidence — substrate depth · prompt grounding · trace coverage.',
    foot: 'Sentinel L2 · Atlas L3 · Steward L1',
    href: '/home/agent-readiness',
  },
  {
    num: '06',
    status: 'attn',
    name: 'Production Readiness',
    desc: 'Six gates — substrate, agents, ops, audit, RLS, escalation.',
    foot: '4 of 6 cleared',
    href: '/home/production',
  },
  {
    num: '07',
    status: 'locked',
    name: 'Compliance',
    desc: 'Policy, residency, audit hold settings — locked behind admin role.',
    foot: 'admin only',
    href: '#',
  },
  {
    num: '08',
    status: 'ready',
    name: 'Activity Log',
    desc: 'Tenant audit log · last 400 events with full provenance.',
    foot: '400 most recent · live tail',
    href: '/home/activity',
  },
];

// ─── Meridian Health ─────────────────────────────────────────────

export const MERIDIAN_HOME: TenantHomeData = {
  key: 'meridian',
  monogram: 'MH',
  title: 'Meridian Health System',
  tagline:
    '$14.2B integrated delivery network · 9 hospitals, 142 outpatient clinics, 3 research centers across 4 Midwest states · Epic EHR · AWS-primary cloud · Snowflake data platform',
  theme: {
    tenant: '#0F766E',
    tenantSoft: 'rgba(15,118,110,0.08)',
    tenantLine: 'rgba(15,118,110,0.20)',
  },
  pills: [
    { label: 'Industry: Healthcare IDN', tone: 'tenant' },
    { label: '23 segments loaded', tone: 'navy' },
    { label: '1.2k records', tone: 'navy' },
    { label: 'Substrate live', tone: 'teal' },
    { label: '6 segments need attention', tone: 'amber' },
    { label: 'Refreshed 22h ago', tone: 'muted' },
  ],
  navGroups: SHARED_NAV,
  navFootLines: ['Tenant data plane', 'meridian-health · live', '', 'Substrate v0.9', 'Composer v1.2'],
  readiness: [
    {
      module: 'Module 01',
      name: 'Tower',
      pct: 68,
      tone: 'amber',
      note: '15 programs observed. Atlas synthesis grounded.',
      href: '/tower',
    },
    {
      module: 'Module 02',
      name: 'Source',
      pct: 80,
      tone: 'teal',
      note: '12 source events live. Vendor and contract substrate available.',
      href: '/source',
    },
    {
      module: 'Module 03',
      name: 'Intelligence',
      pct: 74,
      tone: 'amber',
      note: '17 of 23 segments mature. Pattern-to-Move funnel ready for origination.',
      href: '/intelligence',
    },
    {
      module: 'Module 04',
      name: 'Strategic Moves',
      pct: 69,
      tone: 'amber',
      note: '7 initiatives in registry · 1 at risk. Gate criteria coverage informed.',
      href: '/strategic-moves',
    },
  ],
  steward: {
    headline:
      "Meridian Health's substrate is grounded across 17 of 23 segments. Agent reasoning will be confident on the loaded dimensions; directional where substrate is sparse.",
    loaded: [
      { code: 'F15', label: 'KPI quarterly history', qty: '260 records' },
      { code: 'F03', label: 'IT system landscape', qty: '171 records' },
      { code: 'F04', label: 'IT financials', qty: '136 records' },
      { code: 'F22', label: 'Graph relationships', qty: '67 records' },
      { code: 'F18', label: 'Financial model', qty: '62 records' },
    ],
    missing: [
      { code: 'F01', label: 'Enterprise profile', qty: '1 records · complete' },
      { code: 'F20', label: 'Scenario library', qty: 'sparse' },
      { code: 'F21', label: 'Vendor intelligence', qty: 'sparse' },
      { code: 'F16', label: 'Stakeholder discovery notes', qty: '3 records · partial' },
    ],
    nextLoad:
      "Strengthen 'Scenario library'. Currently sparse with 2 records. Sentinel reasoning will gain depth on this dimension.",
  },
  actions: [
    {
      num: '01',
      title: 'Review "Autonomous Helpdesk via ServiceNow" — flagged duplication risk',
      meta: 'INITIATIVE · MH-03 · pilot · measured 42% of committed annual',
      time: 'TODAY',
      primary: true,
      href: '/strategic-moves',
    },
    {
      num: '02',
      title: 'Load substrate for "Scenario library" (currently sparse)',
      meta: 'SUBSTRATE · F20 · 2 records · unblocks Sentinel reasoning',
      time: '2 DAYS',
      href: '/home/data-trust',
    },
    {
      num: '03',
      title: 'Load substrate for "Vendor intelligence" (currently sparse)',
      meta: 'SUBSTRATE · F21 · 2 records · unblocks Sentinel reasoning',
      time: '2 DAYS',
      href: '/home/data-trust',
    },
    {
      num: '04',
      title: 'Investigate value lag on "Model Governance & FinOps Platform"',
      meta: 'INITIATIVE · MH-07 · $0 measured vs $1.4M committed annual',
      time: 'THIS WEEK',
      href: '/strategic-moves',
    },
  ],
  activity: [
    {
      time: '22H AGO',
      actor: 'system (system_import)',
      verb: 'segment_imported',
      target: 'AI transformation intelligence',
      context: 'meridian-health-synthetic-dataset',
      isRecent: true,
    },
    {
      time: '23H AGO',
      actor: 'system (system_import)',
      verb: 'segment_imported',
      target: 'Stakeholder discovery notes',
      context: 'meridian-health-synthetic-dataset',
      isRecent: true,
    },
    {
      time: '23H AGO',
      actor: 'system (system_import)',
      verb: 'segment_imported',
      target: 'Peer benchmarking',
      context: 'meridian-health-synthetic-dataset',
      isRecent: false,
    },
    {
      time: '23H AGO',
      actor: 'system (system_import)',
      verb: 'segment_imported',
      target: 'Financial model',
      context: 'meridian-health-synthetic-dataset',
      isRecent: false,
    },
    {
      time: '23H AGO',
      actor: 'system (system_import)',
      verb: 'segment_imported',
      target: 'Decision traces',
      context: 'meridian-health-synthetic-dataset',
      isRecent: false,
    },
    {
      time: '23H AGO',
      actor: 'system (system_import)',
      verb: 'segment_imported',
      target: 'Scenario library',
      context: 'meridian-health-synthetic-dataset',
      isRecent: false,
    },
  ],
  panels: SHARED_PANELS,
};

// ─── Apex Retail ─────────────────────────────────────────────────

export const APEX_HOME: TenantHomeData = {
  key: 'apex',
  monogram: 'AR',
  title: 'Apex Retail Group',
  tagline:
    '$18B omnichannel retailer · 72,000 employees (retail-heavy) · 480 stores + 12 DCs + e-commerce · national US footprint · Shopify Plus + Salesforce Commerce + SAP S/4',
  theme: {
    tenant: '#C2410C',
    tenantSoft: 'rgba(194,65,12,0.08)',
    tenantLine: 'rgba(194,65,12,0.20)',
  },
  pills: [
    { label: 'Industry: Retail', tone: 'tenant' },
    { label: '23 segments loaded', tone: 'navy' },
    { label: '883 records', tone: 'navy' },
    { label: 'Substrate live', tone: 'teal' },
    { label: '6 segments need attention', tone: 'amber' },
    { label: 'Refreshed 22h ago', tone: 'muted' },
  ],
  navGroups: SHARED_NAV,
  navFootLines: ['Tenant data plane', 'apex-retail · live', '', 'Substrate v0.9', 'Composer v1.2'],
  readiness: [
    {
      module: 'Module 01',
      name: 'Tower',
      pct: 72,
      tone: 'amber',
      note: '12 programs observed · Contact Center AI in pilot.',
      href: '/tower',
    },
    {
      module: 'Module 02',
      name: 'Source',
      pct: 78,
      tone: 'teal',
      note: 'Vendor renewals tracked · 9 source events live.',
      href: '/source',
    },
    {
      module: 'Module 03',
      name: 'Intelligence',
      pct: 76,
      tone: 'amber',
      note: '18 of 23 segments mature. CDP and demand-forecast patterns ready.',
      href: '/intelligence',
    },
    {
      module: 'Module 04',
      name: 'Strategic Moves',
      pct: 71,
      tone: 'amber',
      note: '4 initiatives · CDP migration in flight, store productivity at risk.',
      href: '/strategic-moves',
    },
  ],
  steward: {
    headline:
      "Apex Retail's substrate is grounded across 18 of 23 segments. Workforce density is heavy; clinical/regulatory dimensions are not relevant for this tenant.",
    loaded: [
      { code: 'F15', label: 'KPI quarterly history', qty: '184 records' },
      { code: 'F03', label: 'IT system landscape', qty: '142 records' },
      { code: 'F04', label: 'IT financials', qty: '108 records' },
      { code: 'F08', label: 'Vendor & contract registry', qty: '93 records' },
      { code: 'F22', label: 'Graph relationships', qty: '54 records' },
    ],
    missing: [
      { code: 'F01', label: 'Enterprise profile', qty: '1 record · complete' },
      { code: 'F20', label: 'Scenario library', qty: 'sparse' },
      { code: 'F16', label: 'Stakeholder discovery notes', qty: '4 records · partial' },
      { code: 'F19', label: 'Customer LTV cohorts', qty: 'sparse' },
    ],
    nextLoad:
      "Strengthen 'Customer LTV cohorts'. Currently sparse · CDP migration ROI math is gated on this dimension.",
  },
  actions: [
    {
      num: '01',
      title: 'Approve "Contact Center AI · Phase 2 expansion" — pilot results landed',
      meta: 'INITIATIVE · AR-01 · 38% containment vs 22% target',
      time: 'TODAY',
      primary: true,
      href: '/strategic-moves',
    },
    {
      num: '02',
      title: 'Resolve store-associate productivity slip',
      meta: 'INITIATIVE · AR-03 · adoption 18% vs 35% target',
      time: '2 DAYS',
      href: '/strategic-moves',
    },
    {
      num: '03',
      title: 'Load substrate for "Customer LTV cohorts"',
      meta: 'SUBSTRATE · F19 · sparse · gates CDP ROI math',
      time: '2 DAYS',
      href: '/home/data-trust',
    },
    {
      num: '04',
      title: 'Confirm CDP migration sequencing with CFO',
      meta: 'INITIATIVE · AR-02 · $4.2M / 18 months · approval pending',
      time: 'THIS WEEK',
      href: '/strategic-moves',
    },
  ],
  activity: [
    {
      time: '22H AGO',
      actor: 'system (system_import)',
      verb: 'segment_imported',
      target: 'Vendor & contract registry',
      context: 'apex-retail-synthetic-dataset',
      isRecent: true,
    },
    {
      time: '23H AGO',
      actor: 'system (system_import)',
      verb: 'segment_imported',
      target: 'KPI quarterly history',
      context: 'apex-retail-synthetic-dataset',
      isRecent: true,
    },
    {
      time: '24H AGO',
      actor: 'system (system_import)',
      verb: 'segment_imported',
      target: 'IT system landscape',
      context: 'apex-retail-synthetic-dataset',
      isRecent: false,
    },
    {
      time: '1D AGO',
      actor: 'system (system_import)',
      verb: 'segment_imported',
      target: 'Customer touchpoint map',
      context: 'apex-retail-synthetic-dataset',
      isRecent: false,
    },
    {
      time: '1D AGO',
      actor: 'system (system_import)',
      verb: 'segment_imported',
      target: 'Store P&L by region',
      context: 'apex-retail-synthetic-dataset',
      isRecent: false,
    },
  ],
  panels: SHARED_PANELS,
};

// ─── First Capital Financial ─────────────────────────────────────

export const FIRSTCAP_HOME: TenantHomeData = {
  key: 'firstcap',
  monogram: 'FC',
  title: 'First Capital Financial',
  tagline:
    '$28B regional bank · consumer + commercial + wealth · 890 branches + 2,400 ATMs across 6 East Coast states · Finxact core + legacy · Snowflake + AWS primary',
  theme: {
    tenant: '#1E3A8A',
    tenantSoft: 'rgba(30,58,138,0.08)',
    tenantLine: 'rgba(30,58,138,0.20)',
  },
  pills: [
    { label: 'Industry: Financial Services', tone: 'tenant' },
    { label: '23 segments loaded', tone: 'navy' },
    { label: '617 records', tone: 'navy' },
    { label: 'Substrate live', tone: 'teal' },
    { label: '6 segments need attention', tone: 'amber' },
    { label: 'Refreshed 22h ago', tone: 'muted' },
  ],
  navGroups: SHARED_NAV,
  navFootLines: ['Tenant data plane', 'first-capital · live', '', 'Substrate v0.9', 'Composer v1.2'],
  readiness: [
    {
      module: 'Module 01',
      name: 'Tower',
      pct: 64,
      tone: 'amber',
      note: '11 programs observed · NIM compression top of mind.',
      href: '/tower',
    },
    {
      module: 'Module 02',
      name: 'Source',
      pct: 70,
      tone: 'amber',
      note: 'Innovaccer renewal in 8 months. Vendor substrate informed.',
      href: '/source',
    },
    {
      module: 'Module 03',
      name: 'Intelligence',
      pct: 72,
      tone: 'amber',
      note: '15 of 23 segments mature · CDO/CIO conflict named in patterns.',
      href: '/intelligence',
    },
    {
      module: 'Module 04',
      name: 'Strategic Moves',
      pct: 65,
      tone: 'amber',
      note: '5 initiatives · 1 model risk gov in flight, decisioning being shaped.',
      href: '/strategic-moves',
    },
  ],
  steward: {
    headline:
      "First Capital's substrate is grounded across 15 of 23 segments. Risk and decisioning dimensions are confident; customer LTV depth is sparse.",
    loaded: [
      { code: 'F15', label: 'KPI quarterly history', qty: '156 records' },
      { code: 'F11', label: 'Risk & compliance trail', qty: '92 records' },
      { code: 'F03', label: 'IT system landscape', qty: '88 records' },
      { code: 'F08', label: 'Vendor & contract registry', qty: '64 records' },
      { code: 'F18', label: 'Financial model', qty: '47 records' },
    ],
    missing: [
      { code: 'F01', label: 'Enterprise profile', qty: '1 record · complete' },
      { code: 'F19', label: 'Customer LTV cohorts', qty: 'sparse' },
      { code: 'F20', label: 'Scenario library', qty: 'sparse' },
      { code: 'F16', label: 'Stakeholder discovery notes', qty: '2 records · partial' },
    ],
    nextLoad:
      "Strengthen 'Customer LTV cohorts'. Decisioning modernization ROI math depends on this depth.",
  },
  actions: [
    {
      num: '01',
      title: 'Resolve CDO–CIO conflict on credit decisioning',
      meta: 'INITIATIVE · FC-04 · unresolved 3 quarters · CEO arbitration pending',
      time: 'TODAY',
      primary: true,
      href: '/strategic-moves',
    },
    {
      num: '02',
      title: 'Open Innovaccer renewal scan (8 months out)',
      meta: 'VENDOR · same factor profile as 2023 platform consolidation',
      time: 'THIS WEEK',
      href: '/source',
    },
    {
      num: '03',
      title: 'Brief CFO on NIM compression read',
      meta: 'KPI · 14bp/qtr × 3 quarters · accelerating',
      time: '2 DAYS',
      href: '/intelligence',
    },
    {
      num: '04',
      title: 'Load substrate for "Customer LTV cohorts"',
      meta: 'SUBSTRATE · F19 · sparse · unblocks decisioning ROI',
      time: '2 DAYS',
      href: '/home/data-trust',
    },
  ],
  activity: [
    {
      time: '22H AGO',
      actor: 'system (system_import)',
      verb: 'segment_imported',
      target: 'Risk & compliance trail',
      context: 'first-capital-synthetic-dataset',
      isRecent: true,
    },
    {
      time: '23H AGO',
      actor: 'system (system_import)',
      verb: 'segment_imported',
      target: 'KPI quarterly history',
      context: 'first-capital-synthetic-dataset',
      isRecent: true,
    },
    {
      time: '24H AGO',
      actor: 'system (system_import)',
      verb: 'segment_imported',
      target: 'Vendor & contract registry',
      context: 'first-capital-synthetic-dataset',
      isRecent: false,
    },
    {
      time: '1D AGO',
      actor: 'system (system_import)',
      verb: 'segment_imported',
      target: 'Decision traces',
      context: 'first-capital-synthetic-dataset',
      isRecent: false,
    },
    {
      time: '1D AGO',
      actor: 'system (system_import)',
      verb: 'segment_imported',
      target: 'Financial model',
      context: 'first-capital-synthetic-dataset',
      isRecent: false,
    },
  ],
  panels: SHARED_PANELS,
};

export const TENANT_HOME_BY_KEY: Record<string, TenantHomeData> = {
  meridian: MERIDIAN_HOME,
  meridianhealth: MERIDIAN_HOME,
  'meridian-health': MERIDIAN_HOME,
  apex: APEX_HOME,
  apexretail: APEX_HOME,
  'apex-retail': APEX_HOME,
  firstcap: FIRSTCAP_HOME,
  firstcapital: FIRSTCAP_HOME,
  'first-capital': FIRSTCAP_HOME,
};

export function resolveTenantHome(clientKey: string | null | undefined): TenantHomeData {
  if (!clientKey) return MERIDIAN_HOME;
  const k = clientKey.toLowerCase().replace(/[^a-z]/g, '');
  return (
    TENANT_HOME_BY_KEY[k] ??
    TENANT_HOME_BY_KEY[clientKey.toLowerCase()] ??
    MERIDIAN_HOME
  );
}
