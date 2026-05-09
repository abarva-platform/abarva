// I6 · Evidence Dataset Drawer tests.
//
// Pure deterministic tests over the I6 view helper plus a static-source
// hygiene pass over the I6 component and its mount in the canonical
// pattern detail surface.

import {
  buildEvidenceDatasetDrawerView,
  buildEvidenceDatasetDrawerSeedAll,
  getInternalSources,
  getExternalSources,
  type EvidenceDatasetEntry,
  type EvidenceDatasetSourceKind,
  type EvidenceFreshnessLabel,
  type EvidenceUsabilityLabel,
} from '@/lib/intelligence/evidence-dataset-drawer-view';
import { SENTINEL_PATTERN_KEYS_IN_RANK_ORDER } from '@/lib/intelligence/sentinel-pattern-detections';

const ALL_SOURCE_KINDS: ReadonlyArray<EvidenceDatasetSourceKind> = [
  'internal_tenant_artifact',
  'internal_program_evidence',
  'internal_dataset_domain',
  'external_public_pattern_pack',
  'external_industry_benchmark',
];

const ALL_FRESHNESS: ReadonlyArray<EvidenceFreshnessLabel> = [
  'fresh',
  'aging',
  'stale',
  'unknown',
];

const ALL_USABILITY: ReadonlyArray<EvidenceUsabilityLabel> = [
  'usable_as_evidence',
  'partial',
  'blocked',
  'no_evidence_loaded',
];

const INTERNAL_KINDS: ReadonlySet<EvidenceDatasetSourceKind> = new Set([
  'internal_tenant_artifact',
  'internal_program_evidence',
  'internal_dataset_domain',
]);

// ---------------------------------------------------------------------
// Determinism
// ---------------------------------------------------------------------

describe('buildEvidenceDatasetDrawerView · determinism', () => {
  it('returns byte-equal views across repeated calls for each canonical pattern key', () => {
    for (const key of SENTINEL_PATTERN_KEYS_IN_RANK_ORDER) {
      const a = buildEvidenceDatasetDrawerView(key);
      const b = buildEvidenceDatasetDrawerView(key);
      expect(JSON.stringify(a)).toBe(JSON.stringify(b));
    }
  });

  it('seed-all returns byte-equal arrays across repeated calls', () => {
    expect(JSON.stringify(buildEvidenceDatasetDrawerSeedAll())).toBe(
      JSON.stringify(buildEvidenceDatasetDrawerSeedAll()),
    );
  });

  it('returns an empty view (no entries) for unknown pattern keys', () => {
    const v = buildEvidenceDatasetDrawerView('not-a-real-pattern');
    expect(v.totalEntries).toBe(0);
    expect(v.internalEntries.length).toBe(0);
    expect(v.externalEntries.length).toBe(0);
    expect(v.totalMissingCitations).toBe(0);
    expect(v.honestDisclaimer.length).toBeGreaterThan(0);
  });
});

// ---------------------------------------------------------------------
// Coverage requirements
// ---------------------------------------------------------------------

describe('seed coverage', () => {
  const seeded = buildEvidenceDatasetDrawerSeedAll();

  it('covers at least 3 distinct pattern keys', () => {
    expect(seeded.length).toBeGreaterThanOrEqual(3);
  });

  it('every seeded pattern carries at least 4 entries', () => {
    for (const view of seeded) {
      expect(view.totalEntries).toBeGreaterThanOrEqual(4);
    }
  });

  it('every seeded pattern carries at least 2 internal and 1 external entry', () => {
    for (const view of seeded) {
      expect(view.internalEntries.length).toBeGreaterThanOrEqual(2);
      expect(view.externalEntries.length).toBeGreaterThanOrEqual(1);
    }
  });

  it('covers all 5 source kinds across the seed set', () => {
    const seen = new Set<EvidenceDatasetSourceKind>();
    for (const view of seeded) {
      for (const e of [...view.internalEntries, ...view.externalEntries]) {
        seen.add(e.sourceKind);
      }
    }
    for (const k of ALL_SOURCE_KINDS) {
      expect(seen.has(k)).toBe(true);
    }
  });

  it('covers all 4 freshness labels across the seed set', () => {
    const seen = new Set<EvidenceFreshnessLabel>();
    for (const view of seeded) {
      for (const e of [...view.internalEntries, ...view.externalEntries]) {
        seen.add(e.freshness);
      }
    }
    for (const f of ALL_FRESHNESS) {
      expect(seen.has(f)).toBe(true);
    }
  });

  it('covers all 4 usability labels across the seed set', () => {
    const seen = new Set<EvidenceUsabilityLabel>();
    for (const view of seeded) {
      for (const e of [...view.internalEntries, ...view.externalEntries]) {
        seen.add(e.usability);
      }
    }
    for (const u of ALL_USABILITY) {
      expect(seen.has(u)).toBe(true);
    }
  });
});

// ---------------------------------------------------------------------
// Per-entry contract
// ---------------------------------------------------------------------

