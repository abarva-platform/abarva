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

import { createContext, useContext, useMemo } from 'react';
import type {
  AntiPatternFlagArtifact,
  Artifact,
  CrossProgramDependencyArtifact,
  EvidenceHighlightArtifact,
  GateEvaluationArtifact,
  PatternMatchArtifact,
  PhaseProgressArtifact,
  PhaseRecommendationArtifact,
  ProgramFocusArtifact,
  QuestionResolvedArtifact,
} from '@/lib/agent/artifacts';
import { BrandColors, BrandTypography } from '@/lib/shell/brand-tokens';

export interface NexusReactivePanelProps {
  /**
   * Artifacts dispatched by AtlasDrawer's onArtifact callback. Most
   * recent first — the panel reverses-time-order the rendered cards.
   */
  artifacts: Artifact[];
  /**
   * PR-N · agent label rendered in the panel header. Defaults to
   * 'Nexus' for backwards compat with /programs/<id>. /home passes
   * 'Atlas'; /programs (list) keeps 'Nexus'. (Intelligence has its own
   * SentinelReactivePanel.) Removes the founder-flagged copy mismatch
   * where Atlas's surface showed "Nexus reasoning · live".
   */
  agentLabel?: string;
  /**
   * PR-N · operator-coded prompts shown in the empty-state placeholder.
   * Two short prompt suggestions tailored to the active agent — Atlas
   * gets portfolio prompts, Nexus gets phase-pack prompts. Default
   * stays the existing /programs/<id> phrasing.
   */
  emptyStatePrompts?: { primary: string; secondary: string };
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

/**
 * PR-P · agent label for the card-prefix string. NexusReactivePanel sets
 * this from the `agentLabel` prop (PR-N landed the panel-level prop;
 * PR-P propagates it into the cards). Default 'Nexus' keeps backwards
 * compat for any caller that hasn't migrated.
 */
const CardAgentLabelContext = createContext<string>('Nexus');

function CardShell({
  kind,
  children,
}: {
  kind: string;
  children: React.ReactNode;
}) {
  const agentLabel = useContext(CardAgentLabelContext);
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
        {agentLabel} · {kind}
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

function PhaseProgressCard({ a }: { a: PhaseProgressArtifact }) {
  // 'unknown' status uses the existing 'pending' visual for the StatusPill.
  const pillStatus =
    a.status === 'met' ? 'met' : a.status === 'unmet' ? 'unmet' : 'pending';
  return (
    <CardShell kind={`Phase progress · ${a.severity === 'hard' ? 'hard gate' : 'soft gate'}`}>
      <div
        style={{
          display: 'flex',
          alignItems: 'baseline',
          gap: 10,
          marginBottom: 6,
          flexWrap: 'wrap',
        }}
      >
        <span style={{ fontWeight: 600, fontSize: 13.5, lineHeight: 1.3 }}>{a.label}</span>
        <StatusPill label={a.status} status={pillStatus} />
      </div>
      {a.detail ? (
        <p style={{ margin: '4px 0 0', fontSize: 12.5, color: BrandColors.slate, lineHeight: 1.55 }}>
          {a.detail}
        </p>
      ) : null}
      <div
        style={{
          fontFamily: BrandTypography.mono,
          fontSize: 10,
          color: BrandColors.stone,
          marginTop: 6,
        }}
      >
        {a.evidenceItemId}
      </div>
    </CardShell>
  );
}

function QuestionResolvedCard({ a }: { a: QuestionResolvedArtifact }) {
  return (
    <CardShell kind="Question resolved">
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          gap: 8,
          marginBottom: 6,
        }}
      >
        <span
          style={{
            color: '#0f766e',
            fontSize: 14,
            lineHeight: 1.3,
            flexShrink: 0,
            marginTop: 1,
          }}
          aria-hidden="true"
        >
          ✓
        </span>
        <span style={{ fontWeight: 600, fontSize: 13, lineHeight: 1.4 }}>
          {a.questionText}
        </span>
      </div>
      {a.resolutionSummary ? (
        <p
          style={{
            margin: '4px 0 0 22px',
            fontSize: 12.5,
            color: BrandColors.slate,
            lineHeight: 1.55,
          }}
        >
          {a.resolutionSummary}
        </p>
      ) : null}
      <div
        style={{
          fontFamily: BrandTypography.mono,
          fontSize: 10,
          color: BrandColors.stone,
          marginTop: 6,
          marginLeft: 22,
        }}
      >
        {a.questionId}
      </div>
    </CardShell>
  );
}

