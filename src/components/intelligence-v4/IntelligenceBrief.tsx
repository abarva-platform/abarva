// IntelligenceBrief · v1.1 corpus surface
// Translates docs/training/intelligence-brief-wireframe.html into a
// React component consuming BriefData from the knowledge corpus.

import Link from 'next/link';
import type { BriefData, BriefBet } from '@/lib/knowledge-corpus/types';

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
  return (
    <div
      data-testid="intelligence-brief"
      style={{ background: C.surface2, fontFamily: F_BODY, color: C.body, minHeight: '100%' }}
    >
      <header
        style={{
          background: C.surface,
          borderBottom: `1px solid ${C.borderLight}`,
          padding: '32px 64px 24px',
        }}
      >
        <div style={{ fontFamily: F_MONO, fontSize: 10, fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', color: C.faint, marginBottom: 8 }}>
          INTELLIGENCE · <span style={{ color: C.ink }}>SENTINEL&apos;S BRIEF FOR YOU</span>
        </div>
        <h1
          style={{
            fontFamily: F_DISPLAY,
            fontSize: 38,
            fontWeight: 400,
            color: C.ink,
            letterSpacing: '-0.018em',
            lineHeight: 1.05,
            margin: '0 0 8px 0',
            maxWidth: '30ch',
          }}
        >
          Three bets are above the line for {data.tenantName} this quarter.
        </h1>
        <p style={{ fontSize: 14, color: C.muted, maxWidth: '80ch' }}>
          Tenant-overlay scored against your size, segment, current portfolio, regulatory exposure, and strategic context. Top three surface here; the remaining {data.totals.totalUseCases - data.bets.length} are browseable on the Map.
        </p>
        <div
          style={{
            fontFamily: F_MONO,
            fontSize: 11,
            color: C.muted,
            letterSpacing: '0.04em',
            marginTop: 14,
            paddingTop: 14,
            borderTop: `1px solid ${C.borderLight}`,
            display: 'flex',
            gap: 24,
            flexWrap: 'wrap',
          }}
        >
          <span><span style={{ color: C.navy }}>SENTINEL</span> · brief composed {new Date(data.composedAt).toISOString().slice(0, 16).replace('T', ' ')}</span>
          <span>Substrate · {data.totals.totalUseCases} use cases · {data.totals.totalPatterns} patterns · {data.totals.totalVendors} vendors · {data.totals.totalRegulatory} regulatory</span>
          <span>Refresh · {data.totals.refreshCadence} · last {data.totals.lastRefreshQuarter}</span>
        </div>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 0 }}>
        <main
          style={{
            padding: '36px 56px 80px',
            borderRight: `1px solid ${C.borderLight}`,
            background: C.surface,
          }}
        >
          <p
            style={{
              fontFamily: F_DISPLAY,
              fontSize: 21,
              fontWeight: 400,
              color: C.body,
              lineHeight: 1.4,
              letterSpacing: '-0.005em',
              marginBottom: 26,
              maxWidth: '62ch',
            }}
          >
            Of the {data.totals.totalUseCases} {data.industry === 'healthcare' ? 'healthcare' : data.industry} AI bets that exist for {data.industry === 'healthcare' ? 'IDNs at your scale' : 'companies at your scale'}, three score above the line for {data.tenantName} this quarter.{' '}
            <strong style={{ fontWeight: 600, color: C.ink }}>{data.bets[0]?.useCase.name}</strong> is the highest-leverage candidate ·{' '}
            <strong style={{ fontWeight: 600, color: C.ink }}>{data.bets[1]?.useCase.name}</strong> needs binding-pattern attention ·{' '}
            <strong style={{ fontWeight: 600, color: C.ink }}>{data.bets[2]?.useCase.name}</strong> is a margin-leverage bet given strategic context.
          </p>

          {data.bets.map((bet, i) => <BetSection key={bet.useCase.id} bet={bet} isFirst={i === 0} />)}

          <div
            style={{
              marginTop: 48,
              padding: '18px 22px',
              border: `1px dashed ${C.borderLight}`,
              borderRadius: 8,
              background: C.surface2,
            }}
          >
            <BlockLabel color={C.faint}>Brief composition · audit trail</BlockLabel>
            <p style={{ fontSize: 12.5, color: C.muted, lineHeight: 1.55, marginTop: 6 }}>
              Composed by Sentinel from the AbarVa knowledge corpus (locked v1.1 · {data.totals.lastRefreshQuarter}) with tenant overlay applied per {data.tenantName}&apos;s profile. Every claim cites a corpus entity ID; every value range cites primary source provenance. Full reasoning trace available · click any score to see factor breakdown.
            </p>
          </div>
        </main>

        <aside
          style={{
            padding: '28px 24px 60px',
            background: C.surface2,
            display: 'grid',
            gap: 14,
            alignContent: 'start',
            position: 'sticky',
            top: 0,
            maxHeight: '100vh',
            overflowY: 'auto',
          }}
        >
          {data.patternsTriggered.map((pt) => (
            <div
              key={pt.pattern.id}
              style={{
                background: C.navySoft,
                border: `1px solid ${C.navyLine}`,
                borderRadius: 10,
                padding: 16,
              }}
            >
              <BlockLabel color={C.navy}>◆ Patterns triggered for you</BlockLabel>
              <h4 style={{ fontFamily: F_DISPLAY, fontSize: 15, fontWeight: 500, color: C.ink, letterSpacing: '-0.005em', lineHeight: 1.35, margin: '8px 0' }}>
                {pt.issue}
              </h4>
              <p style={{ fontSize: 12.5, color: C.body, lineHeight: 1.5 }}>{pt.recommendedAction}</p>
              <div style={{ display: 'flex', gap: 6, marginTop: 8, flexWrap: 'wrap' }}>
                <Cta href={pt.cta.primary.href} primary>{pt.cta.primary.label}</Cta>
                {pt.cta.secondary && <Cta href={pt.cta.secondary.href}>{pt.cta.secondary.label}</Cta>}
              </div>
            </div>
          ))}

          {data.cascadeIfSucceeds && (
            <div
              style={{ background: C.surface, border: `1px solid ${C.borderLight}`, borderRadius: 10, padding: 16 }}
            >
              <BlockLabel color={C.navy}>Move cascade · if {data.cascadeIfSucceeds.triggerInitiativeId} succeeds</BlockLabel>
              <h4 style={{ fontFamily: F_DISPLAY, fontSize: 15, fontWeight: 500, color: C.ink, letterSpacing: '-0.005em', lineHeight: 1.35, margin: '8px 0' }}>
                {data.cascadeIfSucceeds.followOnUseCases.length} follow-on bets become natural in 12–18 months.
              </h4>
              {data.cascadeIfSucceeds.followOnUseCases.map((u) => (
                <p key={u.useCaseId} style={{ fontFamily: F_MONO, fontSize: 11, color: C.navy, letterSpacing: '0.04em', margin: '4px 0' }}>
                  → {u.useCaseName}
                </p>
              ))}
              <p style={{ fontFamily: F_MONO, fontSize: 10, color: C.faint, letterSpacing: '0.04em', marginTop: 8 }}>
                {data.cascadeIfSucceeds.evidenceLine}
              </p>
            </div>
          )}

          <div style={{ background: C.surface, border: `1px solid ${C.borderLight}`, borderRadius: 10, padding: 16 }}>
            <BlockLabel color={C.navy}>Proof points · cited in this brief</BlockLabel>
            {data.proofPoints.map((pp) => (
              <div key={pp.id} style={{ padding: '7px 0', borderBottom: `1px solid ${C.borderLight}` }}>
                <div style={{ fontSize: 12, color: C.ink, fontWeight: 500, lineHeight: 1.4 }}>{pp.name}</div>
                <div style={{ fontFamily: F_MONO, fontSize: 9.5, color: C.faint, letterSpacing: '0.04em', marginTop: 2 }}>
                  {pp.useCaseId}
                  {pp.deployment.scope && ` · ${pp.deployment.scope}`}
                </div>
                {pp.measuredOutcomes.slice(0, 1).map((mo, idx) => (
                  <div key={idx} style={{ fontSize: 12, color: C.teal, fontWeight: 600, marginTop: 3 }}>
                    {mo.value}
                    {mo.metric && <span style={{ color: C.muted, fontWeight: 400 }}> · {mo.metric}</span>}
                  </div>
                ))}
              </div>
            ))}
          </div>

          <div style={{ background: C.surface3, border: `1px solid ${C.borderLight}`, borderRadius: 10, padding: 16 }}>
            <BlockLabel color={C.faint}>Ask Sentinel anything</BlockLabel>
            <p style={{ fontFamily: F_MONO, fontSize: 11, color: C.faint, marginTop: 6, letterSpacing: '0.04em', lineHeight: 1.5 }}>
              &ldquo;What if we paused MH-04 and pushed Population Health first?&rdquo;<br />
              &ldquo;How does Innovaccer compare to Arcadia for our scale?&rdquo;<br />
              &ldquo;Show me the CMIO sponsorship pattern in detail.&rdquo;
            </p>
          </div>
        </aside>
      </div>

      <div
        style={{
          background: C.ink,
          color: 'rgba(255,255,255,0.75)',
          padding: '14px 64px',
          fontFamily: F_MONO,
          fontSize: 10,
          letterSpacing: '0.04em',
        }}
      >
        <strong style={{ color: '#fff' }}>Provenance · The Brief</strong> · {data.totals.totalUseCases} corpus entities cited · {data.proofPoints.length} proof points surfaced · all claims provenance-tagged · refresh due {nextRefresh(data.totals.lastRefreshQuarter)}
      </div>
    </div>
  );
}

