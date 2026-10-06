import { uploadArtifactBytes, uploadArtifactPath } from "@/lib/source/file-cabinet/blob-store";
import type { WebhookDependencies } from "./webhook-processing";

export const uploadCompletedNdaFile: WebhookDependencies["upload"] = async (input) => {
  const location = uploadArtifactPath({
    tenantKey: input.tenantKey,
    sourceEventId: input.eventId,
    evidenceFamily: "nda_esign",
    uploadBatchId: input.envelopeId,
    fileName: input.fileName,
  });
  await uploadArtifactBytes(location, Buffer.from(input.bytes), "pdf", {
    tenantKey: input.tenantKey,
    sourceEventId: input.eventId,
    vendorId: input.vendorId,
    envelopeId: input.envelopeId,
  });
  return `${location.bucket}/${location.path}`;
};
