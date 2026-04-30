// Slice OV2-WIRE-AND-FM-PROMPT — failure-mode prompt block tests.

import {
  composeBriefProgressCadenceDirective,
  composeFailureModeBlock,
  composeOverlapBlock,
  formatFailureModeCatalogForPrompt,
  isProgramsSurface,
} from '../failure-mode-prompt';
import { FAILURE_MODES } from '../failure-modes';
import type { BriefOverlapMatch } from '../origination-overlap';

describe('formatFailureModeCatalogForPrompt', () => {
  const block = formatFailureModeCatalogForPrompt();

  it('includes the catalog header', () => {
    expect(block).toContain('THE 10 FAILURES YOU EXIST TO PREVENT:');
  });

  it('includes a research provenance line', () => {
    expect(block).toContain('Gartner');
    expect(block).toContain('RAND');
    expect(block).toContain('MIT/BCG');
    expect(block).toContain('McKinsey');
    expect(block).toContain('Forrester');
  });

  it('contains all 10 canonical names sourced from FAILURE_MODES, in id order', () => {
    const namesInOrder = FAILURE_MODES.map((m) => m.name);
    expect(namesInOrder).toHaveLength(10);

    const idxs = namesInOrder.map((name) => block.indexOf(name));
    // Every name appears.
    idxs.forEach((idx, position) => {
      expect(idx).toBeGreaterThan(-1);
      // Each name appears AFTER the previous one (preserves catalog order).
      if (position > 0) {
        expect(idx).toBeGreaterThan(idxs[position - 1]);
      }
    });
  });

  it('numbers entries 1..10', () => {
    for (let i = 1; i <= 10; i += 1) {
      const padded = String(i).padStart(2, ' ');
      expect(block).toContain(`${padded}. `);
    }
  });
});

describe('isProgramsSurface', () => {
  it('matches Programs surfaces', () => {
    expect(isProgramsSurface('/programs')).toBe(true);
    expect(isProgramsSurface('/programs/new')).toBe(true);
    expect(isProgramsSurface('/programs/abc-123')).toBe(true);
    expect(isProgramsSurface('/demo/programs/new')).toBe(true);
    expect(isProgramsSurface('/tower')).toBe(true);
    expect(isProgramsSurface('/tower/portfolio')).toBe(true);
  });

  it('rejects non-Programs surfaces', () => {
    expect(isProgramsSurface('/intelligence')).toBe(false);
    expect(isProgramsSurface('/source')).toBe(false);
    expect(isProgramsSurface('/home')).toBe(false);
    expect(isProgramsSurface('')).toBe(false);
    expect(isProgramsSurface(null)).toBe(false);
    expect(isProgramsSurface(undefined)).toBe(false);
  });
});

describe('composeFailureModeBlock', () => {
  it('returns the catalog block on Programs surfaces', () => {
    const block = composeFailureModeBlock('/programs/new');
    expect(block).toContain('THE 10 FAILURES YOU EXIST TO PREVENT:');
    // First and last canonical names must both be present.
    expect(block).toContain(FAILURE_MODES[0].name);
    expect(block).toContain(FAILURE_MODES[9].name);
  });

  it('returns the catalog block on /tower', () => {
    expect(composeFailureModeBlock('/tower')).toContain(
      'THE 10 FAILURES YOU EXIST TO PREVENT:',
    );
  });

  it('returns empty string off Programs surfaces', () => {
    expect(composeFailureModeBlock('/intelligence')).toBe('');
    expect(composeFailureModeBlock('/source')).toBe('');
    expect(composeFailureModeBlock('/home')).toBe('');
    expect(composeFailureModeBlock(null)).toBe('');
    expect(composeFailureModeBlock(undefined)).toBe('');
  });
});

describe('composeOverlapBlock', () => {
  const fakeMatches: BriefOverlapMatch[] = [
    {
      programId: 'apex-cdp-2026',
      programName: 'Apex Retail CDP Activation',
      programPhase: 'P3 Design',
      overlapKind: 'sponsor',
      overlapDetail: 'Sarah Chen already sponsors apex-cdp-2026.',
      matchScore: 0.5,
    },
    {
      programId: 'apex-ams-2026',
      programName: 'Apex AMS Consolidation',
      overlapKind: 'system',
      overlapDetail: 'SAP footprint overlaps.',
      matchScore: 0.3,
    },
  ];

  it('returns empty string when no matches', () => {
    expect(composeOverlapBlock([])).toBe('');
  });

  it('renders the header on non-empty input', () => {
    const block = composeOverlapBlock(fakeMatches);
    expect(block).toContain('OVERLAP CANDIDATES (existing programs');
  });

  it('renders each match with id, name, phase, kind, and detail', () => {
    const block = composeOverlapBlock(fakeMatches);
    expect(block).toContain('apex-cdp-2026');
    expect(block).toContain('Apex Retail CDP Activation');
    expect(block).toContain('P3 Design');
    expect(block).toContain('Overlap kind: sponsor');
    expect(block).toContain('Sarah Chen already sponsors apex-cdp-2026.');

    expect(block).toContain('apex-ams-2026');
    expect(block).toContain('Apex AMS Consolidation');
    // Missing phase falls back to "unknown".
    expect(block).toContain('current phase: unknown');
    expect(block).toContain('Overlap kind: system');
  });

  it('orders entries as supplied (caller controls top-3 slicing)', () => {
    const block = composeOverlapBlock(fakeMatches);
    const idxFirst = block.indexOf('apex-cdp-2026');
    const idxSecond = block.indexOf('apex-ams-2026');
    expect(idxFirst).toBeGreaterThan(-1);
    expect(idxSecond).toBeGreaterThan(idxFirst);
  });

  it('includes the do-not-invent guidance footer', () => {
    const block = composeOverlapBlock(fakeMatches);
    expect(block).toContain('Do NOT invent overlap');
    expect(block).toContain('overlap-alert');
  });

  it('respects the top-N contract when caller pre-slices', () => {
    const truncated = fakeMatches.slice(0, 1);
    const block = composeOverlapBlock(truncated);
    expect(block).toContain('apex-cdp-2026');
    expect(block).not.toContain('apex-ams-2026');
  });
});

describe('composeBriefProgressCadenceDirective', () => {
  it('returns the cadence line on /programs/new', () => {
    expect(composeBriefProgressCadenceDirective('/programs/new')).toContain(
      'brief-progress',
    );
  });

  it('returns the cadence line on /demo/programs/new', () => {
    expect(
      composeBriefProgressCadenceDirective('/demo/programs/new'),
    ).toContain('brief-progress');
  });

  it('returns empty string on every other surface', () => {
    expect(composeBriefProgressCadenceDirective('/programs')).toBe('');
    expect(composeBriefProgressCadenceDirective('/programs/abc-123')).toBe('');
    expect(composeBriefProgressCadenceDirective('/intelligence')).toBe('');
    expect(composeBriefProgressCadenceDirective(null)).toBe('');
    expect(composeBriefProgressCadenceDirective(undefined)).toBe('');
  });
});
