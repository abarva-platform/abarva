import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { SourceDataReadinessPanel } from '@/components/source/SourceDataReadinessPanel';
import {
  SOURCE_GOLDEN_EVENT_IDS,
  buildSourceDataReadinessProjectionFromAdminSetup,
} from '@/lib/source';

describe('Source data readiness panel', () => {
  it('renders seeded readiness categories deterministically', async () => {
    const projection = buildSourceDataReadinessProjectionFromAdminSetup({
      eventId: SOURCE_GOLDEN_EVENT_IDS.dataAiModernization,
    });

    const html = renderToStaticMarkup(createElement(SourceDataReadinessPanel, {
      items: projection.items,
      progressSummary: projection.summary,
    }));

    expect(html).toContain('Data readiness');
    expect(html).toContain('34% toward event data readiness');
    expect(html).toContain('Admin/Setup readiness contract projection');
    expect(html).toContain('Application Inventory');
    expect(html).toContain('Workload Baseline');
    expect(html).toContain('Ticket History');
    expect(html).toContain('Vendor Spend');
    expect(html).toContain('SLA Baseline');
    expect(html).toContain('Vendor Contracts');
    expect(html).toContain('Security / Compliance Requirements');
    expect(html).toContain('Retained Roles');
  });

  it('makes required missing categories visible', async () => {
    const projection = buildSourceDataReadinessProjectionFromAdminSetup({
      eventId: SOURCE_GOLDEN_EVENT_IDS.dataAiModernization,
    });
    const html = renderToStaticMarkup(createElement(SourceDataReadinessPanel, {
      items: projection.items,
      progressSummary: projection.summary,
    }));

    expect(html).toContain('Requested');
    expect(html).toContain('Missing');
    expect(html).toContain('3/5 required present');
    expect(html).toContain('Blocks Rich-tier Scope and makes pricing normalization unsafe.');
    expect(html).toContain('Blocks clear scope split and transition responsibility language.');
  });

  it('distinguishes usable evidence from loaded and available records', async () => {
    const projection = buildSourceDataReadinessProjectionFromAdminSetup({
      eventId: SOURCE_GOLDEN_EVENT_IDS.dataAiModernization,
    });
    const html = renderToStaticMarkup(createElement(SourceDataReadinessPanel, {
      items: projection.items,
      progressSummary: projection.summary,
    }));

    expect(html).toContain('Usable Evidence');
    expect(html).toContain('usable evidence');
    expect(html).toContain('Loaded');
    expect(html).toContain('loaded, not usable');
    expect(html).toContain('Available');
    expect(html).toContain('available, not validated');
  });

  it('renders workflow impact and agent guidance labels', async () => {
    const projection = buildSourceDataReadinessProjectionFromAdminSetup({
      eventId: SOURCE_GOLDEN_EVENT_IDS.dataAiModernization,
    });
    const html = renderToStaticMarkup(createElement(SourceDataReadinessPanel, {
      items: projection.items,
      progressSummary: projection.summary,
    }));

    expect(html).toContain('Workflow Impact');
    expect(html).toContain('Nexus should request workload volumes before strategy design expands.');
    expect(html).toContain('Sentinel should keep this out of citations until Admin/Setup marks it usable evidence.');
    expect(html).toContain('Steward to Admin/Setup intake');
  });

  it('keeps the panel inside deterministic Source boundaries', () => {
    const sources = [
      'src/components/source/SourceDataReadinessPanel.tsx',
      'src/components/source/SourceActiveStageWorkspace.tsx',
      'src/lib/source/admin-setup-readiness-contract.ts',
      'src/lib/source/mock-seed.ts',
      'src/lib/source/types.ts',
    ].map((filePath) => readFileSync(join(process.cwd(), filePath), 'utf8')).join('\n');

    expect(sources).not.toMatch(/from ['"][^'"]*(openai|anthropic|@anthropic-ai\/sdk|ai\/react|ai)['"]/i);
    expect(sources).not.toMatch(/from ['"][^'"]*(api\/v1|app\/api)[^'"]*['"]/i);
    expect(sources).not.toMatch(/from ['"][^'"]*(upload|parser|parsing|artifact-drawer|scorecard-ui)[^'"]*['"]/i);
    expect(sources).not.toMatch(/from ['"][^'"]*(admin\/setup|platform\/admin|connectors|migrations)[^'"]*['"]/i);
    expect(sources).not.toMatch(/\bfetch\(/);
    expect(sources).not.toMatch(/\b(parseUploadedFile|parseDocument|uploadFile|createConnector|createDataset)\b/);
  });
});
