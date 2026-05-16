#!/usr/bin/env node

import { execFileSync } from 'node:child_process';
import { writeFileSync } from 'node:fs';

const DEFAULT_SOURCE_RG = 'rg-abarva-database-lab-eastus2';
const DEFAULT_SOURCE_NAME = 'pg-abarva-context-lab-001';

function arg(name) {
  const inline = process.argv.find((value) => value.startsWith(`--${name}=`));
  if (inline) return inline.slice(name.length + 3);
  const idx = process.argv.indexOf(`--${name}`);
  if (idx >= 0) return process.argv[idx + 1];
  return undefined;
}

function flag(name) {
  return process.argv.includes(`--${name}`);
}

function az(args, options = {}) {
  return execFileSync('az', args, {
    encoding: 'utf8',
    stdio: options.stdio ?? ['ignore', 'pipe', 'pipe'],
  }).trim();
}

function azJson(args) {
  const text = az([...args, '-o', 'json']);
  return text ? JSON.parse(text) : null;
}

function isoMinutesAgo(minutes) {
  return new Date(Date.now() - minutes * 60_000).toISOString().replace(/\.\d{3}Z$/, 'Z');
}

function timestamp() {
  return new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z$/, '').toLowerCase();
}

function secondsBetween(startMs, endMs) {
  return Math.round((endMs - startMs) / 1000);
}

function planFromArgs() {
  const sourceResourceGroup = arg('source-resource-group') ?? process.env.AZURE_POSTGRES_SOURCE_RG ?? DEFAULT_SOURCE_RG;
  const sourceName = arg('source-name') ?? process.env.AZURE_POSTGRES_SOURCE_NAME ?? DEFAULT_SOURCE_NAME;
  const targetResourceGroup = arg('target-resource-group') ?? sourceResourceGroup;
  const targetName = arg('target-name') ?? `pg-abarva-pitr-${timestamp().slice(0, 12)}`;
  const restoreTime = arg('restore-time') ?? isoMinutesAgo(Number(arg('minutes-ago') ?? 10));
  const timeoutMinutes = Number(arg('timeout-minutes') ?? 45);
  const pollSeconds = Number(arg('poll-seconds') ?? 20);
  const reportPath = arg('report') ?? `/tmp/abarva-pitr-restore-${targetName}.json`;
  return {
    sourceResourceGroup,
    sourceName,
    targetResourceGroup,
    targetName,
    restoreTime,
    timeoutMinutes,
    pollSeconds,
    reportPath,
    execute: flag('execute'),
    deleteAfter: flag('delete-after'),
  };
}

function sourceServer(plan) {
  return azJson([
    'postgres', 'flexible-server', 'show',
    '-g', plan.sourceResourceGroup,
    '-n', plan.sourceName,
  ]);
}

function restoreArgs(plan, source) {
  return [
    'postgres', 'flexible-server', 'restore',
    '-g', plan.targetResourceGroup,
    '-n', plan.targetName,
    '--source-server', source.id,
    '--restore-time', plan.restoreTime,
    '--subnet', source.network.delegatedSubnetResourceId,
    '--private-dns-zone', source.network.privateDnsZoneArmResourceId,
    '--yes',
  ];
}

function waitForReady(plan, startedMs) {
  const deadline = startedMs + plan.timeoutMinutes * 60_000;
  let last = null;
  while (Date.now() < deadline) {
    last = azJson([
      'postgres', 'flexible-server', 'show',
      '-g', plan.targetResourceGroup,
      '-n', plan.targetName,
    ]);
    const state = last?.state;
    console.error(`[pitr] ${plan.targetName} state=${state ?? 'unknown'}`);
    if (state === 'Ready') return last;
    if (state === 'Failed' || state === 'Disabled') {
      throw new Error(`restore target entered ${state}`);
    }
    Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, plan.pollSeconds * 1000);
  }
  throw new Error(`restore did not reach Ready within ${plan.timeoutMinutes} minutes`);
}

