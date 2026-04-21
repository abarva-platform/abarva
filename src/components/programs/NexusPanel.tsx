'use client';

import { useMemo, useState } from 'react';
import { closeCxoTakeover } from '@/lib/programs/mock';
import type { CxoTakeoverProps, NexusPanelProps } from '@/lib/programs/types';

const TABS: Array<NexusPanelProps['activeTab']> = ['chat', 'drafts', 'flags', 'sources'];

function iconFor(tab: NexusPanelProps['activeTab']) {
  switch (tab) {
    case 'chat':
      return 'Q';
    case 'drafts':
      return 'D';
    case 'flags':
      return 'F';
    default:
      return 'S';
  }
}

export function NexusPanel(props: NexusPanelProps) {
  const [expanded, setExpanded] = useState(props.mode === 'expanded');
  const [activeTab, setActiveTab] = useState<NexusPanelProps['activeTab']>(props.activeTab);

  const content = useMemo(() => {
    if (activeTab === 'chat') {
      return (
        <div className="programs-stack" style={{ gap: 12 }}>
          <div className="programs-hero-note">
            Programs chat is intentionally static on this branch. The tab wiring is ready for the real program-scoped SSE endpoint.
          </div>
          {props.thread.turns.map((turn) => (
            <div key={turn.id} className="programs-list-item">
              <div className="programs-mono-label" style={{ color: turn.speaker === 'nexus' ? 'var(--programs-teal)' : 'var(--programs-subtle)' }}>
                {turn.speaker}
              </div>
              <div style={{ marginTop: 8 }}>{turn.text}</div>
            </div>
          ))}
        </div>
      );
    }
    if (activeTab === 'drafts') {
      return (
        <div className="programs-list">
          {props.drafts.map((draft) => (
            <div key={draft.id} className="programs-list-item">
              <div className="programs-row" style={{ justifyContent: 'space-between', alignItems: 'start' }}>
                <div>
                  <div style={{ fontWeight: 600 }}>{draft.title}</div>
                  <div className="programs-muted" style={{ fontSize: 13, marginTop: 6 }}>
                    {draft.summary}
                  </div>
                </div>
                <span className="programs-chip">{draft.status.replace('_', ' ')}</span>
              </div>
            </div>
          ))}
        </div>
      );
    }
    if (activeTab === 'flags') {
      return (
        <div className="programs-list">
          {props.flags.map((flag) => (
            <div key={flag.id} className="programs-list-item">
              <div className="programs-row" style={{ justifyContent: 'space-between', alignItems: 'start' }}>
                <div>
                  <div style={{ fontWeight: 600 }}>{flag.title}</div>
                  <div className="programs-muted" style={{ fontSize: 13, marginTop: 6 }}>
                    {flag.detail}
                  </div>
                </div>
                <span className={`programs-chip ${flag.severity === 'high' ? 'red' : flag.severity === 'medium' ? 'amber' : 'teal'}`}>
                  {flag.severity}
                </span>
              </div>
            </div>
          ))}
        </div>
      );
    }
    return (
      <div className="programs-list">
        {props.sources.map((source) => (
          <div key={source.id} className="programs-list-item">
            <div className="programs-mono-label">{source.sourceType}</div>
            <div style={{ fontWeight: 600, marginTop: 8 }}>{source.label}</div>
            <div className="programs-muted" style={{ fontSize: 13, marginTop: 6 }}>
              {source.detail}
            </div>
          </div>
        ))}
      </div>
    );
  }, [activeTab, props.drafts, props.flags, props.sources, props.thread.turns]);

  return (
    <div className="programs-nexus-shell">
      <div
        className="programs-card programs-nexus-panel"
        style={{ width: expanded ? 340 : 56 }}
      >
        <div className="programs-section" style={{ padding: expanded ? 16 : 10 }}>
          {expanded ? (
            <div className="programs-stack" style={{ gap: 14 }}>
              <div className="programs-row" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div className="programs-eyebrow">Nexus side-panel</div>
                  <div className="programs-muted" style={{ fontSize: 13 }}>
                    Static shell now. Delivery wiring lands after Intelligence merges.
                  </div>
                </div>
                <button className="programs-icon-button" type="button" onClick={() => setExpanded(false)} aria-label="Collapse Nexus panel">
                  ←
                </button>
              </div>
              <div className="programs-nexus-tabs">
                {TABS.map((tab) => (
                  <button
                    key={tab}
                    type="button"
                    className="programs-pill-button"
                    style={{
                      background: activeTab === tab ? 'rgba(15, 118, 110, 0.12)' : 'rgba(255,255,255,0.88)',
                      color: activeTab === tab ? 'var(--programs-teal)' : 'var(--programs-muted)',
                    }}
                    onClick={() => setActiveTab(tab)}
                  >
                    {tab}
                  </button>
                ))}
              </div>
              {content}
            </div>
          ) : (
            <div className="programs-nexus-icon-rail">
              <button className="programs-icon-button" type="button" onClick={() => setExpanded(true)} aria-label="Expand Nexus panel">
                →
              </button>
              {TABS.map((tab) => (
                <button
                  key={tab}
                  type="button"
                  className="programs-icon-button"
                  onClick={() => {
                    setActiveTab(tab);
                    setExpanded(true);
                  }}
                  aria-label={`Open ${tab} tab`}
                >
                  {iconFor(tab)}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export function CxoTakeover(props: CxoTakeoverProps) {
  const [closed, setClosed] = useState(false);

  async function handleClose() {
    await closeCxoTakeover(props.programId);
    setClosed(true);
  }

  return (
    <div className="programs-card programs-section">
      <div className="programs-eyebrow">Mode C preview</div>
      <div className="programs-name" style={{ fontSize: 26 }}>
        {props.mode === 'phase_3_interview' ? 'Phase 3 CXO interview takeover' : 'Phase 6 verification takeover'}
      </div>
      <div className="programs-muted" style={{ marginTop: 8 }}>
        Static shell only. The structured pacing, question bank, and transcript layout are in place, but the live interaction logic is intentionally stubbed.
      </div>
      <div className="programs-takeover-preview" style={{ marginTop: 18 }}>
        <div className="programs-stack">
          {props.questionBank.map((question, index) => (
            <div key={question.id} className="programs-list-item">
              <div className="programs-mono-label">Question {index + 1}</div>
              <div style={{ fontWeight: 600, marginTop: 8 }}>{question.prompt}</div>
              <div className="programs-muted" style={{ fontSize: 13, marginTop: 6 }}>
                {question.rationale}
              </div>
            </div>
          ))}
        </div>
        <div className="programs-stack">
          {props.transcript.map((turn) => (
            <div key={turn.id} className="programs-list-item">
              <div className="programs-mono-label" style={{ color: turn.speaker === 'nexus' ? 'var(--programs-teal)' : 'var(--programs-subtle)' }}>
                {turn.speaker}
              </div>
              <div style={{ marginTop: 8 }}>{turn.text}</div>
            </div>
          ))}
          <div className="programs-hero-note">
            TODO(Packet 8 §8.5, Packet 12 §12.3): replace this preview with the real takeover interaction flow once shared Nexus interview infrastructure ships.
          </div>
          <button className="programs-button" type="button" onClick={handleClose}>
            {closed ? 'Static synthesis closed' : 'Close preview'}
          </button>
        </div>
      </div>
    </div>
  );
}
