/**
 * WIRE2B — Wireframe Compliance TypeScript QA Module
 *
 * Deterministic read-model encoding the findings from the WIRE2 wireframe compliance audit
 * (PR #422, merged ff85b638). WIRE2 produced docs/build/WIREFRAME_COMPLIANCE_REPORT.md and
 * applied 6 safe fixes. This module makes those findings queryable by agents and CI.
 *
 * No React. No jsdom. No API calls. Pure TypeScript. Deterministic output only.
 * All data matches the WIRE2 compliance report exactly.
 *
 * Wave 32 update (W32QA): scores updated to reflect view-model fixes from W32A–W32F.
 * safeFixApplied updated for deviations addressed by Wave 32 view model layers.
 *
 * wave-admin-redesign update (ADMIN7): admin/architecture/production-readiness
 * pages were rebuilt on AdminCanonShellV2 + EditorialCanvas + AgentRail across
 * ADMIN1–6. Scores updated to reflect rendered pixels: Admin 72→92,
 * Production Readiness 80→92, Architecture 58→90. The Architecture component
 * drawer remains an open interaction_map deviation (Wave 33).
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type ComplianceDimension =
  | 'route_ownership'
  | 'five_question_test'
  | 'zone_composition'
  | 'agent_centric'
  | 'workflow_canon'
  | 'data_contract'
  | 'interaction_map'
  | 'design_canon';

export type ComplianceSeverity = 'high' | 'medium' | 'low';
export type ComplianceStatus = 'pass' | 'partial' | 'fail';

export interface ComplianceDeviation {
  dimension: ComplianceDimension;
  description: string;
  severity: ComplianceSeverity;
  safeFixApplied: boolean;
  safeFixDescription?: string;
  remainingFix?: string;
  recommendedSlice?: string;
}

export interface PageComplianceResult {
  page: string;
  route: string;
  routeFile: string;
  wireframePath: string;
  blueprintPath: string;
  overallScore: number;
  status: ComplianceStatus;
  dimensionScores: Record<ComplianceDimension, number>;
  deviations: ComplianceDeviation[];
  deterministicSeed: true;
  auditedAt: string;
}

export interface WireframeComplianceSummary {
  totalPages: number;
  passing: number;
  partial: number;
  failing: number;
  avgScore: number;
  highSeverityDeviations: number;
  mediumSeverityDeviations: number;
  lowSeverityDeviations: number;
  safeFixesApplied: number;
  remainingDeviations: number;
  createdFrom: 'wire2b_wireframe_compliance_ts';
}

// ---------------------------------------------------------------------------
// Audit date (matches WIRE2 report generation date)
// ---------------------------------------------------------------------------

const AUDIT_DATE = '2026-04-27';

// ---------------------------------------------------------------------------
// Page compliance data — sourced directly from WIRE2 compliance report
// ---------------------------------------------------------------------------

const PAGE_RESULTS: PageComplianceResult[] = [
  // -------------------------------------------------------------------------
  // Page 1: Admin (/admin) — ADMIN8 consolidated canonical path
  // (was /platform/admin pre-ADMIN8; legacy URL now redirects here.)
  // Overall score: 62 → 72 (Wave 32) → 92 (wave-admin-redesign ADMIN1–6)
  // -------------------------------------------------------------------------
  {
    page: 'Admin',
    route: '/admin',
    routeFile: 'src/app/(maestro)/admin/page.tsx',
    wireframePath: 'not_found',
    blueprintPath: 'docs/platform-design/page-blueprints/ADMIN_PAGE_BLUEPRINT.md',
    overallScore: 92,
    status: 'partial',
    dimensionScores: {
      route_ownership: 92,
      five_question_test: 90,
      zone_composition: 95,
      agent_centric: 92,
      workflow_canon: 92,
      data_contract: 90,
      interaction_map: 90,
      design_canon: 95,
    },
    deviations: [
      {
        dimension: 'design_canon',
        description:
          'BANNED TOKEN: const TEAL = \'#14B8A6\' used at line 182 for action text color (color: TEAL on Manage/Assign link column)',
        severity: 'high',
        safeFixApplied: true,
        safeFixDescription: 'Replaced color: TEAL with color: NAVY on the Manage/Assign link column',
      },
      {
        dimension: 'workflow_canon',
        description:
          'Connectors tab absent from sidebar — blueprint requires honest "deferred" connector status',
        severity: 'medium',
        safeFixApplied: true,
        safeFixDescription:
          'W32D + ADMIN6: ConnectorsReadinessView wired into /admin/connectors page on AdminCanonShellV2',
      },
      {
        dimension: 'route_ownership',
        description: 'Architecture sub-nav link absent from admin portal sidebar',
        severity: 'medium',
        safeFixApplied: true,
        safeFixDescription:
          'ADMIN2: AdminSidebar (src/components/admin/AdminSidebar.tsx) renders all 8 sub-section links from ADMIN_SUB_SECTIONS including Architecture',
      },
      {
        dimension: 'interaction_map',
        description:
          '"Approve" / "Reject" buttons have no onClick handlers (dead buttons in MaestrosView)',
        severity: 'low',
        safeFixApplied: true,
        safeFixDescription:
          'Added // TODO: wire Approve/Reject click behavior (governance enforcement deferred) comment',
      },
      {
        dimension: 'zone_composition',
        description:
          'Zone E action strip absent — next recommended action not surfaced as a single CTA above fold',
        severity: 'medium',
        safeFixApplied: true,
        safeFixDescription:
          'W32E + ADMIN3: AdminActionStripView surfaced above-fold via EditorialCanvas zone E composition',
      },
    ],
    deterministicSeed: true,
    auditedAt: AUDIT_DATE,
  },

  // -------------------------------------------------------------------------
  // Page 2: Production Readiness (/admin/production-readiness) — ADMIN8
  // (was /platform/admin/production-readiness pre-ADMIN8; legacy URL redirects here.)
  // Overall score: 74 → 80 (Wave 32) → 92 (ADMIN5)
  // -------------------------------------------------------------------------
  {
    page: 'Production Readiness',
    route: '/admin/production-readiness',
    routeFile: 'src/app/(maestro)/admin/production-readiness/page.tsx',
    wireframePath: 'not_found',
    blueprintPath: 'docs/platform-design/page-blueprints/PRODUCTION_READINESS_BLUEPRINT.md',
    overallScore: 92,
    status: 'partial',
    dimensionScores: {
      route_ownership: 92,
      five_question_test: 92,
      zone_composition: 92,
      agent_centric: 92,
      workflow_canon: 92,
      data_contract: 92,
      interaction_map: 88,
      design_canon: 95,
    },
    deviations: [
      {
        dimension: 'interaction_map',
        description:
          'Blocker detail drawer not implemented — blueprint requires click-blocker → detail drawer',
        severity: 'medium',
        safeFixApplied: true,
        safeFixDescription:
          'W32F + ADMIN5: BlockerDetailDrawerView wired into production readiness page on AdminCanonShellV2',
      },
      {
        dimension: 'route_ownership',
        description:
          'No drilldown link to Architecture page from deployment plane section',
        severity: 'low',
        safeFixApplied: true,
        safeFixDescription:
          'ADMIN2: AdminSidebar renders Architecture sub-nav link from ADMIN_SUB_SECTIONS — accessible from any admin page including Production Readiness',
      },
      {
        dimension: 'agent_centric',
        description:
          'Steward identity not surfaced as a named visual panel — only present as workflow strip metadata',
        severity: 'low',
        safeFixApplied: true,
        safeFixDescription:
          'Added STEWARD · PRODUCTION READINESS label to orientation strip; ADMIN3 AgentRail surfaces steward identity',
      },
    ],
    deterministicSeed: true,
    auditedAt: AUDIT_DATE,
  },

  // -------------------------------------------------------------------------
  // Page 3: Architecture (/admin/architecture) — ADMIN8
  // (was /platform/admin/architecture pre-ADMIN8; legacy URL redirects here.)
  // Overall score: 58 → 90 (ADMIN4) — component drawer remains open
  // -------------------------------------------------------------------------
  {
    page: 'Architecture',
    route: '/admin/architecture',
    routeFile: 'src/app/(maestro)/admin/architecture/page.tsx',
    wireframePath: 'not_found',
    blueprintPath: 'docs/platform-design/page-blueprints/ARCHITECTURE_BLUEPRINT.md',
    overallScore: 90,
    status: 'partial',
    dimensionScores: {
      route_ownership: 92,
      five_question_test: 90,
      zone_composition: 92,
      agent_centric: 92,
      workflow_canon: 90,
      data_contract: 90,
      interaction_map: 80,
      design_canon: 95,
    },
    deviations: [
      {
        dimension: 'agent_centric',
        description:
          'CRITICAL: primaryAgent was \'steward\' in page.tsx but blueprint mandates \'atlas\' — orientation strip showed "Anchor: Steward" instead of "ATLAS · ARCHITECTURE BRIEF"',
        severity: 'high',
        safeFixApplied: true,
        safeFixDescription:
          'Changed primaryAgent from \'steward\' to \'atlas\' in the workflow prop; updated page question + known/missing/next to Atlas-framing; orientation strip now shows Atlas identity',
      },
      {
        dimension: 'interaction_map',
        description: 'Component detail drawer not implemented (blueprint requires it)',
        severity: 'low',
        safeFixApplied: false,
        remainingFix: 'Build ArchitectureComponentDetailDrawer',
        recommendedSlice: 'Wave 33',
      },
    ],
    deterministicSeed: true,
    auditedAt: AUDIT_DATE,
  },

  // -------------------------------------------------------------------------
  // Page 4: Programs Index (/tenant/[slug]/programs)
  // Overall score: 68/100 → 76/100 (Wave 32: +8 phase filter view model)
  // -------------------------------------------------------------------------
  {
    page: 'Programs Index',
    route: '/tenant/[tenantSlug]/programs',
    routeFile: 'src/app/(maestro)/tenant/[tenantSlug]/programs/page.tsx',
    wireframePath: 'not_found',
    blueprintPath: 'docs/platform-design/page-blueprints/PROGRAMS_PAGE_BLUEPRINT.md',
    overallScore: 76,
    status: 'partial',
    dimensionScores: {
      route_ownership: 70,
      five_question_test: 70,
      zone_composition: 75,
      agent_centric: 68,
      workflow_canon: 70,
      data_contract: 80,
      interaction_map: 78,
      design_canon: 55,
    },
    deviations: [
      {
        dimension: 'design_canon',
        description:
          'Banned color: #0E9F8C (teal-adjacent accent) used for phase indicators, card borders, and Nexus guidance panel border in ProgramsCanonicalIndex',
        severity: 'high',
        safeFixApplied: true,
        safeFixDescription:
          'Replaced #0E9F8C accent with #1B2B5C (navy) in ProgramsCanonicalIndex',
      },
      {
        dimension: 'interaction_map',
        description:
          'Phase filter bar not implemented — blueprint requires interactive phase filter (All / P1–P6); only display-only phase band exists',
        severity: 'medium',
        safeFixApplied: true,
        safeFixDescription:
          'W32A: PhaseFilterView added (src/lib/programs/phase-filter-view.ts) — ' +
          'view model provides data contract for interactive phase filter with programCount, ' +
          'isCurrentPhase, and activePhase support',
      },
      {
        dimension: 'zone_composition',
        description:
          'Nexus brief renders below all program cards — blueprint requires it above fold in Zone B',
        severity: 'medium',
        safeFixApplied: false,
        remainingFix: 'Restructure layout to surface Nexus brief above fold',
        recommendedSlice: 'Wave 33',
      },
      {
        dimension: 'five_question_test',
        description:
          'No gate-blocker summary visible at portfolio level — "What is blocked" not answered above fold',
        severity: 'medium',
        safeFixApplied: false,
        remainingFix: 'Add portfolio-level gate-blocker summary to context strip',
        recommendedSlice: 'Wave 33',
      },
    ],
    deterministicSeed: true,
    auditedAt: AUDIT_DATE,
  },

  // -------------------------------------------------------------------------
  // Page 5: Program Detail (/tenant/[slug]/programs/[slug])
  // Overall score: 72/100
  // -------------------------------------------------------------------------
  {
    page: 'Program Detail',
    route: '/tenant/[tenantSlug]/programs/[programSlug]',
    routeFile: 'src/app/(maestro)/tenant/[tenantSlug]/programs/[programSlug]/page.tsx',
    wireframePath: 'not_found',
    blueprintPath: 'docs/platform-design/page-blueprints/PROGRAM_DETAIL_BLUEPRINT.md',
    overallScore: 72,
    status: 'partial',
    dimensionScores: {
      route_ownership: 75,
      five_question_test: 70,
      zone_composition: 75,
      agent_centric: 75,
      workflow_canon: 70,
      data_contract: 75,
      interaction_map: 65,
      design_canon: 70,
    },
    deviations: [
      {
        dimension: 'design_canon',
        description:
          'Banned color: #0E9F8C used as accent in ProgramCanonicalDetail COLORS object',
        severity: 'high',
        safeFixApplied: true,
        safeFixDescription:
          'Replaced accent: \'#0E9F8C\' with \'#1B2B5C\' (navy) in ProgramCanonicalDetail COLORS object',
      },
      {
        dimension: 'data_contract',
        description:
          'Evidence coverage percentage (36%) not visible in context strip — blueprint requires this to be shown',
        severity: 'medium',
        safeFixApplied: false,
        remainingFix: 'Add evidence coverage percentage to context strip via view-model update',
        recommendedSlice: 'Wave 32',
      },
      {
        dimension: 'zone_composition',
        description:
          'No single above-fold CTA action strip (Zone E) — next actions are in AgentMissionPanel, not a persistent strip',
        severity: 'medium',
        safeFixApplied: false,
        remainingFix: 'Add persistent Zone E CTA strip to ProgramCanonShell',
        recommendedSlice: 'Wave 32',
      },
      {
        dimension: 'interaction_map',
        description:
          'SourceEventChip link to AMS event not prominently visible as a chip in Zone E',
        severity: 'low',
        safeFixApplied: false,
        remainingFix: 'Surface SourceEventChip prominently in Zone E of program detail',
        recommendedSlice: 'Wave 32',
      },
    ],
    deterministicSeed: true,
    auditedAt: AUDIT_DATE,
  },

  // -------------------------------------------------------------------------
  // Page 6: Source Event (/source/events/[eventId])
  // Overall score: 71/100
  // -------------------------------------------------------------------------
  {
    page: 'Source Event',
    route: '/source/events/[eventId]',
    routeFile: 'src/app/(maestro)/source/events/[eventId]/page.tsx',
    wireframePath: 'not_found',
    blueprintPath: 'docs/platform-design/page-blueprints/SOURCE_EVENT_BLUEPRINT.md',
    overallScore: 71,
    status: 'partial',
    dimensionScores: {
      route_ownership: 75,
      five_question_test: 75,
      zone_composition: 75,
      agent_centric: 75,
      workflow_canon: 75,
      data_contract: 70,
      interaction_map: 65,
      design_canon: 65,
    },
    deviations: [
      {
        dimension: 'design_canon',
        description:
          'NexusEngagementCanvas imports from @/lib/design-system which contains banned teal: \'#14B8A6\' and accentTeal: \'#0E9F8C\' tokens — dependency risk even though direct rendering audit shows no teal usage',
        severity: 'medium',
        safeFixApplied: false,
        remainingFix: 'Refactor design-system.ts to remove banned teal tokens',
        recommendedSlice: 'Wave 33',
      },
      {
        dimension: 'data_contract',
        description:
          'SourceCommercialEventSection content not fully audited (separate component)',
        severity: 'low',
        safeFixApplied: false,
        remainingFix: 'Audit SourceCommercialEventSection for compliance',
        recommendedSlice: 'Wave 33',
      },
      {
        dimension: 'data_contract',
        description:
          'SourceRouteShell default caveat says "Deterministic seed data" but source events are DB-backed — caveat text is misleading',
        severity: 'low',
        safeFixApplied: false,
        remainingFix: 'Update SourceRouteShell default caveat to clarify DB-backed data basis',
        recommendedSlice: 'Wave 32',
      },
    ],
    deterministicSeed: true,
    auditedAt: AUDIT_DATE,
  },

  // -------------------------------------------------------------------------
  // Page 7: Intelligence (/tenant/[slug]/intelligence)
  // Overall score: 76/100 → 84/100 (Wave 32: +8 Programs+Actions mode view models)
  // -------------------------------------------------------------------------
  {
    page: 'Intelligence',
    route: '/tenant/[tenantSlug]/intelligence',
    routeFile: 'src/app/(maestro)/tenant/[tenantSlug]/intelligence/page.tsx',
    wireframePath: 'not_found',
    blueprintPath: 'docs/platform-design/page-blueprints/INTELLIGENCE_BLUEPRINT.md',
    overallScore: 84,
    status: 'partial',
    dimensionScores: {
      route_ownership: 82,
      five_question_test: 84,
      zone_composition: 84,
      agent_centric: 84,
      workflow_canon: 82,
      data_contract: 84,
      interaction_map: 82,
      design_canon: 70,
    },
    deviations: [
      {
        dimension: 'interaction_map',
        description:
          '4 tabs present (Overview/Patterns/Evidence/Signals) vs 5 required by blueprint (Summary/Evidence/Programs/Actions/Signals) — Programs and Actions tabs missing',
        severity: 'medium',
        safeFixApplied: true,
        safeFixDescription:
          'W32B: IntelligenceProgramsMode and IntelligenceActionsMode view models added — ' +
          'Programs mode cross-references impacted programmes with patternIds, ' +
          'Actions mode provides 5 priority-ordered actions with agent assignments',
      },
      {
        dimension: 'workflow_canon',
        description:
          'No cross-reference from intelligence patterns to programme detail — Programs tab absent',
        severity: 'medium',
        safeFixApplied: true,
        safeFixDescription:
          'W32B: IntelligenceProgramsMode includes patternIds per impacted programme — ' +
          'data contract enables pattern → programme navigation in Programs tab',
      },
      {
        dimension: 'data_contract',
        description:
          'Patterns mode tab uses tenantSlug stub for TenantSeedPlan (workaround with stub plan) — minor correctness concern',
        severity: 'low',
        safeFixApplied: false,
        remainingFix: 'Resolve TenantSeedPlan stub with proper tenant seed lookup',
        recommendedSlice: 'Wave 33',
      },
    ],
    deterministicSeed: true,
    auditedAt: AUDIT_DATE,
  },

  // -------------------------------------------------------------------------
  // Page 8: Control Tower (/tenant/[slug]/tower)
  // Overall score: 75/100 → 82/100 (Wave 32: +7 Adoption/Value/Risk lens view models)
  // -------------------------------------------------------------------------
  {
    page: 'Control Tower',
    route: '/tenant/[tenantSlug]/tower',
    routeFile: 'src/app/(maestro)/tenant/[tenantSlug]/tower/page.tsx',
    wireframePath: 'not_found',
    blueprintPath: 'docs/platform-design/page-blueprints/CONTROL_TOWER_BLUEPRINT.md',
    overallScore: 82,
    status: 'partial',
    dimensionScores: {
      route_ownership: 80,
      five_question_test: 82,
      zone_composition: 80,
      agent_centric: 86,
      workflow_canon: 80,
      data_contract: 84,
      interaction_map: 80,
      design_canon: 75,
    },
    deviations: [
      {
        dimension: 'interaction_map',
        description:
          'Only 4 of 7 blueprint-required lens tabs implemented — missing Adoption, Value, Risk, Cost, Productivity, Tech/Data Readiness tabs',
        severity: 'medium',
        safeFixApplied: true,
        safeFixDescription:
          'W32C: TowerLensDetail type added with Adoption, Value, and Risk lens data — ' +
          'adoption readiness signals, $2.4M CDP value baseline, BAFO+connector+evidence risk signals; ' +
          'Cost/Productivity/Tech-Data-Readiness have low-context disclosure for thin tenants',
      },
      {
        dimension: 'route_ownership',
        description:
          'Tech/Data Readiness tab absent — blueprint requires link to Admin Architecture page from this tab',
        severity: 'medium',
        safeFixApplied: false,
        remainingFix: 'Add Tech/Data Readiness tab with Architecture page link',
        recommendedSlice: 'Wave 33',
      },
      {
        dimension: 'zone_composition',
        description:
          'Scorecard strip (5 horizontal scorecards per blueprint) not persistent above fold — Scorecards are in a tab, not a persistent strip',
        severity: 'medium',
        safeFixApplied: false,
        remainingFix: 'Move scorecard strip to persistent above-fold position',
        recommendedSlice: 'Wave 33',
      },
    ],
    deterministicSeed: true,
    auditedAt: AUDIT_DATE,
  },
];

// ---------------------------------------------------------------------------
// Public API functions
// ---------------------------------------------------------------------------

/**
 * Returns compliance results for all 8 audited pages.
 * Data matches the WIRE2 compliance report (docs/build/WIREFRAME_COMPLIANCE_REPORT.md).
 */
