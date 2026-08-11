#!/usr/bin/env -S npx tsx
// scripts/tenant-bootstrap.ts
//
// A2c · one-command tenant onboarding orchestrator
//
// Chains the existing scripts that today must be invoked manually in
// the correct order. Idempotent: re-running against a tenant that's
// already provisioned should be safe (each step checks existence
// before mutating).
//
// Usage:
//   # Bootstrap an existing canonical tenant (re-run safe)
//   npx tsx scripts/tenant-bootstrap.ts --tenant apexretail --dry-run
//   npx tsx scripts/tenant-bootstrap.ts --tenant apexretail --apply
//
//   # Refresh the broker context + verify-render for an existing tenant
//   npx tsx scripts/tenant-bootstrap.ts --tenant meridian --refresh-only --apply
//
// What it does (in order):
//   1. Validate tenant key
//   2. Verify required env vars are set (CLERK_SECRET_KEY, SUPABASE service role,
//      ANTHROPIC_API_KEY for broker rebuild)
//   3. Provision Clerk CXO personas       (scripts/provision-cxo-personas.ts)
//   4. Run pending Supabase migrations    (npm run db:migrate)
//   5. Run baseline seeds                 (npm run db:seed)
//   6. Load 14-segment setup data pack    (load-{tenant}-setup-data.ts)
//   7. Verify-render: hit the broker + assert all 15 coverage tiles
//      and 6 context cards return non-empty for the tenant
//   8. Output a structured verification report and exit non-zero on
//      any failure
//
// Default safety: --dry-run runs steps 1-2 + verification of what
// WOULD happen, then exits 0 without touching Clerk or Supabase.
// --apply must be passed explicitly to mutate.
//
// Backlog: A2c (docs/BACKLOG-2026-05-14.md)
//
// QA gates met before this script counts as "done":
//   - typecheck clean
//   - dry-run output is human-readable
//   - apply path runs against a non-prod environment first

import { config as loadEnv } from 'dotenv';
import { spawn } from 'node:child_process';
import path from 'node:path';
import process from 'node:process';

loadEnv({ path: path.resolve(process.cwd(), '.env.local') });

type TenantKey = 'apexretail' | 'meridian' | 'arcturus' | 'lakeshore' | 'internal-golden';
const CANONICAL_TENANTS: ReadonlyArray<TenantKey> = ['apexretail', 'meridian', 'arcturus', 'lakeshore', 'internal-golden'];

interface CliArgs {
  tenant: TenantKey | null;
  apply: boolean;
  refreshOnly: boolean;
  skipMigrations: boolean;
  skipSeedPack: boolean;
}

function parseArgs(argv: ReadonlyArray<string>): CliArgs {
  const args: CliArgs = {
    tenant: null,
    apply: false,
    refreshOnly: false,
    skipMigrations: false,
    skipSeedPack: false,
  };
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === '--tenant') {
      const value = argv[++i];
      if (!CANONICAL_TENANTS.includes(value as TenantKey)) {
        throw new Error(
          `--tenant must be one of ${CANONICAL_TENANTS.join(', ')}; got "${value}"`,
        );
      }
      args.tenant = value as TenantKey;
    } else if (arg === '--apply') {
      args.apply = true;
    } else if (arg === '--dry-run') {
      args.apply = false;
    } else if (arg === '--refresh-only') {
      args.refreshOnly = true;
    } else if (arg === '--skip-migrations') {
      args.skipMigrations = true;
    } else if (arg === '--skip-seed-pack') {
      args.skipSeedPack = true;
    } else if (arg === '--help' || arg === '-h') {
      printHelp();
      process.exit(0);
    }
  }
  if (!args.tenant) {
    throw new Error('--tenant is required. Try `--help` for usage.');
  }
  return args;
}

