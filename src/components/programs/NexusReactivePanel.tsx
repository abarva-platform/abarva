'use client';

// NexusReactivePanel · Surface 2 PR2 of Programs Strict Completion v1.2
//
// Right-pane companion to AtlasDrawer on /programs/[id]. Materializes
// Nexus's structured-artifact reasoning (gate evaluations, evidence
// highlights, phase recommendations, cross-program dependencies, focus
// shifts) as cards that update live as the chat streams. Per kickoff
// §0 dim 2: "the right pane materializes the agent's reasoning as it
// happens. No static dashboards next to active conversations."
//
// In Surface 2 PR2 this is non-destructive — it sits alongside the
// existing static phase tabs / gate ribbon / evidence cards. Subsequent
// PRs progressively replace those static elements with reactive
// equivalents driven by the same artifact channel.

import { useMemo } from 'react';
import type {
  Artifact,
  CrossProgramDependencyArtifact,
  EvidenceHighlightArtifact,
  GateEvaluationArtifact,
  PatternMatchArtifact,
  PhaseRecommendationArtifact,
  ProgramFocusArtifact,
} from '@/lib/agent/artifacts';
import { BrandColors, BrandTypography } from '@/lib/shell/brand-tokens';

export interface NexusReactivePanelProps {
  /**
   * Artifacts dispatched by AtlasDrawer's onArtifact callback. Most
   * recent first — the panel reverses-time-order the rendered cards.
   */
  artifacts: Artifact[];
}

// ── Status badge ──────────────────────────────────────────────────────────────

function StatusPill({
  label,
  status,
}: {
  label: string;
  status: 'met' | 'unmet' | 'pending' | 'blocked';
}) {
  const colors = {
    met: { bg: 'rgba(15,118,110,0.10)', fg: '#0f766e', border: 'rgba(15,118,110,0.32)' },
    unmet: { bg: 'rgba(217,119,6,0.10)', fg: '#b45309', border: 'rgba(217,119,6,0.32)' },
    pending: { bg: 'rgba(120,113,108,0.12)', fg: BrandColors.slate, border: 'rgba(120,113,108,0.28)' },
    blocked: { bg: 'rgba(220,38,38,0.10)', fg: '#b91c1c', border: 'rgba(220,38,38,0.32)' },
  }[status];
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        padding: '1px 8px',
        borderRadius: 999,
        background: colors.bg,
        border: `1px solid ${colors.border}`,
        color: colors.fg,
        fontFamily: BrandTypography.mono,
        fontSize: 10,
        letterSpacing: '0.06em',
        textTransform: 'uppercase',
        fontWeight: 700,
      }}
    >
      {label}
    </span>
  );
}

// ── Card primitives ───────────────────────────────────────────────────────────

function CardShell({
  kind,
  children,
}: {
  kind: string;
  children: React.ReactNode;
}) {
  return (
    <div
      style={{
        background: '#FFFFFF',
        border: `1px solid rgba(12,26,58,0.12)`,
        borderRadius: 8,
        padding: '12px 14px',
        boxShadow: '0 1px 2px rgba(12,26,58,0.04)',
        fontFamily: BrandTypography.sans,
        color: BrandColors.inkBlack,
      }}
    >
      <div
        style={{
          fontFamily: BrandTypography.mono,
          fontSize: 9.5,
          letterSpacing: '0.10em',
          textTransform: 'uppercase',
          color: BrandColors.signalBlue,
          fontWeight: 700,
          marginBottom: 8,
        }}
      >
        Nexus · {kind}
      </div>
      {children}
    </div>
  );
}

function GateEvaluationCard({ a }: { a: GateEvaluationArtifact }) {
  return (
    <CardShell kind="Gate evaluation">
      <div
        style={{
          display: 'flex',
          alignItems: 'baseline',
          gap: 10,
          marginBottom: 6,
          flexWrap: 'wrap',
        }}
      >
        <span style={{ fontWeight: 600, fontSize: 13.5, lineHeight: 1.3 }}>{a.gate}</span>
        <StatusPill label={a.status} status={a.status} />
      </div>
      {a.detail ? (
        <p style={{ margin: '4px 0 0', fontSize: 12.5, color: BrandColors.slate, lineHeight: 1.55 }}>
          {a.detail}
        </p>
      ) : null}
      {a.reasoning ? (
        <p
          style={{
            margin: '8px 0 0',
            fontSize: 12,
            color: BrandColors.slate,
            lineHeight: 1.55,
            fontStyle: 'italic',
            borderLeft: `2px solid ${BrandColors.stone}`,
            paddingLeft: 8,
          }}
        >
          {a.reasoning}
        </p>
      ) : null}
    </CardShell>
  );
}

function EvidenceHighlightCard({ a }: { a: EvidenceHighlightArtifact }) {
  return (
    <CardShell kind="Evidence highlight">
      <div style={{ fontSize: 13, fontWeight: 600 }}>
        {a.label ?? a.evidenceId}
      </div>
      <div
        style={{
          fontFamily: BrandTypography.mono,
          fontSize: 11,
          color: BrandColors.stone,
          marginTop: 2,
        }}
      >
        {a.evidenceId}
      </div>
      <p style={{ margin: '6px 0 0', fontSize: 12.5, color: BrandColors.slate, lineHeight: 1.55 }}>
        {a.reason}
      </p>
    </CardShell>
  );
}

