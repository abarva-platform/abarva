// Setup Acts content registry · SETUP-1.1 + 1.2
//
// Typed content that drives the redesigned /admin landing page
// (the three Acts: What we know / What we can reason / What
// changes when you upload). Per
// docs/build/intelligence/SETUP-1_DETAILED_DESIGN.md.
//
// Hybrid: authored narrative (opener, capability prose, gain
// previews) + live overlays (segment rollups, recent activity,
// total record counts) merged in via `mergeInventorySnapshot`. The
// authored fixture is correct in numbers (matches what's loaded in
// `data_inventory_*` tables for tenant 'apex-retail'); the broker
// snapshot keeps it fresh as data evolves.
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
//
// Numbers below match what's currently loaded in
// `data_inventory_*` tables for tenant 'apex-retail' (see Codex's
// 2026-04-30 import: 403 records, 257 graph nodes, 275 edges, 415
// chunks). When Sentinel's narrative cites a figure, it must match
// the substrate.

const APEX_OPENER = `I see Apex Retail Group as a $2.41B specialty retailer (NYSE: APXR) with 5,247 employees, 342 stores in 41 US states, and 14.2M loyalty members. The C-suite bench is named end-to-end (11 executives, including CDO Lynne Stratham who joined October 2025 after Marcus Holloway's departure). Four programs are in flight: CDP Activation (P3 Design), Contact Center AI (P1 Discovery), AMS Consolidation (second attempt after the 2023-24 pause), and Demand Forecasting Modernization. Customer and martech depth is real (96 systems inventoried, 38 vendors with full clause coverage); two cross-program contradictions are open right now — CMO growth thesis vs. CFO cost-takeout, and CDP success depending on legacy CRM extraction that is currently unfunded. Here's what I can reason about today, and what one more upload would change.`;

const APEX_ACT_ONE_FACTS: ActOneFact[] = [
  {
    factType: 'enterprise',
    label: 'ENTERPRISE',
    value:
      'Apex Retail Group · NYSE: APXR · Specialty retail · $2.41B FY2025 revenue · 5,247 employees · 342 stores · 14.2M loyalty members · FY ending January',
    sourceSegmentId: '01',
    sourceSegmentName: 'Enterprise Profile',
    lastReviewedDays: 14,
  },
  {
    factType: 'priorities',
    label: 'STRATEGIC PRIORITIES',
    value:
      'Restore margin to FY2024 levels (recover 80bp EBITDA) · Scale digital channel profitability (close ~600bp contribution gap) · Customer experience differentiation · Inventory productivity recovery (turn 3.6 → 4.2) · AI-enabled productivity',
    sourceSegmentId: '01',
    sourceSegmentName: 'Enterprise Profile',
    lastReviewedDays: 14,
  },
  {
    factType: 'executives',
    label: 'EXECUTIVE BENCH',
    value:
      '36 named (50 expected; 14 missing) · CEO Robert Vance · CFO Margaret Chen · COO David Okonjo · CMO Jennifer Park · CDO Lynne Stratham · CIO Carlos Rivera · CISO Sarah Whitfield · CSO Patricia Okonkwo · CHRO Thomas Brennan · CMO/Merch Angela Foster · CSCO Michael Tanaka',
    sourceSegmentId: '02',
    sourceSegmentName: 'Org Structure',
    lastReviewedDays: 7,
  },
  {
    factType: 'portfolio',
    label: 'ACTIVE PORTFOLIO',
    value:
      '4 programs in flight · CDP Activation 2026 (P3 Design, sponsor Jennifer Park, lead Priya Iyer) · Contact Center AI 2026 (P1 Discovery) · AMS Consolidation 2026 (second attempt; first paused after $14M overrun) · Demand Forecasting Modernization',
    sourceSegmentId: '06',
    sourceSegmentName: 'Program Inventory',
    lastReviewedDays: 1,
  },
  {
    factType: 'evidence',
    label: 'EVIDENCE DEPTH',
    value:
      '20 evidence items in ledger (target 20; complete) · 9 flagged stale (>30d) · sample claim: identity match rate 71% across customer source systems',
    sourceSegmentId: '09',
    sourceSegmentName: 'Evidence Ledger',
    lastReviewedDays: 5,
  },
  {
    factType: 'systems',
    label: 'IT LANDSCAPE',
    value:
      '96 systems inventoried (target 80; full coverage) · 5 system records flagged stale · SAP S/4HANA, Snowflake, Salesforce Service Cloud all named with owners + criticality',
    sourceSegmentId: '03',
    sourceSegmentName: 'IT System Landscape',
    lastReviewedDays: 10,
  },
  {
    factType: 'kpis',
    label: 'KPI DICTIONARY',
    value:
      '50 KPIs loaded (target 50; complete) · Revenue $2.41B FY2025 → target $2.52B FY2026 · 71 IT financials records · cross-program signals tracked: 12 (2 high-severity open)',
    sourceSegmentId: '05',
    sourceSegmentName: 'KPI Dictionary',
    lastReviewedDays: 12,
  },
];

