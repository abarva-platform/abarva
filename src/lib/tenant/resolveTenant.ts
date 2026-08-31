import { cookies } from "next/headers";
import { auth, currentUser } from "@clerk/nextjs/server";
import {
  hasExplicitTenantAlias,
  isLockedTenantRole,
  resolveSessionRole,
} from "@/lib/auth/access-routing";
import { getStaticLaunchAccessProfile } from "@/lib/auth/launch-access";
import {
  PRIVATE_BROWSER_PROOF_SESSION_COOKIE,
  readPrivateBrowserProofSessionValue,
} from "@/lib/auth/private-browser-proof-session";
import {
  DEFAULT_CLIENT_KEY,
  inferClientKeyFromEmail,
  isClientKey,
  type ClientKey,
} from "@/lib/client-config";
import { azureRead } from "@/lib/data-plane/azureRead";
import type {
  CanonicalTenant,
  TenantResolutionSource,
} from "./CanonicalTenant";
import { TenantResolutionError } from "./CanonicalTenant";
import {
  appClientKeyForTenant,
  canonicalTenantDisplayName,
  tenantAliasesFor,
  tenantIndustryCode,
  tenantProfileForClientKey,
} from "./aliases";

export const ACTIVE_CLIENT_COOKIE = "abarva_active_client";

interface SessionClientContext {
  role?: string;
  clientId?: string;
  defaultClientId?: string;
  email?: string;
}

export interface ResolveTenantInput {
  requestedClient?: string | null;
  surfaceClientKey?: string | null;
  surfaceActiveClient?: string | null;
  allowFallback?: boolean;
}

async function getSessionClientContext(): Promise<SessionClientContext> {
  try {
    const store = await cookies();
    const proofSession = await readPrivateBrowserProofSessionValue(
      store.get(PRIVATE_BROWSER_PROOF_SESSION_COOKIE)?.value,
    );
    if (proofSession) {
      return {
        role: proofSession.role,
        clientId: proofSession.clientId,
        defaultClientId: proofSession.defaultClientId,
        email: proofSession.email,
      };
    }
  } catch {
    // Fall through to the Clerk-backed session path.
  }

  let session: Awaited<ReturnType<typeof auth>> | null = null;
  try {
    session = await auth();
  } catch {
    session = null;
  }
  const claims = session?.sessionClaims as
    | {
        publicMetadata?: {
          role?: string;
          clientId?: string;
          defaultClientId?: string;
        };
        email?: string;
        emailAddress?: string;
        email_addresses?: Array<{ emailAddress?: string }>;
        emailAddresses?: Array<{ emailAddress?: string }>;
      }
    | undefined;
  const claimEmail =
    claims?.emailAddress ??
    claims?.email ??
    claims?.emailAddresses?.[0]?.emailAddress ??
    claims?.email_addresses?.[0]?.emailAddress ??
    undefined;
  const claimContext: SessionClientContext = {
    role: claims?.publicMetadata?.role,
    clientId: claims?.publicMetadata?.clientId,
    defaultClientId: claims?.publicMetadata?.defaultClientId,
    email: claimEmail,
  };

  try {
    const user = await currentUser();
    return {
      role:
        claimContext.role ?? (user?.publicMetadata?.role as string | undefined),
      clientId:
        claimContext.clientId ??
        (user?.publicMetadata?.clientId as string | undefined),
      defaultClientId:
        claimContext.defaultClientId ??
        (user?.publicMetadata?.defaultClientId as string | undefined),
      email:
        user?.primaryEmailAddress?.emailAddress ??
        user?.emailAddresses?.[0]?.emailAddress ??
        claimContext.email,
    };
  } catch {
    return claimContext;
  }
}

async function getCookieClientKey(): Promise<ClientKey | null> {
  try {
    const store = await cookies();
    const fromCookie = store.get(ACTIVE_CLIENT_COOKIE)?.value ?? null;
    return appClientKeyForTenant(fromCookie);
  } catch {
    return null;
  }
}

function candidateClientKey(
  value: string | null | undefined,
): ClientKey | null {
  return appClientKeyForTenant(value) ?? (isClientKey(value) ? value : null);
}

function firstResolvedCandidate(
  candidates: Array<{
    value: string | null | undefined;
    source: TenantResolutionSource;
  }>,
): { key: ClientKey; source: TenantResolutionSource } | null {
  for (const candidate of candidates) {
    const key = candidateClientKey(candidate.value);
    if (key) return { key, source: candidate.source };
  }
  return null;
}

