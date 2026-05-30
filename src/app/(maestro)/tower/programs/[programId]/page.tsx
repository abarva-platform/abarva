// Real Tower program detail route — replaces the prior redirect-shell.
//
// Per Tower audit §5.3 ("drilldowns disguise as same-page state"), this
// page used to bounce back to `/tower?detail=…`. It is now a first-
// class App Router drilldown: programs resolve through the tenant-
// scoped `getProgramById` query, render an honest detail panel, and
// surface the same decide-and-route action row as the Tower portfolio
// cards so a CIO can Fund / Pause / Kill in-place.
//
// Empty/locked states use the locked AbarVa palette (#F8F7F4 cream,
// Fraunces serif, Inter body, black/ghost buttons). No new colours.

import Link from 'next/link';
import { requireTenancy } from '@/lib/auth/tenancy';
import { getProgramById } from '@/lib/programs/queries';
import { TowerDecisionActionRow } from '@/components/tower/TowerDecisionActionRow';

export const metadata = { title: 'Tower · Program · AbarVa' };
export const dynamic = 'force-dynamic';

const CREAM = '#F8F7F4';
const INK = '#1A1A18';
const INK_SOFT = '#5b5148';
const RULE = 'rgba(10,10,11,0.12)';
const SERIF = 'var(--font-fraunces), "Fraunces", Georgia, serif';
const SANS = 'var(--font-inter), "Inter", system-ui, sans-serif';
const MONO = 'ui-monospace, SFMono-Regular, Menlo, monospace';

function Frame({ children }: { children: React.ReactNode }) {
  return (
    <main
      style={{
        minHeight: '100%',
        background: CREAM,
        color: INK,
        fontFamily: SANS,
        padding: '32px clamp(20px, 4vw, 56px)',
      }}
    >
      <div style={{ maxWidth: 960, margin: '0 auto' }}>{children}</div>
    </main>
  );
}

function Breadcrumb() {
  return (
    <nav
      aria-label="Tower breadcrumb"
      style={{
        fontFamily: MONO,
        fontSize: 10,
        letterSpacing: '0.14em',
        textTransform: 'uppercase',
        color: INK_SOFT,
        marginBottom: 16,
      }}
    >
      <Link href="/tower" style={{ color: INK_SOFT, textDecoration: 'none' }}>
        Tower
      </Link>
      <span style={{ margin: '0 8px' }}>›</span>
      <Link href="/tower/portfolio" style={{ color: INK_SOFT, textDecoration: 'none' }}>
        Portfolio
      </Link>
      <span style={{ margin: '0 8px' }}>›</span>
      <span style={{ color: INK }}>Program</span>
    </nav>
  );
}

function NavLink({
  href,
  label,
  primary = false,
}: {
  href: string;
  label: string;
  primary?: boolean;
}) {
  return (
    <Link
      href={href}
      style={{
        display: 'inline-block',
        padding: '8px 14px',
        borderRadius: 6,
        border: `1px solid ${INK}`,
        background: primary ? INK : 'transparent',
        color: primary ? '#ffffff' : INK,
        textDecoration: 'none',
        fontFamily: MONO,
        fontSize: 11,
        letterSpacing: '0.06em',
        textTransform: 'uppercase',
        fontWeight: 700,
      }}
    >
      {label}
    </Link>
  );
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div
      style={{
        border: `1px solid ${RULE}`,
        borderRadius: 8,
        background: '#ffffff',
        padding: '10px 12px',
      }}
    >
      <div
        style={{
          fontFamily: MONO,
          fontSize: 9,
          letterSpacing: '0.14em',
          textTransform: 'uppercase',
          color: INK_SOFT,
          fontWeight: 700,
        }}
      >
        {label}
      </div>
      <div style={{ marginTop: 4, fontSize: 15, fontWeight: 600, color: INK }}>
        {value}
      </div>
    </div>
  );
}

