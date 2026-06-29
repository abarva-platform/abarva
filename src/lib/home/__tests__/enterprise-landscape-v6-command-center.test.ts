import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';

import { getEnterpriseLandscapeViewModel } from '../enterprise-landscape-view-model';

const V6_DATASETS = [
  { clientKey: 'apexretail', dir: 'apex-retail-synthetic-v6' },
  { clientKey: 'firstcapital', dir: 'first-capital-financial-synthetic-v6' },
  { clientKey: 'lakeshore', dir: 'lakeshore-industries-synthetic-v6' },
  { clientKey: 'meridian', dir: 'meridian-health-synthetic-v6' },
  { clientKey: 'skyharbor', dir: 'skyharbor-air-synthetic-v6' },
];

const EXPECTED_FAMILIES = [
  'enterprise_profile',
  'business_function',
  'org_ownership',
  'workforce_persona',
  'application_system',
  'data_asset_integration',
  'vendor_contract',
  'spend_value',
  'program_initiative',
  'ai_initiative',
  'operations_risk_control',
  'relationship',
  'evidence_source',
  'metric_definition',
  'industry_corpus_pattern',
  'expert_lens',
];

function readJson<T>(filePath: string): T {
  return JSON.parse(readFileSync(filePath, 'utf8')) as T;
}

function parseCsvRows(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = '';
  let quoted = false;

  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    const next = text[index + 1];
    if (char === '"' && quoted && next === '"') {
      field += '"';
      index += 1;
    } else if (char === '"') {
      quoted = !quoted;
    } else if (char === ',' && !quoted) {
      row.push(field);
      field = '';
    } else if ((char === '\n' || char === '\r') && !quoted) {
      if (char === '\r' && next === '\n') index += 1;
      row.push(field);
      if (row.some((cell) => cell.trim())) rows.push(row);
      row = [];
      field = '';
    } else {
      field += char;
    }
  }

  if (field || row.length) {
    row.push(field);
    if (row.some((cell) => cell.trim())) rows.push(row);
  }
  return rows;
}

describe('Home V6 context command center contract', () => {
  it.each(V6_DATASETS)('reconciles the generated V6 pack and metadata dictionary for $clientKey', ({ clientKey, dir }) => {
    const root = path.join(process.cwd(), 'datasets', dir);
    const manifest = readJson<{
      datasetVersion: string;
      contractVersion: string;
      files: Array<{ file: string; businessObjectFamily: string; columns: number; rows: number; dataThinCells: number }>;
      totals: { files: number; rows: number; dataThinCells: number };
    }>(path.join(root, 'V6_GENERATED_MANIFEST.json'));
    const dictionaryPath = path.join(root, 'V6_BUSINESS_METADATA_DICTIONARY.csv');
    const dictionaryRows = parseCsvRows(readFileSync(dictionaryPath, 'utf8'));
    const headers = dictionaryRows[0];
    const body = dictionaryRows.slice(1);
    const metadataNameIndex = headers.indexOf('business_metadata_name');
    const familyIndex = headers.indexOf('business_object_family');
    const columnIndex = headers.indexOf('column_name');

    expect(manifest.datasetVersion).toBe('v6');
    expect(manifest.contractVersion).toBe('v6.0');
    expect(manifest.files).toHaveLength(16);
    expect(manifest.totals.files).toBe(16);
    expect(manifest.files.map((file) => file.businessObjectFamily)).toEqual(EXPECTED_FAMILIES);
    expect(manifest.files.reduce((sum, file) => sum + file.rows, 0)).toBe(manifest.totals.rows);
    expect(manifest.files.reduce((sum, file) => sum + file.dataThinCells, 0)).toBe(manifest.totals.dataThinCells);
    expect(body.length).toBeGreaterThan(400);
    expect(metadataNameIndex).toBeGreaterThanOrEqual(0);
    expect(familyIndex).toBeGreaterThanOrEqual(0);
    expect(columnIndex).toBeGreaterThanOrEqual(0);
    expect(body.every((row) => row[metadataNameIndex]?.trim())).toBe(true);
    expect(body.every((row) => row[familyIndex]?.trim())).toBe(true);
    expect(body.every((row) => row[columnIndex]?.trim())).toBe(true);

    for (const file of manifest.files) {
      expect(file.columns).toBeGreaterThanOrEqual(30);
      expect(file.rows).toBeGreaterThan(0);
      expect(existsSync(path.join(root, file.file))).toBe(true);
    }

    const viewModel = getEnterpriseLandscapeViewModel({ clientKey });
    expect(viewModel.contextCommandCenter.contractVersion).toBe('v6.0');
    expect(viewModel.contextCommandCenter.summaryMetrics).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ label: 'V6 files', value: '16' }),
        expect.objectContaining({ label: 'Business records' }),
        expect.objectContaining({ label: 'Metadata fields' }),
        expect.objectContaining({ label: 'Populated cells' }),
      ]),
    );
    expect(viewModel.contextCommandCenter.knownFacts.map((item) => item.label)).toEqual(
      expect.arrayContaining([
        'Business context substrate',
        'Relationships are explicit',
        'Industry and expert context',
        'AI/program inventory',
      ]),
    );
    expect(viewModel.contextCommandCenter.readinessAreas).toHaveLength(6);
    expect(viewModel.contextCommandCenter.answerBoundaries.map((item) => item.label)).toEqual(['Home', 'Intelligence', 'Tower / Moves / Source']);
  });
});
