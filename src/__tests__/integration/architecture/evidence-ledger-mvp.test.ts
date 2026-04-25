// EVID2 - Evidence Ledger MVP tests.
//
// Deterministic, file-pure suite for the EVID2 read model. No network
// calls, no model providers, no migrations, no time-of-day dependence.

import {
  EVIDENCE_LEDGER_USABILITY_STATES,
  buildEvidenceLedgerMvp,
  explainEvidenceUsability,
  getBlockedEvidence,
  getUsableEvidence,
  summarizeEvidenceLedger,
  validateEvidenceLedgerEntry,
  type EvidenceLedgerEntry,
  type EvidenceLedgerUsabilityState,
} from '@/lib/architecture/evidence-ledger-mvp';

// ---------------------------------------------------------------------
// Determinism
// ---------------------------------------------------------------------

describe('buildEvidenceLedgerMvp · determinism', () => {
  it('returns byte-equal JSON across repeated calls', () => {
    const first = JSON.stringify(buildEvidenceLedgerMvp());
    const second = JSON.stringify(buildEvidenceLedgerMvp());
    const third = JSON.stringify(buildEvidenceLedgerMvp());
    expect(second).toBe(first);
    expect(third).toBe(first);
  });

  it('returns at least 12 seed entries', () => {
    expect(buildEvidenceLedgerMvp().length).toBeGreaterThanOrEqual(12);
  });

  it('every entry is tagged createdFrom: deterministic_evidence_ledger_mvp', () => {
    for (const entry of buildEvidenceLedgerMvp()) {
      expect(entry.createdFrom).toBe('deterministic_evidence_ledger_mvp');
    }
  });
});

// ---------------------------------------------------------------------
// State coverage
// ---------------------------------------------------------------------

describe('buildEvidenceLedgerMvp · state coverage', () => {
  it('canonical usability state tuple is in canonical order', () => {
    expect(EVIDENCE_LEDGER_USABILITY_STATES).toEqual([
      'loaded',
      'parsed',
      'indexed',
      'classified',
      'scoped',
      'cited',
      'quality_checked',
      'usable_as_evidence',
      'blocked',
    ]);
  });

  it('every canonical state is covered by at least one seed entry', () => {
    const entries = buildEvidenceLedgerMvp();
    for (const state of EVIDENCE_LEDGER_USABILITY_STATES) {
      const matching = entries.filter((entry) => entry.state === state);
      expect(matching.length).toBeGreaterThanOrEqual(1);
    }
  });

  it('has at least 4 entries in usable_as_evidence state', () => {
    const entries = buildEvidenceLedgerMvp();
    const usable = entries.filter((entry) => entry.state === 'usable_as_evidence');
    expect(usable.length).toBeGreaterThanOrEqual(4);
  });

  it('has at least 2 entries in blocked state with non-empty blockReason', () => {
    const entries = buildEvidenceLedgerMvp();
    const blocked = entries.filter((entry) => entry.state === 'blocked');
    expect(blocked.length).toBeGreaterThanOrEqual(2);
    for (const entry of blocked) {
      expect(typeof entry.blockReason).toBe('string');
      expect((entry.blockReason ?? '').trim().length).toBeGreaterThan(0);
    }
  });
});

// ---------------------------------------------------------------------
// Linkage coverage
// ---------------------------------------------------------------------

describe('buildEvidenceLedgerMvp · linkage coverage', () => {
  it('has at least 3 entries linked to programs', () => {
    const entries = buildEvidenceLedgerMvp();
    const programLinked = entries.filter((entry) => entry.linkedPrograms.length > 0);
    expect(programLinked.length).toBeGreaterThanOrEqual(3);
  });

  it('program-linked entries cover a mix of states from loaded to usable_as_evidence', () => {
    const entries = buildEvidenceLedgerMvp();
    const programStates = new Set<EvidenceLedgerUsabilityState>(
      entries
        .filter((entry) => entry.linkedPrograms.length > 0)
        .map((entry) => entry.state),
    );
    expect(programStates.has('usable_as_evidence')).toBe(true);
    // Must include at least one non-usable state to prove "mix".
    const nonUsable = Array.from(programStates).filter((state) => state !== 'usable_as_evidence');
    expect(nonUsable.length).toBeGreaterThanOrEqual(1);
  });

  it('has at least 3 entries linked to intelligence patterns', () => {
    const entries = buildEvidenceLedgerMvp();
    const patternLinked = entries.filter((entry) => entry.linkedPatterns.length > 0);
    expect(patternLinked.length).toBeGreaterThanOrEqual(3);
  });

  it('has at least 3 entries linked to admin dataset domains', () => {
    const entries = buildEvidenceLedgerMvp();
    const datasetLinked = entries.filter((entry) => entry.linkedDatasetDomains.length > 0);
    expect(datasetLinked.length).toBeGreaterThanOrEqual(3);
  });

  it('has at least 3 entries linked to solution archetypes', () => {
    const entries = buildEvidenceLedgerMvp();
    const archetypeLinked = entries.filter((entry) => entry.linkedSolutionArchetypes.length > 0);
    expect(archetypeLinked.length).toBeGreaterThanOrEqual(3);
  });
});

