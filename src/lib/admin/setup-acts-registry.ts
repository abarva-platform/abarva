// Setup Acts content registry · SETUP-1.1 + 1.2
//
// Typed content that drives the redesigned /admin landing page
// (the three Acts: What we know / What we can reason / What
// changes when you upload). Per
// docs/build/intelligence/SETUP-1_DETAILED_DESIGN.md.
//
// Fixture-driven for now — keyed by tenant ClientKey. When Codex's
// persistence ships, the helper accessors swap fixture reads for
// live broker calls without touching component code.
//
// Voice rules (same as J0/J1 cards):
//   - Senior-practitioner librarian voice (Sentinel doctrine).
//   - No marketing language (unlock, accelerate, leverage,
//     empower, revolutionary, cutting-edge, game-changer,
//     best-in-class, next-generation).
//   - Specific, not abstract — name the segment, the program, the
//     pattern, the date.
//   - Provenance is naked: every fact cites its source segment.

import type { ClientKey } from '@/lib/client-config';

export type ActOneFactType =
  | 'enterprise'
  | 'priorities'
  | 'executives'
  | 'portfolio'
  | 'evidence'
  | 'systems'
  | 'kpis'
  | 'compliance';

export interface ActOneFact {
  factType: ActOneFactType;
  /** Mono kicker label (uppercase short form). */
  label: string;
  /** Body content — sentence or sentence-fragment. */
  value: string;
  /** Source segment id (01..14) from the spine doc Part C. */
  sourceSegmentId: string;
  /** Source segment display name. */
  sourceSegmentName: string;
  /** Days since last review, or null if no data. */
  lastReviewedDays: number | null;
}

export type CapabilityDepthState = 'grounded' | 'partial' | 'missing';

export type CapabilityFamily =
  | 'pattern-citations'
  | 'cross-program-signals'
  | 'evidence-grounded-qa'
  | 'outcome-measurement-readiness';

export interface CapabilityGroundingExample {
  /** Short display label. */
  label: string;
  /** Click-through href to the grounding record. */
  href: string;
}

export interface CapabilityNode {
  /** Stable id (e.g., 'cap.pattern-citations.cdp'). */
  id: string;
  family: CapabilityFamily;
  /** Display label (e.g., "17 patterns citable"). */
  label: string;
  /** Numeric count for the capability. */
  count: number;
  /** Singular/plural-aware count noun (e.g., "patterns citable", "contradictions open"). */
  countNoun: string;
  depthState: CapabilityDepthState;
  /** 2-4 grounding examples shown by default; expand for more. */
  groundingExamples: CapabilityGroundingExample[];
}

export interface CapabilityGainEntry {
  /** Stable id (e.g., 'gain.kpi-dictionary'). */
  id: string;
  /** Target segment id (01..14). */
  targetSegmentId: string;
  /** Target segment display name. */
  targetSegmentName: string;
  /** Headline of what the platform gains. */
  capabilityGained: string;
  /** "Today" preview — what Sentinel says today. */
  todayPreview: string;
  /** "After upload" preview — what Sentinel says with the data. */
  afterPreview: string;
  /** Programs that benefit; empty array if portfolio-wide. */
  impactedPrograms: string[];
  /** Rank for sorting (lower = higher priority). */
  rank: number;
}

export interface SetupActivityEvent {
  actor: string;
  /** Plain-language description of the event. */
  what: string;
  /** Relative timestamp ("2d ago"). */
  timestamp: string;
}

export type TenantDataRichness = 'rich' | 'partial' | 'sparse';

export interface SetupActsContent {
  tenantKey: ClientKey | 'unknown';
  tenantDisplayName: string;
  tenantDataRichness: TenantDataRichness;
  /** Sentinel-voice opener narrative. */
  sentinelOpener: string;
  actOneFacts: ActOneFact[];
  actTwoCapabilityNodes: CapabilityNode[];
  actThreeGainEntries: CapabilityGainEntry[];
  recentActivity: SetupActivityEvent[];
}

// ── Apex Retail fixture (rich) ────────────────────────────────────────────────

const APEX_OPENER = `I see Apex Retail Group as a $4.2B specialty retailer with 47 named executives in the bench and 4 active programs across customer-data, contact-center, application-managed-services, and demand-forecasting archetypes. Customer and martech instrumentation is rich; supply-chain instrumentation is thin. Three of your four programs are currently running with insufficient baseline data — one of which has a sponsor cadence gap that is the corpus's fastest-firing failure mode. Here's what I can reason about today, and what one more upload would change.`;

