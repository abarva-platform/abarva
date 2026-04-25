// Programs → Control Tower pressure cards. S9f slice.
//
// Server component (default). Renders the deterministic Programs
// signal read model from S9e as a Tower section: an executive strip
// at the top, then the top N pressure cards. Each card links back
// to the canonical tenant program detail route.
//
// This component does NOT re-derive signals from program seed data;
// it consumes the S9e read model via the pure helper at
// src/lib/tower/program-pressure-view.ts.
//
// No client interactivity in this slice. No model call. No Atlas
// runtime touch.

import Link from 'next/link';
import {
  buildAtlasProgramPressureBrief,
  buildTowerProgramPressureView,
  type AtlasProgramPressureBrief,
  type TowerProgramPressureView,
} from '@/lib/tower/program-pressure-view';
import type {
  ProgramControlTowerSignal,
  ProgramPressureSeverity,
} from '@/lib/programs/programs-control-tower-signals';
import type { TenantSeedPlan } from '@/lib/programs/enhancement-seed-planner';
import { COLORS as ABARVA_COLORS } from '@/lib/design/abarva-theme';

interface ProgramPressureCardsProps {
  /** Tenant seed plan. Component derives signals via the S9e read model. */
  tenant: TenantSeedPlan;
  /**
   * Optional pre-computed view. When omitted, the component derives
   * the view from the tenant via buildTowerProgramPressureView.
   * Useful for tests and for callers that already hold the view.
   */
  view?: TowerProgramPressureView;
  /** How many cards to render. Defaults to 5. */
  topN?: number;
}

// DES5 · refreshed against AbarVa visual canon. Brand accent shifts
// from teal to NAVY; surface tones lift onto the canonical
// off-white palette. Atlas keeps the dark-hero option for the
// future ACT10 redesign — for now this surface stays light-card.
const COLORS = {
  ink: ABARVA_COLORS.ink,
  muted: ABARVA_COLORS.muted,
  mutedSoft: ABARVA_COLORS.mutedSoft,
  border: ABARVA_COLORS.border,
  borderSoft: ABARVA_COLORS.borderSoft,
  card: ABARVA_COLORS.card,
  surface: ABARVA_COLORS.surface,
  accent: ABARVA_COLORS.navy,
  accentSoft: ABARVA_COLORS.navySoft,
  amber: ABARVA_COLORS.amber,
  amberSoft: ABARVA_COLORS.amberSoft,
  red: ABARVA_COLORS.red,
  redSoft: ABARVA_COLORS.redSoft,
} as const;

export function ProgramPressureCards({ tenant, view, topN }: ProgramPressureCardsProps) {
  const resolvedView = view ?? buildTowerProgramPressureView(tenant, topN);
  const { signals, summary, topCards, strip } = resolvedView;
  const brief = buildAtlasProgramPressureBrief(tenant, signals, summary);

  return (
    <section
      data-abarva-refreshed="des5"
      aria-label="Programs pressure cards"
      style={{
        padding: '20px 22px',
        background: COLORS.card,
        border: `1px solid ${COLORS.border}`,
        borderRadius: 12,
        fontFamily: 'DM Sans, -apple-system, sans-serif',
        color: COLORS.ink,
        display: 'flex',
        flexDirection: 'column',
        gap: 16,
      }}
    >
      <header>
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
          {tenant.displayName} · Programs pressure · seed-only
        </div>
        <h2
          style={{
            margin: 0,
            fontFamily: 'Georgia, "Times New Roman", serif',
            fontSize: 22,
            fontWeight: 600,
            lineHeight: 1.25,
          }}
        >
          Programs pressure signals
        </h2>
      </header>

      <AtlasExecutiveBriefPanel brief={brief} />

      <ExecutiveStrip strip={strip} signalsCount={signals.length} />

      <SignalCounts summary={summary} />

      {topCards.length === 0 ? (
        <EmptyState />
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
            gap: 12,
          }}
        >
          {topCards.map((signal) => (
            <PressureCard key={signal.id} signal={signal} />
          ))}
        </div>
      )}

      <footer
        style={{
          fontSize: 11,
          color: COLORS.mutedSoft,
          fontStyle: 'italic',
          paddingTop: 8,
          borderTop: `1px dashed ${COLORS.border}`,
        }}
      >
        Composed deterministically from the S9e Programs Control Tower signal read model. No live agent or model call. Atlas runtime subscriber + persistence are deferred to a later slice.
      </footer>
    </section>
  );
}

// --- Sub-components ---------------------------------------------------

