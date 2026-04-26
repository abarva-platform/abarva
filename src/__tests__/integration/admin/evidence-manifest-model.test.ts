// TRUST4 · Evidence Manifest / No-Raw-Copy Mode tests.
//
// Pure deterministic coverage of the evidence manifest read model.

import {
  buildEvidenceManifestSeed,
  getUnverifiedEvidence,
  summarizeEvidenceManifests,
  validateEvidenceManifestEntry,
  EVIDENCE_METRIC_KINDS_IN_ORDER,
  EVIDENCE_VERIFICATION_STATES_IN_ORDER,
  type EvidenceManifestEntry,
  type EvidenceMetricKind,
  type EvidenceManifestVerification,
} from '@/lib/admin/evidence-manifest-model';

// ---------------------------------------------------------------------
// Determinism
// ---------------------------------------------------------------------

describe('buildEvidenceManifestSeed · determinism', () => {
  it('returns a deterministic seed across repeated calls', () => {
    const a = buildEvidenceManifestSeed();
    const b = buildEvidenceManifestSeed();
    expect(a).toEqual(b);
  });

  it('serialized seed is byte-equal across repeated calls', () => {
    const a = JSON.stringify(buildEvidenceManifestSeed());
    const b = JSON.stringify(buildEvidenceManifestSeed());
    expect(a).toBe(b);
  });

  it('every entry carries the deterministic createdFrom marker', () => {
    const entries = buildEvidenceManifestSeed();
    for (const e of entries) {
      expect(e.createdFrom).toBe('deterministic_evidence_manifest_seed');
    }
  });
});

// ---------------------------------------------------------------------
// All 7 metric kinds and all 4 verification states represented
// ---------------------------------------------------------------------

describe('canonical metric kinds and verification states', () => {
  it('exposes all 7 canonical metric kinds in canonical order', () => {
    const expected: ReadonlyArray<EvidenceMetricKind> = [
      'count',
      'rate',
      'currency',
      'duration',
      'percentage',
      'category',
      'narrative',
    ];
    expect(EVIDENCE_METRIC_KINDS_IN_ORDER).toEqual(expected);
  });

  it('exposes all 4 canonical verification states in canonical order', () => {
    const expected: ReadonlyArray<EvidenceManifestVerification> = [
      'self_attested',
      'owner_signed',
      'co_signed',
      'audited',
    ];
    expect(EVIDENCE_VERIFICATION_STATES_IN_ORDER).toEqual(expected);
  });

  it('seed represents all 7 metric kinds at least once', () => {
    const entries = buildEvidenceManifestSeed();
    const kinds = new Set(entries.map((e) => e.metricKind));
    for (const k of EVIDENCE_METRIC_KINDS_IN_ORDER) {
      expect(kinds.has(k)).toBe(true);
    }
  });

  it('seed represents all 4 verification states at least once', () => {
    const entries = buildEvidenceManifestSeed();
    const states = new Set(entries.map((e) => e.verification));
    for (const v of EVIDENCE_VERIFICATION_STATES_IN_ORDER) {
      expect(states.has(v)).toBe(true);
    }
  });
});

// ---------------------------------------------------------------------
// No-raw-copy invariant
// ---------------------------------------------------------------------

