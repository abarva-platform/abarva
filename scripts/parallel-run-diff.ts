// scripts/parallel-run-diff.ts
//
// Parallel-run diff harness. Hits the same read-only invariant endpoints
// on two backends (BASE_URL_A, BASE_URL_B) and asserts that the canonical
// per-tenant aggregates match. Output is a Markdown report at
// `parallel-run-diff-results.md`. Exits 0 if all invariants match, 1 if
// any drift is detected.
//
// Run:
//   BASE_URL_A=https://nexus-vert-kappa.vercel.app \
//   BASE_URL_B=https://ca-abarva-web-lab-eastus.<region>.azurecontainerapps.io \
//   PARALLEL_RUN_INVARIANT_TOKEN=<shared-secret> \
//   npm run parallel-run:diff
//
// Read-only. Never POSTs. Safe to run during a live parallel-run window.

import { writeFileSync } from 'fs';
import { join } from 'path';

import {
  buildInvariantReport,
  type DiffReport,
  type InvariantPayload,
} from '../src/lib/parallel-run/invariant-diff';

interface FetchResult {
  url: string;
  ok: boolean;
  status: number | null;
  body: InvariantPayload | null;
  error: string | null;
}

const HEALTH_PATH = '/api/health';
const INVARIANTS_PATH = '/api/admin/parallel-run-invariants';
const REPORT_PATH = join(process.cwd(), 'parallel-run-diff-results.md');

async function fetchJson<T>(url: string, token: string | null): Promise<{
  ok: boolean;
  status: number | null;
  body: T | null;
  error: string | null;
}> {
  try {
    const res = await fetch(url, {
      method: 'GET',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      // Don't follow Clerk redirect interstitials silently — surface them.
      redirect: 'manual',
    });
    const status = res.status;
    let body: T | null = null;
    let parseError: string | null = null;
    try {
      body = (await res.json()) as T;
    } catch (err) {
      parseError = err instanceof Error ? err.message : 'invalid_json';
    }
    return {
      ok: res.ok,
      status,
      body,
      error: res.ok ? null : parseError ?? `http_${status}`,
    };
  } catch (err) {
    return {
      ok: false,
      status: null,
      body: null,
      error: err instanceof Error ? err.message : 'fetch_failed',
    };
  }
}

async function probeBackend(
  baseUrl: string,
  token: string | null,
): Promise<FetchResult> {
  const url = baseUrl.replace(/\/$/, '') + INVARIANTS_PATH;
  const res = await fetchJson<InvariantPayload>(url, token);
  return {
    url,
    ok: res.ok,
    status: res.status,
    body: res.body,
    error: res.error,
  };
}

async function probeHealth(baseUrl: string): Promise<{
  url: string;
  status: number | null;
  postgres: boolean | string | null;
  directPostgres: boolean | string | null;
}> {
  const url = baseUrl.replace(/\/$/, '') + HEALTH_PATH;
  const res = await fetchJson<{ checks?: Record<string, unknown> }>(url, null);
  const checks = (res.body?.checks ?? {}) as Record<string, unknown>;
  return {
    url,
    status: res.status,
    postgres: (checks.postgres as boolean | string | undefined) ?? null,
    directPostgres: (checks.direct_postgres as boolean | string | undefined) ?? null,
  };
}

