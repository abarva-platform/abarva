'use client';

// IntelligenceBrief · v1.1 corpus surface · CXO summary-first edition.
//
// PR-K2.2 (founder feedback): the prior layout dropped 1800px of
// dense McKinsey detail on the page. Not CXO-friendly. This rewrite:
//
//   1. Bet cards are summary-first by default (~150px each).
//      Score · value · time-to-value · primary binding pattern · CTA.
//      Click "Show full analysis" to expand the full McKinsey detail.
//
//   2. Right rail is the v3 SentinelChat (3-mode dock-able agent),
//      not four static cards. The agent lock is back.
//
//   3. Patterns triggered + Move cascade promoted to compact strips
//      bracketing the bet stack — urgent attention above, forward-
//      looking below — so the right rail is the agent only.

import { useState } from 'react';
import Link from 'next/link';
import type { BelowTheLineBet, BriefData, BriefBet } from '@/lib/knowledge-corpus/types';
import {
  isPatternBindable,
  requiredGroundingForText,
} from '@/lib/intelligence-v3/pattern-grounding';
import { SentinelChat } from '@/components/intelligence-v3/SentinelChat';
import type { ChatMessage } from '@/components/intelligence-v3/types';

const F_DISPLAY = 'var(--font-fraunces), Georgia, serif';
const F_BODY = 'var(--font-inter), -apple-system, BlinkMacSystemFont, system-ui, sans-serif';
const F_MONO = 'var(--font-jetbrains-mono), ui-monospace, "SF Mono", Menlo, monospace';

const C = {
  ink: '#0A0C12',
  body: '#1F2433',
  muted: '#3D4454',
  faint: '#6B7280',
  navy: '#1B2B5C',
  navySoft: 'rgba(27,43,92,0.06)',
  navyLine: 'rgba(27,43,92,0.15)',
  teal: '#0E8A65',
  tealSoft: 'rgba(14,138,101,0.09)',
  tealLine: 'rgba(14,138,101,0.25)',
  amber: '#92400E',
  amberSoft: 'rgba(146,64,14,0.08)',
  amberLine: 'rgba(146,64,14,0.25)',
  red: '#991B1B',
  redSoft: 'rgba(153,27,27,0.07)',
  redLine: 'rgba(153,27,27,0.25)',
  borderLight: '#E5E7EB',
  surface: '#FFFFFF',
  surface2: '#FBFAF7',
  surface3: '#F5F3EE',
};

interface Props {
  data: BriefData;
  /**
   * Tenant key forwarded to the Sentinel surfaceContext so the upload
   * route can scope attachments to the active client. Optional · falls
   * back to data.tenantName when omitted.
   */
  activeClient?: string;
  surfaceContext?: Record<string, unknown>;
}

