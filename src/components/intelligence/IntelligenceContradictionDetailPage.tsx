// I5 · INT-DTL-CONTRADICTION — Server-component Intelligence contradiction detail page.
//
// The most distinctive surface in Intelligence: a conflict, made explicit.
// Canonical reading layout for /intelligence/contradictions/[contradictionId].
//
// Key I5 additions:
//   • IntelligenceProvenanceRibbon anchored below contradiction header
//   • Party A + Party B panels side by side (or stacked on narrow)
//   • Resolution panel showing current state
//   • Server component — no useState, no client hooks
//   • Client island: IntelligenceContradictionDetailSentinel (AgentColumn)
//
// No live model calls, no fetch(), no Date.now, no Math.random.

import Link from 'next/link';
import { AppShell } from '@/components/shell/AppShell';
import { IntelligenceProvenanceRibbon } from '@/components/intelligence/IntelligenceProvenanceRibbon';
import { IntelligenceContradictionDetailSentinel } from '@/components/intelligence/IntelligenceContradictionDetailSentinel';
import { SHELL } from '@/lib/shell/shell-tokens';
import type {
  IntelligenceContradictionDetailView,
  ContradictionPartyView,
  ContradictionStatus,
} from '@/lib/intelligence/intelligence-contradiction-detail-view';

// ─── Status pill ──────────────────────────────────────────────────────────────

const STATUS_STYLE: Record<ContradictionStatus, { bg: string; text: string }> = {
  open:                 { bg: SHELL.RUST_BG,  text: SHELL.RUST_TEXT },
  'under-review':       { bg: SHELL.PEACH_BG, text: SHELL.PEACH_TEXT },
  'resolved-toward-A':  { bg: SHELL.MINT_BG,  text: SHELL.MINT_TEXT },
  'resolved-toward-B':  { bg: SHELL.MINT_BG,  text: SHELL.MINT_TEXT },
  'accepted-as-tension':{ bg: SHELL.GRAY_BG,  text: SHELL.GRAY_TEXT },
};

// ─── Party panel ──────────────────────────────────────────────────────────────

function PartyPanel({
  party,
  label,
  isResolved,
  resolvedToward,
  side,
}: {
  party: ContradictionPartyView;
  label: string;
  isResolved: boolean;
  resolvedToward: 'A' | 'B' | null;
  side: 'A' | 'B';
}) {
  const isWinner = isResolved && resolvedToward === side;
  const bg = isWinner ? SHELL.MINT_BG : SHELL.CARD_WHITE;
  const borderColor = isWinner ? SHELL.MINT_LINE : SHELL.CARD_LINE;

  return (
    <div
      style={{
        flex: 1,
        background: bg,
        border: `1px solid ${borderColor}`,
        borderRadius: 10,
        padding: '18px 20px',
        minWidth: 0,
      }}
    >
      {/* Party header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          marginBottom: 10,
        }}
      >
        <span
          style={{
            fontFamily: SHELL.MONO,
            fontSize: 9,
            letterSpacing: '0.14em',
            textTransform: 'uppercase',
            color: isWinner ? SHELL.MINT_TEXT : SHELL.INK_MUTED,
            fontWeight: 700,
          }}
        >
          {label}
        </span>
        <span
          style={{
            fontFamily: SHELL.MONO,
            fontSize: 9,
            color: SHELL.INK_MUTED,
            letterSpacing: '0.04em',
          }}
        >
          confidence {party.confidenceLabel}
        </span>
        {isWinner && (
          <span
            style={{
              fontFamily: SHELL.MONO,
              fontSize: 9,
              color: SHELL.MINT_TEXT,
              fontWeight: 700,
              letterSpacing: '0.06em',
            }}
          >
            ✓ RESOLVED
          </span>
        )}
      </div>

      {/* Claim */}
      <p
        style={{
          fontFamily: SHELL.SANS,
          fontSize: 14,
          fontWeight: 600,
          color: SHELL.INK,
          lineHeight: 1.5,
          margin: '0 0 8px',
        }}
      >
        {party.claim}
      </p>

      {/* Source */}
      <div
        style={{
          fontFamily: SHELL.MONO,
          fontSize: 9.5,
          color: SHELL.INK_MUTED,
          letterSpacing: '0.04em',
          marginBottom: 6,
        }}
      >
        Source: {party.source}
      </div>

      {/* Evidence */}
      <p
        style={{
          fontFamily: SHELL.SANS,
          fontSize: 12,
          color: SHELL.INK_MUTED,
          lineHeight: 1.55,
          margin: 0,
          fontStyle: 'italic',
        }}
      >
        {party.evidence}
      </p>
    </div>
  );
}

