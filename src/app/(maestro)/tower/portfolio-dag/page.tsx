import { connection } from 'next/server';
import { getActiveClientRow } from '@/lib/active-client';
import { getMoveDAG, type MoveDAG } from '@/lib/dependencies';
import { PortfolioDagClient } from './PortfolioDagClient';

export const metadata = { title: 'Portfolio DAG · Control Tower' };
export const dynamic = 'force-dynamic';
export const revalidate = 0;

function emptyDag(clientId = 'unknown'): MoveDAG {
  return {
    clientId,
    nodes: [],
    edges: [],
    filters: {
      statuses: [],
      sponsors: [],
      minDollarImpactUsd: null,
    },
  };
}

export default async function PortfolioDagPage() {
  await connection();
  const client = await getActiveClientRow().catch(() => null);
  const dag = client ? await getMoveDAG(client.id).catch(() => emptyDag(client.id)) : emptyDag();

  return (
    <PortfolioDagClient
      clientName={client?.name ?? 'Active client'}
      initialDag={dag}
    />
  );
}
