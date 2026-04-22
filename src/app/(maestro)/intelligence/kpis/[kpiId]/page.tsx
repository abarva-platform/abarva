import { notFound } from 'next/navigation';
import { PageShell } from '@/components/shared/layout/PageShell';
import { Body } from '@/components/shared/typography/Body';
import { EyebrowLabel } from '@/components/shared/typography/EyebrowLabel';
import { MetaLabel } from '@/components/shared/typography/MetaLabel';
import { PageTitle } from '@/components/shared/typography/PageTitle';
import { SectionHeading } from '@/components/shared/typography/SectionHeading';
import { EntityLink } from '@/components/shared/entities/EntityLink';
import { getActiveClientRow } from '@/lib/active-client';
import { loadKpiDetail, type KpiDetailBundle, type KpiEvidenceRow } from '@/lib/intelligence/loadKpiDetail';

export const dynamic = 'force-dynamic';

const BORDER = '0.5px solid rgba(255,255,255,0.08)';
const PANEL = 'rgba(255,255,255,0.03)';

export default async function KpiDetailPage({
  params,
}: {
  params: Promise<{ kpiId: string }>;
}) {
  const { kpiId } = await params;
  const activeClient = await getActiveClientRow();
  if (!activeClient) notFound();

  const bundle = await loadKpiDetail(kpiId, activeClient.id);
  if (!bundle) notFound();

  const { kpi, benchmarkCohort, evidence, telemetrySources, patterns, relatedKpis } = bundle;
  const currentValue = kpi.current_value !== null ? formatMetric(kpi.current_value, kpi.current_unit) : 'No current value';
  const targetValue = kpi.target_value !== null ? formatMetric(kpi.target_value, kpi.target_unit) : 'No target attached';
  const currentTone = kpi.trend_direction === 'down' ? 'red' : kpi.trend_direction === 'up' ? 'teal' : 'muted';
  const relationshipRows = [
    ...relatedKpis.filter((row) => kpi.upstream_kpi_ids.includes(row.id)).map((row) => ({ ...row, relation: 'Upstream KPI' })),
    ...relatedKpis.filter((row) => kpi.downstream_kpi_ids.includes(row.id)).map((row) => ({ ...row, relation: 'Downstream KPI' })),
    ...relatedKpis.filter((row) => kpi.conflicting_kpi_ids.includes(row.id)).map((row) => ({ ...row, relation: 'Conflicting KPI' })),
  ];
  const driverRows = deriveDrivers(bundle);

  return (
    <PageShell width="standard" padding="comfortable">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
        <header style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'center' }}>
            <EntityLink href="/intelligence" variant="ghost">Intelligence</EntityLink>
            <span style={{ color: 'rgba(245,245,240,0.3)' }}>/</span>
            <EntityLink href="/intelligence/kpis" variant="ghost">KPIs</EntityLink>
            <span style={{ color: 'rgba(245,245,240,0.3)' }}>/</span>
            <MetaLabel>{kpi.short_name ?? kpi.name}</MetaLabel>
          </div>
          <EyebrowLabel tone="teal" size="sm">
            {kpi.category ?? 'KPI'}{kpi.subcategory ? ` · ${kpi.subcategory}` : ''}{kpi.ordinal_ref ? ` · ${kpi.ordinal_ref}` : ''}
          </EyebrowLabel>
          <PageTitle size="display">{kpi.name}</PageTitle>
          {kpi.definition ? (
            <Body size="lg" tone="secondary" style={{ maxWidth: 840 }}>{kpi.definition}</Body>
          ) : null}
        </header>

        <section style={{ display: 'grid', gridTemplateColumns: 'minmax(320px, 0.9fr) minmax(0, 1.1fr)', gap: 20 }}>
          <CurrentStateCard
            title="Current state"
            mainValue={currentValue}
            supporting={[
              kpi.trend_summary ? `${trendGlyph(kpi.trend_direction)} ${kpi.trend_summary}` : null,
              kpi.current_as_of_date ? `As of ${formatDate(kpi.current_as_of_date)}` : null,
              kpi.last_refresh_timestamp ? `Refreshed ${formatDateTime(kpi.last_refresh_timestamp)}` : null,
            ]}
            tone={currentTone}
          />
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
            <MetricPanel label="Target" value={targetValue} sub={kpi.target_as_of_date ? `By ${formatDate(kpi.target_as_of_date)}` : kpi.target_period} />
            <MetricPanel
              label="Benchmark median"
              value={kpi.benchmark_median !== null ? formatMetric(kpi.benchmark_median, kpi.current_unit ?? kpi.target_unit) : 'No benchmark'}
              sub={benchmarkCohort ? benchmarkCohort.cohort_name : kpi.benchmark_confidence}
            />
            <MetricPanel
              label="Owner"
              value={kpi.owner_person_name ?? kpi.owner_role_title ?? 'Owner not mapped'}
              sub={kpi.owner_person_id ? `Profile route live at /persons/${kpi.owner_person_id}` : kpi.owner_role_title}
            />
            <MetricPanel
              label="Variance"
              value={kpi.gap_to_median_pct !== null ? `${stripTrailingZeroes(kpi.gap_to_median_pct)}% vs median` : 'No variance computed'}
              sub={kpi.peer_position_quartile ?? null}
            />
          </div>
        </section>

        <section>
          <EyebrowLabel tone="teal" size="sm">TREND CONTEXT</EyebrowLabel>
          <SectionHeading size="md" style={{ marginTop: 10, marginBottom: 14 }}>
            Trend state, with honest handling when history is sparse
          </SectionHeading>
          <div style={{ padding: 18, borderRadius: 18, border: BORDER, background: PANEL }}>
            {kpi.trend_summary ? (
              <Body size="md" tone="primary" style={{ marginBottom: 10 }}>
                {kpi.trend_summary}
              </Body>
            ) : null}
            <Body size="sm" tone="secondary">
              The current intelligence-layer schema carries current value, target, benchmark context, and summarized
              trend movement, but not a persisted time-series yet. This surface therefore renders the summary honestly
              rather than fabricating a 90-day chart.
            </Body>
          </div>
        </section>

        <section>
          <EyebrowLabel tone="teal" size="sm">DRIVERS</EyebrowLabel>
          <SectionHeading size="md" style={{ marginTop: 10, marginBottom: 14 }}>
            Pressure sources and structural signals touching this KPI
          </SectionHeading>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 16 }}>
            {driverRows.map((driver) => (
              <div key={driver.title} style={{ padding: 18, borderRadius: 18, border: BORDER, background: PANEL }}>
                <MetaLabel style={{ color: '#14B8A6' }}>{driver.label}</MetaLabel>
                <Body size="md" weight={600} as="div" style={{ marginTop: 8 }}>{driver.title}</Body>
                <Body size="sm" tone="secondary" as="div" style={{ marginTop: 8 }}>{driver.body}</Body>
              </div>
            ))}
          </div>
        </section>

        <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 20 }}>
          <div style={{ padding: 18, borderRadius: 18, border: BORDER, background: PANEL }}>
            <EyebrowLabel tone="teal" size="sm">PATTERN ASSOCIATIONS</EyebrowLabel>
            <SectionHeading size="md" style={{ marginTop: 10, marginBottom: 14 }}>
              Patterns that currently frame this KPI
            </SectionHeading>
            {patterns.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {patterns.map((pattern) => (
                  <div key={pattern.id}>
                    <EntityLink href={`/intelligence/patterns/${encodeURIComponent(pattern.id)}`} variant="inline">
                      {pattern.name}
                    </EntityLink>
                    {pattern.short_description ? (
                      <Body size="sm" tone="secondary" style={{ marginTop: 6 }}>{pattern.short_description}</Body>
                    ) : null}
                    {pattern.confidence_level ? (
                      <MetaLabel style={{ marginTop: 6, display: 'block' }}>{pattern.confidence_level.toUpperCase()} CONFIDENCE</MetaLabel>
                    ) : null}
                  </div>
                ))}
              </div>
            ) : (
              <Body size="sm" tone="muted">No linked patterns have been attached yet.</Body>
            )}
          </div>

          <div style={{ padding: 18, borderRadius: 18, border: BORDER, background: PANEL }}>
            <EyebrowLabel tone="teal" size="sm">ACTIVE INITIATIVES</EyebrowLabel>
            <SectionHeading size="md" style={{ marginTop: 10, marginBottom: 14 }}>
              Programs or workstreams expected to move this KPI
            </SectionHeading>
            {kpi.linked_initiative_refs.length > 0 ? (
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 10 }}>
                {kpi.linked_initiative_refs.map((item) => (
                  <li key={item}>
                    <Body size="sm">{item}</Body>
                  </li>
                ))}
              </ul>
            ) : (
              <Body size="sm" tone="muted">No initiative refs are attached yet.</Body>
            )}
          </div>
        </section>

        <section>
          <EyebrowLabel tone="teal" size="sm">EVIDENCE CHAIN</EyebrowLabel>
          <SectionHeading size="md" style={{ marginTop: 10, marginBottom: 14 }}>
            Telemetry sources, observed evidence, and refresh context
          </SectionHeading>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 16 }}>
            <EvidencePanel items={evidence} />
            <TelemetryPanel items={telemetrySources} />
          </div>
        </section>

        <section>
          <EyebrowLabel tone="teal" size="sm">RELATED KPIS</EyebrowLabel>
          <SectionHeading size="md" style={{ marginTop: 10, marginBottom: 14 }}>
            Upstream, downstream, and conflicting metrics
          </SectionHeading>
          {relationshipRows.length > 0 ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 14 }}>
              {relationshipRows.map((row) => (
                <div key={`${row.relation}:${row.id}`} style={{ padding: 18, borderRadius: 18, border: BORDER, background: PANEL }}>
                  <MetaLabel style={{ color: '#14B8A6' }}>{row.relation}</MetaLabel>
                  <div style={{ marginTop: 8 }}>
                    <EntityLink href={`/intelligence/kpis/${encodeURIComponent(row.id)}`} variant="inline">
                      {row.name}
                    </EntityLink>
                  </div>
                  {row.current_value !== null ? (
                    <Body size="sm" tone="secondary" style={{ marginTop: 8 }}>
                      Current · {formatMetric(row.current_value, row.current_unit)}
                    </Body>
                  ) : null}
                  {row.category ? <MetaLabel style={{ display: 'block', marginTop: 6 }}>{row.category}</MetaLabel> : null}
                </div>
              ))}
            </div>
          ) : (
            <Body size="sm" tone="muted">No related KPI graph has been attached yet.</Body>
          )}
        </section>
      </div>
    </PageShell>
  );
}