function fmtMarkdownReport(
  report: DiffReport,
  healthA: Awaited<ReturnType<typeof probeHealth>>,
  healthB: Awaited<ReturnType<typeof probeHealth>>,
  fetchA: FetchResult,
  fetchB: FetchResult,
  baseUrlA: string,
  baseUrlB: string,
): string {
  const lines: string[] = [];
  lines.push('# Parallel-Run Diff Report');
  lines.push('');
  lines.push(`Generated: ${new Date().toISOString()}`);
  lines.push('');
  lines.push(`- Backend A: \`${baseUrlA}\``);
  lines.push(`- Backend B: \`${baseUrlB}\``);
  lines.push('');

  lines.push('## Connectivity');
  lines.push('');
  lines.push('| Backend | /api/health status | postgres | direct_postgres | invariants endpoint |');
  lines.push('|---|---|---|---|---|');
  lines.push(
    `| A | ${healthA.status ?? 'n/a'} | ${String(healthA.postgres)} | ${String(healthA.directPostgres)} | ${fetchA.ok ? 'ok' : `FAIL (${fetchA.error ?? fetchA.status})`} |`,
  );
  lines.push(
    `| B | ${healthB.status ?? 'n/a'} | ${String(healthB.postgres)} | ${String(healthB.directPostgres)} | ${fetchB.ok ? 'ok' : `FAIL (${fetchB.error ?? fetchB.status})`} |`,
  );
  lines.push('');

  lines.push(`## Summary: ${report.matched}/${report.total} invariants matched`);
  lines.push('');
  if (report.skipped.length > 0) {
    lines.push(`Skipped: ${report.skipped.length} (one or both backends unreachable for that comparison)`);
    lines.push('');
  }

  lines.push('## Per-Tenant Results');
  lines.push('');
  lines.push('| Tenant | nodes | edges | context_chunks | segments | programs | top-3 KPI | top-3 patterns | source_events |');
  lines.push('|---|---|---|---|---|---|---|---|---|');
  for (const row of report.perTenant) {
    const cell = (key: keyof typeof row.checks) => {
      const c = row.checks[key];
      if (!c) return 'n/a';
      return c.matched ? 'pass' : 'FAIL';
    };
    lines.push(
      `| ${row.tenantKey} | ${cell('nodes')} | ${cell('edges')} | ${cell('contextChunks')} | ${cell('segments')} | ${cell('programs')} | ${cell('topKpiNames')} | ${cell('topPatternIds')} | ${cell('sourceEvents')} |`,
    );
  }
  lines.push('');

  // Detailed diff blocks for failures only.
  const failures = report.perTenant.flatMap((row) =>
    Object.entries(row.checks)
      .filter(([, c]) => c && !c.matched)
      .map(([k, c]) => ({ tenant: row.tenantKey, key: k, check: c! })),
  );

  if (failures.length > 0) {
    lines.push('## Failing Invariants (detail)');
    lines.push('');
    for (const f of failures) {
      lines.push(`### ${f.tenant} · ${f.key}`);
      lines.push('');
      lines.push('```');
      lines.push(`A: ${JSON.stringify(f.check.a)}`);
      lines.push(`B: ${JSON.stringify(f.check.b)}`);
      if (f.check.note) lines.push(`note: ${f.check.note}`);
      lines.push('```');
      lines.push('');
    }
  }

  lines.push('## Exit Criteria');
  lines.push('');
  lines.push('- All counts (nodes / edges / context_chunks / segments / programs) must match exactly.');
  lines.push('- Top-3 KPI names and top-3 pattern IDs must match exactly in both content and order.');
  lines.push('- Latency is NOT compared here (L8 work).');
  lines.push('- Embedding / vector ordering is NOT compared (non-deterministic by design).');
  lines.push('');

  return lines.join('\n');
}

async function main(): Promise<number> {
  const baseUrlA = process.env.BASE_URL_A?.trim();
  const baseUrlB = process.env.BASE_URL_B?.trim();
  const token = process.env.PARALLEL_RUN_INVARIANT_TOKEN?.trim() ?? null;

  if (!baseUrlA || !baseUrlB) {
    console.error('[parallel-run-diff] BASE_URL_A and BASE_URL_B are required.');
    return 2;
  }
  if (!token) {
    console.error(
      '[parallel-run-diff] PARALLEL_RUN_INVARIANT_TOKEN is required (the bearer secret accepted by /api/admin/parallel-run-invariants on both backends).',
    );
    return 2;
  }

  const [healthA, healthB, fetchA, fetchB] = await Promise.all([
    probeHealth(baseUrlA),
    probeHealth(baseUrlB),
    probeBackend(baseUrlA, token),
    probeBackend(baseUrlB, token),
  ]);

  const report = buildInvariantReport(fetchA.body, fetchB.body);
  const md = fmtMarkdownReport(report, healthA, healthB, fetchA, fetchB, baseUrlA, baseUrlB);
  writeFileSync(REPORT_PATH, md, 'utf8');
  console.log(`[parallel-run-diff] wrote ${REPORT_PATH}`);
  console.log(`[parallel-run-diff] ${report.matched}/${report.total} invariants matched`);

  if (!fetchA.ok || !fetchB.ok) return 1;
  if (report.matched < report.total) return 1;
  return 0;
}

main()
  .then((code) => process.exit(code))
  .catch((err) => {
    console.error('[parallel-run-diff] fatal', err);
    process.exit(1);
  });
