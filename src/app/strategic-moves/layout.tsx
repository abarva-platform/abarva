import { AppChrome } from '@/components/chrome/AppChrome';
import { DrawerProvider } from '@/components/drawer/DrawerProvider';
import { AttentionProvider } from '@/components/attention/AttentionEvents';
import { GlobalSearchModalLoader } from '@/components/shell/GlobalSearchModalLoader';

export default function StrategicMovesLayout({ children }: { children: React.ReactNode }) {
  return (
    <AttentionProvider>
      <DrawerProvider>
        <AppChrome>{children}</AppChrome>
        <GlobalSearchModalLoader />
      </DrawerProvider>
    </AttentionProvider>
  );
}

