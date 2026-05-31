import Link from 'next/link';

import { AdminCanonShellV2 } from '@/components/admin/AdminCanonShellV2';
import { AgentRail } from '@/components/admin/AgentRail';
import { EditorialCanvas } from '@/components/admin/EditorialCanvas';
import { resolveAdminTenant } from '@/lib/admin/admin-tenant';
import { azureRead } from '@/lib/data-plane/azureRead';

export const metadata = { title: 'Engineering traces · AbarVa' };
export const dynamic = 'force-dynamic';
export const revalidate = 0;

interface TraceListRow {
  trace_id: string;
  tenant_id: string;
  timestamp: string;
  trigger: string;
  prompt_version: string;
  interpretation_confidence: 'high' | 'med' | 'low';
  fallback_used: boolean;
  fallback_reason: string | null;
  latency_ms: number | null;
  input_summary: Record<string, unknown>;
  observations: unknown[];
  citations: unknown[];
  clients: { name: string | null } | null;
}

interface TraceDetailRow extends TraceListRow {
  thread_id: string | null;
  user_id: string | null;
  patterns_fired: unknown[];
  patterns_skipped: unknown[];
  if_you_only_do_one: string | null;
  model: string;
  package_version: string;
}

type TraceListDbRow = Omit<TraceListRow, 'clients'> & { client_name: string | null };
type TraceDetailDbRow = Omit<TraceDetailRow, 'clients'> & { client_name?: string | null };

interface TraceFilters {
  tenantId: string;
  promptVersion?: string;
  fallbackUsed?: 'true' | 'false';
  traceId?: string;
}

interface AtlasTracesPageProps {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}

function one(value: string | string[] | undefined): string | undefined {
  if (Array.isArray(value)) return value[0];
  return value;
}

function readFilters(
  searchParams: Record<string, string | string[] | undefined>,
  tenantId: string,
): TraceFilters {
  const fallbackRaw = one(searchParams.fallbackUsed);
  return {
    tenantId,
    promptVersion: one(searchParams.promptVersion) || undefined,
    fallbackUsed: fallbackRaw === 'true' || fallbackRaw === 'false' ? fallbackRaw : undefined,
    traceId: one(searchParams.traceId) || undefined,
  };
}

async function listTraces(filters: TraceFilters): Promise<ReadonlyArray<TraceListRow>> {
  const where: string[] = [];
  const params: unknown[] = [];
  if (filters.tenantId) {
    params.push(filters.tenantId);
    where.push(`t.tenant_id = $${params.length}`);
  }
  if (filters.promptVersion) {
    params.push(filters.promptVersion);
    where.push(`t.prompt_version = $${params.length}`);
  }
  if (filters.fallbackUsed) {
    params.push(filters.fallbackUsed === 'true');
    where.push(`t.fallback_used = $${params.length}`);
  }
  const rows = await azureRead.query<TraceListDbRow>(
    `SELECT
       t.trace_id,
       t.tenant_id,
       t.timestamp,
       t.trigger,
       t.prompt_version,
       t.interpretation_confidence,
       t.fallback_used,
       t.fallback_reason,
       t.latency_ms,
       t.input_summary,
       t.observations,
       t.citations,
       c.name AS client_name
     FROM atlas_reasoning_traces t
     LEFT JOIN clients c ON c.id = t.tenant_id
     ${where.length ? `WHERE ${where.join(' AND ')}` : ''}
     ORDER BY t.timestamp DESC
     LIMIT 100`,
    params,
  );
  return rows.map((row) => ({ ...row, clients: { name: row.client_name } }));
}

async function getTraceDetail(traceId: string | undefined, tenantId: string): Promise<TraceDetailRow | null> {
  if (!traceId) return null;
  const row = await azureRead.maybeSingle<TraceDetailDbRow>({
    table: 'atlas_reasoning_traces',
    columns: '*',
    where: { trace_id: traceId, tenant_id: tenantId },
  });
  if (!row) return null;
  const [client] = await azureRead.select<{ name: string | null }>({
    table: 'clients',
    columns: ['name'],
    where: { id: row.tenant_id },
    limit: 1,
  }).catch(() => []);
  const trace = { ...row };
  delete trace.client_name;
  return { ...trace, clients: { name: client?.name ?? null } };
}

