// EXPORT-2 · xlsx.ts + okr-baseline.ts unit tests.
//
// Covers:
//   • Pure renderer returns a valid xlsx buffer (size + mime + filename).
//   • Cover / Baseline / Provenance sheets exist; Contradictions only
//     when supplied.
//   • Header rows are bold; metric rows match input count.
//   • Numeric `confidence` is stored as a number, not a string.
//   • Formula-injection guard: leading `=` and HTML-ish content are
//     written safely (escaped via single-quote prefix).
//   • Unsupported XLSX kinds throw the documented EXPORT-2-EXTEND error.

jest.mock('server-only', () => ({}));

import ExcelJS from 'exceljs';

import type { DeliverableSpec } from '@/lib/programs/exports/types';
import {
  XLSX_CONTENT_TYPE,
  renderDeliverableAsXlsx,
} from '@/lib/programs/exports/renderers/xlsx';
import type { OkrBaselinePayload } from '@/lib/programs/exports/renderers/okr-baseline';

/**
 * Reload an xlsx render-result buffer into a fresh ExcelJS.Workbook.
 *
 * `wb.xlsx.load` declares its parameter as the legacy `Buffer` interface,
 * which does not align with the parameterized `Buffer<ArrayBufferLike>`
 * returned by Node's current @types/node Buffer class. The buffer bytes
 * are identical; the cast bridges the type signatures only.
 */
async function reloadWorkbook(buffer: Buffer): Promise<ExcelJS.Workbook> {
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.load(buffer as unknown as Parameters<typeof wb.xlsx.load>[0]);
  return wb;
}

/** Build a baseline spec with N metrics, optional contradictions/confidence. */
function buildSpec(overrides?: {
  metrics?: OkrBaselinePayload['metrics'];
  contradictions?: OkrBaselinePayload['contradictions'];
  generatedAt?: string;
}): DeliverableSpec {
  const metrics: OkrBaselinePayload['metrics'] = overrides?.metrics ?? [
    {
      metricId: 'kpi:apex:loyalty-rev-fy25',
      metricName: 'Loyalty member revenue (FY25)',
      currentValue: '$2.41B FY2025',
      targetValue: '$2.52B',
      unit: 'USD billions',
      sourceSystem: 'sys:apex:sap-s4',
      sourceDoc: 'Q1FY26-baseline.xlsx',
      measurementMethod: 'Trailing 12-month average',
      owner: 'person:apex:james-wright',
      confidence: 0.94,
      caveats: 'Excludes returns booked after period close.',
      fy2026Direction: 'increase',
    },
    {
      metricId: 'kpi:apex:nps',
      metricName: 'Net promoter score',
      currentValue: '38',
      targetValue: '46',
      unit: 'points',
      sourceSystem: 'sys:apex:qualtrics',
      measurementMethod: 'Quarterly survey, n>=2000',
      owner: 'person:apex:linda-chen',
      confidence: 0.82,
      caveats: 'Sampling skews to digital-first cohorts.',
      fy2026Direction: 'increase',
    },
    {
      metricId: 'kpi:apex:store-conv',
      metricName: 'In-store conversion rate',
      currentValue: '8%',
      targetValue: '9.5%',
      unit: 'percent',
      sourceSystem: 'sys:apex:rms',
      measurementMethod: 'Weekly POS aggregation',
      owner: 'person:apex:rajan-patel',
      fy2026Direction: 'increase',
    },
  ];

  return {
    kind: 'okr-baseline',
    tenantKey: 'apex-retail',
    programId: 'prog_apex_loyalty_fy26',
    title: 'Apex Loyalty FY26 Baseline',
    subtitle: 'Top-decile loyalty cohort baseline · captured pre-kickoff',
    generatedAt: overrides?.generatedAt ?? '2026-04-29T10:00:00.000Z',
    authors: ['Anand Sundaram', 'James Wright'],
    payload: {
      cohort: 'Top-decile loyalty members',
      capturedAt: '2026-04-28T14:30:00.000Z',
      metrics,
      contradictions: overrides?.contradictions,
    } satisfies OkrBaselinePayload as unknown as Record<string, unknown>,
  };
}

