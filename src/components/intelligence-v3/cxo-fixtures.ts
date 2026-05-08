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

export const BY_FN_OUTCOMES: ReadonlyArray<{ key: string; label: string }> = [
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

export type VendorTier = 'incumbent' | 'challenger' | 'emerging';
export type VendorHealth = 'healthy' | 'watch' | 'risk';

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

// ─── My strategy ─────────────────────────────────────────────────

export interface StrategyBullet {
  number: string;
  title: string;
  body: string;
  evidence: string;
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
