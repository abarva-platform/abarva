// Shared helpers for the L2 Azure connectivity smoke route handlers.
//
// Extracted from the route files so the Jest tests can drive the same
// code path without spinning up a Next.js server. Per AZURE-FULL-STACK
// L2 acceptance, the route is admin-gated — probe internals must not
// leak to anonymous traffic.

import { NextResponse } from 'next/server';
import { auth, clerkClient } from '@clerk/nextjs/server';
import {
  runAzureConnectivityProbes,
  type AzureConnectivityReport,
  type AzureLane,
  type ProbeFns,
} from './azure-connectivity';

export async function requireAdminRole(): Promise<
  | { userId: string; role: string }
  | NextResponse
> {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: 'unauthenticated' }, { status: 401 });
  }
  const client = await clerkClient();
  const user = await client.users.getUser(userId);
  const role = (user.publicMetadata?.role as string | undefined) ?? '';
  if (role !== 'admin' && role !== 'maestro') {
    return NextResponse.json({ error: 'forbidden_admin_only' }, { status: 403 });
  }
  return { userId, role };
}

export function reportToResponse(report: AzureConnectivityReport): NextResponse {
  return NextResponse.json(report, {
    status: report.ok ? 200 : 503,
    headers: { 'Cache-Control': 'no-store' },
  });
}

export async function handleAzureConnectivity(opts: {
  lane?: AzureLane;
  probes?: ProbeFns;
  timeoutMs?: number;
}): Promise<NextResponse> {
  const admin = await requireAdminRole();
  if (admin instanceof NextResponse) return admin;
  const report = await runAzureConnectivityProbes(opts);
  return reportToResponse(report);
}