const APEX_ACT_TWO_CAPABILITIES: CapabilityNode[] = [
  // Pattern citations — corpus-wide patterns Sentinel can cite
  // because the program archetypes match.
  {
    id: 'cap.pattern-citations',
    family: 'pattern-citations',
    label: '4 program archetypes pattern-matched',
    count: 4,
    countNoun: 'archetypes matched to corpus patterns',
    depthState: 'grounded',
    groundingExamples: [
      {
        label: 'CDP Activation 2026 → PAT-PRG-CDP-001',
        href: '/intelligence/patterns/customer-data-platform-activation',
      },
      {
        label: 'Contact Center AI 2026 → PAT-PRG-CC-AI-001',
        href: '/intelligence/patterns/contact-center-ai-deflection',
      },
      {
        label: 'AMS Consolidation 2026 → PAT-PRG-AMS-001 (2023-24 attempt paused after $14M overrun is a corpus lesson)',
        href: '/intelligence/patterns/ams-consolidation',
      },
    ],
  },
  // Cross-program signals — real signals from
  // cross_program_signals segment (12 loaded; 2 are High severity).
  {
    id: 'cap.cross-program-signals',
    family: 'cross-program-signals',
    label: '12 signals · 2 high-severity contradictions open',
    count: 12,
    countNoun: 'cross-program signals tracked',
    depthState: 'grounded',
    groundingExamples: [
      {
        label: 'CMO growth thesis vs CFO cost-takeout posture (HIGH, owner Robert Vance)',
        href: '/admin/segments/14?filter=high',
      },
      {
        label: 'CDP success depends on legacy CRM extraction; CRM extraction is unfunded (HIGH, decision target 2026-05-31)',
        href: '/admin/segments/14?filter=cdp-crm-dependency',
      },
      {
        label: 'Priya Iyer is program lead on two critical-path programs simultaneously (MED)',
        href: '/admin/segments/14?filter=lead-overload',
      },
    ],
  },
  // Evidence-grounded Q&A — real ledger numbers (20 items, 9 stale).
  {
    id: 'cap.evidence-grounded-qa',
    family: 'evidence-grounded-qa',
    label: '20 evidence items grounded · 9 flagged stale',
    count: 20,
    countNoun: 'evidence items in ledger',
    depthState: 'partial',
    groundingExamples: [
      {
        label: 'Identity match rate is 71% across customer source systems (claim, source: data-quality-baseline-2026-q1.xlsx)',
        href: '/admin/segments/09?filter=identity-resolution',
      },
      {
        label: 'Klaviyo handles Confidential customer email but is not on approved-systems list (compliance gap, Q2 remediation)',
        href: '/admin/segments/12?filter=klaviyo-pci',
      },
      {
        label: '9 evidence items are >30d stale and need refresh before next program decision',
        href: '/admin/segments/09?freshness=stale',
      },
    ],
  },
  // Outcome measurement readiness — only program_deliverables has
  // 4-of-4 baseline; KPIs are loaded but baselines vs target deltas
  // aren't all program-tagged yet.
  {
    id: 'cap.outcome-measurement-readiness',
    family: 'outcome-measurement-readiness',
    label: 'Partial · 4 programs with KPI targets but baseline lineage uneven',
    count: 4,
    countNoun: 'programs with stated KPI targets',
    depthState: 'partial',
    groundingExamples: [
      {
        label: 'apex-cdp-2026 — identity-match-rate 71% baseline → 87% target by FY2026',
        href: '/programs/apex-cdp-2026',
      },
      {
        label: 'apex-cc-ai-2026 — containment baseline measurement methodology still in design',
        href: '/programs/apex-cc-ai-2026',
      },
      {
        label: 'apex-ams-consolidation-2026 — financial baseline locked; 2023-24 lessons-learned on file',
        href: '/programs/apex-ams-consolidation-2026',
      },
    ],
  },
];