function AtlasExecutiveBriefPanel({ brief }: { brief: AtlasProgramPressureBrief }) {
  const accent = atlasBriefAccent(brief.confidenceLabel);
  const accentBg = atlasBriefAccentBg(brief.confidenceLabel);
  return (
    <article
      aria-label="Atlas executive brief"
      style={{
        padding: '18px 22px',
        background: COLORS.card,
        border: `1px solid ${COLORS.border}`,
        borderLeft: `3px solid ${accent}`,
        borderRadius: 12,
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
      }}
    >
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
              color: accent,
              fontWeight: 700,
              marginBottom: 4,
            }}
          >
            Atlas executive brief · {brief.sourceLabel.replace(/_/g, ' ')}
          </div>
          <h3
            style={{
              margin: 0,
              fontFamily: 'Georgia, "Times New Roman", serif',
              fontSize: 18,
              fontWeight: 600,
              lineHeight: 1.3,
              color: COLORS.ink,
            }}
          >
            {brief.title}
          </h3>
        </div>
        <span
          style={{
            fontFamily: 'JetBrains Mono, monospace',
            fontSize: 10,
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            fontWeight: 700,
            padding: '2px 8px',
            borderRadius: 999,
            background: accentBg,
            color: accent,
          }}
          title={brief.interpretationBasis}
        >
          confidence · {brief.confidenceLabel.replace(/_/g, ' ')}
        </span>
      </header>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <BriefLine label="Top pressure" value={brief.topPressure} />
        <BriefLine label="Why it matters" value={brief.whyItMatters} />
        <BriefLine label="Programs affected" value={brief.programsAffected} />
        {brief.evidenceValueWarning ? (
          <BriefLine
            label="Evidence + value"
            value={brief.evidenceValueWarning}
            tone={COLORS.amber}
          />
        ) : null}
        <BriefLine
          label="Recommended action"
          value={brief.recommendedExecutiveAction}
          tone={accent}
        />
      </div>

      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 6,
          paddingTop: 8,
          borderTop: `1px dashed ${COLORS.border}`,
        }}
      >
        <span
          style={{
            fontFamily: 'JetBrains Mono, monospace',
            fontSize: 10,
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            fontWeight: 700,
            color: COLORS.mutedSoft,
          }}
        >
          Ask Atlas · suggested follow-ups · {brief.suggestedFollowUps.length}
        </span>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {brief.suggestedFollowUps.map((followUp) => (
            <button
              key={followUp.id}
              type="button"
              disabled
              aria-disabled="true"
              data-atlas-followup-id={followUp.id}
              title={`${followUp.reason} · live Atlas runtime is deferred`}
              style={{
                padding: '8px 12px',
                background: COLORS.surface,
                border: `1px solid ${COLORS.border}`,
                borderRadius: 8,
                color: COLORS.muted,
                fontSize: 12,
                fontWeight: 500,
                cursor: 'not-allowed',
                opacity: 0.85,
                fontFamily: 'inherit',
                textAlign: 'left',
                display: 'inline-flex',
                flexDirection: 'column',
                gap: 2,
                maxWidth: 320,
              }}
            >
              <span style={{ color: COLORS.ink }}>{followUp.label}</span>
              <span
                style={{
                  fontFamily: 'JetBrains Mono, monospace',
                  fontSize: 10,
                  letterSpacing: '0.12em',
                  textTransform: 'uppercase',
                  color: COLORS.mutedSoft,
                  fontWeight: 700,
                }}
              >
                deferred · live atlas runtime
              </span>
            </button>
          ))}
        </div>
      </div>

      <div
        style={{
          fontSize: 11,
          color: COLORS.mutedSoft,
          fontStyle: 'italic',
        }}
      >
        {brief.interpretationBasis}
      </div>
    </article>
  );
}

function BriefLine({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone?: string;
}) {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'minmax(140px, 180px) 1fr',
        gap: 12,
        alignItems: 'baseline',
      }}
    >
      <span
        style={{
          fontFamily: 'JetBrains Mono, monospace',
          fontSize: 10,
          letterSpacing: '0.14em',
          textTransform: 'uppercase',
          color: COLORS.mutedSoft,
          fontWeight: 700,
        }}
      >
        {label}
      </span>
      <span style={{ fontSize: 13, color: tone ?? COLORS.ink, lineHeight: 1.55 }}>
        {value}
      </span>
    </div>
  );
}

function atlasBriefAccent(label: AtlasProgramPressureBrief['confidenceLabel']): string {
  switch (label) {
    case 'high':
      return COLORS.accent;
    case 'medium':
      return COLORS.amber;
    case 'low':
      return COLORS.mutedSoft;
    case 'no_signals':
      return COLORS.mutedSoft;
  }
}

