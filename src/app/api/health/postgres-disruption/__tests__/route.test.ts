import { NextRequest } from 'next/server';
import { GET } from '../route';

describe('/api/health/postgres-disruption', () => {
  const originalEnv = { ...process.env };

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  function request(token?: string): NextRequest {
    return new NextRequest('http://localhost/api/health/postgres-disruption', {
      headers: token ? { 'x-abarva-l9-postgres-drill-token': token } : undefined,
    });
  }

  function setNodeEnv(value: string): void {
    Object.defineProperty(process.env, 'NODE_ENV', {
      value,
      configurable: true,
      writable: true,
    });
  }

  it('hides the drill behind the health token in production', async () => {
    setNodeEnv('production');
    process.env.L9_POSTGRES_DRILL_TOKEN = 'drill-token';

    const response = await GET(request());
    const body = await response.json();

    expect(response.status).toBe(404);
    expect(body).toEqual({ error: 'not_found' });
  });

  it('returns an executive-safe degraded response when authorized', async () => {
    setNodeEnv('production');
    process.env.L9_POSTGRES_DRILL_TOKEN = 'drill-token';

    const response = await GET(request('drill-token'));
    const body = await response.json();

    expect(response.status).toBe(503);
    expect(body).toMatchObject({
      event: 'postgres_disruption_drill',
      status: 'degraded',
      ok: false,
      checks: {
        postgres: false,
        direct_postgres: false,
        read_model: 'degraded',
      },
      degradation: {
        mode: 'protected_read_only',
        dataChanged: false,
        retry: 'safe_to_retry_same_surface',
      },
      error: 'postgres_unavailable',
    });
    expect(body.degradation.userMessage).toContain('protected read-only mode');
    expect(body.degradation.userMessage).toContain('Tenant data has not been changed');
  });

  it('does not leak raw connection strings, stack traces, or driver internals', async () => {
    setNodeEnv('production');
    process.env.L9_POSTGRES_DRILL_TOKEN = 'drill-token';

    const response = await GET(request('drill-token'));
    const bodyText = JSON.stringify(await response.json());

    expect(bodyText).not.toMatch(/postgresql:\/\//i);
    expect(bodyText).not.toMatch(/DATABASE_URL/i);
    expect(bodyText).not.toMatch(/ECONNREFUSED|ENOTFOUND|ETIMEDOUT/i);
    expect(bodyText).not.toMatch(/\bat\s+.+route/i);
  });

  it('also accepts the shared azure health token header', async () => {
    setNodeEnv('production');
    process.env.AZURE_CONNECTIVITY_HEALTH_TOKEN = 'shared-token';

    const response = await GET(
      new NextRequest('http://localhost/api/health/postgres-disruption', {
        headers: { 'x-abarva-health-token': 'shared-token' },
      }),
    );

    expect(response.status).toBe(503);
  });
});
