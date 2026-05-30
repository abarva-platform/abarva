#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const repoRoot = process.cwd();
const overlayDir = path.join(repoRoot, 'docs/build/industry-overlays/retail');
const verificationDir = path.join(repoRoot, 'verification/retail-overlay-v1');

const waves = [
  {
    number: 1,
    title: 'Strategy to E-Commerce',
    overlay: 'RETAIL_OVERLAY_v1_WAVE_1_STRATEGY_TO_ECOMM.md',
    manifest: 'RETAIL_OVERLAY_v1_WAVE_1_MANIFEST.json',
  },
  {
    number: 2,
    title: 'Omnichannel to Marketing',
    overlay: 'RETAIL_OVERLAY_v1_WAVE_2_OMNI_TO_MARKETING.md',
    manifest: 'RETAIL_OVERLAY_v1_WAVE_2_MANIFEST.json',
  },
  {
    number: 3,
    title: 'CX to AI',
    overlay: 'RETAIL_OVERLAY_v1_WAVE_3_CX_TO_AI.md',
    manifest: 'RETAIL_OVERLAY_v1_WAVE_3_MANIFEST.json',
  },
  {
    number: 4,
    title: 'Format Verticals',
    overlay: 'RETAIL_OVERLAY_v1_WAVE_4_FORMAT_VERTICALS.md',
    manifest: 'RETAIL_OVERLAY_v1_WAVE_4_MANIFEST.json',
  },
  {
    number: 5,
    title: 'Adjacent and Cross-Cutting',
    overlay: 'RETAIL_OVERLAY_v1_WAVE_5_ADJACENT_CROSS_CUTTING.md',
    manifest: 'RETAIL_OVERLAY_v1_WAVE_5_MANIFEST.json',
  },
];

function readWave(wave) {
  const overlayPath = path.join(overlayDir, wave.overlay);
  const manifestPath = path.join(verificationDir, wave.manifest);
  const markdown = fs.readFileSync(overlayPath, 'utf8').trim();
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  const categories = Array.from(
    manifest.packs.reduce((byCategory, entry) => {
      if (entry.packs) {
        byCategory.set(entry.code, {
          code: entry.code,
          title: entry.title,
          patterns: entry.target,
          packs: entry.packs.length,
        });
        return byCategory;
      }

      const existing = byCategory.get(entry.superCategory) ?? {
        code: entry.superCategory,
        title: entry.superCategoryTitle,
        patterns: 0,
        packs: 0,
      };
      existing.patterns += entry.count;
      existing.packs += 1;
      byCategory.set(entry.superCategory, existing);
      return byCategory;
    }, new Map()).values(),
  );
  return {
    ...wave,
    markdown,
    categories,
    patternCount: manifest.totalPatterns,
    packCount: categories.reduce((sum, category) => sum + category.packs, 0),
    categoryCount: categories.length,
  };
}

function countPatternBlocks(markdown) {
  const matches = markdown.match(/^\*\*[A-Z]{1,2}\.\d+\.\d{2} — /gm);
  return matches?.length ?? 0;
}

const waveData = waves.map(readWave);
const totalPatterns = waveData.reduce((sum, wave) => sum + wave.patternCount, 0);
const totalPacks = waveData.reduce((sum, wave) => sum + wave.packCount, 0);
const totalCategories = waveData.reduce((sum, wave) => sum + wave.categoryCount, 0);
const blockCount = waveData.reduce((sum, wave) => sum + countPatternBlocks(wave.markdown), 0);

if (totalPatterns !== 5390) throw new Error(`Expected 5390 manifest patterns, got ${totalPatterns}`);
if (blockCount !== totalPatterns) throw new Error(`Pattern block count ${blockCount} does not match manifest total ${totalPatterns}`);
if (totalPacks !== 301) throw new Error(`Expected 301 packs, got ${totalPacks}`);
if (totalCategories !== 60) throw new Error(`Expected 60 categories, got ${totalCategories}`);

