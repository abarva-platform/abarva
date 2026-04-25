// ADM4 · Dataset Explorer panel tests.

import {
  buildDatasetExplorerView,
  buildDatasetExplorerDomains,
  type DatasetExplorerView,
} from '@/lib/admin/dataset-explorer-view';
import {
  buildDatasetDomainInventory,
  DATASET_DOMAIN_KEYS_IN_ORDER,
} from '@/lib/admin/dataset-domain-inventory';

// ---------------------------------------------------------------------
// Determinism + 12 domains visible
// ---------------------------------------------------------------------

describe('buildDatasetExplorerView · determinism + shape', () => {
  it('returns deterministic output across repeated calls', () => {
    const a = buildDatasetExplorerView();
    const b = buildDatasetExplorerView();
    expect(a).toEqual(b);
  });

  it('view exposes all 12 canonical dataset domains in canonical ordinal order', () => {
    const v = buildDatasetExplorerView();
    expect(v.domains.length).toBe(12);
    expect(v.domains.map((d) => d.key)).toEqual([...DATASET_DOMAIN_KEYS_IN_ORDER]);
    expect(v.domains.map((d) => d.ordinal)).toEqual(
      Array.from({ length: 12 }, (_, i) => i + 1),
    );
  });

  it('view generatedFrom is deterministic_seed', () => {
    const v = buildDatasetExplorerView();
    expect(v.generatedFrom).toBe('deterministic_seed');
  });
});

// ---------------------------------------------------------------------
// Loaded / available / usable distinction
// ---------------------------------------------------------------------

describe('loaded / available / usable distinction', () => {
  it('totalLoadedAcrossDomains equals inventory loadedTotal', () => {
    const v = buildDatasetExplorerView();
    expect(v.totalLoadedAcrossDomains).toBe(v.summary.loadedTotal);
    expect(v.totalUsableAcrossDomains).toBe(v.summary.usableTotal);
  });

  it('per-domain loaded sums match inventory item count', () => {
    const v = buildDatasetExplorerView();
    const totalLoaded = v.domains.reduce((acc, d) => acc + d.loadedCount, 0);
    expect(totalLoaded).toBe(v.inventory.items.length);
  });

  it('availableCount per domain is at most loadedCount', () => {
    const v = buildDatasetExplorerView();
    for (const d of v.domains) {
      expect(d.availableCount).toBeLessThanOrEqual(d.loadedCount);
      expect(d.usableCount).toBeLessThanOrEqual(d.availableCount);
    }
  });

  it('domains with zero loaded report status not_started', () => {
    const v = buildDatasetExplorerView();
    for (const d of v.domains) {
      if (d.loadedCount === 0) expect(d.status).toBe('not_started');
    }
  });
});

// ---------------------------------------------------------------------
// No live runtime / production claims
// ---------------------------------------------------------------------

describe('honest source invariants', () => {
  it('view never claims a live connector sync', () => {
    const v = buildDatasetExplorerView();
    for (const it of v.inventory.items) {
      expect(it.connector).toBeNull();
      expect(it.sourceType).not.toBe('connector');
    }
  });

  it('view never claims a production upload pipeline (no item asserts a real URL)', () => {
    const v = buildDatasetExplorerView();
    const urlPattern = /https?:\/\//;
    for (const it of v.inventory.items) {
      expect(it.name).not.toMatch(urlPattern);
    }
  });

  it('no item invents a real E-### evidence citation', () => {
    const v = buildDatasetExplorerView();
    const eidPattern = /\bE-\d{2,}\b/;
    for (const it of v.inventory.items) {
      expect(it.name).not.toMatch(eidPattern);
      expect(it.stewardGuidance).not.toMatch(eidPattern);
    }
  });

  it('interpretationBasis explicitly names deterministic source-of-truth', () => {
    const v = buildDatasetExplorerView();
    expect(v.interpretationBasis.toLowerCase()).toContain('deterministic');
  });
});

// ---------------------------------------------------------------------
// Domain rollups
// ---------------------------------------------------------------------

