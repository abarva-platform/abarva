import { redirect } from 'next/navigation';
import { DATA_CLIENTS, getDataClient } from '@/lib/data/clients';
import { DataConsole } from '@/components/data/DataConsole';

export default async function NewDataPage({
  searchParams,
}: {
  searchParams: Promise<{ clientId?: string }>;
}) {
  const params = await searchParams;
  const clientId = (params.clientId ?? '').trim();
  if (!clientId) {
    // Default to first demo client
    redirect(`/platform/data/new?clientId=${DATA_CLIENTS[0].id}`);
  }
  const client = getDataClient(clientId);
  if (!client) {
    return (
      <div style={{ padding: '28px 28px 40px', color: 'rgba(245,245,240,0.72)' }}>
        Unknown client: <code>{clientId}</code>. Open /platform/data and pick one.
      </div>
    );
  }
  return (
    <DataConsole
      clientId={client.id}
      clientName={client.name}
      industry={client.industry}
      industryLabel={client.industryLabel}
    />
  );
}
