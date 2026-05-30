import { detectCrossTenantWriteIntent } from '@/lib/agent/tenant-guardrails';
import {
  resetStructuredLogSinkForTests,
  setStructuredLogSinkForTests,
} from '../structured-logger';
import { recordTenantBleedAlert } from '../tenant-bleed-alerts';

describe('tenant bleed alerts', () => {
  const sink = {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    setStructuredLogSinkForTests(sink);
  });

  afterEach(() => {
    resetStructuredLogSinkForTests();
  });

  it('logs a simulated cross-tenant write attempt with both tenant scopes', () => {
    const intent = detectCrossTenantWriteIntent({
      activeClientKey: 'meridian',
      activeClientName: 'Meridian Health System',
      message: 'create this same program for Apex Retail and use the Apex CIO as sponsor',
    });

    expect(intent).not.toBeNull();
    recordTenantBleedAlert({
      intent: intent!,
      route: '/api/chat/agent',
      surface: '/programs/new',
      metadata: { testSimulation: true },
    });

    expect(sink.warn).toHaveBeenCalledTimes(1);
    const payload = JSON.parse(sink.warn.mock.calls[0]?.[0] as string);
    expect(payload).toMatchObject({
      level: 'warn',
      event: 'tenant_bleed_attempt_blocked',
      route: '/api/chat/agent',
      surface: '/programs/new',
      tenant: {
        activeClientKey: 'meridian',
        activeClientName: 'Meridian Health System',
        requestedClientKey: 'apexretail',
        requestedClientName: 'Apex Retail Group',
      },
      metadata: {
        blocked: true,
        alertKind: 'tenant_bleed',
        testSimulation: true,
      },
    });
  });
});
