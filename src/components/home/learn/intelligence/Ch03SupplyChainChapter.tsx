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

export function Ch03SupplyChainChapter() {
  return (
    <>
      <HeroBand color="purple">
        <Eyebrow light>Intelligence · Apex Retail · Chapter 03</Eyebrow>
        <SectionTitle light size="xl">
          ±23-day lead time variability. Peak season is 5 months out.
        </SectionTitle>
        <Lead light>
          James Wright, CPTO, carries the technical risk on APX-05. Supply chain control tower
          is the newest program — Phase 1, just initiated. The board question is simple: &ldquo;Are
          we prepared for peak season?&rdquo; The honest answer requires knowing exactly what
          &ldquo;prepared&rdquo; means in the context of ±23-day variability.
        </Lead>
      </HeroBand>

      <StoryRecap>
        APX-05 &ldquo;Supply Chain Control Tower&rdquo; was initiated 6 weeks ago after the
        Intelligence substrate flagged lead time variability as a P1-severity signal. Phase 1
        (Initiate) means the program has a charter and an owner, but the design work hasn&rsquo;t
        started. The substrate has more context on this risk than the program team does right now.
      </StoryRecap>

      <Section>
        <Eyebrow>The signal</Eyebrow>
        <SectionTitle>What ±23 days actually means</SectionTitle>
        <Lead>
          Lead time variability of ±23 days means that a vendor promising a 45-day lead time
          may actually deliver in 22 days or 68 days. That range is so wide that safety stock
          calculations become guesswork — you can&rsquo;t buffer a ±23-day swing without
          holding economically irrational amounts of inventory.
        </Lead>
        <BodyP>
          For context: a ±7-day variance is manageable with standard safety stock. ±14 days
          requires safety stock at 1.5–2x standard levels. ±23 days means either holding
          3x safety stock (expensive) or accepting stockout risk in roughly 1 in 5 peak-season
          replenishment cycles.
        </BodyP>
        <BodyP>
          The corpus median for $10–25B specialty retailers is ±9 days. Apex is running at
          2.6x the peer median. The substrate traces the variance to three clusters: direct
          import from Southeast Asia (highest variance, ±31 days), domestic DC transfer
          (lowest, ±8 days), and regional vendor fulfillment (middle, ±19 days). Peak season
          exposure concentrates in direct import — the Morrison private label seasonal line
          is 62% direct import.
        </BodyP>
        <Callout kind="warn" icon="⚠️" label="Why peak season amplifies this">
          Lead time variability hurts most when demand is highest and substitute inventory
          options are fewest. In peak season (Oct–Dec), early stockouts can&rsquo;t be
          recovered — the reorder lead time from Southeast Asia is 45 days minimum. A missed
          Morrison seasonal item in week 3 of November is a permanent lost sale.
        </Callout>
      </Section>

      <Section>
        <Eyebrow>Pattern F221</Eyebrow>
        <SectionTitle>Shelfware Risk — why control towers fail</SectionTitle>
        <Lead>
          F221 isn&rsquo;t about supply chain directly — it&rsquo;s about AI implementations
          that get built and then not used. The pattern shows up most often in control tower
          programs because the implementation seems complete but the actual behavior change
          doesn&rsquo;t follow.
        </Lead>

        <div
          style={{
            background: T.amberSoft,
            border: `1px solid ${T.amberLine}`,
            borderRadius: 10,
            padding: 20,
            margin: '16px 0',
          }}
        >
          <div
            style={{
              fontFamily: T.fMono,
              fontSize: 10,
              fontWeight: 700,
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              color: T.amber,
              marginBottom: 10,
            }}
          >
            F221 · Shelfware Risk · Three failure modes
          </div>
          {[
            {
              mode: 'Alert fatigue',
              desc: 'Control towers generate too many alerts. Planners learn to ignore them. The alerts that matter are buried in noise. Override rate climbs above 60%.',
            },
            {
              mode: 'Ownership ambiguity',
              desc: 'The control tower shows a problem. But who acts on it — logistics, purchasing, the vendor? If the answer isn\'t unambiguous, the alert sits until someone escalates it manually.',
            },
            {
              mode: 'SLA without teeth',
              desc: 'Vendor SLAs exist on paper. The control tower flags violations. But the contract has no automatic remedy clause, so the violation becomes a meeting item, not a penalty trigger.',
            },
          ].map(({ mode, desc }) => (
            <div key={mode} style={{ marginBottom: 14 }}>
              <div
                style={{
                  fontFamily: T.fBody,
                  fontSize: 13,
                  fontWeight: 700,
                  color: T.amber,
                  marginBottom: 4,
                }}
              >
                {mode}
              </div>
              <div
                style={{
                  fontFamily: T.fBody,
                  fontSize: 13,
                  color: T.body,
                  lineHeight: 1.6,
                }}
              >
                {desc}
              </div>
            </div>
          ))}
        </div>

        <BodyP>
          The F221 pattern is a design-time warning, not a post-deployment one. The time to
          address it is in Phase 1–2, before the control tower design is locked. APX-05 is
          in Phase 1 — this is exactly the right moment for the design team to read this
          pattern and build against it.
        </BodyP>
      </Section>

      <Section>
        <Eyebrow>APX-05 · Phase 1 Initiate</Eyebrow>
        <SectionTitle>What Phase 1 means for a control tower program</SectionTitle>
        <Lead>
          Phase 1 (Initiate) is the charter phase. The program has an owner (James Wright&rsquo;s
          team), a named sponsor (Marcus Chen), and a preliminary value hypothesis. The design
          work hasn&rsquo;t started. Here&rsquo;s what the P1→P2 gate requires.
        </Lead>
        <SubHead>What needs to be true before Phase 2</SubHead>
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
            Vendor coverage map: which vendors are in scope for the control tower, what
            data they&rsquo;re willing to share (ASN data, in-transit tracking, DC arrival
            confirmations), and what the integration contract looks like.
          </li>
          <li style={{ marginTop: 6 }}>
            Alert taxonomy: define the 5–7 alert types the control tower will surface.
            If the taxonomy has more than 10 types at design time, F221 (alert fatigue)
            will materialize post-deployment.
          </li>
          <li style={{ marginTop: 6 }}>
            Ownership matrix: for each alert type, named individual or role who takes
            action. No ambiguity. The matrix goes into the program charter as a binding
            commitment.
          </li>
          <li style={{ marginTop: 6 }}>
            Vendor SLA with remedy clause: the control tower is only useful if flag →
            penalty is automatic. Legal needs to be involved at Phase 1 to design the
            clause, not at Phase 4 after vendors are already integrated.
          </li>
        </ul>
        <Callout kind="info" icon="🔍" label="The peak season constraint">
          If APX-05 wants to have any operational impact before peak season (Oct–Dec),
          Phase 1→2 gate must pass by end of May. Phase 2 diagnosis (8–10 weeks) + Phase 3
          design (8–10 weeks) puts live capability at September — barely in time. Any
          slip past the May gate means peak season 2026 is the earliest real deployment.
        </Callout>
      </Section>

      <Section>
        <Eyebrow>The CXO conversation</Eyebrow>
        <SectionTitle>Answering &ldquo;Are we prepared for peak season?&rdquo;</SectionTitle>
        <Lead>
          David Kim (CEO) will ask this at the May board meeting. The honest answer requires
          distinguishing what&rsquo;s in APX-05&rsquo;s control from what isn&rsquo;t.
        </Lead>

        <SubHead>Bad answer</SubHead>
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
          &ldquo;We have a supply chain control tower program underway and are working to
          improve our lead time visibility. The team is making progress and we expect to
          be in a better position heading into peak season.&rdquo;
        </div>

        <SubHead>Good answer</SubHead>
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
          &ldquo;Honestly, we have a ±23-day lead time variance vs ±9-day peer median — the
          highest-risk exposure is the Morrison seasonal line, which is 62% direct import from
          Southeast Asia. APX-05 control tower is in Phase 1 right now. For it to be live
          before peak season, we need to pass the P1→P2 gate by end of May. If that happens,
          we&rsquo;re deploying in September — operational, but not battle-tested. My honest
          read: we should plan peak season 2026 with the assumption that the control tower
          is in monitoring mode, not remediation mode. I&rsquo;d recommend the Morrison
          seasonal buy goes in by June 15 — earlier than usual — to create a buffer against
          the variance. That&rsquo;s the operational hedge. APX-05 is the long-term fix.&rdquo;
        </div>

        <BodyP>
          The good answer does three things the bad answer doesn&rsquo;t: it names the specific
          risk (Morrison seasonal, 62% direct import), gives a specific decision point (May gate
          pass/fail), and proposes an operational hedge that doesn&rsquo;t depend on the program
          succeeding on schedule. The CEO can act on that. He can&rsquo;t act on &ldquo;making
          progress.&rdquo;
        </BodyP>
      </Section>

      <ChapterFooterNav
        prev={{ href: '/home/learn/intelligence/demand-forecast', label: 'Ch.02 Demand Forecasting' }}
        next={{ href: '/home/learn/intelligence/what-to-watch', label: 'Ch.04 What to Watch' }}
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
