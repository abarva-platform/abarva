import { assembleP3SolutionOptions } from '../p3-option-assembler';
import type { P3DesignInputsPack } from '../types';
import type { ReadinessReport } from '@/lib/programs/current-state-readiness';
import {
  DEFAULT_ARCHETYPE_ID,
  GOVERNED_DATA_FOUNDATION,
} from '@/lib/programs/archetypes/registry';

/**
 * The five values `engagements.program_archetype` can hold. The column carries a
 * CHECK constraint to exactly this list
 * (`supabase/migrations/041_programs_foundation.sql`), and
 * `buildStrategicMove` casts it straight onto `move.archetype` with
 * `'strategic_transformation'` as the null fallback. So these five are the only
 * strings the P3 assembler's `archetype` argument can ever receive in the
 * product — which is why a declared archetype has to arrive by another route.
 */
const STORABLE_COARSE_ARCHETYPES = [
  'strategic_transformation',
  'workflow_automation',
  'platform_modernization',
  'ai_product_enablement',
  'operational_optimization',
] as const;

const GOVERNED_DATA_FOUNDATION_LABELS = [
  'Data ownership and quality rules first',
  'Certified semantic layer on the current platform',
  'Governed data platform and identity spine',
  'AI and LLM automation layer first',
];

const CONTACT_CENTRE_LABELS = [
  'Stabilize member-service workflow first',
  'Governed agent-assist layer on current systems',
  'Broader member-service orchestration platform',
  'Enterprise member-experience platform first',
];

/**
 * A governed-data-foundation Move whose evidence carries clinical and claims
 * vocabulary — "claims", "clinical", "PHI" — as a regulated-health estate's
 * data-foundation evidence naturally does. That vocabulary is load-bearing here:
 * it is what made the keyword scan score the member-service pattern.
 */
function governedDataFoundationPack(
  overrides: Partial<P3DesignInputsPack> = {},
): P3DesignInputsPack {
  return {
    moveId: 'move-gdf',
    businessOutcome:
      'Certify a governed data foundation so AI and LLM automation can be approved on trusted, owned data.',
    currentProcessFindings: [
      'Data governance council decision rights and stewardship are informal.',
      'Certified metric and entity definitions are not owned in a semantic layer.',
    ],
    painPointsAndRootCauses: [
      'No source-to-use lineage, so model audit trails cannot be produced.',
      'Data quality rules are undocumented and exception owners are unnamed.',
    ],
    currentSystems: ['Lakehouse, data catalog, master data, claims and clinical sources.'],
    currentDataPlatformState: [
      'Medallion layers exist but certification and lineage are incomplete.',
    ],
    dataReadiness: ['Data quality monitoring and the identity spine are not proven.'],
    organizationChangeReadiness: ['Stewardship capacity and council cadence need confirming.'],
    controlRequirements: ['PHI privacy, audit, and responsible-AI controls are required.'],
    humanDecisionBoundaries: ['Data stewards approve certified definitions.'],
    selectedSolutionBuildingBlocks: ['data_readiness', 'controls_governance_risk'],
    evidenceBackedConstraints: ['Lineage must be visible before AI use is approved.'],
    unresolvedQuestions: ['Who owns certified metrics?'],
    assumptions: ['The lakehouse remains the platform of record.'],
    notReadyConditions: ['No AI workflow until the foundation is certified.'],
    currentWorkflowWithPainPoints: ['Analysts reconcile definitions by hand each cycle.'],
    requiredFieldContract: ['Entity id', 'metric definition', 'lineage node', 'quality rule'],
    humanApprovalCheckpoints: ['The governance council certifies the semantic layer.'],
    controlBoundaries: ['Audit trail', 'PHI controls', 'no autonomous model promotion'],
    towerMetricCandidates: ['Certified metric coverage', 'lineage completeness'],
    openQuestionsForSolutionDesign: ['Which sources are certified?'],
    ...overrides,
  };
}

/** A `ReadinessReport` as the phase page resolves it, so the field this reads is the field the host passes. */
function readinessReport(archetypeId: string): ReadinessReport {
  return {
    phase: 3,
    archetypeId,
    archetypeName: 'Governed Data Foundation',
    archetypeVersion: '2026-10-05',
    profile: {} as ReadinessReport['profile'],
    instruments: [],
    coverageScore: 40,
    hardGaps: [],
    softGaps: [],
  };
}

function optionsFor(
  args: { archetype?: string | null; readiness?: ReadinessReport | null } = {},
) {
  return assembleP3SolutionOptions({
    moveId: 'move-gdf',
    moveName: 'Governed Data Foundation for AI Automation',
    archetype: args.archetype ?? null,
    industryCode: 'healthcare_payer',
    designInputs: governedDataFoundationPack(),
    readiness: args.readiness ?? null,
  });
}

