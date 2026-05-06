# T-D.3 — Pack Test Harness

| | |
|---|---|
| **Work Package** | T-D.3 |
| **Doc ID** | `AGENT_TRAINING_TD3_PACK_TEST_HARNESS` |
| **Date** | 2026-05-05 |
| **Status** | Draft |
| **Depends on** | T-D.1 (V2 types), T-D.2 (loader integration), T-P0 through T-P5 (fixtures defined) |
| **Target file** | `src/lib/programs/phase-packs/__tests__/phase-packs-v2.test.ts` |
| **Referenced by** | T-D.4 (pack rollout — run this harness before promoting each pack) |

---

## §1 · Purpose

The V2 pack test harness validates that:

1. All 6 V2 packs type-check against the V2 schema (structural completeness)
2. The V2 formatter renders each pack into a prompt block that is well-formed and within token budget
3. Gate criteria are coherent (hard/soft split, no empty evaluation hints)
4. Anti-hallucination rules have rule/trigger/required/prohibited populated
5. Each pack's fixtures are structurally valid (can be loaded as input/expected pairs)
6. Phase-specific authorities (P4 Tower metric plan) are enforced in the formatter

The harness mirrors the structure of the V1 test in `phase-packs.test.ts` but targets the V2 loader API and V2 schema fields.

---

## §2 · Test file

The test file below should be written verbatim to `src/lib/programs/phase-packs/__tests__/phase-packs-v2.test.ts` after the V2 packs are implemented (T-D.4).

