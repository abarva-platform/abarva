import { notFound } from 'next/navigation';
import { SourceArtifactDrawer, SourceFoundationShell } from '@/components/source';
import { getSourcingEvent, getSourcingEventArtifact } from '@/lib/source/queries';

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

  return (
    <SourceFoundationShell
      activeRoute="events"
      title={`${event.name} · ${artifact.title}`}
      summary="Canonical artifact route for Source. This is where Artifact Studio should attach, separate from seeded deliverable routes."
    >
      <SourceArtifactDrawer artifact={artifact} />
    </SourceFoundationShell>
  );
}