function atlasBriefAccentBg(label: AtlasProgramPressureBrief['confidenceLabel']): string {
  switch (label) {
    case 'high':
      return COLORS.accentSoft;
    case 'medium':
      return COLORS.amberSoft;
    case 'low':
      return 'rgba(26,22,18,0.06)';
    case 'no_signals':
      return 'rgba(26,22,18,0.06)';
  }
}

function ExecutiveStrip({
  strip,
  signalsCount,
}: {
  strip: TowerProgramPressureView['strip'];
  signalsCount: number;
}) {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
        gap: 10,
        padding: '12px 14px',
        background: COLORS.surface,
        border: `1px solid ${COLORS.border}`,
        borderRadius: 10,
      }}
    >
      <StripMetric label="Program pressure signals" value={strip.totalSignals} />
      <StripMetric
        label="Top severity"
        value={strip.topSeverity}
        accent={severityAccent(
          (strip.topSeverity.toLowerCase() as ProgramPressureSeverity) ?? null,
        )}
      />
      <StripMetric label="Programs affected" value={strip.programsAffected} />
      <StripMetric
        label="Evidence/value readiness gaps"
        value={strip.evidenceValueGaps}
        sub={signalsCount > 0 ? 'of total signals' : undefined}
      />
    </div>
  );
}

function StripMetric({
  label,
  value,
  sub,
  accent,
}: {
  label: string;
  value: string;
  sub?: string;
  accent?: string;
}) {
  return (
    <div>
      <div
        style={{
          fontFamily: 'JetBrains Mono, monospace',
          fontSize: 10,
          letterSpacing: '0.14em',
          textTransform: 'uppercase',
          color: COLORS.mutedSoft,
          fontWeight: 700,
          marginBottom: 2,
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontSize: 20,
          fontWeight: 600,
          color: accent ?? COLORS.ink,
          lineHeight: 1.2,
        }}
      >
        {value}
      </div>
      {sub ? (
        <div style={{ fontSize: 11, color: COLORS.mutedSoft, marginTop: 2 }}>
          {sub}
        </div>
      ) : null}
    </div>
  );
}

