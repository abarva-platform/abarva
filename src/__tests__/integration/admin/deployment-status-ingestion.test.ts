import { readFileSync } from 'fs';
import { resolve } from 'path';
import {
  buildDeploymentStatusUnavailable,
  getDeploymentStatusResults,
  getDeploymentStatusSources,
  mergeDeploymentStatusIntoReadinessView,
  summarizeDeploymentStatus,
} from '@/lib/admin/deployment-status-ingestion';

const FIXED_GENERATED_AT = '2026-04-26T00:00:00.000Z';
const TEST_TOKEN_VALUE_GH = 'gh-test-token-must-not-be-exposed-abc123';
const TEST_TOKEN_VALUE_VERCEL = 'vercel-test-token-must-not-be-exposed-xyz789';

const root = resolve(__dirname, '../../../..');
const moduleSource = readCode('src/lib/admin/deployment-status-ingestion.ts');
const routeSource = readCode('src/app/api/admin/production-readiness/deployment-status/route.ts');
const combinedSource = stripComments([moduleSource, routeSource].join('\n'));

beforeEach(() => {
  delete process.env.GITHUB_STATUS_TOKEN;
  delete process.env.VERCEL_STATUS_TOKEN;
  process.env.PROD4_FIXED_GENERATED_AT = FIXED_GENERATED_AT;
});

afterAll(() => {
  delete process.env.GITHUB_STATUS_TOKEN;
  delete process.env.VERCEL_STATUS_TOKEN;
  delete process.env.PROD4_FIXED_GENERATED_AT;
});

describe('PROD4 deployment status ingestion: env-driven availability', () => {
  it('reports unavailable when neither GITHUB_STATUS_TOKEN nor VERCEL_STATUS_TOKEN is set', () => {
    delete process.env.GITHUB_STATUS_TOKEN;
    delete process.env.VERCEL_STATUS_TOKEN;

    const sources = getDeploymentStatusSources();
    expect(sources).toHaveLength(2);
    expect(sources.every((source) => source.configured === false)).toBe(true);

    const results = getDeploymentStatusResults();
    expect(results).toHaveLength(2);
    for (const result of results) {
      expect(result.liveStatus).toBe('unavailable');
      expect(result.checkedAt).toBeNull();
      expect(result.generatedAt).toBe(FIXED_GENERATED_AT);
      expect(result.source).toBe('github_vercel_optional');
      expect(result.message.length).toBeGreaterThan(0);
      expect(result.error).not.toBeNull();
      expect(result.error?.code).toBe('token_missing');
      expect(result.createdFrom).toBe('deterministic_deployment_status_ingestion_seed');
    }

    const signal = summarizeDeploymentStatus(results);
    expect(signal.liveStatus).toBe('unavailable');
    expect(signal.generatedAt).toBe(FIXED_GENERATED_AT);
    expect(signal.source).toBe('github_vercel_optional');
    expect(signal.results).toHaveLength(2);
    expect(signal.message.toLowerCase()).toContain('unavailable');
  });

  it('reports configured (never live) when tokens are present, without surfacing token values', () => {
    process.env.GITHUB_STATUS_TOKEN = TEST_TOKEN_VALUE_GH;
    process.env.VERCEL_STATUS_TOKEN = TEST_TOKEN_VALUE_VERCEL;

    const results = getDeploymentStatusResults();
    expect(results).toHaveLength(2);
    for (const result of results) {
      expect(result.liveStatus).toBe('configured');
      expect(result.checkedAt).toBeNull();
      expect(result.error).toBeNull();
    }

    const signal = summarizeDeploymentStatus(results);
    expect(signal.liveStatus).toBe('configured');

    const serialized = JSON.stringify(signal);
    expect(serialized).not.toContain(TEST_TOKEN_VALUE_GH);
    expect(serialized).not.toContain(TEST_TOKEN_VALUE_VERCEL);
  });

  it('reports configured for one provider and unavailable for the other when only one token is set', () => {
    process.env.GITHUB_STATUS_TOKEN = TEST_TOKEN_VALUE_GH;
    delete process.env.VERCEL_STATUS_TOKEN;

    const sources = getDeploymentStatusSources();
    const githubSource = sources.find((source) => source.provider === 'github');
    const vercelSource = sources.find((source) => source.provider === 'vercel');
    expect(githubSource?.configured).toBe(true);
    expect(vercelSource?.configured).toBe(false);

    const results = getDeploymentStatusResults();
    const githubResult = results.find((result) => result.provider === 'github');
    const vercelResult = results.find((result) => result.provider === 'vercel');
    expect(githubResult?.liveStatus).toBe('configured');
    expect(vercelResult?.liveStatus).toBe('unavailable');

    const signal = summarizeDeploymentStatus(results);
    expect(signal.liveStatus).toBe('configured');

    const serialized = JSON.stringify(signal);
    expect(serialized).not.toContain(TEST_TOKEN_VALUE_GH);
  });
});

