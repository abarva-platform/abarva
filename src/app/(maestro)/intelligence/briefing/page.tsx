import Link from 'next/link';
import { PageShell } from '@/components/shared/layout/PageShell';
import { Body } from '@/components/shared/typography/Body';
import { SectionHeading } from '@/components/shared/typography/SectionHeading';
import { getActiveClientRow } from '@/lib/active-client';

const TEAL = '#14B8A6';
const BORDER = '0.5px solid rgba(255,255,255,0.08)';
const PANEL = 'rgba(255,255,255,0.03)';
const MUTED = 'rgba(245, 245, 240, 0.72)';

function ActionCard({
  title,
  body,
  href,
  cta,
}: {
  title: string;
  body: string;
  href: string;
  cta: string;
}) {
  return (
    <Link
      href={href}
      style={{
        display: 'block',
        padding: 20,
        borderRadius: 18,
        border: BORDER,
        background: PANEL,
        textDecoration: 'none',
        color: 'inherit',
      }}
    >
      <div
        style={{
          fontFamily: 'JetBrains Mono, monospace',
          fontSize: 11,
          letterSpacing: '0.14em',
          textTransform: 'uppercase',
          color: TEAL,
          marginBottom: 12,
        }}
      >
        Briefing path
      </div>
      <SectionHeading size="md" style={{ marginBottom: 10 }}>
        {title}
      </SectionHeading>
      <Body tone="secondary" size="sm" style={{ marginBottom: 14 }}>
        {body}
      </Body>
      <div
        style={{
          fontFamily: 'JetBrains Mono, monospace',
          fontSize: 11,
          letterSpacing: '0.12em',
          textTransform: 'uppercase',
          color: TEAL,
        }}
      >
        {cta}
      </div>
    </Link>
  );
}

export default async function IntelligenceBriefingPage() {
  const activeClient = await getActiveClientRow();

  return (
    <PageShell width="standard" padding="comfortable">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
        <div>
          <div
            style={{
              fontFamily: 'JetBrains Mono, monospace',
              fontSize: 11,
              letterSpacing: '0.14em',
              textTransform: 'uppercase',
              color: TEAL,
              marginBottom: 10,
            }}
          >
            Intelligence briefing
          </div>
          <SectionHeading size="lg" style={{ marginBottom: 12 }}>
            Executive briefing path
          </SectionHeading>
          <Body size="lg" style={{ maxWidth: 760, marginBottom: 12 }}>
            The live briefing experience currently opens from the signed-in home surface. This route gives you a clean
            starting point into that same workflow without dropping you onto a missing page.
          </Body>
          <Body tone="secondary" size="sm" style={{ maxWidth: 760 }}>
            {activeClient
              ? `Active client context is ${activeClient.name}. The fastest path is the home briefing, then library and ask for the supporting evidence behind it.`
              : 'No active client context is pinned yet. Start from Home, then move into Library or Ask once the tenant is set.'}
          </Body>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
            gap: 18,
          }}
        >
          <ActionCard
            title="Open the live briefing"
            body="Home is where the generated daily briefing, portfolio glance, and stakeholder lens currently live."
            href="/home"
            cta="Go to home"
          />
          <ActionCard
            title="Inspect the evidence base"
            body="Library is the fastest way to inspect the patterns, topics, research, benchmarks, and vendor sources sitting behind a briefing."
            href="/intelligence/library"
            cta="Browse library"
          />
          <ActionCard
            title="Interrogate a claim"
            body="Ask is the best path when you want a focused answer about a vendor, benchmark, regulation, or linked pattern."
            href="/intelligence/ask"
            cta="Ask intelligence"
          />
        </div>

        <div
          style={{
            padding: 18,
            borderRadius: 18,
            border: BORDER,
            background: 'rgba(20,184,166,0.08)',
          }}
        >
          <div
            style={{
              fontFamily: 'JetBrains Mono, monospace',
              fontSize: 11,
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              color: TEAL,
              marginBottom: 8,
            }}
          >
            What is live now
          </div>
          <Body tone="secondary" size="sm">
            Daily briefing composition, library navigation, and ask flows are live. Richer standalone briefing archives
            can land later without exposing a broken route in the meantime.
          </Body>
          <div style={{ marginTop: 10, color: MUTED, fontSize: 13 }}>
            Prefer a path with evidence attached: Home for the readout, Library for the backing material, Ask for the
            pressure test.
          </div>
        </div>
      </div>
    </PageShell>
  );
}
