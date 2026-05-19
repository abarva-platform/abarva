// Tower · outcome-report export · renderer + no-fabrication tests
//
// G8 — asserts the DOCX + XLSX renderers produce non-empty, valid
// artifacts for all three pilot tenants, and that a thin tenant yields
// an HONEST sparse report (explicit "no tracked outcomes yet" copy and
// no invented numbers).

import { Packer } from 'docx';
import JSZip from 'jszip';

import type {
  AIInitiative,
  AIInitiativeVendorRow,
} from '@/lib/admin/ai-initiatives/queries';
import { buildTowerBandMetrics } from '@/lib/tower/band-metrics-view';
import {
  buildTowerOutcomeReportPayload,
  renderTowerOutcomeReportDocx,
  renderTowerOutcomeReportXlsx,
  type TowerOutcomeKpiInput,
  type TowerOutcomeReportInput,
} from '@/lib/tower/exports';

const TOWER_TODAY = '2026-05-12';

// ── Fixtures ─────────────────────────────────────────────────────────────────

function initiative(over: Partial<AIInitiative> = {}): AIInitiative {
  return {
    initiativeId: 'i-1',
    displayId: 'AI-001',
    name: 'Contact Center AI Routing',
    description: 'Routing assistant.',
    primaryCategoryId: 'c-1',
    primaryCategoryName: 'Customer ops',
    secondaryCategoryId: null,
    secondaryCategoryName: null,
    primaryGoalId: 'g-1',
    primaryGoalName: 'Cost to serve',
    stage: 'scaled',
    stageDetail: null,
    ownerName: 'Dana Reed',
    ownerTitle: 'VP Customer Ops',
    ownerFunction: 'Operations',
    committedAnnualUsd: 1_200_000,
    committedTotalUsd: 3_600_000,
    measuredValueUsd: 1_800_000,
    statusFlag: 'healthy',
    statusSummary: 'Tracking ahead of plan.',
    confidenceLevel: 'HIGH',
    alignedCallout: true,
    alignedRationale: 'Strategic.',
    loadedViaTemplate: 'air-v1',
    ...over,
  };
}

function vendor(over: Partial<AIInitiativeVendorRow> = {}): AIInitiativeVendorRow {
  return {
    vendorId: 'v-1',
    initiativeId: 'i-1',
    initiativeDisplayId: 'AI-001',
    initiativeName: 'Contact Center AI Routing',
    vendorName: 'Acme AI',
    contractValueUsd: 900_000,
    renewalDate: '2026-06-30',
    financialHealth: 'strong',
    ...over,
  };
}

function kpi(over: Partial<TowerOutcomeKpiInput> = {}): TowerOutcomeKpiInput {
  return {
    initiativeId: 'i-1',
    initiativeDisplayId: 'AI-001',
    initiativeName: 'Contact Center AI Routing',
    kpiName: 'Average handle time',
    kpiUnit: 'sec',
    quarter: '2026-Q1',
    kpiValue: 240,
    targetValue: 220,
    peerMedian: 260,
    confidenceLevel: 'HIGH',
    ...over,
  };
}

function inputFor(
  tenantName: string,
  tenantKey: string,
  initiatives: AIInitiative[],
  vendors: AIInitiativeVendorRow[],
  kpis: TowerOutcomeKpiInput[],
): TowerOutcomeReportInput {
  return {
    tenantName,
    tenantKey,
    generatedAt: '2026-05-12T09:00:00.000Z',
    towerToday: TOWER_TODAY,
    initiatives,
    vendors,
    kpis,
    bandMetrics: buildTowerBandMetrics(initiatives, vendors, TOWER_TODAY, 'value'),
  };
}

// Apex — a rich tenant: multiple initiatives, vendors, KPIs.
function apexInput(): TowerOutcomeReportInput {
  const initiatives = [
    initiative(),
    initiative({
      initiativeId: 'i-2',
      displayId: 'AI-002',
      name: 'Demand Forecasting',
      stage: 'pilot',
      statusFlag: 'value_lag',
      committedAnnualUsd: 800_000,
      measuredValueUsd: 250_000,
      confidenceLevel: 'MED',
      statusSummary: 'Below forecast; under review.',
    }),
    initiative({
      initiativeId: 'i-3',
      displayId: 'AI-003',
      name: 'Store Associate Productivity',
      stage: 'pilot',
      statusFlag: 'foundation_phase',
      committedAnnualUsd: 400_000,
      measuredValueUsd: null,
      confidenceLevel: 'LOW',
      statusSummary: 'Groundwork phase.',
    }),
  ];
  const vendors = [
    vendor(),
    vendor({
      vendorId: 'v-2',
      initiativeId: 'i-2',
      initiativeDisplayId: 'AI-002',
      initiativeName: 'Demand Forecasting',
      vendorName: 'ForecastIQ',
      contractValueUsd: 500_000,
      renewalDate: '2026-12-01',
      financialHealth: 'watch',
    }),
  ];
  const kpis = [
    kpi(),
    kpi({
      initiativeId: 'i-2',
      initiativeDisplayId: 'AI-002',
      initiativeName: 'Demand Forecasting',
      kpiName: 'Forecast accuracy',
      kpiUnit: '%',
      quarter: '2026-Q1',
      kpiValue: 78,
      targetValue: 90,
      peerMedian: 85,
      confidenceLevel: 'MED',
    }),
  ];
  return inputFor('Apex Retail', 'apexretail', initiatives, vendors, kpis);
}

