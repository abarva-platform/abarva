import type { Metadata } from 'next';
import { buildPageMetadata } from '@/lib/public-site/seo-defaults';
import { CANONICAL_URLS } from '@/lib/public-site/canonical-urls';
import { PaperContainer } from '@/components/public-site/PaperContainer';

export const metadata: Metadata = buildPageMetadata({
  title: 'Sentinel validation and Steward governance',
  description:
    "Nothing ships without validation. Sentinel's 8-criterion auto-approval gate and Steward's escalation rules — how AbarVa enforces agentic governance.",
  openGraph: { url: CANONICAL_URLS.architecture('governance') },
});

const SENTINEL_CRITERIA = [
  {
    id: 1,
    label: 'Type-correctness',
    description: 'TypeScript compiles clean with strict mode. No type assertions hiding failures.',
  },
  {
    id: 2,
    label: 'Test coverage',
    description: 'All test suites pass. New code paths covered by at least one test.',
  },
  {
    id: 3,
    label: 'Brand voice compliance',
    description:
      'Copy uses technical register per brand voice spec §4. No hedges, no softening language.',
  },
  {
    id: 4,
    label: 'Citation accuracy',
    description:
      'Every factual claim in synthesis output cites a pattern, signal, or evidence ledger entry that exists and supports the claim.',
  },
  {
    id: 5,
    label: 'Trade-off documentation',
    description:
      'Architecture decisions include explicit trade-offs. Changes that affect performance, cost, or security document what was accepted.',
  },
  {
    id: 6,
    label: 'Contradiction acknowledgment',
    description:
      'If the evidence ledger flags a contradiction with prior synthesis, the output acknowledges it rather than suppressing it.',
  },
  {
    id: 7,
    label: 'Stakeholder-level readability',
    description:
      'Synthesis outputs are readable by program stakeholders without requiring AI expertise. Jargon is defined inline.',
  },
  {
    id: 8,
    label: 'Compliance trail completeness',
    description:
      'Audit ledger entry written for every state mutation. No write path bypasses the audit plane.',
  },
];

