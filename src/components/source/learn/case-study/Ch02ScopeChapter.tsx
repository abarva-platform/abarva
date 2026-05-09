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

export function Ch02ScopeChapter() {
  return (
    <ChapterShell slug="scope">
      <HeroBand color="navy">
        <Eyebrow light>Meridian Case Study · Chapter 02 · Stage 02 Scope</Eyebrow>
        <SectionTitle light size="xl">Day 4. The 280-workload boundary.</SectionTitle>
        <Lead light>
          Karen Liu and Janet Fischer spend three working days enumerating
          what&rsquo;s in and what&rsquo;s out. The d05 scope memo is what
          vendors will price and Sentinel will trap-detect against. Get this
          right and the next eight chapters fall into shape; under-enumerate
          one system and you&rsquo;re paying for the surprise in Chapter 10.
        </Lead>
      </HeroBand>

      <StoryRecap>
        Strategy closed yesterday. Marcus has signed off on cloud, the value
        band, and the trigger. Now Karen Liu (CIO, day-to-day owner) and
        Janet Fischer (procurement lead) need to draw the boundary. d05 has
        to be the answer to one question: when a vendor reads d09 in two
        weeks, will they know exactly what they&rsquo;re bidding on?
      </StoryRecap>

      <Section>
        <Eyebrow>The boundary problem</Eyebrow>
        <SectionTitle>What &ldquo;in scope&rdquo; means in a CIS environment</SectionTitle>
        <Lead>
          Hospital infrastructure is genuinely hard to scope because every
          system talks to every other system through the integration engine.
          Move Epic and you have to think about MyChart. Move MyChart and you
          have to think about ServiceNow ticketing. Move ServiceNow and you
          have to think about Cloverleaf. The graph is dense and the lines
          are not bright.
        </Lead>
        <BodyP>
          Karen&rsquo;s first instinct is to draw the boundary at the
          application layer: Epic CIS in, MyChart in, ServiceNow ITSM in,
          in-house apps in. Cloverleaf in, &ldquo;and its integrations,&rdquo;
          which is a phrase Janet underlines in red. The integration count
          matters and they don&rsquo;t have it yet.
        </BodyP>
      </Section>

      <Section>
        <Eyebrow>Day 2 · Discovery</Eyebrow>
        <SectionTitle>Karen pulls the app inventory; Sentinel populates d04</SectionTitle>
        <Lead>
          The d04 application inventory is a tier-classified list of every
          app that talks to the colo. Karen&rsquo;s team had a stale CMDB
          export from last year; she pulls the current one, drops it into
          Sentinel, and asks for d04 generation.
        </Lead>

        <AgentSplitBox
          agent={{
            who: 'Sentinel',
            did: (
              <>
                Parsed the CMDB export, joined it against the ServiceNow
                criticality classification, produced 247 inventory rows
                across 4 tiers (Tier-1 / Tier-2 / Tier-3 / sandbox), flagged
                33 rows where criticality and outage history disagreed (e.g.
                a system marked Tier-3 with three Sev-1 incidents in 18
                months).
              </>
            ),
            // intentional: agent.who Sentinel
          }}
          human={{
            who: 'Karen',
            did: (
              <>
                Walked the 33 disagreement rows with her ops leads. Promoted
                12 to Tier-1, demoted 4 to Tier-3 with documented rationale,
                left 17 unchanged. Decided that the 47 systems that actually
                belong in DR-IN are the ones with both Tier-1 + an SLA &gt;=
                99.95%.
              </>
            ),
          }}
        />

        <BodyP>
          The 47-system DR boundary is now a decision, not a feeling. It will
          show up in d09 as a hard line: <em>vendors must include DR for the
          47 enumerated Tier-1 systems; DR for Tier-2 is explicitly out of
          this RFP and will be a follow-on event in 2027.</em> A vendor that
          tries to upsell DR for everything is not reading the scope.
        </BodyP>
      </Section>

      <Section>
        <Eyebrow>Day 3 · The Cloverleaf question</Eyebrow>
        <SectionTitle>Where this scope memo will fail us</SectionTitle>
        <Lead>
          Janet asks Karen the question she&rsquo;s been circling: how many
          integrations does Cloverleaf actually run? Karen says &ldquo;a
          couple dozen,&rdquo; pulls up the Cloverleaf admin console, and
          counts 47.
        </Lead>
        <BodyP>
          They both look at the number. Forty-seven custom HL7 / FHIR /
          flat-file feeds connecting Epic to ambulatory practices, lab
          systems, the state immunization registry, the radiology PACS, and
          a handful of vendor-specific pharmacy interfaces. Some are
          maintained; some haven&rsquo;t been touched since 2019. The
          decision they make now: list Cloverleaf as <em>one in-scope
          system</em> and trust the vendors to discover the integrations
          during their own assessment.
        </BodyP>
        <Callout
          kind="warn"
          icon="⚠️"
          label="The decision they made — and shouldn&rsquo;t have"
        >
          Listing Cloverleaf as one system, not 1 + 47 integrations, is the
          decision that costs us 2 months in Chapter 10. The vendors will
          bid based on &ldquo;one middleware system&rdquo; and discover the
          integration complexity when they get into migration planning. The
          lesson, surfaced in Chapter 10: the d05 scope memo should
          enumerate <em>integration count</em>, not just <em>system
          count</em>, for any middleware in scope.
        </Callout>
      </Section>

      <Section>
        <Eyebrow>Day 4 · d05 lands</Eyebrow>
        <SectionTitle>The scope memo Sentinel composed</SectionTitle>
        <Lead>
          With d04 stabilized and the DR boundary decided, Sentinel composes
          d05 in eight minutes. Karen and Janet review it together.
        </Lead>

        <ArtifactSpecimen
          code="d05"
          title="Scope memo · Meridian Health Cloud (excerpt)"
        >
          <p>
            <strong>In-scope systems (count: 280).</strong>
          </p>
          <ul style={{ marginLeft: 18, marginTop: 4, lineHeight: 1.6 }}>
            <li>Epic CIS (clinical record) · Tier-1 · DR required</li>
            <li>MyChart (patient portal) · Tier-1 · DR required</li>
            <li>Cloverleaf integration middleware · Tier-1 · DR required</li>
            <li>ServiceNow ITSM · Tier-2 · DR optional</li>
            <li>In-house applications (~180 systems) · Tier-2/3 mix</li>
            <li>Active Directory + ADFS · Tier-1 · DR required</li>
            <li>Imprivata SSO · Tier-1 · DR required</li>
          </ul>
          <p>
            <strong>Out of scope (explicit).</strong>
          </p>
          <ul style={{ marginLeft: 18, marginTop: 4, lineHeight: 1.6 }}>
            <li>Epic Clarity / Caboodle (analytics warehouse) · separate program</li>
            <li>DR for Tier-2 systems · follow-on event 2027</li>
            <li>End-user device fleet · separate refresh cycle</li>
          </ul>
          <p>
            <strong>DR boundary.</strong> 47 Tier-1 systems with SLA &gt;=
            99.95% require active DR with RPO &lt;= 4 hours and RTO &lt;= 8
            hours. Full enumeration in d04.
          </p>
          <p>
            <strong>Assumptions.</strong> Workload growth flat over the 5-year
            term. Cloverleaf maintained as-is. End-of-life Tier-3 systems
            decommissioned in flight. Epic version Hyperdrive-compatible by
            cutover.
          </p>
        </ArtifactSpecimen>

        <BodyP>
          The assumptions block at the bottom is what binds into d21 (the
          assumption set) and ultimately into d19a (the pricing template).
          Vendors will see &ldquo;workload growth flat&rdquo; in the
          assumptions, and any vendor that prices in growth assumptions will
          show up in Chapter 6 as a P1 deviation.
        </BodyP>
      </Section>

      <Section>
        <Eyebrow>Gate status</Eyebrow>
        <SectionTitle>Stage 2 closes; rail advances</SectionTitle>
        <GateStatusBox
          stage="Stage 2 · Scope"
          rows={[
            {
              text: 'd04 application inventory authored, all rows tier-classified',
              status: 'met',
            },
            {
              text: 'd05 scope memo authored with explicit in/out boundaries + DR boundary',
              status: 'met',
            },
            {
              text: 'd21 assumption set drafted (workload growth, Cloverleaf maintained, EOL plan)',
              status: 'met',
            },
            {
              text: 'Cloverleaf integration count enumerated in scope memo',
              status: 'unmet',
            },
          ]}
        />

        <BodyP>
          The fourth criterion is unmet but not gate-blocking — it&rsquo;s a
          recommended criterion in standard rigor, not required. Janet
          self-approves the gate after a 10-minute call with Karen. The
          Maestro audit log will show this exception language: <em>&ldquo;Stage
          2 promoted with Cloverleaf integration enumeration deferred to
          vendor discovery; rationale: integration count not maintained in
          CMDB; vendors expected to assess during migration planning.&rdquo;</em>
        </BodyP>

        <PitfallBox
          kind="missed"
          title="Cloverleaf integration count not enumerated"
        >
          The decision to list Cloverleaf as one system rather than 1 + 47
          integrations sets up the Chapter 10 slip. The mitigation
          would&rsquo;ve been to either enumerate the integrations directly
          in d05 or write the BAFO question in advance: <em>&ldquo;Confirm
          your migration plan addresses the 47 Cloverleaf integrations
          enumerated in Appendix C.&rdquo;</em> Future events should treat
          middleware integration count as a required scope-memo field.
        </PitfallBox>
      </Section>

      <Section>
        <Eyebrow>What just happened</Eyebrow>
        <SectionTitle>Scope in 4 days</SectionTitle>
        <SubHead>The artifacts</SubHead>
        <BodyP>
          d04 application inventory · 247 rows · 4 tiers · DR-IN flag on 47.
          d05 scope memo · ~640 words · explicit in/out lists + DR boundary +
          assumptions block. d21 assumption set · 8 assumptions covering
          workload growth, Cloverleaf maintenance, EOL plan, Epic version
          posture.
        </BodyP>
        <SubHead>The decision</SubHead>
        <BodyP>
          280 workloads in. 47 systems get DR. Tier-2 DR explicitly deferred.
          Cloverleaf in as one system. Vendors will be asked to price these
          terms.
        </BodyP>
        <SubHead>What we don&rsquo;t know yet</SubHead>
        <BodyP>
          We don&rsquo;t know how Cloverleaf&rsquo;s 47 integrations migrate.
          We don&rsquo;t know how each vendor will interpret &ldquo;maintained
          as-is.&rdquo; We don&rsquo;t know whether &ldquo;workload growth
          flat&rdquo; is realistic — Sarah Kim will flag it at d24 sign-off.
          But we have a memo that vendors can bid on, and that&rsquo;s the job
          of Stage 2.
        </BodyP>
      </Section>
    </ChapterShell>
  );
}
