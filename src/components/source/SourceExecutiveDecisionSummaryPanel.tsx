import type { CSSProperties } from 'react';
import { SHELL } from '@/lib/shell/shell-tokens';

/**
 * SourceExecutiveDecisionSummaryPanel — T06 Decision canvas center content
 *
 * Atlas brief card · 3-column posture grid · Decision posture KV table
 * CTA row · Drawer trigger row (T12 / T13 / T14)
 *
 * Pure display component. Drawer state lives in SourceDecisionCanvasClient.
 */

// ─── Types ───────────────────────────────────────────────────────────────────

export type PostureTone = 'green' | 'amber' | 'red';

export interface PostureCard {
  eyebrow: string;
  label: string;
  body: string;
  tone: PostureTone;
}

export interface DecisionKv {
  owner: string;
  atlasRecommendation: string;
  stewardSignOff: string;
  stewardSignOffTone: PostureTone;
  sentinelAttestation: string;
  sentinelAttestationTone: PostureTone;
  deadline: string;
  posture: string;
  postureTone: PostureTone;
}

export interface SourceExecutiveDecisionSummaryPanelProps {
  atlasHeadline: string;
  atlasProse: string;
  postureCards: [PostureCard, PostureCard, PostureCard];
  kv: DecisionKv;
  /** Callbacks wired by SourceDecisionCanvasClient to open drawers */
  onOpenDataReadiness?: () => void;
  onOpenEvidence?: () => void;
  onOpenGate?: () => void;
}

// ─── Tone helpers ─────────────────────────────────────────────────────────────

const TONE_COLORS: Record<PostureTone, { bg: string; border: string; text: string; dot: string }> = {
  green: { bg: SHELL.MINT_BG,  border: SHELL.MINT_TEXT,  text: SHELL.MINT_TEXT,  dot: SHELL.MINT_TEXT  },
  amber: { bg: SHELL.PEACH_BG, border: SHELL.PEACH_TEXT, text: SHELL.PEACH_TEXT, dot: SHELL.PEACH_TEXT },
  red:   { bg: SHELL.RUST_BG,  border: SHELL.RUST_TEXT,  text: SHELL.RUST_TEXT,  dot: SHELL.RUST_TEXT  },
};

// ─── Styles ───────────────────────────────────────────────────────────────────

const PANEL: CSSProperties = {
  background: SHELL.CARD_WHITE,
  border: '1px solid ' + SHELL.CARD_LINE,
  borderRadius: 10,
  overflow: 'hidden',
};

const SECTION_PAD: CSSProperties = { padding: '14px 16px' };

const DIVIDER: CSSProperties = { borderTop: '1px solid ' + SHELL.CARD_LINE };

const EYEBROW: CSSProperties = {
  fontFamily: SHELL.MONO,
  fontSize: 9,
  letterSpacing: '0.12em',
  textTransform: 'uppercase',
  color: SHELL.INK_MUTED,
  marginBottom: 8,
};

const ATLAS_HEADLINE: CSSProperties = {
  fontFamily: SHELL.SERIF,
  fontSize: 20,
  fontWeight: 400,
  lineHeight: 1.35,
  color: SHELL.INK,
  margin: '0 0 10px',
};

const ATLAS_PROSE: CSSProperties = {
  fontFamily: SHELL.SANS,
  fontSize: 13,
  lineHeight: 1.65,
  color: SHELL.INK_SOFT,
  margin: 0,
};

const POSTURE_GRID: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(3, 1fr)',
  gap: 0,
};

const KV_GRID: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: '160px 1fr',
  rowGap: 0,
};

const KV_LABEL: CSSProperties = {
  fontFamily: SHELL.MONO,
  fontSize: 9,
  letterSpacing: '0.10em',
  textTransform: 'uppercase',
  color: SHELL.INK_MUTED,
  padding: '9px 12px',
  borderBottom: '1px solid ' + SHELL.CARD_LINE,
  borderRight: '1px solid ' + SHELL.CARD_LINE,
  display: 'flex',
  alignItems: 'center',
};

const KV_VALUE: CSSProperties = {
  fontFamily: SHELL.SANS,
  fontSize: 12.5,
  color: SHELL.INK,
  padding: '9px 12px',
  borderBottom: '1px solid ' + SHELL.CARD_LINE,
  display: 'flex',
  alignItems: 'center',
  gap: 6,
};

const CTA_ROW: CSSProperties = {
  display: 'flex',
  gap: 8,
  alignItems: 'center',
  padding: '12px 16px',
  flexWrap: 'wrap',
};

const DRAWER_TRIGGER_ROW: CSSProperties = {
  display: 'flex',
  gap: 0,
  alignItems: 'center',
  borderTop: '1px solid ' + SHELL.CARD_LINE,
  background: SHELL.PAPER_SOFT,
};

// ─── Sub-components ───────────────────────────────────────────────────────────

function ToneDot({ tone }: { tone: PostureTone }) {
  return (
    <span
      aria-hidden="true"
      style={{
        display: 'inline-block',
        width: 7,
        height: 7,
        borderRadius: '50%',
        background: TONE_COLORS[tone].dot,
        flexShrink: 0,
      }}
    />
  );
}

