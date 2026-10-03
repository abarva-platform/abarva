import { createHash } from "node:crypto";
import { azureRead } from "@/lib/data-plane/azureRead";
import type { SourceNdaEsignConfig } from "./config";
import type { EsignEnvelope, EsignProvider } from "./provider";

export type NdaSendIdentity = {
  clientKey: string;
  eventId: string;
  vendorId: string;
  contactAuthorityId: string;
  templateVersion: string;
  actorUserId: string;
  actorName: string;
  acknowledged: boolean;
};

export type NdaSigningAuthority = {
  candidateAuthorityId: string;
  contactAuthorityId: string;
  contactName: string;
  supplierLegalName: string;
  templateVersion: string;
  documentSha256: string;
  blobContainer: string;
  blobPath: string;
};

export type NdaDraftIdentity = {
  clientKey: string;
  eventId: string;
  vendorId: string;
  candidateAuthorityId: string;
  contactAuthorityId: string;
  templateVersion: string;
  documentSha256: string;
  providerEnvelopeId: string;
};

export type NdaSendDependencies = {
  config: SourceNdaEsignConfig;
  provider: EsignProvider | null;
  loadAuthority: (input: NdaSendIdentity) => Promise<NdaSigningAuthority | null>;
  download: (container: string, path: string) => Promise<Uint8Array>;
  extractText: (bytes: Uint8Array) => Promise<string | null>;
  recordDraft: (identity: NdaDraftIdentity) => Promise<string>;
  sendAndMark: (identity: NdaDraftIdentity, send: () => Promise<EsignEnvelope>) => Promise<void>;
};

export type NdaSendResult =
  | { ok: true; envelopeId: string }
  | { ok: false; code: "provider_unavailable" | "authority_not_ready" | "document_mismatch" | "draft_not_recorded" | "send_not_confirmed" };

type AuthorityRow = {
  candidate_id: string;
  contact_authority_id: string;
  contact_name: string;
  supplier_legal_name: string;
  template_version: string;
  content_sha256: string;
  blob_container: string;
  blob_uri: string;
};

export async function readSyntheticNdaSigningAuthority(
  input: NdaSendIdentity,
): Promise<NdaSigningAuthority | null> {
  if (input.clientKey !== "meridian-health") return null;
  try {
    return await azureRead.withSession(async (run) => {
      await run("SELECT set_config('app.tenant_key', $1, false)", [input.clientKey]);
      const rows = await run<AuthorityRow>(
        `SELECT candidate.id AS candidate_id,
                contact_authority.authority_id AS contact_authority_id,
                contact_authority.approved_contact_name AS contact_name,
                vendor.legal_name AS supplier_legal_name,
                template.template_version, template.content_sha256,
                artifact.blob_container, artifact.blob_uri
         FROM source_event_candidate_supplier_authority candidate
         JOIN source.vendor vendor
           ON vendor.tenant_key = candidate.client_key
          AND vendor.vendor_id = candidate.vendor_id
         JOIN source_event_rfx_contact_authority contact_authority
           ON contact_authority.client_key = candidate.client_key
          AND contact_authority.source_event_id = candidate.source_event_id
          AND contact_authority.vendor_id = candidate.vendor_id
          AND contact_authority.candidate_authority_id = candidate.authority_id
         JOIN source.vendor_contact vendor_contact
           ON vendor_contact.tenant_key = contact_authority.client_key
          AND vendor_contact.vendor_id = contact_authority.vendor_id
          AND vendor_contact.contact_id = contact_authority.contact_id
          AND vendor_contact.display_name = contact_authority.approved_contact_name
          AND vendor_contact.email = contact_authority.approved_contact_email
         JOIN source_nda_template_versions template
           ON template.client_key = candidate.client_key
          AND template.source_event_id = candidate.source_event_id
         JOIN source_artifacts artifact
           ON artifact.tenant_key = template.client_key
          AND (artifact.source_event_id = candidate.source_event_id::text
               OR artifact.source_event_row_id = candidate.source_event_id)
          AND template.evidence_reference = 'source-artifacts/' || artifact.blob_uri
         WHERE candidate.client_key = $1
           AND candidate.source_event_id = $2::uuid
           AND candidate.vendor_id = $3
           AND candidate.authority_state = 'accepted'
           AND candidate.retired_at IS NULL
           AND contact_authority.authority_id = $4
           AND contact_authority.authority_state = 'approved'
           AND contact_authority.retired_at IS NULL
           AND contact_authority.approved_at IS NOT NULL
           AND contact_authority.approved_by_user_id IS NOT NULL
           AND contact_authority.evidence_reference IS NOT NULL
           AND vendor_contact.contact_policy = 'contact_allowed'
           AND vendor_contact.contact_state = 'active'
           AND template.template_version = $5
           AND template.publication_state = 'published'
           AND template.publication_authority_kind = 'synthetic_admin'
           AND template.published_at <= now()
           AND template.effective_from <= current_date
           AND (template.effective_to IS NULL OR template.effective_to >= current_date)
           AND artifact.artifact_group = 'upload'
           AND artifact.artifact_type = 'nda_template'
           AND artifact.lifecycle_state = 'current'
           AND artifact.mime_type = 'application/pdf'
           AND artifact.blob_container = 'source-artifacts'
           AND COALESCE(artifact.blob_sha256, artifact.sha256) = template.content_sha256
         LIMIT 2`,
        [input.clientKey, input.eventId, input.vendorId,
          input.contactAuthorityId, input.templateVersion],
      );
      if (rows.length !== 1) return null;
      const row = rows[0]!;
      return {
        candidateAuthorityId: row.candidate_id,
        contactAuthorityId: row.contact_authority_id,
        contactName: row.contact_name,
        supplierLegalName: row.supplier_legal_name,
        templateVersion: row.template_version,
        documentSha256: row.content_sha256,
        blobContainer: row.blob_container,
        blobPath: row.blob_uri,
      };
    });
  } catch {
    return null;
  }
}

