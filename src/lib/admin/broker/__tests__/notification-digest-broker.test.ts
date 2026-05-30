/**
 * W5-PR-3 · Daily digest assembler tests.
 */

jest.mock('@/lib/data-plane/azureRead', () => ({
  azureRead: {
    query: jest.fn(),
  },
}));

import {
  buildDailyDigestPayload,
  isDailyDigestSendWindow,
} from '../notification-digest-broker';
import { azureRead } from '@/lib/data-plane/azureRead';

const queryMock = azureRead.query as unknown as jest.Mock;

beforeEach(() => {
  jest.clearAllMocks();
});

describe('isDailyDigestSendWindow', () => {
  it('matches 08:00 in the tenant timezone', () => {
    expect(
      isDailyDigestSendWindow({
        now: new Date('2026-05-30T13:00:00Z'),
        tenantTimezone: 'America/Chicago',
      }),
    ).toBe(true);
  });

  it('rejects non-window minutes', () => {
    expect(
      isDailyDigestSendWindow({
        now: new Date('2026-05-30T13:05:00Z'),
        tenantTimezone: 'America/Chicago',
      }),
    ).toBe(false);
  });
});

describe('buildDailyDigestPayload', () => {
  it('assembles counts, window, and top events from notification_events', async () => {
    queryMock.mockResolvedValueOnce([
      {
        event_type: 'connector.failed',
        source_module: 'setup',
        severity: 'critical',
        payload: { connectorName: 'Snowflake sales mart' },
        created_at: '2026-05-30T12:10:00Z',
      },
      {
        event_type: 'program.gate_decision',
        source_module: 'moves',
        severity: 'info',
        payload: { programName: 'Demand Forecasting Refresh' },
        created_at: '2026-05-30T11:10:00Z',
      },
      {
        event_type: 'policy.updated',
        source_module: 'setup',
        severity: 'warn',
        payload: { title: 'Policy updated' },
        created_at: '2026-05-30T10:10:00Z',
      },
    ]);

    const payload = await buildDailyDigestPayload({
      tenantId: 'tenant-1',
      tenantTimezone: 'America/Chicago',
      now: new Date('2026-05-30T13:00:00Z'),
      eventId: 'digest-event-1',
    });

    expect(payload).toMatchObject({
      eventId: 'digest-event-1',
      tenantId: 'tenant-1',
      tenantTimezone: 'America/Chicago',
      periodStartIso: '2026-05-29T13:00:00.000Z',
      periodEndIso: '2026-05-30T13:00:00.000Z',
      totalEvents: 3,
      criticalCount: 1,
      warningCount: 1,
      moduleCounts: { setup: 2, moves: 1 },
      ctaHref: '/admin/inbox',
    });
    expect(payload.topEvents.map((event) => event.title)).toEqual([
      'Snowflake sales mart',
      'Demand Forecasting Refresh',
      'Policy updated',
    ]);
    expect(queryMock.mock.calls[0]?.[1]).toEqual([
      'tenant-1',
      '2026-05-29T13:00:00.000Z',
      '2026-05-30T13:00:00.000Z',
      50,
    ]);
  });

  it('returns an empty digest when the event table is absent or empty', async () => {
    queryMock.mockResolvedValueOnce([]);

    const payload = await buildDailyDigestPayload({
      tenantId: 'tenant-1',
      now: new Date('2026-05-30T13:00:00Z'),
    });

    expect(payload.totalEvents).toBe(0);
    expect(payload.topEvents).toEqual([]);
    expect(payload.moduleCounts).toEqual({});
  });
});
