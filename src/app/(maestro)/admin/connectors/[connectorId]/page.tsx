import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { ConnectorDetailPage } from '@/components/setup/ConnectorDetailPage';
import { getSetupConnectorDetail } from '@/lib/setup/shell-setup-fixture';

interface Props {
  params: Promise<{ connectorId: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { connectorId } = await params;
  const detail = getSetupConnectorDetail(connectorId);
  return { title: detail ? `${detail.name} · Setup` : 'Connector · Setup' };
}

export default async function Page({ params }: Props) {
  const { connectorId } = await params;
  const detail = getSetupConnectorDetail(connectorId);
  if (!detail) notFound();
  return <ConnectorDetailPage detail={detail} />;
}
