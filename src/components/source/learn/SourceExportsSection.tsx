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

export function SourceExportsSection() {
  return (
    <>
      {/* Hero */}
      <HeroBand color="navy">
        <Eyebrow light>Source · Reference</Eyebrow>
        <SectionTitle light size="xl">
          Four format anchors for every artifact.
        </SectionTitle>
        <Lead light>
          Each artifact card has four download actions — xlsx, docx, HTML, and
          PDF. They serve different consumers: procurement ops, legal, approvers,
          and auditors. This page explains what each format contains and when to
          use it.
        </Lead>
      </HeroBand>

      {/* Why four formats */}
      <Section>
        <Eyebrow>Exports · 01</Eyebrow>
        <SectionTitle>Why four formats</SectionTitle>
        <Lead>
          Different stakeholders consume sourcing artifacts in fundamentally
          different ways. A single format would force every consumer to work
          against their grain. The four anchors solve four distinct consumption
          patterns.
        </Lead>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
            gap: 16,
            margin: '24px 0',
          }}
        >
          {[
            {
              code: 'xlsx',
              label: 'Procurement ops',
              desc: 'Want to pivot and filter data — line items, scoring weights, cost breakdowns. A spreadsheet is the right tool.',
            },
            {
              code: 'docx',
              label: 'Legal &amp; sponsors',
              desc: 'Want a branded Word document they can redline, comment, and track changes on. A .docx is what they open.',
            },
            {
              code: 'html',
              label: 'Approvers',
              desc: 'Need a browser-renderable preview for inline approval workflows — no attachment required, no install.',
            },
            {
              code: 'pdf',
              label: 'Auditors &amp; records',
              desc: 'Need an audit-stamped, tamper-evident archival artifact for the permanent sourcing record.',
            },
          ].map((f) => (
            <div
              key={f.code}
              style={{
                border: `1px solid ${T.border}`,
                borderRadius: 10,
                padding: 20,
                background: T.surface,
                display: 'flex',
                flexDirection: 'column',
                gap: 8,
              }}
            >
              <code
                style={{
                  fontFamily: T.fMono,
                  fontSize: 12,
                  fontWeight: 700,
                  color: T.navy,
                  background: T.navySoft,
                  border: `1px solid ${T.navyLine}`,
                  borderRadius: 4,
                  padding: '4px 8px',
                  alignSelf: 'flex-start',
                }}
              >
                .{f.code}
              </code>
              <div
                style={{
                  fontFamily: T.fBody,
                  fontSize: 13,
                  fontWeight: 700,
                  color: T.ink,
                }}
                dangerouslySetInnerHTML={{ __html: f.label }}
              />
              <div
                style={{
                  fontFamily: T.fBody,
                  fontSize: 12,
                  color: T.muted,
                  lineHeight: 1.55,
                }}
              >
                {f.desc}
              </div>
            </div>
          ))}
        </div>
      </Section>

      {/* xlsx */}
      <Section>
        <Eyebrow>Exports · 02</Eyebrow>
        <SectionTitle>xlsx — tabular artifact data</SectionTitle>
        <Lead>
          The xlsx export renders the artifact body as a structured spreadsheet.
          Each sheet is named for the artifact d-code.
        </Lead>
        <SubHead>Pricing artifacts (d19, d20)</SubHead>
        <BodyP>
          Line items become rows. Columns are: vendor name, line item label,
          unit, quantity, unit cost, extended cost, assumption notes, and trap
          flag (P0 / P1 / none from the d20 trap log). The header row is
          AbarVa-branded with the event name and artifact code.
        </BodyP>
        <SubHead>Scoring artifacts (d16)</SubHead>
        <BodyP>
          Criteria become rows. Columns are: criterion label, weight (percent),
          vendor A score, vendor B score (and so on per finalist), weighted A,
          weighted B, delta, and ranking. A summary row at the bottom shows
          total weighted scores.
        </BodyP>
        <SubHead>Other artifacts</SubHead>
        <BodyP>
          Non-tabular artifact bodies (strategy memos, decision briefs, etc.)
          are exported as a two-column sheet: section heading in column A, body
          text in column B. This is less useful than docx for prose artifacts —
          use xlsx primarily for pricing and scoring.
        </BodyP>
      </Section>

      {/* docx */}
      <Section>
        <Eyebrow>Exports · 03</Eyebrow>
        <SectionTitle>docx — full branded artifact body</SectionTitle>
        <Lead>
          The docx export is the full artifact body merged with the canonical
          scaffold, formatted with the AbarVa document style. This is the
          format to send to legal and decision sponsors for review.
        </Lead>
        <SubHead>Cover block</SubHead>
        <BodyP>
          Every docx starts with a cover block showing: event name, artifact
          code and label, generated-at timestamp, procurement lead (the
          &ldquo;Issued by&rdquo; field from the intake card), and the decision
          sponsors. The cover block uses the AbarVa letterhead style.
        </BodyP>
        <SubHead>Body formatting</SubHead>
        <BodyP>
          Headings use Fraunces (the AbarVa display face); body text uses DM
          Sans. Section headings, sub-headings, and body paragraphs are mapped
          to the Word heading styles (H1, H2, Normal) so recipients can use
          Word&rsquo;s built-in outline and navigation panel.
        </BodyP>
        <SubHead>Provenance footnote</SubHead>
        <BodyP>
          If the body was Sentinel-generated, a footnote appears on the last
          page: &ldquo;Authored by Sentinel&rdquo; with the provenance receipt
          summary — model, prompt template id + version, upstream bound codes,
          generated-at timestamp, and generated-by user. This footnote is the
          audit trail for the docx consumer.
        </BodyP>
      </Section>

      {/* html */}
      <Section>
        <Eyebrow>Exports · 04</Eyebrow>
        <SectionTitle>HTML — browser-renderable approval preview</SectionTitle>
        <Lead>
          The HTML export is designed for inline approval workflows where you
          need a human-readable version without requiring the recipient to
          open a file.
        </Lead>
        <BodyP>
          The HTML export carries the same cover block as the docx (event name,
          artifact code + label, timestamp, procurement lead, decision
          sponsors). All styles are inlined — no external CSS — so it renders
          correctly as an email attachment or in an iframe-based approval tool.
        </BodyP>
        <BodyP>
          HTML is <strong>not</strong> optimized for print. If the recipient
          needs to print, use PDF. HTML is optimized for screen review only —
          the layout is single-column, readable on both desktop and mobile.
        </BodyP>
      </Section>

      {/* pdf */}
      <Section>
        <Eyebrow>Exports · 05</Eyebrow>
        <SectionTitle>PDF — audit-stamped archival record</SectionTitle>
        <Lead>
          The PDF export is the artifact&rsquo;s permanent record format. It is
          the format you attach to a sourcing decision record and the one a
          compliance audit will reference.
        </Lead>
        <BodyP>
          Every PDF footer contains: the AbarVa watermark, the event code, the
          artifact code, the generated-at timestamp, and a
          &ldquo;Reviewed by [procurement lead]&rdquo; line (populated from the
          intake card). The footer is rendered on every page.
        </BodyP>
        <BodyP>
          The body content is the same as the docx — canonical scaffold merged
          with your authored text. The difference is the footer stamp and the
          fact that PDF is not designed to be edited after export. If a
          recipient asks for a &ldquo;final version to sign,&rdquo; PDF is the
          right answer.
        </BodyP>
      </Section>

      {/* Authored vs scaffold */}
      <Section>
        <Eyebrow>Exports · 06</Eyebrow>
        <SectionTitle>Authored vs scaffold</SectionTitle>
        <Lead>
          The format anchor tooltip on each artifact card tells you whether the
          export will use your authored body or the canonical scaffold. Check
          it before exporting.
        </Lead>
        <BodyP>
          If you have authored the artifact body (either by hand or via
          Sentinel), all four formats render your authored content. If the body
          is still at scaffold-only (no real content authored yet), all four
          formats render the canonical template text — which is clearly labeled
          as a scaffold in the header and is generally not suitable for sharing
          externally.
        </BodyP>
        <BodyP>
          The tooltip reads either &ldquo;Will export authored body&rdquo; or
          &ldquo;Will export scaffold only — author first.&rdquo; If you see
          the second message, generate with Sentinel or author the body before
          exporting.
        </BodyP>
        <Callout kind="info" icon="💡" label="Generate first, then export">
          The export does not trigger a new Sentinel generation. It renders
          whatever is in the substrate at the moment you click export. Always
          generate and review the artifact body first, then export. If you
          export a scaffold by accident, just author the body and re-export —
          exports are not recorded in the gate history, only promotions are.
        </Callout>
      </Section>

      {/* Export before promote callout */}
      <Section>
        <Callout kind="warn" icon="⚠️" label="Export before you promote">
          Once you promote a stage, the exported artifacts for that stage become
          the official record. Any edits made to an artifact after promotion are
          labeled &ldquo;post-gate edit&rdquo; in the provenance receipt —
          visible to anyone who inspects the receipt. Export the final versions
          of your stage artifacts before you click <strong>Promote
          stage</strong>, so the promoted-state export is clean.
        </Callout>
      </Section>
    </>
  );
}