// ─── Resolution panel ─────────────────────────────────────────────────────────

function ResolutionPanel({
  view,
}: {
  view: IntelligenceContradictionDetailView;
}) {
  const statusStyle = STATUS_STYLE[view.status];

  return (
    <div
      style={{
        background: SHELL.CARD_WHITE,
        border: `1px solid ${SHELL.CARD_LINE}`,
        borderRadius: 10,
        padding: '20px 24px',
        maxWidth: 720,
        marginBottom: 28,
      }}
    >
      <div
        style={{
          fontFamily: SHELL.MONO,
          fontSize: 9,
          letterSpacing: '0.14em',
          textTransform: 'uppercase',
          color: SHELL.INK_MUTED,
          marginBottom: 12,
        }}
      >
        Resolution
      </div>

      {/* Status row */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          marginBottom: 12,
        }}
      >
        <span
          style={{
            display: 'inline-block',
            padding: '3px 10px',
            borderRadius: 999,
            background: statusStyle.bg,
            color: statusStyle.text,
            fontFamily: SHELL.MONO,
            fontSize: 10,
            fontWeight: 700,
            letterSpacing: '0.06em',
            textTransform: 'uppercase',
            lineHeight: 1.6,
          }}
        >
          {view.statusLabel}
        </span>
      </div>

      {/* Why both cannot be true */}
      <div
        style={{
          background: SHELL.PAPER_DEEP,
          border: `1px solid ${SHELL.CARD_LINE_SOFT}`,
          borderRadius: 6,
          padding: '12px 16px',
          marginBottom: 12,
        }}
      >
        <div
          style={{
            fontFamily: SHELL.MONO,
            fontSize: 9,
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            color: SHELL.INK_MUTED,
            marginBottom: 6,
          }}
        >
          Why both cannot be true
        </div>
        <p
          style={{
            fontFamily: SHELL.SANS,
            fontSize: 13,
            color: SHELL.INK,
            lineHeight: 1.6,
            margin: 0,
          }}
        >
          {view.whyBothCannotBeTrue}
        </p>
      </div>

      {/* Resolution timeline */}
      <p
        style={{
          fontFamily: SHELL.SANS,
          fontSize: 12,
          color: SHELL.INK_MUTED,
          lineHeight: 1.5,
          margin: 0,
        }}
      >
        {view.resolutionTimeline}
      </p>
    </div>
  );
}

// ─── Affected patterns ─────────────────────────────────────────────────────���──

