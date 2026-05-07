import matrixArtifact from '../../../intelligence/seeds/archetype-phase-deliverable-matrix.json';
import apexPortfolio from '../../../intelligence/seeds/tenant-portfolios/apexretail.json';
import arcturusPortfolio from '../../../intelligence/seeds/tenant-portfolios/arcturus.json';
import meridianPortfolio from '../../../intelligence/seeds/tenant-portfolios/meridian.json';

export type SpecArchetypeCode = 'ST' | 'WA' | 'PM' | 'AP' | 'OO';
export type SpecPhaseNumber = 1 | 2 | 3 | 4 | 5;
export type PortfolioFidelityTier = 'rich' | 'outline';
export type DeliverableRequirement = 'required' | 'optional' | 'additional';
export type DeliverableRenderTier = 'rich' | 'outline' | 'stub';
export type DeliverableLifecycleState = 'completed_or_current' | 'scheduled';

export interface SpecPhase {
  phase: SpecPhaseNumber;
  name: string;
  gateCriterion: string;
  primaryOutput: string;
  currentAppPhase: number;
}

export interface SpecArchetype {
  code: SpecArchetypeCode;
  key: string;
  name: string;
  description: string;
  typicalDurationMonths: { min: number; max: number };
  typicalPrograms: string[];
}

export interface SpecDeliverable {
  code: string;
  slug: string;
  title: string;
  typicalPhases: SpecPhaseNumber[];
  appliesToArchetypes: SpecArchetypeCode[];
}

export interface MatrixPhaseEntry {
  required: string[];
  optional: string[];
}

export interface MatrixArtifact {
  version: string;
  specDate: string;
  owner: string;
  status: string;
  phaseModel: { specPhases: SpecPhase[] };
  archetypes: SpecArchetype[];
  deliverables: SpecDeliverable[];
  matrix: Record<SpecArchetypeCode, Record<`${SpecPhaseNumber}`, MatrixPhaseEntry>>;
  deliverableCountPerArchetype: Record<SpecArchetypeCode, { min: number; max: number }>;
}

export interface TenantProgramSeed {
  code: string;
  programSlug: string;
  name: string;
  archetypeCode: SpecArchetypeCode;
  currentPhaseSpec: SpecPhaseNumber;
  portfolioFidelityTier: PortfolioFidelityTier;
  patternSlug: string | null;
  roleInDemo: string;
  optionalSeedDeliverablesByPhase?: Partial<Record<`${SpecPhaseNumber}`, string[]>>;
  additionalSeedDeliverablesByPhase?: Partial<Record<`${SpecPhaseNumber}`, string[]>>;
  richDeliverablesByPhase?: Partial<Record<`${SpecPhaseNumber}`, string[]>>;
}

export interface TenantPortfolioSeed {
  tenantKey: string;
  routeSlug: string;
  displayName: string;
  displayAliases: string[];
  industryKey: string;
  profile: string;
  demoRole: string;
  programs: TenantProgramSeed[];
  expectedPhaseDistribution: Record<`${SpecPhaseNumber}`, number>;
  expectedArchetypeDistribution: Partial<Record<SpecArchetypeCode, number>>;
  narrativeClaims?: {
    estimatedDeliverableInstancesRange?: { min: number; max: number };
  };
}

export interface ProgramDeliverableInstance {
  code: string;
  slug: string;
  title: string;
  archetypeCode: SpecArchetypeCode;
  phase: SpecPhaseNumber;
  requirement: DeliverableRequirement;
  renderTier: DeliverableRenderTier;
  lifecycleState: DeliverableLifecycleState;
}

export interface EnhancementSpecSummary {
  totalPrograms: number;
  totalDeliverableInstances: number;
  totalSeededNonStubDeliverables: number;
  totalRichDeliverables: number;
  totalOutlineDeliverables: number;
  totalStubDeliverables: number;
  phaseCoverageByTenantCount: Record<`${SpecPhaseNumber}`, number>;
  archetypeCoverageByTenantCount: Record<SpecArchetypeCode, number>;
  richProgramsFromPortfolioTable: number;
}

