/**
 * Canonical tenant-key normalization.
 *
 * Three of our seeded tenants have historical aliases that still appear in
 * older substrate tables and a handful of hard-coded application paths.
 * Anywhere data flows from the app into a tenant-scoped retrieval surface
 * (Postgres, Azure AI Search, the broker), tenant keys MUST be canonicalized
 * first — otherwise queries split between the alias and the canonical key
 * and return empty bundles.
 *
 * | Canonical         | Historical aliases     |
 * | ----------------- | ---------------------- |
 * | apex-retail       | apexretail             |
 * | meridian-health   | meridian               |
 * | first-capital     | arcturus               |
 *
 * This module is the single source of truth for that map. The Azure AI
 * Search adapter, the verification script, and any future writers should
 * import from here.
 */

import {
  CANONICAL_TENANT_KEYS,
  LEGACY_TENANT_ALIASES,
  TENANT_KEY_ALIASES,
  canonicalTenantKey,
  isLegacyTenantAlias,
} from '@/lib/tenant/aliases';

/**
 * Return the canonical tenant key for a value that may be an alias.
 *
 * - Unknown strings pass through unchanged (forward-compatible).
 * - Null/undefined pass through unchanged.
 * - Empty strings pass through unchanged.
 *
 * The pass-through behavior is deliberate: callers that need strict
 * validation should layer their own assertion on top — this helper is for
 * normalization, not validation.
 */
export {
  CANONICAL_TENANT_KEYS,
  LEGACY_TENANT_ALIASES,
  TENANT_KEY_ALIASES,
  canonicalTenantKey,
  isLegacyTenantAlias,
};
