import Link from 'next/link';
import { getServerSupabase } from '@/lib/supabase-server';

export const dynamic = 'force-dynamic';

const INK = '#F5F5F0';
const TEAL = '#2DD4C8';
const MUTE = 'rgba(245, 245, 240, 0.72)';
const BLUE = '#4DA3FF';
const AMBER = '#F59E0B';
const GREEN = '#3FB27F';
const CORAL = '#FF6B4A';
const BORDER = '0.5px solid rgba(255,255,255,0.08)';
const PANEL_BG = 'rgba(255,255,255,0.02)';
const MONO = 'JetBrains Mono, monospace';

async function loadPlatformMetrics() {
  const sb = getServerSupabase();
  const [clientsRes, personsRes, techRes, sourcesRes] = await Promise.all([
    sb.from('clients').select('id, name, industry_code', { count: 'exact' }),
    sb.from('persons').select('id', { count: 'exact', head: true }),
    sb.from('tech_stack_items').select('category', { count: 'exact' }),
    sb.from('knowledge_sources').select('status', { count: 'exact' }).throwOnError().then(
      (r) => r,
      () => ({ count: 0, data: null as null | Array<{ status: string }> }),
    ),
  ]);

  const clients = (clientsRes.data as Array<{ id: string; name: string; industry_code: string | null }> | null) ?? [];
  const techRows = (techRes.data as Array<{ category: string }> | null) ?? [];
  const categorySet = new Set(techRows.map((r) => r.category));

  // Domain coverage — check per-client whether each key table has rows.
  const coverageChecks = await Promise.all(
    clients.map(async (c) => {
      const [inv, apps, data, cost, eng, tech] = await Promise.all([
        sb.from('use_cases').select('id', { count: 'exact', head: true }).eq('client_id', c.id),
        sb.from('applications').select('id', { count: 'exact', head: true }).eq('client_id', c.id),
        sb.from('data_sources').select('id', { count: 'exact', head: true }).eq('client_id', c.id),
        sb.from('cost_centers').select('id', { count: 'exact', head: true }).eq('client_id', c.id),
        sb.from('eng_teams').select('id', { count: 'exact', head: true }).eq('client_id', c.id),
        sb.from('tech_stack_items').select('id', { count: 'exact', head: true }).eq('client_id', c.id),
      ]);
      const present = [inv, apps, data, cost, eng, tech].filter((r) => (r.count ?? 0) > 0).length;
      return { clientId: c.id, clientName: c.name, industry: c.industry_code, present, of: 6 };
    }),
  );

  const sourcesCount = typeof sourcesRes.count === 'number' ? sourcesRes.count : 0;

  return {
    clientCount: clientsRes.count ?? clients.length,
    personCount: personsRes.count ?? 0,
    techStackTotal: techRes.count ?? techRows.length,
    techCategoryCount: categorySet.size,
    knowledgeSourceCount: sourcesCount,
    coverage: coverageChecks,
    clients,
  };
}

