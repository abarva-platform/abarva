'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { getPatterns, getViewerRole } from '@/lib/programs/mock';
import type { PatternLibraryItem } from '@/lib/programs/types';

export default function ProgramsPatternsPage() {
  const [patterns, setPatterns] = useState<PatternLibraryItem[]>([]);

  useEffect(() => {
    getPatterns({ role: getViewerRole('lead') }).then(setPatterns);
  }, []);

  return (
    <div className="programs-page programs-stack">
      <div className="programs-card programs-section">
        <div className="programs-header-bar">
          <div>
            <div className="programs-eyebrow">Genome library</div>
            <div className="programs-name" style={{ fontSize: 34 }}>Pattern catalog</div>
            <div className="programs-muted" style={{ marginTop: 8 }}>
              Role-filtered mock library for the portfolio launchpad and proposer UI.
            </div>
          </div>
          <Link href="/programs/new" className="programs-button programs-button-primary programs-link">
            Start from intake
          </Link>
        </div>
      </div>
      <div className="programs-grid-auto">
        {patterns.map((pattern) => (
          <div key={pattern.key} className="programs-card programs-section">
            <div className="programs-row" style={{ justifyContent: 'space-between', alignItems: 'start' }}>
              <div>
                <div className="programs-name" style={{ fontSize: 26 }}>{pattern.name}</div>
                <div className="programs-muted" style={{ marginTop: 8 }}>{pattern.summary}</div>
              </div>
              <span className={`programs-chip ${pattern.promotionState === 'mature' ? 'green' : pattern.promotionState === 'proven' ? 'teal' : 'amber'}`}>
                {pattern.promotionState}
              </span>
            </div>
            <div className="programs-metrics" style={{ marginTop: 16 }}>
              <div className="programs-metric"><div className="programs-mono-label" style={{ color: 'var(--programs-subtle)' }}>Duration</div><div className="programs-metric-value">{pattern.typicalDurationMonths}m</div></div>
              <div className="programs-metric"><div className="programs-mono-label" style={{ color: 'var(--programs-subtle)' }}>Deployments</div><div className="programs-metric-value">{pattern.deploymentCount}</div></div>
              <div className="programs-metric"><div className="programs-mono-label" style={{ color: 'var(--programs-subtle)' }}>Preload depth</div><div className="programs-metric-value">{pattern.preloadDepthPct}%</div></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
