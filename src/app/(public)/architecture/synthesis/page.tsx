import type { Metadata } from 'next';
import { buildPageMetadata } from '@/lib/public-site/seo-defaults';
import { CANONICAL_URLS } from '@/lib/public-site/canonical-urls';
import { PaperContainer } from '@/components/public-site/PaperContainer';

export const metadata: Metadata = buildPageMetadata({
  title: 'How Atlas synthesis works',
  description:
    '150 words. Every one cited. How Atlas retrieves from 5 stores, synthesizes with Claude, and enforces a hard word cap.',
  openGraph: { url: CANONICAL_URLS.architecture('synthesis') },
});

export default function SynthesisPage() {
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
            Architecture · Synthesis plane
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
            150 words. Every one cited.
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
            Atlas takes a query, retrieves from five stores in parallel, synthesizes with Claude,
            enforces a hard 150-word cap, and returns a cited brief. The cap is not a guideline —
            outputs that exceed it are truncated.
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
              The four retrieval passes
            </h2>
            <p style={{ marginBottom: '20px' }}>
              The synthesis pipeline runs 4 retrieval passes in parallel: semantic vector search,
              graph traversal for related patterns, relational lookup for program context, and
              evidence ledger check for contradictions. All four passes run concurrently — the
              synthesis step waits for all four before generating output. Partial results are not
              used.
            </p>
            <p style={{ marginBottom: '32px' }}>
              Each pass answers a different question about what the system knows relevant to the query:
            </p>

            <div style={{ marginBottom: '28px', paddingLeft: '20px', borderLeft: '3px solid #0066CC' }}>
              <h3
                style={{
                  fontFamily: 'var(--pub-font-mono, monospace)',
                  fontSize: '13px',
                  fontWeight: 600,
                  color: 'var(--pub-ink, #000)',
                  marginBottom: '8px',
                }}
              >
                Pass 1: Semantic vector search
              </h3>
              <p>
                A cosine similarity search against the 60-pattern corpus and 30-signal library
                embeddings. This surfaces patterns and signals that are conceptually related to the
                query even if they share no keywords with it. Typical retrieval: top-8 nearest
                neighbors by cosine similarity. The threshold is 0.72 — below that, Atlas considers
                the match too weak to cite.
              </p>
            </div>

            <div style={{ marginBottom: '28px', paddingLeft: '20px', borderLeft: '3px solid #0c1a3a' }}>
              <h3
                style={{
                  fontFamily: 'var(--pub-font-mono, monospace)',
                  fontSize: '13px',
                  fontWeight: 600,
                  color: 'var(--pub-ink, #000)',
                  marginBottom: '8px',
                }}
              >
                Pass 2: Graph traversal
              </h3>
              <p>
                A depth-2 traversal of the pattern relationship graph, starting from the patterns
                surfaced by pass 1. This finds patterns that are not semantically similar to the
                query but are structurally related to patterns that are — dependencies,
                contradictions, and reinforcing patterns that the vector search would miss.
                Traversal is bounded at depth 2 to prevent exponential graph fan-out.
              </p>
            </div>

            <div style={{ marginBottom: '28px', paddingLeft: '20px', borderLeft: '3px solid #888780' }}>
              <h3
                style={{
                  fontFamily: 'var(--pub-font-mono, monospace)',
                  fontSize: '13px',
                  fontWeight: 600,
                  color: 'var(--pub-ink, #000)',
                  marginBottom: '8px',
                }}
              >
                Pass 3: Relational program context
              </h3>
              <p>
                A direct query against the relational store for the current program&apos;s context:
                active phase, recent milestones, applied patterns, assigned stakeholders, and any
                configured signal thresholds. This grounds the synthesis in the specific program&apos;s
                situation rather than general corpus knowledge. A synthesis for a contact center AI
                program in phase 3 should reference that context; the relational pass makes this
                explicit.
              </p>
            </div>

            <div style={{ marginBottom: '48px', paddingLeft: '20px', borderLeft: '3px solid #0066CC' }}>
              <h3
                style={{
                  fontFamily: 'var(--pub-font-mono, monospace)',
                  fontSize: '13px',
                  fontWeight: 600,
                  color: 'var(--pub-ink, #000)',
                  marginBottom: '8px',
                }}
              >
                Pass 4: Evidence ledger contradiction check
              </h3>
              <p>
                A lookup against the evidence ledger for prior synthesis outputs on similar queries
                for the same tenant. If a prior synthesis reached a different conclusion on the same
                question, Atlas surfaces the contradiction explicitly in the output. This is not an
                error condition — it is a feature. The 10 contradictions in AbarVa&apos;s corpus exist
                because the evidence ledger has recorded real program outcomes that conflict with
                pattern recommendations.
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
              The 150-word cap
            </h2>
            <p style={{ marginBottom: '20px' }}>
              Atlas&apos;s synthesis output is capped at 150 words. This cap applies to the synthesized
              body text, not the citation list. A synthesis output may have 150 words of body text
              and an additional 50–100 words of citations, formatted separately.
            </p>
            <p style={{ marginBottom: '20px' }}>
              The cap is enforced at the output layer, not the generation layer. Atlas generates
              synthesis, counts words, and truncates at the sentence boundary before 150 words if
              the output exceeds the cap. Truncation is always at a sentence boundary — partial
              sentences are never returned. If truncation would eliminate a critical citation, Atlas
              restructures rather than truncating.
            </p>
            <p style={{ marginBottom: '20px' }}>
              150 words forces a specific discipline: Atlas cannot explain its way to a conclusion.
              It must state the conclusion and cite the evidence directly. This is intentional.
              AbarVa&apos;s customers are program stakeholders who need to act on synthesis, not read
              essays. A 150-word brief that states the most important pattern, the most relevant
              signal, and the key contradiction is more valuable to a CFO in a program review than
              a 600-word essay that builds toward the same conclusion.
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
                150-word cap vs. comprehensiveness
              </h3>
              <p>
                The 150-word cap forces precision over comprehensiveness. A synthesis that cannot be
                expressed in 150 words is either about multiple distinct questions (which should be
                separate synthesis requests) or is not precise enough about its conclusion. We
                accept the loss of nuance that a hard cap creates because the alternative —
                unbounded synthesis — produces outputs that stakeholders do not read in full and
                therefore do not act on. The cap is a design choice for usability, not a technical
                constraint.
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
                Four parallel passes vs. sequential retrieval
              </h3>
              <p>
                Parallel passes add infrastructure complexity — four concurrent queries with a
                synchronization barrier before synthesis. Sequential retrieval would be simpler to
                implement and debug. We chose parallel passes because the synthesis quality
                difference is significant: vector search alone misses structural patterns; relational
                context alone misses semantic relevance; evidence ledger alone misses the current
                pattern corpus. The quality gap justifies the complexity.
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
                Explicit contradiction surfacing vs. conflict resolution
              </h3>
              <p>
                When the evidence ledger contradiction check finds a conflict with a prior synthesis,
                Atlas surfaces it rather than resolving it. Most AI systems would attempt to
                synthesize a coherent answer from contradictory inputs. We chose to surface the
                contradiction because resolution requires human judgment: the prior synthesis may
                have been wrong, the current query may be in a different context, or the
                contradiction may be genuine. Pretending to resolve it would hide information from
                the stakeholder.
              </p>
            </div>
          </div>
        </PaperContainer>
      </section>
    </div>
  );
}
