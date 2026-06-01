import type { ProgramInstance } from '@/lib/programs/program-instance';
import { buildDependencyGraph, type DependencyEdge } from './dependency-graph';
import { detectCannibalization, type CannibalizationFinding } from './cannibalization';
import { buildResourcePools, type ResourcePool } from './resource-pools';

export interface PortfolioSequence {
  quarters: Array<{
    quarterId: string;
    moves: Array<{ moveId: string; phase: string; reasoning: string }>;
    resourceUtilization: Record<string, number>;
    blockedMoves: Array<{ moveId: string; blockedBy: string[]; recommendedAction: string }>;
  }>;
  unmetDependencies: DependencyEdge[];
  totalValueRealizedByQuarter: Record<string, number>;
  alternativeSequences: Array<{ scenario: string; tradeoff: string }>;
}

export interface OptimizePortfolioSequenceInput {
  clientKey: string;
  programs: ReadonlyArray<ProgramInstance>;
  startQuarterId?: string;
  dependencyEdges?: ReadonlyArray<DependencyEdge>;
  resourcePools?: ReadonlyArray<ResourcePool>;
  cannibalizationFindings?: ReadonlyArray<CannibalizationFinding>;
}

interface MovePlanProfile {
  program: ProgramInstance;
  dependencyPriority: number;
  valuePriority: number;
  riskPriority: number;
}

const DEFAULT_START_QUARTER = '2026-Q3';
const MAX_MOVES_PER_QUARTER = 3;

export function optimizePortfolioSequence(input: OptimizePortfolioSequenceInput): PortfolioSequence {
  const programs = input.programs.filter(
    (program) => (program.tenantSlug === input.clientKey || program.tenantId === input.clientKey) && program.currentPhase < 6,
  );
  const dependencyEdges = [...(input.dependencyEdges ?? buildDependencyGraph({ clientKey: input.clientKey, programs }))];
  const resourcePools = [...(input.resourcePools ?? buildResourcePools({ clientKey: input.clientKey, programs }))];
  const cannibalizationFindings = [
    ...(input.cannibalizationFindings ?? detectCannibalization({ clientKey: input.clientKey, programs })),
  ];
  const quarters = buildQuarterIds(input.startQuarterId ?? DEFAULT_START_QUARTER, 4);
  const scheduled = new Map<string, string>();
  const cumulativeValueByQuarter: Record<string, number> = {};
  let cumulativeValue = 0;

  const profiles = programs.map((program) => buildMovePlanProfile(program, dependencyEdges, cannibalizationFindings));
  const unmetDependencies = dependencyEdges.filter((edge) => edge.strength === 'hard' && !programs.some((p) => p.id === edge.fromMove));
  const quarterOutputs: PortfolioSequence['quarters'] = [];

  for (const quarterId of quarters) {
    const commitments = new Map<string, number>();
    const moves: PortfolioSequence['quarters'][number]['moves'] = [];
    const blockedMoves: PortfolioSequence['quarters'][number]['blockedMoves'] = [];
    const scheduledBeforeQuarter = new Set(scheduled.keys());
    const candidates = profiles
      .filter((profile) => !scheduled.has(profile.program.id))
      .sort(compareProfiles);

    for (const profile of candidates) {
      if (moves.length >= MAX_MOVES_PER_QUARTER) continue;

      const dependencyBlocks = dependencyBlockers(profile.program, dependencyEdges, scheduledBeforeQuarter);
      if (dependencyBlocks.length > 0) {
        blockedMoves.push({
          moveId: profile.program.id,
          blockedBy: dependencyBlocks,
          recommendedAction: 'Pull the prerequisite Move into an earlier quarter or mark the dependency as accepted risk.',
        });
        continue;
      }

      const resourceBlocks = resourceBlockers(profile.program, resourcePools, commitments);
      if (resourceBlocks.length > 0) {
        blockedMoves.push({
          moveId: profile.program.id,
          blockedBy: resourceBlocks,
          recommendedAction: 'Move this work to the next quarter or add named capacity to the constrained pool.',
        });
        continue;
      }

      recordCommitments(profile.program, resourcePools, commitments);
      scheduled.set(profile.program.id, quarterId);
      cumulativeValue += profile.program.estimatedValueUsd ?? 0;
      moves.push({
        moveId: profile.program.id,
        phase: phaseLabel(profile.program),
        reasoning: buildMoveReasoning(profile, dependencyEdges, cannibalizationFindings),
      });
    }

    for (const profile of profiles) {
      if (scheduled.has(profile.program.id)) continue;
      if (blockedMoves.some((blocked) => blocked.moveId === profile.program.id)) continue;
      const lateBlocks = dependencyBlockers(profile.program, dependencyEdges, scheduled);
      if (lateBlocks.length > 0) {
        blockedMoves.push({
          moveId: profile.program.id,
          blockedBy: lateBlocks,
          recommendedAction: 'Sequence after dependency completion before counting value.',
        });
      }
    }

    cumulativeValueByQuarter[quarterId] = cumulativeValue;
    quarterOutputs.push({
      quarterId,
      moves,
      resourceUtilization: utilizationFor(resourcePools, commitments),
      blockedMoves: dedupeBlocked(blockedMoves),
    });
  }

  return {
    quarters: quarterOutputs,
    unmetDependencies,
    totalValueRealizedByQuarter: cumulativeValueByQuarter,
    alternativeSequences: buildAlternativeSequences(cannibalizationFindings, resourcePools),
  };
}

