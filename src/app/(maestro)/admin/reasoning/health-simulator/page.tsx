// /admin/reasoning/health-simulator — What-if health score projector.
//
// Server component. Builds all instance health rows (sources + programs),
// computes current composite scores, and passes them to the client component
// for interactive what-if simulation. No API calls needed — pure client-side
// recalculation once the rows are serialized.

import { AdminCanonShellV2 } from '@/components/admin/AdminCanonShellV2';
import { EditorialCanvas } from '@/components/admin/EditorialCanvas';
import { AgentRail } from '@/components/admin/AgentRail';
import { buildSourceSynthesisContext } from '@/lib/reasoning/synthesis-context-builder';
import { buildProgramSynthesisContext } from '@/lib/reasoning/program-synthesis-context-builder';
import { SOURCE_EVENT_INSTANCES } from '@/lib/source/source-event-instances';
import { APEX_RETAIL_PROGRAM_INSTANCES } from '@/lib/programs/program-instances';
import { SOURCE_LIFECYCLE_PATTERNS } from '@/lib/intelligence/source-lifecycle-patterns';
import { PROGRAM_LIFECYCLE_PATTERNS } from '@/lib/intelligence/program-lifecycle-patterns';
import { HealthSimulatorClient } from './HealthSimulatorClient';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Health simulator · AbarVa Admin',
};

// ─── Serialized row type (safe to pass to client) ────────────────────────────

export interface SerializedRow {
  id: string;
  label: string;
  type: 'SOURCE' | 'PROGRAM';
  currentStage: string;
  gatesMet: number;
  gatesTotal: number;
  activeContradictions: number;
}

// ─── Composite score formula (duplicated on client for zero-round-trip sim) ──

function compositeScore(gatesMet: number, gatesTotal: number, contradictions: number): number {
  return Math.round(
    (gatesMet / Math.max(gatesTotal, 1)) * 60 +
      (1 - Math.min(contradictions / 5, 1)) * 30 +
      10,
  );
}

// ─── Build rows ───────────────────────────────────────────────────────────────

function buildSerializedRows(): SerializedRow[] {
  const rows: SerializedRow[] = [];

  for (const inst of SOURCE_EVENT_INSTANCES) {
    const pattern = SOURCE_LIFECYCLE_PATTERNS.find((p) => p.patternId === inst.patternId);
    if (pattern === undefined) continue;
    const ctx = buildSourceSynthesisContext(inst, pattern);
    rows.push({
      id: inst.id,
      label: inst.name,
      type: 'SOURCE',
      currentStage: ctx.currentStage,
      gatesMet: ctx.gatesSummary.met,
      gatesTotal: ctx.gatesSummary.total,
      activeContradictions: ctx.activeContradictions.length,
    });
  }

  for (const inst of APEX_RETAIL_PROGRAM_INSTANCES) {
    const pattern = PROGRAM_LIFECYCLE_PATTERNS.find((p) => p.patternId === inst.patternId);
    const ctx = buildProgramSynthesisContext(inst, pattern);
    rows.push({
      id: inst.id,
      label: inst.name,
      type: 'PROGRAM',
      currentStage: ctx.currentStage,
      gatesMet: ctx.gatesSummary.met,
      gatesTotal: ctx.gatesSummary.total,
      activeContradictions: ctx.activeContradictions.length,
    });
  }

  // Sort by composite score ascending (worst first)
  return rows.sort(
    (a, b) =>
      compositeScore(a.gatesMet, a.gatesTotal, a.activeContradictions) -
      compositeScore(b.gatesMet, b.gatesTotal, b.activeContradictions),
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function HealthSimulatorPage() {
  const rows = buildSerializedRows();

  return (
    <AdminCanonShellV2
      agentRail={
        <AgentRail
          primaryAgentLabel="Steward"
          primaryActionLabel="Open Health Board"
          primaryActionHref="/admin/reasoning/health"
        />
      }
    >
      <EditorialCanvas
        eyebrow="Reasoning · Admin"
        title="Health simulator"
        subtitle="Adjust gate and contradiction counts to project how composite scores would change."
      >
        <HealthSimulatorClient rows={rows} />
      </EditorialCanvas>
    </AdminCanonShellV2>
  );
}
