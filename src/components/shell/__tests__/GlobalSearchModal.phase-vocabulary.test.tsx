/** @jest-environment jsdom */

/**
 * Global search names a program's stage from the canonical phase model.
 *
 * The modal is mounted by `src/app/(maestro)/layout.tsx`, so this read is on
 * screen for every signed-in page in the maestro chrome, Moves included.
 *
 * It used to derive the stage name from a local seven-entry array,
 * `['Originate', 'Discovery', 'Assess', 'Build', 'Deploy', 'Validate',
 * 'Operate']`, indexed by the instance's integer phase. Only P0 happened to
 * land on its canonical name. Every phase from P1 up was named as something
 * else entirely — P1 read 'Discovery', P2 'Assess', P3 'Build', P4 'Deploy',
 * P5 'Validate' — and Build/Deploy are precisely the downstream Tower
 * vocabulary that `phase-labels.ts` retired for Strategic Moves. Because the
 * array had seven entries the `?? \`Phase ${n}\`` fallback behind it could
 * never fire for any real stage, so nothing ever surfaced the drift.
 *
 * The seeded program instances span stages 1, 2, 3, 4 and 6, which is what
 * makes this testable through the real modal rather than through a stub: each
 * row below is a fixture the product actually serves. Stage 6 is the case the
 * short-label getter alone would have got wrong — the instance has been handed
 * to Tower and is in no Move phase, which is why the canonical
 * `getMovesStageName` is the right source here.
 */

import { render, screen, act } from '@testing-library/react';
import { GlobalSearchModal } from '@/components/shell/GlobalSearchModal';
import { getMovesStageName } from '@/lib/programs/phase-labels';
import { APEX_RETAIL_PROGRAM_INSTANCES } from '@/lib/programs/program-instances';

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: jest.fn(), prefetch: jest.fn() }),
}));

/** Opens the modal the way the product does — Cmd+K on the document. */
function openModal() {
  act(() => {
    document.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'k', metaKey: true, bubbles: true }),
    );
  });
}

/**
 * Types into the real search input and lets the component's debounce settle.
 * The modal filters on a debounced query, so a synchronous change alone
 * renders no rows.
 */
function search(term: string) {
  const input = screen.getByRole('textbox');
  act(() => {
    input.setAttribute('value', term);
    input.dispatchEvent(new Event('input', { bubbles: true }));
  });
}

describe('GlobalSearchModal program stage vocabulary', () => {
  afterEach(() => {
    jest.useRealTimers();
  });

  it('exposes seeded instances across more than one stage', () => {
    // Guards the fixtures this suite reasons over: if the seed collapsed to a
    // single stage the per-stage cases below would pass vacuously.
    const stages = new Set(
      APEX_RETAIL_PROGRAM_INSTANCES.map((inst) => inst.currentPhase),
    );
    expect(stages.size).toBeGreaterThan(2);
    // The handed-to-Tower stage is present, and is the one a phase-only
    // getter names wrongly.
    expect(stages.has(6)).toBe(true);
  });

  it.each([
    ['APX-SAP-2026', 1, 'Charter', 'Discovery'],
    ['APX-LPM-2026', 2, 'Discover & Diagnose', 'Assess'],
    ['APX-CDP-2026', 3, 'Design Future State', 'Build'],
    ['APX-COPILOT-2026', 4, 'Roadmap & Business Case', 'Deploy'],
    ['APX-DFV2-2025', 6, 'Tower Track Outcomes', 'Operate'],
  ])(
    'names %s (stage %i) %s, not the retired %s',
    (id, stage, canonical, retired) => {
      const inst = APEX_RETAIL_PROGRAM_INSTANCES.find((i) => i.id === id);
      // Pins the fixture's stage: the expectation is only meaningful if the
      // seeded instance really sits where the case says it does.
      expect(inst?.currentPhase).toBe(stage);
      expect(getMovesStageName(stage as number)).toBe(canonical);

      jest.useFakeTimers();
      render(<GlobalSearchModal />);
      openModal();
      search(id as string);
      act(() => {
        jest.advanceTimersByTime(500);
      });

      const row = screen.getByText(
        (_content, element) =>
          element?.textContent?.includes(inst!.patternId) === true &&
          element.children.length === 0,
      );
      expect(row.textContent).toContain(canonical as string);
      expect(row.textContent).not.toContain(retired as string);
    },
  );
});
