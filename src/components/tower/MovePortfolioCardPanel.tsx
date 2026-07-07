// Move portfolio card panel · GAP-4 — Source -> Tower display residual.
//
// Renders Moves that have flowed through the end-to-end loop as
// first-class Tower portfolio cards. Each card surfaces the Move's
// outcome-ledger status, its Source-risk posture, its benefit-
// realization read, and navigation into the Move and its cross-module
// trace.
//
// AbarVa locked palette only — cream `#F8F7F4`, established serif/body
// fonts, black/ghost buttons. No new colours. The decide-and-route
// action row is the only client-interactive surface; everything else
// stays server-rendered.

import type { CSSProperties } from 'react';
import type {
  MoveLedgerStatus,
  MovePortfolioCard,
} from '@/lib/tower/move-portfolio-card';
import type { SourceRiskLevel } from '@/lib/tower/source-risk';
import { TowerDecisionActionRow } from '@/components/tower/TowerDecisionActionRow';

const CARD_BG = '#F8F7F4';
const INK = '#1A1A18';
const INK_SOFT = '#5b5148';
const RULE = 'rgba(10,10,11,0.12)';
const SERIF = 'var(--font-fraunces), "Fraunces", Georgia, serif';
const MONO = 'ui-monospace, SFMono-Regular, Menlo, monospace';

const LABEL: CSSProperties = {
  fontFamily: MONO,
  fontSize: 10,
  letterSpacing: '0.16em',
  textTransform: 'uppercase',
  color: INK_SOFT,
  fontWeight: 700,
};

function formatUsd(value: number): string {
  if (value <= 0) return '—';
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `$${Math.round(value / 1_000)}K`;
  return `$${value.toLocaleString('en-US')}`;
}

const LEDGER_LABEL: Record<MoveLedgerStatus, string> = {
  none: 'No value claim',
  projected: 'Projected',
  tracked: 'Tracked',
  verified: 'Verified',
};

const RISK_LABEL: Record<SourceRiskLevel, string> = {
  clear: 'Source: clear',
  watch: 'Source: watch',
  exposed: 'Source: exposed',
  blocked: 'Source: blocked',
};

export const TOWER_PROJECTED_VALUE_DISCLOSURE =
  'Projection caveat: projected value is directional decision support, not earned value. Confirm the baseline, measurement window, and owner-approved assumptions before using it for funding, board, or phase-gate decisions.';

/** A small monospace status chip, ghost-styled — no new colours. */
function Chip({ text }: { text: string }) {
  return (
    <span
      style={{
        fontFamily: MONO,
        fontSize: 9,
        letterSpacing: '0.10em',
        textTransform: 'uppercase',
        fontWeight: 700,
        color: INK,
        border: `1px solid ${RULE}`,
        borderRadius: 4,
        padding: '2px 6px',
        whiteSpace: 'nowrap',
      }}
    >
      {text}
    </span>
  );
}

function PortfolioCard({ card }: { card: MovePortfolioCard }) {
  return (
    <article
      data-testid="tower-move-portfolio-card"
      data-move-id={card.moveId}
      style={{
        border: `1px solid ${RULE}`,
        borderRadius: 10,
        background: '#ffffff',
        padding: '14px 16px',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'baseline',
          justifyContent: 'space-between',
          gap: 10,
          flexWrap: 'wrap',
        }}
      >
        <div style={{ fontFamily: SERIF, fontSize: 17, fontWeight: 400, color: INK }}>
          {card.moveName}
        </div>
        <div style={{ ...LABEL, fontSize: 9 }}>{card.phaseLabel}</div>
      </div>

      <div style={{ display: 'flex', gap: 6, marginTop: 8, flexWrap: 'wrap' }}>
        <Chip text={`Ledger: ${LEDGER_LABEL[card.ledgerStatus]}`} />
        {card.projectedValueUsd > 0 ? (
          <Chip text={`Projected ${formatUsd(card.projectedValueUsd)} · directional`} />
        ) : null}
        {card.sourceRiskLevel ? <Chip text={RISK_LABEL[card.sourceRiskLevel]} /> : null}
        {card.sourceCostExposureUsd > 0 ? (
          <Chip text={`Cost exposure ${formatUsd(card.sourceCostExposureUsd)}`} />
        ) : null}
      </div>

      {card.projectedValueUsd > 0 ? (
        <div
          data-testid="tower-projected-value-disclosure"
          style={{
            marginTop: 8,
            padding: '8px 10px',
            border: `1px dashed ${RULE}`,
            borderRadius: 6,
            fontSize: 11,
            color: INK_SOFT,
            lineHeight: 1.5,
          }}
        >
          <span style={{ ...LABEL, display: 'block', marginBottom: 3 }}>
            Projection assumptions · confidence projected
          </span>
          {TOWER_PROJECTED_VALUE_DISCLOSURE}
        </div>
      ) : null}

      {card.sourceRiskReadout ? (
        <div style={{ marginTop: 9, fontSize: 12, color: INK_SOFT, lineHeight: 1.5 }}>
          {card.sourceRiskReadout}
        </div>
      ) : null}

      <div style={{ marginTop: 7, fontSize: 12, color: INK_SOFT, lineHeight: 1.5 }}>
        {card.earningSummary}
      </div>

      <div style={{ display: 'flex', gap: 8, marginTop: 11, flexWrap: 'wrap' }}>
        {card.links.map((link, index) => (
          <a
            key={link.id}
            href={link.href}
            style={{
              fontFamily: MONO,
              fontSize: 10,
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
              fontWeight: 700,
              textDecoration: 'none',
              padding: '6px 12px',
              borderRadius: 6,
              border: `1px solid ${INK}`,
              background: index === 0 ? INK : 'transparent',
              color: index === 0 ? '#ffffff' : INK,
            }}
          >
            {link.label}
          </a>
        ))}
      </div>

      {/* Decide-and-route: Fund / Pause / Kill. Each decision is
          audit-logged through the existing program_audit_log table. */}
      <TowerDecisionActionRow programId={card.moveId} subjectLabel={card.moveName} />
    </article>
  );
}

