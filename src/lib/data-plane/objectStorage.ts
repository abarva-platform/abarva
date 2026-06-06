import 'server-only';

import { DefaultAzureCredential, type TokenCredential } from '@azure/identity';
import {
  BlobSASPermissions,
  BlobServiceClient,
  generateBlobSASQueryParameters,
  StorageSharedKeyCredential,
  type BlobHTTPHeaders,
  type ContainerClient,
} from '@azure/storage-blob';

type EnvLike = NodeJS.ProcessEnv;

export interface ObjectStorageUploadOptions {
  contentType?: string;
  cacheControl?: string;
  metadata?: Record<string, string>;
  upsert?: boolean;
}

export interface ObjectStorageSignedUrlOptions {
  download?: string | boolean;
}

export interface ObjectStorageAdapter {
  upload(bucket: string, path: string, body: BodyInitLike, options?: ObjectStorageUploadOptions): Promise<void>;
  remove(bucket: string, paths: string[]): Promise<void>;
  download(bucket: string, path: string): Promise<Buffer>;
  createSignedUrl(bucket: string, path: string, expiresInSeconds: number, options?: ObjectStorageSignedUrlOptions): Promise<string>;
}

export interface ObjectStorageResolvedLocation {
  accountName: string;
  containerName: string;
  blobPath: string;
}

type BodyInitLike = Buffer | Uint8Array | ArrayBuffer | Blob | string;

interface AzureStorageConfig {
  accountName: string;
  connectionString?: string;
  accountKey?: string;
  sharedContainer?: string;
}

interface AzureStorageClientBundle {
  service: BlobServiceClient;
  sharedKeyCredential: StorageSharedKeyCredential | null;
  credential: TokenCredential | null;
  config: AzureStorageConfig;
}

let cachedAdapter: ObjectStorageAdapter | null = null;
let cachedBundle: AzureStorageClientBundle | null = null;

function readEnv(env: EnvLike, names: string[]): string | undefined {
  for (const name of names) {
    const value = env[name]?.trim();
    if (value) return value;
  }
  return undefined;
}

function parseConnectionString(connectionString: string): { accountName?: string; accountKey?: string } {
  const parts = new Map<string, string>();
  for (const rawPart of connectionString.split(';')) {
    const index = rawPart.indexOf('=');
    if (index <= 0) continue;
    parts.set(rawPart.slice(0, index), rawPart.slice(index + 1));
  }
  return {
    accountName: parts.get('AccountName'),
    accountKey: parts.get('AccountKey'),
  };
}

function resolveConfig(env: EnvLike = process.env): AzureStorageConfig {
  const connectionString = readEnv(env, [
    'DATA_PLANE_OBJECT_STORE_CONNECTION_STRING',
    'AZURE_OBJECT_STORAGE_CONNECTION_STRING',
    'AZURE_STORAGE_CONNECTION_STRING',
  ]);
  const parsed = connectionString ? parseConnectionString(connectionString) : {};
  const accountName = readEnv(env, [
    'DATA_PLANE_OBJECT_STORE_ACCOUNT',
    'AZURE_OBJECT_STORAGE_ACCOUNT_NAME',
    'AZURE_STORAGE_ACCOUNT_NAME',
  ]) ?? parsed.accountName;
  const accountKey = readEnv(env, [
    'DATA_PLANE_OBJECT_STORE_ACCOUNT_KEY',
    'AZURE_OBJECT_STORAGE_ACCOUNT_KEY',
    'AZURE_STORAGE_ACCOUNT_KEY',
  ]) ?? parsed.accountKey;
  const sharedContainer = readEnv(env, [
    'DATA_PLANE_OBJECT_STORE_CONTAINER',
    'AZURE_OBJECT_STORAGE_CONTAINER',
  ]);

  if (!accountName) {
    throw new Error(
      'Missing object storage account. Set DATA_PLANE_OBJECT_STORE_ACCOUNT, AZURE_STORAGE_ACCOUNT_NAME, or AZURE_STORAGE_CONNECTION_STRING.',
    );
  }

  return { accountName, connectionString, accountKey, sharedContainer };
}

