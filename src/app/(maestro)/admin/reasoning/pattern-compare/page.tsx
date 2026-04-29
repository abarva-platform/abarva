// /admin/reasoning/pattern-compare — Side-by-side lifecycle pattern comparison.
//
// Server component: loads all lifecycle patterns, serializes them to a
// JSON-safe format, and passes them to the PatternCompareClient for
// interactive comparison.

import { AdminCanonShellV2 } from '@/components/admin/AdminCanonShellV2';
import { EditorialCanvas } from '@/components/admin/EditorialCanvas';
import { AgentRail } from '@/components/admin/AgentRail';
import { getAllLifecyclePatterns } from '@/lib/reasoning/lifecycle-pattern-lookup';
import { PatternCompareClient } from './PatternCompareClient';
import type { SerializedPattern } from './PatternCompareClient';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Pattern compare · AbarVa Admin',
};

function serializePatterns(): SerializedPattern[] {
  const patterns = getAllLifecyclePatterns();
  return patterns.map((p) => ({
    id: p.patternId,
    title: p.title,
    stages: (p.stages ?? []).map((s) => ({ id: s.id, label: s.label, order: s.order })),
    gateCriteria: (p.gateCriteria ?? []).map((g) => ({
      id: g.id,
      stageId: g.stageId,
      gateType: g.gateType,
      description: g.description,
    })),
    contradictionTemplates: (p.contradictionTemplates ?? []).map((c) => ({
      id: c.id,
      label: c.label,
      severity: c.severity,
    })),
    failureModes: (p.failureModes ?? []).map((f) => ({ id: f.id, label: f.label })),
  }));
}

export default function PatternComparePage() {
  const patterns = serializePatterns();

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
        title="Pattern compare"
        subtitle="Select two lifecycle patterns to compare stages, gate criteria, contradiction templates, and failure modes side-by-side."
      >
        <PatternCompareClient patterns={patterns} />
      </EditorialCanvas>
    </AdminCanonShellV2>
  );
}
