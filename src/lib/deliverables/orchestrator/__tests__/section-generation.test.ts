// Decomposed-generation helpers (Slice 0) — pure, no model.
import {
  mapWithConcurrency,
  repairUncitedFigures,
  buildSourceRegister,
  assembleDeliverable,
  type SynthesisResult,
} from '../section-generation';
import { amsRfpRequest } from '../__fixtures__/ams-rfp';
import type { RenderableSection } from '../types';

describe('mapWithConcurrency', () => {
  it('preserves order and never exceeds the concurrency limit', async () => {
    let inFlight = 0;
    let maxInFlight = 0;
    const out = await mapWithConcurrency([1, 2, 3, 4, 5, 6, 7, 8], 3, async (n) => {
      inFlight++;
      maxInFlight = Math.max(maxInFlight, inFlight);
      await new Promise((r) => setTimeout(r, 5));
      inFlight--;
      return n * 2;
    });
    expect(out).toEqual([2, 4, 6, 8, 10, 12, 14, 16]);
    expect(maxInFlight).toBeLessThanOrEqual(3);
  });
});

describe('repairUncitedFigures', () => {
  it('tags an uncited figure and leaves cited/figure-free prose alone', () => {
    expect(repairUncitedFigures('Revenue grew 25% last year.')).toContain('[CLIENT TO COMPLETE]');
    expect(repairUncitedFigures('Revenue grew 25% last year [3].')).not.toContain('[CLIENT TO COMPLETE]');
    expect(repairUncitedFigures('We will modernise the platform.')).toBe('We will modernise the platform.');
  });
});

describe('buildSourceRegister', () => {
  it('includes only evidence actually cited across the sections', () => {
    const req = amsRfpRequest();
    const sections: RenderableSection[] = [
      { key: 'a', title: 'A', bodyMarkdown: 'x [1]', groundingMode: 'mixed', citationsUsed: [1] },
      { key: 'b', title: 'B', bodyMarkdown: 'y', groundingMode: 'expert_template', citationsUsed: [] },
    ];
    expect(buildSourceRegister(req.governedEvidenceBundle, sections).map((r) => r.citationNumber)).toEqual([1]);
  });
});

describe('assembleDeliverable', () => {
  it('assembles sections + source register + synthesis fields in code', () => {
    const req = amsRfpRequest();
    const sections: RenderableSection[] = [
      { key: 'a', title: 'A', bodyMarkdown: 'x [1]', groundingMode: 'mixed', citationsUsed: [1] },
    ];
    const synth: SynthesisResult = {
      recommendation: 'We recommend proceeding.',
      tables: [{ key: 'risk_register', title: 'Risk', columns: [], rows: [], targetFormat: 'docx' }],
    };
    const doc = assembleDeliverable(req, sections, synth, req.governedEvidenceBundle);
    expect(doc.generatedSections).toHaveLength(1);
    expect(doc.sourceRegister.map((r) => r.citationNumber)).toEqual([1]);
    expect(doc.tables[0]!.title).toBe('Risk');
    expect(doc.clientDisplayName).toBe(req.clientDisplayName);
  });
});
