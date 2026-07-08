#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { config as loadEnv } from 'dotenv';

const cwd = process.cwd();
const args = new Set(process.argv.slice(2));
const live = args.has('--live');

loadEnv({ path: path.join(cwd, '.env.local') });

const results = [];

function addResult(scope, ok, detail, fix) {
  results.push({ scope, ok, detail, fix });
}

function mark(ok) {
  return ok ? 'OK' : 'FAIL';
}

function envHas(name) {
  return Boolean(process.env[name]?.trim());
}

function checkEnvFile() {
  const envPath = path.join(cwd, '.env.local');
  addResult(
    '.env.local',
    fs.existsSync(envPath),
    fs.existsSync(envPath) ? `Readable at ${envPath}` : `Missing ${envPath}`,
    'Create .env.local with Clerk and Azure/Postgres runtime names only.',
  );
}

function checkRuntimeEnv() {
  const required = [
    'NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY',
    'CLERK_SECRET_KEY',
    'DATABASE_URL',
  ];
  const optional = [
    'ANTHROPIC_API_KEY',
    'AZURE_STORAGE_CONNECTION_STRING',
    'AZURE_SEARCH_ENDPOINT',
    'AZURE_SEARCH_ADMIN_KEY',
  ];
  const missing = required.filter((name) => !envHas(name));
  addResult(
    'Azure runtime env',
    missing.length === 0,
    missing.length === 0
      ? `Required env vars are present. Optional present: ${optional.filter(envHas).join(', ') || 'none'}`
      : `Missing ${missing.join(', ')}`,
    'Populate Clerk and Azure/Postgres secrets through .env.local or the approved Azure Key Vault/operator environment.',
  );
}

function checkLegacyEnvAbsence() {
  const forbidden = [
    ['NEXT_PUBLIC_', 'SUPABASE_URL'].join(''),
    ['NEXT_PUBLIC_', 'SUPABASE_ANON_KEY'].join(''),
    ['SUPABASE_', 'SERVICE_ROLE_KEY'].join(''),
    ['PINECONE_', 'API_KEY'].join(''),
    ['PINECONE_', 'INDEX'].join(''),
    ['NEO4J_', 'URI'].join(''),
    ['NEO4J_', 'USERNAME'].join(''),
    ['NEO4J_', 'PASSWORD'].join(''),
    ['VERCEL_', 'TOKEN'].join(''),
  ];
  const present = forbidden.filter(envHas);
  addResult(
    'Legacy runtime env',
    present.length === 0,
    present.length === 0 ? 'No Supabase, Pinecone, Neo4j, or Vercel runtime tokens detected.' : `Remove ${present.join(', ')}`,
    'Remove legacy service tokens from this runtime path. Use Azure/Postgres/Search/Blob and GitHub Actions instead.',
  );
}

function checkAzureLocal() {
  const azureEnvPath = path.join(cwd, '.env.azure.local');
  const runbookPath = path.join(cwd, 'docs/runbooks/azure-container-apps-deploy.md');

  addResult(
    'Azure deploy runbook',
    fs.existsSync(runbookPath),
    fs.existsSync(runbookPath)
      ? `Canonical ACA runbook found at ${runbookPath}`
      : 'Missing docs/runbooks/azure-container-apps-deploy.md.',
    'Restore the Azure Container Apps deploy runbook.',
  );

  addResult(
    'Azure env snapshot',
    fs.existsSync(azureEnvPath),
    fs.existsSync(azureEnvPath)
      ? `Readable at ${azureEnvPath}`
      : 'No .env.azure.local file found. This is acceptable if Azure auth is provided by az login.',
    'Use az login / az account set for live Azure operations.',
  );
}

function checkAzureLive() {
  const gh = spawnSync('gh', ['auth', 'status'], {
    cwd,
    encoding: 'utf8',
    timeout: 6000,
    env: process.env,
  });
  addResult(
    'GitHub CLI',
    gh.status === 0,
    gh.status === 0 ? 'gh auth status succeeded.' : (gh.stderr || gh.stdout || 'gh auth status failed.').trim(),
    'Run `gh auth login` or clear a stale GH_TOKEN override.',
  );

  const account = spawnSync('az', ['account', 'show', '--query', '{name:name,id:id}', '-o', 'json'], {
    cwd,
    encoding: 'utf8',
    timeout: 6000,
    env: process.env,
  });

  if (account.error) {
    addResult(
      'Azure account',
      false,
      `CLI failed: ${account.error.message}`,
      'Install Azure CLI or run this check in an environment with az available.',
    );
    return;
  }

  if (account.signal === 'SIGTERM') {
    addResult(
      'Azure account',
      false,
      'Azure CLI timed out.',
      'Run `az login` and retry with network access.',
    );
    return;
  }

  if (account.status !== 0) {
    addResult(
      'Azure account',
      false,
      (account.stderr || account.stdout || 'Unknown Azure CLI error').trim(),
      'Run `az login` and `az account set --subscription abarva-lab-sub`.',
    );
    return;
  }

  addResult('Azure account', true, (account.stdout || 'Authenticated with Azure CLI.').trim(), '');

  const app = spawnSync(
    'az',
    [
      'containerapp',
      'show',
      '-g',
      'rg-abarva-controlplane-lab-eastus',
      '-n',
      'ca-abarva-web-lab-eastus',
      '--query',
      '{latestRevisionName:properties.latestRevisionName,latestReadyRevisionName:properties.latestReadyRevisionName,image:properties.template.containers[0].image,traffic:properties.configuration.ingress.traffic}',
      '-o',
      'json',
    ],
    {
      cwd,
      encoding: 'utf8',
      timeout: 10000,
      env: process.env,
    },
  );

  addResult(
    'Azure Container App',
    app.status === 0,
    app.status === 0
      ? (app.stdout || 'Read ca-abarva-web-lab-eastus.')
      : (app.stderr || app.stdout || 'Could not read ca-abarva-web-lab-eastus.').trim(),
    'Verify Azure subscription, resource group, and Container Apps permissions.',
  );
}

function printResults() {
  console.log(live ? 'Access Check (local + live)' : 'Access Check (local only)');
  for (const result of results) {
    console.log(`[${mark(result.ok)}] ${result.scope}: ${result.detail}`);
    if (!result.ok && result.fix) {
      console.log(`       Fix: ${result.fix}`);
    }
  }
}

function main() {
  checkEnvFile();
  checkRuntimeEnv();
  checkLegacyEnvAbsence();
  checkAzureLocal();

  if (live) {
    checkAzureLive();
  }

  printResults();

  const failed = results.some((result) => !result.ok);
  process.exitCode = failed ? 1 : 0;
}

main();
