import { renderSourceDeliverable } from '../dispatch';
import type { SourceDeliverableSpec } from '../types';

const COMMON_BASE = {
  tenantKey: 'meridian',
  sourceEventId: 'event-1',
  title: 'Meridian Cloud Sourcing',
  generatedAt: '2026-05-08T03:30:00.000Z',
};

const NARRATIVE_PAYLOAD = {
  eventCode: 'MERI-CLOUD-2026',
  eventName: 'Meridian Health Cloud & Infrastructure',
  issuedBy: 'Janet Fischer, VP IT Ops',
  body: '# Sample\n\nLine one.\n\n## Section\n\n- bullet 1\n- bullet 2',
  bodyIsAuthored: true,
};

function makeSpec(
  kind: SourceDeliverableSpec['kind'],
  payloadOverride?: Record<string, unknown>,
): SourceDeliverableSpec {
  return {
    ...COMMON_BASE,
    kind,
    payload: (payloadOverride ?? NARRATIVE_PAYLOAD) as unknown as Record<string, unknown>,
  };
}

describe('renderSourceDeliverable · narrative kinds', () => {
  for (const kind of ['scope-memo', 'rfp-package', 'decision-brief', 'selection-memo'] as const) {
    describe(kind, () => {
      it('returns docx by default with valid ZIP magic', async () => {
        const result = await renderSourceDeliverable(makeSpec(kind));
        expect(result.format).toBe('docx');
        expect(result.buffer[0]).toBe(0x50);
        expect(result.buffer[1]).toBe(0x4b);
        expect(result.contentType).toContain('wordprocessing');
      });

      it('returns html when requested', async () => {
        const result = await renderSourceDeliverable(makeSpec(kind), 'html');
        expect(result.format).toBe('html');
        expect(result.buffer.toString('utf8')).toContain('<!DOCTYPE html>');
      });

      it('throws on xlsx (not allowed for narrative kinds)', async () => {
        await expect(
          renderSourceDeliverable(makeSpec(kind), 'xlsx'),
        ).rejects.toThrow(/Format "xlsx" is not allowed/);
      });
    });
  }
});

describe('renderSourceDeliverable · structured-data kinds (xlsx + docx)', () => {
  it('app-inventory renders xlsx by default', async () => {
    const payload = {
      tenantName: 'Meridian',
      eventCode: 'MERI-CLOUD-2026',
      eventName: 'Meridian Health Cloud',
      generatedAt: COMMON_BASE.generatedAt,
      tierDefinitions: [
        { tier: 1, label: 'Mission-critical', criterion: 'Outage halts revenue.', recoveryObjective: 'RTO < 4h', examples: 'Epic CIS' },
        { tier: 2, label: 'Important', criterion: 'Productivity impact.', recoveryObjective: 'RTO < 24h', examples: 'ITSM' },
        { tier: 3, label: 'Standard', criterion: 'Tolerable for days.', recoveryObjective: 'RTO < 72h', examples: 'Archive' },
      ],
      rows: [
        { id: 'A-EPIC-01', name: 'Epic CIS', tier: 1, owner: 'Karen Liu', techStack: 'Cache MUMPS', hostingToday: 'Newark colo', annualWorkloadCount: 24000, inScope: true },
      ],
    };
    const result = await renderSourceDeliverable(makeSpec('app-inventory', payload));
    expect(result.format).toBe('xlsx');
    expect(result.buffer[0]).toBe(0x50);
    expect(result.buffer[1]).toBe(0x4b);
  });

  it('app-inventory also renders docx when requested', async () => {
    const payload = {
      tenantName: 'Meridian',
      eventCode: 'MERI-CLOUD-2026',
      eventName: 'Meridian Health Cloud',
      generatedAt: COMMON_BASE.generatedAt,
      tierDefinitions: [
        { tier: 1, label: 'M', criterion: 'x', recoveryObjective: 'y', examples: 'z' },
      ],
      rows: [],
    };
    const result = await renderSourceDeliverable(makeSpec('app-inventory', payload), 'docx');
    expect(result.format).toBe('docx');
    expect(result.contentType).toContain('wordprocessing');
  });

  it('scorecard renders xlsx + docx', async () => {
    const payload = {
      tenantName: 'Meridian',
      eventCode: 'MERI-CLOUD-2026',
      eventName: 'Meridian Health Cloud',
      generatedAt: COMMON_BASE.generatedAt,
      criteria: [{ id: 'C-FIT', label: 'Functional fit', weightPercent: 100, description: 'd04 coverage.' }],
      vendors: ['Acme'],
      scoreGuidance: [{ score: 3 as const, label: 'Meets', rubric: 'Fully meets.' }],
    };
    const xlsxResult = await renderSourceDeliverable(makeSpec('scorecard', payload));
    expect(xlsxResult.format).toBe('xlsx');
    const docxResult = await renderSourceDeliverable(makeSpec('scorecard', payload), 'docx');
    expect(docxResult.format).toBe('docx');
  });

  it('response-checklist renders xlsx + docx', async () => {
    const payload = {
      tenantName: 'Meridian',
      eventCode: 'MERI-CLOUD-2026',
      eventName: 'Meridian Health Cloud',
      generatedAt: COMMON_BASE.generatedAt,
      mandatoryItems: [{ id: 'M-EXEC-01', section: 'Exec', requirement: 'Exec summary.' }],
      optionalItems: [],
      formatExpectations: [{ topic: 'PDF', requirement: 'searchable' }],
      certifications: ['Officer authorized.'],
    };
    const xlsxResult = await renderSourceDeliverable(makeSpec('response-checklist', payload));
    expect(xlsxResult.format).toBe('xlsx');
    const docxResult = await renderSourceDeliverable(makeSpec('response-checklist', payload), 'docx');
    expect(docxResult.format).toBe('docx');
  });
});

