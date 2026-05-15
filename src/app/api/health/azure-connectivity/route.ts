// GET /api/health/azure-connectivity — L2 Azure full-stack smoke.
//
// Returns pass/fail JSON for every private dependency the runtime is
// supposed to reach through its intended lane. Admin-gated so probe
// internals do not leak to anonymous traffic. See
// docs/architecture/azure/AZURE-FULL-STACK-TEST-LAYERS.md#l2.

import { NextResponse } from 'next/server';
import { handleAzureConnectivity } from '@/lib/health/azure-connectivity-route-helpers';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 30;

export async function GET(): Promise<NextResponse> {
  return handleAzureConnectivity({});
}