function PhaseRecommendationCard({ a }: { a: PhaseRecommendationArtifact }) {
  return (
    <CardShell kind={`Phase ${a.phase} recommendation`}>
      <p style={{ margin: 0, fontSize: 13, lineHeight: 1.55, fontWeight: 500 }}>
        {a.recommendation}
      </p>
      {a.blockers && a.blockers.length > 0 ? (
        <div style={{ marginTop: 10 }}>
          <div
            style={{
              fontFamily: BrandTypography.mono,
              fontSize: 9.5,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              color: '#b45309',
              fontWeight: 700,
              marginBottom: 4,
            }}
          >
            Blockers
          </div>
          <ul style={{ margin: 0, paddingLeft: 16, fontSize: 12, lineHeight: 1.55, color: BrandColors.slate }}>
            {a.blockers.map((b, i) => (
              <li key={`b-${i}`}>{b}</li>
            ))}
          </ul>
        </div>
      ) : null}
      {a.nextActions && a.nextActions.length > 0 ? (
        <div style={{ marginTop: 10 }}>
          <div
            style={{
              fontFamily: BrandTypography.mono,
              fontSize: 9.5,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              color: '#0f766e',
              fontWeight: 700,
              marginBottom: 4,
            }}
          >
            Next actions
          </div>
          <ul style={{ margin: 0, paddingLeft: 16, fontSize: 12, lineHeight: 1.55, color: BrandColors.slate }}>
            {a.nextActions.map((n, i) => (
              <li key={`n-${i}`}>{n}</li>
            ))}
          </ul>
        </div>
      ) : null}
    </CardShell>
  );
}

function PatternMatchCardSmall({ a }: { a: PatternMatchArtifact }) {
  return (
    <CardShell kind="Pattern match">
      <a
        href={`/source/patterns/${a.patternId}`}
        style={{ textDecoration: 'none', color: BrandColors.inkBlack }}
      >
        <div style={{ fontWeight: 600, fontSize: 13.5 }}>{a.name}</div>
        <div style={{ fontFamily: BrandTypography.mono, fontSize: 11, color: BrandColors.signalBlue, marginTop: 2 }}>
          {a.patternId}
        </div>
        <p style={{ margin: '6px 0 0', fontSize: 12, color: BrandColors.slate, lineHeight: 1.55 }}>
          {a.summary}
        </p>
      </a>
    </CardShell>
  );
}

function CrossProgramDependencyCard({ a }: { a: CrossProgramDependencyArtifact }) {
  return (
    <CardShell kind="Linked program">
      <a
        href={`/programs/${a.programId}`}
        style={{ textDecoration: 'none', color: BrandColors.inkBlack }}
      >
        <div style={{ fontWeight: 600, fontSize: 13.5 }}>{a.programName}</div>
        <div
          style={{
            display: 'flex',
            gap: 8,
            marginTop: 2,
            fontFamily: BrandTypography.mono,
            fontSize: 11,
            color: BrandColors.stone,
          }}
        >
          <span style={{ color: BrandColors.signalBlue }}>{a.programId}</span>
          <span>·</span>
          <span>{a.currentPhase}</span>
        </div>
      </a>
    </CardShell>
  );
}

function ProgramFocusCard({ a }: { a: ProgramFocusArtifact }) {
  return (
    <CardShell kind="Now reasoning about">
      <a
        href={`/programs/${a.programId}`}
        style={{ textDecoration: 'none', color: BrandColors.inkBlack }}
      >
        <div style={{ fontWeight: 600, fontSize: 13.5 }}>{a.name}</div>
        <div style={{ fontFamily: BrandTypography.mono, fontSize: 11, color: BrandColors.stone, marginTop: 2 }}>
          {a.programId} · {a.currentPhase}
        </div>
      </a>
    </CardShell>
  );
}

// ── Panel ─────────────────────────────────────────────────────────────────────

export function NexusReactivePanel({ artifacts }: NexusReactivePanelProps) {
  // Show most-recent first. Skip artifact types this surface doesn't
  // render (brief-field, classification — those are Surface 1 territory).
  const visible = useMemo(() => {
    return artifacts
      .filter(
        (a) =>
          a.type === 'gate-evaluation' ||
          a.type === 'evidence-highlight' ||
          a.type === 'phase-recommendation' ||
          a.type === 'pattern-match' ||
          a.type === 'cross-program-dependency' ||
          a.type === 'program-focus',
      )
      .slice()
      .reverse();
  }, [artifacts]);

  if (visible.length === 0) return null;

  return (
    <section
      aria-label="Nexus reactive workbench"
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
        padding: '14px 16px',
        background: BrandColors.paper,
        border: `1px solid rgba(12,26,58,0.10)`,
        borderRadius: 10,
        marginBottom: 16,
      }}
    >
      <header
        style={{
          fontFamily: BrandTypography.mono,
          fontSize: 10,
          letterSpacing: '0.14em',
          textTransform: 'uppercase',
          color: BrandColors.stone,
          fontWeight: 700,
        }}
      >
        Nexus reasoning · live
      </header>
      {visible.map((a, idx) => {
        const key = `${a.type}-${idx}`;
        switch (a.type) {
          case 'gate-evaluation':
            return <GateEvaluationCard key={key} a={a} />;
          case 'evidence-highlight':
            return <EvidenceHighlightCard key={key} a={a} />;
          case 'phase-recommendation':
            return <PhaseRecommendationCard key={key} a={a} />;
          case 'pattern-match':
            return <PatternMatchCardSmall key={key} a={a} />;
          case 'cross-program-dependency':
            return <CrossProgramDependencyCard key={key} a={a} />;
          case 'program-focus':
            return <ProgramFocusCard key={key} a={a} />;
          default:
            return null;
        }
      })}
    </section>
  );
}
