import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { ConnectorReconnectPage } from '@/components/setup/ConnectorReconnectPage';
import { getReconnectableSetupConnectorDetail } from '@/lib/setup/shell-setup-fixture';

interface Props {
  params: Promise<{ connectorId: string }>;
}

export const metadata: Metadata = { title: 'Reconnect · Setup' };

export default async function Page({ params }: Props) {
  const { connectorId } = await params;
  const detail = getReconnectableSetupConnectorDetail(connectorId);
  if (!detail) notFound();
  return <ConnectorReconnectPage detail={detail} />;
}