export const PROGRAMS_ENHANCEMENT_MATRIX = matrixArtifact as MatrixArtifact;
export const TENANT_PORTFOLIOS: TenantPortfolioSeed[] = [
  apexPortfolio as TenantPortfolioSeed,
  meridianPortfolio as TenantPortfolioSeed,
  arcturusPortfolio as TenantPortfolioSeed,
];

export const SPEC_PHASE_TO_APP_PHASE: Record<SpecPhaseNumber, number> = {
  1: 0,
  2: 1,
  3: 2,
  4: 3,
  5: 4,
};

export function getDeliverableDefinition(code: string): SpecDeliverable {
  const deliverable = PROGRAMS_ENHANCEMENT_MATRIX.deliverables.find((entry) => entry.code === code);
  if (!deliverable) throw new Error(`Unknown deliverable code: ${code}`);
  return deliverable;
}

export function getMatrixEntry(archetypeCode: SpecArchetypeCode, phase: SpecPhaseNumber): MatrixPhaseEntry {
  return PROGRAMS_ENHANCEMENT_MATRIX.matrix[archetypeCode][String(phase) as `${SpecPhaseNumber}`];
}

export function getTenantPortfolio(tenantKey: string): TenantPortfolioSeed | undefined {
  return TENANT_PORTFOLIOS.find((portfolio) => portfolio.tenantKey === tenantKey);
}

export function buildDeliverablePlanForProgram(program: TenantProgramSeed): ProgramDeliverableInstance[] {
  const plan: ProgramDeliverableInstance[] = [];

  for (const phase of [1, 2, 3, 4, 5] as SpecPhaseNumber[]) {
    const phaseEntry = getMatrixEntry(program.archetypeCode, phase);
    const deliverableGroups: Array<{ requirement: DeliverableRequirement; codes: string[] }> = [
      { requirement: 'required', codes: phaseEntry.required },
      { requirement: 'optional', codes: program.optionalSeedDeliverablesByPhase?.[String(phase) as `${SpecPhaseNumber}`] ?? [] },
      { requirement: 'additional', codes: program.additionalSeedDeliverablesByPhase?.[String(phase) as `${SpecPhaseNumber}`] ?? [] },
    ];

    for (const { requirement, codes } of deliverableGroups) {
      for (const code of codes) {
        const deliverable = getDeliverableDefinition(code);
        const richSet = new Set(program.richDeliverablesByPhase?.[String(phase) as `${SpecPhaseNumber}`] ?? []);
        const renderTier: DeliverableRenderTier =
          phase > program.currentPhaseSpec
            ? 'stub'
            : richSet.has(code)
              ? 'rich'
              : 'outline';

        plan.push({
          code,
          slug: deliverable.slug,
          title: deliverable.title,
          archetypeCode: program.archetypeCode,
          phase,
          requirement,
          renderTier,
          lifecycleState: phase > program.currentPhaseSpec ? 'scheduled' : 'completed_or_current',
        });
      }
    }
  }

  return plan;
}

export function summarizeProgramsSeedEnhancementSpec(): EnhancementSpecSummary {
  const allPrograms = TENANT_PORTFOLIOS.flatMap((portfolio) => portfolio.programs);
  const allPlans = allPrograms.flatMap((program) => buildDeliverablePlanForProgram(program));

  const phaseCoverageByTenantCount = Object.fromEntries(
    ([1, 2, 3, 4, 5] as SpecPhaseNumber[]).map((phase) => [
      String(phase),
      TENANT_PORTFOLIOS.filter((portfolio) => portfolio.programs.some((program) => program.currentPhaseSpec === phase)).length,
    ]),
  ) as Record<`${SpecPhaseNumber}`, number>;

  const archetypeCoverageByTenantCount = Object.fromEntries(
    (['ST', 'WA', 'PM', 'AP', 'OO'] as SpecArchetypeCode[]).map((archetypeCode) => [
      archetypeCode,
      TENANT_PORTFOLIOS.filter((portfolio) => portfolio.programs.some((program) => program.archetypeCode === archetypeCode)).length,
    ]),
  ) as Record<SpecArchetypeCode, number>;

  return {
    totalPrograms: allPrograms.length,
    totalDeliverableInstances: allPlans.length,
    totalSeededNonStubDeliverables: allPlans.filter((plan) => plan.renderTier !== 'stub').length,
    totalRichDeliverables: allPlans.filter((plan) => plan.renderTier === 'rich').length,
    totalOutlineDeliverables: allPlans.filter((plan) => plan.renderTier === 'outline').length,
    totalStubDeliverables: allPlans.filter((plan) => plan.renderTier === 'stub').length,
    phaseCoverageByTenantCount,
    archetypeCoverageByTenantCount,
    richProgramsFromPortfolioTable: allPrograms.filter((program) => program.portfolioFidelityTier === 'rich').length,
  };
}

