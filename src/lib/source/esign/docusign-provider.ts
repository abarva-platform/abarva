import { createHash, createHmac, timingSafeEqual } from "node:crypto";
import type { SourceNdaEsignConfig } from "./config";
import type {
  CreateEsignEnvelopeInput,
  EsignEnvelope,
  EsignProvider,
  EsignSigner,
  EsignEnvelopeStatus,
} from "./provider";

type Config = Extract<SourceNdaEsignConfig, { state: "configured" }>;
type Dependencies = {
  fetcher: (url: string, init?: RequestInit) => Promise<Response>;
  signDigest: (keyId: string, digest: Uint8Array) => Promise<Uint8Array>;
  loadWebhookSecret: () => Promise<string>;
  now: () => Date;
};

const AUTH_BASE = "https://account-d.docusign.com";
const API_BASE = "https://demo.docusign.net/restapi/v2.1";
const SYNTHETIC_TENANT = "meridian-health";
const WEBHOOK_SECRET_NAME = "source-nda-docusign-lab-webhook-hmac";
const encode = (value: Uint8Array | string) => Buffer.from(value).toString("base64url");

function signerEmail(testInbox: string, envelopeInput: CreateEsignEnvelopeInput, signer: EsignSigner) {
  const [local, domain] = testInbox.split("@");
  const suffix = createHash("sha256")
    .update(`${envelopeInput.eventId}:${envelopeInput.vendorId}:${signer.recipientId}`)
    .digest("hex").slice(0, 12);
  return `${local}+nda-${suffix}@${domain}`;
}

function validateSigner(signer: EsignSigner) {
  if (!signer.recipientId.trim() || !signer.name.trim() || !signer.email.trim() ||
      !signer.signatureAnchor.trim() ||
      (signer.delivery === "embedded" && !signer.clientUserId?.trim()) ||
      (signer.delivery === "email" && signer.clientUserId !== null) ||
      !["embedded", "email"].includes(signer.delivery)) {
    throw new Error("invalid_signer");
  }
}

function validateEnvelope(config: Config, input: CreateEsignEnvelopeInput) {
  if (config.environment !== "demo" || input.tenantKey !== SYNTHETIC_TENANT) {
    throw new Error("tenant_environment_mismatch");
  }
  if (!/^[^@\s]+@abarva\.ai$/i.test(config.testInbox)) {
    throw new Error("invalid_test_inbox");
  }
  if (!input.eventId.trim() || !input.vendorId.trim() || !input.templateVersion.trim() ||
      input.documentPdf.length < 5 ||
      Buffer.from(input.documentPdf.subarray(0, 5)).toString() !== "%PDF-" ||
      createHash("sha256").update(input.documentPdf).digest("hex") !== input.documentSha256) {
    throw new Error("invalid_document_hash");
  }
  if (input.signers.length !== 2 ||
      new Set(input.signers.map((signer) => signer.role)).size !== 2 ||
      new Set(input.signers.map((signer) => signer.recipientId)).size !== 2) {
    throw new Error("invalid_signer");
  }
  input.signers.forEach(validateSigner);
}

async function jsonResponse<T>(response: Response): Promise<T> {
  if (!response.ok) throw new Error(`docusign_http_${response.status}`);
  try {
    return await response.json() as T;
  } catch {
    throw new Error("docusign_invalid_response");
  }
}

function mapEvent(event: string): EsignEnvelopeStatus | null {
  switch (event) {
    case "envelope-sent": return "sent";
    case "envelope-delivered": return "viewed";
    case "envelope-completed": return "completed";
    case "envelope-declined": return "declined";
    default: return null;
  }
}

