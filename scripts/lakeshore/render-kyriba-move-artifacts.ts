// Lakeshore "Kyriba Enterprise Finance & Treasury Modernization" Move —
// board-grade artifact render harness.
//
// Composes the Lakeshore Kyriba Move IN MEMORY (no DB) and renders the real
// expert-kernel deterministic board-grade decks for every phase. Binds the
// (financial-services, finance_treasury_alm) Domain Function Pack so the decks
// inherit curated operator depth + the deterministic critic/rubric honesty
// (seed gaps named, no fund-with-blocker, payback null when monetisation blocked).
//
// Output: docs/build/lakeshore-enterprise-context/move-artifacts/board-grade/
// Run: npx tsx scripts/lakeshore/render-kyriba-move-artifacts.ts

import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

import type { MoveBusinessCaseInput } from '../../src/lib/programs/move-business-case';
import { renderMoveCharterSkeletonHtml } from '../../src/lib/programs/expert-kernel/exports/board-grade/move-charter-skeleton-renderer';
import { renderMoveDiscoverBriefHtml } from '../../src/lib/programs/expert-kernel/exports/board-grade/move-discover-brief-renderer';
import { renderMoveSolutionArchitectureHtml } from '../../src/lib/programs/expert-kernel/exports/board-grade/move-solution-architecture-renderer';
import { renderMoveCostedBusinessCaseHtml } from '../../src/lib/programs/expert-kernel/exports/board-grade/move-html-renderer';
import { renderMoveEstimateModelHtml } from '../../src/lib/programs/expert-kernel/exports/board-grade/move-estimate-renderer';
import { renderMoveCfoPackHtml } from '../../src/lib/programs/expert-kernel/exports/board-grade/move-cfo-pack-renderer';
import { renderMoveMobilizePacketHtml } from '../../src/lib/programs/expert-kernel/exports/board-grade/move-mobilize-renderer';
import { renderMoveMasterDossierHtml } from '../../src/lib/programs/expert-kernel/exports/board-grade/move-master-dossier-renderer';

const GENERATED_ON = '2026-06-06';

// Lakeshore Kyriba Move. industry_code 'finserv' → financial-services;
// function_pack_key binds the finance/treasury/ALM pack. baseline_metrics use
// the pack's operating-metric names so the binding reconciles recorded vs
// seed-gap metrics honestly.
const kyribaMove: MoveBusinessCaseInput = {
  id: 'lakeshore-kyriba-enterprise-modernization',
  name: 'Lakeshore Enterprise Finance & Treasury Modernization: Kyriba Rollout, Corporate Controls, Reporting Rationalization, Vendor Optimization & Value Realization',
  industry_code: 'finserv',
  function_pack_key: 'finance_treasury_alm',
  tenant_key: 'lakeshore-holdings',
  tenant_name: 'Lakeshore Holdings',
  charter: {
    functionPackKey: 'finance_treasury_alm',
    problem:
      'A ~$8.4B diversified holding company runs a fragmented finance & treasury ' +
      'estate — an in-flight Kyriba rollout across 10 banks, an 8.5-day close, 320 ' +
      'manually-prepared reports, ~$18.4M/yr of above-market AMS spend, and a control ' +
      'posture that must harden before SOX re-attestation. Lakeshore must release ' +
      'trapped cash, harden corporate controls, rationalize reporting, and optimize ' +
      'the vendor portfolio on a platform it owns — with a Control-Tower value spine.',
  },
  baseline_metrics: [
    {
      metric_name: 'Financial-forecast accuracy',
      value: 78,
      unit: 'percent (forecast vs actual)',
      source: 'FP&A reconciliation (Lakeshore enterprise context load V1)',
      as_of: '2026-05-31',
    },
    {
      metric_name: 'Planning and close cycle time',
      value: 8.5,
      unit: 'business days to close',
      source: 'Month-end close baseline (operations_business_process)',
      as_of: '2026-05-31',
    },
    {
      metric_name: 'Return on equity (ROE)',
      value: 11.8,
      unit: 'percent (EBITDA margin proxy)',
      source: 'Revenue & cost baseline (finance_performance)',
      as_of: '2026-03-31',
    },
    {
      metric_name: 'Cost of funds',
      value: 4.6,
      unit: 'percent (blended)',
      source: 'Debt & FX exposure (treasury_kyriba)',
      as_of: '2026-03-31',
    },
  ],
};

