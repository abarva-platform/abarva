import { redirect } from 'next/navigation';

export default async function ProgramsNewPage({
  searchParams,
}: {
  searchParams: Promise<{ source?: string | string[] }>;
}) {
  const params = await searchParams;
  const rawSource = Array.isArray(params.source) ? params.source[0] : params.source;
  const next = rawSource ? `/engagements/new?source=${encodeURIComponent(rawSource)}` : '/engagements/new';
  redirect(next);
}
