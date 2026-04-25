import { readFileSync } from 'fs';
import { resolve } from 'path';
import {
  buildProductionReadinessView,
  computeOverallReadinessPercent,
  loadProductionReadinessManifest,
  PRODUCTION_READINESS_COMPONENT_IDS,
  PRODUCTION_READINESS_DIMENSIONS,
  PRODUCTION_READINESS_GATES,
  PRODUCTION_READINESS_GATE_STATUSES,
  PRODUCTION_READINESS_STATUSES,
  summarizeProductionReadiness,
  type ProductionReadinessManifest,
} from '@/lib/admin/production-readiness';

const manifestPath = resolve(__dirname, '../../../../docs/build/production-readiness.json');
const protocolPath = resolve(__dirname, '../../../../docs/build/PRODUCTION_READINESS_UPDATE_PROTOCOL.md');

describe('production-readiness.json manifest', () => {
  it('parses as JSON', () => {
    const parsed = JSON.parse(readFileSync(manifestPath, 'utf8')) as ProductionReadinessManifest;
    expect(parsed.schemaVersion).toBe(1);
    expect(parsed.components.length).toBeGreaterThan(0);
  });

  it('matches the expected product component IDs in canonical order', () => {
    const manifest = loadProductionReadinessManifest();
    expect(manifest.components.map((component) => component.id)).toEqual([
      ...PRODUCTION_READINESS_COMPONENT_IDS,
    ]);
  });

  it('includes all readiness dimensions for every component', () => {
    const manifest = loadProductionReadinessManifest();
    for (const component of manifest.components) {
      expect(Object.keys(component.dimensions).sort()).toEqual(
        [...PRODUCTION_READINESS_DIMENSIONS].sort(),
      );
    }
  });

  it('includes all testing gates for every component', () => {
    const manifest = loadProductionReadinessManifest();
    for (const component of manifest.components) {
      expect(Object.keys(component.testingGates).sort()).toEqual(
        [...PRODUCTION_READINESS_GATES].sort(),
      );
    }
  });

  it('uses only valid readiness and gate statuses', () => {
    const manifest = loadProductionReadinessManifest();
    expect(PRODUCTION_READINESS_STATUSES).toContain(manifest.overallStatus);
    expect(PRODUCTION_READINESS_STATUSES).toContain(manifest.stewardBrief.fullFlowTestingReadiness);
    expect(PRODUCTION_READINESS_STATUSES).toContain(manifest.stewardBrief.pilotReadinessStatus);
    expect(PRODUCTION_READINESS_STATUSES).toContain(manifest.stewardBrief.productionReadinessStatus);

    for (const component of manifest.components) {
      expect(PRODUCTION_READINESS_STATUSES).toContain(component.status);
      for (const dimension of PRODUCTION_READINESS_DIMENSIONS) {
        expect(PRODUCTION_READINESS_STATUSES).toContain(component.dimensions[dimension]);
      }
      for (const gate of PRODUCTION_READINESS_GATES) {
        expect(PRODUCTION_READINESS_GATE_STATUSES).toContain(component.testingGates[gate].status);
      }
    }
  });
});

describe('production readiness read model', () => {
  it('is deterministic across repeated calls', () => {
    expect(buildProductionReadinessView()).toEqual(buildProductionReadinessView());
  });

  it('overall summary reconciles to components', () => {
    const manifest = loadProductionReadinessManifest();
    const summary = summarizeProductionReadiness(manifest.components);

    expect(summary.totalComponents).toBe(manifest.components.length);
    for (const status of PRODUCTION_READINESS_STATUSES) {
      expect(summary.byStatus[status]).toBe(
        manifest.components.filter((component) => component.status === status).length,
      );
    }
    expect(summary.overallReadinessPercent).toBe(
      computeOverallReadinessPercent(manifest.components),
    );
    expect(summary.overallReadinessPercent).toBe(manifest.overallReadinessPercent);
  });

  it('exposes top blockers and next recommended actions', () => {
    const view = buildProductionReadinessView();
    expect(view.summary.topBlockers.length).toBeGreaterThan(0);
    expect(view.summary.topBlockers.some((blocker) => blocker.severity === 'critical')).toBe(true);
    expect(view.recommendedActions.length).toBeGreaterThan(0);
    for (const action of view.recommendedActions) {
      expect(action.id.startsWith('action:')).toBe(true);
      expect(action.label.length).toBeGreaterThan(0);
      expect(action.reason.length).toBeGreaterThan(0);
    }
  });

  it('tracks Source / Outsourcing as a first-class honest component', () => {
    const source = loadProductionReadinessManifest().components.find(
      (component) => component.id === 'source',
    );
    expect(source).toBeDefined();
    expect(source!.name).toBe('Source / Outsourcing');
    expect(source!.status).toBe('scaffolded');
    expect(source!.status).not.toBe('pilot_ready');
    expect(source!.status).not.toBe('production_ready');
    expect(source!.maturity).toBe('foundation_validation');
    expect(source!.productionRiskLevel).toBe('medium_high');
    expect(source!.nextAction).toBe(
      'Complete authenticated Source visual review, then add a Source-specific Nexus API stub and evidence/upload readiness path.',
    );

    const notes = source!.notes.join('\n').toLowerCase();
    for (const required of [
      'source dashboard / sourcing event portfolio',
      'source event journey',
      'outsourcing / ams pattern intelligence',
      'context-aware nexus foundation',
      'deterministic context validation',
      'deterministic workflow validation',
      'pricing and negotiation intelligence',
      'source data readiness integration with admin/setup',
      'future source-specific nexus api',
      'future upload/evidence pipeline',
      'future event canvas, scorecard governance, artifact drawer, vendor evaluation, and value ledger ui',
      'not pilot_ready and not production_ready',
      'full user-facing workflow',
      'persistence',
      'model-assisted nexus route',
      'authenticated visual qa',
      'production-grade tenant/security validation',
    ]) {
      expect(notes).toContain(required);
    }
  });

  it('does not falsely mark any component production_ready', () => {
    const manifest = loadProductionReadinessManifest();
    expect(manifest.components.some((component) => component.status === 'production_ready')).toBe(false);

    for (const component of manifest.components) {
      if (component.status === 'production_ready') {
        expect(component.blockers).toHaveLength(0);
        for (const gate of PRODUCTION_READINESS_GATES) {
          expect(component.testingGates[gate].status).toBe('passing');
        }
      }
    }
  });

  it('is honest about monitoring, Vercel, and model/runtime limits', () => {
    const manifest = loadProductionReadinessManifest();
    const serialized = JSON.stringify(manifest).toLowerCase();

    expect(serialized).toContain('no live monitoring');
    expect(serialized).toContain('no vercel polling');
    expect(serialized).toContain('no model/api calls');
    expect(serialized).not.toMatch(/live monitoring (enabled|active|running)/);
    expect(serialized).not.toMatch(/vercel polling (enabled|active|running)/);
  });
});

