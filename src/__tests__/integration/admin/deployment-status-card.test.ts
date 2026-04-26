import { readFileSync } from 'fs';
import { resolve } from 'path';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import {
  buildDeploymentStatusUnavailable,
  summarizeDeploymentStatus,
  type DeploymentStatusResult,
  type ProductionReadinessDeploymentSignal,
} from '@/lib/admin/deployment-status-ingestion';
import { DeploymentStatusCard } from '@/components/admin/DeploymentStatusCard';

const FIXED_GENERATED_AT = '2026-04-26T00:00:00.000Z';

const root = resolve(__dirname, '../../../..');
const componentSource = readFileSync(
  resolve(root, 'src/components/admin/DeploymentStatusCard.tsx'),
  'utf8',
);

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

function buildUnavailableSignal(): ProductionReadinessDeploymentSignal {
  const githubResult: DeploymentStatusResult = buildDeploymentStatusUnavailable(
    'github',
    FIXED_GENERATED_AT,
  );
  const vercelResult: DeploymentStatusResult = buildDeploymentStatusUnavailable(
    'vercel',
    FIXED_GENERATED_AT,
  );
  return summarizeDeploymentStatus([githubResult, vercelResult]);
}

describe('PROD5 DeploymentStatusCard · honest unavailable rendering', () => {
  it('renders the eyebrow, title, and per-provider rows in the unavailable state', () => {
    const signal = buildUnavailableSignal();
    const html = renderToStaticMarkup(createElement(DeploymentStatusCard, { signal }));

    expect(html).toContain('DEPLOYMENT STATUS');
    expect(html).toContain('PROD5');
    expect(html).toContain('GitHub');
    expect(html).toContain('Vercel');
    expect(html).toContain('unavailable');
    expect(html).toContain('Last checked');
    expect(html).toContain('Next action');
    expect(html).toContain('No fake green');
  });

  it('chip text never contains the word "live" as a status value', () => {
    const signal = buildUnavailableSignal();
    const html = renderToStaticMarkup(createElement(DeploymentStatusCard, { signal }));

    // No chip should render the literal liveStatus value 'live'.
    expect(html).not.toMatch(/>\s*live\s*</i);
    for (const result of signal.results) {
      expect(result.liveStatus).not.toBe('live');
    }
  });

  it('shows an em-dash placeholder when checkedAt is null', () => {
    const signal = buildUnavailableSignal();
    for (const result of signal.results) {
      expect(result.checkedAt).toBeNull();
    }
    const html = renderToStaticMarkup(createElement(DeploymentStatusCard, { signal }));
    expect(html).toContain('—');
  });

  it('renders the deferred-to-PROD6 next-action text when tokens are absent', () => {
    const signal = buildUnavailableSignal();
    const html = renderToStaticMarkup(createElement(DeploymentStatusCard, { signal }));
    expect(html).toContain('GITHUB_STATUS_TOKEN');
    expect(html).toContain('VERCEL_STATUS_TOKEN');
  });
});

describe('PROD5 DeploymentStatusCard · honest serialization (no fake green)', () => {
  it('serialized signal output never carries liveStatus value "live"', () => {
    const signal = buildUnavailableSignal();
    const serialized = JSON.stringify(signal);
    expect(serialized).not.toMatch(/"liveStatus"\s*:\s*"live"/);
  });

  it('summarized signal liveStatus is never "live" even with tokens present', () => {
    process.env.GITHUB_STATUS_TOKEN = 'gh-card-test-token-do-not-leak';
    process.env.VERCEL_STATUS_TOKEN = 'vercel-card-test-token-do-not-leak';
    const signal = summarizeDeploymentStatus();
    expect(signal.liveStatus).not.toBe('live');
    for (const result of signal.results) {
      expect(result.liveStatus).not.toBe('live');
    }
  });
});

describe('PROD5 DeploymentStatusCard · component source hygiene', () => {
  it('imports tokens from @/lib/design/abarva-theme (canon)', () => {
    expect(componentSource).toMatch(/from '@\/lib\/design\/abarva-theme'/);
    expect(componentSource).toMatch(/\bCOLORS\b/);
    expect(componentSource).toMatch(/\bFONT\b/);
    expect(componentSource).toMatch(/\bBORDER\b/);
    expect(componentSource).toMatch(/\bRADIUS\b/);
    expect(componentSource).toMatch(/\bSPACING\b/);
    expect(componentSource).toMatch(/\bTYPE\b/);
  });

  it('declares no local hex literals (canon §L acceptance gate #8)', () => {
    // Canon: components must consume tokens, never declare hex colors locally.
    expect(componentSource).not.toMatch(/['"]#[0-9A-Fa-f]{6}['"]/);
    expect(componentSource).not.toMatch(/['"]#[0-9A-Fa-f]{3}['"]/);
  });

  it('does not declare a local COLORS const (theme is single source of truth)', () => {
    expect(componentSource).not.toMatch(/\bconst\s+COLORS\s*=/);
  });

  it('is a Server Component (no "use client" directive)', () => {
    expect(componentSource).not.toMatch(/['"]use client['"]/);
  });

  it('uses no React hooks', () => {
    expect(componentSource).not.toMatch(/\buseState\s*\(/);
    expect(componentSource).not.toMatch(/\buseEffect\s*\(/);
    expect(componentSource).not.toMatch(/\buseCallback\s*\(/);
    expect(componentSource).not.toMatch(/\buseMemo\s*\(/);
    expect(componentSource).not.toMatch(/\buseRef\s*\(/);
    expect(componentSource).not.toMatch(/\buseReducer\s*\(/);
  });

  it('does not read any *_TOKEN env var directly (no secret exposure)', () => {
    expect(componentSource).not.toMatch(/process\.env\.[A-Z_]*TOKEN/);
    expect(componentSource).not.toMatch(/process\.env\.[A-Z_]*SECRET/);
    expect(componentSource).not.toMatch(/process\.env\.[A-Z_]*KEY/);
  });

  it('makes no external API or model calls', () => {
    expect(componentSource).not.toMatch(/\bfetch\s*\(/);
    expect(componentSource).not.toMatch(/api\.github\.com/);
    expect(componentSource).not.toMatch(/api\.vercel\.com/);
    expect(componentSource).not.toMatch(/anthropic/i);
    expect(componentSource).not.toMatch(/openai/i);
  });

  it('does not import auth, source, sentinel, atlas, nexus, agent, or supabase modules', () => {
    expect(componentSource).not.toMatch(/from '@\/lib\/auth\//);
    expect(componentSource).not.toMatch(/from '@\/lib\/source\//);
    expect(componentSource).not.toMatch(/from '@\/lib\/sentinel\//);
    expect(componentSource).not.toMatch(/from '@\/lib\/atlas\//);
    expect(componentSource).not.toMatch(/from '@\/lib\/nexus\//);
    expect(componentSource).not.toMatch(/from '@\/lib\/agent\//);
    expect(componentSource).not.toMatch(/from '@supabase\//);
    expect(componentSource).not.toMatch(/from '@clerk\//);
  });
});
