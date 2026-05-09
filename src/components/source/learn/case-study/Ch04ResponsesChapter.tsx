'use client';

import {
  Section,
  HeroBand,
  Eyebrow,
  SectionTitle,
  Lead,
  BodyP,
  SubHead,
} from '@/components/home/learn/primitives';
import {
  ChapterShell,
  StoryRecap,
  GateStatusBox,
  PitfallBox,
  ArtifactSpecimen,
  AgentSplitBox,
} from './_shell';

export function Ch04ResponsesChapter() {
  return (
    <ChapterShell slug="responses">
      <HeroBand color="navy">
        <Eyebrow light>Meridian Case Study · Chapter 04 · Stage 04 Responses</Eyebrow>
        <SectionTitle light size="xl">Day 35. Vendor C drops out.</SectionTitle>
        <Lead light>
          Four responses come in. Three are usable; one is not. Vendor C
          treats the d19a pricing template as a suggestion and submits its
          own format with six fields missing. Sentinel&rsquo;s d11 checklist
          flags the gaps in 90 seconds. C is offered a correction window,
          declines, and drops out. The pool is now three.
        </Lead>
      </HeroBand>

      <StoryRecap>
        We issued the RFP on Day 12. The response window closed on Day 33;
        Janet picks up the responses on Day 34 and runs them through d11
        on Day 35. The job of this chapter is the completeness check —
        before scoring, before pricing analysis, are these four bids even
        comparable to each other? Three are. One isn&rsquo;t.
      </StoryRecap>

      <Section>
        <Eyebrow>Day 33 · Responses arrive</Eyebrow>
        <SectionTitle>Four envelopes</SectionTitle>
        <Lead>
          By the 18:00 EST deadline, all four invited vendors have submitted.
          That itself is a small win — RFPs in this archetype routinely lose
          one vendor to no-bid. The volume is heavy: each response is
          400–700 pages including appendices and reference architecture
          diagrams.
        </Lead>
        <BodyP>
          Janet uploads each response packet to the canvas as a vendor
          submission. Sentinel receipts them, indexes them, and runs the
          d11 completeness check overnight. By 9:00 a.m. on Day 34 there
          are four d11 reports waiting.
        </BodyP>
      </Section>

      <Section>
        <Eyebrow>Day 34 · The d11 reports</Eyebrow>
        <SectionTitle>Three pass, one fails</SectionTitle>

        <ArtifactSpecimen
          code="d11"
          title="Response checklist · Completeness summary · Day 34"
        >
          <p style={{ marginBottom: 12 }}>
            <strong>8 mandatory items · 14 recommended items · 4 vendor responses received</strong>
          </p>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ textAlign: 'left', borderBottom: '1px solid #D1D5DB' }}>
                <th style={{ padding: '6px 8px' }}>Vendor</th>
                <th style={{ padding: '6px 8px' }}>Mandatory met</th>
                <th style={{ padding: '6px 8px' }}>Recommended met</th>
                <th style={{ padding: '6px 8px' }}>Status</th>
              </tr>
            </thead>
            <tbody>
              <tr style={{ borderBottom: '1px solid #E5E7EB' }}>
                <td style={{ padding: '6px 8px' }}>Vendor A</td>
                <td style={{ padding: '6px 8px' }}>8 / 8</td>
                <td style={{ padding: '6px 8px' }}>13 / 14</td>
                <td style={{ padding: '6px 8px', color: '#0E8A65' }}>Complete</td>
              </tr>
              <tr style={{ borderBottom: '1px solid #E5E7EB' }}>
                <td style={{ padding: '6px 8px' }}>Vendor B</td>
                <td style={{ padding: '6px 8px' }}>8 / 8</td>
                <td style={{ padding: '6px 8px' }}>14 / 14</td>
                <td style={{ padding: '6px 8px', color: '#0E8A65' }}>Complete</td>
              </tr>
              <tr style={{ borderBottom: '1px solid #E5E7EB' }}>
                <td style={{ padding: '6px 8px' }}>Vendor C</td>
                <td style={{ padding: '6px 8px' }}>2 / 8</td>
                <td style={{ padding: '6px 8px' }}>4 / 14</td>
                <td style={{ padding: '6px 8px', color: '#92400E' }}>Incomplete · 6 mandatory missing</td>
              </tr>
              <tr>
                <td style={{ padding: '6px 8px' }}>Vendor D</td>
                <td style={{ padding: '6px 8px' }}>8 / 8</td>
                <td style={{ padding: '6px 8px' }}>11 / 14</td>
                <td style={{ padding: '6px 8px', color: '#0E8A65' }}>Complete</td>
              </tr>
            </tbody>
          </table>
        </ArtifactSpecimen>

        <BodyP>
          Vendor C is the immediate problem. The 6 mandatory items missing:
          (1) workload-by-workload tier proposal in d19a — they substituted
          their own &ldquo;portfolio pricing&rdquo; spreadsheet; (2) DR
          architecture details for the 47 named systems — they referenced
          their generic DR datasheet; (3) the 6-month cutover plan — they
          quoted &ldquo;industry standard 9–18 month migrations&rdquo;; (4)
          Cloverleaf strategy — not addressed; (5) BAA template — they
          referenced their public legal portal; (6) reference customers —
          listed three but none on Epic.
        </BodyP>
      </Section>

      <Section>
        <Eyebrow>Why C&rsquo;s response failed</Eyebrow>
        <SectionTitle>The d19a substitution problem</SectionTitle>
        <Lead>
          Sentinel&rsquo;s analysis of the C response, surfaced inline on
          the d11 report: &ldquo;Vendor C substituted their published
          portfolio pricing schedule for the d19a workbook. The d09 cover
          note explicitly stated d19a fields could not be substituted. This
          may indicate either (a) lack of capacity to bid in the format
          requested, or (b) deliberate framing to obscure unit-level
          pricing.&rdquo;
        </Lead>
        <BodyP>
          Janet&rsquo;s read: it&rsquo;s probably option (a). Vendor C is
          smaller than the other three; their commercial team likely treats
          d19a-format submissions as a cost they don&rsquo;t want to absorb
          for a $40M opportunity. That&rsquo;s a fair commercial choice
          from their side, but it makes their bid mechanically uncomparable
          to the other three.
        </BodyP>

        <PitfallBox
          kind="avoided"
          title="d11 enforces non-substitution before scoring"
        >
          The lesson: <em>the d11 checklist enforces the d19a format
          requirement at the gate, not at scoring.</em> If d11 had been
          weaker — &ldquo;5 of 8 mandatory met&rdquo; instead of binary
          completeness — C&rsquo;s portfolio-pricing substitution might
          have leaked through to evaluation, where it would&rsquo;ve
          distorted the scoring. Catching it pre-scoring is what makes the
          comparison fair to the other three.
        </PitfallBox>
      </Section>

      <Section>
        <Eyebrow>Day 35 · The correction window</Eyebrow>
        <SectionTitle>C is offered 5 days; declines</SectionTitle>
        <Lead>
          Per the d09 cover note, an incomplete response gets one
          short-cycle correction window. Janet drafts the correction email
          via Sentinel, with the 6 missing items enumerated and the d19a
          template re-attached. Five business days; respond in d19a format
          or the bid is withdrawn.
        </Lead>

        <AgentSplitBox
          agent={{
            who: 'Sentinel',
            did: (
              <>
                Drafted the correction email enumerating the 6 missing
                mandatory items, re-attached the d19a workbook + d11
                checklist, set the 5-day clock, logged the incident on
                vendor C&rsquo;s submission record. Templated the email
                from <em>response-correction@v1.1</em>.
              </>
            ),
          }}
          human={{
            who: 'Janet',
            did: (
              <>
                Reviewed and sent. Asked Sentinel to escalate to vendor
                C&rsquo;s account exec on Day 38 if no response. Day 38
                comes; Vendor C&rsquo;s account exec calls Janet directly
                and declines the correction. They&rsquo;d rather withdraw.
                The pool is now three.
              </>
            ),
          }}
        />

        <BodyP>
          Janet records the C withdrawal in the canvas: <em>&ldquo;Vendor C
          withdrew on Day 38 after declining the d11 correction window.
          Reason cited: insufficient capacity to re-bid in d19a format.
          Will not be invited to BAFO.&rdquo;</em> Vendor C&rsquo;s status
          flips to <em>withdrawn</em> on the comparison view.
        </BodyP>
      </Section>

      <Section>
        <Eyebrow>Where the three live bids stand</Eyebrow>
        <SectionTitle>A, B, D — all complete, all comparable</SectionTitle>
        <Lead>
          With three complete responses in d19a format, Sentinel can run
          structured comparison. Pricing-trap detection will follow in
          Chapter 6. For now, the d11 status of each looks like this:
        </Lead>

        <SubHead>Vendor A</SubHead>
        <BodyP>
          Mature submission. 13 of 14 recommended items. Strong reference
          customers (4 hospitals, all on Epic). Generic egress disclosure —
          a &ldquo;standard egress fees apply&rdquo; clause without unit
          rates. This will be the P0 trap surfaced in Chapter 6.
        </BodyP>
        <SubHead>Vendor B</SubHead>
        <BodyP>
          Cleanest of the three on form. 14 of 14 recommended items. Three
          Epic reference customers. Pricing schedule is detailed but the
          workload count in their per-tier rollup is 200, not 280. This
          will be the P1 deviation in Chapter 6 — a fixable scope
          assumption, not a pricing trap.
        </BodyP>
        <SubHead>Vendor D</SubHead>
        <BodyP>
          11 of 14 recommended items, 8 of 8 mandatory. Pricing schedule is
          detailed and the workload count is correct (280). The
          escalator clause in their commercial commitment cell reads
          &ldquo;8% YoY&rdquo; while the d09 assumption set says
          &ldquo;protected at 4%.&rdquo; This is the P0 trap surfaced in
          Chapter 6 — they&rsquo;ll need to remove or cap the escalator in
          BAFO.
        </BodyP>
      </Section>

      <Section>
        <Eyebrow>Gate status</Eyebrow>
        <SectionTitle>Responses gate closes; rail advances to Evaluation</SectionTitle>
        <GateStatusBox
          stage="Stage 4 · Responses"
          rows={[
            {
              text: 'All invited vendors responded or withdrew (4 responded · 1 withdrew = 3 alive)',
              status: 'met',
            },
            {
              text: 'd11 completeness check run on every received response',
              status: 'met',
            },
            {
              text: 'Incomplete responses offered correction window per d09 protocol',
              status: 'met',
            },
            {
              text: 'Withdrawn-vendor record logged with reason',
              status: 'met',
            },
          ]}
        />
      </Section>

      <Section>
        <Eyebrow>What just happened</Eyebrow>
        <SectionTitle>Responses in 35 days</SectionTitle>
        <SubHead>The artifacts</SubHead>
        <BodyP>
          Four d11 completeness reports. One vendor-correction email. One
          withdrawal record. Three indexed vendor submissions ready for
          d16 scoring + d19 pricing analysis.
        </BodyP>
        <SubHead>The decision</SubHead>
        <BodyP>
          Three vendors advance to Evaluation. Vendor C is out cleanly with
          a documented reason. The three live bids look comparable on form
          but are about to diverge sharply on substance.
        </BodyP>
        <SubHead>What we don&rsquo;t know yet</SubHead>
        <BodyP>
          We don&rsquo;t know what each bid&rsquo;s true 5-year TCO is —
          d19 normalization is the Chapter 6 job. We don&rsquo;t know how
          well each vendor scores against the d16 rubric — that&rsquo;s
          Chapter 5. We can already see the shapes of the pricing traps,
          but they&rsquo;re flagged, not yet quantified.
        </BodyP>
      </Section>
    </ChapterShell>
  );
}
