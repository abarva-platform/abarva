#!/usr/bin/env tsx
/**
 * Materialize Tower read-model rows for every canonical tenant.
 *
 * Runs inside the private ACA/VNet lane after the approved main image deploy.
 * This keeps the refresh reproducible and evidence-producing instead of relying
 * on ad hoc one-tenant operator commands.
 */

import { azureRead } from '@/lib/data-plane/azureRead';
import { getAzureWriteFluentClient } from '@/lib/data-plane/postgresCompat';
import { CANONICAL_TENANT_KEYS, tenantAliasesFor } from '@/lib/tenant/aliases';
import {
  buildTowerMaterializationPlanFromUpstream,
  persistTowerMaterializationPlan,
} from '@/lib/tower/tower-materialization';

interface Args {
  apply: boolean;
  dryRun: boolean;
  help: boolean;
  tenantKeys: string[];
}

interface ClientRow {
  id: string;
  name: string | null;
  tenant_key: string | null;
  slug: string | null;
}

interface TenantRefreshSummary {
  tenantKey: string;
  clientId: string | null;
  clientName: string | null;
  mode: 'apply' | 'dry-run' | 'skipped';
  status: 'ok' | 'skipped' | 'failed';
  reason?: string;
  source?: string;
  summary?: Record<string, unknown>;
  written?: Record<string, unknown>;
}

function parseArgs(argv: readonly string[]): Args {
  const out: Args = {
    apply: false,
    dryRun: false,
    help: false,
    tenantKeys: [],
  };

  for (const arg of argv) {
    if (arg === '--help' || arg === '-h') out.help = true;
    else if (arg === '--apply') out.apply = true;
    else if (arg === '--dry-run') out.dryRun = true;
    else if (arg.startsWith('--tenant-key=')) out.tenantKeys.push(arg.slice('--tenant-key='.length));
  }

  return out;
}

function printUsage(): void {
  console.log(`Tower all-tenant materialized read-model refresh

Mode:
  --dry-run              Build and print the refresh summary without writing.
  --apply                Upsert Tower read-model rows for all canonical tenants.

Optional:
  --tenant-key=<key>     Limit to one canonical tenant. Repeatable.

Examples:
  npx tsx src/scripts/tower/materialize-all-tenants.ts --dry-run
  npx tsx src/scripts/tower/materialize-all-tenants.ts --apply
`);
}

function normalizedAliasesFor(tenantKey: string): string[] {
  return Array.from(
    new Set(
      [tenantKey, ...tenantAliasesFor(tenantKey)]
        .map((alias) => alias.trim().toLowerCase())
        .filter(Boolean),
    ),
  );
}

async function resolveClientRowForTenant(tenantKey: string): Promise<ClientRow | null> {
  const aliases = normalizedAliasesFor(tenantKey);
  const rows = await azureRead.query<ClientRow>(
    `
      SELECT id::text, name, tenant_key, slug
      FROM clients
      WHERE lower(coalesce(tenant_key, '')) = ANY($1::text[])
         OR lower(coalesce(slug, '')) = ANY($1::text[])
         OR lower(coalesce(name, '')) = ANY($1::text[])
      ORDER BY
        CASE
          WHEN lower(coalesce(tenant_key, '')) = $2 THEN 0
          WHEN lower(coalesce(slug, '')) = $2 THEN 1
          ELSE 2
        END,
        created_at DESC NULLS LAST
      LIMIT 1
    `,
    [aliases, tenantKey.toLowerCase()],
  );
  return rows[0] ?? null;
}

async function refreshTenant(args: {
  tenantKey: string;
  apply: boolean;
}): Promise<TenantRefreshSummary> {
  const client = await resolveClientRowForTenant(args.tenantKey);
  if (!client) {
    return {
      tenantKey: args.tenantKey,
      clientId: null,
      clientName: null,
      mode: 'skipped',
      status: 'skipped',
      reason: 'client_row_not_found',
    };
  }

  const plan = await buildTowerMaterializationPlanFromUpstream({
    clientId: client.id,
    tenantKey: args.tenantKey,
  });
  const summary = {
    tenantKey: args.tenantKey,
    clientId: client.id,
    clientName: client.name,
    mode: args.apply ? 'apply' : 'dry-run',
    status: 'ok',
    source: plan.source,
    summary: plan.summary,
  } satisfies TenantRefreshSummary;

  if (!args.apply) return summary;

  const written = await persistTowerMaterializationPlan({
    db: getAzureWriteFluentClient(),
    plan,
  });

  return {
    ...summary,
    written,
  };
}

async function main(): Promise<number> {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) {
    printUsage();
    return 0;
  }
  if (args.apply === args.dryRun) {
    printUsage();
    console.error('Choose exactly one: --dry-run or --apply');
    return 2;
  }

  const tenantKeys = args.tenantKeys.length > 0 ? args.tenantKeys : [...CANONICAL_TENANT_KEYS];
  const startedAt = new Date().toISOString();
  const tenants: TenantRefreshSummary[] = [];

  for (const tenantKey of tenantKeys) {
    try {
      tenants.push(await refreshTenant({ tenantKey, apply: args.apply }));
    } catch (error) {
      tenants.push({
        tenantKey,
        clientId: null,
        clientName: null,
        mode: args.apply ? 'apply' : 'dry-run',
        status: 'failed',
        reason: error instanceof Error ? error.message : String(error),
      });
    }
  }

  const failed = tenants.filter((tenant) => tenant.status === 'failed');
  const output = {
    mode: args.apply ? 'apply' : 'dry-run',
    startedAt,
    finishedAt: new Date().toISOString(),
    tenantCount: tenants.length,
    okCount: tenants.filter((tenant) => tenant.status === 'ok').length,
    skippedCount: tenants.filter((tenant) => tenant.status === 'skipped').length,
    failedCount: failed.length,
    tenants,
  };

  console.log(JSON.stringify(output, null, 2));
  return failed.length > 0 ? 1 : 0;
}

main()
  .then((code) => {
    process.exitCode = code;
  })
  .catch((error) => {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  });
