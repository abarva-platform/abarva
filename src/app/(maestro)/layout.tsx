import { MaestroChrome } from '@/components/chrome/MaestroChrome';

export default function MaestroLayout({ children }: { children: React.ReactNode }) {
  return <MaestroChrome>{children}</MaestroChrome>;
}