// Meridian — a thin tenant: one initiative, no vendors, no KPIs.
function meridianInput(): TowerOutcomeReportInput {
  return inputFor(
    'Meridian Health',
    'meridian',
    [
      initiative({
        initiativeId: 'm-1',
        displayId: 'MH-001',
        name: 'Clinical Documentation Assist',
        stage: 'pilot',
        statusFlag: 'foundation_phase',
        committedAnnualUsd: null,
        measuredValueUsd: null,
        confidenceLevel: 'LOW',
        statusSummary: 'Early pilot.',
      }),
    ],
    [],
    [],
  );
}

// Arcturus — the thinnest tenant: no substrate at all.
function arcturusInput(): TowerOutcomeReportInput {
  return inputFor('Arcturus Capital', 'arcturus', [], [], []);
}

// ── Helpers ──────────────────────────────────────────────────────────────────

async function docxBytes(input: TowerOutcomeReportInput): Promise<Buffer> {
  const payload = buildTowerOutcomeReportPayload(input);
  const doc = renderTowerOutcomeReportDocx(payload);
  return Packer.toBuffer(doc);
}

async function docxText(input: TowerOutcomeReportInput): Promise<string> {
  const bytes = await docxBytes(input);
  const zip = await JSZip.loadAsync(bytes);
  const xml = await zip.file('word/document.xml')!.async('string');
  return xml.replace(/<[^>]+>/g, ' ');
}

async function xlsxBytes(input: TowerOutcomeReportInput): Promise<ArrayBuffer> {
  const payload = buildTowerOutcomeReportPayload(input);
  const wb = renderTowerOutcomeReportXlsx(payload);
  return (await wb.xlsx.writeBuffer()) as ArrayBuffer;
}

// ── Tests ────────────────────────────────────────────────────────────────────

describe('Tower outcome report — DOCX', () => {
  const tenants: Array<[string, () => TowerOutcomeReportInput]> = [
    ['Apex Retail', apexInput],
    ['Meridian Health', meridianInput],
    ['Arcturus Capital', arcturusInput],
  ];

  it.each(tenants)('produces a non-empty valid DOCX for %s', async (name, build) => {
    const bytes = await docxBytes(build());
    // A real .docx is a non-trivial zip starting with the PK signature.
    expect(bytes.length).toBeGreaterThan(1000);
    expect(bytes.subarray(0, 2).toString('latin1')).toBe('PK');
    const zip = await JSZip.loadAsync(bytes);
    expect(zip.file('word/document.xml')).not.toBeNull();
    const text = await docxText(build());
    expect(text).toContain('AI Initiative Outcome Report');
    expect(text).toContain(name);
  });

  it('Apex DOCX includes tracked initiatives, KPIs, and vendors', async () => {
    const text = await docxText(apexInput());
    expect(text).toContain('Contact Center AI Routing');
    expect(text).toContain('Demand Forecasting');
    expect(text).toContain('Average handle time');
    expect(text).toContain('Acme AI');
    expect(text).toContain('Tracked initiatives');
  });

  it('thin tenant (Arcturus) DOCX is an honest sparse report', async () => {
    const text = await docxText(arcturusInput());
    expect(text).toContain('No tracked outcomes yet');
    expect(text).toContain('No AI initiatives are tracked');
    // No fabricated numbers: no dollar figures, no "×" ratios.
    expect(text).not.toMatch(/\$[0-9]/);
    expect(text).not.toMatch(/[0-9]×/);
  });

  it('thin tenant (Meridian) DOCX states empty KPI / vendor sections honestly', async () => {
    const text = await docxText(meridianInput());
    expect(text).toContain('Clinical Documentation Assist');
    expect(text).toContain('No KPI measurements are recorded');
    expect(text).toContain('No vendor contracts are recorded');
    expect(text).toContain('not yet measured');
    // The one initiative has null committed + measured value — its row
    // must carry dashes, never an invented figure. (The "$0" elsewhere
    // is the deterministic "Spend at risk" band metric, which is a
    // correct computed value for a no-pressure portfolio.)
    expect(text).toMatch(/Clinical Documentation Assist\s+Pilot\s+Foundation phase\s+—\s+—/);
    expect(text).not.toMatch(/\$[1-9]/);
  });
});