export function createDocuSignProvider(config: Config, dependencies: Dependencies): EsignProvider {
  const { fetcher, signDigest, loadWebhookSecret, now } = dependencies;
  const accountPath = `${API_BASE}/accounts/${encodeURIComponent(config.accountId)}`;

  async function accessToken() {
    const iat = Math.floor(now().getTime() / 1000);
    const header = encode(JSON.stringify({ alg: "RS256", typ: "JWT" }));
    const claims = encode(JSON.stringify({
      iss: config.integrationKey,
      sub: config.userId,
      aud: "account-d.docusign.com",
      iat,
      exp: iat + 3600,
      scope: "signature impersonation",
    }));
    const unsigned = `${header}.${claims}`;
    const digest = createHash("sha256").update(unsigned).digest();
    const signature = await signDigest(config.keyId, digest);
    if (!signature.length) throw new Error("key_vault_sign_failed");
    const body = new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion: `${unsigned}.${encode(signature)}`,
    });
    const token = await jsonResponse<{ access_token?: string }>(await fetcher(`${AUTH_BASE}/oauth/token`, {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded" },
      body,
    }));
    if (!token.access_token) throw new Error("docusign_invalid_token");
    return token.access_token;
  }

  async function api(path: string, init: RequestInit = {}) {
    return fetcher(`${accountPath}${path}`, {
      ...init,
      headers: {
        Authorization: `Bearer ${await accessToken()}`,
        Accept: "application/json",
        ...init.headers,
      },
    });
  }

  return {
    async createEnvelope(input): Promise<EsignEnvelope> {
      validateEnvelope(config, input);
      const signers = input.signers.map((signer, index) => ({
        recipientId: signer.recipientId,
        name: signer.name,
        email: signerEmail(config.testInbox, input, signer),
        ...(signer.delivery === "embedded" ? { clientUserId: signer.clientUserId } : {}),
        routingOrder: String(index + 1),
        tabs: {
          signHereTabs: [{ anchorString: signer.signatureAnchor, anchorUnits: "pixels", anchorXOffset: "0", anchorYOffset: "0" }],
        },
      }));
      const envelope = await jsonResponse<{ envelopeId?: string; status?: string }>(await api("/envelopes", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          status: "sent",
          emailSubject: "Synthetic NDA signing test",
          documents: [{ documentId: "1", name: "Synthetic NDA.pdf", fileExtension: "pdf", documentBase64: Buffer.from(input.documentPdf).toString("base64") }],
          recipients: { signers },
          customFields: { textCustomFields: [
            { name: "source_tenant", value: input.tenantKey, show: "false" },
            { name: "source_event_id", value: input.eventId, show: "false" },
            { name: "source_vendor_id", value: input.vendorId, show: "false" },
            { name: "source_template_version", value: input.templateVersion, show: "false" },
          ] },
        }),
      }));
      if (!envelope.envelopeId || envelope.status !== "sent") throw new Error("docusign_invalid_envelope");
      return { envelopeId: envelope.envelopeId, status: "sent" };
    },

    async getSigningLink({ envelopeId, eventId, vendorId, signer, returnUrl }) {
      validateSigner(signer);
      if (signer.delivery !== "embedded") throw new Error("email_signer_no_embedded_link");
      if (!eventId.trim() || !vendorId.trim()) throw new Error("invalid_envelope_identity");
      let callback: URL;
      try { callback = new URL(returnUrl); } catch { throw new Error("invalid_return_url"); }
      if (callback.protocol !== "https:" || callback.hostname !== "app.abarva.ai" ||
          callback.username || callback.password || callback.hash) throw new Error("invalid_return_url");
      const aliasIdentity = { eventId, vendorId } as CreateEsignEnvelopeInput;
      const view = await jsonResponse<{ url?: string }>(await api(`/envelopes/${encodeURIComponent(envelopeId)}/views/recipient`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          recipientId: signer.recipientId,
          name: signer.name,
          email: signerEmail(config.testInbox, aliasIdentity, signer),
          clientUserId: signer.clientUserId,
          returnUrl,
          authenticationMethod: "none",
        }),
      }));
      if (!view.url) throw new Error("docusign_invalid_signing_link");
      const url = new URL(view.url);
      if (url.protocol !== "https:" || !url.hostname.endsWith(".docusign.net")) {
        throw new Error("docusign_invalid_signing_link");
      }
      return view.url;
    },

    async verifyWebhook({ body, signature }) {
      const secret = await loadWebhookSecret();
      if (!secret) throw new Error("webhook_secret_missing");
      const expected = createHmac("sha256", secret).update(body).digest();
      const received = /^[A-Za-z0-9+/]+={0,2}$/.test(signature)
        ? Buffer.from(signature, "base64") : Buffer.alloc(0);
      if (received.length !== expected.length || !timingSafeEqual(received, expected)) {
        throw new Error("invalid_signature");
      }
      let payload: { event?: string; data?: { envelopeId?: string; accountId?: string } };
      try { payload = JSON.parse(body); } catch { throw new Error("invalid_event"); }
      const status = mapEvent(payload.event ?? "");
      if (!status || !payload.data?.envelopeId || payload.data.accountId !== config.accountId) {
        throw new Error("invalid_event");
      }
      return { envelopeId: payload.data.envelopeId, status };
    },

    async fetchCompletedDocuments(envelopeId) {
      if (!envelopeId.trim()) throw new Error("invalid_envelope_id");
      const path = `/envelopes/${encodeURIComponent(envelopeId)}`;
      const state = await jsonResponse<{ status?: string }>(await api(path));
      if (state.status !== "completed") throw new Error("envelope_not_completed");
      const readPdf = async (documentId: string) => {
        const response = await api(`${path}/documents/${documentId}`);
        if (!response.ok) throw new Error(`docusign_http_${response.status}`);
        const bytes = new Uint8Array(await response.arrayBuffer());
        if (bytes.length < 5 || Buffer.from(bytes.subarray(0, 4)).toString() !== "%PDF") {
          throw new Error("docusign_invalid_document");
        }
        return bytes;
      };
      const [signedDocument, certificate] = await Promise.all([
        readPdf("combined"), readPdf("certificate"),
      ]);
      return { signedDocument, certificate };
    },
  };
}

export function createAzureDocuSignProvider(config: Config): EsignProvider {
  const vaultHost = new URL(config.keyId).hostname;
  const vaultBase = `https://${vaultHost}`;
  const credential = async () => {
    const { DefaultAzureCredential } = await import("@azure/identity");
    const token = await new DefaultAzureCredential().getToken("https://vault.azure.net/.default");
    if (!token?.token) throw new Error("key_vault_auth_failed");
    return token.token;
  };
  return createDocuSignProvider(config, {
    fetcher: fetch,
    now: () => new Date(),
    signDigest: async (keyId, digest) => {
      const response = await fetch(`${keyId}/sign?api-version=7.4`, {
        method: "POST",
        headers: { Authorization: `Bearer ${await credential()}`, "content-type": "application/json" },
        body: JSON.stringify({ alg: "RS256", value: encode(digest) }),
      });
      const result = await jsonResponse<{ value?: string }>(response);
      if (!result.value) throw new Error("key_vault_sign_failed");
      return Buffer.from(result.value, "base64url");
    },
    loadWebhookSecret: async () => {
      const response = await fetch(`${vaultBase}/secrets/${WEBHOOK_SECRET_NAME}?api-version=7.4`, {
        headers: { Authorization: `Bearer ${await credential()}` },
      });
      const result = await jsonResponse<{ value?: string }>(response);
      if (!result.value) throw new Error("webhook_secret_missing");
      return result.value;
    },
  });
}
