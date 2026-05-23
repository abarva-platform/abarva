import type { InstrumentTemplateRecord } from '../types';

jest.mock('../authoring', () => ({
  getInstrumentTemplate: jest.fn(),
}));

jest.mock('../db', () => ({
  withInstrumentClient: jest.fn(async () => {
    throw new Error('DATABASE_URL missing in render unit test');
  }),
}));

const template: InstrumentTemplateRecord = {
  id: 'instrument-1',
  clientId: null,
  slug: 'repo-telemetry',
  name: 'Repo telemetry spec',
  category: 'discovery',
  status: 'published',
  version: 2,
  parentVersionId: null,
  depthScore: 10,
  format: 'csv',
  schema: {
    properties: {
      app_id: { type: 'string' },
      repository_url: { type: 'string' },
      owner: { type: 'string' },
    },
    required: ['app_id', 'repository_url'],
  },
  contentTemplateText: 'Instrument [instrument_slug] for [client_id] using [application_column_hints].',
  contentBlobRef: null,
  sampleSizeMath: { confidence: '95%', minimum_n: 30 },
  biasControls: { selection: 'stratified' },
  privacyBlock: 'Privacy and consent: anonymization-at-source required.',
  validationRules: { required: ['repository_url'] },
  triangulationPlan: { cross_checks: ['DORA'] },
  edgeCaseGuide: { mainframe: 'manual repo mapping' },
  refreshCadence: 'Quarterly',
  tTier: 2,
  ownerRole: 'DevEx Analyst',
  timeToCompleteDays: 5,
  verticalOverlays: [],
  primaryAuthorId: 'user-1',
  approvedById: 'user-2',
  publishedAt: '2026-05-23T00:00:00Z',
  retiredAt: null,
  createdAt: '2026-05-23T00:00:00Z',
  updatedAt: '2026-05-23T00:00:00Z',
};

describe('renderInstrument', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders CSV, SQL, and interactive form outputs deterministically', async () => {
    const { getInstrumentTemplate } = await import('../authoring');
    jest.mocked(getInstrumentTemplate).mockResolvedValue(template);
    const { renderInstrument } = await import('../render');

    const csv = await renderInstrument('instrument-1', 2, 'client-1', 'csv');
    expect(csv.contentType).toContain('text/csv');
    expect(String(csv.bytes)).toContain('client_id');
    expect(String(csv.bytes)).toContain('application_column_hints');

    const sql = await renderInstrument('instrument-1', 2, 'client-1', 'sql');
    expect(String(sql.bytes)).toContain('$1::uuid = client_id');
    expect(String(sql.bytes)).toContain('Instrument repo-telemetry for client-1');

    const form = await renderInstrument('instrument-1', 2, 'client-1', 'interactive_form');
    const parsed = JSON.parse(String(form.bytes)) as { title: string; metadata: { instrumentId: string } };
    expect(parsed.title).toBe('Repo telemetry spec');
    expect(parsed.metadata.instrumentId).toBe('instrument-1');
  });

  it('renders DOCX as bytes', async () => {
    const { getInstrumentTemplate } = await import('../authoring');
    jest.mocked(getInstrumentTemplate).mockResolvedValue(template);
    const { renderInstrument } = await import('../render');

    const docx = await renderInstrument('instrument-1', 2, 'client-1', 'docx');
    expect(Buffer.isBuffer(docx.bytes)).toBe(true);
    expect((docx.bytes as Buffer).byteLength).toBeGreaterThan(100);
  });
});
