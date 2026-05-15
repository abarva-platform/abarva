#!/usr/bin/env -S npx tsx
// Azure private-lane connectivity smoke.
//
// Runs inside the Container Apps environment with the same managed identity
// as the AbarVa app/runtime lane. It checks Postgres, Blob, Service Bus,
// Key Vault, and Azure AI Search and emits stable pass/fail JSON.

import { buildAzureConnectivityConfig } from '@/lib/azure-connectivity/config';
import { runAzureConnectivitySmoke } from '@/lib/azure-connectivity/smoke';

async function main(): Promise<void> {
  const config = buildAzureConnectivityConfig();
  const report = await runAzureConnectivitySmoke(config);
  console.log(JSON.stringify(report, null, 2));
  if (report.status !== 'pass') process.exit(1);
}

main().catch((err) => {
  console.error(JSON.stringify({
    event: 'azure_connectivity_smoke',
    status: 'fail',
    producedAt: new Date().toISOString(),
    error: err instanceof Error ? err.message : String(err),
  }, null, 2));
  process.exit(1);
});
