#!/usr/bin/env -S npx tsx
// L9 Service Bus DLQ drill
//
// Produces one intentionally malformed context-ingestion message and verifies
// that the A2b worker dead-letters it instead of crashing or blocking good
// messages. Run sequence:
//
//   1. npm run azure:servicebus:dlq-drill -- --mode produce --run-id <id>
//   2. run the ingestion worker once against q-context-ingestion-events
//   3. npm run azure:servicebus:dlq-drill -- --mode verify --run-id <id>

import { DefaultAzureCredential } from '@azure/identity';
import { BlobServiceClient } from '@azure/storage-blob';
import {
  ServiceBusClient,
  type ServiceBusReceivedMessage,
} from '@azure/service-bus';
import { Pool } from 'pg';
import { createHash } from 'node:crypto';
import type {
  AzureLandingZoneMessage,
  SegmentKey,
} from '@/lib/ingestion/azure-landing-zone-types';

type Mode = 'produce' | 'verify' | 'produce-mixed' | 'verify-mixed' | 'dry-run';

interface Options {
  mode: Mode;
  runId: string;
  queueName: string;
  maxWaitMs: number;
  completeDlqMessage: boolean;
  tenantClientKey: string;
  storageAccountName: string | null;
  containerName: string;
}

function readEnv(name: string, fallback?: string): string {
  const value = process.env[name]?.trim();
  if (value) return value;
  if (fallback !== undefined) return fallback;
  throw new Error(`Missing required env var: ${name}`);
}

function parseArgs(argv: string[]): Options {
  const options: Options = {
    mode: 'dry-run',
    runId: `l9-dlq-${Date.now()}`,
    queueName: process.env.SERVICE_BUS_QUEUE_NAME?.trim() || 'q-context-ingestion-events',
    maxWaitMs: 10_000,
    completeDlqMessage: false,
    tenantClientKey: process.env.L9_MIXED_TENANT_CLIENT_KEY?.trim() || 'apex-retail',
    storageAccountName: process.env.L9_MIXED_STORAGE_ACCOUNT_NAME?.trim() ||
      process.env.INGESTION_SMOKE_STORAGE_ACCOUNT_NAME?.trim() ||
      null,
    containerName: process.env.L9_MIXED_CONTAINER_NAME?.trim() ||
      process.env.INGESTION_SMOKE_CONTAINER_NAME?.trim() ||
      'context-drops',
  };

  for (let index = 0; index < argv.length; index += 1) {
    const raw = argv[index];
    const [key, inlineValue] = raw.split('=', 2);
    const nextValue = inlineValue ?? argv[index + 1];
    const consume = inlineValue === undefined;

    switch (key) {
      case '--mode':
        if (!['produce', 'verify', 'produce-mixed', 'verify-mixed', 'dry-run'].includes(nextValue)) {
          throw new Error(`Invalid --mode: ${nextValue}`);
        }
        options.mode = nextValue as Mode;
        if (consume) index += 1;
        break;
      case '--run-id':
        options.runId = nextValue;
        if (consume) index += 1;
        break;
      case '--queue-name':
        options.queueName = nextValue;
        if (consume) index += 1;
        break;
      case '--max-wait-ms':
        options.maxWaitMs = Number(nextValue);
        if (consume) index += 1;
        break;
      case '--complete-dlq-message':
        options.completeDlqMessage = true;
        break;
      case '--tenant-client-key':
        options.tenantClientKey = nextValue;
        if (consume) index += 1;
        break;
      case '--storage-account-name':
        options.storageAccountName = nextValue;
        if (consume) index += 1;
        break;
      case '--container-name':
        options.containerName = nextValue;
        if (consume) index += 1;
        break;
      case '--dry-run':
        options.mode = 'dry-run';
        break;
      default:
        throw new Error(`Unknown argument: ${raw}`);
    }
  }

  if (!options.runId.trim()) throw new Error('Missing --run-id.');
  if (!options.queueName.trim()) throw new Error('Missing --queue-name.');
  if (!options.tenantClientKey.trim()) throw new Error('Missing --tenant-client-key.');
  if (!options.containerName.trim()) throw new Error('Missing --container-name.');
  if (!Number.isFinite(options.maxWaitMs) || options.maxWaitMs < 1) {
    throw new Error(`Invalid --max-wait-ms: ${options.maxWaitMs}`);
  }

  return options;
}

