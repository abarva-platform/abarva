'use client';

import Link from 'next/link';
import {
  Section,
  HeroBand,
  Eyebrow,
  SectionTitle,
  Lead,
  BodyP,
  Callout,
  InlineAbarvaLogo,
  T,
} from '@/components/home/learn/primitives';

export function Ch04WhatToWatchChapter() {
  return (
    <>
      <HeroBand color="purple">
        <Eyebrow light>Intelligence · Apex Retail · Chapter 04</Eyebrow>
        <SectionTitle light size="xl">
          Six programs. Three caution flags. One portfolio view.
        </SectionTitle>
        <Lead light>
          David Kim, CEO, needs to answer one question at the May board meeting: &ldquo;Are we
          getting return on our AI investment?&rdquo; This chapter assembles the portfolio view —
          what&rsquo;s on track, what&rsquo;s at risk, and what the board-level narrative looks like.
        </Lead>
      </HeroBand>

      <StoryRecap>
        This is the final chapter. We&rsquo;ve walked three of the six programs. Here we step
        back to the portfolio level — the view Ava gives when you ask &ldquo;How is the
        overall AI portfolio performing?&rdquo; and &ldquo;What should I be worried about?&rdquo;
      </StoryRecap>

      <Section>
        <Eyebrow>Portfolio status</Eyebrow>
        <SectionTitle>Six programs, one snapshot</SectionTitle>
        <Lead>
          The Intelligence substrate surfaces a portfolio-level status view automatically.
          Here&rsquo;s what it shows for Apex Retail as of May 2026.
        </Lead>

        <div style={{ overflowX: 'auto', margin: '20px 0' }}>
          <table
            style={{
              width: '100%',
              borderCollapse: 'collapse',
              fontFamily: T.fBody,
              fontSize: 13,
            }}
          >
            <thead>
              <tr style={{ borderBottom: `2px solid ${T.border}` }}>
                {['Program', 'Phase', 'Status', 'Key Watch Item'].map((h) => (
                  <th
                    key={h}
                    style={{
                      textAlign: 'left',
                      padding: '8px 12px',
                      fontFamily: T.fMono,
                      fontSize: 10,
                      fontWeight: 700,
                      letterSpacing: '0.1em',
                      textTransform: 'uppercase',
                      color: T.muted,
                    }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[
                {
                  name: 'APX-01 · Owned Brand Margin',
                  phase: 'P4 · Validate',
                  status: '🟡 Watch',
                  statusColor: T.amber,
                  watch:
                    '12-week pilot read due June. Override rate down to 31% (from 47%). Need 2 more weeks of data before P5 gate.',
                },
                {
                  name: 'APX-02 · Demand Forecasting',
                  phase: 'P3 · Design',
                  status: '🟢 On track',
                  statusColor: T.teal,
                  watch:
                    'P3→P4 gate targeted end of Q2. CDC pipeline architecture decision pending this week.',
                },
                {
                  name: 'APX-03 · Store Labor',
                  phase: 'P5 · Complete',
                  status: '✅ Done',
                  statusColor: T.teal,
                  watch:
                    'Value realization tracking in Control Tower. 31% override rate was the signal; post-deployment rate is 19%. On measurement cadence.',
                },
                {
                  name: 'APX-04 · Digital Assortment',
                  phase: 'P2 · Diagnose',
                  status: '🟢 On track',
                  statusColor: T.teal,
                  watch:
                    '12% zero-velocity SKUs across top-line assortment. Diagnosis phase identifying root causes. P2→P3 gate in 4 weeks.',
                },
                {
                  name: 'APX-05 · Supply Chain Tower',
                  phase: 'P1 · Initiate',
                  status: '🔴 At risk',
                  statusColor: '#DC2626',
                  watch:
                    'Must pass P1→P2 gate by end of May for any peak season impact. Gate criteria not yet met (vendor coverage map + ownership matrix missing).',
                },
                {
                  name: 'APX-06 · Returns Fraud',
                  phase: 'P4 · Validate',
                  status: '🟡 Watch',
                  statusColor: T.amber,
                  watch:
                    '74% precision vs 85% target. Model needs 3 more weeks of training data. $180M returns cost — every 1% precision gain = ~$1.8M in fraud recovery.',
                },
              ].map((row) => (
                <tr key={row.name} style={{ borderBottom: `1px solid ${T.borderLt}` }}>
                  <td style={{ padding: '10px 12px', color: T.ink, fontWeight: 500 }}>
                    {row.name}
                  </td>
                  <td style={{ padding: '10px 12px' }}>
                    <span
                      style={{
                        fontFamily: T.fMono,
                        fontSize: 10,
                        fontWeight: 700,
                        letterSpacing: '0.08em',
                        color: T.muted,
                      }}
                    >
                      {row.phase}
                    </span>
                  </td>
                  <td style={{ padding: '10px 12px', whiteSpace: 'nowrap', color: row.statusColor, fontWeight: 600 }}>
                    {row.status}
                  </td>
                  <td style={{ padding: '10px 12px', color: T.muted, lineHeight: 1.5 }}>
                    {row.watch}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>

      <Section>
        <Eyebrow>Three caution flags</Eyebrow>
        <SectionTitle>What needs a decision this week</SectionTitle>
        <Lead>
          Ava flags time-sensitive items separately from status. These three require
          a decision or action in the next 7 days — waiting degrades the options.
        </Lead>

        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 12,
            margin: '16px 0',
          }}
        >
          {[
            {
              flag: '🔴 APX-05 Phase gate at risk',
              detail:
                'The P1→P2 gate criteria require a vendor coverage map and an ownership matrix. Neither has been submitted. The gate is due end of May — 3 weeks from now. James Wright\'s team needs to commit to these artifacts this week or the peak season deployment window closes.',
              severity: '#DC2626',
              bg: '#FEF2F2',
            },
            {
              flag: '🟡 APX-01 pilot read at decision point',
              detail:
                'The 12-week pilot ends in 2 weeks. If the override rate holds at ≤31% and promo margin shows 60–70bps improvement, the P4→P5 gate is straightforward. If the read is ambiguous, the team needs to decide: extend the pilot (costs Q3 recovery) or proceed to P5 with a softer evidence base.',
              severity: T.amber,
              bg: '#FFFBEB',
            },
            {
              flag: '🟡 APX-06 precision gap decision',
              detail:
                'At 74% precision vs 85% target, the fraud model is either deployed with a known gap (acceptable if the net recovery still beats the false-positive cost) or held for more training data. A 74% model catching $133M in fraud is still better than the baseline. The CFO needs to make this call explicitly — the program shouldn\'t make it implicitly by continuing to delay.',
              severity: T.amber,
              bg: '#FFFBEB',
            },
          ].map(({ flag, detail, bg }) => (
            <div
              key={flag}
              style={{
                background: bg,
                border: `1px solid ${bg === '#FEF2F2' ? '#FCA5A5' : '#FCD34D'}`,
                borderRadius: 8,
                padding: '16px 20px',
              }}
            >
              <div
                style={{
                  fontFamily: T.fBody,
                  fontSize: 14,
                  fontWeight: 700,
                  color: T.ink,
                  marginBottom: 8,
                }}
              >
                {flag}
              </div>
              <div
                style={{
                  fontFamily: T.fBody,
                  fontSize: 13,
                  color: T.body,
                  lineHeight: 1.6,
                }}
              >
                {detail}
              </div>
            </div>
          ))}
        </div>
      </Section>

      <Section>
        <Eyebrow>What Ava monitors automatically</Eyebrow>
        <SectionTitle>The substrate watches so you don&rsquo;t have to</SectionTitle>
        <Lead>
          Intelligence doesn&rsquo;t require manual queries to surface these signals. Ava
          monitors the substrate continuously and surfaces new pressure cards when thresholds
          are crossed. Here&rsquo;s what&rsquo;s in the automatic watchlist for Apex Retail.
        </Lead>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: 12,
            margin: '16px 0',
          }}
        >
          {[
            {
              metric: 'Private label GM weekly',
              threshold: 'Alert if weekly GM drops > 20bps vs 4-week average',
              program: 'APX-01',
            },
            {
              metric: 'Promo miss rate rolling 4-week',
              threshold: 'Alert if 4-week miss rate exceeds 36% (current floor)',
              program: 'APX-02',
            },
            {
              metric: 'APX-05 gate milestone',
              threshold: 'Alert if vendor coverage map not submitted by May 24',
              program: 'APX-05',
            },
            {
              metric: 'APX-06 fraud precision weekly',
              threshold: 'Alert if precision drops below 70% — model drift indicator',
              program: 'APX-06',
            },
            {
              metric: 'Lead time variance by vendor',
              threshold: 'Alert if any Tier-1 vendor exceeds ±28-day variance',
              program: 'APX-05',
            },
            {
              metric: 'Override rate (promotional)',
              threshold: 'Alert if override rate increases above 33% in pilot categories',
              program: 'APX-01',
            },
          ].map(({ metric, threshold, program }) => (
            <div
              key={metric}
              style={{
                border: `1px solid ${T.borderLt}`,
                borderRadius: 8,
                padding: 14,
                background: T.surface2,
              }}
            >
              <div
                style={{
                  fontFamily: T.fMono,
                  fontSize: 9,
                  fontWeight: 700,
                  letterSpacing: '0.1em',
                  textTransform: 'uppercase',
                  color: T.purple,
                  marginBottom: 6,
                }}
              >
                {program}
              </div>
              <div
                style={{
                  fontFamily: T.fBody,
                  fontSize: 13,
                  fontWeight: 600,
                  color: T.ink,
                  marginBottom: 6,
                }}
              >
                {metric}
              </div>
              <div
                style={{
                  fontFamily: T.fBody,
                  fontSize: 12,
                  color: T.muted,
                  lineHeight: 1.5,
                }}
              >
                {threshold}
              </div>
            </div>
          ))}
        </div>
      </Section>

      <Section>
        <Eyebrow>The board narrative</Eyebrow>
        <SectionTitle>What David Kim says in May</SectionTitle>
        <Lead>
          The CEO needs a 3-minute narrative on AI portfolio performance. Here&rsquo;s what
          it sounds like with Intelligence backing it.
        </Lead>
        <div
          style={{
            background: T.surface2,
            border: `1px solid ${T.border}`,
            borderRadius: 10,
            padding: '24px 28px',
            fontFamily: T.fBody,
            fontSize: 14,
            color: T.body,
            lineHeight: 1.75,
            margin: '16px 0',
          }}
        >
          <p style={{ margin: '0 0 14px' }}>
            &ldquo;We have six AI programs in flight. One complete — store labor optimization
            is live and running at 19% override rate vs 31% at program start. Two in the
            Validate phase: owned brand margin and returns fraud detection.
          </p>
          <p style={{ margin: '0 0 14px' }}>
            On owned brand margin: we traced 240bps of GM gap to three causes. The 90bps
            promotional depth piece is in Phase 4 validation now — early reads are
            encouraging. If the 12-week pilot holds, we should see that 90bps start recovering
            in Q3. The 80bps markdown timing piece depends on APX-02 forecasting going
            live in Q3. The 70bps mix shift is a 2026 assortment reset, not a quick fix.
          </p>
          <p style={{ margin: '0 0 14px' }}>
            On supply chain: we have ±23-day lead time variance vs ±9-day peer median.
            The control tower program is initiated but at risk of missing peak season
            if we don&rsquo;t pass the Phase 1→2 gate by end of May. We&rsquo;re hedging
            operationally by pulling the Morrison seasonal buy forward to June 15.
          </p>
          <p style={{ margin: 0 }}>
            Bottom line: three programs on track, one completed, two requiring decisions
            in the next two weeks. The AI substrate is giving us better decomposition of
            our cost structure than we had 12 months ago. The work now is making sure
            the programs operate at the speed the substrate warrants.&rdquo;
          </p>
        </div>
        <BodyP>
          Note what this narrative does: it owns the gaps (the 70bps mix shift isn&rsquo;t
          getting fixed this year), names the specific decision points (May gate, June 15 buy),
          and quantifies the recoverable pieces vs the structural ones. The board can hold
          management accountable to that. They can&rsquo;t hold management accountable to
          &ldquo;we&rsquo;re working on AI.&rdquo;
        </BodyP>
        <Callout kind="success" icon="✓" label="What Intelligence makes possible">
          Every number in that narrative came from the Intelligence substrate. Before <InlineAbarvaLogo />,
          the CEO team was assembling these numbers from four different reporting systems,
          two weeks after the fact, in a format that couldn&rsquo;t show causal attribution.
          The 240bps decomposition alone — knowing it&rsquo;s 90+80+70, not just 240 — is
          what changes &ldquo;we&rsquo;re monitoring&rdquo; to &ldquo;here&rsquo;s what we&rsquo;re fixing and when.&rdquo;
        </Callout>
      </Section>

      <ChapterFooterNav
        prev={{ href: '/home/learn/intelligence/supply-chain', label: 'Ch.03 Supply Chain Risk' }}
        next={null}
      />
    </>
  );
}

function StoryRecap({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        background: T.purpleSoft,
        borderLeft: `3px solid ${T.purple}`,
        padding: '16px 20px',
        fontFamily: T.fBody,
        fontSize: 14,
        color: T.body,
        lineHeight: 1.65,
      }}
    >
      <span
        style={{
          fontFamily: T.fMono,
          fontSize: 10,
          fontWeight: 700,
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
          color: T.purple,
          display: 'block',
          marginBottom: 6,
        }}
      >
        Where we are in the story
      </span>
      {children}
    </div>
  );
}

