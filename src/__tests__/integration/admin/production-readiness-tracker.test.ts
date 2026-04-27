import { readFileSync } from 'fs';
import { resolve } from 'path';
import {
  buildProductionReadinessView,
  computeOverallReadinessPercent,
  getProductionReadinessFreshnessMetadata,
  getProductionReadinessComponentProgress,
  getProductionReadinessSegments,
  PRODUCTION_READINESS_COMPONENT_IDS,
  PRODUCTION_READINESS_DIMENSIONS,
  PRODUCTION_READINESS_GATES,
  PRODUCTION_READINESS_GATE_STATUSES,
  PRODUCTION_READINESS_SEGMENTS,
  PRODUCTION_READINESS_STATUSES,
  summarizeProductionReadiness,
  type ProductionReadinessManifest,
} from '@/lib/admin/production-readiness';
import {
  buildProductionReadinessApiResponse,
  buildProductionReadinessViewFromDisk,
  loadProductionReadinessManifest,
} from '@/lib/admin/production-readiness-loader';

const manifestPath = resolve(__dirname, '../../../../docs/build/production-readiness.json');
const protocolPath = resolve(__dirname, '../../../../docs/build/PRODUCTION_READINESS_UPDATE_PROTOCOL.md');
const componentMapPath = resolve(__dirname, '../../../../docs/build/PRODUCTION_READINESS_COMPONENT_MAP.md');
const buildSlicesPath = resolve(__dirname, '../../../../docs/build/build-slices.json');

