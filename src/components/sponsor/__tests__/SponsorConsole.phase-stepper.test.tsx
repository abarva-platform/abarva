/** @jest-environment jsdom */

/**
 * The sponsor console's phase stepper names the canonical six phases.
 *
 * The stepper used to carry a local five-entry array,
 * `['Start', 'Diagnose', 'Design', 'Execute', 'Verify']`, laid out in a
 * `repeat(5, 1fr)` grid. Two defects followed from that, and a sponsor is
 * the reader who sees both:
 *
 *   1. every phase from P0 up was named as a different phase — P1 read
 *      'Diagnose' (canonically P2's name), P2 read 'Design' (P3's), P3 read
 *      'Execute' and P4 read 'Verify'; and Execute/Verify are the downstream
 *      Tower vocabulary that `phase-labels.ts` retired for Strategic Moves
 *      outright; and
 *   2. five entries cannot describe six phases, so an engagement sitting at
 *      P5 Mobilize had no cell to mark and the stepper highlighted nothing.
 *
 * A name assertion alone cannot hold the layout: pinning a six-cell grid
 * back to `repeat(5, 1fr)` still renders all six names, the sixth merely
 * wrapping onto a second row. The column count is therefore asserted
 * directly, off `style.gridTemplateColumns`, alongside the labels.
 */

import { render, screen } from '@testing-library/react';
import { SponsorConsole } from '@/components/sponsor/SponsorConsole';
import {
  PHASE_CODES,
  TOTAL_PHASES,
  getPhaseLabelShort,
} from '@/lib/programs/phase-labels';
import type { EngagementRow } from '@/lib/db/engagement';
import type { PersonRow } from '@/lib/db/person';

const NOW = '2026-10-08T00:00:00.000Z';

function person(overrides: Partial<PersonRow> = {}): PersonRow {
  return {
    id: 'per-sponsor',
    graph_node_id: null,
    name: 'Sponsor Name',
    email: null,
    role: 'sponsor',
    organization: null,
    familiarity: 'returning_recent',
    communication_style: {},
    working_rhythm: {},
    personal_threads: [],
    created_at: NOW,
    updated_at: NOW,
    last_seen_at: null,
    ...overrides,
  };
}

function engagement(currentPhase: number): EngagementRow {
  return {
    id: 'eng-1',
    graph_node_id: 'eng-node-1',
    name: 'Engagement Under Test',
    industry_code: 'HC',
    function_code: 'DATA',
    objective_code: 'GROW',
    topic_code: null,
    sponsor_person_id: 'per-sponsor',
    co_sponsor_person_id: null,
    maestro_person_id: null,
    current_phase: currentPhase,
    status: 'active',
    charter: null,
    gates_passed: [],
    decisions: [],
    deliverables: [],
    sponsor_approvals: [],
    baseline_metrics: null,
    actual_metrics: null,
    outcome_fee_status: null,
    outcome_fee_usd: null,
    created_at: NOW,
    updated_at: NOW,
    phase_0_started_at: null,
    phase_4_completed_at: null,
  };
}

function renderConsole(currentPhase: number) {
  return render(
    <SponsorConsole
      engagement={engagement(currentPhase)}
      viewer={person()}
      maestro={null}
      turns={[]}
      deliverables={[]}
    />,
  );
}

/**
 * The stepper cell for a phase, found through its canonical code chip, which
 * is the one element in the cell that is unique to it.
 */
function stepperCell(code: string): HTMLElement {
  const chip = screen.getByText(code);
  const cell = chip.parentElement;
  if (!cell) throw new Error(`no stepper cell for ${code}`);
  return cell;
}

// jsdom serializes the component's `#14B8A6` into rgb() form.
const TEAL = 'rgb(20, 184, 166)';

describe('SponsorConsole phase stepper', () => {
  it('lays out one column per canonical phase', () => {
    const { container } = renderConsole(0);

    const grid = container.querySelector<HTMLElement>(
      'div[style*="grid-template-columns"]',
    );
    expect(grid).not.toBeNull();
    // Six, not five: the retired array laid out `repeat(5, 1fr)`, which
    // wrapped the sixth phase onto its own row instead of dropping it
    // visibly.
    expect(grid!.style.gridTemplateColumns).toBe(`repeat(${TOTAL_PHASES}, 1fr)`);
    expect(TOTAL_PHASES).toBe(6);
  });

  it('names every phase from the canonical phase model', () => {
    renderConsole(0);

    // Asserted per phase against the canonical getter, so a drifted label
    // fails on the phase that drifted rather than on a total.
    PHASE_CODES.forEach((code, phase) => {
      const cell = stepperCell(code);
      expect(cell.textContent).toContain(getPhaseLabelShort(phase));
    });
  });

  it('names P5 Mobilize, which the five-entry array could not reach', () => {
    renderConsole(5);

    expect(stepperCell('P5').textContent).toContain('Mobilize');
  });

  it.each([
    [0, 'Originate'],
    [1, 'Charter'],
    [2, 'Discover'],
    [3, 'Design'],
    [4, 'Roadmap'],
    [5, 'Mobilize'],
  ])('marks the cell at phase %i (%s) as the current one', (phase, label) => {
    renderConsole(phase as number);

    const current = stepperCell(`P${phase}`);
    // The current cell is the only one drawn in teal. A stepper that
    // highlighted nothing — which is what P5 did — fails here.
    expect(current.textContent).toContain(label as string);
    expect(current.style.border).toContain(TEAL);

    const others = PHASE_CODES.filter((_, i) => i !== phase);
    others.forEach((code) => {
      expect(stepperCell(code).style.border).not.toContain(TEAL);
    });
  });

  it('carries none of the retired Tower phase vocabulary', () => {
    const { container } = renderConsole(3);

    // 'Design' is canonical at P3, so it is not in this list. 'Start' and
    // 'Intake' were the two spellings the retired arrays used for P0.
    ['Start', 'Intake', 'Execute', 'Verify', 'Build', 'Deploy'].forEach((retired) => {
      expect(container.textContent).not.toContain(retired);
    });
  });
});
