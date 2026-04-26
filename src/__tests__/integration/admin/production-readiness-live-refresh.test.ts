import { readFileSync } from 'fs';
import { resolve } from 'path';
import {
  buildProductionReadinessApiResponse,
  buildProductionReadinessView,
  getProductionReadinessRefreshMetadata,
} from '@/lib/admin/production-readiness';
import { assertNoLikelySecretValues } from '@/lib/qa/secret-hygiene-patterns';

const fixedGeneratedAt = '2026-04-26T00:00:00.000Z';
const root = resolve(__dirname, '../../../..');
const routeSource = readCode('src/app/api/admin/production-readiness/route.ts');
const readModelSource = readCode('src/lib/admin/production-readiness.ts');
const livePanelSource = readCode('src/components/admin/ProductionReadinessLivePanel.tsx');
const trackerSource = readCode('src/components/admin/ProductionReadinessTracker.tsx');
const pageSource = readCode('src/app/(maestro)/platform/admin/production-readiness/page.tsx');
const proxySource = readCode('src/proxy.ts');
const combinedSource = stripComments(
  [routeSource, readModelSource, livePanelSource, trackerSource, pageSource].join('\n'),
);

describe('PROD3 production readiness live refresh API response', () => {
  it('includes request-time refresh metadata without changing readiness scoring', () => {
    const response = buildProductionReadinessApiResponse(fixedGeneratedAt);

    expect(response.generatedAt).toBe(fixedGeneratedAt);
    expect(response.source).toBe('production_readiness_manifest');
    expect(response.refreshMode).toBe('api_polling');
    expect(response.liveCiStatus).toBe('unavailable');
    expect(response.manifest.schemaVersion).toBe(1);
    expect(response.view.overallReadinessPercent).toBe(response.manifest.overallReadinessPercent);
  });

  it('does not claim true GitHub or Vercel status polling is configured', () => {
    const metadata = getProductionReadinessRefreshMetadata(fixedGeneratedAt);

    expect(metadata.liveCiStatus).toBe('unavailable');
    expect(metadata.note.toLowerCase()).toContain('github checks');
    expect(metadata.note.toLowerCase()).toContain('vercel deployments');
    expect(metadata.note.toLowerCase()).toContain('unified control plane');
    expect(metadata.note.toLowerCase()).toContain('not true live monitoring');
    expect(metadata.note.toLowerCase()).toContain('remain deferred');
  });

  it('keeps the read model deterministic except for explicit refresh metadata', () => {
    expect(buildProductionReadinessView()).toEqual(buildProductionReadinessView());

    const first = buildProductionReadinessApiResponse('2026-04-26T00:00:00.000Z');
    const second = buildProductionReadinessApiResponse('2026-04-26T00:01:00.000Z');

    expect(first.view).toEqual(second.view);
    expect(first.manifest).toEqual(second.manifest);
    expect(first.generatedAt).not.toBe(second.generatedAt);
  });
});

