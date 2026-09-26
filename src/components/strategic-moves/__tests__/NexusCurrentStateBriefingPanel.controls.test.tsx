/**
 * @jest-environment jsdom
 */

/**
 * Declared AI-surface controls on the Moves Nexus current-state briefing panel
 * (`moves-nexus-current-state-briefing-panel` in
 * `docs/security/ai-surface-control-catalog.json`).
 *
 * The legal catalog row `generated-ui|Moves|Nexus current-state briefing panel`
 * claims this surface renders citation ids with their cited labels, and a
 * confidence disclosure on every answer. Both claims were true of the code and
 * held to nothing: no `controls[]` entry named this file, so the two rows sat
 * `uncatalogued` and the sentences in the legal document had no executable
 * check under them.
 *
 * **What this suite proves, and what it cannot.** It mounts the component and
 * asserts the two controls render. It does not prove a user can see them:
 * nothing in the product imports this panel, so the catalog entry carries
 * `routeReachable: false` and the audit counts both controls in its
 * not-on-any-screen bucket rather than as covered. That distinction is the
 * whole reason the entry is honest — a suite green over an unmounted component
 * reads exactly like a suite green over a live one, and only the reachability
 * field tells them apart.
 *
 * Two controls, asserted separately because they fail separately:
 *
 *   - `citation`: each section renders the labels of the citations it cites,
 *     resolved through the briefing's own citation list rather than echoing the
 *     raw id, and an answer renders the labels it cites.
 *   - `confidence`: an answer states its confidence next to the answer text, in
 *     the words the catalog pins.
 *
 * Each assertion names the one string it is about rather than matching the
 * panel as a whole, so a control that stops rendering fails as itself.
 */

import '@testing-library/jest-dom';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { NexusCurrentStateBriefingPanel } from '../NexusCurrentStateBriefingPanel';

const BRIEFING = {
  generatedAt: '2026-09-26T00:00:00.000Z',
  executiveRead: 'Finance close is the binding constraint on the next two quarters.',
  sections: [
    {
      id: 'financials',
      title: 'Financials',
      summary: 'Run-rate concentrated in three vendors.',
      facts: ['Top three vendors are 62% of run-rate.'],
      citationIds: ['cite-spend', 'cite-contract'],
    },
  ],
  recommendedQuestions: ['Which vendor renewal lands first?'],
  citations: [
    {
      id: 'cite-spend',
      label: 'Spend & value register',
      sourceBasis: 'tenant-inputs 08_spend_value.csv',
      confidence: 'high',
    },
    {
      id: 'cite-contract',
      label: 'Vendor contract register',
      sourceBasis: 'tenant-inputs 07_vendors_contracts.csv',
    },
  ],
  brokerWarnings: [],
};

const ANSWER = {
  question: 'What should the CXO decide next?',
  answer: 'Sequence the vendor renewal that lands first.',
  facts: ['Renewal window opens in 45 days.'],
  citationIds: ['cite-contract'],
  confidence: 'medium' as const,
  missingContext: [],
};

function mockBriefEndpoint() {
  const fetchMock = jest.fn(async (_url: string, init?: RequestInit) => {
    const method = init?.method ?? 'GET';
    const body = method === 'POST' ? { answer: ANSWER } : { briefing: BRIEFING };
    return { ok: true, status: 200, json: async () => body } as unknown as Response;
  });
  global.fetch = fetchMock as unknown as typeof fetch;
  return fetchMock;
}

async function renderBrief() {
  render(<NexusCurrentStateBriefingPanel moveId="move-1" />);
  fireEvent.click(screen.getByRole('button', { name: 'Generate brief' }));
  await waitFor(() => {
    expect(screen.getByText(BRIEFING.executiveRead)).toBeInTheDocument();
  });
}

async function askQuestion() {
  fireEvent.click(screen.getByRole('button', { name: 'Ask' }));
  await waitFor(() => {
    expect(screen.getByText(ANSWER.answer)).toBeInTheDocument();
  });
}

describe('Nexus current-state briefing panel — declared AI surface controls', () => {
  beforeEach(() => {
    mockBriefEndpoint();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('citation', () => {
    it('renders the cited label for every citation a section cites, not the raw id', async () => {
      await renderBrief();

      const section = screen.getByRole('article');
      expect(within(section).getByText('Spend & value register')).toBeInTheDocument();
      expect(within(section).getByText('Vendor contract register')).toBeInTheDocument();
      expect(within(section).queryByText('cite-spend')).not.toBeInTheDocument();
      expect(within(section).queryByText('cite-contract')).not.toBeInTheDocument();
    });

    it('carries each citation source basis on the rendered chip', async () => {
      await renderBrief();

      expect(screen.getByText('Spend & value register')).toHaveAttribute(
        'title',
        'tenant-inputs 08_spend_value.csv',
      );
    });

    it('renders the labels an answer cites alongside the answer', async () => {
      await renderBrief();
      await askQuestion();

      expect(screen.getByText('Cites: Vendor contract register')).toBeInTheDocument();
    });
  });

  describe('confidence', () => {
    it('states the answer confidence in the words the catalog pins', async () => {
      await renderBrief();
      await askQuestion();

      expect(screen.getByText('Answer · confidence medium')).toBeInTheDocument();
    });

    it('discloses the confidence the answer actually carries, not a fixed word', async () => {
      await renderBrief();
      await askQuestion();

      expect(screen.getByText(/Answer · confidence/)).toBeInTheDocument();
      expect(screen.queryByText('Answer · confidence high')).not.toBeInTheDocument();
      expect(screen.queryByText('Answer · confidence low')).not.toBeInTheDocument();
    });

    it('shows no confidence disclosure before an answer exists, so the label cannot be a constant', async () => {
      await renderBrief();

      expect(screen.queryByText(/Answer · confidence/)).not.toBeInTheDocument();
    });
  });
});
