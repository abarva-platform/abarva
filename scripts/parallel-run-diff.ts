// scripts/parallel-run-diff.ts
//
// Parallel-run diff harness (Lane D — cutover decision tool).
//
// Compares the canonical app domain (left) against a candidate ACA path
// (right) and produces a founder-readable pass / warn / fail / preflight-
// blocked report so a non-engineer can answer one question:
//
//   "Does Azure return the same tenant facts we trust in production?"
//
// It is designed to produce a USEFUL report even when some checks cannot
// run — connectivity invariants always run with no auth; tenant-fact
// invariants need a bearer token; authenticated-surface checks need a
// session cookie. Missing credentials yield `preflight-blocked` rows, not
// a hard abort.
//
// Usage:
//   npx tsx scripts/parallel-run-diff.ts \
//     --left-base-url  https://app.abarva.ai \
//     --right-base-url https://ca-abarva-web-lab-eastus.<region>.azurecontainerapps.io \
//     [--tenant apex-retail] [--tenant meridian-health] \
//     [--invariant-token <shared-secret>] \
//     [--auth-cookie '__session=...'] \
//     [--auth-probe-path /intelligence] \
//     [--json  parallel-run-diff-results.json] \
//     [--markdown parallel-run-diff-results.md]
//
// Env fallbacks (a flag always wins over its env var):
//   --left-base-url     <- BASE_URL_A
//   --right-base-url    <- BASE_URL_B
//   --invariant-token   <- PARALLEL_RUN_INVARIANT_TOKEN
//   --auth-cookie       <- PARALLEL_RUN_AUTH_COOKIE
//
// Exit codes:
//   0  no failing checks (warn / preflight-blocked are allowed)
//   1  at least one failing check
//   2  bad / missing arguments
//
// Read-only by construction. Never POSTs. Safe to run during a live demo.

import { writeFileSync } from 'fs';
import { join, isAbsolute } from 'path';

import {
  buildParallelRunDiff,
  type AuthProbe,
  type BackendHealth,
  type BackendProbe,
  type InvariantLine,
  type InvariantPayload,
  type ParallelRunDiff,
} from '../src/lib/parallel-run/invariant-diff';

const HEALTH_PATH = '/api/health';
const INVARIANTS_PATH = '/api/admin/parallel-run-invariants';
const DEFAULT_AUTH_PROBE_PATH = '/intelligence';

interface CliArgs {
  leftBaseUrl: string;
  rightBaseUrl: string;
  leftLabel: string;
  rightLabel: string;
  tenants: string[] | null;
  invariantToken: string | null;
  authCookie: string | null;
  authProbePath: string;
  jsonPath: string;
  markdownPath: string;
}

function parseArgs(argv: string[]): CliArgs | { error: string } {
  const flags = new Map<string, string[]>();
  for (let i = 0; i < argv.length; i += 1) {
    const tok = argv[i];
    if (!tok.startsWith('--')) continue;
    const eq = tok.indexOf('=');
    let key: string;
    let val: string;
    if (eq !== -1) {
      key = tok.slice(2, eq);
      val = tok.slice(eq + 1);
    } else {
      key = tok.slice(2);
      val = argv[i + 1] && !argv[i + 1].startsWith('--') ? argv[(i += 1)] : '';
    }
    const list = flags.get(key) ?? [];
    list.push(val);
    flags.set(key, list);
  }
  const one = (k: string): string | null => {
    const v = flags.get(k);
    return v && v.length > 0 ? v[v.length - 1].trim() : null;
  };

  const leftBaseUrl = one('left-base-url') || process.env.BASE_URL_A?.trim() || '';
  const rightBaseUrl = one('right-base-url') || process.env.BASE_URL_B?.trim() || '';
  if (!leftBaseUrl || !rightBaseUrl) {
    return {
      error:
        'both --left-base-url and --right-base-url are required (or BASE_URL_A / BASE_URL_B env vars)',
    };
  }

  // --tenant may be repeated or comma-separated. null => all canonical tenants.
  const tenantTokens = (flags.get('tenant') ?? []).flatMap((v) =>
    v.split(',').map((s) => s.trim()).filter(Boolean),
  );
  const tenants = tenantTokens.length > 0 ? Array.from(new Set(tenantTokens)) : null;

  const stripTrailingSlash = (u: string) => u.replace(/\/+$/, '');

  return {
    leftBaseUrl: stripTrailingSlash(leftBaseUrl),
    rightBaseUrl: stripTrailingSlash(rightBaseUrl),
    leftLabel: one('left-label') || 'prod',
    rightLabel: one('right-label') || 'azure-lab',
    tenants,
    invariantToken:
      one('invariant-token') || process.env.PARALLEL_RUN_INVARIANT_TOKEN?.trim() || null,
    authCookie: one('auth-cookie') || process.env.PARALLEL_RUN_AUTH_COOKIE?.trim() || null,
    authProbePath: one('auth-probe-path') || DEFAULT_AUTH_PROBE_PATH,
    jsonPath: one('json') || 'parallel-run-diff-results.json',
    markdownPath: one('markdown') || 'parallel-run-diff-results.md',
  };
}

