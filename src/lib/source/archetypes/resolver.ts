// Source archetype resolver — two-axis: archetype (event DNA) × estate (spend
// band / complexity). Resolves the concrete evidence + methods + deliverables a
// given event needs at a given stage, WITHOUT any per-event branching in core
// code. Mirrors src/lib/programs/archetypes/resolver.ts.

import type {
  EvidenceFamilySpec,
  PhaseEvidenceRequirement,
  SourceEventArchetype,
  StageRequirements,
} from './types';
import type { SourceStageKey } from '../types';

/** The estate axis — scales requirement severity to deal materiality. */
export type SpendBand = 'small' | 'mid' | 'enterprise' | 'strategic';

export interface SourceEventProfile {
  spendBand?: SpendBand;
  /** Tenant key for governance/tenant resolution. */
  tenantKey?: string;
  /** Known committed evidence family keys (drives readiness diffing). */
  committedFamilies?: string[];
}

export interface ResolvedStageRequirements {
  stage: SourceStageKey;
  archetypeId: string;
  spendBand: SpendBand;
  requiredEvidence: Array<PhaseEvidenceRequirement & { family: string; spec?: EvidenceFamilySpec }>;
  analysisMethods: string[];
  deliverables: string[];
  /** Families required but not yet committed (never silent). */
  missingEvidence: string[];
}

/**
 * Below 'enterprise', soft requirements on heavy families are pruned to keep
 * small deals proportionate; hard requirements always remain.
 */
const HEAVY_FAMILIES = new Set([
  'retained_org_model', 'transition_constraints', 'business_readiness',
  'customization_inventory', 'operating_model_readiness',
]);

function familySpec(arch: SourceEventArchetype, key: string): EvidenceFamilySpec | undefined {
  return (
    arch.requiredEvidenceFamilies.find((x) => x.key === key) ||
    arch.optionalEvidenceFamilies.find((x) => x.key === key)
  );
}

export function resolveSourceStageRequirements(
  archetype: SourceEventArchetype,
  stage: SourceStageKey,
  profile: SourceEventProfile = {},
): ResolvedStageRequirements {
  const spendBand = profile.spendBand ?? 'enterprise';
  const committed = new Set(profile.committedFamilies ?? []);

  const stageDef: StageRequirements | undefined = archetype.stageModel.find((s) => s.stage === stage);
  const reqs = stageDef?.requiredEvidence ?? [];

  const prune = spendBand === 'small' || spendBand === 'mid';
  const requiredEvidence = reqs
    .filter((r) => !(prune && r.severity === 'soft' && HEAVY_FAMILIES.has(r.family)))
    .map((r) => ({ ...r, family: r.family, spec: familySpec(archetype, r.family) }));

  const missingEvidence = requiredEvidence
    .filter((r) => r.severity === 'hard' && !committed.has(r.family))
    .map((r) => r.family);

  return {
    stage,
    archetypeId: archetype.id,
    spendBand,
    requiredEvidence,
    analysisMethods: stageDef?.analysisMethods ?? [],
    deliverables: stageDef?.deliverables ?? [],
    missingEvidence,
  };
}

/** All required (hard) evidence family keys across the whole event lifecycle. */
export function requiredEvidenceFamilies(archetype: SourceEventArchetype): string[] {
  const fromStages = archetype.stageModel
    .flatMap((s) => s.requiredEvidence.filter((r) => r.severity === 'hard').map((r) => r.family));
  const declared = archetype.requiredEvidenceFamilies.map((f) => f.key);
  return Array.from(new Set([...declared, ...fromStages]));
}

/** Readiness diff: which declared-required families are still missing. */
export function evidenceReadiness(
  archetype: SourceEventArchetype,
  committedFamilies: string[],
): { required: string[]; committed: string[]; missing: string[]; ready: boolean } {
  const required = requiredEvidenceFamilies(archetype);
  const committed = committedFamilies.filter((f) => required.includes(f));
  const missing = required.filter((f) => !committedFamilies.includes(f));
  return { required, committed, missing, ready: missing.length === 0 };
}