describe('P3 options for a Move whose archetype is declared', () => {
  it('offers a declared data-foundation Move foundation options, not the contact-centre set', () => {
    const optionSet = optionsFor({
      archetype: 'operational_optimization',
      readiness: readinessReport('GOVERNED_DATA_FOUNDATION'),
    });

    expect(optionSet.useCasePattern).toBe('governed_data_foundation');
    expect(optionSet.options.map((option) => option.label)).toEqual(
      GOVERNED_DATA_FOUNDATION_LABELS,
    );
  });

  it('was giving that Move the contact-centre options — the set belonging to a different archetype', () => {
    // The state before the fix, reproduced by withholding the declaration: the
    // same Move, same prose, no resolved archetype id.
    const undeclared = optionsFor({ archetype: 'operational_optimization' });

    expect(undeclared.useCasePattern).toBe('member_service_agent_assist');
    expect(undeclared.options.map((option) => option.label)).toEqual(CONTACT_CENTRE_LABELS);
  });

  it('cannot take the declaration from the coarse column, whichever of its five values is stored', () => {
    // The declaration arm keyed only off `archetype` was unreachable in the
    // product: none of the column's storable values is a declared archetype id,
    // so every one of them fell through to the keyword scan.
    for (const coarse of STORABLE_COARSE_ARCHETYPES) {
      expect(optionsFor({ archetype: coarse }).useCasePattern).toBe(
        'member_service_agent_assist',
      );
    }
  });

  it('prefers the resolved archetype id over the coarse column and over the prose', () => {
    const optionSet = optionsFor({
      // A coarse value that reads like a platform Move, and prose full of
      // member-service terms. Neither gets to decide.
      archetype: 'platform_modernization',
      readiness: readinessReport('GOVERNED_DATA_FOUNDATION'),
    });

    expect(optionSet.useCasePattern).toBe('governed_data_foundation');
  });

  it('lets the resolved archetype settle it when both arguments name a use case', () => {
    // Both arms stay live for a direct caller, so their order is a real choice.
    // `readiness.archetypeId` is the archetype `resolveMoveArchetypeForProgram`
    // settled on, which already honours an explicit declaration; the coarse
    // column is strictly the less specific of the two.
    const optionSet = optionsFor({
      archetype: 'CONTACT_CENTER_AGENT_ASSIST',
      readiness: readinessReport('GOVERNED_DATA_FOUNDATION'),
    });

    expect(optionSet.useCasePattern).toBe('governed_data_foundation');
  });

  it('answers to the registry id the archetype actually resolves to', () => {
    // Read from the registry, not written out, because this is the spelling
    // `resolveProgramArchetype` really produces and puts in the readiness
    // report. Renaming the registry id without adding the new spelling to
    // `ARCHETYPE_USE_CASE_PATTERNS` would otherwise silently return this Move
    // to the contact-centre options.
    const optionSet = optionsFor({
      readiness: readinessReport(GOVERNED_DATA_FOUNDATION.id),
    });

    expect(optionSet.useCasePattern).toBe('governed_data_foundation');
  });

  it('accepts the declared identity by discovery-blueprint id as well as by registry id', () => {
    // `governed_data_foundation` is the discovery blueprint's id; the
    // strategic-move registry spells the same archetype `GOVERNED_DATA_FOUNDATION`.
    for (const declared of [
      'governed_data_foundation',
      'GOVERNED_DATA_FOUNDATION',
      'Governed Data Foundation',
    ]) {
      expect(optionsFor({ readiness: readinessReport(declared) }).useCasePattern).toBe(
        'governed_data_foundation',
      );
    }
  });

  it('leaves a Move whose resolved archetype is not a declared use case on its inferred pattern', () => {
    // The default archetype id resolves no pattern, so the keyword scan still
    // answers. The fix is additive: it adds a way IN for a declaration, it does
    // not take inference away from Moves that declare nothing.
    const optionSet = optionsFor({
      archetype: 'operational_optimization',
      readiness: readinessReport(DEFAULT_ARCHETYPE_ID),
    });

    expect(optionSet.useCasePattern).toBe('member_service_agent_assist');
  });

  it('ladders the four foundation options from ownership to platform, with the AI layer last', () => {
    const optionSet = optionsFor({ readiness: readinessReport('GOVERNED_DATA_FOUNDATION') });
    const [ownership, semantic, platform, aiFirst] = optionSet.options;

    expect(ownership.label).toBe('Data ownership and quality rules first');
    expect(semantic.label).toBe('Certified semantic layer on the current platform');
    expect(platform.label).toBe('Governed data platform and identity spine');
    expect(aiFirst.label).toBe('AI and LLM automation layer first');

    // The earliest option must be the fastest to prove and the AI-first option
    // the slowest, or the ladder does not say what it is for.
    expect(ownership.scores.time_to_proof).toBeGreaterThan(aiFirst.scores.time_to_proof);
    expect(platform.scores.business_value).toBeGreaterThan(ownership.scores.business_value);
  });

  it('still gives a declared contact-centre Move its own option set', () => {
    const optionSet = assembleP3SolutionOptions({
      moveId: 'move-member',
      moveName: 'Member Experience AI Assist',
      archetype: 'operational_optimization',
      designInputs: governedDataFoundationPack(),
      readiness: readinessReport('CONTACT_CENTER_AGENT_ASSIST'),
    });

    expect(optionSet.useCasePattern).toBe('member_service_agent_assist');
    expect(optionSet.options.map((option) => option.label)).toEqual(CONTACT_CENTRE_LABELS);
  });
});
