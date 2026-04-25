// MW3 · Nexus Maestro Brief Panel tests.
//
// Covers source hygiene of the new server component, mount in
// ProgramCanonicalDetail, label coverage, and a deterministic render
// pass against a real seed-derived readiness record.

import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import * as fs from 'fs';
import * as path from 'path';

import {
  NexusMaestroBriefPanel,
  default as NexusMaestroBriefPanelDefault,
} from '@/components/programs/NexusMaestroBriefPanel';
import {
  buildNextRecommendedWorkshop,
  buildWorkshopReadinessForProgram,
} from '@/lib/programs/workshop-readiness';
import { buildAllProgramsSeedPlan } from '@/lib/programs/enhancement-seed-planner';

// ---------------------------------------------------------------------
// Source-scan helpers
// ---------------------------------------------------------------------

const PANEL_PATH = path.resolve(
  __dirname,
  '../../../components/programs/NexusMaestroBriefPanel.tsx',
);
const DETAIL_PATH = path.resolve(
  __dirname,
  '../../../components/programs/ProgramCanonicalDetail.tsx',
);

const panelSource = fs.readFileSync(PANEL_PATH, 'utf8');
const detailSource = fs.readFileSync(DETAIL_PATH, 'utf8');

const panelCodeOnly = panelSource
  .split('\n')
  .filter((line) => !line.trim().startsWith('//'))
  .join('\n')
  .replace(/\/\*[\s\S]*?\*\//g, '');

// ---------------------------------------------------------------------
// Seed-derived readiness fixture
// ---------------------------------------------------------------------

const plan = buildAllProgramsSeedPlan();
const firstTenant = plan.tenants[0];
const firstProgram = firstTenant.programs[0];
const fixtureReadiness = buildNextRecommendedWorkshop(firstTenant, firstProgram);

// ---------------------------------------------------------------------
// Panel module hygiene
// ---------------------------------------------------------------------

describe('NexusMaestroBriefPanel · module hygiene', () => {
  it('imports the canonical workshop-readiness types', () => {
    expect(panelCodeOnly).toMatch(
      /from\s+['"]@\/lib\/programs\/workshop-readiness['"]/,
    );
    expect(panelCodeOnly).toContain('WorkshopReadiness');
  });

  it('imports AbarVa design tokens', () => {
    expect(panelCodeOnly).toMatch(/from\s+['"]@\/lib\/design\/abarva-theme['"]/);
  });

  it('does not import Source / Sentinel / Atlas / Nexus / Agent / Auth runtime', () => {
    expect(panelCodeOnly).not.toMatch(/from\s+['"]@\/lib\/source\//);
    expect(panelCodeOnly).not.toMatch(/from\s+['"]@\/lib\/sentinel\//);
    expect(panelCodeOnly).not.toMatch(/from\s+['"]@\/lib\/atlas\//);
    expect(panelCodeOnly).not.toMatch(/from\s+['"]@\/lib\/nexus\//);
    expect(panelCodeOnly).not.toMatch(/from\s+['"]@\/lib\/agent\//);
    expect(panelCodeOnly).not.toMatch(/from\s+['"]@\/lib\/auth\//);
    expect(panelCodeOnly).not.toMatch(/from\s+['"]@\/.*supabase/);
  });

  it("is a server component (no 'use client', no client hooks)", () => {
    expect(panelCodeOnly).not.toMatch(/['"]use client['"]/);
    expect(panelCodeOnly).not.toMatch(/\buseState\s*\(/);
    expect(panelCodeOnly).not.toMatch(/\buseEffect\s*\(/);
    expect(panelCodeOnly).not.toMatch(/\bfetch\s*\(/);
  });

  it('does not invent runtime values (no Date.now / Math.random / new Date)', () => {
    expect(panelCodeOnly).not.toMatch(/Date\.now\s*\(/);
    expect(panelCodeOnly).not.toMatch(/Math\.random\s*\(/);
    expect(panelCodeOnly).not.toMatch(/new Date\s*\(/);
  });

  it('does not contain fake meeting notes or fabricated decision logs', () => {
    expect(panelCodeOnly).not.toContain('Meeting notes:');
    expect(panelCodeOnly).not.toContain('Decision logged:');
    expect(panelCodeOnly).not.toMatch(/anthropic/i);
    expect(panelCodeOnly).not.toMatch(/openai/i);
  });
});

// ---------------------------------------------------------------------
// Source-scan: structural marker + labels
// ---------------------------------------------------------------------

describe('NexusMaestroBriefPanel · structural markers (source-scan)', () => {
  it('declares the data-mw3 testability attribute', () => {
    expect(panelSource).toContain('data-mw3="nexus-maestro-brief"');
  });

  it('exposes both a named and a default export', () => {
    expect(panelSource).toMatch(/export\s+function\s+NexusMaestroBriefPanel/);
    expect(panelSource).toMatch(/export\s+default\s+NexusMaestroBriefPanel/);
    expect(NexusMaestroBriefPanel).toBe(NexusMaestroBriefPanelDefault);
  });

  it('surfaces every required label heading', () => {
    const labels = [
      'Next workshop',
      'Objective',
      'Required attendees',
      'Optional SMEs',
      'Pre-read',
      'Questions to ask',
      'Likely tensions',
      'Decisions needed',
      'Evidence to capture',
      'Expected outputs',
      'Nexus preparation brief',
      'Steward gate',
    ];
    for (const label of labels) {
      expect(panelSource).toContain(label);
    }
  });

  it('carries the honest disclaimer that live workshop ingestion is not wired', () => {
    expect(panelSource).toContain('Live workshop ingestion is not wired');
  });
});

// ---------------------------------------------------------------------
// Mount in ProgramCanonicalDetail
// ---------------------------------------------------------------------

describe('ProgramCanonicalDetail · mounts NexusMaestroBriefPanel', () => {
  it('imports the new panel', () => {
    expect(detailSource).toMatch(
      /import\s+\{[^}]*NexusMaestroBriefPanel[^}]*\}\s+from\s+['"]@\/components\/programs\/NexusMaestroBriefPanel['"]/,
    );
  });

  it('imports the buildNextRecommendedWorkshop helper from workshop-readiness', () => {
    expect(detailSource).toMatch(
      /from\s+['"]@\/lib\/programs\/workshop-readiness['"]/,
    );
    expect(detailSource).toContain('buildNextRecommendedWorkshop');
  });

  it('mounts the panel exactly once (single insertion, no refactor)', () => {
    const matches = detailSource.match(/<NexusMaestroBriefPanel\b/g) ?? [];
    const mountMatches =
      detailSource.match(/<NexusMaestroBriefMount\b/g) ?? [];
    // The detail mounts via the small wrapper component, which itself
    // renders <NexusMaestroBriefPanel readiness={...} /> conditionally.
    expect(mountMatches.length).toBe(1);
    // The wrapper renders the panel exactly once, conditional on a
    // non-null readiness.
    expect(matches.length).toBe(1);
  });
});

// ---------------------------------------------------------------------
// Render pass · seed-derived readiness fixture
// ---------------------------------------------------------------------

describe('NexusMaestroBriefPanel · render pass', () => {
  it('produces a non-null readiness fixture for the first canonical demo program', () => {
    expect(fixtureReadiness).not.toBeNull();
  });

  it('renders without throwing for a deterministic readiness record', () => {
    expect(fixtureReadiness).not.toBeNull();
    const html = renderToStaticMarkup(
      createElement(NexusMaestroBriefPanel, { readiness: fixtureReadiness! }),
    );
    expect(typeof html).toBe('string');
    expect(html.length).toBeGreaterThan(0);
  });

  it('includes the data-mw3 attribute on the rendered root', () => {
    const html = renderToStaticMarkup(
      createElement(NexusMaestroBriefPanel, { readiness: fixtureReadiness! }),
    );
    expect(html).toContain('data-mw3="nexus-maestro-brief"');
  });

  it('renders every required heading in the rendered HTML', () => {
    const html = renderToStaticMarkup(
      createElement(NexusMaestroBriefPanel, { readiness: fixtureReadiness! }),
    );
    const labels = [
      'Next workshop',
      'Objective',
      'Required attendees',
      'Optional SMEs',
      'Pre-read',
      'Questions to ask',
      'Likely tensions',
      'Decisions needed',
      'Evidence to capture',
      'Expected outputs',
      'Nexus preparation brief',
      'Steward gate',
    ];
    for (const label of labels) {
      expect(html).toContain(label);
    }
  });

  it('renders the honest live-ingestion disclaimer in the output', () => {
    const html = renderToStaticMarkup(
      createElement(NexusMaestroBriefPanel, { readiness: fixtureReadiness! }),
    );
    expect(html).toContain('Live workshop ingestion is not wired');
  });

  it('renders the program code, tenant name, and workshop title from the readiness record', () => {
    const html = renderToStaticMarkup(
      createElement(NexusMaestroBriefPanel, { readiness: fixtureReadiness! }),
    );
    expect(html).toContain(fixtureReadiness!.programCode);
    expect(html).toContain(fixtureReadiness!.tenantName);
    expect(html).toContain(fixtureReadiness!.title);
  });

  it('renders the steward gate implication and Nexus preparation brief verbatim', () => {
    const html = renderToStaticMarkup(
      createElement(NexusMaestroBriefPanel, { readiness: fixtureReadiness! }),
    );
    expect(html).toContain(fixtureReadiness!.stewardGateImplication);
    expect(html).toContain(fixtureReadiness!.nexusPreparationBrief);
  });

  it('renders deterministically across repeated calls', () => {
    const a = renderToStaticMarkup(
      createElement(NexusMaestroBriefPanel, { readiness: fixtureReadiness! }),
    );
    const b = renderToStaticMarkup(
      createElement(NexusMaestroBriefPanel, { readiness: fixtureReadiness! }),
    );
    expect(a).toBe(b);
  });

  it('renders a Required and an Optional evidence chip in the output', () => {
    const html = renderToStaticMarkup(
      createElement(NexusMaestroBriefPanel, { readiness: fixtureReadiness! }),
    );
    // MW2 invariant: at least one required and one optional evidence
    // entry per workshop.
    expect(html).toContain('Required');
    expect(html).toContain('Optional');
  });

  it('renders without throwing for every active program across canonical demo tenants', () => {
    let renderedCount = 0;
    for (const tenant of plan.tenants) {
      for (const program of tenant.programs) {
        const list = buildWorkshopReadinessForProgram(tenant, program);
        for (const readiness of list) {
          const html = renderToStaticMarkup(
            createElement(NexusMaestroBriefPanel, { readiness }),
          );
          expect(html).toContain('data-mw3="nexus-maestro-brief"');
          renderedCount += 1;
        }
      }
    }
    expect(renderedCount).toBeGreaterThan(0);
  });
});
