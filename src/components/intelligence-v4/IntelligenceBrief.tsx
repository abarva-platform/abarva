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
import type { BriefData, BriefBet } from '@/lib/knowledge-corpus/types';
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
}

function fmtUsd(n: number): string {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${Math.round(n / 1_000)}k`;
  return `$${n}`;
}

export function IntelligenceBrief({ data }: Props) {
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

  return (
    <div
      data-testid="intelligence-brief"
      style={{ background: C.surface, fontFamily: F_BODY, color: C.body, minHeight: '100%' }}
    >
      {/* Body grid — masthead lives INSIDE the left column so the
          Sentinel chat rail aligns with the very top of the surface
          and the composer is visible without scrolling (claude.ai
          pattern). */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 1fr) 440px',
          alignItems: 'start',
          gap: 0,
        }}
      >
        <main style={{ padding: '24px 56px 80px' }}>
          {/* Compact masthead — eyebrow + 1-line title only */}
          <div style={{ marginBottom: 18 }}>
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
              INTELLIGENCE · <span style={{ color: C.ink }}>SENTINEL&apos;S BRIEF</span>
            </div>
            <h1
              style={{
                fontFamily: F_DISPLAY,
                fontSize: 26,
                fontWeight: 400,
                color: C.ink,
                letterSpacing: '-0.014em',
                lineHeight: 1.15,
                margin: 0,
                maxWidth: '52ch',
              }}
            >
              Three bets above the line for {data.tenantName} this quarter.
            </h1>
          </div>

          {/* Patterns-triggered · compact one-line strip (no banner block) */}
          {data.patternsTriggered.map((pt) => (
            <div
              key={pt.pattern.id}
              style={{
                background: C.amberSoft,
                borderLeft: `3px solid ${C.amber}`,
                borderRadius: '0 6px 6px 0',
                padding: '8px 14px',
                marginBottom: 14,
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                flexWrap: 'wrap',
              }}
            >
              <span
                style={{
                  fontFamily: F_MONO,
                  fontSize: 9.5,
                  fontWeight: 700,
                  letterSpacing: '0.14em',
                  textTransform: 'uppercase',
                  color: C.amber,
                  whiteSpace: 'nowrap',
                }}
              >
                ⚠ {pt.pattern.id}
              </span>
              <span style={{ flex: 1, minWidth: 240, fontSize: 12.5, color: C.ink, lineHeight: 1.5 }}>
                <strong style={{ fontWeight: 600 }}>{pt.issue}</strong>
              </span>
              <Link
                href={pt.cta.primary.href}
                style={{
                  fontFamily: F_MONO,
                  fontSize: 10,
                  fontWeight: 600,
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                  textDecoration: 'underline',
                  color: C.amber,
                  whiteSpace: 'nowrap',
                }}
              >
                {pt.cta.primary.label} →
              </Link>
            </div>
          ))}

          {/* Bet stack — summary-first */}
          <div style={{ display: 'grid', gap: 14 }}>
            {data.bets.map((bet) => (
              <BetSummary
                key={bet.useCase.id}
                bet={bet}
                isExpanded={expanded.has(bet.rank)}
                onToggle={() => toggle(bet.rank)}
              />
            ))}
          </div>

          {/* Move cascade · forward-looking strip below the bets */}
          {data.cascadeIfSucceeds && (
            <div
              style={{
                marginTop: 24,
                background: C.navySoft,
                border: `1px solid ${C.navyLine}`,
                borderRadius: 8,
                padding: '16px 20px',
              }}
            >
              <div style={{ fontFamily: F_MONO, fontSize: 9.5, fontWeight: 700, letterSpacing: '0.16em', textTransform: 'uppercase', color: C.navy, marginBottom: 6 }}>
                → If {data.cascadeIfSucceeds.triggerInitiativeId} succeeds · move cascade
              </div>
              <div style={{ fontFamily: F_DISPLAY, fontSize: 17, fontWeight: 500, color: C.ink, letterSpacing: '-0.005em', marginBottom: 8 }}>
                {data.cascadeIfSucceeds.followOnUseCases.length} follow-on bets become natural in 12–18 months.
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginBottom: 6 }}>
                {data.cascadeIfSucceeds.followOnUseCases.map((u) => (
                  <span
                    key={u.useCaseId}
                    style={{
                      fontFamily: F_MONO,
                      fontSize: 11,
                      color: C.navy,
                      letterSpacing: '0.04em',
                      padding: '4px 10px',
                      border: `1px solid ${C.navyLine}`,
                      borderRadius: 3,
                      background: C.surface,
                    }}
                  >
                    → {u.useCaseName}
                  </span>
                ))}
              </div>
              <div style={{ fontFamily: F_MONO, fontSize: 10, color: C.faint, letterSpacing: '0.04em' }}>
                {data.cascadeIfSucceeds.evidenceLine}
              </div>
            </div>
          )}

          {/* One-line provenance (collapsed clutter) */}
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
            <span style={{ color: C.navy, fontWeight: 700 }}>SENTINEL</span>
            {' · '}
            {data.totals.totalUseCases} use cases · {data.totals.totalPatterns} patterns · {data.totals.totalVendors} vendors · {data.proofPoints.length} proof points · refreshed {data.totals.lastRefreshQuarter}
          </div>
        </main>

        {/* Sentinel chat · the agent lock — same dockable component as v3 */}
        <SentinelChat
          scopeLabel={`${data.tenantName} · The Brief`}
          opener={sentinelOpener}
          conversation={sentinelConversation}
        />
      </div>
    </div>
  );
}

// ── Bet summary card (summary-first, expandable) ──────────────────

function BetSummary({
  bet,
  isExpanded,
  onToggle,
}: {
  bet: BriefBet;
  isExpanded: boolean;
  onToggle: () => void;
}) {
  const valueRange =
    bet.useCase.businessValueRanges.perCompanySize.mid ??
    bet.useCase.businessValueRanges.perCompanySize.large ??
    '—';
  const primaryPattern = bet.bindingPatterns[0];
  const stateLabel =
    bet.engagementState === 'in_flight'
      ? `IN PORTFOLIO${bet.initiativeDisplayId ? ` · ${bet.initiativeDisplayId}` : ''}`
      : 'CANDIDATE BET';
  const scoreColor = bet.score >= 80 ? C.teal : bet.score >= 70 ? C.amber : C.red;

  return (
    <article
      style={{
        background: C.surface,
        border: `1px solid ${C.borderLight}`,
        borderRadius: 10,
        overflow: 'hidden',
        transition: 'box-shadow 0.12s, border-color 0.12s',
        boxShadow: isExpanded ? '0 4px 16px rgba(10,12,18,0.06)' : 'none',
        borderColor: isExpanded ? C.navyLine : C.borderLight,
      }}
    >
      {/* Always-visible summary row */}
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={isExpanded}
        style={{
          width: '100%',
          background: 'transparent',
          border: 'none',
          padding: '20px 24px',
          textAlign: 'left',
          cursor: 'pointer',
          fontFamily: 'inherit',
          color: 'inherit',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 18 }}>
          <div
            style={{
              fontFamily: F_DISPLAY,
              fontSize: 36,
              fontWeight: 300,
              color: C.navy,
              lineHeight: 1,
              letterSpacing: '-0.02em',
              flexShrink: 0,
              minWidth: 50,
            }}
          >
            {String(bet.rank).padStart(2, '0')}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, flexWrap: 'wrap', marginBottom: 4 }}>
              <span style={{ fontFamily: F_MONO, fontSize: 10, fontWeight: 700, letterSpacing: '0.16em', color: C.navy, textTransform: 'uppercase' }}>
                {bet.useCase.id}
              </span>
              <span style={{ fontFamily: F_MONO, fontSize: 9.5, fontWeight: 600, letterSpacing: '0.12em', color: bet.engagementState === 'in_flight' ? C.teal : C.faint, textTransform: 'uppercase' }}>
                · {stateLabel}
              </span>
            </div>
            <h2
              style={{
                fontFamily: F_DISPLAY,
                fontSize: 22,
                fontWeight: 500,
                color: C.ink,
                letterSpacing: '-0.012em',
                lineHeight: 1.2,
                margin: '0 0 6px 0',
              }}
            >
              {bet.useCase.name}
              {bet.engagementState === 'in_flight' && ' — expansion'}
            </h2>
            <p style={{ fontSize: 13.5, color: C.muted, lineHeight: 1.5, marginBottom: 10, maxWidth: '60ch' }}>
              {bet.useCase.artOfPossibleFraming}
            </p>

            {/* 3-stat row · CXO scan-line */}
            <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap', alignItems: 'baseline', marginTop: 12 }}>
              <Stat label="Value · annual" value={valueRange} valueFont={F_DISPLAY} />
              <Stat label="Time to value" value={`${bet.useCase.businessValueRanges.timeToValueMonths} mo`} valueFont={F_DISPLAY} />
              {primaryPattern && (
                <Stat
                  label="Binding pattern"
                  value={primaryPattern.pattern.id}
                  valueFont={F_MONO}
                  small
                />
              )}
              {bet.measuredVsCommitted && (
                <Stat
                  label="Measured vs committed"
                  value={`${Math.round((bet.measuredVsCommitted.measured / bet.measuredVsCommitted.committed) * 100)}%`}
                  valueFont={F_DISPLAY}
                />
              )}
            </div>
          </div>

          {/* Score + expand chevron · right edge */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8, flexShrink: 0 }}>
            <span
              style={{
                fontFamily: F_MONO,
                fontSize: 10,
                fontWeight: 700,
                letterSpacing: '0.16em',
                color: scoreColor,
                textTransform: 'uppercase',
              }}
            >
              SCORE {bet.score} / 100
            </span>
            <span
              style={{
                fontFamily: F_MONO,
                fontSize: 10,
                fontWeight: 600,
                letterSpacing: '0.06em',
                color: C.faint,
                textTransform: 'uppercase',
                whiteSpace: 'nowrap',
              }}
            >
              {isExpanded ? 'Hide detail ↑' : 'Show full analysis ↓'}
            </span>
          </div>
        </div>
      </button>

      {/* Expanded detail · the McKinsey synthesis */}
      {isExpanded && (
        <div
          style={{
            padding: '0 24px 24px 24px',
            borderTop: `1px solid ${C.borderLight}`,
            background: C.surface2,
          }}
        >
          <BetExpandedDetail bet={bet} />
        </div>
      )}
    </article>
  );
}

function Stat({ label, value, valueFont, small }: { label: string; value: string; valueFont: string; small?: boolean }) {
  return (
    <div>
      <div style={{ fontFamily: F_MONO, fontSize: 9.5, letterSpacing: '0.1em', color: C.faint, textTransform: 'uppercase', marginBottom: 2 }}>
        {label}
      </div>
      <div
        style={{
          fontFamily: valueFont,
          fontSize: small ? 13 : 18,
          fontWeight: small ? 600 : 500,
          color: C.ink,
          letterSpacing: small ? '0.04em' : '-0.012em',
          lineHeight: 1.2,
        }}
      >
        {value}
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
    return <Link href={href} style={sx}>{children}</Link>;
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
