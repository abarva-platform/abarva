'use client';

import Link from 'next/link';
import { AppShell } from '@/components/shell/AppShell';
import { AgentColumn } from '@/components/shell/AgentColumn';
import { FilterPillStrip } from '@/components/shell/FilterPillStrip';
import { SHELL } from '@/lib/shell/shell-tokens';
import { OUTCOME_FIXTURE, OUTCOME_AGENT_VOICE, type ProgramOutcome, type OutcomeMetric } from '@/lib/tower/shell-outcome-fixture';

// ---------------------------------------------------------------------------
// Delta pill
// ---------------------------------------------------------------------------

function DeltaPill({ metric }: { metric: OutcomeMetric }) {
  let bg: string;
  let color: string;

  if (metric.deltaDir === 'good') {
    bg = SHELL.MINT_BG;
    color = SHELL.MINT_TEXT;
  } else if (metric.deltaDir === 'miss') {
    bg = SHELL.RUST_BG;
    color = SHELL.RUST_TEXT;
  } else {
    bg = SHELL.GRAY_BG;
    color = SHELL.GRAY_TEXT;
  }

  return (
    <span
      style={{
        fontFamily: SHELL.MONO,
        fontSize: 10,
        padding: '2px 7px',
        borderRadius: 8,
        background: bg,
        color,
        lineHeight: 1.4,
        display: 'inline-block',
        marginTop: 4,
      }}
    >
      {metric.delta}
    </span>
  );
}

// ---------------------------------------------------------------------------
// Metric cell
// ---------------------------------------------------------------------------

