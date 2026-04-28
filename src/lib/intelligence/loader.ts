import { AI_PROGRAM_PATTERNS } from './seed-patterns-ai-programs';
import { ARCHITECTURE_PATTERNS } from './seed-patterns-architecture';
import { CDP_PATTERNS } from './seed-patterns-cdp';
import { INDUSTRY_PATTERNS } from './seed-patterns-industry';
import { META_PATTERNS } from './seed-patterns-meta';
import { SOURCING_PATTERNS } from './seed-patterns-sourcing';
import { MANUAL_SIGNALS } from './seed-signals-manual';
import { SOLUTION_SEEDS } from './seed-solutions';
import { CONTRADICTION_SEEDS } from './seed-contradictions';
import type { ContradictionSeed } from './seed-contradictions';
import type { SignalSeed } from './seed-signals-manual';
import type { SolutionSeed } from './seed-solutions';
import type { PatternDomain, PatternSeed, PatternTier } from './seed-types';
import type { CorpusEntity, LoadedCorpus, LoaderConfig } from './types';

const DEFAULT_PATTERNS: readonly PatternSeed[] = [
  ...AI_PROGRAM_PATTERNS,
  ...ARCHITECTURE_PATTERNS,
  ...CDP_PATTERNS,
  ...INDUSTRY_PATTERNS,
  ...META_PATTERNS,
  ...SOURCING_PATTERNS,
];

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;

const getId = (entity: CorpusEntity): string => entity.id;

function assertValidId(entityType: string, entity: CorpusEntity): void {
  if (!isRecord(entity) || typeof entity.id !== 'string' || entity.id.trim().length === 0) {
    throw new Error(`Invalid ${entityType}: expected a non-empty string id`);
  }
}

function indexById<T extends CorpusEntity>(entityType: string, entities: readonly T[]): ReadonlyMap<string, T> {
  const byId = new Map<string, T>();

  for (const entity of entities) {
    assertValidId(entityType, entity);

    const existing = byId.get(entity.id);
    if (existing) {
      throw new Error(`Duplicate ${entityType} id: ${entity.id}`);
    }

    byId.set(entity.id, entity);
  }

  return byId;
}

function assertGlobalUniqueIds(groups: Array<{ entityType: string; entities: readonly CorpusEntity[] }>): void {
  const ownersById = new Map<string, string>();

  for (const group of groups) {
    for (const entity of group.entities) {
      const priorOwner = ownersById.get(getId(entity));
      if (priorOwner) {
        throw new Error(
          `Duplicate corpus id: ${getId(entity)} appears in both ${priorOwner} and ${group.entityType}`,
        );
      }

      ownersById.set(getId(entity), group.entityType);
    }
  }
}

function assertStringArray(entityType: string, entityId: string, fieldName: string, value: unknown): string[] {
  if (!Array.isArray(value) || value.some((item) => typeof item !== 'string' || item.trim().length === 0)) {
    throw new Error(`${entityType} ${entityId} has invalid ${fieldName}: expected non-empty string[]`);
  }

  return value;
}

function assertSolutionReferences(
  solutions: readonly SolutionSeed[],
  patternsById: ReadonlyMap<string, PatternSeed>,
  signalsById: ReadonlyMap<string, SignalSeed>,
): void {
  for (const solution of solutions) {
    const patternIds = assertStringArray('Solution', solution.id, 'patternIds', solution.patternIds);
    const signalIds = assertStringArray('Solution', solution.id, 'signalIds', solution.signalIds);

    for (const patternId of patternIds) {
      if (!patternsById.has(patternId)) {
        throw new Error(`Solution ${solution.id} references unknown pattern id: ${patternId}`);
      }
    }

    for (const signalId of signalIds) {
      if (!signalsById.has(signalId)) {
        throw new Error(`Solution ${solution.id} references unknown signal id: ${signalId}`);
      }
    }

    if (!Array.isArray(solution.compositionManifest)) {
      throw new Error(`Solution ${solution.id} has invalid compositionManifest: expected array`);
    }

    for (const component of solution.compositionManifest) {
      if (!isRecord(component) || typeof component.componentId !== 'string') {
        throw new Error(`Solution ${solution.id} has invalid composition component`);
      }

      if (component.componentKind === 'pattern') {
        if (!patternsById.has(component.componentId)) {
          throw new Error(
            `Solution ${solution.id} composition references unknown pattern id: ${component.componentId}`,
          );
        }
      } else if (component.componentKind === 'signal') {
        if (!signalsById.has(component.componentId)) {
          throw new Error(
            `Solution ${solution.id} composition references unknown signal id: ${component.componentId}`,
          );
        }
      } else {
        throw new Error(`Solution ${solution.id} has invalid composition component kind`);
      }
    }
  }
}

