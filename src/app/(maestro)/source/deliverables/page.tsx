import { AppShell } from '@/components/shell/AppShell';
import { SourceSubNav } from '@/components/source/SourceSubNav';
import { SourceWorkingPane } from '@/components/source/SourceWorkingPane';
import { getActiveClientRow } from '@/lib/active-client';
import { canonicalClientDisplayName } from '@/lib/client-config';
import { GenerateDeliverableButton } from '@/components/deliverables/GenerateDeliverableButton';

export const dynamic = 'force-dynamic';

export default async function SourceDeliverablesPage() {
  const activeClient = await getActiveClientRow().catch(() => null);
  const clientName =
    canonicalClientDisplayName({ key: activeClient?.key, name: activeClient?.name }) ?? 'AbarVa Client';

  return (
    <AppShell
      surface="source"
      topBarProps={{ tenantName: clientName, showLocked: true, context: 'Source · Board-grade deliverables' }}
      subNav={<SourceSubNav />}
    >
      <SourceWorkingPane>
        <div style={{ maxWidth: 760, display: 'flex', flexDirection: 'column', gap: 16 }}>
          <header>
            <h1 style={{ fontFamily: 'Georgia, serif', fontWeight: 400, fontSize: 26, color: '#0C1A3A', margin: 0 }}>
              Board-grade deliverable
            </h1>
            <p style={{ color: '#706D66', fontSize: 14, marginTop: 6 }}>
              Generate a board-grade RFP package for <strong>{clientName}</strong> through the governed
              multi-pass authoring flow. Every client-specific fact is grounded in governed evidence and
              cited; missing facts are flagged, never invented. The quality gate holds back any document
              that does not meet the bar.
            </p>
          </header>
          <GenerateDeliverableButton
            module="source"
            useCaseArchetype="AMS_IT_OUTSOURCING"
            deliverableType="rfp_package"
            sourceArtifactRef={`source-ams-${activeClient?.key ?? 'tenant'}`}
            decisionContext="Approve issuance of the AMS RFP and the scope, evaluation, and commercial model it commits the client to."
            clientDisplayName={clientName}
            initiativeDisplayName="AMS / IT Outsourcing"
          />
        </div>
      </SourceWorkingPane>
    </AppShell>
  );
}
