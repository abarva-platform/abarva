import { MaestroChrome } from '@/components/chrome/MaestroChrome';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <MaestroChrome>{children}</MaestroChrome>;
}
