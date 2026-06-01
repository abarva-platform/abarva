import { assertEvidenceLedgerReady, composeEvidenceLedger } from '../composer';

describe('composeEvidenceLedger', () => {
  it('composes a complete ledger with freshness and clamped confidence', () => {
    const ledger = composeEvidenceLedger({
      now: new Date('2026-05-31T00:00:00Z'),
      owner: 'VP Data',
      confidence: 105,
      dataUsed: [
        {
          substrateId: 'apex-labor-baseline',
          label: 'Apex labor baseline',
          sourceTable: 'program_metrics',
          rowCount: 12,
          asOf: '2026-05-25T00:00:00Z',
        },
      ],
    });

    expect(ledger.confidence).toBe(100);
    expect(ledger.freshness).toBe('fresh');
    expect(assertEvidenceLedgerReady(ledger)).toEqual({ passed: true, reasons: [] });
  });

  it('makes missing data explicit instead of implying confidence', () => {
    const ledger = composeEvidenceLedger({
      dataMissing: [
        {
          requiredFor: 'customer trust answer',
          gapDescription: 'Complaint baseline is not loaded.',
          nextLoadStep: 'Load the complaint metric feed for the active client.',
        },
      ],
    });

    expect(ledger.confidence).toBe(0);
    expect(ledger.freshness).toBe('stale');
    expect(assertEvidenceLedgerReady(ledger).passed).toBe(true);
  });
});
