// PHS Population-Health exemplar Move — composition proof.
//
// Composes a Presbyterian-Healthcare-Services-inspired population-health Move
// IN MEMORY (no DB) and renders the board-grade Move artifacts through the real
// expert-kernel deterministic renderers. The Move binds the
// `(healthcare-provider, population_health_value_based_care)` Domain Function
// Pack — now carrying the own-it discipline (#3212) and the cross-cutting
// architecture patterns (#3213: landing zone, own-it ingestion, HITRUST) — so
// the rendered Solution Architecture inherits a real platform foundation and
// the rendered artifacts cite curated depth rather than improvising it.
//
// This is the end-to-end proof that the Pattern Pack Bible → kernel encoding
// produces excellent, grounded Move artifacts. Output is written to
// docs/build/meridian-phs-success-brief/exemplar-move/ for inspection.
//
// Run: npx tsx scripts/phs/render-phs-population-health-exemplar.ts

import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

import type { MoveBusinessCaseInput } from '../../src/lib/programs/move-business-case';
import { renderMoveSolutionArchitectureHtml } from '../../src/lib/programs/expert-kernel/exports/board-grade/move-solution-architecture-renderer';
import { renderMoveDiscoverBriefHtml } from '../../src/lib/programs/expert-kernel/exports/board-grade/move-discover-brief-renderer';
import { renderMoveCostedBusinessCaseHtml } from '../../src/lib/programs/expert-kernel/exports/board-grade/move-html-renderer';
import { renderMoveMobilizePacketHtml } from '../../src/lib/programs/expert-kernel/exports/board-grade/move-mobilize-renderer';

const GENERATED_ON = '2026-06-06';

// The PHS / Meridian population-health Move — minimal MoveBusinessCaseInput.
// industry_code 'healthcare_idn' → healthcare-provider; function_pack_key binds
// the population-health / VBC pack. baseline_metrics use the pack's operating-
// metric keys so the binding reconciles recorded vs seed-gap metrics honestly.
const phsPopHealthMove: MoveBusinessCaseInput = {
  id: 'phs-pop-health-exemplar',
  name: 'AI-Enabled Population Health & Clinical Performance Command Center',
  industry_code: 'healthcare_idn',
  function_pack_key: 'population_health_value_based_care',
  tenant_key: 'meridian',
  tenant_name: 'Presbyterian Healthcare Services (Meridian demo tenant)',
  charter: {
    functionPackKey: 'population_health_value_based_care',
    problem:
      'An integrated New Mexico payer-provider must lift Stars, close care ' +
      'gaps, reduce avoidable utilization, and compress MLR on a platform it ' +
      'owns — not a rented analytics black box.',
  },
  // metric_name matches the pack's operating-metric names so the binding
  // reconciles these as RECORDED; unrecorded pack metrics surface as honest
  // seed gaps.
  baseline_metrics: [
    {
      metric_name: 'Medical loss ratio (MLR)',
      value: 120,
      unit: 'percent',
      source: 'Plan settlement (individual block, 2024)',
      as_of: '2025-12-31',
    },
    {
      metric_name: 'Quality composite / Star rating',
      value: 3.0,
      unit: 'CMS Star rating (1-5)',
      source: 'CMS 2026 Star ratings',
      as_of: '2025-10-01',
    },
    {
      metric_name: 'RAF score capture / accuracy',
      value: 88,
      unit: 'captured RAF as % of expected',
      source: 'Risk-adjustment submission reconciliation',
      as_of: '2025-12-31',
    },
    {
      metric_name: 'Preventable hospitalisation rate',
      value: 58,
      unit: 'admissions per 1,000 members per year',
      source: 'Payer claims, preventable-condition set',
      as_of: '2025-12-31',
    },
  ],
};

const OUT_DIR = join(
  process.cwd(),
  'docs',
  'build',
  'meridian-phs-success-brief',
  'exemplar-move',
);
mkdirSync(OUT_DIR, { recursive: true });

const artifacts: Array<{ file: string; html: string; label: string }> = [
  {
    file: 'phs-solution-architecture.html',
    label: 'Solution Architecture Pack',
    html: renderMoveSolutionArchitectureHtml(phsPopHealthMove, GENERATED_ON),
  },
  {
    file: 'phs-discover-brief.html',
    label: 'Discover Brief',
    html: renderMoveDiscoverBriefHtml(phsPopHealthMove, GENERATED_ON),
  },
  {
    file: 'phs-business-case.html',
    label: 'Costed Business Case',
    html: renderMoveCostedBusinessCaseHtml(phsPopHealthMove, GENERATED_ON),
  },
  {
    file: 'phs-mobilize-packet.html',
    label: 'Mobilize Packet',
    html: renderMoveMobilizePacketHtml(phsPopHealthMove, GENERATED_ON),
  },
];

let boundCount = 0;
for (const a of artifacts) {
  writeFileSync(join(OUT_DIR, a.file), a.html, 'utf8');
  const bound = !/does not resolve to a curated Domain Function Pack/i.test(
    a.html,
  );
  if (bound) boundCount += 1;
  // Probe for the own-it + cross-cutting depth flowing through.
  const hasLandingZone = /landing zone/i.test(a.html);
  const hasOwnIt = /own-it|rented|rent posture/i.test(a.html);
  const hasIngestion = /ingestion framework|DLT-META|Lakeflow|metadata-driven/i.test(
    a.html,
  );
  console.log(
    `${a.label.padEnd(26)} → ${a.file}  ` +
      `[${(a.html.length / 1024).toFixed(0)}kb] ` +
      `bound=${bound ? 'YES' : 'no'} ` +
      `landingZone=${hasLandingZone} ownIt=${hasOwnIt} ingestion=${hasIngestion}`,
  );
}

console.log(
  `\n${boundCount}/${artifacts.length} artifacts bound to the curated ` +
    `population-health function pack. Output: ${OUT_DIR}`,
);
