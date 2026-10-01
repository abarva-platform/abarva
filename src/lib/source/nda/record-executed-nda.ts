import {
  createTxSession,
  type TxSessionRunner,
} from "@/lib/data-plane/read-adapters/azureSession";
import type { NdaScopeLevel } from "./nda-scope-authority";
import type { NdaSignatureMethod } from "./executed-document-evidence";
import { evaluateExecutedDocumentEvidence } from "./executed-document-evidence";

export type RecordExecutedNdaInput = {
  clientKey: string;
  eventId: string;
  vendorId: string;
  ndaId: string;
  artifactId: string;
  templateVersion: string;
  scopeLevel: NdaScopeLevel;
  coveredAffiliateEntityIds: string[];
  effectiveFrom: string;
  effectiveTo: string | null;
  executedAt: string;
  uploadedByUserId: string;
  recordedByUserId: string;
  evidenceReference: string | null;
  signatureMethod: NdaSignatureMethod;
  supplierSignatoryName: string;
  buyerSignatoryName: string;
  certificateSha256: string | null;
  privateEvidenceRef: string | null;
};

export type RecordExecutedNdaResult =
  | { ok: true; id: string }
  | {
      ok: false;
      code:
        | "invalid_record"
        | "candidate_not_accepted"
        | "executed_artifact_unavailable"
        | "signature_evidence_incomplete"
        | "published_template_unavailable"
        | "duplicate_nda_id"
        | "authority_unavailable";
    };

const nonempty = (value: string | null | undefined): boolean =>
  typeof value === "string" && value.trim().length > 0;
const validHash = (value: string): boolean => /^[a-f0-9]{64}$/.test(value);
const validUuid = (value: string): boolean =>
  /^[a-f0-9]{8}-[a-f0-9]{4}-[1-8][a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i.test(value);

export async function recordExecutedNda(
  input: RecordExecutedNdaInput,
  tx: TxSessionRunner = createTxSession("source-executed-nda-authority"),
  asOfIso: string = new Date().toISOString(),
): Promise<RecordExecutedNdaResult> {
  if (
    !validUuid(input.eventId) ||
    !validUuid(input.artifactId) ||
    ![
      input.clientKey,
      input.vendorId,
      input.ndaId,
      input.templateVersion,
      input.uploadedByUserId,
      input.recordedByUserId,
    ].every(nonempty) ||
    Number.isNaN(Date.parse(input.effectiveFrom)) ||
    (input.effectiveTo !== null && Number.isNaN(Date.parse(input.effectiveTo))) ||
    Number.isNaN(Date.parse(input.executedAt)) ||
    (input.effectiveTo !== null && input.effectiveTo < input.effectiveFrom) ||
    input.scopeLevel !== "event_only" ||
    input.coveredAffiliateEntityIds.length !== 0
  ) {
    return { ok: false, code: "invalid_record" };
  }

  try {
    return await tx(async (run) => {
      await run("SELECT set_config('app.tenant_key', $1, true)", [input.clientKey]);

      const candidates = await run<{ vendor_id: string }>(
        `SELECT authority.vendor_id
         FROM source_event_candidate_supplier_authority authority
         WHERE authority.client_key = $1
           AND authority.source_event_id = $2::uuid
           AND authority.vendor_id = $3
           AND authority.authority_state = 'accepted'
           AND authority.retired_at IS NULL
         FOR SHARE`,
        [input.clientKey, input.eventId, input.vendorId],
      );
      if (candidates.length !== 1) {
        return { ok: false, code: "candidate_not_accepted" };
      }

      const artifacts = await run<{ document_sha256: string }>(
        `SELECT NULLIF(BTRIM(COALESCE(blob_sha256, sha256)), '') AS document_sha256
         FROM source_artifacts
         WHERE tenant_key = $1
           AND (source_event_id = $2 OR source_event_row_id = $2::uuid)
           AND id = $3::uuid
           AND artifact_type = 'nda_executed'
           AND lifecycle_state = 'current'
         FOR SHARE`,
        [input.clientKey, input.eventId, input.artifactId],
      );
      const documentHash = artifacts[0]?.document_sha256;
      if (artifacts.length !== 1 || !documentHash || !validHash(documentHash)) {
        return { ok: false, code: "executed_artifact_unavailable" };
      }

      const signature = evaluateExecutedDocumentEvidence(
        {
          documentSha256: documentHash,
          signatureMethod: input.signatureMethod,
          signedAt: input.executedAt,
          supplierSignatoryName: input.supplierSignatoryName,
          buyerSignatoryName: input.buyerSignatoryName,
          certificateSha256: input.certificateSha256,
          privateEvidenceRef: input.privateEvidenceRef,
        },
        asOfIso,
      );
      if (
        signature.state !== "complete" ||
        (input.certificateSha256 !== null && !validHash(input.certificateSha256))
      ) {
        return { ok: false, code: "signature_evidence_incomplete" };
      }

      const templates = await run<{ template_version: string }>(
        `SELECT template_version
         FROM source_nda_template_versions
         WHERE client_key = $1
           AND template_version = $2
           AND publication_state = 'published'
           AND published_at <= $3::timestamptz
           AND effective_from <= $4::date
           AND (effective_to IS NULL OR effective_to >= $4::date)
         FOR SHARE`,
        [input.clientKey, input.templateVersion, input.executedAt, input.executedAt.slice(0, 10)],
      );
      if (templates.length !== 1) {
        return { ok: false, code: "published_template_unavailable" };
      }

      const inserted = await run<{ id: string }>(
        `INSERT INTO source_executed_nda_authority (
           nda_id, client_key, source_event_id, artifact_id,
           supplier_legal_entity_id, template_version, scope_level,
           covered_affiliate_entity_ids, effective_from, effective_to,
           executed_at, uploaded_by_user_id, recorded_by_user_id,
           evidence_reference, signature_method, supplier_signatory_name,
           buyer_signatory_name, certificate_sha256, private_evidence_ref
         ) VALUES (
           $1, $2, $3::uuid, $4::uuid, $5, $6, $7, $8::text[],
           $9::date, $10::date, $11::timestamptz, $12, $13, $14,
           $15, $16, $17, $18, $19
         ) ON CONFLICT (client_key, nda_id) DO NOTHING
         RETURNING id`,
        [
          input.ndaId, input.clientKey, input.eventId, input.artifactId,
          input.vendorId, input.templateVersion, input.scopeLevel,
          input.coveredAffiliateEntityIds, input.effectiveFrom, input.effectiveTo,
          input.executedAt, input.uploadedByUserId, input.recordedByUserId,
          input.evidenceReference, input.signatureMethod, input.supplierSignatoryName,
          input.buyerSignatoryName, input.certificateSha256, input.privateEvidenceRef,
        ],
      );
      return inserted[0]
        ? { ok: true, id: inserted[0].id }
        : { ok: false, code: "duplicate_nda_id" };
    });
  } catch {
    return { ok: false, code: "authority_unavailable" };
  }
}
