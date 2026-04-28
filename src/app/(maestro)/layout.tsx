import { AppChrome } from '@/components/chrome/AppChrome';
import { DrawerProvider } from '@/components/drawer/DrawerProvider';
import { AttentionProvider } from '@/components/attention/AttentionEvents';
import { AtlasStateProvider } from '@/components/shell/AtlasStateProvider';

export default async function MaestroLayout({ children }: { children: React.ReactNode }) {
  return (
    <AttentionProvider>
      <DrawerProvider>
        <AtlasStateProvider
          tenantName="Apex Retail Group"
          surface="home"
          surfaceContext={{ shell: 'maestro' }}
        >
          <AppChrome>{children}</AppChrome>
        </AtlasStateProvider>
      </DrawerProvider>
    </AttentionProvider>
  );
}
