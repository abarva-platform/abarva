import {
  CANONICAL_TENANT_KEYS,
  LEGACY_TENANT_ALIASES,
  TENANT_KEY_ALIASES,
  canonicalTenantKey,
  isLegacyTenantAlias,
} from '@/lib/tenant-keys';

describe('canonicalTenantKey', () => {
  // The alias map is the source of truth that the SQL migration is derived
  // from. If anyone reorders or adds aliases here, the migration needs an
  // updated companion test — pin it.
  it('exposes exactly the three documented aliases', () => {
    expect(TENANT_KEY_ALIASES).toEqual({
      apexretail: 'apex-retail',
      meridian: 'meridian-health',
      arcturus: 'first-capital',
    });
  });

  it('rewrites each documented alias to its canonical form', () => {
    expect(canonicalTenantKey('apexretail')).toBe('apex-retail');
    expect(canonicalTenantKey('meridian')).toBe('meridian-health');
    expect(canonicalTenantKey('arcturus')).toBe('first-capital');
  });

  it('is idempotent — canonical values pass through unchanged', () => {
    for (const canon of CANONICAL_TENANT_KEYS) {
      expect(canonicalTenantKey(canon)).toBe(canon);
      expect(canonicalTenantKey(canonicalTenantKey(canon))).toBe(canon);
    }
  });

  it('passes unknown tenant keys through unchanged', () => {
    expect(canonicalTenantKey('keystone-energy-holdings')).toBe('keystone-energy-holdings');
    expect(canonicalTenantKey('northstar-health')).toBe('northstar-health');
    expect(canonicalTenantKey('helix-therapeutics')).toBe('helix-therapeutics');
  });

  it('passes the empty string through unchanged (validation lives elsewhere)', () => {
    expect(canonicalTenantKey('')).toBe('');
  });

  it('preserves null and undefined', () => {
    expect(canonicalTenantKey(null)).toBeNull();
    expect(canonicalTenantKey(undefined)).toBeUndefined();
  });

  it('is case-sensitive (matches DB column semantics)', () => {
    // Postgres text equality is case-sensitive, so an uppercased alias is
    // NOT recognized — better to surface as a no-op than silently rewrite.
    expect(canonicalTenantKey('APEXRETAIL')).toBe('APEXRETAIL');
    expect(canonicalTenantKey('Meridian')).toBe('Meridian');
  });
});

describe('isLegacyTenantAlias', () => {
  it('returns true only for documented aliases', () => {
    for (const alias of LEGACY_TENANT_ALIASES) {
      expect(isLegacyTenantAlias(alias)).toBe(true);
    }
  });

  it('returns false for canonical keys and unknown strings', () => {
    expect(isLegacyTenantAlias('apex-retail')).toBe(false);
    expect(isLegacyTenantAlias('meridian-health')).toBe(false);
    expect(isLegacyTenantAlias('first-capital')).toBe(false);
    expect(isLegacyTenantAlias('keystone')).toBe(false);
    expect(isLegacyTenantAlias('')).toBe(false);
  });

  it('returns false for non-string inputs', () => {
    expect(isLegacyTenantAlias(null)).toBe(false);
    expect(isLegacyTenantAlias(undefined)).toBe(false);
    expect(isLegacyTenantAlias(42)).toBe(false);
    expect(isLegacyTenantAlias({})).toBe(false);
  });
});

describe('LEGACY_TENANT_ALIASES / CANONICAL_TENANT_KEYS', () => {
  it('LEGACY_TENANT_ALIASES enumerates exactly the alias-map keys', () => {
    expect(new Set(LEGACY_TENANT_ALIASES)).toEqual(new Set(Object.keys(TENANT_KEY_ALIASES)));
  });

  it('CANONICAL_TENANT_KEYS enumerates the deduped alias-map targets', () => {
    expect(new Set(CANONICAL_TENANT_KEYS)).toEqual(new Set(Object.values(TENANT_KEY_ALIASES)));
  });

  it('canonical and alias sets are disjoint', () => {
    for (const canon of CANONICAL_TENANT_KEYS) {
      expect(LEGACY_TENANT_ALIASES).not.toContain(canon);
    }
  });
});
