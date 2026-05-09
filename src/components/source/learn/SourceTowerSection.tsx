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
  StepList,
  Step,
} from '@/components/home/learn/primitives';

export function SourceTowerSection() {
  return (
    <>
      {/* Hero */}
      <HeroBand color="navy">
        <Eyebrow light>Source · Reference</Eyebrow>
        <SectionTitle light size="xl">
          When Selection closes, Tower opens.
        </SectionTitle>
        <Lead light>
          The event doesn&rsquo;t end at Stage 9. Stages 10 (Transition) and 11
          (Value) are where the sourcing decision either delivers or
          doesn&rsquo;t. After Stage 11 is promoted, the event surfaces in
          Tower&rsquo;s handoff panel and Atlas takes over the ongoing
          monitoring.
        </Lead>
      </HeroBand>

      {/* What Tower observes */}
      <Section>
        <Eyebrow>After the event · 01</Eyebrow>
        <SectionTitle>What Tower observes</SectionTitle>
        <Lead>
          Tower (fronted by Atlas, not Sentinel) watches three data streams
          after a Source event closes. These become Tower observations that
          Atlas surfaces to the procurement lead and decision sponsors.
        </Lead>
        <SubHead>Vendor onboarding milestones (Stage 10 / Transition)</SubHead>
        <BodyP>
          During Stage 10, the winning vendor&rsquo;s onboarding milestones are
          tracked against the d26 transition plan. Atlas monitors completion
          status, flags delayed milestones, and surfaces escalation prompts
          when a milestone is overdue by more than the threshold configured on
          the event (default: 7 days). Each milestone check-in is a Tower
          observation.
        </BodyP>
        <SubHead>KPI realization (Stage 11 / Value)</SubHead>
        <BodyP>
          The d15 value scorecard (authored at Stage 5 / Evaluation) lists the
          KPI targets you required from the winning vendor. In Stage 11, Atlas
          compares realized values to those targets on a monthly cadence. The
          gap between target and realized becomes the <strong>variance
          report</strong> — mandatory before the event can be closed.
        </BodyP>
        <SubHead>Contract compliance signals (d28 contract record)</SubHead>
        <BodyP>
          The d28 contract record (authored at Stage 9 / Selection) contains
          the key contractual obligations. Atlas monitors compliance signals —
          renewal windows, SLA thresholds, audit obligations — and surfaces
          them as Tower observations ahead of the relevant dates.
        </BodyP>
      </Section>

      {/* The value scorecard */}
      <Section>
        <Eyebrow>After the event · 02</Eyebrow>
        <SectionTitle>The value scorecard (d15)</SectionTitle>
        <Lead>
          The d15 value scorecard is authored at Stage 5 / Evaluation. It lists
          the specific KPI targets you required from the winning vendor. In
          Stage 11, Atlas reads d15 to know what to measure.
        </Lead>
        <BodyP>
          Each row in d15 has: a KPI label (e.g. &ldquo;AHT reduction
          &ge;&nbsp;15%&rdquo;), a target value, a measurement method (e.g.
          &ldquo;call center ops dashboard monthly export&rdquo;), and a
          realization deadline (e.g. &ldquo;Month 6 post go-live&rdquo;). The
          rows are the Atlas monitoring contract.
        </BodyP>
        <BodyP>
          In Stage 11, Atlas compares each d15 row&rsquo;s target to the
          realized value you or the vendor submits. The gap — positive or
          negative — is the variance. Positive variance (beat the target) is
          surfaced as a win. Negative variance (missed the target) is surfaced
          as an open item requiring a remediation plan from the vendor.
        </BodyP>
        <BodyP>
          The variance report must be completed before you can promote Stage 11
          (close the event). If any KPI row shows negative variance, the gate
          criteria require either a vendor-acknowledged remediation plan or a
          formal waiver signed by the decision sponsors.
        </BodyP>
      </Section>

      {/* Atlas's role */}
      <Section>
        <Eyebrow>After the event · 03</Eyebrow>
        <SectionTitle>Atlas&rsquo;s role after the gate</SectionTitle>
        <Lead>
          Sentinel is the agent for Stages 1 through 9. Atlas takes over at the
          Stage 10 gate. The chat lane changes branding at that point — you are
          now talking to Atlas.
        </Lead>
        <BodyP>
          Atlas specializes in three areas that Sentinel does not:
        </BodyP>
        <ul style={{ marginLeft: 24, lineHeight: 1.8, fontSize: 14 }}>
          <li>
            <strong>Realized-value analysis</strong> — reading d15 targets
            against submitted actuals; computing variance; flagging outliers
            and identifying root-cause hypotheses.
          </li>
          <li>
            <strong>Contract compliance monitoring</strong> — reading d28 for
            obligation windows, renewal dates, and SLA thresholds; surfacing
            upcoming obligations as Tower observations before they become
            escalations.
          </li>
          <li>
            <strong>Post-award monitoring</strong> — ongoing monthly check-ins
            on vendor KPI submissions; escalation prompts when submissions are
            late or incomplete.
          </li>
        </ul>
        <BodyP>
          You do not address Atlas by a different name in the chat lane — the
          lane still shows the AbarVa interface. The agent branding in the
          readiness count area changes from &ldquo;Sentinel&rdquo; to
          &ldquo;Atlas&rdquo; at the Stage 10 gate so you know which specialist
          catalog is active.
        </BodyP>
      </Section>

      {/* The handoff to Tower */}
      <Section>
        <Eyebrow>After the event · 04</Eyebrow>
        <SectionTitle>The handoff to Tower</SectionTitle>
        <Lead>
          After Stage 11 Value is promoted — the event &ldquo;closed&rdquo; —
          it surfaces in Tower&rsquo;s handoff panel. Open variance items
          become Tower observations. Atlas continues watching until the
          contract term ends or you manually remove the observation.
        </Lead>
        <StepList>
          <Step title="Stage 11 promoted">
            When you promote Stage 11 (the event closes), the gate history
            records the final promotion timestamp. The event status changes
            from <strong>Active</strong> to <strong>Closed</strong> in the
            Source event list.
          </Step>
          <Step title="Event surfaces in Tower handoff panel">
            Tower picks up the closed event automatically. The handoff panel in
            Tower shows the event name, the vendor, the contract term, and the
            open variance items from the d30 realized value report.
          </Step>
          <Step title="Variance items become Tower observations">
            Any KPI row with negative variance that has not been resolved
            becomes a Tower observation. Atlas continues to monitor those items
            monthly — checking vendor submissions, updating variance, and
            surfacing escalation prompts to the procurement lead.
          </Step>
          <Step title="Ongoing monitoring">
            Atlas watches the contract until one of two things happens: the
            contract term end date passes (and Atlas surfaces a contract
            closeout observation), or the procurement lead manually removes the
            observation from Tower. Neither action deletes the event record —
            the Source record is permanent.
          </Step>
        </StepList>
      </Section>

      {/* Practical tip */}
      <Section>
        <Eyebrow>After the event · 05</Eyebrow>
        <SectionTitle>Before you close Stage 11</SectionTitle>
        <Lead>
          Run &ldquo;Generate Value Summary&rdquo; in the Atlas chat lane
          before promoting Stage 11. Atlas drafts the d30 Realized Value Report
          — the event&rsquo;s permanent close-out document.
        </Lead>
        <BodyP>
          The d30 report is assembled from three sources: d15 (the value
          scorecard with targets), d28 (the contract record), and the realized
          KPI evidence you submitted during Stage 11. Atlas reads all three,
          computes the final variance table, writes a narrative summary, and
          flags any open items that require remediation or waivers before
          promotion.
        </BodyP>
        <BodyP>
          Once the d30 is generated and you&rsquo;ve reviewed it, export it as
          PDF (the audit-stamped format) and attach it to your sourcing decision
          record. This is the document that answers &ldquo;did the vendor
          deliver what we contracted for?&rdquo; — and it should exist before
          you close the event.
        </BodyP>
        <Callout kind="info" icon="📂" label="The event is the audit unit, not the contract">
          The event record — all 11 stages, all artifacts, all gate timestamps
          — lives in Source permanently. The Tower observation record — all
          Atlas analyses, all variance reports, all contract compliance checks
          — lives in Tower. Together they are the sourcing governance file for
          that contract. Neither record is deleted when the contract ends;
          neither is deleted when you remove a Tower observation. They are the
          institutional memory of the sourcing decision.
        </Callout>
      </Section>
    </>
  );
}