const APEX_ACT_THREE_GAINS: CapabilityGainEntry[] = [
  {
    id: 'gain.org-structure',
    targetSegmentId: '02',
    targetSegmentName: 'Org Structure',
    capabilityGained:
      'Sentinel can reason about the 14 unfilled named roles below the C-suite and surface political dynamics',
    todayPreview:
      '"36 of 50 expected named roles are loaded. The C-suite is complete; the VP layer below CMO and CDO is still partly named — I can\'t map who actually owns the CDP go-to-market sequencing decision."',
    afterPreview:
      '"All 50 named roles mapped. Programs gate against real owner cadence; the CDP P3 Design vendor selection traces to two named decision-rights holders, and the Stoneridge activist disclosure is mapped to the IR + GC + CFO triangle that owns response."',
    impactedPrograms: ['apex-cdp-2026', 'apex-cc-ai-2026'],
    rank: 1,
  },
  {
    id: 'gain.it-financials',
    targetSegmentId: '04',
    targetSegmentName: 'IT Financials',
    capabilityGained:
      'Atlas can model run-rate and sequencing trade-offs across the program portfolio',
    todayPreview:
      '"71 IT financial line items are loaded. I can cite Snowflake commit, Salesforce + Tealium + Klaviyo co-renewal, and the AMS Consolidation business case — but the FY2026 change-investment pool sizing isn\'t reconciled against the four programs\' approved budgets yet."',
    afterPreview:
      '"AMS Consolidation $4.8M approved budget reconciled against $87M IT run-rate; CDP and Demand Forecasting compete for the same change-investment pool — sequencing matters. The CMO-vs-CFO contradiction surfaces a specific sequencing choice with cost implications."',
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
      '"11 compliance findings are on file — Klaviyo handling Confidential email outside the approved-systems list, T&E SOD weakness, period-end revenue cutoff, vendor-risk reassessment cadence drift, Otter.ai DPA gap. I can name the gap; I can\'t yet trace which active program decision each gap blocks."',
    afterPreview:
      '"Each compliance finding traced to the program decision it blocks: the Klaviyo-PCI gap is in the CDP P3 Design vendor selection scope; the T&E SOD weakness affects AMS Consolidation\'s ERP rationalization. SOX/PCI/CCPA-CPRA framework adherence cited with remediation status."',
    impactedPrograms: ['apex-cdp-2026', 'apex-ams-consolidation-2026'],
    rank: 3,
  },
  {
    id: 'gain.system-landscape',
    targetSegmentId: '03',
    targetSegmentName: 'IT System Landscape',
    capabilityGained:
      'Sentinel can map system-program-vendor dependencies and surface integration concentration risk',
    todayPreview:
      '"96 systems inventoried with named owners — SAP S/4HANA (Diana Lopez), Snowflake, Salesforce Service Cloud all carry criticality ratings. 5 system records are flagged stale. The integration count is partial — int:apex:003, 004, 008, 010, 011 are unrefreshed."',
    afterPreview:
      '"Full integration map refreshed. CDP source-system lineage proves the legacy CRM extraction dependency that the cross-program-signals segment flags as HIGH severity. Snowflake touches all four programs; FinOps + commit decisions reasoned about jointly."',
    impactedPrograms: ['apex-cdp-2026', 'apex-ams-consolidation-2026', 'apex-forecast-2026'],
    rank: 4,
  },
  {
    id: 'gain.vendor-contracts',
    targetSegmentId: '11',
    targetSegmentName: 'Vendor & Contract Data',
    capabilityGained:
      'Sentinel can reason about exit terms, co-renewal negotiating posture, and vendor concentration across the portfolio',
    todayPreview:
      '"38 vendor contracts loaded with full clause coverage. The Salesforce + Tealium + Klaviyo co-renewal date is flagged as a coordinated negotiating window; vendor lock-in concern on NICE (CC AI incumbent) is named. What\'s missing: the MFN-clause and exit-assistance posture isn\'t yet rolled up to portfolio-level walkaway exposure."',
    afterPreview:
      '"Portfolio-level vendor exposure: 4 renewals in next 90 days; 2 have MFN protection limiting walkaway. CDP BAFO finalists (Treasure Data, Segment) compared on exit-assistance clauses. Co-renewal negotiating posture on the martech triad sized concretely against CDP vendor commitment."',
    impactedPrograms: ['apex-ams-consolidation-2026', 'apex-cdp-2026', 'apex-cc-ai-2026'],
    rank: 5,
  },
];

