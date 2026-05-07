// Intelligence v3 · Today canvas.
//
// The default stage. Renders four substrate-derived blocks
// (Three substrates · AI trajectory · Pressure cards · Conversation
// context), the Art of the Possible 3-layer Move grid, and the
// "What we can't yet see" honest-restraint footer.
//
// All content is currently driven by a fixture (demo-data.ts) so the
// surface can be reviewed against the wireframe. The next wave wires
// this to AgentContextBroker per tenant.

import { COLORS, FONT, BORDER, SPACING, RADIUS } from '@/lib/design/abarva-theme';
import { ArtOfThePossibleGrid } from './ArtOfThePossibleGrid';
import type { IntelligenceV3PageData, PressureCard } from './types';

interface Props {
  data: IntelligenceV3PageData;
}

export function TodayCanvas({ data }: Props) {
  return (
    <section
      id="stage-panel-today"
      role="tabpanel"
      aria-labelledby="stage-tab-today"
      style={{ display: 'flex', flexDirection: 'column', gap: SPACING.md }}
    >
      <SectionHeader>Knowledge &amp; Context</SectionHeader>

      <ThreeSubstratesPanel data={data} />

      <Block label={data.aiTrajectory.headline}>
        {data.aiTrajectory.body}
      </Block>

      <Block label="Today · pressure cards">
        <PressureCardList cards={data.pressureCards} />
      </Block>

      <Block label="Conversation context" tone="dynamic">
        Active thread: {data.conversationContext.activeThread} · Layer
        focused: {data.conversationContext.layerFocus}
      </Block>

      <SectionHeader tone="action" style={{ marginTop: SPACING.sm }}>
        Art of the Possible
      </SectionHeader>

      <ArtOfThePossibleGrid columns={data.artOfThePossible} />

      <Block label="What we can't yet see" tone="muted">
        {data.whatWeCantSee.join(' · ')}
      </Block>
    </section>
  );
}

function ThreeSubstratesPanel({ data }: { data: IntelligenceV3PageData }) {
  const cards: ReadonlyArray<{
    eyebrow: string;
    title: string;
    stat: string;
  }> = [
    {
      eyebrow: 'Tenant',
      title: 'What we know about you',
      stat: `${data.substrate.tenantLoaded} / ${data.substrate.tenantTotal}`,
    },
    {
      eyebrow: 'Corpus',
      title: 'What patterns exist',
      stat: `${data.substrate.corpus.failureModes} / ${data.substrate.corpus.patternRecords} / ${data.substrate.corpus.researchAnchors}`,
    },
    {
      eyebrow: 'Industry',
      title: 'What is possible',
      stat: data.industry,
    },
  ];

  return (
    <Block label="Three substrates">
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: SPACING.xs,
          marginTop: SPACING.xs,
        }}
      >
        {cards.map((c) => (
          <div
            key={c.eyebrow}
            style={{
              border: BORDER.hairline,
              background: COLORS.surface,
              borderRadius: RADIUS.sm,
              padding: SPACING.sm,
            }}
          >
            <div
              style={{
                fontFamily: FONT.mono,
                fontSize: 9,
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                color: COLORS.muted,
              }}
            >
              {c.eyebrow}
            </div>
            <div
              style={{
                fontFamily: FONT.body,
                fontSize: 13,
                fontWeight: 600,
                color: COLORS.navy,
                margin: '2px 0',
              }}
            >
              {c.title}
            </div>
            <div
              style={{
                fontFamily: FONT.body,
                fontSize: 16,
                fontWeight: 700,
                color: COLORS.ink,
              }}
            >
              {c.stat}
            </div>
          </div>
        ))}
      </div>
    </Block>
  );
}

function PressureCardList({ cards }: { cards: ReadonlyArray<PressureCard> }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: SPACING.xs }}>
      {cards.map((c) => (
        <div
          key={c.title}
          style={{
            display: 'grid',
            gridTemplateColumns: 'auto 1fr',
            alignItems: 'start',
            gap: SPACING.md,
            padding: `${SPACING.xs}px 0`,
          }}
        >
          <span
            aria-label={`Severity ${c.severity}`}
            style={{
              fontFamily: FONT.mono,
              fontSize: 10,
              fontWeight: 700,
              letterSpacing: '0.08em',
              color: severityColor(c.severity).text,
              background: severityColor(c.severity).bg,
              padding: `2px ${SPACING.xs}px`,
              borderRadius: RADIUS.sm,
              minWidth: 48,
              textAlign: 'center',
            }}
          >
            {c.severity}
          </span>
          <div>
            <div
              style={{
                fontFamily: FONT.body,
                fontSize: 13,
                fontWeight: 600,
                color: COLORS.ink,
              }}
            >
              {c.title}
            </div>
            <div
              style={{
                fontFamily: FONT.body,
                fontSize: 12,
                color: COLORS.muted,
                marginTop: 2,
              }}
            >
              {c.body}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function severityColor(severity: PressureCard['severity']) {
  switch (severity) {
    case 'HIGH':
      return { bg: COLORS.redSoft, text: COLORS.red };
    case 'MEDIUM':
      return { bg: COLORS.amberSoft, text: COLORS.amber };
    case 'WATCH':
    default:
      return { bg: COLORS.surface2, text: COLORS.muted };
  }
}

// ---------------------------------------------------------------------
// Layout primitives
// ---------------------------------------------------------------------

function SectionHeader({
  children,
  tone = 'default',
  style,
}: {
  children: React.ReactNode;
  tone?: 'default' | 'action';
  style?: React.CSSProperties;
}) {
  const accent = tone === 'action' ? COLORS.amber : COLORS.navy;
  return (
    <h2
      style={{
        background: COLORS.navyDark,
        color: COLORS.surface,
        padding: `${SPACING.sm}px ${SPACING.md}px`,
        fontFamily: FONT.body,
        fontSize: 13,
        fontWeight: 600,
        margin: 0,
        borderLeft: `3px solid ${accent}`,
        borderRadius: `${RADIUS.sm}px ${RADIUS.sm}px 0 0`,
        ...style,
      }}
    >
      {children}
    </h2>
  );
}

function Block({
  label,
  tone = 'default',
  children,
}: {
  label: string;
  tone?: 'default' | 'dynamic' | 'muted';
  children: React.ReactNode;
}) {
  const isDynamic = tone === 'dynamic';
  const isMuted = tone === 'muted';
  return (
    <div
      style={{
        border: isDynamic
          ? `1px solid ${COLORS.amber}`
          : BORDER.hairline,
        background: isDynamic
          ? 'rgba(180, 83, 9, 0.04)'
          : isMuted
            ? COLORS.surface2
            : COLORS.card,
        borderRadius: RADIUS.sm,
        padding: SPACING.md,
      }}
    >
      <div
        style={{
          fontFamily: FONT.mono,
          fontSize: 9,
          fontWeight: 600,
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
          color: isDynamic ? COLORS.amber : COLORS.muted,
          marginBottom: SPACING.xs,
        }}
      >
        {label}
      </div>
      <div style={{ fontFamily: FONT.body, fontSize: 13, color: COLORS.body }}>
        {children}
      </div>
    </div>
  );
}
