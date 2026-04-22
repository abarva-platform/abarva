import { redirect } from 'next/navigation';

export default async function ProgramsNewPage({
  searchParams,
}: {
  searchParams: Promise<{ source?: string | string[]; client?: string | string[] }>;
}) {
  const params = await searchParams;
  const rawSource = Array.isArray(params.source) ? params.source[0] : params.source;
  const rawClient = Array.isArray(params.client) ? params.client[0] : params.client;
  const nextParams = new URLSearchParams();
  if (rawSource) nextParams.set('source', rawSource);
  if (rawClient) nextParams.set('client', rawClient);
  redirect(nextParams.size > 0 ? `/engagements/new?${nextParams.toString()}` : '/engagements/new');
}
