/**
 * @jest-environment jsdom
 */

/**
 * Declared AI-surface controls on the Intelligence pattern promotion brief
 * panel (`intelligence-pattern-promotion-brief-panel` in
 * `docs/security/ai-surface-control-catalog.json`).
 *
 * The legal catalog row `generated-ui|Intelligence|Sentinel active pattern
 * recommendations` claims this surface renders an AI label and the evidence
 * refs behind an AI-shaped Move brief. Until this suite existed the claim named
 * two code paths, one of them deleted, and no catalog entry held the surviving
 * one to anything — so the claim was a sentence in a legal document with no
 * executable check under it.
 *
 * Two controls, asserted separately because they fail separately:
 *
 *   - `ai-label`: the panel says, in machine-pinned words, that this brief came
 *     from an AI pattern recommendation and that a human must accept it.
 *   - `citation`: every evidence ref the promotion carries is rendered
 *     individually, and the submit path is withheld when there are none — a
 *     citation control that the surface can submit without is decoration.
 *
 * Each assertion names the one string or ref it is about rather than matching
 * the card as a whole, so a control that stops rendering fails as itself.
 */

import { render, screen, within } from '@testing-library/react';
import {
  ProgramBriefPanel,
  type ProgramBriefDraft,
} from '../ProgramBriefPanel';
import type { IntelligencePromotionApprovalView } from '../ProgramBriefPanel';

const PATTERN_BRIEF: ProgramBriefDraft = {
  programName: 'Apex Retail SAP Finance Modernization',
  problemStatement: 'Finance close is slowed by fragmented SAP and Workday handoffs.',
  targetOutcome: 'Reduce close cycle time and improve operating visibility.',
  timeline: 'P0 in May, P1 by June',
  classification: 'ERP Modernization',
  matchedPatternId: 'PAT-CLOSE-CYCLE',
  sponsor: 'Sarah Chen',
  lead: 'Mei Tanaka',
  crossProgramDependencies: [],
};

const EVIDENCE_REFS = [
  'sourceThreadId:thread-88',
  'selectedPatternKey:PAT-CLOSE-CYCLE',
  'detectionSignalId:SIG-4021',
];

function promotion(
  overrides: Partial<IntelligencePromotionApprovalView> = {},
): IntelligencePromotionApprovalView {
  return {
    required: true,
    sourceThreadId: 'thread-88',
    selectedPatternKey: 'PAT-CLOSE-CYCLE',
    evidenceRefs: EVIDENCE_REFS,
    rationale: 'I reviewed the pattern evidence and accept this promotion.',
    minimumRationaleChars: 24,
    approved: true,
    onRationaleChange: jest.fn(),
    onApprovedChange: jest.fn(),
    ...overrides,
  };
}

describe('ProgramBriefPanel · declared ai-label control', () => {
  it('labels an AI-shaped brief as one, in the words the catalog pins', () => {
    render(
      <ProgramBriefPanel
        brief={PATTERN_BRIEF}
        onSubmitForApproval={jest.fn()}
        promotionApproval={promotion()}
      />,
    );

    expect(
      screen.getByLabelText('Intelligence pattern promotion approval'),
    ).toBeTruthy();
    expect(screen.getByText('Human promotion gate required')).toBeTruthy();
    expect(
      screen.getByText(
        /This Move is being shaped from an Intelligence pattern recommendation/,
      ),
    ).toBeTruthy();
  });

  it('does not label a brief that no pattern recommendation shaped', () => {
    render(
      <ProgramBriefPanel
        brief={{ ...PATTERN_BRIEF, matchedPatternId: null }}
        onSubmitForApproval={jest.fn()}
        promotionApproval={null}
      />,
    );

    // The negative matters as much as the positive: a label that renders
    // unconditionally says nothing about whether the brief is AI-shaped.
    expect(
      screen.queryByLabelText('Intelligence pattern promotion approval'),
    ).toBeNull();
    expect(screen.queryByText('Human promotion gate required')).toBeNull();
  });
});

describe('ProgramBriefPanel · declared citation control', () => {
  it('renders every evidence ref the promotion carries, one by one', () => {
    render(
      <ProgramBriefPanel
        brief={PATTERN_BRIEF}
        onSubmitForApproval={jest.fn()}
        promotionApproval={promotion()}
      />,
    );

    const card = within(
      screen.getByLabelText('Intelligence pattern promotion approval'),
    );
    const refs = card.getByText(EVIDENCE_REFS.join(', '));
    // Per ref rather than in aggregate: a joined string that dropped one ref
    // still matches a substring assertion about the others.
    for (const ref of EVIDENCE_REFS) {
      expect(refs.textContent).toContain(ref);
    }
    expect(card.getByText('Evidence refs')).toBeTruthy();
  });

  it('names the source thread and the selected pattern the recommendation came from', () => {
    render(
      <ProgramBriefPanel
        brief={PATTERN_BRIEF}
        onSubmitForApproval={jest.fn()}
        promotionApproval={promotion()}
      />,
    );

    // Scoped to the promotion card: the pattern key also appears in the
    // pattern-match card above, and an unscoped query would pass on that one
    // while this control rendered nothing.
    const card = within(
      screen.getByLabelText('Intelligence pattern promotion approval'),
    );
    expect(card.getByText('Source thread')).toBeTruthy();
    expect(card.getByText('thread-88')).toBeTruthy();
    expect(card.getByText('Selected pattern')).toBeTruthy();
    expect(card.getByText('PAT-CLOSE-CYCLE')).toBeTruthy();
  });

  it('withholds submit when the promotion carries no evidence ref at all', () => {
    render(
      <ProgramBriefPanel
        brief={PATTERN_BRIEF}
        onSubmitForApproval={jest.fn()}
        promotionApproval={promotion({ evidenceRefs: [] })}
      />,
    );

    expect(
      screen.queryByRole('button', { name: 'Submit brief for approval' }),
    ).toBeNull();
  });

  it('allows submit once the evidence refs are present and accepted', () => {
    render(
      <ProgramBriefPanel
        brief={PATTERN_BRIEF}
        onSubmitForApproval={jest.fn()}
        promotionApproval={promotion()}
      />,
    );

    // The pair with the case above: without this, "no button" could be true for
    // every input and the assertion would prove nothing about evidence refs.
    expect(
      screen.getByRole('button', { name: 'Submit brief for approval' }),
    ).toBeTruthy();
  });
});
