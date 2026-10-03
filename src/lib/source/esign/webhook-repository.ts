import {
  createTxSession,
  type SqlRunner,
  type TxSessionRunner,
} from "@/lib/data-plane/read-adapters/azureSession";
import { uploadArtifactPath } from "@/lib/source/file-cabinet/blob-store";
import type { WebhookEnvelopeStore, WebhookEnvelope, CompletedEnvelopeEvidence } from "./webhook-processing";

const TENANT = "meridian-health";
const PROVIDER = "docusign";
const ENVIRONMENT = "demo";

type EnvelopeRow = {
  client_key: string;
  source_event_id: string;
  vendor_id: string;
  provider_envelope_id: string;
  status: WebhookEnvelope["status"];
};

export function createWebhookEnvelopeStore(
  tx: TxSessionRunner = createTxSession("source-nda-esign-webhook"),
): WebhookEnvelopeStore {
  const withTenant = <T>(fn: (run: SqlRunner) => Promise<T>): Promise<T> => tx(async (run) => {
    await run("SELECT set_config('app.tenant_key', $1, true)", [TENANT]);
    return fn(run);
  });
  const identity = (envelopeId: string) => [TENANT, PROVIDER, ENVIRONMENT, envelopeId];

  return {
    read: (envelopeId) => withTenant<WebhookEnvelope | null>(async (run) => {
      const rows = await run<EnvelopeRow>(
        `SELECT client_key, source_event_id, vendor_id, provider_envelope_id, status
         FROM source_nda_esign_envelopes
         WHERE client_key = $1 AND provider = $2 AND provider_environment = $3
           AND provider_envelope_id = $4`,
        identity(envelopeId),
      );
      const row = rows[0];
      return row ? {
        clientKey: row.client_key,
        eventId: row.source_event_id,
        vendorId: row.vendor_id,
        providerEnvelopeId: row.provider_envelope_id,
        status: row.status,
      } : null;
    }),
    markViewed: (envelopeId) => withTenant<boolean>(async (run) => {
      const rows = await run<{ id: string }>(
        `UPDATE source_nda_esign_envelopes
         SET status = 'viewed', viewed_at = now()
         WHERE client_key = $1 AND provider = $2 AND provider_environment = $3
           AND provider_envelope_id = $4 AND status = 'sent'
         RETURNING id`,
        identity(envelopeId),
      );
      return rows.length === 1;
    }),
    markDeclined: (envelopeId) => withTenant<boolean>(async (run) => {
      const rows = await run<{ id: string }>(
        `UPDATE source_nda_esign_envelopes
         SET status = 'declined', declined_at = now()
         WHERE client_key = $1 AND provider = $2 AND provider_environment = $3
           AND provider_envelope_id = $4 AND status IN ('sent', 'viewed')
         RETURNING id`,
        identity(envelopeId),
      );
      return rows.length === 1;
    }),
    markCompleted: (envelope, evidence: CompletedEnvelopeEvidence) => withTenant<boolean>(async (run) => {
      const expectedRef = (fileName: string) => {
        const location = uploadArtifactPath({
          tenantKey: TENANT,
          sourceEventId: envelope.eventId,
          evidenceFamily: "nda_esign",
          uploadBatchId: envelope.providerEnvelopeId,
          fileName,
        });
        return `${location.bucket}/${location.path}`;
      };
      if (envelope.clientKey !== TENANT ||
          evidence.signedDocumentRef !== expectedRef(`signed-${evidence.signedDocumentSha256}.pdf`) ||
          evidence.certificateRef !== expectedRef(`certificate-${evidence.certificateSha256}.pdf`) ||
          !/^[a-f0-9]{64}$/.test(evidence.signedDocumentSha256) ||
          !/^[a-f0-9]{64}$/.test(evidence.certificateSha256)) {
        throw new Error("invalid_completed_evidence");
      }
      const rows = await run<{ id: string }>(
        `UPDATE source_nda_esign_envelopes
         SET status = 'completed', completed_at = now(),
             signed_document_blob_ref = $5, signed_document_sha256 = $6,
             certificate_blob_ref = $7, certificate_sha256 = $8
         WHERE client_key = $1 AND provider = $2 AND provider_environment = $3
           AND provider_envelope_id = $4 AND source_event_id = $9 AND vendor_id = $10
           AND status IN ('sent', 'viewed')
         RETURNING id`,
        [...identity(envelope.providerEnvelopeId), evidence.signedDocumentRef, evidence.signedDocumentSha256,
          evidence.certificateRef, evidence.certificateSha256, envelope.eventId, envelope.vendorId],
      );
      return rows.length === 1;
    }),
  };
}