function Card({
  label,
  accent,
  href,
  hero,
  sub,
  children,
}: {
  label: string;
  accent: string;
  href: string;
  hero: React.ReactNode;
  sub: React.ReactNode;
  children?: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      style={{
        display: 'block',
        padding: '18px 20px',
        background: PANEL_BG,
        border: BORDER,
        borderRadius: 10,
        color: INK,
        textDecoration: 'none',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
        <span style={{ width: 5, height: 5, borderRadius: '50%', background: accent }} />
        <span style={{ fontFamily: MONO, fontSize: 9, color: accent, letterSpacing: '0.14em', textTransform: 'uppercase' }}>
          {label}
        </span>
      </div>
      <div style={{ fontSize: 22, fontWeight: 500, color: INK, letterSpacing: '-0.01em' }}>{hero}</div>
      <div style={{ fontSize: 12, color: MUTE, marginTop: 4 }}>{sub}</div>
      {children}
    </Link>
  );
}

export default async function PlatformPage() {
  const m = await loadPlatformMetrics();
  const totalDomainsFed = m.coverage.reduce((s, c) => s + c.present, 0);
  const totalDomainsPossible = m.coverage.reduce((s, c) => s + c.of, 0);
  const coveragePct = totalDomainsPossible > 0 ? Math.round((totalDomainsFed / totalDomainsPossible) * 100) : 0;

  return (
    <div style={{ padding: '40px 40px 64px', width: '100%', maxWidth: 1800, margin: '0 auto', color: INK, fontFamily: 'DM Sans, sans-serif' }}>
      <div style={{ fontFamily: MONO, fontSize: 10, color: TEAL, letterSpacing: '0.14em', marginBottom: 10 }}>
        PLATFORM
      </div>
      <h1 style={{ fontFamily: 'Georgia, serif', fontSize: 32, fontWeight: 400, color: INK, margin: '0 0 6px' }}>
        Operational hub
      </h1>
      <p style={{ fontSize: 14, color: MUTE, marginBottom: 32, maxWidth: 720 }}>
        Data onboarding, users, integrations, observability, billing. The machinery behind the three products.
      </p>

      {/* Hero cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 12, marginBottom: 40 }}>
        <Card
          label="Data coverage"
          accent={coveragePct >= 75 ? GREEN : coveragePct >= 40 ? AMBER : CORAL}
          href="/tower/onboard"
          hero={`${coveragePct}%`}
          sub={`${totalDomainsFed} of ${totalDomainsPossible} core domains populated across ${m.clientCount} clients`}
        />
        <Card
          label="Users"
          accent={BLUE}
          href="/platform/users/new"
          hero={`${m.personCount}`}
          sub={`active persons · click to add`}
        />
        <Card
          label="Tech stack catalog"
          accent={TEAL}
          href="/tower/tech-stack"
          hero={`${m.techStackTotal}`}
          sub={`items across ${m.techCategoryCount} categories`}
        />
        <Card
          label="Knowledge sources"
          accent={AMBER}
          href="/intelligence/library"
          hero={`${m.knowledgeSourceCount}`}
          sub={m.knowledgeSourceCount === 0 ? 'awaiting ingestion · Tier 1-4 ready to run' : 'registered sources'}
        />
      </div>

      {/* Per-client coverage detail */}
      <section style={{ marginBottom: 40 }}>
        <div style={{ fontFamily: MONO, fontSize: 10, color: TEAL, letterSpacing: '0.14em', marginBottom: 12 }}>
          DATA COVERAGE PER CLIENT
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 10 }}>
          {m.coverage.map((c) => {
            const pct = (c.present / c.of) * 100;
            const color = pct >= 75 ? GREEN : pct >= 40 ? AMBER : CORAL;
            return (
              <div key={c.clientId} style={{ padding: 14, border: BORDER, borderRadius: 8, background: PANEL_BG }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 8 }}>
                  <div style={{ fontSize: 14, fontWeight: 600 }}>{c.clientName}</div>
                  <div style={{ fontFamily: MONO, fontSize: 10, color: MUTE }}>{c.industry ?? '—'}</div>
                </div>
                <div style={{ height: 4, borderRadius: 2, background: 'rgba(255,255,255,0.06)', overflow: 'hidden', marginBottom: 6 }}>
                  <div style={{ width: `${pct}%`, height: 4, background: color }} />
                </div>
                <div style={{ fontFamily: MONO, fontSize: 10, color: MUTE }}>
                  {c.present}/{c.of} domains populated
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Quick links to sub-surfaces */}
      <section>
        <div style={{ fontFamily: MONO, fontSize: 10, color: TEAL, letterSpacing: '0.14em', marginBottom: 12 }}>
          SUB-SURFACES
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 10 }}>
          <QuickLink href="/platform/data" title="Data" sub="Upload, sources, templates" />
          <QuickLink href="/platform/users/new" title="Users" sub="Invite + role management" />
          <QuickLink href="/tower/onboard" title="Data onboarding" sub="Wizard for new client sources" />
          <QuickLink href="/tower" title="Control Tower" sub="Portfolio dashboard" />
          <QuickLink href="/intelligence/library" title="Intelligence · Library" sub="Knowledge catalog" />
        </div>
      </section>
    </div>
  );
}

function QuickLink({ href, title, sub }: { href: string; title: string; sub: string }) {
  return (
    <Link
      href={href}
      style={{
        display: 'block',
        padding: '14px 16px',
        background: PANEL_BG,
        border: BORDER,
        borderRadius: 8,
        color: INK,
        textDecoration: 'none',
      }}
    >
      <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 4 }}>{title}</div>
      <div style={{ fontSize: 12, color: MUTE }}>{sub}</div>
    </Link>
  );
}
