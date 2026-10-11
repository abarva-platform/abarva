import fs from "node:fs";
import { isDeepStrictEqual } from "node:util";
import { createClerkClient } from "@clerk/backend";
import { expect, type Page } from "@playwright/test";
import { CANONICAL_TENANT_KEYS } from "../../../src/config/tenants/CANONICAL_TENANTS";
import {
  clerkFrontendApiHostFromPublishableKey,
  installClerkTestingTokenInterceptor,
} from "../../../src/lib/crawl/clerk-testing-token";

export const OPERATOR_NAME = "AbarVa E2E Operator (automated)";
export const OPERATOR_EMAIL = "e2e-operator@abarva.ai";
export const OPERATOR_CLIENT = "meridian";
export const OPERATOR_ACCOUNT_TYPE = "synthetic_e2e_operator";

export interface DedicatedOperator {
  userId: string;
  email: string;
  name: string;
  clientKey: typeof OPERATOR_CLIENT;
  created: boolean;
}

/** The Clerk backend, never the browser or an email heuristic, declares scope. */
export function operatorMetadata(approvalRef: string): Record<string, unknown> {
  if (!approvalRef.trim()) throw new Error("operator_named_approval_required");
  if (!(CANONICAL_TENANT_KEYS as readonly string[]).includes("meridian-health")) {
    throw new Error("operator_canonical_synthetic_tenant_missing");
  }
  return {
    role: "client",
    clientId: OPERATOR_CLIENT,
    defaultClientId: OPERATOR_CLIENT,
    clientLocked: true,
    accountType: OPERATOR_ACCOUNT_TYPE,
    automated: true,
    moduleAccess: ["programs"],
    programScope: "assigned_programs_only",
    approvalRef,
    programCapabilities: {
      accessLevel: "program_member",
      canCreatePrograms: true,
      canApproveGates: true,
      financialVisibility: true,
      canAdminUsers: false,
      canUploadArtifacts: true,
      canGenerateDeliverables: true,
      canPublishDeliverables: true,
    },
  };
}

export function validateOperatorMetadata(metadata: Record<string, unknown>): void {
  if (metadata.role !== "client" || metadata.clientLocked !== true ||
      metadata.clientId !== OPERATOR_CLIENT || metadata.defaultClientId !== OPERATOR_CLIENT ||
      metadata.accountType !== OPERATOR_ACCOUNT_TYPE || metadata.automated !== true ||
      metadata.programScope !== "assigned_programs_only") {
    throw new Error("dedicated_operator_scope_mismatch");
  }
  if (JSON.stringify(metadata.moduleAccess) !== JSON.stringify(["programs"])) {
    throw new Error("dedicated_operator_module_scope_mismatch");
  }
  for (const key of ["allowedClientKeys", "visibleClientKeys", "tenantRoles"]) {
    const value = metadata[key];
    if (value && (Array.isArray(value) ? value.length > 0 : Object.keys(value).length > 0)) {
      throw new Error("dedicated_operator_extra_tenant_grant");
    }
  }
  const caps = metadata.programCapabilities as Record<string, unknown> | undefined;
  const approvalRef = typeof metadata.approvalRef === "string" ? metadata.approvalRef : "";
  if (!approvalRef.trim() || !isDeepStrictEqual(caps, operatorMetadata(approvalRef).programCapabilities)) {
    throw new Error("dedicated_operator_admin_grant_refused");
  }
}

export async function provisionDedicatedOperator(): Promise<DedicatedOperator> {
  const secretKey = process.env.CLERK_PRODUCTION_E2E_SECRET_KEY?.trim();
  const approvalRef = process.env.MOVES_E2E_APPROVAL_REF?.trim();
  if (!secretKey?.startsWith("sk_live_")) throw new Error("production_operator_key_required");
  if (!approvalRef) throw new Error("operator_named_approval_required");
  const clerk = createClerkClient({ secretKey });
  const found = await clerk.users.getUserList({ emailAddress: [OPERATOR_EMAIL], limit: 2 });
  if (found.data.length > 1) throw new Error("dedicated_operator_identity_ambiguous");
  let user = found.data[0];
  const created = !user;
  if (!user) {
    const phone = process.env.MOVES_E2E_OPERATOR_PHONE?.trim();
    if (!phone || !/^\+[1-9]\d{7,14}$/.test(phone)) {
      throw new Error("dedicated_operator_controlled_phone_required");
    }
    user = await clerk.users.createUser({
      emailAddress: [OPERATOR_EMAIL],
      phoneNumber: [phone],
      firstName: "AbarVa E2E Operator",
      lastName: "(automated)",
      skipPasswordRequirement: true,
      publicMetadata: operatorMetadata(approvalRef),
    });
  }
  // Existing identities are verified, never silently re-granted or renamed.
  validateOperatorMetadata(user.publicMetadata);
  if (user.fullName !== OPERATOR_NAME || user.primaryEmailAddress?.emailAddress !== OPERATOR_EMAIL) {
    throw new Error("dedicated_operator_identity_mismatch");
  }
  return { userId: user.id, email: OPERATOR_EMAIL, name: OPERATOR_NAME,
    clientKey: OPERATOR_CLIENT, created };
}

interface EphemeralOperatorCredentials {
  operator: DedicatedOperator;
  ticket: string;
  testingToken: string;
  publishableKey: string;
  expiresAt: string;
}

