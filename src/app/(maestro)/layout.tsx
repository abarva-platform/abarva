import { AppChrome } from '@/components/chrome/AppChrome';
import { DrawerProvider } from '@/components/drawer/DrawerProvider';

export default async function MaestroLayout({ children }: { children: React.ReactNode }) {
  return (
    <DrawerProvider>
      <AppChrome>{children}</AppChrome>
    </DrawerProvider>
  );
}
