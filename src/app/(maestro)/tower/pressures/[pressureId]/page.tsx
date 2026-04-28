import { notFound } from 'next/navigation';
import { PRESSURE_DETAIL_MAP } from '@/lib/tower/shell-tower-fixture';
import { PressureDetailPage } from '@/components/tower/PressureDetailPage';
import type { Metadata } from 'next';

interface Props {
  params: { pressureId: string };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const detail = PRESSURE_DETAIL_MAP[params.pressureId];
  return { title: detail ? `${detail.title} · Tower` : 'Pressure · Tower' };
}

export default function Page({ params }: Props) {
  const detail = PRESSURE_DETAIL_MAP[params.pressureId];
  if (!detail) notFound();
  return <PressureDetailPage detail={detail} />;
}
