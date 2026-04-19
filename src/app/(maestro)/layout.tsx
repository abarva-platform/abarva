import { AppChrome } from '@/components/chrome/AppChrome';

export default async function MaestroLayout({ children }: { children: React.ReactNode }) {
  return <AppChrome>{children}</AppChrome>;
}