// ---------------------------------------------------------------------
// Validation rules
// ---------------------------------------------------------------------

describe('validateEvidenceLedgerEntry', () => {
  it('every usable_as_evidence entry validates as usable', () => {
    const entries = buildEvidenceLedgerMvp();
    for (const entry of entries) {
      if (entry.state !== 'usable_as_evidence') continue;
      const result = validateEvidenceLedgerEntry(entry);
      expect(result.isUsable).toBe(true);
      expect(result.isBlocked).toBe(false);
      expect(result.reasons).toEqual([]);
    }
  });

  it('every blocked entry validates as blocked with non-empty blockReason', () => {
    const entries = buildEvidenceLedgerMvp();
    let blockedSeen = 0;
    for (const entry of entries) {
      if (entry.state !== 'blocked') continue;
      blockedSeen += 1;
      const result = validateEvidenceLedgerEntry(entry);
      expect(result.isBlocked).toBe(true);
      expect(result.isUsable).toBe(false);
      expect((entry.blockReason ?? '').trim().length).toBeGreaterThan(0);
    }
    expect(blockedSeen).toBeGreaterThanOrEqual(2);
  });

  it('intermediate-state entries (loaded/parsed/indexed/classified/scoped/cited) do not validate as usable', () => {
    const intermediate = new Set<EvidenceLedgerUsabilityState>([
      'loaded',
      'parsed',
      'indexed',
      'classified',
      'scoped',
      'cited',
    ]);
    const entries = buildEvidenceLedgerMvp();
    for (const entry of entries) {
      if (!intermediate.has(entry.state)) continue;
      const result = validateEvidenceLedgerEntry(entry);
      expect(result.isUsable).toBe(false);
      expect(result.isBlocked).toBe(false);
    }
  });

  it('quality_checked entry is not yet usable_as_evidence', () => {
    const entries = buildEvidenceLedgerMvp();
    const qualityChecked = entries.filter((entry) => entry.state === 'quality_checked');
    expect(qualityChecked.length).toBeGreaterThanOrEqual(1);
    for (const entry of qualityChecked) {
      const result = validateEvidenceLedgerEntry(entry);
      expect(result.isUsable).toBe(false);
      expect(result.isBlocked).toBe(false);
    }
  });

  it('flags missing tenantKey, locator, kind on synthetic invalid entry', () => {
    const invalid: EvidenceLedgerEntry = {
      id: 'evid-seed-test-invalid-9999',
      tenantKey: '',
      sourceArtifactId: 'artifact-test-invalid',
      claim: {
        claimId: 'claim-seed-test-invalid-9999',
        text: 'Synthetic invalid claim used only by tests.',
        derivedFrom: 'tenant_artifact',
      },
      citation: {
        // Cast through unknown so the test can prove the validator
        // rejects malformed kinds at runtime.
        kind: 'not_a_kind' as unknown as EvidenceLedgerEntry['citation']['kind'],
        locator: '',
        rawSourceRef: 'tenant://test/invalid.md',
      },
      state: 'usable_as_evidence',
      scope: 'tenant',
      linkedPrograms: [],
      linkedPatterns: [],
      linkedDeliverables: [],
      linkedSolutionArchetypes: [],
      linkedDatasetDomains: [],
      qualityNotes: [],
      createdFrom: 'deterministic_evidence_ledger_mvp',
    };
    const result = validateEvidenceLedgerEntry(invalid);
    expect(result.isUsable).toBe(false);
    expect(result.reasons.some((reason) => reason.includes('tenantKey'))).toBe(true);
    expect(result.reasons.some((reason) => reason.includes('locator'))).toBe(true);
    expect(result.reasons.some((reason) => reason.includes('kind'))).toBe(true);
  });

  it('flags blocked entry without blockReason', () => {
    const invalid: EvidenceLedgerEntry = {
      id: 'evid-seed-test-blocked-no-reason-9998',
      tenantKey: 'test',
      sourceArtifactId: 'artifact-test-blocked',
      claim: {
        claimId: 'claim-seed-test-blocked-no-reason-9998',
        text: 'Synthetic blocked-no-reason claim used only by tests.',
        derivedFrom: 'tenant_artifact',
      },
      citation: {
        kind: 'section',
        locator: 'test/section',
        rawSourceRef: 'tenant://test/blocked.md',
      },
      state: 'blocked',
      scope: 'tenant',
      linkedPrograms: [],
      linkedPatterns: [],
      linkedDeliverables: [],
      linkedSolutionArchetypes: [],
      linkedDatasetDomains: [],
      qualityNotes: [],
      createdFrom: 'deterministic_evidence_ledger_mvp',
    };
    const result = validateEvidenceLedgerEntry(invalid);
    expect(result.isBlocked).toBe(false);
    expect(result.reasons.some((reason) => reason.toLowerCase().includes('blockreason'))).toBe(true);
  });
});