function printHelp(): void {
  // eslint-disable-next-line no-console
  console.log(`
tenant-bootstrap · A2c onboarding orchestrator

Usage:
  npx tsx scripts/tenant-bootstrap.ts --tenant <key> [flags]

Required:
  --tenant <key>          One of: ${CANONICAL_TENANTS.join(', ')}

Flags:
  --dry-run               Default. Reports what would happen.
  --apply                 Actually mutate Clerk + Supabase.
  --refresh-only          Skip provisioning + migrations + seeds; only
                          rebuild broker context + verify-render.
  --skip-migrations       Skip step 4. Use when migrations are known clean.
  --skip-seed-pack        Skip step 6. Use when the tenant's setup-data
                          pack is known to already be loaded.

Pre-conditions (validated in step 2):
  CLERK_SECRET_KEY                  Clerk admin operations
  NEXT_PUBLIC_SUPABASE_URL          Data plane
  SUPABASE_SERVICE_ROLE_KEY         Data plane (service role)
  ANTHROPIC_API_KEY                 Broker rebuild

Examples:
  npx tsx scripts/tenant-bootstrap.ts --tenant meridian --dry-run
  npx tsx scripts/tenant-bootstrap.ts --tenant apexretail --apply
  npx tsx scripts/tenant-bootstrap.ts --tenant arcturus --refresh-only --apply
`);
}

interface StepResult {
  name: string;
  status: 'ok' | 'skipped' | 'failed' | 'dry-run';
  detail?: string;
  durationMs: number;
}

const REQUIRED_ENV_VARS = [
  'CLERK_SECRET_KEY',
  'NEXT_PUBLIC_SUPABASE_URL',
  'SUPABASE_SERVICE_ROLE_KEY',
  'ANTHROPIC_API_KEY',
] as const;

function checkEnvVars(): { ok: boolean; missing: string[] } {
  const missing: string[] = [];
  for (const key of REQUIRED_ENV_VARS) {
    if (!process.env[key]) missing.push(key);
  }
  return { ok: missing.length === 0, missing };
}

async function runStep(
  name: string,
  fn: () => Promise<string | void>,
): Promise<StepResult> {
  const t0 = Date.now();
  try {
    const detail = await fn();
    return {
      name,
      status: 'ok',
      detail: typeof detail === 'string' ? detail : undefined,
      durationMs: Date.now() - t0,
    };
  } catch (err) {
    return {
      name,
      status: 'failed',
      detail: err instanceof Error ? err.message : String(err),
      durationMs: Date.now() - t0,
    };
  }
}

function skipped(name: string, reason: string): StepResult {
  return { name, status: 'skipped', detail: reason, durationMs: 0 };
}

function dryRun(name: string, plan: string): StepResult {
  return { name, status: 'dry-run', detail: plan, durationMs: 0 };
}

async function runShell(
  cmd: string,
  args: ReadonlyArray<string>,
): Promise<{ ok: boolean; code: number; stderr: string }> {
  return new Promise((resolve) => {
    const child = spawn(cmd, [...args], {
      stdio: ['ignore', 'inherit', 'pipe'],
      env: process.env,
    });
    let stderr = '';
    child.stderr?.on('data', (chunk: Buffer) => {
      stderr += chunk.toString();
      process.stderr.write(chunk);
    });
    child.on('close', (code) => {
      resolve({ ok: code === 0, code: code ?? -1, stderr });
    });
  });
}

const SETUP_DATA_LOADERS: Record<TenantKey, string> = {
  apexretail: 'src/scripts/setup-data/load-apex-setup-data.ts',
  meridian: 'src/scripts/setup-data/load-meridian-setup-data.ts',
  arcturus: 'src/scripts/setup-data/load-firstcapital-setup-data.ts',
  lakeshore: 'src/scripts/lakeshore/rehearse-governed-load.ts',
  'internal-golden': 'src/scripts/setup-data/load-internal-golden-setup-data.ts',
};

function setupDataArgs(tenant: TenantKey, loader: string, apply: boolean): string[] {
  if (tenant !== 'lakeshore') return [loader];

  const clientId = process.env.LAKESHORE_CLIENT_ID ?? 'f2ef0b6a-9f20-4d3d-9dd9-8f8ec01f2a61';
  return [
    loader,
    `--mode=${apply ? 'commit' : 'dry-run'}`,
    `--client-id=${clientId}`,
    '--out=docs/build/lakeshore/loaded/load-runs/lakeshore-governed-load-latest.json',
  ];
}

