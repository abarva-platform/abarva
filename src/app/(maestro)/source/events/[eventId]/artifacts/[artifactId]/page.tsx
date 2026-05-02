import { notFound } from 'next/navigation';
import { AppShell } from '@/components/shell/AppShell';
import { StageTrackerStrip } from '@/components/shell/StageTrackerStrip';
import { SentinelAgentColumn } from '@/components/source/SentinelAgentColumn';
import { SourceWorkingPane } from '@/components/source/SourceWorkingPane';
import { SourceArtifactDrawer } from '@/components/source/SourceArtifactDrawer';
import { getSourcingEvent, getSourcingEventArtifact } from '@/lib/source/queries';
import { AMS_SOURCE_EVENT } from '@/lib/source/shell-source-fixture';

export const dynamic = 'force-dynamic';

export default async function SourceArtifactPage({
  params,
}: {
  params: Promise<{ eventId: string; artifactId: string }>;
}) {
  const { eventId, artifactId } = await params;
  const [event, artifact] = await Promise.all([
    getSourcingEvent(eventId),
    getSourcingEventArtifact(eventId, artifactId),
  ]);
  if (!event || !artifact) notFound();

  const registryBackedArtifact = !artifact.id.startsWith('artifact-source-');
  const provenanceSource = registryBackedArtifact ? 'source_artifacts registry' : 'deterministic_seed';
  const eventStageLabels = event.stages.map((stage) => stage.label);
  const journeyStages = eventStageLabels.includes(event.currentStageLabel)
    ? eventStageLabels
    : AMS_SOURCE_EVENT.stages;
  const activeJourneyStage =
    event.currentStageLabel === 'Orals/BAFO' && journeyStages.includes('BAFO')
      ? 'BAFO'
      : event.currentStageLabel;

  return (
    <AppShell
      surface="source"
      topBarProps={{
        tenantName: event.accountName,
        showLocked: true,
        context: `Source · ${event.name} · ${artifact.title}`,
      }}
      middleStrip={
        <StageTrackerStrip
          stages={journeyStages}
          activeStage={activeJourneyStage}
          variant="journey"
          personaLabel="Sourcing lead"
        />
      }
    >
      <SentinelAgentColumn
        quote={`Artifact tier: ${artifact.tier ?? 'stub'}. Status: ${artifact.status.replaceAll('_', ' ')}. Provenance: ${provenanceSource}. Evidence chain: ${artifact.sections.length} entries.`}
        agentContext={`Sentinel · ${artifact.title} · ${event.name}`}
        actions={[
          { letter: 'A', text: 'Show evidence', detail: 'Review evidence references for this artifact' },
          { letter: 'B', text: 'Show version history', detail: 'Open artifact version provenance for context' },
          { letter: 'C', text: 'Explain missing inputs', detail: 'See which evidence items are still needed' },
        ]}
      />
      <SourceWorkingPane>
        <SourceArtifactDrawer
          artifact={artifact}
          provenance={{
            createdFrom: provenanceSource,
            storeKey: `source-artifact:${eventId}:${artifactId}`,
            freshness: artifact.updatedAt,
            evidenceLedgerEntryId: artifact.id,
          }}
        />
      </SourceWorkingPane>
    </AppShell>
  );
}
