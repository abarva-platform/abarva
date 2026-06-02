import { redirect } from 'next/navigation';

import '@/styles/canon-tokens.css';
import { AppChrome } from '@/components/chrome/AppChrome';
import { DrawerProvider } from '@/components/drawer/DrawerProvider';
import { AttentionProvider } from '@/components/attention/AttentionEvents';
import { GlobalSearchModalLoader } from '@/components/shell/GlobalSearchModalLoader';
import {
  RESPONSIBLE_AI_ACKNOWLEDGMENT_ROUTE,
  getResponsibleAiAcknowledgmentStatusForCurrentRequest,
} from '@/lib/ai-liability/responsible-ai-acknowledgment';
import {
  RESPONSIBLE_AI_TRAINING_ROUTE,
  getResponsibleAiTrainingStatusForCurrentRequest,
} from '@/lib/ai-liability/responsible-ai-training';
// AtlasStateProvider (stub) intentionally removed — each page's AppShell mounts
// AtlasPageStateProvider with the correct surface + agentName, so the stub outer
// wrapper was shadowing real API responses with buildAtlasContextualReply.

export default async function MaestroLayout({ children }: { children: React.ReactNode }) {
  const acknowledgmentStatus =
    await getResponsibleAiAcknowledgmentStatusForCurrentRequest();
  if (acknowledgmentStatus.required) {
    redirect(RESPONSIBLE_AI_ACKNOWLEDGMENT_ROUTE);
  }

  const trainingStatus =
    await getResponsibleAiTrainingStatusForCurrentRequest();
  if (trainingStatus.required) {
    redirect(RESPONSIBLE_AI_TRAINING_ROUTE);
  }

  return (
    <AttentionProvider>
      <DrawerProvider>
        <AppChrome>{children}</AppChrome>
        {/* Global Cmd+K / Ctrl+K search — mounted once for all maestro surfaces */}
        <GlobalSearchModalLoader />
      </DrawerProvider>
    </AttentionProvider>
  );
}
