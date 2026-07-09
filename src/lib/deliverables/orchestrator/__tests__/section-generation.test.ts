// Decomposed-generation helpers (Slice 0) — pure, no model.
import {
  mapWithConcurrency,
  extractUnsupportedFigureClaims,
  repairUncitedFigures,
  buildSourceRegister,
  assembleDeliverable,
  consolidateOpenInputPlaceholders,
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
  it('labels an uncited figure as an assumption and leaves cited/figure-free prose alone', () => {
    expect(extractUnsupportedFigureClaims('Revenue grew 25% last year.')).toEqual(['Revenue grew 25% last year.']);
    expect(repairUncitedFigures('Revenue grew 25% last year.')).toContain('[ASSUMPTION TO VALIDATE:');
    expect(repairUncitedFigures('Revenue grew 25% last year [3].')).not.toContain('[ASSUMPTION TO VALIDATE:');
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

  it('downgrades a business case title and consolidates unsupported figure claims into open inputs', () => {
    const req = amsRfpRequest({ module: 'moves', deliverableType: 'business_case' });
    const sections: RenderableSection[] = [
      { key: 'value', title: 'Value', bodyMarkdown: 'Value is an assumption.', groundingMode: 'mixed', citationsUsed: [] },
    ];
    const doc = assembleDeliverable(req, sections, {}, req.governedEvidenceBundle, {
      unsupportedClaims: [{
        sectionKey: 'value',
        sectionTitle: 'Value',
        claim: 'The program will generate $8.5M in year one.',
        treatment: 'open_input_required',
      }],
    });
    expect(doc.title).toMatch(/^Business Case Readiness Memo/);
    expect(doc.tables.find((t) => t.key === 'open_inputs_required')?.rows).toEqual(
      expect.arrayContaining([
        expect.arrayContaining(['The program will generate $8.5M in year one.']),
      ]),
    );
  });

  it('consolidates scattered per-section [CLIENT TO COMPLETE] tags into one Open Inputs table (regression 2026-07-08)', () => {
    // Each section independently follows its own "mark missing inputs inline"
    // instruction, so no single section scatters placeholders — but across N
    // sections the aggregated document previously still tripped the
    // whole-document "scattered placeholder" check and blocked export.
    const req = amsRfpRequest({ module: 'moves', deliverableType: 'business_case' });
    const sections: RenderableSection[] = [
      { key: 'a', title: 'Investment Summary', bodyMarkdown: 'Total cost [CLIENT TO COMPLETE: capex range].', groundingMode: 'mixed', citationsUsed: [] },
      { key: 'b', title: 'Financial Returns', bodyMarkdown: 'Discount rate TBC.', groundingMode: 'mixed', citationsUsed: [] },
      { key: 'c', title: 'Scenario Analysis', bodyMarkdown: 'Headcount assumption to be confirmed.', groundingMode: 'mixed', citationsUsed: [] },
    ];
    const doc = assembleDeliverable(req, sections, {}, req.governedEvidenceBundle);

    const scatteredInBody = doc.generatedSections
      .map((s) => s.bodyMarkdown)
      .join('\n')
      .match(/\[CLIENT TO COMPLETE[^\]]*\]|\bTBC\b|\bto be confirmed\b/gi);
    expect(scatteredInBody).toBeNull();

    const openInputs = doc.tables.find((t) => t.key === 'open_inputs_required');
    const rowText = (openInputs?.rows ?? []).map((r) => r.join(' ')).join(' | ');
    expect(rowText).toMatch(/capex range/);
    expect(rowText).toMatch(/TBC/);
    expect(rowText).toMatch(/to be confirmed/i);
  });
});

describe('consolidateOpenInputPlaceholders', () => {
  it('leaves a section with no placeholders untouched (same reference)', () => {
    const sections: RenderableSection[] = [
      { key: 'a', title: 'A', bodyMarkdown: 'Clean prose with no open items.', groundingMode: 'mixed', citationsUsed: [] },
    ];
    const { sections: cleaned, harvested } = consolidateOpenInputPlaceholders(sections);
    expect(cleaned[0]).toBe(sections[0]);
    expect(harvested).toHaveLength(0);
  });
});
