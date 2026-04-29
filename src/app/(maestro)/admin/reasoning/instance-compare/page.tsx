// /admin/reasoning/instance-compare — Side-by-side instance health comparison.
//
// Server component. Calls buildHealthBoardRows() for all instances, computes a
// composite health score per row, serializes to a JSON-safe array, and passes
// it to InstanceCompareClient for the interactive two-selector compare UI.
//
// Composite score formula (0–100):
//   gates_component    = (gatesMet / max(gatesTotal, 1)) * 60
//   contradictions_cmp = (1 - min(activeContradictions / 5, 1)) * 30
//   baseline           = 10
//   total              = round(gates_component + contradictions_cmp + baseline)

import { AdminCanonShellV2 } from '@/components/admin/AdminCanonShellV2';
import { EditorialCanvas } from '@/components/admin/EditorialCanvas';
import { AgentRail } from '@/components/admin/AgentRail';
import { buildHealthBoardRows, type InstanceHealthRow } from '@/lib/reasoning/health-board';
import { InstanceCompareClient, type SerializedInstanceRow } from './InstanceCompareClient';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Instance compare | AbarVa Admin',
};

// ─── Score computation ────────────────────────────────────────────────────────

function computeScore(row: InstanceHealthRow): number {
  return Math.round(
    (row.gatesMet / Math.max(row.gatesTotal, 1)) * 60 +
    (1 - Math.min(row.activeContradictions / 5, 1)) * 30 +
    10,
  );
}

// ─── Serialization ────────────────────────────────────────────────────────────

function serialize(row: InstanceHealthRow): SerializedInstanceRow {
  return {
    id: row.id,
    label: row.label,
    type: row.type,
    currentStage: row.stageLabel ?? row.phaseLabel ?? '—',
    gatesMet: row.gatesMet,
    gatesTotal: row.gatesTotal,
    activeContradictions: row.activeContradictions,
    healthLabel: row.healthLabel,
    score: computeScore(row),
  };
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function InstanceComparePage() {
  const rows = buildHealthBoardRows();
  const instances = rows.map(serialize);

  return (
    <AdminCanonShellV2
      agentRail={
        <AgentRail
          primaryAgentLabel="Steward"
          primaryActionLabel="Back to Reasoning"
          primaryActionHref="/admin/reasoning"
        />
      }
    >
      <EditorialCanvas
        eyebrow="Reasoning · Admin"
        title="Instance compare"
        subtitle="Select two instances to compare health metrics side by side."
      >
        <InstanceCompareClient instances={instances} />
      </EditorialCanvas>
    </AdminCanonShellV2>
  );
}