describe('production-readiness.json manifest', () => {
  it('parses as JSON', () => {
    const parsed = JSON.parse(readFileSync(manifestPath, 'utf8')) as ProductionReadinessManifest;
    expect(parsed.schemaVersion).toBe(1);
    expect(parsed.components.length).toBeGreaterThan(0);
  });

  it('matches the expected product component IDs in canonical order', () => {
    const manifest = loadProductionReadinessManifest();
    expect(manifest.components.map((component) => component.id)).toEqual([...PRODUCTION_READINESS_COMPONENT_IDS]);
    expect(manifest.components.map((component) => component.name)).toEqual([
      'Programs',
      'Program Workshop Mode',
      'Deliverables / Artifacts',
      'Intelligence',
      'AI Control Tower',
      'Admin / Setup',
      'Source / Outsourcing',
      'Data / Evidence / Knowledge Fabric',
      'Solution Intelligence',
      'Agent Runtime',
      'Model Gateway',
      'Ingestion / Parsing',
      'Audit / Governance',
      'Validation / QA',
      'Production / Deployment',
    ]);
  });

  it('includes all readiness dimensions for every component', () => {
    const manifest = loadProductionReadinessManifest();
    for (const component of manifest.components) {
      expect(Object.keys(component.dimensions).sort()).toEqual([...PRODUCTION_READINESS_DIMENSIONS].sort());
    }
  });

  it('includes all testing gates for every component', () => {
    const manifest = loadProductionReadinessManifest();
    for (const component of manifest.components) {
      expect(Object.keys(component.testingGates).sort()).toEqual([...PRODUCTION_READINESS_GATES].sort());
    }
  });

  it('uses only valid readiness and gate statuses', () => {
    const manifest = loadProductionReadinessManifest();
    expect(manifest.stewardBrief.title).toBe('Unified Production Readiness Control Plane');
    expect(manifest.stewardBrief.summary).toContain('one canonical production-readiness spine');
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

  it('records the founder maturity snapshot as deterministic ranges', () => {
    const manifest = loadProductionReadinessManifest();

    expect(manifest.maturitySnapshot.source.toLowerCase()).toContain('deterministic planning snapshot');
    expect(manifest.maturitySnapshot.indicators).toEqual([
      expect.objectContaining({
        id: 'overall_product_maturity',
        percentLow: 35,
        percentHigh: 40,
      }),
      expect.objectContaining({
        id: 'demo_proof_of_concept_maturity',
        percentLow: 65,
        percentHigh: 70,
      }),
      expect.objectContaining({
        id: 'production_readiness',
        percentLow: 20,
        percentHigh: 25,
      }),
    ]);
    expect(manifest.overallReadinessPercent).toBeGreaterThanOrEqual(20);
    expect(manifest.overallReadinessPercent).toBeLessThanOrEqual(25);
    expect(manifest.maturitySnapshot.areas.map((area) => area.area)).toEqual([
      'Product vision / architecture',
      'Programs',
      'Program deliverables / artifacts',
      'Nexus / Client Maestro workflow',
      'Intelligence / Sentinel',
      'AI Control Tower / Atlas',
      'Admin / Setup / Steward',
      'Source / sourcing product',
      'Solution Intelligence Fabric',
      'Patterns / pattern library',
      'Data / Knowledge Fabric',
      'Evidence Ledger',
      'Model Gateway',
      'Agent Runtime',
      'Tool Layer',
      'Workflow / program state',
      'Audit / governance',
      'Visual design system',
      'Validation / QA',
      'Production deployment readiness',
    ]);

    for (const area of manifest.maturitySnapshot.areas) {
      expect(area.completed.length).toBeGreaterThan(0);
      expect(area.pending.length).toBeGreaterThan(0);
      expect(area.percentLow).toBeGreaterThanOrEqual(0);
      expect(area.percentHigh).toBeLessThanOrEqual(100);
      expect(area.percentHigh).toBeGreaterThanOrEqual(area.percentLow);
      expect(area.relatedComponentIds.length).toBeGreaterThan(0);
      for (const componentId of area.relatedComponentIds) {
        expect(PRODUCTION_READINESS_COMPONENT_IDS).toContain(componentId);
      }
    }
  });
});

describe('production readiness read model', () => {
  it('is deterministic across repeated calls', () => {
    expect(buildProductionReadinessViewFromDisk()).toEqual(buildProductionReadinessViewFromDisk());
  });

  it('exposes freshness metadata without changing deterministic scoring', () => {
    const manifest = loadProductionReadinessManifest();
    const view = buildProductionReadinessView(manifest, '2026-04-26T12:00:00.000Z');
    const apiResponse = buildProductionReadinessApiResponse('2026-04-26T12:00:00.000Z');

    expect(view.freshness).toEqual(
      expect.objectContaining({
        lastUpdated: manifest.lastUpdated,
        dataSource: 'docs/build/production-readiness.json',
        updateMode: 'repository_snapshot',
        freshnessStatus: 'fresh',
      }),
    );
    expect(apiResponse.refreshMode).toBe('api_polling');
    expect(apiResponse.liveCiStatus).toBe('unavailable');
    expect(apiResponse.updateMode).toBe('repository_snapshot');
    expect(apiResponse.freshnessStatus).toBe('fresh');
    expect(apiResponse.view.overallReadinessPercent).toBe(view.overallReadinessPercent);
    expect(apiResponse.view.stewardBrief.title).toBe('Unified Production Readiness Control Plane');
  });

  it('classifies fresh, aging, stale, and unknown manifests deterministically', () => {
    const manifest = loadProductionReadinessManifest();
    const withLastUpdated = (lastUpdated: string): ProductionReadinessManifest => ({
      ...manifest,
      lastUpdated,
    });

    expect(
      getProductionReadinessFreshnessMetadata(withLastUpdated('2026-04-26'), '2026-04-26T12:00:00.000Z')
        .freshnessStatus,
    ).toBe('fresh');
    expect(
      getProductionReadinessFreshnessMetadata(withLastUpdated('2026-04-23'), '2026-04-26T12:00:00.000Z')
        .freshnessStatus,
    ).toBe('aging');
    expect(
      getProductionReadinessFreshnessMetadata(withLastUpdated('2026-04-01'), '2026-04-26T12:00:00.000Z')
        .freshnessStatus,
    ).toBe('stale');
    expect(
      getProductionReadinessFreshnessMetadata(withLastUpdated('not-a-date'), '2026-04-26T12:00:00.000Z')
        .freshnessStatus,
    ).toBe('unknown');
  });

  it('does not claim true live monitoring when the tracker is repository-backed', () => {
    const apiResponse = buildProductionReadinessApiResponse('2026-04-26T12:00:00.000Z');

    expect(apiResponse.source).toBe('production_readiness_manifest');
    expect(apiResponse.dataSource).toBe('docs/build/production-readiness.json');
    expect(apiResponse.updateMode).toBe('repository_snapshot');
    expect(apiResponse.liveCiStatus).toBe('unavailable');
    expect(apiResponse.note.toLowerCase()).toContain('unified control plane');
    expect(apiResponse.note.toLowerCase()).toContain('not true live monitoring');
    expect(apiResponse.note.toLowerCase()).not.toMatch(/github.*enabled|vercel.*enabled|live monitoring enabled/);
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
    expect(summary.overallReadinessPercent).toBe(computeOverallReadinessPercent(manifest.components));
    expect(summary.overallReadinessPercent).toBe(manifest.overallReadinessPercent);
  });

  it('exposes component progress with started and percent pending math', () => {
    const manifest = loadProductionReadinessManifest();
    const progress = getProductionReadinessComponentProgress(manifest.components);

    expect(progress).toHaveLength(manifest.components.length);
    expect(progress.map((component) => component.componentId)).toEqual([...PRODUCTION_READINESS_COMPONENT_IDS]);

    for (const component of progress) {
      expect(component.percentComplete + component.percentPending).toBe(100);
      expect(component.percentComplete).toBeGreaterThanOrEqual(0);
      expect(component.percentComplete).toBeLessThanOrEqual(100);
      expect(component.started).toBe(component.status !== 'not_started');
      expect(component.segmentName.length).toBeGreaterThan(0);
      expect(component.nextAction.length).toBeGreaterThan(0);
    }

    expect(progress.find((component) => component.componentId === 'model_gateway')?.started).toBe(false);
    expect(progress.find((component) => component.componentId === 'source')?.percentComplete).toBeGreaterThan(0);
  });

  it('groups readiness by operator-friendly segments', () => {
    const manifest = loadProductionReadinessManifest();
    const segments = getProductionReadinessSegments(manifest.components);

    expect(segments.map((segment) => segment.id)).toEqual(PRODUCTION_READINESS_SEGMENTS.map((segment) => segment.id));
    expect(segments.reduce((sum, segment) => sum + segment.totalComponents, 0)).toBe(manifest.components.length);
    expect(segments.flatMap((segment) => segment.components.map((component) => component.componentId)).sort()).toEqual(
      [...PRODUCTION_READINESS_COMPONENT_IDS].sort(),
    );

    for (const segment of segments) {
      expect(segment.percentComplete + segment.percentPending).toBe(100);
      expect(segment.startedCount + segment.notStartedCount).toBe(segment.totalComponents);
      expect(segment.nextAction.length).toBeGreaterThan(0);
    }
  });

  it('exposes top blockers and next recommended actions', () => {
    const view = buildProductionReadinessViewFromDisk();
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
    const source = loadProductionReadinessManifest().components.find((component) => component.id === 'source');
    expect(source).toBeDefined();
    expect(source!.name).toBe('Source / Outsourcing');
    expect(source!.status).toBe('scaffolded');
    expect(source!.status).not.toBe('pilot_ready');
    expect(source!.status).not.toBe('production_ready');
    expect(source!.maturity).toBe('foundation_validation');
    expect(source!.productionRiskLevel).toBe('medium_high');
    // Source nextAction evolves with each Source slice (dashboard route smoke,
    // event canvas shell, data readiness panel, …). Assert structural
    // invariants instead of an exact string so unrelated Source PRs do not
    // break this regression test. The conservative-status policy and the
    // no-fake-claims policy still hold.
    expect(typeof source!.nextAction).toBe('string');
    expect(source!.nextAction.length).toBeGreaterThan(20);
    expect(source!.nextAction).not.toMatch(/production[_\s]?ready/i);
    expect(source!.nextAction).not.toMatch(/live model|live monitoring/i);

    const notes = source!.notes.join('\n').toLowerCase();
    for (const required of [
      'source dashboard / sourcing event portfolio',
      'source dashboard',
      'source event canvas',
      'source data readiness panel',
      'deterministic source nexus api stub',
      'deterministic multi-agent mission preview',
      'source event journey',
      'outsourcing / ams pattern intelligence',
      'ams pattern intelligence',
      'context-aware nexus foundation',
      'deterministic context validation',
      'deterministic workflow validation',
      'pricing and negotiation intelligence',
      'source data readiness integration with admin/setup',
      'future model-assisted source-specific nexus route',
      'future upload/evidence pipeline',
      'future event canvas, scorecard governance, artifact drawer, vendor evaluation, and value ledger ui',
      'not pilot_ready and not production_ready',
      'full user-facing workflow',
      'persistence',
      'model-assisted nexus route',
      'authenticated visual qa',
      'production-grade tenant/security validation',
      'deterministic source agent mission read model',
      'deterministic source agent mission report formatter',
      'tiny deterministic source dashboard mission preview',
      'unified production-readiness.json manifest',
      'seeded/deterministic readiness only',
      'no scorecard/artifact/value/vendor workflow implementation',
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
    expect(protocol).toContain('cross-session update rule');
    expect(protocol).toContain('do not create local readiness trackers');
    expect(protocol).toContain('source work updates `source / outsourcing`');
    expect(protocol).toContain('production-readiness.json updated');
    expect(protocol).toContain('components changed');
    expect(protocol).toContain('gates changed');
  });
});

describe('production readiness component map and PROD4B slice', () => {
  it('maps every canonical component through one readiness spine', () => {
    const componentMap = readFileSync(componentMapPath, 'utf8');

    for (const name of loadProductionReadinessManifest().components.map((component) => component.name)) {
      expect(componentMap).toContain(name);
    }

    expect(componentMap).toContain('docs/build/production-readiness.json');
    expect(componentMap).toContain('/platform/admin/production-readiness');
    expect(componentMap).toContain('Source / Outsourcing');
    expect(componentMap).toContain('docs/abarva-source/SOURCE_PRODUCTION_READINESS_TRACKER.md');
    expect(componentMap).toContain('docs/abarva-source/SOURCE_LAYERED_PROGRESS_TRACKER.md');
    expect(componentMap).toContain('src/components/source/AbarVaSourceDashboard.tsx');
    expect(componentMap).toContain('src/components/source/NexusEngagementCanvas.tsx');
    expect(componentMap).toContain('src/components/source/SourceDataReadinessPanel.tsx');
    expect(componentMap).toContain('src/lib/source/nexus-api.ts');
    expect(componentMap).toContain('src/lib/source/context-builder.ts');
    expect(componentMap).toContain('src/lib/source/agent-validation-report.ts');
    expect(componentMap).toContain('src/lib/source/workflow-validation-report.ts');
    expect(componentMap).toContain('docs/abarva-source/pattern-packs/AMS_MANAGED_SERVICES_SOURCING_PATTERN.md');
  });

  it('records PROD4B without duplicating PROD4 or claiming live monitoring', () => {
    const buildSlices = JSON.parse(readFileSync(buildSlicesPath, 'utf8')) as {
      slices: ReadonlyArray<{ id: string; name: string; status: string; notes?: string }>;
    };
    const ids = buildSlices.slices.map((slice) => slice.id);
    const duplicateIds = ids.filter((id, index) => ids.indexOf(id) !== index);
    const prod4b = buildSlices.slices.find((slice) => slice.id === 'PROD4B');

    expect(duplicateIds).toEqual([]);
    expect(ids.filter((id) => id === 'PROD4')).toHaveLength(1);
    expect(prod4b).toEqual(
      expect.objectContaining({
        name: 'Unified Production Readiness Control Plane',
        status: 'code_complete',
      }),
    );
    expect(prod4b?.notes?.toLowerCase()).toContain('does not add live monitoring');
  });
});

describe('module hygiene', () => {
  const readModelSource = readCode('../../../lib/admin/production-readiness.ts');
  const componentSource = readCode('../../../components/admin/ProductionReadinessTracker.tsx');
  const livePanelSource = readCode('../../../components/admin/ProductionReadinessLivePanel.tsx');
  const routeSource = readCode('../../../app/(maestro)/platform/admin/production-readiness/page.tsx');
  const apiRouteSource = readCode('../../../app/api/admin/production-readiness/route.ts');
  const adminPageSource = readCode('../../../app/(maestro)/platform/admin/page.tsx');
  const newSources = [readModelSource, componentSource, livePanelSource, routeSource, apiRouteSource]
    .map(stripComments)
    .join('\n');
  const adminSources = [readModelSource, componentSource, livePanelSource, routeSource, apiRouteSource, adminPageSource]
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

  it('does not call models or external APIs, and keeps scoring deterministic', () => {
    expect(newSources).not.toMatch(/anthropic/i);
    expect(newSources).not.toMatch(/openai/i);
    expect(newSources).not.toMatch(/pinecone/i);
    expect(newSources).not.toMatch(/api\.github\.com/);
    expect(newSources).not.toMatch(/api\.vercel\.com/);
    expect(readModelSource).not.toMatch(/Date\.now\(/);
    expect(readModelSource).not.toMatch(/Math\.random\(/);
    expect(readModelSource).not.toMatch(/new Date\(/);
  });

  it('component and route wire the deterministic read model', () => {
    // Legacy ProductionReadinessTracker component (still in repo, used by
    // alternate dashboards / future re-introduction) preserves its content
    // contract.
    expect(componentSource).toMatch(/Canonical Readiness Spine/);
    expect(componentSource).toMatch(/view\.stewardBrief\.title/);
    expect(componentSource).toMatch(/Product maturity by area/);
    expect(componentSource).toMatch(/Readiness by segment/);
    expect(componentSource).toMatch(/Tracker freshness/);
    expect(componentSource).toMatch(/unified readiness spine, not live monitoring/);
    expect(componentSource).toMatch(/Component progress table/);
    expect(componentSource).toMatch(/% done/);
    expect(componentSource).toMatch(/% pending/);
    expect(componentSource).toMatch(/Started/);
    // Legacy ProductionReadinessLivePanel (still exported, used by API
    // explorers / fallback flows) keeps its API wiring contract.
    expect(livePanelSource).toMatch(/ProductionReadinessTracker/);
    expect(livePanelSource).toMatch(/Production Readiness Control Plane/);
    expect(livePanelSource).toMatch(/\/api\/admin\/production-readiness/);
    expect(livePanelSource).toMatch(/freshnessStatus/);
    // ADMIN5 (wave-33) rewired the route to AdminCanonShellV2 +
    // buildProductionReadinessPageView. The legacy ProductionReadinessLivePanel
    // is no longer mounted on the route — that mount is intentionally retired.
    expect(routeSource).toMatch(/AdminCanonShellV2/);
    expect(routeSource).toMatch(/buildProductionReadinessPageView/);
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
