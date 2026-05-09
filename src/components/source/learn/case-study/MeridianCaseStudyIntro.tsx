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
import { CASE_STUDY_CHAPTER_SLUGS, findSourceLearnNavItem } from '@/lib/source/learn/learn-nav';

export function MeridianCaseStudyIntro() {
  return (
    <>
      <HeroBand color="navy">
        <Eyebrow light>Source · Meridian Case Study</Eyebrow>
        <SectionTitle light size="xl">
          Meridian Health · $8M Cloud &amp; Infrastructure.
        </SectionTitle>
        <Lead light>
          One real sourcing event, walked end-to-end. Eleven chapters mapping 1:1 to
          the Source lifecycle, but read as one story — from the day CTO Marcus
          Webb says &ldquo;the lease is up&rdquo; to month 18 when Atlas&rsquo;s
          d32 ledger surfaces a $3.2M variance against the straight-line
          projection. Specifics over abstractions; lessons over walkthroughs.
        </Lead>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 4 }}>
          {[
            'Archetype: Cloud / Infrastructure',
            'Value: $8M low / $12M high annual',
            'Rigor: Standard',
            'Time: ~50 min · 11 chapters',
          ].map((tag) => (
            <span
              key={tag}
              style={{
                fontFamily: T.fMono,
                fontSize: 10,
                fontWeight: 700,
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
                padding: '5px 12px',
                borderRadius: 4,
                background: 'rgba(255,255,255,0.14)',
                color: 'rgba(255,255,255,0.9)',
                border: '1px solid rgba(255,255,255,0.14)',
              }}
            >
              {tag}
            </span>
          ))}
        </div>
      </HeroBand>

      <Section>
        <Eyebrow>Why a case study, not a walkthrough</Eyebrow>
        <SectionTitle>One story beats eleven abstract stage memos</SectionTitle>
        <Lead>
          Most procurement primers explain stages in the abstract — &ldquo;in
          Stage 6 you analyze pricing.&rdquo; That teaches the diagram, not the
          job. We walk one event end-to-end instead, so the reader sees how a
          decision in Chapter 2 (scope) shows up as a P0 trap in Chapter 6
          (pricing) and a 2-month cutover slip in Chapter 10 (transition). The
          stages are the same; the connective tissue is the lesson.
        </Lead>
        <Callout
          kind="info"
          icon="🧭"
          label="Read it as one document"
        >
          Each chapter ends with a <em>Next chapter →</em> link. Read in order and
          you&rsquo;ll have a complete picture of a real $8M sourcing event in
          about 50 minutes. The side-nav lets you jump to a specific chapter,
          but the connective tissue lives in the recap paragraph that opens
          each one.
        </Callout>
      </Section>

      <Section>
        <Eyebrow>Cast of characters</Eyebrow>
        <SectionTitle>Five people make this decision</SectionTitle>
        <Lead>
          Procurement is named accountability. The names matter — they show up
          on the d24 decision brief, in vendor letters, and in the audit trail.
          Here&rsquo;s who&rsquo;s in the room.
        </Lead>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
            gap: 14,
            margin: '20px 0',
          }}
        >
          <CastCard
            name="Marcus Webb"
            role="CTO · Decision sponsor"
            bullet="Owns the call. Signs d24. Reports the outcome to the board. Wants to see TCO + risk + a clean BAFO trail."
          />
          <CastCard
            name="Sarah Kim"
            role="CFO · Concurrence"
            bullet="Co-signs d24. Cares about cash-flow timing, escalator clauses, and exit cost. Will challenge the value-realization model in Chapter 11."
          />
          <CastCard
            name="Karen Liu"
            role="CIO · Day-to-day owner"
            bullet="Reports to Marcus. Runs the migration in Chapter 10. Authors the scope memo with Janet in Chapter 2. Carries the slip when Cloverleaf surprises them."
          />
          <CastCard
            name="Janet Fischer"
            role="VP IT Ops · Procurement lead"
            bullet="The procurement-side owner. Issues d09. Runs blind scoring in Chapter 5. Drafts BAFO question packs in Chapter 7. The &ldquo;Issued by&rdquo; on every export."
          />
          <CastCard
            name="Patricia Singh"
            role="COO · Executive escalation"
            bullet="Not in the room every day. Pulled in if a vendor escalates around Marcus or if cutover risk goes red. Doesn&rsquo;t appear until Chapter 10."
          />
        </div>
      </Section>

      <Section>
        <Eyebrow>The trigger</Eyebrow>
        <SectionTitle>Why this event exists</SectionTitle>
        <Lead>
          The Newark colocation lease expires Q3 2027 with an 18% YoY rate
          escalation locked in. Rebuilding bare-metal at a new colo is
          explicitly out of consideration — the CTO&rsquo;s decision before
          this event opens. Cloud is the move. The question is which cloud, on
          what terms, with what exit posture.
        </Lead>

        <SubHead>What&rsquo;s in scope</SubHead>
        <BodyP>
          280 production workloads — Epic CIS (the clinical record), MyChart
          (the patient portal), Cloverleaf integration middleware (the
          interface engine that talks to 47 downstream systems), ServiceNow
          ITSM, and roughly 180 in-house apps. DR for 47 Tier-1 systems is in;
          DR for Tier-2 is explicitly deferred to a follow-on event.
        </BodyP>

        <SubHead>What&rsquo;s out</SubHead>
        <BodyP>
          Epic Clarity / Caboodle (analytics warehouse) is out — that&rsquo;s
          a separate program with its own funding line. Tier-2 DR is out.
          Knowing what&rsquo;s out is half the scope job.
        </BodyP>

        <SubHead>Value at stake</SubHead>
        <BodyP>
          $8M low / $12M high annual run-rate, depending on architecture. Over
          a 5-year contract that&rsquo;s $40M–$60M committed. Standard rigor —
          this isn&rsquo;t board-visible enough to need elevated rigor, but
          it&rsquo;s big enough that every decision will be audited.
        </BodyP>
      </Section>

      <Section>
        <Eyebrow>The chapters</Eyebrow>
        <SectionTitle>Eleven chapters, one event</SectionTitle>
        <Lead>
          Each chapter advances the story. Click into one to read it
          standalone, but read in order to feel the connective tissue —
          Chapter 6&rsquo;s pricing traps depend on Chapter 2&rsquo;s scope
          memo; Chapter 10&rsquo;s slip is foreshadowed by what Chapter 2
          didn&rsquo;t enumerate.
        </Lead>

        <ol
          style={{
            listStyle: 'none',
            padding: 0,
            margin: '24px 0 0',
            display: 'flex',
            flexDirection: 'column',
            gap: 8,
          }}
        >
          {CASE_STUDY_CHAPTER_SLUGS.map((slug, i) => {
            const item = findSourceLearnNavItem(slug);
            if (!item) return null;
            const subtitle = CHAPTER_SUMMARIES[slug] ?? '';
            return (
              <li key={slug}>
                <Link
                  href={`/source/learn/${slug}`}
                  style={{
                    display: 'flex',
                    gap: 16,
                    alignItems: 'flex-start',
                    padding: '12px 16px',
                    border: `1px solid ${T.borderLt}`,
                    borderRadius: 8,
                    background: T.surface,
                    textDecoration: 'none',
                  }}
                >
                  <span
                    style={{
                      fontFamily: T.fMono,
                      fontSize: 11,
                      fontWeight: 700,
                      color: '#fff',
                      background: T.navy,
                      borderRadius: 4,
                      padding: '4px 8px',
                      flexShrink: 0,
                      width: 32,
                      textAlign: 'center',
                    }}
                  >
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  <div>
                    <div
                      style={{
                        fontFamily: T.fBody,
                        fontSize: 14,
                        fontWeight: 700,
                        color: T.ink,
                        marginBottom: 4,
                      }}
                    >
                      {item.label.replace(/^Ch\.\d+ /, '')}
                    </div>
                    <div
                      style={{
                        fontFamily: T.fBody,
                        fontSize: 13,
                        color: T.muted,
                        lineHeight: 1.5,
                      }}
                    >
                      {subtitle}
                    </div>
                  </div>
                </Link>
              </li>
            );
          })}
        </ol>
      </Section>

      <Section>
        <Eyebrow>How to use this</Eyebrow>
        <SectionTitle>Three ways to read it</SectionTitle>
        <SubHead>1 · Cover-to-cover</SubHead>
        <BodyP>
          Start at <Link href="/source/learn/strategy" style={{ color: T.navy, fontWeight: 600 }}>Chapter 1 Strategy</Link>{' '}
          and click <em>Next chapter →</em> at the bottom of each. Roughly 50
          minutes start to finish. Best path if you&rsquo;ve never run a
          sourcing event before — the connective tissue between chapters is
          where the lessons live.
        </BodyP>
        <SubHead>2 · Jump to where you are</SubHead>
        <BodyP>
          Use the side-nav to land on the chapter that matches the stage of
          your real event. Read the &ldquo;where we are in the story&rdquo;
          recap at the top, then the chapter, then ignore the prev/next links.
          Best path if you&rsquo;re mid-event and want one specific lesson.
        </BodyP>
        <SubHead>3 · Demo this to your team</SubHead>
        <BodyP>
          The numbers and people are realistic enough to use as a teaching
          example for procurement onboarding. The pricing traps in Chapter 6,
          the BAFO question shapes in Chapter 7, and the variance-attribution
          math in Chapter 11 transfer directly to your own events.
        </BodyP>
      </Section>
    </>
  );
}

