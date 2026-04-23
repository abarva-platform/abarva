import {
  PROGRAMS_ENHANCEMENT_MATRIX,
  SPEC_PHASE_TO_APP_PHASE,
  TENANT_PORTFOLIOS,
  buildDeliverablePlanForProgram,
  getDeliverableDefinition,
  type DeliverableRenderTier,
  type ProgramDeliverableInstance,
  type SpecArchetypeCode,
  type SpecDeliverable,
  type SpecPhaseNumber,
  type TenantPortfolioSeed,
  type TenantProgramSeed,
} from './enhancement-spec';
import type { ArchetypeKey } from './types.ui';

export interface DeliverableTypeSeedSpec {
  typeKey: string;
  code: string;
  slug: string;
  title: string;
  applicableSpecPhases: SpecPhaseNumber[];
  applicableAppPhases: number[];
  applicableArchetypeCodes: SpecArchetypeCode[];
  outputFormat: 'markdown';
  maturity: 'pilot';
}

export interface DeliverableSeedPlan {
  programCode: string;
  programSlug: string;
  instanceKey: string;
  deliverableTypeKey: string;
  deliverableCode: string;
  deliverableSlug: string;
  title: string;
  routePath: string;
  phaseSpec: SpecPhaseNumber;
  phaseApp: number;
  requirement: ProgramDeliverableInstance['requirement'];
  renderTier: DeliverableRenderTier;
  lifecycleState: ProgramDeliverableInstance['lifecycleState'];
  status: 'draft' | 'in_review' | 'signed_off';
  structuredData: {
    seedSpecVersion: string;
    tenantKey: string;
    routeSlug: string;
    programCode: string;
    programSlug: string;
    deliverableCode: string;
    fidelityTier: DeliverableRenderTier;
    requirement: ProgramDeliverableInstance['requirement'];
    phaseSpec: SpecPhaseNumber;
    phaseApp: number;
    activationCriteria?: string;
  };
}

export interface ProgramSeedPlan {
  tenantKey: string;
  tenantRouteSlug: string;
  clientDisplayName: string;
  code: string;
  programSlug: string;
  graphNodeId: string;
  name: string;
  archetypeCode: SpecArchetypeCode;
  appArchetype: ArchetypeKey;
  currentPhaseSpec: SpecPhaseNumber;
  currentAppPhase: number;
  status: 'active' | 'completed';
  patternSlug: string | null;
  routePath: string;
  roleInDemo: string;
  deliverables: DeliverableSeedPlan[];
}

export interface TenantSeedPlan {
  tenantKey: string;
  routeSlug: string;
  displayName: string;
  programs: ProgramSeedPlan[];
}

export interface AllProgramsSeedPlan {
  deliverableTypes: DeliverableTypeSeedSpec[];
  tenants: TenantSeedPlan[];
  programs: ProgramSeedPlan[];
  deliverables: DeliverableSeedPlan[];
  summary: {
    tenantCount: number;
    programCount: number;
    deliverableTypeCount: number;
    deliverableCount: number;
    nonStubDeliverableCount: number;
    richDeliverableCount: number;
    outlineDeliverableCount: number;
    stubDeliverableCount: number;
  };
}

const ARCHETYPE_TO_APP_ARCHETYPE: Record<SpecArchetypeCode, ArchetypeKey> = {
  ST: 'strategic_transformation',
  WA: 'workflow_automation',
  PM: 'platform_modernization',
  AP: 'ai_product_enablement',
  OO: 'operational_optimization',
};

export function deliverableTypeKeyFor(definition: Pick<SpecDeliverable, 'slug'>): string {
  return definition.slug.replace(/-/g, '_');
}

export function graphNodeIdForProgram(portfolio: Pick<TenantPortfolioSeed, 'tenantKey'>, program: Pick<TenantProgramSeed, 'programSlug'>): string {
  return `eng_${portfolio.tenantKey}_${program.programSlug.replace(/-/g, '_')}`;
}

export function deliverableRouteSegmentFor(deliverable: Pick<DeliverableSeedPlan, 'deliverableCode' | 'deliverableSlug'>): string {
  return `${deliverable.deliverableCode.toLowerCase()}-${deliverable.deliverableSlug.replace(/^d\d+-/, '')}`;
}

export function buildDeliverableTypeSeedSpecs(): DeliverableTypeSeedSpec[] {
  return PROGRAMS_ENHANCEMENT_MATRIX.deliverables.map((definition) => ({
    typeKey: deliverableTypeKeyFor(definition),
    code: definition.code,
    slug: definition.slug,
    title: definition.title,
    applicableSpecPhases: definition.typicalPhases,
    applicableAppPhases: definition.typicalPhases.map((phase) => SPEC_PHASE_TO_APP_PHASE[phase]),
    applicableArchetypeCodes: definition.appliesToArchetypes,
    outputFormat: 'markdown',
    maturity: 'pilot',
  }));
}

