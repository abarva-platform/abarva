import { notFound } from 'next/navigation';
import { buildAiDecisionDetailView, isAiDecisionId } from '@/lib/tower/ai-decision-detail-fixture';
import { AiDecisionDetailPage } from '@/components/tower/AiDecisionDetailPage';
import type { Metadata } from 'next';

interface Props {
  params: Promise<{ decisionId: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { decisionId } = await params;
  const d = buildAiDecisionDetailView(decisionId);
  return { title: d ? `${d.title} · Decisions · Tower` : 'Decision · Tower' };
}

export default async function Page({ params }: Props) {
  const { decisionId } = await params;
  if (!isAiDecisionId(decisionId)) notFound();
  return <AiDecisionDetailPage decisionId={decisionId} />;
}