function SignalCounts({
  summary,
}: {
  summary: TowerProgramPressureView['summary'];
}) {
  if (summary.totalCount === 0) return null;
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: 10,
      }}
    >
      <div
        style={{
          padding: '10px 12px',
          background: COLORS.borderSoft,
          border: `1px solid ${COLORS.border}`,
          borderRadius: 8,
        }}
      >
        <div
          style={{
            fontFamily: 'JetBrains Mono, monospace',
            fontSize: 10,
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            color: COLORS.mutedSoft,
            fontWeight: 700,
            marginBottom: 6,
          }}
        >
          By severity
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          <SeverityChip label="critical" count={summary.bySeverity.critical} />
          <SeverityChip label="high" count={summary.bySeverity.high} />
          <SeverityChip label="medium" count={summary.bySeverity.medium} />
          <SeverityChip label="low" count={summary.bySeverity.low} />
        </div>
      </div>
      <div
        style={{
          padding: '10px 12px',
          background: COLORS.borderSoft,
          border: `1px solid ${COLORS.border}`,
          borderRadius: 8,
        }}
      >
        <div
          style={{
            fontFamily: 'JetBrains Mono, monospace',
            fontSize: 10,
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            color: COLORS.mutedSoft,
            fontWeight: 700,
            marginBottom: 6,
          }}
        >
          By type
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {(
            [
              ['executive_decision_needed', 'exec'],
              ['value_not_ready', 'value'],
              ['gate_missing_inputs', 'gate'],
              ['evidence_not_ready', 'evidence'],
              ['context_insufficient', 'context'],
              ['deliverable_coverage_gap', 'deliverable'],
            ] as const
          ).map(([type, short]) => (
            <TypeChip
              key={type}
              label={short}
              count={summary.byType[type]}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function SeverityChip({
  label,
  count,
}: {
  label: ProgramPressureSeverity;
  count: number;
}) {
  if (count === 0) return null;
  const accent = severityAccent(label);
  return (
    <span
      style={{
        fontFamily: 'JetBrains Mono, monospace',
        fontSize: 10,
        letterSpacing: '0.1em',
        textTransform: 'uppercase',
        fontWeight: 700,
        padding: '2px 8px',
        borderRadius: 999,
        background: severityBg(label),
        color: accent,
      }}
    >
      {label}
      <span style={{ marginLeft: 6, opacity: 0.75 }}>· {count}</span>
    </span>
  );
}

function TypeChip({ label, count }: { label: string; count: number }) {
  if (count === 0) return null;
  return (
    <span
      style={{
        fontFamily: 'JetBrains Mono, monospace',
        fontSize: 10,
        letterSpacing: '0.1em',
        textTransform: 'uppercase',
        fontWeight: 700,
        padding: '2px 8px',
        borderRadius: 999,
        background: 'rgba(26,22,18,0.06)',
        color: COLORS.muted,
      }}
    >
      {label}
      <span style={{ marginLeft: 6, opacity: 0.75 }}>· {count}</span>
    </span>
  );
}

function PressureCard({ signal }: { signal: ProgramControlTowerSignal }) {
  const accent = severityAccent(signal.severity);
  const bg = severityBg(signal.severity);
  return (
    <Link
      href={signal.routeHref}
      data-pressure-signal-id={signal.id}
      data-pressure-severity={signal.severity}
      data-pressure-type={signal.type}
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
        padding: '14px 16px',
        background: COLORS.card,
        border: `1px solid ${COLORS.border}`,
        borderLeft: `3px solid ${accent}`,
        borderRadius: 10,
        textDecoration: 'none',
        color: COLORS.ink,
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 8 }}>
        <span
          style={{
            fontFamily: 'JetBrains Mono, monospace',
            fontSize: 10,
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            color: COLORS.mutedSoft,
            fontWeight: 700,
          }}
        >
          {signal.programCode} · {signal.type.replace(/_/g, ' ')}
        </span>
        <span
          style={{
            fontFamily: 'JetBrains Mono, monospace',
            fontSize: 10,
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            fontWeight: 700,
            padding: '2px 8px',
            borderRadius: 999,
            background: bg,
            color: accent,
          }}
        >
          {signal.severity}
        </span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <span style={{ fontSize: 14, fontWeight: 600, color: COLORS.ink, lineHeight: 1.3 }}>
          {signal.title}
        </span>
        <span style={{ fontSize: 12, color: COLORS.muted, lineHeight: 1.5 }}>
          {signal.programName}
        </span>
      </div>

      <p style={{ margin: 0, fontSize: 13, color: COLORS.ink, lineHeight: 1.55 }}>
        {signal.summary}
      </p>

      {signal.missingInputs.length > 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <span
            style={{
              fontFamily: 'JetBrains Mono, monospace',
              fontSize: 10,
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              color: COLORS.mutedSoft,
              fontWeight: 700,
            }}
          >
            Missing inputs · {signal.missingInputs.length}
          </span>
          <ul style={{ listStyle: 'disc', paddingLeft: 16, margin: 0, display: 'flex', flexDirection: 'column', gap: 2 }}>
            {signal.missingInputs.slice(0, 3).map((input, i) => (
              <li key={`${signal.id}-mi-${i}`} style={{ fontSize: 11, color: COLORS.muted, lineHeight: 1.5 }}>
                {input}
              </li>
            ))}
            {signal.missingInputs.length > 3 ? (
              <li style={{ fontSize: 11, color: COLORS.mutedSoft, fontStyle: 'italic' }}>
                +{signal.missingInputs.length - 3} more
              </li>
            ) : null}
          </ul>
        </div>
      ) : null}

      <div
        style={{
          marginTop: 4,
          fontSize: 11,
          color: COLORS.muted,
          lineHeight: 1.5,
          fontStyle: 'italic',
        }}
      >
        Recommended action · {signal.recommendedAction}
      </div>

      <span
        style={{
          alignSelf: 'flex-end',
          marginTop: 4,
          fontFamily: 'JetBrains Mono, monospace',
          fontSize: 11,
          fontWeight: 700,
          letterSpacing: '0.12em',
          textTransform: 'uppercase',
          color: accent,
        }}
      >
        Open program →
      </span>
    </Link>
  );
}

function EmptyState() {
  return (
    <div
      style={{
        padding: '14px 16px',
        background: COLORS.borderSoft,
        border: `1px dashed ${COLORS.border}`,
        borderRadius: 10,
        fontSize: 13,
        color: COLORS.muted,
      }}
    >
      No Programs pressure signals for this tenant. The signal read model is fed by seed data only; future seed-population work will surface evidence and value gaps here.
    </div>
  );
}

function severityAccent(s: ProgramPressureSeverity | null): string {
  switch (s) {
    case 'critical':
      return COLORS.red;
    case 'high':
      return COLORS.amber;
    case 'medium':
      return COLORS.accent;
    case 'low':
      return COLORS.mutedSoft;
    default:
      return COLORS.mutedSoft;
  }
}

function severityBg(s: ProgramPressureSeverity | null): string {
  switch (s) {
    case 'critical':
      return COLORS.redSoft;
    case 'high':
      return COLORS.amberSoft;
    case 'medium':
      return COLORS.accentSoft;
    case 'low':
      return 'rgba(26,22,18,0.06)';
    default:
      return 'rgba(26,22,18,0.06)';
  }
}
