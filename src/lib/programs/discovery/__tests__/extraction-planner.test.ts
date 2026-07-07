import { emptyDiscoveryShape, captureField } from '../discovery-intake';
import { planDiscoveryExtraction, applyEvidenceToCharter } from '../extraction-planner';
import { embedDiscoveryShapeInCharter, readDiscoveryShapeFromCharter } from '../charter-transformers';
import type { ExtractedProgramEvidence } from '../../evidence-ingestion';

function evidence(partial: Partial<ExtractedProgramEvidence> = {}): ExtractedProgramEvidence {
  return {
    evidenceType: 'architecture_inventory',
    title: 'Meridian system inventory',
    summary: 'Extracted systems',
    extractedText: 'Epic Clarity, SAP ERP, UKG Pro',
    extractedStructured: {
      decisions: ['Adopt Databricks'],
      action_items: [],
      risks: ['PHI exposure'],
      baseline_candidates: ['Epic Clarity', 'SAP ERP', 'UKG Pro'],
      attendees: [],
      parse_method: 'docx',
      warnings: [],
    },
    confidence: 0.9,
    ...partial,
  };
}

describe('planDiscoveryExtraction — route evidence into the shape + receipt', () => {
  it('routes baseline candidates into landscape as review-pending facts', () => {
    const { shape, receipt } = planDiscoveryExtraction(evidence(), emptyDiscoveryShape(), {
      sourceFile: 'inventory.xlsx',
    });
    expect(shape.landscape.value).toHaveLength(3);
    expect(shape.landscape.review).toBe('review_pending');
    expect(shape.landscape.value?.[0]).toMatchObject({
      domain: 'architecture',
      system: 'Epic Clarity',
      source: 'upload',
      review: 'review_pending',
    });
    expect(shape.landscape.provenance).toBe('inventory.xlsx');
    expect(shape.landscape.confidence).toBe('high');
    expect(receipt.routed[0]).toMatchObject({ field: 'landscape', count: 3 });
    expect(receipt.reviewPendingCount).toBe(3);
  });

  it('names every stage in the receipt', () => {
    const { receipt } = planDiscoveryExtraction(evidence(), emptyDiscoveryShape(), {
      sourceFile: 'inventory.xlsx',
    });
    expect(receipt.stages.map((s) => s.stage)).toEqual([
      'staged',
      'parsed',
      'extracted',
      'routed',
      'review',
    ]);
    expect(receipt.stages.find((s) => s.stage === 'parsed')?.status).toBe('done');
  });

  it('keeps decisions/risks as evidence-only (unmapped) — never faked into a field', () => {
    const { receipt } = planDiscoveryExtraction(evidence(), emptyDiscoveryShape(), {
      sourceFile: 'inventory.xlsx',
    });
    expect(receipt.unmapped).toContain('decision: Adopt Databricks');
    expect(receipt.unmapped).toContain('risk: PHI exposure');
  });

  it('reports a failed parse honestly and routes nothing', () => {
    const e = evidence({
      extractedStructured: {
        decisions: [],
        action_items: [],
        risks: [],
        baseline_candidates: [],
        attendees: [],
        parse_method: 'failed',
        warnings: ['ocr timeout'],
      },
    });
    const { shape, receipt } = planDiscoveryExtraction(e, emptyDiscoveryShape(), {
      sourceFile: 'scan.pdf',
    });
    expect(shape.landscape.value).toBeNull();
    expect(receipt.stages.find((s) => s.stage === 'parsed')?.status).toBe('failed');
    expect(receipt.stages.find((s) => s.stage === 'routed')?.status).toBe('skipped');
    expect(receipt.reviewPendingCount).toBe(0);
    expect(receipt.warnings).toEqual(['ocr timeout']);
  });

  it('appends to an existing landscape rather than clobbering it', () => {
    const shape = emptyDiscoveryShape();
    const first = planDiscoveryExtraction(
      evidence({
        extractedStructured: {
          decisions: [],
          action_items: [],
          risks: [],
          baseline_candidates: ['Existing system'],
          attendees: [],
          parse_method: 'csv',
          warnings: [],
        },
      }),
      shape,
      { sourceFile: 'a.csv' },
    );
    const second = planDiscoveryExtraction(evidence(), first.shape, { sourceFile: 'b.xlsx' });
    expect(second.shape.landscape.value?.length).toBe(1 + 3);
    expect(second.shape.landscape.sources).toEqual(['upload']);
    expect(second.shape.landscape.provenance).toBe('b.xlsx');
  });
});

describe('applyEvidenceToCharter — orchestration over the charter JSONB (S3b)', () => {
  it('starts from empty when the charter has no shape, embeds the routed shape', () => {
    const { charter, receipt } = applyEvidenceToCharter({ version: 1 }, evidence(), {
      sourceFile: 'inv.xlsx',
    });
    expect(charter.version).toBe(1); // preserves existing charter keys
    const shape = readDiscoveryShapeFromCharter(charter);
    expect(shape?.landscape.value).toHaveLength(3);
    expect(receipt.routed[0]).toMatchObject({ field: 'landscape', count: 3 });
  });

  it('reads an existing shape from the charter and appends (preserves prior fields)', () => {
    // seed a charter with a shape that already has a confirmed problem
    const shape = emptyDiscoveryShape();
    shape.problem = captureField(shape.problem, 'reduce admissions', 'chat');
    const seeded = embedDiscoveryShapeInCharter({ version: 1 }, shape);

    const { charter } = applyEvidenceToCharter(seeded, evidence(), { sourceFile: 'inv.xlsx' });
    const out = readDiscoveryShapeFromCharter(charter);
    expect(out?.problem.value).toBe('reduce admissions'); // prior field preserved
    expect(out?.problem.review).toBe('confirmed');
    expect(out?.landscape.value).toHaveLength(3); // evidence routed in
  });

  it('handles a null charter by creating one', () => {
    const { charter } = applyEvidenceToCharter(null, evidence(), { sourceFile: 'inv.xlsx' });
    expect(readDiscoveryShapeFromCharter(charter)?.landscape.value).toHaveLength(3);
  });
});
