import "server-only";

import { createHash } from "node:crypto";

import { getObjectStorageAdapter } from "@/lib/data-plane/objectStorage";
import { extractSourceUploadText } from "@/lib/source/artifact-registry/upload-text-extraction";
import { contentTypeFor, type SourceArtifactRecord } from "@/lib/source/file-cabinet/types";

export async function readVerifiedClientFinalText(
  artifact: SourceArtifactRecord,
  tenantKey: string,
  eventId: string,
): Promise<{ text: string; method: string }> {
  if (
    artifact.blobContainer !== "source-artifacts" ||
    !artifact.blobPath.startsWith(`${tenantKey}/${eventId}/${artifact.id}/`) ||
    !artifact.blobSha256
  ) {
    throw new Error("invalid_client_final_storage");
  }
  const bytes = await getObjectStorageAdapter().download(
    artifact.blobContainer,
    artifact.blobPath,
  );
  if (createHash("sha256").update(bytes).digest("hex") !== artifact.blobSha256) {
    throw new Error("client_final_hash_mismatch");
  }
  const extracted = await extractSourceUploadText({
    buffer: bytes,
    mimeType: contentTypeFor(artifact.fileFormat).split(";")[0],
  });
  if (!extracted.text?.trim()) throw new Error("unreadable_client_final");
  return { text: extracted.text, method: extracted.method };
}