function assertContradictionReferences(
  contradictions: readonly ContradictionSeed[],
  patternsById: ReadonlyMap<string, PatternSeed>,
): void {
  for (const contradiction of contradictions) {
    const affectedPatternIds = assertStringArray(
      'Contradiction',
      contradiction.id,
      'affectedPatternIds',
      contradiction.affectedPatternIds,
    );

    for (const patternId of affectedPatternIds) {
      if (!patternsById.has(patternId)) {
        throw new Error(`Contradiction ${contradiction.id} references unknown pattern id: ${patternId}`);
      }
    }
  }
}

function buildGlobalIndex(groups: Array<{ entities: readonly CorpusEntity[] }>): ReadonlyMap<string, CorpusEntity> {
  const byId = new Map<string, CorpusEntity>();

  for (const group of groups) {
    for (const entity of group.entities) {
      byId.set(entity.id, entity);
    }
  }

  return byId;
}

function groupPatternsByDomain(patterns: readonly PatternSeed[]): ReadonlyMap<PatternDomain, readonly PatternSeed[]> {
  const byDomain = new Map<PatternDomain, PatternSeed[]>();

  for (const pattern of patterns) {
    const group = byDomain.get(pattern.domain) ?? [];
    group.push(pattern);
    byDomain.set(pattern.domain, group);
  }

  return byDomain;
}

function groupPatternsByTier(patterns: readonly PatternSeed[]): ReadonlyMap<PatternTier, readonly PatternSeed[]> {
  const byTier = new Map<PatternTier, PatternSeed[]>();

  for (const pattern of patterns) {
    const group = byTier.get(pattern.tier) ?? [];
    group.push(pattern);
    byTier.set(pattern.tier, group);
  }

  return byTier;
}

export function loadCorpus(config: LoaderConfig = {}): LoadedCorpus {
  const patterns = config.patterns ?? DEFAULT_PATTERNS;
  const signals = config.signals ?? MANUAL_SIGNALS;
  const solutions = config.solutions ?? SOLUTION_SEEDS;
  const contradictions = config.contradictions ?? CONTRADICTION_SEEDS;

  const patternsById = indexById('pattern', patterns);
  const signalsById = indexById('signal', signals);
  const solutionsById = indexById('solution', solutions);
  const contradictionsById = indexById('contradiction', contradictions);

  if (config.validate !== false) {
    assertGlobalUniqueIds([
      { entityType: 'patterns', entities: patterns },
      { entityType: 'signals', entities: signals },
      { entityType: 'solutions', entities: solutions },
      { entityType: 'contradictions', entities: contradictions },
    ]);
    assertSolutionReferences(solutions, patternsById, signalsById);
    assertContradictionReferences(contradictions, patternsById);
  }

  return {
    patterns,
    signals,
    solutions,
    contradictions,
    byId: buildGlobalIndex([
      { entities: patterns },
      { entities: signals },
      { entities: solutions },
      { entities: contradictions },
    ]),
    byDomain: groupPatternsByDomain(patterns),
    byTier: groupPatternsByTier(patterns),
    patternsById,
    signalsById,
    solutionsById,
    contradictionsById,
    loadedAt: config.loadedAt ?? new Date().toISOString(),
  };
}

export const corpus = loadCorpus();
