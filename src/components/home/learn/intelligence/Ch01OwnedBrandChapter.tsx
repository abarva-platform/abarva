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

export function Ch01OwnedBrandChapter() {
  return (
    <>
      <HeroBand color="purple">
        <Eyebrow light>Intelligence · Apex Retail · Chapter 01</Eyebrow>
        <SectionTitle light size="xl">
          Private label GM is 240bps below plan. Here&rsquo;s where it comes from.
        </SectionTitle>
        <Lead light>
          Rachel Torres, CFO, has the same question in every quarterly review: &ldquo;What exactly is
          pulling down private label margin?&rdquo; This chapter walks the signal, the decomposition,
          the pattern, and what the right answer sounds like — versus what a generic AI would say.
        </Lead>
      </HeroBand>

      <StoryRecap>
        APX-01 &ldquo;Morrison Owned Brand Margin Recovery&rdquo; is currently in Phase 4 (Validate).
        The Intelligence substrate has been live for two quarters. Ava has surfaced the owned
        brand signal three times — each time with more evidence. This chapter shows what that signal
        actually contains and what to do with it.
      </StoryRecap>

      <Section>
        <Eyebrow>The signal</Eyebrow>
        <SectionTitle>What Ava surfaced</SectionTitle>
        <Lead>
          The pressure card reads: <em>&ldquo;Private label gross margin 240bps below plan across 14
          segments. Three contributing factors identified: promotional depth, markdown timing,
          assortment mix.&rdquo;</em> Severity: High. Evidence strength: Strong (6 connected data sources).
        </Lead>
        <BodyP>
          The signal isn&rsquo;t novel — finance has been tracking the GM gap for two quarters.
          What&rsquo;s new is the decomposition. Before Intelligence, the gap was an aggregate number.
          Ava breaks it into three causal buckets and ties each to a specific set of SKUs,
          categories, and weeks. That&rsquo;s what makes it actionable.
        </BodyP>
        <Callout kind="info" icon="💡" label="Why decomposition matters">
          The CFO doesn&rsquo;t need to know the gap exists — she already knows. She needs to know
          whether to fix it in promotional strategy, markdown calendaring, or assortment. Those are
          three different programs with three different owners. The decomposition is the answer.
        </Callout>
      </Section>

      <Section>
        <Eyebrow>The breakdown</Eyebrow>
        <SectionTitle>240bps traced to three causes</SectionTitle>
        <Lead>
          Ava&rsquo;s attribution model runs across the promotional calendar, markdown log, and
          assortment performance data. Here&rsquo;s the split.
        </Lead>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: 14,
            margin: '20px 0',
          }}
        >
          {[
            {
              bps: '90bps',
              cause: 'Promotional Depth',
              detail:
                'AI pricing model recommends a depth. Store team overrides to 15–25% deeper. The override rate is 47% — nearly half of all promo events. Each override averages 90bps of margin impact.',
              color: T.amber,
            },
            {
              bps: '80bps',
              cause: 'Markdown Timing',
              detail:
                'Markdown decisions lag demand signal by an average of 11 days. Late markdowns require deeper cuts to clear inventory before seasonal transition. Especially acute in Morrison housewares and apparel adjacencies.',
              color: T.amber,
            },
            {
              bps: '70bps',
              cause: 'Assortment Mix Shift',
              detail:
                'Three high-margin Morrison categories (kitchen accessories, home textiles, small appliances) lost 4.2 points of category share to national brands over 6 months. Lower-margin national brands filling the void.',
              color: T.navy,
            },
          ].map(({ bps, cause, detail, color }) => (
            <div
              key={cause}
              style={{
                border: `1px solid ${color}44`,
                borderRadius: 10,
                padding: 20,
                background: color + '08',
              }}
            >
              <div
                style={{
                  fontFamily: T.fDisp,
                  fontSize: 36,
                  color,
                  letterSpacing: '-0.02em',
                  marginBottom: 4,
                }}
              >
                {bps}
              </div>
              <div
                style={{
                  fontFamily: T.fMono,
                  fontSize: 10,
                  fontWeight: 700,
                  letterSpacing: '0.1em',
                  textTransform: 'uppercase',
                  color,
                  marginBottom: 10,
                }}
              >
                {cause}
              </div>
              <div
                style={{
                  fontFamily: T.fBody,
                  fontSize: 13,
                  color: T.muted,
                  lineHeight: 1.6,
                }}
              >
                {detail}
              </div>
            </div>
          ))}
        </div>

        <BodyP>
          The 90bps promotional depth gap is the most tractable. It has a clear owner (Lisa Park, CMO),
          a clear mechanism (F213 Promotional AI Guardrails), and a program already in flight (APX-01).
          The markdown timing gap is harder — it touches both CMO and COO territory and depends on
          APX-02 demand forecasting being live. The mix shift is a longer-cycle problem.
        </BodyP>
      </Section>

      <Section>
        <Eyebrow>Pattern F213</Eyebrow>
        <SectionTitle>Promotional AI Guardrails — the pattern behind the gap</SectionTitle>
        <Lead>
          F213 is one of 42 retail-specific patterns in the corpus. It describes the failure mode where
          AI pricing recommendations are systematically overridden by humans who &ldquo;know better,&rdquo;
          resulting in margin leakage that is invisible until the quarterly review.
        </Lead>
        <BodyP>
          The pattern has three sub-components at Apex:
        </BodyP>
        <ol
          style={{
            fontFamily: T.fBody,
            fontSize: 14,
            color: T.body,
            lineHeight: 1.7,
            paddingLeft: 24,
            margin: '12px 0',
          }}
        >
          <li>
            <strong>Model-human trust gap:</strong> Store planning team doesn&rsquo;t trust the
            depth recommendation because the model was trained on pre-COVID promotional data. The
            skepticism is rational — but the fix is retraining the model, not bypassing it.
          </li>
          <li style={{ marginTop: 8 }}>
            <strong>Override audit trail is thin:</strong> When a planner overrides the model,
            the override isn&rsquo;t logged with a reason code. Three quarters of overrides have
            no documented rationale. This makes it impossible to distinguish good overrides
            (the planner knew something the model didn&rsquo;t) from habitual ones.
          </li>
          <li style={{ marginTop: 8 }}>
            <strong>Feedback loop broken:</strong> When the override leads to a worse outcome,
            no signal goes back to the planner. The model gets better from the data, but the
            planner doesn&rsquo;t see the cost of their overrides. Behavior doesn&rsquo;t change.
          </li>
        </ol>
        <Callout kind="warn" icon="⚠️" label="What F213 doesn't mean">
          F213 is not about removing human judgment from promotional decisions. The pattern fix is
          adding structure — logging overrides with reason codes, surfacing override-vs-outcome data
          monthly, and retraining the model on recent data. The planner still makes the call. The
          difference is the call is now accountable.
        </Callout>
      </Section>

      <Section>
        <Eyebrow>The CXO conversation</Eyebrow>
        <SectionTitle>How to answer Rachel&rsquo;s question</SectionTitle>
        <Lead>
          Rachel&rsquo;s question at every quarterly review: &ldquo;What exactly is pulling down
          private label margin?&rdquo; Here&rsquo;s what a good answer looks like versus a
          generic one.
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
          &ldquo;Private label margin is under pressure due to competitive dynamics and promotional
          intensity in the category. We&rsquo;re working on improving our pricing algorithms and
          inventory management. The team is actively monitoring the situation.&rdquo;
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
          &ldquo;We have 240bps of private label GM gap against plan. It breaks three ways: 90bps
          from promo overrides — our planners are overriding AI recommendations to go 15–25% deeper
          on 47% of promo events, with no outcome tracking. APX-01 addresses this in Phase 4 right
          now with guardrail logic. 80bps from markdown timing — we&rsquo;re 11 days late on
          average, which forces steeper clearance cuts. That fixes when APX-02 forecasting goes
          live in Q3. The remaining 70bps is category mix shift in Morrison — national brands are
          recapturing share in housewares. That&rsquo;s a 2026 assortment decision, not a Q2
          recovery. So 170bps is recoverable this year; 70bps is a longer cycle.&rdquo;
        </div>

        <BodyP>
          The difference: the good answer tells Rachel which 170bps to expect back this year,
          which 70bps to expect next year, and which program owns each piece. She can go to
          the board with that. She can&rsquo;t go to the board with &ldquo;we&rsquo;re monitoring.&rdquo;
        </BodyP>
      </Section>

      <Section>
        <Eyebrow>APX-01 · Phase 4 Validate</Eyebrow>
        <SectionTitle>What the program is actually testing</SectionTitle>
        <Lead>
          Phase 4 (Validate) means the solution design is complete and in controlled testing.
          For APX-01, validation looks like:
        </Lead>
        <ul
          style={{
            fontFamily: T.fBody,
            fontSize: 14,
            color: T.body,
            lineHeight: 1.7,
            paddingLeft: 20,
            margin: '12px 0',
          }}
        >
          <li>
            Guardrail logic deployed to 3 pilot categories (kitchenware, personal care, seasonal).
            Override reason codes required for any deviation &gt; 5% from model recommendation.
          </li>
          <li style={{ marginTop: 6 }}>
            Override-vs-outcome reporting running for 8 weeks. CFO team reviewing weekly.
          </li>
          <li style={{ marginTop: 6 }}>
            Model retraining on 2023–2025 data complete; accuracy on held-out test set: 88.3%
            (vs 79.1% on pre-retrain model).
          </li>
          <li style={{ marginTop: 6 }}>
            Early reads: override rate down from 47% to 31% in pilot categories.
            Promo margin up an estimated 60–70bps in pilot (still within noise range; need 12-week read).
          </li>
        </ul>
        <Callout kind="success" icon="✓" label="What &ldquo;Validate&rdquo; means for the CXO">
          Phase 4 is the last stage before full rollout. If the 12-week pilot holds, APX-01 goes to
          P5 mobilization — full deployment across all Morrison promo categories. The 90bps
          promotional depth gap starts closing in Q3 upon full deployment.
        </Callout>
      </Section>

      <ChapterFooterNav
        prev={null}
        next={{ href: '/home/learn/intelligence/demand-forecast', label: 'Ch.02 Demand Forecasting' }}
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
        margin: '0',
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
