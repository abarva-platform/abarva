import { NextResponse } from 'next/server';
import {
  getDeploymentStatusGeneratedAt,
  getDeploymentStatusResults,
  summarizeDeploymentStatus,
} from '@/lib/admin/deployment-status-ingestion';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const DEPLOYMENT_STATUS_NO_STORE_HEADERS = {
  'Cache-Control': 'no-store, no-cache, must-revalidate',
  Pragma: 'no-cache',
  Expires: '0',
} as const;

/**
 * GET /api/admin/production-readiness/deployment-status
 *
 * V1 deployment status ingestion endpoint.
 *
 * - No call to any GitHub provider host.
 * - No call to any Vercel provider host.
 * - No model invocation.
 * - No auth changes.
 * - No token value is read into a variable, returned, or logged.
 *
 * When tokens are absent: returns 200 with liveStatus 'unavailable'.
 * When tokens are present: returns 200 with liveStatus 'configured'.
 * V1 deliberately never reports liveStatus 'live'.
 */
export async function GET() {
  const generatedAt = getDeploymentStatusGeneratedAt();
  const results = getDeploymentStatusResults(generatedAt);
  const signal = summarizeDeploymentStatus(results);

  return NextResponse.json(signal, { headers: DEPLOYMENT_STATUS_NO_STORE_HEADERS });
}
