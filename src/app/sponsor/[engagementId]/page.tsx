import { notFound, redirect } from 'next/navigation';
import { getEngagementByGraphId } from '@/lib/db/engagement';
import { getPersonById } from '@/lib/db/person';
import { getRecentTurns } from '@/lib/db/turn';
import { getCurrentPerson } from '@/lib/auth/maestro';
import { SponsorConsole } from '@/components/sponsor/SponsorConsole';

export const dynamic = 'force-dynamic';

export default async function SponsorEngagementPage({
  params,
}: {
  params: Promise<{ engagementId: string }>;
}) {
  const person = await getCurrentPerson();
  if (!person) redirect('/sign-in');

  const { engagementId } = await params;
  const engagement = await getEngagementByGraphId(engagementId);
  if (!engagement) notFound();

  // Role gate: sponsors see only their own engagement; maestros can view any.
  const isMaestro = person.role === 'maestro';
  const isSponsor = engagement.sponsor_person_id === person.id;
  if (!isMaestro && !isSponsor) {
    redirect('/sponsor');
  }

  const [maestro, turns] = await Promise.all([
    engagement.maestro_person_id ? getPersonById(engagement.maestro_person_id) : Promise.resolve(null),
    getRecentTurns(engagement.id),
  ]);

  const deliverables = Array.isArray(engagement.deliverables)
    ? (engagement.deliverables as Array<{
        type: string;
        phase: number;
        generated_at: string;
        content: Record<string, unknown>;
      }>)
    : [];

  return (
    <SponsorConsole
      engagement={engagement}
      viewer={person}
      maestro={maestro}
      turns={turns}
      deliverables={deliverables}
    />
  );
}
