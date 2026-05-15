// GET /api/health/azure-connectivity/[lane] — per-lane L2 smoke.
//
// `lane` ∈ control | private-data | intelligence-model. Each lane
// scopes probes to the resources that lane is responsible for, so
// an operator can hit a single lane from a Container App `exec`. See
// docs/architecture/azure/AZURE-FULL-STACK-TEST-LAYERS.md#l2.

import { NextResponse } from 'next/server';
import { handleAzureConnectivity } from '@/lib/health/azure-connectivity-route-helpers';
import type { AzureLane } from '@/lib/health/azure-connectivity';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 30;

const VALID_LANES: ReadonlyArray<AzureLane> = [
  'control',
  'private-data',
  'intelligence-model',
];

function isLane(value: string): value is AzureLane {
  return (VALID_LANES as ReadonlyArray<string>).includes(value);
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ lane: string }> },
): Promise<NextResponse> {
  const { lane } = await params;
  if (!isLane(lane)) {
    return NextResponse.json(
      {
        error: 'invalid_lane',
        detail: `lane must be one of: ${VALID_LANES.join(', ')}`,
      },
      { status: 400 },
    );
  }
  return handleAzureConnectivity({ lane });
}