function serviceBusNamespace(): string {
  const explicit = process.env.SERVICE_BUS_FULLY_QUALIFIED_NAMESPACE?.trim();
  if (explicit) return explicit;
  const namespaceName = readEnv('SERVICE_BUS_NAMESPACE');
  return namespaceName.includes('.')
    ? namespaceName
    : `${namespaceName}.servicebus.windows.net`;
}

function serviceBusClient(): ServiceBusClient {
  const connectionString = process.env.SERVICE_BUS_CONNECTION_STRING?.trim();
  if (connectionString) return new ServiceBusClient(connectionString);

  const managedIdentityClientId = process.env.AZURE_CLIENT_ID?.trim();
  const credential = new DefaultAzureCredential(
    managedIdentityClientId ? { managedIdentityClientId } : undefined,
  );
  return new ServiceBusClient(serviceBusNamespace(), credential);
}

function credential(): DefaultAzureCredential {
  const managedIdentityClientId = process.env.AZURE_CLIENT_ID?.trim();
  return new DefaultAzureCredential(
    managedIdentityClientId ? { managedIdentityClientId } : undefined,
  );
}

function poisonMessageBody(runId: string): Record<string, unknown> {
  return {
    schema: 'abarva.ingestion.v1',
    drillRunId: runId,
    malformedByDesign: true,
    reason: 'missing tenantClientKey, segmentKey, and storage object',
  };
}

function sha256(bytes: Buffer): string {
  return createHash('sha256').update(bytes).digest('hex');
}

function goodMixedBody(_runId: string, tenantClientKey: string): Buffer {
  // Keep opaque run ids in blob metadata only. Long numeric suffixes can
  // accidentally satisfy the payment-card Luhn check and turn the "good"
  // lane into a false quarantine.
  return Buffer.from([
    'AbarVa L9 mixed-batch resilience drill.',
    'This is synthetic confidential business context only.',
    'No PHI, no PII, no direct identifiers.',
    `Tenant: ${tenantClientKey}`,
    'Run label: synthetic mixed batch',
  ].join('\n'), 'utf-8');
}

function goodMixedMessage(options: Options, accountName: string, blobPath: string, bytes: Buffer): AzureLandingZoneMessage {
  return {
    schema: 'abarva.ingestion.v1',
    tenantClientKey: options.tenantClientKey,
    segmentKey: 'enterprise_profile' satisfies SegmentKey,
    storage: {
      accountName,
      containerName: options.containerName,
      blobPath,
      sizeBytes: bytes.byteLength,
      contentType: 'text/plain',
      sha256: sha256(bytes),
    },
    declaredClassification: 'confidential_business',
    producedAt: new Date().toISOString(),
    metadata: {
      l9DrillRunId: options.runId,
      l9DrillCase: 'good',
      expectedFinalDecision: 'allow',
    },
  };
}

async function produce(options: Options): Promise<void> {
  const client = serviceBusClient();
  const sender = client.createSender(options.queueName);
  try {
    await sender.sendMessages({
      messageId: `${options.runId}-poison`,
      subject: 'abarva.l9.dlq-drill.poison',
      contentType: 'application/json',
      body: poisonMessageBody(options.runId),
      applicationProperties: {
        l9DrillRunId: options.runId,
        expectedOutcome: 'dead_letter',
        expectedDeadLetterReason: 'invalid ingestion message',
      },
    });
  } finally {
    await sender.close();
    await client.close();
  }

  console.log(JSON.stringify({
    status: 'pass',
    event: 'l9_dlq_drill_poison_message_produced',
    runId: options.runId,
    queueName: options.queueName,
    nextStep: 'run the A2b ingestion worker once, then rerun this command with --mode verify',
  }, null, 2));
}

