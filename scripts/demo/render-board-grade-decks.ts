// scripts/demo/render-board-grade-decks.ts
//
// Renders the PRODUCTION board-grade kernel decks so we can see the real
// quality bar (and what is missing for Meridian).
//
//   1. The 8 Apex REFERENCE decks (hand-curated, fully bound) -> HTML.
//   2. The Apex costed business-case deck -> editable PPTX.
//   3. The Meridian hero Move costed business-case deck via the GENERIC,
//      kernel-derived renderer, with an in-memory MoveBusinessCaseInput. This
//      shows what Meridian produces today (bound vs. honest unbound).
//
// No DB and no server runtime required (the board-grade kernel has no
// `server-only` guard). Output -> docs/build/meridian-phs-demo/wow-demo/kernel-samples/
//
// Run: npx tsx scripts/demo/render-board-grade-decks.ts

import { mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import {
  renderApexCostedBusinessCaseHtml,
  renderApexCostedBusinessCasePptx,
  renderApexDiscoverBriefHtml,
  renderApexSolutionArchitectureHtml,
  renderApexEstimateModelHtml,
  renderApexMobilizePacketHtml,
  renderApexCharterSkeletonHtml,
  renderApexCfoPackHtml,
  renderApexMasterDossierHtml,
  renderMoveCostedBusinessCaseHtml,
} from '../../src/lib/programs/expert-kernel/exports/board-grade/index';
import type { MoveBusinessCaseInput } from '../../src/lib/programs/move-business-case';

const OUT = path.resolve(
  __dirname,
  '../../docs/build/meridian-phs-demo/wow-demo/kernel-samples',
);
const REF = path.join(OUT, 'apex-reference');
const MERIDIAN = path.join(OUT, 'meridian-move');
const today = new Date().toISOString().slice(0, 10);

function write(dir: string, file: string, contents: string | Buffer): void {
  mkdirSync(dir, { recursive: true });
  writeFileSync(path.join(dir, file), contents);
  const size = typeof contents === 'string' ? Buffer.byteLength(contents) : contents.length;
  console.log(`wrote ${path.relative(process.cwd(), path.join(dir, file))} (${size} bytes)`);
}

async function main(): Promise<void> {
  // 1. Apex reference HTML decks — the production quality bar.
  write(REF, 'costed-business-case-pack.html', renderApexCostedBusinessCaseHtml(today));
  write(REF, 'discover-brief.html', renderApexDiscoverBriefHtml(today));
  write(REF, 'solution-architecture-pack.html', renderApexSolutionArchitectureHtml(today));
  write(REF, 'estimate-model.html', renderApexEstimateModelHtml(today));
  write(REF, 'mobilize-packet.html', renderApexMobilizePacketHtml(today));
  write(REF, 'charter-skeleton.html', renderApexCharterSkeletonHtml(today));
  write(REF, 'cfo-pack.html', renderApexCfoPackHtml(today));
  write(REF, 'master-move-dossier.html', renderApexMasterDossierHtml(today));

  // 2. Apex reference PPTX — the editable PowerPoint quality bar.
  const pptx = await renderApexCostedBusinessCasePptx(today);
  write(REF, 'costed-business-case-pack.pptx', pptx);

  // 3. Meridian hero Move via the generic, kernel-derived renderer.
  // In-memory MoveBusinessCaseInput (no DB). If the Move's function does not
  // bind a curated Domain Function Pack, the kernel renders the HONEST UNBOUND
  // deck rather than fabricated numbers — that is the gap to close.
  const meridianMove: MoveBusinessCaseInput = {
    industry_code: 'HEALTHCARE_IDN',
    name: 'AI-enabled Population Health & Clinical Performance Command Center',
    tenant_key: 'meridian-health',
    tenant_name: 'Meridian Health System',
    id: 'eng_meridian_pop_health_command_center_p5_demo',
    function_pack_key: 'population_health_value_based_care',
    charter: {
      functionPackKey: 'population_health_value_based_care',
      scaffold: {
        problem_statement:
          'Care-gap closure, avoidable utilization, and STAR/HEDIS pressure span provider and plan but are managed in silos.',
        value_hypothesis:
          'Avoidable admissions, care-gap closure, and quality-bonus realization.',
      },
    },
    baseline_metrics: [
      { label: 'Diabetes A1c control', value: '68%', unit: '%' },
      { label: 'Annual wellness visit rate', value: '58%', unit: '%' },
      { label: 'Risk-adjustment capture', value: '88%', unit: '%' },
    ] as unknown as MoveBusinessCaseInput['baseline_metrics'],
  };
  write(
    MERIDIAN,
    'costed-business-case-pack.html',
    renderMoveCostedBusinessCaseHtml(meridianMove, today),
  );

  console.log('\nboard-grade kernel samples complete ->', path.relative(process.cwd(), OUT));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
