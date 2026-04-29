// /admin/reasoning/pattern-docs — Full documentation browser for lifecycle patterns.
//
// Server component. Loads all lifecycle patterns, serializes the doc-relevant
// fields (id, title, domain, tier, thesis, applicability, body, version,
// createdAt), and passes them to PatternDocsClient for interactive browsing.

import { AdminCanonShellV2 } from '@/components/admin/AdminCanonShellV2';
import { EditorialCanvas } from '@/components/admin/EditorialCanvas';
import { AgentRail } from '@/components/admin/AgentRail';
import { getAllLifecyclePatterns } from '@/lib/reasoning/lifecycle-pattern-lookup';
import { PatternDocsClient } from './PatternDocsClient';
import type { SerializedPatternDoc } from './PatternDocsClient';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Pattern docs · AbarVa Admin',
};

function serializePatternDocs(): SerializedPatternDoc[] {
  const patterns = getAllLifecyclePatterns();
  return patterns.map((p) => ({
    id: p.patternId,
    title: p.title,
    domain: p.domain,
    tier: p.tier as string,
    thesis: p.thesis,
    applicability: p.applicability,
    body: p.body,
    version: p.version,
    createdAt: p.createdAt,
  }));
}

export default function PatternDocsPage() {
  const patterns = serializePatternDocs();

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
        title="Pattern docs"
        subtitle="Full documentation text for each lifecycle pattern."
      >
        <PatternDocsClient patterns={patterns} />
      </EditorialCanvas>
    </AdminCanonShellV2>
  );
}
