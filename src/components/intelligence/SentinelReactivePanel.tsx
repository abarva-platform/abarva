'use client';

// SentinelReactivePanel · Surface 2 PR-INT-B of Programs Strict Completion v1.2
//
// Right-pane companion to AtlasDrawer on /intelligence. Materializes
// Sentinel's structured-artifact reasoning (pattern matches, evidence
// citations, cross-program dependencies) as cards that update live as
// the chat streams. Mirrors NexusReactivePanel's contract but is
// curated for Sentinel's librarian voice — citation discipline,
// pattern retrieval, contradiction surfacing.
//
// Sentinel is the librarian agent — corpus-wide knowledge retrieval,
// not program coaching — so this panel filters the artifact stream
// for the types Sentinel actually emits: pattern-match,
// evidence-highlight, cross-program-dependency. Future PR-INT-D adds
// graph-neighborhood and contradiction-flag.

import { useMemo } from 'react';
import type {
  Artifact,
  CrossProgramDependencyArtifact,
  EvidenceHighlightArtifact,
  PatternMatchArtifact,
} from '@/lib/agent/artifacts';
import { BrandColors, BrandTypography } from '@/lib/shell/brand-tokens';

export interface SentinelReactivePanelProps {
  /**
   * Artifacts dispatched by AtlasDrawer's onArtifact callback. Most
   * recent first — the panel reverses-time-order the rendered cards.
   */
  artifacts: Artifact[];
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
        Sentinel · {kind}
      </div>
      {children}
    </div>
  );
}

function PatternMatchCard({ a }: { a: PatternMatchArtifact }) {
  return (
    <CardShell kind="Pattern match">
      <a
        href={`/intelligence/${a.patternId}`}
        style={{ textDecoration: 'none', color: BrandColors.inkBlack }}
      >
        <div style={{ fontWeight: 600, fontSize: 13.5 }}>{a.name}</div>
        <div
          style={{
            fontFamily: BrandTypography.mono,
            fontSize: 11,
            color: BrandColors.signalBlue,
            marginTop: 2,
          }}
        >
          {a.patternId}
        </div>
        <p
          style={{
            margin: '6px 0 0',
            fontSize: 12,
            color: BrandColors.slate,
            lineHeight: 1.55,
          }}
        >
          {a.summary}
        </p>
        {(a.successRatePct !== undefined ||
          a.deploymentCount !== undefined ||
          a.typicalDurationMonths !== undefined) && (
          <div
            style={{
              display: 'flex',
              gap: 12,
              marginTop: 8,
              fontFamily: BrandTypography.mono,
              fontSize: 10,
              color: BrandColors.stone,
              letterSpacing: '0.04em',
            }}
          >
            {a.successRatePct !== undefined && <span>{a.successRatePct}% success</span>}
            {a.deploymentCount !== undefined && <span>{a.deploymentCount} deployments</span>}
            {a.typicalDurationMonths !== undefined && (
              <span>{a.typicalDurationMonths}mo typical</span>
            )}
          </div>
        )}
      </a>
    </CardShell>
  );
}

function EvidenceHighlightCard({ a }: { a: EvidenceHighlightArtifact }) {
  return (
    <CardShell kind="Evidence">
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
      <p
        style={{
          margin: '6px 0 0',
          fontSize: 12.5,
          color: BrandColors.slate,
          lineHeight: 1.55,
        }}
      >
        {a.reason}
      </p>
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

// ── Panel ─────────────────────────────────────────────────────────────────────

/**
 * Filter the artifact stream into the subset Sentinel surfaces.
 * Exported for unit testing — the panel itself just maps over the result.
 *
 * Behavior:
 *   - pattern-match, evidence-highlight, cross-program-dependency: kept.
 *   - Everything else: dropped (Programs / Surface 1 territory).
 *   - Result reversed so the most recent card lands at the top.
 *
 * PR-INT-D extends this with graph-neighborhood and contradiction-flag.
 */
export function selectVisibleSentinelArtifacts(artifacts: Artifact[]): Artifact[] {
  return artifacts
    .filter(
      (a) =>
        a.type === 'pattern-match' ||
        a.type === 'evidence-highlight' ||
        a.type === 'cross-program-dependency',
    )
    .reverse();
}

export function SentinelReactivePanel({ artifacts }: SentinelReactivePanelProps) {
  const visible = useMemo(() => selectVisibleSentinelArtifacts(artifacts), [artifacts]);

  if (visible.length === 0) {
    return (
      <section
        aria-label="Sentinel reactive workbench"
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
          Sentinel reasoning · live
        </div>
        <p style={{ margin: '4px 0 0', fontSize: 13, lineHeight: 1.55 }}>
          As you ask Sentinel about the corpus, pattern matches,
          evidence citations, and cross-program dependencies will
          materialize here — one card per piece of reasoning, in real
          time.
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
          Try &ldquo;Show me patterns like CDP activation&rdquo; or
          &ldquo;Cite evidence for vendor lock-in risk&rdquo; — cards
          will populate as Sentinel retrieves.
        </p>
      </section>
    );
  }

  return (
    <section
      aria-label="Sentinel reactive workbench"
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
        Sentinel reasoning · live
      </header>
      {visible.map((a, idx) => {
        const key = `${a.type}-${idx}`;
        switch (a.type) {
          case 'pattern-match':
            return <PatternMatchCard key={key} a={a} />;
          case 'evidence-highlight':
            return <EvidenceHighlightCard key={key} a={a} />;
          case 'cross-program-dependency':
            return <CrossProgramDependencyCard key={key} a={a} />;
          default:
            return null;
        }
      })}
    </section>
  );
}
