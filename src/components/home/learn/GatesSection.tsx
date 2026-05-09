'use client';
import { Section, Eyebrow, SectionTitle, Lead, BodyP, Callout, StepList, Step, TermGrid, Term, T } from './primitives';

export function GatesSection() {
  return (
    <>
      {/* Gates */}
      <Section>
        <Eyebrow>Gates & Evidence</Eyebrow>
        <SectionTitle>Understanding gates</SectionTitle>
        <Lead>
          Gates are the quality checkpoints at the end of each phase. They&rsquo;re not bureaucratic formalities — they&rsquo;re the mechanism that ensures each phase has genuine outputs before you commit to the next investment level.
        </Lead>

        {/* Gate states */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
            gap: 14,
            margin: '24px 0',
          }}
        >
          {[
            { icon: '🔒', name: 'Pending', desc: 'Phase not started or hard criteria not yet addressed. Advance button is locked.', bg: T.surface2, line: T.border },
            { icon: '⚠️', name: 'Open', desc: 'In progress. Some criteria met, some still outstanding. Advance button shows what\'s blocking.', bg: T.amberSoft, line: T.amberLine },
            { icon: '✅', name: 'Cleared', desc: 'All hard criteria met. Advance is active. Soft criteria show as advisory warnings.', bg: T.tealSoft, line: T.tealLine },
          ].map((s) => (
            <div
              key={s.name}
              style={{
                border: `1px solid ${s.line}`,
                background: s.bg,
                borderRadius: 10,
                padding: '18px 16px',
                display: 'flex',
                flexDirection: 'column',
                gap: 6,
              }}
            >
              <span style={{ fontSize: 22 }}>{s.icon}</span>
              <div style={{ fontFamily: T.fBody, fontSize: 14, fontWeight: 700, color: T.ink }}>{s.name}</div>
              <div style={{ fontFamily: T.fBody, fontSize: 12, color: T.muted, lineHeight: 1.55 }}>{s.desc}</div>
            </div>
          ))}
        </div>

        <TermGrid>
          <Term name="Hard criterion">
            A blocking gate requirement. The gate cannot clear and the Advance button stays locked until this is satisfied. <em>Examples: named sponsor, scope boundary, gate document signed off.</em>
          </Term>
          <Term name="Soft criterion">
            An advisory gate requirement. The gate can clear even if this is open — but it appears as a warning in the gate view and in the audit trail seen by Control Tower. <em>Examples: stakeholder review completed, technical sign-off obtained.</em>
          </Term>
          <Term name="Gate approval">
            The human action that clears a gate. In the current pilot, any user can self-approve. In production, only admin or Maestro-role users can approve. <em>Nexus (the AI) cannot approve a gate on your behalf — gate approval is always a human action.</em>
          </Term>
        </TermGrid>
      </Section>

      {/* Generating deliverables */}
      <Section>
        <Eyebrow>Gates & Evidence</Eyebrow>
        <SectionTitle>Generating deliverables</SectionTitle>
        <Lead>
          Every phase generates consulting-grade documents. All are generated on demand from the <strong>Generate Deliverables tab</strong> in the phase canvas. Download links only appear after generation.
        </Lead>

        <StepList>
          <Step title='Open the phase workspace and click "Generate Deliverables"' path="/strategic-moves/{id}/phase/{1–5} → Generate tab">
            The tab is in the right-hand phase canvas. It shows all documents for this phase with their current status (not generated / Draft / In Review / Signed Off).
          </Step>
          <Step title="Select the document and click Generate">
            Gate artifacts are marked with a green GATE chip. Generate these first — they&rsquo;re what the gate checks for. Format is HTML preview + Word download for narrative docs; Excel for the Financial Model.
          </Step>
          <Step title="Wait ~10–30s, then preview or download" note="💡 Give Nexus rich context when generating: 'generate the charter — sponsor is Sarah Chen (COO), scope is inbound routing only, deadline is Q3.' More context = better document.">
            Nexus assembles the document from your scaffold data, phase inputs, and chat history. Complex documents (Business Case, Financial Model) may take longer. Regenerate any time after major chat updates.
          </Step>
        </StepList>
      </Section>

      {/* Evidence Hub */}
      <Section>
        <Eyebrow>Gates & Evidence</Eyebrow>
        <SectionTitle>Evidence Hub</SectionTitle>
        <Lead>
          The single document store for a Move — all generated deliverables, uploaded supporting files, and status history, organized by phase.
        </Lead>
        <BodyP>
          Access via <code style={{ fontFamily: T.fMono, fontSize: 12, background: T.surface3, padding: '2px 6px', borderRadius: 3 }}>/strategic-moves/{'{id}'}/evidence</code>
        </BodyP>

        <TermGrid>
          <Term name="Gate artifact">
            Documents with a <strong>blue left border</strong>. Required for the phase gate to clear. Must reach &ldquo;Signed Off&rdquo; status before the gate can clear. <em>Examples: Program Charter, Current State Assessment, Execution Roadmap.</em>
          </Term>
          <Term name="Working document">
            Documents with a <strong>grey left border</strong>. Supporting analysis and design artifacts — tracked and versioned but not blocking the gate. <em>Examples: Stakeholder Map, Risk Register, Root Cause Analysis.</em>
          </Term>
          <Term name="Document status">
            <strong>Draft</strong> → <strong>In Review</strong> → <strong>Signed Off</strong>. Gate artifacts must reach Signed Off. Working documents can stay at Draft.
          </Term>
        </TermGrid>

        <Callout kind="info" icon="📎" label="Uploading supporting evidence">
          Upload files via the Evidence Hub directly, or attach them in the Nexus chat with the paperclip icon. Supported: PDF, Word, Excel, CSV, PowerPoint. Uploaded files are indexed by the evidence specialist and attached to the relevant phase automatically.
        </Callout>
      </Section>
    </>
  );
}
