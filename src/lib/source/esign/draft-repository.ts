import {
  createTxSession,
  type SqlRunner,
  type TxSessionRunner,
} from "@/lib/data-plane/read-adapters/azureSession";

export type DraftEnvelopeIdentity = {
  clientKey: string;
  eventId: string;
  vendorId: string;
  candidateAuthorityId: string;
  templateVersion: string;
  providerEnvelopeId: string;
  documentSha256: string;
};

const TENANT = "meridian-health";
const UUID = /^[a-f0-9]{8}-[a-f0-9]{4}-[1-8][a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i;
const SHA256 = /^[a-f0-9]{64}$/;

function validate(input: DraftEnvelopeIdentity) {
  if (input.clientKey !== TENANT || !UUID.test(input.eventId) ||
      !UUID.test(input.candidateAuthorityId) || !UUID.test(input.providerEnvelopeId) ||
      !input.vendorId.trim() || !input.templateVersion.trim() ||
      !SHA256.test(input.documentSha256)) {
    throw new Error("invalid_draft_identity");
  }
}

export function createDraftEnvelopeStore(
  tx: TxSessionRunner = createTxSession("source-nda-esign-draft"),
) {
  const withTenant = <T>(fn: (run: SqlRunner) => Promise<T>): Promise<T> => tx(async (run) => {
    await run("SELECT set_config('app.tenant_key', $1, true)", [TENANT]);
    return fn(run);
  });
  const identity = (input: DraftEnvelopeIdentity) => [
    input.clientKey, input.eventId, input.vendorId, input.candidateAuthorityId,
    input.templateVersion, input.providerEnvelopeId, input.documentSha256,
  ];

  return {
    async recordDraft(input: DraftEnvelopeIdentity): Promise<string> {
      validate(input);
      return withTenant(async (run) => {
        const rows = await run<{ id: string }>(
          `INSERT INTO source_nda_esign_envelopes
             (client_key, source_event_id, vendor_id, candidate_authority_id,
              template_version, provider, provider_environment, provider_envelope_id,
              status, sent_at, document_sha256)
           VALUES ($1, $2::uuid, $3, $4::uuid, $5, 'docusign', 'demo', $6,
                   'created', NULL, $7)
           RETURNING id`,
          identity(input),
        );
        if (rows.length !== 1) throw new Error("draft_not_recorded");
        return rows[0].id;
      });
    },
    async markSent(input: DraftEnvelopeIdentity): Promise<boolean> {
      validate(input);
      return withTenant(async (run) => {
        const rows = await run<{ id: string }>(
          `UPDATE source_nda_esign_envelopes
           SET status = 'sent', sent_at = now()
           WHERE client_key = $1 AND source_event_id = $2::uuid
             AND vendor_id = $3 AND candidate_authority_id = $4::uuid
             AND template_version = $5 AND provider = 'docusign'
             AND provider_environment = 'demo' AND provider_envelope_id = $6
             AND document_sha256 = $7 AND status = 'created'
           RETURNING id`,
          identity(input),
        );
        return rows.length === 1;
      });
    },
  };
}