function deleteTarget(plan) {
  az([
    'postgres', 'flexible-server', 'delete',
    '-g', plan.targetResourceGroup,
    '-n', plan.targetName,
    '--yes',
  ], { stdio: 'pipe' });
}

function summarize({ plan, source, restored, startedMs, readyMs, deleted, error }) {
  const report = {
    event: 'azure_postgres_pitr_restore_drill',
    status: error ? 'fail' : 'pass',
    producedAt: new Date().toISOString(),
    source: {
      resourceGroup: plan.sourceResourceGroup,
      name: plan.sourceName,
      location: source?.location,
      backupRetentionDays: source?.backup?.backupRetentionDays,
      earliestRestoreDate: source?.backup?.earliestRestoreDate,
      publicNetworkAccess: source?.network?.publicNetworkAccess,
    },
    restore: {
      targetResourceGroup: plan.targetResourceGroup,
      targetName: plan.targetName,
      restoreTime: plan.restoreTime,
      elapsedSeconds: readyMs ? secondsBetween(startedMs, readyMs) : null,
      state: restored?.state ?? null,
      publicNetworkAccess: restored?.network?.publicNetworkAccess ?? null,
      delegatedSubnetResourceId: restored?.network?.delegatedSubnetResourceId ?? null,
      privateDnsZoneArmResourceId: restored?.network?.privateDnsZoneArmResourceId ?? null,
      deleted,
    },
    checks: [
      {
        name: 'restore_reached_ready',
        pass: restored?.state === 'Ready',
        detail: restored?.state ?? 'missing',
      },
      {
        name: 'restored_server_private',
        pass: restored?.network?.publicNetworkAccess === 'Disabled',
        detail: restored?.network?.publicNetworkAccess ?? 'missing',
      },
      {
        name: 'cleanup_completed',
        pass: plan.deleteAfter ? deleted === true : true,
        detail: plan.deleteAfter ? String(deleted) : 'not_requested',
      },
    ],
    error: error ? String(error instanceof Error ? error.message : error) : null,
  };
  return report;
}

async function main() {
  const plan = planFromArgs();
  const source = sourceServer(plan);
  if (!source?.id) throw new Error(`source server not found: ${plan.sourceResourceGroup}/${plan.sourceName}`);

  if (!plan.execute) {
    const report = {
      event: 'azure_postgres_pitr_restore_plan',
      status: 'planned',
      producedAt: new Date().toISOString(),
      plan: {
        ...plan,
        sourceServerId: source.id,
        subnet: source.network?.delegatedSubnetResourceId,
        privateDnsZone: source.network?.privateDnsZoneArmResourceId,
      },
    };
    console.log(JSON.stringify(report, null, 2));
    return;
  }

  const startedMs = Date.now();
  let restored = null;
  let readyMs = null;
  let deleted = false;
  let error = null;
  try {
    console.error(`[pitr] restoring ${plan.sourceName} to ${plan.targetName} at ${plan.restoreTime}`);
    az(restoreArgs(plan, source), { stdio: 'pipe' });
    restored = waitForReady(plan, startedMs);
    readyMs = Date.now();
  } catch (err) {
    error = err;
  } finally {
    if (plan.deleteAfter) {
      try {
        console.error(`[pitr] deleting ${plan.targetName}`);
        deleteTarget(plan);
        deleted = true;
      } catch (deleteErr) {
        error = error ?? deleteErr;
      }
    }
  }

  const report = summarize({ plan, source, restored, startedMs, readyMs, deleted, error });
  writeFileSync(plan.reportPath, `${JSON.stringify(report, null, 2)}\n`);
  console.log(JSON.stringify(report, null, 2));
  if (report.status !== 'pass') process.exitCode = 1;
}

main().catch((err) => {
  console.error(JSON.stringify({
    event: 'azure_postgres_pitr_restore_drill',
    status: 'fail',
    error: err instanceof Error ? err.message : String(err),
  }, null, 2));
  process.exitCode = 1;
});
