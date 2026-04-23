import {
  PROGRAMS_ENHANCEMENT_MATRIX,
  type SpecArchetypeCode,
  type SpecPhaseNumber,
  type TenantPortfolioSeed,
} from './enhancement-spec';
import type {
  AllProgramsSeedPlan,
  DeliverableSeedPlan,
  DeliverableTypeSeedSpec,
  ProgramSeedPlan,
  TenantSeedPlan,
} from './enhancement-seed-planner';

export type SeedWriteMode = 'dry-run' | 'write';

export interface SeedWriteFilters {
  tenantKeys?: string[];
  programCodes?: string[];
  includeStubs?: boolean;
}

export interface SeedWriteOperationSummary {
  tenants: number;
  clients: number;
  deliverableTypes: number;
  programs: number;
  deliverables: number;
  deliverableVersions: number;
  richDeliverables: number;
  outlineDeliverables: number;
  stubDeliverables: number;
}

export interface FilteredProgramsSeedPlan {
  deliverableTypes: DeliverableTypeSeedSpec[];
  tenants: TenantSeedPlan[];
  programs: ProgramSeedPlan[];
  deliverables: DeliverableSeedPlan[];
  summary: SeedWriteOperationSummary;
}

export interface SeedClientPayload {
  name: string;
  legal_name: string;
  industry_code: string;
}

export interface SeedProgramPayload {
  graph_node_id: string;
  client_id: string;
  name: string;
  industry_code: string;
  function_code: string;
  objective_code: string;
  topic_code: string | null;
  current_phase: number;
  status: 'active' | 'completed';
  program_archetype: ProgramSeedPlan['appArchetype'];
  origin_source: 'intelligence_promoted' | 'user_initiated';
  maestro_oversight_level: 'partial';
  founder_approval_required: boolean;
  data_residency_region: 'us';
  retention_policy_years: number;
  charter: Record<string, unknown>;
  gates_passed: Array<Record<string, unknown>>;
  baseline_metrics: Record<string, unknown>;
  actual_metrics: Record<string, unknown>;
  phase_0_started_at: string;
  phase_4_completed_at: string | null;
  is_demo_data: boolean;
}

export interface SeedDeliverableTypePayload {
  type_key: string;
  title: string;
  description: string;
  applicable_phases: number[];
  applicable_topics: string[];
  template_structure: Record<string, unknown>;
  required_data_inputs: Record<string, unknown>;
  quality_rubric: Record<string, unknown>;
  generation_prompt_template: string;
  output_format: 'markdown';
  maturity: 'pilot';
}

export interface SeedDeliverablePayload {
  engagement_id: string;
  deliverable_type_key: string;
  title: string;
  status: DeliverableSeedPlan['status'];
  current_version: number;
  created_by: 'nexus' | 'maestro';
  signed_off_at: string | null;
}

export interface SeedDeliverableVersionPayload {
  deliverable_id: string;
  version: number;
  content: string;
  structured_data: Record<string, unknown>;
  quality_score: Record<string, unknown>;
  quality_issues: Record<string, unknown> | null;
  generated_from_context_hash: string;
}

const INDUSTRY_CODE_BY_TENANT: Record<string, string> = {
  apexretail: 'RETAIL',
  meridian: 'HEALTHCARE_IDN',
  arcturus: 'FINSERV',
  keystone: 'ENERGY',
};

const FUNCTION_CODE_BY_ARCHETYPE: Record<SpecArchetypeCode, string> = {
  ST: 'EXECUTIVE_OFFICE',
  WA: 'OPERATIONS',
  PM: 'MIDDLE_OFFICE',
  AP: 'FRONT_OFFICE',
  OO: 'OPERATIONS',
};

const LEGACY_CLIENT_ALIASES_BY_TENANT: Record<string, string[]> = {
  apexretail: ['Apex Retail', 'Apex Retail Group'],
  meridian: ['Meridian Health', 'Meridian Health System'],
  arcturus: ['First Capital', 'First Capital Financial', 'Arcturus Financial', 'Arcturus Financial Group'],
  keystone: ['Keystone Energy', 'Keystone Energy Holdings', 'Keystone Energy Holdings, Inc.'],
};

export function clientAliasesForPortfolio(portfolio: Pick<TenantPortfolioSeed, 'tenantKey' | 'displayName' | 'displayAliases'>): string[] {
  return uniqueStrings([
    portfolio.displayName,
    ...(portfolio.displayAliases ?? []),
    ...(LEGACY_CLIENT_ALIASES_BY_TENANT[portfolio.tenantKey] ?? []),
  ]);
}