function nextRefresh(quarter: string): string {
  // 2026-Q1 → 2026-Q3
  const m = quarter.match(/^(\d{4})-Q([1-4])$/);
  if (!m) return quarter;
  const year = Number(m[1]!);
  const q = Number(m[2]!);
  const nextQ = ((q + 1) % 4) || 4;
  const nextY = nextQ <= q ? year + 1 : year;
  return `${nextY}-Q${nextQ}`;
}

// ── Sub-components ──────────────────────────────────────────────

function BetSection({ bet, isFirst }: { bet: BriefBet; isFirst: boolean }) {
  return (
    <section
      style={{
        paddingTop: isFirst ? 18 : 32,
        paddingBottom: 36,
        borderTop: isFirst ? 'none' : `1px solid ${C.borderLight}`,
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          gap: 24,
          marginBottom: 14,
          flexWrap: 'wrap',
        }}
      >
        <div style={{ display: 'flex', gap: 18, alignItems: 'flex-start' }}>
          <div
            style={{
              fontFamily: F_DISPLAY,
              fontSize: 48,
              fontWeight: 300,
              color: C.navy,
              lineHeight: 1,
              letterSpacing: '-0.02em',
            }}
          >
            {String(bet.rank).padStart(2, '0')}
          </div>
          <div>
            <div style={{ fontFamily: F_MONO, fontSize: 10, fontWeight: 700, letterSpacing: '0.16em', color: C.navy, textTransform: 'uppercase' }}>
              {bet.useCase.id} ·{' '}
              {bet.engagementState === 'in_flight'
                ? `IN PORTFOLIO${bet.initiativeDisplayId ? ` · ${bet.initiativeDisplayId}` : ''}`
                : 'CANDIDATE BET · NEW'}
            </div>
            <h2
              style={{
                fontFamily: F_DISPLAY,
                fontSize: 30,
                fontWeight: 500,
                color: C.ink,
                letterSpacing: '-0.018em',
                lineHeight: 1.15,
                margin: '6px 0',
                maxWidth: '30ch',
              }}
            >
              {bet.useCase.name}
              {bet.engagementState === 'in_flight' && ' — expansion'}
            </h2>
            <p
              style={{
                fontFamily: F_DISPLAY,
                fontSize: 18,
                fontWeight: 400,
                color: C.body,
                lineHeight: 1.45,
                letterSpacing: '-0.005em',
                marginBottom: 0,
                maxWidth: '60ch',
              }}
            >
              {bet.useCase.artOfPossibleFraming}
            </p>
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4, alignItems: 'flex-end' }}>
          <span
            style={{
              fontFamily: F_MONO,
              fontSize: 10,
              fontWeight: 700,
              letterSpacing: '0.16em',
              color: bet.score >= 80 ? C.teal : bet.score >= 70 ? C.amber : C.red,
              textTransform: 'uppercase',
            }}
          >
            SCORE {bet.score} / 100
          </span>
          <span style={{ fontFamily: F_MONO, fontSize: 10, fontWeight: 600, color: C.faint, letterSpacing: '0.06em' }}>
            Click to see why →
          </span>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px 32px', marginBottom: 18 }}>
        <div>
          <BlockLabel color={C.navy}>Why this bet for {bet.useCase.name.split(' ')[0]}</BlockLabel>
          <ul style={{ listStyle: 'none', padding: 0, fontSize: 13.5, color: C.body, lineHeight: 1.55 }}>
            {bet.scoreFactors.map((f) => (
              <li
                key={f.name}
                style={{
                  padding: '6px 0',
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
          <BlockLabel color={C.navy}>Value range · at your scale</BlockLabel>
          <div
            style={{
              fontFamily: F_DISPLAY,
              fontSize: 24,
              fontWeight: 500,
              color: C.ink,
              letterSpacing: '-0.018em',
              lineHeight: 1.2,
            }}
          >
            {bet.useCase.businessValueRanges.perCompanySize.mid ?? bet.useCase.businessValueRanges.perCompanySize.large ?? '—'}
            <span style={{ fontFamily: F_MONO, fontSize: 10, color: C.faint, letterSpacing: '0.06em', fontWeight: 400, marginLeft: 8, verticalAlign: 'middle' }}>
              {bet.useCase.provenance.primarySources[0] && `[per ${bet.useCase.provenance.primarySources[0].source} · ${bet.useCase.provenance.primarySources[0].reliability}]`}
            </span>
          </div>
          <div style={{ height: 14 }} />
          <BlockLabel color={C.faint}>Time to value · payback</BlockLabel>
          <div style={{ fontFamily: F_DISPLAY, fontSize: 18, color: C.ink, fontWeight: 500, letterSpacing: '-0.01em' }}>
            {bet.useCase.businessValueRanges.timeToValueMonths} months
            {bet.useCase.businessValueRanges.paybackMonths && ` · payback ~${bet.useCase.businessValueRanges.paybackMonths} months`}
          </div>
          {bet.measuredVsCommitted && (
            <>
              <div style={{ height: 18 }} />
              <BlockLabel color={C.faint}>Current measured value{bet.initiativeDisplayId && ` · ${bet.initiativeDisplayId}`}</BlockLabel>
              <div style={{ fontSize: 13.5, color: C.body, lineHeight: 1.5 }}>
                <strong style={{ color: C.ink, fontWeight: 600 }}>{fmtUsd(bet.measuredVsCommitted.measured)} measured</strong> against{' '}
                {fmtUsd(bet.measuredVsCommitted.committed)} committed annual ·{' '}
                {Math.round((bet.measuredVsCommitted.measured / bet.measuredVsCommitted.committed) * 100)}% of expected band{' '}
                <span style={{ fontFamily: F_MONO, fontSize: 10, color: C.faint }}>[from your AI Initiatives Registry]</span>
              </div>
            </>
          )}
          {!bet.measuredVsCommitted && (
            <>
              <div style={{ height: 18 }} />
              <BlockLabel color={C.faint}>Lifecycle position</BlockLabel>
              <div style={{ fontSize: 13.5, color: C.body, lineHeight: 1.5 }}>
                <strong style={{ color: C.ink, fontWeight: 600, textTransform: 'capitalize' }}>{bet.useCase.lifecycleStage}</strong>
                {bet.useCase.lifecycleBasis && ` · ${bet.useCase.lifecycleBasis.replace(/^[A-Z]/, (c) => c.toLowerCase())}`}
              </div>
            </>
          )}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px 32px', marginBottom: 18 }}>
        <div>
          <BlockLabel color={C.teal}>Binding success patterns · honor these</BlockLabel>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
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
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
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

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px 32px', marginBottom: 18 }}>
        <div>
          <BlockLabel color={C.navy}>Vendor short list · for evaluation</BlockLabel>
          {bet.vendors.map((v) => (
            <div
              key={v.vendor.id}
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr auto auto',
                gap: 12,
                alignItems: 'center',
                padding: '10px 0',
                borderBottom: `1px solid ${C.borderLight}`,
              }}
            >
              <div>
                <div style={{ fontSize: 13.5, color: C.ink, fontWeight: 500 }}>
                  {v.vendor.name}
                  {v.isCurrent && (
                    <span style={{ fontFamily: F_MONO, fontSize: 9.5, color: C.teal, marginLeft: 6, fontWeight: 600, letterSpacing: '0.06em' }}>
                      YOUR CURRENT VENDOR
                    </span>
                  )}
                </div>
                <div style={{ fontFamily: F_MONO, fontSize: 10, color: C.faint, letterSpacing: '0.04em', marginTop: 1 }}>
                  {v.vendor.id}
                </div>
              </div>
              <span style={tierStyle(v.tier)}>{v.tier === 'incumbent' ? 'Incumbent' : v.tier === 'challenger' ? 'Challenger' : 'Emerging'}</span>
              <span style={{ fontFamily: F_MONO, fontSize: 9.5, color: C.faint, letterSpacing: '0.04em', whiteSpace: 'nowrap' }}>
                {v.healthLabel}
              </span>
            </div>
          ))}
          <p style={{ fontFamily: F_MONO, fontSize: 10, color: C.faint, marginTop: 10, letterSpacing: '0.04em' }}>
            For deep vendor evaluation → Source surface
          </p>
        </div>

        {bet.regulatory.length > 0 && (
          <div>
            <BlockLabel color={C.navy}>Regulatory headwinds</BlockLabel>
            {bet.regulatory.map((r) => (
              <div
                key={r.regulatory.id}
                style={{
                  fontSize: 13,
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
                  {r.regulatory.summary && ` · ${r.regulatory.summary.slice(0, 80)}${r.regulatory.summary.length > 80 ? '…' : ''}`}
                </span>
                <span style={{ fontFamily: F_MONO, fontSize: 10, color: C.navy, letterSpacing: '0.04em', whiteSpace: 'nowrap' }}>
                  {r.regulatory.id}
                  <br />
                  <span style={{ color: C.faint }}>{r.currencyDate}</span>
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', paddingTop: 18 }}>
        <Cta href="/strategic-moves" primary>
          {bet.engagementState === 'in_flight' ? 'Shape expansion in Nexus' : 'Shape as Move in Nexus'}
        </Cta>
        <Cta href="/source">Source vendors</Cta>
        <Cta href="/intelligence/map" ghost>Open in Map</Cta>
      </div>
    </section>
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
        fontSize: 13,
        color: C.body,
        lineHeight: 1.55,
        padding: '6px 0',
        borderBottom: `1px solid ${C.borderLight}`,
        display: 'grid',
        gridTemplateColumns: 'auto 1fr',
        gap: 14,
        alignItems: 'baseline',
      }}
    >
      <span
        style={{
          fontFamily: F_MONO,
          fontSize: 10,
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
    padding: '10px 16px',
    borderRadius: 4,
    textDecoration: 'none',
    whiteSpace: 'nowrap',
    border: ghost ? `1px solid ${C.borderLight}` : `1px solid ${C.ink}`,
    color: primary ? C.surface : ghost ? C.muted : C.ink,
    background: primary ? C.ink : C.surface,
    display: 'inline-block',
  };
  // Internal links use next/link; external (e.g. anchors) keep <a>.
  if (href.startsWith('/')) {
    return <Link href={href} style={sx}>{children}</Link>;
  }
  return <a href={href} style={sx}>{children}</a>;
}

function tierStyle(tier: 'incumbent' | 'challenger' | 'emerging'): React.CSSProperties {
  const base: React.CSSProperties = {
    fontFamily: F_MONO,
    fontSize: 9.5,
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
