import { readFileSync } from 'fs';
import { resolve } from 'path';
import {
  buildFounderDemoRouteChecklist,
  type DemoRoute,
  type FounderDemoRouteChecklist,
} from '@/lib/qa/founder-demo-route-checklist';

const sourceFilePath = resolve(
  __dirname,
  '../../../lib/qa/founder-demo-route-checklist.ts',
);

const EXPECTED_ROUTES: readonly string[] = [
  '/home',
  '/platform/admin',
  '/platform/admin/production-readiness',
  '/platform/admin/build-progress',
  '/tenant/apex-retail/programs',
  '/tenant/apex-retail/programs/[programSlug]',
  '/tenant/apex-retail/tower',
  '/tenant/apex-retail/intelligence',
  '/tenant/apex-retail/intelligence/patterns/[patternKey]',
  '/source',
  '/source/events',
];

const VALID_VALIDATION_STATUSES: ReadonlySet<string> = new Set<string>([
  'ready',
  'partial',
  'deferred',
  'blocked',
]);

describe('DEMO2 founder demo route checklist — shape', () => {
  let checklist: FounderDemoRouteChecklist;

  beforeAll(() => {
    checklist = buildFounderDemoRouteChecklist();
  });

  it('returns exactly 11 routes', () => {
    expect(checklist.routes).toHaveLength(11);
  });

  it('contains all 11 expected routes', () => {
    const routeStrings = checklist.routes.map((r) => r.route);
    for (const expected of EXPECTED_ROUTES) {
      expect(routeStrings).toContain(expected);
    }
  });

  it('every route has a non-empty purpose', () => {
    for (const r of checklist.routes) {
      expect(r.purpose.trim().length).toBeGreaterThan(0);
    }
  });

  it('every route has a non-empty primaryAgent', () => {
    for (const r of checklist.routes) {
      expect(r.primaryAgent.trim().length).toBeGreaterThan(0);
    }
  });

  it('every route has a non-empty demoTalkingPoint', () => {
    for (const r of checklist.routes) {
      expect(r.demoTalkingPoint.trim().length).toBeGreaterThan(0);
    }
  });

  it('every route has a non-empty expectedComponent', () => {
    for (const r of checklist.routes) {
      expect(r.expectedComponent.trim().length).toBeGreaterThan(0);
    }
  });

  it('every route has a valid validationStatus', () => {
    for (const r of checklist.routes) {
      expect(VALID_VALIDATION_STATUSES.has(r.validationStatus)).toBe(true);
    }
  });

  it('every route has a non-empty readinessCaveat', () => {
    for (const r of checklist.routes) {
      expect(r.readinessCaveat.trim().length).toBeGreaterThan(0);
    }
  });

  it('every route has a non-empty fallbackIfBlocked', () => {
    for (const r of checklist.routes) {
      expect(r.fallbackIfBlocked.trim().length).toBeGreaterThan(0);
    }
  });
});

describe('DEMO2 founder demo route checklist — totals reconciliation', () => {
  let checklist: FounderDemoRouteChecklist;

  beforeAll(() => {
    checklist = buildFounderDemoRouteChecklist();
  });

  it('totalRoutes equals routes.length', () => {
    expect(checklist.totalRoutes).toBe(checklist.routes.length);
  });

  it('status bucket totals sum to totalRoutes', () => {
    const sum =
      checklist.readyRoutes +
      checklist.partialRoutes +
      checklist.deferredRoutes +
      checklist.blockedRoutes;
    expect(sum).toBe(checklist.totalRoutes);
  });

  it('readyRoutes count matches routes with validationStatus ready', () => {
    const count = checklist.routes.filter((r) => r.validationStatus === 'ready').length;
    expect(checklist.readyRoutes).toBe(count);
  });

  it('partialRoutes count matches routes with validationStatus partial', () => {
    const count = checklist.routes.filter((r) => r.validationStatus === 'partial').length;
    expect(checklist.partialRoutes).toBe(count);
  });

  it('deferredRoutes count matches routes with validationStatus deferred', () => {
    const count = checklist.routes.filter((r) => r.validationStatus === 'deferred').length;
    expect(checklist.deferredRoutes).toBe(count);
  });

  it('blockedRoutes count matches routes with validationStatus blocked', () => {
    const count = checklist.routes.filter((r) => r.validationStatus === 'blocked').length;
    expect(checklist.blockedRoutes).toBe(count);
  });

  it('generatedAt is 2026-04-26', () => {
    expect(checklist.generatedAt).toBe('2026-04-26');
  });
});

describe('DEMO2 founder demo route checklist — determinism', () => {
  it('buildFounderDemoRouteChecklist is byte-equal across calls', () => {
    const first = buildFounderDemoRouteChecklist();
    const second = buildFounderDemoRouteChecklist();
    expect(JSON.stringify(first)).toEqual(JSON.stringify(second));
  });
});

describe('DEMO2 founder demo route checklist — module hygiene', () => {
  it('source has no browser automation imports', () => {
    const source = readFileSync(sourceFilePath, 'utf-8');
    expect(/playwright/i.test(source)).toBe(false);
    expect(/puppeteer/i.test(source)).toBe(false);
    expect(/cypress/i.test(source)).toBe(false);
  });

  it('source has no live HTTP calls', () => {
    const source = readFileSync(sourceFilePath, 'utf-8');
    expect(/(^|[^A-Za-z_])fetch\s*\(/.test(source)).toBe(false);
    expect(/api\.github\.com/.test(source)).toBe(false);
    expect(/api\.vercel\.com/.test(source)).toBe(false);
  });

  it('source has no banned non-deterministic APIs', () => {
    const source = readFileSync(sourceFilePath, 'utf-8');
    expect(source.includes('Date.now')).toBe(false);
    expect(source.includes('Math.random')).toBe(false);
    expect(source.includes('new Date(')).toBe(false);
  });

  it('source has no model-provider imports', () => {
    const source = readFileSync(sourceFilePath, 'utf-8');
    expect(source.includes('anthropic')).toBe(false);
    expect(source.includes('openai')).toBe(false);
  });

  it('source has no React state hooks', () => {
    const source = readFileSync(sourceFilePath, 'utf-8');
    expect(source.includes('useState')).toBe(false);
    expect(source.includes('useEffect')).toBe(false);
    expect(source.includes("'use client'")).toBe(false);
    expect(source.includes('"use client"')).toBe(false);
  });

  it('source has no banned placeholder language', () => {
    const source = readFileSync(sourceFilePath, 'utf-8');
    expect(source.includes('Coming soon')).toBe(false);
    expect(source.includes('TBD')).toBe(false);
    expect(source.includes('Lorem ipsum')).toBe(false);
  });
});
