// ADM3 · Dataset Domain Inventory tests.
//
// Pure deterministic coverage of the dataset inventory read model.

import {
  buildDatasetDomainInventory,
  buildDatasetDomainInventoryForDomain,
  summarizeDatasetDomainInventory,
  DATASET_DOMAIN_KEYS_IN_ORDER,
  DATASET_PARSE_STATES_IN_ORDER,
  DATASET_USABILITY_STATES_IN_ORDER,
  type DatasetAgentUsePermission,
  type DatasetEvidenceUsability,
  type DatasetParseStatus,
  type DatasetSourceType,
} from '@/lib/admin/dataset-domain-inventory';

const ALL_AGENTS: DatasetAgentUsePermission[] = ['nexus', 'sentinel', 'atlas', 'steward'];

const ALL_SOURCE_TYPES: DatasetSourceType[] = [
  'upload',
  'connector',
  'authored',
  'generated',
  'source_event',
];

// ---------------------------------------------------------------------
// Determinism
// ---------------------------------------------------------------------

describe('buildDatasetDomainInventory · determinism', () => {
  it('returns a deterministic inventory across repeated calls', () => {
    const a = buildDatasetDomainInventory();
    const b = buildDatasetDomainInventory();
    expect(a).toEqual(b);
  });

  it('inventory generatedFrom is deterministic_seed', () => {
    const inv = buildDatasetDomainInventory();
    expect(inv.generatedFrom).toBe('deterministic_seed');
  });
});

// ---------------------------------------------------------------------
// All 12 canonical domains present in summary
// ---------------------------------------------------------------------

describe('canonical Enterprise Dataset Domains', () => {
  it('summary.byDomain covers all 12 canonical domain keys', () => {
    const inv = buildDatasetDomainInventory();
    const expected = new Set(DATASET_DOMAIN_KEYS_IN_ORDER);
    expect(new Set(Object.keys(inv.summary.byDomain))).toEqual(expected);
    expect(DATASET_DOMAIN_KEYS_IN_ORDER.length).toBe(12);
  });

  it('per-domain query returns empty for not_started domains and non-empty for active domains', () => {
    const activeDomains = [
      'enterprise_strategy_c_suite',
      'business_kpi_functional_performance',
      'enterprise_architecture_tech_stack',
      'application_portfolio',
      'ai_portfolio_use_case_inventory',
      'risk_compliance_governance',
      'evidence_reports_artifacts',
      'org_structure_users_ownership',
    ];
    for (const k of activeDomains) {
      const items = buildDatasetDomainInventoryForDomain(k);
      expect(items.length).toBeGreaterThan(0);
    }
    const notStarted = [
      'infrastructure_cloud_data_center',
      'vendor_contract_spend',
      'ai_tool_adoption_usage_cost',
      'it_operating_model_dora',
    ];
    for (const k of notStarted) {
      const items = buildDatasetDomainInventoryForDomain(k);
      expect(items).toEqual([]);
    }
  });

  it('unknown domain key returns an empty list', () => {
    expect(buildDatasetDomainInventoryForDomain('not-a-real-domain')).toEqual([]);
    expect(buildDatasetDomainInventoryForDomain('')).toEqual([]);
  });
});

// ---------------------------------------------------------------------
// Item shape — required fields
// ---------------------------------------------------------------------

