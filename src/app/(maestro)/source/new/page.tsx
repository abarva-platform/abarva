import type { Metadata } from 'next';
import { getActiveClientRow } from '@/lib/active-client';
import { getClientOption } from '@/lib/client-config';
import { SourceOriginatePage } from '@/components/source/SourceOriginatePage';

export const metadata: Metadata = { title: 'New IT Sourcing Intake · AbarVa' };

export default async function Page() {
  const activeClient = await getActiveClientRow().catch(() => null);
  const clientOption = getClientOption(activeClient?.key);

  return (
    <SourceOriginatePage
      clientName={activeClient?.name ?? clientOption.name}
      clientShortName={clientOption.shortName}
      clientKey={clientOption.id}
    />
  );
}
