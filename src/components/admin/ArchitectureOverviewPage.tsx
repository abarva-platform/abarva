'use client'

import { buildArchitectureOverview, type ArchitectureWaveSummary } from '@/lib/admin/architecture-overview'

// ── Design tokens (AbarVa canon) ─────────────────────────────────────────────
const BG      = '#FAFAF9'
const DARK    = '#0F0E0D'
const TEXT    = '#3D3B38'
const MUTED   = '#706D66'
const BORDER  = '#E8E6E3'
const ACCENT  = '#1E3A5F'
const BG2     = '#F2F1EE'
const SANS    = 'DM Sans, sans-serif'
const SERIF   = 'Georgia, serif'
const MONO    = "'Courier New', monospace"

// Status chip colours
const STATUS_STYLES: Record<string, { bg: string; color: string }> = {
  merged:      { bg: '#DCFCE7', color: '#166534' },
  in_progress: { bg: '#FEF9C3', color: '#92400E' },
  planned:     { bg: '#F3F4F6', color: '#6B7280' },
  blocked:     { bg: '#FEE2E2', color: '#991B1B' },
  deferred:    { bg: '#F3F4F6', color: '#6B7280' },
}

function statusStyle(status: string) {
  return STATUS_STYLES[status] ?? STATUS_STYLES['planned']
}

function StatusChip({ status }: { status: string }) {
  const s = statusStyle(status)
  const label = status === 'in_progress' ? 'In Progress' : status.charAt(0).toUpperCase() + status.slice(1)
  return (
    <span
      style={{
        display: 'inline-block',
        fontSize: '11px',
        fontWeight: 600,
        padding: '2px 9px',
        borderRadius: '10px',
        background: s.bg,
        color: s.color,
        whiteSpace: 'nowrap',
      }}
    >
      {label}
    </span>
  )
}

function ProgressBar({ pct }: { pct: number }) {
  const clamped = Math.max(0, Math.min(100, pct))
  return (
    <div
      style={{
        width: '100%',
        height: '6px',
        background: BORDER,
        borderRadius: '3px',
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          width: `${clamped}%`,
          height: '100%',
          background: clamped === 100 ? '#166534' : clamped > 0 ? ACCENT : BORDER,
          borderRadius: '3px',
          transition: 'width 0.3s ease',
        }}
      />
    </div>
  )
}

function StatCard({
  label,
  value,
  sub,
}: {
  label: string
  value: string | number
  sub?: string
}) {
  return (
    <div
      style={{
        background: '#ffffff',
        border: `1px solid ${BORDER}`,
        borderRadius: '8px',
        padding: '20px 22px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
      }}
    >
      <div
        style={{
          fontSize: '10px',
          fontWeight: 700,
          color: MUTED,
          textTransform: 'uppercase',
          letterSpacing: '0.08em',
          fontFamily: MONO,
          marginBottom: '8px',
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontSize: '28px',
          fontWeight: 600,
          color: DARK,
          lineHeight: 1,
          marginBottom: '4px',
          fontFamily: SERIF,
        }}
      >
        {value}
      </div>
      {sub && (
        <div style={{ fontSize: '12px', color: MUTED }}>{sub}</div>
      )}
    </div>
  )
}

