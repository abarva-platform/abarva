// /admin/reasoning/evidence-ingest — Demo affordance for injecting evidence
// fields into an instance to watch gates flip.
//
// Server component: loads all source and program instances, serialises them
// to a plain InstanceOption list, and passes to EvidenceIngestClient.

import { AdminCanonShellV2 } from '@/components/admin/AdminCanonShellV2';
import { EditorialCanvas } from '@/components/admin/EditorialCanvas';
import { AgentRail } from '@/components/admin/AgentRail';
import { SOURCE_EVENT_INSTANCES } from '@/lib/source/source-event-instances';
import { APEX_RETAIL_PROGRAM_INSTANCES } from '@/lib/programs/program-instances';
import { EvidenceIngestClient } from './EvidenceIngestClient';
import type { InstanceOption } from './EvidenceIngestClient';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Evidence ingest · AbarVa Admin',
};

export default function EvidenceIngestPage() {
  const sourceOptions: InstanceOption[] = SOURCE_EVENT_INSTANCES.map((inst) => ({
    id: inst.id,
    label: inst.name,
    type: 'source' as const,
  }));

  const programOptions: InstanceOption[] = APEX_RETAIL_PROGRAM_INSTANCES.map((inst) => ({
    id: inst.id,
    label: inst.name,
    type: 'program' as const,
  }));

  const allInstances: InstanceOption[] = [...sourceOptions, ...programOptions];

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
        title="Evidence ingest"
        subtitle="Inject new evidence fields into an instance for demo purposes. Resets on server restart."
      >
        <EvidenceIngestClient instances={allInstances} />
      </EditorialCanvas>
    </AdminCanonShellV2>
  );
}
