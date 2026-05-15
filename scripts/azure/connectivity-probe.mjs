#!/usr/bin/env node
// Hit /api/health/azure-connectivity locally and print results in a
// human-readable table. Handy for stand-up day — `npm run
// azure:connectivity:probe` against a Container App `az containerapp
// exec`'d Node REPL, or against a port-forwarded dev server.
//
// Env:
//   AZURE_CONNECTIVITY_PROBE_URL — full URL to hit; default
//     http://localhost:3000/api/health/azure-connectivity
//   AZURE_CONNECTIVITY_PROBE_LANE — optional lane suffix:
//     control | private-data | intelligence-model
//   AZURE_CONNECTIVITY_PROBE_BEARER — optional `Authorization:
//     Bearer ...` token (for an admin Clerk session JWT).

const baseUrl = (process.env.AZURE_CONNECTIVITY_PROBE_URL || 'http://localhost:3000/api/health/azure-connectivity').replace(/\/$/, '');
const lane = process.env.AZURE_CONNECTIVITY_PROBE_LANE?.trim();
const url = lane ? `${baseUrl}/${encodeURIComponent(lane)}` : baseUrl;
const bearer = process.env.AZURE_CONNECTIVITY_PROBE_BEARER?.trim();

const headers = {};
if (bearer) headers.Authorization = `Bearer ${bearer}`;

const start = Date.now();
let body;
let status;
try {
  const res = await fetch(url, { method: 'GET', headers });
  status = res.status;
  body = await res.json();
} catch (err) {
  console.error(`[probe] request failed: ${err?.message ?? err}`);
  process.exit(2);
}
const wallMs = Date.now() - start;

const ok = !!body?.ok;
const probes = body?.probes ?? {};
const lanes = body?.lane ?? (lane ?? 'all');

console.log(`Azure connectivity smoke — lane=${lanes} status=${status} ok=${ok} wallMs=${wallMs}`);
console.log('');
const rows = Object.entries(probes).map(([name, r]) => ({
  probe: name,
  status: r?.status ?? 'unknown',
  latencyMs: r?.latencyMs ?? '',
  detail: r?.error ?? r?.reason ?? '',
}));
if (rows.length === 0) {
  console.log('(no probes in response)');
  console.log(JSON.stringify(body, null, 2));
} else {
  const widths = {
    probe: Math.max(5, ...rows.map((r) => r.probe.length)),
    status: Math.max(6, ...rows.map((r) => String(r.status).length)),
    latencyMs: Math.max(9, ...rows.map((r) => String(r.latencyMs).length)),
  };
  const pad = (s, w) => String(s).padEnd(w);
  console.log(`${pad('probe', widths.probe)}  ${pad('status', widths.status)}  ${pad('latencyMs', widths.latencyMs)}  detail`);
  console.log(`${'-'.repeat(widths.probe)}  ${'-'.repeat(widths.status)}  ${'-'.repeat(widths.latencyMs)}  ------`);
  for (const r of rows) {
    console.log(`${pad(r.probe, widths.probe)}  ${pad(r.status, widths.status)}  ${pad(r.latencyMs, widths.latencyMs)}  ${r.detail}`);
  }
}

process.exit(ok && status === 200 ? 0 : 1);