async function listPromptVersions(tenantId: string): Promise<ReadonlyArray<string>> {
  const rows = await azureRead.query<{ prompt_version: string }>(
    `SELECT DISTINCT prompt_version
     FROM atlas_reasoning_traces
     WHERE tenant_id = $1
     ORDER BY prompt_version ASC
     LIMIT 500`,
    [tenantId],
  ).catch(() => []);
  return [...new Set(rows.map((row) => row.prompt_version))];
}

function formatTimestamp(value: string): string {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(value));
}

function filterHref(filters: TraceFilters, patch: Partial<TraceFilters>): string {
  const next = { ...filters, ...patch };
  const params = new URLSearchParams();
  if (next.promptVersion) params.set('promptVersion', next.promptVersion);
  if (next.fallbackUsed) params.set('fallbackUsed', next.fallbackUsed);
  if (next.traceId) params.set('traceId', next.traceId);
  const qs = params.toString();
  return qs ? `/engineering/traces?${qs}` : '/engineering/traces';
}

const S = {
  page: {
    display: 'grid',
    gap: 16,
  },
  toolbar: {
    display: 'flex',
    gap: 8,
    flexWrap: 'wrap',
    alignItems: 'center',
  },
  control: {
    border: '1px solid rgba(15,23,42,0.14)',
    borderRadius: 6,
    padding: '8px 10px',
    background: '#fff',
    fontSize: 13,
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    background: '#fff',
    border: '1px solid rgba(15,23,42,0.10)',
  },
  th: {
    textAlign: 'left',
    padding: '10px 12px',
    fontSize: 11,
    letterSpacing: '0.08em',
    textTransform: 'uppercase',
    color: '#64748b',
    borderBottom: '1px solid rgba(15,23,42,0.10)',
  },
  td: {
    padding: '10px 12px',
    borderBottom: '1px solid rgba(15,23,42,0.08)',
    fontSize: 13,
    verticalAlign: 'top',
  },
  mono: {
    fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
  },
  detail: {
    background: '#0f172a',
    color: '#e2e8f0',
    borderRadius: 8,
    padding: 14,
    overflow: 'auto',
    maxHeight: 640,
    fontSize: 12,
    lineHeight: 1.5,
  },
} as const;

