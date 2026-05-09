// /source/learn/[slug] — legacy URL. The Source primer is now part of
// the unified guide at /home/learn/source/*. Anyone hitting an old
// bookmark is redirected to the matching slug under /home/learn.
//
// We do not switch on slug here — the unified route handles fallback
// rendering for any unknown slug, so a single redirect is enough.

import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

interface Props {
  params: Promise<{ slug: string }>;
}

export default async function SourceLearnSlugRedirect({ params }: Props) {
  const { slug } = await params;
  redirect(`/home/learn/source/${slug}`);
}
