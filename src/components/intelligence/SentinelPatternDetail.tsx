// I3 · Sentinel pattern detail surface.
//
// Server component. Renders the deterministic Pattern Detail view
// composed by buildSentinelPatternDetailView (I3 view helper).
//
// No live Sentinel runtime, no Claude / OpenAI invocation, no client
// interactivity in this slice. Component imports are restricted to
// the I3 view helper module.

import Link from 'next/link';
import type {
  SentinelPatternDetailView,
  SentinelPatternEvidenceTrailRow,
} from '@/lib/intelligence/sentinel-pattern-view';
import { buildSentinelPatternAuthoredContent } from '@/lib/intelligence/sentinel-pattern-content';
import { SentinelPatternContentPanel } from '@/components/intelligence/SentinelPatternContentPanel';
import { buildEvidenceDatasetDrawerView } from '@/lib/intelligence/evidence-dataset-drawer-view';
import { EvidenceDatasetDrawer } from '@/components/intelligence/EvidenceDatasetDrawer';
import { IntelligenceProvenanceRibbon } from '@/components/intelligence/IntelligenceProvenanceRibbon';
import { buildPatternProvenanceRibbonView } from '@/lib/intelligence/intelligence-provenance-ribbon-view';

interface SentinelPatternDetailProps {
  view: SentinelPatternDetailView;
}

const COLORS = {
  ink: '#1a1612',
  muted: '#5a5148',
  mutedSoft: '#8a7e72',
  border: 'rgba(26,22,18,0.08)',
  card: '#FFFFFF',
  surface: '#F8F7F4',
  accent: '#0E9F8C',
  accentSoft: 'rgba(14,159,140,0.08)',
  amber: '#D97706',
  amberSoft: 'rgba(217,119,6,0.08)',
  red: '#E04444',
  redSoft: 'rgba(224,68,68,0.1)',
  teal: '#1f7a8c',
  tealSoft: 'rgba(31,122,140,0.08)',
} as const;