export default async function TowerProgramDetailPage({
  params,
}: {
  params: Promise<{ programId: string }>;
}) {
  const { programId } = await params;

  let tenancy;
  try {
    tenancy = await requireTenancy();
  } catch {
    return (
      <Frame>
        <Breadcrumb />
        <header style={{ marginBottom: 20 }}>
          <h1 style={{ fontFamily: SERIF, fontSize: 28, fontWeight: 400, margin: 0 }}>
            Program detail unavailable
          </h1>
          <p style={{ color: INK_SOFT, marginTop: 8 }}>
            Sign-in is required to view this program.
          </p>
        </header>
        <NavLink href="/tower" label="Back to Tower" />
      </Frame>
    );
  }

  const program = await getProgramById(tenancy, programId).catch(() => null);

  if (!program) {
    return (
      <Frame>
        <Breadcrumb />
        <header style={{ marginBottom: 20 }}>
          <h1 style={{ fontFamily: SERIF, fontSize: 28, fontWeight: 400, margin: 0 }}>
            Program not found
          </h1>
          <p style={{ color: INK_SOFT, marginTop: 8, lineHeight: 1.5 }}>
            No program with id <code>{programId}</code> is visible for your
            tenant. This either means the program hasn&apos;t been originated
            yet, has been archived, or your role does not include access.
            Open the portfolio to see the programs you can review.
          </p>
        </header>
        <NavLink href="/tower/portfolio" label="Open portfolio" primary />
      </Frame>
    );
  }

  const phase =
    program.currentPhase != null ? `P${program.currentPhase}` : '—';
  const status = program.status ?? program.lifecycleState ?? '—';
  const target = program.targetOutcome ?? program.problemStatement ?? null;

  return (
    <Frame>
      <Breadcrumb />
      <header style={{ marginBottom: 22 }}>
        <div
          style={{
            fontFamily: MONO,
            fontSize: 10,
            letterSpacing: '0.16em',
            textTransform: 'uppercase',
            color: INK_SOFT,
            fontWeight: 700,
          }}
        >
          Program · Tower drilldown
        </div>
        <h1
          style={{
            fontFamily: SERIF,
            fontSize: 32,
            fontWeight: 400,
            margin: '6px 0 0',
            lineHeight: 1.2,
          }}
        >
          {program.name}
        </h1>
        {target ? (
          <p style={{ marginTop: 10, color: INK_SOFT, fontSize: 15, lineHeight: 1.55 }}>
            {target}
          </p>
        ) : null}
      </header>

      <section
        aria-label="Program key facts"
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: 12,
          marginBottom: 22,
        }}
      >
        <Fact label="Phase" value={phase} />
        <Fact label="Status" value={status} />
        <Fact
          label="Archetype"
          value={program.archetype ? program.archetype.replace(/_/g, ' ') : '—'}
        />
        <Fact
          label="Origin"
          value={program.originSource ?? '—'}
        />
      </section>

      <section
        aria-label="Tower decide and route"
        style={{
          border: `1px solid ${RULE}`,
          borderRadius: 10,
          background: '#ffffff',
          padding: '14px 16px',
          marginBottom: 22,
        }}
      >
        <div
          style={{
            fontFamily: MONO,
            fontSize: 10,
            letterSpacing: '0.16em',
            textTransform: 'uppercase',
            color: INK_SOFT,
            fontWeight: 700,
          }}
        >
          Decide-and-route
        </div>
        <p style={{ marginTop: 6, fontSize: 13, color: INK_SOFT, lineHeight: 1.5 }}>
          Funding, pause, and kill decisions made here are audit-logged
          through the existing <code>program_audit_log</code> table and
          flow into the cross-module trace viewer.
        </p>
        <TowerDecisionActionRow programId={program.id} subjectLabel={program.name} />
      </section>

      <section aria-label="Tower navigation links" style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <NavLink href={`/programs/${program.id}`} label="Open in Programs" primary />
        <NavLink href={`/strategic-moves/${program.id}/trace`} label="Cross-module trace" />
        <NavLink href="/tower" label="Back to Tower" />
      </section>
    </Frame>
  );
}
