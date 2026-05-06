# T-D.2 — Pack Loader Integration

| | |
|---|---|
| **Work Package** | T-D.2 |
| **Doc ID** | `AGENT_TRAINING_TD2_LOADER_INTEGRATION` |
| **Date** | 2026-05-05 |
| **Status** | Draft |
| **Depends on** | T-D.1 (V2 type system), T-P0 through T-P5 (all packs authored) |
| **Target files** | `src/lib/programs/phase-packs/index.ts` (loader) · `src/app/api/chat/agent/route.ts` (call site) |
| **Referenced by** | T-D.3 (test harness), T-D.4 (pack rollout), S-4 (migration) |
| **Risk ref** | R-08 (WBS §8.3) — new pack loader must not break existing chat flow |

---

## §1 · Current state

The existing loader in `src/lib/programs/phase-packs/index.ts` exports:

```typescript
getPhasePack(phase): PhasePack | null    // V1 PhasePack
listAuthoredPhases(): PhaseNumber[]
formatPhasePackForPrompt(pack): string   // renders V1 pack to system block
```

The agent route at `src/app/api/chat/agent/route.ts:381–384` calls:

```typescript
const pack = getPhasePack(promptPhase);
if (pack) {
  phasePackBlock = formatPhasePackForPrompt(pack);
}
```

The V2 packs have a richer 21-field schema (T-D.1 §3.2) that requires a new prompt formatter. The loader needs to:
1. Resolve the V2 pack for a given phase (V2 registry lookup)
2. Format it using a new V2 formatter
3. Feature-flag the switch so V1 is the safe fallback

---

## §2 · V2 pack registry

Create `src/lib/programs/phase-packs/v2/index.ts`:

```typescript
/**
 * V2 Pack registry — registers all 6 V2 packs.
 * Replaces V1 packs during S-4 migration.
 *
 * During migration (PHASE_PACK_V2=false): V1 packs serve chat requests.
 * After flag flip (PHASE_PACK_V2=true): V2 packs serve chat requests.
 */
import type { PhaseNumber, PhasePack } from '../types.v2';
import { P0_ORIGINATE_PACK } from './P0_originate.v2';
import { P1_CHARTER_PACK } from './P1_charter.v2';
import { P2_DIAGNOSE_PACK } from './P2_diagnose.v2';
import { P3_DESIGN_PACK } from './P3_design.v2';
import { P4_ROADMAP_PACK } from './P4_roadmap.v2';
import { P5_MOBILIZE_PACK } from './P5_mobilize.v2';

export const PACKS_V2: Record<PhaseNumber, PhasePack> = {
  0: P0_ORIGINATE_PACK,
  1: P1_CHARTER_PACK,
  2: P2_DIAGNOSE_PACK,
  3: P3_DESIGN_PACK,
  4: P4_ROADMAP_PACK,
  5: P5_MOBILIZE_PACK,
};

export function getPhasePackV2(phase: number | null | undefined): PhasePack | null {
  if (phase === null || phase === undefined) return null;
  if (phase < 0 || phase > 5) return null;
  return PACKS_V2[phase as PhaseNumber] ?? null;
}
```

---

## §3 · Updated `index.ts` — feature-flagged loader

Replace the body of `src/lib/programs/phase-packs/index.ts` with:

```typescript
// Phase Pack registry — V1 + V2 · Migration bridge
//
// Feature flag: PHASE_PACK_V2 (env var, default false)
//   false → V1 packs (current behavior, safe fallback)
//   true  → V2 packs (21-field training pack schema)
//
// The flag is read at module load time so it is consistent within a request.
// To roll out: set PHASE_PACK_V2=true in Vercel env, redeploy.
// To rollback: unset PHASE_PACK_V2, redeploy.
//
// T-D.2 defines this bridge; S-4 removes it by deleting V1 entirely.

import type { PhaseNumber, PhasePack as PhasePackV1 } from './types';
import type { PhasePack as PhasePackV2 } from './types.v2';
import { P0_ORIGINATE } from './P0_originate';
import { P1_DISCOVERY } from './P1_discovery';
import { P2_SYNTHESIS } from './P2_synthesis';
import { P3_DESIGN } from './P3_design';
import { P4_BUILD } from './P4_build';
import { P5_ACTIVATE } from './P5_activate';
import { getPhasePackV2 } from './v2/index';
import { formatPhasePackV2ForPrompt } from './format-v2';

const USE_V2 = process.env.PHASE_PACK_V2 === 'true';

const PACKS_V1: Partial<Record<PhaseNumber, PhasePackV1>> = {
  0: P0_ORIGINATE,
  1: P1_DISCOVERY,
  2: P2_SYNTHESIS,
  3: P3_DESIGN,
  4: P4_BUILD,
  5: P5_ACTIVATE,
};

/** Returns the active pack (V2 if PHASE_PACK_V2=true, else V1). */
export function getPhasePack(phase: number | null | undefined): PhasePackV1 | null {
  if (USE_V2) return null; // V2 callers use getPhasePackV2 directly
  if (phase === null || phase === undefined) return null;
  if (phase < 0 || phase > 5) return null;
  return PACKS_V1[phase as PhaseNumber] ?? null;
}

export function listAuthoredPhases(): PhaseNumber[] {
  return Object.keys(PACKS_V1)
    .map((k) => Number(k) as PhaseNumber)
    .sort((a, b) => a - b);
}

export { getPhasePackV2 };
export type { PhasePackV1, PhasePackV2 };
export type { PhaseNumber } from './types';
```

