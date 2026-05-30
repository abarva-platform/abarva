import {
  resetStructuredLogSinkForTests,
  setStructuredLogSinkForTests,
  writeStructuredLog,
} from '../structured-logger';

describe('structured logger', () => {
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

  it('emits JSON logs with tenant context', () => {
    const entry = writeStructuredLog('info', 'request_observed', {
      route: '/api/example',
      surface: '/programs',
      tenant: {
        activeClientKey: 'meridian',
        activeClientName: 'Meridian Health System',
      },
    });

    expect(sink.info).toHaveBeenCalledTimes(1);
    const payload = JSON.parse(sink.info.mock.calls[0]?.[0] as string);
    expect(payload).toMatchObject({
      level: 'info',
      event: 'request_observed',
      route: '/api/example',
      surface: '/programs',
      tenant: {
        activeClientKey: 'meridian',
        activeClientName: 'Meridian Health System',
      },
    });
    expect(payload.timestamp).toEqual(entry.timestamp);
  });

  it('routes warnings and strips empty context values', () => {
    writeStructuredLog('warn', 'tenant_bleed_attempt_blocked', {
      tenant: {
        activeClientKey: 'meridian',
        requestedClientKey: null,
      },
      metadata: {
        blocked: true,
        ignored: undefined,
      },
    });

    expect(sink.warn).toHaveBeenCalledTimes(1);
    const payload = JSON.parse(sink.warn.mock.calls[0]?.[0] as string);
    expect(payload.tenant).toEqual({ activeClientKey: 'meridian' });
    expect(payload.metadata).toEqual({ blocked: true });
  });
});