function PostureCardBlock({ card, isLast }: { card: PostureCard; isLast?: boolean }) {
  const c = TONE_COLORS[card.tone];
  return (
    <div
      style={{
        padding: '12px 14px',
        borderLeft: card.tone !== 'green' || true ? `3px solid ${c.border}` : undefined,
        borderRight: isLast ? 'none' : '1px solid ' + SHELL.CARD_LINE,
        background: card.tone === 'red' ? `${SHELL.RUST_BG}60` : 'transparent',
      }}
    >
      <div
        style={{
          fontFamily: SHELL.MONO,
          fontSize: 8.5,
          letterSpacing: '0.10em',
          textTransform: 'uppercase',
          color: SHELL.INK_MUTED,
          marginBottom: 5,
        }}
      >
        {card.eyebrow}
      </div>
      <div
        style={{
          fontFamily: SHELL.SANS,
          fontSize: 13,
          fontWeight: 700,
          color: c.text,
          marginBottom: 5,
        }}
      >
        <ToneDot tone={card.tone} />{' '}
        {card.label}
      </div>
      <div
        style={{
          fontFamily: SHELL.SANS,
          fontSize: 12,
          lineHeight: 1.5,
          color: SHELL.INK_SOFT,
        }}
      >
        {card.body}
      </div>
    </div>
  );
}

function CtaButton({
  label,
  tone = 'neutral',
  onClick,
}: {
  label: string;
  tone?: 'green' | 'amber' | 'neutral' | 'ghost';
  onClick?: () => void;
}) {
  const styles: Record<string, CSSProperties> = {
    green: {
      background: '#1d9e75',
      color: '#fff',
      border: '1px solid #18875f',
    },
    amber: {
      background: SHELL.PEACH_BG,
      color: SHELL.PEACH_TEXT,
      border: '1px solid ' + SHELL.PEACH_TEXT,
    },
    neutral: {
      background: SHELL.PAPER_SOFT,
      color: SHELL.INK_SOFT,
      border: '1px solid ' + SHELL.CARD_LINE,
    },
    ghost: {
      background: 'transparent',
      color: SHELL.INK_MUTED,
      border: '1px solid transparent',
    },
  };

  return (
    <button
      onClick={onClick}
      disabled={!onClick}
      style={{
        fontFamily: SHELL.SANS,
        fontSize: 12.5,
        fontWeight: 600,
        borderRadius: 7,
        padding: '7px 14px',
        cursor: onClick ? 'pointer' : 'default',
        display: 'inline-flex',
        alignItems: 'center',
        whiteSpace: 'nowrap',
        ...styles[tone],
      }}
    >
      {label}
    </button>
  );
}