const APEX_ACT_ONE_FACTS: ActOneFact[] = [
  {
    factType: 'enterprise',
    label: 'ENTERPRISE',
    value:
      'Apex Retail Group · Specialty retail · $4.2B revenue · ~14,200 employees · FY ending January',
    sourceSegmentId: '01',
    sourceSegmentName: 'Enterprise Profile',
    lastReviewedDays: 12,
  },
  {
    factType: 'priorities',
    label: 'STRATEGIC PRIORITIES',
    value:
      'Margin recovery on owned-brand portfolio · Customer experience modernization · Operational efficiency at store level',
    sourceSegmentId: '01',
    sourceSegmentName: 'Enterprise Profile',
    lastReviewedDays: 12,
  },
  {
    factType: 'executives',
    label: 'EXECUTIVE BENCH',
    value:
      '47 named · CIO Lynne Stratham · CDO Marcus Park · CMO Hailey Reardon · 2 vacancies (CTO, VP Supply Chain Tech)',
    sourceSegmentId: '02',
    sourceSegmentName: 'Org Structure',
    lastReviewedDays: 8,
  },
  {
    factType: 'portfolio',
    label: 'ACTIVE PORTFOLIO',
    value:
      '4 programs in flight · CDP Activation (P3 Design) · Contact Center AI (P1 Discovery) · AMS Consolidation (P2 Synthesis, second attempt) · Demand Forecasting (P0 Originate, third attempt)',
    sourceSegmentId: '06',
    sourceSegmentName: 'Program Inventory',
    lastReviewedDays: 1,
  },
  {
    factType: 'evidence',
    label: 'EVIDENCE DEPTH',
    value:
      '412 evidence items · 47 stale (>90d) · 12 low-confidence · last upload 1 day ago',
    sourceSegmentId: '09',
    sourceSegmentName: 'Evidence Ledger',
    lastReviewedDays: 4,
  },
  {
    factType: 'systems',
    label: 'IT LANDSCAPE',
    value:
      '65 systems inventoried (gap vs ~80 expected) · 16 of ~124 integrations mapped · 12 systems missing named owner',
    sourceSegmentId: '03',
    sourceSegmentName: 'IT System Landscape',
    lastReviewedDays: 14,
  },
  {
    factType: 'kpis',
    label: 'KPI DICTIONARY',
    value:
      '50 of ~150 expected KPIs loaded · 8 flagged "claimed but not measured" · sparse coverage on supply-chain and store-operations metrics',
    sourceSegmentId: '05',
    sourceSegmentName: 'KPI Dictionary',
    lastReviewedDays: 21,
  },
];

const APEX_ACT_TWO_CAPABILITIES: CapabilityNode[] = [
  // Pattern citations
  {
    id: 'cap.pattern-citations',
    family: 'pattern-citations',
    label: '17 patterns citable',
    count: 17,
    countNoun: 'patterns citable',
    depthState: 'grounded',
    groundingExamples: [
      { label: 'AI Use Case Portfolio Management', href: '/intelligence/patterns/ai-use-case-portfolio-management' },
      { label: 'Vendor Sprawl Rationalization', href: '/intelligence/patterns/vendor-sprawl-ai-tool-rationalization' },
      { label: 'Demand Forecasting & Inventory AI', href: '/intelligence/patterns/demand-forecasting-inventory-ai' },
    ],
  },
  // Cross-program signals
  {
    id: 'cap.cross-program-signals',
    family: 'cross-program-signals',
    label: '18 detected · 3 contradictions open',
    count: 18,
    countNoun: 'signals detected',
    depthState: 'grounded',
    groundingExamples: [
      { label: 'apex-cdp + apex-ams share Vendor C dependency', href: '/intelligence/contradictions/vendor-c-dependency' },
      { label: 'apex-cc-ai sponsor cadence gap (severity high)', href: '/intelligence/contradictions/cc-ai-sponsor-cadence' },
      { label: 'apex-cdp + apex-forecast share data foundation gap', href: '/intelligence/contradictions/data-foundation-gap' },
    ],
  },
  // Evidence-grounded Q&A
  {
    id: 'cap.evidence-grounded-qa',
    family: 'evidence-grounded-qa',
    label: 'Partial · 412 items, sparse on workflow change',
    count: 412,
    countNoun: 'evidence items grounded',
    depthState: 'partial',
    groundingExamples: [
      { label: 'Vendor lock-in evidence (28 items)', href: '/admin/segments/09?filter=vendor-lock-in' },
      { label: 'Identity-resolution baseline (14 items)', href: '/admin/segments/09?filter=identity-resolution' },
      { label: 'Workflow change evidence (4 items, sparse)', href: '/admin/segments/09?filter=workflow-change' },
    ],
  },
  // Outcome measurement readiness
  {
    id: 'cap.outcome-measurement-readiness',
    family: 'outcome-measurement-readiness',
    label: 'Missing · 1 of 4 programs has baseline locked',
    count: 1,
    countNoun: 'programs with baseline locked',
    depthState: 'missing',
    groundingExamples: [
      { label: 'apex-ams-consolidation-2026 — baseline locked', href: '/programs/apex-ams-consolidation-2026' },
      { label: 'apex-cdp-2026 — baseline 71%, partial', href: '/programs/apex-cdp-2026' },
      { label: 'apex-cc-ai-2026 — containment baseline captured but data lineage unverified', href: '/programs/apex-cc-ai-2026' },
    ],
  },
];

