// I8 · Sentinel Interaction Rail (server component).
//
// Calm rail that mounts on intelligence pages and surfaces the
// deterministic Sentinel read: recent signals, active patterns,
// evidence confidence, and recommended actions. No client
// interactivity, no hooks, no live runtime, no model invocation.
//
// Imports are restricted to the I8 view helper, the AbarVa design
// tokens, and the AbarVa AgentBadge primitive. Reads tokens only —
// no local hex literals, no DM Sans literals.

import {
  BORDER,
  COLORS,
  FONT,
  RADIUS,
  SPACING,
  TYPE,
} from '@/lib/design/abarva-theme';
import { AgentBadge } from '@/components/abarva/AgentBadge';
import type {
  SentinelInteractionActivePattern,
  SentinelInteractionEvidenceConfidence,
  SentinelInteractionRailView,
  SentinelInteractionRecentSignal,
  SentinelInteractionRecommendedAction,
} from '@/lib/intelligence/sentinel-interaction-rail-view';

export interface SentinelInteractionRailProps {
  view: SentinelInteractionRailView;
}

export function SentinelInteractionRail({ view }: SentinelInteractionRailProps) {
  return (
    <aside
      data-sentinel-interaction-rail="i8"
      aria-label={`Sentinel interaction rail · ${view.tenantDisplayName}`}
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: SPACING.lg,
        padding: SPACING.xl,
        background: COLORS.card,
        border: BORDER.hairline,
        borderRadius: RADIUS.lg,
        fontFamily: FONT.body,
        color: COLORS.body,
      }}
    >
      <RailHeader view={view} />
      <HairlineDivider />
      <RecentSignalsSection signals={view.recentSignals} />
      <HairlineDivider />
      <ActivePatternsSection patterns={view.activePatterns} />
      <HairlineDivider />
      <EvidenceConfidenceSection confidence={view.evidenceConfidence} />
      <HairlineDivider />
      <RecommendedActionsSection actions={view.recommendedActions} />
      <HairlineDivider />
      <RailFooter caption={view.disclaimer} />
    </aside>
  );
}

// --- Header ---------------------------------------------------------

function RailHeader({ view }: { view: SentinelInteractionRailView }) {
  return (
    <header
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: SPACING.xs,
      }}
    >
      <div style={{ ...TYPE.eyebrow, color: COLORS.mutedSoft }}>
        {view.eyebrow}
      </div>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: SPACING.sm,
          flexWrap: 'wrap',
        }}
      >
        <AgentBadge agent="sentinel" status="rail" />
        <h2 style={{ ...TYPE.h3, margin: 0 }}>{view.title}</h2>
      </div>
    </header>
  );
}

// --- Recent Signals -------------------------------------------------

