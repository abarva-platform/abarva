import { getServerSupabase } from '@/lib/supabase-server';

export interface Partnership {
  partnerClientId: string;
  partnerClientName: string;
  relationshipType: string;
  detail: Record<string, unknown>;
  annualValueUsd: number | null;
  direction: 'outbound' | 'inbound';
}

export interface SharedVendor {
  vendor: string;
  clients: Array<{ clientId: string; clientName: string; useCaseCount: number }>;
}

export interface CrossClientContext {
  currentClientId: string;
  currentClientName: string;
  partnerships: Partnership[];
  sharedVendors: SharedVendor[];
}

/**
 * Query A · shared-touchpoint surface. Pulls every client_partnerships edge
 * where the given clientId is source or target. Used by Nexus to answer
 * "When I'm working with client X, what are my counterparty implications?"
 */
export async function getClientPartnerships(clientId: string): Promise<Partnership[]> {
  const sb = getServerSupabase();
  const [outRes, inRes] = await Promise.all([
    sb
      .from('client_partnerships')
      .select('relationship_type, detail, annual_value_usd, target:clients!client_partnerships_target_client_id_fkey(id, name)')
      .eq('source_client_id', clientId),
    sb
      .from('client_partnerships')
      .select('relationship_type, detail, annual_value_usd, source:clients!client_partnerships_source_client_id_fkey(id, name)')
      .eq('target_client_id', clientId),
  ]);

  const out: Partnership[] = [];
  for (const row of (outRes.data as Array<{ relationship_type: string; detail: Record<string, unknown>; annual_value_usd: number | null; target: { id: string; name: string } | null }> | null) ?? []) {
    if (!row.target) continue;
    out.push({
      partnerClientId: row.target.id,
      partnerClientName: row.target.name,
      relationshipType: row.relationship_type,
      detail: row.detail ?? {},
      annualValueUsd: row.annual_value_usd,
      direction: 'outbound',
    });
  }
  for (const row of (inRes.data as Array<{ relationship_type: string; detail: Record<string, unknown>; annual_value_usd: number | null; source: { id: string; name: string } | null }> | null) ?? []) {
    if (!row.source) continue;
    out.push({
      partnerClientId: row.source.id,
      partnerClientName: row.source.name,
      relationshipType: row.relationship_type,
      detail: row.detail ?? {},
      annualValueUsd: row.annual_value_usd,
      direction: 'inbound',
    });
  }
  return out;
}

/**
 * Query C · vendor-shared posture diff. Finds vendors that appear in
 * tech_stack_items for multiple clients. Use case: "Both Helix and Meridian
 * use Tempus Next — are their DPAs aligned?"
 */
export async function getSharedVendorsWithPeers(clientId: string): Promise<SharedVendor[]> {
  const sb = getServerSupabase();

  // Step 1: vendors the current client uses.
  const { data: myVendors } = await sb
    .from('tech_stack_items')
    .select('vendor_name')
    .eq('client_id', clientId);
  const vendorSet = new Set(((myVendors as Array<{ vendor_name: string }> | null) ?? []).map((v) => v.vendor_name));

  if (vendorSet.size === 0) return [];

  // Step 2: all tech_stack rows for those vendors across all clients, join clients.
  const { data: allRows } = await sb
    .from('tech_stack_items')
    .select('vendor_name, client:clients(id, name)')
    .in('vendor_name', [...vendorSet]);

  const byVendor = new Map<string, Map<string, { name: string; count: number }>>();
  for (const row of (allRows as Array<{ vendor_name: string; client: { id: string; name: string } | null }> | null) ?? []) {
    if (!row.client) continue;
    const vMap = byVendor.get(row.vendor_name) ?? new Map();
    const prev = vMap.get(row.client.id) ?? { name: row.client.name, count: 0 };
    vMap.set(row.client.id, { name: prev.name, count: prev.count + 1 });
    byVendor.set(row.vendor_name, vMap);
  }

  const shared: SharedVendor[] = [];
  for (const [vendor, clientMap] of byVendor) {
    if (clientMap.size < 2) continue; // must appear at more than one client
    shared.push({
      vendor,
      clients: [...clientMap.entries()].map(([clientId, v]) => ({
        clientId,
        clientName: v.name,
        useCaseCount: v.count,
      })),
    });
  }
  shared.sort((a, b) => b.clients.length - a.clients.length);
  return shared;
}

export async function assembleCrossClientContext(clientId: string, clientName: string): Promise<CrossClientContext> {
  const [partnerships, sharedVendors] = await Promise.all([
    getClientPartnerships(clientId),
    getSharedVendorsWithPeers(clientId),
  ]);
  return {
    currentClientId: clientId,
    currentClientName: clientName,
    partnerships,
    sharedVendors,
  };
}

/**
 * Format the cross-client context for inclusion in Nexus's system prompt.
 * Empty-safe — returns '' if there's nothing to surface.
 */
export function formatCrossClientBlock(ctx: CrossClientContext): string {
  if (ctx.partnerships.length === 0 && ctx.sharedVendors.length === 0) return '';

  const lines: string[] = ['CROSS-CLIENT CONTEXT', ''];

  if (ctx.partnerships.length > 0) {
    lines.push(`PARTNERSHIPS (${ctx.currentClientName} has edges to):`);
    const byPartner = new Map<string, Partnership[]>();
    for (const p of ctx.partnerships) {
      const list = byPartner.get(p.partnerClientName) ?? [];
      list.push(p);
      byPartner.set(p.partnerClientName, list);
    }
    for (const [partner, list] of byPartner) {
      lines.push(`· ${partner}`);
      for (const p of list) {
        const detail = Object.entries(p.detail)
          .map(([k, v]) => `${k}: ${JSON.stringify(v)}`)
          .join(', ');
        const value = p.annualValueUsd ? ` · $${(p.annualValueUsd / 1_000_000).toFixed(1)}M/yr` : '';
        lines.push(`    ${p.relationshipType}${value}${detail ? ` · ${detail}` : ''}`);
      }
    }
    lines.push('');
  }

  if (ctx.sharedVendors.length > 0) {
    lines.push('SHARED VENDORS (used by multiple clients in your portfolio):');
    for (const v of ctx.sharedVendors) {
      const others = v.clients.filter((c) => c.clientId !== ctx.currentClientId).map((c) => c.clientName);
      if (others.length === 0) continue;
      lines.push(`· ${v.vendor} — also at ${others.join(', ')}`);
    }
    lines.push('');
  }

  lines.push(
    'Use this sparingly. Surface cross-client connections only when they materially inform the current conversation — never as filler.',
  );
  return lines.join('\n');
}