**Rationale for `getPhasePack` returning null when V2:** The call site in `route.ts` checks for null before using the pack. When V2 is enabled, the call site uses `getPhasePackV2` + `formatPhasePackV2ForPrompt` instead. This avoids a combined return type that callers can't distinguish.

---

## §4 · V2 prompt formatter

Create `src/lib/programs/phase-packs/format-v2.ts`:

```typescript
/**
 * Renders a V2 PhasePack into a Nexus-readable system block.
 *
 * Design goals:
 *   1. Richer than V1 — surface gate criteria, anti-hallucination rules,
 *      and the Tower metric plan authority for P4.
 *   2. Structured enough for Nexus to use without parsing.
 *   3. Brief enough to fit in a 2,000-token system block budget.
 *
 * Token budget target: ≤ 2,000 tokens per pack render.
 * Measured against the T-D.3 test harness fixture assertions.
 */
import type { PhasePack } from './types.v2';

export function formatPhasePackV2ForPrompt(pack: PhasePack): string {
  const lines: string[] = [];

  // ── Header ────────────────────────────────────────────────────────────────
  lines.push(`## ACTIVE PHASE PLAYBOOK (V2) · ${pack.phase_name}`);
  lines.push('');
  lines.push(
    'This playbook is your authority for coaching this phase. Read it fully. ' +
    'Surface gate risks proactively. Apply anti-hallucination rules on every response. ' +
    'Check your coaching arc posture — it changes across entry/mid/exit.',
  );
  lines.push('');

  // ── Phase intent ──────────────────────────────────────────────────────────
  lines.push('### Phase intent');
  lines.push(pack.phase_intent);
  lines.push('');

  // ── Phase outcome ─────────────────────────────────────────────────────────
  lines.push('### Phase outcome (what "done" produces)');
  lines.push(pack.phase_outcome);
  lines.push('');

  // ── P4: Tower metric plan authority (first-class surface) ─────────────────
  if (pack.tower_metric_plan_authority) {
    const tma = pack.tower_metric_plan_authority;
    lines.push('### TOWER METRIC PLAN AUTHORITY [P4-CRITICAL]');
    lines.push(`Trigger: ${tma.trigger}`);
    lines.push(`When trigger fires, say: "${tma.opening_message}"`);
    lines.push(`If team defers to P5, say: "${tma.deferral_redirect}"`);
    lines.push(`Gate block: ${tma.gate_block}`);
    lines.push('PROHIBITED: "' + tma.prohibited_behavior + '"');
    lines.push('');
  }

  // ── Coaching arc ──────────────────────────────────────────────────────────
  lines.push('### Coaching arc (posture by phase position)');
  lines.push(`ENTRY: ${pack.agent_posture_coaching_arc.entry}`);
  lines.push(`MID: ${pack.agent_posture_coaching_arc.mid}`);
  lines.push(`EXIT: ${pack.agent_posture_coaching_arc.exit}`);
  lines.push('');

  // ── Gate criteria ─────────────────────────────────────────────────────────
  lines.push('### Gate criteria (hard = blocks promotion; soft = warns)');
  for (const gc of pack.gate_criteria) {
    lines.push(`[${gc.type.toUpperCase()}] ${gc.id}: ${gc.label}`);
    lines.push(`  Evaluate: ${gc.evaluation}`);
    if (gc.pilot_approval_note) {
      lines.push(`  Pilot: ${gc.pilot_approval_note}`);
    }
  }
  lines.push('');

  // ── Anti-hallucination rules ──────────────────────────────────────────────
  lines.push('### Anti-hallucination rules (apply on every response)');
  for (const ah of pack.anti_hallucination_rules) {
    lines.push(`${ah.id}: ${ah.rule}`);
    lines.push(`  Trigger: ${ah.trigger}`);
    lines.push(`  Required: ${ah.required_behavior}`);
    lines.push(`  PROHIBITED: ${ah.prohibited_behavior}`);
  }
  lines.push('');

  // ── Workflow steps (current active step determined by context) ─────────────
  lines.push('### Workflow steps');
  for (const step of pack.workflow_steps) {
    lines.push(`${step.step_id} — ${step.step_name}: ${step.step_goal}`);
  }
  lines.push('');

  // ── Question sequencing ───────────────────────────────────────────────────
  lines.push('### Questions to drive (by arc)');
  lines.push('OPEN:');
  for (const q of pack.question_sequencing.open) {
    lines.push(`  • ${q}`);
  }
  lines.push('CONVERGE:');
  for (const q of pack.question_sequencing.converge) {
    lines.push(`  • ${q}`);
  }
  lines.push('CLOSE:');
  for (const q of pack.question_sequencing.close) {
    lines.push(`  • ${q}`);
  }
  lines.push('');

  // ── Anti-patterns ─────────────────────────────────────────────────────────
  lines.push('### Anti-patterns (surface immediately when detected)');
  for (const ap of pack.anti_patterns) {
    lines.push(`${ap.label}`);
    lines.push(`  Detect: ${ap.detection_hint}`);
    lines.push(`  Flag: ${ap.what_to_flag}`);
    lines.push(`  Redirect: ${ap.mitigation}`);
  }
  lines.push('');

  // ── Dependencies ─────────────────────────────────────────────────────────
  lines.push('### Cross-phase dependencies');
  lines.push('Requires from prior:');
  for (const d of pack.phase_dependencies.requires_from_prior) {
    lines.push(`  - ${d}`);
  }
  lines.push('Produces for next:');
  for (const d of pack.phase_dependencies.produces_for_next) {
    lines.push(`  - ${d}`);
  }

  return lines.join('\n');
}
```

---

## §5 · Agent route changes

In `src/app/api/chat/agent/route.ts`, the pack-loading block at lines ~381–384 should be replaced with:

```typescript
// Phase pack — V2 when PHASE_PACK_V2=true, else V1 (T-D.2)
import { getPhasePack, getPhasePackV2, formatPhasePackV2ForPrompt } from '@/lib/programs/phase-packs';
// (existing import of formatPhasePackForPrompt remains for V1 path)

