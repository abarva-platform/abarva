import { redirect } from 'next/navigation';
import { getActiveClientKey } from '@/lib/active-client';
import { isClientKey } from '@/lib/client-config';

export const dynamic = 'force-dynamic';

export default async function ProgramsPage({
  searchParams,
}: {
  searchParams: Promise<{ client?: string }>;
}) {
  const params = await searchParams;
  const requestedClient = isClientKey(params.client) ? params.client : null;
  const clientKey = await getActiveClientKey(requestedClient);
  redirect(`/preview/programs?client=${clientKey}`);
}
