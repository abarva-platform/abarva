/**
 * @jest-environment jsdom
 */

/**
 * Phase0Primer · OV2-3b render tests.
 *
 * Locks the structural contract from docs/build/PROGRAMS_MODULE_FAILURE_MODE_DRIVEN_DESIGN.md
 * Section D.0.6 (next-phase primer rendered at approval): every section
 * the primer carries must surface, in count and content, when the page
 * mounts the component for a real archetype primer.
 *
 * Fixture: CDP_ACTIVATION_PRIMER (the canonical OV2-3a content with
 * referential integrity across templates → DoD ids and workshops →
 * template ids). Using the live fixture rather than a stub keeps the
 * test honest against the contract — if the registry adds a section
 * later, this file is the first thing that fails.
 */

import { render, screen, within } from '@testing-library/react';
import { Phase0Primer } from '../Phase0Primer';
import { CDP_ACTIVATION_PRIMER } from '@/lib/programs/archetype-primers';

const PRIMER = CDP_ACTIVATION_PRIMER;

describe('Phase0Primer', () => {
  it("renders the primer's display name in the header", () => {
    render(<Phase0Primer primer={PRIMER} />);
    // Serif H2: "Welcome to {displayName}".
    expect(
      screen.getByRole('heading', { level: 2, name: /welcome to cdp activation/i }),
    ).toBeTruthy();
    // Mono eyebrow with the patternId.
    expect(screen.getByText(/PHASE 0 PREP · PAT-PRG-CDP-001/i)).toBeTruthy();
  });

  it('renders the P1 outcome statement verbatim', () => {
    const { container } = render(<Phase0Primer primer={PRIMER} />);
    const outcomeSection = container.querySelector('[data-section="p1-outcome"]');
    expect(outcomeSection).not.toBeNull();
    // Assert the full prose is rendered inside the outcome block by
    // checking a sentence unique to the outcome statement.
    expect(
      within(outcomeSection as HTMLElement).getByText(
        /P1 is not a CDP-vendor evaluation/i,
      ),
    ).toBeTruthy();
    // The section eyebrow is present.
    expect(screen.getByText(/Section 1 · Phase 1 outcome/i)).toBeTruthy();
  });

  it('renders the SMEs as N cards where N === primer.smes.length', () => {
    const { container } = render(<Phase0Primer primer={PRIMER} />);
    const smesSection = container.querySelector('[data-section="smes"]');
    expect(smesSection).not.toBeNull();
    const grid = smesSection?.querySelector('[data-sme-count]');
    expect(grid?.getAttribute('data-sme-count')).toBe(
      String(PRIMER.smes.length),
    );
    // Every distinct sme.role surfaces as its own card.
    const cards = smesSection?.querySelectorAll('[data-sme-role]') ?? [];
    expect(cards.length).toBe(PRIMER.smes.length);
    // Spot-check a known role.
    expect(within(smesSection as HTMLElement).getAllByText('Data Engineer').length)
      .toBeGreaterThan(0);
  });

  it('renders the templates as N items', () => {
    const { container } = render(<Phase0Primer primer={PRIMER} />);
    const tplSection = container.querySelector('[data-section="templates"]');
    expect(tplSection).not.toBeNull();
    const wrap = tplSection?.querySelector('[data-template-count]');
    expect(wrap?.getAttribute('data-template-count')).toBe(
      String(PRIMER.templates.length),
    );
    const rows = tplSection?.querySelectorAll('[data-template-id]') ?? [];
    expect(rows.length).toBe(PRIMER.templates.length);
    // Spot-check: every template's title appears.
    for (const tpl of PRIMER.templates) {
      expect(within(tplSection as HTMLElement).getByText(tpl.title)).toBeTruthy();
    }
  });

  it('renders the workshops as N cards with duration chips', () => {
    const { container } = render(<Phase0Primer primer={PRIMER} />);
    const wsSection = container.querySelector('[data-section="workshops"]');
    expect(wsSection).not.toBeNull();
    const grid = wsSection?.querySelector('[data-workshop-count]');
    expect(grid?.getAttribute('data-workshop-count')).toBe(
      String(PRIMER.workshops.length),
    );
    const cards = wsSection?.querySelectorAll('[data-workshop-id]') ?? [];
    expect(cards.length).toBe(PRIMER.workshops.length);
    // Every workshop's duration chip ('${durationHours}h') appears in
    // the workshops section.
    for (const ws of PRIMER.workshops) {
      expect(
        within(wsSection as HTMLElement).getAllByText(`${ws.durationHours}h`)
          .length,
      ).toBeGreaterThan(0);
    }
  });

  it('renders the data assets list with one row per asset', () => {
    const { container } = render(<Phase0Primer primer={PRIMER} />);
    const dsSection = container.querySelector('[data-section="data-assets"]');
    expect(dsSection).not.toBeNull();
    const wrap = dsSection?.querySelector('[data-data-asset-count]');
    expect(wrap?.getAttribute('data-data-asset-count')).toBe(
      String(PRIMER.dataAssets.length),
    );
    const rows = dsSection?.querySelectorAll('[data-data-asset-id]') ?? [];
    expect(rows.length).toBe(PRIMER.dataAssets.length);
  });

  it('renders the prep checklist with N items', () => {
    const { container } = render(<Phase0Primer primer={PRIMER} />);
    const prepSection = container.querySelector('[data-section="prep-checklist"]');
    expect(prepSection).not.toBeNull();
    const list = prepSection?.querySelector('[data-prep-item-count]');
    expect(list?.getAttribute('data-prep-item-count')).toBe(
      String(PRIMER.prepChecklist.length),
    );
    const items = prepSection?.querySelectorAll('[data-prep-id]') ?? [];
    expect(items.length).toBe(PRIMER.prepChecklist.length);
    // Spot-check: each prep item label appears.
    for (const item of PRIMER.prepChecklist) {
      expect(within(prepSection as HTMLElement).getByText(item.label))
        .toBeTruthy();
    }
  });

  it('omits the download chip when downloadHref is undefined', () => {
    render(<Phase0Primer primer={PRIMER} />);
    expect(screen.queryByTestId('phase-0-primer-download')).toBeNull();
    expect(screen.queryByText(/Download as HTML brief/i)).toBeNull();
  });

  it('renders the download chip with the right href when downloadHref is provided', () => {
    const href = '/programs/apx-cdp-2026/primer.html';
    render(<Phase0Primer primer={PRIMER} downloadHref={href} />);
    const link = screen.getByTestId('phase-0-primer-download');
    expect(link).toBeTruthy();
    expect((link as HTMLAnchorElement).getAttribute('href')).toBe(href);
    expect(link.textContent ?? '').toMatch(/Download as HTML brief/i);
  });

  it('exposes the patternId via data-pattern-id on the section root for SSR/QA', () => {
    const { container } = render(<Phase0Primer primer={PRIMER} />);
    const root = container.querySelector('[data-testid="phase-0-primer"]');
    expect(root?.getAttribute('data-pattern-id')).toBe(PRIMER.patternId);
  });
});
