// Admin Loader — Gate 0: preserve the original upload to Azure Blob, hash-verified.
//
// Contract: no fact may be derived from an upload that has not first been
// preserved as an immutable original with a verified sha256. This module is the
// single seam that performs that preservation. It is pure-ish: the actual blob
// write is injected via a `BlobWriter`, so it is unit-testable without Azure.
//
// See docs/build/setup-admin-loader/ and `./contract.ts` (PreservedSourceFile).

import { createHash, randomUUID } from 'node:crypto';

import type { PreservedSourceFile } from './contract';

/**
 * Minimal write seam for preserving an original. Implementations stage the
 * exact bytes under `objectKey` in `container` and return the durable URL.
 * The real Azure implementation is `azureBlobWriter()`; tests pass an
 * in-memory recorder.
 */
export interface BlobWriter {
  put(
    container: string,
    objectKey: string,
    bytes: Uint8Array,
    contentType?: string,
  ): Promise<{ url: string }>;
}

/** Default container for preserved loader originals. */
export const DEFAULT_PRESERVE_CONTAINER = 'context-landing';

/**
 * Sanitize a user-supplied filename for safe use inside an object key.
 * Strips any path components and collapses anything outside a conservative
 * allow-list to `_`, so the key stays a single, predictable path segment.
 */
export function sanitizeFilename(filename: string): string {
  // Drop directory components from both separator styles.
  const base = filename.split(/[\\/]/).pop() ?? '';
  const cleaned = base
    .trim()
    .replace(/[^A-Za-z0-9._-]+/g, '_')
    .replace(/^_+/, '')
    .replace(/_+$/, '');
  return cleaned || 'file';
}

/** sha256 hex digest of the given bytes. */
export function sha256Hex(bytes: Uint8Array): string {
  return createHash('sha256').update(bytes).digest('hex');
}

export interface PreserveOriginalArgs {
  bytes: Uint8Array;
  filename: string;
  tenantKey: string;
  container?: string;
  contentType?: string;
  uploadedBy?: string;
  blob: BlobWriter;
  /** Injectable clock for deterministic tests. Defaults to real `Date`. */
  now?: () => Date;
  /** Injectable id source for deterministic tests. Defaults to `crypto.randomUUID`. */
  uuid?: () => string;
}

/**
 * Preserve a single original upload to blob storage and return its
 * hash-verified `PreservedSourceFile` record.
 *
 * Steps:
 *   1. Compute sha256 hex of the exact bytes.
 *   2. Build a deterministic object key:
 *        landing/<tenantKey>/inbox/<uuid>-<sanitizedFilename>
 *   3. Stage the bytes via the injected `BlobWriter`.
 *   4. Return the fully-populated `PreservedSourceFile`.
 */
export async function preserveOriginalToBlob(
  args: PreserveOriginalArgs,
): Promise<PreservedSourceFile> {
  const {
    bytes,
    filename,
    tenantKey,
    contentType,
    uploadedBy,
    blob,
    container = DEFAULT_PRESERVE_CONTAINER,
    now = () => new Date(),
    uuid = () => randomUUID(),
  } = args;

  const fileHash = sha256Hex(bytes);
  const safeName = sanitizeFilename(filename);
  const objectKey = `landing/${tenantKey}/inbox/${uuid()}-${safeName}`;

  const { url } = await blob.put(container, objectKey, bytes, contentType);

  const preserved: PreservedSourceFile = {
    tenantKey,
    filename: safeName,
    container,
    objectKey,
    blobUrl: url,
    fileHash,
    bytes: bytes.byteLength,
    ingestedAt: now().toISOString(),
  };
  if (contentType !== undefined) preserved.contentType = contentType;
  if (uploadedBy !== undefined) preserved.uploadedBy = uploadedBy;

  return preserved;
}

/**
 * Production `BlobWriter` backed by `@azure/storage-blob`.
 *
 * Storage config mirrors the established pattern in
 * `src/lib/workshops/blob.ts`: prefer an explicit connection string, else
 * fall back to account-name + `DefaultAzureCredential` (managed identity).
 * Env var assumption: this loader reuses the shared
 * `AZURE_STORAGE_CONNECTION_STRING` / `AZURE_STORAGE_ACCOUNT_NAME` pair
 * (workshops adds packs-specific overrides; the loader has no dedicated
 * container env yet, so it uses the shared account credentials). Secret
 * values are never read into logs.
 */
export function azureBlobWriter(): BlobWriter {
  return {
    async put(
      container: string,
      objectKey: string,
      bytes: Uint8Array,
      contentType?: string,
    ): Promise<{ url: string }> {
      // Lazy-load the SDK + credential so importing this module (e.g. in tests
      // that only use an in-memory writer) does not require the Azure packages.
      const [{ BlobServiceClient }, { DefaultAzureCredential }] = await Promise.all([
        import('@azure/storage-blob'),
        import('@azure/identity'),
      ]);

      const connectionString = process.env.AZURE_STORAGE_CONNECTION_STRING?.trim();
      const accountName = process.env.AZURE_STORAGE_ACCOUNT_NAME?.trim();

      let serviceClient;
      if (connectionString) {
        serviceClient = BlobServiceClient.fromConnectionString(connectionString);
      } else if (accountName) {
        serviceClient = new BlobServiceClient(
          `https://${accountName}.blob.core.windows.net`,
          new DefaultAzureCredential(),
        );
      } else {
        throw new Error(
          'azureBlobWriter: missing storage config (set AZURE_STORAGE_CONNECTION_STRING or AZURE_STORAGE_ACCOUNT_NAME)',
        );
      }

      const containerClient = serviceClient.getContainerClient(container);
      await containerClient.createIfNotExists();
      const blockBlob = containerClient.getBlockBlobClient(objectKey);
      await blockBlob.uploadData(Buffer.from(bytes), {
        blobHTTPHeaders: contentType ? { blobContentType: contentType } : undefined,
      });

      return { url: blockBlob.url };
    },
  };
}
