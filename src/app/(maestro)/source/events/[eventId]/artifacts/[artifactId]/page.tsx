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
      contextUsed={[
        `Event: ${event.name}`,
        `Artifact: ${artifact.kind.replace('_', ' ')}`,
        `Owner: ${event.owner || 'sourcing owner not yet set'}`,
        `Status: ${artifact.status}`,
      ]}
      customAskPrompt="Ask Nexus about this artifact status, version, or missing inputs..."
      actionLinks={[
        { label: 'Show evidence', href: '#artifact-evidence', description: 'Review seeded evidence references for this artifact.' },
        { label: 'Show version history', href: '#artifact-history', description: 'Open artifact version provenance for context.' },
        { label: 'Explain missing inputs', href: '#artifact-missing-inputs', description: 'See which evidence items are still needed.' },
      ]}
    >
      <SourceArtifactDrawer artifact={artifact} />
    </SourceFoundationShell>
  );
}
