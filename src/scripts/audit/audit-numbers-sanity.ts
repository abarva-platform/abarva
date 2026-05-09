// Sanity-check loaded substrate numbers against the tenant's
// top-line size (annual revenue, IT budget, employee count). Flags
// values that are too small / too large for a company of that scale.
//
// Run: npx tsx src/scripts/audit/audit-numbers-sanity.ts


import { config as loadEnv } from 'dotenv';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

loadEnv({ path: '.env.local' });
loadEnv();

interface Tenant {
  brokerKey: string;
  clientKey: string;
  name: string;
  industry: string;
}

const TENANTS: ReadonlyArray<Tenant> = [
  { brokerKey: 'apex-retail',     clientKey: 'apexretail', name: 'Apex Retail Group',      industry: 'retail'     },
  { brokerKey: 'meridian-health', clientKey: 'meridian',   name: 'Meridian Health System', industry: 'healthcare' },
  { brokerKey: 'first-capital',   clientKey: 'arcturus',   name: 'First Capital Financial',industry: 'finserv'    },
];

function getSupabase(): SupabaseClient {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } },
  );
}

function fmtUsd(n: number | null | undefined): string {
  if (n == null || !Number.isFinite(n)) return '—';
  if (Math.abs(n) >= 1e9) return `$${(n / 1e9).toFixed(2)}B`;
  if (Math.abs(n) >= 1e6) return `$${(n / 1e6).toFixed(1)}M`;
  if (Math.abs(n) >= 1e3) return `$${Math.round(n / 1e3)}k`;
  return `$${n}`;
}

function pad(s: string, n: number): string {
  return s.length >= n ? s.slice(0, n) : s + ' '.repeat(n - s.length);
}