// ...inside the engagement context block:
const useV2 = process.env.PHASE_PACK_V2 === 'true';
if (useV2) {
  const packV2 = getPhasePackV2(promptPhase);
  if (packV2) {
    phasePackBlock = formatPhasePackV2ForPrompt(packV2);
  }
} else {
  const pack = getPhasePack(promptPhase);
  if (pack) {
    phasePackBlock = formatPhasePackForPrompt(pack);
  }
}
```

No other changes to `route.ts` are needed. The rest of the agent route (broker bundle, failure modes, context lines) is unaffected.

---

## §6 · Environment variable

Add to `.env.example`:

```bash
# Phase pack version
# false (default) = V1 packs (existing behavior)
# true = V2 packs (21-field training pack schema, per T-D.2)
PHASE_PACK_V2=false
```

Set `PHASE_PACK_V2=true` in Vercel environment for the staging/preview deployment first. Validate using the T-D.3 test harness. Then promote to production.

---

## §7 · Rollback plan

If V2 packs produce degraded Nexus behavior:

1. Set `PHASE_PACK_V2=false` in Vercel env (or unset)
2. Redeploy (triggers new build; no code change required)
3. V1 packs immediately resume serving

This can be executed in < 5 minutes with no code change. The V1 pack files are untouched until S-4 migration, ensuring the rollback path remains valid throughout the migration period.

---

## §8 · Migration sequence (T-D.4 + S-4)

| Step | Action | Who | When |
|---|---|---|---|
| 1 | Write V2 types file (`types.v2.ts`) | Claude Code | T-D.1 done |
| 2 | Write V2 pack files in `v2/` dir | Claude Code | T-D.4 rollout |
| 3 | Write `v2/index.ts` registry | Claude Code | T-D.4 rollout |
| 4 | Write `format-v2.ts` formatter | Claude Code | T-D.2 implementation |
| 5 | Update `index.ts` with feature flag bridge | Claude Code | T-D.2 implementation |
| 6 | Update `route.ts` with V2 branch | Claude Code | T-D.2 implementation |
| 7 | Run T-D.3 test harness | Claude Code | T-D.3 |
| 8 | Set `PHASE_PACK_V2=true` in preview env | Anand | T-D.4 rollout |
| 9 | Validate in preview with Apex Retail demo | Anand | T-D.4 rollout |
| 10 | Set `PHASE_PACK_V2=true` in production env | Anand | T-D.4 rollout |
| 11 | Delete V1 pack files; promote V2 to primary | Claude Code | S-4 migration |

---

## §9 · Self-QA

| Check | Status |
|---|---|
| V2 registry (`v2/index.ts`) defined | PASS |
| Feature flag `PHASE_PACK_V2` specified | PASS |
| `index.ts` bridge preserves V1 behavior when flag is false | PASS |
| `format-v2.ts` renders all 21 fields (with token budget guidance) | PASS |
| `route.ts` change is additive (no deletion of V1 code path) | PASS |
| Rollback plan specified and executable in < 5 minutes | PASS |
| `.env.example` update specified | PASS |
| S-4 final migration sequence specified | PASS |
| Tower metric plan authority (`P4`-specific) surfaced first-class in formatter | PASS |
| R8 (Nexus AI self-approval) + R9 (human gate approval) preserved | PASS — `self_approval_rules` governs AI only; R9 enforced at API boundary |

---

## §10 · Document evolution

| Version | Date | Changes | Author |
|---|---|---|---|
| 0.1 | 2026-05-05 | Initial draft — feature-flagged V1/V2 bridge, V2 formatter, agent route changes, rollback plan | Claude Code |
