import { createTxSession, type TxSessionRunner } from "@/lib/data-plane/read-adapters/azureSession";
import type { EsignEnvelope } from "./provider";
import type { NdaDraftIdentity } from "./send-nda";

const uuid = /^[a-f0-9]{8}-[a-f0-9]{4}-[1-8][a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i;

function validate(input: NdaDraftIdentity): void {
  if (input.clientKey !== "meridian-health" || !uuid.test(input.eventId) ||
      !uuid.test(input.candidateAuthorityId) || !uuid.test(input.providerEnvelopeId) ||
      !input.vendorId.trim() || !input.contactAuthorityId.trim() ||
      !input.templateVersion.trim() || !/^[a-f0-9]{64}$/.test(input.documentSha256)) {
    throw new Error("invalid_draft_identity");
  }
}

export function createNdaDraftRepository(
  tx: TxSessionRunner = createTxSession("source-nda-esign-send"),
) {
  return {
    async recordDraft(input: NdaDraftIdentity): Promise<string> {
      validate(input);
      return tx(async (run) => {
        await run("SELECT set_config('app.tenant_key', $1, true)", [input.clientKey]);
        await run("SELECT pg_advisory_xact_lock(hashtext($1), hashtext($2))", [
          `${input.clientKey}:${input.eventId}`, input.vendorId,
        ]);
        const prior = await run<{ id: string }>(
          `SELECT id FROM source_nda_esign_envelopes
           WHERE client_key = $1 AND source_event_id = $2::uuid AND vendor_id = $3
             AND status IN ('created', 'sent', 'viewed', 'completed')
           LIMIT 1`,
          [input.clientKey, input.eventId, input.vendorId],
        );
        if (prior.length > 0) throw new Error("active_envelope_exists");
        const rows = await run<{ id: string }>(
          `INSERT INTO source_nda_esign_envelopes
             (client_key, source_event_id, vendor_id, candidate_authority_id,
              template_version, provider, provider_environment, provider_envelope_id,
              status, sent_at, document_sha256)
           VALUES ($1, $2::uuid, $3, $4::uuid, $5, 'docusign', 'demo', $6,
                   'created', NULL, $7)
           RETURNING id`,
          [input.clientKey, input.eventId, input.vendorId,
            input.candidateAuthorityId, input.templateVersion,
            input.providerEnvelopeId, input.documentSha256],
        );
        if (rows.length !== 1) throw new Error("draft_not_recorded");
        return rows[0]!.id;
      });
    },

    async sendAndMark(
      input: NdaDraftIdentity,
      send: () => Promise<EsignEnvelope>,
    ): Promise<void> {
      validate(input);
      await tx(async (run) => {
        await run("SELECT set_config('app.tenant_key', $1, true)", [input.clientKey]);
        const draft = await run<{ id: string }>(
          `SELECT id FROM source_nda_esign_envelopes
           WHERE client_key = $1 AND source_event_id = $2::uuid AND vendor_id = $3
             AND candidate_authority_id = $4::uuid AND template_version = $5
             AND provider = 'docusign' AND provider_environment = 'demo'
             AND provider_envelope_id = $6 AND document_sha256 = $7
             AND status = 'created'
           FOR UPDATE`,
          [input.clientKey, input.eventId, input.vendorId,
            input.candidateAuthorityId, input.templateVersion,
            input.providerEnvelopeId, input.documentSha256],
        );
        if (draft.length !== 1) throw new Error("draft_not_current");
        const contact = await run<{ id: string }>(
          `SELECT authority.id
           FROM source_event_rfx_contact_authority authority
           JOIN source.vendor_contact vendor_contact
             ON vendor_contact.tenant_key = authority.client_key
            AND vendor_contact.vendor_id = authority.vendor_id
            AND vendor_contact.contact_id = authority.contact_id
            AND vendor_contact.display_name = authority.approved_contact_name
            AND vendor_contact.email = authority.approved_contact_email
           JOIN source_event_candidate_supplier_authority candidate
             ON candidate.client_key = authority.client_key
            AND candidate.source_event_id = authority.source_event_id
            AND candidate.vendor_id = authority.vendor_id
            AND candidate.authority_id = authority.candidate_authority_id
           JOIN source_nda_template_versions template
             ON template.client_key = authority.client_key
            AND template.source_event_id = authority.source_event_id
           WHERE authority.client_key = $1 AND authority.source_event_id = $2::uuid
             AND authority.vendor_id = $3 AND authority.authority_id = $4
             AND authority.authority_state = 'approved' AND authority.retired_at IS NULL
             AND authority.approved_by_user_id IS NOT NULL
             AND authority.approved_at IS NOT NULL AND authority.evidence_reference IS NOT NULL
             AND vendor_contact.contact_policy = 'contact_allowed'
             AND vendor_contact.contact_state = 'active'
             AND candidate.id = $5::uuid AND candidate.authority_state = 'accepted'
             AND candidate.retired_at IS NULL
             AND template.template_version = $6 AND template.content_sha256 = $7
             AND template.publication_state = 'published'
             AND template.publication_authority_kind = 'synthetic_admin'
             AND template.published_at <= now()
             AND template.effective_from <= current_date
             AND (template.effective_to IS NULL OR template.effective_to >= current_date)
           FOR SHARE OF authority, vendor_contact, candidate, template`,
          [input.clientKey, input.eventId, input.vendorId,
            input.contactAuthorityId, input.candidateAuthorityId,
            input.templateVersion, input.documentSha256],
        );
        if (contact.length !== 1) throw new Error("contact_not_approved");

        const result = await send();
        if (result.envelopeId !== input.providerEnvelopeId || result.status !== "sent") {
          throw new Error("provider_send_not_confirmed");
        }
        const sent = await run<{ id: string }>(
          `UPDATE source_nda_esign_envelopes
           SET status = 'sent', sent_at = now()
           WHERE id = $1::uuid AND client_key = $2 AND status = 'created'
           RETURNING id`,
          [draft[0]!.id, input.clientKey],
        );
        if (sent.length !== 1) throw new Error("send_not_recorded");
      });
    },
  };
}
