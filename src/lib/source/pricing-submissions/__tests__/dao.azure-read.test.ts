import {
  listActiveSubmissionsForEvent,
  listAllSubmissionsForEvent,
} from '../dao';
import { azureRead } from '@/lib/data-plane/azureRead';

jest.mock('@/lib/data-plane/azureRead', () => ({
  azureRead: {
    query: jest.fn(),
  },
}));

jest.mock('@/lib/data-plane/postgresCompat', () => ({
  getAzureWriteFluentClient: jest.fn(),
}));

const queryMock = azureRead.query as jest.MockedFunction<typeof azureRead.query>;

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

  it('degrades to an empty list when azureRead fails', async () => {
    queryMock.mockRejectedValueOnce(new Error('connection refused'));

    await expect(listActiveSubmissionsForEvent('event-1')).resolves.toEqual([]);
  });
});
