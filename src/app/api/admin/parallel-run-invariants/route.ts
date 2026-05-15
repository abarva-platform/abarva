// GET /api/admin/parallel-run-invariants
//
// Read-only invariant snapshot for parallel-run diff (Vercel prod vs Azure
// lab). Returns canonical, deterministic aggregates per tenant: node/edge
// counts, segment count, program count, top-3 KPI names, top-3 pattern IDs.
//
// Auth model
// ----------
// This endpoint is intentionally NOT behind Clerk. Parallel-run diffs are
// driven by an ops harness (`scripts/parallel-run-diff.ts`) that talks to
// two backends at once and cannot easily forge Clerk sessions for both.
// Instead, it carries a shared bearer secret in the
// `Authorization: Bearer <token>` header that must match the
// `PARALLEL_RUN_INVARIANT_TOKEN` env var on the responding backend. The
// token is constant-time compared. If the env var is unset, the endpoint
// always 403s — never accidentally open.
//
// Response is read-only and contains no PII / secrets. It is safe to log.

import { NextRequest, NextResponse } from 'next/server';
import { timingSafeEqual } from 'crypto';
import { getServerSupabase } from '@/lib/supabase-server';
import {
  CANONICAL_TENANT_KEYS,
  canonicalTenantKey,
} from '@/lib/tenant-keys';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 30;

export interface TenantInvariants {
  tenantKey: string;
  clientId: string | null;
  clientName: string | null;
  nodes: number;
  edges: number;
  contextChunks: number;
  segments: number;
  programs: number;
  topKpiNames: string[];
  topPatternIds: string[];
  sourceEvents: number;
}

export interface ParallelRunInvariantPayload {
  schemaVersion: 1;
  generatedAt: string;
  backendMarker: string;
  tenants: TenantInvariants[];
  totals: {
    nodes: number;
    edges: number;
    contextChunks: number;
    programs: number;
  };
}

type CountQueryResult = {
  count: number | null;
  error: unknown;
};

function tokensMatch(presented: string, expected: string): boolean {
  // Pad to equal length so timingSafeEqual does not throw and so we
  // do not leak the expected length through fast-path early exits.
  const a = Buffer.from(presented);
  const b = Buffer.from(expected);
  if (a.length !== b.length) {
    // Still spend the work — compare against a same-length buffer.
    timingSafeEqual(b, b);
    return false;
  }
  return timingSafeEqual(a, b);
}

function extractBearerToken(req: NextRequest): string | null {
  const header = req.headers.get('authorization');
  if (!header) return null;
  const match = /^Bearer\s+(.+)$/i.exec(header.trim());
  return match ? match[1].trim() : null;
}

async function countWhereTenant(table: string, tenantKey: string): Promise<number> {
  try {
    const sb = getServerSupabase();
    const { count, error } = (await sb
      .from(table)
      .select('*', { count: 'exact', head: true })
      .eq('tenant_key', tenantKey)) as CountQueryResult;
    if (error) return 0;
    return typeof count === 'number' ? count : 0;
  } catch {
    return 0;
  }
}

async function countEngagementsForClient(clientId: string): Promise<number> {
  try {
    const sb = getServerSupabase();
    const { count, error } = (await sb
      .from('engagements')
      .select('*', { count: 'exact', head: true })
      .eq('client_id', clientId)
      .is('archived_at', null)
      .is('deleted_at', null)) as CountQueryResult;
    if (error) return 0;
    return typeof count === 'number' ? count : 0;
  } catch {
    return 0;
  }
}

async function topKpiNames(clientId: string, limit = 3): Promise<string[]> {
  try {
    const sb = getServerSupabase();
    const { data, error } = await sb
      .from('kpis')
      .select('id, name')
      .eq('client_id', clientId)
      .order('id', { ascending: true })
      .limit(limit);
    if (error || !data) return [];
    return (data as Array<{ name?: string | null }>)
      .map((row) => (typeof row.name === 'string' ? row.name : ''))
      .filter((name) => name.length > 0);
  } catch {
    return [];
  }
}

