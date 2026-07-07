'use client';

import Link from 'next/link';
import {
  Section,
  HeroBand,
  Eyebrow,
  SectionTitle,
  Lead,
  BodyP,
  SubHead,
  Callout,
  T,
} from '@/components/home/learn/primitives';

export function Ch02DemandForecastChapter() {
  return (
    <>
      <HeroBand color="purple">
        <Eyebrow light>Intelligence · Apex Retail · Chapter 02</Eyebrow>
        <SectionTitle light size="xl">
          40-day inventory. 34% promo miss rate. Every extra day costs $1.2M.
        </SectionTitle>
        <Lead light>
          Marcus Chen, COO, measures operating leverage in inventory turns. When the turns are
          wrong, everything downstream is wrong — replenishment, promotions, labor. This chapter
          shows what the demand forecasting signals actually mean and what APX-02 is trying to fix.
        </Lead>
      </HeroBand>

      <StoryRecap>
        APX-02 &ldquo;Demand Forecasting Modernization&rdquo; is in Phase 3 (Design). The
        design spec is being finalized. The substrate has flagged two connected signals for
        two consecutive quarters. Intelligence hasn&rsquo;t seen any corrective movement yet —
        which is normal at P3, but makes the pressure card severity higher.
      </StoryRecap>

      <Section>
        <Eyebrow>Signal 1 of 2</Eyebrow>
        <SectionTitle>40 days on hand vs. 38-day peer median</SectionTitle>
        <Lead>
          Apex is carrying 2 extra days of inventory vs the $10–25B specialty retail peer cohort.
          That sounds small. At $18B revenue and roughly 2.5% of revenue in inventory, 2 extra
          days is approximately $2.4M in excess working capital sitting idle.
        </Lead>
        <BodyP>
          The arithmetic for Marcus: every day of excess inventory at Apex&rsquo;s scale costs
          approximately $1.2M in carrying cost (storage, capital cost, markdown risk). Two days =
          $2.4M/year in direct cost. But the indirect cost is larger: excess inventory creates
          phantom demand signals that distort the next forecast cycle. The two-day gap compounds.
        </BodyP>
        <BodyP>
          The intelligence substrate traces the 2-day excess to three categories: seasonal apparel
          (0.8 days), Morrison private label household (0.7 days), and electronics adjacencies
          (0.5 days). Seasonal apparel is the most fixable — it&rsquo;s a timing issue, not a
          structural one.
        </BodyP>
        <Callout kind="info" icon="📊" label="How Intelligence surfaces this">
          The substrate doesn&rsquo;t just compare Apex to the peer median. It identifies
          where within Apex the excess lives — by category, by DC, by season. That&rsquo;s
          what lets Marcus have a specific conversation with his category GMs instead of a
          general &ldquo;inventory is too high&rdquo; conversation.
        </Callout>
      </Section>

      <Section>
        <Eyebrow>Signal 2 of 2</Eyebrow>
        <SectionTitle>34% promo miss rate vs. 18% corpus median</SectionTitle>
        <Lead>
          Promo miss rate: the percentage of promotional events where actual sell-through
          is more than 15% below or above plan. Apex&rsquo;s 34% is nearly double the
          18% corpus median for this peer cohort. That&rsquo;s the second-largest signal
          in the Intelligence substrate.
        </Lead>
        <BodyP>
          A promo miss in either direction is expensive. Under-performance leaves margin on
          the table and creates clearance inventory. Over-performance means stockouts, lost
          revenue, and frustrated customers who came for a promo and left with nothing.
          At 34% miss rate on a promotional calendar that runs 280 events/year, roughly 95
          events per year miss by a meaningful margin.
        </BodyP>
        <BodyP>
          The substrate breaks the miss rate by direction: 21 percentage points are under-performance
          (excess inventory), 13 percentage points are over-performance (stockouts). The
          under-performance miss traces back to the same markdown timing gap as Chapter 1 —
          slow demand signals mean promotions are sized to forecast, not actuality.
        </BodyP>
      </Section>

      <Section>
        <Eyebrow>Pattern F215</Eyebrow>
        <SectionTitle>Demand Sensing Late Signal — the pattern</SectionTitle>
        <Lead>
          F215 describes the failure mode where demand signals from stores, loyalty data,
          and POS reach the forecasting model too late to influence the promotional decision.
          The decision is already locked; the signal arrives after the fact.
        </Lead>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: 14,
            margin: '20px 0',
          }}
        >
          {[
            {
              title: 'Current state at Apex',
              body: 'Demand signal latency: 6–8 days from store POS to forecasting model input. Promo decisions lock 10 days out. Model has 2–4 days of real signal before lock.',
              icon: '⏱️',
            },
            {
              title: 'Target state (APX-02)',
              body: 'Signal latency reduced to 24 hours via CDC pipeline from POS. Model retrain cycle weekly (vs monthly). Promo decisions have 9 days of real signal before lock.',
              icon: '🎯',
            },
            {
              title: 'Why it matters',
              body: 'The difference between 2 days and 9 days of real signal is the difference between forecast accuracy of ~66% and ~84% at the event level. 18-point accuracy swing.',
              icon: '📈',
            },
          ].map(({ title, body, icon }) => (
            <div
              key={title}
              style={{
                border: `1px solid ${T.navyLine}`,
                borderRadius: 10,
                padding: 18,
                background: T.navySoft,
              }}
            >
              <div style={{ fontSize: 24, marginBottom: 10 }}>{icon}</div>
              <div
                style={{
                  fontFamily: T.fBody,
                  fontSize: 13,
                  fontWeight: 700,
                  color: T.ink,
                  marginBottom: 8,
                }}
              >
                {title}
              </div>
              <div
                style={{
                  fontFamily: T.fBody,
                  fontSize: 13,
                  color: T.muted,
                  lineHeight: 1.6,
                }}
              >
                {body}
              </div>
            </div>
          ))}
        </div>
      </Section>

      <Section>
        <Eyebrow>APX-02 · Phase 3 Design</Eyebrow>
        <SectionTitle>What the design spec covers</SectionTitle>
        <Lead>
          Phase 3 (Design) means the diagnosis is complete and the design for the solution is
          being built. For APX-02, the design spec is finalizing three major decisions.
        </Lead>
        <SubHead>Decision 1: Data pipeline architecture</SubHead>
        <BodyP>
          Choice between near-real-time CDC (Change Data Capture) from POS systems vs.
          batch ingestion with a 4-hour window. CDC requires more infrastructure investment
          but unlocks same-day demand sensing. The design team is leaning CDC — the 18-point
          accuracy improvement justifies the build cost.
        </BodyP>
        <SubHead>Decision 2: Model architecture</SubHead>
        <BodyP>
          Current model is a gradient boosted tree trained monthly. Design spec evaluates
          switching to a transformer-based time-series model (TFT) retrained weekly.
          TFT models handle promotions and holidays significantly better but require 3x
          the training data and 4x the inference compute. At Apex&rsquo;s scale, that&rsquo;s
          a material infrastructure cost that James Wright (CPTO) is scrutinizing.
        </BodyP>
        <SubHead>Decision 3: Planner handoff UX</SubHead>
        <BodyP>
          The model output has to be trusted by the planning team. The current tool shows a
          single point estimate (&ldquo;forecast: 12,400 units&rdquo;). The new design shows
          a confidence interval with explicit uncertainty disclosure (&ldquo;forecast: 10,200–14,600
          units, 80% confidence interval&rdquo;). Early user testing shows planners reduce
          override rate when they see the interval — they&rsquo;re less likely to override
          when they understand the model&rsquo;s own uncertainty.
        </BodyP>
        <Callout kind="success" icon="✓" label="Q3 target">
          APX-02 design spec targets P3→P4 gate approval by end of Q2. If approved, the CDC
          pipeline goes live in Q3. The 34% promo miss rate should start declining in Q4 once
          the model has two quarters of improved signal data.
        </Callout>
      </Section>

      <Section>
        <Eyebrow>The CXO conversation</Eyebrow>
        <SectionTitle>What Marcus needs to hear from his team</SectionTitle>
        <Lead>
          Marcus&rsquo;s question: &ldquo;How bad is the inventory problem, and when does
          it get better?&rdquo;
        </Lead>

        <SubHead>Bad answer (generic)</SubHead>
        <div
          style={{
            background: '#FEF2F2',
            border: '1px solid #FCA5A5',
            borderRadius: 8,
            padding: '16px 20px',
            fontFamily: T.fBody,
            fontSize: 14,
            color: '#7F1D1D',
            lineHeight: 1.6,
            margin: '12px 0 20px',
          }}
        >
          &ldquo;We have some excess inventory in a few categories. The team is working on
          improving forecast accuracy. We expect to see improvement once APX-02 is deployed.&rdquo;
        </div>

        <SubHead>Good answer (Intelligence-backed)</SubHead>
        <div
          style={{
            background: '#F0FDF4',
            border: '1px solid #86EFAC',
            borderRadius: 8,
            padding: '16px 20px',
            fontFamily: T.fBody,
            fontSize: 14,
            color: '#14532D',
            lineHeight: 1.6,
            margin: '12px 0 20px',
          }}
        >
          &ldquo;We&rsquo;re carrying 40 days on hand vs 38-day peer median — about $2.4M
          in excess working capital. Seasonal apparel is the biggest bucket at 0.8 days excess,
          followed by Morrison household at 0.7 days. The promo miss rate is 34% vs 18%
          corpus median — we&rsquo;re missing on 95 events a year, mostly on the under-side
          which creates clearance inventory. APX-02 is in Phase 3 design now, targeting
          a P3→P4 gate in Q2. If the gate passes, the CDC pipeline goes live Q3 and we
          should see the promo miss rate start coming down in Q4 — from 34% toward the
          25% range within two quarters of the model having improved signal. The inventory
          days metric will lag by one cycle, so call it Q1 next year before we see that move.&rdquo;
        </div>
      </Section>

      <ChapterFooterNav
        prev={{ href: '/home/learn/intelligence/owned-brand', label: 'Ch.01 Owned Brand Margin' }}
        next={{ href: '/home/learn/intelligence/supply-chain', label: 'Ch.03 Supply Chain Risk' }}
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
