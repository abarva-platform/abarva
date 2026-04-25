// I2 · Tenant Intelligence surface · Sentinel brief + active patterns.
//
// Server component. Renders the deterministic I1 Sentinel pattern
// detections via the I2 view helper as:
//   - a Sentinel brief panel (what Sentinel sees, why it matters,
//     suggested follow-ups, recommended handoffs)
//   - an Active Pattern Detections grid
//
// No live Sentinel runtime, no live model call, no client
// interactivity in this slice. Component imports are restricted to
// the I2 view helper module.

import Link from 'next/link';
import {
  buildSentinelIntelligenceView,
  type SentinelBrief,
  type SentinelIntelligenceView,
  type SentinelPatternCard,
} from '@/lib/intelligence/sentinel-pattern-view';
import type { TenantSeedPlan } from '@/lib/programs/enhancement-seed-planner';

interface SentinelActivePatternsProps {
  tenant: TenantSeedPlan;
  /** Optional pre-computed view, useful for tests/snapshot harnesses. */
  view?: SentinelIntelligenceView;
}

const COLORS = {
  ink: '#1a1612',
  muted: '#5a5148',
  mutedSoft: '#8a7e72',
  border: 'rgba(26,22,18,0.08)',
  borderSoft: 'rgba(26,22,18,0.04)',
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

export function SentinelActivePatterns({ tenant, view }: SentinelActivePatternsProps) {
  const resolvedView = view ?? buildSentinelIntelligenceView(tenant);
  const { brief, cards, summary } = resolvedView;

  return (
    <section
      aria-label="Sentinel active patterns"
      style={{
        padding: '20px 22px',
        background: COLORS.card,
        border: `1px solid ${COLORS.border}`,
        borderRadius: 12,
        fontFamily: 'DM Sans, -apple-system, sans-serif',
        color: COLORS.ink,
        display: 'flex',
        flexDirection: 'column',
        gap: 18,
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
          {tenant.displayName} · Sentinel intelligence · seed-only
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
          Active pattern detections
        </h2>
      </header>

      <SentinelBriefPanel brief={brief} />

      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 10,
        }}
      >
        <SectionHeading
          eyebrow={`Active patterns · ${summary.totalCount}`}
          title="What Sentinel is mining from the Fabric"
        />

        {cards.length === 0 ? (
          <EmptyState />
        ) : (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
              gap: 12,
            }}
          >
            {cards.map((card) => (
              <PatternCard key={card.detection.id} card={card} />
            ))}
          </div>
        )}
      </div>

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
        read model. No live Sentinel runtime, no live retrieval, no
        Atlas / Claude / OpenAI invocation.
      </footer>
    </section>
  );
}

// --- Sub-components ---------------------------------------------------

