import { AppShell } from '@/components/shell/AppShell';
import { SourceSubNav } from '@/components/source/SourceSubNav';
import { SourceWorkingPane } from '@/components/source/SourceWorkingPane';
import { getActiveClientRow } from '@/lib/active-client';
import { canonicalClientDisplayName } from '@/lib/client-config';
import { GenerateDeliverableButton } from '@/components/deliverables/GenerateDeliverableButton';
import { SOURCE_STAGE_DELIVERABLES } from '@/lib/source/deliverables/stage-deliverables';

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
              Generate a board-grade document for each stage of the sourcing lifecycle for{' '}
              <strong>{clientName}</strong>. Every stage&apos;s document is produced through the governed
              multi-pass authoring flow with its own stage-specific structure — the strategy memo, RFP
              package, evaluation workbook, and executive recommendation each follow a tailored section
              flow. Every client-specific fact is grounded in governed evidence and cited; missing facts
              are flagged, never invented. The quality gate holds back any document that does not meet the
              bar.
            </p>
          </header>
          {SOURCE_STAGE_DELIVERABLES.map((d) => (
            <div
              key={d.stageKey}
              style={{ display: 'flex', flexDirection: 'column', gap: 8 }}
            >
              <div>
                <h2
                  style={{
                    fontFamily: 'Georgia, serif',
                    fontWeight: 400,
                    fontSize: 18,
                    color: '#0C1A3A',
                    margin: 0,
                  }}
                >
                  {d.phase} · {d.label}
                </h2>
                <p style={{ color: '#706D66', fontSize: 13, marginTop: 4 }}>{d.decisionContext}</p>
              </div>
              <GenerateDeliverableButton
                module="source"
                useCaseArchetype="AMS_IT_OUTSOURCING"
                deliverableType={d.deliverableType}
                sourceArtifactRef={`source-${d.deliverableType}-${activeClient?.key ?? 'tenant'}`}
                decisionContext={d.decisionContext}
                clientDisplayName={clientName}
                initiativeDisplayName="AMS / IT Outsourcing"
                label={`Generate: ${d.label}`}
              />
            </div>
          ))}
        </div>
      </SourceWorkingPane>
    </AppShell>
  );
}
