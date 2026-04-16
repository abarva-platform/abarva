'use client'

import React, { useState } from 'react'

interface MarginLever {
  id: string
  category: string
  lever: string
  opportunity_min_m: number | null
  opportunity_max_m: number | null
  genome_confidence: number | null
  status: 'analysed' | 'genome_estimate' | 'unlock_required'
  data_required: string[]
  key_finding: string | null
  wave: 1 | 2 | 3
}

interface MarginOpportunityMapProps {
  clientId: string
  engagementId: string
  levers: MarginLever[]
  onUploadRequest?: (leverId: string, dataRequired: string[]) => void
  onNumbersEntry?: (leverId: string) => void
}

const BG = '#060A12'
const CARD = '#0D1520'
const BORDER = '#1C2D45'
const TEAL = '#2DD4C8'
const WHITE = '#EFF6FF'
const MUTED = '#94A3B8'
const AMBER = '#F59E0B'
const GREEN = '#34D399'
const RED = '#EF4444'
const MONO = 'JetBrains Mono, monospace'
const SANS = 'DM Sans, sans-serif'

const CATEGORIES = ['All', 'AI Portfolio', 'IT Cost', 'Middle Office', 'Revenue', 'Operations']

function formatRange(min: number | null, max: number | null): string {
  if (min === null || max === null) return '—'
  if (min === max) return `$${min}M`
  return `$${min}–${max}M`
}

function ConfidenceBar({ confidence, status }: { confidence: number | null; status: MarginLever['status'] }) {
  const pct = confidence ? Math.round(confidence * 100) : 0
  const color = status === 'analysed' ? TEAL : AMBER
  const isDashed = status === 'genome_estimate'

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 6 }}>
      <div
        style={{
          flex: 1,
          height: 4,
          background: BORDER,
          borderRadius: 2,
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {status !== 'unlock_required' && (
          <div
            style={{
              position: 'absolute',
              left: 0,
              top: 0,
              height: '100%',
              width: `${pct}%`,
              background: color,
              borderRadius: 2,
              backgroundImage: isDashed
                ? `repeating-linear-gradient(90deg, ${color} 0 6px, transparent 6px 10px)`
                : undefined,
            }}
          />
        )}
      </div>
      {status !== 'unlock_required' && confidence !== null && (
        <span style={{ fontFamily: MONO, fontSize: 11, color: MUTED, whiteSpace: 'nowrap' }}>
          {pct}% confidence
        </span>
      )}
    </div>
  )
}

function StatusDot({ status }: { status: MarginLever['status'] }) {
  const color = status === 'analysed' ? TEAL : status === 'genome_estimate' ? AMBER : BORDER
  return (
    <div
      style={{
        width: 8,
        height: 8,
        borderRadius: '50%',
        background: color,
        border: status === 'unlock_required' ? `1.5px solid ${MUTED}` : undefined,
        flexShrink: 0,
        marginTop: 2,
      }}
    />
  )
}

function CategoryCompleteness({ levers }: { levers: MarginLever[] }) {
  return (
    <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
      {levers.map((l) => (
        <span
          key={l.id}
          title={l.lever}
          style={{
            display: 'inline-block',
            width: 7,
            height: 7,
            borderRadius: '50%',
            background: l.status === 'analysed' ? TEAL : l.status === 'genome_estimate' ? AMBER : 'transparent',
            border: l.status !== 'analysed' ? `1.5px solid ${MUTED}` : undefined,
            flexShrink: 0,
          }}
        />
      ))}
    </div>
  )
}