const lines = [
  '# Retail Overlay v1 — Consolidated Corpus',
  '',
  'Generated: 2026-05-30',
  'Canonical industry: `retail`',
  'Overlay namespace: `retail-v1`',
  'Source: Packet 35 Phase 2 Waves 1-5.',
  '',
  '## Consolidated Count Summary',
  '',
  '| Wave | Scope | Super-categories | Packs | Patterns |',
  '| --- | --- | ---: | ---: | ---: |',
  ...waveData.map((wave) => `| ${wave.number} | ${wave.title} | ${wave.categoryCount} | ${wave.packCount} | ${wave.patternCount} |`),
  `| **Total** | **Retail Overlay v1** | **${totalCategories}** | **${totalPacks}** | **${totalPatterns}** |`,
  '',
  '## Backlog Acceptance',
  '',
  '- PASS: At least 5,200 retail patterns generated.',
  '- PASS: At least 60 super-categories represented.',
  '- PASS: At least 300 packs represented.',
  '- PASS: All source waves carry count reports and machine-readable manifests.',
  '',
  '## Category Index',
  '',
  '| Code | Category | Wave | Packs | Patterns |',
  '| --- | --- | ---: | ---: | ---: |',
  ...waveData.flatMap((wave) =>
    wave.categories.map((category) =>
      `| ${category.code} | ${category.title} | ${wave.number} | ${category.packs} | ${category.patterns} |`,
    ),
  ),
  '',
  '## Source Waves',
  '',
];

for (const wave of waveData) {
  lines.push(`---`, '', `# Wave ${wave.number} — ${wave.title}`, '', wave.markdown, '');
}

fs.mkdirSync(overlayDir, { recursive: true });
fs.mkdirSync(verificationDir, { recursive: true });

const consolidatedPath = path.join(overlayDir, 'RETAIL_OVERLAY_v1_CONSOLIDATED.md');
const manifestPath = path.join(verificationDir, 'RETAIL_OVERLAY_v1_CONSOLIDATED_MANIFEST.json');
const countReportPath = path.join(verificationDir, 'RETAIL_OVERLAY_v1_CONSOLIDATED_COUNT_REPORT.md');

fs.writeFileSync(consolidatedPath, `${lines.join('\n')}\n`);
fs.writeFileSync(
  manifestPath,
  `${JSON.stringify(
    {
      generatedAt: '2026-05-30',
      overlayNamespace: 'retail-v1',
      industry: 'retail',
      totalPatterns,
      totalPacks,
      totalCategories,
      waves: waveData.map(({ markdown: _markdown, ...wave }) => wave),
    },
    null,
    2,
  )}\n`,
);
fs.writeFileSync(
  countReportPath,
  [
    '# Retail Overlay v1 Consolidated Count Report',
    '',
    'Generated: 2026-05-30',
    '',
    '| Acceptance gate | Required | Actual | Result |',
    '| --- | ---: | ---: | --- |',
    `| Patterns | 5200 | ${totalPatterns} | PASS |`,
    `| Super-categories | 60 | ${totalCategories} | PASS |`,
    `| Packs | 300 | ${totalPacks} | PASS |`,
    '',
    '| Wave | Scope | Super-categories | Packs | Patterns |',
    '| --- | --- | ---: | ---: | ---: |',
    ...waveData.map((wave) => `| ${wave.number} | ${wave.title} | ${wave.categoryCount} | ${wave.packCount} | ${wave.patternCount} |`),
    `| **Total** | **Retail Overlay v1** | **${totalCategories}** | **${totalPacks}** | **${totalPatterns}** |`,
    '',
    'Validation:',
    '',
    `- ${totalPatterns} pattern entries counted across the five source waves.`,
    `- ${totalPacks} packs counted across the five source manifests.`,
    `- ${totalCategories} super-categories counted across the five source manifests.`,
    '- Consolidated source is generated from the reviewed wave artifacts, not hand-edited.',
    '',
  ].join('\n'),
);

console.log(
  JSON.stringify(
    {
      consolidatedPath,
      manifestPath,
      countReportPath,
      totalPatterns,
      totalPacks,
      totalCategories,
      blockCount,
    },
    null,
    2,
  ),
);