function CurrentStateCard({
  title,
  mainValue,
  supporting,
  tone,
}: {
  title: string;
  mainValue: string;
  supporting: Array<string | null>;
  tone: 'teal' | 'red' | 'muted';
}) {
  const color = tone === 'red' ? '#EF4444' : tone === 'teal' ? '#14B8A6' : 'rgba(245,245,240,0.72)';
  return (
    <div style={{ padding: 20, borderRadius: 18, border: BORDER, background: PANEL }}>
      <EyebrowLabel tone="teal" size="sm">{title}</EyebrowLabel>
      <div style={{ marginTop: 12, fontFamily: 'Georgia, serif', fontSize: 54, lineHeight: 1, color }}>
        {mainValue}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 16 }}>
        {supporting.filter(Boolean).map((item) => (
          <Body key={item} size="sm" tone="secondary">{item}</Body>
        ))}
      </div>
    </div>
  );
}

function MetricPanel({ label, value, sub }: { label: string; value: string; sub?: string | null }) {
  return (
    <div style={{ padding: 18, borderRadius: 18, border: BORDER, background: PANEL }}>
      <MetaLabel style={{ color: '#14B8A6' }}>{label}</MetaLabel>
      <Body size="md" weight={600} as="div" style={{ marginTop: 8 }}>{value}</Body>
      {sub ? <Body size="sm" tone="secondary" as="div" style={{ marginTop: 8 }}>{sub}</Body> : null}
    </div>
  );
}

