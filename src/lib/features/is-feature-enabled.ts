// Feature-flag evaluation · A3 (backlog 2026-05-14)
//
// Server-side check: does the active tenant have <feature> enabled?
//
// Usage:
//
//   const ctx = await requireTenancy();
//   if (isFeatureEnabled(ctx, 'first_capital_substrate_overlay')) {
//     // render the gated thing
//   }
//
// The function is sync because the flag registry is currently static
// (`src/lib/features/registry.ts`). If/when we move to a remote
// feature-flag service, swap the body for an async lookup and update
// every call site to `await`.

import type { ClientKey } from "@/lib/client-config";
import { isClientKey } from "@/lib/client-config";
import {
  getFeatureFlagDefinition,
  type FeatureFlagKey,
} from "@/lib/features/registry";

/**
 * Minimal shape used to evaluate a flag — just the tenant key. Compatible
 * with the broader `TenancyCtx` from `lib/programs/types.db`, but kept
 * small here so this module doesn't drag in the programs type graph.
 */
export interface FeatureFlagContext {
  clientKey?: string | null;
  clientId?: string | null;
}

/**
 * Resolve the caller's `ClientKey` from a feature-flag context. Prefers
 * `clientKey` (canonical) and falls back to `clientId` only if `clientId`
 * happens to be a valid ClientKey. Returns null when the context can't
 * be mapped — in which case every flag falls to its `policy` default.
 */
const ENV_TENANT_ALIASES: Readonly<Record<string, ClientKey>> = {
  "apex-retail": "apexretail",
  "meridian-health": "meridian",
  "first-capital": "arcturus",
  // The SkyHarbor data plane uses the dashed `skyharbor-air` tenant key; the
  // canonical ClientKey is `skyharbor`. Map it so feature flags (and their env
  // allowlists) resolve for SkyHarbor Moves whose `tenant_key` is dashed.
  "skyharbor-air": "skyharbor",
};

function normalizeTenantKey(
  value: string | null | undefined,
): ClientKey | null {
  const normalized = value?.trim().toLowerCase();
  if (!normalized) return null;
  if (isClientKey(normalized)) return normalized;
  return ENV_TENANT_ALIASES[normalized] ?? null;
}

function resolveClientKey(
  ctx: FeatureFlagContext | null | undefined,
): ClientKey | null {
  if (!ctx) return null;
  return normalizeTenantKey(ctx.clientKey) ?? normalizeTenantKey(ctx.clientId);
}

function envTenantListForFlag(key: FeatureFlagKey): ReadonlyArray<ClientKey> {
  const envKey = `ABARVA_FEATURE_${key.toUpperCase()}_TENANTS`;
  const raw = process.env[envKey]?.trim();
  if (!raw) return [];

  const tenants: ClientKey[] = [];
  for (const part of raw.split(",")) {
    const clientKey = normalizeTenantKey(part);
    if (clientKey && !tenants.includes(clientKey)) tenants.push(clientKey);
  }
  return tenants;
}

/**
 * Server-side flag evaluation. Default policies:
 *
 *   - `platform` flags are ON unless the tenant is in `excludeTenants`.
 *   - `tenant` flags are OFF unless the tenant is in `includeTenants`.
 *
 * Unknown flag keys return `false` (fail-closed). This catches typos at
 * call sites — they show up as "the feature never renders" rather than
 * "the feature is silently on for everyone".
 */
export function isFeatureEnabled(
  ctx: FeatureFlagContext | null | undefined,
  key: FeatureFlagKey,
): boolean {
  const def = getFeatureFlagDefinition(key);
  if (!def) return false;

  const tenant = resolveClientKey(ctx);

  if (def.policy === "platform") {
    if (tenant && def.excludeTenants?.includes(tenant)) return false;
    return true;
  }

  // policy === 'tenant'
  if (!tenant) return false;
  if (def.includeTenants?.includes(tenant)) return true;
  return envTenantListForFlag(key).includes(tenant);
}
