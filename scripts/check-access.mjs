import fs from 'node:fs';
import os from 'node:os';
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

function readJsonIfExists(filePath) {
  if (!fs.existsSync(filePath)) return null;
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
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

function checkVercelLocal() {
  const vercelPath = path.join(cwd, '.vercel');
  const project = readJsonIfExists(path.join(vercelPath, 'project.json'));
  const authPath = path.join(os.homedir(), '.vercel', 'auth.json');
  const hasToken = envHas('VERCEL_TOKEN');
  const previewEnv = path.join(vercelPath, '.env.production.local');
  const hasPreviewEnv = fs.existsSync(previewEnv);

  addResult(
    'Vercel local',
    Boolean(project),
    project
      ? `Linked to ${project.projectName} (${project.projectId})`
      : 'No .vercel/project.json link found.',
    'Run `vercel link` in this repo.',
  );

  addResult(
    'Vercel auth',
    true,
    hasToken
      ? 'VERCEL_TOKEN is available in the environment.'
      : fs.existsSync(authPath)
        ? `Found ${authPath}`
        : 'No ~/.vercel/auth.json or VERCEL_TOKEN found. The Vercel CLI may still be authenticated via a stored system session.',
    hasToken || fs.existsSync(authPath)
      ? ''
      : 'Run the live check to confirm whether the installed Vercel CLI can already authenticate.',
  );

  addResult(
    'Vercel env snapshot',
    hasPreviewEnv,
    hasPreviewEnv ? `Found ${previewEnv}` : 'No .vercel/.env.production.local snapshot found.',
    'Run `vercel pull --environment=production` if you want local copies of Vercel env vars.',
  );
}

function checkVercelLive() {
  const token = process.env.VERCEL_TOKEN;
  const baseArgs = token ? ['whoami', '--token', token] : ['whoami'];
  const result = spawnSync('vercel', baseArgs, {
    cwd,
    encoding: 'utf8',
    timeout: 6000,
    env: process.env,
  });

  if (result.error) {
    addResult(
      'Vercel live',
      false,
      `CLI failed: ${result.error.message}`,
      'Check that the Vercel CLI is installed and the network is available.',
    );
    return;
  }

  if (result.signal === 'SIGTERM') {
    addResult(
      'Vercel live',
      false,
      'CLI timed out waiting for authentication or network response.',
      'Run `vercel login`, set VERCEL_TOKEN, or retry with working network access.',
    );
    return;
  }

  if (result.status !== 0) {
    addResult(
      'Vercel live',
      false,
      (result.stderr || result.stdout || 'Unknown Vercel CLI error').trim(),
      'Refresh your Vercel login or provide VERCEL_TOKEN.',
    );
    return;
  }

  addResult('Vercel live', true, (result.stdout || 'Authenticated with Vercel CLI.').trim(), '');
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
  checkVercelLocal();

  if (live) {
    await checkSupabaseLive();
    await checkPineconeLive();
    checkVercelLive();
  }

  printResults();

  const failed = results.some((result) => !result.ok);
  process.exitCode = failed ? 1 : 0;
}

await main();
