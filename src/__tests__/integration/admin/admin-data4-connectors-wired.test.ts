/**
 * ADMIN-DATA4 — `/admin/connectors` wired to `admin-connectors-adapter`.
 *
 * These tests pin the wiring contract:
 *   - `buildConnectorsPageView` is async + adapter-driven.
 *   - The page-view's `connectors` list mirrors the adapter rows.
 *   - The page-view's `connectorDetailMap` derives vendor + docsHref from
 *     `getAdminConnectorDetail` (adapter), not from inline page-view seeds.
 *   - No `APEX_DETAIL_SEEDS` / `MERIDIAN_DETAIL_SEEDS` constants survive in
 *     the page-view source.
 *   - URL searchParams contract on the route is preserved.
 */

import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import {
  buildConnectorsPageView,
  findConnectorDetail,
} from '@/lib/admin/connectors-page-view';
import {
  getAdminConnectors,
  getAdminConnectorDetail,
} from '@/lib/admin/data/admin-connectors-adapter';

const root = process.cwd();

const PAGE_VIEW_PATH = 'src/lib/admin/connectors-page-view.ts';
const PAGE_ROUTE_PATH = 'src/app/(maestro)/admin/connectors/page.tsx';

const BANNED_HEX = [
  '#14B8A6',
  '#0E9F8C',
  '#0D9488',
  '#06B6D4',
  '#7C3AED',
  '#A855F7',
  '#9333EA',
  '#D946EF',
  '#EC4899',
];

function read(rel: string): string {
  return readFileSync(resolve(root, rel), 'utf8');
}

describe('ADMIN-DATA4 — buildConnectorsPageView is adapter-wired', () => {
  it('returns a Promise (async builder)', () => {
    const result = buildConnectorsPageView();
    expect(typeof (result as Promise<unknown>).then).toBe('function');
  });

  it('resolves with deterministicSeed: true', async () => {
    const view = await buildConnectorsPageView();
    expect(view.deterministicSeed).toBe(true);
  });

  it('connectors list mirrors adapter rows by id', async () => {
    const view = await buildConnectorsPageView('apex-retail');
    const rows = await getAdminConnectors('apex-retail');
    const viewIds = view.connectors.map((c) => c.id).sort();
    const rowIds = rows.map((r) => r.id).sort();
    expect(viewIds).toEqual(rowIds);
  });

  it('connectors length matches adapter row length', async () => {
    const view = await buildConnectorsPageView('apex-retail');
    const rows = await getAdminConnectors('apex-retail');
    expect(view.connectors.length).toBe(rows.length);
  });

  it('connector vendor + docsHref come from the adapter detail', async () => {
    const view = await buildConnectorsPageView('apex-retail');
    for (const conn of view.connectors) {
      const adapterDetail = await getAdminConnectorDetail('apex-retail', conn.id);
      expect(adapterDetail).not.toBeNull();
      const detail = view.connectorDetailMap[conn.id];
      expect(detail.vendor).toBe(adapterDetail!.vendor);
      const expectedDocsHref =
        typeof adapterDetail!.configSchema?.docsHref === 'string'
          ? (adapterDetail!.configSchema!.docsHref as string)
          : '';
      expect(detail.docsHref).toBe(expectedDocsHref);
    }
  });

  it('config field keys come from the adapter configSchema.fields', async () => {
    const view = await buildConnectorsPageView('apex-retail');
    for (const conn of view.connectors) {
      const adapterDetail = await getAdminConnectorDetail('apex-retail', conn.id);
      const schemaFields = (adapterDetail?.configSchema?.fields as
        | string[]
        | undefined) ?? [];
      const viewKeys = view.connectorDetailMap[conn.id].configFields.map((f) => f.key);
      expect(viewKeys).toEqual(schemaFields);
    }
  });

  it('pilotBlockers list filters adapter rows by pilot-required + non-stub', async () => {
    const view = await buildConnectorsPageView('apex-retail');
    const rows = await getAdminConnectors('apex-retail');
    const expected = rows
      .filter((r) => r.requiredForPilot && r.status !== 'configured_stub' && r.status !== 'active')
      .map((r) => r.id)
      .sort();
    const got = view.pilotBlockers.map((c) => c.id).sort();
    expect(got).toEqual(expected);
  });

  it('configuredCount counts configured_stub rows from the adapter', async () => {
    const view = await buildConnectorsPageView('apex-retail');
    const rows = await getAdminConnectors('apex-retail');
    const expected = rows.filter((r) => r.status === 'configured_stub').length;
    expect(view.configuredCount).toBe(expected);
  });

  it('totalCount equals adapter row count', async () => {
    const view = await buildConnectorsPageView('apex-retail');
    const rows = await getAdminConnectors('apex-retail');
    expect(view.totalCount).toBe(rows.length);
  });

  it('Meridian tenant produces a Meridian-only connector list', async () => {
    const view = await buildConnectorsPageView('meridian');
    expect(view.connectors.length).toBeGreaterThan(0);
    for (const conn of view.connectors) {
      expect(conn.id.startsWith('conn-meridian-')).toBe(true);
    }
  });

  it('unknown tenant returns an empty connector list (adapter pass-through)', async () => {
    const view = await buildConnectorsPageView('does-not-exist');
    expect(view.connectors).toEqual([]);
    expect(view.totalCount).toBe(0);
  });

  it('findConnectorDetail returns the same detail keyed by id', async () => {
    const view = await buildConnectorsPageView('apex-retail');
    const first = view.connectors[0];
    const direct = view.connectorDetailMap[first.id];
    const helper = findConnectorDetail(view, first.id);
    expect(helper).toBe(direct);
  });

  it('findConnectorDetail returns null for unknown ids', async () => {
    const view = await buildConnectorsPageView('apex-retail');
    expect(findConnectorDetail(view, 'conn-does-not-exist')).toBeNull();
  });

  it('output shape preserved: required keys still present', async () => {
    const view = await buildConnectorsPageView();
    const required = [
      'eyebrow',
      'title',
      'subtitle',
      'context',
      'editorial',
      'connectors',
      'pilotBlockers',
      'configuredCount',
      'totalCount',
      'caveat',
      'primaryAgentLabel',
      'primaryActionLabel',
      'primaryActionHref',
      'deterministicSeed',
      'agentChoices',
      'agentPostures',
      'categories',
      'connectorDetailMap',
      'actions',
      'defaultTab',
      'tabs',
      'hardGateReason',
    ];
    for (const k of required) {
      expect(view).toHaveProperty(k);
    }
  });

  it('output shape preserved: every connector has a detail entry', async () => {
    const view = await buildConnectorsPageView();
    for (const c of view.connectors) {
      expect(view.connectorDetailMap[c.id]).toBeDefined();
    }
  });

  it('two awaited builds produce identical connector ordering', async () => {
    const a = await buildConnectorsPageView('apex-retail');
    const b = await buildConnectorsPageView('apex-retail');
    expect(b.connectors.map((c) => c.id)).toEqual(a.connectors.map((c) => c.id));
  });
});

