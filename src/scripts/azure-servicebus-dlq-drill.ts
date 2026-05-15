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
import {
  ServiceBusClient,
  type ServiceBusReceivedMessage,
} from '@azure/service-bus';

type Mode = 'produce' | 'verify' | 'dry-run';

interface Options {
  mode: Mode;
  runId: string;
  queueName: string;
  maxWaitMs: number;
  completeDlqMessage: boolean;
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
  };

  for (let index = 0; index < argv.length; index += 1) {
    const raw = argv[index];
    const [key, inlineValue] = raw.split('=', 2);
    const nextValue = inlineValue ?? argv[index + 1];
    const consume = inlineValue === undefined;

    switch (key) {
      case '--mode':
        if (!['produce', 'verify', 'dry-run'].includes(nextValue)) {
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
      case '--dry-run':
        options.mode = 'dry-run';
        break;
      default:
        throw new Error(`Unknown argument: ${raw}`);
    }
  }

  if (!options.runId.trim()) throw new Error('Missing --run-id.');
  if (!options.queueName.trim()) throw new Error('Missing --queue-name.');
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

function poisonMessageBody(runId: string): Record<string, unknown> {
  return {
    schema: 'abarva.ingestion.v1',
    drillRunId: runId,
    malformedByDesign: true,
    reason: 'missing tenantClientKey, segmentKey, and storage object',
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
      ],
    }, null, 2));
    return;
  }

  if (options.mode === 'produce') {
    await produce(options);
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