function ChapterFooterNav({
  prev,
  next,
}: {
  prev: { href: string; label: string } | null;
  next: { href: string; label: string } | null;
}) {
  return (
    <nav
      aria-label="Chapter navigation"
      style={{
        padding: '40px clamp(32px, 4vw, 64px) 64px',
        borderTop: `1px solid ${T.borderLt}`,
        background: T.surface2,
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: 24,
      }}
    >
      <div>
        {prev && (
          <Link
            href={prev.href}
            style={{
              display: 'block',
              textDecoration: 'none',
              border: `1px solid ${T.border}`,
              borderRadius: 8,
              padding: '14px 18px',
              background: T.surface,
            }}
          >
            <div
              style={{
                fontFamily: T.fMono,
                fontSize: 10,
                fontWeight: 700,
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                color: T.faint,
                marginBottom: 4,
              }}
            >
              ← Previous
            </div>
            <div style={{ fontFamily: T.fBody, fontSize: 14, fontWeight: 600, color: T.ink }}>
              {prev.label}
            </div>
          </Link>
        )}
      </div>
      <div>
        {next && (
          <Link
            href={next.href}
            style={{
              display: 'block',
              textDecoration: 'none',
              border: `1px solid ${T.border}`,
              borderRadius: 8,
              padding: '14px 18px',
              background: T.surface,
              textAlign: 'right',
            }}
          >
            <div
              style={{
                fontFamily: T.fMono,
                fontSize: 10,
                fontWeight: 700,
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                color: T.faint,
                marginBottom: 4,
              }}
            >
              Next chapter →
            </div>
            <div style={{ fontFamily: T.fBody, fontSize: 14, fontWeight: 600, color: T.ink }}>
              {next.label}
            </div>
          </Link>
        )}
      </div>
    </nav>
  );
}