export function buildSeedClientPayload(portfolio: Pick<TenantPortfolioSeed, 'tenantKey' | 'displayName' | 'industryKey'>): SeedClientPayload {
  return {
    name: portfolio.displayName,
    legal_name: `${portfolio.displayName} Composite Seed`,
    industry_code: INDUSTRY_CODE_BY_TENANT[portfolio.tenantKey] ?? portfolio.industryKey.toUpperCase(),
  };
}

export function filterProgramsSeedPlan(plan: AllProgramsSeedPlan, filters: SeedWriteFilters = {}): FilteredProgramsSeedPlan {
  const tenantKeys = new Set(filters.tenantKeys ?? []);
  const programCodes = new Set(filters.programCodes ?? []);
  const includeStubs = filters.includeStubs ?? true;

  const tenants = plan.tenants
    .filter((tenant) => tenantKeys.size === 0 || tenantKeys.has(tenant.tenantKey))
    .map((tenant) => ({
      ...tenant,
      programs: tenant.programs
        .filter((program) => programCodes.size === 0 || programCodes.has(program.code))
        .map((program) => ({
          ...program,
          deliverables: includeStubs
            ? program.deliverables
            : program.deliverables.filter((deliverable) => deliverable.renderTier !== 'stub'),
        })),
    }))
    .filter((tenant) => tenant.programs.length > 0);

  const programs = tenants.flatMap((tenant) => tenant.programs);
  const deliverables = programs.flatMap((program) => program.deliverables);

  return {
    deliverableTypes: plan.deliverableTypes,
    tenants,
    programs,
    deliverables,
    summary: {
      tenants: tenants.length,
      clients: tenants.length,
      deliverableTypes: plan.deliverableTypes.length,
      programs: programs.length,
      deliverables: deliverables.length,
      deliverableVersions: deliverables.length,
      richDeliverables: deliverables.filter((deliverable) => deliverable.renderTier === 'rich').length,
      outlineDeliverables: deliverables.filter((deliverable) => deliverable.renderTier === 'outline').length,
      stubDeliverables: deliverables.filter((deliverable) => deliverable.renderTier === 'stub').length,
    },
  };
}

export function buildDeliverableTypePayload(seed: DeliverableTypeSeedSpec): SeedDeliverableTypePayload {
  return {
    type_key: seed.typeKey,
    title: seed.title,
    description: `${seed.code} · ${seed.title}. Seeded from the programs seed and deliverable generation enhancement spec.`,
    applicable_phases: seed.applicableAppPhases,
    applicable_topics: seed.applicableArchetypeCodes.map((code) => PROGRAMS_ENHANCEMENT_MATRIX.archetypes.find((entry) => entry.code === code)?.key ?? code),
    template_structure: {
      seedSpecVersion: PROGRAMS_ENHANCEMENT_MATRIX.version,
      deliverableCode: seed.code,
      slug: seed.slug,
      sections: ['Executive readout', 'Evidence basis', 'Recommended action', 'Open decisions', 'Quality checks'],
      fidelityTiers: ['rich', 'outline', 'stub'],
    },
    required_data_inputs: {
      tenant: ['client profile', 'industry context'],
      program: ['program archetype', 'current phase', 'pattern slug', 'role in demo'],
      evidence: ['intake turns', 'control tower metrics', 'topic/pattern references'],
    },
    quality_rubric: {
      dimensions: [
        { name: 'tenant_specificity', weight: 30, criteria: 'Uses tenant, vertical, and program-specific language instead of generic consulting copy.' },
        { name: 'phase_fit', weight: 25, criteria: 'Matches the current phase and does not expose future-phase work as if complete.' },
        { name: 'evidence_traceability', weight: 25, criteria: 'Names the evidence required for the artifact and marks unresolved gaps.' },
        { name: 'decision_utility', weight: 20, criteria: 'Makes the next sponsor or maestro action clear.' },
      ],
    },
    generation_prompt_template: [
      `Generate ${seed.title} (${seed.code}) for \${program.name}.`,
      'Use the tenant portfolio, program archetype, current phase, pattern context, and available evidence.',
      'If evidence is missing, mark it as [DATA GAP] instead of inventing proof.',
      'Do not expose implementation metadata or internal tool traces to the client.',
    ].join('\n'),
    output_format: seed.outputFormat,
    maturity: seed.maturity,
  };
}