function EvidencePanel({ items }: { items: KpiEvidenceRow[] }) {
  return (
    <div style={{ padding: 18, borderRadius: 18, border: BORDER, background: PANEL }}>
      <MetaLabel style={{ color: '#14B8A6' }}>Observed evidence</MetaLabel>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 12 }}>
        {items.length > 0 ? items.map((item) => (
          <div key={item.id}>
            <Body size="sm" weight={600}>{item.title}</Body>
            <Body size="sm" tone="secondary" style={{ marginTop: 4 }}>{item.summary}</Body>
            <MetaLabel style={{ display: 'block', marginTop: 6 }}>
              {[item.evidence_type, item.observed_at ? formatDate(item.observed_at) : null, item.confidence_level].filter(Boolean).join(' · ')}
            </MetaLabel>
          </div>
        )) : (
          <Body size="sm" tone="muted">No evidence rows are attached yet.</Body>
        )}
      </div>
    </div>
  );
}

function TelemetryPanel({
  items,
}: {
  items: KpiDetailBundle['telemetrySources'];
}) {
  return (
    <div style={{ padding: 18, borderRadius: 18, border: BORDER, background: PANEL }}>
      <MetaLabel style={{ color: '#14B8A6' }}>Telemetry provenance</MetaLabel>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 12 }}>
        {items.length > 0 ? items.map((item) => (
          <div key={item.id}>
            <Body size="sm" weight={600}>{item.name}</Body>
            <Body size="sm" tone="secondary" style={{ marginTop: 4 }}>
              {[item.description, item.scope_description].filter(Boolean).join(' · ')}
            </Body>
            <MetaLabel style={{ display: 'block', marginTop: 6 }}>
              {[item.modality, item.connector_type, item.refresh_schedule, item.last_refreshed_at ? formatDateTime(item.last_refreshed_at) : null].filter(Boolean).join(' · ')}
            </MetaLabel>
          </div>
        )) : (
          <Body size="sm" tone="muted">No telemetry source rows are attached yet.</Body>
        )}
      </div>
    </div>
  );
}

