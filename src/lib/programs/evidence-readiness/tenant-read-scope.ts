import {
  CANONICAL_TENANT_KEYS,
  resolveTenantAlias,
  tenantAliasesFor,
} from "@/lib/tenant/aliases";

/**
 * Which tenant keys a move-scoped evidence READ may match.
 *
 * One tenant's evidence rows can carry more than one of that tenant's own
 * keys, because two producers write them under different names: the product
 * writes `ctx.clientKey` (the app client key), while a data-plane load job
 * writes the canonical substrate key. For the demo tenant those are different
 * strings, so a reader scoped to a single key sees only the rows one producer
 * wrote — and the rows it cannot see read as MISSING EVIDENCE rather than as a
 * scope miss, which is the same thing a reviewer sees when nothing was
 * uploaded at all.
 *
 * That is not hypothetical: a load wrote one Move's rows under the canonical
 * key, and clearing it needed a one-off rekey repair rather than a reader that
 * could see both (`docs/governance/data-repairs/`).
 *
 * This is a READ scope and nothing else. Writes stay keyed to the single
 * `ctx.clientKey`, so widening a read cannot change which key new rows carry.
 * It cannot widen across tenants either: the alias set comes from one tenant's
 * own profile, and `tenantAliasProfilesAreDisjoint` is the invariant that
 * keeps that true as profiles are added.
 */
export function moveEvidenceReadTenantKeys(
  clientKey: string | null | undefined,
): string[] {
  // `tenantAliasesFor` also answers [] for a falsy key, so this branch is
  // belt-and-braces and a mutation that removes it survives. It is kept
  // deliberately: "no tenant reads nothing" is this module's contract, and
  // stating it here does not leave it to a module whose own callers may widen
  // it. Not a coverage gap.
  if (!clientKey) return [];
  return tenantAliasesFor(clientKey);
}

export interface EvidenceTenantScopeReport {
  /** The keys a read scoped to this tenant may match, in alias order. */
  readableTenantKeys: string[];
  /**
   * Stored keys that belong to this tenant and that a read scoped to the
   * single app client key would NOT match. Non-empty means a one-key reader
   * reports the evidence under those keys as absent.
   */
  missedByClientKeyOnly: string[];
  /**
   * Stored keys that resolve to no profile, or to a different tenant. These
   * stay unreadable on purpose — widening is per-tenant, never a way in.
   */
  outOfScopeTenantKeys: string[];
}

/**
 * What a reader scoped one way or the other can see of the keys evidence is
 * actually stored under.
 *
 * `storedTenantKeys` is observed data (the distinct `tenant_key` values on a
 * Move's rows), not a declaration — so a key naming another tenant is reported
 * apart rather than quietly folded in.
 */
export function evidenceTenantScopeReport(input: {
  clientKey: string | null | undefined;
  storedTenantKeys: ReadonlyArray<string>;
}): EvidenceTenantScopeReport {
  const readableTenantKeys = moveEvidenceReadTenantKeys(input.clientKey);
  const readable = new Set(readableTenantKeys);
  const missedByClientKeyOnly: string[] = [];
  const outOfScopeTenantKeys: string[] = [];
  const seen = new Set<string>();
  for (const stored of input.storedTenantKeys) {
    if (!stored || seen.has(stored)) continue;
    seen.add(stored);
    if (!readable.has(stored)) {
      outOfScopeTenantKeys.push(stored);
      continue;
    }
    if (stored !== input.clientKey) missedByClientKeyOnly.push(stored);
  }
  return { readableTenantKeys, missedByClientKeyOnly, outOfScopeTenantKeys };
}

/**
 * Whether no two tenant profiles claim the same key.
 *
 * This is the precondition every alias-scoped read depends on. The alias
 * lookup is a Map, so a key claimed by two profiles would resolve to whichever
 * was registered last and widen one tenant's read onto another's rows with no
 * error anywhere. Tenants are read from code, never a hand-typed list.
 *
 * The declared profiles are disjoint today, so called with its defaults this
 * can only ever answer true. The parameters exist so the DETECTION is provable
 * against a colliding pair rather than resting on a set that cannot fail —
 * otherwise a detector and a hardcoded `true` are indistinguishable.
 */
export function tenantAliasProfilesAreDisjoint(
  tenantKeys: ReadonlyArray<string> = CANONICAL_TENANT_KEYS,
  keysFor: (tenantKey: string) => ReadonlyArray<string> = tenantAliasesFor,
): {
  disjoint: boolean;
  sharedKeys: string[];
} {
  const owner = new Map<string, string>();
  const sharedKeys: string[] = [];
  for (const canonicalKey of tenantKeys) {
    for (const key of keysFor(canonicalKey)) {
      const normalized = key.trim().toLowerCase().replace(/_/g, "-");
      const existing = owner.get(normalized);
      if (existing && existing !== canonicalKey) {
        sharedKeys.push(normalized);
        continue;
      }
      owner.set(normalized, canonicalKey);
    }
  }
  return { disjoint: sharedKeys.length === 0, sharedKeys };
}

/**
 * Whether a stored key names the same tenant as the reader's client key.
 *
 * Used where a row has already been read and its key must be attributed, not
 * where a query scope is being chosen.
 */
export function storedTenantKeyNamesSameTenant(
  clientKey: string | null | undefined,
  storedTenantKey: string | null | undefined,
): boolean {
  if (!clientKey || !storedTenantKey) return false;
  const reader = resolveTenantAlias(clientKey);
  const stored = resolveTenantAlias(storedTenantKey);
  if (!reader || !stored) return clientKey === storedTenantKey;
  return reader.canonicalKey === stored.canonicalKey;
}
