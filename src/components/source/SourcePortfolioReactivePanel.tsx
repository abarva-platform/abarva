'use client';

import Link from 'next/link';
import type { CSSProperties } from 'react';
import type {
  Artifact,
  AntiPatternFlagArtifact,
  ContradictionFlagArtifact,
  CrossProgramDependencyArtifact,
  EvidenceHighlightArtifact,
  GateEvaluationArtifact,
  PatternMatchArtifact,
  PhaseProgressArtifact,
  SourcingStageProgressArtifact,
} from '@/lib/agent/artifacts';
import { buildLinkedProgramBadgeView } from '@/lib/source/linked-program-badge-view';
import type { SourcingEventSummary } from '@/lib/source/types';
import { formatUsd } from '@/lib/source/value-ledger';
import { SHELL } from '@/lib/shell/shell-tokens';
import { selectVisibleSourcingArtifacts, SourcingReactivePanel } from './SourcingReactivePanel';

interface SourcePortfolioReactivePanelProps {
  events: SourcingEventSummary[];
  activeStage: string | null;
  activeStatus: string | null;
  artifacts: Artifact[];
}

const PANEL: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 10,
  padding: '14px 16px',
  background: SHELL.PAPER,
  border: '1px solid rgba(12,26,58,0.10)',
  borderRadius: 10,
  minHeight: '100%',
};

const CARD: CSSProperties = {
  background: SHELL.CARD_WHITE,
  border: '1px solid rgba(12,26,58,0.12)',
  borderRadius: 8,
  padding: '12px 14px',
  boxShadow: '0 1px 2px rgba(12,26,58,0.04)',
  fontFamily: SHELL.SANS,
  color: SHELL.INK,
};

const EYEBROW: CSSProperties = {
  fontFamily: SHELL.MONO,
  fontSize: 9.5,
  letterSpacing: '0.10em',
  textTransform: 'uppercase',
  color: '#1B2B5C',
  fontWeight: 700,
  marginBottom: 8,
};

const MUTED: CSSProperties = {
  margin: 0,
  fontFamily: SHELL.SANS,
  fontSize: 12.5,
  color: SHELL.INK_SOFT,
  lineHeight: 1.55,
};