export function buildProgramPayload(portfolio: TenantSeedPlan, program: ProgramSeedPlan, clientId: string, nowIso: string): SeedProgramPayload {
  return {
    graph_node_id: program.graphNodeId,
    client_id: clientId,
    name: program.name,
    industry_code: INDUSTRY_CODE_BY_TENANT[program.tenantKey] ?? program.tenantKey.toUpperCase(),
    function_code: FUNCTION_CODE_BY_ARCHETYPE[program.archetypeCode],
    objective_code: 'OPTIMISE',
    topic_code: program.patternSlug,
    current_phase: program.currentAppPhase,
    status: program.status,
    program_archetype: program.appArchetype,
    origin_source: program.patternSlug ? 'intelligence_promoted' : 'user_initiated',
    maestro_oversight_level: 'partial',
    founder_approval_required: program.currentPhaseSpec >= 4,
    data_residency_region: 'us',
    retention_policy_years: 7,
    charter: {
      seeded: true,
      seedSpecVersion: PROGRAMS_ENHANCEMENT_MATRIX.version,
      code: program.code,
      roleInDemo: program.roleInDemo,
      routePath: program.routePath,
      tenant: {
        key: program.tenantKey,
        name: portfolio.displayName,
      },
    },
    gates_passed: buildGatesPassed(program, nowIso),
    baseline_metrics: {
      seeded: true,
      seedSpecVersion: PROGRAMS_ENHANCEMENT_MATRIX.version,
      deliverableCounts: {
        total: program.deliverables.length,
        rich: program.deliverables.filter((deliverable) => deliverable.renderTier === 'rich').length,
        outline: program.deliverables.filter((deliverable) => deliverable.renderTier === 'outline').length,
        stub: program.deliverables.filter((deliverable) => deliverable.renderTier === 'stub').length,
      },
    },
    actual_metrics: {},
    phase_0_started_at: nowIso,
    phase_4_completed_at: program.status === 'completed' ? nowIso : null,
    is_demo_data: true,
  };
}

export function buildDeliverablePayload(deliverable: DeliverableSeedPlan, engagementId: string, nowIso: string): SeedDeliverablePayload {
  return {
    engagement_id: engagementId,
    deliverable_type_key: deliverable.deliverableTypeKey,
    title: titleForDeliverableInstance(deliverable),
    status: deliverable.status,
    current_version: 1,
    created_by: deliverable.renderTier === 'rich' ? 'nexus' : 'maestro',
    signed_off_at: deliverable.status === 'signed_off' ? nowIso : null,
  };
}

export function buildDeliverableVersionPayload(
  portfolio: TenantSeedPlan,
  program: ProgramSeedPlan,
  deliverable: DeliverableSeedPlan,
  deliverableId: string,
): SeedDeliverableVersionPayload {
  const content = buildDeliverableContent(portfolio, program, deliverable);
  const unresolvedGaps = deliverable.renderTier === 'rich' ? 1 : deliverable.renderTier === 'outline' ? 3 : 5;
  const totalScore = deliverable.renderTier === 'rich' ? 84 : deliverable.renderTier === 'outline' ? 62 : 25;

  return {
    deliverable_id: deliverableId,
    version: 1,
    content,
    structured_data: {
      ...deliverable.structuredData,
      generatedBy: 'programs-enhancement-seed-writer',
      instanceKey: deliverable.instanceKey,
      clientDisplayName: portfolio.displayName,
      programName: program.name,
      routePath: deliverable.routePath,
      lifecycleState: deliverable.lifecycleState,
      evidenceState: deliverable.renderTier === 'rich' ? 'seeded_detail' : deliverable.renderTier === 'outline' ? 'seeded_outline' : 'scheduled_stub',
    },
    quality_score: {
      total_score: totalScore,
      seedQuality: totalScore / 100,
      fidelityTier: deliverable.renderTier,
      unresolvedGaps,
      rubricVersion: PROGRAMS_ENHANCEMENT_MATRIX.version,
    },
    quality_issues: {
      total_score: totalScore,
      critical: [],
      remaining:
        unresolvedGaps > 1
          ? [
              `${unresolvedGaps} seeded evidence gaps remain before client sign-off.`,
              'Promote with real tenant evidence and sponsor-approved sources.',
            ]
          : [],
      resolved: deliverable.renderTier === 'rich' ? ['Seed artifact has enough structure for demo walkthrough.'] : [],
      unresolvedGaps,
      action: unresolvedGaps > 1 ? 'Promote with real evidence before client sign-off.' : 'Review once with sponsor before sign-off.',
    },
    generated_from_context_hash: `${PROGRAMS_ENHANCEMENT_MATRIX.version}:${program.code}:${deliverable.deliverableCode}:${deliverable.phaseSpec}`,
  };
}

