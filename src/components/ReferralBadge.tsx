'use client'
import { useState } from 'react'

interface ReferralBadgeProps {
  vendorName?: string
  compact?: boolean
}

export default function ReferralBadge({ vendorName, compact = false }: ReferralBadgeProps) {
  const [expanded, setExpanded] = useState(false)

  if (compact) {
    return (
      <span
        title="AbarVa referral partner — disclosed, does not affect scoring. View methodology."
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '4px',
          fontSize: '11px',
          color: '#6B7280',
          background: '#F9FAFB',
          border: '1px solid #E5E7EB',
          borderRadius: '4px',
          padding: '2px 6px',
          cursor: 'default',
          whiteSpace: 'nowrap',
        }}
      >
        <span style={{ color: '#D97706' }}>★</span>
        <span>Referral partner</span>
      </span>
    )
  }

  return (
    <div style={{ marginTop: '8px' }}>
      <button
        onClick={() => setExpanded(e => !e)}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '6px',
          fontSize: '11px',
          color: '#6B7280',
          background: 'transparent',
          border: 'none',
          cursor: 'pointer',
          padding: 0,
          textAlign: 'left',
        }}
      >
        <span style={{ color: '#D97706', fontSize: '12px' }}>★</span>
        <span>
          {vendorName ? `${vendorName} is an` : 'This vendor is an'} AbarVa referral partner — disclosed, does not affect scoring
        </span>
        <span style={{ fontSize: '10px', color: '#9CA3AF' }}>{expanded ? '▲' : '▼'}</span>
      </button>
      {expanded && (
        <div style={{
          marginTop: '6px',
          padding: '10px 12px',
          background: '#FFFBEB',
          border: '1px solid #FDE68A',
          borderRadius: '6px',
          fontSize: '12px',
          color: '#92400E',
          lineHeight: 1.6,
        }}>
          <p style={{ margin: '0 0 6px 0' }}>
            AbarVa earns a referral fee when clients engage vendors marked ★.
            This relationship is disclosed on every card and does not affect the vendor&apos;s score.
          </p>
          <p style={{ margin: 0 }}>
            Scores are calculated from objective criteria: ecosystem fit, compliance posture, cost, client skill readiness, and historical implementation risk.{' '}
            <a
              href="/methodology"
              style={{ color: '#D97706', textDecoration: 'underline' }}
            >
              View scoring methodology →
            </a>
          </p>
        </div>
      )}
    </div>
  )
}