function SentinelBriefPanel({ brief }: { brief: SentinelBrief }) {
  const accent = severityAccent(brief.topSeverity);
  const accentBg = severityAccentBg(brief.topSeverity);
  return (
    <article
      aria-label="Sentinel brief"
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
            Sentinel brief · {brief.sourceLabel.replace(/_/g, ' ')}
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
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          <Chip
            label={`severity · ${brief.topSeverity.toLowerCase()}`}
            color={accent}
            background={accentBg}
            tooltip={brief.interpretationBasis}
          />
          <Chip
            label={`confidence · ${brief.topConfidence.toLowerCase()}`}
            color={COLORS.teal}
            background={COLORS.tealSoft}
            tooltip={brief.interpretationBasis}
          />
        </div>
      </header>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <BriefLine label="Top pattern" value={brief.topPattern} tone={accent} />
        <BriefLine label="What Sentinel sees" value={brief.whatSentinelSees} />
        <BriefLine label="Why it matters" value={brief.whyItMatters} />
        <BriefLine label="Programs affected" value={brief.affectedPrograms} />
        <BriefLine
          label="Recommended action"
          value={brief.recommendedAction}
          tone={accent}
        />
        {brief.suggestedHandoffs.length > 0 ? (
          <BriefLine
            label="Handoffs"
            value={brief.suggestedHandoffs.join(' · ')}
          />
        ) : null}
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
          Ask Sentinel · suggested follow-ups · {brief.suggestedFollowUps.length}
        </span>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {brief.suggestedFollowUps.map((followUp) => (
            <button
              key={followUp.id}
              type="button"
              disabled
              aria-disabled="true"
              data-sentinel-followup-id={followUp.id}
              title={`${followUp.reason} · live Sentinel runtime is deferred`}
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
                deferred · live sentinel runtime
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

function PatternCard({ card }: { card: SentinelPatternCard }) {
  const { detection } = card;
  const accent = severityAccent(card.severityLabel);
  const accentBg = severityAccentBg(card.severityLabel);
  const confidenceBg = confidenceAccentBg(card.confidenceLabel);
  return (
    <article
      aria-label={`Pattern · ${detection.patternName}`}
      style={{
        padding: 16,
        background: COLORS.card,
        border: `1px solid ${COLORS.border}`,
        borderTop: `3px solid ${accent}`,
        borderRadius: 12,
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
      }}
    >
      <header
        style={{
          display: 'flex',
          alignItems: 'baseline',
          justifyContent: 'space-between',
          gap: 8,
          flexWrap: 'wrap',
        }}
      >
        <div
          style={{
            fontFamily: 'JetBrains Mono, monospace',
            fontSize: 10,
            letterSpacing: '0.14em',
            textTransform: 'uppercase',
            fontWeight: 700,
            color: accent,
          }}
        >
          {detection.patternName}
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          <MiniChip label={card.severityLabel} color={accent} background={accentBg} />
          <MiniChip
            label={`conf · ${card.confidenceLabel.toLowerCase()}`}
            color={COLORS.teal}
            background={confidenceBg}
          />
        </div>
      </header>

      <h3
        style={{
          margin: 0,
          fontFamily: 'Georgia, "Times New Roman", serif',
          fontSize: 15,
          fontWeight: 600,
          lineHeight: 1.35,
          color: COLORS.ink,
        }}
      >
        {detection.title}
      </h3>

      <p style={{ margin: 0, fontSize: 13, color: COLORS.muted, lineHeight: 1.55 }}>
        {detection.summary}
      </p>

      <p
        style={{
          margin: 0,
          fontSize: 12,
          color: COLORS.mutedSoft,
          lineHeight: 1.55,
          fontStyle: 'italic',
        }}
      >
        {detection.whyItMatters}
      </p>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
          gap: 6,
          fontFamily: 'JetBrains Mono, monospace',
          fontSize: 11,
          color: COLORS.muted,
        }}
      >
        <Stat label="Programs" value={String(card.affectedProgramCount)} />
        <Stat label="Source signals" value={String(card.sourceSignalCount)} />
      </div>

      {detection.affectedPrograms.length > 0 ? (
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
            Affected programs
          </span>
          <ul
            style={{
              margin: 0,
              paddingLeft: 0,
              listStyle: 'none',
              display: 'flex',
              flexDirection: 'column',
              gap: 2,
            }}
          >
            {detection.affectedPrograms.slice(0, 4).map((ap) => (
              <li key={ap.programCode} style={{ fontSize: 12, color: COLORS.muted }}>
                <Link
                  href={ap.routeHref}
                  style={{ color: COLORS.ink, textDecoration: 'none' }}
                >
                  <span style={{ color: COLORS.accent, fontWeight: 600 }}>
                    {ap.programCode}
                  </span>{' '}
                  · {ap.programName}
                </Link>
              </li>
            ))}
            {detection.affectedPrograms.length > 4 ? (
              <li style={{ fontSize: 11, color: COLORS.mutedSoft }}>
                + {detection.affectedPrograms.length - 4} more
              </li>
            ) : null}
          </ul>
        </div>
      ) : null}

      {detection.missingInputs.length > 0 ? (
        <details>
          <summary
            style={{
              cursor: 'pointer',
              fontFamily: 'JetBrains Mono, monospace',
              fontSize: 10,
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              color: COLORS.mutedSoft,
              fontWeight: 700,
            }}
          >
            Missing inputs · {detection.missingInputs.length}
          </summary>
          <ul
            style={{
              margin: '6px 0 0 16px',
              padding: 0,
              fontSize: 12,
              color: COLORS.muted,
              lineHeight: 1.55,
            }}
          >
            {detection.missingInputs.slice(0, 5).map((m) => (
              <li key={m}>{m}</li>
            ))}
            {detection.missingInputs.length > 5 ? (
              <li style={{ color: COLORS.mutedSoft }}>
                + {detection.missingInputs.length - 5} more
              </li>
            ) : null}
          </ul>
        </details>
      ) : null}

      <div
        style={{
          paddingTop: 6,
          borderTop: `1px dashed ${COLORS.border}`,
          display: 'flex',
          flexDirection: 'column',
          gap: 4,
        }}
      >
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
          Recommended action
        </span>
        <span style={{ fontSize: 12, color: COLORS.ink, lineHeight: 1.55 }}>
          {detection.recommendedAction}
        </span>
      </div>

      {detection.handoffTargets.length > 0 ? (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {detection.handoffTargets.map((target) => (
            <MiniChip
              key={target}
              label={`handoff · ${target}`}
              color={COLORS.muted}
              background={COLORS.surface}
            />
          ))}
        </div>
      ) : null}

      <Link
        href={detection.routeHref}
        data-sentinel-pattern-route={detection.patternKey}
        style={{
          fontSize: 12,
          fontFamily: 'JetBrains Mono, monospace',
          color: COLORS.accent,
          textDecoration: 'none',
          fontWeight: 600,
        }}
      >
        Open pattern detail →
      </Link>
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

function SectionHeading({ eyebrow, title }: { eyebrow: string; title: string }) {
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
          marginBottom: 4,
        }}
      >
        {eyebrow}
      </div>
      <h3
        style={{
          margin: 0,
          fontFamily: 'Georgia, "Times New Roman", serif',
          fontSize: 16,
          fontWeight: 600,
          lineHeight: 1.3,
          color: COLORS.ink,
        }}
      >
        {title}
      </h3>
    </div>
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

function MiniChip({
  label,
  color,
  background,
}: {
  label: string;
  color: string;
  background: string;
}) {
  return (
    <span
      style={{
        fontFamily: 'JetBrains Mono, monospace',
        fontSize: 9,
        letterSpacing: '0.12em',
        textTransform: 'uppercase',
        fontWeight: 700,
        padding: '2px 6px',
        borderRadius: 999,
        background,
        color,
      }}
    >
      {label}
    </span>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <span
        style={{
          fontSize: 9,
          letterSpacing: '0.12em',
          textTransform: 'uppercase',
          color: COLORS.mutedSoft,
          fontWeight: 700,
        }}
      >
        {label}
      </span>
      <span style={{ color: COLORS.ink, fontWeight: 600 }}>{value}</span>
    </div>
  );
}

function EmptyState() {
  return (
    <div
      style={{
        padding: '20px 18px',
        background: COLORS.surface,
        border: `1px dashed ${COLORS.border}`,
        borderRadius: 10,
        fontSize: 13,
        color: COLORS.muted,
        lineHeight: 1.55,
      }}
    >
      No active pattern detections in the seed today. Once seed-population
      lands, evidence and value gaps will surface here automatically — no
      change to this page is required.
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

function confidenceAccentBg(label: string): string {
  switch (label.toUpperCase()) {
    case 'HIGH':
      return COLORS.tealSoft;
    case 'MEDIUM':
      return 'rgba(31,122,140,0.05)';
    case 'LOW':
      return 'rgba(26,22,18,0.04)';
    default:
      return 'rgba(26,22,18,0.04)';
  }
}
