import { readFileSync } from 'fs';
import { resolve } from 'path';

export interface ReadinessSummary {
  generatedAt: string; // hardcoded '2026-04-26'
  overallReadiness: string; // e.g. 'pilot_candidate'
  pilotReadiness: string; // narrative
  productionReadiness: string; // narrative
  overallReadinessPercent: number; // from JSON
  topBlockers: string[]; // top 5 blockers from components
  next5Actions: string[]; // next 5 actionable items
  closestToPilotReady: string[]; // component IDs closest to pilot-ready
  furthestFromProductionReady: string[]; // component IDs furthest from production-ready
  liveStatusCaveat: string; // always note this is static manifest, not live monitoring
  manifestFreshness: string; // e.g. 'Updated 2026-04-26 — static read model'
  productionReadyClaim: false; // ALWAYS false — never claim production_ready
}

interface ManifestBlocker {
  id: string;
  severity: string;
  description: string;
  unblocks?: string;
}

interface ManifestComponent {
  id: string;
  status: string;
  blockers?: ManifestBlocker[];
  nextAction?: string;
  dimensions?: Record<string, string>;
}

interface ManifestShape {
  overallReadinessPercent?: number;
  lastUpdated?: string;
  overallStatus?: string;
  stewardBrief?: {
    pilotReadinessStatus?: string;
    productionReadinessStatus?: string;
  };
  components?: ManifestComponent[];
}

const SEVERITY_RANK: Record<string, number> = {
  critical: 0,
  high: 1,
  medium: 2,
  low: 3,
};

// Statuses ordered from closest to production_ready (most complete) to least
const STATUS_RANK: Record<string, number> = {
  production_ready: 0,
  pilot_ready: 1,
  full_flow_ready: 2,
  code_complete: 3,
  tested: 4,
  scaffolded: 5,
  not_started: 6,
  blocked: 7,
};

function readManifest(): ManifestShape {
  const manifestPath = resolve(process.cwd(), 'docs/build/production-readiness.json');
  const raw = readFileSync(manifestPath, 'utf8');
  return JSON.parse(raw) as ManifestShape;
}

function deriveOverallReadiness(manifest: ManifestShape): string {
  const percent = manifest.overallReadinessPercent ?? 0;
  const overallStatus = manifest.overallStatus ?? 'blocked';
  if (overallStatus === 'production_ready') {
    // NEVER return production_ready — this function must not claim it
    return 'review_required';
  }
  if (percent >= 60) return 'pilot_candidate';
  if (percent >= 40) return 'demo_ready';
  if (percent >= 20) return 'scaffolded_in_progress';
  return 'early_stage';
}

function derivePilotReadinessNarrative(manifest: ManifestShape): string {
  const pilotStatus = manifest.stewardBrief?.pilotReadinessStatus ?? 'blocked';
  const percent = manifest.overallReadinessPercent ?? 0;
  if (pilotStatus === 'blocked') {
    return (
      `Pilot readiness is currently blocked. At ${percent}% overall readiness, ` +
      'live persona walks, route smoke certification, evidence ledger binding, and Model Gateway ' +
      'implementation must be completed before any pilot deployment. Key unblocked components ' +
      '(Programs, Intelligence, AI Control Tower) are code-complete for demo purposes but are not ' +
      'pilot-certified without production signal verification.'
    );
  }
  if (pilotStatus === 'pilot_ready') {
    return (
      `Pilot readiness gates have been met. ${percent}% overall readiness recorded. ` +
      'Production-grade persistence, live monitoring, and full security review remain required ' +
      'before broader production deployment.'
    );
  }
  return (
    `Pilot readiness status is ${pilotStatus}. At ${percent}% overall, foundational surfaces ` +
    'are deterministic and demo-validated, but live workflow, evidence, and governance gates ' +
    'must clear before pilot launch.'
  );
}

function deriveProductionReadinessNarrative(manifest: ManifestShape): string {
  const prodStatus = manifest.stewardBrief?.productionReadinessStatus ?? 'blocked';
  const percent = manifest.overallReadinessPercent ?? 0;
  if (prodStatus === 'blocked' || prodStatus === 'production_ready') {
    // Even if somehow the JSON says production_ready, we emit a conservative narrative
    return (
      `Production readiness is blocked at ${percent}%. Critical gaps include: no live Model Gateway ` +
      'implementation, no production-grade audit ledger, no evidence ledger ingestion, no ingestion/' +
      'parsing pipeline, no verified production deployment, and no completed security/governance review. ' +
      'This system is a demo/pilot candidate; it is not production-ready for enterprise deployment.'
    );
  }
  return (
    `Production readiness status is ${prodStatus} at ${percent}%. Multiple critical components ` +
    'require live runtime, persistence, and governance review completion before production deployment.'
  );
}