const OUT_DIR = join(
  process.cwd(),
  'docs',
  'build',
  'lakeshore-enterprise-context',
  'move-artifacts',
  'board-grade',
);
mkdirSync(OUT_DIR, { recursive: true });

const artifacts: Array<{ phase: string; file: string; label: string; html: string }> = [
  { phase: 'P1 Charter', file: 'lakeshore-kyriba-01-charter-skeleton.html', label: 'Charter Skeleton', html: renderMoveCharterSkeletonHtml(kyribaMove, GENERATED_ON) },
  { phase: 'P2 Discover & Diagnose', file: 'lakeshore-kyriba-02-discover-brief.html', label: 'Discover Brief', html: renderMoveDiscoverBriefHtml(kyribaMove, GENERATED_ON) },
  { phase: 'P3 Design Future State', file: 'lakeshore-kyriba-03-solution-architecture.html', label: 'Solution Architecture Pack', html: renderMoveSolutionArchitectureHtml(kyribaMove, GENERATED_ON) },
  { phase: 'P4 Roadmap & Business Case', file: 'lakeshore-kyriba-04-costed-business-case.html', label: 'Costed Business Case', html: renderMoveCostedBusinessCaseHtml(kyribaMove, GENERATED_ON) },
  { phase: 'P4 Roadmap & Business Case', file: 'lakeshore-kyriba-05-estimate-model.html', label: 'Estimate & Financial Model', html: renderMoveEstimateModelHtml(kyribaMove, GENERATED_ON) },
  { phase: 'P4 Roadmap & Business Case', file: 'lakeshore-kyriba-06-cfo-pack.html', label: 'CFO Pack', html: renderMoveCfoPackHtml(kyribaMove, GENERATED_ON) },
  { phase: 'P5 Mobilize & Handoff', file: 'lakeshore-kyriba-07-mobilize-packet.html', label: 'Mobilize & Go-Decision Packet', html: renderMoveMobilizePacketHtml(kyribaMove, GENERATED_ON) },
  { phase: 'All phases', file: 'lakeshore-kyriba-08-master-dossier.html', label: 'Master Move Dossier', html: renderMoveMasterDossierHtml(kyribaMove, GENERATED_ON) },
];

let boundCount = 0;
const index: string[] = [];
for (const a of artifacts) {
  writeFileSync(join(OUT_DIR, a.file), a.html, 'utf8');
  const bound = !/does not resolve to a curated Domain Function Pack/i.test(a.html);
  if (bound) boundCount += 1;
  const kb = (a.html.length / 1024).toFixed(0);
  index.push(`| ${a.phase} | ${a.label} | \`${a.file}\` | ${kb} KB | ${bound ? 'YES' : 'no'} |`);
  console.log(`${a.phase.padEnd(26)} ${a.label.padEnd(32)} → ${a.file} [${kb}kb] bound=${bound ? 'YES' : 'no'}`);
}

writeFileSync(
  join(OUT_DIR, 'INDEX.md'),
  `# Lakeshore Kyriba — Board-Grade Move Artifacts (per phase)\n\n` +
    `Generated ${GENERATED_ON} by the expert-kernel deterministic renderers, bound to the ` +
    `\`(financial-services, finance_treasury_alm)\` Domain Function Pack.\n\n` +
    `| Phase | Artifact | File | Size | Pack-bound |\n|---|---|---|---|---|\n` +
    index.join('\n') + '\n',
  'utf8',
);

console.log(`\n${boundCount}/${artifacts.length} artifacts bound to the curated function pack. Output: ${OUT_DIR}`);
