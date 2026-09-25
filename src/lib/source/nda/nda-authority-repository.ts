import { azureRead } from "@/lib/data-plane/azureRead";
import type { ExecutedDocumentEvidence } from "./executed-document-evidence";
import type {
  ExecutedNdaRecord,
  NdaScopeLevel,
  NdaWaiverRecord,
} from "./nda-scope-authority";

type TemplateVersionRow = {
  template_version: string;
};

type WaiverRow = {
  waiver_id: string;
  client_key: string;
  supplier_legal_entity_id: string;
  source_event_id: string;
  reason: string;
  expires_at: string | Date;
  approved_by_legal_name: string;
  approved_at: string | Date;
};

type ExecutedNdaRow = {
  nda_id: string;
  client_key: string;
  source_event_id: string;
  supplier_legal_entity_id: string;
  template_version: string;
  scope_level: NdaScopeLevel;
  covered_affiliate_entity_ids: string[] | null;
  effective_from: string | Date;
  executed_at: string | Date;
  effective_to: string | Date | null;
  uploaded_by_user_id: string;
  signature_method: string | null;
  supplier_signatory_name: string | null;
  buyer_signatory_name: string | null;
  certificate_sha256: string | null;
  private_evidence_ref: string | null;
  document_sha256: string | null;
};

export type NdaAuthorityRead = {
  registryAvailable: boolean;
  publishedTemplateVersions: string[];
  executedNdas: ExecutedNdaRecord[];
  waivers: NdaWaiverRecord[];
};

export type NdaAuthorityReadInput = {
  clientKey: string;
  eventId: string;
  supplierLegalEntityId: string;
};

const UNAVAILABLE: NdaAuthorityRead = {
  registryAvailable: false,
  publishedTemplateVersions: [],
  executedNdas: [],
  waivers: [],
};

function nonempty(value: string): boolean {
  return value.trim().length > 0;
}

function iso(value: string | Date): string {
  return value instanceof Date ? value.toISOString() : value;
}

/**
 * Read the governed Stage 05 authority slice for one event and one declared
 * supplier legal entity. Any missing relation or malformed scope fails closed.
 */
export async function readNdaAuthorityForEvent(
  input: NdaAuthorityReadInput,
): Promise<NdaAuthorityRead> {
  if (
    !nonempty(input.clientKey) ||
    !nonempty(input.eventId) ||
    !nonempty(input.supplierLegalEntityId)
  ) {
    return UNAVAILABLE;
  }

  try {
    return await azureRead.withSession(async (run) => {
      await run("SELECT set_config('app.tenant_key', $1, false)", [
        input.clientKey,
      ]);
      const templateRows = await run<TemplateVersionRow>(
        `SELECT template_version
         FROM source_nda_template_versions
         WHERE client_key = $1
           AND publication_state = 'published'
         ORDER BY published_at DESC, template_version ASC`,
        [input.clientKey],
      );
      const executedNdaRows = await run<ExecutedNdaRow>(
        `SELECT authority.nda_id, authority.client_key,
                authority.source_event_id, authority.supplier_legal_entity_id,
                authority.template_version, authority.scope_level,
                authority.covered_affiliate_entity_ids,
                authority.effective_from, authority.effective_to,
                authority.executed_at,
                authority.uploaded_by_user_id,
                authority.signature_method,
                authority.supplier_signatory_name,
                authority.buyer_signatory_name,
                authority.certificate_sha256,
                authority.private_evidence_ref,
                NULLIF(BTRIM(COALESCE(artifact.blob_sha256, artifact.sha256)), '')
                  AS document_sha256
         FROM source_executed_nda_authority authority
         JOIN source_artifacts artifact
           ON artifact.id = authority.artifact_id
          AND artifact.tenant_key = authority.client_key
         WHERE authority.client_key = $1
           AND authority.source_event_id = $2::uuid
           AND authority.supplier_legal_entity_id = $3
           AND authority.authority_state = 'recorded'
           AND artifact.artifact_type = 'nda_executed'
           AND artifact.lifecycle_state = 'current'
           AND NULLIF(BTRIM(COALESCE(artifact.blob_sha256, artifact.sha256)), '') IS NOT NULL
         ORDER BY authority.executed_at DESC, authority.nda_id ASC`,
        [input.clientKey, input.eventId, input.supplierLegalEntityId],
      );
      const waiverRows = await run<WaiverRow>(
        `SELECT waiver_id, client_key, supplier_legal_entity_id,
                source_event_id, reason, expires_at,
                approved_by_legal_name, approved_at
         FROM source_event_nda_waivers
         WHERE client_key = $1
           AND source_event_id = $2::uuid
           AND supplier_legal_entity_id = $3
           AND revoked_at IS NULL
         ORDER BY approved_at DESC, waiver_id ASC`,
        [input.clientKey, input.eventId, input.supplierLegalEntityId],
      );

      return {
        // A successful empty read is materially different from a relation that
        // does not exist or cannot be read. Legal has published nothing; the
        // registry is still modelled and available.
        registryAvailable: true,
        publishedTemplateVersions: templateRows.map(
          (row) => row.template_version,
        ),
        executedNdas: executedNdaRows.map((row) => ({
          ndaId: row.nda_id,
          tenantKey: row.client_key,
          supplierLegalEntityId: row.supplier_legal_entity_id,
          templateVersion: row.template_version,
          scopeLevel: row.scope_level,
          coveredEventIds: [row.source_event_id],
          coveredAffiliateEntityIds:
            row.covered_affiliate_entity_ids ?? [],
          effectiveFrom: iso(row.effective_from),
          ...(row.effective_to === null
            ? {}
            : { effectiveTo: iso(row.effective_to) }),
          uploadedBy: row.uploaded_by_user_id,
          // The document hash comes from the artifact this authority row
          // points at, not from a second copy on the row. `executed_at` is
          // the signature date; there is no separate signed_at column.
          signatureEvidence: {
            documentSha256: row.document_sha256,
            signatureMethod:
              (row.signature_method as ExecutedDocumentEvidence["signatureMethod"]) ??
              null,
            signedAt: iso(row.executed_at),
            supplierSignatoryName: row.supplier_signatory_name,
            buyerSignatoryName: row.buyer_signatory_name,
            certificateSha256: row.certificate_sha256,
            privateEvidenceRef: row.private_evidence_ref,
          },
        })),
        waivers: waiverRows.map((row) => ({
          waiverId: row.waiver_id,
          tenantKey: row.client_key,
          supplierLegalEntityId: row.supplier_legal_entity_id,
          eventId: row.source_event_id,
          reason: row.reason,
          expiresAt: iso(row.expires_at),
          approvedByLegalName: row.approved_by_legal_name,
          approvedAt: iso(row.approved_at),
        })),
      };
    });
  } catch {
    return UNAVAILABLE;
  }
}
