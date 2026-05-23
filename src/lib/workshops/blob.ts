import { DefaultAzureCredential } from '@azure/identity';
import { BlobServiceClient } from '@azure/storage-blob';

export interface WorkshopBlobUploadInput {
  path: string;
  bytes: Buffer;
  contentType: string;
  metadata?: Record<string, string>;
}

export interface WorkshopBlobUploadResult {
  blobRef: string;
  uploaded: boolean;
}

function containerName(): string {
  return process.env.AZURE_WORKSHOP_PACKS_CONTAINER?.trim() || 'workshop-packs';
}

function serviceClient(): BlobServiceClient | null {
  const connectionString =
    process.env.AZURE_WORKSHOP_PACKS_CONNECTION_STRING?.trim()
    || process.env.AZURE_STORAGE_CONNECTION_STRING?.trim();
  if (connectionString) return BlobServiceClient.fromConnectionString(connectionString);

  const accountName =
    process.env.AZURE_WORKSHOP_PACKS_STORAGE_ACCOUNT?.trim()
    || process.env.AZURE_STORAGE_ACCOUNT_NAME?.trim();
  if (!accountName) return null;

  return new BlobServiceClient(
    `https://${accountName}.blob.core.windows.net`,
    new DefaultAzureCredential(),
  );
}

export async function uploadWorkshopPackToBlob(
  input: WorkshopBlobUploadInput,
): Promise<WorkshopBlobUploadResult> {
  const container = containerName();
  const client = serviceClient();
  if (!client) {
    return {
      blobRef: `azure-blob-unconfigured://${container}/${input.path}`,
      uploaded: false,
    };
  }

  const containerClient = client.getContainerClient(container);
  await containerClient.createIfNotExists();
  const blobClient = containerClient.getBlockBlobClient(input.path);
  await blobClient.uploadData(input.bytes, {
    blobHTTPHeaders: { blobContentType: input.contentType },
    metadata: input.metadata,
  });

  return {
    blobRef: blobClient.url,
    uploaded: true,
  };
}
