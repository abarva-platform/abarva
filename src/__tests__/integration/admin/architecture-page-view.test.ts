import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import {
  ARCHITECTURE_PLANES,
  buildArchitecturePageView,
} from '@/lib/admin/architecture-page-view';

const root = process.cwd();

describe('ADMIN4 — Architecture page view model', () => {
  describe('buildArchitecturePageView', () => {
    const view = buildArchitecturePageView();

    it('returns a deterministic seed', () => expect(view.deterministicSeed).toBe(true));
    it('eyebrow is set', () => expect(view.eyebrow.length).toBeGreaterThan(0));
    it('title is "Architecture"', () => expect(view.title).toBe('Architecture'));
    it('subtitle mentions Azure/private data-plane', () =>
      expect(view.subtitle.toLowerCase()).toContain('private data-plane'));
    it('context tenant is Apex Retail', () => expect(view.context.tenant).toBe('Apex Retail'));
    it('context mode is Setup/Admin', () => expect(view.context.mode).toBe('Setup/Admin'));
    it('context agent is Steward', () => expect(view.context.agent).toBe('Steward'));
    it('context data is Manifest + seeds', () => expect(view.context.data).toBe('Manifest + seeds'));
    it('liveStatus is Deferred', () => expect(view.context.liveStatus).toBe('Deferred'));
    it('liveStatusKind is deferred', () => expect(view.context.liveStatusKind).toBe('deferred'));
    it('editorial title mentions architecture posture', () =>
      expect(view.editorial.title.toLowerCase()).toContain('architecture posture'));
    it('editorial includes a blocker', () => expect(view.editorial.blocker).toBeDefined());
    it('editorial blocker is "lab not deployed"', () =>
      expect(view.editorial.blocker).toBe('lab not deployed'));
    it('editorial does not claim production_ready', () => {
      const all = JSON.stringify(view).toLowerCase();
      expect(all).not.toContain('production_ready');
      expect(all).not.toContain('"productionready":true');
    });
    it('editorial does not claim live customer-tenant operation', () => {
      expect(view.editorial.body.toLowerCase()).toContain('do not claim');
    });
    it('editorial primaryAction has label and href', () => {
      expect(view.editorial.primaryAction.label).toBeDefined();
      expect(view.editorial.primaryAction.href).toBeDefined();
    });
    it('contextUsed has at least 2 entries', () =>
      expect(view.editorial.contextUsed.length).toBeGreaterThanOrEqual(2));
    it('evidenceStrength is strong/partial/thin', () => {
      expect(['strong', 'partial', 'thin']).toContain(view.editorial.evidenceStrength);
    });
    it('primaryAgentLabel is Steward', () => expect(view.primaryAgentLabel).toBe('Steward'));
    it('primaryActionLabel is set', () =>
      expect(view.primaryActionLabel.length).toBeGreaterThan(0));
  });

  describe('ARCHITECTURE_PLANES', () => {
    it('has exactly 7 planes', () => expect(ARCHITECTURE_PLANES.length).toBe(7));
    it('includes App Plane', () =>
      expect(ARCHITECTURE_PLANES.find((p) => p.id === 'app')).toBeDefined());
    it('includes Agent Plane', () =>
      expect(ARCHITECTURE_PLANES.find((p) => p.id === 'agent')).toBeDefined());
    it('includes Context Plane', () =>
      expect(ARCHITECTURE_PLANES.find((p) => p.id === 'context')).toBeDefined());
    it('includes Evidence Plane', () =>
      expect(ARCHITECTURE_PLANES.find((p) => p.id === 'evidence')).toBeDefined());
    it('includes Data Plane', () =>
      expect(ARCHITECTURE_PLANES.find((p) => p.id === 'data')).toBeDefined());
    it('includes Gateway + Tools', () =>
      expect(ARCHITECTURE_PLANES.find((p) => p.id === 'gateway')).toBeDefined());
    it('includes Deployment', () =>
      expect(ARCHITECTURE_PLANES.find((p) => p.id === 'deployment')).toBeDefined());
    it('every plane has at least 3 components', () => {
      ARCHITECTURE_PLANES.forEach((p) => expect(p.components.length).toBeGreaterThanOrEqual(3));
    });
    it('App Plane lists Programs, Source, Intelligence, Tower, Admin', () => {
      const app = ARCHITECTURE_PLANES.find((p) => p.id === 'app');
      ['Programs', 'Source', 'Intelligence', 'Tower', 'Admin'].forEach((c) =>
        expect(app?.components).toContain(c)
      );
    });
    it('Agent Plane lists 4 canonical agents', () => {
      const ag = ARCHITECTURE_PLANES.find((p) => p.id === 'agent');
      expect(ag?.components).toContain('Nexus');
      expect(ag?.components).toContain('Sentinel');
      expect(ag?.components).toContain('Atlas');
      expect(ag?.components).toContain('Steward');
    });
  });

  describe('ArchitecturePlaneStack source file', () => {
    const path = 'src/components/admin/ArchitecturePlaneStack.tsx';
    it('exists', () => expect(existsSync(resolve(root, path))).toBe(true));
    it('imports tokens', () =>
      expect(readFileSync(resolve(root, path), 'utf8')).toContain(
        "from '@/lib/design/design-tokens'"
      ));
    it('contains no banned tokens', () => {
      const src = readFileSync(resolve(root, path), 'utf8').toLowerCase();
      ['#14b8a6', '#7c3aed', '#d946ef', 'sparkle'].forEach((b) => expect(src).not.toContain(b));
    });
    it('exports ArchitecturePlaneStack', () =>
      expect(readFileSync(resolve(root, path), 'utf8')).toContain(
        'export function ArchitecturePlaneStack'
      ));
  });

  describe('Architecture page route', () => {
    // Determine actual page file dynamically
    const candidates = [
      'src/app/(maestro)/admin/architecture/page.tsx',
      'src/app/(maestro)/platform/admin/architecture/page.tsx',
    ];
    const foundPath = candidates.find((p) => existsSync(resolve(root, p)));
    it('page file exists at one of the canonical paths', () => {
      expect(foundPath).toBeDefined();
    });
    if (foundPath) {
      it('imports AdminCanonShellV2', () => {
        expect(readFileSync(resolve(root, foundPath), 'utf8')).toContain('AdminCanonShellV2');
      });
      it('imports buildArchitecturePageView', () => {
        expect(readFileSync(resolve(root, foundPath), 'utf8')).toContain(
          'buildArchitecturePageView'
        );
      });
      it('does not contain banned hex tokens', () => {
        const src = readFileSync(resolve(root, foundPath), 'utf8').toLowerCase();
        ['#14b8a6', '#7c3aed', '#d946ef'].forEach((b) => expect(src).not.toContain(b));
      });
    }
  });
});
