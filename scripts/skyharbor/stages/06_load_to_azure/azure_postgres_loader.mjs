#!/usr/bin/env node
/**
 * SkyHarbor stage 06 — load generated substrate into Azure Postgres.
 *
 * Purpose:
 *   Delegates to the shared multi-tenant substrate loader with the SkyHarbor
 *   tenant key and preserves all loader flags. This is the auditable customer
 *   handoff entrypoint for "how did you load the context layer?"
 *
 * Inputs:
 *   - datasets/skyharbor-air-synthetic-v1/**
 *   - ABARVA_AZURE_DATABASE_URL or DATABASE_URL
 *   - optional AZURE_OPENAI_EMBEDDING_* or OPENAI_API_KEY for embeddings
 *
 * Outputs:
 *   - clients profile upsert
 *   - enterprise_context_source_files rows
 *   - enterprise_context_chunks rows + embeddings
 *   - applications, ai_initiatives, vendor_contracts rows
 *   - ai_egress_audit embedding provenance rows
 *
 * Usage:
 *   node scripts/skyharbor/stages/06_load_to_azure/azure_postgres_loader.mjs --dry-run
 *   node scripts/skyharbor/stages/06_load_to_azure/azure_postgres_loader.mjs --only-chunks --concurrency=8
 *   ABARVA_AZURE_DATABASE_URL='postgres://...' node scripts/skyharbor/stages/06_load_to_azure/azure_postgres_loader.mjs
 */
import { spawnSync } from 'node:child_process';

const forwardedArgs = process.argv.slice(2);
const env = { ...process.env, TENANT_KEY: process.env.TENANT_KEY || 'skyharbor' };

console.log('SkyHarbor Azure load wrapper');
console.log(`  tenant: ${env.TENANT_KEY}`);
console.log(`  flags:  ${forwardedArgs.length ? forwardedArgs.join(' ') : '(none)'}`);

const result = spawnSync(
  'npx',
  ['tsx', 'scripts/seed/load-tenant-substrate.ts', ...forwardedArgs],
  {
    stdio: 'inherit',
    env,
  },
);

process.exit(result.status ?? 1);
