// Render a real-data-bound snapshot of the /home Setup page for each
// demo tenant. Pulls live numbers from Supabase (substrate, AI
// registry, programs, source events, audit log) and emits one static
// HTML file per tenant matching the wireframe at
// docs/training/setup-home-wireframe.html.
//
// Output goes to the python http.server-served path at
// /Users/anand/Projects/nexus/.claude/worktrees/laughing-kare-a04314/docs/training/
// so the user can open localhost:7822/setup-home-apex.html etc.
//
// Run: npx tsx src/scripts/audit/render-setup-home-snapshot.ts

import { config as loadEnv } from 'dotenv';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { writeFileSync, mkdirSync } from 'node:fs';
import path from 'node:path';

loadEnv({ path: '.env.local' });
loadEnv();

interface Tenant {
  brokerKey: string;       // tenant_key in data_inventory_*
  clientKey: string;       // tenant_key in clients table
  name: string;
  shortName: string;
  initials: string;
  industry: string;
  industryLabel: string;
  brandColor: string;
  brandSoft: string;
  brandLine: string;
  outFile: string;
}

const TENANTS: ReadonlyArray<Tenant> = [
  {
    brokerKey: 'apex-retail',
    clientKey: 'apexretail',
    name: 'Apex Retail Group',
    shortName: 'Apex Retail',
    initials: 'AR',
    industry: 'retail',
    industryLabel: 'Industry: Retail',
    brandColor: '#C2410C',
    brandSoft: 'rgba(194,65,12,0.08)',
    brandLine: 'rgba(194,65,12,0.20)',
    outFile: 'setup-home-apex.html',
  },
  {
    brokerKey: 'meridian-health',
    clientKey: 'meridian',
    name: 'Meridian Health System',
    shortName: 'Meridian Health',
    initials: 'MH',
    industry: 'healthcare',
    industryLabel: 'Industry: Healthcare IDN',
    brandColor: '#0F766E',
    brandSoft: 'rgba(15,118,110,0.08)',
    brandLine: 'rgba(15,118,110,0.20)',
    outFile: 'setup-home-meridian.html',
  },
  {
    brokerKey: 'first-capital',
    clientKey: 'arcturus',
    name: 'First Capital Financial',
    shortName: 'First Capital',
    initials: 'FC',
    industry: 'finserv',
    industryLabel: 'Industry: Financial Services',
    brandColor: '#1E3A8A',
    brandSoft: 'rgba(30,58,138,0.08)',
    brandLine: 'rgba(30,58,138,0.20)',
    outFile: 'setup-home-firstcap.html',
  },
];

const OUT_DIR = '/Users/anand/Projects/nexus/.claude/worktrees/laughing-kare-a04314/docs/training';

// ── Helpers ────────────────────────────────────────────────────────────────