function MetricCell({ metric }: { metric: OutcomeMetric }) {
  const hasActual = metric.actual !== '—';

  return (
    <div
      style={{
        background: SHELL.PAPER_SOFT,
        borderRadius: 7,
        padding: '10px 14px',
      }}
    >
      <div
        style={{
          fontFamily: SHELL.MONO,
          fontSize: 9,
          letterSpacing: '0.14em',
          textTransform: 'uppercase',
          color: SHELL.INK_MUTED,
          marginBottom: 4,
        }}
      >
        {metric.label}
      </div>
      <div
        style={{
          fontFamily: SHELL.SANS,
          fontSize: 11,
          color: SHELL.INK_MUTED,
        }}
      >
        Proj: {metric.projected}
      </div>
      {hasActual ? (
        <div
          style={{
            fontFamily: SHELL.SANS,
            fontSize: 13,
            fontWeight: 700,
            color: SHELL.INK,
            marginTop: 2,
          }}
        >
          {metric.actual}
        </div>
      ) : (
        <div
          style={{
            fontFamily: SHELL.SANS,
            fontSize: 11,
            color: SHELL.INK_MUTED,
            marginTop: 2,
          }}
        >
          {metric.actual}
        </div>
      )}
      <DeltaPill metric={metric} />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Phase badge
// ---------------------------------------------------------------------------

function PhaseBadge({ phase, phaseLabel }: { phase: number; phaseLabel: string }) {
  const isMint = phase >= 5;
  return (
    <span
      style={{
        fontFamily: SHELL.MONO,
        fontSize: 9,
        letterSpacing: '0.12em',
        textTransform: 'uppercase',
        padding: '2px 8px',
        borderRadius: 8,
        background: isMint ? SHELL.MINT_BG : SHELL.PEACH_BG,
        color: isMint ? SHELL.MINT_TEXT : SHELL.PEACH_TEXT,
        lineHeight: 1.4,
      }}
    >
      P{phase} · {phaseLabel}
    </span>
  );
}

// ---------------------------------------------------------------------------
// Status pill
// ---------------------------------------------------------------------------

function StatusPill({ status }: { status: ProgramOutcome['status'] }) {
  let bg: string;
  let color: string;
  let label: string;

  if (status === 'tracking') {
    bg = SHELL.MINT_BG;
    color = SHELL.MINT_TEXT;
    label = 'Tracking';
  } else if (status === 'at-risk') {
    bg = SHELL.RUST_BG;
    color = SHELL.RUST_TEXT;
    label = 'At risk';
  } else {
    bg = SHELL.PEACH_BG;
    color = SHELL.PEACH_TEXT;
    label = 'Projected';
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
      {label}
    </span>
  );
}

// ---------------------------------------------------------------------------
// Program card
// ---------------------------------------------------------------------------

function ProgramCard({ program }: { program: ProgramOutcome }) {
  return (
    <div
      style={{
        background: SHELL.CARD_WHITE,
        border: `1px solid ${SHELL.CARD_LINE}`,
        borderRadius: 10,
        padding: '20px 24px',
        marginBottom: 20,
      }}
    >
      {/* Card header row */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'row',
          alignItems: 'center',
          gap: 8,
          marginBottom: 8,
        }}
      >
        <span
          style={{
            fontFamily: SHELL.MONO,
            fontSize: 11,
            color: SHELL.INK_MUTED,
            letterSpacing: '0.06em',
          }}
        >
          {program.displayId}
        </span>
        <PhaseBadge phase={program.phase} phaseLabel={program.phaseLabel} />
        <StatusPill status={program.status} />
        <div style={{ flex: 1 }} />
        <Link
          href={program.href}
          style={{
            fontFamily: SHELL.MONO,
            fontSize: 10,
            color: SHELL.INK_SOFT,
            textDecoration: 'none',
            letterSpacing: '0.06em',
          }}
        >
          → View program
        </Link>
      </div>

      {/* Program name */}
      <div
        style={{
          fontFamily: SHELL.SERIF,
          fontSize: 17,
          color: SHELL.INK,
          fontWeight: 600,
          lineHeight: 1.2,
          marginBottom: 4,
        }}
      >
        {program.name}
      </div>

      {/* Launch date */}
      <div
        style={{
          fontFamily: SHELL.SANS,
          fontSize: 12,
          color: SHELL.INK_SOFT,
        }}
      >
        {program.launchDate}
      </div>

      {/* Atlas note */}
      <div
        style={{
          fontFamily: SHELL.SANS,
          fontSize: 12,
          fontStyle: 'italic',
          color: SHELL.INK_MUTED,
          marginTop: 6,
          lineHeight: 1.5,
        }}
      >
        {program.atlasNote}
      </div>

      {/* Metrics grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(2, 1fr)',
          gap: 10,
          marginTop: 14,
        }}
      >
        {program.metrics.map((metric) => (
          <MetricCell key={metric.label} metric={metric} />
        ))}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Filter pills (static)
// ---------------------------------------------------------------------------

const FILTER_PILLS = [
  { key: 'all', label: 'All programs', active: true },
  { key: 'tracking', label: 'Tracking', count: 1 },
  { key: 'projected', label: 'Projected', count: 1 },
];

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------

export function OutcomePage() {
  return (
    <AppShell
      surface="tower"
      topBarProps={{
        tenantName: 'Apex Retail Group',
        showLocked: true,
        context: 'Control Tower · Value Lens',
      }}
      middleStrip={<FilterPillStrip pills={FILTER_PILLS} />}
    >
      <AgentColumn
        agent={{ initials: 'At', name: 'Atlas', role: 'Cross-Program Synthesizer' }}
        quote={OUTCOME_AGENT_VOICE.quote}
        agentContext={OUTCOME_AGENT_VOICE.agentContext}
        actions={OUTCOME_AGENT_VOICE.actions}
      />

      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          background: SHELL.PAPER,
          padding: '24px 32px',
        }}
      >
        {/* Header section */}
        <div style={{ marginBottom: 20 }}>
          <h1
            style={{
              fontFamily: SHELL.SERIF,
              fontSize: 24,
              fontWeight: 400,
              color: SHELL.INK,
              margin: '0 0 4px 0',
              lineHeight: 1.2,
            }}
          >
            Outcome Realization
          </h1>
          <p
            style={{
              fontFamily: SHELL.SANS,
              fontSize: 13,
              color: SHELL.INK_SOFT,
              margin: 0,
            }}
          >
            Post-launch value tracking across Apex Retail programs
          </p>
        </div>

        {/* Program cards */}
        {OUTCOME_FIXTURE.map((program) => (
          <ProgramCard key={program.id} program={program} />
        ))}

        {/* Bottom summary bar */}
        <div
          style={{
            background: SHELL.PAPER_DEEP,
            borderRadius: 8,
            padding: '12px 20px',
            display: 'flex',
            gap: 40,
          }}
        >
          <div>
            <div
              style={{
                fontFamily: SHELL.MONO,
                fontSize: 11,
                color: SHELL.INK_MUTED,
                letterSpacing: '0.08em',
                marginBottom: 2,
              }}
            >
              Combined value realized
            </div>
            <div
              style={{
                fontFamily: SHELL.SERIF,
                fontSize: 16,
                color: SHELL.INK,
                fontWeight: 600,
              }}
            >
              $1.4M/yr
            </div>
          </div>
          <div>
            <div
              style={{
                fontFamily: SHELL.MONO,
                fontSize: 11,
                color: SHELL.INK_MUTED,
                letterSpacing: '0.08em',
                marginBottom: 2,
              }}
            >
              Programs at target
            </div>
            <div
              style={{
                fontFamily: SHELL.SERIF,
                fontSize: 16,
                color: SHELL.INK,
                fontWeight: 600,
              }}
            >
              1 of 1 (tracking)
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
