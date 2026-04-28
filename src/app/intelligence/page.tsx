// INT-IDX — Shell-native Intelligence pattern library index.
// I1: Server Component. Reads ?filter= from searchParams and passes to
// IntelligenceIndexPage (now a server component). No client state.

import { IntelligenceIndexPage } from '@/components/intelligence/IntelligenceIndexPage';

export const metadata = {
  title: 'Intelligence · Pattern Library | Apex Retail Group',
};

export default async function IntelligencePage({
  searchParams,
}: {
  searchParams: Promise<{ filter?: string }>;
}) {
  const { filter } = await searchParams;
  return <IntelligenceIndexPage filter={filter} />;
}