export async function sendSyntheticNdaForSignature(
  input: NdaSendIdentity,
  deps: NdaSendDependencies,
): Promise<NdaSendResult> {
  const config = deps.config;
  if (input.clientKey !== "meridian-health" || config.state !== "configured" ||
      config.environment !== "demo" || !deps.provider) {
    return { ok: false, code: "provider_unavailable" };
  }
  const uuid = /^[a-f0-9]{8}-[a-f0-9]{4}-[1-8][a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i;
  if (!uuid.test(input.eventId) || !input.vendorId.trim() ||
      !input.contactAuthorityId.trim() || !input.templateVersion.trim() ||
      !input.actorUserId.trim() || !input.actorName.trim() || !input.acknowledged) {
    return { ok: false, code: "authority_not_ready" };
  }

  let authority: NdaSigningAuthority | null;
  try {
    authority = await deps.loadAuthority(input);
  } catch {
    return { ok: false, code: "authority_not_ready" };
  }
  if (!authority || authority.contactAuthorityId !== input.contactAuthorityId ||
      authority.templateVersion !== input.templateVersion ||
      !authority.supplierLegalName.trim() ||
      !uuid.test(authority.candidateAuthorityId) ||
      authority.blobContainer !== "source-artifacts" ||
      !authority.blobPath.startsWith(`${input.clientKey}/${input.eventId}/`) ||
      !/^[a-f0-9]{64}$/.test(authority.documentSha256)) {
    return { ok: false, code: "authority_not_ready" };
  }

  let documentPdf: Uint8Array;
  let documentText: string | null;
  try {
    documentPdf = await deps.download(authority.blobContainer, authority.blobPath);
    if (documentPdf.length < 5 || documentPdf.length > 10_000_000 ||
        Buffer.from(documentPdf.subarray(0, 5)).toString() !== "%PDF-" ||
        createHash("sha256").update(documentPdf).digest("hex") !== authority.documentSha256) {
      return { ok: false, code: "document_mismatch" };
    }
    documentText = await deps.extractText(documentPdf);
  } catch {
    return { ok: false, code: "document_mismatch" };
  }
  const normalizedText = documentText?.replace(/\s+/g, " ").trim() ?? "";
  if (!normalizedText.includes("SYNTHETIC TEST FIXTURE") ||
      normalizedText.split("SUPPLIER_SIGNATURE_HERE").length !== 2 ||
      normalizedText.split("BUYER_SIGNATURE_HERE").length !== 2 ||
      /\[[^\]]{2,80}\]/.test(normalizedText) ||
      !normalizedText.toLowerCase().includes(
        authority.supplierLegalName.replace(/\s+/g, " ").trim().toLowerCase(),
      )) {
    return { ok: false, code: "document_mismatch" };
  }

  let draft;
  try {
    draft = await deps.provider.createDraftEnvelope({
      tenantKey: input.clientKey,
      eventId: input.eventId,
      vendorId: input.vendorId,
      templateVersion: input.templateVersion,
      documentPdf,
      documentSha256: authority.documentSha256,
      signers: [
        { recipientId: "1", role: "supplier", name: authority.contactName,
          email: config.testInbox, signatureAnchor: "SUPPLIER_SIGNATURE_HERE",
          delivery: "email", clientUserId: null },
        { recipientId: "2", role: "buyer", name: input.actorName,
          email: config.testInbox, signatureAnchor: "BUYER_SIGNATURE_HERE",
          delivery: "email", clientUserId: null },
      ],
    });
  } catch {
    return { ok: false, code: "provider_unavailable" };
  }
  if (draft.status !== "created" || !uuid.test(draft.envelopeId)) {
    return { ok: false, code: "provider_unavailable" };
  }
  const identity: NdaDraftIdentity = {
    clientKey: input.clientKey,
    eventId: input.eventId,
    vendorId: input.vendorId,
    candidateAuthorityId: authority.candidateAuthorityId,
    contactAuthorityId: authority.contactAuthorityId,
    templateVersion: authority.templateVersion,
    documentSha256: authority.documentSha256,
    providerEnvelopeId: draft.envelopeId,
  };
  try {
    await deps.recordDraft(identity);
  } catch {
    return { ok: false, code: "draft_not_recorded" };
  }
  try {
    await deps.sendAndMark(identity, () => deps.provider!.sendDraftEnvelope({
      tenantKey: input.clientKey, envelopeId: draft.envelopeId,
    }));
  } catch {
    return { ok: false, code: "send_not_confirmed" };
  }
  return { ok: true, envelopeId: draft.envelopeId };
}