async function main(): Promise<void> {
  const args = parseArgs(process.argv.slice(2));
  const tenant = args.tenant as TenantKey;
  const t0 = Date.now();

  // eslint-disable-next-line no-console
  console.log(`
─────────────────────────────────────────────────────────────────
A2c · tenant-bootstrap
  tenant       ${tenant}
  mode         ${args.apply ? 'APPLY (mutating)' : 'dry-run (default; safe)'}
  refresh-only ${args.refreshOnly ? 'yes' : 'no'}
─────────────────────────────────────────────────────────────────
`);

  const results: StepResult[] = [];

  // ── Step 1: validate tenant key ───────────────────────────────────
  results.push(
    await runStep('1 · validate tenant key', async () => {
      if (!CANONICAL_TENANTS.includes(tenant)) {
        throw new Error(`unknown tenant: ${tenant}`);
      }
      return `recognized canonical tenant "${tenant}"`;
    }),
  );

  // ── Step 2: env-var pre-flight ────────────────────────────────────
  results.push(
    await runStep('2 · env-var pre-flight', async () => {
      const env = checkEnvVars();
      if (!env.ok) {
        throw new Error(
          `missing required env vars: ${env.missing.join(', ')}. ` +
            `Did you load .env.local?`,
        );
      }
      return `all ${REQUIRED_ENV_VARS.length} required env vars present`;
    }),
  );

  // ── Step 3: Clerk CXO persona provisioning ────────────────────────
  if (args.refreshOnly) {
    results.push(skipped('3 · Clerk CXO personas', '--refresh-only'));
  } else if (!args.apply) {
    results.push(
      dryRun(
        '3 · Clerk CXO personas',
        `Would run scripts/provision-cxo-personas.ts --apply, scoped to ${tenant}.`,
      ),
    );
  } else {
    results.push(
      await runStep('3 · Clerk CXO personas', async () => {
        const r = await runShell('npx', [
          'tsx',
          'scripts/provision-cxo-personas.ts',
          '--client',
          tenant,
          '--apply',
        ]);
        if (!r.ok) {
          throw new Error(`provision-cxo-personas exited ${r.code}`);
        }
        return 'CXO personas provisioned + tenant-locked';
      }),
    );
  }

  // ── Step 4: Supabase migrations ───────────────────────────────────
  if (args.refreshOnly || args.skipMigrations) {
    results.push(
      skipped(
        '4 · Supabase migrations',
        args.refreshOnly ? '--refresh-only' : '--skip-migrations',
      ),
    );
  } else if (!args.apply) {
    results.push(
      dryRun(
        '4 · Supabase migrations',
        'Would run `npm run db:migrate:dry` to check, then `npm run db:migrate` if changes pending.',
      ),
    );
  } else {
    results.push(
      await runStep('4 · Supabase migrations', async () => {
        const r = await runShell('npm', ['run', 'db:migrate']);
        if (!r.ok) {
          throw new Error(`db:migrate exited ${r.code}`);
        }
        return 'migrations applied';
      }),
    );
  }

  // ── Step 5: Supabase baseline seeds ───────────────────────────────
  if (args.refreshOnly) {
    results.push(skipped('5 · baseline seeds', '--refresh-only'));
  } else if (!args.apply) {
    results.push(
      dryRun('5 · baseline seeds', 'Would run `npm run db:seed`.'),
    );
  } else {
    results.push(
      await runStep('5 · baseline seeds', async () => {
        const r = await runShell('npm', ['run', 'db:seed']);
        if (!r.ok) {
          throw new Error(`db:seed exited ${r.code}`);
        }
        return 'baseline seeds applied';
      }),
    );
  }

  // ── Step 6: 14-segment setup-data pack ────────────────────────────
  if (args.skipSeedPack) {
    results.push(skipped('6 · setup-data pack', '--skip-seed-pack'));
  } else {
    const loader = SETUP_DATA_LOADERS[tenant];
    const loaderArgs = setupDataArgs(tenant, loader, args.apply);
    if (!args.apply) {
      results.push(dryRun('6 · setup-data pack', `Would run \`npx tsx ${loaderArgs.join(' ')}\`.`));
    } else {
      results.push(
        await runStep('6 · setup-data pack', async () => {
          const r = await runShell('npx', ['tsx', ...loaderArgs]);
          if (!r.ok) {
            throw new Error(`${loader} exited ${r.code}`);
          }
          return tenant === 'lakeshore'
            ? `Lakeshore governed load committed via ${loader}`
            : `14-segment pack loaded via ${loader}`;
        }),
      );
    }
  }

  // ── Step 7: verify-render against the broker ──────────────────────
  //
  // This is the critical assertion: the broker must emit non-empty data
  // for all 15 coverage-by-domain tiles AND all 6 synthesized context
  // cards, otherwise the /intelligence#enterprise-context surface will
  // render blank tiles for the new tenant. Per audit 2026-05-13, we
  // discovered the seed→broker→UI pipeline is many-to-many; this step
  // is what makes "bootstrap" a real verb rather than "ran some seeds".
  //
  // Implementation note: this step uses dynamic import to avoid pulling
  // the broker into the orchestrator's compile graph when the user
  // just wants `--help`. The verify-render module is shipped separately
  // (see scripts/tenant-bootstrap-verify.ts) so it can be unit-tested
  // without spawning subprocesses.
  if (!args.apply && !args.refreshOnly) {
    results.push(
      dryRun(
        '7 · verify-render',
        'Would call the broker read-model + assert 15 coverage tiles + 6 cards return data for ' +
          tenant,
      ),
    );
  } else {
    results.push(
      await runStep('7 · verify-render', async () => {
        const { verifyTenantRender } = await import('./tenant-bootstrap-verify');
        const report = await verifyTenantRender(tenant);
        if (!report.ok) {
          throw new Error(
            `verify-render failed: ${report.missingTiles.length} tile(s) missing, ` +
              `${report.missingCards.length} card(s) missing. ` +
              `Tiles: [${report.missingTiles.join(', ') || 'none'}]. ` +
              `Cards: [${report.missingCards.join(', ') || 'none'}].`,
          );
        }
        return (
          `${report.tilesPopulated}/15 coverage tiles populated, ` +
          `${report.cardsPopulated}/6 context cards populated`
        );
      }),
    );
  }

  // ── Report ────────────────────────────────────────────────────────
  const totalMs = Date.now() - t0;
  const failed = results.filter((r) => r.status === 'failed');

  // eslint-disable-next-line no-console
  console.log('\n─────────────────────────────────────────────────────────────────');
  // eslint-disable-next-line no-console
  console.log(`A2c · tenant-bootstrap report  (${totalMs}ms, ${args.apply ? 'APPLIED' : 'DRY-RUN'})`);
  // eslint-disable-next-line no-console
  console.log('─────────────────────────────────────────────────────────────────');
  for (const r of results) {
    const icon =
      r.status === 'ok' ? '✅'
        : r.status === 'skipped' ? '⏭️ '
        : r.status === 'dry-run' ? '🟦'
        : '❌';
    // eslint-disable-next-line no-console
    console.log(`${icon}  ${r.name}  (${r.durationMs}ms)`);
    if (r.detail) {
      // eslint-disable-next-line no-console
      console.log(`     ${r.detail}`);
    }
  }
  // eslint-disable-next-line no-console
  console.log('─────────────────────────────────────────────────────────────────');

  if (failed.length > 0) {
    // eslint-disable-next-line no-console
    console.error(`\n❌  ${failed.length} step(s) failed. Tenant is NOT in a bootstrap-complete state.\n`);
    process.exit(1);
  }
  if (!args.apply) {
    // eslint-disable-next-line no-console
    console.log(
      '\n🟦  Dry-run complete. Re-run with --apply to actually provision.\n',
    );
    process.exit(0);
  }
  // eslint-disable-next-line no-console
  console.log(
    `\n✅  Tenant "${tenant}" is bootstrap-complete. Verify by signing in as a CXO persona and opening /intelligence#enterprise-context.\n`,
  );
}

main().catch((err) => {
  // eslint-disable-next-line no-console
  console.error('Fatal:', err instanceof Error ? err.message : err);
  process.exit(1);
});
