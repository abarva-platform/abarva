import { notFound } from 'next/navigation';
import { ConnectorDetailPage } from '@/components/setup/ConnectorDetailPage';
import { SERVICENOW_CONNECTOR_DETAIL } from '@/lib/setup/shell-setup-fixture';
import type { Metadata } from 'next';

const CONNECTOR_MAP: Record<string, typeof SERVICENOW_CONNECTOR_DETAIL> = {
  'sn': SERVICENOW_CONNECTOR_DETAIL,
};

interface Props { params: Promise<{ connectorId: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { connectorId } = await params;
  return { title: `${connectorId} · Setup` };
}

export default async function Page({ params }: Props) {
  const { connectorId } = await params;
  const detail = CONNECTOR_MAP[connectorId];
  if (!detail) notFound();
  return <ConnectorDetailPage detail={detail} />;
}
