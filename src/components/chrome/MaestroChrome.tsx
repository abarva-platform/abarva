import AbarvaNav from '@/components/AbarvaNav';
import { PrimaryNav } from './PrimaryNav';

const BG = '#0A0A0A';

export function MaestroChrome({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ minHeight: '100vh', background: BG, color: '#F5F5F0' }}>
      <AbarvaNav activePage="dashboard" />
      <PrimaryNav />
      <div>{children}</div>
    </div>
  );
}
