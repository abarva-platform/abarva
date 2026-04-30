/**
 * @jest-environment jsdom
 */

// J1TopicGrid · component test (INT-2.3)
//
// Per INT-2_DETAILED_DESIGN.md §10.3. Verifies grid renders 10
// topics with stable testids, semantic role landmarks, and links
// to /intelligence/topics/<topicId>.

import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import { J1TopicGrid } from '@/components/intelligence/J1TopicGrid';

describe('J1TopicGrid', () => {
  it('renders all 10 topic cards with stable testids', () => {
    render(<J1TopicGrid />);
    const expectedIds = [
      'ai-use-case-portfolio-management',
      'analytics-modernization',
      'data-foundation-readiness',
      'ai-governance-and-risk',
      'vendor-and-platform-decisions',
      'pilot-to-production-scaling',
      'workflow-and-operating-model-change',
      'outcome-measurement-and-attribution',
      'specialized-industry-applications',
      'talent-and-skills',
    ];
    for (const id of expectedIds) {
      expect(
        screen.getByTestId(`intelligence-j1-topic-card-${id}`),
      ).toBeInTheDocument();
    }
  });

  it('renders the grid container with role="list"', () => {
    render(<J1TopicGrid />);
    const grid = screen.getByTestId('intelligence-j1-topics-grid');
    expect(grid).toBeInTheDocument();
    expect(grid.getAttribute('role')).toBe('list');
  });

  it('every card has role="listitem"', () => {
    render(<J1TopicGrid />);
    const ids = [
      'ai-use-case-portfolio-management',
      'pilot-to-production-scaling',
      'talent-and-skills',
    ];
    for (const id of ids) {
      const card = screen.getByTestId(`intelligence-j1-topic-card-${id}`);
      expect(card.getAttribute('role')).toBe('listitem');
    }
  });

  it('every card is a real anchor with href to /intelligence/topics/<topicId>', () => {
    render(<J1TopicGrid />);
    const card = screen.getByTestId(
      'intelligence-j1-topic-card-pilot-to-production-scaling',
    );
    expect(card.tagName.toLowerCase()).toBe('a');
    expect(card.getAttribute('href')).toBe(
      '/intelligence/topics/pilot-to-production-scaling',
    );
  });

  it('topic card displays title and thesis', () => {
    render(<J1TopicGrid />);
    expect(
      screen.getByText('AI use case portfolio management'),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        /Most enterprises run AI as a collection of disconnected experiments/,
      ),
    ).toBeInTheDocument();
  });

  it('grid has aria-label naming the surface', () => {
    render(<J1TopicGrid />);
    const grid = screen.getByTestId('intelligence-j1-topics-grid');
    expect(grid.getAttribute('aria-label')).toBe('AI transformation topics');
  });

  it('every card has aria-label combining title + thesis', () => {
    render(<J1TopicGrid />);
    const card = screen.getByTestId(
      'intelligence-j1-topic-card-ai-use-case-portfolio-management',
    );
    const ariaLabel = card.getAttribute('aria-label') ?? '';
    expect(ariaLabel).toContain('AI use case portfolio management');
    expect(ariaLabel.length).toBeGreaterThan(
      'AI use case portfolio management'.length,
    );
  });

  // ── INT-2.5 — accessibility shape locks ─────────────────────────────────────

  it('cards are real <a> elements (semantic; works without JS)', () => {
    render(<J1TopicGrid />);
    const ids = [
      'ai-use-case-portfolio-management',
      'pilot-to-production-scaling',
      'workflow-and-operating-model-change',
    ];
    for (const id of ids) {
      const card = screen.getByTestId(`intelligence-j1-topic-card-${id}`);
      expect(card.tagName.toLowerCase()).toBe('a');
      expect(card.getAttribute('href')).toBe(`/intelligence/topics/${id}`);
    }
  });

  it('grid uses CSS Grid that responsively collapses (auto-fit minmax)', () => {
    render(<J1TopicGrid />);
    const grid = screen.getByTestId('intelligence-j1-topics-grid');
    const inlineStyle = grid.getAttribute('style') ?? '';
    expect(inlineStyle).toMatch(/repeat\(auto-fit, minmax\(/);
  });
});
