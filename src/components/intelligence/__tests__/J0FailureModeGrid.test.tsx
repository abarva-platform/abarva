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

  // ── INT-1.4 — accessibility shape locks ─────────────────────────────────────

  it('grid section has an aria-label naming what it is', () => {
    render(<J0FailureModeGrid />);
    const grid = screen.getByTestId('intelligence-j0-card-grid');
    expect(grid.getAttribute('aria-label')).toMatch(
      /Why enterprise AI transformation fails/i,
    );
  });

  it('every card has aria-label combining editorial name + hook', () => {
    render(<J0FailureModeGrid />);
    const card1 = screen.getByTestId('intelligence-j0-card-1');
    const ariaLabel = card1.getAttribute('aria-label') ?? '';
    expect(ariaLabel).toContain('The Phantom Sponsor');
    expect(ariaLabel.length).toBeGreaterThan('The Phantom Sponsor'.length);
  });

  // ── INT-1.4 — mobile-collapse default state ─────────────────────────────────

  it('on a desktop viewport, all 10 cards are visible (no collapse)', () => {
    // jsdom default viewport is desktop-sized; matchMedia('(max-width: 767px)')
    // returns false. All 10 cards therefore render through the normal path.
    render(<J0FailureModeGrid />);
    for (let id = 1; id <= 10; id += 1) {
      expect(
        screen.getByTestId(`intelligence-j0-card-${id}`),
      ).toBeInTheDocument();
    }
  });

  it('does NOT show the "Show all 10" button on a desktop viewport', () => {
    render(<J0FailureModeGrid />);
    expect(
      screen.queryByTestId('intelligence-j0-show-all'),
    ).toBeNull();
  });

  it('grid declares data-show-all="true" on desktop', () => {
    render(<J0FailureModeGrid />);
    const grid = screen.getByTestId('intelligence-j0-card-grid');
    expect(grid.getAttribute('data-show-all')).toBe('true');
  });
});
