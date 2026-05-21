/**
 * @jest-environment jsdom
 */
/**
 * The living Move (experience spec §6) — behaviour tests.
 *
 * Covers the thesis:
 *   • The surface renders — the answer, the controls, the exhibits.
 *   • The kernel recompute is wired to the controls — it is the REAL kernel,
 *     not a reimplementation (asserted at the composer level).
 *   • Adjusting a haircut control changes the computed net value.
 *   • Supplying the cost-per-contact seed-gap input changes payback from
 *     "blocked" to a computed number; clearing it reverts to blocked.
 */

import '@testing-library/jest-dom';
import { render, screen, fireEvent, within } from '@testing-library/react';

import { LivingMoveView } from '../LivingMoveView';
import {
  buildLivingMoveCase,
  LIVING_MOVE_DEFAULTS,
} from '@/lib/programs/expert-kernel/apex-living-move';

// ---------------------------------------------------------------------------
// The kernel composer — the recompute is the real kernel.
// ---------------------------------------------------------------------------

describe('buildLivingMoveCase — the kernel recompute', () => {
  it('runs the real kernel: defaults leave payback blocked (seed gap)', () => {
    const live = buildLivingMoveCase(LIVING_MOVE_DEFAULTS);
    // Apex's cost-per-contact is a declared seed gap → monetisation blocked.
    expect(live.skeleton.economics.monetisable).toBe(false);
    expect(live.skeleton.economics.paybackMonths).toBeNull();
    expect(live.seedGapFilled).toBe(false);
    // The critic still runs — its monetisation blocker is present.
    expect(
      live.skeleton.critic.blockers.some(
        (b) => b.code === 'cfo_monetisation_blocked',
      ),
    ).toBe(true);
  });

  it('a worse adoption haircut lowers the computed net value', () => {
    const base = buildLivingMoveCase(LIVING_MOVE_DEFAULTS);
    const worse = buildLivingMoveCase({
      ...LIVING_MOVE_DEFAULTS,
      adoptionRisk: 0.2,
    });
    expect(worse.netValue).toBeLessThan(base.netValue);
    expect(worse.haircut).toBeGreaterThan(base.haircut);
  });

  it('supplying the cost-per-contact seed gap un-blocks payback', () => {
    const blocked = buildLivingMoveCase(LIVING_MOVE_DEFAULTS);
    expect(blocked.skeleton.economics.paybackMonths).toBeNull();

    const filled = buildLivingMoveCase({
      ...LIVING_MOVE_DEFAULTS,
      costPerContactUsd: 6.5,
    });
    expect(filled.seedGapFilled).toBe(true);
    expect(filled.skeleton.economics.monetisable).toBe(true);
    expect(filled.skeleton.economics.paybackMonths).not.toBeNull();
    expect(filled.skeleton.economics.paybackMonths).toBeGreaterThan(0);

    // Clearing it reverts to the honest blocked state.
    const cleared = buildLivingMoveCase({
      ...LIVING_MOVE_DEFAULTS,
      costPerContactUsd: null,
    });
    expect(cleared.skeleton.economics.paybackMonths).toBeNull();
  });

  it('exposes the three board-grade exhibit datasets', () => {
    const live = buildLivingMoveCase(LIVING_MOVE_DEFAULTS);
    expect(live.waterfall.length).toBeGreaterThan(0);
    expect(live.bridgeSteps.length).toBe(6); // six haircut factors
    expect(live.tornado.length).toBeGreaterThan(0);
    // The tornado carries a seed-gap proxy bar (hatched in the SVG).
    expect(live.tornado.some((b) => b.isProxy)).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// The surface — the interactive view.
// ---------------------------------------------------------------------------

describe('LivingMoveView — the living surface', () => {
  it('renders the answer, the controls, and the exhibits', () => {
    render(<LivingMoveView />);
    expect(screen.getByTestId('living-move-answer')).toBeInTheDocument();
    expect(screen.getByTestId('living-move-controls')).toBeInTheDocument();
    expect(
      screen.getByTestId('living-move-seed-gap-control'),
    ).toBeInTheDocument();
  });

  it('opens with payback blocked — the honest seed-gap default', () => {
    render(<LivingMoveView />);
    const answer = screen.getByTestId('living-move-answer');
    expect(within(answer).getByText('Blocked')).toBeInTheDocument();
  });

  it('adjusting the adoption-confidence control recomputes the net value', () => {
    render(<LivingMoveView />);
    const answer = screen.getByTestId('living-move-answer');
    const before = answer.textContent ?? '';

    // Drag adoption confidence down — the kernel recompiles, net value drops.
    const slider = screen.getByLabelText('Adoption confidence');
    fireEvent.change(slider, { target: { value: '0.15' } });

    const after =
      screen.getByTestId('living-move-answer').textContent ?? '';
    expect(after).not.toBe(before);
  });

  it('filling the seed gap turns payback from blocked into a number, and clearing reverts', () => {
    render(<LivingMoveView />);
    // Blocked at the start.
    expect(
      within(screen.getByTestId('living-move-answer')).getByText('Blocked'),
    ).toBeInTheDocument();

    // Supply the cost-per-contact baseline.
    const input = screen.getByLabelText('Cost per contact (USD)');
    fireEvent.change(input, { target: { value: '6.5' } });

    const filledAnswer = screen.getByTestId('living-move-answer');
    expect(within(filledAnswer).queryByText('Blocked')).not.toBeInTheDocument();
    // Payback now renders as a month figure.
    expect(within(filledAnswer).getByText(/\d+\s*mo/)).toBeInTheDocument();

    // Clear it — payback reverts to blocked.
    fireEvent.change(input, { target: { value: '' } });
    expect(
      within(screen.getByTestId('living-move-answer')).getByText('Blocked'),
    ).toBeInTheDocument();
  });
});
