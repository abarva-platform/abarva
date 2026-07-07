import { emptyDiscoveryShape, captureField, planFromShape } from '../discovery-intake';
import { buildAssessmentTemplate } from '../assessment-template';
import { renderAssessmentTemplateXlsx } from '../assessment-template-xlsx';

function template() {
  const s = emptyDiscoveryShape();
  s.dataDomains = captureField(s.dataDomains, ['Epic Clarity', 'Claims'], 'chat');
  const plan = planFromShape(s);
  return buildAssessmentTemplate(plan, { moveLabel: 'Risk Stratification' });
}

describe('renderAssessmentTemplateXlsx', () => {
  it('produces a non-empty .xlsx buffer (zip magic "PK")', async () => {
    const buf = await renderAssessmentTemplateXlsx(template());
    expect(buf.length).toBeGreaterThan(0);
    // .xlsx is a zip archive — starts with the PK signature.
    expect(buf.subarray(0, 2).toString('latin1')).toBe('PK');
  });

  it('round-trips: the rendered workbook has a sheet per template sheet', async () => {
    const tpl = template();
    const buf = await renderAssessmentTemplateXlsx(tpl);
    const ExcelJS = (await import('exceljs')).default;
    const wb = new ExcelJS.Workbook();
    await wb.xlsx.load(buf as unknown as ArrayBuffer);
    expect(wb.worksheets).toHaveLength(tpl.sheets.length);
    expect(wb.worksheets[0].name).toBe('Maturity summary');
  });

  it('sanitizes invalid sheet names', async () => {
    const tpl = template();
    tpl.sheets[1].name = 'Bad:Name/With*Chars';
    const buf = await renderAssessmentTemplateXlsx(tpl);
    const ExcelJS = (await import('exceljs')).default;
    const wb = new ExcelJS.Workbook();
    await wb.xlsx.load(buf as unknown as ArrayBuffer);
    expect(wb.worksheets[1].name).not.toMatch(/[[\]:*?/\\]/);
  });
});