export function SourcePortfolioReactivePanel({
  events,
  activeStage,
  activeStatus,
  artifacts,
}: SourcePortfolioReactivePanelProps) {
  const activeEvents = events.filter((event) => event.status === 'active').length;
  const atRiskEvents = events.filter((event) => event.isAtRisk || event.status === 'at_risk').length;
  const openAlerts = events.reduce((sum, event) => sum + event.openAlerts, 0);
  const valueAtStake = events.reduce((sum, event) => sum + event.valueAtStakeUsd, 0);
  const topEvent = selectTopEvent(events);
  const linkedProgram = topEvent ? buildLinkedProgramBadgeView(topEvent.id) : null;
  const visibleArtifacts = selectSourceArtifacts(artifacts);
  const visibleSourcingArtifacts = selectVisibleSourcingArtifacts(artifacts);
  const sourcingProgress = artifacts.filter((artifact): artifact is SourcingStageProgressArtifact => artifact.type === 'sourcing-stage-progress');
  const filterLabel = [activeStage, activeStatus].filter(Boolean).join(' / ') || 'all source events';

  return (
    <section aria-label="Source portfolio mission preview" style={PANEL}>
      <header
        style={{
          fontFamily: SHELL.MONO,
          fontSize: 10,
          letterSpacing: '0.14em',
          textTransform: 'uppercase',
          color: SHELL.INK_MUTED,
          fontWeight: 700,
        }}
      >
        Sentinel mission preview - seeded
      </header>

      <SourceOperatingModelCard />

      <Card kind="Portfolio posture">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 8 }}>
          <Metric label="Events" value={String(events.length)} />
          <Metric label="Active" value={String(activeEvents)} />
          <Metric label="At risk" value={String(atRiskEvents)} />
          <Metric label="Value" value={formatUsd(valueAtStake)} />
        </div>
        <p style={{ ...MUTED, marginTop: 10 }}>
          Current view: {filterLabel}. Sentinel is using seeded portfolio facts only; no live procurement write-back is implied.
        </p>
      </Card>

      {topEvent ? (
        <Card kind="Top mission signal">
          <Link href={`/source/events/${topEvent.id}`} style={{ color: 'inherit', textDecoration: 'none' }}>
            <div style={{ fontWeight: 700, fontSize: 13.5 }}>{topEvent.name}</div>
            <div style={{ marginTop: 2, fontFamily: SHELL.MONO, fontSize: 10.5, color: '#1B2B5C' }}>
              {topEvent.code} - {topEvent.currentStageLabel} - {topEvent.statusLabel}
            </div>
            <p style={{ ...MUTED, marginTop: 8 }}>
              {topEvent.blocker ?? topEvent.nextDecision} Next action: {topEvent.nextAction}.
            </p>
          </Link>
        </Card>
      ) : (
        <Card kind="Top mission signal">
            <p style={MUTED}>No seeded source events match this filter posture. Reset filters to restore the Sentinel portfolio read.</p>
        </Card>
      )}

      <IntakeOperatingCard progress={sourcingProgress} />

      {topEvent ? (
        <Card kind="Walkaway signal">
          <StatusPill status={topEvent.isAtRisk ? 'theatre' : openAlerts > 0 ? 'soft' : 'strong'} />
          <p style={{ ...MUTED, marginTop: 8 }}>
            {topEvent.isAtRisk
              ? 'Commercial leverage is not credible until the named blocker is resolved.'
              : openAlerts > 0
                ? 'There is leverage, but Sentinel should verify unresolved alerts before recommending a sourcing move.'
                : 'No seeded blockers are visible in this portfolio view.'}
          </p>
        </Card>
      ) : null}

      {linkedProgram ? (
        <Card kind="Linked program">
          <Link href={linkedProgram.routeHint ?? '/programs'} style={{ color: 'inherit', textDecoration: 'none' }}>
            <div style={{ fontWeight: 700, fontSize: 13.5 }}>{linkedProgram.programName}</div>
            <div style={{ marginTop: 2, fontFamily: SHELL.MONO, fontSize: 10.5, color: '#1B2B5C' }}>
              {linkedProgram.programCode} - {linkedProgram.relationship}
            </div>
            <p style={{ ...MUTED, marginTop: 8 }}>{linkedProgram.evidenceCaveat}</p>
          </Link>
        </Card>
      ) : null}

      {visibleArtifacts.map((artifact, index) => (
        <LiveArtifactCard key={`${artifact.type}-${index}`} artifact={artifact} />
      ))}

      {visibleSourcingArtifacts.length > 0 ? (
        <SourcingReactivePanel artifacts={artifacts} />
      ) : null}

      {visibleArtifacts.length === 0 && visibleSourcingArtifacts.length === 0 ? (
        <Card kind="Try next">
          <p style={MUTED}>
            Start an IT sourcing event from the command center. The next useful card should be intake progress: owner, problem, scope boundary, evidence, kill criterion, and approval route.
          </p>
        </Card>
      ) : null}
    </section>
  );
}

