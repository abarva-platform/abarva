import { notFound } from 'next/navigation';
import { ConnectorReconnectPage } from '@/components/setup/ConnectorReconnectPage';
import { SERVICENOW_CONNECTOR_DETAIL } from '@/lib/setup/shell-setup-fixture';
import type { Metadata } from 'next';

const CONNECTOR_MAP: Record<string, typeof SERVICENOW_CONNECTOR_DETAIL> = {
  'sn': SERVICENOW_CONNECTOR_DETAIL,
};

interface Props { params: Promise<{ connectorId: string }> }

export const metadata: Metadata = { title: 'Reconnect · Setup' };

export default async function Page({ params }: Props) {
  const { connectorId } = await params;
  const detail = CONNECTOR_MAP[connectorId];
  if (!detail) notFound();
  return <ConnectorReconnectPage detail={detail} />;
}
