// /admin/reasoning/bulk-waiver — Bulk gate waiver tool.
//
// Server component: loads all source-event and program instances and passes
// the combined list to BulkWaiverClient for the interactive flow.

import { COLORS, RADIUS, SPACING, TYPOGRAPHY } from '@/lib/design/design-tokens';
import { AdminCanonShellV2 } from '@/components/admin/AdminCanonShellV2';
import { EditorialCanvas } from '@/components/admin/EditorialCanvas';
import { AgentRail } from '@/components/admin/AgentRail';
import { SOURCE_EVENT_INSTANCES } from '@/lib/source/source-event-instances';
import { APEX_RETAIL_PROGRAM_INSTANCES } from '@/lib/programs/program-instances';
import { BulkWaiverClient } from './BulkWaiverClient';
import type { InstanceOption } from './BulkWaiverClient';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Bulk gate waiver · AbarVa Admin',
};

export default function BulkWaiverPage() {
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
        title="Bulk gate waiver"
        subtitle="Apply gate waivers to multiple criteria at once. Useful for demo preparation — instead of waiving gates one by one via the API."
      >
        {/* Instance count strip */}
        <div
          style={{
            background: COLORS.white,
            border: `1px solid ${COLORS.ink}14`,
            borderRadius: RADIUS.lg,
            padding: SPACING.md,
            marginBottom: SPACING.sm,
            fontFamily: TYPOGRAPHY.sans,
            fontSize: 12,
            color: `${COLORS.ink}70`,
          }}
        >
          {sourceOptions.length} source event instance{sourceOptions.length !== 1 ? 's' : ''} ·{' '}
          {programOptions.length} program instance{programOptions.length !== 1 ? 's' : ''}
        </div>

        <BulkWaiverClient instances={allInstances} />
      </EditorialCanvas>
    </AdminCanonShellV2>
  );
}
