import { scoreAnswer } from '@/lib/eval/answer-quality/scorer';
import { buildOutcomeLedgerView, type OutcomeLedgerRow } from '@/lib/tower/outcome-ledger';
import type { MoveBusinessCaseInput } from '../../../../move-business-case';
import { CHARTER_FUNCTION_PACK_KEY } from '../../../../function-identity';
import {
  buildMoveAuditPack,
  renderMoveAuditPackHtml,
} from '../../audit-pack';
import {
  buildQuarterlyBoardPack,
  renderBoardPackHtml,
} from '../index';
import {
  buildQuarterlyBoardPackInputFromLedger,
  deliverQuarterlyBoardPacks,
} from '../quarterly-delivery';

const GENERATED_ON = '2026-06-01';

const MOVE: MoveBusinessCaseInput = {
  industry_code: 'RETAIL',
  tenant_key: 'apexretail',
  tenant_name: 'Apex Retail',
  name: 'Reduce store labor overage without hurting service levels',
  charter: { [CHARTER_FUNCTION_PACK_KEY]: 'workforce_labor' },
  baseline_metrics: [
    {
      metric_name: 'Schedule adherence',
      value: 83,
      unit: 'percent',
      source: 'Workforce management baseline',
      as_of: '2026-05-01',
    },
  ],
};

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

describe('Wave 3 auto audit and board pack contract', () => {
  it('keeps the audit pack ten-section contract and plain-language gaps', () => {
    const pack = buildMoveAuditPack(MOVE, GENERATED_ON);
    expect(pack.bound).toBe(true);
    expect(pack.sections).toHaveLength(10);
    expect(pack.sections.map((section) => section.title)).toContain(
      'Vendor SOW and BAA chain',
    );
    const html = renderMoveAuditPackHtml(MOVE, GENERATED_ON);
    expect(html).toContain('Per-Move Audit Pack');
    expect(html).toContain('AI Governance attestation');
    expect(html).not.toMatch(/\bsignal:[0-9a-f-]{8,}/i);
    expect(html).not.toContain('tenant_id');
  });

  it('keeps the quarterly board pack eight-section contract and owner/time-in-state detail', () => {
    const ledger = buildOutcomeLedgerView('apexretail', [row()]);
    const input = buildQuarterlyBoardPackInputFromLedger({
      clientKey: 'apexretail',
      clientLabel: 'Apex Retail',
      quarter: 'Q2 2026',
      generatedOn: GENERATED_ON,
      ledger,
    });
    const pack = buildQuarterlyBoardPack(input);
    expect(pack.sections.map((section) => section.ordinal)).toEqual([
      '01',
      '02',
      '03',
      '04',
      '05',
      '06',
      '07',
      '08',
    ]);
    expect(pack.sections[3]?.title).toBe(
      'Blocked decisions with named owners and time in state',
    );
    expect(pack.sections[7]?.rows).toHaveLength(3);
    const html = renderBoardPackHtml(pack);
    expect(html).toContain('Top 3 questions for board attention');
    expect(html).not.toMatch(/\bsignal:[0-9a-f-]{8,}/i);
    expect(html).not.toContain('tenant_id');
  });

  it('proves the cron delivery path can send a scoped pack without leaking another client', async () => {
    const send = jest.fn().mockResolvedValue({ ok: true, providerMessageId: 'msg-1' });
    const result = await deliverQuarterlyBoardPacks(
      {
        clients: [
          {
            clientKey: 'apexretail',
            clientLabel: 'Apex Retail',
            recipients: ['cfo@example.com'],
          },
        ],
        quarter: 'Q2 2026',
        generatedOn: GENERATED_ON,
      },
      {
        readLedger: async (clientKey) =>
          buildOutcomeLedgerView(clientKey, [row({ tenantClientKey: clientKey })]),
        send,
      },
    );

    expect(result.ok).toBe(true);
    expect(result.sent).toBe(1);
    const payload = send.mock.calls[0]?.[0];
    expect(payload.html).toContain('Apex Retail');
    expect(payload.html).not.toContain('Meridian Health');
    expect(payload.html).not.toContain('SkyHarbor Air');
  });

  it('scores board-pack language higher when it is specific and action-oriented', () => {
    const good = scoreAnswer(
      'Apex Retail board pack shows $2.8M of committed value still needs evidence from the Tower ledger as of 2026-06-01. Next step: assign the CFO owner to bind the value evidence before the quarterly board review.',
      { questionId: 'wave3-good', tenantKey: 'apex-retail', surface: 'tower' },
    );
    const bad = scoreAnswer(
      'signal:39901c16-2e8b-4c8c-80aa-8a0182f26754 says the board pack is okay. Consider reviewing it.',
      { questionId: 'wave3-bad', tenantKey: 'apex-retail', surface: 'tower' },
    );
    expect(good.gatePassed).toBe(true);
    expect(bad.gatePassed).toBe(false);
    expect(good.overall).toBeGreaterThan(bad.overall);
  });
});
