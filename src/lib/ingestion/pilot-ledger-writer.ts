import path from 'node:path';
import {
  writeDurablePilotIngestionAuditOnlyLedger,
  type DurablePilotIngestionLedgerWriteInput,
} from '@/lib/admin/pilot-ingestion-ledger';
import type {
  PilotLedgerWriter,
  PilotLedgerWriterInput,
} from '@/lib/ingestion/azure-landing-zone-consumer';
import type { AzureLandingZoneMessage } from '@/lib/ingestion/azure-landing-zone-types';

function metadataText(
  metadata: AzureLandingZoneMessage['metadata'] | undefined,
  key: string,
): string | undefined {
  const value = metadata?.[key];
  if (value === undefined || value === null) return undefined;
  const text = String(value).trim();
  return text ? text : undefined;
}

function requireMetadata(
  message: AzureLandingZoneMessage,
  key: string,
): string {
  const value = metadataText(message.metadata, key);
  if (!value) throw new Error(`pilot_ledger_metadata_missing:${key}`);
  return value;
}

function originalFilename(message: AzureLandingZoneMessage): string {
  return (
    metadataText(message.metadata, 'originalFileName') ??
    path.posix.basename(message.storage.blobPath) ??
    'context-upload'
  );
}

export function buildDurablePilotLedgerInput(
  input: PilotLedgerWriterInput,
): DurablePilotIngestionLedgerWriteInput {
  const { message, plan } = input;
  return {
    clientId: requireMetadata(message, 'clientId'),
    initiatedByUserId:
      metadataText(message.metadata, 'initiatedByUserId') ??
      metadataText(message.metadata, 'uploadedBy') ??
      'azure-ingestion-worker',
    attestationVersion: requireMetadata(message, 'attestationVersion'),
    originalFilename: originalFilename(message),
    plan,
  };
}

export function createDurablePilotLedgerWriter(
  writeLedger = writeDurablePilotIngestionAuditOnlyLedger,
): PilotLedgerWriter {
  return async (input) => {
    await writeLedger(buildDurablePilotLedgerInput(input));
  };
}
