import "server-only";

import registry from "../../../datasets/tenant-inputs/tenant-input-registry.json";

/** The registry's classification for an input packet that is generated demonstration data. */
const SYNTHETIC_DEMO_CLASSIFICATION = "synthetic-demo";

/** The part of the tenant input registry this reads. */
export interface TenantInputDeclarations {
  activeTenants?: ReadonlyArray<{
    tenantKey?: string;
    packets?: ReadonlyArray<{ classification?: string }>;
  }>;
}

/**
 * Whether the tenant input registry declares this tenant's inputs to be synthetic demonstration
 * data.
 *
 * True only when the registry lists the tenant, the tenant has at least one input packet, and
 * every one of its packets carries that classification. A tenant the registry does not list, or
 * one with any packet classified otherwise, is not declared synthetic. The answer is read from
 * the declaration and from nothing else -- not a tenant's key, its display name, or where its
 * files live.
 */
export function isDeclaredSyntheticDemoTenant(
  tenantKey: string,
  declarations: TenantInputDeclarations = registry,
): boolean {
  const packets =
    declarations.activeTenants?.find((tenant) => tenant.tenantKey === tenantKey)
      ?.packets ?? [];
  return (
    packets.length > 0 &&
    packets.every(
      (packet) => packet.classification === SYNTHETIC_DEMO_CLASSIFICATION,
    )
  );
}
