import 'server-only';

import { DefaultAzureCredential } from '@azure/identity';
import { ServiceBusClient } from '@azure/service-bus';

import type { AzureLandingZoneMessage } from '@/lib/ingestion/azure-landing-zone-types';

export interface AzureLandingZoneEnqueueResult {
  queueName: string;
  messageId: string;
}

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

function createServiceBusClient(): ServiceBusClient {
  const connectionString =
    process.env.SERVICE_BUS_CONNECTION_STRING?.trim() ||
    process.env.AZURE_SERVICE_BUS_CONNECTION_STRING?.trim();
  if (connectionString) return new ServiceBusClient(connectionString);

  const managedIdentityClientId = process.env.AZURE_CLIENT_ID?.trim();
  const credential = new DefaultAzureCredential(
    managedIdentityClientId ? { managedIdentityClientId } : undefined,
  );
  return new ServiceBusClient(serviceBusNamespace(), credential);
}

export async function enqueueAzureLandingZoneMessage(
  message: AzureLandingZoneMessage,
): Promise<AzureLandingZoneEnqueueResult> {
  const queueName = readEnv('SERVICE_BUS_QUEUE_NAME', 'q-context-ingestion-events');
  const client = createServiceBusClient();
  const sender = client.createSender(queueName);
  const messageId = `${message.tenantClientKey}:${message.storage.sha256.slice(0, 16)}`;

  try {
    await sender.sendMessages({
      messageId,
      subject: 'abarva.context.bulk-upload',
      contentType: 'application/json',
      body: message,
      applicationProperties: {
        schema: message.schema,
        tenantClientKey: message.tenantClientKey,
        segmentKey: message.segmentKey,
        sha256: message.storage.sha256,
      },
    });
  } finally {
    await sender.close();
    await client.close();
  }

  return { queueName, messageId };
}
