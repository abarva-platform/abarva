'use client';

import type { PortfolioSignal } from '@/lib/intelligence/types';

const CATEGORY_TONE: Record<string, string> = {
  contradiction: 'red',
  vendor_overlap: 'amber',
  pattern_emerging: 'green',
  shadow_ai: 'blue',
  portfolio_risk: 'amber',
  benchmark_drift: 'magenta',
};

export function PortfolioSignalFeed({
  signals,
  programCount,
  onSignalClick,
}: {
  signals: PortfolioSignal[];
  programCount: number;
  onSignalClick: (signalId: string) => void;
}) {
  return (
    <section className="intel-card intel-section">
      <div className="intel-row" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div className="intel-eyebrow">Zone 3 · What’s moving across your portfolio</div>
          <div style={{ marginTop: 6, fontSize: 18, fontWeight: 700 }}>{programCount} active programs · {signals.length} active signals</div>
        </div>
        <span className="intel-chip mono">{signals.length} visible</span>
      </div>

      <div className="intel-signal-list" style={{ marginTop: 16 }}>
        {signals.length === 0 ? (
          <div className="intel-card-soft intel-section intel-subtle">No unresolved portfolio signals are active right now.</div>
        ) : (
          signals.slice(0, 4).map((signal) => (
            <button
              key={signal.id}
              type="button"
              className="intel-signal-row"
              onClick={() => onSignalClick(signal.id)}
            >
              <div className="intel-row" style={{ justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div className="intel-stack" style={{ gap: 8 }}>
                  <div className="intel-inline-list">
                    <span className={`intel-chip mono ${CATEGORY_TONE[signal.category] ?? 'teal'}`}>
                      {signal.category.replaceAll('_', ' ')}
                    </span>
                    <span className={`intel-chip mono ${signal.severity === 'critical' ? 'red' : signal.severity === 'warning' ? 'amber' : 'blue'}`}>
                      {signal.severity}
                    </span>
                    {signal.sponsorNotified ? <span className="intel-chip mono">sponsor notified</span> : null}
                  </div>
                  <div style={{ fontSize: 16, fontWeight: 700, textAlign: 'left' }}>{signal.headline}</div>
                  <div className="intel-subtle" style={{ fontSize: 13, textAlign: 'left' }}>
                    {signal.affectedEngagementIds.length} affected program{signal.affectedEngagementIds.length === 1 ? '' : 's'} · fired{' '}
                    {new Date(signal.firedAt).toLocaleDateString()}
                  </div>
                </div>
                <span className="intel-chip mono">open</span>
              </div>
            </button>
          ))
        )}
      </div>
    </section>
  );
}