describe('buildDatasetExplorerDomains', () => {
  it('returns the same 12 domains in canonical order from a given inventory', () => {
    const inv = buildDatasetDomainInventory();
    const domains = buildDatasetExplorerDomains(inv);
    expect(domains.length).toBe(12);
    expect(domains.map((d) => d.key)).toEqual([...DATASET_DOMAIN_KEYS_IN_ORDER]);
  });

  it('topItem is the first item in each domain (or null when not_started)', () => {
    const v = buildDatasetExplorerView();
    for (const d of v.domains) {
      const items = v.inventory.items.filter((it) => it.domainKey === d.key);
      if (items.length === 0) {
        expect(d.topItem).toBeNull();
      } else {
        expect(d.topItem).toBe(items[0]);
      }
    }
  });
});

// ---------------------------------------------------------------------
// Module hygiene
// ---------------------------------------------------------------------

describe('module hygiene · dataset-explorer-view.ts', () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const fs = require('fs') as typeof import('fs');
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const path = require('path') as typeof import('path');
  const sourcePath = path.resolve(
    __dirname,
    '../../../lib/admin/dataset-explorer-view.ts',
  );
  const source = fs.readFileSync(sourcePath, 'utf8');
  const codeOnly = source
    .split('\n')
    .filter((line) => !line.trim().startsWith('//'))
    .join('\n')
    .replace(/\/\*[\s\S]*?\*\//g, '');

  it('imports the ADM3 inventory module', () => {
    expect(codeOnly).toMatch(/from '@\/lib\/admin\/dataset-domain-inventory'/);
  });

  it('does not import Sentinel / Atlas / Nexus / Agent runtime', () => {
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
    expect(codeOnly).not.toMatch(/from '@\/.*supabase/);
  });
});

describe('module hygiene · DatasetExplorerPanel.tsx', () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const fs = require('fs') as typeof import('fs');
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const path = require('path') as typeof import('path');
  const sourcePath = path.resolve(
    __dirname,
    '../../../components/admin/DatasetExplorerPanel.tsx',
  );
  const source = fs.readFileSync(sourcePath, 'utf8');
  const codeOnly = source
    .split('\n')
    .filter((line) => !line.trim().startsWith('//'))
    .join('\n')
    .replace(/\/\*[\s\S]*?\*\//g, '');

  it('imports the ADM4 view helper and the ADM3 inventory types', () => {
    expect(codeOnly).toMatch(/from '@\/lib\/admin\/dataset-explorer-view'/);
    expect(codeOnly).toMatch(/from '@\/lib\/admin\/dataset-domain-inventory'/);
  });

  it('does not import Sentinel / Atlas / Nexus / Agent runtime', () => {
    expect(codeOnly).not.toMatch(/from '@\/lib\/sentinel\//);
    expect(codeOnly).not.toMatch(/from '@\/lib\/atlas\//);
    expect(codeOnly).not.toMatch(/from '@\/lib\/nexus\//);
    expect(codeOnly).not.toMatch(/from '@\/lib\/agent\//);
    expect(codeOnly).not.toMatch(/from '@\/components\/agent\//);
  });

  it('does not import Source UI, legacy /programs, mock.ts, or auth', () => {
    expect(codeOnly).not.toMatch(/from '@\/lib\/source\//);
    expect(codeOnly).not.toMatch(/from '@\/app\/\(maestro\)\/source\//);
    expect(codeOnly).not.toMatch(/from '@\/app\/programs\//);
    expect(codeOnly).not.toMatch(/from '@\/lib\/programs\/mock'/);
    expect(codeOnly).not.toMatch(/from '@\/lib\/auth\//);
  });
});

describe('integration · StewardSetupControlCenter mounts DatasetExplorerPanel', () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const fs = require('fs') as typeof import('fs');
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const path = require('path') as typeof import('path');
  const sourcePath = path.resolve(
    __dirname,
    '../../../components/admin/StewardSetupControlCenter.tsx',
  );
  const source = fs.readFileSync(sourcePath, 'utf8');

  it('imports the DatasetExplorerPanel and renders it', () => {
    expect(source).toMatch(/DatasetExplorerPanel/);
    expect(source).toMatch(/<DatasetExplorerPanel\b/);
  });
});
