// ADM8 · Agent Readiness Deep Drill UI
// React Server Component — no 'use client'.
// Renders deterministic agent readiness state for all 4 AbarVa agents.
// Follows AbarVa Visual Canon (DES1): off-white surface, dark navy accent,
// no large avatars, no AI sparkles, no Sanskrit symbols.

import type { CSSProperties } from 'react'
import {
  buildAgentReadinessDeepDrill,
  type AgentReadinessFactor,
  type AgentReadinessLevel,
  type AgentReadinessRecord,
} from '../../lib/admin/agent-readiness-deep-drill'
import { BORDER, COLORS, FONT, RADIUS, SPACING, TYPE } from '@/lib/design/abarva-theme'

// ── Layout constants ──────────────────────────────────────────────────────

const pageStyle: CSSProperties = {
  minHeight: '100vh',
  background: COLORS.surface,
  color: COLORS.ink,
  fontFamily: FONT.body,
}

const shellStyle: CSSProperties = {
  maxWidth: 1240,
  margin: '0 auto',
  padding: `${SPACING.xxxl}px ${SPACING.xxl}px`,
  display: 'grid',
  gap: SPACING.xl,
}

const cardStyle: CSSProperties = {
  background: COLORS.card,
  border: BORDER.hairline,
  borderRadius: RADIUS.md,
  boxShadow: '0 12px 32px rgba(10, 12, 18, 0.04)',
}

const sectionHeaderStyle: CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'end',
  gap: SPACING.lg,
}

const thStyle: CSSProperties = {
  ...TYPE.eyebrow,
  padding: `${SPACING.sm}px ${SPACING.md}px`,
  textAlign: 'left',
  borderBottom: BORDER.hairline,
  background: COLORS.surface2,
  whiteSpace: 'nowrap',
}

const tdStyle: CSSProperties = {
  ...TYPE.caption,
  color: COLORS.body,
  padding: `${SPACING.sm}px ${SPACING.md}px`,
  borderBottom: BORDER.hairlineSoft,
  verticalAlign: 'top',
}

// ── Status pill helper ────────────────────────────────────────────────────

function readinessTone(level: AgentReadinessLevel): {
  fg: string
  bg: string
  ring: string
} {
  switch (level) {
    case 'ready':
      return { fg: COLORS.navy, bg: COLORS.navySoft, ring: COLORS.navy }
    case 'partial':
      return { fg: COLORS.amber, bg: COLORS.amberSoft, ring: COLORS.amber }
    case 'blocked':
      return { fg: COLORS.red, bg: COLORS.redSoft, ring: COLORS.red }
    case 'deferred':
    default:
      return { fg: COLORS.muted, bg: 'rgba(82, 88, 102, 0.10)', ring: COLORS.mutedSoft }
  }
}

function ReadinessPill({ level }: { level: AgentReadinessLevel }) {
  const tone = readinessTone(level)
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        width: 'fit-content',
        borderRadius: RADIUS.pill,
        padding: '3px 9px',
        fontFamily: FONT.mono,
        fontSize: 10,
        fontWeight: 700,
        textTransform: 'uppercase' as const,
        letterSpacing: '0.06em',
        color: tone.fg,
        background: tone.bg,
        border: `1px solid ${tone.ring}`,
        whiteSpace: 'nowrap' as const,
      }}
    >
      {level}
    </span>
  )
}

// ── System dimension bar ──────────────────────────────────────────────────

function SystemDimensionRow({
  label,
  level,
}: {
  label: string
  level: AgentReadinessLevel
}) {
  const tone = readinessTone(level)
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: SPACING.md,
        paddingTop: SPACING.sm,
        borderTop: BORDER.hairlineSoft,
      }}
    >
      <span style={{ ...TYPE.caption, color: COLORS.body }}>{label}</span>
      <ReadinessPill level={level} />
    </div>
  )
}

// ── Agent factor table ────────────────────────────────────────────────────

