import type { OutcomeLedgerRow } from '@/lib/tower/outcome-ledger';
import { buildOutcomeLedgerView } from '@/lib/tower/outcome-ledger';
import {
  buildQuarterlyBoardPackInputFromLedger,
  currentQuarter,
  deliverQuarterlyBoardPacks,
  emptyOutcomeLedger,
  parseBoardPackClientConfig,
} from '../quarterly-delivery';

function row(overrides: Partial<OutcomeLedgerRow> = {}): OutcomeLedgerRow {
  return {
    id: 'ol-1',
    supersedesEntryId: null,
    isCurrent: true,
    tenantClientKey: 'apexretail',
    clientId: 'client-1',
    subjectKind: 'move',
    subjectRef: 'move-1',
    subjectLabel: 'AI Store Labor',
    valueRung: 'projected_only',
    valueCategory: 'productivity',
    measurementUnit: 'usd_seed',
    projectedAmount: 1_000_000,
    realizedAmount: null,
    baselineAmount: null,
    counterfactualConfidence: 'medium',
    governanceReviewStatus: 'not_started',
    measurementOwnerRole: 'VP Stores',
    evidencePointer: null,
    evidenceClaimIds: [],
    note: null,
    recordedBy: 'svc',
    recordedAt: '2026-06-01T00:00:00.000Z',
    ...overrides,
  };
}

describe('quarterly board-pack delivery config', () => {
  it('parses client recipient JSON and normalizes email case', () => {
    expect(
      parseBoardPackClientConfig(
        JSON.stringify([
          {
            clientKey: 'apexretail',
            clientLabel: 'Apex Retail',
            recipients: [' CFO@EXAMPLE.COM ', ''],
          },
        ]),
      ),
    ).toEqual([
      {
        clientKey: 'apexretail',
        clientLabel: 'Apex Retail',
        recipients: ['cfo@example.com'],
      },
    ]);
  });

  it('computes the UTC quarter label', () => {
    expect(currentQuarter(new Date('2026-04-15T12:00:00Z'))).toBe('Q2 2026');
  });
});

describe('buildQuarterlyBoardPackInputFromLedger', () => {
  it('turns scoped Tower ledger rows into board-pack input without inventing owners', () => {
    const ledger = buildOutcomeLedgerView('apexretail', [row()]);
    const input = buildQuarterlyBoardPackInputFromLedger({
      clientKey: 'apexretail',
      clientLabel: 'Apex Retail',
      quarter: 'Q2 2026',
      generatedOn: '2026-06-01',
      ledger,
    });
    expect(input.moves[0]?.name).toBe('AI Store Labor');
    expect(input.moves[0]?.owner).toBe('VP Stores');
    expect(input.patterns[0]?.pattern).toBe('Evidence gap on value claim');
    expect(input.topQuestions).toHaveLength(3);
  });
});

describe('deliverQuarterlyBoardPacks', () => {
  it('sends one board pack per configured recipient', async () => {
    const send = jest.fn().mockResolvedValue({ ok: true, providerMessageId: 'resend-1' });
    const result = await deliverQuarterlyBoardPacks(
      {
        clients: [
          {
            clientKey: 'apexretail',
            clientLabel: 'Apex Retail',
            recipients: ['cfo@example.com', 'cio@example.com'],
          },
        ],
        quarter: 'Q2 2026',
        generatedOn: '2026-06-01',
      },
      {
        readLedger: async () => buildOutcomeLedgerView('apexretail', [row()]),
        send,
        nowMs: () => 100,
      },
    );
    expect(result.generated).toBe(1);
    expect(result.attempted).toBe(2);
    expect(result.sent).toBe(2);
    expect(send).toHaveBeenCalledTimes(2);
    expect(send.mock.calls[0]?.[0].subject).toContain('Apex Retail Q2 2026 Board Pack');
  });

  it('skips clients with no recipients instead of pretending to send', async () => {
    const result = await deliverQuarterlyBoardPacks(
      {
        clients: [{ clientKey: 'apexretail', clientLabel: 'Apex Retail', recipients: [] }],
        quarter: 'Q2 2026',
        generatedOn: '2026-06-01',
      },
      { readLedger: async () => emptyOutcomeLedger('apexretail') },
    );
    expect(result.generated).toBe(0);
    expect(result.skipped).toBe(1);
    expect(result.sent).toBe(0);
  });

  it('surfaces provider failure in the result', async () => {
    const result = await deliverQuarterlyBoardPacks(
      {
        clients: [
          {
            clientKey: 'apexretail',
            clientLabel: 'Apex Retail',
            recipients: ['bad@example.com'],
          },
        ],
        quarter: 'Q2 2026',
        generatedOn: '2026-06-01',
      },
      {
        readLedger: async () => buildOutcomeLedgerView('apexretail', [row()]),
        send: async () => ({ ok: false, reason: 'invalid_recipient', retryable: false }),
      },
    );
    expect(result.ok).toBe(false);
    expect(result.failed).toBe(1);
    expect(result.sends[0]?.reason).toBe('invalid_recipient');
  });
});
