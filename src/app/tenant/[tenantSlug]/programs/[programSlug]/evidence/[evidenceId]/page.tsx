import Link from 'next/link';
import { notFound } from 'next/navigation';
import {
  getEvidenceDetail,
  getProgramEvidenceRegistry,
} from '@/lib/deliverables/evidence-registry';
import { tenantProgramPath } from '@/lib/deliverables/seed-route-resolver';
import { COMPOSITE_DISCLAIMER } from '@/lib/integrity/disclaimers';
import { assertTenantAccess } from '@/lib/auth/tenant-access';

export const dynamic = 'force-dynamic';

export default async function EvidenceDetailPage({
  params,
}: {
  params: Promise<{ tenantSlug: string; programSlug: string; evidenceId: string }>;
}) {
  const { tenantSlug, programSlug, evidenceId } = await params;
  await assertTenantAccess(tenantSlug);
  const entry = getEvidenceDetail(tenantSlug, programSlug, evidenceId);
  const registry = getProgramEvidenceRegistry(tenantSlug, programSlug);

  if (!entry || !registry) notFound();

  return (
    <main
      style={{
        minHeight: '100vh',
        background: '#fbf8f2',
        color: '#1b1713',
        padding: '48px clamp(24px, 4vw, 72px)',
        fontFamily: 'DM Sans, -apple-system, sans-serif',
      }}
    >
      <div style={{ maxWidth: 920, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 24 }}>
        <nav aria-label="Route breadcrumbs" style={{ display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'center' }}>
          <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 12, letterSpacing: '0.14em', textTransform: 'uppercase', color: '#0f9f8c', fontWeight: 700 }}>
            Evidence detail
          </span>
          <Link href={tenantProgramPath({ routeSlug: tenantSlug }, { programSlug })} style={{ color: '#1b1713', textDecoration: 'none', fontSize: 14 }}>
            ← Back to program
          </Link>
        </nav>

        <header style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 12, letterSpacing: '0.14em', textTransform: 'uppercase', color: '#8a7e72', fontWeight: 700 }}>
            {entry.id} · {entry.kind}
          </div>
          <h1 className="del-title" style={{ fontFamily: 'Georgia, serif', fontSize: 'clamp(40px, 5vw, 72px)', lineHeight: 0.96, letterSpacing: '-0.02em', margin: 0 }}>
            {entry.label}
          </h1>
          <p style={{ margin: 0, fontSize: 18, lineHeight: 1.6, color: '#4d443d' }}>
            {entry.reference}
          </p>
        </header>

        <section
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: 14,
          }}
        >
          {[
            ['Program', registry.programName],
            ['Deliverable', entry.deliverableCode ?? entry.firstCitedIn ?? 'Unassigned'],
            ['Confidence', entry.confidence ?? 'Not labeled'],
            ['Registry updated', registry.lastUpdatedAt ? new Date(registry.lastUpdatedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Unknown'],
          ].map(([label, value]) => (
            <div
              key={label}
              style={{
                padding: 16,
                borderRadius: 16,
                background: '#fffdf8',
                border: '1px solid rgba(27,23,19,0.10)',
              }}
            >
              <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#8a7e72', fontWeight: 700 }}>
                {label}
              </div>
              <div style={{ marginTop: 8, fontSize: 16, lineHeight: 1.5 }}>{value}</div>
            </div>
          ))}
        </section>

        <section
          style={{
            padding: 20,
            borderRadius: 18,
            background: '#fffdf8',
            border: '1px solid rgba(27,23,19,0.10)',
          }}
        >
          <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#8a7e72', fontWeight: 700 }}>
            Source of truth
          </div>
          <p style={{ marginTop: 12, marginBottom: 0, lineHeight: 1.7 }}>
            {entry.source}
          </p>
        </section>

        <footer className="del-footer" style={{ fontSize: 13, color: '#6d625a', lineHeight: 1.7 }}>
          {COMPOSITE_DISCLAIMER}
        </footer>
      </div>
    </main>
  );
}
