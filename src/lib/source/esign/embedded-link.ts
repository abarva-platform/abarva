import { azureRead } from "@/lib/data-plane/azureRead";
import type { SourceNdaEsignConfig } from "./config";
import type { EsignProvider } from "./provider";
import {
  buildSyntheticNdaSigner,
  type NdaSendIdentity,
  type NdaSigningAuthority,
} from "./send-nda";

export type NdaEmbeddedLinkIdentity = Omit<NdaSendIdentity, "acknowledged"> & {
  envelopeId: string;
  role: "supplier" | "buyer";
};

export type NdaEmbeddedEnvelope = {
  candidateAuthorityId: string;
  documentSha256: string;
};

export type NdaEmbeddedLinkDependencies = {
  config: SourceNdaEsignConfig;
  provider: EsignProvider | null;
  loadAuthority: (input: NdaSendIdentity) => Promise<NdaSigningAuthority | null>;
  loadEnvelope: (input: NdaEmbeddedLinkIdentity) => Promise<NdaEmbeddedEnvelope | null>;
};

export type NdaEmbeddedLinkResult =
  | { ok: true; url: string }
  | { ok: false; code: "provider_unavailable" | "authority_not_ready" | "envelope_not_ready" | "signing_link_unavailable" };

type EnvelopeRow = {
  candidate_authority_id: string;
  document_sha256: string;
};

const uuid = /^[a-f0-9]{8}-[a-f0-9]{4}-[1-8][a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i;

export async function readSyntheticNdaEmbeddedEnvelope(
  input: NdaEmbeddedLinkIdentity,
): Promise<NdaEmbeddedEnvelope | null> {
  if (input.clientKey !== "meridian-health") return null;
  try {
    return await azureRead.withSession(async (run) => {
      await run("SELECT set_config('app.tenant_key', $1, false)", [input.clientKey]);
      const rows = await run<EnvelopeRow>(
        `SELECT candidate_authority_id, document_sha256
         FROM source_nda_esign_envelopes
         WHERE client_key = $1 AND source_event_id = $2::uuid AND vendor_id = $3
           AND template_version = $4 AND provider_envelope_id = $5
           AND provider = 'docusign' AND provider_environment = 'demo'
           AND status IN ('sent', 'viewed') AND sent_at IS NOT NULL
         LIMIT 2`,
        [input.clientKey, input.eventId, input.vendorId,
          input.templateVersion, input.envelopeId],
      );
      if (rows.length !== 1) return null;
      return {
        candidateAuthorityId: rows[0]!.candidate_authority_id,
        documentSha256: rows[0]!.document_sha256,
      };
    });
  } catch {
    return null;
  }
}

export async function createSyntheticNdaEmbeddedLink(
  input: NdaEmbeddedLinkIdentity,
  deps: NdaEmbeddedLinkDependencies,
): Promise<NdaEmbeddedLinkResult> {
  const config = deps.config;
  if (input.clientKey !== "meridian-health" || config.state !== "configured" ||
      config.environment !== "demo" || !/@abarva\.ai$/i.test(config.testInbox) ||
      !deps.provider) {
    return { ok: false, code: "provider_unavailable" };
  }
  if (!uuid.test(input.eventId) || !uuid.test(input.envelopeId) ||
      !input.vendorId.trim() || !input.contactAuthorityId.trim() ||
      !input.templateVersion.trim() || !input.actorUserId.trim() ||
      !input.actorName.trim() || !["supplier", "buyer"].includes(input.role) ||
      (input.deliveryMode !== undefined && input.deliveryMode !== "embedded")) {
    return { ok: false, code: "authority_not_ready" };
  }

  const authorityInput: NdaSendIdentity = {
    ...input, acknowledged: true, deliveryMode: "embedded",
  };
  let authority: NdaSigningAuthority | null;
  let envelope: NdaEmbeddedEnvelope | null;
  try {
    [authority, envelope] = await Promise.all([
      deps.loadAuthority(authorityInput), deps.loadEnvelope(input),
    ]);
  } catch {
    return { ok: false, code: "authority_not_ready" };
  }
  if (!authority || authority.contactAuthorityId !== input.contactAuthorityId ||
      authority.templateVersion !== input.templateVersion ||
      !uuid.test(authority.candidateAuthorityId)) {
    return { ok: false, code: "authority_not_ready" };
  }
  if (!envelope || envelope.candidateAuthorityId !== authority.candidateAuthorityId ||
      envelope.documentSha256 !== authority.documentSha256) {
    return { ok: false, code: "envelope_not_ready" };
  }

  try {
    const url = await deps.provider.getSigningLink({
      envelopeId: input.envelopeId,
      eventId: input.eventId,
      vendorId: input.vendorId,
      signer: buildSyntheticNdaSigner(authorityInput, authority, config.testInbox, input.role),
      returnUrl: `https://app.abarva.ai/source/new/${input.eventId}`,
    });
    const parsed = new URL(url);
    if (parsed.protocol !== "https:" || !parsed.hostname.endsWith(".docusign.net") ||
        parsed.username || parsed.password) throw new Error("invalid_signing_link");
    return { ok: true, url };
  } catch {
    return { ok: false, code: "signing_link_unavailable" };
  }
}