describe('PROD4 deployment status ingestion: determinism and merge', () => {
  it('produces identical output across calls when env is fixed', () => {
    delete process.env.GITHUB_STATUS_TOKEN;
    delete process.env.VERCEL_STATUS_TOKEN;

    const first = summarizeDeploymentStatus();
    const second = summarizeDeploymentStatus();

    expect(first).toEqual(second);
  });

  it('exposes the buildDeploymentStatusUnavailable helper for both providers', () => {
    const githubResult = buildDeploymentStatusUnavailable('github', FIXED_GENERATED_AT);
    const vercelResult = buildDeploymentStatusUnavailable('vercel', FIXED_GENERATED_AT);

    for (const result of [githubResult, vercelResult]) {
      expect(result.liveStatus).toBe('unavailable');
      expect(result.checkStatus).toBe('unknown');
      expect(result.checkedAt).toBeNull();
      expect(result.generatedAt).toBe(FIXED_GENERATED_AT);
      expect(result.source).toBe('github_vercel_optional');
      expect(result.error?.code).toBe('token_missing');
      expect(result.createdFrom).toBe('deterministic_deployment_status_ingestion_seed');
    }
    expect(githubResult.message).toMatch(/GitHub/);
    expect(vercelResult.message).toMatch(/Vercel/);
  });

  it('mergeDeploymentStatusIntoReadinessView attaches signal without mutating input', () => {
    const view = { schemaVersion: 1, overallReadinessPercent: 50 };
    const signal = summarizeDeploymentStatus();

    const merged = mergeDeploymentStatusIntoReadinessView(view, signal);
    expect(merged.deploymentStatus).toEqual(signal);
    expect(merged.schemaVersion).toBe(1);
    expect(merged.overallReadinessPercent).toBe(50);
    expect((view as { deploymentStatus?: unknown }).deploymentStatus).toBeUndefined();
  });
});

describe('PROD4 deployment status ingestion: V1 honesty and no fake live status', () => {
  it('never returns liveStatus "live" in V1 (no tokens)', () => {
    delete process.env.GITHUB_STATUS_TOKEN;
    delete process.env.VERCEL_STATUS_TOKEN;
    const signal = summarizeDeploymentStatus();
    expect(signal.liveStatus).not.toBe('live');
    for (const result of signal.results) {
      expect(result.liveStatus).not.toBe('live');
    }
  });

  it('never returns liveStatus "live" in V1 (with tokens)', () => {
    process.env.GITHUB_STATUS_TOKEN = TEST_TOKEN_VALUE_GH;
    process.env.VERCEL_STATUS_TOKEN = TEST_TOKEN_VALUE_VERCEL;
    const signal = summarizeDeploymentStatus();
    expect(signal.liveStatus).not.toBe('live');
    for (const result of signal.results) {
      expect(result.liveStatus).not.toBe('live');
    }
  });

  it('does not expose any test token value in any serialized output', () => {
    process.env.GITHUB_STATUS_TOKEN = TEST_TOKEN_VALUE_GH;
    process.env.VERCEL_STATUS_TOKEN = TEST_TOKEN_VALUE_VERCEL;

    const signal = summarizeDeploymentStatus();
    const serializedSignal = JSON.stringify(signal);
    const serializedResults = JSON.stringify(signal.results);
    const serializedSources = JSON.stringify(signal.sources);

    for (const tokenValue of [TEST_TOKEN_VALUE_GH, TEST_TOKEN_VALUE_VERCEL]) {
      expect(serializedSignal).not.toContain(tokenValue);
      expect(serializedResults).not.toContain(tokenValue);
      expect(serializedSources).not.toContain(tokenValue);
    }
  });
});