export function titleForDeliverableInstance(deliverable: Pick<DeliverableSeedPlan, 'deliverableCode' | 'title' | 'phaseSpec'>): string {
  return `${deliverable.deliverableCode} · ${deliverable.title} · Phase ${deliverable.phaseSpec}`;
}

function buildDeliverableContent(portfolio: TenantSeedPlan, program: ProgramSeedPlan, deliverable: DeliverableSeedPlan): string {
  const phase = PROGRAMS_ENHANCEMENT_MATRIX.phaseModel.specPhases.find((entry) => entry.phase === deliverable.phaseSpec);
  const archetype = PROGRAMS_ENHANCEMENT_MATRIX.archetypes.find((entry) => entry.code === program.archetypeCode);

  if (deliverable.renderTier === 'stub') {
    return [
      `# ${deliverable.deliverableCode} · ${deliverable.title}`,
      '',
      `**Scheduled for:** Phase ${deliverable.phaseSpec} · ${phase?.name ?? 'future phase'}`,
      `**Program:** ${program.name}`,
      `**Tenant:** ${portfolio.displayName}`,
      '',
      'This artifact is intentionally a scheduled stub. It becomes active only after the phase gate is met.',
      '',
      `Activation criterion: ${deliverable.structuredData.activationCriteria ?? phase?.gateCriterion ?? 'Next phase opens.'}`,
      '',
      'No client-facing conclusions should be inferred from this stub.',
    ].join('\n');
  }

  const depthNote =
    deliverable.renderTier === 'rich'
      ? 'Rich seed artifact: enough structure for a demo walkthrough, with explicit evidence gaps called out for production hardening.'
      : 'Outline seed artifact: visible enough to show where this deliverable lives, but not yet promoted to client-ready depth.';

  return [
    `# ${deliverable.deliverableCode} · ${deliverable.title}`,
    '',
    `**Program:** ${program.name}`,
    `**Tenant:** ${portfolio.displayName}`,
    `**Archetype:** ${archetype?.name ?? program.archetypeCode}`,
    `**Phase:** ${deliverable.phaseSpec} · ${phase?.name ?? 'Unknown phase'}`,
    `**Fidelity:** ${deliverable.renderTier}`,
    '',
    '## Executive readout',
    `${depthNote} This artifact supports the ${program.roleInDemo.toLowerCase()} for ${portfolio.displayName}.`,
    '',
    '## Evidence basis',
    `- Tenant profile: ${portfolio.displayName}`,
    `- Program pattern: ${program.patternSlug ?? 'No named pattern linked yet'}`,
    `- Current phase gate: ${phase?.gateCriterion ?? 'Not specified'}`,
    `- Lifecycle state: ${deliverable.lifecycleState.replace(/_/g, ' ')}`,
    '',
    '## Recommended action',
    deliverable.renderTier === 'rich'
      ? 'Use this artifact in the walkthrough, then replace seeded assumptions with tenant evidence before sponsor sign-off.'
      : 'Keep this as an outline until the relevant phase produces enough program-specific evidence.',
    '',
    '## Open decisions',
    '- Confirm sponsor-facing owner and review date.',
    '- Confirm evidence sources that should promote this artifact from seed to verified.',
    '- Confirm whether any future-phase conclusions should remain hidden until gate approval.',
    '',
    '## Quality checks',
    '- Internal traces and JSON tool payloads must remain hidden from the client UI.',
    '- Scheduled deliverables must not read as completed work.',
    '- The artifact must stay tenant-scoped and avoid cross-tenant examples unless explicitly anonymized.',
  ].join('\n');
}

function buildGatesPassed(program: ProgramSeedPlan, nowIso: string): Array<Record<string, unknown>> {
  const approvedSpecPhases = ([1, 2, 3, 4, 5] as SpecPhaseNumber[]).filter((phase) => phase < program.currentPhaseSpec);
  return approvedSpecPhases.map((phase) => ({
    phase: phase - 1,
    specPhase: phase,
    status: 'approved',
    signed_at: nowIso,
    seeded: true,
  }));
}

function uniqueStrings(values: string[]): string[] {
  return Array.from(new Set(values.map((value) => value.trim()).filter(Boolean)));
}
