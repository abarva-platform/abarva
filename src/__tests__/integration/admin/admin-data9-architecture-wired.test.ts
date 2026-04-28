/**
 * ADMIN-DATA9 — `/admin/architecture` wired to admin-architecture-adapter.
 *
 * Asserts that:
 *  - The adapter exposes the four documented readers and they return the
 *    deterministic seed (7 planes × 28 components, 6 Azure services).
 *  - `buildArchitecturePageView` is async and consumes the adapter without
 *    changing output shape.
 *  - The page route awaits the builder.
 *  - AGENT1 wiring (agentChoices / agentPostures) is preserved.
 */

import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import {
  getArchitectureComponentById,
  getArchitectureComponents,
  getArchitecturePlanes,
  getAzureTargetArchitecture,
} from '@/lib/admin/data/admin-architecture-adapter';
import {
  ARCHITECTURE_PLANES,
  AZURE_SERVICES,
  AZURE_TARGET_ARCHITECTURE,
  PLANE_COMPONENTS,
  buildArchitecturePageView,
} from '@/lib/admin/architecture-page-view';

const root = process.cwd();

describe('ADMIN-DATA9 — /admin/architecture wired to adapter', () => {
  describe('admin-architecture-adapter readers', () => {
    it('getArchitecturePlanes returns 7 planes for apex-retail', async () => {
      const planes = await getArchitecturePlanes('apex-retail');
      expect(planes.length).toBe(7);
    });

    it('getArchitecturePlanes is tenant-tolerant (concept-level seed)', async () => {
      const apex = await getArchitecturePlanes('apex-retail');
      const meridian = await getArchitecturePlanes('meridian');
      expect(meridian.map((p) => p.id)).toEqual(apex.map((p) => p.id));
    });

    it('getArchitectureComponents returns 28 components', async () => {
      const components = await getArchitectureComponents('apex-retail');
      expect(components.length).toBe(28);
    });

    it('getArchitectureComponents covers every plane', async () => {
      const components = await getArchitectureComponents('apex-retail');
      const planeIds = new Set(components.map((c) => c.planeId));
      ['app', 'agent', 'context', 'evidence', 'data', 'gateway', 'deployment'].forEach((id) =>
        expect(planeIds.has(id)).toBe(true),
      );
    });

    it('getAzureTargetArchitecture returns 6 services', async () => {
      const azure = await getAzureTargetArchitecture('apex-retail');
      expect(azure.services.length).toBe(6);
    });

    it('getAzureTargetArchitecture exposes container-apps fan-out edges', async () => {
      const azure = await getAzureTargetArchitecture('apex-retail');
      const fan = azure.edges.filter((e) => e.from === 'container-apps');
      expect(fan.length).toBeGreaterThanOrEqual(5);
    });

    it('getArchitectureComponentById finds the programs component', async () => {
      const programs = await getArchitectureComponentById('apex-retail', 'programs');
      expect(programs?.label).toBe('Programs');
      expect(programs?.planeId).toBe('app');
    });

    it('getArchitectureComponentById returns undefined for unknown ids', async () => {
      const missing = await getArchitectureComponentById('apex-retail', 'no-such-thing');
      expect(missing).toBeUndefined();
    });

    it('component states only use the canonical enum', async () => {
      const components = await getArchitectureComponents('apex-retail');
      const allowed = new Set(['active', 'partial', 'deferred']);
      components.forEach((c) => expect(allowed.has(c.state)).toBe(true));
    });
  });

  describe('buildArchitecturePageView consumes the adapter', () => {
    it('is async (returns a Promise)', () => {
      const result = buildArchitecturePageView();
      expect(typeof (result as Promise<unknown>).then).toBe('function');
      return result;
    });

    it('output planes are equal to adapter planes', async () => {
      const view = await buildArchitecturePageView();
      const adapterPlanes = await getArchitecturePlanes('apex-retail');
      expect(view.planes.map((p) => p.id)).toEqual(adapterPlanes.map((p) => p.id));
    });

    it('output planeComponents are equal to adapter components', async () => {
      const view = await buildArchitecturePageView();
      const adapterComponents = await getArchitectureComponents('apex-retail');
      expect(view.planeComponents.map((c) => c.id)).toEqual(
        adapterComponents.map((c) => c.id),
      );
    });

    it('output azureServices are equal to adapter Azure services', async () => {
      const view = await buildArchitecturePageView();
      const azure = await getAzureTargetArchitecture('apex-retail');
      expect(view.azureServices.map((s) => s.id)).toEqual(azure.services.map((s) => s.id));
    });

    it('componentDetailMap is keyed by component id', async () => {
      const view = await buildArchitecturePageView();
      expect(view.componentDetailMap['programs']?.label).toBe('Programs');
      expect(view.componentDetailMap['steward']?.label).toBe('Steward');
    });

    it('preserves output shape — title, eyebrow, subtitle, deterministicSeed', async () => {
      const view = await buildArchitecturePageView();
      expect(view.title).toBe('Architecture');
      expect(view.eyebrow.length).toBeGreaterThan(0);
      expect(view.subtitle.length).toBeGreaterThan(0);
      expect(view.deterministicSeed).toBe(true);
    });

    it('preserves AGENT1 wiring — agentChoices + agentPostures', async () => {
      const view = await buildArchitecturePageView();
      expect(Array.isArray(view.agentChoices)).toBe(true);
      expect(view.agentPostures?.length).toBe(4);
      const agents = view.agentPostures?.map((p) => p.agent) ?? [];
      ['steward', 'nexus', 'sentinel', 'atlas'].forEach((a) =>
        expect(agents).toContain(a),
      );
    });

    it('preserves Steward primary-agent wiring', async () => {
      const view = await buildArchitecturePageView();
      expect(view.primaryAgentLabel).toBe('Steward');
      expect(view.primaryActionHref).toBe('/admin/architecture#azure');
    });
  });

  describe('Module-level constants stay synchronous for legacy import sites', () => {
    it('ARCHITECTURE_PLANES has 7 planes', () => {
      expect(ARCHITECTURE_PLANES.length).toBe(7);
    });
    it('PLANE_COMPONENTS has 28 components', () => {
      expect(PLANE_COMPONENTS.length).toBe(28);
    });
    it('AZURE_SERVICES has 6 services', () => {
      expect(AZURE_SERVICES.length).toBe(6);
    });
    it('AZURE_TARGET_ARCHITECTURE has services + edges', () => {
      expect(AZURE_TARGET_ARCHITECTURE.services.length).toBe(6);
      expect(AZURE_TARGET_ARCHITECTURE.edges.length).toBeGreaterThan(0);
    });
  });

  describe('Page route wiring', () => {
    const pagePath = resolve(root, 'src/app/(maestro)/admin/architecture/page.tsx');
    const src = readFileSync(pagePath, 'utf8');

    it('awaits buildArchitecturePageView', () => {
      expect(src).toContain('await buildArchitecturePageView()');
    });

    it('still imports buildArchitecturePageView from the page-view module', () => {
      expect(src).toContain("from '@/lib/admin/architecture-page-view'");
    });
  });

  describe('Adapter file presence', () => {
    it('adapter file exists', () => {
      const p = resolve(root, 'src/lib/admin/data/admin-architecture-adapter.ts');
      expect(() => readFileSync(p, 'utf8')).not.toThrow();
    });
    it('adapter types file exists', () => {
      const p = resolve(root, 'src/lib/admin/data/admin-architecture-adapter-types.ts');
      expect(() => readFileSync(p, 'utf8')).not.toThrow();
    });
    it('fixture file exists', () => {
      const p = resolve(root, 'src/lib/admin/data/fixtures/admin-architecture-fixture.ts');
      expect(() => readFileSync(p, 'utf8')).not.toThrow();
    });
  });
});