function AffectedPatterns({
  patternIds,
}: {
  patternIds: readonly string[];
}) {
  if (patternIds.length === 0) return null;

  return (
    <div
      style={{
        maxWidth: 720,
        marginBottom: 28,
      }}
    >
      <div
        style={{
          fontFamily: SHELL.MONO,
          fontSize: 9,
          letterSpacing: '0.14em',
          textTransform: 'uppercase',
          color: SHELL.INK_MUTED,
          marginBottom: 10,
        }}
      >
        Affected patterns · {patternIds.length}
      </div>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        {patternIds.map((pid) => (
          <span
            key={pid}
            style={{
              display: 'inline-block',
              background: SHELL.PAPER_DEEP,
              border: `1px solid ${SHELL.CARD_LINE}`,
              borderRadius: 4,
              padding: '4px 10px',
              fontFamily: SHELL.MONO,
              fontSize: 10,
              color: SHELL.INK,
              letterSpacing: '0.04em',
              lineHeight: 1.6,
            }}
          >
            {pid}
          </span>
        ))}
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

interface IntelligenceContradictionDetailPageProps {
  view: IntelligenceContradictionDetailView;
}

function resolvedToward(
  status: ContradictionStatus,
): 'A' | 'B' | null {
  if (status === 'resolved-toward-A') return 'A';
  if (status === 'resolved-toward-B') return 'B';
  return null;
}

export function IntelligenceContradictionDetailPage({
  view,
}: IntelligenceContradictionDetailPageProps) {
  const statusStyle = STATUS_STYLE[view.status];
  const isResolved =
    view.status === 'resolved-toward-A' || view.status === 'resolved-toward-B';
  const toward = resolvedToward(view.status);

  return (
    <AppShell
      surface="intelligence"
      topBarProps={{
        tenantName: 'Apex Retail Group',
        showLocked: true,
        context: `Intelligence · Contradiction · ${view.contradictionId.toUpperCase()}`,
      }}
    >
      {/* Sentinel column — client island */}
      <IntelligenceContradictionDetailSentinel
        agentQuote={view.agentQuote}
        agentContext={view.agentContext}
        contradictionId={view.contradictionId}
      />

      {/* Main reading area */}
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          background: SHELL.PAPER,
          padding: '32px 48px',
        }}
      >
        {/* Back link */}
        <div style={{ marginBottom: 20 }}>
          <Link
            href={view.intelligenceLandingHref}
            style={{
              fontFamily: SHELL.MONO,
              fontSize: 10,
              color: SHELL.INK_MUTED,
              textDecoration: 'none',
              letterSpacing: '0.06em',
            }}
          >
            ← Pattern Library
          </Link>
        </div>

        {/* Contradiction header */}
        <div style={{ maxWidth: 720, marginBottom: 20 }}>
          {/* Eyebrow */}
          <div
            style={{
              fontFamily: SHELL.MONO,
              fontSize: 9,
              letterSpacing: '0.18em',
              textTransform: 'uppercase',
              color: SHELL.INK_MUTED,
              marginBottom: 6,
            }}
          >
            Contradiction · {view.contradictionId.toUpperCase()}
          </div>

          {/* Title */}
          <h1
            style={{
              fontFamily: SHELL.SERIF,
              fontSize: 24,
              fontWeight: 700,
              color: SHELL.INK,
              margin: '0 0 12px',
              lineHeight: 1.2,
              letterSpacing: '-0.01em',
            }}
          >
            {view.title}
          </h1>

          {/* Status pill */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span
              style={{
                display: 'inline-block',
                padding: '3px 10px',
                borderRadius: 999,
                background: statusStyle.bg,
                color: statusStyle.text,
                fontFamily: SHELL.MONO,
                fontSize: 9.5,
                fontWeight: 700,
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
                lineHeight: 1.6,
              }}
            >
              {view.statusLabel}
            </span>
            <span
              style={{
                fontFamily: SHELL.MONO,
                fontSize: 10,
                color: SHELL.INK_MUTED,
                letterSpacing: '0.04em',
              }}
            >
              {view.affectedPatternIds.length} pattern{view.affectedPatternIds.length !== 1 ? 's' : ''} affected
            </span>
          </div>
        </div>

        {/* ── I5: Provenance ribbon ── */}
        <div style={{ maxWidth: 720, marginBottom: 28 }}>
          <IntelligenceProvenanceRibbon view={view.provenanceRibbon} />
        </div>

        {/* Party A + Party B side by side */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'row',
            gap: 16,
            maxWidth: 720,
            marginBottom: 28,
          }}
          data-testid="contradiction-parties"
        >
          <PartyPanel
            party={view.partyA}
            label="Party A"
            isResolved={isResolved}
            resolvedToward={toward}
            side="A"
          />
          <PartyPanel
            party={view.partyB}
            label="Party B"
            isResolved={isResolved}
            resolvedToward={toward}
            side="B"
          />
        </div>

        {/* Resolution panel */}
        <ResolutionPanel view={view} />

        {/* Body / evidence enrichment note */}
        {view.body && (
          <div
            style={{
              background: SHELL.CARD_WHITE,
              border: `1px solid ${SHELL.CARD_LINE}`,
              borderRadius: 10,
              padding: '18px 22px',
              maxWidth: 720,
              marginBottom: 28,
            }}
          >
            <div
              style={{
                fontFamily: SHELL.MONO,
                fontSize: 9,
                letterSpacing: '0.14em',
                textTransform: 'uppercase',
                color: SHELL.INK_MUTED,
                marginBottom: 10,
              }}
            >
              Evidence context
            </div>
            <p
              style={{
                fontFamily: SHELL.SANS,
                fontSize: 13,
                color: SHELL.INK_MUTED,
                lineHeight: 1.65,
                margin: 0,
              }}
            >
              {view.body}
            </p>
          </div>
        )}

        {/* Affected patterns */}
        <AffectedPatterns patternIds={view.affectedPatternIds} />

        {/* Honest disclaimer */}
        <div
          style={{
            marginTop: 40,
            paddingTop: 16,
            borderTop: `1px solid ${SHELL.CARD_LINE}`,
            fontFamily: SHELL.MONO,
            fontSize: 9.5,
            color: SHELL.INK_MUTED,
            letterSpacing: '0.04em',
            maxWidth: 720,
          }}
        >
          {view.honestDisclaimer}
        </div>
      </div>
    </AppShell>
  );
}
