'use client';

import {
  Section,
  HeroBand,
  Eyebrow,
  SectionTitle,
  Lead,
  SubHead,
  TermGrid,
  Term,
} from '@/components/home/learn/primitives';

export function SourceGlossarySection() {
  return (
    <>
      <HeroBand color="navy">
        <Eyebrow light>Source · Reference</Eyebrow>
        <SectionTitle light size="xl">Glossary &amp; pitfalls.</SectionTitle>
        <Lead light>
          Every term Sentinel and the canvas use, defined once. Plus the common
          pitfalls first-time procurement leads hit on a Source event — and what
          to do instead.
        </Lead>
      </HeroBand>

      <Section>
        <Eyebrow>Source-specific terms</Eyebrow>
        <SectionTitle>Terms unique to AbarVa Source</SectionTitle>
        <TermGrid>
          <Term name="Archetype">
            The shape of a sourcing event. Five canonical: cloud / infrastructure,
            AMS / managed services, data platform, enterprise software, custom
            build. Drives every default Sentinel produces — line items, criteria
            weights, traps, BAFO questions.
          </Term>
          <Term name="Rigor">
            The level of formal discipline an event runs under. Three tiers:
            standard, elevated, strict. Drives required vs recommended artifacts
            at each gate, plus the evidence threshold for promotion.
          </Term>
          <Term name="Stage">
            One of the eleven canonical phases of a Source event (Strategy / Scope /
            RFP / Responses / Evaluation / Pricing / BAFO / Decision / Selection /
            Transition / Value). You promote stage by stage; you do not skip.
          </Term>
          <Term name="Gate">
            A specific set of criteria that must be met to promote a stage forward.
            Each criterion is its own evidence-bearing checkbox. Self-approve in
            pilot mode; admin / Maestro approve in production.
          </Term>
          <Term name="Artifact (d-code)">
            A canonical sourcing deliverable identified by a stable d-code (d01 →
            d33). Each artifact has a tier (stub / outline / rich), a status
            (not-started / drafting / needs-review / approved / locked /
            superseded), and a body (markdown).
          </Term>
          <Term name="Tier">
            How developed an artifact is. <em>Stub</em>: scaffold only.{' '}
            <em>Outline</em>: structure with placeholder content. <em>Rich</em>:
            authored content the panel can use.
          </Term>
          <Term name="Scaffold">
            The canonical template body for an artifact code. Lives in{' '}
            <em>src/content/source-templates/</em>. Used as a fallback when a
            per-event body has not been authored yet.
          </Term>
          <Term name="Body">
            The per-event authored content of an artifact. Markdown. Wins over the
            scaffold when present. Can be authored inline in the canvas, generated
            via Sentinel, or uploaded.
          </Term>
          <Term name="Substrate">
            The structured state of a Source event in Postgres —{' '}
            <em>source_events</em>, <em>source_event_artifact_states</em>,{' '}
            <em>source_event_gate_criterion_states</em>,{' '}
            <em>source_event_pricing_submissions</em>, etc. Sentinel reads from
            it, writes to it.
          </Term>
          <Term name="Provenance receipt">
            Audit metadata persisted alongside every Sentinel-authored body —
            model, prompt template id + version, upstream codes bound, generated-
            at, generated-by, tokens, stop reason.
          </Term>
          <Term name="Variant">
            A second renderable mode for an artifact code. Today only d19 has a
            variant — <em>template</em> (the buyer-issued empty workbook) and{' '}
            <em>comparison</em> (the side-by-side after vendor submissions).
          </Term>
          <Term name="Canvas">
            The Source UI surface for a single event — chat lane on the left,
            stage rail across the top, document tab + gate tab + evidence tab +
            log tab on the right. One canvas per event.
          </Term>
          <Term name="Sentinel">
            The named lead agent for Source. Drafts artifacts, surfaces evidence,
            flags gaps. One front-of-house chat lane; many specialist functions
            running behind.
          </Term>
        </TermGrid>
      </Section>

      <Section>
        <Eyebrow>Procurement acronyms</Eyebrow>
        <SectionTitle>Acronyms you&rsquo;ll see in any procurement context</SectionTitle>
        <TermGrid>
          <Term name="RFI">
            Request For Information. A pre-RFP probe to understand the vendor
            landscape and shortlist who&rsquo;s worth inviting. Optional in
            standard rigor; common in elevated.
          </Term>
          <Term name="RFP">
            Request For Proposal. The formal ask issued to a shortlist of
            vendors. Source authors a complete d09 RFP package via Sentinel,
            covering scope + response checklist (d11) + scoring rubric (d16) +
            pricing template (d19a).
          </Term>
          <Term name="BAFO">
            Best And Final Offer. The post-evaluation round where shortlisted
            vendors get a per-vendor question pack (d22) and submit their final
            position. Resolves open P0 / P1 traps from d20.
          </Term>
          <Term name="TCO">
            Total Cost of Ownership. The d19 pricing comparison normalizes vendor
            unit prices into a 3-year (or N-year) TCO with the assumption-set
            escalator applied per year.
          </Term>
          <Term name="MSA">
            Master Service Agreement. The umbrella contract between buyer and
            vendor. Source artifacts feed into MSA negotiation but Source itself
            does not author the MSA.
          </Term>
          <Term name="DPA">
            Data Processing Agreement. Required when the vendor processes the
            buyer&rsquo;s data. Sourced as a redline against the buyer&rsquo;s
            template; flagged as a mandatory item in d11.
          </Term>
          <Term name="SOW">
            Statement of Work. The per-engagement scope document under the MSA.
            Source feeds the SOW inputs (d05 scope memo + d11 mandatory items)
            but the SOW itself sits outside the canvas.
          </Term>
          <Term name="SLA">
            Service Level Agreement. The committed performance levels (uptime,
            response times, resolution times). Tracked per tier in d04 (app
            inventory) and challenged via d20 traps when vendors carve out
            material maintenance windows.
          </Term>
          <Term name="Trap (P0 / P1 / P2)">
            A pricing or commitment surprise Sentinel surfaces from a vendor
            submission. <em>P0</em>: deal-shaping (≥ 15% TCO impact); <em>P1</em>:
            material (3-15%); <em>P2</em>: noted (transparency only). Tracked in
            d20.
          </Term>
        </TermGrid>
      </Section>

      <Section>
        <Eyebrow>Common pitfalls</Eyebrow>
        <SectionTitle>Things first-time users get wrong</SectionTitle>
        <SubHead>1 · Treating Sentinel-generated content as final</SubHead>
        <Lead>
          Sentinel drafts; you decide. Every authored body must be reviewed
          before promoting the gate. The scaffold-warning banner on exports is
          the canvas reminding you that the content is canonical-default, not
          authored. <strong>Never circulate a body marked &ldquo;template
          scaffold.&rdquo;</strong>
        </Lead>
        <SubHead>2 · Skipping intake fields</SubHead>
        <Lead>
          Every default Sentinel produces downstream comes from intake. A vague
          archetype + missing trigger paragraph means generic d01 + d05 + d09
          drafts. Spend the extra five minutes on intake.
        </Lead>
        <SubHead>3 · Editing Stage 6 pricing template after vendors download it</SubHead>
        <Lead>
          The d19a pricing template is the buyer&rsquo;s contract with vendors.
          Editing the locked assumption set after vendors have started filling
          their copies invalidates their submissions. If you must change
          assumptions, re-issue with a new event code suffix and notify
          vendors.
        </Lead>
        <SubHead>4 · Promoting before gate criteria are met</SubHead>
        <Lead>
          The canvas warns you. Don&rsquo;t override the warning unless you have
          documented exception language in d24 (decision brief). The procurement
          panel can read the gate-state log and you will be asked &ldquo;why was
          this stage promoted with criterion X unmet?&rdquo;
        </Lead>
        <SubHead>5 · Treating P2 traps as &ldquo;safe to ignore&rdquo;</SubHead>
        <Lead>
          P2 traps don&rsquo;t require a vendor response but they DO get logged
          and surfaced to the panel. A vendor accumulating five P2 traps reads
          differently than a vendor with zero. Read d20 holistically, not as a
          per-row score.
        </Lead>
      </Section>
    </>
  );
}
