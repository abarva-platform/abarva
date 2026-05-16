import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 30;

const EVENT_NAME = 'postgres_disruption_drill';

function expectedToken(): string | undefined {
  return process.env.L9_POSTGRES_DRILL_TOKEN?.trim()
    || process.env.AZURE_CONNECTIVITY_HEALTH_TOKEN?.trim()
    || process.env.INTERNAL_HEALTH_TOKEN?.trim()
    || undefined;
}

function authorized(request: NextRequest): boolean {
  const token = expectedToken();
  if (!token) return process.env.NODE_ENV !== 'production';
  return request.headers.get('x-abarva-l9-postgres-drill-token') === token
    || request.headers.get('x-abarva-health-token') === token;
}

export async function GET(request: NextRequest) {
  if (!authorized(request)) {
    return NextResponse.json({ error: 'not_found' }, { status: 404 });
  }

  return NextResponse.json({
    event: EVENT_NAME,
    status: 'degraded',
    ok: false,
    producedAt: new Date().toISOString(),
    checks: {
      postgres: false,
      direct_postgres: false,
      read_model: 'degraded',
    },
    degradation: {
      mode: 'protected_read_only',
      userMessage:
        'AbarVa is temporarily running in protected read-only mode while the database path recovers. Tenant data has not been changed; retry the action in a few minutes or continue from cached executive views.',
      dataChanged: false,
      retry: 'safe_to_retry_same_surface',
    },
    error: 'postgres_unavailable',
  }, {
    status: 503,
    headers: { 'Cache-Control': 'no-store' },
  });
}
