/**
 * Focused SSR tests for GateTab — covers the B3 blocker-diagnostics
 * surface that UniversalCanvasShell's default-Document render path
 * doesn't exercise.
 */
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import type { SourceEventGateCriterion } from '@/lib/source/canvas-substrate';
import { GateTab } from '@/components/source/canvas/workspace-tabs/GateTab';

function makeCriterion(
  overrides: Partial<SourceEventGateCriterion> = {},
): SourceEventGateCriterion {
  return {
    id: 'c1',
    sourceEventId: 'evt-canvas-1',
    tenantKey: 'apexretail',
    criterionId: 'GATE-SCOPE-01',
    fromStage: 'scope',
    toStage: 'rfp',
    state: 'pending',
    reviewerUserId: null,
    reviewedAt: null,
    notes: null,
    evidenceArtifactIds: [],
    waiverApprovalId: null,
    createdAt: '2026-05-07T20:00:00Z',
    updatedAt: '2026-05-07T20:00:00Z',
    ...overrides,
  };
}

describe('GateTab · B3 blocker diagnostics', () => {
  it('surfaces explicit blocker rows when criteria are not met', () => {
    const html = renderToStaticMarkup(
      createElement(GateTab, {
        fromStage: 'scope',
        states: [
          makeCriterion({ criterionId: 'GATE-SCOPE-01', state: 'pending' }),
          makeCriterion({ criterionId: 'GATE-SCOPE-02', state: 'not_met' }),
          makeCriterion({ criterionId: 'GATE-SCOPE-03', state: 'met' }),
        ],
      }),
    );
    expect(html).toContain('source-canvas-gate-blockers');
    expect(html).toContain('source-canvas-gate-blocker-GATE-SCOPE-01');
    expect(html).toContain('source-canvas-gate-blocker-GATE-SCOPE-02');
    // Met criterion is excluded from the blocker callout (it still
    // renders in the criteria list below).
    expect(html).not.toContain('source-canvas-gate-blocker-GATE-SCOPE-03');
    // Title reflects the unmet count.
    expect(html).toMatch(/2 (criteria pending|hard blockers).+before you can promote/);
    // Promote button is aria-described by the callout for screen readers.
    expect(html).toMatch(/aria-describedby="source-canvas-gate-promote-help"/);
    // State pills render alongside row titles.
    expect(html).toContain('source-canvas-gate-criterion-state-pending');
    expect(html).toContain('source-canvas-gate-criterion-state-not_met');
    expect(html).toContain('source-canvas-gate-criterion-state-met');
  });

  it('hides the blocker callout and shows "All criteria met" when nothing is blocking', () => {
    const html = renderToStaticMarkup(
      createElement(GateTab, {
        fromStage: 'scope',
        states: [
          makeCriterion({ criterionId: 'GATE-1', state: 'met' }),
          makeCriterion({ criterionId: 'GATE-2', state: 'waived' }),
        ],
      }),
    );
    expect(html).not.toContain('source-canvas-gate-blockers');
    expect(html).toContain('All criteria met');
    // Promote button has no aria-describedby when nothing is blocking.
    expect(html).not.toContain('aria-describedby="source-canvas-gate-promote-help"');
  });

  it('renders Mark met button on pending criteria when onChangeCriterionState is wired', () => {
    const onChange = jest.fn();
    const html = renderToStaticMarkup(
      createElement(GateTab, {
        fromStage: 'scope',
        states: [
          makeCriterion({ criterionId: 'GATE-1', state: 'pending' }),
          makeCriterion({ criterionId: 'GATE-2', state: 'met' }),
          makeCriterion({ criterionId: 'GATE-3', state: 'waived' }),
        ],
        onChangeCriterionState: onChange,
      }),
    );
    expect(html).toContain('source-canvas-gate-criterion-mark-met-GATE-1');
    expect(html).toContain('source-canvas-gate-criterion-reopen-GATE-2');
    // Waived rows hide both buttons (waiver path has its own flow).
    expect(html).not.toContain('source-canvas-gate-criterion-mark-met-GATE-3');
    expect(html).not.toContain('source-canvas-gate-criterion-reopen-GATE-3');
  });

  it('Promote button stays disabled when onPromoteStage is omitted (SSR / no handler)', () => {
    const html = renderToStaticMarkup(
      createElement(GateTab, {
        fromStage: 'scope',
        states: [
          makeCriterion({ criterionId: 'GATE-1', state: 'met' }),
          makeCriterion({ criterionId: 'GATE-2', state: 'met' }),
        ],
      }),
    );
    // Even with all criteria met, the button is disabled when no
    // handler is wired — prevents the prod regression where the
    // visually-enabled button did nothing on click.
    expect(html).toMatch(
      /<button[^>]*disabled[^>]*data-testid="source-canvas-gate-promote"|<button[^>]*data-testid="source-canvas-gate-promote"[^>]*disabled/,
    );
    expect(html).toContain('cursor:not-allowed');
  });

  it('hides Mark met / Reopen entirely when onChangeCriterionState is omitted (SSR)', () => {
    const html = renderToStaticMarkup(
      createElement(GateTab, {
        fromStage: 'scope',
        states: [makeCriterion({ criterionId: 'GATE-1', state: 'pending' })],
      }),
    );
    expect(html).not.toContain('source-canvas-gate-criterion-mark-met-GATE-1');
  });

  it('shows empty body copy when no criteria exist for the transition', () => {
    const html = renderToStaticMarkup(
      createElement(GateTab, { fromStage: 'scope', states: [] }),
    );
    expect(html).toContain('No gate criteria defined');
    expect(html).not.toContain('source-canvas-gate-blockers');
  });
});