interface RawFetch<T> {
  ok: boolean;
  status: number | null;
  body: T | null;
  error: string | null;
}

async function fetchJson<T>(
  url: string,
  headers: Record<string, string>,
): Promise<RawFetch<T>> {
  try {
    const res = await fetch(url, { method: 'GET', headers, redirect: 'manual' });
    let body: T | null = null;
    let parseError: string | null = null;
    try {
      body = (await res.json()) as T;
    } catch (err) {
      parseError = err instanceof Error ? err.message : 'invalid_json';
    }
    return {
      ok: res.status >= 200 && res.status < 400,
      status: res.status,
      body,
      error: res.status >= 200 && res.status < 400 ? null : parseError ?? `http_${res.status}`,
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

async function probeHealth(baseUrl: string): Promise<BackendHealth> {
  const res = await fetchJson<{ checks?: Record<string, unknown>; status?: unknown }>(
    baseUrl + HEALTH_PATH,
    {},
  );
  const checks = (res.body?.checks ?? {}) as Record<string, unknown>;
  const pgRaw = checks.postgres ?? checks.direct_postgres ?? null;
  return {
    reachable: res.status !== null,
    status: res.status,
    postgres: pgRaw === null || pgRaw === undefined ? null : String(pgRaw),
    error: res.error,
  };
}

async function probeInvariants(
  baseUrl: string,
  token: string | null,
): Promise<{ payload: InvariantPayload | null; status: number | null; error: string | null }> {
  if (!token) return { payload: null, status: null, error: 'no_token' };
  const res = await fetchJson<InvariantPayload>(baseUrl + INVARIANTS_PATH, {
    Authorization: `Bearer ${token}`,
  });
  return { payload: res.ok ? res.body : null, status: res.status, error: res.error };
}

async function probeAuthSurface(
  baseUrl: string,
  cookie: string | null,
  path: string,
): Promise<AuthProbe> {
  if (!cookie) {
    return { attempted: false, path: null, status: null, ok: false, error: null };
  }
  try {
    const res = await fetch(baseUrl + path, {
      method: 'GET',
      headers: { Cookie: cookie },
      redirect: 'manual',
    });
    // A valid session returns 200. A missing/invalid session returns a
    // 3xx redirect to the Clerk sign-in interstitial.
    const ok = res.status === 200;
    return {
      attempted: true,
      path,
      status: res.status,
      ok,
      error: ok ? null : `unexpected_status_${res.status}`,
    };
  } catch (err) {
    return {
      attempted: true,
      path,
      status: null,
      ok: false,
      error: err instanceof Error ? err.message : 'fetch_failed',
    };
  }
}

async function gather(
  label: string,
  baseUrl: string,
  args: CliArgs,
): Promise<BackendProbe> {
  const [health, invariants, authProbe] = await Promise.all([
    probeHealth(baseUrl),
    probeInvariants(baseUrl, args.invariantToken),
    probeAuthSurface(baseUrl, args.authCookie, args.authProbePath),
  ]);
  return {
    label,
    baseUrl,
    health,
    invariants: invariants.payload,
    invariantsStatus: invariants.status,
    invariantsError: invariants.error,
    authProbe,
  };
}

const SEVERITY_GLYPH: Record<InvariantLine['severity'], string> = {
  pass: 'PASS',
  warn: 'WARN',
  fail: 'FAIL',
  'preflight-blocked': 'BLOCKED',
};

function renderMarkdown(diff: ParallelRunDiff, args: CliArgs): string {
  const v = diff.verdict;
  const banner =
    v.overall === 'green' ? 'GREEN' : v.overall === 'yellow' ? 'YELLOW' : 'RED';
  const out: string[] = [];
  out.push('# Parallel-Run Diff — Cutover Readiness');
  out.push('');
  out.push(`Generated: ${diff.generatedAt}`);
  out.push('');
  out.push(`## Verdict: ${banner}`);
  out.push('');
  out.push(`> ${v.headline}`);
  out.push('');
  out.push(
    `**${v.pass} pass · ${v.warn} warn · ${v.fail} fail · ${v.preflightBlocked} preflight-blocked**`,
  );
  out.push('');
  out.push(`- Left (current prod): \`${diff.left.label}\` — ${diff.left.baseUrl}`);
  out.push(`- Right (Azure lab): \`${diff.right.label}\` — ${diff.right.baseUrl}`);
  if (args.tenants) out.push(`- Tenant filter: ${args.tenants.join(', ')}`);
  out.push('');

  const sections: Array<[InvariantLine['category'], string]> = [
    ['connectivity', 'Connectivity (no auth required)'],
    ['tenant-fact', 'Tenant-Fact Invariants (bearer token required)'],
    ['authenticated-surface', 'Authenticated Surface (session cookie required)'],
  ];
  for (const [cat, title] of sections) {
    const rows = diff.lines.filter((l) => l.category === cat);
    if (rows.length === 0) continue;
    out.push(`## ${title}`);
    out.push('');
    out.push('| Check | Tenant | Left | Right | Result | Note |');
    out.push('|---|---|---|---|---|---|');
    for (const r of rows) {
      out.push(
        `| ${r.label} | ${r.tenantKey ?? '—'} | ${r.left} | ${r.right} | ${SEVERITY_GLYPH[r.severity]} | ${r.note ?? ''} |`,
      );
    }
    out.push('');
  }

  out.push('## How To Read This');
  out.push('');
  out.push('- **PASS** — both backends agree.');
  out.push('- **WARN** — small count drift (<=5); likely an in-flight writer. Rerun in 60s.');
  out.push('- **FAIL** — real divergence. Cutover is blocked until resolved.');
  out.push(
    '- **BLOCKED** — the check could not run because a token or cookie was not supplied. Not a failure — supply the credential and rerun.',
  );
  out.push('');
  out.push('## Next Step');
  out.push('');
  if (v.fail > 0) {
    out.push('Investigate the FAIL rows above. Do not "fix forward" by mutating production data — fix the writer / copy job. See `PARALLEL-RUN-DIFF-PROTOCOL.md`.');
  } else if (v.preflightBlocked > 0) {
    out.push(
      'Re-run with the missing credential(s) to complete the proof: `--invariant-token` for tenant-fact invariants, `--auth-cookie` for the authenticated surface check.',
    );
  } else {
    out.push(
      'This run is clean. The cutover gate requires three consecutive clean runs >=60s apart — see `PARALLEL-RUN-DIFF-PROTOCOL.md`.',
    );
  }
  out.push('');
  return out.join('\n');
}

function renderConsole(diff: ParallelRunDiff): void {
  const v = diff.verdict;
  const banner =
    v.overall === 'green' ? 'GREEN' : v.overall === 'yellow' ? 'YELLOW' : 'RED';
  console.log('');
  console.log(`PARALLEL-RUN DIFF — verdict: ${banner}`);
  console.log(`  ${v.headline}`);
  console.log(
    `  ${v.pass} pass | ${v.warn} warn | ${v.fail} fail | ${v.preflightBlocked} preflight-blocked`,
  );
  console.log('');
  for (const l of diff.lines) {
    const tenant = l.tenantKey ? ` [${l.tenantKey}]` : '';
    console.log(
      `  ${SEVERITY_GLYPH[l.severity].padEnd(8)} ${l.label}${tenant}: ${l.left} vs ${l.right}`,
    );
  }
  console.log('');
}

function resolveOut(p: string): string {
  return isAbsolute(p) ? p : join(process.cwd(), p);
}

async function main(): Promise<number> {
  const parsed = parseArgs(process.argv.slice(2));
  if ('error' in parsed) {
    console.error(`[parallel-run-diff] ${parsed.error}`);
    console.error('[parallel-run-diff] run with --help for usage');
    return 2;
  }
  const args = parsed;

  const [left, right] = await Promise.all([
    gather(args.leftLabel, args.leftBaseUrl, args),
    gather(args.rightLabel, args.rightBaseUrl, args),
  ]);

  const diff = buildParallelRunDiff({
    left,
    right,
    tenantFilter: args.tenants,
    invariantTokenSupplied: args.invariantToken !== null,
    authCookieSupplied: args.authCookie !== null,
  });

  const jsonOut = resolveOut(args.jsonPath);
  const mdOut = resolveOut(args.markdownPath);
  writeFileSync(jsonOut, JSON.stringify(diff, null, 2) + '\n', 'utf8');
  writeFileSync(mdOut, renderMarkdown(diff, args), 'utf8');

  renderConsole(diff);
  console.log(`[parallel-run-diff] JSON     -> ${jsonOut}`);
  console.log(`[parallel-run-diff] Markdown -> ${mdOut}`);

  return diff.verdict.fail > 0 ? 1 : 0;
}

if (process.argv.includes('--help') || process.argv.includes('-h')) {
  console.log(
    [
      'parallel-run-diff — compare current prod vs Azure lab for tenant-fact parity',
      '',
      'Required:',
      '  --left-base-url   <url>   current prod base URL  (env: BASE_URL_A)',
      '  --right-base-url  <url>   Azure lab base URL     (env: BASE_URL_B)',
      '',
      'Optional:',
      '  --tenant <key>            restrict to a tenant (repeatable / comma-separated)',
      '  --invariant-token <tok>   bearer token for /api/admin/parallel-run-invariants',
      '                            (env: PARALLEL_RUN_INVARIANT_TOKEN)',
      '  --auth-cookie <cookie>    session cookie for the authenticated-surface probe',
      '                            (env: PARALLEL_RUN_AUTH_COOKIE)',
      '  --auth-probe-path <path>  authenticated surface to probe (default /intelligence)',
      '  --left-label / --right-label   founder-readable labels',
      '  --json <path>             JSON output  (default parallel-run-diff-results.json)',
      '  --markdown <path>         Markdown out (default parallel-run-diff-results.md)',
      '',
      'Exit: 0 = no failures, 1 = at least one failure, 2 = bad arguments',
    ].join('\n'),
  );
  process.exit(0);
} else {
  main()
    .then((code) => process.exit(code))
    .catch((err) => {
      console.error('[parallel-run-diff] fatal', err);
      process.exit(1);
    });
}