describe('renderDeliverableAsXlsx · okr-baseline', () => {
  it('returns a valid xlsx buffer with the documented mime + filename', async () => {
    const spec = buildSpec();
    const result = await renderDeliverableAsXlsx(spec);

    expect(result.format).toBe('xlsx');
    expect(result.contentType).toBe(XLSX_CONTENT_TYPE);
    expect(result.contentType).toBe(
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    );
    expect(result.sizeBytes).toBeGreaterThan(1024);
    expect(result.sizeBytes).toBeLessThan(5 * 1024 * 1024);
    expect(result.buffer.byteLength).toBe(result.sizeBytes);
    expect(result.filename).toMatch(/^apex-loyalty-fy26-baseline-okr-baseline-\d{8}\.xlsx$/);
    // generatedAt: 2026-04-29 -> 20260429 in UTC.
    expect(result.filename).toContain('-20260429.xlsx');
  });

  it('produces three sheets (Cover, Baseline, Provenance) when no contradictions', async () => {
    const spec = buildSpec();
    const result = await renderDeliverableAsXlsx(spec);

    const wb = await reloadWorkbook(result.buffer);

    const names = wb.worksheets.map((ws) => ws.name);
    expect(names).toEqual(['Cover', 'Baseline', 'Provenance']);
    expect(names).not.toContain('Contradictions');
  });

  it('produces four sheets when contradictions are supplied', async () => {
    const spec = buildSpec({
      contradictions: [
        {
          metricId: 'kpi:apex:nps',
          description: 'NPS denominator differs between quarterly and annual reports.',
        },
      ],
    });
    const result = await renderDeliverableAsXlsx(spec);

    const wb = await reloadWorkbook(result.buffer);

    const names = wb.worksheets.map((ws) => ws.name);
    expect(names).toEqual(['Cover', 'Baseline', 'Contradictions', 'Provenance']);

    const contradictionsSheet = wb.getWorksheet('Contradictions');
    expect(contradictionsSheet).toBeDefined();
    // Header + 1 data row.
    expect(contradictionsSheet?.rowCount).toBe(2);
    expect(contradictionsSheet?.getCell('A2').value).toBe('kpi:apex:nps');
  });

  it('cover sheet contains the spec title and cohort line', async () => {
    const spec = buildSpec();
    const result = await renderDeliverableAsXlsx(spec);

    const wb = await reloadWorkbook(result.buffer);
    const cover = wb.getWorksheet('Cover');
    expect(cover).toBeDefined();
    // The renderer writes the title to row 2, col 2 (col 1 is left-margin gutter).
    expect(cover?.getCell('B2').value).toBe('Apex Loyalty FY26 Baseline');
    // Cohort line lands somewhere on the cover; match by content.
    let foundCohort = false;
    cover?.eachRow((row) => {
      const v = row.getCell(2).value;
      if (typeof v === 'string' && v.includes('Cohort: Top-decile loyalty members')) {
        foundCohort = true;
      }
    });
    expect(foundCohort).toBe(true);
  });

  it('baseline sheet has N+1 rows (header + N metrics) and a bold header', async () => {
    const spec = buildSpec();
    const result = await renderDeliverableAsXlsx(spec);

    const wb = await reloadWorkbook(result.buffer);
    const baseline = wb.getWorksheet('Baseline');
    expect(baseline).toBeDefined();
    // 1 header + 3 metrics = 4 rows.
    expect(baseline?.rowCount).toBe(4);

    const header = baseline?.getRow(1);
    expect(header?.getCell(1).value).toBe('Metric ID');
    expect(header?.getCell(1).font?.bold).toBe(true);
    expect(header?.getCell(2).font?.bold).toBe(true);
  });

  it('renders confidence as a number, not a string', async () => {
    const spec = buildSpec();
    const result = await renderDeliverableAsXlsx(spec);

    const wb = await reloadWorkbook(result.buffer);
    const baseline = wb.getWorksheet('Baseline');
    expect(baseline).toBeDefined();
    // Confidence is column 11.
    const confidenceCell = baseline?.getRow(2).getCell(11);
    expect(typeof confidenceCell?.value).toBe('number');
    expect(confidenceCell?.value).toBeCloseTo(0.94, 5);
    // Empty confidence on third metric stays empty.
    const emptyConfidence = baseline?.getRow(4).getCell(11).value;
    expect(emptyConfidence === '' || emptyConfidence === null || emptyConfidence === undefined).toBe(
      true,
    );
  });

  it('escapes formula-injection-prone caveats and HTML-ish content safely', async () => {
    const spec = buildSpec({
      metrics: [
        {
          metricId: 'kpi:apex:test-formula',
          metricName: 'Formula injection test',
          currentValue: '0',
          targetValue: '0',
          unit: 'na',
          sourceSystem: 'sys:apex:test',
          measurementMethod: 'n/a',
          owner: 'person:apex:test',
          caveats: '=SUM(A1:A10) and <script>alert(1)</script>',
          fy2026Direction: 'maintain',
        },
      ],
    });
    const result = await renderDeliverableAsXlsx(spec);

    const wb = await reloadWorkbook(result.buffer);
    const baseline = wb.getWorksheet('Baseline');
    expect(baseline).toBeDefined();
    // Caveats column = 12.
    const caveats = baseline?.getRow(2).getCell(12).value;
    expect(typeof caveats).toBe('string');
    // The leading `=` must be quoted to prevent formula evaluation.
    expect(caveats as string).toMatch(/^'=SUM\(A1:A10\) and <script>alert\(1\)<\/script>$/);
    // The cell must NOT be a formula cell.
    expect(typeof caveats === 'object' && caveats !== null && 'formula' in caveats).toBe(false);
  });

  it('throws the EXPORT-2-EXTEND error for other XLSX-supporting kinds', async () => {
    const spec: DeliverableSpec = {
      kind: 'stakeholder-map',
      tenantKey: 'apex-retail',
      title: 'Stakeholder Map',
      payload: {},
    };
    await expect(renderDeliverableAsXlsx(spec)).rejects.toThrow(
      /EXPORT-2-EXTEND.*okr-baseline only/,
    );
  });

  it('throws when called with a non-XLSX-default kind (e.g. program-charter)', async () => {
    const spec: DeliverableSpec = {
      kind: 'program-charter',
      tenantKey: 'apex-retail',
      title: 'Charter',
      payload: {},
    };
    await expect(renderDeliverableAsXlsx(spec)).rejects.toThrow(
      /does not have an XLSX renderer/,
    );
  });

  it('throws when okr-baseline payload is malformed', async () => {
    const spec: DeliverableSpec = {
      kind: 'okr-baseline',
      tenantKey: 'apex-retail',
      title: 'Bad Baseline',
      payload: { cohort: 42, metrics: [] } as unknown as Record<string, unknown>,
    };
    await expect(renderDeliverableAsXlsx(spec)).rejects.toThrow(
      /okr-baseline payload is malformed/,
    );
  });

  it('uses a default generatedAt date when omitted', async () => {
    const spec = buildSpec();
    // Strip generatedAt to test the default branch.
    const stripped: DeliverableSpec = { ...spec, generatedAt: undefined };
    const result = await renderDeliverableAsXlsx(stripped);
    expect(result.filename).toMatch(/-okr-baseline-\d{8}\.xlsx$/);
  });
});
