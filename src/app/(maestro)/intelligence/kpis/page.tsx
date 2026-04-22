import { PageShell } from '@/components/shared/layout/PageShell';
import { Body } from '@/components/shared/typography/Body';
import { EyebrowLabel } from '@/components/shared/typography/EyebrowLabel';
import { MetaLabel } from '@/components/shared/typography/MetaLabel';
import { PageTitle } from '@/components/shared/typography/PageTitle';
import { SectionHeading } from '@/components/shared/typography/SectionHeading';
import { EntityLink } from '@/components/shared/entities/EntityLink';
import { getActiveClientRow } from '@/lib/active-client';
import { loadKpiIndex } from '@/lib/intelligence/loadKpiDetail';

export const dynamic = 'force-dynamic';

const BORDER = '0.5px solid rgba(255,255,255,0.08)';
const PANEL = 'rgba(255,255,255,0.03)';

export default async function IntelligenceKpisPage() {
  const activeClient = await getActiveClientRow();
  if (!activeClient) {
    return (
      <PageShell width="standard" padding="comfortable">
        <Body size="lg" tone="secondary">No active client is selected, so KPI detail cannot be scoped yet.</Body>
      </PageShell>
    );
  }

  const kpis = await loadKpiIndex(activeClient.id);
  const grouped = new Map<string, typeof kpis>();
  for (const kpi of kpis) {
    const key = kpi.category ?? 'Uncategorized';
    grouped.set(key, [...(grouped.get(key) ?? []), kpi]);
  }

  return (
    <PageShell width="standard" padding="comfortable">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
        <header style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <EyebrowLabel tone="teal" size="sm">INTELLIGENCE / KPIS</EyebrowLabel>
          <PageTitle size="display">Metrics with structure, owners, and evidence</PageTitle>
          <Body size="lg" tone="secondary" style={{ maxWidth: 860 }}>
            KPI detail is where a number stops being a widget and becomes an entity. Current value, benchmark context,
            owner, pattern associations, provenance, and related metrics all sit on one surface.
          </Body>
          <MetaLabel>{activeClient.name} · {kpis.length} KPI entities</MetaLabel>
        </header>

        {kpis.length === 0 ? (
          <div style={{ padding: 20, borderRadius: 18, border: BORDER, background: PANEL }}>
            <SectionHeading size="md" style={{ marginBottom: 10 }}>No KPI entities seeded yet</SectionHeading>
            <Body size="sm" tone="secondary">
              This route is ready, but the active tenant does not yet have KPI entities in the intelligence layer.
            </Body>
          </div>
        ) : (
          Array.from(grouped.entries()).map(([category, rows]) => (
            <section key={category} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <EyebrowLabel tone="teal" size="sm">{category}</EyebrowLabel>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 14 }}>
                {rows.map((kpi) => (
                  <a
                    key={kpi.id}
                    href={`/intelligence/kpis/${encodeURIComponent(kpi.id)}`}
                    style={{
                      display: 'block',
                      textDecoration: 'none',
                      padding: 18,
                      borderRadius: 18,
                      border: BORDER,
                      background: PANEL,
                      color: 'inherit',
                    }}
                  >
                    <Body size="md" weight={600} as="div">{kpi.name}</Body>
                    {kpi.definition ? (
                      <Body size="sm" tone="secondary" as="div" style={{ marginTop: 8 }}>
                        {kpi.definition}
                      </Body>
                    ) : null}
                    <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginTop: 12 }}>
                      {kpi.current_value !== null ? (
                        <MetaLabel>Current · {formatMetric(kpi.current_value, kpi.current_unit)}</MetaLabel>
                      ) : null}
                      {kpi.owner_person_name ? (
                        <MetaLabel>Owner · {kpi.owner_person_name}</MetaLabel>
                      ) : null}
                    </div>
                    <div style={{ marginTop: 12 }}>
                      <EntityLink href={`/intelligence/kpis/${encodeURIComponent(kpi.id)}`} variant="ghost">
                        Open KPI detail
                      </EntityLink>
                    </div>
                  </a>
                ))}
              </div>
            </section>
          ))
        )}
      </div>
    </PageShell>
  );
}

function formatMetric(value: number, unit: string | null): string {
  return `${stripTrailingZeroes(value)}${unit ?? ''}`;
}

function stripTrailingZeroes(value: number): string {
  return Number.isInteger(value) ? String(value) : value.toFixed(2).replace(/\.?0+$/, '');
}
