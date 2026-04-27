/**
 * ADMIN-DATA2 — Admin agent-readiness fixture.
 *
 * Lifts COVERAGE matrix and AGENT_DETAIL topGap from
 * `agent-readiness-page-view.ts`.
 */

import type {
  AdminAgentCoverageCell,
  AdminAgentId,
  AdminAgentReadinessSnapshot,
  AdminAgentSurface,
  AdminAgentTopGap,
} from '../admin-agent-readiness-adapter-types';

const GENERATED_AT = '2026-04-26T00:00:00.000Z';

const TOP_GAPS: ReadonlyArray<AdminAgentTopGap> = [
  { agentId: 'steward', topGap: 'Live access mutation pipeline not wired' },
  { agentId: 'nexus', topGap: 'Live mission queue not connected' },
  { agentId: 'sentinel', topGap: 'Confidence scoring not wired to live evidence' },
  { agentId: 'atlas', topGap: 'Pressure cards run on seed data only' },
];

interface CoverageSeed {
  level: AdminAgentCoverageCell['level'];
  note: string;
}

const COVERAGE: Record<AdminAgentId, Record<AdminAgentSurface, CoverageSeed>> = {
  steward: {
    admin: { level: 'decision_grade', note: 'Manifest + posture + blockers fully wired' },
    programs: { level: 'partial', note: 'Phase gate posture wired; access mutation deferred' },
    source: { level: 'partial', note: 'Evidence strength visible; approval pipeline deferred' },
    intelligence: { level: 'thin', note: 'Read posture only; no scoring access' },
    tower: { level: 'thin', note: 'Read posture only; no executive write path' },
  },
  nexus: {
    programs: { level: 'decision_grade', note: 'Mission slate + pending decisions wired' },
    source: { level: 'partial', note: 'Reads dataset state; cannot dispatch ingest jobs' },
    intelligence: { level: 'partial', note: 'Reads pattern queue; cannot orchestrate runs' },
    tower: { level: 'thin', note: 'No live workflow context — pressure cards only' },
    admin: { level: 'thin', note: 'No orchestration scope on admin surfaces' },
  },
  sentinel: {
    intelligence: { level: 'decision_grade', note: 'Pattern library + evidence ledger fully wired' },
    source: { level: 'partial', note: 'Evidence ledger wired; live connector signal deferred' },
    programs: { level: 'partial', note: 'Pattern triggers per phase wired; live confidence deferred' },
    tower: { level: 'thin', note: 'Read-only signal surfacing for pressure cards' },
    admin: { level: 'none', note: 'Sentinel has no admin surface scope today' },
  },
  atlas: {
    tower: { level: 'decision_grade', note: 'Portfolio brief + pressure cards fully wired' },
    programs: { level: 'partial', note: 'Reads portfolio posture; no per-program brief writes' },
    intelligence: { level: 'thin', note: 'Read scoring only; no tradeoff synthesis' },
    source: { level: 'thin', note: 'Read evidence summary; no raw-dataset reach' },
    admin: { level: 'none', note: 'Atlas has no admin surface scope today' },
  },
};

const AGENT_ORDER: ReadonlyArray<AdminAgentId> = ['steward', 'nexus', 'sentinel', 'atlas'];
const SURFACE_ORDER: ReadonlyArray<AdminAgentSurface> = ['programs', 'source', 'intelligence', 'tower', 'admin'];

function buildCoverageMatrix(): ReadonlyArray<AdminAgentCoverageCell> {
  const cells: AdminAgentCoverageCell[] = [];
  for (const agent of AGENT_ORDER) {
    for (const surface of SURFACE_ORDER) {
      const seed = COVERAGE[agent][surface];
      cells.push({ agent, surface, level: seed.level, note: seed.note });
    }
  }
  return cells;
}

export function adminAgentReadinessFixture(
  tenantSlug: string,
): AdminAgentReadinessSnapshot {
  return {
    tenantSlug,
    agents: tenantSlug === 'apex-retail' ? TOP_GAPS : [],
    coverageMatrix: tenantSlug === 'apex-retail' ? buildCoverageMatrix() : [],
    generatedAt: GENERATED_AT,
  };
}
