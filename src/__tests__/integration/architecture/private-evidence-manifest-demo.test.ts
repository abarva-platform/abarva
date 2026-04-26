// AZLAB4 - Private Evidence Manifest Demo — integration tests
//
// Validates the structural guarantees of the private evidence manifest demo:
// - rawDataRetainedByClient, noRawCopyConfirmed, simulatedApproval are all
//   literally true on every entry (never derived, never optional)
// - manifest meta-flags are deterministic
// - caveats carry the required plain-language wording
// - entry count and usability/pending accounting are sound

import {
  buildPrivateEvidenceManifestDemo,
  type PrivateEvidenceManifestDemo,
  type PrivateEvidenceManifestEntry,
} from '../../../lib/architecture/private-evidence-manifest-demo';

describe('AZLAB4 — buildPrivateEvidenceManifestDemo', () => {
  let manifest: PrivateEvidenceManifestDemo;

  beforeAll(() => {
    manifest = buildPrivateEvidenceManifestDemo();
  });

  // -------------------------------------------------------------------
  // Manifest-level meta-flags
  // -------------------------------------------------------------------

  it('manifest.deterministicOnly is true', () => {
    expect(manifest.deterministicOnly).toBe(true);
  });

  it('manifest.isSimulatedDemo is true', () => {
    expect(manifest.isSimulatedDemo).toBe(true);
  });

  it('generatedAt is 2026-04-26', () => {
    expect(manifest.generatedAt).toBe('2026-04-26');
  });

  // -------------------------------------------------------------------
  // Entry-count constraints
  // -------------------------------------------------------------------

  it('has at least 6 total entries', () => {
    expect(manifest.totalEntries).toBeGreaterThanOrEqual(6);
  });

  it('totalEntries matches entries array length', () => {
    expect(manifest.totalEntries).toBe(manifest.entries.length);
  });

  it('usableEntries + pendingEntries <= totalEntries', () => {
    expect(manifest.usableEntries + manifest.pendingEntries).toBeLessThanOrEqual(
      manifest.totalEntries,
    );
  });

  it('usableEntries matches entries with evidenceUsability === usable', () => {
    const counted = manifest.entries.filter((e) => e.evidenceUsability === 'usable').length;
    expect(manifest.usableEntries).toBe(counted);
  });

  it('pendingEntries matches entries with approvalState === pending', () => {
    const counted = manifest.entries.filter((e) => e.approvalState === 'pending').length;
    expect(manifest.pendingEntries).toBe(counted);
  });

  // -------------------------------------------------------------------
  // Per-entry: rawDataRetainedByClient, noRawCopyConfirmed, simulatedApproval
  // -------------------------------------------------------------------

  it('all entries have rawDataRetainedByClient === true', () => {
    for (const entry of manifest.entries) {
      expect(entry.rawDataRetainedByClient).toBe(true);
    }
  });

  it('all entries have noRawCopyConfirmed === true', () => {
    for (const entry of manifest.entries) {
      expect(entry.noRawCopyConfirmed).toBe(true);
    }
  });

  it('all entries have simulatedApproval === true', () => {
    for (const entry of manifest.entries) {
      expect(entry.simulatedApproval).toBe(true);
    }
  });

  // -------------------------------------------------------------------
  // Per-entry: governanceFlags is an array
  // -------------------------------------------------------------------

  it('governanceFlags is a non-null array on every entry', () => {
    for (const entry of manifest.entries) {
      expect(Array.isArray(entry.governanceFlags)).toBe(true);
    }
  });

  it('governanceFlags has at least one flag on every entry', () => {
    for (const entry of manifest.entries) {
      expect(entry.governanceFlags.length).toBeGreaterThanOrEqual(1);
    }
  });

  // -------------------------------------------------------------------
  // Per-entry: citationLocatorPlaceholder references entryId
  // -------------------------------------------------------------------

  it('citationLocatorPlaceholder references the entryId on every entry', () => {
    for (const entry of manifest.entries) {
      expect(entry.citationLocatorPlaceholder).toContain(entry.entryId);
    }
  });

  it('citationLocatorPlaceholder references Private Data Plane API on every entry', () => {
    for (const entry of manifest.entries) {
      expect(entry.citationLocatorPlaceholder).toContain('Private Data Plane API');
    }
  });

  // -------------------------------------------------------------------
  // Caveats
  // -------------------------------------------------------------------

  it('noRawCopyCaveat mentions "private data plane"', () => {
    expect(manifest.noRawCopyCaveat.toLowerCase()).toContain('private data plane');
  });

  it('simulationCaveat mentions "simulated"', () => {
    expect(manifest.simulationCaveat.toLowerCase()).toContain('simulated');
  });

  it('noRawCopyCaveat mentions AbarVa', () => {
    expect(manifest.noRawCopyCaveat).toContain('AbarVa');
  });

  it('noRawCopyCaveat states no raw records copied to SaaS control plane', () => {
    const caveat = manifest.noRawCopyCaveat.toLowerCase();
    expect(caveat).toContain('raw');
    expect(caveat).toContain('saas');
  });

  // -------------------------------------------------------------------
  // Entry uniqueness
  // -------------------------------------------------------------------

  it('all entryIds are unique', () => {
    const ids = manifest.entries.map((e: PrivateEvidenceManifestEntry) => e.entryId);
    const unique = new Set(ids);
    expect(unique.size).toBe(ids.length);
  });

  // -------------------------------------------------------------------
  // Determinism — two calls produce identical manifests
  // -------------------------------------------------------------------

  it('is deterministic across two invocations', () => {
    const a = buildPrivateEvidenceManifestDemo();
    const b = buildPrivateEvidenceManifestDemo();
    expect(a.manifestId).toBe(b.manifestId);
    expect(a.totalEntries).toBe(b.totalEntries);
    expect(a.entries.map((e) => e.entryId)).toEqual(b.entries.map((e) => e.entryId));
  });

  // -------------------------------------------------------------------
  // Business area coverage — at least one entry per required domain
  // -------------------------------------------------------------------

  it('covers HR analytics (Workday)', () => {
    const found = manifest.entries.some((e) => e.sourceSystem.toLowerCase().includes('workday'));
    expect(found).toBe(true);
  });

  it('covers sales data (Salesforce)', () => {
    const found = manifest.entries.some((e) =>
      e.sourceSystem.toLowerCase().includes('salesforce'),
    );
    expect(found).toBe(true);
  });

  it('covers financial metrics', () => {
    const found = manifest.entries.some((e) => e.governanceFlags.includes('SOX_controlled'));
    expect(found).toBe(true);
  });

  it('covers supply chain', () => {
    const found = manifest.entries.some((e) => e.sourceSystem.toLowerCase().includes('sap'));
    expect(found).toBe(true);
  });

  it('covers customer data', () => {
    const found = manifest.entries.some((e) => e.governanceFlags.includes('CCPA'));
    expect(found).toBe(true);
  });

  it('covers IT telemetry', () => {
    const found = manifest.entries.some((e) => e.governanceFlags.includes('no_pii'));
    expect(found).toBe(true);
  });
});