describe('Tower outcome report — XLSX', () => {
  const tenants: Array<[string, () => TowerOutcomeReportInput]> = [
    ['Apex Retail', apexInput],
    ['Meridian Health', meridianInput],
    ['Arcturus Capital', arcturusInput],
  ];

  it.each(tenants)('produces a non-empty valid XLSX for %s', async (_name, build) => {
    const bytes = Buffer.from(await xlsxBytes(build()));
    expect(bytes.length).toBeGreaterThan(1000);
    expect(bytes.subarray(0, 2).toString('latin1')).toBe('PK');
  });

  it.each(tenants)('XLSX for %s has the six canonical sheets', async (_name, build) => {
    const ExcelJS = (await import('exceljs')).default;
    const wb = new ExcelJS.Workbook();
    await wb.xlsx.load(await xlsxBytes(build()));
    expect(wb.worksheets.map((s) => s.name)).toEqual([
      'Cover',
      'Portfolio Metrics',
      'Initiatives',
      'Measurement Model',
      'Vendor Portfolio',
      '90-Day Activity',
    ]);
  });

  it('Apex XLSX Initiatives sheet carries real rows', async () => {
    const ExcelJS = (await import('exceljs')).default;
    const wb = new ExcelJS.Workbook();
    await wb.xlsx.load(await xlsxBytes(apexInput()));
    const sheet = wb.getWorksheet('Initiatives')!;
    // Header row + 3 initiative rows.
    expect(sheet.rowCount).toBe(4);
    expect(String(sheet.getRow(2).getCell(1).value)).toBe('AI-001');
  });

  it('thin tenant XLSX writes honest empty-note rows, not fabricated data', async () => {
    const ExcelJS = (await import('exceljs')).default;
    const wb = new ExcelJS.Workbook();
    await wb.xlsx.load(await xlsxBytes(arcturusInput()));

    const init = wb.getWorksheet('Initiatives')!;
    expect(init.rowCount).toBe(2); // header + one note row
    expect(String(init.getRow(2).getCell(1).value)).toContain(
      'No AI initiatives are tracked',
    );

    const kpiSheet = wb.getWorksheet('Measurement Model')!;
    expect(kpiSheet.rowCount).toBe(2);
    expect(String(kpiSheet.getRow(2).getCell(1).value)).toContain(
      'No KPI measurements',
    );

    const activity = wb.getWorksheet('90-Day Activity')!;
    expect(String(activity.getRow(2).getCell(1).value)).toContain(
      'No vendor renewals or KPI measurements',
    );
  });
});

describe('Tower outcome report — no-fabrication payload contract', () => {
  it('reports realized posture as "not_measured" when no measured value exists', () => {
    const payload = buildTowerOutcomeReportPayload(meridianInput());
    expect(payload.isEmpty).toBe(false);
    expect(payload.initiatives).toHaveLength(1);
    expect(payload.initiatives[0]!.realizedPosture.kind).toBe('not_measured');
    expect(payload.initiatives[0]!.measuredValue).toBe('—');
    expect(payload.emptyNotes.measurement).toContain('not yet measured');
  });

  it('flags a fully empty tenant without inventing summary counts', () => {
    const payload = buildTowerOutcomeReportPayload(arcturusInput());
    expect(payload.isEmpty).toBe(true);
    expect(payload.summary.initiativeCount).toBe(0);
    expect(payload.summary.kpiCount).toBe(0);
    expect(payload.summary.vendorCount).toBe(0);
    expect(payload.initiatives).toHaveLength(0);
  });

  it('computes realized-vs-forecast only from loaded committed + measured values', () => {
    const payload = buildTowerOutcomeReportPayload(apexInput());
    const lead = payload.initiatives.find((i) => i.displayId === 'AI-001')!;
    // 1.8M measured / 1.2M committed = 1.50×.
    expect(lead.realizedPosture.kind).toBe('measured');
    if (lead.realizedPosture.kind === 'measured') {
      expect(lead.realizedPosture.ratio).toBeCloseTo(1.5, 2);
    }
    // AI-003 has a null measured value — must stay "not_measured".
    const groundwork = payload.initiatives.find((i) => i.displayId === 'AI-003')!;
    expect(groundwork.realizedPosture.kind).toBe('not_measured');
  });

  it('builds the 90-day activity log only from in-window renewals / KPIs', () => {
    const payload = buildTowerOutcomeReportPayload(apexInput());
    // Acme AI renews 2026-06-30 — within 90d of 2026-05-12. ForecastIQ
    // renews 2026-12-01 — outside the window, must be excluded.
    const summaries = payload.activity90d.map((a) => a.summary).join(' | ');
    expect(summaries).toContain('Acme AI');
    expect(summaries).not.toContain('ForecastIQ');
  });
});