function AgentFactorsTable({ factors }: { factors: AgentReadinessFactor[] }) {
  return (
    <div
      style={{
        overflowX: 'auto' as const,
        border: BORDER.hairline,
        borderRadius: RADIUS.sm,
      }}
    >
      <table style={{ width: '100%', borderCollapse: 'collapse' as const }}>
        <thead>
          <tr>
            <th style={{ ...thStyle, minWidth: 160 }}>Factor</th>
            <th style={{ ...thStyle, minWidth: 100 }}>Status</th>
            <th style={thStyle}>Note</th>
          </tr>
        </thead>
        <tbody>
          {factors.map((f) => (
            <tr key={f.factor}>
              <td style={{ ...tdStyle, fontFamily: FONT.mono, fontSize: 11, color: COLORS.ink }}>
                {f.factor}
              </td>
              <td style={tdStyle}>
                <ReadinessPill level={f.status} />
              </td>
              <td style={{ ...tdStyle, maxWidth: 560 }}>{f.note}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

// ── Agent card ────────────────────────────────────────────────────────────

function AgentCard({ agent }: { agent: AgentReadinessRecord }) {
  return (
    <div
      style={{
        ...cardStyle,
        padding: SPACING.xl,
        display: 'grid',
        gap: SPACING.md,
      }}
    >
      {/* Card header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          gap: SPACING.md,
          flexWrap: 'wrap' as const,
        }}
      >
        <div style={{ display: 'grid', gap: SPACING.xs }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: SPACING.sm }}>
            <span
              style={{
                ...TYPE.eyebrow,
                fontFamily: FONT.mono,
                color: COLORS.navy,
                background: COLORS.navySoft,
                border: `1px solid ${COLORS.navy}`,
                borderRadius: RADIUS.sm,
                padding: '2px 7px',
              }}
            >
              {agent.agentId.toUpperCase()}
            </span>
            <span
              style={{
                ...TYPE.caption,
                fontFamily: FONT.mono,
                color: COLORS.muted,
                background: COLORS.surface2,
                border: BORDER.hairline,
                borderRadius: RADIUS.sm,
                padding: '2px 7px',
              }}
            >
              {agent.missionType}
            </span>
          </div>
          <h3 style={{ ...TYPE.h3, margin: 0, letterSpacing: 0 }}>{agent.agentName}</h3>
        </div>
        <ReadinessPill level={agent.readinessLevel} />
      </div>

      {/* Factors table */}
      <AgentFactorsTable factors={agent.factors} />

      {/* Blockers + next action */}
      {agent.blockers.length > 0 && (
        <div style={{ display: 'grid', gap: SPACING.xs }}>
          <div style={{ ...TYPE.eyebrow, color: COLORS.red }}>Blockers</div>
          <div style={{ display: 'grid', gap: SPACING.xs }}>
            {agent.blockers.map((blocker, idx) => (
              <div
                key={idx}
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: SPACING.sm,
                  ...TYPE.caption,
                  color: COLORS.body,
                }}
              >
                <span
                  style={{
                    fontFamily: FONT.mono,
                    fontSize: 10,
                    color: COLORS.red,
                    flexShrink: 0,
                    marginTop: 1,
                  }}
                >
                  {String(idx + 1).padStart(2, '0')}
                </span>
                {blocker}
              </div>
            ))}
          </div>
        </div>
      )}

      <div
        style={{
          paddingTop: SPACING.sm,
          borderTop: BORDER.hairlineSoft,
        }}
      >
        <span style={{ ...TYPE.eyebrow, color: COLORS.navy }}>Next action </span>
        <span style={{ ...TYPE.caption, color: COLORS.body }}>{agent.nextAction}</span>
      </div>
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────

export function AgentReadinessDeepDrill() {
  const drill = buildAgentReadinessDeepDrill()

  return (
    <main style={pageStyle}>
      <div style={shellStyle}>

        {/* Header */}
        <header
          style={{
            ...cardStyle,
            padding: SPACING.xxl,
            display: 'grid',
            gap: SPACING.lg,
          }}
        >
          <div style={TYPE.eyebrow}>Agent Readiness · ADM8</div>
          <div style={{ display: 'grid', gap: SPACING.sm }}>
            <h1 style={{ ...TYPE.h1, margin: 0, fontSize: 32, letterSpacing: 0 }}>
              Agent Readiness Deep Drill
            </h1>
            <p style={{ ...TYPE.body, margin: 0, maxWidth: 760, color: COLORS.body }}>
              Deterministic readiness inventory for all four AbarVa agents — Nexus, Sentinel,
              Atlas, and Steward. Each agent is assessed across its key readiness factors,
              active blockers, and recommended next action.
            </p>
          </div>

          {/* Deterministic source caption — prominently displayed */}
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: SPACING.sm,
              padding: `${SPACING.sm}px ${SPACING.md}px`,
              background: COLORS.surface2,
              border: BORDER.hairline,
              borderRadius: RADIUS.md,
              width: 'fit-content',
            }}
          >
            <span
              style={{
                fontFamily: FONT.mono,
                fontSize: 10,
                fontWeight: 700,
                color: COLORS.amber,
                textTransform: 'uppercase' as const,
                letterSpacing: '0.07em',
              }}
            >
              Source
            </span>
            <span style={{ ...TYPE.caption, color: COLORS.body }}>
              {drill.deterministicSourceCaption}
            </span>
            <span style={{ ...TYPE.caption, color: COLORS.muted }}>
              {drill.generatedAt}
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: SPACING.md, flexWrap: 'wrap' as const }}>
            <div style={{ display: 'grid', gap: 2 }}>
              <span style={{ ...TYPE.eyebrow }}>Overall readiness</span>
              <ReadinessPill level={drill.overallReadiness} />
            </div>
          </div>
        </header>

        {/* System-level dimensions */}
        <section
          style={{
            ...cardStyle,
            padding: SPACING.xl,
            display: 'grid',
            gap: SPACING.md,
          }}
        >
          <div style={sectionHeaderStyle}>
            <div>
              <div style={TYPE.eyebrow}>System Dimensions</div>
              <h2 style={{ ...TYPE.h2, margin: 0, letterSpacing: 0 }}>
                Platform-level readiness by dimension
              </h2>
            </div>
          </div>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
              gap: SPACING.md,
            }}
          >
            {[
              { label: 'Mission Queue', level: drill.missionQueueReadiness },
              { label: 'Context Injection', level: drill.contextReadiness },
              { label: 'Evidence Integration', level: drill.evidenceReadiness },
              { label: 'Model Gateway', level: drill.modelGatewayReadiness },
              { label: 'Tool Registry', level: drill.toolRegistryReadiness },
            ].map(({ label, level }) => (
              <div
                key={label}
                style={{
                  background: COLORS.surface2,
                  border: BORDER.hairline,
                  borderRadius: RADIUS.sm,
                  padding: SPACING.md,
                  display: 'grid',
                  gap: SPACING.xs,
                }}
              >
                <SystemDimensionRow label={label} level={level} />
              </div>
            ))}
          </div>
        </section>

        {/* Agent cards grid */}
        <section style={{ display: 'grid', gap: SPACING.md }}>
          <div style={sectionHeaderStyle}>
            <div>
              <div style={TYPE.eyebrow}>Agent Drill-down</div>
              <h2 style={{ ...TYPE.h2, margin: 0, letterSpacing: 0 }}>
                Readiness factors per agent
              </h2>
            </div>
            <span style={{ ...TYPE.caption, fontFamily: FONT.mono }}>
              {drill.agents.length} agents
            </span>
          </div>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(480px, 1fr))',
              gap: SPACING.lg,
            }}
          >
            {drill.agents.map((agent) => (
              <AgentCard key={agent.agentId} agent={agent} />
            ))}
          </div>
        </section>

        {/* Top blockers + next action */}
        <section
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))',
            gap: SPACING.lg,
          }}
        >
          <div
            style={{
              ...cardStyle,
              padding: SPACING.xl,
              display: 'grid',
              gap: SPACING.md,
            }}
          >
            <div>
              <div style={TYPE.eyebrow}>Top Blockers</div>
              <h2 style={{ ...TYPE.h2, margin: 0, letterSpacing: 0 }}>
                What blocks agent readiness
              </h2>
            </div>
            <div style={{ display: 'grid', gap: SPACING.sm }}>
              {drill.topBlockers.map((blocker, idx) => (
                <div
                  key={idx}
                  style={{
                    display: 'flex',
                    gap: SPACING.sm,
                    alignItems: 'flex-start',
                    borderTop: BORDER.hairlineSoft,
                    paddingTop: SPACING.sm,
                  }}
                >
                  <span
                    style={{
                      fontFamily: FONT.mono,
                      fontSize: 10,
                      fontWeight: 700,
                      color: COLORS.navy,
                      flexShrink: 0,
                      marginTop: 2,
                    }}
                  >
                    {String(idx + 1).padStart(2, '0')}
                  </span>
                  <span style={{ ...TYPE.body, fontSize: 13 }}>{blocker}</span>
                </div>
              ))}
            </div>
          </div>

          <div
            style={{
              ...cardStyle,
              padding: SPACING.xl,
              display: 'grid',
              gap: SPACING.md,
            }}
          >
            <div>
              <div style={TYPE.eyebrow}>Next Action</div>
              <h2 style={{ ...TYPE.h2, margin: 0, letterSpacing: 0 }}>
                Recommended next step
              </h2>
            </div>
            <p style={{ ...TYPE.body, margin: 0, color: COLORS.body, lineHeight: 1.65 }}>
              {drill.nextAction}
            </p>
          </div>
        </section>

        {/* Footer */}
        <footer
          style={{
            ...TYPE.caption,
            color: COLORS.muted,
            borderTop: BORDER.hairline,
            paddingTop: SPACING.md,
          }}
        >
          {drill.deterministicSourceCaption} · Generated {drill.generatedAt} · ADM8
        </footer>

      </div>
    </main>
  )
}