async function resolveClientRow(appClientKey: ClientKey): Promise<{
  id: string;
  name: string | null;
  industry_code: string | null;
} | null> {
  try {
    const aliases = tenantAliasesFor(appClientKey);

    for (const alias of aliases) {
      const data = await azureRead.maybeSingle<{
        id: string;
        name: string | null;
        industry_code: string | null;
      }>({
        table: "clients",
        columns: ["id", "name", "industry_code"],
        where: { tenant_key: alias },
      });
      if (data) return data;
    }

    for (const alias of aliases) {
      const data = await azureRead.maybeSingle<{
        id: string;
        name: string | null;
        industry_code: string | null;
      }>({
        table: "clients",
        columns: ["id", "name", "industry_code"],
        where: { slug: alias },
      });
      if (data) return data;
    }

    for (const alias of aliases) {
      const data = await azureRead.maybeSingle<{
        id: string;
        name: string | null;
        industry_code: string | null;
      }>({
        table: "clients",
        columns: ["id", "name", "industry_code"],
        where: { name: { op: "ilike", value: alias } },
      });
      if (data) return data;
    }
  } catch (error) {
    // Fix B: any error reaching here is a real DB/lookup failure. azureRead.maybeSingle
    // returns null (not an error) for a genuine zero-row result, so this catch only fires
    // on a query/connection error. Previously we swallowed all non-infra DB errors to null,
    // which surfaced as a confusing `no_client` 403 on a transient DB blip. Re-throw ALL DB
    // errors (infra and otherwise) so the caller can distinguish a retryable lookup failure
    // from a user who genuinely has no client. The caller (getActiveClientRow) classifies
    // infra vs other; requireTenancy maps any DB error to a retryable 503.
    throw error;
  }
  return null;
}

export async function resolveTenant(
  input: ResolveTenantInput = {},
): Promise<CanonicalTenant> {
  const allowFallback = input.allowFallback ?? true;
  const session = await getSessionClientContext();
  const role = resolveSessionRole(session.role, session.email);
  const inferredFromEmail = inferClientKeyFromEmail(session.email);
  const explicitTenantEmail = hasExplicitTenantAlias(session.email);
  const launchClientKey =
    getStaticLaunchAccessProfile(session.email)?.clientKey ?? null;
  const cookieClientKey = await getCookieClientKey();
  const isLockedRole = isLockedTenantRole(role, session.email);

  const requested =
    input.requestedClient ??
    input.surfaceClientKey ??
    input.surfaceActiveClient ??
    null;
  const explicitRequestProvided = Boolean(requested?.trim());
  const resolved = isLockedRole
    ? firstResolvedCandidate([
        {
          value: explicitTenantEmail ? inferredFromEmail : null,
          source: "email",
        },
        { value: session.clientId, source: "session" },
        { value: session.defaultClientId, source: "session" },
        { value: inferredFromEmail, source: "email" },
        { value: cookieClientKey, source: "cookie" },
      ])
    : firstResolvedCandidate([
        { value: requested, source: "body" },
        { value: launchClientKey, source: "email" },
        {
          value:
            explicitTenantEmail && !launchClientKey ? inferredFromEmail : null,
          source: "email",
        },
        { value: cookieClientKey, source: "cookie" },
        { value: session.clientId, source: "session" },
        { value: session.defaultClientId, source: "session" },
        { value: inferredFromEmail, source: "email" },
      ]);

  if (!resolved && !allowFallback) {
    if (explicitRequestProvided) {
      throw new TenantResolutionError(
        "unknown_tenant",
        `Unknown tenant alias: ${requested}`,
      );
    }
    throw new TenantResolutionError(
      "missing_tenant",
      "No tenant could be resolved from request, session, cookie, or email.",
    );
  }

  const appClientKey = resolved?.key ?? DEFAULT_CLIENT_KEY;
  const source = resolved?.source ?? "fallback";
  const profile = tenantProfileForClientKey(appClientKey);
  const clientRow = await resolveClientRow(appClientKey);
  // Diagnostic for task #103 — TenantSwitcher cookie not honored.
  // Surfaces the picked source + the inputs at every position in the
  // candidate list so a Vercel log line reveals whether the cookie was
  // present and whether a higher-priority source overrode it. Gated on
  // env so we can leave it on in prod while the bug is open and turn
  // it off once stable. ABARVA_TENANT_RESOLVE_TRACE=1 enables.
  if (process.env.ABARVA_TENANT_RESOLVE_TRACE === "1") {
    try {
      console.log(
        JSON.stringify({
          event: "tenant_resolve_trace",
          ts: new Date().toISOString(),
          pickedKey: appClientKey,
          pickedSource: source,
          isLockedRole,
          inputs: {
            requested: input.requestedClient ?? null,
            surfaceClientKey: input.surfaceClientKey ?? null,
            surfaceActiveClient: input.surfaceActiveClient ?? null,
            cookie: cookieClientKey,
            sessionClientId: session.clientId ?? null,
            sessionDefaultClientId: session.defaultClientId ?? null,
            inferredFromEmail,
            explicitTenantEmail,
            role,
          },
        }),
      );
    } catch {
      // Swallow — diagnostic logging must never break the resolver.
    }
  }
  return {
    appClientKey,
    canonicalKey: profile.canonicalKey,
    brokerKey: profile.brokerKey,
    clientId: clientRow?.id ?? null,
    displayName:
      canonicalTenantDisplayName(appClientKey, clientRow?.name) ??
      profile.displayName,
    industryCode:
      clientRow?.industry_code?.trim() || tenantIndustryCode(appClientKey),
    aliases: tenantAliasesFor(appClientKey),
    source,
  };
}
