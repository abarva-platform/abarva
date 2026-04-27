// ADMIN17 — Architecture depth integration tests.
// Covers the per-plane drilldown, component detail drawer, Azure
// sub-tab canvas, and action strip. Asserts on the deterministic
// page-view shape (PLANE_COMPONENTS, AZURE_SERVICES) and on the
// rendered route source (page.tsx wires URL params through).

import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import {
  ARCHITECTURE_PLANES,
  AZURE_SERVICES,
  AZURE_TARGET_ARCHITECTURE,
  PLANE_COMPONENTS,
  buildArchitecturePageView,
  getComponentById,
  getComponentsForPlane,
  type ComponentState,
} from '@/lib/admin/architecture-page-view';

const root = process.cwd();

describe('ADMIN17 — Architecture depth', () => {
  let view: Awaited<ReturnType<typeof buildArchitecturePageView>>;
  beforeAll(async () => {
    view = await buildArchitecturePageView();
  });

  // --- 1. PLANE_COMPONENTS manifest ----------------------------------------
  describe('PLANE_COMPONENTS manifest', () => {
    it('exposes a non-empty plane-component list', () => {
      expect(PLANE_COMPONENTS.length).toBeGreaterThan(0);
    });

    it('covers all 7 planes from ARCHITECTURE_PLANES', () => {
      const planeIds = new Set(PLANE_COMPONENTS.map((c) => c.planeId));
      ARCHITECTURE_PLANES.forEach((p) => expect(planeIds.has(p.id)).toBe(true));
    });

    it('App Plane lists Programs, Source, Intelligence, Tower, Admin', () => {
      const ids = getComponentsForPlane('app').map((c) => c.id);
      expect(ids).toEqual(
        expect.arrayContaining(['programs', 'source', 'intelligence', 'tower', 'admin'])
      );
    });

    it('Agent Plane lists Nexus, Sentinel, Atlas, Steward', () => {
      const ids = getComponentsForPlane('agent').map((c) => c.id);
      expect(ids).toEqual(expect.arrayContaining(['nexus', 'sentinel', 'atlas', 'steward']));
    });

    it('every component has a non-empty codePath', () => {
      PLANE_COMPONENTS.forEach((c) =>
        expect(typeof c.codePath === 'string' && c.codePath.length > 0).toBe(true)
      );
    });

    it('every component has a non-empty summary', () => {
      PLANE_COMPONENTS.forEach((c) => expect(c.summary.length).toBeGreaterThan(0));
    });

    it('every component state is active|partial|deferred', () => {
      const valid: ComponentState[] = ['active', 'partial', 'deferred'];
      PLANE_COMPONENTS.forEach((c) => expect(valid).toContain(c.state));
    });

    it('component ids are unique', () => {
      const ids = PLANE_COMPONENTS.map((c) => c.id);
      expect(new Set(ids).size).toBe(ids.length);
    });

    it('App-plane components carry routePath', () => {
      getComponentsForPlane('app').forEach((c) =>
        expect(typeof c.routePath === 'string' && c.routePath.length > 0).toBe(true)
      );
    });

    it('Programs component points at the canonical tenant programs route', () => {
      const programs = getComponentById('programs');
      expect(programs?.routePath).toBe('/tenant/[slug]/programs');
    });

    it('Steward component is Active', () => {
      expect(getComponentById('steward')?.state).toBe('active');
    });

    it('private-data-plane component is Deferred', () => {
      expect(getComponentById('private-data-plane')?.state).toBe('deferred');
    });

    it('dependencies reference existing component ids, plane ids, or platform tokens', () => {
      const knownTokens = new Set([
        'context-bundle',
        'posture',
        ...PLANE_COMPONENTS.map((c) => c.id),
        ...ARCHITECTURE_PLANES.map((p) => p.id),
      ]);
      PLANE_COMPONENTS.forEach((c) => {
        c.dependencies.forEach((d) => expect(knownTokens.has(d)).toBe(true));
      });
    });

    it('getComponentById returns undefined for unknown ids', () => {
      expect(getComponentById('does-not-exist')).toBeUndefined();
    });
  });

  // --- 2. AZURE_SERVICES manifest ------------------------------------------
  describe('AZURE_SERVICES manifest', () => {
    it('lists exactly 6 Wave 24 services', () => {
      expect(AZURE_SERVICES.length).toBe(6);
    });

    it('includes Container Apps', () =>
      expect(AZURE_SERVICES.find((s) => s.id === 'container-apps')).toBeDefined());
    it('includes PostgreSQL', () =>
      expect(AZURE_SERVICES.find((s) => s.id === 'postgresql')).toBeDefined());
    it('includes Blob', () =>
      expect(AZURE_SERVICES.find((s) => s.id === 'blob')).toBeDefined());
    it('includes Key Vault', () =>
      expect(AZURE_SERVICES.find((s) => s.id === 'key-vault')).toBeDefined());
    it('includes App Insights', () =>
      expect(AZURE_SERVICES.find((s) => s.id === 'app-insights')).toBeDefined());
    it('includes Azure AI Search', () =>
      expect(AZURE_SERVICES.find((s) => s.id === 'ai-search')).toBeDefined());

    it('all services are Deferred (target architecture, not live)', () => {
      AZURE_SERVICES.forEach((s) => expect(s.state).toBe('deferred'));
    });

    it('every service has a non-empty role description', () => {
      AZURE_SERVICES.forEach((s) => expect(s.role.length).toBeGreaterThan(0));
    });

    it('Azure target architecture exposes edges from container-apps fan-out', () => {
      const fromContainerApps = AZURE_TARGET_ARCHITECTURE.edges.filter(
        (e) => e.from === 'container-apps'
      );
      expect(fromContainerApps.length).toBeGreaterThanOrEqual(5);
    });
  });

  // --- 3. buildArchitecturePageView extension ------------------------------
  describe('ArchitecturePageView (ADMIN17 extension)', () => {
    it('exposes planeComponents', () => {
      expect(view.planeComponents.length).toBe(PLANE_COMPONENTS.length);
    });

    it('exposes componentDetailMap keyed by component id', () => {
      expect(view.componentDetailMap['programs']?.label).toBe('Programs');
    });

    it('exposes azureServices', () => {
      expect(view.azureServices.length).toBe(AZURE_SERVICES.length);
    });

    it('exposes azureTargetArchitecture with services + edges', () => {
      expect(view.azureTargetArchitecture.services.length).toBeGreaterThan(0);
      expect(view.azureTargetArchitecture.edges.length).toBeGreaterThan(0);
    });

    it('still passes ADMIN4 contract — title is Architecture', () => {
      expect(view.title).toBe('Architecture');
    });

    it('still passes ADMIN4 contract — primaryAgentLabel is Steward', () => {
      expect(view.primaryAgentLabel).toBe('Steward');
    });
  });

  // --- 4. ArchitecturePlaneDrilldown component -----------------------------
  describe('ArchitecturePlaneDrilldown component', () => {
    const path = 'src/components/admin/ArchitecturePlaneDrilldown.tsx';
    const abs = resolve(root, path);

    it('file exists', () => expect(existsSync(abs)).toBe(true));

    it('imports design tokens', () =>
      expect(readFileSync(abs, 'utf8')).toContain("from '@/lib/design/design-tokens'"));

    it('exports the drilldown component', () =>
      expect(readFileSync(abs, 'utf8')).toContain('export function ArchitecturePlaneDrilldown'));

    it('renders per-plane expand affordance via URL query param', () => {
      const src = readFileSync(abs, 'utf8');
      expect(src).toContain('expand=');
    });

    it('renders per-component drawer affordance via URL query param', () => {
      const src = readFileSync(abs, 'utf8');
      expect(src).toContain('component=');
    });

    it('contains no banned hex tokens', () => {
      const src = readFileSync(abs, 'utf8').toLowerCase();
      ['#14b8a6', '#7c3aed', '#d946ef', 'sparkle'].forEach((b) =>
        expect(src).not.toContain(b)
      );
    });
  });

  // --- 5. ComponentDetailDrawer component ----------------------------------
  describe('ComponentDetailDrawer component', () => {
    const path = 'src/components/admin/ComponentDetailDrawer.tsx';
    const abs = resolve(root, path);

    it('file exists', () => expect(existsSync(abs)).toBe(true));

    it('exports ComponentDetailDrawer', () =>
      expect(readFileSync(abs, 'utf8')).toContain('export function ComponentDetailDrawer'));

    it('renders route path field', () =>
      expect(readFileSync(abs, 'utf8')).toContain('Route path'));

    it('renders code path field', () =>
      expect(readFileSync(abs, 'utf8')).toContain('Code path'));

    it('renders dependencies section', () =>
      expect(readFileSync(abs, 'utf8')).toContain('Dependencies'));

    it('renders close affordance', () => {
      const src = readFileSync(abs, 'utf8');
      expect(src).toContain('data-drawer-close');
    });

    it('contains no banned hex tokens', () => {
      const src = readFileSync(abs, 'utf8').toLowerCase();
      ['#14b8a6', '#7c3aed', '#d946ef', 'sparkle'].forEach((b) =>
        expect(src).not.toContain(b)
      );
    });
  });

  // --- 6. AzureArchitectureCanvas component --------------------------------
  describe('AzureArchitectureCanvas component', () => {
    const path = 'src/components/admin/AzureArchitectureCanvas.tsx';
    const abs = resolve(root, path);

    it('file exists', () => expect(existsSync(abs)).toBe(true));

    it('exports AzureArchitectureCanvas', () =>
      expect(readFileSync(abs, 'utf8')).toContain('export function AzureArchitectureCanvas'));

    it('mentions Azure private data plane in copy', () =>
      expect(readFileSync(abs, 'utf8')).toContain('Azure private data plane'));

    it('renders service flow edges', () => {
      const src = readFileSync(abs, 'utf8');
      expect(src).toContain('Service flows');
    });

    it('contains no banned hex tokens', () => {
      const src = readFileSync(abs, 'utf8').toLowerCase();
      ['#14b8a6', '#7c3aed', '#d946ef'].forEach((b) => expect(src).not.toContain(b));
    });
  });

  // --- 7. ArchitectureActionStrip component --------------------------------
  describe('ArchitectureActionStrip component', () => {
    const path = 'src/components/admin/ArchitectureActionStrip.tsx';
    const abs = resolve(root, path);

    it('file exists', () => expect(existsSync(abs)).toBe(true));

    it('exports ArchitectureActionStrip', () =>
      expect(readFileSync(abs, 'utf8')).toContain('export function ArchitectureActionStrip'));

    it('renders Open Azure story affordance (SAFE)', () =>
      expect(readFileSync(abs, 'utf8')).toContain('Open Azure story'));

    it('renders Review private data plane affordance (SAFE)', () =>
      expect(readFileSync(abs, 'utf8')).toContain('Review private data plane'));

    it('renders Export architecture diagram affordance (HARD-GATED)', () => {
      const src = readFileSync(abs, 'utf8');
      expect(src).toContain('Export architecture diagram');
    });

    it('export-diagram is disabled with Wave 27 reason copy', () => {
      const src = readFileSync(abs, 'utf8');
      expect(src).toContain('Wave 27');
      expect(src).toContain('aria-disabled="true"');
    });
  });

  // --- 8. Architecture page wiring -----------------------------------------
  describe('Architecture page wiring', () => {
    const path = 'src/app/(maestro)/admin/architecture/page.tsx';
    const abs = resolve(root, path);

    it('file exists', () => expect(existsSync(abs)).toBe(true));

    it('still imports AdminCanonShellV2', () =>
      expect(readFileSync(abs, 'utf8')).toContain('AdminCanonShellV2'));

    it('still imports buildArchitecturePageView', () =>
      expect(readFileSync(abs, 'utf8')).toContain('buildArchitecturePageView'));

    it('imports ArchitecturePlaneDrilldown', () =>
      expect(readFileSync(abs, 'utf8')).toContain('ArchitecturePlaneDrilldown'));

    it('imports ComponentDetailDrawer', () =>
      expect(readFileSync(abs, 'utf8')).toContain('ComponentDetailDrawer'));

    it('imports AzureArchitectureCanvas', () =>
      expect(readFileSync(abs, 'utf8')).toContain('AzureArchitectureCanvas'));

    it('imports ArchitectureActionStrip', () =>
      expect(readFileSync(abs, 'utf8')).toContain('ArchitectureActionStrip'));

    it('reads searchParams for view + expand + component', () => {
      const src = readFileSync(abs, 'utf8');
      expect(src).toContain('searchParams');
      expect(src).toContain('view');
      expect(src).toContain('expand');
      expect(src).toContain('component');
    });

    it('contains no banned hex tokens', () => {
      const src = readFileSync(abs, 'utf8').toLowerCase();
      ['#14b8a6', '#7c3aed', '#d946ef'].forEach((b) => expect(src).not.toContain(b));
    });
  });
});
