import { notFound } from 'next/navigation';
import { SourceArtifactDrawer, SourceCanonShell } from '@/components/source';
import { getSourcingEvent, getSourcingEventArtifact } from '@/lib/source/queries';
import { buildSourceStageGateReadiness } from '@/lib/source/source-stage-gates';

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
  const stageReadiness = buildSourceStageGateReadiness({ event });
  const currentGate = stageReadiness.gates.find((gate) => gate.fromStageKey === event.currentStageKey)
    ?? stageReadiness.gates[0];

  return (
    <SourceCanonShell
      activeRoute="events"
      title={`${event.name} · artifact review`}
      summary={`Nexus-led artifact review shell for ${artifact.title}. This route makes metadata, evidence posture, missing inputs, and related stage-gate context explicit without adding upload, parsing, approval, or versioning runtime.`}
    >
      <SourceArtifactDrawer
        artifact={artifact}
        eventName={event.name}
        currentStageLabel={event.currentStageLabel}
        relatedGate={{
          label: currentGate.transitionLabel,
          state: currentGate.state,
          blocker: currentGate.blocker,
        }}
      />
    </SourceCanonShell>
  );
}