async function produceMixed(options: Options): Promise<void> {
  const accountName = options.storageAccountName;
  if (!accountName) {
    throw new Error('produce-mixed requires --storage-account-name or L9_MIXED_STORAGE_ACCOUNT_NAME.');
  }

  const cred = credential();
  const blobService = new BlobServiceClient(`https://${accountName}.blob.core.windows.net`, cred);
  const container = blobService.getContainerClient(options.containerName);
  const serviceBus = serviceBusClient();
  const sender = serviceBus.createSender(options.queueName);
  const bytes = goodMixedBody(options.runId, options.tenantClientKey);
  const blobPath = `l9-mixed/${options.runId}/good-enterprise-profile.txt`;
  const message = goodMixedMessage(options, accountName, blobPath, bytes);

  try {
    await container.getBlockBlobClient(blobPath).uploadData(bytes, {
      blobHTTPHeaders: { blobContentType: message.storage.contentType },
      metadata: {
        l9DrillRunId: options.runId,
        l9DrillCase: 'good',
        tenantClientKey: options.tenantClientKey,
        segmentKey: message.segmentKey,
        expectedFinalDecision: 'allow',
        sha256: message.storage.sha256,
      },
    });

    await sender.sendMessages([
      {
        messageId: `${options.runId}-good`,
        subject: 'abarva.l9.mixed-batch.good',
        contentType: 'application/json',
        body: message,
        applicationProperties: {
          l9DrillRunId: options.runId,
          l9DrillCase: 'good',
          expectedOutcome: 'accepted',
          tenantClientKey: options.tenantClientKey,
        },
      },
      {
        messageId: `${options.runId}-poison`,
        subject: 'abarva.l9.mixed-batch.poison',
        contentType: 'application/json',
        body: poisonMessageBody(options.runId),
        applicationProperties: {
          l9DrillRunId: options.runId,
          l9DrillCase: 'poison',
          expectedOutcome: 'dead_letter',
          expectedDeadLetterReason: 'invalid ingestion message',
        },
      },
    ]);
  } finally {
    await sender.close();
    await serviceBus.close();
  }

  console.log(JSON.stringify({
    status: 'pass',
    event: 'l9_mixed_batch_messages_produced',
    runId: options.runId,
    queueName: options.queueName,
    tenantClientKey: options.tenantClientKey,
    storage: {
      accountName,
      containerName: options.containerName,
      blobPath,
    },
    messages: [`${options.runId}-good`, `${options.runId}-poison`],
    nextStep: 'run the A2b ingestion worker once, then rerun this command with --mode verify-mixed',
  }, null, 2));
}

function propertyValue(value: unknown): string | null {
  if (typeof value === 'string') return value;
  if (value === undefined || value === null) return null;
  return String(value);
}

function messageMatchesRun(message: ServiceBusReceivedMessage, runId: string): boolean {
  const props = message.applicationProperties ?? {};
  if (propertyValue(props.l9DrillRunId) === runId) return true;
  if (message.messageId === `${runId}-poison`) return true;
  const body = message.body as { drillRunId?: unknown } | undefined;
  return propertyValue(body?.drillRunId) === runId;
}

async function verify(options: Options): Promise<void> {
  const client = serviceBusClient();
  const receiver = client.createReceiver(options.queueName, { subQueueType: 'deadLetter' });
  const inspected: Array<{
    messageId: string | undefined;
    deadLetterReason: string | undefined;
  }> = [];

  try {
    const messages = await receiver.receiveMessages(20, { maxWaitTimeInMs: options.maxWaitMs });
    for (const message of messages) {
      inspected.push({
        messageId: propertyValue(message.messageId) ?? undefined,
        deadLetterReason: message.deadLetterReason,
      });

      if (!messageMatchesRun(message, options.runId)) {
        await receiver.abandonMessage(message);
        continue;
      }

      const reason = message.deadLetterReason ?? '';
      const reasonLooksValid = reason.length > 0 &&
        !reason.toLowerCase().includes('maxdeliverycount');
      if (!reasonLooksValid) {
        await receiver.abandonMessage(message);
        throw new Error(`Matched DLQ message, but reason was not a worker rejection reason: ${reason || '<empty>'}`);
      }

      if (options.completeDlqMessage) {
        await receiver.completeMessage(message);
      } else {
        await receiver.abandonMessage(message);
      }

      console.log(JSON.stringify({
        status: 'pass',
        event: 'l9_dlq_drill_verified',
        runId: options.runId,
        queueName: options.queueName,
        messageId: message.messageId,
        deadLetterReason: message.deadLetterReason,
        deadLetterErrorDescription: message.deadLetterErrorDescription,
        dlqMessageCompleted: options.completeDlqMessage,
      }, null, 2));
      return;
    }
  } finally {
    await receiver.close();
    await client.close();
  }

  console.error(JSON.stringify({
    status: 'fail',
    event: 'l9_dlq_drill_not_found',
    runId: options.runId,
    queueName: options.queueName,
    inspected,
    hint: 'Make sure the poison message was produced and the A2b ingestion worker processed the queue before verify mode.',
  }, null, 2));
  process.exitCode = 1;
}