export default function GovernancePage() {
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
            Architecture · Governance
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
            Nothing ships without validation.
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
            Sentinel reviews every PR and every synthesis output against 8 explicit criteria. Steward
            handles escalations that exceed Sentinel&apos;s authority. Neither agent improvises — they
            apply defined rules and document their reasoning.
          </p>
        </PaperContainer>
      </section>

      {/* Technical body */}
      <section style={{ paddingTop: '64px', paddingBottom: '80px' }}>
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
                marginBottom: '20px',
                letterSpacing: '-0.01em',
              }}
            >
              Sentinel&apos;s 8-criterion auto-approval gate
            </h2>
            <p style={{ marginBottom: '32px' }}>
              Sentinel reviews every code change and every synthesis output before it reaches a
              stakeholder or merges to production. Auto-approval requires all 8 criteria to pass. A
              single failure triggers a documented hold. Sentinel does not issue partial approvals.
            </p>

            <div style={{ marginBottom: '40px' }}>
              {SENTINEL_CRITERIA.map((criterion) => (
                <div
                  key={criterion.id}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '28px 1fr',
                    gap: '12px',
                    marginBottom: '20px',
                    paddingBottom: '20px',
                    borderBottom: '1px solid var(--pub-rule, rgba(136,135,128,0.25))',
                  }}
                >
                  <span
                    style={{
                      fontFamily: 'var(--pub-font-mono, monospace)',
                      fontSize: '11px',
                      color: 'var(--pub-stone, #888780)',
                      paddingTop: '3px',
                    }}
                  >
                    {criterion.id.toString().padStart(2, '0')}
                  </span>
                  <div>
                    <p
                      style={{
                        fontFamily: 'var(--pub-font-mono, monospace)',
                        fontSize: '13px',
                        fontWeight: 600,
                        color: 'var(--pub-ink, #000)',
                        marginBottom: '4px',
                      }}
                    >
                      {criterion.label}
                    </p>
                    <p style={{ fontSize: '14px', lineHeight: 1.5 }}>{criterion.description}</p>
                  </div>
                </div>
              ))}
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
              Why agentic governance matters
            </h2>
            <p style={{ marginBottom: '20px' }}>
              AbarVa is an AI-program product — it uses AI to help customers manage AI programs.
              The governance layer is not an afterthought applied to AI outputs; it is the mechanism
              by which the system maintains credibility with enterprise customers who cannot afford
              to discover governance failures in production.
            </p>
            <p style={{ marginBottom: '20px' }}>
              Sentinel reviews every PR not because human reviewers would miss things, but because
              Sentinel&apos;s review is systematic, documented, and repeatable. A human reviewer who
              forgets to check citation accuracy on a Tuesday afternoon is not a governance failure —
              it is normal. Sentinel never forgets criterion 4. The consistency of agentic review is
              what makes it valuable alongside human review, not in place of it.
            </p>
            <p style={{ marginBottom: '20px' }}>
              The criteria are explicit and versioned. When Sentinel&apos;s criteria change, the change
              is documented, the reason is recorded, and all prior reviews remain attributable to
              the criteria version in effect at the time. This is a compliance requirement for
              customers in regulated industries: an AI system that changes its governance criteria
              silently cannot be audited.
            </p>

            <h2
              style={{
                fontFamily: 'var(--pub-font-serif, serif)',
                fontSize: '28px',
                fontWeight: 500,
                color: 'var(--pub-ink, #000)',
                marginBottom: '20px',
                letterSpacing: '-0.01em',
                marginTop: '40px',
              }}
            >
              Steward&apos;s escalation rules
            </h2>
            <p style={{ marginBottom: '20px' }}>
              When Sentinel&apos;s auto-approval authority ends, Steward&apos;s begins. Steward handles four
              classes of escalation: compliance decisions that require rule citation, cross-tenant
              conflicts that require policy interpretation, budget threshold breaches that require
              CFO-level approval, and any decision where Sentinel&apos;s criteria are silent.
            </p>
            <p style={{ marginBottom: '20px' }}>
              Steward applies rules and cites them. An escalation that Steward routes to a human
              includes: the governance rule triggered, the specific section cited, the decision
              options available, and the recommended path. Steward does not make final decisions on
              escalations that exceed its authority — it prepares the decision package for the human
              who does.
            </p>
            <p style={{ marginBottom: '40px' }}>
              Steward&apos;s escalation rules are audited quarterly. Customers with custom governance
              requirements can configure tenant-specific Steward rules that override the defaults for
              their programs. Custom rules are versioned and scoped to the tenant — they cannot
              affect other tenants&apos; escalation behavior.
            </p>

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
                Sentinel reviews every PR vs. selective review
              </h3>
              <p>
                Sentinel reviews every PR; false-positive holds are the cost of catching real
                breaks. A selective review system — where Sentinel only reviews changes to
                sensitive paths — would reduce false positives but introduce a coverage gap. We have
                seen category-1 failures (brand voice breaks, citation inaccuracies) introduced in
                files that a selective review system would not have covered. Universal review
                eliminates the coverage gap. The engineering cost of resolving a false-positive hold
                is measured in minutes; the customer cost of a real break reaching production is
                measured in trust.
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
                8 criteria vs. simpler gating
              </h3>
              <p>
                Eight criteria is more complex than a two-criterion gate (type-check and test pass).
                We chose 8 because the additional criteria cover failure modes that type-checking
                and tests cannot catch: brand voice drift, citation inaccuracy, and trade-off
                documentation gaps. These are the failure modes that matter to AbarVa&apos;s customers
                — not runtime errors, but reasoning errors. A governance system that only catches
                runtime failures is not sufficient for an AI-program product.
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
                Versioned criteria vs. continuously evolving criteria
              </h3>
              <p>
                Versioning governance criteria means changes to Sentinel&apos;s behavior require explicit
                decisions, not incremental model tuning. This slows adaptation: if a new failure
                mode emerges, adding a criterion to Sentinel takes a governance change cycle, not
                just a prompt update. We accept this friction because it ensures that governance
                changes are visible, documented, and auditable. An AI governance system whose rules
                drift silently with model updates cannot be relied on by regulated enterprises.
              </p>
            </div>
          </div>
        </PaperContainer>
      </section>
    </div>
  );
}
