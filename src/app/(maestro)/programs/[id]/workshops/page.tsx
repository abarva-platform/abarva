import { connection } from 'next/server';
import Link from 'next/link';
import { getActiveClientRow } from '@/lib/active-client';
import { requireProductModule } from '@/lib/auth/server-module-access';
import { listWorkshopInstances, listWorkshopTemplates } from '@/lib/workshops/authoring';
import { COLORS, RADIUS, SPACING, TYPOGRAPHY } from '@/lib/design/design-tokens';
import { SHELL } from '@/lib/shell/shell-tokens';

export const metadata = {
  title: 'Program Workshops | AbarVa',
};

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function ProgramWorkshopsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await connection();
  await requireProductModule('programs');
  const { id } = await params;
  const client = await getActiveClientRow().catch(() => null);
  const instances = client?.id
    ? await listWorkshopInstances({ clientId: client.id, moveInstanceId: id, limit: 100 }).catch(() => [])
    : [];
  const gateTemplates = await listWorkshopTemplates({ clientId: client?.id ?? null, limit: 100 }).catch(() => []);
  const tiedTemplates = gateTemplates.filter((template) => template.owningGateId);

  return (
    <main
      style={{
        minHeight: '100vh',
        background: COLORS.cream,
        color: COLORS.ink,
        fontFamily: TYPOGRAPHY.sans,
        padding: SPACING.xl,
      }}
    >
      <section style={{ maxWidth: 1120, margin: '0 auto', display: 'grid', gap: SPACING.lg }}>
        <nav style={{ fontSize: 13 }}>
          <Link href={`/programs/${id}`} style={{ color: COLORS.navy, textDecoration: 'none' }}>
            Back to program
          </Link>
        </nav>
        <header>
          <p style={{ margin: 0, fontSize: 12, letterSpacing: 0, color: SHELL.INK_SOFT }}>Programs / Workshops</p>
          <h1
            style={{
              margin: '6px 0 0',
              fontFamily: TYPOGRAPHY.serif,
              fontWeight: 400,
              fontSize: 42,
              lineHeight: 1.08,
            }}
          >
            Workshops for {id}
          </h1>
          <p style={{ margin: `${SPACING.sm} 0 0`, maxWidth: 760, color: SHELL.INK_SOFT, lineHeight: 1.55 }}>
            Scheduled workshop instances pinned to template versions, move gates, decisions, dissent logs, and facilitator-pack rendering.
          </p>
        </header>

        <section
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: SPACING.md,
          }}
        >
          <Metric label="Scheduled for this Move" value={String(instances.length)} />
          <Metric label="Gate-tied templates" value={String(tiedTemplates.length)} />
          <Metric label="Tenant" value={client?.name ?? 'No active client'} />
        </section>

        <section style={{ display: 'grid', gap: SPACING.md }}>
          <h2 style={{ margin: 0, fontFamily: TYPOGRAPHY.serif, fontWeight: 400, fontSize: 28 }}>
            Move workshop instances
          </h2>
          {instances.length === 0 ? (
            <EmptyState />
          ) : (
            instances.map((instance) => (
              <article
                key={instance.id}
                style={{
                  background: COLORS.white,
                  border: `1px solid ${SHELL.CARD_LINE_SOFT}`,
                  borderRadius: RADIUS.md,
                  padding: SPACING.lg,
                  display: 'grid',
                  gridTemplateColumns: 'minmax(0, 1fr) auto',
                  gap: SPACING.md,
                }}
              >
                <div>
                  <h3 style={{ margin: 0, fontFamily: TYPOGRAPHY.serif, fontWeight: 400, fontSize: 22 }}>
                    {instance.templateName ?? instance.templateId}
                  </h3>
                  <p style={{ margin: `${SPACING.xs} 0 0`, color: SHELL.INK_SOFT, lineHeight: 1.5 }}>
                    v{instance.versionPinned} · gate {instance.gateId ?? 'not linked'} · {instance.scheduledAt ?? 'unscheduled'}
                  </p>
                </div>
                <span
                  style={{
                    alignSelf: 'start',
                    border: `1px solid ${SHELL.CARD_LINE}`,
                    borderRadius: RADIUS.pill,
                    padding: '4px 10px',
                    fontSize: 12,
                  }}
                >
                  {instance.status}
                </span>
              </article>
            ))
          )}
        </section>

        <section style={{ display: 'grid', gap: SPACING.md }}>
          <h2 style={{ margin: 0, fontFamily: TYPOGRAPHY.serif, fontWeight: 400, fontSize: 28 }}>
            Templates tied to gates
          </h2>
          {tiedTemplates.length === 0 ? (
            <p style={{ margin: 0, color: SHELL.INK_SOFT }}>No published or draft workshop templates are currently tied to gate criteria.</p>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: SPACING.md }}>
              {tiedTemplates.map((template) => (
                <article
                  key={template.id}
                  style={{
                    background: COLORS.white,
                    border: `1px solid ${SHELL.CARD_LINE_SOFT}`,
                    borderRadius: RADIUS.md,
                    padding: SPACING.lg,
                  }}
                >
                  <h3 style={{ margin: 0, fontFamily: TYPOGRAPHY.serif, fontWeight: 400, fontSize: 21 }}>
                    {template.name}
                  </h3>
                  <p style={{ margin: `${SPACING.xs} 0 0`, color: SHELL.INK_SOFT, lineHeight: 1.5 }}>
                    {template.assets.length} assets · {template.durationMinutes} min · gate {template.owningGateId}
                  </p>
                </article>
              ))}
            </div>
          )}
        </section>
      </section>
    </main>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <article
      style={{
        background: COLORS.white,
        border: `1px solid ${SHELL.CARD_LINE_SOFT}`,
        borderRadius: RADIUS.md,
        padding: SPACING.lg,
      }}
    >
      <div style={{ fontSize: 12, color: SHELL.INK_SOFT }}>{label}</div>
      <div style={{ marginTop: 4, fontFamily: TYPOGRAPHY.serif, fontSize: 30, lineHeight: 1 }}>
        {value}
      </div>
    </article>
  );
}

function EmptyState() {
  return (
    <article
      style={{
        background: COLORS.white,
        border: `1px solid ${SHELL.CARD_LINE_SOFT}`,
        borderRadius: RADIUS.md,
        padding: SPACING.lg,
        color: SHELL.INK_SOFT,
      }}
    >
      No workshop instances are scheduled for this Move yet.
    </article>
  );
}