async function audit(sb: SupabaseClient, t: Tenant) {
  // Top-line from clients table
  const c = await sb
    .from('clients')
    .select('id, annual_revenue_usd, it_budget_usd, ai_budget_usd, employee_count, operational_units, business_description')
    .eq('tenant_key', t.clientKey)
    .maybeSingle();
  const client = c.data as null | {
    id: string;
    annual_revenue_usd: number | null;
    it_budget_usd: number | null;
    ai_budget_usd: number | null;
    employee_count: number | null;
    operational_units: number | null;
    business_description: string | null;
  };
  if (!client) {
    console.log('  no clients row found');
    return;
  }
  const revenue = Number(client.annual_revenue_usd ?? 0);
  const itBudget = Number(client.it_budget_usd ?? 0);
  const aiBudget = Number(client.ai_budget_usd ?? 0);

  console.log('');
  console.log(' TOP LINE (clients table)');
  console.log(`  annual revenue   ${fmtUsd(revenue)}`);
  console.log(`  IT budget        ${fmtUsd(itBudget)}    (${revenue > 0 ? ((itBudget / revenue) * 100).toFixed(1) + '%' : '—'} of revenue)`);
  console.log(`  AI budget        ${fmtUsd(aiBudget)}     (${itBudget > 0 ? ((aiBudget / itBudget) * 100).toFixed(1) + '%' : '—'} of IT)`);
  console.log(`  employees        ${client.employee_count ?? '—'}`);
  console.log(`  ops units        ${client.operational_units ?? '—'} (${t.industry === 'retail' ? 'stores+DCs' : t.industry === 'healthcare' ? 'hospitals+clinics' : 'branches'})`);

  // ── F04 IT spend totals ─────────────────────────────────────────────────
  const f04Seg = await sb.from('data_inventory_segments').select('segment_id').eq('tenant_key', t.brokerKey).eq('family_number', 4).maybeSingle();
  const f04SegId = (f04Seg.data as { segment_id?: string } | null)?.segment_id;
  const f04TotalsByYear: Record<string, number> = {};
  let f04ContractTotal = 0;
  let f04ContractCount = 0;
  if (f04SegId) {
    const recs = await sb
      .from('data_inventory_records')
      .select('record_kind, record_payload')
      .eq('tenant_key', t.brokerKey)
      .eq('segment_id', f04SegId);
    const rows = (recs.data ?? []) as Array<{ record_kind: string; record_payload: Record<string, unknown> | null }>;
    for (const r of rows) {
      if (!r.record_payload) continue;
      const p = r.record_payload as Record<string, unknown>;
      if (r.record_kind === 'it_spend_breakdown') {
        for (const [k, v] of Object.entries(p)) {
          if (!k.match(/^fy\d{4}_/i)) continue;
          const n = typeof v === 'number' ? v : typeof v === 'string' ? Number.parseFloat(v) : NaN;
          if (Number.isFinite(n)) f04TotalsByYear[k] = (f04TotalsByYear[k] ?? 0) + n;
        }
      }
      if (r.record_kind === 'renewal_calendar') {
        const cv = (p.contract_value_usd ?? p.value_usd ?? p.annual_value_usd) as number | undefined;
        if (typeof cv === 'number') {
          f04ContractTotal += cv;
          f04ContractCount += 1;
        }
      }
    }
  }
  console.log('');
  console.log(' F04 · IT financials substrate · sum across all rows');
  for (const k of Object.keys(f04TotalsByYear).sort()) {
    const total = f04TotalsByYear[k];
    const pct = revenue > 0 ? ((total / revenue) * 100).toFixed(2) : '—';
    const itPct = itBudget > 0 ? ((total / itBudget) * 100).toFixed(0) : '—';
    console.log(`  ${pad(k, 26)} ${fmtUsd(total).padEnd(10)}  (${pct}% of revenue, ${itPct}% of IT budget)`);
  }
  if (f04ContractCount > 0) {
    console.log(`  renewal_calendar contracts: ${f04ContractCount} rows · total contract value ${fmtUsd(f04ContractTotal)}`);
  }

  // ── F15 quarterly KPIs · sample big-number checks ───────────────────────
  const f15Seg = await sb.from('data_inventory_segments').select('segment_id').eq('tenant_key', t.brokerKey).eq('family_number', 15).maybeSingle();
  const f15SegId = (f15Seg.data as { segment_id?: string } | null)?.segment_id;
  if (f15SegId) {
    const recs = await sb
      .from('data_inventory_records')
      .select('title, record_payload')
      .eq('tenant_key', t.brokerKey)
      .eq('segment_id', f15SegId);
    const rows = (recs.data ?? []) as Array<{ title: string; record_payload: Record<string, unknown> | null }>;
    // Find the most-recent quarter for each KPI title
    const latestByKpi = new Map<string, { period: string; value: string }>();
    for (const r of rows) {
      const p = r.record_payload;
      if (!p) continue;
      const period = (p.period as string) ?? '';
      const value = (p.value as string) ?? '';
      const existing = latestByKpi.get(r.title);
      if (!existing || existing.period < period) latestByKpi.set(r.title, { period, value });
    }
    console.log('');
    console.log(' F15 · KPI quarterly history · most recent value per KPI (sanity check)');
    const big: Array<[string, { period: string; value: string }]> = [];
    for (const [k, v] of latestByKpi) {
      // Show only revenue / margin / spend / cost-shaped KPIs
      if (k.match(/revenue|margin|spend|cost|net|aum|deposit|loan/i)) big.push([k, v]);
    }
    big.sort((a, b) => a[0].localeCompare(b[0]));
    for (const [k, v] of big.slice(0, 12)) {
      console.log(`  ${pad(k, 50)} ${pad(v.period, 14)} ${v.value}`);
    }
  }

  // ── ai_initiatives committed totals ─────────────────────────────────────
  const inits = await sb
    .from('ai_initiatives')
    .select('display_id, name, committed_annual_usd, measured_value_usd')
    .eq('client_id', client.id);
  const ai = (inits.data ?? []) as Array<{
    display_id: string;
    name: string;
    committed_annual_usd: number | string | null;
    measured_value_usd: number | string | null;
  }>;
  let totalAnnual = 0;
  let totalMeasured = 0;
  for (const r of ai) {
    const a = typeof r.committed_annual_usd === 'string' ? Number.parseFloat(r.committed_annual_usd) : (r.committed_annual_usd ?? 0);
    const m = typeof r.measured_value_usd === 'string' ? Number.parseFloat(r.measured_value_usd) : (r.measured_value_usd ?? 0);
    if (Number.isFinite(a)) totalAnnual += a;
    if (Number.isFinite(m)) totalMeasured += m;
  }
  console.log('');
  console.log(' ai_initiatives · sum across registry');
  const aiCovered = aiBudget > 0 ? ((totalAnnual / aiBudget) * 100).toFixed(1) : '—';
  console.log(`  ${ai.length} initiatives · committed annual ${fmtUsd(totalAnnual)} (${aiCovered}% of AI budget) · measured value ${fmtUsd(totalMeasured)}`);

  // ── Reasonableness flags ────────────────────────────────────────────────
  console.log('');
  console.log(' ⚠ SANITY FLAGS');
  const flags: string[] = [];

  if (revenue > 0 && itBudget > 0) {
    const itPctOfRev = (itBudget / revenue) * 100;
    if (t.industry === 'retail' && (itPctOfRev < 1.5 || itPctOfRev > 3.5)) {
      flags.push(`IT budget ${itPctOfRev.toFixed(1)}% of revenue · retail typical 1.5–3.5%`);
    }
    if (t.industry === 'healthcare' && (itPctOfRev < 3 || itPctOfRev > 6)) {
      flags.push(`IT budget ${itPctOfRev.toFixed(1)}% of revenue · healthcare IDN typical 3–6%`);
    }
    if (t.industry === 'finserv' && (itPctOfRev < 5 || itPctOfRev > 10)) {
      flags.push(`IT budget ${itPctOfRev.toFixed(1)}% of revenue · regional bank typical 5–10%`);
    }
  }

  if (revenue > 0 && Object.keys(f04TotalsByYear).length > 0) {
    // Pick the most recent FY actual or planned
    const sortedKeys = Object.keys(f04TotalsByYear).sort();
    const latest = f04TotalsByYear[sortedKeys[sortedKeys.length - 1]];
    if (latest > itBudget * 1.5) {
      flags.push(`F04 substrate sums to ${fmtUsd(latest)} for ${sortedKeys[sortedKeys.length - 1]} — exceeds IT budget ${fmtUsd(itBudget)} by 50%+`);
    }
    if (latest < itBudget * 0.3) {
      flags.push(`F04 substrate sums to ${fmtUsd(latest)} for ${sortedKeys[sortedKeys.length - 1]} — only ${((latest / itBudget) * 100).toFixed(0)}% of IT budget ${fmtUsd(itBudget)}`);
    }
  }

  if (t.industry === 'healthcare' && f15SegId) {
    // Net Patient Service Revenue · quarterly · should be ~revenue/4 minus a bit
    const recs = await sb
      .from('data_inventory_records')
      .select('title, record_payload')
      .eq('tenant_key', t.brokerKey)
      .eq('segment_id', f15SegId);
    const rows = (recs.data ?? []) as Array<{ title: string; record_payload: Record<string, unknown> | null }>;
    let q1y2026: number | null = null;
    for (const r of rows) {
      if (!/net patient service revenue/i.test(r.title)) continue;
      const p = r.record_payload;
      if (!p) continue;
      if ((p.period as string) === 'FY2026_Q1') {
        const v = (p.value as string) ?? '';
        const m = v.match(/\$?([\d.]+)([MBK])?/i);
        if (m) {
          const num = Number.parseFloat(m[1]);
          const mult = m[2]?.toUpperCase() === 'B' ? 1e9 : m[2]?.toUpperCase() === 'M' ? 1e6 : m[2]?.toUpperCase() === 'K' ? 1e3 : 1;
          q1y2026 = num * mult;
        }
      }
    }
    if (q1y2026 != null) {
      const annualized = q1y2026 * 4;
      const pctOfTopline = (annualized / revenue) * 100;
      if (pctOfTopline < 70 || pctOfTopline > 100) {
        flags.push(`Net Patient Service Revenue Q1 2026 = ${fmtUsd(q1y2026)} → annualized ${fmtUsd(annualized)} = ${pctOfTopline.toFixed(0)}% of $${(revenue / 1e9).toFixed(1)}B top-line · expected 70–95% for an IDN`);
      }
    }
  }

  if (revenue > 0 && totalAnnual > 0) {
    const aiPct = (totalAnnual / revenue) * 100;
    if (aiPct < 0.02) {
      flags.push(`ai_initiatives committed annual ${fmtUsd(totalAnnual)} is only ${aiPct.toFixed(3)}% of revenue — likely under-loaded`);
    }
  }

  if (flags.length === 0) {
    console.log('  ✓ no flags');
  } else {
    for (const f of flags) console.log(`  • ${f}`);
  }
}

async function main() {
  const sb = getSupabase();
  for (const t of TENANTS) {
    console.log('');
    console.log('═'.repeat(96));
    console.log(` ${t.name}  ·  ${t.industry}`);
    console.log('═'.repeat(96));
    await audit(sb, t);
  }
  console.log('');
}

void main().catch((err) => {
  console.error('audit failed:', err);
  process.exit(1);
});
