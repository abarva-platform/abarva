/**
 * @jest-environment jsdom
 */
/**
 * Steward setup guidance — does it disclose its assumption? (item C-549,
 * half (2), one row: `generated-ui|Setup|Steward setup guidance|confidence`)
 *
 * `docs/legal/AI_GENERATED_UI_CATALOG.md` answered "Confidence / assumption
 * disclosure present?" for Steward setup guidance with "Yes: seeded-only/live
 * verification separation", and named only the fixture
 * `src/lib/setup/shell-setup-fixture.ts` as the code path. The control
 * catalog could not join that claim to any surface (`uncatalogued`), so the
 * two documents disagreed and nothing measured which was right.
 *
 * Measured, the claim splits in two:
 *
 * - The guidance a reader actually sees from that fixture is the reconnect
 *   flow at `/admin/connectors/[connectorId]/reconnect`: the profile's
 *   summary, its numbered steps (the last of which is Steward's), and, once
 *   the reader authorizes, Steward's success message. Beside it the page
 *   states the assumption under which all of it holds — "Mode: Seeded fixture
 *   · no live API call is made from this setup surface". That is a real
 *   disclosure, derived from the connector's `dataMode`, on a mounted route.
 * - The fixture's other Steward prose reaches no reader: no component reads
 *   a connector's `agentQuote` or `actions`, and nothing imports the index,
 *   users, audit or policies agent voices. It cannot lack a disclosure
 *   anyone reads.
 *
 * Treating a seeded/live limitation as a `confidence` control is not a new
 * taxonomy: `moves-deliverable-canvas-view` already carries its readiness and
 * missing-evidence text under that kind.
 *
 * WHY THE POSITIVE CONTROL COMES FIRST
 *
 * "The disclosure renders beside the guidance" is vacuous if the guidance
 * does not render. The first case proves every step and summary of every
 * reconnectable fixture connector is on the page, so the disclosure has
 * something to sit beside.
 *
 * Nothing is stubbed: the real component renders the real fixture.
 */

import { readdirSync, readFileSync } from 'node:fs';
import { join, relative } from 'node:path';

import '@testing-library/jest-dom';
import { fireEvent, render, screen } from '@testing-library/react';
import { renderToStaticMarkup } from 'react-dom/server';

import { ConnectorReconnectPage } from '../ConnectorReconnectPage';
import {
  SETUP_CONNECTOR_DETAIL_MAP,
  getReconnectableSetupConnectorDetail,
  type ConnectorDetail,
} from '@/lib/setup/shell-setup-fixture';

const COMPONENT_PATH = 'src/components/setup/ConnectorReconnectPage.tsx';
const LEGAL_CATALOG = 'docs/legal/AI_GENERATED_UI_CATALOG.md';
const UNREACHABLE_BASELINE = 'docs/architecture/unreachable-components.json';

const SEEDED_DISCLOSURE = 'Mode: Seeded fixture · no live API call is made from this setup surface';
const LIVE_DISCLOSURE = 'Mode: Live signal · no live API call is made from this setup surface';

/** Every fixture connector the reconnect route will render, found through the route's own accessor. */
const RECONNECTABLE: ConnectorDetail[] = Object.keys(SETUP_CONNECTOR_DETAIL_MAP)
  .map((id) => getReconnectableSetupConnectorDetail(id))
  .filter((detail): detail is ConnectorDetail => detail !== null);