describe('ADMIN-DATA4 — page-view source no longer contains inline detail seeds', () => {
  let src: string;
  beforeAll(() => {
    src = read(PAGE_VIEW_PATH);
  });

  it('does not declare APEX_DETAIL_SEEDS', () => {
    expect(src).not.toMatch(/\bAPEX_DETAIL_SEEDS\b/);
  });

  it('does not declare MERIDIAN_DETAIL_SEEDS', () => {
    expect(src).not.toMatch(/\bMERIDIAN_DETAIL_SEEDS\b/);
  });

  it('imports getAdminConnectors from the adapter', () => {
    expect(src).toMatch(/getAdminConnectors\b/);
    expect(src).toMatch(/from '\.\/data\/admin-connectors-adapter'/);
  });

  it('imports getAdminConnectorDetail from the adapter', () => {
    expect(src).toMatch(/getAdminConnectorDetail\b/);
  });

  it('declares buildConnectorsPageView as async', () => {
    expect(src).toMatch(/export async function buildConnectorsPageView/);
  });

  it('contains no banned hex tokens', () => {
    const lower = src.toLowerCase();
    for (const banned of BANNED_HEX) {
      expect(lower).not.toContain(banned.toLowerCase());
    }
  });
});

describe('ADMIN-DATA4 — page route awaits the async builder', () => {
  let src: string;
  beforeAll(() => {
    src = read(PAGE_ROUTE_PATH);
  });

  it('awaits buildConnectorsPageView', () => {
    expect(src).toMatch(/await\s+buildConnectorsPageView\(/);
  });

  it('still parses the connector / tab / blockers / category searchParams', () => {
    expect(src).toMatch(/connector\??:/);
    expect(src).toMatch(/tab\??:/);
    expect(src).toMatch(/blockers\??:/);
    expect(src).toMatch(/category\??:/);
  });

  it('preserves AdminCanonShellV2 + EditorialCanvas + AgentRail imports', () => {
    expect(src).toContain('AdminCanonShellV2');
    expect(src).toContain('EditorialCanvas');
    expect(src).toContain('AgentRail');
  });
});
