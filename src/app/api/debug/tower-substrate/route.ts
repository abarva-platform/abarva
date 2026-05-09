import { NextResponse } from 'next/server';
import { getServerSupabase } from '@/lib/supabase-server';
import { CLIENT_KEY_TO_DB_NAME, type ClientKey } from '@/lib/client-config';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const TENANTS: Array<{ key: ClientKey; slugAliases: string[] }> = [
  { key: 'apexretail', slugAliases: ['apexretail', 'apex-retail'] },
  { key: 'meridian', slugAliases: ['meridian', 'meridian-health'] },
  { key: 'arcturus', slugAliases: ['arcturus', 'first-capital', 'first-capital-financial'] },
];

async function resolveClient(key: ClientKey, slugAliases: string[]) {
  const sb = getServerSupabase();
  for (const tenantKey of [key, ...slugAliases]) {
    const { data } = await sb
      .from('clients')
      .select('id, name, tenant_key, slug, industry_code')
      .eq('tenant_key', tenantKey)
      .limit(1);
    if (data?.[0]) return data[0] as ClientRow;
  }

  for (const slug of slugAliases) {
    const { data } = await sb
      .from('clients')
      .select('id, name, tenant_key, slug, industry_code')
      .eq('slug', slug)
      .limit(1);
    if (data?.[0]) return data[0] as ClientRow;
  }

  for (const name of CLIENT_KEY_TO_DB_NAME[key]) {
    const { data } = await sb
      .from('clients')
      .select('id, name, tenant_key, slug, industry_code')
      .ilike('name', `${name}%`)
      .limit(1);
    if (data?.[0]) return data[0] as ClientRow;
  }

  return null;
}

type ClientRow = {
  id: string;
  name: string;
  tenant_key: string | null;
  slug: string | null;
  industry_code: string | null;
};

async function countRows(table: string, column: string, values: string[]) {
  if (values.length === 0) return 0;
  const { count, error } = await getServerSupabase()
    .from(table)
    .select(column, { count: 'exact', head: true })
    .in(column, values);
  if (error) return null;
  return count ?? 0;
}

export async function GET() {
  const sb = getServerSupabase();
  const tenants = [];

  for (const tenant of TENANTS) {
    const client = await resolveClient(tenant.key, tenant.slugAliases);
    if (!client) {
      tenants.push({
        key: tenant.key,
        client: null,
        counts: null,
      });
      continue;
    }

    const { data: initiatives, count: initiativeCount, error: initiativesError } = await sb
      .from('ai_initiatives')
      .select('initiative_id, stage, status_flag', { count: 'exact' })
      .eq('client_id', client.id);

    const initiativeIds = initiatives?.map((row) => String(row.initiative_id)) ?? [];
    const stages: Record<string, number> = {};
    const statuses: Record<string, number> = {};
    for (const row of initiatives ?? []) {
      stages[String(row.stage)] = (stages[String(row.stage)] ?? 0) + 1;
      statuses[String(row.status_flag)] = (statuses[String(row.status_flag)] ?? 0) + 1;
    }

    tenants.push({
      key: tenant.key,
      client: {
        id: client.id,
        name: client.name,
        tenantKey: client.tenant_key,
        slug: client.slug,
        industryCode: client.industry_code,
      },
      counts: initiativesError
        ? { error: initiativesError.message }
        : {
            initiatives: initiativeCount ?? 0,
            vendors: await countRows('ai_initiative_vendors', 'initiative_id', initiativeIds),
            kpis: await countRows('ai_initiative_kpis', 'initiative_id', initiativeIds),
            decisions: await countRows('ai_initiative_decisions', 'initiative_id', initiativeIds),
            stakeholderNotes: await countRows('ai_initiative_stakeholder_notes', 'initiative_id', initiativeIds),
            scenarios: await countRows('ai_initiative_scenarios', 'initiative_id', initiativeIds),
            byStage: stages,
            byStatus: statuses,
          },
    });
  }

  return NextResponse.json({
    ok: true,
    checkedAt: new Date().toISOString(),
    source: 'production-db-counts',
    tenants,
  });
}
