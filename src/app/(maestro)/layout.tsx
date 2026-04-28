import { AppChrome } from '@/components/chrome/AppChrome';
import { DrawerProvider } from '@/components/drawer/DrawerProvider';
import { AttentionProvider } from '@/components/attention/AttentionEvents';
// AtlasStateProvider (stub) intentionally removed — each page's AppShell mounts
// AtlasPageStateProvider with the correct surface + agentName, so the stub outer
// wrapper was shadowing real API responses with buildAtlasContextualReply.

export default async function MaestroLayout({ children }: { children: React.ReactNode }) {
  return (
    <AttentionProvider>
      <DrawerProvider>
        <AppChrome>{children}</AppChrome>
      </DrawerProvider>
    </AttentionProvider>
  );
}