describe('production readiness update protocol', () => {
  it('requires future slices to report readiness impact or explain no update', () => {
    const protocol = readFileSync(protocolPath, 'utf8').toLowerCase();
    expect(protocol).toContain('every future codex or claude code build slice');
    expect(protocol).toContain('production-readiness.json');
    expect(protocol).toContain('prior status');
    expect(protocol).toContain('new status');
    expect(protocol).toContain('readiness gates affected');
    expect(protocol).toContain('blockers added');
    expect(protocol).toContain('blockers removed');
    expect(protocol).toContain('next recommended readiness action');
    expect(protocol).toContain('if the tracker is not updated');
  });
});

describe('module hygiene', () => {
  const readModelSource = readCode('../../../lib/admin/production-readiness.ts');
  const componentSource = readCode('../../../components/admin/ProductionReadinessTracker.tsx');
  const routeSource = readCode('../../../app/(maestro)/platform/admin/production-readiness/page.tsx');
  const adminPageSource = readCode('../../../app/(maestro)/platform/admin/page.tsx');
  const newSources = [readModelSource, componentSource, routeSource].map(stripComments).join('\n');
  const adminSources = [readModelSource, componentSource, routeSource, adminPageSource]
    .map(stripComments)
    .join('\n');

  it('does not import forbidden product/runtime modules', () => {
    expect(newSources).not.toMatch(/from '@\/lib\/source\//);
    expect(newSources).not.toMatch(/from '@\/app\/\(maestro\)\/source\//);
    expect(newSources).not.toMatch(/from '@\/lib\/nexus\//);
    expect(newSources).not.toMatch(/from '@\/lib\/sentinel\//);
    expect(newSources).not.toMatch(/from '@\/lib\/atlas\//);
    expect(newSources).not.toMatch(/from '@\/lib\/agent\//);
    expect(newSources).not.toMatch(/from '@\/components\/agent\//);
    expect(newSources).not.toMatch(/from '@\/app\/programs\//);
  });

  it('does not rewrite auth or touch migrations', () => {
    expect(adminSources).not.toMatch(/from '@\/lib\/auth\//);
    expect(adminSources).not.toMatch(/supabase/);
    expect(adminSources).not.toMatch(/migrations?/i);
  });

  it('does not call models, external APIs, or non-deterministic clocks', () => {
    expect(newSources).not.toMatch(/anthropic/i);
    expect(newSources).not.toMatch(/openai/i);
    expect(newSources).not.toMatch(/pinecone/i);
    expect(newSources).not.toMatch(/\bfetch\(/);
    expect(newSources).not.toMatch(/Date\.now\(/);
    expect(newSources).not.toMatch(/Math\.random\(/);
    expect(newSources).not.toMatch(/new Date\(/);
  });

  it('component and route wire the deterministic read model', () => {
    expect(componentSource).toMatch(/buildProductionReadinessView/);
    expect(componentSource).toMatch(/from '@\/lib\/admin\/production-readiness'/);
    expect(routeSource).toMatch(/ProductionReadinessTracker/);
    expect(routeSource).toMatch(/buildProductionReadinessView/);
    expect(adminPageSource).toMatch(/\/platform\/admin\/production-readiness/);
  });
});

function readCode(relativeFromTestDir: string): string {
  return readFileSync(resolve(__dirname, relativeFromTestDir), 'utf8');
}

function stripComments(src: string): string {
  const lineStripped = src
    .split('\n')
    .filter((line) => !line.trim().startsWith('//'))
    .join('\n');
  return lineStripped.replace(/\/\*[\s\S]*?\*\//g, '');
}