describe('per-entry contract', () => {
  const seeded = buildEvidenceDatasetDrawerSeedAll();
  const allEntries: EvidenceDatasetEntry[] = [];
  for (const v of seeded) {
    for (const e of [...v.internalEntries, ...v.externalEntries]) {
      allEntries.push(e);
    }
  }

  it('every partial or blocked entry carries at least one missing citation', () => {
    for (const e of allEntries) {
      if (e.usability === 'partial' || e.usability === 'blocked') {
        expect(e.missingCitations.length).toBeGreaterThanOrEqual(1);
      }
    }
  });

  it('every entry carries the deterministic createdFrom marker', () => {
    for (const e of allEntries) {
      expect(e.createdFrom).toBe('deterministic_evidence_dataset_drawer_seed');
    }
  });

  it('entry ids follow the deterministic evid-dataset-seed-N form', () => {
    for (const e of allEntries) {
      expect(e.id).toMatch(/^evid-dataset-seed-\d+$/);
    }
  });

  it('source kinds are partitioned into internal/external correctly on the view', () => {
    for (const v of seeded) {
      for (const e of v.internalEntries) {
        expect(INTERNAL_KINDS.has(e.sourceKind)).toBe(true);
      }
      for (const e of v.externalEntries) {
        expect(INTERNAL_KINDS.has(e.sourceKind)).toBe(false);
      }
    }
  });

  it('citation locators are structured seed refs (no http or https)', () => {
    for (const e of allEntries) {
      expect(e.citationLocator).not.toMatch(/https?:\/\//);
      expect(e.citationLocator.length).toBeGreaterThan(0);
    }
  });
});

// ---------------------------------------------------------------------
// View aggregations
// ---------------------------------------------------------------------

describe('view aggregations', () => {
  const seeded = buildEvidenceDatasetDrawerSeedAll();

  it('breakdowns sum to total entry count', () => {
    for (const v of seeded) {
      const usabilitySum = ALL_USABILITY.reduce(
        (acc, k) => acc + v.usabilityBreakdown[k],
        0,
      );
      const freshnessSum = ALL_FRESHNESS.reduce(
        (acc, k) => acc + v.freshnessBreakdown[k],
        0,
      );
      expect(usabilitySum).toBe(v.totalEntries);
      expect(freshnessSum).toBe(v.totalEntries);
    }
  });

  it('totalMissingCitations equals the sum of per-entry missing citations', () => {
    for (const v of seeded) {
      let sum = 0;
      for (const e of [...v.internalEntries, ...v.externalEntries]) {
        sum += e.missingCitations.length;
      }
      expect(v.totalMissingCitations).toBe(sum);
    }
  });

  it('getInternalSources / getExternalSources return the same arrays as the view fields', () => {
    for (const v of seeded) {
      expect(getInternalSources(v)).toBe(v.internalEntries);
      expect(getExternalSources(v)).toBe(v.externalEntries);
    }
  });

  it('every view declares the deterministic createdFrom marker', () => {
    for (const v of seeded) {
      expect(v.createdFrom).toBe('deterministic_seed');
    }
  });
});

// ---------------------------------------------------------------------
// Honest disclaimer
// ---------------------------------------------------------------------

describe('honest disclaimer', () => {
  it('mentions deterministic seed and disclaims live external retrieval', () => {
    const view = buildEvidenceDatasetDrawerView('value_ledger_incompleteness');
    expect(view.honestDisclaimer.toLowerCase()).toMatch(/deterministic seed/);
    expect(view.honestDisclaimer.toLowerCase()).toMatch(
      /no live external retrieval/,
    );
  });
});

// ---------------------------------------------------------------------
// Serialization hygiene · no live URLs, no E-### tokens, no fabrication
// ---------------------------------------------------------------------

describe('serialization hygiene', () => {
  const serialized = JSON.stringify(buildEvidenceDatasetDrawerSeedAll());

  it('contains no https:// or http:// URLs', () => {
    expect(serialized).not.toMatch(/https?:\/\//);
  });

  it('contains no E-### / E-#### literal citation tokens', () => {
    expect(serialized).not.toMatch(/\bE-\d+\b/);
  });

  it('contains no fabricated dollar amounts', () => {
    // Allow nothing that looks like "$<digits>" or "$<digits>.<digits>".
    expect(serialized).not.toMatch(/\$\d/);
  });
});

// ---------------------------------------------------------------------
// Module hygiene · view helper
// ---------------------------------------------------------------------

describe('module hygiene · evidence-dataset-drawer-view.ts', () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const fs = require('fs') as typeof import('fs');
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const path = require('path') as typeof import('path');

  const sourcePath = path.resolve(
    __dirname,
    '../../../lib/intelligence/evidence-dataset-drawer-view.ts',
  );
  const source = fs.readFileSync(sourcePath, 'utf8');
  const codeOnly = stripComments(source);

  it('does not import Sentinel runtime, Atlas, Nexus, or agent runtime', () => {
    expect(codeOnly).not.toMatch(/from '@\/lib\/sentinel\//);
    expect(codeOnly).not.toMatch(/from '@\/lib\/atlas\//);
    expect(codeOnly).not.toMatch(/from '@\/lib\/nexus\//);
    expect(codeOnly).not.toMatch(/from '@\/lib\/agent\//);
    expect(codeOnly).not.toMatch(/from '@\/components\/agent\//);
  });

  it('does not import Source UI, legacy /programs, mock.ts, auth, or supabase', () => {
    expect(codeOnly).not.toMatch(/from '@\/lib\/source\//);
    expect(codeOnly).not.toMatch(/from '@\/app\/\(maestro\)\/source\//);
    expect(codeOnly).not.toMatch(/from '@\/app\/programs\//);
    expect(codeOnly).not.toMatch(/from '@\/lib\/programs\/mock'/);
    expect(codeOnly).not.toMatch(/from '@\/lib\/auth\//);
    expect(codeOnly).not.toMatch(/from 'supabase/);
  });

  it('does not import any model SDK', () => {
    expect(codeOnly).not.toMatch(/from 'anthropic'/);
    expect(codeOnly).not.toMatch(/from '@anthropic-ai\//);
    expect(codeOnly).not.toMatch(/from 'openai'/);
  });

  it('does not invoke runtime side-effects (Date.now / Math.random / new Date / fetch)', () => {
    expect(codeOnly).not.toMatch(/Date\.now\(/);
    expect(codeOnly).not.toMatch(/Math\.random\(/);
    expect(codeOnly).not.toMatch(/new Date\(/);
    expect(codeOnly).not.toMatch(/\bfetch\(/);
  });
});

// ---------------------------------------------------------------------
// Module hygiene · component
// ---------------------------------------------------------------------

describe('module hygiene · EvidenceDatasetDrawer.tsx', () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const fs = require('fs') as typeof import('fs');
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const path = require('path') as typeof import('path');

  const sourcePath = path.resolve(
    __dirname,
    '../../../components/intelligence/EvidenceDatasetDrawer.tsx',
  );
  const source = fs.readFileSync(sourcePath, 'utf8');
  const codeOnly = stripComments(source);

  it('is a server component (no use client / hooks)', () => {
    expect(source).not.toMatch(/'use client'/);
    expect(codeOnly).not.toMatch(/\buseState\(/);
    expect(codeOnly).not.toMatch(/\buseEffect\(/);
  });

  it('imports the I6 view helper and the AbarVa design tokens', () => {
    expect(codeOnly).toMatch(
      /from '@\/lib\/intelligence\/evidence-dataset-drawer-view'/,
    );
    expect(codeOnly).toMatch(/from '@\/lib\/design\/abarva-theme'/);
  });

  it('does not import Sentinel runtime, Atlas, Nexus, or agent runtime', () => {
    expect(codeOnly).not.toMatch(/from '@\/lib\/sentinel\//);
    expect(codeOnly).not.toMatch(/from '@\/lib\/atlas\//);
    expect(codeOnly).not.toMatch(/from '@\/lib\/nexus\//);
    expect(codeOnly).not.toMatch(/from '@\/lib\/agent\//);
    expect(codeOnly).not.toMatch(/from '@\/components\/agent\//);
  });

  it('does not import Source UI, legacy /programs, mock.ts, auth, or supabase', () => {
    expect(codeOnly).not.toMatch(/from '@\/lib\/source\//);
    expect(codeOnly).not.toMatch(/from '@\/app\/\(maestro\)\/source\//);
    expect(codeOnly).not.toMatch(/from '@\/app\/programs\//);
    expect(codeOnly).not.toMatch(/from '@\/lib\/programs\/mock'/);
    expect(codeOnly).not.toMatch(/from '@\/lib\/auth\//);
    expect(codeOnly).not.toMatch(/from 'supabase/);
  });

  it('carries the data-evidence-dataset-drawer="i6" root attribute', () => {
    expect(source).toMatch(/data-evidence-dataset-drawer="i6"/);
  });
});

// ---------------------------------------------------------------------
// Mount · the I6 drawer is integrated in the canonical pattern detail
// ---------------------------------------------------------------------

describe('SentinelPatternDetail.tsx mounts the I6 drawer', () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const fs = require('fs') as typeof import('fs');
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const path = require('path') as typeof import('path');

  const sourcePath = path.resolve(
    __dirname,
    '../../../components/intelligence/SentinelPatternDetail.tsx',
  );
  const source = fs.readFileSync(sourcePath, 'utf8');

  it('imports EvidenceDatasetDrawer and the I6 view helper', () => {
    expect(source).toMatch(/EvidenceDatasetDrawer/);
    expect(source).toMatch(/buildEvidenceDatasetDrawerView/);
  });

  it('renders the drawer via EvidenceDatasetDrawerSection', () => {
    expect(source).toMatch(/EvidenceDatasetDrawerSection/);
  });
});

// ---------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------

function stripComments(src: string): string {
  const lineStripped = src
    .split('\n')
    .filter((line) => !line.trim().startsWith('//'))
    .join('\n');
  return lineStripped.replace(/\/\*[\s\S]*?\*\//g, '');
}

