import crypto from "node:crypto";

const sha256 = (bytes) => crypto.createHash("sha256").update(bytes).digest("hex");
const SAFE = /^[a-zA-Z0-9_-]+$/;

export function richStageBlobConfig(env = process.env) {
  const account = env.TOWER_RICH_STAGE_PROOF_BLOB_ACCOUNT;
  const container = env.TOWER_RICH_STAGE_PROOF_BLOB_CONTAINER;
  const runId = env.TOWER_RICH_STAGE_RUN_ID;
  const imageDigest = env.ABARVA_OPERATOR_IMAGE_DIGEST;
  if (!/^[a-z0-9-]{3,24}$/.test(account ?? "") ||
      !/^[a-z0-9-]{3,63}$/.test(container ?? "") ||
      !SAFE.test(runId ?? "") ||
      !/^sha256:[a-f0-9]{64}$/.test(imageDigest ?? "") ||
      (!env.AZURE_STORAGE_CONNECTION_STRING && !env.AZURE_CLIENT_ID)) {
    throw new Error("Private stage needs Blob account, container, run ID, digest-pinned image and Blob credential");
  }
  return { account, container, runId, imageDigest };
}

export async function uploadRichStageProof(bytes, { tenantKey, assessmentId, config, containerClient }) {
  if (!SAFE.test(tenantKey) || !SAFE.test(assessmentId)) {
    throw new Error("Private stage proof scope is invalid");
  }
  const blobPath = `operator-proof/tower-rich-synthetic-stage/${tenantKey}/${assessmentId}/${config.runId}/tower-stage-proof.tgz`;
  let container = containerClient;
  if (!container) {
    const { BlobServiceClient } = await import("@azure/storage-blob");
    if (process.env.AZURE_STORAGE_CONNECTION_STRING) {
      container = BlobServiceClient.fromConnectionString(process.env.AZURE_STORAGE_CONNECTION_STRING)
        .getContainerClient(config.container);
    } else {
      const { DefaultAzureCredential } = await import("@azure/identity");
      const credential = new DefaultAzureCredential({ managedIdentityClientId: process.env.AZURE_CLIENT_ID });
      container = new BlobServiceClient(`https://${config.account}.blob.core.windows.net`, credential)
        .getContainerClient(config.container);
    }
  }
  const blob = container.getBlockBlobClient(blobPath);
  try {
    await blob.uploadData(bytes, {
      blobHTTPHeaders: { blobContentType: "application/gzip" },
      conditions: { ifNoneMatch: "*" },
    });
  } catch (error) {
    if (![409, 412].includes(error?.statusCode)) throw error;
  }
  const stored = await blob.downloadToBuffer();
  if (!stored.equals(bytes)) throw new Error("Immutable stage proof Blob readback differs from this job's proof");
  return {
    uri: `https://${config.account}.blob.core.windows.net/${config.container}/${blobPath}`,
    sha256: sha256(stored),
    bytes: stored.length,
  };
}
