import { createSourceNdaEsignRuntime } from "@/lib/source/esign/runtime";
import { createWebhookEnvelopeStore } from "@/lib/source/esign/webhook-repository";
import { uploadCompletedNdaFile } from "@/lib/source/esign/webhook-blob-store";
import { processVerifiedEsignEvent } from "@/lib/source/esign/webhook-processing";

export const runtime = "nodejs";
const MAX_BODY_BYTES = 256_000;

async function readBoundedBody(request: Request): Promise<string | null> {
  const length = Number(request.headers.get("content-length"));
  if (Number.isFinite(length) && length > MAX_BODY_BYTES) return null;
  if (!request.body) return "";
  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let size = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > MAX_BODY_BYTES) {
        await reader.cancel();
        return null;
      }
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }
  return Buffer.concat(chunks).toString("utf8");
}

export async function POST(request: Request): Promise<Response> {
  if (!request.headers.get("content-type")?.toLowerCase().startsWith("application/json")) {
    return Response.json({ ok: false }, { status: 415 });
  }
  const signature = request.headers.get("x-docusign-signature-1")?.trim();
  if (!signature) return Response.json({ ok: false }, { status: 401 });
  const body = await readBoundedBody(request);
  if (body === null) return Response.json({ ok: false }, { status: 413 });
  const { provider } = createSourceNdaEsignRuntime("meridian-health");
  if (!provider) return Response.json({ ok: false }, { status: 503 });

  let event;
  try {
    event = await provider.verifyWebhook({ body, signature });
  } catch (error) {
    const code = error instanceof Error ? error.message : "";
    const status = code === "invalid_signature" ? 401
      : code === "webhook_secret_missing" || code.startsWith("key_vault_") ? 503 : 400;
    return Response.json({ ok: false }, { status });
  }

  try {
    const state = await processVerifiedEsignEvent(event, {
      provider,
      store: createWebhookEnvelopeStore(),
      upload: uploadCompletedNdaFile,
    });
    const status = state.state === "not_found" ? 503
      : state.state === "conflict" ? 409
      : state.state === "duplicate" ? 200 : 202;
    return Response.json({ ok: status < 300 }, { status });
  } catch {
    return Response.json({ ok: false }, { status: 503 });
  }
}
