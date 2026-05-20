/**
 * @jest-environment jsdom
 */

// BoardArtifactsPanel · component tests
//
// Covers:
//   - Renders the "Board artifacts" panel listing each deck when the Move has
//     anchored board-grade artifacts.
//   - The Costed pack shows both a View link and a Download PowerPoint link;
//     decks without a pptxHref show only View.
//   - Renders nothing for a Move with no anchored decks.

import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';

import { BoardArtifactsPanel } from '../BoardArtifactsPanel';
import type { StrategicMove } from '@/lib/programs/types.ui';

function makeMove(overrides: Partial<StrategicMove> = {}): StrategicMove {
  const base: StrategicMove = {
    id: 'move-uuid',
    displayCode: 'APX-CC-2026',
    name: 'Contact Center AI Routing',
    tenant: { id: 'tenant-apex', name: 'Apex Retail Group', industryCode: 'retail' },
    archetype: 'AI Product Enablement',
    currentPhase: 3,
    phaseLabel: 'Design & Plan',
    status: { key: 'active', text: 'On track', description: '' },
    statusColor: 'green',
    sponsor: null,
    participants: [],
    valueAtStake: { projected: null, verified: null, assumptions: null },
    deliverables: [],
    gateCriteria: [],
    recentActivity: [],
    linkedEvidence: [],
    mapLabel: '',
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
  };
  return { ...base, ...overrides };
}

describe('BoardArtifactsPanel — Move with anchored decks', () => {
  it('renders the "Board artifacts" panel listing each deck', () => {
    render(<BoardArtifactsPanel move={makeMove()} />);

    expect(screen.getByTestId('board-artifacts-panel')).toBeInTheDocument();
    expect(screen.getByText('Board artifacts')).toBeInTheDocument();
    expect(screen.getAllByTestId('board-artifact-row')).toHaveLength(3);

    expect(screen.getByText('Costed Business-Case Pack')).toBeInTheDocument();
    expect(screen.getByText('Discover Brief')).toBeInTheDocument();
    expect(screen.getByText('Solution Architecture Pack')).toBeInTheDocument();
  });

  it('every deck exposes a View link to the HTML deck', () => {
    render(<BoardArtifactsPanel move={makeMove()} />);
    const viewLinks = screen.getAllByRole('link', { name: /View/ });
    expect(viewLinks).toHaveLength(3);
    expect(viewLinks.map((a) => a.getAttribute('href'))).toEqual(
      expect.arrayContaining([
        '/api/v1/moves/board-grade-business-case',
        '/api/v1/moves/board-grade-discover-brief',
        '/api/v1/moves/board-grade-solution-architecture',
      ]),
    );
  });

  it('shows a Download PowerPoint link only for the Costed pack', () => {
    render(<BoardArtifactsPanel move={makeMove()} />);
    const pptxLinks = screen.getAllByRole('link', { name: /PowerPoint/ });
    expect(pptxLinks).toHaveLength(1);
    expect(pptxLinks[0]).toHaveAttribute(
      'href',
      '/api/v1/moves/board-grade-business-case?format=pptx',
    );
  });
});

describe('BoardArtifactsPanel — Move with no anchored decks', () => {
  it('renders nothing for an unrelated Move', () => {
    const { container } = render(
      <BoardArtifactsPanel move={makeMove({ name: 'Customer Data Platform' })} />,
    );
    expect(container).toBeEmptyDOMElement();
    expect(screen.queryByTestId('board-artifacts-panel')).not.toBeInTheDocument();
  });

  it('renders nothing for a same-named Move on a different tenant', () => {
    const { container } = render(
      <BoardArtifactsPanel
        move={makeMove({
          tenant: { id: 't-mer', name: 'Meridian Health System', industryCode: 'healthcare' },
        })}
      />,
    );
    expect(container).toBeEmptyDOMElement();
  });
});
