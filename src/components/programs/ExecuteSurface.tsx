'use client';

import { useState } from 'react';
import type { ExecuteSurfaceProps } from '@/lib/programs/types';
import { MilestoneSummary, PersonBadge } from '@/components/programs/common';

export function ExecuteSurface(props: ExecuteSurfaceProps) {
  const defaultTab = props.viewerRole === 'sponsor' ? 'milestones' : props.activeTab;
  const [activeTab, setActiveTab] = useState<ExecuteSurfaceProps['activeTab']>(defaultTab);

  return (
    <div className="programs-stack">
      <div className="programs-card programs-section">
        <div className="programs-header-bar">
          <div>
            <div className="programs-eyebrow">Phase 5 execute</div>
            <div className="programs-name" style={{ fontSize: 28 }}>Operational delivery surface</div>
            <div className="programs-muted" style={{ marginTop: 8 }}>
              Execute intentionally breaks the module-dashboard pattern. This tab set is seeded with the Phase 5 demo state from the spec.
            </div>
          </div>
          <div className="programs-metrics" style={{ minWidth: 320 }}>
            <div className="programs-metric">
              <div className="programs-mono-label">Summary</div>
              <div style={{ marginTop: 10, fontWeight: 600 }}>3 complete / 2 in progress / 1 at risk</div>
              <div className="programs-muted" style={{ marginTop: 6, fontSize: 12 }}>$1.8M tracked toward $4.2M target</div>
            </div>
            <div className="programs-metric">
              <div className="programs-mono-label">Drift</div>
              <div style={{ marginTop: 10, fontWeight: 600, color: 'var(--programs-amber)' }}>+1 week</div>
              <div className="programs-muted" style={{ marginTop: 6, fontSize: 12 }}>Change-management lag is driving the slip.</div>
            </div>
          </div>
        </div>
        <div className="programs-secondary-nav" style={{ marginTop: 18 }}>
          {(['milestones', 'work', 'risks', 'evidence', 'reports'] as const).map((tab) => (
            <button
              key={tab}
              type="button"
              className={`programs-pill-button ${activeTab === tab ? 'is-active' : ''}`}
              style={{
                background: activeTab === tab ? 'rgba(15, 118, 110, 0.12)' : 'rgba(255,255,255,0.88)',
                color: activeTab === tab ? 'var(--programs-teal)' : 'var(--programs-text)',
              }}
              onClick={() => setActiveTab(tab)}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>
      {activeTab === 'milestones' ? <MilestoneSummary milestones={props.milestones} /> : null}
      {activeTab === 'work' ? (
        <div className="programs-list">
          {props.workItems.map((item) => (
            <div key={item.id} className="programs-list-item">
              <div className="programs-row" style={{ justifyContent: 'space-between', alignItems: 'start' }}>
                <div>
                  <div style={{ fontWeight: 600 }}>{item.title}</div>
                  <div className="programs-muted" style={{ fontSize: 13, marginTop: 6 }}>
                    {item.dueLabel}
                    {item.dependency ? ` · dependency: ${item.dependency}` : ''}
                  </div>
                </div>
                <div className="programs-row" style={{ gap: 8 }}>
                  {item.nexusDrafted ? <span className="programs-chip teal">Nexus drafted</span> : null}
                  <span className={`programs-chip ${item.status === 'blocked' ? 'red' : item.status === 'done' ? 'green' : item.status === 'in_progress' ? 'amber' : 'teal'}`}>
                    {item.status.replace('_', ' ')}
                  </span>
                </div>
              </div>
              <div className="programs-row" style={{ justifyContent: 'space-between', marginTop: 12 }}>
                <PersonBadge person={item.assignee} />
                <button className="programs-button" type="button">Update status</button>
              </div>
            </div>
          ))}
        </div>
      ) : null}
      {activeTab === 'risks' ? (
        <div className="programs-list">
          {props.risks.map((risk) => (
            <div key={risk.id} className="programs-list-item">
              <div className="programs-row" style={{ justifyContent: 'space-between', alignItems: 'start' }}>
                <div>
                  <div style={{ fontWeight: 600 }}>{risk.title}</div>
                  <div className="programs-muted" style={{ fontSize: 13, marginTop: 6 }}>{risk.mitigation}</div>
                </div>
                <span className={`programs-chip ${risk.severity === 'critical' || risk.severity === 'high' ? 'red' : risk.severity === 'medium' ? 'amber' : 'teal'}`}>
                  {risk.severity}
                </span>
              </div>
              <div className="programs-row" style={{ justifyContent: 'space-between', marginTop: 12 }}>
                <PersonBadge person={risk.owner} />
                <span className="programs-chip">{risk.status}</span>
              </div>
            </div>
          ))}
        </div>
      ) : null}
      {activeTab === 'evidence' ? (
        <div className="programs-list">
          {props.evidence.map((item) => (
            <div key={item.id} className="programs-list-item">
              <div className="programs-row" style={{ justifyContent: 'space-between', alignItems: 'start' }}>
                <div>
                  <div style={{ fontWeight: 600 }}>{item.title}</div>
                  <div className="programs-muted" style={{ fontSize: 13, marginTop: 6 }}>{item.summary}</div>
                </div>
                <span className="programs-chip">{item.kind}</span>
              </div>
              <div className="programs-subtle" style={{ marginTop: 12, fontSize: 12 }}>
                Related to {item.relatedTo}
              </div>
            </div>
          ))}
        </div>
      ) : null}
      {activeTab === 'reports' ? (
        <div className="programs-list">
          {props.reports.map((report) => (
            <div key={report.id} className="programs-list-item">
              <div className="programs-row" style={{ justifyContent: 'space-between', alignItems: 'start' }}>
                <div>
                  <div style={{ fontWeight: 600 }}>{report.title}</div>
                  <div className="programs-muted" style={{ fontSize: 13, marginTop: 6 }}>{report.summary}</div>
                </div>
                <span className="programs-chip">{report.audience}</span>
              </div>
              <div className="programs-row" style={{ justifyContent: 'space-between', marginTop: 12 }}>
                <div className="programs-subtle" style={{ fontSize: 12 }}>
                  Drafted by {report.draftedBy === 'nexus' ? 'Nexus' : 'lead'}
                </div>
                <div className="programs-subtle" style={{ fontSize: 12 }}>
                  {report.publishedAt.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}