/**
 * The Tower portfolio panel for loop-completed Moves. Renders one
 * `PortfolioCard` per Move.
 *
 * When the portfolio carries no loop-completed Moves the panel renders
 * an explicit empty state rather than disappearing — a blank region
 * with no explanation reads as a broken surface. The empty state is
 * honest framing: it tells the reader the panel populates once a Move
 * has run the end-to-end loop. Safe to mount unconditionally.
 */
export function MovePortfolioCardPanel({
  cards,
  tenantName,
}: {
  cards: readonly MovePortfolioCard[];
  /**
   * P1-2 (synthetic pilot rehearsal): the active tenant's display name. The
   * empty state names the tenant explicitly so a brand-new tenant (Northwind)
   * sees "Tower portfolio for Northwind Retail is empty" with a link to the
   * onboarding runbook, instead of an anonymous empty panel that reads as a
   * broken surface.
   */
  tenantName?: string;
}) {
  if (cards.length === 0) {
    const displayName = tenantName?.trim() || 'this tenant';
    return (
      <section
        data-testid="tower-move-portfolio-panel"
        data-portfolio-empty="true"
        aria-label="Move portfolio"
        style={{
          border: `1px solid ${RULE}`,
          borderRadius: 10,
          background: CARD_BG,
          padding: '14px 16px',
        }}
      >
        <div style={LABEL}>Move portfolio · loop-completed</div>
        <div style={{ marginTop: 6, fontSize: 13, color: INK_SOFT, lineHeight: 1.45 }}>
          Tower portfolio for {displayName} is empty. Programs that complete
          the end-to-end loop — Mobilize phase, Source decision, and outcome
          tracking — surface here as portfolio cards with their outcome-ledger
          status, Source-risk posture, and a link into the cross-module
          decision trace.
        </div>
        <div style={{ marginTop: 8, fontSize: 12, color: INK_SOFT, lineHeight: 1.45 }}>
          New tenant?{' '}
          <a
            href="/docs/pilot/ONBOARDING-NEW-TENANT.md"
            style={{ color: INK, textDecoration: 'underline' }}
            data-testid="tower-empty-runbook-link"
          >
            See the new-tenant onboarding runbook
          </a>{' '}
          for how to wire your first Move through to Tower.
        </div>
      </section>
    );
  }

  return (
    <section
      data-testid="tower-move-portfolio-panel"
      aria-label="Move portfolio"
      style={{
        border: `1px solid ${RULE}`,
        borderRadius: 10,
        background: CARD_BG,
        padding: '14px 16px',
      }}
    >
      <div style={LABEL}>Move portfolio · loop-completed</div>
      <div style={{ marginTop: 6, fontSize: 13, color: INK_SOFT, lineHeight: 1.45 }}>
        Moves that have flowed through the end-to-end loop surface here as
        portfolio cards — outcome-ledger status, Source-risk posture, and a
        link into the Move and its cross-module decision trace.
      </div>
      <div style={{ display: 'grid', gap: 10, marginTop: 11 }}>
        {cards.map((card) => (
          <PortfolioCard key={card.moveId} card={card} />
        ))}
      </div>
    </section>
  );
}