describe('renderSourceDeliverable · xlsx-only kinds', () => {
  it('pricing-template renders xlsx', async () => {
    const payload = {
      tenantName: 'Meridian',
      eventCode: 'MERI-CLOUD-2026',
      eventName: 'Meridian Health Cloud',
      generatedAt: COMMON_BASE.generatedAt,
      assumptions: [{ key: 'Term', value: '3 years' }],
      lineItems: [{ id: 'L-CMP-01', category: 'Platform', description: 'Compute', unit: 'unit-month', annualQuantity: 280 }],
      tcoYears: 3,
      escalator: 0.04,
    };
    const result = await renderSourceDeliverable(makeSpec('pricing-template', payload));
    expect(result.format).toBe('xlsx');
    expect(result.buffer[0]).toBe(0x50);
  });

  it('trap-log renders xlsx', async () => {
    const payload = {
      tenantName: 'Meridian',
      eventCode: 'MERI-CLOUD-2026',
      eventName: 'Meridian Health Cloud',
      generatedAt: COMMON_BASE.generatedAt,
      severityDefinitions: [{ severity: 'P0' as const, label: 'Deal-shaping', rubric: 'Material.' }],
      rows: [{ id: 'T-EGR-01', severity: 'P0' as const, category: 'Egress', description: 'x', surfacedFor: 'all', surfacedBy: 'Sentinel' }],
    };
    const result = await renderSourceDeliverable(makeSpec('trap-log', payload));
    expect(result.format).toBe('xlsx');
  });

  it('bafo-question-pack renders xlsx', async () => {
    const payload = {
      tenantName: 'Meridian',
      eventCode: 'MERI-CLOUD-2026',
      eventName: 'Meridian Health Cloud',
      generatedAt: COMMON_BASE.generatedAt,
      vendors: ['Acme'],
      trapQuestions: [{ id: 'TQ-01', source: 'T-EGR-01', severity: 'P0' as const, question: 'q', responseFormat: 'y/n' }],
      valueQuestions: [],
    };
    const result = await renderSourceDeliverable(makeSpec('bafo-question-pack', payload));
    expect(result.format).toBe('xlsx');
  });

  it('throws on docx for xlsx-only kinds', async () => {
    const payload = {
      tenantName: 'Meridian',
      eventCode: 'MERI-CLOUD-2026',
      eventName: 'Meridian Health Cloud',
      generatedAt: COMMON_BASE.generatedAt,
      assumptions: [],
      lineItems: [],
      tcoYears: 3,
      escalator: 0.04,
    };
    await expect(
      renderSourceDeliverable(makeSpec('pricing-template', payload), 'docx'),
    ).rejects.toThrow(/Format "docx" is not allowed/);
  });
});