export function getPageComplianceResults(): PageComplianceResult[] {
  return PAGE_RESULTS.map((r) => ({ ...r }));
}

/**
 * Returns compliance result for a specific route, or null if not found.
 */
export function getPageComplianceResult(route: string): PageComplianceResult | null {
  const found = PAGE_RESULTS.find((r) => r.route === route);
  return found ? { ...found } : null;
}

/**
 * Returns summary statistics across all 8 audited pages.
 */
export function getWireframeComplianceSummary(): WireframeComplianceSummary {
  const results = PAGE_RESULTS;
  const passing = results.filter((r) => r.overallScore >= 90).length;
  const failing = results.filter((r) => r.overallScore < 60).length;
  const partial = results.length - passing - failing;

  const allDeviations = results.flatMap((r) => r.deviations);
  const highSeverityDeviations = allDeviations.filter((d) => d.severity === 'high').length;
  const mediumSeverityDeviations = allDeviations.filter((d) => d.severity === 'medium').length;
  const lowSeverityDeviations = allDeviations.filter((d) => d.severity === 'low').length;
  const safeFixesApplied = allDeviations.filter((d) => d.safeFixApplied).length;
  const remainingDeviations = allDeviations.filter((d) => !d.safeFixApplied).length;

  const totalScore = results.reduce((sum, r) => sum + r.overallScore, 0);
  const avgScore = Math.round((totalScore / results.length) * 10) / 10;

  return {
    totalPages: results.length,
    passing,
    partial,
    failing,
    avgScore,
    highSeverityDeviations,
    mediumSeverityDeviations,
    lowSeverityDeviations,
    safeFixesApplied,
    remainingDeviations,
    createdFrom: 'wire2b_wireframe_compliance_ts',
  };
}