describe('PROD4 route response shape', () => {
  it('route source declares no-store cache directive and pragma no-cache', () => {
    expect(routeSource).toMatch(/Cache-Control/);
    expect(routeSource).toMatch(/no-store/);
    expect(routeSource).toMatch(/no-cache/);
    expect(routeSource).toMatch(/must-revalidate/);
    expect(routeSource).toMatch(/Pragma/);
  });

  it('route source forces dynamic rendering', () => {
    expect(routeSource).toMatch(/dynamic = 'force-dynamic'/);
    expect(routeSource).toMatch(/revalidate = 0/);
  });

  it('route source does not call any external GitHub or Vercel API', () => {
    expect(routeSource).not.toMatch(/api\.github\.com/);
    expect(routeSource).not.toMatch(/api\.vercel\.com/);
  });
});

describe('PROD4 module hygiene', () => {
  it('does not import anthropic, openai, or any model SDK', () => {
    expect(combinedSource).not.toMatch(/anthropic/i);
    expect(combinedSource).not.toMatch(/openai/i);
  });

  it('does not import Source / Nexus / Sentinel / Atlas / agent / auth / supabase modules', () => {
    expect(combinedSource).not.toMatch(/from '@\/lib\/source\//);
    expect(combinedSource).not.toMatch(/from '@\/lib\/nexus\//);
    expect(combinedSource).not.toMatch(/from '@\/lib\/sentinel\//);
    expect(combinedSource).not.toMatch(/from '@\/lib\/atlas\//);
    expect(combinedSource).not.toMatch(/from '@\/lib\/agent\//);
    expect(combinedSource).not.toMatch(/from '@\/lib\/auth\//);
    expect(combinedSource).not.toMatch(/from '@supabase\//);
  });

  it('does not call Date.now, Math.random, new Date(', () => {
    expect(combinedSource).not.toMatch(/Date\.now\(/);
    expect(combinedSource).not.toMatch(/Math\.random\(/);
    expect(combinedSource).not.toMatch(/new Date\(/);
  });

  it('does not fetch from GitHub or Vercel and does not call any external host', () => {
    expect(combinedSource).not.toMatch(/api\.github\.com/);
    expect(combinedSource).not.toMatch(/api\.vercel\.com/);
    expect(combinedSource).not.toMatch(/fetch\(\s*['"]https?:\/\//);
  });

  it('does not name common token-leak placeholders or embed token values', () => {
    expect(combinedSource).not.toMatch(/SERVICE_ROLE/);
    expect(combinedSource).not.toMatch(/process\.env\.GITHUB_STATUS_TOKEN\s*\)/);
    expect(combinedSource).not.toMatch(/JSON\.stringify\(\s*process\.env/);
    expect(combinedSource).not.toMatch(/console\.(log|info|warn|error)\([^)]*GITHUB_STATUS_TOKEN/);
    expect(combinedSource).not.toMatch(/console\.(log|info|warn|error)\([^)]*VERCEL_STATUS_TOKEN/);
  });

  it('declares createdFrom as the canonical deterministic seed tag', () => {
    expect(moduleSource).toMatch(/deterministic_deployment_status_ingestion_seed/);
  });
});

function readCode(relativeFromRoot: string): string {
  return readFileSync(resolve(root, relativeFromRoot), 'utf8');
}

function stripComments(src: string): string {
  const lineStripped = src
    .split('\n')
    .filter((line) => !line.trim().startsWith('//'))
    .join('\n');
  return lineStripped.replace(/\/\*[\s\S]*?\*\//g, '');
}