/** Every text node of the rendered page, trimmed, in document order. */
function renderedText(detail: ConnectorDetail): string[] {
  return renderToStaticMarkup(<ConnectorReconnectPage detail={detail} tenantName="Tenant" />)
    .replace(/<[^>]+>/g, '\n')
    .split('\n')
    .map((node) => node.replace(/&#x27;/g, "'").replace(/&amp;/g, '&').trim())
    .filter(Boolean);
}

/** Non-test source files under `src/` that import the component's module. */
function mountingFiles(): string[] {
  const root = join(process.cwd(), 'src');
  const specifier = /['"][^'"]*components\/setup\/ConnectorReconnectPage['"]/;
  const found: string[] = [];
  const walk = (dir: string) => {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const full = join(dir, entry.name);
      if (entry.isDirectory()) {
        if (entry.name === '__tests__' || entry.name === 'node_modules') continue;
        walk(full);
      } else if (/\.(tsx?|jsx?|mjs)$/.test(entry.name) && !/\.(test|spec)\./.test(entry.name)) {
        const path = relative(process.cwd(), full);
        if (path === COMPONENT_PATH) continue;
        if (specifier.test(readFileSync(full, 'utf8'))) found.push(path);
      }
    }
  };
  walk(root);
  return found.sort();
}

/**
 * The legal catalog's Steward setup guidance row, split the way the control
 * catalog gate splits it: pipe-separated cells.
 */
function stewardGuidanceRow(): string[] {
  const rows = readFileSync(join(process.cwd(), LEGAL_CATALOG), 'utf8')
    .split(/\r?\n/)
    .filter((line) => line.trim().startsWith('|'))
    .map((line) =>
      line
        .trim()
        .replace(/^\|/, '')
        .replace(/\|$/, '')
        .split('|')
        .map((cell) => cell.trim()),
    )
    .filter(([module, surface]) => module === 'Setup' && surface === 'Steward setup guidance');
  expect(rows).toHaveLength(1);
  return rows[0];
}

describe('Steward setup guidance — the assumption disclosure, measured', () => {
  it('renders the Steward reconnect guidance for every reconnectable fixture connector', () => {
    expect(RECONNECTABLE.map((detail) => detail.id).sort()).toEqual(['anthropic', 'github', 'msgraph', 'sn']);
    for (const detail of RECONNECTABLE) {
      const profile = detail.reconnectProfile!;
      const text = renderedText(detail);
      expect(text).toContain(`${profile.summary} · ${profile.estimate.toLowerCase()}`);
      for (const step of profile.steps) expect(text).toContain(step);
    }
  });

  it('states beside that guidance that the profile is seeded and no live call is made', () => {
    for (const detail of RECONNECTABLE) {
      expect(detail.dataMode).toBe('seeded');
      const text = renderedText(detail);
      expect(text.filter((node) => node === SEEDED_DISCLOSURE)).toHaveLength(1);
      expect(text).not.toContain(LIVE_DISCLOSURE);
    }
  });

  it('derives the disclosure from the connector data mode rather than printing a constant', () => {
    const live: ConnectorDetail = { ...RECONNECTABLE[0], dataMode: 'live' };
    const text = renderedText(live);
    expect(text.filter((node) => node === LIVE_DISCLOSURE)).toHaveLength(1);
    expect(text).not.toContain(SEEDED_DISCLOSURE);
  });

  it("keeps the disclosure on the page once the reader authorizes and Steward's success message appears", () => {
    for (const detail of RECONNECTABLE) {
      const profile = detail.reconnectProfile!;
      const { unmount } = render(<ConnectorReconnectPage detail={detail} tenantName="Tenant" />);
      expect(screen.queryByText(profile.successMessage)).not.toBeInTheDocument();
      fireEvent.click(screen.getByRole('button', { name: `${profile.callToAction} ->` }));
      expect(screen.getByText(profile.successMessage)).toBeInTheDocument();
      expect(screen.getByText(SEEDED_DISCLOSURE)).toBeInTheDocument();
      unmount();
    }
  });

  it('is mounted by the reconnect route and absent from the unreachable baseline', () => {
    expect(mountingFiles()).toEqual(['src/app/(maestro)/admin/connectors/[connectorId]/reconnect/page.tsx']);
    const baseline = readFileSync(join(process.cwd(), UNREACHABLE_BASELINE), 'utf8');
    expect(baseline).not.toContain(`"${COMPONENT_PATH}"`);
  });

  it('the legal row names the file where the disclosure renders, and claims it', () => {
    const [, , codePathCell, , , confidenceCell] = stewardGuidanceRow();
    const codePaths = [...codePathCell.matchAll(/`([^`]+)`/g)].map((match) => match[1]);
    expect(codePaths).toContain(COMPONENT_PATH);
    // `startsWith('Yes')` is the predicate the control catalog gate uses to
    // decide that a legal row makes a claim it must account for.
    expect(confidenceCell.startsWith('Yes')).toBe(true);
  });
});
