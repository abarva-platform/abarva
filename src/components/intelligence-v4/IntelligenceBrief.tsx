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
  const sentinelOpener = `I composed this brief for ${data.tenantName} from the corpus. Top three above the line · ${data.bets.length} ranked. Ask me anything about the bets, the patterns, the vendor short list, or what would change if you re-prioritized.`;
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
  const leadDecision = leadBet?.decision?.label ?? 'Review first';
  const leadPattern = leadBet?.bindingPatterns[0]?.pattern.id ?? data.patternsTriggered[0]?.pattern.id ?? 'Pattern bound';

  // Workspace · the surface body that Sentinel chat docks against.
  // Post-AgentDock migration this lives on the RIGHT of the chat lane.
  const workspace = (
    <main style={{ padding: '28px clamp(28px, 4vw, 64px) 80px', overflowY: 'auto' }}>
      <div style={{ maxWidth: 1220, margin: '0 auto' }}>
        <header
          style={{
            display: 'grid',
            gridTemplateColumns: 'minmax(0, 1fr) minmax(240px, 320px)',
            gap: 28,
            alignItems: 'end',
            paddingBottom: 20,
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
              INTELLIGENCE · <span style={{ color: C.ink }}>SENTINEL INTEL</span>
            </div>
            <h1
              style={{
                fontFamily: F_DISPLAY,
                fontSize: 32,
                fontWeight: 400,
                color: C.ink,
                letterSpacing: '-0.014em',
                lineHeight: 1.15,
                margin: 0,
                maxWidth: '28ch',
              }}
            >
              The quarter&apos;s decision brief for {data.tenantName}.
            </h1>
            {data.synthesis && (
              <p
                style={{
                  fontSize: 15,
                  lineHeight: 1.65,
                  color: C.body,
                  margin: '14px 0 0',
                  maxWidth: '74ch',
                }}
              >
                {data.synthesis}
              </p>
            )}
          </div>

          <aside
            aria-label="Sentinel Intel summary"
            style={{
              borderLeft: `3px solid ${C.navy}`,
              padding: '2px 0 2px 18px',
            }}
          >
            <SectionEyebrow>Decision now</SectionEyebrow>
            <div
              style={{
                fontFamily: F_DISPLAY,
                fontSize: 22,
                lineHeight: 1.15,
                color: C.ink,
                letterSpacing: '-0.012em',
                marginBottom: 10,
              }}
            >
              {leadDecision}
            </div>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: 14,
                borderTop: `1px solid ${C.borderLight}`,
                paddingTop: 12,
              }}
            >
              <MiniMetric label="Score" value={leadBet ? `${leadBet.score}/100` : '-'} />
              <MiniMetric label="Pattern" value={leadPattern} />
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
              marginBottom: 8,
              flexWrap: 'wrap',
            }}
          >
            <SectionEyebrow>Above the line · top {data.bets.length}</SectionEyebrow>
            <span style={{ fontSize: 12, color: C.faint }}>
              Ranked by CXO tension, pattern binding, and time to value.
            </span>
          </div>
          <div style={{ borderTop: `1px solid ${C.ink}` }}>
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
          <span style={{ color: C.navy, fontWeight: 700 }}>SENTINEL INTEL</span>
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
    '-'
  );
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
  const scoreColor = bet.score >= 80 ? C.teal : bet.score >= 70 ? C.amber : C.red;
  const decision = bet.decision?.label ?? 'Review';
  const reason = bet.decision?.reason ?? 'Validate readiness before moving forward.';
  const patternId = bet.bindingPatterns[0]?.pattern.id ?? '-';
  const stateLabel =
    bet.engagementState === 'in_flight'
      ? `In portfolio${bet.initiativeDisplayId ? ` · ${bet.initiativeDisplayId}` : ''}`
      : 'Candidate';

  return (
    <article
      style={{
        display: 'grid',
        gridTemplateColumns: '52px minmax(240px, 1.4fr) minmax(150px, 0.65fr) minmax(120px, 0.45fr) minmax(150px, 0.55fr)',
        gap: 18,
        alignItems: 'center',
        padding: '18px 0',
        borderBottom: `1px solid ${C.borderLight}`,
      }}
    >
      <div
        style={{
          fontFamily: F_DISPLAY,
          fontSize: 28,
          fontWeight: 300,
          color: C.faint,
          letterSpacing: '-0.012em',
        }}
      >
        {String(bet.rank).padStart(2, '0')}
      </div>
      <div style={{ minWidth: 0 }}>
        <div style={{ fontFamily: F_MONO, fontSize: 9.5, fontWeight: 700, letterSpacing: '0.14em', color: C.navy, textTransform: 'uppercase', marginBottom: 6 }}>
          {bet.useCase.id} · {stateLabel}
        </div>
        <h2
          style={{
            fontFamily: F_DISPLAY,
            fontSize: 21,
            fontWeight: 500,
            color: C.ink,
            letterSpacing: '-0.01em',
            lineHeight: 1.18,
            margin: 0,
          }}
        >
          {bet.useCase.name}
        </h2>
        <p style={{ fontSize: 12.5, lineHeight: 1.5, color: C.muted, margin: '7px 0 0', maxWidth: '64ch' }}>
          {reason}
        </p>
      </div>
      <div>
        <MiniMetric label="Decision" value={decision} />
      </div>
      <div style={{ display: 'grid', gap: 10 }}>
        <MiniMetric label="Score" value={`${bet.score}/100`} />
        <span style={{ width: '100%', height: 2, background: C.borderLight, display: 'block' }}>
          <span style={{ width: `${Math.min(100, Math.max(0, bet.score))}%`, height: 2, background: scoreColor, display: 'block' }} />
        </span>
      </div>
      <div style={{ display: 'grid', gap: 9 }}>
        <MiniMetric label="Value" value={valueRange} />
        <MiniMetric label="Pattern" value={patternId} />
        <button
          type="button"
          onClick={onToggle}
          aria-expanded={isExpanded}
          style={{
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
