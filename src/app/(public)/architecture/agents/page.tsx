import type { Metadata } from 'next';
import { buildPageMetadata } from '@/lib/public-site/seo-defaults';
import { CANONICAL_URLS } from '@/lib/public-site/canonical-urls';
import { FourAgentDiagram } from '@/components/public-site/FourAgentDiagram';
import { PaperContainer } from '@/components/public-site/PaperContainer';

export const metadata: Metadata = buildPageMetadata({
  title: 'The four-agent voice model',
  description:
    'Nexus, Sentinel, Atlas, and Steward — four agents with distinct roles, distinct models, and distinct voice registers.',
  openGraph: { url: CANONICAL_URLS.architecture('agents') },
});

export default function AgentsPage() {
  return (
    <div style={{ background: 'var(--pub-paper, #faf7f1)', minHeight: '100vh' }}>
      {/* Header */}
      <section
        style={{
          borderBottom: '1px solid var(--pub-rule, rgba(136,135,128,0.25))',
          paddingTop: '80px',
          paddingBottom: '64px',
        }}
      >
        <PaperContainer narrow>
          <p
            style={{
              fontFamily: 'var(--pub-font-mono, monospace)',
              fontSize: '11px',
              color: 'var(--pub-stone, #888780)',
              textTransform: 'uppercase',
              letterSpacing: '0.1em',
              marginBottom: '16px',
            }}
          >
            Architecture · Agent plane
          </p>
          <h1
            style={{
              fontFamily: 'var(--pub-font-serif, serif)',
              fontSize: 'clamp(36px, 6vw, 52px)',
              fontWeight: 500,
              lineHeight: 1.1,
              letterSpacing: '-0.02em',
              color: 'var(--pub-ink, #000)',
              marginBottom: '20px',
            }}
          >
            Four agents. One voice.
          </h1>
          <p
            style={{
              fontFamily: 'var(--pub-font-sans, sans-serif)',
              fontSize: '18px',
              lineHeight: 1.6,
              color: 'var(--pub-slate, #5F5E5A)',
              maxWidth: '600px',
            }}
          >
            AbarVa runs four specialized agents. Each has a defined role, a defined voice register,
            and a defined model selection. None of them tries to do everything.
          </p>
        </PaperContainer>
      </section>

      {/* Diagram */}
      <section style={{ paddingTop: '64px', paddingBottom: '48px' }}>
        <PaperContainer>
          <FourAgentDiagram />
        </PaperContainer>
      </section>

      {/* Technical body */}
      <section
        style={{
          borderTop: '1px solid var(--pub-rule, rgba(136,135,128,0.25))',
          paddingTop: '64px',
          paddingBottom: '80px',
        }}
      >
        <PaperContainer narrow>
          <div
            style={{
              fontFamily: 'var(--pub-font-sans, sans-serif)',
              fontSize: '16px',
              lineHeight: 1.75,
              color: 'var(--pub-slate, #5F5E5A)',
            }}
          >
            <h2
              style={{
                fontFamily: 'var(--pub-font-serif, serif)',
                fontSize: '28px',
                fontWeight: 500,
                color: 'var(--pub-ink, #000)',
                marginBottom: '24px',
                letterSpacing: '-0.01em',
              }}
            >
              The four agents
            </h2>

            {/* Nexus */}
            <div
              style={{
                marginBottom: '40px',
                paddingLeft: '20px',
                borderLeft: '3px solid #0066CC',
              }}
            >
              <h3
                style={{
                  fontFamily: 'var(--pub-font-serif, serif)',
                  fontSize: '22px',
                  fontWeight: 500,
                  color: 'var(--pub-ink, #000)',
                  marginBottom: '6px',
                }}
              >
                Nexus — the orchestrator
              </h3>
              <p
                style={{
                  fontFamily: 'var(--pub-font-mono, monospace)',
                  fontSize: '11px',
                  color: 'var(--pub-stone, #888780)',
                  marginBottom: '12px',
                  letterSpacing: '0.05em',
                }}
              >
                Voice: Operational, formal, high-stakes · Model: Claude Opus
              </p>
              <p style={{ marginBottom: '12px' }}>
                Nexus is the maestro. Every program in AbarVa is orchestrated by Nexus: it manages
                the six-phase lifecycle, routes work to other agents, schedules synthesis requests,
                and produces the outputs that program stakeholders actually read. Nexus runs on
                Claude Opus because the coordination task requires holding large context windows
                without losing fidelity on phase state or stakeholder requirements.
              </p>
              <p style={{ marginBottom: '12px' }}>
                Nexus&apos;s voice register is operational and formal. It does not editorialize. An
                example Nexus output: &quot;Phase 3 synthesis complete. Three patterns applied. One
                contradiction surfaced. Steward escalation pending stakeholder review.&quot; No
                qualifications, no hedges — it states what happened.
              </p>
              <p>
                Nexus is the only agent that writes directly to program state. Other agents
                influence state through Nexus; they do not write it themselves. This single
                writer pattern prevents race conditions and makes the audit trail readable.
              </p>
            </div>

            {/* Sentinel */}
            <div
              style={{
                marginBottom: '40px',
                paddingLeft: '20px',
                borderLeft: '3px solid #0c1a3a',
              }}
            >
              <h3
                style={{
                  fontFamily: 'var(--pub-font-serif, serif)',
                  fontSize: '22px',
                  fontWeight: 500,
                  color: 'var(--pub-ink, #000)',
                  marginBottom: '6px',
                }}
              >
                Sentinel — the validator
              </h3>
              <p
                style={{
                  fontFamily: 'var(--pub-font-mono, monospace)',
                  fontSize: '11px',
                  color: 'var(--pub-stone, #888780)',
                  marginBottom: '12px',
                  letterSpacing: '0.05em',
                }}
              >
                Voice: Technical, sharp, willing to disagree · Model: Claude Opus
              </p>
              <p style={{ marginBottom: '12px' }}>
                Sentinel reviews every synthesis output, every agent handoff, and every code change
                before it reaches a stakeholder or merges to production. Sentinel runs on Claude
                Opus for the same reason as Nexus: validation requires understanding the full
                context of what is being validated, not just the surface of the output.
              </p>
              <p style={{ marginBottom: '12px' }}>
                Sentinel&apos;s voice register is technical and willing to disagree. An example Sentinel
                output: &quot;This synthesis claims three patterns support the recommendation. Pattern
                PAT-012 does not support it — it argues the opposite under high-uncertainty
                conditions. Hold pending clarification.&quot; Sentinel does not soften holds. A hold is
                a hold.
              </p>
              <p>
                Sentinel&apos;s 8-criterion auto-approval gate covers: type-correctness, test coverage,
                brand voice compliance, citation accuracy, trade-off documentation, contradiction
                acknowledgment, stakeholder-level readability, and compliance trail completeness.
                If all 8 pass, Sentinel approves without human review. If any fail, the hold reason
                is documented and routed to the appropriate queue.
              </p>
            </div>

            {/* Atlas */}
            <div
              style={{
                marginBottom: '40px',
                paddingLeft: '20px',
                borderLeft: '3px solid #0066CC',
              }}
            >
              <h3
                style={{
                  fontFamily: 'var(--pub-font-serif, serif)',
                  fontSize: '22px',
                  fontWeight: 500,
                  color: 'var(--pub-ink, #000)',
                  marginBottom: '6px',
                }}
              >
                Atlas — the synthesizer
              </h3>
              <p
                style={{
                  fontFamily: 'var(--pub-font-mono, monospace)',
                  fontSize: '11px',
                  color: 'var(--pub-stone, #888780)',
                  marginBottom: '12px',
                  letterSpacing: '0.05em',
                }}
              >
                Voice: Operational, terse, citation-rich · Model: Claude Sonnet
              </p>
              <p style={{ marginBottom: '12px' }}>
                Atlas synthesizes. Given a query from Nexus, Atlas runs four retrieval passes
                against the five-store knowledge fabric, synthesizes the results under a hard
                150-word cap, and returns a cited brief. The 150-word cap is not a soft guideline —
                the output is truncated if it exceeds it.
              </p>
              <p style={{ marginBottom: '12px' }}>
                Atlas runs on Claude Sonnet. The synthesis task does not require Opus capability —
                it requires reliability, citation accuracy, and adherence to the word cap. Sonnet
                delivers these more cost-effectively than Opus. If a synthesis task exceeds Sonnet&apos;s
                capability, Nexus escalates it to a human reviewer rather than silently upgrading
                the model.
              </p>
              <p>
                An example Atlas output: &quot;Contact center AI programs fail in phase 3 at a 2× rate
                vs. other AI verticals (Signal SIG-007). Primary cause: stakeholder expectation
                mismatch on intent recognition accuracy (Pattern PAT-031). Mitigation: explicit
                accuracy SLA documentation before phase 3 gates (Evidence EVD-112).&quot; Every claim
                cited, 150 words or fewer, no editorializing.
              </p>
            </div>

            {/* Steward */}
            <div
              style={{
                marginBottom: '48px',
                paddingLeft: '20px',
                borderLeft: '3px solid #888780',
              }}
            >
              <h3
                style={{
                  fontFamily: 'var(--pub-font-serif, serif)',
                  fontSize: '22px',
                  fontWeight: 500,
                  color: 'var(--pub-ink, #000)',
                  marginBottom: '6px',
                }}
              >
                Steward — the governor
              </h3>
              <p
                style={{
                  fontFamily: 'var(--pub-font-mono, monospace)',
                  fontSize: '11px',
                  color: 'var(--pub-stone, #888780)',
                  marginBottom: '12px',
                  letterSpacing: '0.05em',
                }}
              >
                Voice: Procedural, careful, cites rules · Model: Claude Sonnet
              </p>
              <p style={{ marginBottom: '12px' }}>
                Steward handles escalations that exceed Sentinel&apos;s auto-approval authority: compliance
                decisions, cross-tenant rule conflicts, budget threshold breaches, and any decision
                that requires citing a specific governance rule rather than a pattern. Steward runs
                on Claude Sonnet because governance decisions are procedural, not inferential —
                they require rule lookup and citation, not deep reasoning.
              </p>
              <p style={{ marginBottom: '12px' }}>
                Steward&apos;s voice register is procedural and careful. An example Steward output:
                &quot;Escalation received. Budget threshold exceeded by 12%. Per governance rule GOV-004
                (section 3.2), this requires CFO approval before phase continuation. Routing to
                approval queue.&quot; Steward does not interpret rules; it applies them and cites where
                it found them.
              </p>
              <p>
                Steward&apos;s escalation rules are explicit and versioned. A change to Steward&apos;s
                decision criteria is a documented governance change, not a model behavior change.
                This means governance auditors can review exactly what rules were in effect at the
                time of any past decision.
              </p>
            </div>

            <h2
              style={{
                fontFamily: 'var(--pub-font-serif, serif)',
                fontSize: '28px',
                fontWeight: 500,
                color: 'var(--pub-ink, #000)',
                marginBottom: '20px',
                letterSpacing: '-0.01em',
              }}
            >
              Trade-offs we made
            </h2>

            <div style={{ marginBottom: '28px' }}>
              <h3
                style={{
                  fontFamily: 'var(--pub-font-mono, monospace)',
                  fontSize: '13px',
                  color: 'var(--pub-ink, #000)',
                  marginBottom: '8px',
                }}
              >
                Four distinct agents vs. a single general agent
              </h3>
              <p>
                A single general agent would be simpler to build and deploy. We chose four distinct
                agents because each role has different capability requirements, different output
                constraints, different failure modes, and different audit requirements. When an Atlas
                synthesis is wrong, the failure is in the synthesis task. When a Sentinel hold is
                wrong, the failure is in the validation criteria. Four distinct agents make failures
                attributable, which makes them fixable.
              </p>
            </div>

            <div style={{ marginBottom: '28px' }}>
              <h3
                style={{
                  fontFamily: 'var(--pub-font-mono, monospace)',
                  fontSize: '13px',
                  color: 'var(--pub-ink, #000)',
                  marginBottom: '8px',
                }}
              >
                Different models per agent vs. uniform model selection
              </h3>
              <p>
                Running Opus for Nexus and Sentinel, and Sonnet for Atlas and Steward, means the
                system uses the right model for each task rather than defaulting to the most capable
                (and most expensive) option everywhere. Atlas&apos;s 150-word synthesis under explicit
                constraints does not benefit from Opus-level capability. Sentinel&apos;s validation of
                complex multi-pattern outputs does. Uniform model selection would mean either
                overpaying for synthesis or underperforming on validation.
              </p>
            </div>
          </div>
        </PaperContainer>
      </section>
    </div>
  );
}