function buildMovePlanProfile(
  program: ProgramInstance,
  dependencyEdges: ReadonlyArray<DependencyEdge>,
  cannibalizationFindings: ReadonlyArray<CannibalizationFinding>,
): MovePlanProfile {
  const outgoingHardEdges = dependencyEdges.filter((edge) => edge.fromMove === program.id && edge.strength === 'hard').length;
  const incomingHardEdges = dependencyEdges.filter((edge) => edge.toMove === program.id && edge.strength === 'hard').length;
  const cannibalizationRisk = cannibalizationFindings.filter(
    (finding) => finding.moveA === program.id || finding.moveB === program.id,
  ).length;

  return {
    program,
    dependencyPriority: outgoingHardEdges * 3 - incomingHardEdges * 2,
    valuePriority: program.estimatedValueUsd ?? 0,
    riskPriority: program.flags.filter((flag) => flag.status === 'open').length + cannibalizationRisk,
  };
}

function compareProfiles(a: MovePlanProfile, b: MovePlanProfile): number {
  return (
    b.dependencyPriority - a.dependencyPriority ||
    b.riskPriority - a.riskPriority ||
    b.valuePriority - a.valuePriority ||
    a.program.id.localeCompare(b.program.id)
  );
}

function dependencyBlockers(
  program: ProgramInstance,
  edges: ReadonlyArray<DependencyEdge>,
  scheduled: { has(moveId: string): boolean },
): string[] {
  return edges
    .filter((edge) => edge.toMove === program.id && edge.strength === 'hard' && !scheduled.has(edge.fromMove))
    .map((edge) => edge.fromMove)
    .sort((a, b) => a.localeCompare(b));
}

function resourceBlockers(
  program: ProgramInstance,
  pools: ReadonlyArray<ResourcePool>,
  commitments: ReadonlyMap<string, number>,
): string[] {
  return pools
    .filter((pool) => {
      const programCommitment = pool.committedByMoveId[program.id] ?? 0;
      if (programCommitment <= 0) return false;
      const nextCommitment = (commitments.get(pool.id) ?? 0) + programCommitment;
      return nextCommitment > pool.capacityPerQuarter;
    })
    .map((pool) => pool.id)
    .sort((a, b) => a.localeCompare(b));
}

function recordCommitments(
  program: ProgramInstance,
  pools: ReadonlyArray<ResourcePool>,
  commitments: Map<string, number>,
): void {
  for (const pool of pools) {
    const programCommitment = pool.committedByMoveId[program.id] ?? 0;
    if (programCommitment <= 0) continue;
    commitments.set(pool.id, roundTwo((commitments.get(pool.id) ?? 0) + programCommitment));
  }
}

function utilizationFor(
  pools: ReadonlyArray<ResourcePool>,
  commitments: ReadonlyMap<string, number>,
): Record<string, number> {
  const utilization: Record<string, number> = {};
  for (const pool of pools) {
    const committed = commitments.get(pool.id) ?? 0;
    if (committed <= 0) continue;
    utilization[pool.id] = roundTwo(Math.min(1, committed / pool.capacityPerQuarter));
  }
  return Object.fromEntries(Object.entries(utilization).sort(([a], [b]) => a.localeCompare(b)));
}

