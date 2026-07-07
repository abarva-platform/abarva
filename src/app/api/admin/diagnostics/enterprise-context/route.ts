import { NextResponse } from 'next/server';
import { auth, currentUser } from '@clerk/nextjs/server';

import { getActiveClientRow, hasLockedTenantSession } from '@/lib/active-client';
import { getAzureReadFluentClient } from '@/lib/data-plane/postgresCompat';
import {
  getEnterpriseContextOverviewForTenant,
} from '@/lib/enterprise-context/intelligence-read-model';
import { canonicalTenantKey } from '@/lib/tenant/aliases';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 30;

interface QueryResult {
  count?: number | null;
  error?: { message?: string } | null;
}

function firstSearchValue(value: string | string[] | undefined): string | null {
  if (Array.isArray(value)) return value[0] ?? null;
  return value ?? null;
}

function maskError(error: unknown): string {
  if (process.env.NODE_ENV !== 'production') {
    return error instanceof Error ? error.message : String(error);
  }
  return 'diagnostic query failed';
}

async function countTenantRows(table: string, tenantKey: string): Promise<{
  count: number | null;
  error: string | null;
}> {
  try {
    const result = await getAzureReadFluentClient()
      .from(table)
      .select('id', { count: 'exact', head: true })
      .eq('tenant_key', tenantKey) as QueryResult;
    return {
      count: result.count ?? 0,
      error: result.error?.message ?? null,
    };
  } catch (error) {
    return {
      count: null,
      error: maskError(error),
    };
  }
}

export async function GET(request: Request) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json(
      { ok: false, error: 'Unauthorized' },
      { status: 401, headers: { 'Cache-Control': 'no-store' } },
    );
  }

  const user = await currentUser();
  const role = user?.publicMetadata?.role as string | undefined;
  const email = user?.primaryEmailAddress?.emailAddress
    ?? user?.emailAddresses?.[0]?.emailAddress
    ?? null;
  const canSwitchClient =
    role === 'admin' ||
    email?.toLowerCase() === 'anand.sundaram@thesundaram.com';

  const url = new URL(request.url);
  const requestedClientRaw = firstSearchValue(
    Object.fromEntries(url.searchParams.entries()).client,
  );
  const lockedSession = await hasLockedTenantSession();
  const requestedClient = lockedSession || canSwitchClient ? requestedClientRaw : null;
  const client = await getActiveClientRow(requestedClient).catch(() => null);

  if (!client) {
    return NextResponse.json(
      {
        ok: false,
        lockedSession,
        requestedClient: requestedClientRaw,
        resolvedClient: null,
        error: 'No authenticated client context resolved.',
      },
      { status: 401, headers: { 'Cache-Control': 'no-store' } },
    );
  }

  const canonicalKey = canonicalTenantKey(client.key) ?? client.key;
  const [overview, records, chunks] = await Promise.all([
    getEnterpriseContextOverviewForTenant(client.key, client.name).catch(() => null),
    countTenantRows('enterprise_context_records', canonicalKey),
    countTenantRows('enterprise_context_chunks', canonicalKey),
  ]);

  return NextResponse.json(
    {
      ok: Boolean(overview),
      lockedSession,
      requestedClient: requestedClientRaw,
      resolvedClient: {
        id: client.id,
        key: client.key,
        canonicalKey,
        name: client.name,
        industryCode: client.industry_code,
      },
      directCounts: {
        enterpriseContextRecords: records.count,
        enterpriseContextRecordsError: records.error,
        enterpriseContextChunks: chunks.count,
        enterpriseContextChunksError: chunks.error,
      },
      overview: overview
        ? {
            tenantKey: overview.tenantKey,
            counts: overview.counts,
            firstCard: overview.cards[0]?.title ?? null,
            factsAvailable: overview.sentinelFacts.length,
          }
        : null,
    },
    { headers: { 'Cache-Control': 'no-store' } },
  );
}
