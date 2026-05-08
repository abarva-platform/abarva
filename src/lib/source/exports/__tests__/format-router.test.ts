import {
  getAllowedFormats,
  getDefaultFormat,
  listAllKinds,
  routeFormat,
} from '../format-router';
import {
  ARTIFACT_CODE_TO_KIND,
  KIND_TO_ARTIFACT_CODE,
  type SourceDeliverableKind,
} from '../types';

describe('Source format router (Slice 8.1 foundations)', () => {
  it('returns the default format when no override is given', () => {
    expect(routeFormat('scope-memo')).toBe('docx');
    expect(routeFormat('app-inventory')).toBe('xlsx');
    expect(routeFormat('pricing-comparison')).toBe('xlsx');
  });

  it('honors a valid format override', () => {
    expect(routeFormat('scope-memo', 'html')).toBe('html');
    expect(routeFormat('scope-memo', 'pdf')).toBe('pdf');
    expect(routeFormat('app-inventory', 'docx')).toBe('docx');
  });

  it('throws when the requested format is not in the kind\'s allowed set', () => {
    expect(() => routeFormat('app-inventory', 'pdf')).toThrow(
      /Format "pdf" is not allowed for kind "app-inventory"/,
    );
    expect(() => routeFormat('pricing-template', 'docx')).toThrow(
      /Allowed formats: xlsx/,
    );
  });

  it('lists every Source kind', () => {
    const kinds = listAllKinds();
    expect(kinds).toHaveLength(11);
    expect(kinds).toContain('scope-memo');
    expect(kinds).toContain('pricing-template');
    expect(kinds).toContain('pricing-comparison');
    expect(kinds).toContain('bafo-question-pack');
  });

  it('every kind has a default format and an allowed-formats list', () => {
    for (const kind of listAllKinds()) {
      const def = getDefaultFormat(kind);
      const allowed = getAllowedFormats(kind);
      expect(allowed).toContain(def);
      expect(allowed.length).toBeGreaterThan(0);
    }
  });

  it('narrative artifacts allow all 4 formats', () => {
    const narratives: SourceDeliverableKind[] = [
      'scope-memo',
      'rfp-package',
      'decision-brief',
      'selection-memo',
    ];
    for (const kind of narratives) {
      const allowed = getAllowedFormats(kind);
      expect(allowed).toContain('docx');
      expect(allowed).toContain('html');
      expect(allowed).toContain('pdf');
    }
  });

  it('artifact code <-> kind round-trips', () => {
    for (const [code, kind] of Object.entries(ARTIFACT_CODE_TO_KIND)) {
      expect(KIND_TO_ARTIFACT_CODE[kind]).toBe(code);
    }
  });

  it('d19 has both pricing-template and pricing-comparison kinds', () => {
    // ARTIFACT_CODE_TO_KIND only stores one direction (d19 → first
    // kind); the route handler disambiguates via the variant param.
    // KIND_TO_ARTIFACT_CODE returns d19 for both kinds.
    expect(KIND_TO_ARTIFACT_CODE['pricing-template']).toBe('d19_pricing_workbook');
    expect(KIND_TO_ARTIFACT_CODE['pricing-comparison']).toBe('d19_pricing_workbook');
  });
});