const APEX_ACT_THREE_GAINS: CapabilityGainEntry[] = [
  {
    id: 'gain.kpi-dictionary',
    targetSegmentId: '05',
    targetSegmentName: 'KPI Dictionary',
    capabilityGained:
      'Sentinel can cite outcome attribution evidence with baseline KPI deltas',
    todayPreview:
      '"Outcome measurement is unverified — KPI dictionary not loaded. I cannot cite specific baseline metrics for your CDP or Contact Center AI programs."',
    afterPreview:
      '"CDP target shows 14% lift on identity-match-rate from 71% baseline. Contact Center AI shows 38% containment baseline locked. Both KPIs cite source systems and refresh cadence."',
    impactedPrograms: ['apex-cdp-2026', 'apex-cc-ai-2026'],
    rank: 1,
  },
  {
    id: 'gain.it-financials',
    targetSegmentId: '04',
    targetSegmentName: 'IT Financials',
    capabilityGained:
      'Atlas can model run-rate and consolidation impact across the program portfolio',
    todayPreview:
      '"I can\'t reason about the financial trade-offs of AMS Consolidation vs. Continue. The IT spend breakdown isn\'t loaded."',
    afterPreview:
      '"AMS Consolidation projects $4.2M annual savings against your current $87.4M IT budget; CDP and Demand Forecasting compete for the same $1.8M change-investment pool — sequencing matters."',
    impactedPrograms: ['apex-ams-consolidation-2026', 'apex-cdp-2026', 'apex-forecast-2026'],
    rank: 2,
  },
  {
    id: 'gain.compliance-posture',
    targetSegmentId: '12',
    targetSegmentName: 'Compliance Posture',
    capabilityGained:
      'Sentinel can answer governance-audit questions with full grounding and named control gaps',
    todayPreview:
      '"AI governance posture: I see the AI Council is named in the executive bench. I can\'t cite control gaps or framework adherence — compliance posture documents are 90 days stale."',
    afterPreview:
      '"AI governance audit-ready: 3 frameworks (SOX, PCI-DSS, CCPA/CPRA) documented. 6 control gaps identified — 3 affect active programs. Last audit findings cited with remediation status."',
    impactedPrograms: [],
    rank: 3,
  },
  {
    id: 'gain.system-landscape',
    targetSegmentId: '03',
    targetSegmentName: 'IT System Landscape',
    capabilityGained:
      'Sentinel can map system-program-vendor dependencies and surface integration risk',
    todayPreview:
      '"15 systems are missing named owners. Integration map covers 16 of ~124 integrations. CDP source-system inventory at P3 Design is missing the legacy in-store CRM."',
    afterPreview:
      '"CDP sources fully mapped (12 of 12 source systems with owners and lineage). AMS scope covers 47 candidate systems with technical-debt rating + renewal-window flags. 8 systems show vendor-concentration risk."',
    impactedPrograms: ['apex-cdp-2026', 'apex-ams-consolidation-2026'],
    rank: 4,
  },
  {
    id: 'gain.vendor-contracts',
    targetSegmentId: '11',
    targetSegmentName: 'Vendor & Contract Data',
    capabilityGained:
      'Sentinel can reason about exit terms, MFN clauses, and renewal exposure across vendors',
    todayPreview:
      '"Vendor scorecards loaded for 28 vendors. I can\'t cite specific contract clauses — clause inventory is partial (top 6 vendors only)."',
    afterPreview:
      '"Top 28 vendors with full clause inventory. AMS Consolidation faces 4 renewals in 90 days; 2 have MFN protection that limits walkaway. CDP vendor selection has 7-year exit-assistance clause requirements."',
    impactedPrograms: ['apex-ams-consolidation-2026', 'apex-cdp-2026'],
    rank: 5,
  },
];

const APEX_ACTIVITY: SetupActivityEvent[] = [
  {
    actor: 'Lynne Stratham',
    what: 'Uploaded systems_inventory.csv (12 systems added, 3 updated)',
    timestamp: '2 days ago',
  },
  {
    actor: 'Atlas',
    what: 'Detected new contradiction: apex-cdp + apex-ams share Vendor C dependency',
    timestamp: '3 days ago',
  },
  {
    actor: 'Marcus Park',
    what: 'Updated 4 evidence items in Vendor Lock-in cluster',
    timestamp: '4 days ago',
  },
  {
    actor: 'Sentinel',
    what: 'Flagged 6 evidence items as stale (>90d) in Compliance segment',
    timestamp: '5 days ago',
  },
];

