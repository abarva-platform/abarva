import type { Metadata } from 'next';
import { buildPageMetadata } from '@/lib/public-site/seo-defaults';
import { CANONICAL_URLS } from '@/lib/public-site/canonical-urls';
import { KnowledgeFabricDiagram } from '@/components/public-site/KnowledgeFabricDiagram';
import { PaperContainer } from '@/components/public-site/PaperContainer';

export const metadata: Metadata = buildPageMetadata({
  title: 'The 5-store knowledge fabric',
  description:
    'Relational, vector, graph, object, and evidence stores operating as a unified corpus. How AbarVa stores and retrieves knowledge for AI program reasoning.',
  openGraph: { url: CANONICAL_URLS.architecture('knowledge-fabric') },
});

export default function KnowledgeFabricPage() {
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
            Architecture · Knowledge plane
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
            Five stores. One corpus.
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
            AbarVa&apos;s knowledge plane runs five specialized stores against a single query. Each store
            answers a different question about what the system knows.
          </p>
        </PaperContainer>
      </section>

      {/* Diagram */}
      <section style={{ paddingTop: '64px', paddingBottom: '48px' }}>
        <PaperContainer>
          <KnowledgeFabricDiagram />
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
                marginBottom: '20px',
                letterSpacing: '-0.01em',
              }}
            >
              The five stores
            </h2>

            {/* Relational */}
            <div style={{ marginBottom: '32px' }}>
              <h3
                style={{
                  fontFamily: 'var(--pub-font-mono, monospace)',
                  fontSize: '13px',
                  fontWeight: 600,
                  color: 'var(--pub-ink, #000)',
                  marginBottom: '8px',
                  letterSpacing: '0.02em',
                }}
              >
                1. Relational DB — structured program data
              </h3>
              <p style={{ marginBottom: '12px' }}>
                PostgreSQL holds all structured program data: program definitions, phase records,
                stakeholder assignments, signal configurations, and pattern references. This is the
                canonical source of truth for anything that has a schema. Every entity in the system
                — programs, patterns, signals, users, tenants — lives here first.
              </p>
              <p>
                Relational data answers precise, bounded questions: which phase is this program in,
                who approved the last milestone, which patterns were applied to this decision. It
                does not answer fuzzy questions — that is the vector store&apos;s job.
              </p>
            </div>

            {/* Vector */}
            <div style={{ marginBottom: '32px' }}>
              <h3
                style={{
                  fontFamily: 'var(--pub-font-mono, monospace)',
                  fontSize: '13px',
                  fontWeight: 600,
                  color: 'var(--pub-ink, #000)',
                  marginBottom: '8px',
                  letterSpacing: '0.02em',
                }}
              >
                2. Vector Store — semantic search
              </h3>
              <p style={{ marginBottom: '12px' }}>
                pgvector, colocated with the relational database, stores embeddings for every
                pattern, signal, synthesis output, and document ingested. When Atlas runs a
                synthesis, the first retrieval pass is a cosine similarity search against the vector
                store — this surfaces semantically related content that an exact-match query would
                miss.
              </p>
              <p>
                Vector retrieval answers questions like &quot;what patterns are conceptually related to
                this query?&quot; and &quot;which past synthesis outputs addressed a similar problem?&quot; It
                operates on meaning, not structure. The 60-pattern corpus and 30-signal library are
                all indexed here.
              </p>
            </div>

            {/* Graph */}
            <div style={{ marginBottom: '32px' }}>
              <h3
                style={{
                  fontFamily: 'var(--pub-font-mono, monospace)',
                  fontSize: '13px',
                  fontWeight: 600,
                  color: 'var(--pub-ink, #000)',
                  marginBottom: '8px',
                  letterSpacing: '0.02em',
                }}
              >
                3. Graph DB — pattern relationships
              </h3>
              <p style={{ marginBottom: '12px' }}>
                A graph database (currently implemented via adjacency tables in PostgreSQL, with a
                native graph DB planned for v2) stores the relationships between patterns, signals,
                and contradictions. Patterns cite each other; signals reinforce or contradict other
                signals; decisions create chains of evidence.
              </p>
              <p>
                Graph traversal answers questions that neither relational joins nor vector search can
                answer efficiently: &quot;given this pattern, what other patterns does it depend on?&quot;,
                &quot;which signals cluster together around this contradiction?&quot; The synthesis pipeline
                uses graph traversal as its second retrieval pass, after semantic vector search.
              </p>
            </div>

            {/* Object */}
            <div style={{ marginBottom: '32px' }}>
              <h3
                style={{
                  fontFamily: 'var(--pub-font-mono, monospace)',
                  fontSize: '13px',
                  fontWeight: 600,
                  color: 'var(--pub-ink, #000)',
                  marginBottom: '8px',
                  letterSpacing: '0.02em',
                }}
              >
                4. Object Store — documents and artifacts
              </h3>
              <p style={{ marginBottom: '12px' }}>
                Vercel Blob (or S3-compatible storage in self-hosted deployments) holds raw
                documents, uploaded artifacts, annotated screenshots, and exported program reports.
                These are binary or large-text objects that do not belong in a relational table.
              </p>
              <p>
                Object store access is always mediated through the data plane&apos;s JWT scope: a user
                can only retrieve objects associated with their tenant. Pre-signed URLs have a
                4-hour TTL — shorter than document expiry, longer than JWT TTL — to balance security
                and usability.
              </p>
            </div>

            {/* Evidence */}
            <div style={{ marginBottom: '48px' }}>
              <h3
                style={{
                  fontFamily: 'var(--pub-font-mono, monospace)',
                  fontSize: '13px',
                  fontWeight: 600,
                  color: 'var(--pub-ink, #000)',
                  marginBottom: '8px',
                  letterSpacing: '0.02em',
                }}
              >
                5. Evidence Ledger — immutable audit trail
              </h3>
              <p style={{ marginBottom: '12px' }}>
                An append-only PostgreSQL table (enforced via trigger) records every synthesis
                output, every pattern citation, every agent decision, and every human approval. The
                evidence ledger is what makes Atlas&apos;s citation claims verifiable: every synthesis
                output points to specific ledger entries that were used to generate it.
              </p>
              <p>
                The fourth retrieval pass in the synthesis pipeline checks the evidence ledger for
                contradictions: if a prior synthesis for the same tenant reached a different
                conclusion on the same question, Atlas surfaces the contradiction rather than
                suppressing it. This is the &quot;10 contradictions&quot; in the AbarVa positioning — they
                are not bugs, they are the product.
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
                PostgreSQL + pgvector vs. dedicated vector infrastructure
              </h3>
              <p>
                We chose PostgreSQL + pgvector for the relational and vector layers to minimize
                operational complexity, accepting some vector retrieval performance vs. a dedicated
                Pinecone or Weaviate cluster. At 60 patterns and 30 signals, the corpus is small
                enough that pgvector&apos;s approximate nearest-neighbor latency is indistinguishable
                from a dedicated service. At 10,000+ embeddings — the scale where Pinecone becomes
                worth its operational overhead — we will migrate the vector layer. That threshold
                does not constrain our current customers.
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
                Four retrieval passes vs. single unified retrieval
              </h3>
              <p>
                Running four retrieval passes in parallel adds latency to every synthesis request —
                typically 60–120ms over a single-pass retrieval. We accept this cost because each
                pass answers a different type of question. Collapsing them into a single retrieval
                would mean either missing semantic matches (no vector), missing relationship chains
                (no graph), or missing contradictions (no evidence ledger check). We chose
                completeness over latency.
              </p>
            </div>
          </div>
        </PaperContainer>
      </section>
    </div>
  );
}