function RecentSignalsSection({
  signals,
}: {
  signals: readonly SentinelInteractionRecentSignal[];
}) {
  return (
    <section aria-label="Recent Sentinel signals">
      <SectionEyebrow label="Recent signals" />
      <ul
        style={{
          listStyle: 'none',
          margin: 0,
          padding: 0,
          display: 'flex',
          flexDirection: 'column',
          gap: SPACING.sm,
        }}
      >
        {signals.map((signal) => (
          <li
            key={signal.id}
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: SPACING.xs,
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: SPACING.sm,
              }}
            >
              <span style={{ ...TYPE.h3, margin: 0 }}>{signal.label}</span>
              <SeverityChip severity={signal.severity} />
            </div>
            <p style={{ ...TYPE.body, margin: 0 }}>{signal.summary}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}

function SeverityChip({
  severity,
}: {
  severity: SentinelInteractionRecentSignal['severity'];
}) {
  const tone = severityTone(severity);
  return (
    <span
      data-severity={severity}
      style={{
        fontFamily: FONT.mono,
        fontSize: 10,
        fontWeight: 500,
        letterSpacing: '0.10em',
        textTransform: 'uppercase',
        color: tone.fg,
        background: tone.bg,
        border: BORDER.hairlineSoft,
        borderRadius: RADIUS.pill,
        padding: '2px 8px',
        lineHeight: 1.4,
      }}
    >
      {severity}
    </span>
  );
}

function severityTone(
  severity: SentinelInteractionRecentSignal['severity'],
): { fg: string; bg: string } {
  if (severity === 'low' || severity === 'medium') {
    return { fg: COLORS.navy, bg: COLORS.navySoft };
  }
  if (severity === 'high') {
    return { fg: COLORS.amber, bg: COLORS.amberSoft };
  }
  return { fg: COLORS.red, bg: COLORS.redSoft };
}

// --- Active Patterns ------------------------------------------------

function ActivePatternsSection({
  patterns,
}: {
  patterns: readonly SentinelInteractionActivePattern[];
}) {
  return (
    <section aria-label="Active Sentinel patterns">
      <SectionEyebrow label="Active patterns" />
      <ul
        style={{
          listStyle: 'none',
          margin: 0,
          padding: 0,
          display: 'flex',
          flexDirection: 'column',
          gap: SPACING.sm,
        }}
      >
        {patterns.map((pattern) => (
          <li
            key={pattern.id}
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: SPACING.xs,
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'baseline',
                gap: SPACING.sm,
                flexWrap: 'wrap',
              }}
            >
              <span style={{ ...TYPE.h3, margin: 0 }}>{pattern.patternName}</span>
              <span
                style={{
                  fontFamily: FONT.mono,
                  fontSize: 10,
                  letterSpacing: '0.10em',
                  textTransform: 'uppercase',
                  color: COLORS.mutedSoft,
                }}
              >
                {pattern.patternKey}
              </span>
            </div>
            <p style={{ ...TYPE.body, margin: 0 }}>{pattern.whyActive}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}

// --- Evidence Confidence --------------------------------------------

function EvidenceConfidenceSection({
  confidence,
}: {
  confidence: SentinelInteractionEvidenceConfidence;
}) {
  return (
    <section aria-label="Evidence confidence">
      <SectionEyebrow label="Evidence confidence" />
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: SPACING.xs,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: SPACING.sm }}>
          <ConfidenceChip label={confidence.label} />
        </div>
        <p style={{ ...TYPE.body, margin: 0 }}>{confidence.basis}</p>
      </div>
    </section>
  );
}

function ConfidenceChip({
  label,
}: {
  label: SentinelInteractionEvidenceConfidence['label'];
}) {
  const tone =
    label === 'high'
      ? { fg: COLORS.navy, bg: COLORS.navySoft }
      : label === 'medium'
        ? { fg: COLORS.navy, bg: COLORS.navySoft }
        : { fg: COLORS.muted, bg: COLORS.surface2 };
  return (
    <span
      data-confidence={label}
      style={{
        fontFamily: FONT.mono,
        fontSize: 10,
        fontWeight: 500,
        letterSpacing: '0.10em',
        textTransform: 'uppercase',
        color: tone.fg,
        background: tone.bg,
        border: BORDER.hairlineSoft,
        borderRadius: RADIUS.pill,
        padding: '2px 8px',
        lineHeight: 1.4,
      }}
    >
      {label}
    </span>
  );
}

// --- Recommended Actions --------------------------------------------

function RecommendedActionsSection({
  actions,
}: {
  actions: readonly SentinelInteractionRecommendedAction[];
}) {
  return (
    <section aria-label="Recommended actions">
      <SectionEyebrow label="Recommended actions" />
      <ul
        style={{
          listStyle: 'none',
          margin: 0,
          padding: 0,
          display: 'flex',
          flexDirection: 'column',
          gap: SPACING.sm,
        }}
      >
        {actions.map((action) => (
          <li
            key={action.id}
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: SPACING.xs,
              opacity: action.enabled ? 1 : 0.78,
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: SPACING.sm,
                flexWrap: 'wrap',
              }}
            >
              <span style={{ ...TYPE.h3, margin: 0 }}>{action.label}</span>
              <span
                aria-hidden="true"
                data-enabled={action.enabled ? 'true' : 'false'}
                style={{
                  fontFamily: FONT.mono,
                  fontSize: 10,
                  fontWeight: 500,
                  letterSpacing: '0.10em',
                  textTransform: 'uppercase',
                  color: COLORS.mutedSoft,
                  border: BORDER.hairlineSoft,
                  borderRadius: RADIUS.pill,
                  padding: '2px 8px',
                  background: COLORS.surface2,
                }}
              >
                deferred
              </span>
            </div>
            <p style={{ ...TYPE.body, margin: 0 }}>{action.reason}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}

// --- Footer ---------------------------------------------------------

function RailFooter({ caption }: { caption: string }) {
  return (
    <footer>
      <p style={{ ...TYPE.caption, margin: 0 }}>{caption}</p>
    </footer>
  );
}

// --- Shared sub-components -----------------------------------------

function SectionEyebrow({ label }: { label: string }) {
  return (
    <div
      style={{
        ...TYPE.eyebrow,
        color: COLORS.mutedSoft,
        marginBottom: SPACING.sm,
      }}
    >
      {label}
    </div>
  );
}

function HairlineDivider() {
  return (
    <div
      aria-hidden="true"
      style={{ height: 1, background: COLORS.borderSoft }}
    />
  );
}