function deriveDrivers(bundle: KpiDetailBundle): Array<{ label: string; title: string; body: string }> {
  const { kpi, patterns, telemetrySources } = bundle;
  const drivers: Array<{ label: string; title: string; body: string }> = [];

  if (patterns[0]) {
    drivers.push({
      label: 'PATTERN SIGNAL',
      title: patterns[0].name,
      body: patterns[0].short_description ?? 'This KPI is structurally linked to an active genome pattern.',
    });
  }

  if (kpi.gap_to_median_pct !== null) {
    drivers.push({
      label: 'BENCHMARK GAP',
      title: `${stripTrailingZeroes(kpi.gap_to_median_pct)}% vs peer median`,
      body: kpi.peer_position_quartile
        ? `Peer position currently reads ${kpi.peer_position_quartile}.`
        : 'The current value is materially off the peer median, which is why this metric is on the board.',
    });
  }

  if (telemetrySources[0]) {
    drivers.push({
      label: 'TELEMETRY SOURCE',
      title: telemetrySources[0].name,
      body: telemetrySources[0].description ?? 'This source is currently populating the KPI and shaping how fresh the signal is.',
    });
  }

  if (kpi.why_it_matters) {
    drivers.push({
      label: 'BUSINESS IMPACT',
      title: 'Why it matters',
      body: kpi.why_it_matters,
    });
  }

  return drivers.length > 0
    ? drivers
    : [{
        label: 'STATUS',
        title: 'Sparse driver context',
        body: 'This KPI has core state and benchmark fields populated, but richer causal driver records have not been attached yet.',
      }];
}

function trendGlyph(direction: string | null): string {
  return direction === 'up' ? '↑' : direction === 'down' ? '↓' : '→';
}

function formatMetric(value: number, unit: string | null): string {
  return `${stripTrailingZeroes(value)}${unit ?? ''}`;
}

function stripTrailingZeroes(value: number): string {
  return Number.isInteger(value) ? String(value) : value.toFixed(2).replace(/\.?0+$/, '');
}

function formatDate(value: string): string {
  return new Date(value).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
}

function formatDateTime(value: string): string {
  return new Date(value).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}