// ---------------------------------------------------------------------
// ID shape and no production-shaped citations
// ---------------------------------------------------------------------

describe('evidence ledger MVP · id and citation shape', () => {
  it('every entry id starts with evid-seed- and uses lowercase / digits / hyphens only', () => {
    const entries = buildEvidenceLedgerMvp();
    for (const entry of entries) {
      expect(entry.id.startsWith('evid-seed-')).toBe(true);
      expect(entry.id).toMatch(/^[a-z0-9-]+$/);
    }
  });

  it('serialized JSON contains no production-shaped E-### citations', () => {
    const json = JSON.stringify(buildEvidenceLedgerMvp());
    expect(json).not.toMatch(/E-\d{2,}/);
  });

  it('citation locators contain no real https:// URLs', () => {
    const entries = buildEvidenceLedgerMvp();
    for (const entry of entries) {
      expect(entry.citation.locator.startsWith('https://')).toBe(false);
      expect(entry.citation.locator.startsWith('http://')).toBe(false);
      expect(entry.citation.rawSourceRef.startsWith('https://')).toBe(false);
      expect(entry.citation.rawSourceRef.startsWith('http://')).toBe(false);
    }
  });

  it('citation kinds are limited to the canonical set', () => {
    const allowed = new Set(['page', 'section', 'timestamp', 'cell_ref', 'chunk_id']);
    for (const entry of buildEvidenceLedgerMvp()) {
      expect(allowed.has(entry.citation.kind)).toBe(true);
    }
  });
});

// ---------------------------------------------------------------------
// Summary, partition helpers, explanation
// ---------------------------------------------------------------------

describe('summarizeEvidenceLedger', () => {
  it('reconciles totals, byState, usable, and blocked counts', () => {
    const entries = buildEvidenceLedgerMvp();
    const summary = summarizeEvidenceLedger(entries);
    expect(summary.totalEntries).toBe(entries.length);

    const totalByState = (Object.values(summary.byState) as number[])
      .reduce((sum, count) => sum + count, 0);
    expect(totalByState).toBe(entries.length);

    const usableExpected = entries.filter((entry) => entry.state === 'usable_as_evidence').length;
    const blockedExpected = entries.filter((entry) => entry.state === 'blocked').length;
    expect(summary.usableCount).toBe(usableExpected);
    expect(summary.blockedCount).toBe(blockedExpected);
  });

  it('uniqueTenants and uniquePrograms are sorted and deduplicated', () => {
    const summary = summarizeEvidenceLedger(buildEvidenceLedgerMvp());
    const sortedTenants = [...summary.uniqueTenants].sort();
    expect(summary.uniqueTenants).toEqual(sortedTenants);
    expect(new Set(summary.uniqueTenants).size).toBe(summary.uniqueTenants.length);
    const sortedPrograms = [...summary.uniquePrograms].sort();
    expect(summary.uniquePrograms).toEqual(sortedPrograms);
    expect(new Set(summary.uniquePrograms).size).toBe(summary.uniquePrograms.length);
  });
});

