import registry from "../../../datasets/tenant-inputs/tenant-input-registry.json";

export interface TenantInputDeclarations {
  activeTenants?: ReadonlyArray<{
    tenantKey?: string;
    packets?: ReadonlyArray<{ classification?: string }>;
  }>;
}

/** Tenancy and synthetic classification come from declarations, never a key or filename. */
export function isDeclaredSyntheticDemoTenant(
  tenantKey: string,
  declarations: TenantInputDeclarations = registry,
): boolean {
  const packets =
    declarations.activeTenants?.find((tenant) => tenant.tenantKey === tenantKey)
      ?.packets ?? [];
  return (
    packets.length > 0 &&
    packets.every((packet) => packet.classification === "synthetic-demo")
  );
}