export default async function AtlasTracesPage({ searchParams }: AtlasTracesPageProps) {
  const tenant = await resolveAdminTenant();
  const params = await searchParams;
  const filters = readFilters(params ?? {}, tenant.clientId);
  const [traces, detail, promptVersions] = await Promise.all([
    listTraces(filters),
    getTraceDetail(filters.traceId, filters.tenantId),
    listPromptVersions(filters.tenantId),
  ]);

  const fallbackCount = traces.filter((trace) => trace.fallback_used).length;
  const lowCount = traces.filter((trace) => trace.interpretation_confidence === 'low').length;
  const avgCitations =
    traces.length === 0
      ? 0
      : traces.reduce((sum, trace) => sum + (Array.isArray(trace.citations) ? trace.citations.length : 0), 0) / traces.length;

  return (
    <AdminCanonShellV2
      tenantName={tenant.tenantName}
      agentRail={
        <AgentRail
          primaryAgentLabel="Atlas"
          primaryActionLabel="Open Tower"
          primaryActionHref="/tower"
        />
      }
    >
      <EditorialCanvas
        eyebrow="Diagnostics · Reasoning observability"
        title="Reasoning audit"
        subtitle={`Engineering review for ${tenant.tenantName}. This page is tenant-scoped so Maestros only inspect the active client's traces.`}
      >
        <div style={S.page} data-testid="atlas-traces-page">
          <section style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: 10 }}>
            <Kpi label="Rows shown" value={String(traces.length)} />
            <Kpi label="Fallbacks" value={String(fallbackCount)} />
            <Kpi label="Low confidence" value={String(lowCount)} />
            <Kpi label="Avg citations" value={avgCitations.toFixed(1)} />
          </section>

          <form action="/engineering/traces" style={S.toolbar}>
            <div style={S.control} aria-label="Tenant scope">
              Tenant: <strong>{tenant.tenantName}</strong>
            </div>
            <select name="promptVersion" defaultValue={filters.promptVersion ?? ''} style={S.control} aria-label="Prompt version filter">
              <option value="">All prompt versions</option>
              {promptVersions.map((version) => (
                <option key={version} value={version}>{version}</option>
              ))}
            </select>
            <select name="fallbackUsed" defaultValue={filters.fallbackUsed ?? ''} style={S.control} aria-label="Fallback filter">
              <option value="">Fallback: any</option>
              <option value="true">Fallback only</option>
              <option value="false">No fallback</option>
            </select>
            <button type="submit" style={S.control}>Apply</button>
            <Link href="/engineering/traces" style={{ ...S.control, textDecoration: 'none', color: '#0f172a' }}>Reset</Link>
          </form>

          <section style={{ display: 'grid', gridTemplateColumns: detail ? 'minmax(0, 1fr) minmax(360px, 0.9fr)' : '1fr', gap: 16 }}>
            <table style={S.table} data-testid="atlas-traces-table">
              <thead>
                <tr>
                  <th style={S.th}>Time</th>
                  <th style={S.th}>Tenant</th>
                  <th style={S.th}>Trigger</th>
                  <th style={S.th}>Confidence</th>
                  <th style={S.th}>Patterns</th>
                  <th style={S.th}>Citations</th>
                  <th style={S.th}>Trace</th>
                </tr>
              </thead>
              <tbody>
                {traces.map((trace) => (
                  <tr key={trace.trace_id}>
                    <td style={S.td}>{formatTimestamp(trace.timestamp)}</td>
                    <td style={S.td}>{trace.clients?.name ?? trace.tenant_id}</td>
                    <td style={{ ...S.td, ...S.mono }}>{trace.trigger}</td>
                    <td style={S.td}>
                      {trace.interpretation_confidence}
                      {trace.fallback_used ? ` · fallback${trace.fallback_reason ? `: ${trace.fallback_reason}` : ''}` : ''}
                    </td>
                    <td style={S.td}>{Array.isArray(trace.observations) ? trace.observations.length : 0} obs</td>
                    <td style={S.td}>{Array.isArray(trace.citations) ? trace.citations.length : 0}</td>
                    <td style={{ ...S.td, ...S.mono }}>
                      <Link href={filterHref(filters, { traceId: trace.trace_id })}>
                        {trace.trace_id.replace('atlas_rt_', '').slice(0, 8)}
                      </Link>
                    </td>
                  </tr>
                ))}
                {traces.length === 0 && (
                  <tr>
                    <td style={S.td} colSpan={7}>No Atlas reasoning traces match these filters yet.</td>
                  </tr>
                )}
              </tbody>
            </table>

            {detail && (
              <aside>
                <div style={{ marginBottom: 8, fontWeight: 700 }}>Trace detail</div>
                <pre style={S.detail} data-testid="atlas-trace-detail">
                  {JSON.stringify(detail, null, 2)}
                </pre>
              </aside>
            )}
          </section>
        </div>
      </EditorialCanvas>
    </AdminCanonShellV2>
  );
}

function Kpi({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ border: '1px solid rgba(15,23,42,0.10)', borderRadius: 8, padding: 12, background: '#fff' }}>
      <div style={{ fontSize: 11, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#64748b', marginBottom: 4 }}>
        {label}
      </div>
      <div style={{ fontSize: 24, fontWeight: 800, color: '#0f172a' }}>{value}</div>
    </div>
  );
}
