const { execFileSync, spawnSync } = require('node:child_process');
const path = require('node:path');

const repoRoot = path.resolve(__dirname, '../../..');
const script = path.join(repoRoot, 'scripts/pilot-env/verify-data-plane.mjs');

function runJson(args = [], env = {}) {
  const output = execFileSync('node', [script, '--json', ...args], {
    cwd: repoRoot,
    encoding: 'utf8',
    env: { PATH: process.env.PATH, ...env },
  });
  return JSON.parse(output);
}

describe('pilot private data-plane verifier', () => {
  it('reports all pilot clients and fails closed when config is absent', () => {
    const report = runJson();

    expect(report.schema).toBe('abarva.pilot-data-plane-verification.v1');
    expect(report.mode).toBe('stub-aware');
    expect(report.clients.map((client) => client.key)).toEqual(['apex', 'meridian', 'skyharbor']);
    expect(report.hops).toHaveLength(9);
    expect(report.summary).toEqual({
      liveReady: 0,
      stubFailClosed: 9,
      blocked: 0,
      exitCode: 0,
    });
    expect(report.hops.every((hop) => hop.status === 'stub_fail_closed')).toBe(true);
    expect(JSON.stringify(report)).not.toContain('secret-value');
  });

  it('exits non-zero in live mode when required configuration is missing', () => {
    const result = spawnSync('node', [script, '--json', '--live'], {
      cwd: repoRoot,
      encoding: 'utf8',
      env: { PATH: process.env.PATH },
    });

    expect(result.status).toBe(1);
    const report = JSON.parse(result.stdout);
    expect(report.mode).toBe('live');
    expect(report.summary.blocked).toBe(9);
    expect(report.hops.every((hop) => hop.status === 'blocked')).toBe(true);
  });

  it('marks hops live-ready when key names are configured without exposing values', () => {
    const report = runJson([], {
      NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: 'pk_test_placeholder_for_shape_only',
      CLERK_SECRET_KEY: 'secret-value',
      AZURE_BLOB_CONNECTION_STRING: 'secret-value',
      AZURE_BLOB_LANDING_CONTAINER: 'landing',
      AZURE_QUEUE_CONNECTION_STRING: 'secret-value',
      AZURE_QUEUE_NAME: 'q-context-ingestion-events',
      DATABASE_URL: 'secret-value',
      AZURE_DEFENDER_SCAN_MODE: 'live',
      AZURE_SEARCH_ENDPOINT: 'https://example.search.windows.net',
      AZURE_SEARCH_INDEX_NAME: 'tenant-context',
      RESEND_API_KEY: 'secret-value',
      RESEND_FROM: 'pilot@example.com',
    });

    expect(report.summary.liveReady).toBe(9);
    expect(report.summary.stubFailClosed).toBe(0);
    expect(report.hops.every((hop) => hop.status === 'live_ready')).toBe(true);
    expect(JSON.stringify(report)).not.toContain('secret-value');
    expect(report.hops.flatMap((hop) => hop.configuredKeys)).toContain('DATABASE_URL');
  });
});