function createBundle(env: EnvLike = process.env): AzureStorageClientBundle {
  const config = resolveConfig(env);

  if (config.connectionString) {
    const service = BlobServiceClient.fromConnectionString(config.connectionString);
    const sharedKeyCredential = config.accountKey
      ? new StorageSharedKeyCredential(config.accountName, config.accountKey)
      : null;
    return { service, sharedKeyCredential, credential: null, config };
  }

  if (config.accountKey) {
    const sharedKeyCredential = new StorageSharedKeyCredential(config.accountName, config.accountKey);
    return {
      service: new BlobServiceClient(
        `https://${config.accountName}.blob.core.windows.net`,
        sharedKeyCredential,
      ),
      sharedKeyCredential,
      credential: null,
      config,
    };
  }

  const credential = new DefaultAzureCredential();
  return {
    service: new BlobServiceClient(
      `https://${config.accountName}.blob.core.windows.net`,
      credential,
    ),
    sharedKeyCredential: null,
    credential,
    config,
  };
}

function bundle(): AzureStorageClientBundle {
  cachedBundle ??= createBundle();
  return cachedBundle;
}

function safeContainerName(bucket: string): string {
  const normalized = bucket.trim().toLowerCase();
  if (!/^[a-z0-9](?:[a-z0-9-]{1,61}[a-z0-9])?$/.test(normalized) || normalized.includes('--')) {
    throw new Error(`Unsafe Azure Blob container name: ${bucket}`);
  }
  return normalized;
}

function resolveLocation(bucket: string, path: string): { containerName: string; blobName: string } {
  const { config } = bundle();
  const cleanPath = path.replace(/^\/+/, '');
  if (!cleanPath || cleanPath.includes('..')) throw new Error(`Unsafe object storage path: ${path}`);

  if (config.sharedContainer) {
    return {
      containerName: safeContainerName(config.sharedContainer),
      blobName: `${safeContainerName(bucket)}/${cleanPath}`,
    };
  }

  return {
    containerName: safeContainerName(bucket),
    blobName: cleanPath,
  };
}

function containerClient(bucket: string, path: string): { container: ContainerClient; containerName: string; blobName: string } {
  const { service } = bundle();
  const location = resolveLocation(bucket, path);
  return {
    container: service.getContainerClient(location.containerName),
    ...location,
  };
}

export function describeObjectStorageLocation(
  bucket: string,
  path: string,
): ObjectStorageResolvedLocation {
  const { config } = bundle();
  const location = resolveLocation(bucket, path);
  return {
    accountName: config.accountName,
    containerName: location.containerName,
    blobPath: location.blobName,
  };
}

async function normalizeBody(body: BodyInitLike): Promise<Buffer> {
  if (Buffer.isBuffer(body)) return body;
  if (body instanceof Uint8Array) return Buffer.from(body);
  if (body instanceof ArrayBuffer) return Buffer.from(body);
  if (typeof body === 'string') return Buffer.from(body, 'utf8');
  if (typeof Blob !== 'undefined' && body instanceof Blob) {
    return Buffer.from(await body.arrayBuffer());
  }
  throw new Error(`Unsupported object storage body type: ${typeof body}`);
}

function headersFromOptions(options?: ObjectStorageUploadOptions): BlobHTTPHeaders {
  return {
    blobContentType: options?.contentType,
    blobCacheControl: options?.cacheControl,
  };
}

function isAzureAuthorizationFailure(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false;
  const candidate = error as {
    statusCode?: unknown;
    code?: unknown;
    details?: { errorCode?: unknown };
    message?: unknown;
  };
  if (candidate.statusCode === 403) return true;
  const code = String(candidate.code ?? candidate.details?.errorCode ?? '');
  return (
    code === 'AuthorizationPermissionMismatch' ||
    code === 'AuthorizationFailure'
  );
}