export function SentinelPatternDetail({ view }: SentinelPatternDetailProps) {
  const accent = severityAccent(view.severityLabel);
  const accentBg = severityAccentBg(view.severityLabel);

  return (
    <article
      aria-label={`Sentinel pattern · ${view.patternName}`}
      style={{
        padding: '24px clamp(16px, 4vw, 32px)',
        background: COLORS.card,
        border: `1px solid ${COLORS.border}`,
        borderTop: `3px solid ${accent}`,
        borderRadius: 12,
        fontFamily: 'DM Sans, -apple-system, sans-serif',
        color: COLORS.ink,
        display: 'flex',
        flexDirection: 'column',
        gap: 18,
      }}
    >
      <Link
        href={view.intelligenceLandingHref}
        data-sentinel-back-to-intelligence
        style={{
          fontSize: 12,
          fontFamily: 'JetBrains Mono, monospace',
          color: COLORS.accent,
          textDecoration: 'none',
          fontWeight: 600,
        }}
      >
        ← Back to {view.tenant.displayName} Intelligence
      </Link>

      <header
        style={{
          display: 'flex',
          alignItems: 'baseline',
          justifyContent: 'space-between',
          gap: 12,
          flexWrap: 'wrap',
        }}
      >
        <div>
          <div
            style={{
              fontFamily: 'JetBrains Mono, monospace',
              fontSize: 10,
              letterSpacing: '0.14em',
              textTransform: 'uppercase',
              color: COLORS.mutedSoft,
              fontWeight: 700,
              marginBottom: 4,
            }}
          >
            {view.tenant.displayName} · Sentinel pattern · {view.patternKey}
          </div>
          <h1
            style={{
              margin: 0,
              fontFamily: 'Georgia, "Times New Roman", serif',
              fontSize: 26,
              fontWeight: 600,
              lineHeight: 1.25,
            }}
          >
            {view.title}
          </h1>
        </div>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          <Chip
            label={`severity · ${view.severityLabel.toLowerCase()}`}
            color={accent}
            background={accentBg}
            tooltip={view.interpretationBasis}
          />
          <Chip
            label={`confidence · ${view.confidenceLabel.toLowerCase()}`}
            color={COLORS.teal}
            background={COLORS.tealSoft}
            tooltip={view.interpretationBasis}
          />
          <Chip
            label={`source · ${view.sourceLabel.replace(/_/g, ' ')}`}
            color={COLORS.muted}
            background={COLORS.surface}
          />
        </div>
      </header>

      <p style={{ margin: 0, fontSize: 14, color: COLORS.muted, lineHeight: 1.6 }}>
        {view.summary}
      </p>

      <IntelligenceProvenanceRibbon view={buildPatternProvenanceRibbonView(view)} />

      <Block heading="Why it matters">
        <p style={{ margin: 0, fontSize: 14, lineHeight: 1.6, fontStyle: 'italic', color: COLORS.muted }}>
          {view.whyItMatters}
        </p>
      </Block>

      <Block heading="Recommended action" tone={accent}>
        <p style={{ margin: 0, fontSize: 14, lineHeight: 1.6 }}>
          {view.recommendedAction}
        </p>
      </Block>

      <Block heading={`Affected programs · ${view.affectedProgramRows.length}`}>
        {view.affectedProgramRows.length === 0 ? (
          <Empty>No programs are currently linked to this pattern.</Empty>
        ) : (
          <ul
            style={{
              margin: 0,
              paddingLeft: 0,
              listStyle: 'none',
              display: 'flex',
              flexDirection: 'column',
              gap: 6,
            }}
          >
            {view.affectedProgramRows.map((row) => (
              <li key={row.programCode}>
                <Link
                  href={row.routeHref}
                  data-sentinel-program-route={row.programCode}
                  style={{ fontSize: 13, color: COLORS.ink, textDecoration: 'none' }}
                >
                  <span style={{ color: COLORS.accent, fontWeight: 600 }}>
                    {row.programCode}
                  </span>{' '}
                  · {row.programName}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </Block>

      <Block heading={`Evidence trail · ${view.evidenceTrail.length} source signal(s)`}>
        <div
          style={{
            fontSize: 12,
            color: COLORS.mutedSoft,
            fontStyle: 'italic',
            marginBottom: 8,
          }}
        >
          {view.citationReadinessCaption}
        </div>
        {view.evidenceTrail.length === 0 ? (
          <Empty>No source signals are linked to this pattern in the seed today.</Empty>
        ) : (
          <ul
            style={{
              margin: 0,
              paddingLeft: 0,
              listStyle: 'none',
              display: 'flex',
              flexDirection: 'column',
              gap: 8,
            }}
          >
            {view.evidenceTrail.map((row) => (
              <EvidenceTrailRowItem key={row.signalId} row={row} />
            ))}
          </ul>
        )}
      </Block>

      <Block heading={`Missing inputs · ${view.missingInputs.length}`}>
        {view.missingInputs.length === 0 ? (
          <Empty>No missing-input rows are linked to this pattern in the seed today.</Empty>
        ) : (
          <ul
            style={{
              margin: '0 0 0 18px',
              padding: 0,
              fontSize: 13,
              color: COLORS.muted,
              lineHeight: 1.55,
              display: 'flex',
              flexDirection: 'column',
              gap: 4,
            }}
          >
            {view.missingInputs.slice(0, 12).map((m) => (
              <li key={m}>{m}</li>
            ))}
            {view.missingInputs.length > 12 ? (
              <li style={{ color: COLORS.mutedSoft, listStyle: 'none' }}>
                + {view.missingInputs.length - 12} more
              </li>
            ) : null}
          </ul>
        )}
      </Block>

      <Block heading={`Suggested handoffs · ${view.handoffRows.length}`}>
        {view.handoffRows.length === 0 ? (
          <Empty>No handoffs suggested for this pattern in the current detection mix.</Empty>
        ) : (
          <ul
            style={{
              margin: 0,
              paddingLeft: 0,
              listStyle: 'none',
              display: 'flex',
              flexDirection: 'column',
              gap: 6,
            }}
          >
            {view.handoffRows.map((row) => (
              <li
                key={row.target}
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'minmax(120px, 140px) 1fr',
                  gap: 10,
                  alignItems: 'baseline',
                  fontSize: 13,
                  color: COLORS.muted,
                }}
              >
                <span
                  style={{
                    fontFamily: 'JetBrains Mono, monospace',
                    fontSize: 10,
                    letterSpacing: '0.12em',
                    textTransform: 'uppercase',
                    fontWeight: 700,
                    color: COLORS.ink,
                  }}
                >
                  handoff · {row.target}
                </span>
                <span>{row.reason}</span>
              </li>
            ))}
          </ul>
        )}
      </Block>

      <PatternAuthoredContentSection view={view} />

      <EvidenceDatasetDrawerSection view={view} />

      <footer
        style={{
          fontSize: 11,
          color: COLORS.mutedSoft,
          fontStyle: 'italic',
          paddingTop: 8,
          borderTop: `1px dashed ${COLORS.border}`,
        }}
      >
        Composed deterministically from the I1 Sentinel pattern detection
        read model. {view.interpretationBasis} No live Sentinel runtime,
        no live retrieval, no Atlas / Claude / OpenAI invocation.
      </footer>
    </article>
  );
}

// --- Sub-components ---------------------------------------------------

function PatternAuthoredContentSection({ view }: { view: SentinelPatternDetailView }) {
  const content = buildSentinelPatternAuthoredContent(view.patternKey);
  if (!content) return null;
  const tenantSlug = view.tenant.routeSlug;
  return (
    <SentinelPatternContentPanel
      content={content}
      intelligenceLandingHref={view.intelligenceLandingHref}
      buildRelatedPatternHref={(patternKey) =>
        `/tenant/${tenantSlug}/intelligence/patterns/${patternKey}`
      }
    />
  );
}

function EvidenceDatasetDrawerSection({ view }: { view: SentinelPatternDetailView }) {
  const drawer = buildEvidenceDatasetDrawerView(view.patternKey);
  if (drawer.totalEntries === 0) return null;
  return <EvidenceDatasetDrawer view={drawer} />;
}

function Block({
  heading,
  tone,
  children,
}: {
  heading: string;
  tone?: string;
  children: React.ReactNode;
}) {
  return (
    <section style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <h2
        style={{
          margin: 0,
          fontFamily: 'JetBrains Mono, monospace',
          fontSize: 11,
          letterSpacing: '0.14em',
          textTransform: 'uppercase',
          color: tone ?? COLORS.mutedSoft,
          fontWeight: 700,
        }}
      >
        {heading}
      </h2>
      {children}
    </section>
  );
}

function EvidenceTrailRowItem({ row }: { row: SentinelPatternEvidenceTrailRow }) {
  const sevAccent = severityAccent(row.signalSeverity.toUpperCase());
  return (
    <li
      style={{
        padding: 10,
        background: COLORS.surface,
        border: `1px solid ${COLORS.border}`,
        borderLeft: `3px solid ${sevAccent}`,
        borderRadius: 8,
        display: 'flex',
        flexDirection: 'column',
        gap: 4,
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'baseline',
          justifyContent: 'space-between',
          gap: 8,
          flexWrap: 'wrap',
        }}
      >
        <span
          style={{
            fontFamily: 'JetBrains Mono, monospace',
            fontSize: 10,
            letterSpacing: '0.12em',
            color: COLORS.muted,
          }}
        >
          {row.signalId}
        </span>
        <span
          style={{
            fontFamily: 'JetBrains Mono, monospace',
            fontSize: 10,
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            color: sevAccent,
            fontWeight: 700,
          }}
        >
          {row.signalType.replace(/_/g, ' ')} · {row.signalSeverity}
        </span>
      </div>
      <Link
        href={row.routeHref}
        data-sentinel-evidence-route={row.programCode}
        style={{ fontSize: 13, color: COLORS.ink, textDecoration: 'none' }}
      >
        <span style={{ color: COLORS.accent, fontWeight: 600 }}>
          {row.programCode}
        </span>{' '}
        · {row.programName}
      </Link>
      <span
        style={{
          fontSize: 11,
          color: COLORS.mutedSoft,
          fontStyle: 'italic',
        }}
      >
        {row.citationCaption}
      </span>
    </li>
  );
}

function Chip({
  label,
  color,
  background,
  tooltip,
}: {
  label: string;
  color: string;
  background: string;
  tooltip?: string;
}) {
  return (
    <span
      title={tooltip}
      style={{
        fontFamily: 'JetBrains Mono, monospace',
        fontSize: 10,
        letterSpacing: '0.12em',
        textTransform: 'uppercase',
        fontWeight: 700,
        padding: '2px 8px',
        borderRadius: 999,
        background,
        color,
      }}
    >
      {label}
    </span>
  );
}

function Empty({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        padding: '12px 14px',
        background: COLORS.surface,
        border: `1px dashed ${COLORS.border}`,
        borderRadius: 8,
        fontSize: 13,
        color: COLORS.muted,
        lineHeight: 1.55,
      }}
    >
      {children}
    </div>
  );
}

function severityAccent(label: string): string {
  switch (label.toUpperCase()) {
    case 'CRITICAL':
      return COLORS.red;
    case 'HIGH':
      return COLORS.amber;
    case 'MEDIUM':
      return COLORS.accent;
    case 'LOW':
      return COLORS.mutedSoft;
    default:
      return COLORS.mutedSoft;
  }
}

function severityAccentBg(label: string): string {
  switch (label.toUpperCase()) {
    case 'CRITICAL':
      return COLORS.redSoft;
    case 'HIGH':
      return COLORS.amberSoft;
    case 'MEDIUM':
      return COLORS.accentSoft;
    case 'LOW':
      return 'rgba(26,22,18,0.06)';
    default:
      return 'rgba(26,22,18,0.06)';
  }
}
