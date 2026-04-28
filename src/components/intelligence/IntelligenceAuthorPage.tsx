import Link from 'next/link';
import { AppShell } from '@/components/shell/AppShell';
import { AgentColumn } from '@/components/shell/AgentColumn';
import { SHELL } from '@/lib/shell/shell-tokens';
import type { IntelligenceAuthorPageView } from '@/lib/intelligence/intelligence-i6-view';

export function IntelligenceAuthorPage({ view }: { view: IntelligenceAuthorPageView }) {
  return (
    <AppShell
      surface="intelligence"
      topBarProps={{ tenantName: 'Apex Retail Group', showLocked: true, context: 'Intelligence · Pattern authoring' }}
    >
      <AgentColumn
        agent={{ initials: 'At', name: 'Atlas', role: 'Authoring' }}
        quote="Authoring intake is staged. Atlas can draft framing; Sentinel still validates promotion readiness before the pattern enters the library."
        agentContext="Atlas · deterministic authoring intake · I6"
        actions={[
          { letter: 'A', text: 'Draft candidate framing', detail: 'Use deterministic fields to frame the candidate pattern' },
          { letter: 'B', text: 'Check evidence readiness', detail: 'Confirm provenance before Sentinel review' },
          { letter: 'C', text: 'Open synthesis flow', detail: 'Use Atlas synthesis to ground the draft' },
        ]}
        surface="intelligence"
      />
      <main style={{ flex: 1, overflowY: 'auto', background: SHELL.PAPER, padding: '32px 48px' }}>
        <div style={{ maxWidth: 920, display: 'grid', gap: 18 }}>
          <div>
            <div style={{ fontFamily: SHELL.MONO, fontSize: 10, letterSpacing: '0.18em', textTransform: 'uppercase', color: SHELL.INK_MUTED }}>
              INT-FLW-AUTHOR · deterministic intake
            </div>
            <h1 style={{ fontFamily: SHELL.SERIF, fontSize: 32, margin: '8px 0', color: SHELL.INK }}>{view.title}</h1>
            <p style={{ fontFamily: SHELL.SANS, fontSize: 14, lineHeight: 1.6, color: SHELL.INK_MUTED, margin: 0 }}>
              This page formalizes the submission flow without writing to the pattern registry.
            </p>
          </div>

          <section style={cardStyle} aria-label="Pattern authoring fields">
            <h2 style={sectionTitle}>Authoring fields</h2>
            <div style={{ display: 'grid', gap: 10 }}>
              {view.fields.map((field) => (
                <div key={field.label} style={{ borderTop: `1px solid ${SHELL.CARD_LINE_SOFT}`, paddingTop: 10 }}>
                  <div style={{ fontFamily: SHELL.MONO, fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase', color: SHELL.INK_MUTED }}>
                    {field.label} · {field.state}
                  </div>
                  <div style={{ fontFamily: SHELL.SANS, fontSize: 14, color: SHELL.INK, marginTop: 4 }}>{field.value}</div>
                </div>
              ))}
            </div>
          </section>

          <section style={cardStyle} aria-label="Authoring guardrails">
            <h2 style={sectionTitle}>Guardrails</h2>
            <ul style={listStyle}>{view.guardrails.map((item) => <li key={item}>{item}</li>)}</ul>
          </section>

          <section style={cardStyle} aria-label="Authoring next steps">
            <h2 style={sectionTitle}>Next steps</h2>
            <ol style={listStyle}>{view.nextSteps.map((step) => <li key={step}>{step}</li>)}</ol>
            <div style={{ marginTop: 14, display: 'flex', gap: 10 }}>
              <Link href="/intelligence/synthesize" style={linkPill}>Open synthesis</Link>
              <Link href="/intelligence?filter=candidate" style={linkPill}>View candidates</Link>
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
