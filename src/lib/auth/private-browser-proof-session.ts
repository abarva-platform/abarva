import type { ClientKey } from "@/lib/client-config";
import type { ProductModule } from "@/lib/auth/module-access";

export const PRIVATE_BROWSER_PROOF_SESSION_COOKIE =
  "abarva_private_browser_proof_session";

export interface PrivateBrowserProofSession {
  email: string;
  role: "client";
  clientId: ClientKey;
  defaultClientId: ClientKey;
  clientName: string;
  tenantKey: string;
  tenantName: string;
  allowedClientKeys: ClientKey[];
  visibleClientKeys: ClientKey[];
  moduleAccess: ProductModule[];
  tenantRoles: Record<string, string>;
  exp: number;
}

const MERIDIAN_PROOF_SESSION: Omit<
  PrivateBrowserProofSession,
  "email" | "exp"
> = {
  role: "client",
  clientId: "meridian",
  defaultClientId: "meridian",
  clientName: "Meridian Health",
  tenantKey: "meridian_health_global",
  tenantName: "Meridian Health",
  allowedClientKeys: ["meridian"],
  visibleClientKeys: ["meridian"],
  moduleAccess: ["programs", "source", "intelligence", "tower"],
  tenantRoles: {
    meridian: "tenant_admin",
    "meridian-health": "tenant_admin",
    meridian_health_global: "tenant_admin",
  },
};

function base64UrlEncode(value: string): string {
  return btoa(value)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

function base64UrlDecode(value: string): string {
  const padded = value
    .replace(/-/g, "+")
    .replace(/_/g, "/")
    .padEnd(Math.ceil(value.length / 4) * 4, "=");
  return atob(padded);
}

function bytesToBase64Url(bytes: Uint8Array): string {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return base64UrlEncode(binary);
}

function base64UrlToBytes(value: string): Uint8Array {
  const binary = base64UrlDecode(value);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }
  return bytes;
}

function bytesToArrayBuffer(bytes: Uint8Array): ArrayBuffer {
  const buffer = new ArrayBuffer(bytes.byteLength);
  new Uint8Array(buffer).set(bytes);
  return buffer;
}

async function hmacKey(secret: string) {
  return crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"],
  );
}

async function signPayload(payload: string, secret: string): Promise<string> {
  const key = await hmacKey(secret);
  const signature = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(payload),
  );
  return bytesToBase64Url(new Uint8Array(signature));
}

async function verifyPayload(
  payload: string,
  signature: string,
  secret: string,
): Promise<boolean> {
  const key = await hmacKey(secret);
  return crypto.subtle.verify(
    "HMAC",
    key,
    bytesToArrayBuffer(base64UrlToBytes(signature)),
    new TextEncoder().encode(payload),
  );
}

function privateProofSecret(): string | null {
  if (process.env.ABARVA_PRIVATE_BROWSER_PROOF_ENABLED !== "1") return null;
  return process.env.ABARVA_PRIVATE_BROWSER_PROOF_TOKEN?.trim() || null;
}

export function isPrivateBrowserProofEnabled(): boolean {
  return privateProofSecret() !== null;
}

export async function createPrivateBrowserProofSessionValue(
  email: string,
  ttlSeconds = 900,
): Promise<string | null> {
  const secret = privateProofSecret();
  if (!secret) return null;
  const payload = base64UrlEncode(
    JSON.stringify({
      ...MERIDIAN_PROOF_SESSION,
      email,
      exp: Math.floor(Date.now() / 1000) + ttlSeconds,
    }),
  );
  const signature = await signPayload(payload, secret);
  return `${payload}.${signature}`;
}

export async function readPrivateBrowserProofSessionValue(
  value: string | null | undefined,
): Promise<PrivateBrowserProofSession | null> {
  const secret = privateProofSecret();
  if (!secret || !value) return null;
  const [payload, signature] = value.split(".");
  if (!payload || !signature) return null;
  const verified = await verifyPayload(payload, signature, secret).catch(
    () => false,
  );
  if (!verified) return null;
  const parsed = JSON.parse(
    base64UrlDecode(payload),
  ) as PrivateBrowserProofSession;
  if (parsed.exp < Math.floor(Date.now() / 1000)) return null;
  if (
    parsed.clientId !== "meridian" ||
    parsed.tenantKey !== "meridian_health_global"
  ) {
    return null;
  }
  return parsed;
}