function SourceOperatingModelCard() {
  const rows = [
    'Create a sourcing event when there is a real business trigger, not just vendor noise.',
    'Use Sentinel to turn intake into scope, evidence, gates, and deal strategy.',
    'Open an existing event when you need stage work: shortlist, RFP, demo, BAFO, contract, or activation.',
  ];

  return (
    <Card kind="Operating model">
      <p style={{ ...MUTED, marginBottom: 10 }}>
        Source is the IT sourcing command center. Sentinel leads the sourcing motion while Sentinel challenges evidence,
        Steward protects gates, and Atlas frames value and executive consequence.
      </p>
      <div style={{ display: 'grid', gap: 7 }}>
        {rows.map((row) => (
          <div
            key={row}
            style={{
              display: 'grid',
              gridTemplateColumns: '14px minmax(0, 1fr)',
              gap: 7,
              alignItems: 'start',
              fontFamily: SHELL.SANS,
              fontSize: 12.3,
              lineHeight: 1.38,
              color: SHELL.INK_SOFT,
            }}
          >
            <span style={{ color: '#1B2B5C', fontWeight: 800 }}>→</span>
            <span>{row}</span>
          </div>
        ))}
      </div>
      <Link
        href="/source/new"
        style={{
          display: 'inline-flex',
          marginTop: 12,
          borderRadius: 999,
          background: SHELL.INK,
          color: SHELL.PAPER,
          padding: '7px 11px',
          fontFamily: SHELL.MONO,
          fontSize: 9.5,
          fontWeight: 800,
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
          textDecoration: 'none',
        }}
      >
        Start IT sourcing event
      </Link>
    </Card>
  );
}

function IntakeOperatingCard({ progress }: { progress: SourcingStageProgressArtifact[] }) {
  const rows = [
    {
      key: 'trigger',
      label: 'Trigger',
      detail: 'Why now, consequence of no action.',
      status: inferProgressStatus(progress, ['trigger', 'problem']),
    },
    {
      key: 'owner',
      label: 'Decision owner',
      detail: 'Seeded Apex CIO: Thomas Reeves. Confirm stop/go authority.',
      status: inferProgressStatus(progress, ['business-owner', 'sponsor', 'owner']),
    },
    {
      key: 'scope',
      label: 'Scope boundary',
      detail: 'Enterprise/all towers is a hypothesis; name first boundary and exclusions.',
      status: inferProgressStatus(progress, ['scope']),
    },
    {
      key: 'baseline',
      label: 'Baseline evidence',
      detail: 'Run-rate, app/service inventory, incumbents, dates, pain, transition constraints.',
      status: inferProgressStatus(progress, ['evidence', 'inventory', 'baseline']),
    },
    {
      key: 'approval',
      label: 'Stop + approval',
      detail: 'Savings floor, kill criterion, sourcing lead + sponsor approval.',
      status: inferProgressStatus(progress, ['kill', 'approval', 'stop']),
    },
  ];

  return (
    <Card kind="Event stand-up floor">
      <div style={{ display: 'grid', gap: 8 }}>
        {rows.map((row) => (
          <div
            key={row.key}
            style={{
              display: 'grid',
              gridTemplateColumns: '90px minmax(0, 1fr) auto',
              gap: 8,
              alignItems: 'start',
              borderTop: '1px solid rgba(17,24,39,0.07)',
              paddingTop: 8,
            }}
          >
            <div style={{ fontWeight: 800, fontSize: 12.5, color: SHELL.INK }}>{row.label}</div>
            <p style={{ ...MUTED, lineHeight: 1.35 }}>{row.detail}</p>
            <MiniStatus status={row.status} />
          </div>
        ))}
      </div>
    </Card>
  );
}

function inferProgressStatus(
  progress: SourcingStageProgressArtifact[],
  needles: string[],
): 'met' | 'unmet' | 'unknown' {
  const hit = [...progress].reverse().find((item) => {
    const haystack = `${item.evidenceItemId} ${item.label}`.toLowerCase();
    return needles.some((needle) => haystack.includes(needle));
  });
  return hit?.status ?? 'unknown';
}

