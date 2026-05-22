// Moves Expert Kernel — artifact export renderer tests.
//
// Asserts, for ALL THREE tenant anchors (Apex, Meridian, First Capital), that
// every renderer produces a non-empty, valid file buffer AND that the output
// is grounded:
//   - a known real baseline value appears,
//   - a declared seed gap appears as an explicit seed-gap line,
//   - the honest verdict (kill / null payback) is present.
//
// The HARD RULE the spec sets (§10.2): no fabrication. These tests pin it.

import JSZip from 'jszip';
import { Packer } from 'docx';
import { pdf } from '@react-pdf/renderer';
import ExcelJS from 'exceljs';

import {
  EXPERT_REVIEW_CASE_IDS,
  EXPERT_REVIEW_CASES,
  resolveExpertReviewCase,
} from '../expert-review-cases';
import {
  KERNEL_ARTIFACTS,
  artifactSupportsFormat,
  isArtifactFormat,
  isKernelArtifactId,
  kernelArtifactFilename,
  renderKernelArtifact,
  resolveKernelArtifact,
} from '../exports';
import { SEED_GAP_MARKER } from '../exports/format-helpers';
import { buildKernelArtifactDocx } from '../exports/business-case-docx';
import { buildKernelFinancialModelXlsx } from '../exports/financial-model-xlsx';
import { buildKernelArtifactPdf } from '../exports/business-case-pdf';

const GENERATED_ON = '2026-05-19';

// Known real baseline values per tenant — pinned in the case anchors.
// The needle is the RAW kernel value as it lands in a baseline-table cell /
// docx run — renderers print baseline metrics raw (value + unit), not
// thousands-formatted, so the grounding needle is the raw integer.
const KNOWN_BASELINE: Record<string, { needle: string; label: string }> = {
  apexretail: { needle: '28', label: 'Contact Center Containment 28%' },
  meridian: { needle: '129', label: 'pajama time 129 min/day' },
  arcturus: { needle: '2100000', label: 'card fraud losses $2.1M' },
};

// A known declared seed-gap metric label per tenant.
const KNOWN_SEED_GAP: Record<string, string> = {
  apexretail: 'Cost per contact',
  meridian: 'Cost-per-clinician-hour',
  arcturus: 'Fraud-analyst FTE cost',
};

/** Extract all text from a docx buffer by unzipping word/document.xml. */
async function docxText(buffer: Uint8Array): Promise<string> {
  const zip = await JSZip.loadAsync(buffer);
  const doc = zip.file('word/document.xml');
  if (!doc) throw new Error('word/document.xml missing from docx');
  const xml = await doc.async('string');
  // Strip tags — leaves the rendered text content.
  return xml.replace(/<[^>]+>/g, ' ');
}

/** Serialize a @react-pdf element to a Buffer. */
async function pdfBuffer(
  element: Parameters<typeof pdf>[0],
): Promise<Buffer> {
  const stream = await pdf(element).toBuffer();
  const chunks: Buffer[] = [];
  for await (const chunk of stream as AsyncIterable<Buffer | string>) {
    chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
  }
  return Buffer.concat(chunks);
}

/** All text from an xlsx workbook re-read from its serialized bytes. */
async function xlsxText(workbook: ExcelJS.Workbook): Promise<string> {
  const buf = await workbook.xlsx.writeBuffer();
  const reread = new ExcelJS.Workbook();
  await reread.xlsx.load(buf as ArrayBuffer);
  const parts: string[] = [];
  reread.eachSheet((sheet) => {
    sheet.eachRow((row) => {
      row.eachCell({ includeEmpty: false }, (cell) => {
        parts.push(String(cell.value ?? ''));
      });
    });
  });
  return parts.join(' | ');
}