describe('getUsableEvidence / getBlockedEvidence partition', () => {
  it('partitions entries correctly and disjointly', () => {
    const entries = buildEvidenceLedgerMvp();
    const usable = getUsableEvidence(entries);
    const blocked = getBlockedEvidence(entries);

    for (const entry of usable) {
      expect(entry.state).toBe('usable_as_evidence');
    }
    for (const entry of blocked) {
      expect(entry.state).toBe('blocked');
    }

    const usableIds = new Set(usable.map((entry) => entry.id));
    const blockedIds = new Set(blocked.map((entry) => entry.id));
    for (const id of usableIds) {
      expect(blockedIds.has(id)).toBe(false);
    }
  });

  it('every usable entry passes validation and every blocked entry validates as blocked', () => {
    const entries = buildEvidenceLedgerMvp();
    for (const entry of getUsableEvidence(entries)) {
      expect(validateEvidenceLedgerEntry(entry).isUsable).toBe(true);
    }
    for (const entry of getBlockedEvidence(entries)) {
      expect(validateEvidenceLedgerEntry(entry).isBlocked).toBe(true);
    }
  });
});

describe('explainEvidenceUsability', () => {
  it('returns a Usable-as-evidence string for every usable_as_evidence entry', () => {
    for (const entry of buildEvidenceLedgerMvp()) {
      if (entry.state !== 'usable_as_evidence') continue;
      expect(explainEvidenceUsability(entry)).toMatch(/^Usable as evidence:/);
    }
  });

  it('returns a Blocked: <reason> string for every blocked entry', () => {
    for (const entry of buildEvidenceLedgerMvp()) {
      if (entry.state !== 'blocked') continue;
      const text = explainEvidenceUsability(entry);
      expect(text.startsWith('Blocked:')).toBe(true);
      expect(text.length).toBeGreaterThan('Blocked:'.length + 1);
    }
  });

  it('returns a Not yet usable string for intermediate-state entries', () => {
    const intermediate: EvidenceLedgerUsabilityState[] = [
      'loaded',
      'parsed',
      'indexed',
      'classified',
      'scoped',
      'cited',
      'quality_checked',
    ];
    for (const entry of buildEvidenceLedgerMvp()) {
      if (!intermediate.includes(entry.state)) continue;
      expect(explainEvidenceUsability(entry)).toMatch(/^Not yet usable/);
    }
  });
});

// ---------------------------------------------------------------------
// Module hygiene
// ---------------------------------------------------------------------

describe('module hygiene · evidence-ledger-mvp.ts', () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const fs = require('fs') as typeof import('fs');
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const path = require('path') as typeof import('path');
  const sourcePath = path.resolve(
    __dirname,
    '../../../lib/architecture/evidence-ledger-mvp.ts',
  );
  const source = fs.readFileSync(sourcePath, 'utf8');
  const codeOnly = source
    .split('\n')
    .filter((line) => !line.trim().startsWith('//'))
    .join('\n')
    .replace(/\/\*[\s\S]*?\*\//g, '');

  it('does not import Sentinel / Atlas / Nexus / Agent / Source / Auth runtime', () => {
    expect(codeOnly).not.toMatch(/from '@\/lib\/sentinel\//);
    expect(codeOnly).not.toMatch(/from '@\/lib\/atlas\//);
    expect(codeOnly).not.toMatch(/from '@\/lib\/nexus\//);
    expect(codeOnly).not.toMatch(/from '@\/lib\/agent\//);
    expect(codeOnly).not.toMatch(/from '@\/lib\/source\//);
    expect(codeOnly).not.toMatch(/from '@\/lib\/auth\//);
    expect(codeOnly).not.toMatch(/from '@\/.*supabase/);
  });

  it('does not call Date.now / Math.random / new Date / fetch', () => {
    expect(codeOnly).not.toMatch(/Date\.now\(/);
    expect(codeOnly).not.toMatch(/Math\.random\(/);
    expect(codeOnly).not.toMatch(/new Date\(/);
    expect(codeOnly).not.toMatch(/\bfetch\(/);
  });

  it('does not invoke Anthropic / OpenAI runtime', () => {
    expect(codeOnly).not.toMatch(/anthropic/i);
    expect(codeOnly).not.toMatch(/openai/i);
  });

  it('does not use React state hooks (useState / useEffect)', () => {
    expect(codeOnly).not.toMatch(/\buseState\b/);
    expect(codeOnly).not.toMatch(/\buseEffect\b/);
  });

  it('does not include placeholder language (Coming soon / TBD / Lorem ipsum)', () => {
    expect(codeOnly).not.toMatch(/Coming soon/i);
    expect(codeOnly).not.toMatch(/\bTBD\b/);
    expect(codeOnly).not.toMatch(/Lorem ipsum/i);
  });
});
