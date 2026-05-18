import { buildRenewalCockpit } from '@/lib/source/renewal-cockpit/cockpit';
import type { VendorContractInput } from '@/lib/source/decision-queue/detector-inputs';
import { buildExecutionRoom, NOT_RECORDED } from '@/lib/source/execution-room/execution-room';
import { channelsForNotification, routeNotification, toBellItem } from '../policy';
import { buildNotificationEmail } from '../email';
import {
  buildSourceDecisionQueueNotifications,
  buildSourceExecutionRoomNotifications,
} from '../source-execution-room';

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

function executionRoom(overrides: Partial<VendorContractInput> = {}) {
  return buildExecutionRoom(
    buildRenewalCockpit({
      clientKey: 'apex-retail',
      contract: contract(overrides),
      categoryBenchmarkUsd: 700_000,
      alternatives: [],
      asOf: AS_OF,
    }),
    AS_OF,
  );
}

describe('platform notification policy', () => {
  it('routes critical events to immediate email and escalation', () => {
    const [event] = buildSourceExecutionRoomNotifications(
      executionRoom({ termEndDate: isoOffset(46) }),
    );

    expect(event.severity).toBe('critical');
    const policy = routeNotification(event);
    expect(policy.channels).toEqual(['in_app', 'email_now']);
    expect(policy.interrupt).toBe(true);
    expect(policy.escalationAfterHours).toBe(4);
  });

  it('routes next-14-day notice windows as urgent in-app plus email', () => {
    const events = buildSourceExecutionRoomNotifications(executionRoom());
    const notice = events.find((event) => event.sourceEventType === 'source.renewal.notice_window');

    expect(notice).toBeDefined();
    expect(notice?.severity).toBe('urgent');
    expect(channelsForNotification(notice!)).toContain('email_now');
    expect(toBellItem(notice!).kind).toBe('source-alert');
  });

  it('creates an owner-gap alert without fabricating a person', () => {
    const events = buildSourceExecutionRoomNotifications(executionRoom());
    const ownerGap = events.find((event) => event.sourceEventType === 'source.renewal.owner_missing');

    expect(ownerGap).toBeDefined();
    expect(ownerGap?.title).toMatch(/no accountable owner/i);
    expect(ownerGap?.audience[0]).toMatchObject({ kind: 'role', ref: 'source_vp' });
    expect(executionRoom().accountableOwner).toBe(NOT_RECORDED);
  });

  it('builds email bodies from the notification contract', () => {
    const [event] = buildSourceExecutionRoomNotifications(executionRoom());
    const message = buildNotificationEmail(event, 'vp@example.com');

    expect(message.to).toBe('vp@example.com');
    expect(message.subject).toContain(event.title);
    expect(message.html).toContain('Open in AbarVa');
    expect(message.metadata).toMatchObject({
      Event: event.sourceEventType,
      TenantKey: 'apex-retail',
      Module: 'source',
    });
  });

  it('keeps long-horizon Source queue items out of the interrupt feed', () => {
    const events = buildSourceDecisionQueueNotifications([
      {
        bundleId: 'bundle:watch',
        clientKey: 'apex-retail',
        contractId: 'watch',
        vendorName: 'WatchVendor',
        urgency: 'watch',
        headline: 'WatchVendor renewal in 180 days',
        summary: 'Long horizon.',
        posture: 'review',
        recommendedAction: 'Monitor in queue.',
        deepLink: '/source/renewal/watch',
        subIssues: [],
        evidenceRefs: ['watch'],
        valueAtStakeUsd: 100,
        surfacedAt: AS_OF.toISOString(),
        accountability: null,
      },
      {
        bundleId: 'bundle:urgent',
        clientKey: 'apex-retail',
        contractId: 'urgent',
        vendorName: 'UrgentVendor',
        urgency: 'next_14_days',
        headline: 'UrgentVendor notice due in 9 days',
        summary: 'Near-term.',
        posture: 'renegotiate',
        recommendedAction: 'Serve notice.',
        deepLink: '/source/renewal/urgent',
        subIssues: [],
        evidenceRefs: ['urgent'],
        valueAtStakeUsd: 200,
        surfacedAt: AS_OF.toISOString(),
        accountability: null,
      },
    ]);

    expect(events).toHaveLength(1);
    expect(events[0].title).toContain('UrgentVendor');
    expect(events[0].severity).toBe('urgent');
  });
});
