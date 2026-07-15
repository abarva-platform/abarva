import { appClientKeyForTenant } from "@/lib/tenant/aliases";

export function resolveIntelligenceViewModelClientKey(args: {
  clientKey?: string | null;
  requestedClient?: string | null;
  contextTenantKey?: string | null;
}): string | null {
  return (
    appClientKeyForTenant(args.clientKey) ??
    appClientKeyForTenant(args.requestedClient) ??
    appClientKeyForTenant(args.contextTenantKey) ??
    args.clientKey ??
    args.requestedClient ??
    null
  );
}