const CHAPTER_SUMMARIES: Record<string, string> = {
  strategy:
    'Day 1. CTO Marcus Webb names the trigger. Sentinel drafts d01 from intake metadata. Three gate criteria.',
  scope:
    'Day 4. Karen Liu and Janet Fischer agree the 280-workload boundary. d05 scope memo. Cloverleaf integrations under-enumerated — a chapter-10 problem in the making.',
  rfp:
    'Day 12. Sentinel composes d09 from d01 + d05 + d21. Eight scoping questions. Vendor pool of four (A, B, C, D) shortlisted from market scan.',
  responses:
    'Day 35. Four responses received. Vendor C&rsquo;s bid is incomplete — Sentinel&rsquo;s d11 checklist flags 6 missing fields. C drops; pool to three.',
  evaluation:
    'Day 42. Blind scoring against d16 rubric. B at 87, A at 82, D at 78. All three advance to pricing.',
  pricing:
    'Day 50. Sentinel&rsquo;s pricing-trap detector finds 3 P0 + 2 P1 issues across the three vendors. d20 trap log compiled. The egress trap on Vendor A is the dramatic one.',
  bafo:
    'Day 65. Janet authors d22 with 12 BAFO questions across two finalists. A refuses to remove a 7-year exclusivity clause and drops. B and D respond; B comes back at $9.4M and wins on price + scope correction.',
  decision:
    'Day 90. Atlas composes d24 from the cumulative event state. CTO Marcus and CFO Sarah sign. Recommends Vendor B at $9.4M committed, value-at-stake $40M over 5 years.',
  selection:
    'Day 95. Sentinel drafts one winner letter to B and two loser letters to A and D — each with rubric breakdown and the specific concern that closed them out.',
  transition:
    'Day 100 → Month 9. Cutover plan slips 2 months. Cloverleaf middleware hid 47 custom integrations Chapter 2&rsquo;s scope memo didn&rsquo;t enumerate. Day-1 checkpoint moves from month 7 to month 9.',
  value:
    'Month 18. Atlas&rsquo;s d32 ledger reads $11.2M realized vs $14.4M straight-line projection. The $3.2M gap traces entirely to the 2-month slip. Owner named, measurement cadence set.',
};

function CastCard({
  name,
  role,
  bullet,
}: {
  name: string;
  role: string;
  bullet: string;
}) {
  return (
    <div
      style={{
        border: `1px solid ${T.border}`,
        borderRadius: 10,
        padding: 18,
        background: T.surface,
      }}
    >
      <div
        style={{
          fontFamily: T.fDisp,
          fontSize: 18,
          color: T.ink,
          letterSpacing: '-0.01em',
          marginBottom: 4,
        }}
      >
        {name}
      </div>
      <div
        style={{
          fontFamily: T.fMono,
          fontSize: 10,
          fontWeight: 700,
          letterSpacing: '0.12em',
          textTransform: 'uppercase',
          color: T.navy,
          marginBottom: 10,
        }}
      >
        {role}
      </div>
      <div
        style={{
          fontFamily: T.fBody,
          fontSize: 13,
          color: T.muted,
          lineHeight: 1.55,
        }}
      >
        {bullet}
      </div>
    </div>
  );
}
