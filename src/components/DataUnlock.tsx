'use client'
import { useState } from 'react'
import { calculateConfidence, getQueryCategory } from '@/lib/confidence'

interface DataUnlockProps {
  orgId: string
  queryText: string
  responseGeneratedAt?: string  // ISO timestamp — if older than current data_version, show refresh
  onRefresh?: () => void
  dataVersion?: string          // current org data_version from server
}

export default function DataUnlock({ orgId, queryText, responseGeneratedAt, onRefresh, dataVersion }: DataUnlockProps) {
  const [expanded, setExpanded] = useState(false)

  const category = getQueryCategory(queryText)
  const confidence = calculateConfidence(orgId, category)

  const hasNewerData = !!(responseGeneratedAt && dataVersion && dataVersion > responseGeneratedAt)

  const confidenceBarColor =
    confidence.score >= 80 ? '#059669' :
    confidence.score >= 60 ? '#D97706' :
    '#DC2626'

  const bgColor =
    confidence.score >= 80 ? '#05906910' :
    confidence.score >= 60 ? '#D9770610' :
    '#DC262610'

  const borderColor =
    confidence.score >= 80 ? '#05906930' :
    confidence.score >= 60 ? '#D9770630' :
    '#DC262630'

  return (
    <div style={{
      marginTop: '16px',
      background: bgColor,
      border: `1px solid ${borderColor}`,
      borderRadius: '10px',
      overflow: 'hidden',
      fontFamily: 'Inter, sans-serif',
    }}>
      {/* Refresh banner — only shown when newer data exists */}
      {hasNewerData && (
        <div style={{
          background: '#4DA3FF18',
          borderBottom: '1px solid #4DA3FF30',
          padding: '10px 16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '12px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '14px' }}>⟳</span>
            <span style={{ fontSize: '13px', color: '#4DA3FF' }}>
              New data available — this analysis can be updated with higher confidence
            </span>
          </div>
          {onRefresh && (
            <button
              onClick={onRefresh}
              style={{
                padding: '6px 14px', background: '#4DA3FF', color: '#0D1117',
                border: 'none', borderRadius: '6px', fontSize: '12px', fontWeight: 700,
                cursor: 'pointer', fontFamily: 'inherit', flexShrink: 0,
              }}
            >
              Refresh analysis →
            </button>
          )}
        </div>
      )}

      {/* Confidence bar row */}
      <div
        style={{ padding: '12px 16px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '12px' }}
        onClick={() => setExpanded(e => !e)}
      >
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
            <span style={{ fontSize: '12px', fontWeight: 700, color: confidenceBarColor }}>
              Data confidence: {confidence.score}% — {confidence.label}
            </span>
            <span style={{ fontSize: '11px', color: '#8B949E' }}>
              {expanded ? '▲ Less' : '▼ Details'}
            </span>
          </div>
          <div style={{ height: '4px', background: '#21262D', borderRadius: '2px' }}>
            <div style={{
              height: '4px',
              borderRadius: '2px',
              width: `${confidence.score}%`,
              background: confidenceBarColor,
              transition: 'width 600ms ease',
            }} />
          </div>
        </div>
      </div>

      {/* Expanded detail */}
      {expanded && (
        <div style={{ padding: '0 16px 16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {/* Loaded items */}
          {confidence.loaded.length > 0 && (
            <div>
              <div style={{ fontSize: '11px', fontWeight: 700, color: '#8B949E', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '6px' }}>Based on</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                {confidence.loaded.map(item => (
                  <span
                    key={item.category}
                    style={{
                      fontSize: '11px', padding: '3px 8px', borderRadius: '4px',
                      background: '#05906918', color: '#6EE7B7',
                      border: '1px solid #05906930',
                    }}
                  >
                    ✓ {item.label}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Missing items */}
          {confidence.missing.length > 0 && (
            <div>
              <div style={{ fontSize: '11px', fontWeight: 700, color: '#8B949E', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '6px' }}>Missing data</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {confidence.missing.slice(0, 3).map(item => (
                  <div
                    key={item.category}
                    style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      padding: '8px 10px', background: '#0D1117', borderRadius: '6px',
                      border: '1px solid #21262D',
                    }}
                  >
                    <span style={{ fontSize: '12px', color: '#8B949E' }}>
                      ✗ {item.label}
                    </span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '11px', color: '#F59E0B', fontWeight: 600 }}>
                        +{item.contribution}%
                      </span>
                      <button style={{
                        padding: '3px 10px', background: '#30363D', color: '#C9D1D9',
                        border: 'none', borderRadius: '4px', fontSize: '11px', fontWeight: 600,
                        cursor: 'pointer', fontFamily: 'inherit',
                      }}>
                        Upload
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Top upgrade CTA */}
          {confidence.topUpgrade && (
            <div style={{
              padding: '10px 12px', background: '#F59E0B10', border: '1px solid #F59E0B30',
              borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px',
            }}>
              <span style={{ fontSize: '12px', color: '#C9D1D9' }}>
                {confidence.topUpgrade.action} → {confidence.topUpgrade.reason}{' '}
                <span style={{ color: '#F59E0B', fontWeight: 700 }}>
                  (+{confidence.topUpgrade.delta}% confidence)
                </span>
              </span>
              <button style={{
                padding: '6px 12px', background: '#F59E0B', color: '#0D1117',
                border: 'none', borderRadius: '6px', fontSize: '11px', fontWeight: 800,
                cursor: 'pointer', fontFamily: 'inherit', flexShrink: 0,
              }}>
                Upload →
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
