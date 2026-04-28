'use client';

import React, { useState } from 'react';
import type { SourceBafoNegotiationViewModel } from '@/lib/source/source-bafo-negotiation-view';

const BG = '#FAFAF9';
const DARK = '#0F0E0D';
const TEXT = '#3D3B38';
const MUTED = '#706D66';
const BORDER = '#E8E6E3';
const ACCENT = '#1E3A5F';
const BG2 = '#F2F1F0';

type ActiveTab = 'levers' | 'opportunities' | 'asks' | 'recommendations';

export interface SourceBafoNegotiationModelPanelProps {
  viewModel: SourceBafoNegotiationViewModel;
  className?: string;
}

export function SourceBafoNegotiationModelPanel({
  viewModel,
  className = '',
}: SourceBafoNegotiationModelPanelProps): React.ReactElement {
  const [activeTab, setActiveTab] = useState<ActiveTab>('levers');
  const { topLevers, topOpportunities, topRecommendations, activeScenario, caveat, missingInputs, highPriorityAskCount } = viewModel;

  const tabs: { id: ActiveTab; label: string }[] = [
    { id: 'levers', label: 'Levers' },
    { id: 'opportunities', label: 'Opportunities' },
    { id: 'asks', label: `Asks (${highPriorityAskCount})` },
    { id: 'recommendations', label: 'Recommendations' },
  ];

  return (
    <div
      data-testid={`bafo-negotiation-model-panel-${viewModel.summary.eventId}`}
      style={{ background: BG, border: `1px solid ${BORDER}`, borderRadius: 8, padding: '20px 24px' }}
      className={className}
    >
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 12 }}>
        <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: ACCENT }}>
          BAFO / Negotiation
        </span>
        <span style={{ fontSize: 11, color: MUTED }}>
          {viewModel.leverTypesSummary.length} lever{viewModel.leverTypesSummary.length !== 1 ? 's' : ''} · {viewModel.summary.modelVersion}
        </span>
      </div>

      {/* Missing inputs */}
      {missingInputs.length > 0 && (
        <div style={{ marginBottom: 12 }}>
          {missingInputs.map((m) => (
            <p key={m} style={{ fontSize: 11, color: MUTED, margin: '0 0 2px' }}>⚠ {m}</p>
          ))}
        </div>
      )}

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 16, borderBottom: `1px solid ${BORDER}`, paddingBottom: 8 }}>
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              fontSize: 11, padding: '3px 10px', borderRadius: 4, border: 'none', cursor: 'pointer',
              background: activeTab === tab.id ? ACCENT : 'transparent',
              color: activeTab === tab.id ? '#fff' : MUTED,
              fontWeight: activeTab === tab.id ? 600 : 400,
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === 'levers' && (
        <div>
          {topLevers.map((lever) => (
            <div key={lever.leverType} style={{ marginBottom: 12, paddingBottom: 12, borderBottom: `1px solid ${BG2}` }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                <span style={{ fontSize: 12, fontWeight: 600, color: DARK, textTransform: 'capitalize' }}>
                  {lever.leverType.replace(/_/g, ' ')}
                </span>
                <span style={{ fontSize: 11, color: ACCENT }}>{lever.estimatedValueImpact}</span>
              </div>
              <p style={{ fontSize: 11, color: TEXT, margin: 0 }}>{lever.description}</p>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'opportunities' && (
        <div>
          {topOpportunities.map((opp) => (
            <div key={opp.opportunityId} style={{ marginBottom: 10 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 2 }}>
                <span style={{ fontSize: 12, fontWeight: 600, color: DARK }}>{opp.description}</span>
                <span style={{ fontSize: 11, color: MUTED }}>{opp.strength}</span>
              </div>
              <p style={{ fontSize: 11, color: MUTED, margin: 0 }}>{opp.estimatedImpact}</p>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'asks' && (
        <div>
          {activeScenario ? (
            activeScenario.asks.map((ask) => (
              <div key={ask.askId} style={{ marginBottom: 10 }}>
                <span style={{ fontSize: 11, fontWeight: 600, color: DARK }}>{ask.statement}</span>
                <p style={{ fontSize: 11, color: MUTED, margin: '2px 0 0' }}>{ask.justification}</p>
              </div>
            ))
          ) : (
            <p style={{ fontSize: 11, color: MUTED }}>No scenario available.</p>
          )}
        </div>
      )}

      {activeTab === 'recommendations' && (
        <div>
          {topRecommendations.map((rec) => (
            <div key={rec.recommendationId} style={{ marginBottom: 10 }}>
              <span style={{ fontSize: 12, fontWeight: 600, color: DARK }}>{rec.summary}</span>
              <p style={{ fontSize: 11, color: MUTED, margin: '2px 0 0' }}>{rec.rationale}</p>
            </div>
          ))}
        </div>
      )}

      {/* Caveat */}
      <p style={{ fontSize: 11, color: MUTED, marginTop: 16, lineHeight: 1.5 }}>{caveat}</p>
    </div>
  );
}

export default SourceBafoNegotiationModelPanel;
