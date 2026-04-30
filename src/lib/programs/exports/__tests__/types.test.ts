// EXPORT-1 · types.ts compile-time + structural assertions.
//
// The interesting properties of the typed contract are caught by `tsc`,
// not Jest. This file does two things:
//   1. Forces the compiler to walk every kind in the union (exhaustive
//      mapping); a missing or extra kind would fail tsc.
//   2. Asserts at runtime that a fully-populated DeliverableSpec is
//      structurally what callers will pass; useful as a smoke check
//      that downstream renderer slices won't have to widen the envelope.

import type {
  DeliverableFormat,
  DeliverableKind,
  DeliverableRenderResult,
  DeliverableSpec,
} from '@/lib/programs/exports/types';

describe('DeliverableKind union', () => {
  it('covers all 16 kinds via an exhaustive map (compile-time check)', () => {
    // If a DeliverableKind is added/removed without updating this map,
    // tsc fails. The runtime assertion is a secondary check.
    const labels: Record<DeliverableKind, string> = {
      'program-charter': 'Program charter',
      'discovery-report': 'Discovery report',
      'okr-baseline': 'OKR baseline',
      'stakeholder-map': 'Stakeholder map',
      'synthesis-options-table': 'Synthesis options table',
      'architecture-sketch': 'Architecture sketch',
      'execution-plan': 'Execution plan',
      'pilot-result-report': 'Pilot result report',
      'outcome-report': 'Outcome report',
      'bafo-scoreboard': 'BAFO scoreboard',
      'meeting-notes': 'Meeting notes',
      'decision-log': 'Decision log',
      'roadmap': 'Roadmap',
      'financial-baseline': 'Financial baseline',
      'archetype-primer': 'Archetype primer',
      'workshop-facilitator-guide': 'Workshop facilitator guide',
    };
    expect(Object.keys(labels)).toHaveLength(16);
  });
});

describe('DeliverableFormat union', () => {
  it('contains exactly html, xlsx, docx, pdf', () => {
    // Compile-time exhaustive map ensures the union is exactly these 4.
    const labels: Record<DeliverableFormat, string> = {
      html: 'HTML',
      xlsx: 'Excel',
      docx: 'Word',
      pdf: 'PDF',
    };
    expect(Object.keys(labels).sort()).toEqual(['docx', 'html', 'pdf', 'xlsx']);
  });
});

describe('DeliverableSpec envelope', () => {
  it('accepts a fully-populated spec with all optional fields', () => {
    const spec: DeliverableSpec = {
      kind: 'program-charter',
      tenantKey: 'apex-retail',
      programId: '11111111-1111-1111-1111-111111111111',
      title: 'Apex Retail · Contact Center AI Charter',
      subtitle: 'Sponsor: VP Customer Care',
      generatedAt: '2026-04-29T00:00:00Z',
      authors: ['Aria Chen', 'Marco Vega'],
      payload: { sponsor: 'Aria Chen', successCriteria: ['CSAT +5pt'] },
      brandSubtitle: 'AbarVa · Programs',
    };
    expect(spec.kind).toBe('program-charter');
    expect(spec.payload.sponsor).toBe('Aria Chen');
  });

  it('accepts the minimum required spec (kind, tenantKey, title, payload)', () => {
    const spec: DeliverableSpec = {
      kind: 'roadmap',
      tenantKey: 'apex-retail',
      title: 'Q3 roadmap',
      payload: {},
    };
    expect(spec.programId).toBeUndefined();
    expect(spec.subtitle).toBeUndefined();
    expect(spec.authors).toBeUndefined();
  });
});

describe('DeliverableRenderResult envelope', () => {
  it('accepts a render result populated by a renderer', () => {
    const result: DeliverableRenderResult = {
      format: 'docx',
      buffer: Buffer.from('binary-here'),
      filename: 'apex-program-charter-20260429.docx',
      contentType:
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      sizeBytes: 47_000,
    };
    expect(result.format).toBe('docx');
    expect(Buffer.isBuffer(result.buffer)).toBe(true);
    expect(result.sizeBytes).toBe(47_000);
  });
});
