// Admin Loader — landing-zone scan (IT direct-upload exception).
//
// When IT prefers to drop originals straight into Azure Blob (e.g. via Storage
// Explorer) rather than the browser, those files land under the tenant prefix
// in the `context-landing` container. This module lists them so the Admin
// Loader can pick them up and run the same understand -> commit flow.
//
// The lister is injectable so the route + tests never require Azure.

import "server-only";

import { DEFAULT_PRESERVE_CONTAINER } from "./preserve-original";

export interface LandingZoneObject {
  objectKey: string;
  filename: string;
  bytes: number;
  contentType?: string;
  lastModified?: string; // ISO
}

export interface LandingZoneLister {
  list(container: string, prefix: string): Promise<LandingZoneObject[]>;
}

/** Tenant-scoped prefix used by `preserveOriginalToBlob`: landing/<tenantKey>/ */
export function landingPrefix(tenantKey: string): string {
  return `landing/${tenantKey}/`;
}

function basename(objectKey: string): string {
  const parts = objectKey.split("/");
  const last = parts[parts.length - 1] ?? objectKey;
  // strip the "<uuid>-" prefix that preserveOriginalToBlob prepends, if present.
  return last.replace(/^[0-9a-fA-F-]{36}-/, "");
}

/**
 * List originals already staged for a tenant.
 * Always scoped to the tenant prefix — never lists across tenants.
 */
export async function scanLandingZone(args: {
  tenantKey: string;
  container?: string;
  lister: LandingZoneLister;
}): Promise<{ container: string; prefix: string; objects: LandingZoneObject[] }> {
  const container = args.container ?? DEFAULT_PRESERVE_CONTAINER;
  const prefix = landingPrefix(args.tenantKey);
  const objects = await args.lister.list(container, prefix);
  // Defensive: enforce the prefix even if a lister returns extra keys.
  const scoped = objects.filter((o) => o.objectKey.startsWith(prefix));
  return { container, prefix, objects: scoped };
}

/** Production lister backed by @azure/storage-blob. Mirrors azureBlobWriter config. */
export function azureLandingZoneLister(): LandingZoneLister {
  return {
    async list(container: string, prefix: string): Promise<LandingZoneObject[]> {
      const [{ BlobServiceClient }, { DefaultAzureCredential }] = await Promise.all([
        import("@azure/storage-blob"),
        import("@azure/identity"),
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
          "azureLandingZoneLister: missing storage config (set AZURE_STORAGE_CONNECTION_STRING or AZURE_STORAGE_ACCOUNT_NAME)",
        );
      }

      const containerClient = serviceClient.getContainerClient(container);
      const out: LandingZoneObject[] = [];
      for await (const blob of containerClient.listBlobsFlat({ prefix })) {
        const obj: LandingZoneObject = {
          objectKey: blob.name,
          filename: basename(blob.name),
          bytes: blob.properties.contentLength ?? 0,
        };
        const ct = blob.properties.contentType;
        if (ct) obj.contentType = ct;
        const lm = blob.properties.lastModified;
        if (lm) obj.lastModified = new Date(lm).toISOString();
        out.push(obj);
      }
      return out;
    },
  };
}
