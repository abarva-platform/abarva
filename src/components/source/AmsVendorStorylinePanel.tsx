// SRC36 — AMS Vendor Storyline Panel
// Displays all 4 AMS vendors with proposal status, risk flags, pricing bands,
// and source-to-programme bridge context.
// Design canon: #F8F7F4 bg, Georgia headers, DM Sans body, navy accent.
// No teal, no sparkles, no fabricated dollar amounts.
'use client';

import React from 'react';
import type {
  AmsVendorStorylineSummary,
  AmsVendorStorylineItem,
  AmsRiskSignalSeverity,
  AmsPricingBand,
} from '@/lib/source/ams-outsourcing-2026-view';

interface AmsVendorStorylinePanelProps {
  storyline: AmsVendorStorylineSummary;
}

const RISK_SEVERITY_COLORS: Record<AmsRiskSignalSeverity, { bg: string; text: string; border: string }> = {
  critical: { bg: '#FEF2F2', text: '#991B1B', border: '#FCA5A5' },
  high:     { bg: '#FFF7ED', text: '#9A3412', border: '#FDBA74' },
  medium:   { bg: '#FEFCE8', text: '#854D0E', border: '#FDE047' },
  low:      { bg: '#F0FDF4', text: '#14532D', border: '#86EFAC' },
};

const PRICING_BAND_LABELS: Record<AmsPricingBand, { label: string; color: string }> = {
  low:    { label: 'Below-market', color: '#14532D' },
  medium: { label: 'Mid-range',    color: '#1B2B5C' },
  high:   { label: 'Premium',      color: '#7C3AED' },
};

const PROPOSAL_STATUS_LABELS: Record<string, string> = {
  received:      'Received',
  under_review:  'Under Review',
  bafo_requested: 'BAFO Requested',
};

