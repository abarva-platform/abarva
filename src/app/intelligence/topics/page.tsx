// /intelligence/topics · INT-1.7 placeholder
//
// "Browse topics" affordance from J0 lands here. The full topic
// browser is INT-2 territory (J1 oriented browse). Until then this
// page renders a placeholder with the AI-transformation topics from
// the design doc and a "coming soon" notice. Public route.

import Link from 'next/link';
import { AppShell } from '@/components/shell/AppShell';
import { SHELL } from '@/lib/shell/shell-tokens';

const TOPICS_PREVIEW: ReadonlyArray<{ title: string; thesis: string }> = [
  {
    title: 'AI use case portfolio management',
    thesis:
      'Most enterprises run AI as a collection of disconnected experiments. The portfolio discipline that converts those experiments into compounding value is rare.',
  },
  {
    title: 'Data foundation readiness',
    thesis:
      'Readiness is specific: who owns the data, how clean is it, can it move at the cadence the use case requires.',
  },
  {
    title: 'Vendor and platform decisions',
    thesis:
      'Vendor demos run on cherry-picked data. Buyer validation runs on the buyer\'s own data. The contracts that lock buyers in are written before that gap is exposed.',
  },
  {
    title: 'AI governance and risk',
    thesis:
      'The framework adoption rate is high. The operational adherence rate is low. The framework alone is not governance.',
  },
  {
    title: 'Pilot-to-production scaling',
    thesis:
      'The model is fine. The surrounding work — workflow, scale, operations — is what fails.',
  },
];

export const metadata = {
  title: 'Topics · Intelligence | AbarVa',
  description:
    'Browse AI transformation topics. Topic deep-dive surfaces land with INT-2.',
};

export default function IntelligenceTopicsPage() {
  return (
    <AppShell
      surface="intelligence"
      topBarProps={{
        tenantName: 'Apex Retail Group',
        showLocked: true,
        context: 'Intelligence · Topics',
      }}
    >
      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          minWidth: 0,
        }}
      >
        <div
          data-testid="intelligence-topics-page"
          style={{
            flex: 1,
            overflowY: 'auto',
            background: SHELL.PAPER,
            padding: '32px 48px 64px',
            maxWidth: 880,
            width: '100%',
            margin: '0 auto',
            boxSizing: 'border-box',
          }}
        >
          <nav
            aria-label="Breadcrumb"
            style={{
              fontFamily: SHELL.MONO,
              fontSize: 11,
              color: SHELL.INK_MUTED,
              marginBottom: 20,
            }}
          >
            <Link
              href="/intelligence"
              style={{
                color: SHELL.INK_SOFT,
                textDecoration: 'none',
              }}
            >
              ← Intelligence
            </Link>
            <span style={{ margin: '0 8px' }}>·</span>
            <span style={{ color: SHELL.INK_MUTED }}>Topics</span>
          </nav>

          <header style={{ marginBottom: 28 }}>
            <h1
              style={{
                fontFamily: SHELL.SERIF_DISPLAY,
                fontSize: 'clamp(22px, 3vw, 32px)',
                fontWeight: 400,
                color: SHELL.INK,
                margin: 0,
                lineHeight: 1.15,
                letterSpacing: '-0.015em',
              }}
            >
              AI transformation topics
            </h1>
            <p
              style={{
                fontFamily: SHELL.SANS,
                fontSize: 14,
                color: SHELL.INK_SOFT,
                lineHeight: 1.55,
                margin: '12px 0 0',
                maxWidth: 640,
              }}
            >
              What enterprises grapple with — organized by AbarVa&apos;s point
              of view, not as a wiki. Each topic surfaces a thesis up top and
              the corpus depth underneath.
            </p>
          </header>

          {/* Topic preview list */}
          <ul
            style={{
              margin: 0,
              padding: 0,
              listStyle: 'none',
              display: 'flex',
              flexDirection: 'column',
              gap: 14,
              marginBottom: 32,
            }}
          >
            {TOPICS_PREVIEW.map((topic) => (
              <li
                key={topic.title}
                style={{
                  background: SHELL.CARD_WHITE,
                  border: `1px solid ${SHELL.CARD_LINE}`,
                  borderRadius: 10,
                  padding: '14px 18px',
                }}
              >
                <h2
                  style={{
                    fontFamily: SHELL.SERIF,
                    fontSize: 17,
                    fontWeight: 400,
                    color: SHELL.INK,
                    margin: '0 0 6px',
                    lineHeight: 1.3,
                  }}
                >
                  {topic.title}
                </h2>
                <p
                  style={{
                    fontFamily: SHELL.SANS,
                    fontSize: 13,
                    color: SHELL.INK_SOFT,
                    lineHeight: 1.55,
                    margin: 0,
                  }}
                >
                  {topic.thesis}
                </p>
              </li>
            ))}
          </ul>

          {/* INT-2 notice */}
          <aside
            style={{
              padding: '14px 18px',
              background: SHELL.PAPER_SOFT,
              border: `1px dashed ${SHELL.CARD_LINE}`,
              borderRadius: 8,
              fontFamily: SHELL.SANS,
              fontSize: 13,
              color: SHELL.INK_SOFT,
              lineHeight: 1.55,
            }}
          >
            <strong style={{ color: SHELL.INK }}>Coming with INT-2:</strong>{' '}
            click into any topic to see AbarVa&apos;s thesis up top, the corpus
            patterns that ground it, the contradictions it surfaces, and the
            recent industry signals attached. Sentinel will be one click away
            with the topic loaded as conversation context.
          </aside>
        </div>
      </div>
    </AppShell>
  );
}
