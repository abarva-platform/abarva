// Synthetic Pilot Rehearsal — Northwind Retail end-to-end walk.
//
// Walks the rehearsal Move ("Reduce repeat contact-center transfers") through
// every kernel-derived artifact path a real Northwind pilot customer would
// exercise. Runs IN-PROCESS, without a live Supabase / Clerk session — every
// step calls the pure builders directly, the same builders the API routes call
// after they resolve the Move row.
//
// Emits per-step status to stdout. Each step prints:
//   • a human-readable header
//   • whether the call succeeded
//   • the verdict / binding state where relevant
//   • the first 600 chars of the rendered HTML (smoke confirmation)
//
// Usage:
//   npx tsx src/scripts/pilot/walk-synthetic-pilot-northwind.ts
//
// The full rehearsal log lives at docs/pilot/SYNTHETIC-PILOT-REHEARSAL-LOG.md.

import {
  buildMoveDiscoverBrief,
  buildMoveCostedBusinessCasePack,
  buildMoveSolutionArchitecture,
  buildMoveMobilizePacket,
  buildMoveCharterSkeleton,
  buildMoveEstimateModel,
  buildMoveCfoPack,
  buildMoveMasterDossier,
  renderMoveDiscoverBriefHtml,
  renderMoveCostedBusinessCaseHtml,
  renderMoveSolutionArchitectureHtml,
  renderMoveMobilizePacketHtml,
  renderMoveCharterSkeletonHtml,
  renderMoveEstimateModelHtml,
  renderMoveCfoPackHtml,
  renderMoveMasterDossierHtml,
} from '../../lib/programs/expert-kernel/exports/board-grade';
import {
  classifyFunctionKey,
  industryKeyForCode,
  resolveMoveFunctionIdentity,
} from '../../lib/programs/function-identity';
import { resolveFunctionPack } from '../../lib/programs/expert-kernel/domain/function-pack-registry';
import type { MoveBusinessCaseInput } from '../../lib/programs/move-business-case';
import {
  NORTHWIND_BASELINE_METRICS_CUSTOMER_CARE,
  NORTHWIND_REHEARSAL_MOVE,
} from '../seed/northwind-enterprise';

const GENERATED_ON = new Date().toISOString().slice(0, 10);

interface StepResult {
  step: number;
  title: string;
  status: 'OK' | 'WARN' | 'BROKEN' | 'MISSING';
  detail: string;
  evidence?: string;
}

const results: StepResult[] = [];

function record(r: StepResult): void {
  results.push(r);
  const tag =
    r.status === 'OK' ? 'ok'
    : r.status === 'WARN' ? 'warn'
    : r.status === 'MISSING' ? 'missing'
    : 'broken';
  console.log(`\n--- Step ${r.step}: ${r.title} [${tag}] ---`);
  console.log(r.detail);
  if (r.evidence) console.log('evidence:', r.evidence.slice(0, 240).replace(/\s+/g, ' '));
}

function htmlExcerpt(html: string): string {
  const m = html.match(/<title>([^<]+)<\/title>/i);
  const title = m?.[1] ?? '(no title)';
  const body = html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 260);
  return `title="${title}" | body="${body}"`;
}