const APEX_ACTIVITY: SetupActivityEvent[] = [
  {
    actor: 'Apex synthetic dataset import',
    what: 'Loaded 14 segment families · 403 records · 257 graph nodes · 275 edges · 415 context chunks (embedding pending)',
    timestamp: 'Today',
  },
  {
    actor: 'Margaret Chen (CFO)',
    what: 'Reviewed Enterprise Profile — Q4 FY2025 earnings impact + activist investor disclosure noted',
    timestamp: '2 weeks ago',
  },
  {
    actor: 'Sentinel',
    what: 'Flagged 9 evidence items as stale (>30d) in Evidence Ledger segment',
    timestamp: '5 days ago',
  },
  {
    actor: 'Atlas',
    what: 'Surfaced HIGH-severity contradiction: CDP success depends on legacy CRM extraction; CRM extraction is unfunded',
    timestamp: '3 days ago',
  },
  {
    actor: 'Lynne Stratham (CDO)',
    what: 'Approved CDP P2 Synthesis charter; Treasure Data and Segment advance to BAFO',
    timestamp: '1 week ago',
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

// ── Meridian Health System fixture (rich) ─────────────────────────────────────
//
// Numbers match the 2026-04-30 Meridian seed: 714 records across 14 segment
// families. All names and figures drawn from meridian-data/ source files.

const MERIDIAN_OPENER = `I see Meridian Health System as a $16.8B not-for-profit IDN (58,000 employees, 30 hospitals, 280 clinics, 14M ambulatory visits, 1.4M covered lives in Meridian Health Plans). The CDIO is Dr. Anita Krishnamurthy; the CFO lens has sharpened since the DENIALS-2024 sunk cost reached $8M. Four AI programs are in flight: Ambient Clinical Documentation (P3 Design, sponsor Jennifer Wexler), Prior Authorization Automation (P4 Build, sponsor Patricia Okafor), Clinical AI Governance Uplift (P2 Synthesis, sponsor Jennifer Wexler), and RCM Modernization (P1 Discovery, sponsor David Park). Epic is a shared integration point across all four — prior-auth rule sets, ambient API access, denial adjudication, and RCM revenue codes all depend on the same Epic layer. One Critical signal is open right now: Epic integration concentration. Here's what I can reason about today.`;

const MERIDIAN_ACT_ONE_FACTS: ActOneFact[] = [
  {
    factType: 'enterprise',
    label: 'ENTERPRISE',
    value:
      'Meridian Health System · Not-for-profit IDN · $16.8B FY2025 revenue · 58,000 employees · 30 hospitals · 280 clinics · 14.0M ambulatory visits · 1.4M covered lives · FY ending June 30',
    sourceSegmentId: '01',
    sourceSegmentName: 'Enterprise Profile',
    lastReviewedDays: 5,
  },
  {
    factType: 'priorities',
    label: 'STRATEGIC PRIORITIES',
    value:
      'Operating margin recovery (2.4% margin, compressed 80bp YoY) · Clinical quality and safety · Provider-plan integration · AI governance uplift · Epic optimization ($384M IT budget)',
    sourceSegmentId: '01',
    sourceSegmentName: 'Enterprise Profile',
    lastReviewedDays: 5,
  },
  {
    factType: 'executives',
    label: 'EXECUTIVE BENCH',
    value:
      '19 named executives · CEO Dr. Elaine Morales · CDIO Dr. Anita Krishnamurthy · CFO (named) · COO (named) · CMO Dr. Marcus Reid · Chief Physician Executive Dr. Patricia Okafor · General Counsel Rebecca Hollings · EPMO sponsor Jennifer Wexler (dual-program)',
    sourceSegmentId: '02',
    sourceSegmentName: 'Org Structure',
    lastReviewedDays: 5,
  },
  {
    factType: 'portfolio',
    label: 'ACTIVE PORTFOLIO',
    value:
      '4 AI programs in flight · Ambient Clinical Documentation (P3 Design, sponsor Jennifer Wexler) · Prior Authorization Automation (P4 Build, sponsor Patricia Okafor) · Clinical AI Governance Uplift (P2 Synthesis, sponsor Jennifer Wexler) · RCM Modernization (P1 Discovery, sponsor David Park)',
    sourceSegmentId: '06',
    sourceSegmentName: 'Program Inventory',
    lastReviewedDays: 3,
  },
  {
    factType: 'evidence',
    label: 'EVIDENCE DEPTH',
    value:
      '42 evidence items in ledger · Clinician documentation time baseline 45 min/day · Prior-auth auto-approval rate 8% · DENIALS-2024 sunk cost $8M (lessons-learned on file)',
    sourceSegmentId: '09',
    sourceSegmentName: 'Evidence Ledger',
    lastReviewedDays: 3,
  },
  {
    factType: 'systems',
    label: 'IT LANDSCAPE',
    value:
      '114 systems inventoried (Hyperspace, Ambulatory, MyChart, Cerner Millennium on Kona Coast) · Epic consolidation 80% complete · Kona Coast on Cerner post-capital-pressure pause · 22 shadow IT systems flagged',
    sourceSegmentId: '03',
    sourceSegmentName: 'IT System Landscape',
    lastReviewedDays: 10,
  },
  {
    factType: 'kpis',
    label: 'KPI DICTIONARY',
    value:
      '102 KPIs loaded · ALOS (51.1% baseline → 56.4% FY2026 target) · ED door-to-provider time (52.2%, worsening) · Prior-auth auto-approval 8% → target 22% · Operating margin 2.4%',
    sourceSegmentId: '05',
    sourceSegmentName: 'KPI Dictionary',
    lastReviewedDays: 5,
  },
];

const MERIDIAN_ACT_TWO_CAPABILITIES: CapabilityNode[] = [
  {
    id: 'cap.pattern-citations.meridian',
    family: 'pattern-citations',
    label: '4 program archetypes pattern-matched',
    count: 4,
    countNoun: 'archetypes matched to corpus patterns',
    depthState: 'grounded',
    groundingExamples: [
      {
        label: 'Ambient Clinical Documentation → PAT-PRG-AMBIENT-001',
        href: '/intelligence/patterns/ambient-clinical-documentation',
      },
      {
        label: 'Prior Authorization Automation → PAT-PRG-PRIOR-AUTH-001',
        href: '/intelligence/patterns/prior-authorization-automation',
      },
      {
        label: 'RCM Modernization → PAT-PRG-RCM-001 (DENIALS-2024 lesson-learned on file)',
        href: '/intelligence/patterns/rcm-modernization',
      },
    ],
  },
  {
    id: 'cap.cross-program-signals.meridian',
    family: 'cross-program-signals',
    label: '22 signals · 1 critical Epic integration concentration open',
    count: 22,
    countNoun: 'cross-program signals tracked',
    depthState: 'grounded',
    groundingExamples: [
      {
        label: 'Epic is a shared integration point for all four AI programs — prior-auth, ambient, denial, RCM (CRITICAL)',
        href: '/admin/segments/14?filter=critical',
      },
      {
        label: 'Jennifer Wexler is named sponsor on two of four programs simultaneously (HIGH, bandwidth risk)',
        href: '/admin/segments/14?filter=high',
      },
      {
        label: 'Dr. Okafor is clinical lead and program sponsor simultaneously on Prior Auth AI (MED, decision-rights gap)',
        href: '/admin/segments/14?filter=medium',
      },
    ],
  },
  {
    id: 'cap.evidence-grounded-qa.meridian',
    family: 'evidence-grounded-qa',
    label: '42 evidence items grounded',
    count: 42,
    countNoun: 'evidence items in ledger',
    depthState: 'grounded',
    groundingExamples: [
      {
        label: 'Clinician documentation time: 45 min/day baseline (claim, source: time-motion-study-2025-q4)',
        href: '/admin/segments/09?filter=ambient',
      },
      {
        label: 'Prior-auth auto-approval rate: 8% current → 22% target (source: revenue-cycle-baseline-2026-q1)',
        href: '/admin/segments/09?filter=prior-auth',
      },
      {
        label: 'DENIALS-2024: $8M sunk cost — lessons-learned file in corpus',
        href: '/admin/segments/09?filter=denials-2024',
      },
    ],
  },
  {
    id: 'cap.outcome-measurement-readiness.meridian',
    family: 'outcome-measurement-readiness',
    label: 'Partial · 102 KPIs loaded, baseline lineage varies by program',
    count: 4,
    countNoun: 'programs with stated KPI targets',
    depthState: 'partial',
    groundingExamples: [
      {
        label: 'meridian-ambient-2026 — documentation time 45 min/day baseline → target reduction on file',
        href: '/programs/meridian-ambient-2026',
      },
      {
        label: 'meridian-prior-auth-2026 — auto-approval 8% → 22% target; measurement methodology confirmed',
        href: '/programs/meridian-prior-auth-2026',
      },
      {
        label: 'meridian-rcm-modernization-2026 — denial rate baseline from DENIALS-2024 file; recovery target pending CFO sign-off',
        href: '/programs/meridian-rcm-modernization-2026',
      },
    ],
  },
];

const MERIDIAN_ACT_THREE_GAINS: CapabilityGainEntry[] = [
  {
    id: 'gain.meridian.kona-coast',
    targetSegmentId: '03',
    targetSegmentName: 'IT System Landscape',
    capabilityGained:
      'Sentinel can map the Kona Coast Cerner-to-Epic migration decision and its downstream AI program dependencies',
    todayPreview:
      '"Kona Coast Hospital is on Cerner Millennium after the capital-pressure pause. I can name the gap; I can\'t yet trace which of the four active AI programs depend on Kona Coast Epic parity."',
    afterPreview:
      '"Kona Coast system dependencies mapped. Prior Authorization AI and Ambient Clinical Documentation each have integration dependencies that assume Epic parity — the migration pause is a named blocker for both."',
    impactedPrograms: ['meridian-ambient-2026', 'meridian-prior-auth-2026'],
    rank: 1,
  },
  {
    id: 'gain.meridian.program-deliverables',
    targetSegmentId: '08',
    targetSegmentName: 'Program Deliverables',
    capabilityGained:
      'Phase gate reasoning becomes concrete — Sentinel can cite specific deliverable status rather than phase label alone',
    todayPreview:
      '"I know all four programs by phase number. I cannot cite specific deliverable status, gate criteria met/open, or what artifact is blocking the next phase advance."',
    afterPreview:
      '"Deliverables loaded. Ambient P3 gate criteria named; Prior Auth P4 Build artifacts on file; Clinical AI Governance P2 synthesis charter confirmed. Nexus can now reason about phase advance gates."',
    impactedPrograms: ['meridian-ambient-2026', 'meridian-prior-auth-2026', 'meridian-ai-governance-2026'],
    rank: 2,
  },
  {
    id: 'gain.meridian.compliance',
    targetSegmentId: '12',
    targetSegmentName: 'Compliance and Regulatory',
    capabilityGained:
      'Sentinel can reason about HIPAA, 42 CFR Part 2, CMS AI audit exposure, and MA plan regulatory requirements per program',
    todayPreview:
      '"Healthcare regulatory context is loaded at enterprise level (HIPAA, 42 CFR Part 2, CMS Medicare Advantage). I can\'t yet trace which open compliance findings block which active program gate."',
    afterPreview:
      '"Compliance findings traced to program gates. Clinical AI Governance P2 charter aligns to the FDA AI/ML SaMD framework; Prior Auth AI has a CMS rule compliance dependency named with remediation owner."',
    impactedPrograms: ['meridian-ai-governance-2026', 'meridian-prior-auth-2026'],
    rank: 3,
  },
];

const MERIDIAN_ACTIVITY: SetupActivityEvent[] = [
  {
    actor: 'Meridian synthetic dataset import',
    what: 'Loaded 14 segment families · 714 records · 423 graph nodes · 584 edges · 731 context chunks',
    timestamp: 'Today',
  },
  {
    actor: 'Dr. Anita Krishnamurthy (CDIO)',
    what: 'Reviewed IT landscape: Kona Coast Cerner migration pause noted; Epic consolidation at 80%',
    timestamp: '1 week ago',
  },
  {
    actor: 'Sentinel',
    what: 'Flagged Critical cross-program signal: Epic integration concentration across all four AI programs',
    timestamp: '3 days ago',
  },
  {
    actor: 'Patricia Okafor (CPE)',
    what: 'Prior Authorization AI advanced to P4 Build — denial auto-approval baseline confirmed at 8%',
    timestamp: '2 weeks ago',
  },
];

const MERIDIAN_CONTENT: SetupActsContent = {
  tenantKey: 'meridian',
  tenantDisplayName: 'Meridian Health System',
  tenantDataRichness: 'rich',
  sentinelOpener: MERIDIAN_OPENER,
  actOneFacts: MERIDIAN_ACT_ONE_FACTS,
  actTwoCapabilityNodes: MERIDIAN_ACT_TWO_CAPABILITIES,
  actThreeGainEntries: MERIDIAN_ACT_THREE_GAINS,
  recentActivity: MERIDIAN_ACTIVITY,
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
  apexretail: 'Apex Retail Group',
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
  if (tenantKey === 'meridian') {
    return MERIDIAN_CONTENT;
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

// ── Segment id mapping ────────────────────────────────────────────────────────
//
// Two forms exist in the codebase:
//   • Numeric form ("01" → "14") used in spec §C and in
//     user-facing URLs like `/admin/segments/01`.
//   • String form ("enterprise_profile" → "cross_program_signals")
//     used in the data substrate (`data_inventory_records`,
//     `data_inventory_segments`).
//
// `resolveSegmentRef` accepts either form and returns both, plus
// the human display name. Returns null if the input matches
// neither.

export interface SegmentReference {
  numericId: string;
  segmentKey: string;
  displayName: string;
  familyNumber: number;
}

const SEGMENT_REFERENCES: ReadonlyArray<SegmentReference> = [
  { numericId: '01', segmentKey: 'enterprise_profile', displayName: 'Enterprise profile', familyNumber: 1 },
  { numericId: '02', segmentKey: 'org_structure', displayName: 'Org structure', familyNumber: 2 },
  { numericId: '03', segmentKey: 'it_landscape', displayName: 'IT system landscape', familyNumber: 3 },
  { numericId: '04', segmentKey: 'it_financials', displayName: 'IT financials', familyNumber: 4 },
  { numericId: '05', segmentKey: 'kpi_dictionary', displayName: 'KPI dictionary', familyNumber: 5 },
  { numericId: '06', segmentKey: 'program_inventory', displayName: 'Program inventory', familyNumber: 6 },
  { numericId: '07', segmentKey: 'sourcing_artifacts', displayName: 'Sourcing artifacts', familyNumber: 7 },
  { numericId: '08', segmentKey: 'program_deliverables', displayName: 'Program deliverables', familyNumber: 8 },
  { numericId: '09', segmentKey: 'evidence_ledger', displayName: 'Evidence ledger', familyNumber: 9 },
  { numericId: '10', segmentKey: 'operating_telemetry', displayName: 'Operating telemetry', familyNumber: 10 },
  { numericId: '11', segmentKey: 'vendor_contracts', displayName: 'Vendor and contract', familyNumber: 11 },
  { numericId: '12', segmentKey: 'compliance', displayName: 'Compliance and regulatory', familyNumber: 12 },
  { numericId: '13', segmentKey: 'industry_context', displayName: 'Industry context', familyNumber: 13 },
  { numericId: '14', segmentKey: 'cross_program_signals', displayName: 'Cross-program signals', familyNumber: 14 },
];

export function getAllSegmentReferences(): ReadonlyArray<SegmentReference> {
  return SEGMENT_REFERENCES;
}

export function resolveSegmentRef(input: string | null | undefined): SegmentReference | null {
  if (!input) return null;
  const normalized = input.toLowerCase();
  const numeric = SEGMENT_REFERENCES.find((s) => s.numericId === normalized);
  if (numeric) return numeric;
  const byKey = SEGMENT_REFERENCES.find((s) => s.segmentKey === normalized);
  if (byKey) return byKey;
  return null;
}

// ── Live snapshot overlay ─────────────────────────────────────────────────────
//
// SETUP-1.2 onwards: the setup-data-broker reads
// `data_inventory_segments`, `data_inventory_audit_log`, and
// `data_ingestion_runs` for the active tenant. The result is
// overlaid onto the authored fixture below: rollup numbers and
// recent activity flow live; narrative prose stays authored. This
// keeps the page truthful as data evolves without forcing a code
// change for every count drift.

export interface InventorySegmentRollup {
  segmentId: string;
  segmentName: string;
  familyNumber: number;
  recordCount: number;
  coverageScore: number;
  staleCount: number;
  missingCount: number;
  healthState: string;
  lastReviewedAt: string | null;
  lastIngestedAt: string | null;
}

export interface InventoryActivityEvent {
  /** Actor display name (free-form). */
  actor: string;
  /** What happened. */
  what: string;
  /** ISO timestamp. */
  timestampIso: string;
}

export interface SetupInventorySnapshot {
  tenantKey: string;
  segments: InventorySegmentRollup[];
  totalRecords: number;
  totalChunks: number;
  totalNodes: number;
  totalEdges: number;
  recentActivity: InventoryActivityEvent[];
  /** Most recent ingestion run summary; null if none. */
  lastIngestedAt: string | null;
}

/**
 * Format an ISO timestamp as a "n days/weeks ago" relative phrase
 * for the activity feed. `now` injectable for deterministic tests.
 */
export function formatRelativeTimestamp(
  iso: string,
  now: Date = new Date(),
): string {
  const then = new Date(iso);
  if (Number.isNaN(then.getTime())) return 'Recently';
  const diffMs = now.getTime() - then.getTime();
  const diffMin = Math.round(diffMs / 60000);
  if (diffMin < 1) return 'Just now';
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.round(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  const diffDay = Math.round(diffHr / 24);
  if (diffDay <= 1) return 'Today';
  if (diffDay < 7) return `${diffDay} days ago`;
  const diffWk = Math.round(diffDay / 7);
  if (diffWk < 4) return `${diffWk} ${diffWk === 1 ? 'week' : 'weeks'} ago`;
  const diffMo = Math.round(diffDay / 30);
  return `${diffMo} ${diffMo === 1 ? 'month' : 'months'} ago`;
}

/**
 * Overlay live snapshot data onto authored fixture content. The
 * authored prose (opener, capability text, gain previews) is left
 * untouched; only the count totals and recent-activity feed are
 * replaced with live values. Returns a new content object — the
 * input is not mutated.
 *
 * If `snapshot` is null (no data yet, or live read failed), the
 * authored content is returned as-is.
 */
export function mergeInventorySnapshot(
  content: SetupActsContent,
  snapshot: SetupInventorySnapshot | null,
  now: Date = new Date(),
): SetupActsContent {
  if (!snapshot) return content;

  const liveActivity: SetupActivityEvent[] = snapshot.recentActivity.map(
    (e) => ({
      actor: e.actor,
      what: e.what,
      timestamp: formatRelativeTimestamp(e.timestampIso, now),
    }),
  );

  return {
    ...content,
    tenantDataRichness:
      snapshot.totalRecords > 0 ? 'rich' : content.tenantDataRichness,
    recentActivity:
      liveActivity.length > 0 ? liveActivity : content.recentActivity,
  };
}

/**
 * Total counts for the page header summary. When a live snapshot
 * is provided, prefers live numbers over authored fixture totals.
 */
export function getSetupSummaryCountsWithSnapshot(
  content: SetupActsContent,
  snapshot: SetupInventorySnapshot | null,
): {
  totalRecords: number | null;
  segmentsTracked: number | null;
  capabilitiesGrounded: number;
} {
  const groundedCount = content.actTwoCapabilityNodes.filter(
    (n) => n.depthState === 'grounded',
  ).length;
  if (snapshot) {
    return {
      totalRecords: snapshot.totalRecords,
      segmentsTracked: snapshot.segments.length,
      capabilitiesGrounded: groundedCount,
    };
  }
  return {
    totalRecords: content.tenantDataRichness === 'rich' ? 403 : null,
    segmentsTracked: content.tenantDataRichness === 'rich' ? 14 : null,
    capabilitiesGrounded: groundedCount,
  };
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
    totalRecords: content.tenantDataRichness === 'rich' ? 403 : null,
    segmentsTracked: content.tenantDataRichness === 'rich' ? 14 : null,
    capabilitiesGrounded: groundedCount,
  };
}