describe('PROD3 route and client refresh behavior', () => {
  it('route opts out of static caching and sets no-store/no-cache headers', () => {
    expect(routeSource).toMatch(/dynamic = 'force-dynamic'/);
    expect(routeSource).toMatch(/revalidate = 0/);
    expect(routeSource).toMatch(/Cache-Control/);
    expect(routeSource).toMatch(/no-store/);
    expect(routeSource).toMatch(/no-cache/);
    expect(routeSource).toMatch(/Pragma/);
    expect(routeSource).toMatch(/Expires/);
  });

  it('page renders the live panel with request-time initial data', () => {
    expect(pageSource).toMatch(/connection\(/);
    expect(pageSource).toMatch(/revalidate = 0/);
    expect(pageSource).toMatch(/ProductionReadinessLivePanel/);
    expect(pageSource).toMatch(/buildProductionReadinessApiResponse/);
  });

  it('client panel polls the internal API and exposes manual refresh', () => {
    expect(livePanelSource).toMatch(/useEffect/);
    expect(livePanelSource).toMatch(/setInterval/);
    expect(livePanelSource).toMatch(/PRODUCTION_READINESS_UI_VERSION/);
    expect(livePanelSource).toMatch(/ui-c2a81fd-control-plane/);
    expect(livePanelSource).toMatch(/\/api\/admin\/production-readiness\?ui=/);
    expect(livePanelSource).toMatch(/Date\.now\(\)/);
    expect(livePanelSource).toMatch(/cache: 'no-store'/);
    expect(livePanelSource).toMatch(/Production Readiness Control Plane/);
    expect(livePanelSource).toMatch(/Last refreshed/);
    expect(livePanelSource).toMatch(/Refresh/);
    expect(livePanelSource).toMatch(/Showing the server-rendered manifest/);
  });

  it('proxy prevents the production readiness shell from being reused as a stale browser or edge response', () => {
    expect(proxySource).toMatch(/PRODUCTION_READINESS_NO_STORE_PATHS/);
    expect(proxySource).toMatch(/\/platform\/admin\/production-readiness/);
    expect(proxySource).toMatch(/\/api\/admin\/production-readiness/);
    expect(proxySource).toMatch(/withProductionReadinessNoStoreHeaders/);
    expect(proxySource).toMatch(/Cache-Control/);
    expect(proxySource).toMatch(/no-store, no-cache/);
  });
});

describe('PROD3 safety and module hygiene', () => {
  it('does not import model, Source, Nexus, Sentinel, Atlas, agent runtime, migrations, or auth helpers', () => {
    expect(combinedSource).not.toMatch(/from '@\/lib\/source\//);
    expect(combinedSource).not.toMatch(/from '@\/app\/\(maestro\)\/source\//);
    expect(combinedSource).not.toMatch(/from '@\/lib\/nexus\//);
    expect(combinedSource).not.toMatch(/from '@\/lib\/sentinel\//);
    expect(combinedSource).not.toMatch(/from '@\/lib\/atlas\//);
    expect(combinedSource).not.toMatch(/from '@\/lib\/agent\//);
    expect(combinedSource).not.toMatch(/from '@\/components\/agent\//);
    expect(combinedSource).not.toMatch(/from '@\/lib\/auth\//);
    expect(combinedSource).not.toMatch(/migrations?/i);
    expect(combinedSource).not.toMatch(/anthropic/i);
    expect(combinedSource).not.toMatch(/openai/i);
  });

  it('does not call external GitHub or Vercel APIs and does not expose token-like fields', () => {
    expect(combinedSource).not.toMatch(/api\.github\.com/);
    expect(combinedSource).not.toMatch(/api\.vercel\.com/);
    expect(combinedSource).not.toMatch(/GITHUB_TOKEN|VERCEL_TOKEN|SECRET|SERVICE_ROLE/);

    const response = JSON.stringify(buildProductionReadinessApiResponse(fixedGeneratedAt));
    // The response embeds the manifest, whose honest notes may reference
    // env var NAMES (e.g. CLERK_SECRET_KEY, SUPABASE_SERVICE_ROLE_KEY) as
    // documentation of what the runtime expects — env var *names* are
    // public, not secrets. What MUST never appear in the response is an
    // actual token VALUE: a real GitHub/Vercel/etc. token shape, or a
    // `KEY=long_opaque` style assignment that would imply leakage.
    //
    // The QA13 secret-hygiene helper is the single, deterministic source
    // of truth for likely-secret VALUE detection (covers ghp_, github_pat_,
    // ghs_, vercel_, sk- / sk-ant-, xoxb-, xoxp-, AKIA, JWT, and
    // KEY=long_opaque assignment shapes). Honest documentation strings
    // such as bare env var names or "no call to api.github.com" URLs are
    // explicitly NOT flagged, so this assertion stays precise.
    expect(() => assertNoLikelySecretValues(response)).not.toThrow();
    // NOTE: the source-code check on line above already enforces no
    // api.github.com / api.vercel.com URLs in the application code. The
    // serialized manifest may legitimately mention those hostnames in
    // honest documentation notes (e.g. PROD4 explicitly states "no call
    // to api.github.com is performed"), and that is the opposite of a
    // leak.
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
