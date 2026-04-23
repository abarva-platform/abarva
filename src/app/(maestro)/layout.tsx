import { AppChrome } from '@/components/chrome/AppChrome';
import { DrawerProvider } from '@/components/drawer/DrawerProvider';
import { AttentionProvider } from '@/components/attention/AttentionEvents';

export default async function MaestroLayout({ children }: { children: React.ReactNode }) {
  return (
    <AttentionProvider>
      <DrawerProvider>
        <AppChrome>{children}</AppChrome>
      </DrawerProvider>
    </AttentionProvider>
  );
}