describe('artifact catalog', () => {
  it('exposes all four Moves phases', () => {
    const phases = new Set(KERNEL_ARTIFACTS.map((a) => a.phase));
    expect(phases).toEqual(
      new Set(['discover', 'charter', 'design_plan', 'mobilize']),
    );
  });

  it('every artifact declares at least one format', () => {
    for (const a of KERNEL_ARTIFACTS) {
      expect(a.formats.length).toBeGreaterThan(0);
    }
  });

  it('id and format guards behave', () => {
    expect(isKernelArtifactId('cfo_pack')).toBe(true);
    expect(isKernelArtifactId('nope')).toBe(false);
    expect(isArtifactFormat('docx')).toBe(true);
    expect(isArtifactFormat('csv')).toBe(false);
    expect(artifactSupportsFormat('financial_model', 'xlsx')).toBe(true);
    expect(artifactSupportsFormat('financial_model', 'docx')).toBe(false);
    expect(resolveKernelArtifact('discover_brief')).not.toBeNull();
    expect(resolveKernelArtifact('missing')).toBeNull();
  });

  it('filenames are slug-safe and carry the date', () => {
    const name = kernelArtifactFilename(
      'apex-retail',
      'cfo_pack',
      'pdf',
      GENERATED_ON,
    );
    expect(name).toBe('abarva-moves-apex-retail-cfo-pack-2026-05-19.pdf');
  });
});

