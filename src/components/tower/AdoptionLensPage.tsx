'use client';

import { AppShell } from '@/components/shell/AppShell';
import { AgentColumn } from '@/components/shell/AgentColumn';
import { SHELL } from '@/lib/shell/shell-tokens';
import { ADOPTION_METRICS, ADOPTION_AGENT_VOICE, type AdoptionMetric } from '@/lib/tower/shell-lens-fixture';

// ---------------------------------------------------------------------------
// Phase badge
// ---------------------------------------------------------------------------

function PhaseBadge({ phase, phaseLabel }: { phase: number; phaseLabel: string }) {
  let bg: string;
  let color: string;

  if (phase >= 5) {
    bg = SHELL.MINT_BG;
    color = SHELL.MINT_TEXT;
  } else if (phase >= 3) {
    bg = SHELL.PEACH_BG;
    color = SHELL.PEACH_TEXT;
  } else {
    bg = SHELL.GRAY_BG;
    color = SHELL.GRAY_TEXT;
  }

  return (
    <span
      style={{
        fontFamily: SHELL.MONO,
        fontSize: 9,
        letterSpacing: '0.12em',
        textTransform: 'uppercase',
        padding: '2px 8px',
        borderRadius: 8,
        background: bg,
        color,
        lineHeight: 1.4,
      }}
    >
      P{phase} · {phaseLabel}
    </span>
  );
}

// ---------------------------------------------------------------------------
// Adoption progress bar
// ---------------------------------------------------------------------------

function AdoptionBar({ adoptionRate }: { adoptionRate: string }) {
  const pct = parseInt(adoptionRate, 10);
  let fillColor: string;

  if (pct >= 80) {
    fillColor = SHELL.MINT_TEXT;
  } else if (pct >= 50) {
    fillColor = SHELL.AMBER_DOT;
  } else {
    fillColor = SHELL.RUST_TEXT;
  }

  return (
    <div
      style={{
        marginTop: 10,
        height: 4,
        borderRadius: 2,
        background: SHELL.PAPER_DEEP,
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          height: '100%',
          width: adoptionRate,
          background: fillColor,
          borderRadius: 2,
          transition: 'width 0.3s ease',
        }}
      />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Metric card
// ---------------------------------------------------------------------------

function MetricCard({ metric }: { metric: AdoptionMetric }) {
  const hasData = metric.adoptionRate !== '—';

  return (
    <div
      style={{
        background: SHELL.CARD_WHITE,
        border: `1px solid ${SHELL.CARD_LINE}`,
        borderRadius: 10,
        padding: '16px 20px',
        marginBottom: 10,
      }}
    >
      {/* Header row */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'row',
          alignItems: 'center',
          gap: 8,
          marginBottom: 6,
        }}
      >
        <span
          style={{
            fontFamily: SHELL.MONO,
            fontSize: 10,
            letterSpacing: '0.08em',
            color: SHELL.INK_MUTED,
          }}
        >
          {metric.displayId}
        </span>
        <PhaseBadge phase={metric.phase} phaseLabel={metric.phaseLabel} />
        <div style={{ flex: 1 }} />
        <span
          style={{
            fontFamily: SHELL.MONO,
            fontSize: 9,
            color: SHELL.INK_MUTED,
          }}
        >
          {metric.lastActivity}
        </span>
      </div>

      {/* Program name */}
      <div
        style={{
          fontFamily: SHELL.SERIF,
          fontSize: 15,
          color: SHELL.INK,
          marginBottom: 10,
          lineHeight: 1.2,
        }}
      >
        {metric.program}
      </div>

      {/* Metrics row */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'row',
          gap: 24,
          alignItems: 'flex-start',
        }}
      >
        {/* Adoption rate */}
        <div>
          <div
            style={{
              fontFamily: SHELL.SERIF,
              fontSize: 17,
              fontWeight: 700,
              color: hasData ? SHELL.INK : SHELL.INK_MUTED,
              lineHeight: 1,
            }}
          >
            {metric.adoptionRate}
          </div>
          <div
            style={{
              fontFamily: SHELL.SANS,
              fontSize: 10,
              color: SHELL.INK_MUTED,
              marginTop: 2,
            }}
          >
            Adoption rate
          </div>
        </div>

        {/* Active users */}
        <div>
          <div
            style={{
              fontFamily: SHELL.SANS,
              fontSize: 12,
              color: SHELL.INK_SOFT,
              lineHeight: 1.3,
            }}
          >
            {metric.activeUsers} of {metric.targetUsers}
          </div>
          <div
            style={{
              fontFamily: SHELL.SANS,
              fontSize: 10,
              color: SHELL.INK_MUTED,
              marginTop: 2,
            }}
          >
            Active users
          </div>
        </div>

        {/* Training */}
        <div>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              fontFamily: SHELL.SANS,
              fontSize: 12,
              color: metric.trainingComplete ? SHELL.MINT_TEXT : SHELL.GRAY_TEXT,
              lineHeight: 1.3,
            }}
          >
            {metric.trainingComplete ? '✓' : ''}
            <span>{metric.trainingComplete ? 'Complete' : 'Pending'}</span>
          </div>
          <div
            style={{
              fontFamily: SHELL.SANS,
              fontSize: 10,
              color: SHELL.INK_MUTED,
              marginTop: 2,
            }}
          >
            Training
          </div>
        </div>
      </div>

      {/* Adoption bar (only when data exists) */}
      {hasData && <AdoptionBar adoptionRate={metric.adoptionRate} />}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------