function AntiPatternFlagCard({ a }: { a: AntiPatternFlagArtifact }) {
  return (
    <CardShell kind={`Anti-pattern flag · ${a.label}`}>
      <div
        style={{
          fontFamily: BrandTypography.mono,
          fontSize: 9.5,
          letterSpacing: '0.10em',
          textTransform: 'uppercase',
          color: '#b45309',
          fontWeight: 700,
          marginBottom: 4,
        }}
      >
        Detected
      </div>
      <p style={{ margin: 0, fontSize: 12.5, color: BrandColors.inkBlack, lineHeight: 1.55 }}>
        {a.detectedSignal}
      </p>
      <div
        style={{
          fontFamily: BrandTypography.mono,
          fontSize: 9.5,
          letterSpacing: '0.10em',
          textTransform: 'uppercase',
          color: BrandColors.signalBlue,
          fontWeight: 700,
          marginTop: 10,
          marginBottom: 4,
        }}
      >
        What this means
      </div>
      <p style={{ margin: 0, fontSize: 12.5, color: BrandColors.slate, lineHeight: 1.55 }}>
        {a.whatToFlag}
      </p>
      <div
        style={{
          fontFamily: BrandTypography.mono,
          fontSize: 9.5,
          letterSpacing: '0.10em',
          textTransform: 'uppercase',
          color: '#0f766e',
          fontWeight: 700,
          marginTop: 10,
          marginBottom: 4,
        }}
      >
        Redirect to
      </div>
      <p style={{ margin: 0, fontSize: 12.5, color: BrandColors.slate, lineHeight: 1.55 }}>
        {a.mitigation}
      </p>
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

/**
 * Filter + dedupe + reverse-time-order the artifact stream into the
 * cards the panel renders. Exported for unit testing — the panel
 * itself just maps over the result.
 *
 * Behavior:
 *   - Phase-progress and anti-pattern-flag: dedupe by stable id, keep
 *     LATEST occurrence (so re-emits act as upserts).
 *   - Brief-field and classification: dropped — Surface 1 territory.
 *   - Everything else: preserved in insertion order.
 *   - Final result is reversed (most recent first across the stream).
 */
export function selectVisibleArtifacts(artifacts: Artifact[]): Artifact[] {
  const seenProgress = new Map<string, PhaseProgressArtifact>();
  const seenFlags = new Map<string, AntiPatternFlagArtifact>();
  const seenQuestions = new Map<string, QuestionResolvedArtifact>();
  const orderedNonDeduped: Artifact[] = [];

  for (const a of artifacts) {
    if (a.type === 'phase-progress') {
      seenProgress.set(a.evidenceItemId, a);
    } else if (a.type === 'anti-pattern-flag') {
      seenFlags.set(a.antiPatternId, a);
    } else if (a.type === 'question-resolved') {
      // PR-G' · dedupe by stable questionId. Re-emits upsert (e.g.
      // Nexus refines a resolutionSummary on a later turn).
      seenQuestions.set(a.questionId, a);
    } else {
      orderedNonDeduped.push(a);
    }
  }

  const merged: Artifact[] = [
    ...orderedNonDeduped,
    ...seenProgress.values(),
    ...seenFlags.values(),
    ...seenQuestions.values(),
  ];

  return merged
    .filter(
      (a) =>
        a.type === 'gate-evaluation' ||
        a.type === 'evidence-highlight' ||
        a.type === 'phase-recommendation' ||
        a.type === 'pattern-match' ||
        a.type === 'cross-program-dependency' ||
        a.type === 'program-focus' ||
        a.type === 'phase-progress' ||
        a.type === 'anti-pattern-flag' ||
        a.type === 'question-resolved',
    )
    .reverse();
}

export function NexusReactivePanel({
  artifacts,
  agentLabel = 'Nexus',
  emptyStatePrompts,
}: NexusReactivePanelProps) {
  const visible = useMemo(() => selectVisibleArtifacts(artifacts), [artifacts]);
  const headerLabel = `${agentLabel} reasoning · live`;
  const promptPrimary = emptyStatePrompts?.primary ?? 'where are we?';
  const promptSecondary = emptyStatePrompts?.secondary ?? 'can we advance the gate?';

  // PR-H — empty state. The reactive panel reserves grid space inside
  // <AgentCanvas> regardless of artifact count, so when no artifacts
  // have been emitted yet the column was rendering as a blank
  // paper-colored void. Founder reported "no dynamic content on the
  // right" during the production walk. Empty state names what this
  // surface is for so it reads as agent-driven, not broken.
  if (visible.length === 0) {
    return (
      <section
        aria-label={`${agentLabel} reactive workbench`}
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 10,
          padding: '20px 18px',
          background: BrandColors.paper,
          border: `1px dashed rgba(12,26,58,0.18)`,
          borderRadius: 10,
          color: BrandColors.slate,
          fontFamily: BrandTypography.sans,
          minHeight: 160,
        }}
      >
        <div
          style={{
            fontFamily: BrandTypography.mono,
            fontSize: 10,
            letterSpacing: '0.14em',
            textTransform: 'uppercase',
            color: BrandColors.stone,
            fontWeight: 700,
          }}
        >
          {headerLabel}
        </div>
        <p style={{ margin: '4px 0 0', fontSize: 13, lineHeight: 1.55 }}>
          As we work together, {agentLabel} will materialize gate evaluations,
          progress cards, anti-pattern flags, and pattern matches here — one card
          per piece of reasoning, in real time.
        </p>
        <p
          style={{
            margin: 0,
            fontSize: 12,
            lineHeight: 1.5,
            color: BrandColors.stone,
            fontStyle: 'italic',
          }}
        >
          Start the conversation on the left. Ask &ldquo;{promptPrimary}&rdquo; or
          &ldquo;{promptSecondary}&rdquo; — cards will populate as {agentLabel} reasons.
        </p>
      </section>
    );
  }

  // PR-P · provide agentLabel to every CardShell beneath this render
  // tree. Without the context, CardShell falls back to 'Nexus' which
  // is the wrong label on Atlas's /home surface (founder caught
  // "NEXUS · Phase 4 recommendation" rendering on Atlas's portfolio
  // cards during the PR-E walk).
  return (
    <CardAgentLabelContext.Provider value={agentLabel}>
    <section
      aria-label={`${agentLabel} reactive workbench`}
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
        {headerLabel}
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
          case 'phase-progress':
            return <PhaseProgressCard key={`pp-${a.evidenceItemId}`} a={a} />;
          case 'anti-pattern-flag':
            return <AntiPatternFlagCard key={`ap-${a.antiPatternId}`} a={a} />;
          case 'question-resolved':
            return <QuestionResolvedCard key={`qr-${a.questionId}`} a={a} />;
          default:
            return null;
        }
      })}
    </section>
    </CardAgentLabelContext.Provider>
  );
}