describe('DatasetInventoryItem shape', () => {
  it('every item carries the required ADM1 §I field set', () => {
    const inv = buildDatasetDomainInventory();
    for (const it of inv.items) {
      expect(typeof it.id).toBe('string');
      expect(it.id.length).toBeGreaterThan(0);
      expect(DATASET_DOMAIN_KEYS_IN_ORDER).toContain(it.domainKey);
      expect(typeof it.domainName).toBe('string');
      expect(it.domainName.length).toBeGreaterThan(0);
      expect(typeof it.name).toBe('string');
      expect(it.name.length).toBeGreaterThan(0);
      expect(ALL_SOURCE_TYPES).toContain(it.sourceType);
      // owner can be null (orphan) or string
      expect(typeof it.tenantScope).toBe('string');
      // connector is null for upload / authored / generated
      expect(DATASET_PARSE_STATES_IN_ORDER).toContain(it.parseStatus);
      expect(['today', 'this_week', 'stale', 'unknown']).toContain(it.freshnessState);
      expect(Array.isArray(it.linkedPrograms)).toBe(true);
      expect(Array.isArray(it.linkedPatterns)).toBe(true);
      expect(Array.isArray(it.linkedTowerSignals)).toBe(true);
      expect(DATASET_USABILITY_STATES_IN_ORDER).toContain(it.evidenceUsabilityState);
      expect(Array.isArray(it.agentsAllowedToUse)).toBe(true);
      for (const a of it.agentsAllowedToUse) {
        expect(ALL_AGENTS).toContain(a);
      }
      expect(Array.isArray(it.missingMetadata)).toBe(true);
      expect(typeof it.stewardGuidance).toBe('string');
      expect(it.stewardGuidance.length).toBeGreaterThan(0);
      expect(it.createdFrom).toBe('deterministic_seed');
    }
  });

  it('item ids are unique', () => {
    const inv = buildDatasetDomainInventory();
    const ids = inv.items.map((it) => it.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});

// ---------------------------------------------------------------------
// Loaded / available / usable distinction
// ---------------------------------------------------------------------

describe('loaded / available / usable distinction', () => {
  it('summary exposes loadedTotal, availableTotal, usableTotal with the right relations', () => {
    const inv = buildDatasetDomainInventory();
    const s = inv.summary;
    expect(s.loadedTotal).toBe(inv.items.length);
    expect(s.availableTotal).toBeLessThanOrEqual(s.loadedTotal);
    expect(s.usableTotal).toBeLessThanOrEqual(s.availableTotal);
    expect(s.usableTotal).toBeGreaterThanOrEqual(0);
  });

  it('availableTotal counts items at indexed or beyond', () => {
    const inv = buildDatasetDomainInventory();
    const atOrAboveIndexed: DatasetEvidenceUsability[] = [
      'indexed',
      'classified',
      'scoped',
      'cited',
      'quality_checked',
      'usable_as_evidence',
    ];
    const expected = inv.items.filter((it) =>
      atOrAboveIndexed.includes(it.evidenceUsabilityState),
    ).length;
    expect(inv.summary.availableTotal).toBe(expected);
  });

  it('usableTotal counts items at usable_as_evidence', () => {
    const inv = buildDatasetDomainInventory();
    const expected = inv.items.filter(
      (it) => it.evidenceUsabilityState === 'usable_as_evidence',
    ).length;
    expect(inv.summary.usableTotal).toBe(expected);
  });

  it('byUsability buckets cover all 9 canonical states', () => {
    const inv = buildDatasetDomainInventory();
    expect(new Set(Object.keys(inv.summary.byUsability))).toEqual(
      new Set(DATASET_USABILITY_STATES_IN_ORDER),
    );
  });
});

// ---------------------------------------------------------------------
// No production-claim invariants
// ---------------------------------------------------------------------

describe('honest source / connector invariants', () => {
  it('no item claims production connector sync (every item has connector === null today)', () => {
    const inv = buildDatasetDomainInventory();
    for (const it of inv.items) {
      // Today: every item is upload / authored / generated, not connector-sourced.
      // Until ADM5 / connector slice lands, no item should claim a live connector.
      expect(it.connector).toBeNull();
      expect(it.sourceType).not.toBe('connector');
    }
  });

  it('no item fabricates a real evidence citation (E-id format) in any string field', () => {
    const inv = buildDatasetDomainInventory();
    // The system uses E-### style citations; make sure no row claims a
    // specific E-id today (citations are deferred until evidence
    // registry lands).
    const eidPattern = /\bE-\d{2,}\b/;
    for (const it of inv.items) {
      const fields = [
        it.name,
        it.domainName,
        it.stewardGuidance,
        ...it.missingMetadata,
        ...it.linkedPrograms,
        ...it.linkedPatterns,
        ...it.linkedTowerSignals,
      ];
      for (const f of fields) {
        expect(f).not.toMatch(eidPattern);
      }
    }
  });

  it('agentsAllowedToUse contains only Nexus / Sentinel / Atlas / Steward', () => {
    const inv = buildDatasetDomainInventory();
    for (const it of inv.items) {
      for (const a of it.agentsAllowedToUse) {
        expect(ALL_AGENTS).toContain(a);
      }
    }
  });

  it('blocked items must allow only steward (or no agent) until they unblock', () => {
    const inv = buildDatasetDomainInventory();
    for (const it of inv.items) {
      if (it.evidenceUsabilityState === 'blocked') {
        for (const a of it.agentsAllowedToUse) {
          expect(a).toBe('steward');
        }
      }
    }
  });
});

// ---------------------------------------------------------------------
// Summary reconciliation
// ---------------------------------------------------------------------

describe('summarizeDatasetDomainInventory', () => {
  it('byDomain counts reconcile to the item list', () => {
    const inv = buildDatasetDomainInventory();
    const computed: Record<string, number> = {};
    for (const k of DATASET_DOMAIN_KEYS_IN_ORDER) computed[k] = 0;
    for (const it of inv.items) computed[it.domainKey] += 1;
    expect(inv.summary.byDomain).toEqual(computed);
  });

  it('byUsability + byParseStatus counts reconcile to the item list', () => {
    const inv = buildDatasetDomainInventory();
    const usability: Record<string, number> = {};
    for (const u of DATASET_USABILITY_STATES_IN_ORDER) usability[u] = 0;
    const parse: Record<string, number> = {};
    for (const p of DATASET_PARSE_STATES_IN_ORDER) parse[p] = 0;
    for (const it of inv.items) {
      usability[it.evidenceUsabilityState] += 1;
      parse[it.parseStatus] += 1;
    }
    expect(inv.summary.byUsability).toEqual(usability);
    expect(inv.summary.byParseStatus).toEqual(parse);
  });

  it('orphanCount equals number of items with null owner', () => {
    const inv = buildDatasetDomainInventory();
    const expected = inv.items.filter((it) => it.owner === null).length;
    expect(inv.summary.orphanCount).toBe(expected);
  });

  it('summarize works on an arbitrary subset', () => {
    const inv = buildDatasetDomainInventory();
    const subset = inv.items.slice(0, 3);
    const s = summarizeDatasetDomainInventory(subset);
    expect(s.totalItems).toBe(3);
    expect(s.loadedTotal).toBe(3);
  });
});

// ---------------------------------------------------------------------
// No invented dollar amounts
// ---------------------------------------------------------------------

describe('no invented dollar amounts', () => {
  it('no item invents a dollar amount in any string field', () => {
    const inv = buildDatasetDomainInventory();
    const dollarPattern = /\$\s?\d[\d,]*(\.\d+)?/;
    for (const it of inv.items) {
      const fields: string[] = [
        it.name,
        it.domainName,
        it.tenantScope,
        it.stewardGuidance,
        ...it.missingMetadata,
        ...it.linkedPrograms,
        ...it.linkedPatterns,
        ...it.linkedTowerSignals,
        ...(it.owner ? [it.owner] : []),
      ];
      for (const f of fields) {
        expect(f).not.toMatch(dollarPattern);
      }
    }
  });
});

// ---------------------------------------------------------------------
// Module hygiene
// ---------------------------------------------------------------------

describe('module hygiene · dataset-domain-inventory.ts', () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const fs = require('fs') as typeof import('fs');
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const path = require('path') as typeof import('path');

  const sourcePath = path.resolve(
    __dirname,
    '../../../lib/admin/dataset-domain-inventory.ts',
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

  it('does not import auth implementation or migrations', () => {
    expect(codeOnly).not.toMatch(/from '@\/lib\/auth\//);
    expect(codeOnly).not.toMatch(/from '@\/.*supabase/);
  });

  it('does not call Date.now / Math.random / new Date', () => {
    expect(codeOnly).not.toMatch(/Date\.now\(/);
    expect(codeOnly).not.toMatch(/Math\.random\(/);
    expect(codeOnly).not.toMatch(/new Date\(/);
  });

  it('does not invoke Claude / OpenAI / Pinecone runtime', () => {
    expect(codeOnly).not.toMatch(/anthropic/i);
    expect(codeOnly).not.toMatch(/openai/i);
    expect(codeOnly).not.toMatch(/pinecone/i);
  });
});

function stripComments(src: string): string {
  const lineStripped = src
    .split('\n')
    .filter((line) => !line.trim().startsWith('//'))
    .join('\n');
  return lineStripped.replace(/\/\*[\s\S]*?\*\//g, '');
}
