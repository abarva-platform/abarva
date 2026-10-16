import { tenantAliasesFor } from "@/lib/tenant/aliases";

/**
 * Values a tenant-fenced Moves read must accept on `tenant_key`.
 *
 * Moves rows for one tenant are persisted under more than one spelling of its
 * key: older writers store the app client key, newer writers store the
 * canonical key, and the tenant canonicalization cleanup rewrites legacy
 * spellings to the canonical one. A read filtered with `.eq("tenant_key",
 * clientKey)` therefore sees only the rows written under one spelling and
 * reports every other row as absent — a deliverable, evidence item or review
 * decision that exists reads as "none".
 *
 * The alias set is per-tenant (see `tenantAliasesFor`), so widening the
 * filter to it cannot reach another tenant's rows. For a key the alias
 * dictionary does not know, the set is the key itself. The empty key stays a
 * single empty value so a caller that forgot its own empty-key guard still
 * matches nothing rather than everything.
 */
export function tenantKeyReadValues(tenantKey: string): string[] {
  const values = tenantAliasesFor(tenantKey);
  return values.length > 0 ? values : [tenantKey];
}