function readEphemeralOperatorCredentials(): EphemeralOperatorCredentials | null {
  const filename = process.env.MOVES_E2E_OPERATOR_CREDENTIALS_FILE;
  if (!filename) return null;
  if (fs.statSync(filename).mode & 0o077) throw new Error("operator_credentials_file_permissions_refused");
  const value = JSON.parse(fs.readFileSync(filename, "utf8")) as EphemeralOperatorCredentials;
  if (!value.operator?.userId?.startsWith("user_") || value.operator.name !== OPERATOR_NAME ||
      value.operator.email !== OPERATOR_EMAIL || value.operator.clientKey !== OPERATOR_CLIENT ||
      !value.ticket || !value.testingToken || !value.publishableKey?.startsWith("pk_live_") ||
      !Number.isFinite(Date.parse(value.expiresAt)) || Date.parse(value.expiresAt) < Date.now() + 60_000) {
    throw new Error("dedicated_operator_credentials_invalid_or_expired");
  }
  return value;
}

export async function prepareDedicatedOperator(): Promise<DedicatedOperator> {
  return readEphemeralOperatorCredentials()?.operator ?? provisionDedicatedOperator();
}

export async function signInDedicatedOperator(page: Page, operator: DedicatedOperator): Promise<void> {
  // No generic AUTH_TOKEN, saved human session, or default-account auth helper.
  if (process.env.CLERK_SESSION_TOKEN || process.env.AUTH_TOKEN) {
    throw new Error("dedicated_operator_shared_session_refused");
  }
  const ephemeral = readEphemeralOperatorCredentials();
  if (ephemeral && ephemeral.operator.userId !== operator.userId) throw new Error("dedicated_operator_ticket_identity_mismatch");
  const secretKey = process.env.CLERK_PRODUCTION_E2E_SECRET_KEY?.trim();
  if (!ephemeral && !secretKey?.startsWith("sk_live_")) throw new Error("production_operator_key_required");
  const clerk = ephemeral ? null : createClerkClient({ secretKey: secretKey! });
  await page.goto("https://app.abarva.ai", { waitUntil: "domcontentloaded" });
  const publishableKey = await page.locator("script[data-clerk-publishable-key]").first()
    .getAttribute("data-clerk-publishable-key");
  if (!publishableKey?.startsWith("pk_live_") || !clerkFrontendApiHostFromPublishableKey(publishableKey)) {
    throw new Error("production_operator_frontend_instance_unverified");
  }
  const prior = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
  process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY = publishableKey;
  try {
    if (ephemeral && ephemeral.publishableKey !== publishableKey) throw new Error("dedicated_operator_clerk_instance_mismatch");
    const testingToken = ephemeral?.testingToken ?? (await clerk!.testingTokens.createTestingToken()).token;
    await installClerkTestingTokenInterceptor(page, testingToken, "https://app.abarva.ai");
  } finally {
    if (prior === undefined) delete process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
    else process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY = prior;
  }
  const ticket = ephemeral?.ticket ?? (await clerk!.signInTokens.createSignInToken({ userId: operator.userId, expiresInSeconds: 300 })).token;
  await page.waitForFunction(() => (window as unknown as { Clerk?: { loaded?: boolean } }).Clerk?.loaded === true);
  await page.evaluate(async (token) => {
    const clerk = (window as unknown as { Clerk: {
      client: { signIn: { create(input: { strategy: "ticket"; ticket: string }): Promise<{ status: string; createdSessionId?: string | null }> } };
      setActive(input: { session: string }): Promise<void>;
    } }).Clerk;
    const result = await clerk.client.signIn.create({ strategy: "ticket", ticket: token });
    if (result.status !== "complete" || !result.createdSessionId) throw new Error("dedicated_operator_ticket_incomplete");
    await clerk.setActive({ session: result.createdSessionId });
  }, ticket);
  await expect.poll(() => page.evaluate(() => (window as unknown as { Clerk?: { user?: { id: string } } }).Clerk?.user?.id))
    .toBe(operator.userId);
  await page.context().addCookies([{ name: "abarva_active_client", value: OPERATOR_CLIENT,
    domain: "app.abarva.ai", path: "/", secure: true, sameSite: "Lax" }]);
  const authenticated = await page.evaluate(() => {
    const user = (window as unknown as { Clerk: { user: { id: string; fullName: string; publicMetadata: Record<string, unknown> } } }).Clerk.user;
    return { userId: user.id, name: user.fullName, metadata: user.publicMetadata };
  });
  expect(authenticated.userId).toBe(operator.userId);
  expect(authenticated.name).toBe(OPERATOR_NAME);
  validateOperatorMetadata(authenticated.metadata);
}

export async function assertDedicatedOperator(page: Page, operator: DedicatedOperator): Promise<void> {
  const user = await page.evaluate(() => {
    const clerk = (window as unknown as { Clerk?: { user?: { id: string; fullName: string; publicMetadata: Record<string, unknown> } } }).Clerk;
    return clerk?.user ? { id: clerk.user.id, name: clerk.user.fullName, metadata: clerk.user.publicMetadata } : null;
  });
  if (!user || user.id !== operator.userId || user.name !== OPERATOR_NAME) throw new Error("dedicated_operator_identity_changed");
  validateOperatorMetadata(user.metadata);
}

/** Safe proof contains no password, ticket, cookie, token, or backend key. */
export function saveOperatorProof(filename: string, proof: unknown): void {
  fs.writeFileSync(filename, JSON.stringify(proof, null, 2), { mode: 0o600 });
}
