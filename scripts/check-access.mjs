import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { config as loadEnv } from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import { Pinecone } from '@pinecone-database/pinecone';

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
    'Create .env.local with the required service keys.',
  );
}

function checkSupabaseLocal() {
  const required = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    'SUPABASE_SERVICE_ROLE_KEY',
  ];
  const missing = required.filter((name) => !envHas(name));
  addResult(
    'Supabase local',
    missing.length === 0,
    missing.length === 0 ? 'Required env vars are present.' : `Missing ${missing.join(', ')}`,
    'Populate the missing Supabase keys in .env.local.',
  );
}

async function checkSupabaseLive() {
  if (!envHas('NEXT_PUBLIC_SUPABASE_URL') || !envHas('SUPABASE_SERVICE_ROLE_KEY')) {
    addResult(
      'Supabase live',
      false,
      'Skipped because local Supabase env is incomplete.',
      'Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY first.',
    );
    return;
  }

  try {
    const client = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY,
      { auth: { persistSession: false, autoRefreshToken: false } },
    );
    const { error } = await client.from('engagements').select('id', { head: true, count: 'exact' }).limit(1);
    if (error) {
      addResult('Supabase live', false, `Query failed: ${error.message}`, 'Verify the project URL, key, and database schema.');
      return;
    }
    addResult('Supabase live', true, 'Connected and queried the engagements table.', '');
  } catch (error) {
    addResult(
      'Supabase live',
      false,
      `Connection failed: ${error instanceof Error ? error.message : String(error)}`,
      'Check network access and Supabase credentials.',
    );
  }
}

function checkPineconeLocal() {
  const required = ['PINECONE_API_KEY', 'PINECONE_INDEX'];
  const missing = required.filter((name) => !envHas(name));
  addResult(
    'Pinecone local',
    missing.length === 0,
    missing.length === 0 ? 'Required env vars are present.' : `Missing ${missing.join(', ')}`,
    'Populate the missing Pinecone keys in .env.local.',
  );
}

async function checkPineconeLive() {
  if (!envHas('PINECONE_API_KEY') || !envHas('PINECONE_INDEX')) {
    addResult(
      'Pinecone live',
      false,
      'Skipped because local Pinecone env is incomplete.',
      'Set PINECONE_API_KEY and PINECONE_INDEX first.',
    );
    return;
  }

  try {
    const pc = new Pinecone({ apiKey: process.env.PINECONE_API_KEY });
    const stats = await pc.index(process.env.PINECONE_INDEX).describeIndexStats();
    addResult(
      'Pinecone live',
      true,
      `Connected to index ${process.env.PINECONE_INDEX} with ${stats.totalRecordCount ?? 0} total records.`,
      '',
    );
  } catch (error) {
    addResult(
      'Pinecone live',
      false,
      `Connection failed: ${error instanceof Error ? error.message : String(error)}`,
      'Check network access, API key permissions, and index name.',
    );
  }
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

async function main() {
  checkEnvFile();
  checkSupabaseLocal();
  checkPineconeLocal();
  checkAzureLocal();

  if (live) {
    await checkSupabaseLive();
    await checkPineconeLive();
    checkAzureLive();
  }

  printResults();

  const failed = results.some((result) => !result.ok);
  process.exitCode = failed ? 1 : 0;
}

await main();