describe('no-raw-copy invariant', () => {
  it('every seed entry has rawRetainedByClient: true', () => {
    const entries = buildEvidenceManifestSeed();
    expect(entries.length).toBeGreaterThan(0);
    for (const e of entries) {
      expect(e.rawRetainedByClient).toBe(true);
    }
  });

  it('summary reports rawRetainedByClientAll true on the seed', () => {
    const s = summarizeEvidenceManifests(buildEvidenceManifestSeed());
    expect(s.rawRetainedByClientAll).toBe(true);
  });

  it('no value field contains an https or http URL', () => {
    const entries = buildEvidenceManifestSeed();
    for (const e of entries) {
      expect(e.value).not.toMatch(/https:\/\//);
      expect(e.value).not.toMatch(/http:\/\//);
    }
  });

  it('no value field contains a long alphanumeric raw-payload blob', () => {
    const entries = buildEvidenceManifestSeed();
    const longTokenRegex = /[A-Za-z0-9]{32,}/;
    for (const e of entries) {
      expect(longTokenRegex.test(e.value)).toBe(false);
    }
  });

  it('no rawDataLocation contains an https or http URL', () => {
    const entries = buildEvidenceManifestSeed();
    for (const e of entries) {
      expect(e.rawDataLocation).not.toMatch(/https:\/\//);
      expect(e.rawDataLocation).not.toMatch(/http:\/\//);
    }
  });
});

// ---------------------------------------------------------------------
// Entry shape
// ---------------------------------------------------------------------

describe('manifest entry shape', () => {
  it('every seed entry names a source owner role and source system', () => {
    const entries = buildEvidenceManifestSeed();
    for (const e of entries) {
      expect(typeof e.sourceOwner.ownerRole).toBe('string');
      expect(e.sourceOwner.ownerRole.length).toBeGreaterThan(0);
      expect(typeof e.sourceOwner.sourceSystem).toBe('string');
      expect(e.sourceOwner.sourceSystem.length).toBeGreaterThan(0);
    }
  });

  it('every seed entry carries a bounded ISO date range', () => {
    const entries = buildEvidenceManifestSeed();
    const isoRegex = /^\d{4}-\d{2}-\d{2}$/;
    for (const e of entries) {
      expect(e.dateRange.startDate).toMatch(isoRegex);
      expect(e.dateRange.endDate).toMatch(isoRegex);
      expect(
        e.dateRange.startDate <= e.dateRange.endDate,
      ).toBe(true);
    }
  });

  it('every seed entry carries a non-empty string value', () => {
    const entries = buildEvidenceManifestSeed();
    for (const e of entries) {
      expect(typeof e.value).toBe('string');
      expect(e.value.length).toBeGreaterThan(0);
    }
  });
});

// ---------------------------------------------------------------------
// validateEvidenceManifestEntry
// ---------------------------------------------------------------------

describe('validateEvidenceManifestEntry', () => {
  function validBase(): EvidenceManifestEntry {
    return {
      entryId: 'evid-manifest-test',
      anchorKey: 'apex-contact-center-ai',
      metric: 'Test metric',
      metricKind: 'count',
      value: '12,400',
      unit: 'contacts',
      sourceOwner: {
        ownerRole: 'VP of Customer Care',
        sourceSystem: 'Genesys CCaaS reporting warehouse',
      },
      dateRange: {
        startDate: '2026-01-01',
        endDate: '2026-03-31',
      },
      verification: 'owner_signed',
      rawDataLocation: 'Client-side · Genesys reporting warehouse · Q1 slice',
      rawRetainedByClient: true,
      createdFrom: 'deterministic_evidence_manifest_seed',
    };
  }

  it('accepts a fully-populated entry', () => {
    const r = validateEvidenceManifestEntry(validBase());
    expect(r.valid).toBe(true);
    expect(r.reasons).toEqual([]);
  });

  it('every seed entry is valid', () => {
    const entries = buildEvidenceManifestSeed();
    for (const e of entries) {
      const r = validateEvidenceManifestEntry(e);
      expect(r.valid).toBe(true);
      expect(r.reasons).toEqual([]);
    }
  });

  it('rejects an entry with an http URL in the value', () => {
    const r = validateEvidenceManifestEntry({
      ...validBase(),
      value: 'see https://example.com/raw',
    });
    expect(r.valid).toBe(false);
    expect(r.reasons).toContain('value_contains_raw_payload');
  });

  it('rejects an entry with a long alphanumeric blob in the value', () => {
    const r = validateEvidenceManifestEntry({
      ...validBase(),
      value: 'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA',
    });
    expect(r.valid).toBe(false);
    expect(r.reasons).toContain('value_contains_raw_payload');
  });

  it('rejects an entry where rawRetainedByClient is not true (forced)', () => {
    const forced = {
      ...validBase(),
      rawRetainedByClient: false,
    } as unknown as EvidenceManifestEntry;
    const r = validateEvidenceManifestEntry(forced);
    expect(r.valid).toBe(false);
    expect(r.reasons).toContain('raw_retained_by_client_must_be_true');
  });

  it('rejects an inverted date range', () => {
    const r = validateEvidenceManifestEntry({
      ...validBase(),
      dateRange: { startDate: '2026-03-31', endDate: '2026-01-01' },
    });
    expect(r.valid).toBe(false);
    expect(r.reasons).toContain('date_range_inverted');
  });

  it('rejects a missing source owner role', () => {
    const r = validateEvidenceManifestEntry({
      ...validBase(),
      sourceOwner: { ownerRole: '', sourceSystem: 'X' },
    });
    expect(r.valid).toBe(false);
    expect(r.reasons).toContain('source_owner_role_missing');
  });

  it('rejects a missing source owner system', () => {
    const r = validateEvidenceManifestEntry({
      ...validBase(),
      sourceOwner: { ownerRole: 'X', sourceSystem: '' },
    });
    expect(r.valid).toBe(false);
    expect(r.reasons).toContain('source_owner_system_missing');
  });

  it('rejects an entry with non-canonical metricKind (forced)', () => {
    const forced = {
      ...validBase(),
      metricKind: 'bogus_kind',
    } as unknown as EvidenceManifestEntry;
    const r = validateEvidenceManifestEntry(forced);
    expect(r.valid).toBe(false);
    expect(r.reasons).toContain('metric_kind_invalid');
  });

  it('rejects an entry with non-canonical verification (forced)', () => {
    const forced = {
      ...validBase(),
      verification: 'bogus_state',
    } as unknown as EvidenceManifestEntry;
    const r = validateEvidenceManifestEntry(forced);
    expect(r.valid).toBe(false);
    expect(r.reasons).toContain('verification_invalid');
  });

  it('rejects an entry with a wrong createdFrom marker (forced)', () => {
    const forced = {
      ...validBase(),
      createdFrom: 'something_else',
    } as unknown as EvidenceManifestEntry;
    const r = validateEvidenceManifestEntry(forced);
    expect(r.valid).toBe(false);
    expect(r.reasons).toContain('created_from_marker_invalid');
  });

  it('rejects an entry with an http URL in rawDataLocation', () => {
    const r = validateEvidenceManifestEntry({
      ...validBase(),
      rawDataLocation: 'https://client.example.com/raw',
    });
    expect(r.valid).toBe(false);
    expect(r.reasons).toContain('raw_data_location_contains_raw_payload');
  });
});

// ---------------------------------------------------------------------
// summarizeEvidenceManifests
// ---------------------------------------------------------------------

describe('summarizeEvidenceManifests', () => {
  it('counts totals and buckets every canonical metric kind', () => {
    const s = summarizeEvidenceManifests(buildEvidenceManifestSeed());
    expect(s.total).toBe(buildEvidenceManifestSeed().length);
    expect(new Set(Object.keys(s.byMetricKind))).toEqual(
      new Set(EVIDENCE_METRIC_KINDS_IN_ORDER),
    );
    expect(new Set(Object.keys(s.byVerification))).toEqual(
      new Set(EVIDENCE_VERIFICATION_STATES_IN_ORDER),
    );
  });

  it('summary on an empty list is zeroed and rawRetainedByClientAll true', () => {
    const s = summarizeEvidenceManifests([]);
    expect(s.total).toBe(0);
    expect(s.unverifiedCount).toBe(0);
    expect(s.rawRetainedByClientAll).toBe(true);
  });

  it('unverifiedCount equals number of self_attested entries', () => {
    const entries = buildEvidenceManifestSeed();
    const expected = entries.filter(
      (e) => e.verification === 'self_attested',
    ).length;
    const s = summarizeEvidenceManifests(entries);
    expect(s.unverifiedCount).toBe(expected);
  });
});

// ---------------------------------------------------------------------
// getUnverifiedEvidence
// ---------------------------------------------------------------------

describe('getUnverifiedEvidence', () => {
  it('returns only self_attested entries and preserves order', () => {
    const entries = buildEvidenceManifestSeed();
    const u = getUnverifiedEvidence(entries);
    for (const e of u) {
      expect(e.verification).toBe('self_attested');
    }
    // preserve input order
    const indices = u.map((e) =>
      entries.findIndex((x) => x.entryId === e.entryId),
    );
    const sorted = [...indices].sort((a, b) => a - b);
    expect(indices).toEqual(sorted);
  });

  it('returns an empty list when no entries are self_attested', () => {
    const entries: ReadonlyArray<EvidenceManifestEntry> = buildEvidenceManifestSeed()
      .filter((e) => e.verification !== 'self_attested');
    const u = getUnverifiedEvidence(entries);
    expect(u).toEqual([]);
  });
});

// ---------------------------------------------------------------------
// Module hygiene (regex-enforced)
// ---------------------------------------------------------------------

describe('module hygiene · evidence-manifest-model.ts', () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const fs = require('fs') as typeof import('fs');
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const path = require('path') as typeof import('path');

  const sourcePath = path.resolve(
    __dirname,
    '../../../lib/admin/evidence-manifest-model.ts',
  );
  const source = fs.readFileSync(sourcePath, 'utf8');
  const codeOnly = stripComments(source);

  it('does not import Source UI', () => {
    expect(codeOnly).not.toMatch(/from '@\/lib\/source\//);
    expect(codeOnly).not.toMatch(/from '@\/app\/\(maestro\)\/source\//);
  });

  it('does not import Nexus / Sentinel / Atlas / Agent runtime', () => {
    expect(codeOnly).not.toMatch(/from '@\/lib\/nexus\//);
    expect(codeOnly).not.toMatch(/from '@\/lib\/sentinel\//);
    expect(codeOnly).not.toMatch(/from '@\/lib\/atlas\//);
    expect(codeOnly).not.toMatch(/from '@\/lib\/agent\//);
    expect(codeOnly).not.toMatch(/from '@\/components\/agent\//);
  });

  it('does not import legacy /programs routes or mock.ts', () => {
    expect(codeOnly).not.toMatch(/from '@\/app\/programs\//);
    expect(codeOnly).not.toMatch(/from '@\/lib\/programs\/mock'/);
  });

  it('does not import auth implementation or supabase', () => {
    expect(codeOnly).not.toMatch(/from '@\/lib\/auth\//);
    expect(codeOnly).not.toMatch(/from '@\/.*supabase/);
  });

  it('does not call Date.now / Math.random / new Date / fetch', () => {
    expect(codeOnly).not.toMatch(/Date\.now\(/);
    expect(codeOnly).not.toMatch(/Math\.random\(/);
    expect(codeOnly).not.toMatch(/new Date\(/);
    expect(codeOnly).not.toMatch(/\bfetch\(/);
  });

  it('does not invoke Claude / OpenAI / Pinecone runtime', () => {
    expect(codeOnly).not.toMatch(/anthropic/i);
    expect(codeOnly).not.toMatch(/openai/i);
    expect(codeOnly).not.toMatch(/pinecone/i);
  });

  it('does not contain an https or http URL anywhere in the source', () => {
    expect(codeOnly).not.toMatch(/https:\/\//);
    expect(codeOnly).not.toMatch(/http:\/\//);
  });
});

function stripComments(src: string): string {
  const lineStripped = src
    .split('\n')
    .filter((line) => !line.trim().startsWith('//'))
    .join('\n');
  return lineStripped.replace(/\/\*[\s\S]*?\*\//g, '');
}
