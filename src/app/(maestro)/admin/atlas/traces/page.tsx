import Link from 'next/link';

import { AdminCanonShellV2 } from '@/components/admin/AdminCanonShellV2';
import { AgentRail } from '@/components/admin/AgentRail';
import { EditorialCanvas } from '@/components/admin/EditorialCanvas';
import { getServerSupabase } from '@/lib/supabase-server';

export const metadata = { title: 'Atlas traces · AbarVa' };
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

interface TraceFilters {
  tenantId?: string;
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

function readFilters(searchParams: Record<string, string | string[] | undefined>): TraceFilters {
  const fallbackRaw = one(searchParams.fallbackUsed);
  return {
    tenantId: one(searchParams.tenantId) || undefined,
    promptVersion: one(searchParams.promptVersion) || undefined,
    fallbackUsed: fallbackRaw === 'true' || fallbackRaw === 'false' ? fallbackRaw : undefined,
    traceId: one(searchParams.traceId) || undefined,
  };
}

async function listTraces(filters: TraceFilters): Promise<ReadonlyArray<TraceListRow>> {
  const sb = getServerSupabase();
  let query = sb
    .from('atlas_reasoning_traces')
    .select(
      'trace_id, tenant_id, timestamp, trigger, prompt_version, interpretation_confidence, fallback_used, fallback_reason, latency_ms, input_summary, observations, citations, clients:tenant_id(name)',
    )
    .order('timestamp', { ascending: false })
    .limit(100);

  if (filters.tenantId) query = query.eq('tenant_id', filters.tenantId);
  if (filters.promptVersion) query = query.eq('prompt_version', filters.promptVersion);
  if (filters.fallbackUsed) query = query.eq('fallback_used', filters.fallbackUsed === 'true');

  const { data, error } = await query;
  if (error) throw new Error(`listTraces: ${error.message}`);
  return ((data ?? []) as unknown as TraceListRow[]);
}

async function getTraceDetail(traceId: string | undefined): Promise<TraceDetailRow | null> {
  if (!traceId) return null;
  const { data, error } = await getServerSupabase()
    .from('atlas_reasoning_traces')
    .select('* , clients:tenant_id(name)')
    .eq('trace_id', traceId)
    .maybeSingle();
  if (error) throw new Error(`getTraceDetail: ${error.message}`);
  return (data ?? null) as unknown as TraceDetailRow | null;
}

async function listPromptVersions(): Promise<ReadonlyArray<string>> {
  const { data, error } = await getServerSupabase()
    .from('atlas_reasoning_traces')
    .select('prompt_version')
    .order('prompt_version', { ascending: true })
    .limit(500);
  if (error) return [];
  return [...new Set(((data ?? []) as Array<{ prompt_version: string }>).map((row) => row.prompt_version))];
}

async function listTenants(): Promise<ReadonlyArray<{ id: string; name: string }>> {
  const { data, error } = await getServerSupabase()
    .from('clients')
    .select('id, name')
    .order('name', { ascending: true });
  if (error) return [];
  return ((data ?? []) as Array<{ id: string; name: string }>).map((row) => ({
    id: row.id,
    name: row.name,
  }));
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
  if (next.tenantId) params.set('tenantId', next.tenantId);
  if (next.promptVersion) params.set('promptVersion', next.promptVersion);
  if (next.fallbackUsed) params.set('fallbackUsed', next.fallbackUsed);
  if (next.traceId) params.set('traceId', next.traceId);
  const qs = params.toString();
  return qs ? `/admin/atlas/traces?${qs}` : '/admin/atlas/traces';
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
  const params = await searchParams;
  const filters = readFilters(params ?? {});
  const [traces, detail, tenants, promptVersions] = await Promise.all([
    listTraces(filters),
    getTraceDetail(filters.traceId),
    listTenants(),
    listPromptVersions(),
  ]);

  const fallbackCount = traces.filter((trace) => trace.fallback_used).length;
  const lowCount = traces.filter((trace) => trace.interpretation_confidence === 'low').length;
  const avgCitations =
    traces.length === 0
      ? 0
      : traces.reduce((sum, trace) => sum + (Array.isArray(trace.citations) ? trace.citations.length : 0), 0) / traces.length;

  return (
    <AdminCanonShellV2
      agentRail={
        <AgentRail
          primaryAgentLabel="Atlas"
          primaryActionLabel="Open Tower"
          primaryActionHref="/tower"
        />
      }
    >
      <EditorialCanvas
        eyebrow="Setup · Atlas observability"
        title="Atlas reasoning traces"
        subtitle="Operator audit log for Tower right-rail renders and metric explanations. Sample here after each CXO pilot session."
      >
        <div style={S.page} data-testid="atlas-traces-page">
          <section style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: 10 }}>
            <Kpi label="Rows shown" value={String(traces.length)} />
            <Kpi label="Fallbacks" value={String(fallbackCount)} />
            <Kpi label="Low confidence" value={String(lowCount)} />
            <Kpi label="Avg citations" value={avgCitations.toFixed(1)} />
          </section>

          <form action="/admin/atlas/traces" style={S.toolbar}>
            <select name="tenantId" defaultValue={filters.tenantId ?? ''} style={S.control} aria-label="Tenant filter">
              <option value="">All tenants</option>
              {tenants.map((tenant) => (
                <option key={tenant.id} value={tenant.id}>{tenant.name}</option>
              ))}
            </select>
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
            <Link href="/admin/atlas/traces" style={{ ...S.control, textDecoration: 'none', color: '#0f172a' }}>Reset</Link>
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