async function verifyGoodAuditRow(options: Options): Promise<Record<string, unknown>> {
  const connectionString = readEnv('DATABASE_URL');
  const db = new Pool({
    connectionString,
    max: 1,
    idleTimeoutMillis: 10_000,
    connectionTimeoutMillis: 5_000,
  });

  try {
    const result = await db.query<{
      id: string;
      final_decision: string;
      tenant_client_key: string;
      storage_path: string | null;
    }>(
      `
        select id, final_decision, tenant_client_key, storage_path
        from sensitive_upload_audit
        where metadata #>> '{metadata,l9DrillRunId}' = $1
          and metadata #>> '{metadata,l9DrillCase}' = 'good'
          and ingestion_tier = 'tier2_blob'
          and parent_id is null
        order by evaluated_at desc
        limit 5
      `,
      [options.runId],
    );

    if (result.rows.length !== 1) {
      throw new Error(`expected one good audit row for ${options.runId}, found ${result.rows.length}`);
    }

    const row = result.rows[0];
    if (row.final_decision !== 'allow') {
      throw new Error(`good audit row final_decision expected allow, got ${row.final_decision}`);
    }
    if (row.tenant_client_key !== options.tenantClientKey) {
      throw new Error(`good audit row tenant expected ${options.tenantClientKey}, got ${row.tenant_client_key}`);
    }

    return row;
  } finally {
    await db.end();
  }
}

async function findDlqMessage(options: Options): Promise<{
  messageId: string | undefined;
  deadLetterReason: string | undefined;
  deadLetterErrorDescription: string | undefined;
  completed: boolean;
}> {
  const client = serviceBusClient();
  const receiver = client.createReceiver(options.queueName, { subQueueType: 'deadLetter' });

  try {
    const messages = await receiver.receiveMessages(20, { maxWaitTimeInMs: options.maxWaitMs });
    for (const message of messages) {
      if (!messageMatchesRun(message, options.runId)) {
        await receiver.abandonMessage(message);
        continue;
      }

      const reason = message.deadLetterReason ?? '';
      const reasonLooksValid = reason.length > 0 &&
        !reason.toLowerCase().includes('maxdeliverycount');
      if (!reasonLooksValid) {
        await receiver.abandonMessage(message);
        throw new Error(`Matched DLQ message, but reason was not a worker rejection reason: ${reason || '<empty>'}`);
      }

      if (options.completeDlqMessage) {
        await receiver.completeMessage(message);
      } else {
        await receiver.abandonMessage(message);
      }

      return {
        messageId: propertyValue(message.messageId) ?? undefined,
        deadLetterReason: message.deadLetterReason,
        deadLetterErrorDescription: message.deadLetterErrorDescription,
        completed: options.completeDlqMessage,
      };
    }
  } finally {
    await receiver.close();
    await client.close();
  }

  throw new Error(`No DLQ message found for ${options.runId}`);
}

async function verifyMixed(options: Options): Promise<void> {
  const [goodRow, dlq] = await Promise.all([
    verifyGoodAuditRow(options),
    findDlqMessage(options),
  ]);

  console.log(JSON.stringify({
    status: 'pass',
    event: 'l9_mixed_batch_drill_verified',
    runId: options.runId,
    queueName: options.queueName,
    tenantClientKey: options.tenantClientKey,
    goodMessage: {
      auditRowId: goodRow.id,
      finalDecision: goodRow.final_decision,
      storagePath: goodRow.storage_path,
    },
    poisonMessage: dlq,
  }, null, 2));
}

async function main(): Promise<void> {
  const options = parseArgs(process.argv.slice(2));

  if (options.mode === 'dry-run') {
    console.log(JSON.stringify({
      status: 'pass',
      dryRun: true,
      runId: options.runId,
      queueName: options.queueName,
      sequence: [
        `npm run azure:servicebus:dlq-drill -- --mode produce --run-id ${options.runId}`,
        'run the A2b ingestion worker once',
        `npm run azure:servicebus:dlq-drill -- --mode verify --run-id ${options.runId}`,
        `npm run azure:servicebus:dlq-drill -- --mode produce-mixed --run-id ${options.runId} --storage-account-name <storage-account>`,
        'run the A2b ingestion worker once',
        `npm run azure:servicebus:dlq-drill -- --mode verify-mixed --run-id ${options.runId}`,
      ],
    }, null, 2));
    return;
  }

  if (options.mode === 'produce') {
    await produce(options);
    return;
  }
  if (options.mode === 'produce-mixed') {
    await produceMixed(options);
    return;
  }
  if (options.mode === 'verify-mixed') {
    await verifyMixed(options);
    return;
  }

  await verify(options);
}

main().catch((error) => {
  console.error(JSON.stringify({
    status: 'fail',
    error: error instanceof Error ? error.message : String(error),
  }, null, 2));
  process.exit(1);
});