function MiniStatus({ status }: { status: 'met' | 'unmet' | 'unknown' }) {
  const colors = {
    met: { bg: 'rgba(15,118,110,0.10)', fg: '#0f766e', label: 'met' },
    unmet: { bg: 'rgba(185,28,28,0.10)', fg: '#b91c1c', label: 'open' },
    unknown: { bg: 'rgba(100,116,139,0.10)', fg: '#475569', label: 'check' },
  }[status];

  return (
    <span
      style={{
        borderRadius: 999,
        background: colors.bg,
        color: colors.fg,
        fontFamily: SHELL.MONO,
        fontSize: 8.5,
        fontWeight: 800,
        letterSpacing: '0.08em',
        textTransform: 'uppercase',
        padding: '3px 6px',
        whiteSpace: 'nowrap',
      }}
    >
      {colors.label}
    </span>
  );
}

function selectTopEvent(events: SourcingEventSummary[]): SourcingEventSummary | null {
  return [...events].sort((left, right) => {
    if (Number(right.isAtRisk) !== Number(left.isAtRisk)) return Number(right.isAtRisk) - Number(left.isAtRisk);
    if (right.openAlerts !== left.openAlerts) return right.openAlerts - left.openAlerts;
    return right.valueAtStakeUsd - left.valueAtStakeUsd;
  })[0] ?? null;
}

function selectSourceArtifacts(artifacts: Artifact[]): Artifact[] {
  return artifacts
    .filter(
      (artifact) =>
        artifact.type === 'pattern-match' ||
        artifact.type === 'evidence-highlight' ||
        artifact.type === 'cross-program-dependency' ||
        artifact.type === 'gate-evaluation' ||
        artifact.type === 'phase-progress' ||
        artifact.type === 'anti-pattern-flag' ||
        artifact.type === 'contradiction-flag',
    )
    .slice()
    .reverse();
}

function Card({ kind, children }: { kind: string; children: React.ReactNode }) {
  return (
    <article style={CARD}>
      <div style={EYEBROW}>Sentinel - {kind}</div>
      {children}
    </article>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div
      style={{
        border: '1px solid rgba(17, 24, 39, 0.08)',
        borderRadius: 8,
        background: '#FBFAF7',
        padding: '8px 10px',
      }}
    >
      <div style={{ fontFamily: SHELL.MONO, fontSize: 8.5, letterSpacing: '0.08em', textTransform: 'uppercase', color: SHELL.INK_MUTED }}>
        {label}
      </div>
      <div style={{ marginTop: 3, fontFamily: SHELL.SERIF, fontSize: 20, color: SHELL.INK }}>{value}</div>
    </div>
  );
}

function StatusPill({ status }: { status: 'strong' | 'soft' | 'theatre' }) {
  const colors = {
    strong: { bg: 'rgba(15,118,110,0.10)', fg: '#0f766e', border: 'rgba(15,118,110,0.32)' },
    soft: { bg: 'rgba(217,119,6,0.10)', fg: '#b45309', border: 'rgba(217,119,6,0.32)' },
    theatre: { bg: 'rgba(220,38,38,0.10)', fg: '#b91c1c', border: 'rgba(220,38,38,0.32)' },
  }[status];
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        padding: '2px 8px',
        borderRadius: 999,
        background: colors.bg,
        border: `1px solid ${colors.border}`,
        color: colors.fg,
        fontFamily: SHELL.MONO,
        fontSize: 10,
        letterSpacing: '0.06em',
        textTransform: 'uppercase',
        fontWeight: 700,
      }}
    >
      {status} walkaway
    </span>
  );
}

function LiveArtifactCard({ artifact }: { artifact: Artifact }) {
  switch (artifact.type) {
    case 'pattern-match':
      return <PatternArtifact artifact={artifact} />;
    case 'evidence-highlight':
      return <EvidenceArtifact artifact={artifact} />;
    case 'cross-program-dependency':
      return <DependencyArtifact artifact={artifact} />;
    case 'gate-evaluation':
      return <GateArtifact artifact={artifact} />;
    case 'phase-progress':
      return <ProgressArtifact artifact={artifact} />;
    case 'anti-pattern-flag':
      return <AntiPatternArtifact artifact={artifact} />;
    case 'contradiction-flag':
      return <ContradictionArtifact artifact={artifact} />;
    default:
      return null;
  }
}