function DrawerTrigger({
  label,
  badge,
  tone = 'neutral',
  onClick,
  isLast,
}: {
  label: string;
  badge?: string;
  tone?: PostureTone | 'neutral';
  onClick?: () => void;
  isLast?: boolean;
}) {
  const badgeColor = tone === 'green' ? SHELL.MINT_TEXT : tone === 'amber' ? SHELL.PEACH_TEXT : tone === 'red' ? SHELL.RUST_TEXT : SHELL.INK_MUTED;
  return (
    <button
      onClick={onClick}
      style={{
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '9px 14px',
        background: 'transparent',
        border: 'none',
        borderRight: isLast ? 'none' : '1px solid ' + SHELL.CARD_LINE,
        cursor: 'pointer',
        textAlign: 'left',
        gap: 8,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        {badge && (
          <span
            style={{
              fontFamily: SHELL.MONO,
              fontSize: 9,
              color: badgeColor,
              background: tone !== 'neutral' ? `${badgeColor}18` : SHELL.PAPER_SOFT,
              border: `1px solid ${badgeColor}40`,
              borderRadius: 4,
              padding: '1px 5px',
              fontWeight: 700,
            }}
          >
            {badge}
          </span>
        )}
        <span
          style={{
            fontFamily: SHELL.SANS,
            fontSize: 12,
            color: SHELL.INK_SOFT,
          }}
        >
          {label}
        </span>
      </div>
      <span style={{ fontFamily: SHELL.MONO, fontSize: 10, color: SHELL.INK_MUTED }}>↗</span>
    </button>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function SourceExecutiveDecisionSummaryPanel({
  atlasHeadline,
  atlasProse,
  postureCards,
  kv,
  onOpenDataReadiness,
  onOpenEvidence,
  onOpenGate,
}: SourceExecutiveDecisionSummaryPanelProps) {
  const kvRows: { label: string; value: string; tone?: PostureTone }[] = [
    { label: 'Owner', value: kv.owner },
    { label: 'Atlas recommendation', value: kv.atlasRecommendation },
    { label: 'Steward sign-off', value: kv.stewardSignOff, tone: kv.stewardSignOffTone },
    { label: 'Sentinel attestation', value: kv.sentinelAttestation, tone: kv.sentinelAttestationTone },
    { label: 'Decision deadline', value: kv.deadline },
    { label: 'Decision posture', value: kv.posture, tone: kv.postureTone },
  ];

  return (
    <div style={PANEL}>
      {/* ── Atlas brief ── */}
      <div style={SECTION_PAD}>
        <div style={EYEBROW}>Atlas · Executive brief</div>
        <h2 style={ATLAS_HEADLINE}>{atlasHeadline}</h2>
        <p style={ATLAS_PROSE}>{atlasProse}</p>
      </div>

      {/* ── 3-column posture grid ── */}
      <div style={{ ...DIVIDER }}>
        <div style={POSTURE_GRID}>
          {postureCards.map((card, i) => (
            <PostureCardBlock
              key={card.eyebrow}
              card={card}
              isLast={i === postureCards.length - 1}
            />
          ))}
        </div>
      </div>

      {/* ── Decision posture KV table ── */}
      <div style={DIVIDER}>
        <div style={KV_GRID}>
          {kvRows.map((row, i) => {
            const isLast = i === kvRows.length - 1;
            const labelStyle = isLast
              ? { ...KV_LABEL, borderBottom: 'none' }
              : KV_LABEL;
            const valueStyle = isLast
              ? { ...KV_VALUE, borderBottom: 'none' }
              : KV_VALUE;
            return (
              <>
                <div key={`lbl-${row.label}`} style={labelStyle}>{row.label}</div>
                <div key={`val-${row.label}`} style={valueStyle}>
                  {row.tone && <ToneDot tone={row.tone} />}
                  <span style={{ color: row.tone ? TONE_COLORS[row.tone].text : SHELL.INK }}>
                    {row.value}
                  </span>
                </div>
              </>
            );
          })}
        </div>
      </div>

      {/* ── CTA row ── */}
      <div style={{ ...CTA_ROW, ...DIVIDER }}>
        {/* Handlers deferred — wired in future decision-action slice */}
        <CtaButton label="Approve" tone="green" />
        <CtaButton label="Approve with conditions" tone="amber" />
        <CtaButton label="Send back" tone="neutral" />
        <div style={{ flex: 1 }} />
        <button
          onClick={onOpenEvidence}
          style={{
            fontFamily: SHELL.SANS,
            fontSize: 12,
            color: SHELL.INK_SOFT,
            background: 'none',
            border: 'none',
            cursor: onOpenEvidence ? 'pointer' : 'default',
            textDecoration: 'underline',
            textUnderlineOffset: 2,
          }}
        >
          Review evidence trail →
        </button>
      </div>

      {/* ── Drawer trigger row (T12 / T13 / T14) ── */}
      <div style={DRAWER_TRIGGER_ROW}>
        <DrawerTrigger
          label="Data readiness"
          badge="6 / 8"
          tone="amber"
          onClick={onOpenDataReadiness}
        />
        <DrawerTrigger
          label="Evidence trail"
          badge="8 items"
          tone="neutral"
          onClick={onOpenEvidence}
        />
        <DrawerTrigger
          label="Gate criteria"
          badge="1 open"
          tone="red"
          onClick={onOpenGate}
          isLast
        />
      </div>
    </div>
  );
}

// ─── Seeded AMS decision props ────────────────────────────────────────────────

export function buildAmsDecisionSummaryProps(): SourceExecutiveDecisionSummaryPanelProps {
  return {
    atlasHeadline:
      'Northstar Managed Services is the selection-ready candidate — subject to P0 trap resolution before award',
    atlasProse:
      'Northstar leads on normalized TCO ($11.54M, 18% above RFP baseline) and scored highest on ' +
      'service model maturity and reference quality. ArcVault is a viable alternate at $11.76M with a ' +
      'stronger governance framework but undefined escalation paths. BlueMaster and DataPeak have been ' +
      'declined — transition plan deficiency and onboarding timeline conflict are disqualifying. ' +
      'One P0 commercial trap (Tier-2 bundling) must close in BAFO before award can proceed.',
    postureCards: [
      {
        eyebrow: 'Value posture',
        label: 'Favorable',
        body: 'Northstar delivers 18% above RFP baseline on productivity metrics against a normalized 5-year TCO of $11.54M.',
        tone: 'green',
      },
      {
        eyebrow: 'Risk posture',
        label: 'Moderate',
        body: 'One P0 commercial trap open (Tier-2 bundling) and one P0 governance gap pending BAFO close.',
        tone: 'amber',
      },
      {
        eyebrow: 'Transition posture',
        label: 'Elevated',
        body: 'Standard 16-week onboarding conflicts with CDP Q3 milestone. Fast-track option not yet confirmed.',
        tone: 'red',
      },
    ],
    kv: {
      owner: 'Chief Procurement Officer',
      atlasRecommendation: 'Northstar Managed Services (conditional)',
      stewardSignOff: 'Pending — 1 open P0 gate item',
      stewardSignOffTone: 'amber',
      sentinelAttestation: 'Evidence complete · BAFO round 1 submitted',
      sentinelAttestationTone: 'green',
      deadline: '2026-06-13',
      posture: 'Approve with conditions · BAFO P0 trap must resolve',
      postureTone: 'amber',
    },
  };
}