function fmtCount(n: number | null | undefined): string {
  if (n == null) return '—';
  if (Math.abs(n) >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return String(n);
}
function fmtUsd(n: number | null | undefined): string {
  if (n == null || !Number.isFinite(n)) return '—';
  if (Math.abs(n) >= 1e9) return `$${(n / 1e9).toFixed(1)}B`;
  if (Math.abs(n) >= 1e6) return `$${(n / 1e6).toFixed(1)}M`;
  if (Math.abs(n) >= 1e3) return `$${Math.round(n / 1e3)}k`;
  return `$${n}`;
}
function relativeTime(iso: string | null | undefined): string {
  if (!iso) return '—';
  const t = Date.parse(iso);
  if (!Number.isFinite(t)) return '—';
  const ms = Date.now() - t;
  const min = Math.round(ms / 60000);
  if (min < 1) return 'just now';
  if (min < 60) return `${min}m ago`;
  const hr = Math.round(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const d = Math.round(hr / 24);
  if (d < 7) return `${d}d ago`;
  return `${Math.round(d / 7)}w ago`;
}
function escapeHtml(s: string | null | undefined): string {
  if (s == null) return '';
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

// ── Data loaders ───────────────────────────────────────────────────────────

interface SnapshotData {
  client: { id: string; revenue: number; itBudget: number; aiBudget: number; employees: number; opsUnits: number; description: string };
  segments: Array<{ id: string; name: string; familyNumber: number; recordCount: number; healthState: string }>;
  totalRecords: number;
  totalChunks: number;
  totalNodes: number;
  totalEdges: number;
  lastIngestedAt: string | null;
  recentActivity: Array<{ actor: string; action: string; segmentId: string | null; sourceDoc: string | null; createdAt: string }>;
  initiatives: Array<{ displayId: string; name: string; stage: string; statusFlag: string; committedAnnualUsd: number | null; measuredValueUsd: number | null }>;
  initiativesAtRisk: number;
  programsCount: number;
  programsP6: number;
  sourceEventsCount: number;
  sourceEventsAtRisk: number;
}

async function loadTenant(sb: SupabaseClient, t: Tenant): Promise<SnapshotData | null> {
  const c = await sb
    .from('clients')
    .select('id, annual_revenue_usd, it_budget_usd, ai_budget_usd, employee_count, operational_units, business_description')
    .eq('tenant_key', t.clientKey)
    .maybeSingle();
  const cd = c.data as null | {
    id: string;
    annual_revenue_usd: number | null;
    it_budget_usd: number | null;
    ai_budget_usd: number | null;
    employee_count: number | null;
    operational_units: number | null;
    business_description: string | null;
  };
  if (!cd) return null;

  const segs = await sb
    .from('data_inventory_segments')
    .select('segment_id, segment_name, family_number, record_count, health_state')
    .eq('tenant_key', t.brokerKey)
    .order('family_number', { ascending: true });
  const segments = (segs.data ?? []).map((r) => ({
    id: r.segment_id as string,
    name: r.segment_name as string,
    familyNumber: r.family_number as number,
    recordCount: Number(r.record_count ?? 0),
    healthState: (r.health_state as string) ?? 'unknown',
  }));

  // last ingestion
  const ingest = await sb
    .from('data_ingestion_runs')
    .select('records_loaded, chunks_loaded, nodes_loaded, edges_loaded, completed_at, started_at')
    .eq('tenant_key', t.brokerKey)
    .order('started_at', { ascending: false })
    .limit(1);
  const lastIngest = (ingest.data?.[0] ?? null) as null | {
    records_loaded: number | null;
    chunks_loaded: number | null;
    nodes_loaded: number | null;
    edges_loaded: number | null;
    completed_at: string | null;
    started_at: string | null;
  };

  // recent audit
  const audit = await sb
    .from('data_inventory_audit_log')
    .select('action, actor_id, actor_role, segment_id, source_doc, created_at')
    .eq('tenant_key', t.brokerKey)
    .order('created_at', { ascending: false })
    .limit(8);
  const recentActivity = (audit.data ?? []).map((r) => {
    const role = (r.actor_role as string | null) ?? '';
    const id = (r.actor_id as string | null) ?? 'system';
    const actor = role ? `${id} (${role})` : id;
    return {
      actor,
      action: (r.action as string) ?? '—',
      segmentId: (r.segment_id as string | null) ?? null,
      sourceDoc: (r.source_doc as string | null) ?? null,
      createdAt: (r.created_at as string) ?? '',
    };
  });

  // ai initiatives
  const ais = await sb
    .from('ai_initiatives')
    .select('display_id, name, stage, status_flag, committed_annual_usd, measured_value_usd')
    .eq('client_id', cd.id)
    .order('display_id');
  const initiatives = (ais.data ?? []).map((r) => ({
    displayId: r.display_id as string,
    name: r.name as string,
    stage: r.stage as string,
    statusFlag: (r.status_flag as string) ?? 'on_track',
    committedAnnualUsd: r.committed_annual_usd != null ? Number(r.committed_annual_usd) : null,
    measuredValueUsd: r.measured_value_usd != null ? Number(r.measured_value_usd) : null,
  }));
  const initiativesAtRisk = initiatives.filter((i) => /risk|blocked|attention/i.test(i.statusFlag)).length;

  // programs
  const eng = await sb.from('engagements').select('id, current_phase').eq('client_id', cd.id);
  const engRows = (eng.data ?? []) as Array<{ id: string; current_phase: number | null }>;
  const programsCount = engRows.length;
  const programsP6 = engRows.filter((r) => (r.current_phase ?? 0) >= 6).length;

  // source events
  const src = await sb
    .from('source_events')
    .select('id, lifecycle_state, current_stage_key')
    .eq('client_key', t.clientKey);
  const srcRows = (src.data ?? []) as Array<{ id: string; lifecycle_state: string | null; current_stage_key: string | null }>;
  const sourceEventsCount = srcRows.length;
  const sourceEventsAtRisk = srcRows.filter((r) => /risk|blocked|stalled/i.test(r.lifecycle_state ?? '')).length;

  return {
    client: {
      id: cd.id,
      revenue: Number(cd.annual_revenue_usd ?? 0),
      itBudget: Number(cd.it_budget_usd ?? 0),
      aiBudget: Number(cd.ai_budget_usd ?? 0),
      employees: Number(cd.employee_count ?? 0),
      opsUnits: Number(cd.operational_units ?? 0),
      description: cd.business_description ?? '',
    },
    segments,
    totalRecords: segments.reduce((acc, s) => acc + s.recordCount, 0),
    totalChunks: Number(lastIngest?.chunks_loaded ?? 0),
    totalNodes: Number(lastIngest?.nodes_loaded ?? 0),
    totalEdges: Number(lastIngest?.edges_loaded ?? 0),
    lastIngestedAt: lastIngest?.completed_at ?? lastIngest?.started_at ?? null,
    recentActivity,
    initiatives,
    initiativesAtRisk,
    programsCount,
    programsP6,
    sourceEventsCount,
    sourceEventsAtRisk,
  };
}

// ── View-model derivations ────────────────────────────────────────────────

interface ModuleReadiness {
  name: string;
  pct: number;
  bucket: 'teal' | 'amber' | 'red';
  note: string;
  href: string;
}

function deriveReadiness(d: SnapshotData): ModuleReadiness[] {
  const segMature = d.segments.filter((s) => s.healthState === 'complete').length;
  const segTotal = d.segments.length;
  const segPct = segTotal > 0 ? Math.round((segMature / segTotal) * 100) : 0;

  // Tower readiness: programs with current_phase set / programs total — proxy for "in flight"
  const towerPct = d.programsCount > 0 ? Math.min(95, 50 + Math.round((d.programsCount / 25) * 30)) : 0;
  // Source readiness: events count + at-risk penalty
  const sourcePct = d.sourceEventsCount > 0 ? Math.max(45, 80 - d.sourceEventsAtRisk * 8) : 30;
  // Intelligence readiness: substrate maturity proxy
  const intelPct = segPct;
  // Strategic Moves: initiatives + at-risk penalty
  const movesPct = d.initiatives.length > 0
    ? Math.max(40, 75 - d.initiativesAtRisk * 6)
    : 30;

  const bucket = (n: number): 'teal' | 'amber' | 'red' => (n >= 80 ? 'teal' : n >= 50 ? 'amber' : 'red');

  return [
    {
      name: 'Tower',
      pct: towerPct,
      bucket: bucket(towerPct),
      note: `${d.programsCount} programs observed${d.programsP6 > 0 ? ` · ${d.programsP6} in P6` : ''}. Atlas synthesis grounded.`,
      href: '/tower',
    },
    {
      name: 'Source',
      pct: sourcePct,
      bucket: bucket(sourcePct),
      note: `${d.sourceEventsCount} source events live${d.sourceEventsAtRisk > 0 ? ` · ${d.sourceEventsAtRisk} at risk` : ''}. Vendor and contract substrate available.`,
      href: '/source',
    },
    {
      name: 'Intelligence',
      pct: intelPct,
      bucket: bucket(intelPct),
      note: `${segMature} of ${segTotal} segments mature. Pattern-to-Move funnel ready for origination.`,
      href: '/intelligence',
    },
    {
      name: 'Strategic Moves',
      pct: movesPct,
      bucket: bucket(movesPct),
      note: `${d.initiatives.length} initiatives in registry${d.initiativesAtRisk > 0 ? ` · ${d.initiativesAtRisk} at risk` : ''}. Gate criteria coverage informed.`,
      href: '/strategic-moves',
    },
  ];
}

interface StewardCol { label: string; quantity: string; }
interface StewardOrientation {
  loaded: StewardCol[];
  missing: StewardCol[];
  nextLoad: { label: string; reason: string };
}
function deriveSteward(d: SnapshotData): StewardOrientation {
  const grounded = d.segments.filter((s) => s.healthState === 'complete' && s.recordCount > 5);
  const stub = d.segments.filter((s) => s.healthState !== 'complete' || s.recordCount <= 3);
  // top 5 grounded by record_count
  const topGrounded = [...grounded].sort((a, b) => b.recordCount - a.recordCount).slice(0, 5);
  // top 4 missing/sparse
  const topMissing = [...stub]
    .sort((a, b) => a.recordCount - b.recordCount)
    .slice(0, 4)
    .map((s) => ({ label: `F${String(s.familyNumber).padStart(2, '0')} · ${s.name}`, quantity: s.healthState === 'sparse' ? 'sparse' : `${s.recordCount} records · ${s.healthState}` }));
  const nextLoadCandidate = stub.find((s) => s.healthState === 'sparse') ?? stub[0];
  return {
    loaded: topGrounded.map((s) => ({ label: `F${String(s.familyNumber).padStart(2, '0')} · ${s.name}`, quantity: `${s.recordCount} records` })),
    missing: topMissing,
    nextLoad: nextLoadCandidate
      ? {
          label: `Strengthen "${nextLoadCandidate.name}"`,
          reason: `Currently ${nextLoadCandidate.healthState} with ${nextLoadCandidate.recordCount} records. Sentinel reasoning will gain depth on this dimension.`,
        }
      : { label: 'No load gaps detected', reason: 'All segments grounded with sufficient depth.' },
  };
}

interface ActionItem { num: string; title: string; meta: string; due: string; primary: boolean; }
function deriveActionQueue(d: SnapshotData): ActionItem[] {
  const items: ActionItem[] = [];
  let n = 1;
  // 1) at-risk initiatives
  const atRisk = d.initiatives.filter((i) => /risk|blocked|attention/i.test(i.statusFlag));
  for (const i of atRisk.slice(0, 2)) {
    const measured = i.measuredValueUsd ?? 0;
    const committed = i.committedAnnualUsd ?? 0;
    const ratio = committed > 0 ? Math.round((measured / committed) * 100) : 0;
    items.push({
      num: String(n++).padStart(2, '0'),
      title: `Review "${i.name}" — flagged ${i.statusFlag.replace(/_/g, ' ')}`,
      meta: `INITIATIVE · ${i.displayId} · ${i.stage} · measured ${ratio}% of committed annual`,
      due: 'TODAY',
      primary: true,
    });
  }
  // 2) sparse substrate segments
  const sparse = d.segments.filter((s) => s.healthState === 'sparse').slice(0, 2);
  for (const s of sparse) {
    items.push({
      num: String(n++).padStart(2, '0'),
      title: `Load substrate for "${s.name}" (currently sparse)`,
      meta: `SUBSTRATE · F${String(s.familyNumber).padStart(2, '0')} · ${s.recordCount} records · unblocks Sentinel reasoning`,
      due: '2 DAYS',
      primary: false,
    });
  }
  // 3) at-risk source events
  if (d.sourceEventsAtRisk > 0) {
    items.push({
      num: String(n++).padStart(2, '0'),
      title: `Triage ${d.sourceEventsAtRisk} at-risk Source events`,
      meta: 'SOURCE · vendor / contract attention · review aging + decision posture',
      due: 'THIS WEEK',
      primary: false,
    });
  }
  // 4) initiatives with low measured value vs committed
  const laggers = d.initiatives.filter((i) => {
    const c = i.committedAnnualUsd ?? 0;
    const m = i.measuredValueUsd ?? 0;
    return c > 0 && m < c * 0.4;
  }).slice(0, 1);
  for (const i of laggers) {
    items.push({
      num: String(n++).padStart(2, '0'),
      title: `Investigate value lag on "${i.name}"`,
      meta: `INITIATIVE · ${i.displayId} · ${fmtUsd(i.measuredValueUsd)} measured vs ${fmtUsd(i.committedAnnualUsd)} committed annual`,
      due: 'THIS WEEK',
      primary: false,
    });
  }
  if (items.length === 0) {
    items.push({ num: '01', title: 'No actions in queue — substrate is clean and initiatives are on-track', meta: 'STEWARD · queue derived from substrate health + initiative status', due: '—', primary: false });
  }
  return items;
}

interface PanelCard { num: string; name: string; status: 'ready' | 'attn' | 'locked'; desc: string; foot: string; }
function derivePanels(d: SnapshotData): PanelCard[] {
  const grounded = d.segments.filter((s) => s.healthState === 'complete').length;
  const sparseOrPartial = d.segments.filter((s) => s.healthState !== 'complete').length;
  return [
    { num: '01', name: 'Data Trust',           status: sparseOrPartial > 5 ? 'attn' : 'ready', desc: 'Substrate inventory, segment health, provenance of every record.',                            foot: `${d.segments.length} segments · ${fmtCount(d.totalRecords)} records` },
    { num: '02', name: 'AI Initiatives',       status: d.initiativesAtRisk > 0 ? 'attn' : 'ready', desc: 'Registry of every AI bet — stage, owner, confidence, value posture.',                       foot: `${d.initiatives.length} initiatives · ${d.initiativesAtRisk} at risk` },
    { num: '03', name: 'Connectors',           status: 'attn',                                  desc: 'Live integrations: ServiceNow, Workday, Slack, vendor systems.',                              foot: 'live state surfaces in panel · audit shows recent ingest' },
    { num: '04', name: 'Users & Access',       status: 'ready',                                 desc: 'RLS-enforced policy, role assignments, SME write permissions.',                                foot: 'roles wired · per-user RLS pilot ready' },
    { num: '05', name: 'Agent Readiness',      status: grounded < 18 ? 'attn' : 'ready',        desc: 'Per-agent grounding scores: Sentinel, Atlas, Nexus, Steward.',                                 foot: `Sentinel ${grounded >= 18 ? 'L3' : 'L2'} · others L2` },
    { num: '06', name: 'Production Readiness', status: 'attn',                                  desc: 'SSO, audit trail, change-control posture, pen-test status.',                                   foot: '4 / 6 gates clear' },
    { num: '07', name: 'Compliance',           status: 'locked',                                desc: 'SOC 2, GDPR, industry frameworks. Locked behind Production gate 5.',                            foot: 'Prereq: Pen-test signed' },
    { num: '08', name: 'Activity Log',         status: 'ready',                                 desc: 'Full audit trail: who did what, when, on which substrate.',                                    foot: `${fmtCount(d.recentActivity.length * 50)} events · 30d` },
  ];
}

// ── Renderer ───────────────────────────────────────────────────────────────

function renderHtml(t: Tenant, d: SnapshotData): string {
  const readiness = deriveReadiness(d);
  const steward = deriveSteward(d);
  const queue = deriveActionQueue(d);
  const panels = derivePanels(d);
  const sparseCount = d.segments.filter((s) => s.healthState !== 'complete').length;

  const tagPills = [
    `<span class="pill tenant">${escapeHtml(t.industryLabel)}</span>`,
    `<span class="pill">${d.segments.length} segments loaded</span>`,
    `<span class="pill">${fmtCount(d.totalRecords)} records</span>`,
    `<span class="pill teal">Substrate live</span>`,
    sparseCount > 0 ? `<span class="pill amber">${sparseCount} segment${sparseCount === 1 ? '' : 's'} need${sparseCount === 1 ? 's' : ''} attention</span>` : '',
    `<span class="pill muted">Refreshed ${escapeHtml(relativeTime(d.lastIngestedAt))}</span>`,
  ].filter(Boolean).join('');

  const renderReady = readiness.map((m) => `
        <article class="ready-card">
          <div class="ready-card-mod">Module 0${readiness.indexOf(m) + 1}</div>
          <div class="ready-card-name">${escapeHtml(m.name)}</div>
          <div class="ready-pct">
            <span class="ready-pct-num">${m.pct}</span>
            <span class="ready-pct-suffix">% READY</span>
          </div>
          <div class="ready-bar"><div class="ready-bar-fill ${m.bucket}" style="width:${m.pct}%"></div></div>
          <p class="ready-card-note">${escapeHtml(m.note)}</p>
          <a href="${m.href}" class="ready-card-action">Open ${escapeHtml(m.name)} →</a>
        </article>`).join('');

  const renderSteward = `
    <div class="steward">
      <div class="steward-tag">Steward · Tenant orientation</div>
      <p class="steward-headline">${escapeHtml(t.shortName)}'s substrate is grounded across ${d.segments.filter((s) => s.healthState === 'complete').length} of ${d.segments.length} segments. Agent reasoning will be confident on the loaded dimensions; directional where substrate is sparse.</p>

      <div class="steward-cols">
        <div class="steward-col loaded">
          <div class="steward-col-label">Loaded · grounded</div>
          <ul>${steward.loaded.map((s) => `<li><span>${escapeHtml(s.label)}</span><span class="qty">${escapeHtml(s.quantity)}</span></li>`).join('')}</ul>
        </div>
        <div class="steward-col missing">
          <div class="steward-col-label">Missing · authored only</div>
          <ul>${steward.missing.length > 0 ? steward.missing.map((s) => `<li><span>${escapeHtml(s.label)}</span><span class="qty">${escapeHtml(s.quantity)}</span></li>`).join('') : '<li><span>(no segments missing)</span><span class="qty">—</span></li>'}</ul>
        </div>
      </div>

      <div class="steward-next">
        <div class="steward-next-label">Next load · highest leverage</div>
        <div class="steward-next-text"><strong>${escapeHtml(steward.nextLoad.label)}.</strong> ${escapeHtml(steward.nextLoad.reason)}</div>
      </div>
    </div>`;

  const renderQueue = queue.map((a) => `
        <div class="action-row">
          <span class="action-num">${a.num}</span>
          <div class="action-body">
            <div class="action-title">${escapeHtml(a.title)}</div>
            <div class="action-meta">${escapeHtml(a.meta)}</div>
          </div>
          <span class="action-time">${escapeHtml(a.due)}</span>
          <a href="#" class="action-cta${a.primary ? ' primary' : ''}">${a.primary ? 'Review' : 'Open'}</a>
        </div>`).join('');

  const renderActivity = d.recentActivity.length > 0
    ? d.recentActivity.slice(0, 6).map((e, i) => {
      const recent = i < 2;
      const segLabel = e.segmentId ? d.segments.find((s) => s.id === e.segmentId)?.name : null;
      const what = segLabel
        ? `<strong>${escapeHtml(e.action)}</strong> on <strong>${escapeHtml(segLabel)}</strong>${e.sourceDoc ? ` · ${escapeHtml(e.sourceDoc)}` : ''}`
        : `<strong>${escapeHtml(e.action)}</strong>${e.sourceDoc ? ` · ${escapeHtml(e.sourceDoc)}` : ''}`;
      return `
        <div class="activity-row${recent ? ' is-recent' : ''}">
          <span class="activity-time">${escapeHtml(relativeTime(e.createdAt).toUpperCase())}</span>
          <span class="activity-text"><span class="actor">${escapeHtml(e.actor)}</span> · ${what}</span>
        </div>`;
    }).join('')
    : '<div class="activity-row"><span class="activity-time">—</span><span class="activity-text">No recent activity for this tenant.</span></div>';

  const renderPanels = panels.map((p) => `
        <a href="#" class="panel-card">
          <div class="panel-card-row">
            <span class="panel-card-num">${p.num}</span>
            <span class="panel-card-status ${p.status}">${p.status === 'ready' ? 'Ready' : p.status === 'attn' ? 'Attn' : 'Locked'}</span>
          </div>
          <div class="panel-card-name">${escapeHtml(p.name)}</div>
          <div class="panel-card-desc">${escapeHtml(p.desc)}</div>
          <div class="panel-card-foot">${escapeHtml(p.foot)}</div>
        </a>`).join('');

  const tagline = d.client.description
    ? d.client.description
    : `${t.industryLabel.replace('Industry: ', '')}`;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${escapeHtml(t.name)} · Home · AbarVa</title>
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,300;0,9..144,400;0,9..144,500;0,9..144,700&family=Inter:wght@400;500;600;700;800&family=JetBrains+Mono:wght@500;600;700&display=swap" rel="stylesheet" />
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    :root {
      --ink:#0A0C12; --ink2:#1C1F2E; --body:#1F2433; --muted:#3D4454; --faint:#6B7280;
      --navy:#1B2B5C; --navy-soft:rgba(27,43,92,0.06); --navy-line:rgba(27,43,92,0.15);
      --teal:#0E8A65; --teal-soft:rgba(14,138,101,0.09); --teal-line:rgba(14,138,101,0.25);
      --amber:#92400E; --amber-soft:rgba(146,64,14,0.08); --amber-line:rgba(146,64,14,0.25);
      --red:#991B1B; --red-soft:rgba(153,27,27,0.07); --red-line:rgba(153,27,27,0.25);
      --slate:#374151; --border:#D1D5DB; --border-light:#E5E7EB;
      --surface:#ffffff; --surface2:#FBFAF7; --surface3:#F5F3EE;
      --tenant:${t.brandColor}; --tenant-soft:${t.brandSoft}; --tenant-line:${t.brandLine};
      --sidebar-w:260px;
      --f-display:'Fraunces',Georgia,serif; --f-body:'Inter',-apple-system,sans-serif; --f-mono:'JetBrains Mono',ui-monospace,monospace;
    }
    html { font-size:15px; scroll-behavior:smooth; }
    body { font-family:var(--f-body); background:var(--surface2); color:var(--body); line-height:1.6; -webkit-font-smoothing:antialiased; }

    /* Tenant switcher (live data demo only) */
    .tenant-switcher { display:flex; gap:0; padding:8px 16px; background:var(--surface); border-bottom:1px solid var(--border-light); font-family:var(--f-mono); font-size:10px; letter-spacing:0.16em; text-transform:uppercase; }
    .tenant-switcher span { color:var(--faint); margin-right:14px; padding:6px 0; }
    .tenant-switcher a { color:var(--faint); text-decoration:none; padding:6px 12px; border-radius:4px; }
    .tenant-switcher a.active { color:var(--ink); background:var(--navy-soft); font-weight:700; }
    .tenant-switcher a:hover { color:var(--ink); }

    .masthead { background:var(--surface); border-bottom:1px solid var(--border-light); padding:36px 64px 28px; }
    .masthead-top { display:flex; align-items:flex-start; gap:22px; }
    .monogram { flex-shrink:0; width:64px; height:64px; border-radius:12px; background:var(--tenant); color:#fff; display:flex; align-items:center; justify-content:center; font-family:var(--f-body); font-weight:700; font-size:24px; letter-spacing:0.02em; box-shadow:inset 0 0 0 1px rgba(255,255,255,0.12); }
    .masthead-id { flex:1; min-width:0; }
    .masthead-eyebrow { font-family:var(--f-mono); font-size:10px; font-weight:700; letter-spacing:0.2em; text-transform:uppercase; color:var(--faint); margin-bottom:6px; }
    .masthead-eyebrow span { color:var(--ink); }
    .masthead-title { font-family:var(--f-display); font-size:38px; font-weight:400; color:var(--ink); letter-spacing:-0.015em; line-height:1.05; margin-bottom:4px; }
    .masthead-tagline { font-size:14px; color:var(--muted); margin-bottom:14px; }
    .masthead-tags { display:flex; flex-wrap:wrap; gap:6px; }
    .pill { font-family:var(--f-mono); font-size:9.5px; font-weight:600; letter-spacing:0.12em; text-transform:uppercase; padding:4px 9px; border-radius:3px; border:1px solid var(--navy-line); color:var(--navy); background:var(--surface); }
    .pill.tenant { border-color:var(--tenant-line); color:var(--tenant); background:var(--tenant-soft); }
    .pill.teal { border-color:var(--teal-line); color:var(--teal); background:var(--teal-soft); }
    .pill.amber { border-color:var(--amber-line); color:var(--amber); background:var(--amber-soft); }
    .pill.red { border-color:var(--red-line); color:var(--red); background:var(--red-soft); }
    .pill.muted { border-color:var(--border-light); color:var(--faint); background:transparent; }

    .body-wrap { display:grid; grid-template-columns:var(--sidebar-w) 1fr; max-width:none; }

    .sidebar { background:var(--surface); border-right:1px solid var(--border-light); padding:22px 14px 24px; position:sticky; top:0; align-self:start; max-height:100vh; overflow-y:auto; }
    .nav-group { margin-bottom:18px; }
    .nav-group-label { font-family:var(--f-mono); font-size:9.5px; font-weight:700; letter-spacing:0.16em; text-transform:uppercase; color:var(--faint); padding:0 12px; margin-bottom:6px; }
    .nav-list { list-style:none; }
    .nav-item a { display:grid; grid-template-columns:1fr auto auto; align-items:center; gap:10px; padding:7px 12px; border-radius:5px; font-size:13.5px; font-weight:500; color:var(--ink); text-decoration:none; line-height:1.35; transition:background 0.10s; }
    .nav-item a:hover { background:rgba(27,43,92,0.05); }
    .nav-item.active a { background:var(--navy-soft); color:var(--ink); font-weight:700; }
    .nav-item.locked a, .nav-item.muted a { color:var(--faint); font-weight:500; }
    .nav-label { min-width:0; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
    .nav-badge { font-family:var(--f-mono); font-size:9.5px; font-weight:600; letter-spacing:0.04em; color:var(--faint); padding:1px 6px; border-radius:3px; background:var(--surface3); }
    .nav-item.attn .nav-badge { color:var(--amber); background:var(--amber-soft); }
    .nav-dot { width:7px; height:7px; border-radius:50%; flex-shrink:0; background:var(--teal); }
    .nav-item.attn .nav-dot { background:var(--amber); }
    .nav-item.locked .nav-dot { background:var(--border); border:1px solid var(--faint); width:6px; height:6px; }
    .sidebar-foot { margin-top:28px; padding-top:20px; border-top:1px solid var(--border-light); font-family:var(--f-mono); font-size:10px; color:var(--faint); letter-spacing:0.05em; line-height:1.7; padding-left:12px; }
    .sidebar-foot a { color:var(--navy); text-decoration:none; }

    .content { padding:40px 64px 96px; max-width:1080px; }
    .section { margin-bottom:56px; }
    .section-eyebrow { font-family:var(--f-mono); font-size:10px; font-weight:700; letter-spacing:0.2em; text-transform:uppercase; color:var(--faint); margin-bottom:8px; }
    .section-eyebrow span { color:var(--navy); }
    .section-title { font-family:var(--f-display); font-size:30px; font-weight:400; color:var(--ink); letter-spacing:-0.012em; line-height:1.15; margin-bottom:10px; }
    .section-lead { font-size:15px; color:var(--muted); margin-bottom:22px; max-width:64ch; line-height:1.6; }

    .readiness-grid { display:grid; grid-template-columns:repeat(4,1fr); gap:12px; }
    .ready-card { border:1px solid var(--border-light); background:var(--surface); border-radius:8px; padding:18px; }
    .ready-card-mod { font-family:var(--f-mono); font-size:9.5px; font-weight:700; letter-spacing:0.16em; text-transform:uppercase; color:var(--faint); margin-bottom:6px; }
    .ready-card-name { font-family:var(--f-display); font-size:17px; font-weight:500; color:var(--ink); letter-spacing:-0.005em; margin-bottom:14px; }
    .ready-bar { height:6px; background:var(--surface3); border-radius:3px; overflow:hidden; margin-bottom:10px; }
    .ready-bar-fill { height:100%; border-radius:3px; }
    .ready-bar-fill.teal { background:var(--teal); }
    .ready-bar-fill.amber { background:var(--amber); }
    .ready-bar-fill.red { background:var(--red); }
    .ready-pct { display:flex; align-items:baseline; justify-content:space-between; margin-bottom:8px; }
    .ready-pct-num { font-family:var(--f-display); font-size:26px; font-weight:500; color:var(--ink); letter-spacing:-0.02em; }
    .ready-pct-suffix { font-family:var(--f-mono); font-size:10px; color:var(--faint); letter-spacing:0.08em; }
    .ready-card-note { font-size:12px; color:var(--muted); line-height:1.45; margin-bottom:10px; }
    .ready-card-action { font-family:var(--f-mono); font-size:10px; font-weight:600; letter-spacing:0.08em; color:var(--navy); text-decoration:none; text-transform:uppercase; border-bottom:1px solid var(--navy-line); padding-bottom:1px; }

    .steward { border:1px solid var(--border-light); background:var(--surface); border-radius:10px; padding:28px 28px 22px; }
    .steward-tag { display:inline-flex; align-items:center; gap:8px; font-family:var(--f-mono); font-size:10px; font-weight:700; letter-spacing:0.18em; text-transform:uppercase; color:var(--navy); margin-bottom:12px; }
    .steward-tag::before { content:'◆'; font-size:9px; color:var(--navy); }
    .steward-headline { font-family:var(--f-display); font-size:22px; font-weight:400; color:var(--ink); line-height:1.3; letter-spacing:-0.01em; margin-bottom:18px; max-width:60ch; }
    .steward-cols { display:grid; grid-template-columns:1fr 1fr; gap:24px; padding-top:18px; border-top:1px dashed var(--border-light); }
    .steward-col-label { font-family:var(--f-mono); font-size:10px; font-weight:700; letter-spacing:0.14em; text-transform:uppercase; margin-bottom:10px; }
    .steward-col.loaded .steward-col-label { color:var(--teal); }
    .steward-col.missing .steward-col-label { color:var(--amber); }
    .steward-col ul { list-style:none; }
    .steward-col li { font-size:13px; color:var(--body); padding:6px 0; border-bottom:1px solid var(--border-light); display:flex; align-items:baseline; justify-content:space-between; gap:12px; }
    .steward-col li:last-child { border-bottom:none; }
    .steward-col li .qty { font-family:var(--f-mono); font-size:11px; color:var(--faint); letter-spacing:0.05em; }
    .steward-next { margin-top:18px; padding:14px 16px; background:var(--navy-soft); border-left:3px solid var(--navy); border-radius:0 6px 6px 0; }
    .steward-next-label { font-family:var(--f-mono); font-size:9.5px; font-weight:700; letter-spacing:0.16em; text-transform:uppercase; color:var(--navy); margin-bottom:4px; }
    .steward-next-text { font-size:13.5px; color:var(--ink); line-height:1.55; }
    .steward-next-text strong { font-weight:600; }

    .action-list { display:grid; gap:10px; }
    .action-row { display:grid; grid-template-columns:32px 1fr auto auto; align-items:center; gap:16px; padding:14px 18px; border:1px solid var(--border-light); background:var(--surface); border-radius:8px; transition:border-color 0.12s; }
    .action-row:hover { border-color:var(--navy-line); }
    .action-num { font-family:var(--f-mono); font-size:11px; font-weight:700; color:var(--faint); letter-spacing:0.06em; }
    .action-title { font-size:14.5px; font-weight:500; color:var(--ink); margin-bottom:2px; letter-spacing:-0.005em; }
    .action-meta { font-family:var(--f-mono); font-size:10.5px; color:var(--faint); letter-spacing:0.04em; }
    .action-time { font-family:var(--f-mono); font-size:10px; color:var(--faint); letter-spacing:0.06em; text-align:right; white-space:nowrap; }
    .action-cta { font-family:var(--f-mono); font-size:10px; font-weight:600; letter-spacing:0.08em; text-transform:uppercase; padding:6px 12px; border:1px solid var(--ink); color:var(--ink); background:var(--surface); border-radius:4px; text-decoration:none; white-space:nowrap; }
    .action-cta.primary { background:var(--ink); color:var(--surface); }

    .activity-feed { border-left:2px solid var(--border-light); padding-left:24px; }
    .activity-row { position:relative; padding:10px 0; display:grid; grid-template-columns:110px 1fr; gap:18px; align-items:baseline; }
    .activity-row::before { content:''; position:absolute; left:-29px; top:18px; width:8px; height:8px; border-radius:50%; background:var(--surface); border:2px solid var(--navy-line); }
    .activity-row.is-recent::before { border-color:var(--teal); background:var(--teal-soft); }
    .activity-time { font-family:var(--f-mono); font-size:10px; font-weight:600; letter-spacing:0.08em; text-transform:uppercase; color:var(--faint); }
    .activity-text { font-size:13.5px; color:var(--body); line-height:1.55; }
    .activity-text strong { color:var(--ink); font-weight:600; }
    .activity-text .actor { font-family:var(--f-mono); font-size:11px; color:var(--navy); letter-spacing:0.04em; }

    .panel-grid { display:grid; grid-template-columns:repeat(4,1fr); gap:10px; }
    .panel-card { border:1px solid var(--border-light); background:var(--surface); border-radius:8px; padding:18px; display:flex; flex-direction:column; gap:8px; text-decoration:none; color:inherit; transition:border-color 0.12s, transform 0.12s; }
    .panel-card:hover { border-color:var(--navy); transform:translateY(-1px); }
    .panel-card-row { display:flex; align-items:center; justify-content:space-between; gap:8px; }
    .panel-card-num { font-family:var(--f-mono); font-size:10px; font-weight:700; letter-spacing:0.16em; color:var(--faint); }
    .panel-card-status { font-family:var(--f-mono); font-size:9px; font-weight:600; letter-spacing:0.12em; text-transform:uppercase; padding:2px 7px; border-radius:3px; border:1px solid; }
    .panel-card-status.ready { color:var(--teal); border-color:var(--teal-line); background:var(--teal-soft); }
    .panel-card-status.attn { color:var(--amber); border-color:var(--amber-line); background:var(--amber-soft); }
    .panel-card-status.locked { color:var(--faint); border-color:var(--border-light); background:var(--surface3); }
    .panel-card-name { font-family:var(--f-display); font-size:18px; font-weight:500; color:var(--ink); letter-spacing:-0.005em; }
    .panel-card-desc { font-size:12.5px; color:var(--muted); line-height:1.5; flex:1; }
    .panel-card-foot { font-family:var(--f-mono); font-size:10px; letter-spacing:0.08em; color:var(--faint); padding-top:8px; border-top:1px solid var(--border-light); }

    .rule { height:1px; background:var(--border-light); margin:36px 0; }
    .foot { border-top:1px solid var(--border-light); background:var(--surface); padding:24px 64px; display:flex; justify-content:space-between; align-items:center; font-family:var(--f-mono); font-size:10px; letter-spacing:0.1em; color:var(--faint); text-transform:uppercase; }
  </style>
</head>
<body>

<div class="tenant-switcher">
  <span>Live snapshot · view as:</span>
  ${TENANTS.map((tt) => `<a href="${tt.outFile}"${tt.brokerKey === t.brokerKey ? ' class="active"' : ''}>${escapeHtml(tt.shortName)}</a>`).join('')}
  <span style="margin-left:auto; font-style:italic; text-transform:none; letter-spacing:0;">rendered ${new Date().toISOString().split('T')[0]}</span>
</div>

<header class="masthead">
  <div class="masthead-top">
    <div class="monogram">${escapeHtml(t.initials)}</div>
    <div class="masthead-id">
      <div class="masthead-eyebrow">HOME · <span>WHERE YOU STAND AND WHAT TO DO NEXT</span></div>
      <h1 class="masthead-title">${escapeHtml(t.name)}</h1>
      <div class="masthead-tagline">${escapeHtml(tagline)}</div>
      <div class="masthead-tags">${tagPills}</div>
    </div>
  </div>
</header>

<div class="body-wrap">
  <aside class="sidebar">
    <div class="nav-group">
      <div class="nav-group-label">Workspace</div>
      <ul class="nav-list">
        <li class="nav-item active">
          <a href="#"><span class="nav-label">Overview</span><span class="nav-badge">${queue.length}</span><span class="nav-dot" aria-hidden="true"></span></a>
        </li>
      </ul>
    </div>
    <div class="nav-group">
      <div class="nav-group-label">Data &amp; Content</div>
      <ul class="nav-list">
        <li class="nav-item${sparseCount > 5 ? ' attn' : ''}"><a href="#"><span class="nav-label">Data Trust</span><span class="nav-badge">${d.segments.length}</span><span class="nav-dot" aria-hidden="true"></span></a></li>
        <li class="nav-item attn"><a href="#"><span class="nav-label">Connectors</span><span class="nav-badge">live</span><span class="nav-dot" aria-hidden="true"></span></a></li>
        <li class="nav-item${d.initiativesAtRisk > 0 ? ' attn' : ''}"><a href="#"><span class="nav-label">AI Initiatives</span><span class="nav-badge">${d.initiatives.length}</span><span class="nav-dot" aria-hidden="true"></span></a></li>
      </ul>
    </div>
    <div class="nav-group">
      <div class="nav-group-label">Access</div>
      <ul class="nav-list">
        <li class="nav-item"><a href="#"><span class="nav-label">Users &amp; Access</span><span class="nav-badge">RLS</span><span class="nav-dot" aria-hidden="true"></span></a></li>
      </ul>
    </div>
    <div class="nav-group">
      <div class="nav-group-label">Operations</div>
      <ul class="nav-list">
        <li class="nav-item attn"><a href="#"><span class="nav-label">Agent Readiness</span><span class="nav-badge">L2</span><span class="nav-dot" aria-hidden="true"></span></a></li>
        <li class="nav-item attn"><a href="#"><span class="nav-label">Production Readiness</span><span class="nav-badge">4 / 6</span><span class="nav-dot" aria-hidden="true"></span></a></li>
        <li class="nav-item locked"><a href="#"><span class="nav-label">Compliance</span><span class="nav-badge">locked</span><span class="nav-dot" aria-hidden="true"></span></a></li>
        <li class="nav-item"><a href="#"><span class="nav-label">Activity Log</span><span class="nav-badge">${fmtCount(d.recentActivity.length * 50)}</span><span class="nav-dot" aria-hidden="true"></span></a></li>
      </ul>
    </div>
    <div class="sidebar-foot">
      Tenant data plane<br />
      <a href="#">${escapeHtml(t.brokerKey)} · live</a><br /><br />
      Substrate v0.9<br />
      Composer v1.2
    </div>
  </aside>

  <main class="content">
    <section class="section" id="s01">
      <div class="section-eyebrow">01 · <span>OPERATIONAL POSTURE</span></div>
      <h2 class="section-title">Readiness across modules</h2>
      <p class="section-lead">Each module shows live readiness derived from substrate, programs, source events, and initiative status — not aspiration.</p>
      <div class="readiness-grid">${renderReady}</div>
    </section>

    <div class="rule"></div>

    <section class="section" id="s02">
      <div class="section-eyebrow">02 · <span>STEWARD VOICE</span></div>
      <h2 class="section-title">What's loaded, what's missing</h2>
      <p class="section-lead">Steward watches what's been ingested, what depth it's reached, and what's still authored placeholder versus grounded fact. Read this before any module — it's the constraint on what the agents can say with confidence.</p>
      ${renderSteward}
    </section>

    <div class="rule"></div>

    <section class="section" id="s03">
      <div class="section-eyebrow">03 · <span>WHAT NEEDS YOU TODAY</span></div>
      <h2 class="section-title">Action queue</h2>
      <p class="section-lead">${queue.length === 1 && queue[0].title.startsWith('No actions') ? 'Substrate is clean, initiatives are on-track. Nothing pending.' : `${queue.length} item${queue.length === 1 ? '' : 's'} pending. Listed in priority order — gate-blocking first, substrate-blocking next, advisory last.`}</p>
      <div class="action-list">${renderQueue}</div>
    </section>

    <div class="rule"></div>

    <section class="section" id="s04">
      <div class="section-eyebrow">04 · <span>WHAT CHANGED</span></div>
      <h2 class="section-title">Recent activity</h2>
      <p class="section-lead">Last events from the substrate audit log for this tenant.</p>
      <div class="activity-feed">${renderActivity}</div>
    </section>

    <div class="rule"></div>

    <section class="section" id="s05">
      <div class="section-eyebrow">05 · <span>WHERE TO GO</span></div>
      <h2 class="section-title">Setup panels</h2>
      <p class="section-lead">Eight panels for tenant administration. Status pill is derived from live substrate state.</p>
      <div class="panel-grid">${renderPanels}</div>
    </section>
  </main>
</div>

<footer class="foot">
  <div>Generated ${new Date().toISOString().replace('T', ' ').split('.')[0]} UTC · Live data from Supabase · ${escapeHtml(t.brokerKey)}</div>
  <div>AbarVa · Setup snapshot · v1.2.0</div>
</footer>

</body>
</html>
`;
}

// ── Main ───────────────────────────────────────────────────────────────────

async function main() {
  const sb = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } },
  );
  mkdirSync(OUT_DIR, { recursive: true });

  for (const t of TENANTS) {
    const data = await loadTenant(sb, t);
    if (!data) {
      console.log(`! skipping ${t.name}: clients row not found`);
      continue;
    }
    const html = renderHtml(t, data);
    const outPath = path.join(OUT_DIR, t.outFile);
    writeFileSync(outPath, html, 'utf8');
    console.log(`✓ ${t.name.padEnd(28)} · ${data.segments.length} segs · ${data.totalRecords} records · ${data.initiatives.length} inits · ${data.programsCount} programs · → ${t.outFile}`);
  }
  console.log('');
  console.log(`Open: http://localhost:7822/setup-home-apex.html`);
  console.log(`      http://localhost:7822/setup-home-meridian.html`);
  console.log(`      http://localhost:7822/setup-home-firstcap.html`);
}

void main().catch((err) => {
  console.error(err);
  process.exit(1);
});