function PatternArtifact({ artifact }: { artifact: PatternMatchArtifact }) {
  return (
    <Card kind="Pattern match">
      <div style={{ fontWeight: 700, fontSize: 13.5 }}>{artifact.name}</div>
      <div style={{ marginTop: 2, fontFamily: SHELL.MONO, fontSize: 10.5, color: '#1B2B5C' }}>{artifact.patternId}</div>
      <p style={{ ...MUTED, marginTop: 8 }}>{artifact.summary}</p>
    </Card>
  );
}

function EvidenceArtifact({ artifact }: { artifact: EvidenceHighlightArtifact }) {
  return (
    <Card kind="Evidence">
      <div style={{ fontWeight: 700, fontSize: 13.5 }}>{artifact.label ?? artifact.evidenceId}</div>
      <p style={{ ...MUTED, marginTop: 8 }}>{artifact.reason}</p>
    </Card>
  );
}

function DependencyArtifact({ artifact }: { artifact: CrossProgramDependencyArtifact }) {
  return (
    <Card kind="Linked program">
      <Link href={`/programs/${artifact.programId}`} style={{ color: 'inherit', textDecoration: 'none' }}>
        <div style={{ fontWeight: 700, fontSize: 13.5 }}>{artifact.programName}</div>
        <div style={{ marginTop: 2, fontFamily: SHELL.MONO, fontSize: 10.5, color: '#1B2B5C' }}>
          {artifact.programId} - {artifact.currentPhase}
        </div>
      </Link>
    </Card>
  );
}

function GateArtifact({ artifact }: { artifact: GateEvaluationArtifact }) {
  return (
    <Card kind="Gate read">
      <div style={{ fontWeight: 700, fontSize: 13.5 }}>{artifact.gate}</div>
      <div style={{ marginTop: 2, fontFamily: SHELL.MONO, fontSize: 10.5, color: '#1B2B5C' }}>{artifact.status}</div>
      {artifact.detail ? <p style={{ ...MUTED, marginTop: 8 }}>{artifact.detail}</p> : null}
    </Card>
  );
}

function ProgressArtifact({ artifact }: { artifact: PhaseProgressArtifact }) {
  return (
    <Card kind="Stage evidence">
      <div style={{ fontWeight: 700, fontSize: 13.5 }}>{artifact.label}</div>
      <div style={{ marginTop: 2, fontFamily: SHELL.MONO, fontSize: 10.5, color: '#1B2B5C' }}>
        {artifact.severity} - {artifact.status}
      </div>
      {artifact.detail ? <p style={{ ...MUTED, marginTop: 8 }}>{artifact.detail}</p> : null}
    </Card>
  );
}

function AntiPatternArtifact({ artifact }: { artifact: AntiPatternFlagArtifact }) {
  return (
    <Card kind="Anti-pattern">
      <div style={{ fontWeight: 700, fontSize: 13.5 }}>{artifact.label}</div>
      <p style={{ ...MUTED, marginTop: 8 }}>{artifact.whatToFlag}</p>
      <p style={{ ...MUTED, marginTop: 6 }}>Redirect: {artifact.mitigation}</p>
    </Card>
  );
}

function ContradictionArtifact({ artifact }: { artifact: ContradictionFlagArtifact }) {
  return (
    <Card kind="Contradiction">
      <div style={{ fontWeight: 700, fontSize: 13.5 }}>{artifact.label}</div>
      <div style={{ marginTop: 2, fontFamily: SHELL.MONO, fontSize: 10.5, color: '#1B2B5C' }}>
        {artifact.partyA} vs {artifact.partyB} - {artifact.severity}
      </div>
      <p style={{ ...MUTED, marginTop: 8 }}>{artifact.resolutionPath}</p>
    </Card>
  );
}
