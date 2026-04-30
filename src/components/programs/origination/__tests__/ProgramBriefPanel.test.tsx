/**
 * @jest-environment jsdom
 */

/**
 * ProgramBriefPanel · OV2-1b render tests.
 *
 * Verifies:
 *   - BriefProgressCard renders when `briefProgress` is non-null and
 *     shows the "X of N fields filled" summary plus the per-field list.
 *   - BriefProgressCard is absent when `briefProgress` is null.
 *   - One OverlapAlertCard renders per entry in `overlapAlerts`, each
 *     showing its `overlapDetail` text.
 *   - Both meta cards are independent of the field-row rendering (the
 *     existing brief-field cards keep working).
 */

import { render, screen } from '@testing-library/react';
import {
  buildProgramSetupReadiness,
  EMPTY_BRIEF,
  ProgramBriefPanel,
  type ProgramBriefDraft,
} from '../ProgramBriefPanel';
import type {
  BriefProgressArtifact,
  OverlapAlertArtifact,
} from '@/lib/agent/artifacts';

const SAMPLE_PROGRESS: BriefProgressArtifact = {
  type: 'brief-progress',
  fieldsTotal: 8,
  fieldsFilled: 3,
  fields: [
    { id: 'sponsor', label: 'Sponsor candidate', status: 'filled', value: 'Sarah Chen (CIO)' },
    { id: 'problem', label: 'Problem statement', status: 'filled', value: 'AMS spend up 22% YoY' },
    { id: 'outcome', label: 'Target outcome', status: 'partial' },
    { id: 'archetype', label: 'Archetype', status: 'empty' },
    { id: 'timeline', label: 'Timeline', status: 'empty' },
    { id: 'systems', label: 'Named systems', status: 'empty' },
    { id: 'vendors', label: 'Named vendors', status: 'empty' },
    { id: 'lead', label: 'Program lead', status: 'filled', value: 'Mei Tanaka' },
  ],
};

const OVERLAP_CDP: OverlapAlertArtifact = {
  type: 'overlap-alert',
  overlappingProgramId: 'APX-CDP-2026',
  overlappingProgramName: 'Apex Retail CDP Activation',
  overlappingProgramPhase: 'P3 Design',
  overlapKind: 'sponsor',
  overlapDetail:
    'Sarah Chen is already sponsoring APX-CDP-2026 in P3; double-check sponsor bandwidth before originating.',
};

const OVERLAP_AMS: OverlapAlertArtifact = {
  type: 'overlap-alert',
  overlappingProgramId: 'APX-AMS-2026',
  overlappingProgramName: 'Apex Retail AMS Consolidation',
  overlapKind: 'system',
  overlapDetail: 'Both programs touch the merch-ops application family.',
};

const READY_BRIEF: ProgramBriefDraft = {
  programName: 'Apex Retail SAP Finance Modernization',
  problemStatement: 'Finance close is slowed by fragmented SAP and Workday handoffs.',
  targetOutcome: 'Reduce close cycle time and improve operating visibility.',
  timeline: 'P0 in May, P1 by June',
  classification: 'ERP Modernization',
  matchedPatternId: null,
  sponsor: 'Sarah Chen',
  lead: 'Mei Tanaka',
  crossProgramDependencies: [],
};

