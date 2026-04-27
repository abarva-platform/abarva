import React from 'react';
import type { IntelligenceWorkflowCanvasView } from '@/lib/intelligence/intelligence-workflow-canvas-view';

interface IntelligenceWorkflowCanvasProps {
  view: IntelligenceWorkflowCanvasView;
}

export function IntelligenceWorkflowCanvas({ view }: IntelligenceWorkflowCanvasProps) {
  const { sentinelBrief, patternStrip, activeMode, availableModes } = view;
  return (
    <div style={{ fontFamily: 'DM Sans, sans-serif', backgroundColor: '#FBFAF7', padding: '24px' }}>
      {/* Sentinel Brief */}
      <div style={{
        backgroundColor: '#0F1E3F',
        color: '#FFFFFF',
        padding: '16px 20px',
        borderRadius: '6px',
        marginBottom: '20px',
      }}>
        <div style={{ fontSize: '10px', fontWeight: 600, letterSpacing: '0.08em', color: '#9AA3B2', textTransform: 'uppercase', marginBottom: '6px' }}>
          SENTINEL · EVIDENCE INTELLIGENCE
        </div>
        <div style={{ fontSize: '14px', fontWeight: 500, marginBottom: '8px' }}>{sentinelBrief.topPatternLabel}</div>
        <div style={{ fontSize: '11px', color: '#9AA3B2' }}>
          Confidence: {sentinelBrief.confidenceLevel} — {sentinelBrief.confidenceReason}
        </div>
        {sentinelBrief.missingEvidence.length > 0 && (
          <div style={{ fontSize: '11px', color: '#EF9B72', marginTop: '6px' }}>
            Missing: {sentinelBrief.missingEvidence.slice(0, 2).join(' · ')}
          </div>
        )}
        <div style={{ fontSize: '10px', color: '#525866', marginTop: '8px' }}>{sentinelBrief.deterministicSeedCaveat}</div>
      </div>

      {/* Mode Tabs */}
      <div style={{ display: 'flex', gap: '4px', marginBottom: '16px', borderBottom: '1px solid #E8E6E1', paddingBottom: '0' }}>
        {availableModes.map(mode => (
          <span key={mode} style={{
            padding: '6px 14px',
            fontSize: '12px',
            fontWeight: mode === activeMode ? 600 : 400,
            color: mode === activeMode ? '#1B2B5C' : '#525866',
            borderBottom: mode === activeMode ? '2px solid #1B2B5C' : '2px solid transparent',
            textTransform: 'capitalize',
            cursor: 'default',
          }}>
            {mode}
          </span>
        ))}
      </div>

      {/* Pattern Strip */}
      {patternStrip.length > 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '20px' }}>
          {patternStrip.slice(0, 3).map(pattern => (
            <div key={pattern.patternId} style={{
              padding: '12px 16px',
              backgroundColor: '#FFFFFF',
              border: '1px solid #E8E6E1',
              borderLeft: '3px solid #1B2B5C',
              borderRadius: '4px',
            }}>
              <div style={{ fontSize: '12px', fontWeight: 600, color: '#0A0C12', marginBottom: '4px' }}>{pattern.label}</div>
              <div style={{ fontSize: '11px', color: '#525866' }}>
                Confidence: {pattern.confidenceLevel} · Basis: {pattern.evidenceBasis}
              </div>
              {pattern.missingEvidence && (
                <div style={{ fontSize: '10px', color: '#9AA3B2', marginTop: '2px' }}>Missing: {pattern.missingEvidence}</div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div style={{ padding: '24px', textAlign: 'center', color: '#525866', fontSize: '13px' }}>
          {sentinelBrief.tenantRichnessCaveat}
        </div>
      )}

      {/* Next Action */}
      <div style={{ padding: '12px 16px', backgroundColor: '#F0F2F7', borderRadius: '4px', fontSize: '12px', color: '#1B2B5C' }}>
        <span style={{ fontWeight: 600 }}>Sentinel recommends: </span>{sentinelBrief.recommendedNextAction}
      </div>
    </div>
  );
}