function WaveRow({ wave }: { wave: ArchitectureWaveSummary }) {
  return (
    <tr
      style={{ borderBottom: `1px solid ${BG2}` }}
    >
      <td
        style={{
          padding: '12px 16px',
          fontSize: '13px',
          fontWeight: 600,
          color: DARK,
          fontFamily: MONO,
          whiteSpace: 'nowrap',
        }}
      >
        {wave.waveId}
      </td>
      <td
        style={{
          padding: '12px 16px',
          fontSize: '13px',
          color: TEXT,
          maxWidth: '420px',
        }}
      >
        {wave.title}
      </td>
      <td style={{ padding: '12px 16px', whiteSpace: 'nowrap' }}>
        <StatusChip status={wave.status} />
      </td>
      <td style={{ padding: '12px 16px', width: '140px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ flex: 1 }}>
            <ProgressBar pct={wave.percentComplete} />
          </div>
          <span
            style={{
              fontSize: '11px',
              color: MUTED,
              fontFamily: MONO,
              minWidth: '34px',
              textAlign: 'right',
            }}
          >
            {wave.percentComplete}%
          </span>
        </div>
      </td>
    </tr>
  )
}

export function ArchitectureOverviewPage() {
  const data = buildArchitectureOverview()

  return (
    <div
      style={{
        background: BG,
        minHeight: '100%',
        fontFamily: SANS,
        color: DARK,
      }}
    >
      {/* ── Page header ────────────────────────────────────────────── */}
      <div
        style={{
          paddingBottom: '20px',
          borderBottom: `1px solid ${BORDER}`,
          marginBottom: '28px',
        }}
      >
        <div
          style={{
            fontSize: '10px',
            fontWeight: 700,
            color: MUTED,
            textTransform: 'uppercase',
            letterSpacing: '0.1em',
            fontFamily: MONO,
            marginBottom: '6px',
          }}
        >
          Admin · ARCH4
        </div>
        <div
          style={{
            fontSize: '26px',
            fontWeight: 600,
            color: DARK,
            fontFamily: SERIF,
            marginBottom: '4px',
          }}
        >
          Architecture Overview
        </div>
        <div style={{ fontSize: '14px', color: MUTED }}>
          Nexus build history and system layers
        </div>
      </div>

      {/* ── Stat cards ────────────────────────────────────────────── */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: '14px',
          marginBottom: '36px',
        }}
      >
        <StatCard
          label="Total Waves"
          value={data.totalWaves}
          sub="Wave-0 through Wave-15"
        />
        <StatCard
          label="Merged Waves"
          value={data.mergedWaves}
          sub={`${data.totalWaves - data.mergedWaves} in progress / planned`}
        />
        <StatCard
          label="Total Slices"
          value={data.totalSlices}
          sub="Across all waves"
        />
        <StatCard
          label="Build Date"
          value={data.buildDate}
          sub="Static manifest snapshot"
        />
      </div>

      {/* ── System Layers ────────────────────────────────────────── */}
      <div style={{ marginBottom: '36px' }}>
        <div
          style={{
            fontSize: '10px',
            fontWeight: 700,
            color: MUTED,
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            fontFamily: MONO,
            marginBottom: '14px',
          }}
        >
          System Layers
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '14px',
          }}
        >
          {data.layers.map(layer => (
            <div
              key={layer.layerId}
              style={{
                background: '#ffffff',
                border: `1px solid ${BORDER}`,
                borderRadius: '8px',
                padding: '18px 20px',
                boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
              }}
            >
              {/* Layer header */}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  marginBottom: '8px',
                }}
              >
                <div
                  style={{
                    fontSize: '15px',
                    fontWeight: 600,
                    color: DARK,
                  }}
                >
                  {layer.name}
                </div>
                <span
                  style={{
                    fontSize: '11px',
                    fontWeight: 600,
                    color: ACCENT,
                    background: '#EEF2F8',
                    padding: '2px 8px',
                    borderRadius: '4px',
                    whiteSpace: 'nowrap',
                    marginLeft: '8px',
                    flexShrink: 0,
                  }}
                >
                  {layer.waveRange}
                </span>
              </div>

              {/* Description */}
              <div
                style={{
                  fontSize: '13px',
                  color: MUTED,
                  marginBottom: '12px',
                  lineHeight: 1.5,
                }}
              >
                {layer.description}
              </div>

              {/* Key modules */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                {layer.keyModules.map(mod => (
                  <span
                    key={mod}
                    style={{
                      fontSize: '11px',
                      fontWeight: 500,
                      color: TEXT,
                      background: BG2,
                      border: `1px solid ${BORDER}`,
                      padding: '2px 8px',
                      borderRadius: '4px',
                      fontFamily: MONO,
                    }}
                  >
                    {mod}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Wave History ────────────────────────────────────────────── */}
      <div style={{ marginBottom: '36px' }}>
        <div
          style={{
            fontSize: '10px',
            fontWeight: 700,
            color: MUTED,
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            fontFamily: MONO,
            marginBottom: '14px',
          }}
        >
          Wave History
        </div>

        <div
          style={{
            background: '#ffffff',
            border: `1px solid ${BORDER}`,
            borderRadius: '8px',
            overflow: 'hidden',
            boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
          }}
        >
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: BG2 }}>
                {['Wave', 'Title', 'Status', 'Progress'].map(h => (
                  <th
                    key={h}
                    style={{
                      padding: '9px 16px',
                      fontSize: '10px',
                      fontWeight: 700,
                      color: MUTED,
                      textTransform: 'uppercase',
                      letterSpacing: '0.08em',
                      fontFamily: MONO,
                      textAlign: 'left',
                      borderBottom: `1px solid ${BORDER}`,
                    }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.waveSummaries.map(wave => (
                <WaveRow key={wave.waveId} wave={wave} />
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Caveat footer ──────────────────────────────────────────── */}
      <div
        style={{
          padding: '12px 16px',
          background: BG2,
          border: `1px solid ${BORDER}`,
          borderRadius: '6px',
          fontSize: '12px',
          color: MUTED,
          lineHeight: 1.6,
        }}
      >
        <span style={{ fontWeight: 600, fontFamily: MONO, marginRight: '6px' }}>Note:</span>
        {data.caveat}
      </div>
    </div>
  )
}

export default ArchitectureOverviewPage
