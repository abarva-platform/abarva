/**
 * @jest-environment jsdom
 */

// Meridian case study · chapter render smoke tests.
//
// We don't snapshot full DOM (chapters are 800+ words each). Instead
// we render the entry point + 2 representative chapters and assert
// the case-study spine is intact:
//   - the chapter heading is the expected one,
//   - story-recap band is present,
//   - chapter footer shows the right prev/next neighbors,
//   - each chapter contains story-specific load-bearing facts (vendor
//     names, the 3 P0 traps, the BAFO closures, etc.).
//
// If a chapter heading or its neighbors regress these tests will catch
// the break without locking us into a giant brittle snapshot.

import '@testing-library/jest-dom';
import { render, screen, within } from '@testing-library/react';

import { MeridianCaseStudyIntro } from '../MeridianCaseStudyIntro';
import { Ch06PricingChapter } from '../Ch06PricingChapter';
import { Ch07BafoChapter } from '../Ch07BafoChapter';

// usePathname() is read by the prev/next ChapterShell footer navigator.
// It returns a string in the real app; tests just need a deterministic
// stub.
jest.mock('next/navigation', () => ({
  usePathname: () => '/source/learn/pricing',
}));

describe('MeridianCaseStudyIntro', () => {
  it('renders the case study overview with cast of characters + ToC', () => {
    render(<MeridianCaseStudyIntro />);

    // Hero
    expect(
      screen.getByRole('heading', {
        level: 2,
        name: /Meridian Health · \$8M Cloud & Infrastructure/i,
      }),
    ).toBeInTheDocument();

    // Cast of characters — all 5 named individuals
    expect(screen.getByText('Marcus Webb')).toBeInTheDocument();
    expect(screen.getByText('Sarah Kim')).toBeInTheDocument();
    expect(screen.getByText('Karen Liu')).toBeInTheDocument();
    expect(screen.getByText('Janet Fischer')).toBeInTheDocument();
    expect(screen.getByText('Patricia Singh')).toBeInTheDocument();

    // Trigger detail — the specifics that make the case study legible
    expect(
      screen.getByText(/Newark colocation lease expires Q3 2027/i),
    ).toBeInTheDocument();
    expect(screen.getByText(/18% YoY/i)).toBeInTheDocument();

    // Eleven chapter links in the ToC (one per stage slug)
    const chapterLinks = screen.getAllByRole('link');
    const stageSlugs = [
      'strategy',
      'scope',
      'rfp',
      'responses',
      'evaluation',
      'pricing',
      'bafo',
      'decision',
      'selection',
      'transition',
      'value',
    ];
    for (const slug of stageSlugs) {
      const matching = chapterLinks.filter((l) =>
        l.getAttribute('href') === `/source/learn/${slug}`,
      );
      expect(matching.length).toBeGreaterThanOrEqual(1);
    }
  });
});

describe('Ch06PricingChapter', () => {
  it('renders the pricing chapter with the 3 P0 traps + cell coordinates', () => {
    render(<Ch06PricingChapter />);

    // Chapter heading
    expect(
      screen.getByRole('heading', {
        level: 2,
        name: /Three P0 traps surface/i,
      }),
    ).toBeInTheDocument();

    // Story-recap band
    expect(screen.getByText(/Where we are in the story/i)).toBeInTheDocument();
    expect(
      screen.getByText(/scored 3 finalists on the partial rubric/i),
    ).toBeInTheDocument();

    // Three P0 traps named — each a load-bearing fact for the case study.
    // Some phrases recur (e.g. across the trap-log table + the specimen
    // entry), so we use getAllByText for any text that appears in more
    // than one place in the chapter narrative.
    expect(screen.getAllByText(/Asymmetric egress/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/exit fee 2× run-rate/i).length).toBeGreaterThan(0);
    expect(
      screen.getAllByText(/Escalator 8% vs assumption 4%/i).length,
    ).toBeGreaterThan(0);
    expect(
      screen.getAllByText(/7-year exclusivity clause/i).length,
    ).toBeGreaterThan(0);

    // The Vendor B P1 (workload count) is also surfaced
    expect(
      screen.getAllByText(/Workload count 203 vs scope 280/i).length,
    ).toBeGreaterThan(0);

    // Cell coordinates appear (pedagogical specificity).
    // The cell coordinates may render once or in two specimen entries.
    expect(
      screen.getAllByText(/d19a-egress-tier-3/i).length,
    ).toBeGreaterThan(0);
    expect(
      screen.getAllByText(/d19a-commercial-escalator-yoy/i).length,
    ).toBeGreaterThan(0);

    // Combined post-pricing scoring shows B leads
    expect(screen.getByText(/Combined scoring · Day 50/i)).toBeInTheDocument();

    // Prev/next chapter navigation
    const nav = screen.getByRole('navigation', {
      name: /Case study chapter navigation/i,
    });
    expect(within(nav).getByText(/Previous chapter/i)).toBeInTheDocument();
    expect(within(nav).getByText(/Next chapter/i)).toBeInTheDocument();
    // Pricing's prev = Evaluation, next = BAFO
    expect(within(nav).getByText(/Evaluation/i)).toBeInTheDocument();
    expect(within(nav).getByText(/BAFO/i)).toBeInTheDocument();
  });
});

describe('Ch07BafoChapter', () => {
  it('renders the BAFO chapter with both question patterns + closure summary', () => {
    render(<Ch07BafoChapter />);

    // Chapter heading
    expect(
      screen.getByRole('heading', {
        level: 2,
        name: /Vendor A drops; B wins/i,
      }),
    ).toBeInTheDocument();

    // Both question patterns named (Pattern 1 + Pattern 2)
    expect(
      screen.getByText(/Pattern 1 · Assumption-correction/i),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Pattern 2 · Lock-in-removal/i),
    ).toBeInTheDocument();

    // Specimen verbatim BAFO questions for both patterns
    expect(
      screen.getByText(/Question A.3 · §7.4 exclusivity clause removal/i),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Question B.1 · workload count correction/i),
    ).toBeInTheDocument();

    // Final closure summary numbers — load-bearing case study facts
    expect(screen.getAllByText(/\$9\.4M/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/\$50\.9M/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/\$10\.8M/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/\$52\.4M/i).length).toBeGreaterThan(0);

    // Vendor A withdrawal narrative
    expect(screen.getAllByText(/Withdrawn/i).length).toBeGreaterThan(0);

    // Pitfall callout · don't accept partial closure
    expect(
      screen.getByText(/Don.t accept partial closure on a P0/i),
    ).toBeInTheDocument();

    // Prev/next navigation
    // Note: we mocked usePathname to /source/learn/pricing, so the
    // ChapterShell still computes neighbors from the chapter slug
    // (`bafo`) regardless. Prev = Pricing, Next = Decision.
    const nav = screen.getByRole('navigation', {
      name: /Case study chapter navigation/i,
    });
    expect(within(nav).getByText(/Pricing/i)).toBeInTheDocument();
    expect(within(nav).getByText(/Decision/i)).toBeInTheDocument();
  });
});
