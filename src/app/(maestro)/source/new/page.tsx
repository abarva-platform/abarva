import type { Metadata } from 'next';
import { getActiveClientRow } from '@/lib/active-client';
import { canonicalClientDisplayName, getClientOption } from '@/lib/client-config';
import { SourceOriginatePage } from '@/components/source/SourceOriginatePage';

export const metadata: Metadata = { title: 'New IT Sourcing Intake · AbarVa' };

export default async function Page() {
  const activeClient = await getActiveClientRow().catch(() => null);
  const clientOption = getClientOption(activeClient?.key);
  const activeClientDisplayName =
    canonicalClientDisplayName({ key: activeClient?.key, name: activeClient?.name }) ??
    clientOption.name;

  return (
    <SourceOriginatePage
      clientName={activeClientDisplayName}
      clientShortName={clientOption.shortName}
      clientKey={clientOption.id}
    />
  );
}
