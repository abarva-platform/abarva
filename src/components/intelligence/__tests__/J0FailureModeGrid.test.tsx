/**
 * @jest-environment jsdom
 */

// J0FailureModeGrid · component test
//
// Per INT-1_DETAILED_DESIGN.md §10.4. Verifies grid renders 10 cards
// with correct testid markers and accessibility landmarks. Hover /
// click / keyboard interaction tests live in E2E later (INT-1.6);
// this test locks in render shape only.

import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import { J0FailureModeGrid } from '@/components/intelligence/J0FailureModeGrid';

describe('J0FailureModeGrid', () => {
  it('renders all 10 cards with stable testids', () => {
    render(<J0FailureModeGrid />);
    for (let id = 1; id <= 10; id += 1) {
      expect(
        screen.getByTestId(`intelligence-j0-card-${id}`),
      ).toBeInTheDocument();
    }
  });

  it('renders the grid container with role="list"', () => {
    render(<J0FailureModeGrid />);
    const grid = screen.getByTestId('intelligence-j0-card-grid');
    expect(grid).toBeInTheDocument();
    expect(grid.getAttribute('role')).toBe('list');
  });

  it('every card has role="listitem"', () => {
    render(<J0FailureModeGrid />);
    for (let id = 1; id <= 10; id += 1) {
      const card = screen.getByTestId(`intelligence-j0-card-${id}`);
      expect(card.getAttribute('role')).toBe('listitem');
    }
  });

  it('every card is a real anchor (link) with href to /intelligence/failure-modes/<slug>', () => {
    render(<J0FailureModeGrid />);
    const card1 = screen.getByTestId('intelligence-j0-card-1');
    expect(card1.tagName.toLowerCase()).toBe('a');
    expect(card1.getAttribute('href')).toBe(
      '/intelligence/failure-modes/phantom-sponsor',
    );

    const card8 = screen.getByTestId('intelligence-j0-card-8');
    expect(card8.getAttribute('href')).toBe(
      '/intelligence/failure-modes/pilot-to-production-gap',
    );
  });

  it('card #1 displays editorial name and one-line hook', () => {
    render(<J0FailureModeGrid />);
    expect(screen.getByText('The Phantom Sponsor')).toBeInTheDocument();
    expect(
      screen.getByText(
        /Programs that fail because the sponsor was named on a slide/,
      ),
    ).toBeInTheDocument();
  });

  it('every card displays the canonical name as subtitle', () => {
    render(<J0FailureModeGrid />);
    expect(screen.getByText(/Lack of executive sponsorship/i)).toBeInTheDocument();
    expect(screen.getByText(/Pilot-to-production scaling gap/i)).toBeInTheDocument();
  });
});
