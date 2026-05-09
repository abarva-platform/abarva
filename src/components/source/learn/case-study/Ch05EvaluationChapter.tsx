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
} from '@/components/home/learn/primitives';
import {
  ChapterShell,
  StoryRecap,
  GateStatusBox,
  PitfallBox,
  ArtifactSpecimen,
  AgentSplitBox,
} from './_shell';

export function Ch05EvaluationChapter() {
  return (
    <ChapterShell slug="evaluation">
      <HeroBand color="navy">
        <Eyebrow light>Meridian Case Study · Chapter 05 · Stage 05 Evaluation</Eyebrow>
        <SectionTitle light size="xl">Day 42. Blind scoring. B leads.</SectionTitle>
        <Lead light>
          Three vendors, six criteria, four scorers, one rubric. Sentinel
          assembles the d16 rubric from d09; Janet runs blind scoring with
          Karen, two architecture leads, and an external clinical-systems
          advisor. Vendor B comes out at 87, Vendor A at 82, Vendor D at
          78. All three advance — pricing decides who wins.
        </Lead>
      </HeroBand>

      <StoryRecap>
        Three live bids made it through the d11 completeness gate. Now we
        have to score them against the rubric vendors saw at issuance — the
        d16 rubric in d09 Section 6. The job of this chapter is to
        determine fit + technical capability + commercial credibility
        before pricing nuance is introduced. Pricing is Chapter 6&rsquo;s
        problem; Chapter 5 is about merit before money.
      </StoryRecap>

      <Section>
        <Eyebrow>The d16 rubric</Eyebrow>
        <SectionTitle>Six criteria, weights summing to 100</SectionTitle>
        <Lead>
          d16 was issued with d09 — vendors knew the criteria and weights
          before they bid. The rubric defaults Sentinel produces from
          archetype + value band + rigor are visible in d16; Janet and
          Karen reviewed and approved them at issuance.
        </Lead>

        <ArtifactSpecimen
          code="d16"
          title="Scoring rubric · Meridian Health Cloud (issued with d09)"
        >
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ textAlign: 'left', borderBottom: '1px solid #D1D5DB' }}>
                <th style={{ padding: '6px 8px' }}>#</th>
                <th style={{ padding: '6px 8px' }}>Criterion</th>
                <th style={{ padding: '6px 8px' }}>Weight</th>
                <th style={{ padding: '6px 8px' }}>How scored</th>
              </tr>
            </thead>
            <tbody>
              <tr style={{ borderBottom: '1px solid #E5E7EB' }}>
                <td style={{ padding: '6px 8px' }}>1</td>
                <td style={{ padding: '6px 8px' }}>Technical fit (workload placement, DR, integration plan)</td>
                <td style={{ padding: '6px 8px' }}>25</td>
                <td style={{ padding: '6px 8px' }}>Architecture review · 4 scorers</td>
              </tr>
              <tr style={{ borderBottom: '1px solid #E5E7EB' }}>
                <td style={{ padding: '6px 8px' }}>2</td>
                <td style={{ padding: '6px 8px' }}>Commercial commitment (pricing detail, escalator, exit)</td>
                <td style={{ padding: '6px 8px' }}>25</td>
                <td style={{ padding: '6px 8px' }}>d19 normalization (Ch.06)</td>
              </tr>
              <tr style={{ borderBottom: '1px solid #E5E7EB' }}>
                <td style={{ padding: '6px 8px' }}>3</td>
                <td style={{ padding: '6px 8px' }}>Healthcare-specific capability</td>
                <td style={{ padding: '6px 8px' }}>15</td>
                <td style={{ padding: '6px 8px' }}>References + clinical advisor</td>
              </tr>
              <tr style={{ borderBottom: '1px solid #E5E7EB' }}>
                <td style={{ padding: '6px 8px' }}>4</td>
                <td style={{ padding: '6px 8px' }}>Migration approach + risk</td>
                <td style={{ padding: '6px 8px' }}>15</td>
                <td style={{ padding: '6px 8px' }}>Architecture review</td>
              </tr>
              <tr style={{ borderBottom: '1px solid #E5E7EB' }}>
                <td style={{ padding: '6px 8px' }}>5</td>
                <td style={{ padding: '6px 8px' }}>Operational maturity (BCP, runbooks, change mgmt)</td>
                <td style={{ padding: '6px 8px' }}>10</td>
                <td style={{ padding: '6px 8px' }}>References + ops review</td>
              </tr>
              <tr>
                <td style={{ padding: '6px 8px' }}>6</td>
                <td style={{ padding: '6px 8px' }}>Account governance (escalation, success metrics)</td>
                <td style={{ padding: '6px 8px' }}>10</td>
                <td style={{ padding: '6px 8px' }}>Account team interview</td>
              </tr>
            </tbody>
          </table>
        </ArtifactSpecimen>

        <Callout
          kind="info"
          icon="🪪"
          label="Pricing is its own criterion, scored later"
        >
          Criterion 2 (commercial commitment, weight 25) is intentionally
          held out of Chapter 5 evaluation — it gets its score from the
          d19 normalized comparison in Chapter 6. This is the discipline
          that prevents pricing from drowning out technical fit during
          blind scoring. Scorers in Chapter 5 see prose answers to the
          commercial-commitment question; they don&rsquo;t see total
          numbers.
        </Callout>
      </Section>

      <Section>
        <Eyebrow>Day 38–41 · Blind reviews</Eyebrow>
        <SectionTitle>How four scorers worked through 1,800 pages</SectionTitle>
        <Lead>
          The four scorers Janet picked: Karen Liu (CIO), Karen&rsquo;s two
          principal architects (one on the Epic side, one on the
          infrastructure side), and an external clinical-systems advisor
          contracted for this event. Each scorer received the three
          response packets with vendor names redacted to{' '}
          <em>Vendor A / B / D</em> labels, plus the d16 rubric.
        </Lead>

        <AgentSplitBox
          agent={{
            who: 'Sentinel',
            did: (
              <>
                Redacted vendor identifiers from each response (logo, name,
                product brand, customer references, account team emails).
                Routed each redacted packet + d16 to the four scorers.
                Logged each scorer&rsquo;s score with a per-criterion
                annotation. Computed inter-scorer variance per criterion
                and flagged criteria where variance exceeded threshold.
              </>
            ),
          }}
          human={{
            who: 'Janet',
            did: (
              <>
                Set the redaction rules. Reviewed Sentinel&rsquo;s
                inter-scorer variance flags — found two on Vendor D
                (criteria 4 and 5) where the clinical advisor and the Epic
                architect disagreed. Convened a 30-minute calibration call
                between them. Re-scored those two cells with their
                consensus rationale logged.
              </>
            ),
          }}
        />
      </Section>

      <Section>
        <Eyebrow>Day 42 · The score</Eyebrow>
        <SectionTitle>87 / 82 / 78</SectionTitle>
        <Lead>
          With criterion 2 (commercial commitment) deferred, the
          Chapter-5 scoring runs across criteria 1, 3, 4, 5, 6 — total
          weight 75. Sentinel normalizes the partial score to a 100-point
          basis for legibility.
        </Lead>

        <ArtifactSpecimen
          code="d16"
          title="Scoring summary · Day 42 · pre-pricing normalized"
        >
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ textAlign: 'left', borderBottom: '1px solid #D1D5DB' }}>
                <th style={{ padding: '6px 8px' }}>Criterion</th>
                <th style={{ padding: '6px 8px' }}>Wt</th>
                <th style={{ padding: '6px 8px' }}>Vendor A</th>
                <th style={{ padding: '6px 8px' }}>Vendor B</th>
                <th style={{ padding: '6px 8px' }}>Vendor D</th>
              </tr>
            </thead>
            <tbody>
              <tr style={{ borderBottom: '1px solid #E5E7EB' }}>
                <td style={{ padding: '6px 8px' }}>1 · Technical fit</td>
                <td style={{ padding: '6px 8px' }}>25</td>
                <td style={{ padding: '6px 8px' }}>21</td>
                <td style={{ padding: '6px 8px' }}>23</td>
                <td style={{ padding: '6px 8px' }}>20</td>
              </tr>
              <tr style={{ borderBottom: '1px solid #E5E7EB' }}>
                <td style={{ padding: '6px 8px' }}>3 · Healthcare capability</td>
                <td style={{ padding: '6px 8px' }}>15</td>
                <td style={{ padding: '6px 8px' }}>14</td>
                <td style={{ padding: '6px 8px' }}>13</td>
                <td style={{ padding: '6px 8px' }}>11</td>
              </tr>
              <tr style={{ borderBottom: '1px solid #E5E7EB' }}>
                <td style={{ padding: '6px 8px' }}>4 · Migration approach + risk</td>
                <td style={{ padding: '6px 8px' }}>15</td>
                <td style={{ padding: '6px 8px' }}>11</td>
                <td style={{ padding: '6px 8px' }}>13</td>
                <td style={{ padding: '6px 8px' }}>11</td>
              </tr>
              <tr style={{ borderBottom: '1px solid #E5E7EB' }}>
                <td style={{ padding: '6px 8px' }}>5 · Operational maturity</td>
                <td style={{ padding: '6px 8px' }}>10</td>
                <td style={{ padding: '6px 8px' }}>8</td>
                <td style={{ padding: '6px 8px' }}>9</td>
                <td style={{ padding: '6px 8px' }}>8</td>
              </tr>
              <tr style={{ borderBottom: '1px solid #E5E7EB' }}>
                <td style={{ padding: '6px 8px' }}>6 · Account governance</td>
                <td style={{ padding: '6px 8px' }}>10</td>
                <td style={{ padding: '6px 8px' }}>8</td>
                <td style={{ padding: '6px 8px' }}>7</td>
                <td style={{ padding: '6px 8px' }}>9</td>
              </tr>
              <tr style={{ borderBottom: '1px solid #D1D5DB', fontWeight: 700 }}>
                <td style={{ padding: '8px' }}>Sum (raw, of 75)</td>
                <td style={{ padding: '8px' }}>75</td>
                <td style={{ padding: '8px' }}>62</td>
                <td style={{ padding: '8px' }}>65</td>
                <td style={{ padding: '8px' }}>59</td>
              </tr>
              <tr style={{ fontWeight: 700, color: '#1B2B5C' }}>
                <td style={{ padding: '8px' }}>Normalized to 100</td>
                <td style={{ padding: '8px' }}>—</td>
                <td style={{ padding: '8px' }}>82</td>
                <td style={{ padding: '8px' }}>87</td>
                <td style={{ padding: '8px' }}>78</td>
              </tr>
            </tbody>
          </table>
        </ArtifactSpecimen>

        <BodyP>
          Vendor B leads on technical fit (23 / 25) and migration approach
          (13 / 15). Vendor A leads on healthcare capability (14 / 15) and
          account governance (8 / 10) — they have four hospital references
          on Epic; the others have three. Vendor D trails on healthcare
          capability (11) and migration approach (11), which is the
          combination that makes them the third-place finisher rather than
          the second.
        </BodyP>
      </Section>

      <Section>
        <Eyebrow>The advance decision</Eyebrow>
        <SectionTitle>All three move to Pricing</SectionTitle>
        <Lead>
          The threshold rule Janet committed to at gate-open: any vendor
          scoring 75 or higher on the partial rubric advances to pricing
          analysis. All three are above the line. They all advance.
        </Lead>
        <BodyP>
          This is a discipline call. The temptation in a 3-vendor pool is
          to cut to two finalists pre-pricing and save reviewer cycles.
          Janet&rsquo;s view: pricing analysis is exactly where surprises
          live, and seeing all three vendors&rsquo; pricing details is
          worth the extra cycles. (She&rsquo;s right — the Vendor A egress
          trap that surfaces in Chapter 6 is the single most consequential
          finding of the event, and we wouldn&rsquo;t have surfaced it if
          we&rsquo;d cut Vendor A on the partial score.)
        </BodyP>

        <PitfallBox
          kind="avoided"
          title="Don&rsquo;t cut to two finalists pre-pricing in a 3-vendor pool"
        >
          The pitfall is treating the partial-rubric score as final and
          dropping the lowest scorer to save analyst cycles. Pricing
          analysis routinely re-orders rankings; a vendor in third on
          technical fit can win on TCO + exit posture. Hold the pool open
          through pricing in any 3-vendor situation.
        </PitfallBox>
      </Section>

      <Section>
        <Eyebrow>Gate status</Eyebrow>
        <SectionTitle>Stage 5 closes; rail advances to Pricing</SectionTitle>
        <GateStatusBox
          stage="Stage 5 · Evaluation"
          rows={[
            {
              text: 'd16 rubric run blind across all live vendor responses',
              status: 'met',
            },
            {
              text: 'Inter-scorer variance reviewed and reconciled where flagged',
              status: 'met',
            },
            {
              text: 'Partial-rubric scores documented with per-criterion rationale',
              status: 'met',
            },
            {
              text: 'Advancement threshold (≥ 75 partial) decided pre-scoring; applied uniformly',
              status: 'met',
            },
          ]}
        />
      </Section>

      <Section>
        <Eyebrow>What just happened</Eyebrow>
        <SectionTitle>Evaluation in 7 days</SectionTitle>
        <SubHead>The artifacts</SubHead>
        <BodyP>
          One d16 partial-rubric scoring summary with per-criterion
          breakdown. Four scorer rationale logs. One inter-scorer
          calibration record on the two reconciled cells.
        </BodyP>
        <SubHead>The decision</SubHead>
        <BodyP>
          Three vendors advance to Pricing. B is in the lead at 87 / 82 /
          78. The gap between them is small enough that pricing nuance can
          re-order them — exactly the point of holding criterion 2 for
          Chapter 6.
        </BodyP>
        <SubHead>What we don&rsquo;t know yet</SubHead>
        <BodyP>
          We don&rsquo;t know what each vendor&rsquo;s normalized 5-year
          TCO is. We don&rsquo;t know what assumption deviations are baked
          into their pricing schedules. We don&rsquo;t know which vendor
          will close out on a P0 trap they refuse to fix in BAFO. The next
          chapter is where the real shape of the deal emerges.
        </BodyP>
      </Section>
    </ChapterShell>
  );
}