export function validateProgramsSeedEnhancementSpec(): { errors: string[]; warnings: string[]; summary: EnhancementSpecSummary } {
  const errors: string[] = [];
  const warnings: string[] = [];
  const summary = summarizeProgramsSeedEnhancementSpec();

  // Program count: total across all active tenant portfolios (excludes retired tenants).
  const activePortfolioCount = TENANT_PORTFOLIOS.reduce((acc, p) => acc + p.programs.length, 0);
  if (summary.totalPrograms !== activePortfolioCount) {
    errors.push(`Expected ${activePortfolioCount} programs across all portfolios, found ${summary.totalPrograms}.`);
  }

  if (summary.totalRichDeliverables !== 44) {
    errors.push(`Expected 44 explicit Rich deliverables from Part 5, found ${summary.totalRichDeliverables}.`);
  }

  // Non-stub deliverable range is proportional to active program count (≥200 per 3-tenant baseline).
  const nonStubMin = Math.floor(activePortfolioCount * 14);
  if (summary.totalSeededNonStubDeliverables < nonStubMin) {
    errors.push(
      `Expected at least ${nonStubMin} seeded non-stub deliverable instances (proportional to ${activePortfolioCount} programs), found ${summary.totalSeededNonStubDeliverables}.`,
    );
  }

  for (const portfolio of TENANT_PORTFOLIOS) {
    const phaseDistribution = Object.fromEntries(
      ([1, 2, 3, 4, 5] as SpecPhaseNumber[]).map((phase) => [
        String(phase),
        portfolio.programs.filter((program) => program.currentPhaseSpec === phase).length,
      ]),
    ) as Record<`${SpecPhaseNumber}`, number>;

    for (const phase of [1, 2, 3, 4, 5] as SpecPhaseNumber[]) {
      const expected = portfolio.expectedPhaseDistribution[String(phase) as `${SpecPhaseNumber}`];
      if (phaseDistribution[String(phase) as `${SpecPhaseNumber}`] !== expected) {
        errors.push(
          `${portfolio.tenantKey} expected phase ${phase} count ${expected}, found ${phaseDistribution[String(phase) as `${SpecPhaseNumber}`]}.`,
        );
      }
    }

    const archetypeDistribution = portfolio.programs.reduce<Partial<Record<SpecArchetypeCode, number>>>((acc, program) => {
      acc[program.archetypeCode] = (acc[program.archetypeCode] ?? 0) + 1;
      return acc;
    }, {});

    for (const [archetypeCode, expected] of Object.entries(portfolio.expectedArchetypeDistribution) as Array<[SpecArchetypeCode, number]>) {
      const actual = archetypeDistribution[archetypeCode] ?? 0;
      if (actual !== expected) {
        errors.push(`${portfolio.tenantKey} expected archetype ${archetypeCode} count ${expected}, found ${actual}.`);
      }
    }
  }

  if (summary.archetypeCoverageByTenantCount.ST < 3 || summary.archetypeCoverageByTenantCount.OO < 3) {
    warnings.push(
      `Part 2 says every archetype appears in at least 3 tenants, but encoded portfolios produce ST=${summary.archetypeCoverageByTenantCount.ST} and OO=${summary.archetypeCoverageByTenantCount.OO}.`,
    );
  }

  if (summary.richProgramsFromPortfolioTable !== 2) {
    warnings.push(
      `Part 2 cross-tenant totals claim 2 Rich programs / 17 Outline programs, but the explicit program tables mark ${summary.richProgramsFromPortfolioTable} programs as Rich-capable.`,
    );
  }

  return { errors, warnings, summary };
}
