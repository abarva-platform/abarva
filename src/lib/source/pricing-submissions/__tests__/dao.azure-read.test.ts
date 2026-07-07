import {
  insertSubmission,
  listActiveSubmissionsForEvent,
  listAllSubmissionsForEvent,
} from '../dao';
import { azureRead } from '@/lib/data-plane/azureRead';
import { getAzureWriteFluentClient } from '@/lib/data-plane/postgresCompat';

jest.mock('@/lib/data-plane/azureRead', () => ({
  azureRead: {
    query: jest.fn(),
  },
}));

jest.mock('@/lib/data-plane/postgresCompat', () => ({
  getAzureWriteFluentClient: jest.fn(),
}));

const queryMock = azureRead.query as jest.MockedFunction<typeof azureRead.query>;
const writeClientFactoryMock =
  getAzureWriteFluentClient as jest.MockedFunction<typeof getAzureWriteFluentClient>;

const baseRow = {
  id: 'submission-1',
  source_event_id: 'event-1',
  tenant_key: 'apexretail',
  vendor_name: 'Wipro',
  submitted_at: '2026-05-28T12:00:00.000Z',
  uploaded_by_user_id: 'user-1',
  uploaded_filename: 'wipro-pricing.xlsx',
  unit_prices_by_id: { L1: 125 },
  vendor_notes_by_id: { L1: 'Includes transition support.' },
  pricing_notes: 'Standard three-year term.',
  assumption_deviations: [
    {
      assumptionKey: 'Term horizon',
      proposedAlternative: 'Vendor proposes a five-year term.',
      severity: 'medium',
    },
  ],
  parse_status: 'parsed',
  parse_warnings: [],
  superseded_by: null,
  created_at: '2026-05-28T12:00:00.000Z',
  updated_at: '2026-05-28T12:00:00.000Z',
} as const;

describe('pricing submission read DAO through azureRead', () => {
  beforeEach(() => {
    queryMock.mockReset();
    writeClientFactoryMock.mockReset();
  });

  it('reads active non-superseded submissions through azureRead', async () => {
    queryMock.mockResolvedValueOnce([baseRow]);

    await expect(listActiveSubmissionsForEvent('event-1')).resolves.toEqual([
      {
        id: 'submission-1',
        sourceEventId: 'event-1',
        tenantKey: 'apexretail',
        vendorName: 'Wipro',
        submittedAt: '2026-05-28T12:00:00.000Z',
        uploadedByUserId: 'user-1',
        uploadedFilename: 'wipro-pricing.xlsx',
        unitPricesById: { L1: 125 },
        vendorNotesById: { L1: 'Includes transition support.' },
        pricingNotes: 'Standard three-year term.',
        assumptionDeviations: [
          {
            assumptionKey: 'Term horizon',
            proposedAlternative: 'Vendor proposes a five-year term.',
            severity: 'medium',
          },
        ],
        parseStatus: 'parsed',
        parseWarnings: [],
        supersededBy: null,
        createdAt: '2026-05-28T12:00:00.000Z',
        updatedAt: '2026-05-28T12:00:00.000Z',
      },
    ]);
    expect(queryMock).toHaveBeenCalledWith(
      `SELECT * FROM source_event_pricing_submissions
        WHERE source_event_id = $1 AND superseded_by IS NULL
        ORDER BY vendor_name ASC`,
      ['event-1'],
      { missingTable: 'empty' },
    );
  });

  it('reads full submission history through azureRead newest first', async () => {
    queryMock.mockResolvedValueOnce([
      { ...baseRow, id: 'submission-2', superseded_by: 'submission-3' },
      baseRow,
    ]);

    const rows = await listAllSubmissionsForEvent('event-1');

    expect(rows.map((row) => row.id)).toEqual(['submission-2', 'submission-1']);
    expect(queryMock).toHaveBeenCalledWith(
      `SELECT * FROM source_event_pricing_submissions
        WHERE source_event_id = $1
        ORDER BY submitted_at DESC`,
      ['event-1'],
      { missingTable: 'empty' },
    );
  });

  it('normalizes Postgres Date timestamp fields to ISO strings for renderers', async () => {
    const submittedAt = new Date('2026-05-28T12:00:00.000Z');
    const createdAt = new Date('2026-05-28T12:01:00.000Z');
    const updatedAt = new Date('2026-05-28T12:02:00.000Z');
    queryMock.mockResolvedValueOnce([
      {
        ...baseRow,
        submitted_at: submittedAt,
        created_at: createdAt,
        updated_at: updatedAt,
      },
    ]);

    await expect(listActiveSubmissionsForEvent('event-1')).resolves.toMatchObject([
      {
        submittedAt: submittedAt.toISOString(),
        createdAt: createdAt.toISOString(),
        updatedAt: updatedAt.toISOString(),
      },
    ]);
  });

  it('degrades to an empty list when azureRead fails', async () => {
    queryMock.mockRejectedValueOnce(new Error('connection refused'));

    await expect(listActiveSubmissionsForEvent('event-1')).resolves.toEqual([]);
  });

  it('serializes structured insert payloads as JSONB strings for the Postgres compat writer', async () => {
    let capturedInsertPayload: Record<string, unknown> | null = null;
    const updateSelectMock = jest.fn().mockResolvedValue({ data: [], error: null });
    const updateChain = {
      eq: jest.fn().mockReturnThis(),
      is: jest.fn().mockReturnThis(),
      neq: jest.fn().mockReturnThis(),
      select: updateSelectMock,
    };
    const insertChain = {
      select: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({
        data: baseRow,
        error: null,
      }),
    };
    const fromMock = jest.fn().mockImplementation(() => ({
      insert: jest.fn((payload: Record<string, unknown>) => {
        capturedInsertPayload = payload;
        return insertChain;
      }),
      update: jest.fn(() => updateChain),
    }));
    writeClientFactoryMock.mockReturnValue({
      from: fromMock,
    } as unknown as ReturnType<typeof getAzureWriteFluentClient>);

    await expect(
      insertSubmission({
        sourceEventId: 'event-1',
        tenantKey: 'apexretail',
        vendorName: 'Wipro',
        uploadedByUserId: 'user-1',
        uploadedFilename: 'wipro-pricing.xlsx',
        unitPricesById: { L1: 125 },
        vendorNotesById: { L1: 'Includes transition support.' },
        pricingNotes: 'Standard three-year term.',
        assumptionDeviations: [
          {
            assumptionKey: 'Term horizon',
            proposedAlternative: 'Vendor proposes a five-year term.',
            severity: 'medium',
          },
        ],
        parseStatus: 'parsed',
        parseWarnings: [],
      }),
    ).resolves.toMatchObject({ ok: true, supersededCount: 0 });

    expect(capturedInsertPayload).toMatchObject({
      unit_prices_by_id: JSON.stringify({ L1: 125 }),
      vendor_notes_by_id: JSON.stringify({ L1: 'Includes transition support.' }),
      assumption_deviations: JSON.stringify([
        {
          assumptionKey: 'Term horizon',
          proposedAlternative: 'Vendor proposes a five-year term.',
          severity: 'medium',
        },
      ]),
      parse_warnings: JSON.stringify([]),
    });
  });
});
