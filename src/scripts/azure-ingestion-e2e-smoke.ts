#!/usr/bin/env -S npx tsx
// Azure ingestion end-to-end smoke
//
// Runs inside the Container Apps environment with the same managed
// identity as the A2b worker. Producer mode writes one safe and one
// sensitive synthetic blob to the private context-drops container and
// enqueues canonical `abarva.ingestion.v1` messages. Verifier mode checks
// Azure Postgres for the audit rows written by the worker.

import { createHash } from 'node:crypto';
import { DefaultAzureCredential } from '@azure/identity';
import { BlobServiceClient } from '@azure/storage-blob';
import { ServiceBusClient } from '@azure/service-bus';
import { Pool } from 'pg';
import type { AzureLandingZoneMessage, SegmentKey } from '@/lib/ingestion/azure-landing-zone-types';

type SmokeMode = 'produce' | 'verify';

type SmokeCase = {
  readonly name: 'safe' | 'sensitive';
  readonly segmentKey: SegmentKey;
  readonly filename: string;
  readonly contentType: string;
  readonly declaredClassification: AzureLandingZoneMessage['declaredClassification'];
  readonly body: string;
  readonly expectedFinalDecision: 'allow' | 'quarantine';
};

function readEnv(name: string, fallback?: string): string {
  const value = process.env[name]?.trim();
  if (value) return value;
  if (fallback !== undefined) return fallback;
  throw new Error(`Missing required env var: ${name}`);
}

function serviceBusNamespace(): string {
  const explicit = process.env.SERVICE_BUS_FULLY_QUALIFIED_NAMESPACE?.trim();
  if (explicit) return explicit;
  const namespaceName = readEnv('SERVICE_BUS_NAMESPACE');
  return namespaceName.includes('.')
    ? namespaceName
    : `${namespaceName}.servicebus.windows.net`;
}

function smokeRunId(): string {
  return readEnv('INGESTION_SMOKE_RUN_ID');
}

function credential(): DefaultAzureCredential {
  const managedIdentityClientId = process.env.AZURE_CLIENT_ID?.trim();
  return new DefaultAzureCredential(
    managedIdentityClientId ? { managedIdentityClientId } : undefined,
  );
}

function smokeCases(): ReadonlyArray<SmokeCase> {
  return [
    {
      name: 'safe',
      segmentKey: 'enterprise_profile',
      filename: 'safe-enterprise-profile.txt',
      contentType: 'text/plain',
      declaredClassification: 'confidential_business',
      expectedFinalDecision: 'allow',
      body: [
        'AbarVa Azure lab synthetic enterprise profile.',
        'No PHI, no PII, no direct identifiers.',
        'Purpose: validate Service Bus to Blob to guard to audit flow.',
        'Tenant: Apex Retail synthetic lab data.',
      ].join('\n'),
    },
    {
      name: 'sensitive',
      segmentKey: 'compliance',
      filename: 'sensitive-quarantine-sample.txt',
      contentType: 'text/plain',
      declaredClassification: 'regulated_phi_pii_suspected',
      expectedFinalDecision: 'quarantine',
      body: [
        'Synthetic regulated-data smoke sample.',
        'DOB: 1970-01-01',
        'MRN: ABC123456',
        'SSN: 123-45-6789',
        'This is fake data used only to prove quarantine controls.',
      ].join('\n'),
    },
  ];
}

function sha256(bytes: Buffer): string {
  return createHash('sha256').update(bytes).digest('hex');
}