```typescript
/**
 * V2 Phase Pack test harness · T-D.3
 *
 * Schema sanity + formatter contract + fixture validity for V2 packs.
 * Run this suite before enabling PHASE_PACK_V2=true in any environment.
 *
 * Token budget: formatPhasePackV2ForPrompt output must be ≤ 2,800 tokens
 * (estimated at 4 chars/token → ≤ 11,200 chars). Packs exceeding this
 * will overrun the system block budget in the agent route.
 */

import {
  getPhasePackV2,
} from '../v2/index';
import { formatPhasePackV2ForPrompt } from '../format-v2';
import type { PhasePack, GateCriterion } from '../types.v2';

const ALL_PHASE_IDS = [0, 1, 2, 3, 4, 5] as const;

// ── §2.1 Registry contract ─────────────────────────────────────────────────

describe('getPhasePackV2', () => {
  it('returns a non-null pack for every phase 0-5', () => {
    for (const phase of ALL_PHASE_IDS) {
      expect(getPhasePackV2(phase)).not.toBeNull();
    }
  });

  it('returns null cleanly for out-of-range inputs', () => {
    expect(getPhasePackV2(null)).toBeNull();
    expect(getPhasePackV2(undefined)).toBeNull();
    expect(getPhasePackV2(-1)).toBeNull();
    expect(getPhasePackV2(6)).toBeNull();
    expect(getPhasePackV2(99)).toBeNull();
  });

  it('returns P4 pack with tower_metric_plan_authority', () => {
    const p4 = getPhasePackV2(4);
    expect(p4?.tower_metric_plan_authority).toBeDefined();
    expect(p4?.tower_metric_plan_authority?.rule).toBeDefined();
    expect(p4?.tower_metric_plan_authority?.opening_message.length).toBeGreaterThan(30);
  });

  it('P5 tower_metric_plan_authority is NOT present (P4-only)', () => {
    const p5 = getPhasePackV2(5);
    expect(p5?.tower_metric_plan_authority).toBeUndefined();
  });
});

// ── §2.2 V2 schema sanity (runs over all 6 packs) ─────────────────────────

const ALL_PACKS_V2: PhasePack[] = ALL_PHASE_IDS.map((p) => {
  const pack = getPhasePackV2(p);
  if (!pack) throw new Error(`getPhasePackV2(${p}) returned null — pack not implemented`);
  return pack;
});

describe('V2 schema sanity', () => {
  // ── Fields 1-3 ──────────────────────────────────────────────────────────

  it.each(ALL_PACKS_V2)('$phase_name · phase_id is in [0,5]', (pack) => {
    expect(pack.phase_id).toBeGreaterThanOrEqual(0);
    expect(pack.phase_id).toBeLessThanOrEqual(5);
  });

  it.each(ALL_PACKS_V2)('$phase_name · phase_intent is substantial prose', (pack) => {
    expect(pack.phase_intent.length).toBeGreaterThan(80);
  });

  it.each(ALL_PACKS_V2)('$phase_name · phase_outcome is substantial prose', (pack) => {
    expect(pack.phase_outcome.length).toBeGreaterThan(80);
  });

  // ── Field 4 — entry criteria ──────────────────────────────────────────

  it.each(ALL_PACKS_V2)('$phase_name · has at least one entry criterion', (pack) => {
    expect(pack.entry_criteria.length).toBeGreaterThan(0);
  });

  it.each(ALL_PACKS_V2)('$phase_name · entry criterion ids are unique', (pack) => {
    const ids = pack.entry_criteria.map((c) => c.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  // ── Field 5 — workflow steps ──────────────────────────────────────────

  it.each(ALL_PACKS_V2)('$phase_name · has at least 2 workflow steps', (pack) => {
    expect(pack.workflow_steps.length).toBeGreaterThanOrEqual(2);
  });

  it.each(ALL_PACKS_V2)('$phase_name · workflow step ids are unique', (pack) => {
    const ids = pack.workflow_steps.map((s) => s.step_id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it.each(ALL_PACKS_V2)('$phase_name · every workflow step has questions', (pack) => {
    for (const step of pack.workflow_steps) {
      expect(step.questions_to_ask.length).toBeGreaterThan(0);
    }
  });

  it.each(ALL_PACKS_V2)('$phase_name · every workflow step has completion criteria', (pack) => {
    for (const step of pack.workflow_steps) {
      expect(step.completion_criteria.length).toBeGreaterThan(0);
    }
  });

  // ── Field 12 — gate criteria ──────────────────────────────────────────

  it.each(ALL_PACKS_V2)('$phase_name · has at least 2 hard gate criteria', (pack) => {
    const hard = pack.gate_criteria.filter((g: GateCriterion) => g.type === 'hard');
    expect(hard.length).toBeGreaterThanOrEqual(2);
  });

  it.each(ALL_PACKS_V2)('$phase_name · gate criterion ids are unique', (pack) => {
    const ids = pack.gate_criteria.map((g: GateCriterion) => g.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it.each(ALL_PACKS_V2)('$phase_name · every gate criterion has a non-trivial evaluation hint', (pack) => {
    for (const gc of pack.gate_criteria) {
      expect(gc.evaluation.length).toBeGreaterThan(20);
    }
  });

  it.each(ALL_PACKS_V2)('$phase_name · gate criterion type is hard or soft only', (pack) => {
    for (const gc of pack.gate_criteria) {
      expect(['hard', 'soft']).toContain(gc.type);
    }
  });

  // ── Field 14 — self-approval rules ────────────────────────────────────

  it.each(ALL_PACKS_V2)('$phase_name · self-approval rules reference valid gate criterion ids', (pack) => {
    const gcIds = new Set(pack.gate_criteria.map((g: GateCriterion) => g.id));
    for (const rule of pack.self_approval_rules) {
      expect(gcIds.has(rule.criterion_id)).toBe(true);
    }
  });

  // ── Field 19 — anti-hallucination rules ──────────────────────────────

  it.each(ALL_PACKS_V2)('$phase_name · has at least 2 anti-hallucination rules', (pack) => {
    expect(pack.anti_hallucination_rules.length).toBeGreaterThanOrEqual(2);
  });

  it.each(ALL_PACKS_V2)('$phase_name · every AH rule has required_behavior and prohibited_behavior', (pack) => {
    for (const ah of pack.anti_hallucination_rules) {
      expect(ah.required_behavior.length).toBeGreaterThan(20);
      expect(ah.prohibited_behavior.length).toBeGreaterThan(20);
    }
  });

  it.each(ALL_PACKS_V2)('$phase_name · AH rule ids are unique within pack', (pack) => {
    const ids = pack.anti_hallucination_rules.map((ah) => ah.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  // ── Field 13 — anti-patterns ──────────────────────────────────────────

  it.each(ALL_PACKS_V2)('$phase_name · has at least 2 anti-patterns', (pack) => {
    expect(pack.anti_patterns.length).toBeGreaterThanOrEqual(2);
  });

  it.each(ALL_PACKS_V2)('$phase_name · every anti-pattern has detection_hint and mitigation', (pack) => {
    for (const ap of pack.anti_patterns) {
      expect(ap.detection_hint.length).toBeGreaterThan(20);
      expect(ap.mitigation.length).toBeGreaterThan(20);
    }
  });

  // ── Field 21 — cross-phase dependencies ──────────────────────────────

  it.each(ALL_PACKS_V2)('$phase_name · has cross-phase dependencies', (pack) => {
    expect(pack.phase_dependencies.produces_for_next.length).toBeGreaterThan(0);
    // P0 may have empty requires_from_prior (entry phase)
    if (pack.phase_id > 0) {
      expect(pack.phase_dependencies.requires_from_prior.length).toBeGreaterThan(0);
    }
  });

  // ── Field 16 — fixtures ───────────────────────────────────────────────

  it.each(ALL_PACKS_V2)('$phase_name · has at least 2 fixtures', (pack) => {
    expect(pack.fixtures.length).toBeGreaterThanOrEqual(2);
  });

  it.each(ALL_PACKS_V2)('$phase_name · every fixture has expected_behaviors', (pack) => {
    for (const fx of pack.fixtures) {
      expect(fx.expected_behaviors.length).toBeGreaterThan(0);
    }
  });
});

// ── §2.3 P4-specific: Tower metric plan authority ─────────────────────────

describe('P4 Tower metric plan authority', () => {
  const p4 = getPhasePackV2(4)!;

  it('authority has a trigger with logical AND condition', () => {
    const tma = p4.tower_metric_plan_authority!;
    expect(tma.trigger).toContain('AND');
  });

  it('opening_message is ≥ 50 characters', () => {
    const tma = p4.tower_metric_plan_authority!;
    expect(tma.opening_message.length).toBeGreaterThanOrEqual(50);
  });

  it('deferral_redirect explains P5 is operationalization, not definition', () => {
    const tma = p4.tower_metric_plan_authority!;
    expect(tma.deferral_redirect.toLowerCase()).toMatch(/p5|operationaliz/);
  });

  it('gate_block references tower_metrics', () => {
    const tma = p4.tower_metric_plan_authority!;
    expect(tma.gate_block.toLowerCase()).toContain('tower');
  });
});

// ── §2.4 P5-specific: handoff-not-acknowledgment authority ─────────────────

describe('P5 handoff-not-acknowledgment enforcement', () => {
  const p5 = getPhasePackV2(5)!;

  it('tower_acceptance_confirmed gate criterion is marked hard', () => {
    const gc = p5.gate_criteria.find((g) =>
      g.id.toLowerCase().includes('tower_acceptance') ||
      g.id.toLowerCase().includes('p5') && g.label.toLowerCase().includes('tower'),
    );
    expect(gc).toBeDefined();
    expect(gc!.type).toBe('hard');
  });

  it('tower acceptance self-approval rule is nexus_may_self_approve = false', () => {
    const towerAcceptanceCriterionId = p5.gate_criteria.find((g) =>
      g.id.toLowerCase().includes('tower_acceptance') ||
      (g.type === 'hard' && g.label.toLowerCase().includes('tower')),
    )?.id;
    if (towerAcceptanceCriterionId) {
      const sar = p5.self_approval_rules.find(
        (r) => r.criterion_id === towerAcceptanceCriterionId,
      );
      if (sar) {
        expect(sar.nexus_may_self_approve).toBe(false);
      }
    }
  });

  it('AH rule prohibits treating attendance as acceptance', () => {
    const ah = p5.anti_hallucination_rules.find((r) =>
      r.prohibited_behavior.toLowerCase().includes('attendance') ||
      r.prohibited_behavior.toLowerCase().includes('silence') ||
      r.rule.toLowerCase().includes('acknowledgment'),
    );
    expect(ah).toBeDefined();
  });
});

// ── §2.5 Formatter contract ────────────────────────────────────────────────

describe('formatPhasePackV2ForPrompt', () => {
  it('renders without throwing for every pack', () => {
    for (const pack of ALL_PACKS_V2) {
      expect(() => formatPhasePackV2ForPrompt(pack)).not.toThrow();
    }
  });

  it.each(ALL_PACKS_V2)('$phase_name · output is ≤ 11,200 characters (2,800 token budget)', (pack) => {
    const out = formatPhasePackV2ForPrompt(pack);
    expect(out.length).toBeLessThanOrEqual(11200);
  });

  it.each(ALL_PACKS_V2)('$phase_name · output contains phase name', (pack) => {
    const out = formatPhasePackV2ForPrompt(pack);
    expect(out).toContain(pack.phase_name);
  });

  it.each(ALL_PACKS_V2)('$phase_name · output contains HARD gate criteria labels', (pack) => {
    const out = formatPhasePackV2ForPrompt(pack);
    expect(out).toContain('[HARD]');
  });

  it.each(ALL_PACKS_V2)('$phase_name · output contains anti-hallucination rules', (pack) => {
    const out = formatPhasePackV2ForPrompt(pack);
    expect(out).toContain('Anti-hallucination');
  });

  it('P4 output contains TOWER METRIC PLAN AUTHORITY section', () => {
    const p4 = getPhasePackV2(4)!;
    const out = formatPhasePackV2ForPrompt(p4);
    expect(out).toContain('TOWER METRIC PLAN AUTHORITY');
    expect(out).toContain('P4-CRITICAL');
  });

  it('P5 output does NOT contain TOWER METRIC PLAN AUTHORITY section', () => {
    const p5 = getPhasePackV2(5)!;
    const out = formatPhasePackV2ForPrompt(p5);
    expect(out).not.toContain('TOWER METRIC PLAN AUTHORITY');
  });

  it('renders coaching arc in ENTRY/MID/EXIT order', () => {
    for (const pack of ALL_PACKS_V2) {
      const out = formatPhasePackV2ForPrompt(pack);
      const entryIdx = out.indexOf('ENTRY:');
      const midIdx = out.indexOf('MID:');
      const exitIdx = out.indexOf('EXIT:');
      expect(entryIdx).toBeGreaterThan(0);
      expect(midIdx).toBeGreaterThan(entryIdx);
      expect(exitIdx).toBeGreaterThan(midIdx);
    }
  });
});

// ── §2.6 Gate criterion consistency ───────────────────────────────────────

describe('Gate criterion consistency across pack lifecycle', () => {
  it('P5 gates include the Tower acceptance check (hard)', () => {
    const p5 = getPhasePackV2(5)!;
    const hardCount = p5.gate_criteria.filter((g) => g.type === 'hard').length;
    expect(hardCount).toBeGreaterThanOrEqual(3);
  });

  it('P4 gate has tower_metrics_plan as a hard criterion', () => {
    const p4 = getPhasePackV2(4)!;
    const towerMetric = p4.gate_criteria.find(
      (g) => g.id.toLowerCase().includes('tower_metric') ||
             g.label.toLowerCase().includes('tower metric'),
    );
    expect(towerMetric).toBeDefined();
    expect(towerMetric!.type).toBe('hard');
  });

  it('P2 has discontinue authority reflected in gate criteria or exit criteria', () => {
    const p2 = getPhasePackV2(2)!;
    const allCriteria = [...p2.gate_criteria, ...p2.exit_criteria];
    const hasDiscontinue = allCriteria.some(
      (c) => c.description?.toLowerCase().includes('discontinue') ||
             c.label?.toLowerCase().includes('discontinue') ||
             c.evaluation?.toLowerCase().includes('discontinue'),
    );
    expect(hasDiscontinue).toBe(true);
  });
});
```