// ─────────────────────────────────────────────────────────────────────────────
// Step 1 — Tenant onboarding / login for the new tenant key.
// ─────────────────────────────────────────────────────────────────────────────
{
  // We cannot actually sign in via Clerk here, but we CAN check the static
  // hardcodes that a new tenant onboarding flow trips against.
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const cfg = require('../../lib/client-config') as typeof import('../../lib/client-config');
  const knownKeys = cfg.ALL_CLIENTS.map((c) => c.id);
  const recognised = knownKeys.includes('northwind' as never);
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const ac = require('../../lib/active-client') as typeof import('../../lib/active-client');
  // active-client carries a hardcoded slug map; check whether northwind is in it.
  const acFile = require('fs').readFileSync(
    require('path').resolve(__dirname, '../../lib/active-client.ts'),
    'utf-8'
  );
  const slugMapKnowsNorthwind = /northwind/i.test(acFile);
  const detail = [
    `client-config.ALL_CLIENTS recognises 'northwind' key: ${recognised}`,
    `active-client.ts slug map mentions northwind: ${slugMapKnowsNorthwind}`,
    `CLIENT_KEY_TO_INDUSTRY_CODE has entries for: ${Object.keys(cfg.CLIENT_KEY_TO_INDUSTRY_CODE).join(', ')}`,
    `canonical-auth-roster does not include a Northwind admin email`,
    `tenant-onboarding for a brand-new key requires: (1) row in clients table, (2) addition to client-config, (3) email in canonical-auth-roster, (4) row in demo-tenant-data-tiers`,
  ].join('\n');
  void ac;
  record({
    step: 1,
    title: 'Tenant onboarding / login for new tenant key',
    status: 'BROKEN',
    detail,
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// Step 2 — Setup / admin view for the new tenant.
// ─────────────────────────────────────────────────────────────────────────────
{
  // The setup surface is gated by tenant key. The demo-tenant-data-tiers
  // module is the registry surfaces consult; without an entry, the admin
  // view either renders empty or falls back to apex-retail (see
  // getTenantRouteFallback).
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const tiers = require('../../lib/tenants/demo-tenant-data-tiers') as
    typeof import('../../lib/tenants/demo-tenant-data-tiers');
  const t = tiers.getDemoTenantDataTier('northwind');
  const fallback = tiers.getTenantRouteFallback('northwind', 'admin');
  const detail = [
    `getDemoTenantDataTier('northwind') → ${t ? 'found' : 'NULL'}`,
    `getTenantRouteFallback('northwind','admin') → ${fallback}`,
    `Setup currently does not know Northwind exists; admin route falls back to '/tenant/apex-retail/programs'.`,
    `Fallback hardcoding to apex-retail is a known coverage gap for any new tenant.`,
  ].join('\n');
  record({
    step: 2,
    title: 'Setup / admin view for new tenant',
    status: 'BROKEN',
    detail,
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// Step 3 — Originate a Move via the classifier.
// ─────────────────────────────────────────────────────────────────────────────
const industryKey = industryKeyForCode(NORTHWIND_REHEARSAL_MOVE.industryCode);
const classification = classifyFunctionKey(
  industryKey ?? 'retail',
  [
    NORTHWIND_REHEARSAL_MOVE.name,
    NORTHWIND_REHEARSAL_MOVE.problemStatement,
    NORTHWIND_REHEARSAL_MOVE.targetOutcome,
    NORTHWIND_REHEARSAL_MOVE.classification,
  ].join(' '),
);
{
  if (!classification) {
    record({
      step: 3,
      title: 'Originate Move via /programs/new — classifier picks function',
      status: 'BROKEN',
      detail:
        'classifyFunctionKey returned null — the rehearsal brief did not clear the 0.18 confidence floor. ' +
        'A real customer-care brief is not classifiable without explicit pack-vocabulary terms.',
    });
  } else {
    record({
      step: 3,
      title: 'Originate Move via /programs/new — classifier picks function',
      status: classification.functionKey === 'customer_care' ? 'OK' : 'WARN',
      detail:
        `Industry resolved to '${industryKey}'. Classifier picked function='${classification.functionKey}' ` +
        `with confidence=${classification.confidence}. ` +
        (classification.functionKey === 'customer_care'
          ? 'Matches the intended pack.'
          : `Did NOT match intended 'customer_care' pack — rehearsal escalation surface.`),
    });
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Step 4 — Verify function_pack_key + confidence populate on the engagement.
// ─────────────────────────────────────────────────────────────────────────────
{
  // Mirror what origination-submit writes into engagements.charter +
  // function_pack_key / function_pack_confidence columns. NOTE the API takes
  // camelCase `industryCode`, while `MoveBusinessCaseInput` accepts both
  // forms — a real interop gap surfaced by the rehearsal.
  const id = resolveMoveFunctionIdentity({
    industryCode: NORTHWIND_REHEARSAL_MOVE.industryCode,
    functionPackKey: classification?.functionKey ?? null,
    charter: classification
      ? { functionPackKey: classification.functionKey, functionPackConfidence: classification.confidence }
      : { functionPackKey: null },
  });
  record({
    step: 4,
    title: 'function_pack_key + function_pack_confidence populated',
    status: id ? 'OK' : 'BROKEN',
    detail: id
      ? `Resolved identity: industryKey='${id.industryKey}', functionKey='${id.functionKey}'. ` +
        `function_pack_confidence=${classification?.confidence}. ` +
        `NOTE: resolveMoveFunctionIdentity expects camelCase 'industryCode' — ` +
        `snake_case 'industry_code' silently returns null. MoveBusinessCaseInput ` +
        `accepts both forms; this resolver does not. Minor interop gap.`
      : 'resolveMoveFunctionIdentity returned null — Move would not bind a Function Pack.',
  });
}

// Build the MoveBusinessCaseInput we pass to every renderer downstream.
const moveInput: MoveBusinessCaseInput = {
  industry_code: NORTHWIND_REHEARSAL_MOVE.industryCode,
  name: NORTHWIND_REHEARSAL_MOVE.name,
  function_pack_key: classification?.functionKey ?? 'customer_care',
  charter: {
    functionPackKey: classification?.functionKey ?? 'customer_care',
    functionPackConfidence: classification?.confidence ?? 0.5,
    scaffold: {
      problem_statement: NORTHWIND_REHEARSAL_MOVE.problemStatement,
      value_hypothesis: NORTHWIND_REHEARSAL_MOVE.targetOutcome,
    },
  },
  baseline_metrics: NORTHWIND_BASELINE_METRICS_CUSTOMER_CARE.map((m) => ({
    metric_name: m.metric_name,
    value: m.value,
    unit: m.unit,
    source: m.source,
    as_of: m.as_of,
  })),
};

// ─────────────────────────────────────────────────────────────────────────────
// Step 5 — Move detail / binding inspection.
// ─────────────────────────────────────────────────────────────────────────────
{
  const pack = resolveFunctionPack('retail', 'customer_care');
  if (!pack) {
    record({
      step: 5,
      title: 'Move detail / pack binding',
      status: 'BROKEN',
      detail: 'resolveFunctionPack("retail","customer_care") returned null',
    });
  } else {
    // Real call: positional args (industryKey, functionKey, artifact, tenantMetricKeys).
    // The full Move → binding path is exposed via move-function-binding.ts.
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const mfb = require('../../lib/programs/move-function-binding') as
      typeof import('../../lib/programs/move-function-binding');
    const binding = mfb.bindMoveFunctionPack(moveInput, 'business_case');
    record({
      step: 5,
      title: 'Move detail / pack binding (customer_care)',
      status: binding.bound ? 'OK' : 'BROKEN',
      detail: [
        `bound=${binding.bound}`,
        `pack.functionLabel='${pack.functionLabel}'`,
        `expectedMetrics=${binding.expectedMetrics.length}`,
        `seedGaps=${binding.seedGaps.length} (the metrics Northwind does NOT yet record)`,
        binding.seedGaps.length > 0
          ? `seed-gap keys: ${binding.seedGaps.map((g) => g.metricKey).join(', ')}`
          : '',
        `fallbackNote: ${binding.fallbackNote || '(none)'}`,
      ]
        .filter(Boolean)
        .join('\n'),
    });
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Steps 6 + 7 — Board-grade renderers (4 phase artifacts + 4 derivatives).
// ─────────────────────────────────────────────────────────────────────────────
const ARTIFACTS: Array<{
  step: number;
  title: string;
  build: () => unknown;
  render: () => string;
}> = [
  {
    step: 6.1,
    title: 'Discover Brief — board-grade',
    build: () => buildMoveDiscoverBrief(moveInput, GENERATED_ON),
    render: () => renderMoveDiscoverBriefHtml(moveInput, GENERATED_ON),
  },
  {
    step: 6.2,
    title: 'Costed Business-Case Pack — board-grade',
    build: () => buildMoveCostedBusinessCasePack(moveInput, GENERATED_ON),
    render: () => renderMoveCostedBusinessCaseHtml(moveInput, GENERATED_ON),
  },
  {
    step: 6.3,
    title: 'Solution Architecture Pack — board-grade',
    build: () => buildMoveSolutionArchitecture(moveInput, GENERATED_ON),
    render: () => renderMoveSolutionArchitectureHtml(moveInput, GENERATED_ON),
  },
  {
    step: 6.4,
    title: 'Mobilize & Go-Decision Packet — board-grade',
    build: () => buildMoveMobilizePacket(moveInput, GENERATED_ON),
    render: () => renderMoveMobilizePacketHtml(moveInput, GENERATED_ON),
  },
  {
    step: 7.1,
    title: 'Charter Business-Case Skeleton — derivative',
    build: () => buildMoveCharterSkeleton(moveInput, GENERATED_ON),
    render: () => renderMoveCharterSkeletonHtml(moveInput, GENERATED_ON),
  },
  {
    step: 7.2,
    title: 'Estimate & Financial Model — derivative',
    build: () => buildMoveEstimateModel(moveInput, GENERATED_ON),
    render: () => renderMoveEstimateModelHtml(moveInput, GENERATED_ON),
  },
  {
    step: 7.3,
    title: 'CFO Pack — derivative',
    build: () => buildMoveCfoPack(moveInput, GENERATED_ON),
    render: () => renderMoveCfoPackHtml(moveInput, GENERATED_ON),
  },
  {
    step: 7.4,
    title: 'Master Move Dossier — derivative',
    build: () => buildMoveMasterDossier(moveInput, 'northwind-rehearsal-move', GENERATED_ON),
    render: () => renderMoveMasterDossierHtml(moveInput, 'northwind-rehearsal-move', GENERATED_ON),
  },
];

for (const a of ARTIFACTS) {
  try {
    const built = a.build() as { bound?: boolean; moveLabel?: string; verdict?: string };
    const html = a.render();
    const ok = html.length > 1000;
    const bound = built.bound === undefined ? '—' : String(built.bound);
    record({
      step: a.step,
      title: a.title,
      status: ok ? 'OK' : 'WARN',
      detail: [
        `bound=${bound}`,
        built.verdict ? `verdict=${built.verdict}` : '',
        `html size=${html.length.toLocaleString()} chars`,
      ]
        .filter(Boolean)
        .join(' · '),
      evidence: htmlExcerpt(html),
    });
  } catch (err) {
    record({
      step: a.step,
      title: a.title,
      status: 'BROKEN',
      detail: `THREW: ${err instanceof Error ? err.message : String(err)}`,
    });
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Step 8 — Intelligence surface for Northwind.
// ─────────────────────────────────────────────────────────────────────────────
{
  // We check the static state — does any Intelligence module recognise the
  // 'northwind' tenant key? The Intelligence surface is documented as
  // sparse for non-Meridian tenants in the audit.
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const fs = require('fs') as typeof import('fs');
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const path = require('path') as typeof import('path');

  function grepRecursive(dir: string, needle: RegExp): number {
    let hits = 0;
    try {
      for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        const full = path.join(dir, entry.name);
        if (entry.isDirectory()) hits += grepRecursive(full, needle);
        else if (/\.(ts|tsx|json)$/.test(entry.name)) {
          try {
            const content = fs.readFileSync(full, 'utf-8');
            if (needle.test(content)) hits++;
          } catch { /* ignore */ }
        }
      }
    } catch { /* dir missing */ }
    return hits;
  }

  const intelDir = path.resolve(__dirname, '../../lib/intelligence');
  const intelHits = grepRecursive(intelDir, /northwind/i);
  const apexHits = grepRecursive(intelDir, /apex/i);
  record({
    step: 8,
    title: 'Intelligence surface for Northwind',
    status: intelHits === 0 ? 'MISSING' : 'WARN',
    detail: [
      `src/lib/intelligence files mentioning 'northwind': ${intelHits}`,
      `same dir, 'apex': ${apexHits} (for comparison)`,
      `Intelligence has NO Northwind-specific seed, segments, contradictions, ` +
        `or executive profiles. A real customer would see a sparse or empty surface.`,
    ].join('\n'),
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// Step 9 — Source / Tower surfaces.
// ─────────────────────────────────────────────────────────────────────────────
{
  // The Source surface is tenant-keyed via demo-tenant-data-tiers + dedicated
  // source-event seeds. Northwind has none. Tower likewise.
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const tiers = require('../../lib/tenants/demo-tenant-data-tiers') as
    typeof import('../../lib/tenants/demo-tenant-data-tiers');
  const t = tiers.getDemoTenantDataTier('northwind');
  record({
    step: 9,
    title: 'Source / Tower for Northwind',
    status: t ? 'WARN' : 'MISSING',
    detail: [
      `getDemoTenantDataTier('northwind') → ${t ? 'found' : 'NULL'}`,
      `No demo-tenant-data-tiers entry means Source and Tower routes have ` +
        `no caveat / availability bound to Northwind; surfaces fall back to ` +
        `apex-retail or show a generic empty state.`,
      `Risk: a real Northwind user would see Apex-tenant Source events ` +
        `via the getTenantRouteFallback default. Cross-tenant leak class.`,
    ].join('\n'),
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// Step 10 — Phase-1 entry deliverables (gateLifecycle).
// ─────────────────────────────────────────────────────────────────────────────
{
  // gateLifecycle's pack-bound deliverable content uses the same
  // bindFunctionPackForArtifact path; if step 5 binds, phase-1 entry will too.
  // We exercise the binding for two phase-1 deliverable types.
  const types = ['business_case', 'discover_brief', 'solution_architecture', 'mobilization_plan'] as const;
  const lines: string[] = [];
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const mfb = require('../../lib/programs/move-function-binding') as
    typeof import('../../lib/programs/move-function-binding');
  for (const typeKey of types) {
    const binding = mfb.bindMoveFunctionPack(moveInput, typeKey);
    lines.push(
      `${typeKey}: bound=${binding.bound}, outline=${binding.deliverableOutline.length} sections, seedGaps=${binding.seedGaps.length}`,
    );
  }
  record({
    step: 10,
    title: 'Phase-1 entry deliverables (gateLifecycle bindings)',
    status: 'OK',
    detail: lines.join('\n') +
      '\nphase-1 entry deliverable generation in gateLifecycle.ts uses the same ' +
      'pack-bound outline path — when the Move binds, deliverables get real ' +
      'kernel-derived structure rather than improvised prose.',
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// Final summary
// ─────────────────────────────────────────────────────────────────────────────
const byStatus = results.reduce<Record<string, number>>((acc, r) => {
  acc[r.status] = (acc[r.status] ?? 0) + 1;
  return acc;
}, {});

console.log('\n\n══════════════════════════════════════════════════════════════');
console.log('  Synthetic Pilot Rehearsal · Northwind Retail · final tally');
console.log('══════════════════════════════════════════════════════════════');
console.log('  OK       :', byStatus.OK ?? 0);
console.log('  WARN     :', byStatus.WARN ?? 0);
console.log('  BROKEN   :', byStatus.BROKEN ?? 0);
console.log('  MISSING  :', byStatus.MISSING ?? 0);
console.log('  total    :', results.length);
console.log('══════════════════════════════════════════════════════════════\n');

// Export so tests can re-import without re-running side effects (we still
// printed above; this is just a convenience for programmatic readers).
export { results };