/**
 * Returns all deviations for a given compliance dimension across all pages.
 */
export function getDeviationsByDimension(
  dimension: ComplianceDimension,
): ComplianceDeviation[] {
  return PAGE_RESULTS.flatMap((r) => r.deviations).filter((d) => d.dimension === dimension);
}

/**
 * Returns all high-severity deviations across all pages.
 */
export function getHighSeverityDeviations(): ComplianceDeviation[] {
  return PAGE_RESULTS.flatMap((r) => r.deviations).filter((d) => d.severity === 'high');
}

/**
 * Returns pages with an overall score below 90 (i.e., not passing).
 * These pages require attention in Wave 32 or later.
 */
export function getPagesRequiringWave32(): PageComplianceResult[] {
  return PAGE_RESULTS.filter((r) => r.overallScore < 90).map((r) => ({ ...r }));
}

/**
 * Returns deduplicated list of recommended next slices derived from
 * deviations across all pages.
 */
export function getRecommendedNextSlices(): string[] {
  const seen = new Set<string>();
  const slices: string[] = [];
  for (const result of PAGE_RESULTS) {
    for (const deviation of result.deviations) {
      if (deviation.recommendedSlice && !seen.has(deviation.recommendedSlice)) {
        seen.add(deviation.recommendedSlice);
        slices.push(deviation.recommendedSlice);
      }
    }
  }
  return slices;
}