function VendorCard({ vendor }: { vendor: AmsVendorStorylineItem }) {
  const pricingBand = PRICING_BAND_LABELS[vendor.pricingBand];

  return (
    <div
      data-vendor-id={vendor.vendorId}
      style={{
        backgroundColor: '#FFFFFF',
        border: '1px solid #E8E6E1',
        borderLeft: vendor.proposalStatus === 'bafo_requested'
          ? '3px solid #1B2B5C'
          : '3px solid #D1D5DB',
        borderRadius: '6px',
        padding: '16px',
        display: 'grid',
        gap: '12px',
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
        <div>
          <div style={{
            fontFamily: 'Georgia, serif',
            fontWeight: 400,
            fontSize: '14px',
            color: '#0A0C12',
            lineHeight: 1.4,
          }}>
            {vendor.vendorLabel}
          </div>
          <div style={{
            fontFamily: 'DM Sans, sans-serif',
            fontSize: '11px',
            color: '#525866',
            marginTop: '2px',
          }}>
            {PROPOSAL_STATUS_LABELS[vendor.proposalStatus] ?? vendor.proposalStatusLabel}
          </div>
        </div>
        <div style={{
          fontFamily: 'DM Sans, sans-serif',
          fontSize: '11px',
          fontWeight: 600,
          color: pricingBand.color,
          backgroundColor: '#F8F7F4',
          border: `1px solid ${pricingBand.color}33`,
          borderRadius: '4px',
          padding: '2px 8px',
          whiteSpace: 'nowrap',
        }}>
          {pricingBand.label}
        </div>
      </div>

      {/* Key differentiators */}
      {vendor.keyDifferentiators.length > 0 && (
        <div>
          <div style={{
            fontFamily: 'DM Sans, sans-serif',
            fontSize: '10px',
            fontWeight: 600,
            color: '#525866',
            textTransform: 'uppercase',
            letterSpacing: '0.06em',
            marginBottom: '6px',
          }}>
            Key differentiators
          </div>
          <ul style={{
            margin: 0,
            paddingLeft: '14px',
            fontFamily: 'DM Sans, sans-serif',
            fontSize: '12px',
            color: '#0A0C12',
            lineHeight: 1.5,
          }}>
            {vendor.keyDifferentiators.map((d, i) => (
              <li key={i} style={{ marginBottom: '2px' }}>{d}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Risk flags */}
      {vendor.riskFlags.length > 0 && (
        <div>
          <div style={{
            fontFamily: 'DM Sans, sans-serif',
            fontSize: '10px',
            fontWeight: 600,
            color: '#525866',
            textTransform: 'uppercase',
            letterSpacing: '0.06em',
            marginBottom: '6px',
          }}>
            Sentinel risk signals
          </div>
          <div style={{ display: 'grid', gap: '6px' }}>
            {vendor.riskFlags.map((flag, i) => {
              const colors = RISK_SEVERITY_COLORS[flag.severity];
              return (
                <div
                  key={i}
                  style={{
                    backgroundColor: colors.bg,
                    border: `1px solid ${colors.border}`,
                    borderRadius: '4px',
                    padding: '6px 10px',
                    display: 'grid',
                    gap: '2px',
                  }}
                >
                  <div style={{
                    fontFamily: 'DM Sans, sans-serif',
                    fontSize: '11px',
                    fontWeight: 600,
                    color: colors.text,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                  }}>
                    <span style={{
                      fontFamily: 'DM Sans, sans-serif',
                      fontSize: '9px',
                      fontWeight: 700,
                      textTransform: 'uppercase',
                      letterSpacing: '0.06em',
                    }}>
                      {flag.severity}
                    </span>
                    · {flag.label}
                  </div>
                  <div style={{
                    fontFamily: 'DM Sans, sans-serif',
                    fontSize: '11px',
                    color: colors.text,
                    opacity: 0.85,
                    lineHeight: 1.4,
                  }}>
                    {flag.detail}
                  </div>
                  {flag.sentinelPatternRef && (
                    <div style={{
                      fontFamily: 'DM Sans, sans-serif',
                      fontSize: '10px',
                      color: '#1B2B5C',
                      fontStyle: 'italic',
                    }}>
                      Sentinel: {flag.sentinelPatternRef}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Bridge note */}
      <div style={{
        fontFamily: 'DM Sans, sans-serif',
        fontSize: '11px',
        color: '#525866',
        fontStyle: 'italic',
        borderTop: '1px solid #E8E6E1',
        paddingTop: '8px',
        lineHeight: 1.4,
      }}>
        {vendor.sourceToProgramBridge}
      </div>
    </div>
  );
}

export function AmsVendorStorylinePanel({ storyline }: AmsVendorStorylinePanelProps) {
  return (
    <div
      data-component="AmsVendorStorylinePanel"
      data-event-id={storyline.eventId}
      style={{ display: 'grid', gap: '16px' }}
    >
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
        <h3 style={{
          fontFamily: 'Georgia, serif',
          fontWeight: 400,
          fontSize: '15px',
          color: '#0A0C12',
          margin: 0,
        }}>
          Vendor Proposals
        </h3>
        <div style={{
          fontFamily: 'DM Sans, sans-serif',
          fontSize: '11px',
          color: '#525866',
          fontStyle: 'italic',
        }}>
          {storyline.vendors.length} vendors · {storyline.pricingDivergenceNote.split('.')[0]}.
        </div>
      </div>

      {/* Vendor grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
        gap: '12px',
      }}>
        {storyline.vendors.map((vendor) => (
          <VendorCard key={vendor.vendorId} vendor={vendor} />
        ))}
      </div>

      {/* Caveat */}
      <div style={{
        fontFamily: 'DM Sans, sans-serif',
        fontSize: '11px',
        color: '#706D66',
        backgroundColor: '#FBF7F0',
        border: '1px solid #E5DCD2',
        borderRadius: '4px',
        padding: '8px 12px',
        lineHeight: 1.5,
      }}>
        {storyline.evidenceCaveat}
      </div>
    </div>
  );
}
