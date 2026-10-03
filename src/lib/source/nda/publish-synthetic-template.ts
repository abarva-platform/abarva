import { createHash } from "node:crypto";
import { createTxSession, type TxSessionRunner } from "@/lib/data-plane/read-adapters/azureSession";
import { getObjectStorageAdapter } from "@/lib/data-plane/objectStorage";
import { extractSourceUploadText } from "@/lib/source/artifact-registry/upload-text-extraction";

export type PublishSyntheticTemplateInput = {
  clientKey: string;
  eventId: string;
  artifactId: string;
  templateVersion: string;
  displayName: string;
  actorUserId: string;
  actorName: string;
  rationale: string;
  acknowledged: boolean;
};

export type PublishSyntheticTemplateResult =
  | { ok: true; id: string }
  | { ok: false; code: "invalid_publication" | "template_artifact_unavailable" | "template_bytes_mismatch" | "template_not_synthetic" | "duplicate_version" | "authority_unavailable" };

type ArtifactRow = {
  id: string;
  blob_uri: string;
  blob_container: string;
  document_sha256: string | null;
  mime_type: string;
  artifact_type: string;
  uploader_user_id: string | null;
};

const validUuid = (value: string) =>
  /^[a-f0-9]{8}-[a-f0-9]{4}-[1-8][a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i.test(value);

export async function publishSyntheticTemplate(
  input: PublishSyntheticTemplateInput,
  dependencies: {
    tx?: TxSessionRunner;
    download?: (bucket: string, path: string) => Promise<Uint8Array>;
    extractText?: (bytes: Buffer) => Promise<string | null>;
  } = {},
): Promise<PublishSyntheticTemplateResult> {
  if (input.clientKey !== "meridian-health" ||
      !validUuid(input.eventId) || !validUuid(input.artifactId) ||
      !/^[A-Za-z0-9._-]{3,64}$/.test(input.templateVersion) ||
      input.displayName.trim().length < 3 ||
      input.actorUserId.trim().length === 0 || input.actorName.trim().length < 2 ||
      input.rationale.trim().length < 12 || !input.acknowledged) {
    return { ok: false, code: "invalid_publication" };
  }

  const tx = dependencies.tx ?? createTxSession("source-nda-synthetic-template-publication");
  const download = dependencies.download ?? ((bucket: string, blobPath: string) =>
    getObjectStorageAdapter().download(bucket, blobPath));
  const extractText = dependencies.extractText ?? (async (bytes: Buffer) => {
    const extracted = await extractSourceUploadText({ buffer: bytes, mimeType: "application/pdf" });
    return extracted.text;
  });

  try {
    return await tx(async (run) => {
      await run("SELECT set_config('app.tenant_key', $1, true)", [input.clientKey]);
      const artifacts = await run<ArtifactRow>(
        `SELECT id, blob_uri, blob_container,
                NULLIF(BTRIM(COALESCE(blob_sha256, sha256)), '') AS document_sha256,
                mime_type, artifact_type, uploader_user_id
         FROM source_artifacts
         WHERE tenant_key = $1
           AND (source_event_id = $2 OR source_event_row_id = $2::uuid)
           AND id = $3::uuid
           AND artifact_group = 'upload'
           AND artifact_type = 'nda_template'
           AND lifecycle_state = 'current'
         FOR SHARE`,
        [input.clientKey, input.eventId, input.artifactId],
      );
      const artifact = artifacts[0];
      if (artifacts.length !== 1 || !artifact ||
          artifact.artifact_type !== "nda_template" ||
          artifact.mime_type !== "application/pdf" ||
          artifact.blob_container !== "source-artifacts" ||
          !artifact.blob_uri.startsWith(`${input.clientKey}/${input.eventId}/${input.artifactId}/`) ||
          !artifact.uploader_user_id?.trim() ||
          !artifact.document_sha256 || !/^[a-f0-9]{64}$/.test(artifact.document_sha256)) {
        return { ok: false, code: "template_artifact_unavailable" };
      }

      const bytes = await download("source-artifacts", artifact.blob_uri);
      const sha256 = createHash("sha256").update(bytes).digest("hex");
      if (bytes.length < 5 || bytes.length > 10_000_000 ||
          Buffer.from(bytes.subarray(0, 5)).toString() !== "%PDF-" ||
          sha256 !== artifact.document_sha256) {
        return { ok: false, code: "template_bytes_mismatch" };
      }
      const text = await extractText(Buffer.from(bytes));
      if (!text || !/SYNTHETIC TEST FIXTURE/i.test(text)) {
        return { ok: false, code: "template_not_synthetic" };
      }

      const rows = await run<{ id: string }>(
        `INSERT INTO source_nda_template_versions (
           client_key, source_event_id, template_version, template_code, display_name,
           publication_state, publication_authority_kind, content_sha256,
           published_by_admin_user_id, published_by_admin_name,
           publication_rationale, published_at, effective_from, evidence_reference
         ) VALUES (
           $1, $2::uuid, $3, 'SYNTHETIC_MUTUAL_NDA', $4,
           'published', 'synthetic_admin', $5, $6, $7, $8, now(), current_date, $9
         ) ON CONFLICT (client_key, template_version) DO NOTHING
         RETURNING id`,
        [input.clientKey, input.eventId, input.templateVersion, input.displayName.trim(),
          sha256, input.actorUserId, input.actorName.trim(),
          input.rationale.trim(), `source-artifacts/${artifact.blob_uri}`],
      );
      return rows[0]
        ? { ok: true, id: rows[0].id }
        : { ok: false, code: "duplicate_version" };
    });
  } catch {
    return { ok: false, code: "authority_unavailable" };
  }
}
