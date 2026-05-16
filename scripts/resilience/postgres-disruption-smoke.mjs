#!/usr/bin/env node

const DEFAULT_PATH = '/api/health/postgres-disruption';

function readArg(name) {
  const prefix = `--${name}=`;
  const inline = process.argv.find((arg) => arg.startsWith(prefix));
  if (inline) return inline.slice(prefix.length);
  const idx = process.argv.indexOf(`--${name}`);
  if (idx >= 0) return process.argv[idx + 1];
  return undefined;
}

function boolArg(name) {
  return process.argv.includes(`--${name}`);
}

function required(value, label) {
  if (!value || !String(value).trim()) {
    throw new Error(`${label} is required`);
  }
  return String(value).trim();
}

function leakDetected(text) {
  return /\[stream error:|postgresql:\/\/|DATABASE_URL|SUPABASE_SERVICE_ROLE_KEY|ECONNREFUSED|ENOTFOUND|ETIMEDOUT|Sequelize|PrismaClient|node_modules\/pg|\bat\s+.+route/i.test(text);
}

function parseJson(text) {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

function syntheticResponse() {
  return {
    status: 503,
    text: JSON.stringify({
      event: 'postgres_disruption_drill',
      status: 'degraded',
      ok: false,
      checks: { postgres: false, direct_postgres: false, read_model: 'degraded' },
      degradation: {
        mode: 'protected_read_only',
        userMessage:
          'AbarVa is temporarily running in protected read-only mode while the database path recovers. Tenant data has not been changed; retry the action in a few minutes or continue from cached executive views.',
        dataChanged: false,
        retry: 'safe_to_retry_same_surface',
      },
      error: 'postgres_unavailable',
    }),
  };
}

async function fetchLive(baseUrl, token) {
  const url = new URL(DEFAULT_PATH, baseUrl);
  const res = await fetch(url, {
    headers: {
      'x-abarva-l9-postgres-drill-token': token,
      'x-abarva-health-token': token,
    },
  });
  return { status: res.status, text: await res.text(), url: url.toString() };
}

function evaluate({ status, text, url = 'dry-run' }) {
  const body = parseJson(text);
  const checks = [];

  checks.push({
    name: 'http_503_degraded',
    pass: status === 503,
    detail: `expected HTTP 503, got ${status}`,
  });
  checks.push({
    name: 'event_contract',
    pass: body?.event === 'postgres_disruption_drill' && body?.status === 'degraded',
    detail: `event=${body?.event ?? 'missing'} status=${body?.status ?? 'missing'}`,
  });
  checks.push({
    name: 'tenant_data_not_changed',
    pass: body?.degradation?.dataChanged === false,
    detail: `dataChanged=${String(body?.degradation?.dataChanged)}`,
  });
  checks.push({
    name: 'protected_read_only_message',
    pass: /protected read-only mode/i.test(body?.degradation?.userMessage ?? '')
      && /Tenant data has not been changed/i.test(body?.degradation?.userMessage ?? ''),
    detail: body?.degradation?.userMessage ?? 'missing',
  });
  checks.push({
    name: 'no_raw_error_leakage',
    pass: !leakDetected(text),
    detail: leakDetected(text) ? 'raw error token detected' : 'no raw error token detected',
  });

  const pass = checks.every((check) => check.pass);
  return {
    event: 'postgres_disruption_smoke',
    status: pass ? 'pass' : 'fail',
    url,
    producedAt: new Date().toISOString(),
    checks,
    response: body,
  };
}

async function main() {
  const dryRun = boolArg('dry-run');
  const baseUrl = readArg('base-url') || process.env.AZURE_LAB_BASE_URL || process.env.ABARVA_AZURE_BASE_URL;
  const token = readArg('token')
    || process.env.L9_POSTGRES_DRILL_TOKEN
    || process.env.AZURE_CONNECTIVITY_HEALTH_TOKEN
    || process.env.INTERNAL_HEALTH_TOKEN;

  const result = dryRun
    ? evaluate(syntheticResponse())
    : evaluate(await fetchLive(required(baseUrl, 'base URL'), required(token, 'drill token')));

  console.log(JSON.stringify(result, null, 2));
  if (result.status !== 'pass') process.exitCode = 1;
}

main().catch((err) => {
  console.error(JSON.stringify({
    event: 'postgres_disruption_smoke',
    status: 'fail',
    error: err instanceof Error ? err.message : String(err),
  }, null, 2));
  process.exitCode = 1;
});