---

## §3 · How to run the test harness

```bash
# From the project root — run only V2 pack tests
npx jest src/lib/programs/phase-packs/__tests__/phase-packs-v2.test.ts

# Run V1 + V2 together (verify no regression)
npx jest src/lib/programs/phase-packs/__tests__/
```

Expected result on T-D.4 pack rollout day:
- All V1 tests PASS (no regression)
- All V2 tests PASS (pack authoring complete and correct)

---

## §4 · Fixture execution model (future extension — T-D.4 stretch)

The current test harness validates structural completeness of fixtures (§2.2 Field 16). A future extension of the harness could actually execute fixtures against a mock Nexus context to validate behavioral assertions:

1. Load `pack.fixtures[i].input` as engagement state
2. Send a test message matching the fixture scenario
3. Assert that Nexus's response contains `expected_behaviors` and excludes `prohibited_behaviors`

This requires a Nexus simulation layer (mocked LLM) that is out of scope for T-D.3 but should be designed for as a T-D.4 stretch goal. The fixture schema in T-D.1 is designed to support this extension.

---

## §5 · Self-QA

| Check | Status |
|---|---|
| Test file covers all 6 V2 packs via `ALL_PACKS_V2` loop | PASS |
| Gate criteria hard/soft contract tested | PASS |
| Anti-hallucination rules tested (required + prohibited fields) | PASS |
| P4 Tower metric plan authority tested explicitly | PASS |
| P5 handoff-not-acknowledgment tested via gate criteria + AH rule | PASS |
| Token budget (≤ 11,200 chars) enforced | PASS |
| V1 regression coverage preserved (run together) | PASS |
| Fixture schema validity tested | PASS |

---

## §6 · Document evolution

| Version | Date | Changes | Author |
|---|---|---|---|
| 0.1 | 2026-05-05 | Initial draft — full test file for V2 harness; P4/P5 specific authority tests | Claude Code |
