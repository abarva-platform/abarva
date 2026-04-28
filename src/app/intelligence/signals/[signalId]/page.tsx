// INT-DTL-SIGNAL — Shell-native Intelligence signal detail reading view.
// I3: IntelligenceSignalDetailPage (server component) with ProvenanceRibbon.
// View model built server-side via buildIntelligenceSignalDetailView().
// Unknown signal IDs redirect to /intelligence/signals.

import { redirect } from 'next/navigation';
import { IntelligenceSignalDetailPage } from '@/components/intelligence/IntelligenceSignalDetailPage';
import {
  buildIntelligenceSignalDetailView,
  getKnownSignalIds,
} from '@/lib/intelligence/intelligence-signal-detail-view';

export function generateStaticParams() {
  return getKnownSignalIds().map((signalId) => ({ signalId }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ signalId: string }>;
}) {
  const { signalId } = await params;
  const view = buildIntelligenceSignalDetailView(signalId);
  if (!view) return { title: 'Signal · Intelligence' };
  return { title: `${view.signalId.toUpperCase()} · ${view.title.slice(0, 50)} · Intelligence` };
}

export default async function SignalDetailRoute({
  params,
}: {
  params: Promise<{ signalId: string }>;
}) {
  const { signalId } = await params;
  const view = buildIntelligenceSignalDetailView(signalId);

  if (!view) {
    // Unknown signal ID — redirect to signals index.
    redirect('/intelligence/signals');
  }

  return <IntelligenceSignalDetailPage view={view} />;
}
