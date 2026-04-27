import React from 'react';
import type { SentinelEvidenceBriefView } from '@/lib/intelligence/sentinel-brief-evidence-view';

interface SentinelEvidenceBriefProps {
  view: SentinelEvidenceBriefView;
}

export function SentinelEvidenceBrief({ view }: SentinelEvidenceBriefProps) {
  return (
    <div style={{ fontFamily: 'DM Sans, sans-serif', backgroundColor: '#FBFAF7', padding: '20px', maxWidth: '640px' }}>
      {/* Header */}
      <div style={{ marginBottom: '16px' }}>
        <div style={{ fontSize: '10px', fontWeight: 600, color: '#1B2B5C', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '4px' }}>
          SENTINEL · EVIDENCE BRIEF
        </div>
        <div style={{ fontSize: '14px', fontWeight: 600, color: '#0A0C12', marginBottom: '4px' }}>{view.topPatternSummary}</div>
        <div style={{ fontSize: '11px', color: '#525866' }}>
          Confidence: {view.evidenceConfidenceLevel} — {view.evidenceConfidenceReason}
        </div>
      </div>

      {/* Context used */}
      <div style={{ marginBottom: '14px' }}>
        <div style={{ fontSize: '10px', fontWeight: 600, color: '#525866', textTransform: 'uppercase', marginBottom: '4px' }}>Context used</div>
        {view.contextUsed.map((ctx, i) => (
          <div key={i} style={{ fontSize: '11px', color: '#0A0C12', padding: '2px 0' }}>· {ctx}</div>
        ))}
      </div>

      {/* Missing evidence */}
      {view.missingEvidence.length > 0 && (
        <div style={{ marginBottom: '14px', padding: '10px 14px', backgroundColor: '#FFF7ED', border: '1px solid #F59E0B', borderRadius: '4px' }}>
          <div style={{ fontSize: '10px', fontWeight: 600, color: '#92400E', textTransform: 'uppercase', marginBottom: '4px' }}>Missing evidence</div>
          {view.missingEvidence.map(ev => (
            <div key={ev.evidenceId} style={{ fontSize: '11px', color: '#0A0C12', padding: '2px 0' }}>
              · {ev.label} <span style={{ color: '#9AA3B2' }}>— {ev.note}</span>
            </div>
          ))}
        </div>
      )}

      {/* Recommended action */}
      <div style={{ padding: '10px 14px', backgroundColor: '#F0F2F7', borderRadius: '4px', marginBottom: '12px' }}>
        <span style={{ fontSize: '11px', fontWeight: 600, color: '#1B2B5C' }}>Sentinel recommends: </span>
        <span style={{ fontSize: '11px', color: '#0A0C12' }}>{view.recommendedNextAction}</span>
      </div>

      {/* Caveat */}
      <div style={{ fontSize: '10px', color: '#9AA3B2' }}>{view.deterministicSeedCaveat}</div>
    </div>
  );
}