function fmtUsd(n: number): string {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${Math.round(n / 1_000)}k`;
  return `$${n}`;
}

export function IntelligenceBrief({ data, activeClient, surfaceContext }: Props) {
  // Collapsed-by-default. Click the bet header to expand the full
  // McKinsey detail. None expanded out of the box — summary-first
  // is the CXO read.
  const [expanded, setExpanded] = useState<Set<number>>(new Set());

  const toggle = (rank: number) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(rank)) next.delete(rank); else next.add(rank);
      return next;
    });
  };

  // Seed Sentinel chat with a brief-aware opener that mirrors the
  // synthesis voice. The conversation accepts follow-ups; future
  // PR-K3+ wires the LLM call.
  const sentinelConversation: ReadonlyArray<ChatMessage> = [];
  const sentinelOpener = `${data.tenantName} has ${data.bets.length} AI bets worth deciding this quarter. Ask me which one should move now, what evidence would change the ranking, or where ownership is still blocking value.`;
  const sentinelSurfaceContext = mergeSurfaceContext(surfaceContext, {
    activeTab: 'brief',
    activeClient: activeClient ?? data.tenantName,
    stageFacts: [
      `Brief visible state: ${data.bets.length} above-the-line bets, ${data.belowTheLine?.length ?? 0} below-the-line bets, ${data.patternsTriggered.length} triggered patterns.`,
      ...data.bets.slice(0, 3).map((bet) =>
        `Visible brief bet ${bet.rank}: ${bet.useCase.name}; score ${bet.score}; state ${bet.engagementState}; decision ${bet.decision?.label ?? 'review'}.`,
      ),
    ],
  });

  const leadBet = data.bets[0];
  const leadDecision = leadBet ? decisionCtaLabel(leadBet) : 'Review first';
  // Decision card binds a pattern only if it is in the namespace the card's
  // grounding requires (treasury card → LSH-TMS-*, never a corpus PAT-LSH-* id).
  // Fail closed: if no grounded pattern, the card shows none and Shape-as-Move
  // omits the patternId so originate resolves a real one from the registry.
  const leadGrounding = leadBet ? requiredGroundingForText(leadBet.useCase.name) : 'unknown';
  const leadBound =
    leadBet?.bindingPatterns.find((bp) => isPatternBindable(bp.pattern.id, leadGrounding))?.pattern ??
    data.patternsTriggered.find((pt) => isPatternBindable(pt.pattern.id, leadGrounding))?.pattern ??
    null;
  const leadPattern = leadBound?.id ?? 'Pattern resolving';
  const shapeMoveParams = new URLSearchParams({
    fromIntelligence: '1',
    useCaseName: leadBet?.useCase.name ?? '',
  });
  if (leadBet && leadBound) {
    shapeMoveParams.set('patternId', leadBound.id);
    shapeMoveParams.set('patternName', leadBound.name);
    shapeMoveParams.set(
      'intelligenceSessionId',
      `intelligence-brief:${leadBound.id}:${leadBet.useCase.name}`.toLowerCase().replace(/[^a-z0-9:.-]+/g, '-'),
    );
  }
  const shapeMoveHref = leadBet ? `/strategic-moves/new?${shapeMoveParams.toString()}` : '/strategic-moves/new';
  // L11 fix (2026-05-13): hero title now uses the live tenant name on every
  // tenant. The earlier "Apex has three AI bets…" literal was retail-only
  // and was paired with the broken Value/Tensions panels — a CDIO at
  // Meridian or a CIO at First Capital would see retail framing on their
  // own brief. Hero now always reads "Three bets above the line for
  // <tenantName> this quarter." so the tenant name is correct by
  // construction.
  const heroTitle = `Three bets above the line for ${data.tenantName} this quarter.`;

  // Workspace · the surface body that Sentinel chat docks against.
  // Post-AgentDock migration this lives on the RIGHT of the chat lane.
  const workspace = (
    <main style={{ padding: '28px clamp(28px, 4vw, 64px) 80px', overflowY: 'auto' }}>
      <div style={{ maxWidth: 1220, margin: '0 auto' }}>
        <header
          style={{
            display: 'grid',
            gridTemplateColumns: 'minmax(0, 1fr) minmax(280px, 320px)',
            gap: 34,
            alignItems: 'start',
            paddingBottom: 18,
            borderBottom: `1px solid ${C.borderLight}`,
          }}
        >
          <div>
            <div
              style={{
                fontFamily: F_MONO,
                fontSize: 10,
                fontWeight: 700,
                letterSpacing: '0.2em',
                textTransform: 'uppercase',
                color: C.faint,
                marginBottom: 6,
              }}
            >
              INTELLIGENCE · <span style={{ color: C.ink }}>AVA INTEL</span>
            </div>
            <h1
              style={{
                fontFamily: F_DISPLAY,
                fontSize: 'clamp(28px, 3.1vw, 42px)',
                fontWeight: 520,
                color: C.ink,
                letterSpacing: '-0.012em',
                lineHeight: 1.04,
                margin: 0,
                maxWidth: 860,
              }}
            >
              {heroTitle}
            </h1>
            {data.synthesis && (
              <p
                style={{
                  fontSize: 16,
                  lineHeight: 1.45,
                  color: C.body,
                  margin: '12px 0 0',
                  maxWidth: 880,
                }}
              >
                {data.synthesis}
              </p>
            )}
          </div>

          <aside
            aria-label="Ava Intel summary"
            style={{
              borderLeft: `4px solid ${C.navy}`,
              background: C.surface,
              boxShadow: '0 18px 44px rgba(8, 11, 18, 0.08)',
              padding: '18px 18px 16px',
              borderRadius: 8,
            }}
          >
            <SectionEyebrow>Decision now</SectionEyebrow>
            <div
              style={{
                fontFamily: F_DISPLAY,
                fontSize: 23,
                lineHeight: 1.15,
                color: C.ink,
                letterSpacing: '-0.012em',
                marginBottom: 12,
              }}
            >
              {leadDecision}
            </div>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: 10,
                borderTop: `1px solid ${C.borderLight}`,
                paddingTop: 10,
              }}
            >
              <MiniMetric label="Owner" value={leadBet ? ownerForBet(leadBet) : '-'} />
              <MiniMetric label="Confidence" value={leadBet ? `${leadBet.score}/100` : '-'} />
              <MiniMetric label="Pattern" value={leadPattern} />
              <MiniMetric label="Time" value={leadBet?.useCase.businessValueRanges.timeToValueMonths ? `${leadBet.useCase.businessValueRanges.timeToValueMonths} months` : '-'} />
            </div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 14 }}>
              <Cta href={shapeMoveHref} primary>Shape as move</Cta>
              <Cta href="/intelligence#map">Show evidence</Cta>
            </div>
          </aside>
        </header>

        <section style={{ marginTop: 28 }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'baseline',
              justifyContent: 'space-between',
              gap: 16,
              marginBottom: 10,
              flexWrap: 'wrap',
            }}
          >
            <h2
              style={{
                color: C.ink,
                fontFamily: F_DISPLAY,
                fontSize: 23,
                fontWeight: 520,
                margin: 0,
              }}
            >
              Three decisions this quarter
            </h2>
            <span style={{ fontSize: 12, color: C.faint }}>
              Ranked by decision urgency, readiness, and blocked value.
            </span>
          </div>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
              gap: 16,
            }}
          >
            {data.bets.map((bet) => (
              <BetDecisionRow
                key={bet.useCase.id}
                bet={bet}
                isExpanded={expanded.has(bet.rank)}
                onToggle={() => toggle(bet.rank)}
              />
            ))}
          </div>
        </section>

        <section
          style={{
            display: 'grid',
            gridTemplateColumns: 'minmax(0, 1fr) minmax(300px, 0.72fr)',
            gap: 18,
            marginTop: 22,
          }}
        >
          <ValueAtStakePanel data={data} />
          <OpenTensionsPanel data={data} />
        </section>

        {data.bets
          .filter((bet) => expanded.has(bet.rank))
          .map((bet) => (
            <article
              key={`exp-${bet.useCase.id}`}
              style={{
                marginTop: 18,
                background: C.surface2,
                borderTop: `2px solid ${C.navy}`,
                padding: '20px 0 24px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, marginBottom: 4, padding: '0 18px' }}>
                <span
                  style={{
                    fontFamily: F_DISPLAY,
                    fontSize: 22,
                    fontWeight: 300,
                    color: C.navy,
                    letterSpacing: '-0.012em',
                    lineHeight: 1,
                  }}
                >
                  {String(bet.rank).padStart(2, '0')}
                </span>
                <span
                  style={{
                    fontFamily: F_DISPLAY,
                    fontSize: 20,
                    fontWeight: 500,
                    color: C.ink,
                    letterSpacing: '-0.012em',
                  }}
                >
                  {bet.useCase.name}
                </span>
              </div>
              <p
                style={{
                  fontSize: 13.5,
                  color: C.muted,
                  lineHeight: 1.5,
                  margin: '0 0 12px',
                  maxWidth: '74ch',
                  padding: '0 18px',
                }}
              >
                {bet.useCase.artOfPossibleFraming}
              </p>
              <div style={{ padding: '0 18px' }}>
                <BetExpandedDetail bet={bet} />
              </div>
            </article>
          ))}

        <section
          style={{
            display: 'grid',
            gridTemplateColumns: 'minmax(260px, 0.95fr) minmax(320px, 1.35fr)',
            gap: 28,
            marginTop: 30,
            alignItems: 'start',
          }}
        >
          <div>
            <SectionEyebrow>Pattern checks</SectionEyebrow>
            <div style={{ borderTop: `1px solid ${C.borderLight}` }}>
              {data.patternsTriggered.map((pt) => (
                <PatternCheckRow key={pt.pattern.id} pattern={pt} />
              ))}
            </div>
          </div>

          {data.belowTheLine && data.belowTheLine.length > 0 && (
            <div>
              <SectionEyebrow>Below the line · keep warm</SectionEyebrow>
              <div
                style={{
                  background: C.surface,
                  borderTop: `1px solid ${C.borderLight}`,
                  marginTop: 4,
                }}
              >
                {data.belowTheLine.map((b, i) => (
                  <BelowTheLineRow
                    key={b.useCaseId}
                    bet={b}
                    isLast={i === data.belowTheLine!.length - 1}
                  />
                ))}
              </div>
            </div>
          )}
        </section>

        {data.cascadeIfSucceeds && (
          <div
            style={{
              marginTop: 28,
              borderTop: `1px solid ${C.navyLine}`,
              borderBottom: `1px solid ${C.navyLine}`,
              padding: '14px 0',
              display: 'grid',
              gridTemplateColumns: '220px 1fr',
              gap: 18,
              alignItems: 'start',
            }}
          >
            <SectionEyebrow>If this works</SectionEyebrow>
            <div>
              <div style={{ fontFamily: F_DISPLAY, fontSize: 18, fontWeight: 500, color: C.ink, letterSpacing: '-0.005em', marginBottom: 8 }}>
                {data.cascadeIfSucceeds.followOnUseCases.length} follow-on bets become natural in 12-18 months.
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 8 }}>
                {data.cascadeIfSucceeds.followOnUseCases.map((u) => (
                  <span
                    key={u.useCaseId}
                    style={{
                      fontFamily: F_MONO,
                      fontSize: 10,
                      color: C.navy,
                      letterSpacing: '0.04em',
                      padding: '4px 8px',
                      border: `1px solid ${C.navyLine}`,
                      background: C.surface,
                    }}
                  >
                    {u.useCaseName}
                  </span>
                ))}
              </div>
              <div style={{ fontFamily: F_MONO, fontSize: 10, color: C.faint, letterSpacing: '0.04em' }}>
                {data.cascadeIfSucceeds.evidenceLine}
              </div>
            </div>
          </div>
        )}

        <div
          style={{
            marginTop: 24,
            fontFamily: F_MONO,
            fontSize: 10,
            color: C.faint,
            letterSpacing: '0.04em',
            borderTop: `1px solid ${C.borderLight}`,
            paddingTop: 12,
          }}
        >
          <span style={{ color: C.navy, fontWeight: 700 }}>AVA INTEL</span>
          {' · '}
          {data.totals.totalUseCases} use cases · {data.totals.totalPatterns} patterns · {data.totals.totalVendors} vendors · {data.proofPoints.length} proof points · refreshed {data.totals.lastRefreshQuarter}
        </div>
      </div>
    </main>
  );

  return (
    <div
      data-testid="intelligence-brief"
      style={{
        background: C.surface,
        fontFamily: F_BODY,
        color: C.body,
        // The dock owns its own viewport-tall splitter when in
        // side-rail mode; constrain the corpus surface so the right
        // pane scrolls instead of forcing the whole page to grow.
        height: 'calc(100vh - 112px)',
        minHeight: 0,
      }}
    >
      {/* Sentinel chat is now on the LEFT (was right) — matches the
          rest of the product. The workspace is the brief body. */}
      <SentinelChat
        scopeLabel={`${data.tenantName} · The Brief`}
        opener={sentinelOpener}
        conversation={sentinelConversation}
        surfaceContext={sentinelSurfaceContext}
        workspace={workspace}
      />
    </div>
  );
}

function mergeSurfaceContext(
  base: Record<string, unknown> | undefined,
  override: Record<string, unknown>,
): Record<string, unknown> {
  return {
    ...(base ?? {}),
    ...override,
    stageFacts: [
      ...readStringArray(base?.stageFacts),
      ...readStringArray(override.stageFacts),
    ],
  };
}

function readStringArray(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : [];
}

function getBetValueRange(bet: BriefBet): string {
  return (
    bet.useCase.businessValueRanges.perCompanySize.mid ??
    bet.useCase.businessValueRanges.perCompanySize.large ??
    bet.useCase.businessValueRanges.perCompanySize.veryLarge ??
    '-'
  );
}

function decisionCtaLabel(bet: BriefBet): string {
  const action = bet.decision?.kind === 'originate'
    ? 'Originate'
    : bet.decision?.kind === 'wait'
      ? 'Wait on'
      : 'Evaluate';
  return `${action} ${shortBetName(bet.useCase.name).toLowerCase()}`;
}

function shortBetName(name: string): string {
  return name
    .replace(/^AI\s+/i, '')
    .replace(/\s+For\s+/i, ' for ')
    .replace(/\s+Next Best Offer/i, '')
    .trim();
}

function ownerForBet(bet: BriefBet): string {
  const text = `${bet.useCase.name} ${bet.useCase.domainTags.join(' ')}`.toLowerCase();
  if (text.includes('workforce') || text.includes('store')) return 'COO + CIO';
  if (text.includes('demand') || text.includes('forecast') || text.includes('merch')) return 'COO + CFO';
  if (text.includes('loyalty') || text.includes('personal')) return 'CMO + CTO';
  return 'CIO + sponsor';
}

function blockerForBet(bet: BriefBet): string {
  const text = `${bet.useCase.name} ${bet.decision?.reason ?? ''}`.toLowerCase();
  if (text.includes('workforce') || text.includes('labor')) return 'Labor rules';
  if (text.includes('demand') || text.includes('readiness') || text.includes('data')) return 'Data proof';
  if (text.includes('loyalty') || text.includes('cdp') || text.includes('identity')) return 'CDP ownership';
  return 'Decision rights';
}

function pillForBet(bet: BriefBet): { label: string; fg: string; bg: string; border: string; tone: 'green' | 'amber' | 'red' } {
  if (bet.decision?.kind === 'originate') {
    return { label: 'Originate now', fg: C.teal, bg: C.tealSoft, border: C.tealLine, tone: 'green' };
  }
  if (blockerForBet(bet).toLowerCase().includes('ownership')) {
    return { label: 'Resolve ownership', fg: C.red, bg: C.redSoft, border: C.redLine, tone: 'red' };
  }
  return { label: 'Prove readiness', fg: C.amber, bg: C.amberSoft, border: C.amberLine, tone: 'amber' };
}

function MiniMetric({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div style={{ fontFamily: F_MONO, fontSize: 9, letterSpacing: '0.12em', color: C.faint, textTransform: 'uppercase', marginBottom: 3 }}>
        {label}
      </div>
      <div style={{ fontFamily: F_MONO, fontSize: 12, fontWeight: 700, letterSpacing: '0.08em', color: C.ink }}>
        {value}
      </div>
    </div>
  );
}

function BetDecisionRow({
  bet,
  isExpanded,
  onToggle,
}: {
  bet: BriefBet;
  isExpanded: boolean;
  onToggle: () => void;
}) {
  const valueRange = getBetValueRange(bet);
  const pill = pillForBet(bet);
  const blocker = blockerForBet(bet);
  const summary = bet.decision?.reason ?? bet.useCase.problemStatement;

  return (
    <article
      style={{
        border: `1px solid ${C.borderLight}`,
        background: C.surface,
        borderRadius: 10,
        padding: 16,
        minHeight: 222,
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <span
        aria-hidden="true"
        style={{
          position: 'absolute',
          inset: '0 0 auto 0',
          height: 4,
          background: pill.tone === 'green' ? C.teal : pill.tone === 'amber' ? C.amber : C.red,
        }}
      />
      <div
        style={{
          fontFamily: F_DISPLAY,
          fontSize: 28,
          fontWeight: 300,
          color: C.faint,
          lineHeight: 1,
        }}
      >
        {String(bet.rank).padStart(2, '0')}
      </div>
      <span
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          alignSelf: 'flex-start',
          border: `1px solid ${pill.border}`,
          borderRadius: 999,
          padding: '5px 10px',
          fontSize: 12,
          fontWeight: 800,
          color: pill.fg,
          background: pill.bg,
        }}
      >
        {pill.label}
      </span>
      <div style={{ minWidth: 0, display: 'grid', gap: 8 }}>
        <h2
          style={{
            fontFamily: F_BODY,
            fontSize: 19,
            fontWeight: 800,
            color: C.ink,
            lineHeight: 1.15,
            margin: 0,
          }}
        >
          {bet.useCase.name}
        </h2>
        <p style={{ fontSize: 14, lineHeight: 1.4, color: '#303849', margin: 0 }}>
          {summary}
        </p>
      </div>
      <div
        style={{
          marginTop: 'auto',
          borderTop: `1px solid ${C.borderLight}`,
          paddingTop: 10,
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: 10,
        }}
      >
        <MiniMetric label="Value at stake" value={valueRange} />
        <MiniMetric label="Blocker" value={blocker} />
        <button
          type="button"
          onClick={onToggle}
          aria-expanded={isExpanded}
          style={{
            gridColumn: '1 / -1',
            justifySelf: 'start',
            border: 'none',
            borderBottom: `1px solid ${isExpanded ? C.navy : C.faint}`,
            background: 'transparent',
            color: isExpanded ? C.navy : C.muted,
            padding: '2px 0',
            fontFamily: F_MONO,
            fontSize: 10,
            fontWeight: 700,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            cursor: 'pointer',
          }}
        >
          {isExpanded ? 'Hide detail' : 'Open detail'}
        </button>
      </div>
    </article>
  );
}

function PatternCheckRow({ pattern }: { pattern: BriefData['patternsTriggered'][number] }) {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: '58px 1fr',
        gap: 12,
        padding: '12px 0',
        borderBottom: `1px solid ${C.borderLight}`,
      }}
    >
      <Link
        href={pattern.cta.primary.href}
        style={{
          fontFamily: F_MONO,
          fontSize: 10,
          fontWeight: 700,
          letterSpacing: '0.12em',
          color: C.amber,
          textDecoration: 'none',
          textTransform: 'uppercase',
        }}
      >
        {pattern.pattern.id}
      </Link>
      <div>
        <p style={{ margin: 0, fontSize: 12.5, lineHeight: 1.5, color: C.ink }}>
          {pattern.issue}
        </p>
        <Link
          href={pattern.cta.primary.href}
          style={{
            display: 'inline-block',
            marginTop: 6,
            fontFamily: F_MONO,
            fontSize: 9.5,
            fontWeight: 700,
            letterSpacing: '0.08em',
            color: C.amber,
            textDecoration: 'underline',
            textTransform: 'uppercase',
          }}
        >
          {pattern.cta.primary.label}
        </Link>
      </div>
    </div>
  );
}

/**
 * D-012 fix (2026-05-13): the prior version of this panel had retail
 * literals hard-coded with no props, so Meridian Health and First Capital
 * Brief pages rendered "Merchandising margin / Store productivity /
 * Demand sensing on item-location and promo quality" — pure retail copy.
 * The panel now takes a `BriefData` payload and renders per-tenant
 * value-at-stake rows, falling back to an industry-appropriate default
 * if the brief data didn't supply explicit rows.
 */
const TONE_TO_COLOR: Record<NonNullable<BriefData['valueAtStake']>[number]['tone'], string> = {
  teal: C.teal,
  amber: C.amber,
  red: C.red,
  navy: C.navy,
};

const VALUE_AT_STAKE_FALLBACK: Record<BriefData['industry'], NonNullable<BriefData['valueAtStake']>> = {
  retail: [
    { label: 'Customer growth', value: '$18-$44M', captured: 38, blocked: 26, candidate: 20, tone: 'teal' },
    { label: 'Merchandising margin', value: '$20-$52M', captured: 22, blocked: 34, candidate: 28, tone: 'amber' },
    { label: 'Store productivity', value: '$16-$38M', captured: 12, blocked: 40, candidate: 30, tone: 'red' },
    { label: 'Data foundation', value: '$6-$16M', captured: 26, blocked: 30, candidate: 24, tone: 'navy' },
  ],
  healthcare: [
    { label: 'Quality outcomes', value: '$12-$32M', captured: 30, blocked: 28, candidate: 22, tone: 'teal' },
    { label: 'Cost-to-serve', value: '$14-$36M', captured: 22, blocked: 36, candidate: 24, tone: 'amber' },
    { label: 'Workforce reliability', value: '$8-$22M', captured: 14, blocked: 38, candidate: 28, tone: 'red' },
    { label: 'Data foundation', value: '$6-$16M', captured: 26, blocked: 30, candidate: 24, tone: 'navy' },
  ],
  finserv: [
    { label: 'Deposit retention', value: '$10-$28M', captured: 32, blocked: 24, candidate: 22, tone: 'teal' },
    { label: 'Net interest margin', value: '$14-$36M', captured: 20, blocked: 38, candidate: 26, tone: 'amber' },
    { label: 'Loss reduction', value: '$8-$22M', captured: 16, blocked: 36, candidate: 28, tone: 'red' },
    { label: 'Data foundation', value: '$6-$16M', captured: 26, blocked: 30, candidate: 24, tone: 'navy' },
  ],
  airline: [
    { label: 'Operational recovery', value: '$10-$30M', captured: 24, blocked: 34, candidate: 22, tone: 'teal' },
    { label: 'Legacy extraction', value: '$12-$40M', captured: 18, blocked: 42, candidate: 24, tone: 'amber' },
    { label: 'Customer trust', value: '$8-$24M', captured: 16, blocked: 32, candidate: 26, tone: 'red' },
    { label: 'Platform foundation', value: '$10-$28M', captured: 28, blocked: 28, candidate: 24, tone: 'navy' },
  ],
};

function ValueAtStakePanel({ data }: { data: BriefData }) {
  const rows = data.valueAtStake ?? VALUE_AT_STAKE_FALLBACK[data.industry];
  return (
    <div
      style={{
        border: `1px solid ${C.borderLight}`,
        borderRadius: 10,
        background: C.surface,
        padding: 18,
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 16, marginBottom: 10 }}>
        <h2 style={{ color: C.ink, fontFamily: F_DISPLAY, fontSize: 23, fontWeight: 520, margin: 0 }}>
          Value at stake
        </h2>
        <span style={{ color: C.faint, fontSize: 13 }}>Captured, blocked, and candidate value by outcome.</span>
      </div>
      <div style={{ display: 'grid', gap: 13 }}>
        {rows.map((row) => (
          <div
            key={row.label}
            style={{
              display: 'grid',
              gridTemplateColumns: '150px minmax(180px, 1fr) 78px',
              alignItems: 'center',
              gap: 12,
            }}
          >
            <strong style={{ color: C.ink, fontSize: 14 }}>{row.label}</strong>
            <div
              aria-hidden="true"
              style={{
                height: 18,
                background: '#e5e5e5',
                borderRadius: 4,
                overflow: 'hidden',
                display: 'flex',
              }}
            >
              <span style={{ width: `${row.captured}%`, background: TONE_TO_COLOR[row.tone] }} />
              <span style={{ width: `${row.blocked}%`, background: '#d9a39d' }} />
              <span style={{ width: `${row.candidate}%`, background: '#ececec' }} />
            </div>
            <span style={{ fontFamily: F_MONO, fontSize: 11, color: C.muted, textAlign: 'right' }}>{row.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * D-012 fix (2026-05-13): same anti-pattern as ValueAtStakePanel — the
 * tensions list was hard-coded retail copy ("scale personalization until
 * CDP accountability is explicit", "demand sensing on item-location and
 * promo quality"). Now reads from `data.openTensions` with industry
 * fallbacks for the three demo tenants.
 */
const OPEN_TENSIONS_FALLBACK: Record<BriefData['industry'], NonNullable<BriefData['openTensions']>> = {
  retail: [
    {
      title: 'CMO owns loyalty, IT owns the bottleneck.',
      body: 'Do not scale personalization until CDP accountability is explicit.',
      severity: 'red',
    },
    {
      title: 'CFO wants cost takeout, CIO is funding platform-first.',
      body: 'The business case needs to separate near-term savings from foundation spend.',
      severity: 'amber',
    },
    {
      title: 'AI timeline assumes data readiness not shown.',
      body: 'Demand sensing should wait for evidence on item-location and promo quality.',
      severity: 'red',
    },
  ],
  healthcare: [
    {
      title: 'Clinical owns outcomes, IT owns the integration.',
      body: 'Do not scale ambient AI until clinical documentation accountability and Epic interop are explicit.',
      severity: 'red',
    },
    {
      title: 'CFO wants margin recovery, CIO is funding foundation work.',
      body: 'The business case needs to separate near-term claims-yield from data foundation spend.',
      severity: 'amber',
    },
    {
      title: 'AI timeline assumes data readiness not shown.',
      body: 'Population health AI should wait for evidence on patient registry completeness and SDOH coverage.',
      severity: 'red',
    },
  ],
  finserv: [
    {
      title: 'Front office owns growth, Risk owns the gate.',
      body: 'Do not scale ML pricing or AML automation until SR 11-7 model-risk governance is explicit.',
      severity: 'red',
    },
    {
      title: 'CFO wants NIM lift, CIO is funding core modernization.',
      body: 'The business case needs to separate near-term deposit retention from core API platform spend.',
      severity: 'amber',
    },
    {
      title: 'AI timeline assumes data readiness not shown.',
      body: 'Decisioning models should wait for evidence on consent posture and reference-data lineage.',
      severity: 'red',
    },
  ],
  airline: [
    {
      title: 'Operations owns reliability, IT owns the modernization path.',
      body: 'Do not accelerate extraction until peak-day constraints and rollback ownership are explicit.',
      severity: 'red',
    },
    {
      title: 'CFO wants vendor savings, CTO is funding dual-run.',
      body: 'The business case needs to separate realized value from vendor productivity claims.',
      severity: 'amber',
    },
    {
      title: 'AI timeline assumes operational readiness not shown.',
      body: 'Disruption recovery and crew legality AI should wait for exception telemetry and accountable owners.',
      severity: 'red',
    },
  ],
};

const SEVERITY_TO_COLOR: Record<NonNullable<BriefData['openTensions']>[number]['severity'], string> = {
  red: C.red,
  amber: C.amber,
};

function OpenTensionsPanel({ data }: { data: BriefData }) {
  const tensions = data.openTensions ?? OPEN_TENSIONS_FALLBACK[data.industry];
  return (
    <aside
      style={{
        border: `1px solid ${C.borderLight}`,
        borderRadius: 10,
        background: C.surface,
        padding: 18,
      }}
    >
      <h2 style={{ color: C.ink, fontFamily: F_DISPLAY, fontSize: 23, fontWeight: 520, margin: '0 0 12px' }}>
        Open tensions Ava would raise
      </h2>
      <div style={{ display: 'grid', gap: 13 }}>
        {tensions.map((tension) => (
          <div key={tension.title} style={{ display: 'grid', gridTemplateColumns: '10px 1fr', gap: 10 }}>
            <span
              aria-hidden="true"
              style={{
                width: 8,
                height: 8,
                borderRadius: 999,
                background: SEVERITY_TO_COLOR[tension.severity],
                marginTop: 7,
              }}
            />
            <div>
              <strong style={{ color: C.ink, fontSize: 13.5 }}>{tension.title}</strong>
              <p style={{ margin: '3px 0 0', color: C.muted, fontSize: 12.5, lineHeight: 1.4 }}>{tension.body}</p>
            </div>
          </div>
        ))}
      </div>
    </aside>
  );
}

// ── Expanded detail · the McKinsey synthesis ──────────────────────

function BetExpandedDetail({ bet }: { bet: BriefBet }) {
  const valueRange =
    bet.useCase.businessValueRanges.perCompanySize.mid ??
    bet.useCase.businessValueRanges.perCompanySize.large ??
    '—';
  return (
    <div style={{ paddingTop: 20 }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px 28px', marginBottom: 18 }}>
        <div>
          <BlockLabel color={C.navy}>Why this bet for {bet.useCase.name.split(' ')[0]}</BlockLabel>
          <ul style={{ listStyle: 'none', padding: 0, fontSize: 13, color: C.body, lineHeight: 1.5 }}>
            {bet.scoreFactors.map((f) => (
              <li
                key={f.name}
                style={{
                  padding: '5px 0',
                  borderBottom: `1px solid ${C.borderLight}`,
                  display: 'flex',
                  justifyContent: 'space-between',
                  gap: 12,
                }}
              >
                <span style={{ color: C.ink }}>{f.name}</span>
                <span
                  style={{
                    fontFamily: F_MONO,
                    fontSize: 11,
                    fontWeight: 600,
                    letterSpacing: '0.04em',
                    color: f.isWarning ? C.amber : f.delta === 0 ? C.faint : C.teal,
                  }}
                >
                  {f.isFlag ? 'flag' : f.delta === 0 ? '±0' : f.delta > 0 ? `+${f.delta}` : String(f.delta)}
                </span>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <BlockLabel color={C.navy}>Value range</BlockLabel>
          <div style={{ fontFamily: F_DISPLAY, fontSize: 22, fontWeight: 500, color: C.ink, letterSpacing: '-0.018em', lineHeight: 1.2 }}>
            {valueRange}
          </div>
          <div style={{ fontFamily: F_MONO, fontSize: 10, color: C.faint, letterSpacing: '0.04em', marginTop: 4 }}>
            {bet.useCase.provenance.primarySources[0] && `[per ${bet.useCase.provenance.primarySources[0].source} · ${bet.useCase.provenance.primarySources[0].reliability}]`}
          </div>
          {bet.measuredVsCommitted && (
            <>
              <div style={{ height: 14 }} />
              <BlockLabel color={C.faint}>Measured vs committed{bet.initiativeDisplayId && ` · ${bet.initiativeDisplayId}`}</BlockLabel>
              <div style={{ fontSize: 13, color: C.body, lineHeight: 1.5 }}>
                <strong style={{ color: C.ink, fontWeight: 600 }}>{fmtUsd(bet.measuredVsCommitted.measured)}</strong> measured · {fmtUsd(bet.measuredVsCommitted.committed)} committed annual ·{' '}
                {Math.round((bet.measuredVsCommitted.measured / bet.measuredVsCommitted.committed) * 100)}% of band
              </div>
            </>
          )}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px 28px', marginBottom: 18 }}>
        <div>
          <BlockLabel color={C.teal}>Binding success patterns</BlockLabel>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {bet.bindingPatterns.map((bp) => (
              <QuantRow
                key={bp.pattern.id}
                badge={bp.quantifiedRow.withLabel}
                tone="yes"
                description={
                  <>
                    <strong>{bp.pattern.id}</strong> · {bp.quantifiedRow.description}{' '}
                    <span style={{ fontFamily: F_MONO, fontSize: 10, color: C.faint, letterSpacing: '0.04em' }}>
                      [{bp.quantifiedRow.source}]
                    </span>
                  </>
                }
              />
            ))}
          </div>
        </div>

        <div>
          <BlockLabel color={C.amber}>Anti-patterns to avoid</BlockLabel>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {bet.antiPatterns.map((ap) => (
              <QuantRow
                key={ap.antiPattern.id}
                badge={`− ${ap.antiPattern.name.split(/[·\s]/)[0]}`}
                tone="no"
                description={
                  <>
                    <strong>{ap.antiPattern.id}</strong> · {ap.description}{' '}
                    <span style={{ fontFamily: F_MONO, fontSize: 10, color: C.faint, letterSpacing: '0.04em' }}>
                      [{ap.source}]
                    </span>
                  </>
                }
              />
            ))}
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px 28px', marginBottom: 18 }}>
        <div>
          <BlockLabel color={C.navy}>Vendor short list</BlockLabel>
          {bet.vendors.map((v) => (
            <div
              key={v.vendor.id}
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr auto',
                gap: 12,
                alignItems: 'center',
                padding: '8px 0',
                borderBottom: `1px solid ${C.borderLight}`,
              }}
            >
              <div>
                <div style={{ fontSize: 13, color: C.ink, fontWeight: 500 }}>
                  {v.vendor.name}
                  {v.isCurrent && (
                    <span style={{ fontFamily: F_MONO, fontSize: 9, color: C.teal, marginLeft: 6, fontWeight: 600, letterSpacing: '0.06em' }}>
                      CURRENT
                    </span>
                  )}
                </div>
                <div style={{ fontFamily: F_MONO, fontSize: 9.5, color: C.faint, letterSpacing: '0.04em' }}>
                  {v.vendor.id} · {v.healthLabel}
                </div>
              </div>
              <span style={tierStyle(v.tier)}>{v.tier === 'incumbent' ? 'Incumbent' : v.tier === 'challenger' ? 'Challenger' : 'Emerging'}</span>
            </div>
          ))}
        </div>

        {bet.regulatory.length > 0 && (
          <div>
            <BlockLabel color={C.navy}>Regulatory headwinds</BlockLabel>
            {bet.regulatory.map((r) => (
              <div
                key={r.regulatory.id}
                style={{
                  fontSize: 12.5,
                  color: C.body,
                  padding: '6px 0',
                  borderBottom: `1px solid ${C.borderLight}`,
                  display: 'flex',
                  justifyContent: 'space-between',
                  gap: 12,
                  lineHeight: 1.5,
                }}
              >
                <span>
                  <strong style={{ color: C.ink, fontWeight: 600 }}>{r.regulatory.name.split(' · ')[0]}</strong>
                </span>
                <span style={{ fontFamily: F_MONO, fontSize: 9.5, color: C.navy, letterSpacing: '0.04em', whiteSpace: 'nowrap', textAlign: 'right' }}>
                  {r.regulatory.id}
                  <br />
                  <span style={{ color: C.faint }}>{r.currencyDate}</span>
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', paddingTop: 8 }}>
        <Cta href="/strategic-moves" primary>
          {bet.engagementState === 'in_flight' ? 'Shape expansion in Nexus' : 'Shape as Move in Nexus'}
        </Cta>
        <Cta href="/source">Source vendors</Cta>
        <Cta href="/intelligence#map" ghost>Open in Map</Cta>
      </div>
    </div>
  );
}

function BlockLabel({ children, color }: { children: React.ReactNode; color?: string }) {
  return (
    <div
      style={{
        fontFamily: F_MONO,
        fontSize: 9.5,
        fontWeight: 700,
        letterSpacing: '0.16em',
        textTransform: 'uppercase',
        color: color ?? C.navy,
        marginBottom: 8,
      }}
    >
      {children}
    </div>
  );
}

function QuantRow({ badge, tone, description }: { badge: string; tone: 'yes' | 'no'; description: React.ReactNode }) {
  const fg = tone === 'yes' ? C.teal : C.red;
  const bg = tone === 'yes' ? C.tealSoft : C.redSoft;
  const border = tone === 'yes' ? C.tealLine : C.redLine;
  return (
    <div
      style={{
        fontSize: 12.5,
        color: C.body,
        lineHeight: 1.5,
        padding: '5px 0',
        borderBottom: `1px solid ${C.borderLight}`,
        display: 'grid',
        gridTemplateColumns: 'auto 1fr',
        gap: 12,
        alignItems: 'baseline',
      }}
    >
      <span
        style={{
          fontFamily: F_MONO,
          fontSize: 9.5,
          fontWeight: 700,
          padding: '2px 6px',
          borderRadius: 3,
          letterSpacing: '0.06em',
          whiteSpace: 'nowrap',
          color: fg,
          background: bg,
          border: `1px solid ${border}`,
        }}
      >
        {badge}
      </span>
      <span>{description}</span>
    </div>
  );
}

function Cta({ href, children, primary, ghost }: { href: string; children: React.ReactNode; primary?: boolean; ghost?: boolean }) {
  const sx: React.CSSProperties = {
    fontFamily: F_MONO,
    fontSize: 10,
    fontWeight: 600,
    letterSpacing: '0.08em',
    textTransform: 'uppercase',
    padding: '9px 14px',
    borderRadius: 4,
    textDecoration: 'none',
    whiteSpace: 'nowrap',
    border: ghost ? `1px solid ${C.borderLight}` : `1px solid ${C.ink}`,
    color: primary ? C.surface : ghost ? C.muted : C.ink,
    background: primary ? C.ink : C.surface,
    display: 'inline-block',
  };
  if (href.startsWith('/')) {
    return <Link href={href} prefetch={false} style={sx}>{children}</Link>;
  }
  return <a href={href} style={sx}>{children}</a>;
}

function tierStyle(tier: 'incumbent' | 'challenger' | 'emerging'): React.CSSProperties {
  const base: React.CSSProperties = {
    fontFamily: F_MONO,
    fontSize: 9,
    padding: '2px 7px',
    borderRadius: 3,
    letterSpacing: '0.08em',
    textTransform: 'uppercase',
    fontWeight: 600,
    whiteSpace: 'nowrap',
    border: '1px solid',
  };
  if (tier === 'incumbent') return { ...base, color: C.navy, background: C.navySoft, borderColor: C.navyLine };
  if (tier === 'challenger') return { ...base, color: C.teal, background: C.tealSoft, borderColor: C.tealLine };
  return { ...base, color: C.amber, background: C.amberSoft, borderColor: C.amberLine };
}

// ── Section eyebrow (above-the-line / below-the-line headers) ─────

function SectionEyebrow({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        fontFamily: F_MONO,
        fontSize: 10,
        fontWeight: 700,
        letterSpacing: '0.18em',
        textTransform: 'uppercase',
        color: C.faint,
        marginBottom: 4,
      }}
    >
      {children}
    </div>
  );
}

// ── Below-the-line row · 1 line per bet, scannable, expandable ────

function BelowTheLineRow({ bet, isLast }: { bet: BelowTheLineBet; isLast: boolean }) {
  const stateStyle = belowStateStyle(bet.state);
  const scoreColor = bet.score >= 70 ? C.teal : bet.score >= 60 ? C.amber : C.faint;
  return (
    <div
      data-rank={bet.rank}
      style={{
        display: 'grid',
        gridTemplateColumns: '36px 1fr 130px 100px 100px 60px',
        gap: 14,
        alignItems: 'center',
        padding: '12px 18px',
        borderBottom: isLast ? 'none' : `1px solid ${C.borderLight}`,
        cursor: 'default',
      }}
    >
      <span
        style={{
          fontFamily: F_DISPLAY,
          fontSize: 18,
          fontWeight: 300,
          color: C.faint,
          letterSpacing: '-0.01em',
        }}
      >
        {String(bet.rank).padStart(2, '0')}
      </span>
      <div style={{ minWidth: 0 }}>
        <div
          style={{
            fontFamily: F_BODY,
            fontSize: 13.5,
            fontWeight: 600,
            color: C.ink,
            display: 'flex',
            alignItems: 'baseline',
            gap: 8,
            flexWrap: 'wrap',
          }}
        >
          {bet.useCaseName}
          <span
            style={{
              fontFamily: F_MONO,
              fontSize: 9.5,
              color: C.faint,
              letterSpacing: '0.04em',
              fontWeight: 400,
            }}
          >
            {bet.useCaseId}
            {bet.initiativeDisplayId && ` · ${bet.initiativeDisplayId}`}
          </span>
        </div>
        <div style={{ fontSize: 11.5, color: C.muted, marginTop: 2, lineHeight: 1.45 }}>
          {bet.hint}
        </div>
      </div>
      <span
        style={{
          fontFamily: F_MONO,
          fontSize: 9.5,
          fontWeight: 700,
          letterSpacing: '0.12em',
          color: stateStyle.fg,
          background: stateStyle.bg,
          border: `1px solid ${stateStyle.border}`,
          padding: '3px 8px',
          borderRadius: 3,
          textTransform: 'uppercase',
          textAlign: 'center',
          whiteSpace: 'nowrap',
        }}
      >
        {stateStyle.label}
      </span>
      <span
        style={{
          fontFamily: F_BODY,
          fontSize: 12.5,
          fontWeight: 600,
          color: C.ink,
          textAlign: 'right',
          letterSpacing: '-0.005em',
        }}
      >
        {bet.valueLabel}
      </span>
      <span
        style={{
          fontFamily: F_MONO,
          fontSize: 11,
          color: C.muted,
          textAlign: 'right',
          letterSpacing: '0.04em',
        }}
      >
        {bet.ttvLabel}
      </span>
      <span
        style={{
          fontFamily: F_MONO,
          fontSize: 11,
          fontWeight: 700,
          color: scoreColor,
          textAlign: 'right',
          letterSpacing: '0.04em',
        }}
      >
        {bet.score}
      </span>
    </div>
  );
}

function belowStateStyle(state: BelowTheLineBet['state']): {
  label: string;
  fg: string;
  bg: string;
  border: string;
} {
  switch (state) {
    case 'in_portfolio':
      return { label: 'In flight', fg: C.teal, bg: C.tealSoft, border: C.tealLine };
    case 'candidate':
      return { label: 'Candidate', fg: C.navy, bg: C.navySoft, border: C.navyLine };
    case 'evaluating':
      return { label: 'Evaluating', fg: C.amber, bg: C.amberSoft, border: C.amberLine };
    case 'retired':
    default:
      return { label: 'Retired', fg: C.faint, bg: C.surface3, border: C.borderLight };
  }
}
