'use client';

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
import {
  ChapterShell,
  StoryRecap,
  GateStatusBox,
  PitfallBox,
  ArtifactSpecimen,
  AgentSplitBox,
} from './_shell';

export function Ch06PricingChapter() {
  return (
    <ChapterShell slug="pricing">
      <HeroBand color="navy">
        <Eyebrow light>Meridian Case Study · Chapter 06 · Stage 06 Pricing</Eyebrow>
        <SectionTitle light size="xl">Day 50. Three P0 traps surface.</SectionTitle>
        <Lead light>
          Sentinel&rsquo;s pricing-trap detector reads each vendor&rsquo;s
          d19 submission cell-by-cell against the d09 assumption set, the
          d05 scope memo, and the d21 assumption-locked workbook. The
          result: 3 P0 traps and 2 P1 deviations across three vendors.
          Vendor A&rsquo;s egress structure is the most consequential
          finding of the event — and it almost slipped through.
        </Lead>
      </HeroBand>

      <StoryRecap>
        We&rsquo;ve scored 3 finalists on the partial rubric — B at 87, A
        at 82, D at 78. All three advance with criterion 2 (commercial
        commitment) deferred. This is the chapter where commercial
        commitment gets scored, and where the vendor pricing structures
        meet Sentinel&rsquo;s trap detector. The 3 P0 traps surfaced here
        become the spine of Chapter 7&rsquo;s BAFO question pack.
      </StoryRecap>

      <Section>
        <Eyebrow>What the trap detector reads</Eyebrow>
        <SectionTitle>Pricing-trap severity model</SectionTitle>
        <Lead>
          Sentinel&rsquo;s pricing-trap detector is a deterministic
          analyzer that compares vendor d19 submissions against three
          authority sources: the d05 scope memo (what we said is in
          scope), the d21 assumption set (what we said vendors should
          assume), and the d19a workbook (the format vendors had to bid
          in). Trap severity is not opinion — it&rsquo;s rule-based.
        </Lead>
        <BodyP>
          <strong>P0 (deal-shaping)</strong> — TCO impact ≥ 15% over the
          5-year term, or a structural commitment that creates one-way
          lock-in inconsistent with d05/d21. Triggers a mandatory BAFO
          question.
        </BodyP>
        <BodyP>
          <strong>P1 (material)</strong> — TCO impact 3–15%, or assumption
          deviation that&rsquo;s mechanically fixable (vendor priced 200
          workloads, not 280; vendor priced 4-year escalator, not 5-year;
          vendor missed adding the BAA-required encryption-at-rest line).
          Triggers a recommended BAFO question.
        </BodyP>
        <BodyP>
          <strong>P2 (noted)</strong> — non-material but pattern-relevant
          (vendor didn&rsquo;t fill the optional &ldquo;preferred unit
          tier&rdquo; column; vendor offered a discount conditional on
          5-year auto-renewal). Logged for transparency; doesn&rsquo;t
          require a vendor response.
        </BodyP>

        <Callout
          kind="warn"
          icon="🪤"
          label="Severity is rule-based, not vibe-based"
        >
          Sentinel does not &ldquo;feel&rdquo; that a trap is severe. The
          severity is computed from a deterministic rule applied to the
          cell value. This is what makes the trap log defensible to the
          procurement panel — every flag has a rule citation.
        </Callout>
      </Section>

      <Section>
        <Eyebrow>Day 47–49 · The three P0 traps</Eyebrow>
        <SectionTitle>Vendor by vendor, cell by cell</SectionTitle>

        <SubHead>P0 #1 · Vendor A · Egress structure (the dramatic one)</SubHead>
        <BodyP>
          Sentinel reads cell <code>d19a-egress-tier-3</code> on Vendor
          A&rsquo;s submission. The cell contains the value{' '}
          <em>&ldquo;standard rate, see Appendix C&rdquo;</em>. Sentinel
          opens Appendix C and parses the egress schedule.
        </BodyP>

        <ArtifactSpecimen
          code="d20"
          title="Trap log entry · Vendor A · cell d19a-egress-tier-3"
        >
          <p style={{ marginBottom: 8 }}>
            <strong>Severity:</strong> P0 ·{' '}
            <strong>Rule:</strong> trap-egress-asymmetric@v1.4 ·{' '}
            <strong>Computed TCO impact:</strong> ≥ 24% over 5-yr term
          </p>
          <p style={{ marginBottom: 8 }}>
            <strong>Flag.</strong> Vendor A&rsquo;s submission references
            Appendix C for egress pricing. Appendix C contains a tiered
            schedule that prices outbound data at $0.082 / GB across all
            tiers, with no volume discount and no exit-time concession.
            Sentinel modeled the d05 expected egress profile (47 Tier-1
            DR replication + cross-tenant analytics flows + monthly Epic
            data-room exports) at ~840 TB / yr.
          </p>
          <p style={{ marginBottom: 8 }}>
            <strong>Modeled cost.</strong> Steady-state egress = $69k /
            month = $828k / yr = $4.14M over 5 years. <em>That&rsquo;s
            roughly half the run-rate of a year of compute.</em>
          </p>
          <p style={{ marginBottom: 8 }}>
            <strong>Exit-fee implication.</strong> At end of term, full
            data egress for migration to a successor vendor would clear
            $16M one-time at the same per-GB rate, applied against ~195
            TB of stable Tier-1 data and Cloverleaf state. <em>Exit fee
            is roughly 2× the annual run-rate.</em> This is the
            asymmetric-egress pattern d09 question 5 was written to
            surface.
          </p>
          <p style={{ marginBottom: 0 }}>
            <strong>BAFO question.</strong> Required. Per d22 question
            template <em>egress-symmetric-pricing@v1.2</em>.
          </p>
        </ArtifactSpecimen>

        <SubHead>P0 #2 · Vendor D · Escalator clause</SubHead>
        <BodyP>
          Sentinel reads cell{' '}
          <code>d19a-commercial-escalator-yoy</code> on Vendor D&rsquo;s
          submission. The cell contains <em>&ldquo;8.0%&rdquo;</em>. The
          d21 assumption set (issued in d09) says protected at 4%.
          Mechanical deviation; flagged automatically.
        </BodyP>

        <ArtifactSpecimen
          code="d20"
          title="Trap log entry · Vendor D · cell d19a-commercial-escalator-yoy"
        >
          <p style={{ marginBottom: 8 }}>
            <strong>Severity:</strong> P0 ·{' '}
            <strong>Rule:</strong> trap-escalator-deviation@v1.3 ·{' '}
            <strong>Computed TCO impact:</strong> +18% over 5-yr term
          </p>
          <p style={{ marginBottom: 8 }}>
            <strong>Flag.</strong> Vendor D priced an 8% YoY escalator
            against the d21-stated 4% protected escalator. Year-1 unit
            pricing is competitive ($9.6M), but compounded escalation
            yields a year-5 run-rate of $13.1M vs the protected-4%
            run-rate of $11.2M.
          </p>
          <p style={{ marginBottom: 8 }}>
            <strong>5-year TCO.</strong> 8% escalator → $54.2M committed
            · 4% escalator → $51.0M committed · gap = $3.2M.
          </p>
          <p style={{ marginBottom: 0 }}>
            <strong>BAFO question.</strong> Required. Per d22 template{' '}
            <em>escalator-cap-confirmation@v1.1</em>. Question asks D to
            either accept 4% as a hard cap or withdraw.
          </p>
        </ArtifactSpecimen>

        <SubHead>P0 #3 · Vendor A · Exclusivity clause</SubHead>
        <BodyP>
          Sentinel reads vendor A&rsquo;s commercial section, paragraph
          7.4: <em>&ldquo;During the initial term and any renewal, Buyer
          shall not procure equivalent infrastructure services from any
          third party.&rdquo;</em> Term length is 5 years initial + 2
          years renewal = 7 years effective.
        </BodyP>

        <ArtifactSpecimen
          code="d20"
          title="Trap log entry · Vendor A · §7.4 exclusivity clause"
        >
          <p style={{ marginBottom: 8 }}>
            <strong>Severity:</strong> P0 ·{' '}
            <strong>Rule:</strong> trap-exclusivity-multi-year@v1.2 ·{' '}
            <strong>Computed TCO impact:</strong> structural · denies exit
          </p>
          <p style={{ marginBottom: 8 }}>
            <strong>Flag.</strong> A 7-year exclusivity clause is
            inconsistent with the d01 strategic posture clause
            (&ldquo;maintain optionality on workload placement&rdquo;) and
            denies the d09 question 5 exit posture entirely. Combined
            with the P0 #1 egress structure, this would lock the buyer
            into Vendor A for 7 years with a 2× annual run-rate exit fee
            at the end.
          </p>
          <p style={{ marginBottom: 0 }}>
            <strong>BAFO question.</strong> Required. Per d22 template{' '}
            <em>lock-in-removal@v1.5</em>. Question asks A to remove or
            cap the exclusivity to 12 months. <strong>This is the
            question A will refuse in Chapter 7.</strong>
          </p>
        </ArtifactSpecimen>
      </Section>

      <Section>
        <Eyebrow>The two P1 deviations</Eyebrow>
        <SectionTitle>Mechanical fixes, not deal-shapers</SectionTitle>

        <SubHead>P1 · Vendor B · 200 workloads, not 280</SubHead>
        <BodyP>
          Sentinel reads B&rsquo;s d19a workload-by-tier rollup; the
          unit-count summed across the rollup is 203, not 280. The
          d09/d05 in-scope count is 280. Sentinel flags as P1 — this is
          either a scope misread or a deliberate underbid. B&rsquo;s
          rollup priced unit cost is competitive enough that the
          corrected total stays below D&rsquo;s.
        </BodyP>

        <AgentSplitBox
          agent={{
            who: 'Sentinel',
            did: (
              <>
                Computed the unit-count delta (203 vs 280 = 77 missing).
                Modeled the corrected commitment by applying B&rsquo;s
                weighted-average unit cost to the missing 77 workloads.
                Modeled correction range $1.4M–$1.9M / yr depending on
                tier mix of the missing 77.
              </>
            ),
          }}
          human={{
            who: 'Janet',
            did: (
              <>
                Read Sentinel&rsquo;s analysis and concluded this is a
                scope-read deviation, not a sneaky underbid (B&rsquo;s
                unit pricing is detailed enough that hiding 77 workloads
                wouldn&rsquo;t scale gracefully). Decided the BAFO
                question should ask B to confirm the corrected total at
                their stated unit pricing.
              </>
            ),
          }}
        />

        <SubHead>P1 · Vendor A · Encryption-at-rest line missing</SubHead>
        <BodyP>
          Vendor A&rsquo;s d19a submission omits the BAA-required
          encryption-at-rest line item ($120k / yr in their published
          public-sector schedule). Sentinel flags as P1 — mechanically
          fixable, but adds $600k over 5-yr if A added it back. Janet
          adds it to A&rsquo;s BAFO question pack (alongside the two
          P0s).
        </BodyP>
      </Section>

      <Section>
        <Eyebrow>Day 50 · The trap log</Eyebrow>
        <SectionTitle>d20 ready for BAFO authoring</SectionTitle>
        <Lead>
          With the cell-by-cell pass complete, Sentinel composes the
          consolidated d20 trap log. This is the artifact that
          Chapter 7 binds against to author the d22 BAFO question pack.
        </Lead>

        <ArtifactSpecimen
          code="d20"
          title="Pricing trap log · Day 50 · summary"
        >
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ textAlign: 'left', borderBottom: '1px solid #D1D5DB' }}>
                <th style={{ padding: '6px 8px' }}>#</th>
                <th style={{ padding: '6px 8px' }}>Vendor</th>
                <th style={{ padding: '6px 8px' }}>Trap</th>
                <th style={{ padding: '6px 8px' }}>Sev</th>
                <th style={{ padding: '6px 8px' }}>TCO impact</th>
              </tr>
            </thead>
            <tbody>
              <tr style={{ borderBottom: '1px solid #E5E7EB' }}>
                <td style={{ padding: '6px 8px' }}>1</td>
                <td style={{ padding: '6px 8px' }}>A</td>
                <td style={{ padding: '6px 8px' }}>Asymmetric egress · exit fee 2× run-rate</td>
                <td style={{ padding: '6px 8px', color: T.amber, fontWeight: 700 }}>P0</td>
                <td style={{ padding: '6px 8px' }}>+24% (5-yr)</td>
              </tr>
              <tr style={{ borderBottom: '1px solid #E5E7EB' }}>
                <td style={{ padding: '6px 8px' }}>2</td>
                <td style={{ padding: '6px 8px' }}>D</td>
                <td style={{ padding: '6px 8px' }}>Escalator 8% vs assumption 4%</td>
                <td style={{ padding: '6px 8px', color: T.amber, fontWeight: 700 }}>P0</td>
                <td style={{ padding: '6px 8px' }}>+18% (5-yr)</td>
              </tr>
              <tr style={{ borderBottom: '1px solid #E5E7EB' }}>
                <td style={{ padding: '6px 8px' }}>3</td>
                <td style={{ padding: '6px 8px' }}>A</td>
                <td style={{ padding: '6px 8px' }}>7-year exclusivity clause §7.4</td>
                <td style={{ padding: '6px 8px', color: T.amber, fontWeight: 700 }}>P0</td>
                <td style={{ padding: '6px 8px' }}>structural</td>
              </tr>
              <tr style={{ borderBottom: '1px solid #E5E7EB' }}>
                <td style={{ padding: '6px 8px' }}>4</td>
                <td style={{ padding: '6px 8px' }}>B</td>
                <td style={{ padding: '6px 8px' }}>Workload count 203 vs scope 280</td>
                <td style={{ padding: '6px 8px', color: T.faint, fontWeight: 700 }}>P1</td>
                <td style={{ padding: '6px 8px' }}>+15% (correctable)</td>
              </tr>
              <tr>
                <td style={{ padding: '6px 8px' }}>5</td>
                <td style={{ padding: '6px 8px' }}>A</td>
                <td style={{ padding: '6px 8px' }}>BAA encryption-at-rest line missing</td>
                <td style={{ padding: '6px 8px', color: T.faint, fontWeight: 700 }}>P1</td>
                <td style={{ padding: '6px 8px' }}>+$600k (5-yr)</td>
              </tr>
            </tbody>
          </table>
        </ArtifactSpecimen>

        <BodyP>
          Five trap entries → 12 BAFO questions in Chapter 7. Vendor A
          gets 7 (3 P0s + 1 P1 + 3 follow-on questions on commitment
          structure); Vendor B gets 5 (1 P1 + 4 follow-on questions on
          DR architecture and migration assumptions); Vendor D gets 7
          (1 P0 + 6 follow-on questions on escalator mechanics, lock-in,
          and transition).
        </BodyP>
      </Section>

      <Section>
        <Eyebrow>Now we know who&rsquo;s winning</Eyebrow>
        <SectionTitle>The combined score</SectionTitle>
        <Lead>
          With the d19 normalized pricing scores added back to the
          partial rubric, the picture sharpens.
        </Lead>

        <ArtifactSpecimen
          code="d16"
          title="Combined scoring · Day 50 · pre-BAFO"
        >
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ textAlign: 'left', borderBottom: '1px solid #D1D5DB' }}>
                <th style={{ padding: '6px 8px' }}>Vendor</th>
                <th style={{ padding: '6px 8px' }}>Partial rubric (75)</th>
                <th style={{ padding: '6px 8px' }}>Crit 2 (25)</th>
                <th style={{ padding: '6px 8px' }}>Total (100)</th>
                <th style={{ padding: '6px 8px' }}>Open P0s</th>
              </tr>
            </thead>
            <tbody>
              <tr style={{ borderBottom: '1px solid #E5E7EB' }}>
                <td style={{ padding: '6px 8px' }}>B</td>
                <td style={{ padding: '6px 8px' }}>65</td>
                <td style={{ padding: '6px 8px' }}>22</td>
                <td style={{ padding: '6px 8px', fontWeight: 700, color: T.teal }}>87</td>
                <td style={{ padding: '6px 8px' }}>0</td>
              </tr>
              <tr style={{ borderBottom: '1px solid #E5E7EB' }}>
                <td style={{ padding: '6px 8px' }}>A</td>
                <td style={{ padding: '6px 8px' }}>62</td>
                <td style={{ padding: '6px 8px' }}>14</td>
                <td style={{ padding: '6px 8px' }}>76</td>
                <td style={{ padding: '6px 8px', color: T.amber, fontWeight: 700 }}>2</td>
              </tr>
              <tr>
                <td style={{ padding: '6px 8px' }}>D</td>
                <td style={{ padding: '6px 8px' }}>59</td>
                <td style={{ padding: '6px 8px' }}>16</td>
                <td style={{ padding: '6px 8px' }}>75</td>
                <td style={{ padding: '6px 8px', color: T.amber, fontWeight: 700 }}>1</td>
              </tr>
            </tbody>
          </table>
        </ArtifactSpecimen>

        <BodyP>
          Vendor A&rsquo;s total drops from 82 → 76 because criterion 2
          (commercial commitment, 25 weight) is heavily penalized for the
          asymmetric egress + exclusivity combination. Vendor D drops
          from 78 → 75 for the escalator deviation. Vendor B&rsquo;s
          partial 87 stays at 87 because the workload-count P1 is
          correctable and doesn&rsquo;t hit criterion 2 the same way a
          structural lock-in does.
        </BodyP>
      </Section>

      <Section>
        <Eyebrow>Gate status</Eyebrow>
        <SectionTitle>Stage 6 closes; rail advances to BAFO</SectionTitle>
        <GateStatusBox
          stage="Stage 6 · Pricing"
          rows={[
            {
              text: 'd19 normalization complete; per-vendor 5-year TCO modeled',
              status: 'met',
            },
            {
              text: 'd20 trap log composed; every flag carries a rule citation + cell coordinate',
              status: 'met',
            },
            {
              text: 'Criterion 2 scored; combined d16 totals updated',
              status: 'met',
            },
            {
              text: 'BAFO question pack scaffolded from d20; ready for Chapter 7',
              status: 'met',
            },
          ]}
        />

        <PitfallBox
          kind="avoided"
          title="Reading Vendor A&rsquo;s egress structure cell-by-cell, not summary-by-summary"
        >
          The most common pricing pitfall is comparing vendor headline
          numbers (5-year committed run-rate). Vendor A&rsquo;s headline
          is competitive — they&rsquo;re actually tied with D in year 1.
          The egress structure is buried in Appendix C, and every prose
          summary the vendor wrote about it uses the phrase
          &ldquo;market standard.&rdquo; The trap detector found it
          because it reads cells, not narratives.
        </PitfallBox>
      </Section>

      <Section>
        <Eyebrow>What just happened</Eyebrow>
        <SectionTitle>Pricing in 8 days</SectionTitle>
        <SubHead>The artifacts</SubHead>
        <BodyP>
          d19 normalized pricing comparison · 14 line items × 3 vendors ·
          5-year TCO bands. d20 trap log · 5 entries (3 P0 + 2 P1) with
          rule citations and cell coordinates. d16 updated with
          criterion-2 scores.
        </BodyP>
        <SubHead>The decision</SubHead>
        <BodyP>
          Vendor B at 87 leads going into BAFO. Vendor A at 76 has 2 open
          P0s — exit will depend on whether they&rsquo;ll fix them.
          Vendor D at 75 has 1 open P0 — exit will depend on whether
          they&rsquo;ll cap the escalator. The pool stays at 3, but the
          BAFO is genuinely consequential.
        </BodyP>
        <SubHead>What we don&rsquo;t know yet</SubHead>
        <BodyP>
          We don&rsquo;t know which P0s vendors will close. Vendor A is
          most at risk — refusing the exclusivity clause would be a
          deal-killer. Vendor D&rsquo;s escalator is fixable but might
          require a price increase elsewhere. Vendor B&rsquo;s P1 is
          mechanical. The next 15 days will tell us a lot.
        </BodyP>
      </Section>
    </ChapterShell>
  );
}
