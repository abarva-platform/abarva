'use client';

import type { PortfolioSignal } from '@/lib/intelligence/types';

export function PortfolioSignalDetail({
  signal,
  onClose,
}: {
  signal: PortfolioSignal | null;
  onClose: () => void;
}) {
  if (!signal) return null;

  const entries = Object.entries(signal.context ?? {});

  return (
    <aside className="intel-drawer" aria-label="Signal detail panel">
      <div className="intel-section" style={{ borderBottom: 'var(--intel-border)' }}>
        <div className="intel-row" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
          <div className="intel-chip mono red">{signal.severity}</div>
          <button type="button" className="intel-button-ghost" onClick={onClose}>
            Close
          </button>
        </div>
        <div className="intel-title" style={{ fontSize: 28, marginTop: 12 }}>{signal.headline}</div>
        <div className="intel-subtle" style={{ marginTop: 10, fontSize: 13 }}>
          {signal.category.replaceAll('_', ' ')} · {signal.affectedEngagementIds.length} affected program{signal.affectedEngagementIds.length === 1 ? '' : 's'}
        </div>
      </div>
      <div className="intel-drawer-body">
        <div className="intel-stack">
          <div className="intel-card-soft intel-section">
            <div className="intel-eyebrow">Signal context</div>
            {entries.length === 0 ? (
              <div className="intel-subtle" style={{ marginTop: 10, fontSize: 13 }}>
                This signal does not yet include expanded evidence in the current API payload.
              </div>
            ) : (
              <div className="intel-stack" style={{ gap: 10, marginTop: 12 }}>
                {entries.map(([key, value]) => (
                  <div key={key}>
                    <div className="intel-chip mono">{key.replaceAll('_', ' ')}</div>
                    <div style={{ marginTop: 6, fontSize: 14, lineHeight: 1.5 }}>
                      {typeof value === 'string' ? value : JSON.stringify(value)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="intel-cohort-card">
            <div className="intel-eyebrow" style={{ color: 'var(--intel-magenta)' }}>Recommended next move</div>
            <div style={{ marginTop: 10, fontSize: 14, lineHeight: 1.5 }}>
              Treat this as a portfolio-level signal first, then decide whether it should become a scoped program or stay as a monitored contradiction.
            </div>
          </div>
          <div className="intel-row" style={{ justifyContent: 'space-between' }}>
            <button type="button" className="intel-button" disabled>
              Originate program
            </button>
            <button type="button" className="intel-button-outline" disabled>
              Dismiss
            </button>
          </div>
        </div>
      </div>
    </aside>
  );
}
