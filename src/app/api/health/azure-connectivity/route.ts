import { NextRequest, NextResponse } from 'next/server';
import { buildAzureConnectivityConfig, redactSensitiveText } from '@/lib/azure-connectivity/config';
import { runAzureConnectivitySmoke } from '@/lib/azure-connectivity/smoke';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

function expectedToken(): string | undefined {
  return process.env.AZURE_CONNECTIVITY_HEALTH_TOKEN?.trim()
    || process.env.INTERNAL_HEALTH_TOKEN?.trim()
    || undefined;
}

function authorized(request: NextRequest): boolean {
  const token = expectedToken();
  if (!token) return process.env.NODE_ENV !== 'production';
  return request.headers.get('x-abarva-health-token') === token;
}

export async function GET(request: NextRequest) {
  if (!authorized(request)) {
    return NextResponse.json({ error: 'not_found' }, { status: 404 });
  }

  try {
    const report = await runAzureConnectivitySmoke(buildAzureConnectivityConfig());
    return NextResponse.json(report, {
      status: report.status === 'pass' ? 200 : 503,
      headers: { 'Cache-Control': 'no-store' },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({
      event: 'azure_connectivity_smoke',
      status: 'fail',
      producedAt: new Date().toISOString(),
      error: redactSensitiveText(message),
    }, {
      status: 503,
      headers: { 'Cache-Control': 'no-store' },
    });
  }
}
