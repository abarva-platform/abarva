/**
 * StageTrackerStrip — color logic unit tests (REASON-24)
 *
 * Tests verify the coloring/status resolution logic exported from
 * StageTrackerStrip without rendering the full React component (which
 * requires jsdom + Next.js router mocking).
 */

import { colorsForStatus, resolveStageColors } from '../StageTrackerStrip';
import { SHELL } from '@/lib/shell/shell-tokens';

const STAGES = ['Plan', 'RFI', 'Shortlist', 'BAFO', 'Selection'];

describe('colorsForStatus', () => {
  it('passed → mint pip and label', () => {
    const { pipColor, labelColor } = colorsForStatus('passed');
    expect(pipColor).toBe(SHELL.MINT_TEXT);
    expect(labelColor).toBe(SHELL.MINT_TEXT);
  });

  it('current → ink pip and label, bold weight', () => {
    const { pipColor, labelColor, labelWeight } = colorsForStatus('current');
    expect(pipColor).toBe(SHELL.INK);
    expect(labelColor).toBe(SHELL.INK);
    expect(labelWeight).toBe(600);
  });

  it('upcoming → gray pip, muted label, normal weight', () => {
    const { pipColor, labelColor, labelWeight } = colorsForStatus('upcoming');
    expect(pipColor).toBe(SHELL.GRAY_LINE);
    expect(labelColor).toBe(SHELL.INK_MUTED);
    expect(labelWeight).toBe(400);
  });

  it('blocked → amber pip and label, bold weight', () => {
    const { pipColor, labelColor, labelWeight } = colorsForStatus('blocked');
    // Amber is SHELL.AMBER_DOT
    expect(pipColor).toBe(SHELL.AMBER_DOT);
    expect(labelColor).toBe(SHELL.AMBER_DOT);
    expect(labelWeight).toBe(600);
  });
});

describe('resolveStageColors — without stageStates (index-based fallback)', () => {
  const activeIndex = 2; // 'Shortlist'

  it('stage before active → mint (done) colors', () => {
    const { pipColor, labelColor } = resolveStageColors('Plan', 0, activeIndex);
    expect(pipColor).toBe(SHELL.MINT_TEXT);
    expect(labelColor).toBe(SHELL.MINT_TEXT);
  });

  it('active stage → ink (current) colors, bold weight', () => {
    const { pipColor, labelColor, labelWeight } = resolveStageColors('Shortlist', 2, activeIndex);
    expect(pipColor).toBe(SHELL.INK);
    expect(labelColor).toBe(SHELL.INK);
    expect(labelWeight).toBe(600);
  });

  it('stage after active → gray/muted (upcoming) colors', () => {
    const { pipColor, labelColor, labelWeight } = resolveStageColors('BAFO', 3, activeIndex);
    expect(pipColor).toBe(SHELL.GRAY_LINE);
    expect(labelColor).toBe(SHELL.INK_MUTED);
    expect(labelWeight).toBe(400);
  });
});

describe('resolveStageColors — with stageStates (gate-driven)', () => {
  const stageStates = {
    Plan: 'passed' as const,
    RFI: 'passed' as const,
    Shortlist: 'passed' as const,
    BAFO: 'blocked' as const,
    Selection: 'upcoming' as const,
  };
  // activeIndex doesn't matter when stageStates is provided
  const activeIndex = 2;

  it('blocked stage → amber pip color', () => {
    const { pipColor } = resolveStageColors('BAFO', 3, activeIndex, stageStates);
    expect(pipColor).toBe(SHELL.AMBER_DOT);
  });

  it('blocked stage → amber label color', () => {
    const { labelColor } = resolveStageColors('BAFO', 3, activeIndex, stageStates);
    expect(labelColor).toBe(SHELL.AMBER_DOT);
  });

  it('passed stage → mint/green pip color', () => {
    const { pipColor } = resolveStageColors('Plan', 0, activeIndex, stageStates);
    expect(pipColor).toBe(SHELL.MINT_TEXT);
  });

  it('passed stage → mint/green label color', () => {
    const { labelColor } = resolveStageColors('Plan', 0, activeIndex, stageStates);
    expect(labelColor).toBe(SHELL.MINT_TEXT);
  });

  it('upcoming stage → muted label color', () => {
    const { labelColor } = resolveStageColors('Selection', 4, activeIndex, stageStates);
    expect(labelColor).toBe(SHELL.INK_MUTED);
  });

  it('upcoming stage → gray pip color', () => {
    const { pipColor } = resolveStageColors('Selection', 4, activeIndex, stageStates);
    expect(pipColor).toBe(SHELL.GRAY_LINE);
  });

  it('unknown stage defaults to upcoming when stageStates provided', () => {
    const { pipColor, labelColor } = resolveStageColors('UnknownStage', 9, activeIndex, stageStates);
    expect(pipColor).toBe(SHELL.GRAY_LINE);
    expect(labelColor).toBe(SHELL.INK_MUTED);
  });

  it('stageStates overrides index position — passed stage at index 0 does not use index-based logic', () => {
    // Even though Plan is at index 0 (before active=2), when stageStates is provided
    // the color comes from the status, not the index. Both happen to agree here (mint).
    // Verify by checking a "blocked" stage that would be "done" by index.
    const statesThatConflict = { Plan: 'blocked' as const };
    const { pipColor } = resolveStageColors('Plan', 0, 3, statesThatConflict);
    // Should be amber (from stageStates), NOT mint (from index < activeIndex)
    expect(pipColor).toBe(SHELL.AMBER_DOT);
  });
});
