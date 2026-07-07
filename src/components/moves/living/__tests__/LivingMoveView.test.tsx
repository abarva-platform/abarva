/**
 * @jest-environment jsdom
 */
/**
 * The living Move (experience spec §6) — surface behaviour tests.
 *
 * Covers the thesis, now generalised to all three kernel-anchored cases:
 *   • The surface renders — the answer, the controls, the exhibits, the case
 *     switcher.
 *   • The case switcher moves between the three tenant cases.
 *   • Adjusting a haircut control recomputes the answer.
 *   • Supplying a case's seed-gap input changes payback from "blocked" to a
 *     computed number; clearing it reverts to blocked.
 *
 * The composer-level kernel guarantees are pinned in the kernel test
 * `src/lib/programs/expert-kernel/__tests__/living-move.test.ts`.
 */

import '@testing-library/jest-dom';
import { render, screen, fireEvent, within } from '@testing-library/react';

import { LivingMoveView } from '../LivingMoveView';

describe('LivingMoveView — the living surface', () => {
  it('renders the answer, the controls, the exhibits and the case switcher', () => {
    render(<LivingMoveView />);
    expect(screen.getByTestId('living-move-answer')).toBeInTheDocument();
    expect(screen.getByTestId('living-move-controls')).toBeInTheDocument();
    expect(
      screen.getByTestId('living-move-seed-gap-control'),
    ).toBeInTheDocument();
    expect(
      screen.getByTestId('living-move-case-switcher'),
    ).toBeInTheDocument();
  });

  it('opens with payback blocked — the honest seed-gap default', () => {
    render(<LivingMoveView />);
    const answer = screen.getByTestId('living-move-answer');
    expect(within(answer).getByText('Blocked')).toBeInTheDocument();
  });

  it('the case switcher offers all three kernel-anchored tenants', () => {
    render(<LivingMoveView />);
    const switcher = screen.getByTestId('living-move-case-switcher');
    expect(within(switcher).getByText('Apex Retail')).toBeInTheDocument();
    expect(
      within(switcher).getByText('Meridian Health System'),
    ).toBeInTheDocument();
    expect(
      within(switcher).getByText('First Capital Financial'),
    ).toBeInTheDocument();
  });

  it('can lock the tenant case switcher off for tenant-scoped production sessions', () => {
    render(<LivingMoveView allowCaseSwitching={false} caseId="meridian" />);

    expect(
      screen.queryByTestId('living-move-case-switcher'),
    ).not.toBeInTheDocument();
    expect(screen.getByLabelText('CDI query volume')).toBeInTheDocument();
    expect(screen.queryByText('Apex Retail')).not.toBeInTheDocument();
  });

  it('switching the case re-renders the surface with that tenant case', () => {
    render(<LivingMoveView caseId="apexretail" />);
    // Apex opens on its containment-uplift lever.
    expect(screen.getByLabelText('Containment uplift')).toBeInTheDocument();

    // Switch to Meridian — its CDI-query-volume lever appears, Apex's is gone.
    fireEvent.click(screen.getByText('Meridian Health System'));
    expect(screen.getByLabelText('CDI query volume')).toBeInTheDocument();
    expect(screen.queryByLabelText('Containment uplift')).not.toBeInTheDocument();

    // Switch to First Capital — its loss-takeout lever appears.
    fireEvent.click(screen.getByText('First Capital Financial'));
    expect(
      screen.getByLabelText('Card fraud loss takeout'),
    ).toBeInTheDocument();
  });

  it('adjusting the adoption-confidence control recomputes the answer', () => {
    render(<LivingMoveView />);
    const before =
      screen.getByTestId('living-move-answer').textContent ?? '';

    // Drag adoption confidence down — the kernel recompiles, net value drops.
    const slider = screen.getByLabelText('Adoption confidence');
    fireEvent.change(slider, { target: { value: '0.15' } });

    const after = screen.getByTestId('living-move-answer').textContent ?? '';
    expect(after).not.toBe(before);
  });

  it('filling the Apex seed gap turns payback into a number, and clearing reverts', () => {
    render(<LivingMoveView caseId="apexretail" />);
    expect(
      within(screen.getByTestId('living-move-answer')).getByText('Blocked'),
    ).toBeInTheDocument();

    const input = screen.getByLabelText('Cost per contact (labour) (USD)');
    fireEvent.change(input, { target: { value: '6.5' } });

    const filledAnswer = screen.getByTestId('living-move-answer');
    expect(within(filledAnswer).queryByText('Blocked')).not.toBeInTheDocument();
    expect(within(filledAnswer).getByText(/\d+\s*mo/)).toBeInTheDocument();

    fireEvent.change(input, { target: { value: '' } });
    expect(
      within(screen.getByTestId('living-move-answer')).getByText('Blocked'),
    ).toBeInTheDocument();
  });

  it('the First Capital case can be opened directly via the caseId prop', () => {
    render(<LivingMoveView caseId="arcturus" />);
    // First Capital's seed gap is the fraud-analyst FTE cost.
    const seedGap = screen.getByTestId('living-move-seed-gap-control');
    expect(
      within(seedGap).getByText('Fraud-analyst FTE cost basis'),
    ).toBeInTheDocument();
    // It opens honest — payback blocked on the seed gap.
    expect(
      within(screen.getByTestId('living-move-answer')).getByText('Blocked'),
    ).toBeInTheDocument();
  });
});
