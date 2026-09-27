import "server-only";

import { createClerkClient } from "@clerk/backend";
import type { ClientKey } from "@/lib/client-config";
import { getClientOption } from "@/lib/client-config";
import type { LaunchAccessProfile } from "@/lib/auth/launch-access";
import { getLaunchAccessProfile } from "@/lib/auth/launch-access-server";
import type { ProductModule } from "@/lib/auth/module-access";
import { tenantAliasesFor, tenantProfileForClientKey } from "@/lib/tenant/aliases";

type ClerkClient = ReturnType<typeof createClerkClient>;

interface ClerkUserLike {
  id: string;
  publicMetadata?: Record<string, unknown> | null;
}

export type LaunchUserProvisioningResult =
  | {
      ok: true;
      status: "created" | "updated" | "unchanged";
      userId: string;
      profile: LaunchAccessProfile;
      publicMetadata: Record<string, unknown>;
    }
  | {
      ok: false;
      error: "access_not_provisioned" | "clerk_not_configured";
    };

function moduleAccessFor(profile: LaunchAccessProfile): ProductModule[] {
  if (profile.role === "admin" || profile.role === "maestro") {
    return ["setup", "programs", "source", "intelligence", "tower"];
  }
  return ["programs", "source", "intelligence", "tower"];
}

function tenantRoleFor(profile: LaunchAccessProfile): string {
  return profile.role === "admin" || profile.role === "maestro"
    ? "tenant_admin"
    : "viewer";
}

function tenantKeyForClient(clientKey: ClientKey): string {
  const profile = tenantProfileForClientKey(clientKey);
  return profile.appClientKey === "meridian"
    ? "meridian_health_global"
    : profile.canonicalKey;
}

function buildTenantRoles(profile: LaunchAccessProfile): Record<string, string> {
  if (!profile.clientKey) return {};
  const role = tenantRoleFor(profile);
  return Object.fromEntries(
    tenantAliasesFor(profile.clientKey).map((alias) => [alias, role]),
  );
}

function buildLaunchPublicMetadata(
  profile: LaunchAccessProfile,
): Record<string, unknown> {
  const clientKey = profile.clientKey;
  const clientOption = clientKey ? getClientOption(clientKey) : null;
  const tenantProfile = clientKey ? tenantProfileForClientKey(clientKey) : null;
  return {
    role: profile.role,
    ...(clientKey
      ? {
          clientId: clientKey,
          defaultClientId: clientKey,
          clientLocked: true,
          clientName: clientOption?.name ?? tenantProfile?.displayName,
          tenantKey: tenantKeyForClient(clientKey),
          tenantName: tenantProfile?.displayName ?? clientOption?.name,
          allowedClientKeys: [clientKey],
          visibleClientKeys: [clientKey],
          tenantRoles: buildTenantRoles(profile),
        }
      : {}),
    moduleAccess: moduleAccessFor(profile),
    accountType: "launch_access",
    launchAccessLabel: profile.label,
  };
}

function metadataMatches(
  current: Record<string, unknown> | null | undefined,
  required: Record<string, unknown>,
): boolean {
  const currentRecord = current ?? {};
  return Object.entries(required).every(
    ([key, value]) => JSON.stringify(currentRecord[key]) === JSON.stringify(value),
  );
}

function displayNameParts(email: string): { firstName?: string; lastName?: string } {
  const localPart = email.split("@")[0] ?? "";
  const parts = localPart
    .split(/[.+_-]+/)
    .map((part) => part.trim())
    .filter(Boolean);
  if (parts.length === 0) return {};
  const title = (value: string) =>
    value.slice(0, 1).toUpperCase() + value.slice(1).toLowerCase();
  return {
    firstName: title(parts[0]),
    lastName: parts[1] ? title(parts[1]) : undefined,
  };
}

export async function ensureLaunchAccessClerkUser(
  emailInput: string | null | undefined,
): Promise<LaunchUserProvisioningResult> {
  const email = emailInput?.trim().toLowerCase() ?? "";
  const profile = getLaunchAccessProfile(email);
  if (!email || !profile) {
    return { ok: false, error: "access_not_provisioned" };
  }

  const secretKey = process.env.CLERK_SECRET_KEY;
  if (!secretKey) {
    return { ok: false, error: "clerk_not_configured" };
  }

  const clerk = createClerkClient({ secretKey });
  return ensureLaunchAccessClerkUserWithClient(clerk, profile);
}

export async function ensureLaunchAccessClerkUserWithClient(
  clerk: ClerkClient,
  profile: LaunchAccessProfile,
): Promise<Extract<LaunchUserProvisioningResult, { ok: true }>> {
  const email = profile.email.trim().toLowerCase();
  const publicMetadata = buildLaunchPublicMetadata(profile);
  const users = await clerk.users.getUserList({
    emailAddress: [email],
    limit: 1,
  });
  const user = (users.data[0] ?? null) as ClerkUserLike | null;

  if (!user) {
    const names = displayNameParts(email);
    const created = (await clerk.users.createUser({
      emailAddress: [email],
      firstName: names.firstName,
      lastName: names.lastName,
      skipPasswordRequirement: true,
      publicMetadata,
    })) as ClerkUserLike;
    return {
      ok: true,
      status: "created",
      userId: created.id,
      profile,
      publicMetadata,
    };
  }

  if (metadataMatches(user.publicMetadata, publicMetadata)) {
    return {
      ok: true,
      status: "unchanged",
      userId: user.id,
      profile,
      publicMetadata,
    };
  }

  await clerk.users.updateUser(user.id, {
    publicMetadata: {
      ...(user.publicMetadata ?? {}),
      ...publicMetadata,
    },
  });

  return {
    ok: true,
    status: "updated",
    userId: user.id,
    profile,
    publicMetadata,
  };
}