function LeverCard({
  lever,
  onUploadRequest,
  onNumbersEntry,
}: {
  lever: MarginLever
  onUploadRequest?: (leverId: string, dataRequired: string[]) => void
  onNumbersEntry?: (leverId: string) => void
}) {
  const borderColor =
    lever.status === 'analysed' ? TEAL : lever.status === 'genome_estimate' ? AMBER : BORDER

  return (
    <div
      style={{
        background: CARD,
        border: `1px solid ${BORDER}`,
        borderLeft: `3px solid ${borderColor}`,
        borderRadius: 6,
        padding: '14px 16px',
        display: 'flex',
        flexDirection: 'column',
        gap: 6,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
        <StatusDot status={lever.status} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              fontFamily: SANS,
              fontSize: 13,
              fontWeight: 500,
              color: WHITE,
              lineHeight: 1.4,
            }}
          >
            {lever.lever}
          </div>

          {lever.status === 'analysed' && (
            <>
              <div
                style={{
                  fontFamily: MONO,
                  fontSize: 13,
                  color: WHITE,
                  marginTop: 4,
                }}
              >
                {formatRange(lever.opportunity_min_m, lever.opportunity_max_m)}
              </div>
              <ConfidenceBar confidence={lever.genome_confidence} status={lever.status} />
              {lever.key_finding && (
                <p
                  style={{
                    fontFamily: SANS,
                    fontSize: 12,
                    color: MUTED,
                    fontStyle: 'italic',
                    margin: '6px 0 0',
                    lineHeight: 1.5,
                  }}
                >
                  {lever.key_finding}
                </p>
              )}
            </>
          )}

          {lever.status === 'genome_estimate' && (
            <>
              <div
                style={{
                  fontFamily: MONO,
                  fontSize: 13,
                  color: WHITE,
                  marginTop: 4,
                }}
              >
                Typical: {formatRange(lever.opportunity_min_m, lever.opportunity_max_m)}
              </div>
              <ConfidenceBar confidence={lever.genome_confidence} status={lever.status} />
              <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                <button
                  onClick={() => onUploadRequest?.(lever.id, lever.data_required)}
                  style={{
                    background: 'transparent',
                    border: `1px solid ${TEAL}`,
                    borderRadius: 4,
                    color: TEAL,
                    fontFamily: SANS,
                    fontSize: 12,
                    padding: '5px 10px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 4,
                  }}
                >
                  Upload data for precise analysis →
                </button>
                <button
                  onClick={() => onNumbersEntry?.(lever.id)}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: MUTED,
                    fontFamily: SANS,
                    fontSize: 12,
                    cursor: 'pointer',
                    textDecoration: 'underline',
                    padding: 0,
                  }}
                >
                  Enter 3 numbers instead
                </button>
              </div>
            </>
          )}

          {lever.status === 'unlock_required' && (
            <>
              <div style={{ marginTop: 4 }}>
                <ConfidenceBar confidence={null} status={lever.status} />
                <div style={{ marginTop: 6 }}>
                  <span
                    style={{
                      fontFamily: SANS,
                      fontSize: 11,
                      color: MUTED,
                      textTransform: 'uppercase',
                      letterSpacing: '0.06em',
                    }}
                  >
                    Upload required:
                  </span>
                  <ul style={{ margin: '4px 0 0', padding: '0 0 0 16px' }}>
                    {lever.data_required.map((d) => (
                      <li
                        key={d}
                        style={{
                          fontFamily: SANS,
                          fontSize: 12,
                          color: MUTED,
                          lineHeight: 1.6,
                        }}
                      >
                        {d}
                      </li>
                    ))}
                  </ul>
                </div>
                <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                  <button
                    onClick={() => onUploadRequest?.(lever.id, lever.data_required)}
                    style={{
                      background: 'transparent',
                      border: `1px solid ${BORDER}`,
                      borderRadius: 4,
                      color: WHITE,
                      fontFamily: SANS,
                      fontSize: 12,
                      padding: '5px 10px',
                      cursor: 'pointer',
                    }}
                  >
                    Upload data to unlock
                  </button>
                  <button
                    onClick={() => onNumbersEntry?.(lever.id)}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: MUTED,
                      fontFamily: SANS,
                      fontSize: 12,
                      cursor: 'pointer',
                      textDecoration: 'underline',
                      padding: 0,
                    }}
                  >
                    Enter 3 numbers instead
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export default function MarginOpportunityMap({
  clientId,
  engagementId,
  levers,
  onUploadRequest,
  onNumbersEntry,
}: MarginOpportunityMapProps) {
  const [activeCategory, setActiveCategory] = useState<string>('All')

  const analysedLevers = levers.filter((l) => l.status === 'analysed')
  const estimateLevers = levers.filter((l) => l.status === 'genome_estimate')

  const analysedMinTotal = analysedLevers.reduce((s, l) => s + (l.opportunity_min_m ?? 0), 0)
  const analysedMaxTotal = analysedLevers.reduce((s, l) => s + (l.opportunity_max_m ?? 0), 0)
  const estimateMinTotal = estimateLevers.reduce((s, l) => s + (l.opportunity_min_m ?? 0), 0)
  const estimateMaxTotal = estimateLevers.reduce((s, l) => s + (l.opportunity_max_m ?? 0), 0)

  const filtered =
    activeCategory === 'All' ? levers : levers.filter((l) => l.category === activeCategory)

  const byCategory: Record<string, MarginLever[]> = {}
  for (const l of filtered) {
    if (!byCategory[l.category]) byCategory[l.category] = []
    byCategory[l.category].push(l)
  }

  return (
    <div
      style={{
        background: BG,
        fontFamily: SANS,
        padding: 24,
        borderRadius: 8,
        border: `1px solid ${BORDER}`,
      }}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 12,
          marginBottom: 20,
        }}
      >
        <div>
          <div
            style={{
              fontFamily: MONO,
              fontSize: 11,
              color: TEAL,
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              marginBottom: 4,
            }}
          >
            Margin Opportunity Map
          </div>
          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
            <span style={{ fontFamily: SANS, fontSize: 13, color: WHITE }}>
              <span style={{ fontFamily: MONO }}>
                ${analysedMinTotal}–{analysedMaxTotal}M
              </span>{' '}
              already analysed
            </span>
            <span style={{ color: MUTED }}>·</span>
            <span style={{ fontFamily: SANS, fontSize: 13, color: WHITE }}>
              <span style={{ fontFamily: MONO }}>
                ${estimateMinTotal}–{estimateMaxTotal}M
              </span>{' '}
              available with data
            </span>
          </div>
        </div>
      </div>

      {/* Category filter pills */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 20 }}>
        {CATEGORIES.map((cat) => {
          const active = cat === activeCategory
          return (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              style={{
                background: active ? TEAL : 'transparent',
                border: `1px solid ${active ? TEAL : BORDER}`,
                borderRadius: 20,
                color: active ? BG : MUTED,
                fontFamily: SANS,
                fontSize: 12,
                fontWeight: active ? 600 : 400,
                padding: '5px 12px',
                cursor: 'pointer',
                transition: 'all 0.15s',
              }}
            >
              {cat}
            </button>
          )
        })}
      </div>

      {/* Lever groups */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
        {Object.entries(byCategory).map(([category, categoryLevers]) => (
          <div key={category}>
            {/* Category header */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: 10,
                paddingBottom: 8,
                borderBottom: `1px solid ${BORDER}`,
              }}
            >
              <span
                style={{
                  fontFamily: MONO,
                  fontSize: 11,
                  color: MUTED,
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                }}
              >
                {category}
              </span>
              <CategoryCompleteness levers={categoryLevers} />
            </div>

            {/* Lever cards */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {categoryLevers.map((lever) => (
                <LeverCard
                  key={lever.id}
                  lever={lever}
                  onUploadRequest={onUploadRequest}
                  onNumbersEntry={onNumbersEntry}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
