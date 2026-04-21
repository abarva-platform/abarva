import type { Metadata } from 'next';
import AbarvaNav from '@/components/AbarvaNav';
import './programs.css';

export const metadata: Metadata = {
  title: 'AbarVa Programs',
  description: 'Portfolio, charter, and execution surfaces for AbarVa programs.',
};

export default function ProgramsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="programs-layout-shell">
      <AbarvaNav compact />
      <div className="programs-shell">
        <div className="programs-route-banner">
          <div>
            <div className="programs-eyebrow">Programs Surface</div>
            <div className="programs-route-title">Portfolio, charter, and execution in one operating surface.</div>
          </div>
          <div className="programs-route-meta">
            <span>Mocked frontend contracts only</span>
            <span>Apex demo anchor · composite client naming only</span>
          </div>
        </div>
        {children}
      </div>
    </div>
  );
}
