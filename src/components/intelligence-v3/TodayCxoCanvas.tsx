// Intelligence v3 · Today canvas (CXO mode · PR-K2.4).
//
// 3 attention items only · urgent / attn / opp. No sub-grids, no
// substrate panels — that detail belongs in dedicated stages. Reads
// the way a CEO/CIO would brief their morning standup.

import { COLORS, FONT, BORDER, SPACING, RADIUS } from '@/lib/design/abarva-theme';
import { CanvasHead } from './CanvasHead';
import {
  MERIDIAN_TODAY_ITEMS,
  type AttentionItem,
  type AttentionTone,
} from './cxo-fixtures';

const TONE_STYLES: Record<
  AttentionTone,
  { accent: string; bg: string; chip: string; chipText: string }
> = {
  urgent: {
    accent: '#B8443A',
    bg: 'rgba(184,68,58,0.04)',
    chip: 'rgba(184,68,58,0.12)',
    chipText: '#B8443A',
  },
  attn: {
    accent: '#C8881C',
    bg: 'rgba(200,136,28,0.04)',
    chip: 'rgba(200,136,28,0.14)',
    chipText: '#C8881C',
  },
  opp: {
    accent: '#0E8C7E',
    bg: 'rgba(14,140,126,0.04)',
    chip: 'rgba(14,140,126,0.14)',
    chipText: '#0E8C7E',
  },
};

interface Props {
  items?: ReadonlyArray<AttentionItem>;
  asOfLabel?: string;
}

export function TodayCxoCanvas({
  items = MERIDIAN_TODAY_ITEMS,
  asOfLabel = '09:14 PT · 2026-05-08',
}: Props) {
  return (
    <section data-canvas="today">
      <CanvasHead
        eyebrow={
          <>
            Stage · <span style={{ color: COLORS.ink }}>Today</span>
          </>
        }
        title="Three things that need your attention this morning."
        lead="Sentinel's overnight read · ranked by what changes if you don't act today. Each item names the bet, the why, and the dependency."
        meta={<>As of <strong style={{ color: COLORS.ink }}>{asOfLabel}</strong></>}
      />

      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: SPACING.md,
        }}
      >
        {items.map((item, i) => (
          <AttentionCard key={i} item={item} index={i + 1} />
        ))}
      </div>
    </section>
  );
}

function AttentionCard({ item, index }: { item: AttentionItem; index: number }) {
  const tone = TONE_STYLES[item.tone];
  return (
    <article
      data-tone={item.tone}
      style={{
        background: tone.bg,
        border: `1px solid ${tone.accent}`,
        borderLeft: `4px solid ${tone.accent}`,
        borderRadius: RADIUS.md,
        padding: `${SPACING.md}px ${SPACING.xl}px`,
        display: 'grid',
        gridTemplateColumns: 'auto 1fr auto',
        gap: SPACING.lg,
        alignItems: 'start',
      }}
    >
      <div
        style={{
          fontFamily: FONT.display,
          fontSize: 32,
          fontWeight: 300,
          color: tone.accent,
          lineHeight: 1,
          letterSpacing: '-0.018em',
          minWidth: 36,
        }}
      >
        {String(index).padStart(2, '0')}
      </div>
      <div>
        <div
          style={{
            fontFamily: FONT.mono,
            fontSize: 9.5,
            fontWeight: 700,
            letterSpacing: '0.18em',
            textTransform: 'uppercase',
            color: tone.chipText,
            marginBottom: 6,
          }}
        >
          {item.toneLabel}
        </div>
        <h3
          style={{
            fontFamily: FONT.display,
            fontSize: 20,
            fontWeight: 400,
            color: COLORS.ink,
            letterSpacing: '-0.01em',
            margin: '0 0 8px',
            lineHeight: 1.2,
          }}
        >
          {item.title}
        </h3>
        <p
          style={{
            fontSize: 13,
            color: COLORS.body,
            lineHeight: 1.55,
            margin: 0,
          }}
        >
          {item.body}
        </p>
        {item.dependency && (
          <div
            style={{
              fontFamily: FONT.mono,
              fontSize: 10,
              letterSpacing: '0.06em',
              color: COLORS.muted,
              marginTop: 10,
              padding: `4px ${SPACING.xs}px`,
              borderTop: BORDER.hairlineSoft,
              paddingTop: SPACING.xs,
            }}
          >
            ⛓ {item.dependency}
          </div>
        )}
      </div>
      <span
        style={{
          fontFamily: FONT.body,
          fontSize: 11,
          fontWeight: 600,
          color: tone.chipText,
          background: tone.chip,
          padding: '4px 10px',
          borderRadius: RADIUS.pill,
          letterSpacing: '0.01em',
          alignSelf: 'flex-start',
          whiteSpace: 'nowrap',
        }}
      >
        {item.toneLabel}
      </span>
    </article>
  );
}