const APEX_CONTENT: SetupActsContent = {
  tenantKey: 'apexretail',
  tenantDisplayName: 'Apex Retail Group',
  tenantDataRichness: 'rich',
  sentinelOpener: APEX_OPENER,
  actOneFacts: APEX_ACT_ONE_FACTS,
  actTwoCapabilityNodes: APEX_ACT_TWO_CAPABILITIES,
  actThreeGainEntries: APEX_ACT_THREE_GAINS,
  recentActivity: APEX_ACTIVITY,
};

// ── Default sparse fixture (cold tenant) ──────────────────────────────────────

const SPARSE_OPENER = `I don't know much about your enterprise yet. Start with these to give the platform something to reason about — every upload sharpens the next program decision.`;

const SPARSE_GAIN_ENTRIES: CapabilityGainEntry[] = [
  {
    id: 'gain.enterprise-profile',
    targetSegmentId: '01',
    targetSegmentName: 'Enterprise Profile',
    capabilityGained:
      'The platform can anchor every other artifact in your tenant identity',
    todayPreview:
      '"I have no enterprise profile. I cannot reason about your industry, scale, or strategic priorities."',
    afterPreview:
      '"Enterprise grounded: industry, revenue band, strategic priorities, regulatory framework. Every program is now contextualized against your specific posture."',
    impactedPrograms: [],
    rank: 1,
  },
  {
    id: 'gain.org-structure',
    targetSegmentId: '02',
    targetSegmentName: 'Org Structure',
    capabilityGained:
      'Sentinel can reason about sponsorship, decision rights, and political dynamics',
    todayPreview:
      '"I have no executive bench. I cannot identify named sponsors, decision-rights authority, or change-failure history."',
    afterPreview:
      '"Executive bench named. Programs gate on real sponsor cadence; change-failure record carries forward into program risk assessment."',
    impactedPrograms: [],
    rank: 2,
  },
  {
    id: 'gain.program-inventory',
    targetSegmentId: '06',
    targetSegmentName: 'Program Inventory',
    capabilityGained:
      'Programs surface lights up; cross-program reasoning becomes possible',
    todayPreview:
      '"I have no active programs. The platform\'s reasoning is limited to enterprise-level statements until programs are loaded."',
    afterPreview:
      '"Active programs in the corpus. Atlas detects cross-program signals; Nexus reasons about phase advancement; Sentinel cites pattern matches per archetype."',
    impactedPrograms: [],
    rank: 3,
  },
];

function buildSparseContent(
  tenantKey: ClientKey | 'unknown',
  tenantDisplayName: string,
): SetupActsContent {
  return {
    tenantKey,
    tenantDisplayName,
    tenantDataRichness: 'sparse',
    sentinelOpener: SPARSE_OPENER,
    actOneFacts: [],
    actTwoCapabilityNodes: [],
    actThreeGainEntries: SPARSE_GAIN_ENTRIES,
    recentActivity: [],
  };
}

// ── Public accessor ───────────────────────────────────────────────────────────

const TENANT_DISPLAY_NAMES: Record<ClientKey, string> = {
  meridian: 'Meridian Health System',
  arcturus: 'Arcturus Financial Group',
  apexretail: 'Apex Retail Group',
  keystone: 'Keystone Energy Holdings',
};

/**
 * Resolve the Setup Acts content for a tenant. Returns the rich
 * Apex fixture for `apexretail`; sparse fixture for any other
 * tenant key (until Codex's persistence ships and we read live
 * tenant data).
 */
export function getSetupActsContent(
  tenantKey: ClientKey | string | null,
): SetupActsContent {
  if (tenantKey === 'apexretail') {
    return APEX_CONTENT;
  }
  const knownKey =
    tenantKey && tenantKey in TENANT_DISPLAY_NAMES
      ? (tenantKey as ClientKey)
      : 'unknown';
  const displayName =
    knownKey === 'unknown'
      ? 'Your tenant'
      : TENANT_DISPLAY_NAMES[knownKey];
  return buildSparseContent(knownKey, displayName);
}

/**
 * Total counts for the page header summary. Returns null on each
 * field when not applicable.
 */
export function getSetupSummaryCounts(content: SetupActsContent): {
  totalRecords: number | null;
  segmentsTracked: number | null;
  capabilitiesGrounded: number | null;
} {
  const groundedCount = content.actTwoCapabilityNodes.filter(
    (n) => n.depthState === 'grounded',
  ).length;
  return {
    totalRecords: content.tenantDataRichness === 'rich' ? 1847 : null,
    segmentsTracked: content.tenantDataRichness === 'rich' ? 14 : null,
    capabilitiesGrounded: groundedCount,
  };
}