function buildMoveReasoning(
  profile: MovePlanProfile,
  dependencyEdges: ReadonlyArray<DependencyEdge>,
  cannibalizationFindings: ReadonlyArray<CannibalizationFinding>,
): string {
  const unlocks = dependencyEdges.filter((edge) => edge.fromMove === profile.program.id && edge.strength === 'hard').length;
  const overlaps = cannibalizationFindings.filter(
    (finding) => finding.moveA === profile.program.id || finding.moveB === profile.program.id,
  );
  const reasons: string[] = [];

  if (unlocks > 0) reasons.push(`unblocks ${unlocks} hard downstream dependency${unlocks === 1 ? '' : 'ies'}`);
  if ((profile.program.estimatedValueUsd ?? 0) > 0) reasons.push(`carries ${formatUsd(profile.program.estimatedValueUsd ?? 0)} declared value`);
  if (profile.riskPriority > 0) reasons.push('has open risk or value-overlap pressure that needs executive sequencing');
  if (overlaps.length > 0) reasons.push(`shares value claims on ${formatList([...new Set(overlaps.map((item) => item.overlapKpi))])}`);

  return reasons.length > 0 ? `Scheduled because it ${formatList(reasons)}.` : 'Scheduled as the next unconstrained Move in the portfolio.';
}

function buildAlternativeSequences(
  cannibalizationFindings: ReadonlyArray<CannibalizationFinding>,
  resourcePools: ReadonlyArray<ResourcePool>,
): PortfolioSequence['alternativeSequences'] {
  const alternatives: PortfolioSequence['alternativeSequences'] = [
    {
      scenario: 'Value-first',
      tradeoff: 'Pulls the highest declared-value Moves forward, but may leave governance and sponsor contention unresolved.',
    },
    {
      scenario: 'Risk-first',
      tradeoff: 'Pulls blocker-heavy and governance-heavy Moves forward, but may delay near-term value recognition.',
    },
  ];

  if (cannibalizationFindings.length > 0) {
    alternatives.push({
      scenario: 'Overlap-clean',
      tradeoff: 'Merges or sequences overlapping KPI claims before approval, improving finance credibility while delaying some launches.',
    });
  }

  if (resourcePools.some((pool) => pool.availableForNewWork === 0)) {
    alternatives.push({
      scenario: 'Capacity-relief',
      tradeoff: 'Adds named capacity to constrained pools before accelerating new work, reducing delivery thrash at higher run cost.',
    });
  }

  return alternatives;
}

function buildQuarterIds(startQuarterId: string, count: number): string[] {
  const match = /^(\d{4})-Q([1-4])$/.exec(startQuarterId);
  if (!match) return Array.from({ length: count }, (_, index) => `${startQuarterId}+${index}`);
  let year = Number(match[1]);
  let quarter = Number(match[2]);
  const quarters: string[] = [];

  for (let index = 0; index < count; index += 1) {
    quarters.push(`${year}-Q${quarter}`);
    quarter += 1;
    if (quarter > 4) {
      quarter = 1;
      year += 1;
    }
  }

  return quarters;
}

function phaseLabel(program: ProgramInstance): string {
  return program.phases.find((phase) => phase.phaseId === program.currentPhase)?.phaseLabel ?? `P${program.currentPhase}`;
}

function dedupeBlocked(
  blockedMoves: PortfolioSequence['quarters'][number]['blockedMoves'],
): PortfolioSequence['quarters'][number]['blockedMoves'] {
  const byMove = new Map<string, PortfolioSequence['quarters'][number]['blockedMoves'][number]>();
  for (const blocked of blockedMoves) {
    const existing = byMove.get(blocked.moveId);
    if (!existing) {
      byMove.set(blocked.moveId, blocked);
      continue;
    }
    byMove.set(blocked.moveId, {
      ...existing,
      blockedBy: [...new Set([...existing.blockedBy, ...blocked.blockedBy])].sort((a, b) => a.localeCompare(b)),
    });
  }
  return [...byMove.values()].sort((a, b) => a.moveId.localeCompare(b.moveId));
}

function formatUsd(value: number): string {
  return new Intl.NumberFormat('en-US', {
    currency: 'USD',
    maximumFractionDigits: 0,
    style: 'currency',
  }).format(value);
}

function formatList(items: ReadonlyArray<string>): string {
  if (items.length <= 2) return items.join(' and ');
  return `${items.slice(0, -1).join(', ')}, and ${items[items.length - 1]}`;
}

function roundTwo(value: number): number {
  return Math.round(value * 100) / 100;
}