function extractTopBlockers(components: ManifestComponent[]): string[] {
  const allBlockers: Array<{ severity: string; description: string; componentId: string }> = [];
  for (const component of components) {
    for (const blocker of component.blockers ?? []) {
      allBlockers.push({
        severity: blocker.severity,
        description: blocker.description,
        componentId: component.id,
      });
    }
  }
  // Sort by severity rank (critical first), then by component id for stability
  allBlockers.sort((a, b) => {
    const rankA = SEVERITY_RANK[a.severity] ?? 99;
    const rankB = SEVERITY_RANK[b.severity] ?? 99;
    if (rankA !== rankB) return rankA - rankB;
    return a.componentId.localeCompare(b.componentId);
  });
  return allBlockers.slice(0, 5).map((b) => `[${b.componentId}] (${b.severity}) ${b.description}`);
}

function extractNext5Actions(components: ManifestComponent[]): string[] {
  // Prioritise components that are closest to a milestone (code_complete, tested) but not yet pilot_ready
  const prioritised = components
    .filter((c) => {
      const rank = STATUS_RANK[c.status] ?? 99;
      // Include code_complete and tested (rank 3-4), scaffolded that have blockers (5)
      return rank <= 5;
    })
    .sort((a, b) => {
      const rankA = STATUS_RANK[a.status] ?? 99;
      const rankB = STATUS_RANK[b.status] ?? 99;
      if (rankA !== rankB) return rankA - rankB;
      return a.id.localeCompare(b.id);
    });

  const actions: string[] = [];
  for (const component of prioritised) {
    if (actions.length >= 5) break;
    if (typeof component.nextAction === 'string' && component.nextAction.trim().length > 0) {
      // Take only the first sentence of nextAction to keep it actionable
      const firstSentence = component.nextAction.split('. ')[0].trim();
      const truncated =
        firstSentence.length > 160 ? firstSentence.slice(0, 157) + '...' : firstSentence;
      actions.push(`[${component.id}] ${truncated}`);
    }
  }
  return actions.slice(0, 5);
}

function extractClosestToPilotReady(components: ManifestComponent[]): string[] {
  // Components with status code_complete or tested are closest to pilot-ready
  return components
    .filter((c) => {
      const rank = STATUS_RANK[c.status] ?? 99;
      return rank <= 4; // code_complete (3) or tested (4)
    })
    .sort((a, b) => {
      const rankA = STATUS_RANK[a.status] ?? 99;
      const rankB = STATUS_RANK[b.status] ?? 99;
      if (rankA !== rankB) return rankA - rankB;
      return a.id.localeCompare(b.id);
    })
    .map((c) => c.id);
}

function extractFurthestFromProductionReady(components: ManifestComponent[]): string[] {
  // Components that are not_started or blocked are furthest from production-ready
  return components
    .filter((c) => {
      const rank = STATUS_RANK[c.status] ?? 99;
      return rank >= 6; // not_started (6) or blocked (7)
    })
    .sort((a, b) => {
      const rankA = STATUS_RANK[a.status] ?? 99;
      const rankB = STATUS_RANK[b.status] ?? 99;
      if (rankA !== rankB) return rankB - rankA; // most blocked first
      return a.id.localeCompare(b.id);
    })
    .map((c) => c.id);
}

export function buildProductionReadinessSummary(): ReadinessSummary {
  const manifest = readManifest();
  const components: ManifestComponent[] = Array.isArray(manifest.components)
    ? manifest.components
    : [];

  const overallReadinessPercent =
    typeof manifest.overallReadinessPercent === 'number' ? manifest.overallReadinessPercent : 0;

  const lastUpdated =
    typeof manifest.lastUpdated === 'string' && manifest.lastUpdated.length > 0
      ? manifest.lastUpdated
      : '2026-04-26';

  const overallReadiness = deriveOverallReadiness(manifest);
  const pilotReadiness = derivePilotReadinessNarrative(manifest);
  const productionReadiness = deriveProductionReadinessNarrative(manifest);
  const topBlockers = extractTopBlockers(components);
  const next5Actions = extractNext5Actions(components);
  const closestToPilotReady = extractClosestToPilotReady(components);
  const furthestFromProductionReady = extractFurthestFromProductionReady(components);

  const liveStatusCaveat =
    'This summary is generated from a static manifest (production-readiness.json). ' +
    'It does not reflect live monitoring, real-time CI status, or deployed production behavior.';

  const manifestFreshness = `Updated ${lastUpdated} — static read model`;

  return {
    generatedAt: '2026-04-26',
    overallReadiness,
    pilotReadiness,
    productionReadiness,
    overallReadinessPercent,
    topBlockers,
    next5Actions,
    closestToPilotReady,
    furthestFromProductionReady,
    liveStatusCaveat,
    manifestFreshness,
    productionReadyClaim: false,
  };
}