async function topPatternIds(clientId: string, limit = 3): Promise<string[]> {
  try {
    const sb = getServerSupabase();
    const { data, error } = await sb
      .from('pattern_packs')
      .select('id')
      .eq('client_id', clientId)
      .order('id', { ascending: true })
      .limit(limit);
    if (error || !data) return [];
    return (data as Array<{ id?: string | null }>)
      .map((row) => (typeof row.id === 'string' ? row.id : ''))
      .filter((id) => id.length > 0);
  } catch {
    return [];
  }
}

async function clientLookup(
  tenantKey: string,
): Promise<{ id: string; name: string } | null> {
  try {
    const sb = getServerSupabase();
    const { data, error } = await sb
      .from('clients')
      .select('id, name, tenant_key')
      .eq('tenant_key', tenantKey)
      .maybeSingle();
    if (error || !data) return null;
    const row = data as { id: string; name: string | null };
    return { id: row.id, name: row.name ?? tenantKey };
  } catch {
    return null;
  }
}

async function gatherTenant(rawKey: string): Promise<TenantInvariants> {
  const tenantKey = canonicalTenantKey(rawKey) ?? rawKey;
  const client = await clientLookup(tenantKey);
  const [nodes, edges, contextChunks, segments, sourceEvents] = await Promise.all([
    countWhereTenant('enterprise_graph_nodes', tenantKey),
    countWhereTenant('enterprise_graph_edges', tenantKey),
    countWhereTenant('enterprise_context_chunks', tenantKey),
    countWhereTenant('data_inventory_segments', tenantKey),
    countWhereTenant('source_events', tenantKey),
  ]);
  const [programs, kpis, patterns] = await Promise.all([
    client ? countEngagementsForClient(client.id) : Promise.resolve(0),
    client ? topKpiNames(client.id) : Promise.resolve([]),
    client ? topPatternIds(client.id) : Promise.resolve([]),
  ]);
  return {
    tenantKey,
    clientId: client?.id ?? null,
    clientName: client?.name ?? null,
    nodes,
    edges,
    contextChunks,
    segments,
    programs,
    topKpiNames: kpis,
    topPatternIds: patterns,
    sourceEvents,
  };
}

export async function GET(req: NextRequest) {
  const expected = process.env.PARALLEL_RUN_INVARIANT_TOKEN?.trim();
  if (!expected) {
    return NextResponse.json(
      { error: 'forbidden', detail: 'parallel-run invariants disabled on this backend' },
      { status: 403 },
    );
  }
  const presented = extractBearerToken(req);
  if (!presented || !tokensMatch(presented, expected)) {
    return NextResponse.json(
      { error: 'forbidden', detail: 'invalid bearer token' },
      { status: 403 },
    );
  }

  // Backend marker lets the harness label the report column without
  // hardcoding URLs. Vercel sets VERCEL_URL; Azure Container Apps tend
  // to expose CONTAINER_APP_HOSTNAME / WEBSITE_HOSTNAME. Falls back to
  // a generic marker so the field is always present.
  const backendMarker =
    process.env.PARALLEL_RUN_BACKEND_MARKER?.trim()
    || process.env.VERCEL_URL?.trim()
    || process.env.CONTAINER_APP_HOSTNAME?.trim()
    || process.env.WEBSITE_HOSTNAME?.trim()
    || 'unknown-backend';

  const tenants = await Promise.all(
    CANONICAL_TENANT_KEYS.map((key) => gatherTenant(key)),
  );

  const payload: ParallelRunInvariantPayload = {
    schemaVersion: 1,
    generatedAt: new Date().toISOString(),
    backendMarker,
    tenants,
    totals: {
      nodes: tenants.reduce((sum, t) => sum + t.nodes, 0),
      edges: tenants.reduce((sum, t) => sum + t.edges, 0),
      contextChunks: tenants.reduce((sum, t) => sum + t.contextChunks, 0),
      programs: tenants.reduce((sum, t) => sum + t.programs, 0),
    },
  };

  return NextResponse.json(payload, {
    headers: { 'Cache-Control': 'no-store' },
  });
}