function phaseActivationCriteria(phase: SpecPhaseNumber): string {
  const phaseModel = PROGRAMS_ENHANCEMENT_MATRIX.phaseModel.specPhases.find((entry) => entry.phase === phase);
  return phaseModel?.gateCriterion ?? `Program reaches Phase ${phase}`;
}

function statusForDeliverable(renderTier: DeliverableRenderTier, lifecycleState: ProgramDeliverableInstance['lifecycleState']): DeliverableSeedPlan['status'] {
  if (lifecycleState === 'scheduled') return 'draft';
  if (renderTier === 'rich') return 'in_review';
  return 'draft';
}

export function buildProgramSeedPlan(portfolio: TenantPortfolioSeed, program: TenantProgramSeed): ProgramSeedPlan {
  const currentAppPhase = SPEC_PHASE_TO_APP_PHASE[program.currentPhaseSpec];
  const routePath = `/tenant/${portfolio.routeSlug}/programs/${program.programSlug}`;
  const deliverables = buildDeliverablePlanForProgram(program).map((entry) => {
    const definition = getDeliverableDefinition(entry.code);
    const phaseApp = SPEC_PHASE_TO_APP_PHASE[entry.phase];
    const structuredData: DeliverableSeedPlan['structuredData'] = {
      seedSpecVersion: PROGRAMS_ENHANCEMENT_MATRIX.version,
      tenantKey: portfolio.tenantKey,
      routeSlug: portfolio.routeSlug,
      programCode: program.code,
      programSlug: program.programSlug,
      deliverableCode: entry.code,
      fidelityTier: entry.renderTier,
      requirement: entry.requirement,
      phaseSpec: entry.phase,
      phaseApp,
    };

    if (entry.lifecycleState === 'scheduled') {
      structuredData.activationCriteria = phaseActivationCriteria(entry.phase);
    }

    return {
      programCode: program.code,
      programSlug: program.programSlug,
      instanceKey: `${program.code}:P${entry.phase}:${entry.code}:${entry.requirement}`,
      deliverableTypeKey: deliverableTypeKeyFor(definition),
      deliverableCode: entry.code,
      deliverableSlug: definition.slug,
      title: definition.title,
      routePath: `${routePath}/deliverables/${deliverableRouteSegmentFor({
        deliverableCode: entry.code,
        deliverableSlug: definition.slug,
      })}`,
      phaseSpec: entry.phase,
      phaseApp,
      requirement: entry.requirement,
      renderTier: entry.renderTier,
      lifecycleState: entry.lifecycleState,
      status: statusForDeliverable(entry.renderTier, entry.lifecycleState),
      structuredData,
    };
  });

  return {
    tenantKey: portfolio.tenantKey,
    tenantRouteSlug: portfolio.routeSlug,
    clientDisplayName: portfolio.displayName,
    code: program.code,
    programSlug: program.programSlug,
    graphNodeId: graphNodeIdForProgram(portfolio, program),
    name: program.name,
    archetypeCode: program.archetypeCode,
    appArchetype: ARCHETYPE_TO_APP_ARCHETYPE[program.archetypeCode],
    currentPhaseSpec: program.currentPhaseSpec,
    currentAppPhase,
    status: program.currentPhaseSpec === 5 ? 'completed' : 'active',
    patternSlug: program.patternSlug,
    routePath,
    roleInDemo: program.roleInDemo,
    deliverables,
  };
}

export function buildTenantSeedPlan(portfolio: TenantPortfolioSeed): TenantSeedPlan {
  return {
    tenantKey: portfolio.tenantKey,
    routeSlug: portfolio.routeSlug,
    displayName: portfolio.displayName,
    programs: portfolio.programs.map((program) => buildProgramSeedPlan(portfolio, program)),
  };
}

export function buildAllProgramsSeedPlan(): AllProgramsSeedPlan {
  const deliverableTypes = buildDeliverableTypeSeedSpecs();
  const tenants = TENANT_PORTFOLIOS.map(buildTenantSeedPlan);
  const programs = tenants.flatMap((tenant) => tenant.programs);
  const deliverables = programs.flatMap((program) => program.deliverables);

  return {
    deliverableTypes,
    tenants,
    programs,
    deliverables,
    summary: {
      tenantCount: tenants.length,
      programCount: programs.length,
      deliverableTypeCount: deliverableTypes.length,
      deliverableCount: deliverables.length,
      nonStubDeliverableCount: deliverables.filter((deliverable) => deliverable.renderTier !== 'stub').length,
      richDeliverableCount: deliverables.filter((deliverable) => deliverable.renderTier === 'rich').length,
      outlineDeliverableCount: deliverables.filter((deliverable) => deliverable.renderTier === 'outline').length,
      stubDeliverableCount: deliverables.filter((deliverable) => deliverable.renderTier === 'stub').length,
    },
  };
}
