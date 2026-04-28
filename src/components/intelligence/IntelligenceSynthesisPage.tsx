import Link from 'next/link';
import { AppShell } from '@/components/shell/AppShell';
import { AgentColumn } from '@/components/shell/AgentColumn';
import { SynthesisOutput } from '@/components/intelligence/SynthesisOutput';
import { SHELL } from '@/lib/shell/shell-tokens';
import type { IntelligenceSynthesisPageView } from '@/lib/intelligence/intelligence-i6-view';

export function IntelligenceSynthesisPage({ view }: { view: IntelligenceSynthesisPageView }) {
  return (
    <AppShell
      surface="intelligence"
      topBarProps={{ tenantName: 'Apex Retail Group', showLocked: true, context: 'Intelligence · Atlas synthesis' }}
    >
      <AgentColumn
        agent={{ initials: 'At', name: 'Atlas', role: 'Synthesizer' }}
        quote={`Deterministic synthesis ready. ${view.result.wordCount} words, ${view.result.citations.length} corpus citations, no live model call.`}
        agentContext="Atlas · deterministic synthesis · I6"
        actions={[
          { letter: 'A', text: 'Review cited primitives', detail: 'Inspect the corpus IDs used in this answer' },
          { letter: 'B', text: 'Open authoring intake', detail: 'Turn this synthesis into a candidate pattern draft' },
          { letter: 'C', text: 'Return to library', detail: 'Back to canonical Intelligence index' },
        ]}
        surface="intelligence"
      />
      <main style={{ flex: 1, overflowY: 'auto', background: SHELL.PAPER, padding: '32px 48px' }}>
        <div style={{ maxWidth: 920, display: 'grid', gap: 18 }}>
          <div>
            <div style={{ fontFamily: SHELL.MONO, fontSize: 10, letterSpacing: '0.18em', textTransform: 'uppercase', color: SHELL.INK_MUTED }}>
              INT-FLW-SYNTHESIZE · Atlas deterministic flow
            </div>
            <h1 style={{ fontFamily: SHELL.SERIF, fontSize: 32, margin: '8px 0', color: SHELL.INK }}>Atlas synthesis</h1>
            <p style={{ fontFamily: SHELL.SANS, fontSize: 14, lineHeight: 1.6, color: SHELL.INK_MUTED, margin: 0 }}>
              Query: {view.query}
            </p>
          </div>

          <SynthesisOutput result={view.result} />

          <section style={cardStyle} aria-label="Atlas synthesis guardrails">
            <h2 style={sectionTitle}>Guardrails</h2>
            <ul style={listStyle}>
              {view.guardrails.map((guardrail) => <li key={guardrail}>{guardrail}</li>)}
            </ul>
          </section>

          <section style={cardStyle} aria-label="Suggested synthesis queries">
            <h2 style={sectionTitle}>Suggested queries</h2>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
              {view.suggestedQueries.map((query) => (
                <Link key={query.href} href={query.href} style={linkPill}>{query.label}</Link>
              ))}
              <Link href="/intelligence/author" style={linkPill}>Open authoring intake</Link>
            </div>
          </section>
        </div>
      </main>
    </AppShell>
  );
}

const cardStyle = {
  background: SHELL.CARD_WHITE,
  border: `1px solid ${SHELL.CARD_LINE}`,
  borderRadius: 12,
  padding: 18,
} as const;

const sectionTitle = {
  fontFamily: SHELL.SERIF,
  fontSize: 20,
  margin: '0 0 10px',
  color: SHELL.INK,
} as const;

const listStyle = {
  margin: 0,
  paddingLeft: 18,
  fontFamily: SHELL.SANS,
  fontSize: 14,
  lineHeight: 1.7,
  color: SHELL.INK,
} as const;

const linkPill = {
  border: `1px solid ${SHELL.INK}`,
  borderRadius: 999,
  padding: '8px 12px',
  fontFamily: SHELL.MONO,
  fontSize: 10,
  letterSpacing: '0.08em',
  textTransform: 'uppercase',
  textDecoration: 'none',
  color: SHELL.INK,
} as const;