function azureErrorSummary(error: unknown): string {
  if (!error || typeof error !== 'object') return String(error);
  const candidate = error as {
    statusCode?: unknown;
    code?: unknown;
    details?: { errorCode?: unknown };
    name?: unknown;
    message?: unknown;
  };
  const parts = [
    candidate.code || candidate.details?.errorCode
      ? `code=${String(candidate.code ?? candidate.details?.errorCode)}`
      : null,
    candidate.statusCode ? `status=${String(candidate.statusCode)}` : null,
    candidate.name ? `name=${String(candidate.name)}` : null,
    candidate.message ? `message=${String(candidate.message)}` : null,
  ].filter(Boolean);
  return parts.length > 0 ? parts.join(';') : 'unknown_azure_storage_error';
}

async function createContainerIfAllowed(
  container: ContainerClient,
): Promise<void> {
  try {
    await container.createIfNotExists();
  } catch (error) {
    if (isAzureAuthorizationFailure(error)) return;
    throw error;
  }
}

function contentDisposition(download: string | boolean | undefined): string | undefined {
  if (!download) return undefined;
  if (download === true) return 'attachment';
  const safe = download.replace(/[\r\n"]/g, '_');
  return `attachment; filename="${safe}"`;
}

async function createReadSasUrl(
  containerName: string,
  blobName: string,
  expiresInSeconds: number,
  download?: string | boolean,
): Promise<string> {
  const { service, sharedKeyCredential, config } = bundle();
  const startsOn = new Date(Date.now() - 5 * 60 * 1000);
  const expiresOn = new Date(Date.now() + Math.max(1, expiresInSeconds) * 1000);
  const sasOptions = {
    containerName,
    blobName,
    permissions: BlobSASPermissions.parse('r'),
    startsOn,
    expiresOn,
    contentDisposition: contentDisposition(download),
  };
  const sas = sharedKeyCredential
    ? generateBlobSASQueryParameters(sasOptions, sharedKeyCredential).toString()
    : generateBlobSASQueryParameters(
        sasOptions,
        await service.getUserDelegationKey(startsOn, expiresOn),
        config.accountName,
      ).toString();

  return `${service.getContainerClient(containerName).getBlobClient(blobName).url}?${sas}`;
}

class AzureBlobObjectStorageAdapter implements ObjectStorageAdapter {
  async upload(bucket: string, path: string, body: BodyInitLike, options: ObjectStorageUploadOptions = {}): Promise<void> {
    const { container, blobName } = containerClient(bucket, path);
    await createContainerIfAllowed(container);
    const blob = container.getBlockBlobClient(blobName);
    const bytes = await normalizeBody(body);
    try {
      await blob.uploadData(bytes, {
        blobHTTPHeaders: headersFromOptions(options),
        metadata: options.metadata,
        conditions: options.upsert ? undefined : { ifNoneMatch: '*' },
      });
    } catch (error) {
      throw new Error(`object_upload_failed:${azureErrorSummary(error)}`);
    }
  }

  async remove(bucket: string, paths: string[]): Promise<void> {
    await Promise.all(paths.map(async (path) => {
      const { container, blobName } = containerClient(bucket, path);
      await container.getBlockBlobClient(blobName).deleteIfExists();
    }));
  }

  async download(bucket: string, path: string): Promise<Buffer> {
    const { container, blobName } = containerClient(bucket, path);
    return container.getBlobClient(blobName).downloadToBuffer();
  }

  async createSignedUrl(
    bucket: string,
    path: string,
    expiresInSeconds: number,
    options: ObjectStorageSignedUrlOptions = {},
  ): Promise<string> {
    const { containerName, blobName } = resolveLocation(bucket, path);
    return createReadSasUrl(containerName, blobName, expiresInSeconds, options.download);
  }
}

export function getObjectStorageAdapter(): ObjectStorageAdapter {
  cachedAdapter ??= new AzureBlobObjectStorageAdapter();
  return cachedAdapter;
}

export function resetObjectStorageAdapterForTests(): void {
  cachedAdapter = null;
  cachedBundle = null;
}
