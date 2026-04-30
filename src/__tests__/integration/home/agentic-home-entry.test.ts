// HOME1 · Tests for the Agentic Executive Home Entry surface.
//
// Combines a server-render assertion (the component renders without
// throwing) with a fs.readFileSync source-code audit covering module
// hygiene + structural invariants required by the slice contract.

import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import {
  AgenticHomeEntry,
  type AgenticHomeEntryProps,
} from '@/components/home/AgenticHomeEntry';

const COMPONENT_PATH = join(
  process.cwd(),
  'src/components/home/AgenticHomeEntry.tsx',
);
const PAGE_PATH = join(process.cwd(), 'src/app/(maestro)/home/page.tsx');

const componentSource = readFileSync(COMPONENT_PATH, 'utf8');
const pageSource = readFileSync(PAGE_PATH, 'utf8');

function render(props?: AgenticHomeEntryProps): string {
  return renderToStaticMarkup(createElement(AgenticHomeEntry, props ?? {}));
}

describe('HOME1 · AgenticHomeEntry · render', () => {
  it('renders without throwing on default props', () => {
    expect(() => render()).not.toThrow();
    const html = render();
    expect(html.length).toBeGreaterThan(0);
  });

  it('renders without throwing for an Apex tenantSlug prop', () => {
    expect(() => render({ tenantSlug: 'apex-retail' })).not.toThrow();
    const html = render({ tenantSlug: 'apex-retail' });
    expect(html).toContain('/tenant/apex-retail/programs');
    expect(html).toContain('/tenant/apex-retail/tower');
    expect(html).toContain('/tenant/apex-retail/intelligence');
  });

  it('falls back to the canonical placeholder slug `acme` when no prop is given', () => {
    const html = render();
    expect(html).toContain('/tenant/acme/programs');
    expect(html).toContain('/tenant/acme/tower');
    expect(html).toContain('/tenant/acme/intelligence');
  });
});

describe('HOME1 · AgenticHomeEntry · agent surfaces', () => {
  const html = render();

  it('mentions all four canonical agents by name', () => {
    expect(html).toMatch(/Nexus/);
    expect(html).toMatch(/Atlas/);
    expect(html).toMatch(/Sentinel/);
    expect(html).toMatch(/Steward/);
  });

  it('exposes all four canonical agent surface route hrefs', () => {
    expect(html).toContain('/tenant/');
    expect(html).toContain('/programs');
    expect(html).toContain('/tower');
    expect(html).toContain('/intelligence');
    expect(html).toContain('/platform/admin');
  });

  it('stamps a per-card data-home1-agent-card marker for each of the four surfaces', () => {
    expect(html).toContain('data-home1-agent-card="programs"');
    expect(html).toContain('data-home1-agent-card="tower"');
    expect(html).toContain('data-home1-agent-card="intelligence"');
    expect(html).toContain('data-home1-agent-card="admin"');
  });
});

describe('HOME1 · AgenticHomeEntry · attention strip', () => {
  const html = render();

  it('renders the attention-strip container marker', () => {
    expect(html).toContain('data-home1-attention-strip="true"');
  });

  it('renders no more than three deterministic cards', () => {
    const matches = html.match(/data-deterministic="true"/g) ?? [];
    expect(matches.length).toBeGreaterThan(0);
    expect(matches.length).toBeLessThanOrEqual(3);
  });

  it('marks every attention card with the deterministic_seed source', () => {
    const deterministicCount = (html.match(/data-deterministic="true"/g) ?? [])
      .length;
    const seedSourceCount = (html.match(/data-source="deterministic_seed"/g) ?? [])
      .length;
    expect(seedSourceCount).toBe(deterministicCount);
  });

  it('renders the canonical deterministic-seed sentences', () => {
    expect(html).toMatch(/1 program at Gate G2/);
    expect(html).toMatch(/2 dataset domains partially loaded/);
    expect(html).toMatch(/3 active patterns surfaced by Sentinel/);
  });
});

describe('HOME1 · AgenticHomeEntry · honest disclaimer', () => {
  const html = render();

  it('renders the honest disclaimer with the load-bearing data attribute', () => {
    expect(html).toContain('data-honest-disclaimer="home1"');
    expect(html).toMatch(/deterministic seed values, not live runtime telemetry/);
  });

  it('stamps the root data-agentic-home-entry marker', () => {
    expect(html).toContain('data-agentic-home-entry="home1"');
  });

  it('renders the calm one-line orientation copy', () => {
    expect(html).toMatch(/Calm intelligence layer for AI program execution\./);
  });
});

describe('HOME1 · AgenticHomeEntry · module hygiene', () => {
  it('uses no client-only React state hooks', () => {
    expect(componentSource).not.toMatch(/\buseState\b/);
    expect(componentSource).not.toMatch(/\buseEffect\b/);
  });

  it('uses no time / random / network sources', () => {
    expect(componentSource).not.toMatch(/Date\.now/);
    expect(componentSource).not.toMatch(/Math\.random/);
    expect(componentSource).not.toMatch(/new Date\(/);
    expect(componentSource).not.toMatch(/\bfetch\(/);
  });

  it('imports nothing from forbidden runtimes', () => {
    expect(componentSource).not.toMatch(/from ['"]@\/lib\/nexus\//);
    expect(componentSource).not.toMatch(/from ['"]@\/lib\/agent\//);
    expect(componentSource).not.toMatch(/from ['"]@\/lib\/source\//);
    expect(componentSource).not.toMatch(/from ['"]@\/lib\/auth\//);
    expect(componentSource).not.toMatch(/from ['"]@supabase\//);
    expect(componentSource).not.toMatch(/['"]anthropic['"]/);
    expect(componentSource).not.toMatch(/['"]openai['"]/);
  });
});

describe('HOME1 · home page mounts HomeIndexPage', () => {
  it('imports HomeIndexPage from the canonical module path', () => {
    expect(pageSource).toMatch(
      /import\s*\{\s*HomeIndexPage\s*\}\s*from\s*['"]@\/components\/home\/HomeIndexPage['"]/,
    );
  });

  it('renders <HomeIndexPage /> in the page tree', () => {
    expect(pageSource).toMatch(/<HomeIndexPage\b/);
  });
});