async function produce(): Promise<void> {
  const runId = smokeRunId();
  const tenantClientKey = readEnv('INGESTION_SMOKE_TENANT_CLIENT_KEY', 'apex-retail');
  const accountName = readEnv('INGESTION_SMOKE_STORAGE_ACCOUNT_NAME');
  const containerName = readEnv('INGESTION_SMOKE_CONTAINER_NAME', 'context-drops');
  const queueName = readEnv('SERVICE_BUS_QUEUE_NAME', 'q-context-ingestion-events');
  const cred = credential();

  const blobService = new BlobServiceClient(`https://${accountName}.blob.core.windows.net`, cred);
  const container = blobService.getContainerClient(containerName);
  const serviceBus = new ServiceBusClient(serviceBusNamespace(), cred);
  const sender = serviceBus.createSender(queueName);

  try {
    for (const testCase of smokeCases()) {
      const bytes = Buffer.from(testCase.body, 'utf-8');
      const hash = sha256(bytes);
      const blobPath = `smoke/${runId}/${testCase.filename}`;
      await container.getBlockBlobClient(blobPath).uploadData(bytes, {
        blobHTTPHeaders: {
          blobContentType: testCase.contentType,
        },
        metadata: {
          smokeRunId: runId,
          smokeCase: testCase.name,
          tenantClientKey,
        },
      });

      const message: AzureLandingZoneMessage = {
        schema: 'abarva.ingestion.v1',
        tenantClientKey,
        segmentKey: testCase.segmentKey,
        storage: {
          accountName,
          containerName,
          blobPath,
          sizeBytes: bytes.byteLength,
          contentType: testCase.contentType,
          sha256: hash,
        },
        declaredClassification: testCase.declaredClassification,
        producedAt: new Date().toISOString(),
        metadata: {
          smokeRunId: runId,
          smokeCase: testCase.name,
          expectedFinalDecision: testCase.expectedFinalDecision,
        },
      };

      await sender.sendMessages({
        messageId: `${runId}-${testCase.name}`,
        subject: 'abarva.ingestion.e2e-smoke',
        contentType: 'application/json',
        body: message,
        applicationProperties: {
          schema: message.schema,
          smokeRunId: runId,
          smokeCase: testCase.name,
          tenantClientKey,
        },
      });
    }
  } finally {
    await sender.close();
    await serviceBus.close();
  }

  console.log(JSON.stringify({
    event: 'ingestion_smoke_messages_produced',
    smokeRunId: runId,
    tenantClientKey,
    cases: smokeCases().map((c) => c.name),
  }));
}

async function verify(): Promise<void> {
  const runId = smokeRunId();
  const connectionString = readEnv('DATABASE_URL');
  const db = new Pool({
    connectionString,
    max: 1,
    idleTimeoutMillis: 10_000,
    connectionTimeoutMillis: 5_000,
  });

  try {
    const result = await db.query<{
      smoke_case: string | null;
      final_decision: string;
      count: string;
    }>(
      `
        select
          metadata #>> '{metadata,smokeCase}' as smoke_case,
          final_decision,
          count(*)::text as count
        from sensitive_upload_audit
        where metadata #>> '{metadata,smokeRunId}' = $1
          and ingestion_tier = 'tier2_blob'
          and parent_id is null
        group by 1, 2
        order by 1, 2
      `,
      [runId],
    );

    const observed = new Map<string, string>();
    for (const row of result.rows) {
      if (row.smoke_case && row.count === '1') {
        observed.set(row.smoke_case, row.final_decision);
      }
    }

    const failures: string[] = [];
    for (const testCase of smokeCases()) {
      const actual = observed.get(testCase.name);
      if (actual !== testCase.expectedFinalDecision) {
        failures.push(`${testCase.name}: expected ${testCase.expectedFinalDecision}, got ${actual ?? 'missing'}`);
      }
    }

    if (failures.length > 0) {
      throw new Error(`ingestion_smoke_verification_failed: ${failures.join('; ')}`);
    }

    console.log(JSON.stringify({
      event: 'ingestion_smoke_verified',
      smokeRunId: runId,
      observed: Object.fromEntries(observed),
    }));
  } finally {
    await db.end();
  }
}

async function main(): Promise<void> {
  const mode = readEnv('INGESTION_SMOKE_MODE') as SmokeMode;
  if (mode === 'produce') {
    await produce();
    return;
  }
  if (mode === 'verify') {
    await verify();
    return;
  }
  throw new Error(`Unsupported INGESTION_SMOKE_MODE: ${mode}`);
}

main().catch((err) => {
  console.error(JSON.stringify({
    event: 'ingestion_smoke_failed',
    error: err instanceof Error ? err.message : String(err),
  }));
  process.exit(1);
});
