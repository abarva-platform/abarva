import type { VendorContractInput } from '@/lib/source/decision-queue/detector-inputs';
import {
  buildRenewalCockpit,
  type RenewalCockpitInput,
} from '@/lib/source/renewal-cockpit/cockpit';
import { buildExecutionRoom, NOT_RECORDED } from '../execution-room';

const AS_OF = new Date('2026-05-17T00:00:00Z');

function isoOffset(days: number): string {
  const d = new Date(AS_OF);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

function contract(overrides: Partial<VendorContractInput> = {}): VendorContractInput {
  return {
    contractId: 'vendor_contracts:apex-servicenow-itsm',
    vendorName: 'ServiceNow',
    product: 'IT Service Management',
    category: 'itsm',
    annualSpendUsd: 690_000,
    termEndDate: isoOffset(58),
    autoRenew: true,
    noticePeriodDays: 45,
    utilizationRate: 0.88,
    criticality: 'high',
    ...overrides,
  };
}

function cockpitInput(overrides: Partial<RenewalCockpitInput> = {}): RenewalCockpitInput {
  return {
    clientKey: 'apex-retail',
    contract: contract(),
    categoryBenchmarkUsd: 700_000,
    alternatives: [],
    asOf: AS_OF,
    ...overrides,
  };
}

describe('buildExecutionRoom', () => {
  it('turns the ServiceNow renewal into an at-risk execution room', () => {
    const room = buildExecutionRoom(buildRenewalCockpit(cockpitInput()), AS_OF);

    expect(room.status).toBe('at_risk');
    expect(room.recommendedPosture).toBe('renegotiate');
    expect(room.daysToNoticeDeadline).toBe(13);
    expect(room.noticeDeadlineDate).toBe(isoOffset(13));
    expect(room.accountableOwner).toBe(NOT_RECORDED);
    expect(room.nextBestAction).toMatch(/Serve notice/i);
  });

  it('puts serve-notice first with the notice deadline and evidence refs', () => {
    const room = buildExecutionRoom(buildRenewalCockpit(cockpitInput()), AS_OF);

    expect(room.actions[0]).toMatchObject({
      actionId: 'serve-notice',
      kind: 'serve_notice',
      dueDate: isoOffset(13),
      daysUntilDue: 13,
      status: 'not_started',
    });
    expect(room.actions[0].evidenceRefs).toContain('vendor_contracts:apex-servicenow-itsm');
    expect(room.actions[0].linkedAction.type).toBe('pending');
  });

  it('keeps owner unknown rather than fabricating an accountable person', () => {
    const room = buildExecutionRoom(buildRenewalCockpit(cockpitInput()), AS_OF);
    const assign = room.actions.find((a) => a.actionId === 'assign-owner');

    expect(assign).toBeDefined();
    expect(assign?.owner).toBe(NOT_RECORDED);
    expect(assign?.evidenceBasis).toMatch(/No accountable renewal owner/i);
    expect(room.approvals.every((a) => a.owner === NOT_RECORDED)).toBe(true);
  });

  it('uses the contract owner when the cockpit substrate carries one', () => {
    const room = buildExecutionRoom(
      buildRenewalCockpit(
        cockpitInput({
          contract: contract({ ownerRef: 'person:apex:it-operations' }),
        }),
      ),
      AS_OF,
    );
    const assign = room.actions.find((a) => a.actionId === 'assign-owner');

    expect(assign?.owner).toBe('person:apex:it-operations');
    expect(assign?.evidenceBasis).toMatch(/Owner person:apex:it-operations/i);
    expect(room.accountableOwner).toBe('person:apex:it-operations');
  });

  it('includes finance, legal, security, sponsor and IT approval rows', () => {
    const room = buildExecutionRoom(buildRenewalCockpit(cockpitInput()), AS_OF);

    expect(room.approvals.map((a) => a.role)).toEqual([
      'finance',
      'legal',
      'security',
      'business_sponsor',
      'it_owner',
    ]);
  });

  it('uses market-test-first rebid readiness when no credible alternative exists', () => {
    const room = buildExecutionRoom(buildRenewalCockpit(cockpitInput()), AS_OF);

    expect(room.rebidReadiness).toMatchObject({
      recommended: false,
      verdict: 'market_test_first',
    });
    expect(room.rebidReadiness.blockers).toContain('No credible alternative recorded');
  });

  it('carries an execution-grade evidence pack', () => {
    const room = buildExecutionRoom(buildRenewalCockpit(cockpitInput()), AS_OF);

    expect(room.evidencePack.map((e) => e.label)).toEqual([
      'Current spend',
      'Should-cost / benchmark',
      'Notice period',
      'Usage',
      'Leverage',
    ]);
    expect(room.evidencePack[1].evidenceRefs).toContain('it_financials');
  });

  it('marks missing notice period on an auto-renewal as blocked', () => {
    const room = buildExecutionRoom(
      buildRenewalCockpit(
        cockpitInput({
          contract: contract({ noticePeriodDays: null }),
        }),
      ),
      AS_OF,
    );

    expect(room.status).toBe('blocked');
    expect(room.statusRationale).toMatch(/notice period is not recorded/i);
  });

  it('is deterministic for identical input', () => {
    const cockpit = buildRenewalCockpit(cockpitInput());

    expect(buildExecutionRoom(cockpit, AS_OF)).toEqual(buildExecutionRoom(cockpit, AS_OF));
  });
});