describe('ProgramBriefPanel · OV2-1b meta cards', () => {
  it('renders setup-readiness as collecting until required setup inputs are present', () => {
    render(<ProgramBriefPanel brief={EMPTY_BRIEF} />);

    expect(screen.getByLabelText('Setup readiness')).toBeTruthy();
    expect(screen.getByText('Collecting setup inputs')).toBeTruthy();
    expect(screen.getByText('0 of 6 required')).toBeTruthy();
    expect(screen.getByText('Program name')).toBeTruthy();
    expect(screen.getByText('Executive sponsor')).toBeTruthy();
  });

  it('renders setup-readiness as ready once the brief has the minimum setup inputs', () => {
    render(<ProgramBriefPanel brief={READY_BRIEF} />);

    expect(screen.getByText('Ready to submit for approval')).toBeTruthy();
    expect(screen.getByText('6 of 6 required')).toBeTruthy();
  });

  it('moves setup-readiness into review state when portfolio overlaps exist', () => {
    render(<ProgramBriefPanel brief={READY_BRIEF} overlapAlerts={[OVERLAP_CDP]} />);

    expect(screen.getByText('Ready after overlap review')).toBeTruthy();
    expect(screen.getByText('Portfolio overlap review')).toBeTruthy();
    expect(screen.getByText('Review the active overlap before submit.')).toBeTruthy();
  });

  it('renders BriefProgressCard with the count summary when briefProgress is non-null', () => {
    render(
      <ProgramBriefPanel brief={EMPTY_BRIEF} briefProgress={SAMPLE_PROGRESS} />,
    );

    // Summary line.
    expect(screen.getByText('3 of 8 fields filled')).toBeTruthy();
    // Eyebrow / card label.
    expect(screen.getByLabelText('Brief progress')).toBeTruthy();
    // Field labels rendered.
    expect(screen.getByText('Sponsor candidate')).toBeTruthy();
    expect(screen.getAllByText('Problem statement').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('Archetype')).toBeTruthy();
    // Truncated value preview (filled field).
    expect(screen.getByText('Sarah Chen (CIO)')).toBeTruthy();
  });

  it('does not render the Brief Progress card when briefProgress is null', () => {
    render(<ProgramBriefPanel brief={EMPTY_BRIEF} briefProgress={null} />);
    expect(screen.queryByLabelText('Brief progress')).toBeNull();
    expect(screen.queryByText(/of \d+ fields filled/)).toBeNull();
  });

  it('renders one OverlapAlertCard per entry in overlapAlerts', () => {
    render(
      <ProgramBriefPanel
        brief={EMPTY_BRIEF}
        overlapAlerts={[OVERLAP_CDP, OVERLAP_AMS]}
      />,
    );

    // One link per overlap alert, addressing the existing program.
    const cdpLink = screen.getByLabelText(
      'Overlap with existing program Apex Retail CDP Activation',
    );
    const amsLink = screen.getByLabelText(
      'Overlap with existing program Apex Retail AMS Consolidation',
    );
    expect(cdpLink.getAttribute('href')).toBe('/programs/APX-CDP-2026');
    expect(amsLink.getAttribute('href')).toBe('/programs/APX-AMS-2026');
  });

  it('each overlap-alert card shows the overlapDetail text', () => {
    render(
      <ProgramBriefPanel
        brief={EMPTY_BRIEF}
        overlapAlerts={[OVERLAP_CDP, OVERLAP_AMS]}
      />,
    );

    expect(screen.getByText(/Sarah Chen is already sponsoring APX-CDP-2026/)).toBeTruthy();
    expect(
      screen.getByText('Both programs touch the merch-ops application family.'),
    ).toBeTruthy();
  });

  it('renders no overlap cards when overlapAlerts is empty', () => {
    render(<ProgramBriefPanel brief={EMPTY_BRIEF} overlapAlerts={[]} />);
    expect(screen.queryByText(/Overlap with existing program/i)).toBeNull();
  });

  it('shows phase + overlapKind label when present on the alert', () => {
    render(
      <ProgramBriefPanel brief={EMPTY_BRIEF} overlapAlerts={[OVERLAP_CDP]} />,
    );
    // Phase suffix appended next to the program name.
    expect(screen.getByText(/· P3 Design/)).toBeTruthy();
    // Kind label visible at the bottom of the card.
    expect(screen.getByText(/Overlap kind · sponsor/)).toBeTruthy();
  });
});

describe('buildProgramSetupReadiness', () => {
  it('returns a deterministic missing-field summary for an empty brief', () => {
    const readiness = buildProgramSetupReadiness(EMPTY_BRIEF);
    expect(readiness.status).toBe('collecting');
    expect(readiness.completedRequired).toBe(0);
    expect(readiness.totalRequired).toBe(6);
    expect(readiness.items.map((item) => [item.label, item.status])).toEqual([
      ['Program name', 'missing'],
      ['Problem statement', 'missing'],
      ['Target outcome', 'missing'],
      ['Executive sponsor', 'missing'],
      ['Program lead', 'missing'],
      ['Classification', 'missing'],
    ]);
  });

  it('returns ready when every setup field is captured and no overlaps are active', () => {
    const readiness = buildProgramSetupReadiness(READY_BRIEF);
    expect(readiness.status).toBe('ready');
    expect(readiness.completedRequired).toBe(6);
    expect(readiness.headline).toBe('Ready to submit for approval');
  });

  it('returns review when required fields are present but overlap alerts remain', () => {
    const readiness = buildProgramSetupReadiness(READY_BRIEF, [OVERLAP_CDP, OVERLAP_AMS]);
    expect(readiness.status).toBe('review');
    expect(readiness.completedRequired).toBe(6);
    expect(readiness.items.at(-1)).toEqual({
      id: 'overlapReview',
      label: 'Portfolio overlap review',
      status: 'review',
      detail: 'Review 2 active overlaps before submit.',
    });
  });
});
