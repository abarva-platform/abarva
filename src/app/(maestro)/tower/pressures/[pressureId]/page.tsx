import { notFound } from 'next/navigation';
import { PRESSURE_DETAIL_MAP } from '@/lib/tower/shell-tower-fixture';
import { PressureDetailPage } from '@/components/tower/PressureDetailPage';
import { AiPressureDetailPage } from '@/components/tower/AiPressureDetailPage';
import { isAiPressureId } from '@/lib/tower/ai-pressure-detail-fixture';
import type { Metadata } from 'next';

interface Props {
  params: Promise<{ pressureId: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { pressureId } = await params;
  const detail = PRESSURE_DETAIL_MAP[pressureId];
  return { title: detail ? `${detail.title} · Tower` : 'Pressure · Tower' };
}

export default async function Page({ params }: Props) {
  const { pressureId } = await params;
  // AI program pressures (Tower Wave T4) vs legacy enterprise pressures
  if (isAiPressureId(pressureId)) {
    return <AiPressureDetailPage pressureId={pressureId} />;
  }
  const detail = PRESSURE_DETAIL_MAP[pressureId];
  if (!detail) notFound();
  return <PressureDetailPage detail={detail} />;
}