export function AdoptionLensPage() {
  return (
    <AppShell
      surface="tower"
      topBarProps={{
        tenantName: 'Apex Retail Group',
        showLocked: true,
        context: 'Control Tower · Adoption Lens',
      }}
    >
      <AgentColumn
        agent={{ initials: 'At', name: 'Atlas', role: 'Cross-Program Synthesizer' }}
        quote={ADOPTION_AGENT_VOICE.quote}
        agentContext={ADOPTION_AGENT_VOICE.agentContext}
        actions={ADOPTION_AGENT_VOICE.actions}
        surface="tower"
      />

      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          background: SHELL.PAPER,
          padding: '24px 32px',
        }}
      >
        {/* Back link */}
        <a
          href="/tower"
          style={{
            display: 'inline-block',
            fontFamily: SHELL.MONO,
            fontSize: 11,
            color: SHELL.INK_SOFT,
            textDecoration: 'none',
            marginBottom: 12,
            letterSpacing: '0.06em',
          }}
        >
          ← Control Tower
        </a>

        {/* Header */}
        <h1
          style={{
            fontFamily: SHELL.SERIF,
            fontSize: 22,
            fontWeight: 400,
            color: SHELL.INK,
            margin: '0 0 4px 0',
            lineHeight: 1.2,
          }}
        >
          Adoption Lens
        </h1>
        <p
          style={{
            fontFamily: SHELL.SANS,
            fontSize: 13,
            color: SHELL.INK_SOFT,
            margin: '0 0 20px 0',
          }}
        >
          Program adoption tracking across active Apex Retail deployments
        </p>

        {/* Metric cards */}
        {ADOPTION_METRICS.map((metric) => (
          <MetricCard key={metric.displayId} metric={metric} />
        ))}

        {/* Bottom note */}
        <div
          style={{
            background: SHELL.PAPER_SOFT,
            padding: '12px 20px',
            borderRadius: 8,
            marginTop: 16,
          }}
        >
          <span
            style={{
              fontFamily: SHELL.SANS,
              fontSize: 12,
              color: SHELL.INK_MUTED,
            }}
          >
            Adoption data updates daily. Pre-launch programs show projected targets.
          </span>
        </div>
      </div>
    </AppShell>
  );
}
