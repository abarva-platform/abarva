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

export function Ch03RfpChapter() {
  return (
    <ChapterShell slug="rfp">
      <HeroBand color="navy">
        <Eyebrow light>Meridian Case Study · Chapter 03 · Stage 03 RFP</Eyebrow>
        <SectionTitle light size="xl">Day 12. Sentinel composes d09.</SectionTitle>
        <Lead light>
          The RFP package is the buyer&rsquo;s contract with the vendors:
          here&rsquo;s what we&rsquo;re asking, here&rsquo;s how
          we&rsquo;ll score, here&rsquo;s the format we want responses in.
          Sentinel composes d09 from the upstream artifacts; Janet
          shortlists the vendor pool. Day 12 ends with a four-vendor RFP in
          the mail.
        </Lead>
      </HeroBand>

      <StoryRecap>
        Stage 1 gave us a strategy memo. Stage 2 gave us a scope memo, an
        application inventory, and an assumption set. Now we have to ask
        vendors what we want. The d09 RFP package is the composed answer to
        &ldquo;what&rsquo;s the question?&rdquo; — every section of d09
        binds to an upstream artifact.
      </StoryRecap>

      <Section>
        <Eyebrow>Days 5 – 10 · Vendor shortlisting</Eyebrow>
        <SectionTitle>From the universe of cloud providers to four names</SectionTitle>
        <Lead>
          Sentinel runs a market scan against the archetype + value band +
          rigor + healthcare-vertical filter, surfaces 23 candidate vendors,
          and Janet narrows the list with Karen.
        </Lead>
        <BodyP>
          The shortlisting criteria they apply: must have a Healthcare BAA
          template; must have at least 3 hospital reference customers
          running Epic; must have $5M+ commercial revenue with at least one
          IDN of comparable size; must have a published egress framework
          (this is the criterion that will close out Vendor A in the BAFO).
          Twenty-three vendors become eight, become four.
        </BodyP>
        <BodyP>
          We&rsquo;ll call them <strong>Vendor A</strong>,{' '}
          <strong>Vendor B</strong>, <strong>Vendor C</strong>, and{' '}
          <strong>Vendor D</strong> for the rest of the case study. (In a
          real Source event the vendor names appear directly in d09 and the
          downstream pricing comparison.)
        </BodyP>
      </Section>

      <Section>
        <Eyebrow>Day 11 · d09 generation</Eyebrow>
        <SectionTitle>What &ldquo;compose d09&rdquo; actually does</SectionTitle>
        <Lead>
          d09 is the longest artifact in the lifecycle — the canonical
          template runs ~14,000 words. Janet doesn&rsquo;t write that
          herself. She clicks Generate and watches Sentinel bind upstream.
        </Lead>

        <AgentSplitBox
          agent={{
            who: 'Sentinel',
            did: (
              <>
                Bound four upstream artifacts: d01 (strategy posture +
                trigger), d05 (scope + DR boundary), d21 (assumption set),
                d04 (application inventory, attached as Appendix C).
                Composed d09 with an 8-section structure: 1 strategic
                context, 2 scope, 3 commercial terms, 4 technical
                requirements, 5 transition + DR, 6 evaluation rubric (binds
                to d16), 7 pricing template (binds to d19a), 8 response
                checklist (binds to d11). Generated 18 days&rsquo; worth of
                document in 2 minutes 14 seconds.
              </>
            ),
          }}
          human={{
            who: 'Janet',
            did: (
              <>
                Reviewed the bound-upstream chip on each section to confirm
                provenance. Edited section 5 to tighten the transition
                expectations from &ldquo;phased migration&rdquo; to a
                specific 6-month cutover with named checkpoints (this
                target turns out to be 2 months optimistic — see Chapter
                10). Added a vendor-specific Appendix D on healthcare
                regulatory compliance (HIPAA, HITECH, state-level HIE
                requirements).
              </>
            ),
          }}
        />
      </Section>

      <Section>
        <Eyebrow>The 8 questions</Eyebrow>
        <SectionTitle>What d09 actually asks vendors to answer</SectionTitle>
        <Lead>
          The technical-requirements section poses 8 specific questions.
          Vendors must answer all 8 in their response or trigger the
          d11 incompleteness check. (This is the mechanism that closes
          Vendor C out in Chapter 4.)
        </Lead>

        <ol
          style={{
            marginLeft: 24,
            lineHeight: 1.75,
            fontSize: 14,
            margin: '20px 0',
          }}
        >
          <li>
            <strong>Workload placement.</strong> For each of the 280 in-scope
            workloads, propose target tier (single-tenant, multi-tenant
            shared, multi-tenant dedicated). Identify any workloads you
            cannot host and explain why.
          </li>
          <li>
            <strong>DR architecture.</strong> Describe DR posture for the 47
            DR-IN systems including RPO / RTO commitments, failover
            architecture, and annual DR test cadence.
          </li>
          <li>
            <strong>Migration approach.</strong> Provide a 6-month cutover
            plan with named checkpoints. Identify the go/no-go criterion
            you would apply to each phase boundary.
          </li>
          <li>
            <strong>Cloverleaf strategy.</strong> Propose a migration approach
            for the Cloverleaf integration middleware. Explicitly address
            integration continuity during the cutover window.
          </li>
          <li>
            <strong>Egress + exit.</strong> Provide your egress pricing
            schedule. Describe the technical and commercial mechanics of
            exit at end of term, including data extraction and one-time
            exit fees.
          </li>
          <li>
            <strong>Commercial commitment.</strong> Provide your committed
            unit pricing for the 5-year term. State which units are subject
            to YoY escalation, what the escalator is, and what protection
            mechanisms exist.
          </li>
          <li>
            <strong>BAA + DPA.</strong> Provide your standard Business
            Associate Agreement and Data Processing Agreement templates.
            Identify any clauses where you decline standard buyer redlines.
          </li>
          <li>
            <strong>Reference customers.</strong> Identify 3 hospital
            reference customers running Epic on your platform. We will
            request a 30-minute call with each before scoring.
          </li>
        </ol>

        <BodyP>
          Question 5 (egress + exit) and question 6 (commercial commitment)
          are the two questions that surface every pricing trap in Chapter
          6. They&rsquo;re also the two questions vendors are most likely to
          answer creatively. Sentinel will read those answers carefully.
        </BodyP>
      </Section>

      <Section>
        <Eyebrow>Day 12 · Issuance</Eyebrow>
        <SectionTitle>The mail goes out</SectionTitle>
        <Lead>
          Janet locks d09. The canvas snapshots the package as a versioned
          artifact (any future edits create v2). She pulls the docx export
          and the xlsx pricing template, attaches both to a covering email,
          and sends to the four vendor account teams with a 21-day response
          window.
        </Lead>

        <ArtifactSpecimen
          code="d09"
          title="RFP package · Meridian Health Cloud · v1.0 issued (cover note)"
        >
          <p>
            <strong>Issued by:</strong> Janet Fischer, VP IT Ops, Meridian
            Health · 2026-04-13
          </p>
          <p>
            <strong>Decision sponsors:</strong> CTO Marcus Webb (decision
            sponsor) · CFO Sarah Kim (concurrence)
          </p>
          <p>
            <strong>Response window:</strong> 21 days · responses due
            2026-05-04 18:00 EST
          </p>
          <p>
            <strong>Strategic driver:</strong> Newark colocation lease
            expires Q3 2027 with rate escalation locked at 18% YoY.
            Rebuilding the CIS stack on bare-metal at a new colocation
            facility is not under consideration.
          </p>
          <p>
            <strong>Response format:</strong> Required artifacts are listed
            in the d11 response checklist (Appendix B). Pricing must be
            submitted in the d19a workbook (Appendix A) without
            substituting columns or units. Incomplete responses will be
            flagged and the vendor offered one short-cycle correction
            window.
          </p>
        </ArtifactSpecimen>
      </Section>

      <Section>
        <Eyebrow>Gate status</Eyebrow>
        <SectionTitle>RFP gate closes; rail advances</SectionTitle>
        <GateStatusBox
          stage="Stage 3 · RFP"
          rows={[
            {
              text: 'd09 RFP package authored, locked, and exported',
              status: 'met',
            },
            {
              text: 'd11 response checklist + d16 scoring rubric + d19a pricing template embedded as appendices',
              status: 'met',
            },
            {
              text: 'Vendor pool of 4 confirmed; cover note mailed; response window 21 days',
              status: 'met',
            },
            {
              text: 'BAA + DPA templates attached for vendor redline',
              status: 'met',
            },
          ]}
        />

        <PitfallBox
          kind="avoided"
          title="Pricing template attached as a non-substitutable workbook"
        >
          The d19a pricing template is a locked xlsx with named columns +
          unit definitions. The d09 cover note explicitly tells vendors not
          to substitute columns or units. This is what lets Sentinel&rsquo;s
          pricing-trap detector compare across vendors in Chapter 6 — a
          vendor that submits its own pricing schedule (as Vendor C will
          attempt) is mechanically out of compliance.
        </PitfallBox>
      </Section>

      <Section>
        <Eyebrow>What just happened</Eyebrow>
        <SectionTitle>RFP in 12 days</SectionTitle>
        <SubHead>The artifacts</SubHead>
        <BodyP>
          d09 RFP package · 14,200 words including appendices · v1.0 locked.
          d11 response checklist · 8 mandatory + 14 recommended items.
          d16 scoring rubric · 6 criteria with weights summing to 100.
          d19a pricing template · 14 line items in the locked workbook.
          Plus the BAA + DPA templates pulled from the Meridian master
          contract library.
        </BodyP>
        <SubHead>The decision</SubHead>
        <BodyP>
          Four vendors invited. 21-day response window. Issued by Janet.
          Anything that doesn&rsquo;t come back in the d19a-format workbook
          fails d11&rsquo;s mandatory-completeness check before scoring
          even starts.
        </BodyP>
        <SubHead>What we don&rsquo;t know yet</SubHead>
        <BodyP>
          We don&rsquo;t know who will respond seriously. We don&rsquo;t
          know which vendor will try to substitute their own pricing format
          (it&rsquo;ll be Vendor C). We don&rsquo;t know which vendor will
          quietly assume only 200 of the 280 workloads (Vendor B) or who
          will price an 8% YoY escalator under a heading that says
          &ldquo;protected at 4%&rdquo; (Vendor D). The next 21 days are
          quiet on our side; the responses will tell us a lot.
        </BodyP>
      </Section>
    </ChapterShell>
  );
}
