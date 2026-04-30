// EXPORT-1 · format-router.ts unit tests.
//
// Covers:
//   • routeFormat default-fallback path.
//   • routeFormat allowed-override path.
//   • routeFormat rejection of disallowed formats.
//   • isFormatAllowed truth matrix.
//   • getDefaultFormat coverage of all 16 kinds.
//   • Referential integrity: every default IS in its kind's allowed set.

import {
  getDefaultFormat,
  isFormatAllowed,
  listAllowedFormats,
  routeFormat,
} from '@/lib/programs/exports/format-router';
import type {
  DeliverableFormat,
  DeliverableKind,
} from '@/lib/programs/exports/types';

const ALL_KINDS: ReadonlyArray<DeliverableKind> = [
  'program-charter',
  'discovery-report',
  'okr-baseline',
  'stakeholder-map',
  'synthesis-options-table',
  'architecture-sketch',
  'execution-plan',
  'pilot-result-report',
  'outcome-report',
  'bafo-scoreboard',
  'meeting-notes',
  'decision-log',
  'roadmap',
  'financial-baseline',
  'archetype-primer',
  'workshop-facilitator-guide',
];

const ALL_FORMATS: ReadonlyArray<DeliverableFormat> = [
  'html',
  'xlsx',
  'docx',
  'pdf',
];

describe('routeFormat', () => {
  it('returns the kind default when no requestedFormat is supplied', () => {
    expect(routeFormat('program-charter')).toBe('docx');
    expect(routeFormat('okr-baseline')).toBe('xlsx');
    expect(routeFormat('archetype-primer')).toBe('html');
    expect(routeFormat('roadmap')).toBe('html');
  });

  it('returns the requested format when it is in the kind allowed set', () => {
    expect(routeFormat('program-charter', 'docx')).toBe('docx');
    expect(routeFormat('program-charter', 'html')).toBe('html');
    expect(routeFormat('roadmap', 'xlsx')).toBe('xlsx');
    expect(routeFormat('outcome-report', 'html')).toBe('html');
  });

  it('throws when the requested format is not allowed for the kind', () => {
    expect(() => routeFormat('program-charter', 'xlsx')).toThrow(
      /not allowed for kind "program-charter"/,
    );
    expect(() => routeFormat('okr-baseline', 'docx')).toThrow(
      /Allowed formats: xlsx/,
    );
    expect(() => routeFormat('architecture-sketch', 'pdf')).toThrow(
      /not allowed for kind "architecture-sketch"/,
    );
  });

  it('rejects pdf for every kind in EXPORT-1 (deferred to EXPORT-5)', () => {
    for (const kind of ALL_KINDS) {
      expect(() => routeFormat(kind, 'pdf')).toThrow(/not allowed/);
    }
  });
});

describe('isFormatAllowed', () => {
  it('returns true for kind+format pairs known to be in the allowed set', () => {
    expect(isFormatAllowed('program-charter', 'docx')).toBe(true);
    expect(isFormatAllowed('program-charter', 'html')).toBe(true);
    expect(isFormatAllowed('decision-log', 'docx')).toBe(true);
    expect(isFormatAllowed('decision-log', 'xlsx')).toBe(true);
    expect(isFormatAllowed('roadmap', 'html')).toBe(true);
    expect(isFormatAllowed('roadmap', 'xlsx')).toBe(true);
  });

  it('returns false for kind+format pairs known to be rejected', () => {
    expect(isFormatAllowed('program-charter', 'xlsx')).toBe(false);
    expect(isFormatAllowed('program-charter', 'pdf')).toBe(false);
    expect(isFormatAllowed('okr-baseline', 'docx')).toBe(false);
    expect(isFormatAllowed('architecture-sketch', 'docx')).toBe(false);
    expect(isFormatAllowed('archetype-primer', 'xlsx')).toBe(false);
  });

  it('agrees with listAllowedFormats for every kind+format combination', () => {
    for (const kind of ALL_KINDS) {
      const allowed = listAllowedFormats(kind);
      for (const format of ALL_FORMATS) {
        expect(isFormatAllowed(kind, format)).toBe(allowed.includes(format));
      }
    }
  });
});

describe('getDefaultFormat', () => {
  it('returns a defined DeliverableFormat for all 16 kinds', () => {
    const seen: Record<string, DeliverableFormat> = {};
    for (const kind of ALL_KINDS) {
      const format = getDefaultFormat(kind);
      expect(ALL_FORMATS).toContain(format);
      seen[kind] = format;
    }
    expect(Object.keys(seen)).toHaveLength(16);
  });

  it('matches the design Section 2 canonical defaults', () => {
    expect(getDefaultFormat('program-charter')).toBe('docx');
    expect(getDefaultFormat('discovery-report')).toBe('docx');
    expect(getDefaultFormat('okr-baseline')).toBe('xlsx');
    expect(getDefaultFormat('stakeholder-map')).toBe('xlsx');
    expect(getDefaultFormat('synthesis-options-table')).toBe('xlsx');
    expect(getDefaultFormat('architecture-sketch')).toBe('html');
    expect(getDefaultFormat('execution-plan')).toBe('xlsx');
    expect(getDefaultFormat('pilot-result-report')).toBe('docx');
    expect(getDefaultFormat('outcome-report')).toBe('docx');
    expect(getDefaultFormat('bafo-scoreboard')).toBe('xlsx');
    expect(getDefaultFormat('meeting-notes')).toBe('docx');
    expect(getDefaultFormat('decision-log')).toBe('docx');
    expect(getDefaultFormat('roadmap')).toBe('html');
    expect(getDefaultFormat('financial-baseline')).toBe('xlsx');
    expect(getDefaultFormat('archetype-primer')).toBe('html');
    expect(getDefaultFormat('workshop-facilitator-guide')).toBe('docx');
  });
});

describe('referential integrity', () => {
  it('every kind default is also in its allowed set', () => {
    for (const kind of ALL_KINDS) {
      const def = getDefaultFormat(kind);
      const allowed = listAllowedFormats(kind);
      expect(allowed).toContain(def);
    }
  });

  it('no kind has an empty allowed set', () => {
    for (const kind of ALL_KINDS) {
      expect(listAllowedFormats(kind).length).toBeGreaterThan(0);
    }
  });

  it('no kind allows pdf in EXPORT-1', () => {
    for (const kind of ALL_KINDS) {
      expect(listAllowedFormats(kind)).not.toContain<DeliverableFormat>('pdf');
    }
  });
});