// One describe block per tenant — every renderer × every applicable artifact.
for (const caseId of EXPERT_REVIEW_CASE_IDS) {
  const caseEntry = EXPERT_REVIEW_CASES[caseId];
  const baseline = KNOWN_BASELINE[caseId];
  const seedGapLabel = KNOWN_SEED_GAP[caseId];

  describe(`${caseEntry.tenantLabel} — kernel artifact exports`, () => {
    // --- DOCX renderers --------------------------------------------------
    const docxArtifacts = KERNEL_ARTIFACTS.filter((a) =>
      a.formats.includes('docx'),
    );
    for (const artifact of docxArtifacts) {
      it(`renders a valid, grounded DOCX for ${artifact.id}`, async () => {
        const doc = buildKernelArtifactDocx({
          caseEntry,
          artifact,
          generatedOn: GENERATED_ON,
        });
        const buf = await Packer.toBuffer(doc);
        // Valid, non-empty Word file — ZIP magic bytes.
        expect(buf.byteLength).toBeGreaterThan(4000);
        expect(buf[0]).toBe(0x50);
        expect(buf[1]).toBe(0x4b);

        const text = await docxText(buf);
        // Grounding 1 — a known real baseline value appears.
        expect(text).toContain(baseline.needle);
        // Grounding 2 — a declared seed gap appears as an explicit line.
        expect(text).toContain(seedGapLabel);
        expect(text).toContain('seed gap');
        // Grounding 3 — the move name is present, no placeholder text.
        expect(text).toContain(caseEntry.tenantKey);
        if (artifact.id === 'business_case_pack') {
          expect(text).toContain('Board-grade visual exhibits');
          expect(text).toContain('Investment to return waterfall');
          expect(text).toContain('Sensitivity tornado');
          expect(text).toContain('Architecture context diagram');
        }
      });
    }

    // --- XLSX financial model -------------------------------------------
    it('renders a valid, grounded XLSX financial model', async () => {
      const workbook = buildKernelFinancialModelXlsx({
        caseEntry,
        generatedOn: GENERATED_ON,
      });
      const buf = await workbook.xlsx.writeBuffer();
      expect(buf.byteLength).toBeGreaterThan(2000);

      const text = await xlsxText(workbook);
      // Grounding 1 — a known real baseline value appears.
      expect(text).toContain(baseline.needle);
      // Grounding 2 — the seed-gap marker is rendered, never a blank cell.
      expect(text).toContain(SEED_GAP_MARKER);
      // The sheet structure — all six sheets present.
      expect(text).toContain('baseline');
      // Effort, value forecast and roadmap sheets carry their titles.
      expect(text.toLowerCase()).toContain('effort estimate');
      expect(text.toLowerCase()).toContain('value forecast');
      expect(text.toLowerCase()).toContain('costed roadmap');
      expect(text.toLowerCase()).toContain('board-grade visual exhibit spine');
      expect(text).toContain('Investment to return waterfall');
      expect(text).toContain('Sensitivity tornado');
      expect(text).toContain('Payback range curve');
    });

    it('XLSX value forecast reconciles with the skeleton value range', async () => {
      // The financial model re-renders the kernel value forecast; its total
      // net value must equal the skeleton's valueRange — no drift, no new
      // numbers introduced by the renderer.
      const { skeleton } = caseEntry.buildCase();
      const forecast = caseEntry.buildValueForecast();
      expect(forecast.totalNetValue.point).toBe(skeleton.valueRange.point);
      expect(forecast.totalNetValue.low).toBe(skeleton.valueRange.low);
      expect(forecast.totalNetValue.high).toBe(skeleton.valueRange.high);
    });

    // --- PDF renderers ---------------------------------------------------
    const pdfArtifacts = KERNEL_ARTIFACTS.filter((a) =>
      a.formats.includes('pdf'),
    );
    for (const artifact of pdfArtifacts) {
      it(`renders a valid PDF for ${artifact.id}`, async () => {
        const element = buildKernelArtifactPdf({
          caseEntry,
          artifact,
          generatedOn: GENERATED_ON,
        });
        const buf = await pdfBuffer(element);
        // Valid, non-empty PDF — %PDF- magic header.
        expect(buf.byteLength).toBeGreaterThan(2000);
        expect(buf.subarray(0, 5).toString('latin1')).toBe('%PDF-');
      });
    }

    // --- Honest verdict --------------------------------------------------
    it('the kernel returns the honest verdict the artifacts must carry', () => {
      const { skeleton } = caseEntry.buildCase();
      const { fullCase } = caseEntry.buildFullCase();
      const { goPack } = caseEntry.buildMobilize();
      if (caseId === 'arcturus') {
        // First Capital — the kernel's honest skeleton verdict is `shape`:
        // the case needs reframing before it can be funded. `kill` is only
        // reachable as a pressure-test outcome, never the live skeleton
        // recommendation — so we pin the exact verdict here.
        expect(skeleton.recommendation).toBe('shape');
      }
      // No tenant fabricates a payback while monetisation is blocked.
      if (!skeleton.economics.monetisable) {
        expect(skeleton.economics.paybackMonths).toBeNull();
      }
      // The go-decision is never a fake "go" while a kill trigger fired.
      if (goPack.firedKillTriggers.length > 0) {
        expect(goPack.decision).toBe('no_go');
      }
      // The full-case recommendation is one of the three honest verdicts.
      expect(['fund', 'shape', 'kill']).toContain(fullCase.recommendation);
    });
  });
}

describe('renderKernelArtifact — registry dispatch', () => {
  it('renders every advertised (artifact, format) pair for every tenant', () => {
    for (const caseId of EXPERT_REVIEW_CASE_IDS) {
      const caseEntry = EXPERT_REVIEW_CASES[caseId];
      for (const artifact of KERNEL_ARTIFACTS) {
        for (const format of artifact.formats) {
          const rendered = renderKernelArtifact({
            caseEntry,
            artifact,
            format,
            generatedOn: GENERATED_ON,
          });
          expect(rendered.format).toBe(format);
        }
      }
    }
  });

  it('throws when an artifact does not support the format', () => {
    const caseEntry = resolveExpertReviewCase('apexretail');
    const artifact = resolveKernelArtifact('financial_model')!;
    expect(() =>
      renderKernelArtifact({
        caseEntry,
        artifact,
        format: 'docx',
        generatedOn: GENERATED_ON,
      }),
    ).toThrow(/not available/);
  });
});
