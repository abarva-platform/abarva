import Link from 'next/link';
import { getServerSupabase } from '@/lib/supabase-server';

export const dynamic = 'force-dynamic';

const INK = '#F5F5F0';
const TEAL = '#14B8A6';
const MUTE = 'rgba(245, 245, 240, 0.72)';
const BLUE = '#4DA3FF';
const AMBER = '#F59E0B';
const GREEN = '#3FB27F';
const CORAL = '#FF6B4A';
const BORDER = '0.5px solid rgba(255,255,255,0.08)';
const PANEL_BG = 'rgba(255,255,255,0.02)';
const MONO = 'JetBrains Mono, monospace';

async function loadPlatformMetrics(clientId: string | null) {
  const sb = getServerSupabase();
  const [personsRes, sourcesRes] = await Promise.all([
    sb.from('persons').select('id', { count: 'exact', head: true }),
    sb.from('knowledge_sources').select('status', { count: 'exact' }).throwOnError().then(
      (r) => r,
      () => ({ count: 0, data: null as null | Array<{ status: string }> }),
    ),
  ]);

  // Scope tech stack + domain coverage to the active client only.
  let techQ = sb.from('tech_stack_items').select('category', { count: 'exact' });
  if (clientId) techQ = techQ.eq('client_id', clientId);
  const techRes = await techQ;
  const techRows = (techRes.data as Array<{ category: string }> | null) ?? [];
  const categorySet = new Set(techRows.map((r) => r.category));

  // Single-client coverage. 6 domains: inventory, apps, data, cost, eng, tech.
  let presentCount = 0;
  if (clientId) {
    const [inv, apps, data, cost, eng, tech] = await Promise.all([
      sb.from('use_cases').select('id', { count: 'exact', head: true }).eq('client_id', clientId),
      sb.from('applications').select('id', { count: 'exact', head: true }).eq('client_id', clientId),
      sb.from('data_sources').select('id', { count: 'exact', head: true }).eq('client_id', clientId),
      sb.from('cost_centers').select('id', { count: 'exact', head: true }).eq('client_id', clientId),
      sb.from('eng_teams').select('id', { count: 'exact', head: true }).eq('client_id', clientId),
      sb.from('tech_stack_items').select('id', { count: 'exact', head: true }).eq('client_id', clientId),
    ]);
    presentCount = [inv, apps, data, cost, eng, tech].filter((r) => (r.count ?? 0) > 0).length;
  }

  const sourcesCount = typeof sourcesRes.count === 'number' ? sourcesRes.count : 0;

  return {
    personCount: personsRes.count ?? 0,
    techStackTotal: techRes.count ?? techRows.length,
    techCategoryCount: categorySet.size,
    knowledgeSourceCount: sourcesCount,
    present: presentCount,
    of: 6,
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
  const { getActiveClientRow } = await import('@/lib/active-client');
  const activeClient = await getActiveClientRow();
  const m = await loadPlatformMetrics(activeClient?.id ?? null);
  const coveragePct = m.of > 0 ? Math.round((m.present / m.of) * 100) : 0;

  return (
    <div style={{ padding: '40px 40px 64px', width: '100%', maxWidth: 1800, margin: '0 auto', color: INK, fontFamily: 'DM Sans, sans-serif' }}>
      <div style={{ fontFamily: MONO, fontSize: 10, color: TEAL, letterSpacing: '0.14em', marginBottom: 10 }}>
        PLATFORM{activeClient ? ` · ${activeClient.name.toUpperCase()}` : ''}
      </div>
      <h1 style={{ fontFamily: 'Georgia, serif', fontSize: 32, fontWeight: 400, color: INK, margin: '0 0 6px' }}>
        Operational hub
      </h1>
      <p style={{ fontSize: 14, color: MUTE, marginBottom: 32, maxWidth: 720 }}>
        Data onboarding, users, integrations, observability, billing. The machinery behind the three products.
      </p>

      {/* Hero cards — all metrics scoped to active client */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 12, marginBottom: 40 }}>
        <Card
          label="Data coverage"
          accent={coveragePct >= 75 ? GREEN : coveragePct >= 40 ? AMBER : CORAL}
          href="/platform/data"
          hero={`${coveragePct}%`}
          sub={`${m.present} of ${m.of} core domains populated${activeClient ? ` for ${activeClient.name}` : ''}`}
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

      {/* Quick links to sub-surfaces */}
      <section>
        <div style={{ fontFamily: MONO, fontSize: 10, color: TEAL, letterSpacing: '0.14em', marginBottom: 12 }}>
          SUB-SURFACES
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 10 }}>
          <QuickLink href="/platform/data" title="Data" sub="Upload, sources, templates" />
          <QuickLink href="/platform/users/new" title="Users" sub="Invite + role management" />
          <QuickLink href="/platform/data" title="Data onboarding" sub="Wizard for new client sources" />
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
