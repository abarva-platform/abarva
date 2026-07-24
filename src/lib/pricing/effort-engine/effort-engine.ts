/**
 * Nexus Pricing Engine — PR4 effort engine (brief §7.4's core formula):
 *
 *   raw module hours = base hours + Σ(driver quantity × unit hours)
 *   expected module hours = raw module hours × complexity factor
 *                           × novelty/reuse factor × assurance factor
 *   role hours = expected module hours × approved role allocation
 *   labor cost = role hours × resolved hourly rate
 *
 * PURE — no I/O. Callers assemble an already-loaded `EffortEnginePack`
 * (`model-registry.ts`) and an already-resolved rate map
 * (`rate-card-resolver.ts`) before calling `runEffortEngine`; this keeps the
 * calculation itself trivially unit-testable and exactly reproducible
 * (brief §12's determinism requirement) with no database in the loop.
 *
 * Every calculated line traces to its scope driver + effort rule + model
 * version + role mix + rate line (brief §2.8/§9.4) via the `EffortLineItem`
 * shape from `types.ts` — see each line's `formulaTrace` for a human-
 * readable rendering of the same provenance.
 */
import { resolveActivityPacksForArchetype, technicalPackCodes, type ResolvedActivityPack } from "./activity-packs";
import { getArchetype } from "./archetypes";
import { aggregateTotals } from "./cost-engine";
import { hoursToCents, roundHours } from "./money";
import { evaluateHours } from "./rule-interpreter";
import { getScenarioDefinition, scenarioHoursMultiplier, selectAgentCostLinesForScenario, type ScenarioActivityOverride } from "./scenarios";
import type {
  Cents,
  EffortEngineOutput,
  EffortLineItem,
  EffortOperation,
  EffortOperationKind,
  EffortEnginePack,
  LineClassification,
  ModuleMultipliers,
  ResolvedRate,
  ScenarioKey,
} from "./types";
import { DEFAULT_MODULE_MULTIPLIERS } from "./types";

export class MissingRoleRateEntryError extends Error {
  constructor(roleCode: string) {
    super(`missing_role_rate_entry: no ResolvedRate supplied in the rates map for role '${roleCode}' — every role referenced by an in-scope activity pack's role mix must have an entry (a "missing" resolvedFromScope is fine; an ABSENT map entry is a caller bug)`);
    this.name = "MissingRoleRateEntryError";
  }
}

export class CircularSelectionScopeError extends Error {
  constructor(packCode: string) {
    super(`circular_selection_scope: activity pack '${packCode}' is both a percentage_of_selected_labor SOURCE pack and part of a selection scope another rule reads from — not supported`);
    this.name = "CircularSelectionScopeError";
  }
}

export interface EffortEngineInput {
  archetypeCode: string;
  tenantKey: string;
  scenarioKey: ScenarioKey;
  /** driver_code -> quantity. Every driver referenced by an in-scope rule must have an entry. */
  scopeDrivers: Readonly<Record<string, number>>;
  /** activity_pack_code -> partial override of {complexityFactor, noveltyFactor, assuranceFactor}. Unlisted packs default to {1,1,1}. */
  moduleMultipliers?: Readonly<Record<string, Partial<ModuleMultipliers>>>;
  /** activity_pack_code -> classification override applied to every rule in that pack, overriding the reference pack's own default. */
  classificationOverrides?: Readonly<Record<string, LineClassification>>;
  /** activity_pack_code -> a stable shared-cost identity, used by cost-engine.ts's portfolio roll-up dedup. Only meaningful for non-initiative_specific classifications. */
  sharedCostRefs?: Readonly<Record<string, string>>;
  /** activity_pack_codes whose 'conditional' archetype mapping this Move opts into. */
  includeConditionalPackCodes?: readonly string[];
  /** Only read when scenarioKey === 'custom'. */
  customScenarioOverrides?: Readonly<Record<string, ScenarioActivityOverride>>;
  /** role_code -> ResolvedRate, pre-resolved by rate-card-resolver.ts (or a test fixture). Must contain an entry for every role in every in-scope pack's role mix. */
  rates: ReadonlyMap<string, ResolvedRate>;
}

function resolveModuleMultipliers(
  input: EffortEngineInput,
  packCode: string,
): ModuleMultipliers {
  return { ...DEFAULT_MODULE_MULTIPLIERS, ...(input.moduleMultipliers?.[packCode] ?? {}) };
}

function describeOperation(op: EffortOperation, driverQuantity: number | null): string {
  switch (op.op) {
    case "fixed_hours":
      return `fixed base of ${op.hours}h`;
    case "per_unit_hours":
      return `${driverQuantity} × ${op.unitHours}h/${op.driverCode}`;
    case "tiered_unit_hours":
      return `${driverQuantity} ${op.driverCode} across ${op.tiers.length} tiers`;
    case "percentage_of_selected_labor":
      return `${(op.percentage * 100).toFixed(1)}% of ${op.selectionScope ?? (op.selectedActivityPackCodes ?? []).join("+")} expected hours`;
    case "hours_per_week":
      return `${driverQuantity} × ${op.hoursPerWeek}h/week`;
    case "hours_per_wave":
      return `${driverQuantity} × ${op.hoursPerWave}h/wave`;
    case "hours_per_stakeholder_group":
      return `${driverQuantity} × ${op.hoursPerGroup}h/stakeholder-group`;
    case "hours_per_course":
      return `${driverQuantity} × ${op.hoursPerCourse}h/course`;
    case "hours_per_training_session":
      return `${driverQuantity} × ${op.hoursPerSession}h/session`;
    case "hours_per_supplier_month":
      return `${driverQuantity} × ${op.hoursPerSupplierMonth}h/supplier-month`;
    case "manual_cost_line":
      return `manual cost line — ${op.rationale}`;
    default: {
      const exhaustive: never = op;
      return String((exhaustive as { op: string }).op);
    }
  }
}

function driverCodeOf(op: EffortOperation): string | null {
  return "driverCode" in op ? op.driverCode : null;
}

interface RuleHoursContribution {
  pack: ResolvedActivityPack;
  ruleCode: string;
  operation: EffortOperation;
  classification: LineClassification;
  hours: number; // raw, pre-factor, pre-selection (0 for percentage rules in the base pass)
}

export function runEffortEngine(pack: EffortEnginePack, input: EffortEngineInput): EffortEngineOutput {
  getArchetype(pack, input.archetypeCode); // throws UnknownArchetypeError if invalid — validates early
  const resolvedPacks = resolveActivityPacksForArchetype(pack, input.archetypeCode, {
    includeConditionalPackCodes: input.includeConditionalPackCodes,
  });
  const techCodes = new Set(technicalPackCodes(resolvedPacks));
  const scenarioDef = getScenarioDefinition(input.scenarioKey, input.customScenarioOverrides);

  const effectiveClassification = (packCode: string, ruleClassification: LineClassification): LineClassification =>
    input.classificationOverrides?.[packCode] ?? ruleClassification;

  // --- Base pass: every non-percentage, non-manual rule's raw hours -------
  const baseContributionsByPack = new Map<string, RuleHoursContribution[]>();
  const manualCostRules: { pack: ResolvedActivityPack; ruleCode: string; operation: Extract<EffortOperation, { op: "manual_cost_line" }>; classification: LineClassification }[] = [];
  const percentageRules: { pack: ResolvedActivityPack; ruleCode: string; operation: Extract<EffortOperation, { op: "percentage_of_selected_labor" }>; classification: LineClassification }[] = [];

  for (const resolved of resolvedPacks) {
    const contributions: RuleHoursContribution[] = [];
    for (const rule of resolved.rules) {
      const classification = effectiveClassification(resolved.pack.activity_pack_code, rule.classification);
      if (rule.operation.op === "manual_cost_line") {
        manualCostRules.push({ pack: resolved, ruleCode: rule.ruleCode, operation: rule.operation, classification });
        continue;
      }
      if (rule.operation.op === "percentage_of_selected_labor") {
        percentageRules.push({ pack: resolved, ruleCode: rule.ruleCode, operation: rule.operation, classification });
        continue;
      }
      const hours = evaluateHours(rule.operation, input.scopeDrivers) ?? 0;
      contributions.push({ pack: resolved, ruleCode: rule.ruleCode, operation: rule.operation, classification, hours });
    }
    baseContributionsByPack.set(resolved.pack.activity_pack_code, contributions);
  }

  // Guard against a selection scope pointing at a pack that itself has a
  // percentage rule (would require this pack's OWN factor-adjusted total to
  // already be known — unsupported, fail loudly rather than silently using
  // a partial value).
  const percentageSourcePackCodes = new Set(percentageRules.map((r) => r.pack.pack.activity_pack_code));
  for (const pr of percentageRules) {
    const selected =
      pr.operation.selectionScope === "technical_packs_in_archetype"
        ? Array.from(techCodes)
        : (pr.operation.selectedActivityPackCodes ?? []);
    for (const sel of selected) {
      if (percentageSourcePackCodes.has(sel)) throw new CircularSelectionScopeError(sel);
    }
  }

  function factorsFor(packCode: string): { complexityFactor: number; noveltyFactor: number; assuranceFactor: number; scenarioFactor: number; scenarioRationale: string | null } {
    const m = resolveModuleMultipliers(input, packCode);
    const scenario = scenarioHoursMultiplier(scenarioDef, packCode);
    return {
      complexityFactor: m.complexityFactor,
      noveltyFactor: m.noveltyFactor,
      assuranceFactor: m.assuranceFactor,
      scenarioFactor: scenario.factor,
      scenarioRationale: scenario.rationale,
    };
  }

  // Base expected hours per pack (pre-percentage-rule addition) — this is
  // what percentage_of_selected_labor rules read from. Since (by
  // construction, guarded above) no pack referenced by a selection scope
  // itself contains a percentage rule, this value is also that pack's FINAL
  // expected hours.
  const baseExpectedHoursByPack = new Map<string, number>();
  for (const [packCode, contributions] of baseContributionsByPack) {
    const rawTotal = contributions.reduce((acc, c) => acc + c.hours, 0);
    const f = factorsFor(packCode);
    const expected = roundHours(rawTotal * f.complexityFactor * f.noveltyFactor * f.assuranceFactor * f.scenarioFactor);
    baseExpectedHoursByPack.set(packCode, expected);
  }

  // --- Percentage pass: compute this rule's raw-hours contribution -------
  const percentageContributionsByPack = new Map<string, RuleHoursContribution[]>();
  for (const pr of percentageRules) {
    const selected =
      pr.operation.selectionScope === "technical_packs_in_archetype"
        ? Array.from(techCodes)
        : (pr.operation.selectedActivityPackCodes ?? []);
    const selectedExpectedSum = selected.reduce((acc, code) => acc + (baseExpectedHoursByPack.get(code) ?? 0), 0);
    const hours = roundHours(pr.operation.percentage * selectedExpectedSum);
    const list = percentageContributionsByPack.get(pr.pack.pack.activity_pack_code) ?? [];
    list.push({ pack: pr.pack, ruleCode: pr.ruleCode, operation: pr.operation, classification: pr.classification, hours });
    percentageContributionsByPack.set(pr.pack.pack.activity_pack_code, list);
  }

  // --- Final per-pack raw/expected hours (base + percentage) -------------
  const finalRawHoursByPack = new Map<string, number>();
  const finalExpectedHoursByPack = new Map<string, number>();
  const allContributionsByPack = new Map<string, RuleHoursContribution[]>();
  for (const resolved of resolvedPacks) {
    const packCode = resolved.pack.activity_pack_code;
    const contributions = [...(baseContributionsByPack.get(packCode) ?? []), ...(percentageContributionsByPack.get(packCode) ?? [])];
    allContributionsByPack.set(packCode, contributions);
    const rawTotal = roundHours(contributions.reduce((acc, c) => acc + c.hours, 0));
    const f = factorsFor(packCode);
    const expected = roundHours(rawTotal * f.complexityFactor * f.noveltyFactor * f.assuranceFactor * f.scenarioFactor);
    finalRawHoursByPack.set(packCode, rawTotal);
    finalExpectedHoursByPack.set(packCode, expected);
  }

  // --- Emit line items: one per (pack, rule, role) for hours-based rules,
  //     one per (pack, manual_cost_line rule) for manual cost lines. -------
  const lineItems: EffortLineItem[] = [];

  for (const resolved of resolvedPacks) {
    const packCode = resolved.pack.activity_pack_code;
    const contributions = allContributionsByPack.get(packCode) ?? [];
    const rawTotal = finalRawHoursByPack.get(packCode) ?? 0;
    const expectedTotal = finalExpectedHoursByPack.get(packCode) ?? 0;
    const f = factorsFor(packCode);
    const sharedRef = input.sharedCostRefs?.[packCode] ?? null;

    for (const contribution of contributions) {
      const ruleShareOfExpected = rawTotal === 0 ? 0 : roundHours((contribution.hours / rawTotal) * expectedTotal);
      const driverQuantity =
        contribution.operation.op === "percentage_of_selected_labor" || contribution.operation.op === "manual_cost_line"
          ? null
          : (input.scopeDrivers[driverCodeOf(contribution.operation) ?? ""] ?? null);
      const driverCode = driverCodeOf(contribution.operation);

      if (resolved.roleMix.length === 0) {
        // A pack with no role mix is a configuration gap, not silently skipped.
        lineItems.push({
          archetypeCode: input.archetypeCode,
          activityPackCode: packCode,
          activityPackName: resolved.pack.activity_pack_name,
          category: resolved.pack.category,
          ruleCode: contribution.ruleCode,
          operation: contribution.operation.op,
          driverCode,
          driverQuantity,
          modelVersion: pack.modelVersion,
          scenarioKey: input.scenarioKey,
          classification: contribution.classification,
          sharedCostRef: sharedRef,
          roleCode: null,
          allocationPct: null,
          moduleHours: {
            raw: contribution.hours,
            complexityFactor: f.complexityFactor,
            noveltyFactor: f.noveltyFactor,
            assuranceFactor: f.assuranceFactor,
            scenarioFactor: f.scenarioFactor,
            expected: ruleShareOfExpected,
          },
          roleHours: null,
          rate: null,
          laborCostCents: null,
          manualCostCents: null,
          gapReason: `activity pack '${packCode}' has no pricing_activity_role_mix rows`,
          overrideRationale: f.scenarioRationale,
          formulaTrace: `${describeOperation(contribution.operation, driverQuantity)} — NO ROLE MIX CONFIGURED, cannot allocate hours to a role`,
        });
        continue;
      }

      for (const roleEntry of resolved.roleMix) {
        const rate = input.rates.get(roleEntry.roleCode);
        if (!rate) throw new MissingRoleRateEntryError(roleEntry.roleCode);
        const roleHours = roundHours(ruleShareOfExpected * (roleEntry.allocationPct / 100));
        const laborCostCents: Cents | null = rate.hourlyRateCents === null ? null : hoursToCents(roleHours, rate.hourlyRateCents);

        lineItems.push({
          archetypeCode: input.archetypeCode,
          activityPackCode: packCode,
          activityPackName: resolved.pack.activity_pack_name,
          category: resolved.pack.category,
          ruleCode: contribution.ruleCode,
          operation: contribution.operation.op,
          driverCode,
          driverQuantity,
          modelVersion: pack.modelVersion,
          scenarioKey: input.scenarioKey,
          classification: contribution.classification,
          sharedCostRef: sharedRef,
          roleCode: roleEntry.roleCode,
          allocationPct: roleEntry.allocationPct,
          moduleHours: {
            raw: contribution.hours,
            complexityFactor: f.complexityFactor,
            noveltyFactor: f.noveltyFactor,
            assuranceFactor: f.assuranceFactor,
            scenarioFactor: f.scenarioFactor,
            expected: ruleShareOfExpected,
          },
          roleHours,
          rate,
          laborCostCents,
          manualCostCents: null,
          gapReason: rate.gapReason,
          overrideRationale: f.scenarioRationale,
          formulaTrace:
            `${describeOperation(contribution.operation, driverQuantity)} = ${contribution.hours}h raw share; ` +
            `× complexity ${f.complexityFactor} × novelty ${f.noveltyFactor} × assurance ${f.assuranceFactor} × scenario ${f.scenarioFactor} ` +
            `= ${ruleShareOfExpected}h expected share; × ${roleEntry.allocationPct}% allocation = ${roleHours}h role-hours; ` +
            (rate.hourlyRateCents === null
              ? `rate UNRESOLVED (${rate.gapReason})`
              : `× $${(rate.hourlyRateCents / 100).toFixed(2)}/hr (${rate.resolvedFromScope}) = $${((laborCostCents ?? 0) / 100).toFixed(2)}`),
        });
      }
    }
  }

  for (const manual of manualCostRules) {
    const packCode = manual.pack.pack.activity_pack_code;
    const sharedRef = input.sharedCostRefs?.[packCode] ?? null;
    lineItems.push({
      archetypeCode: input.archetypeCode,
      activityPackCode: packCode,
      activityPackName: manual.pack.pack.activity_pack_name,
      category: manual.pack.pack.category,
      ruleCode: manual.ruleCode,
      operation: "manual_cost_line",
      driverCode: null,
      driverQuantity: null,
      modelVersion: pack.modelVersion,
      scenarioKey: input.scenarioKey,
      classification: manual.classification,
      sharedCostRef: sharedRef,
      roleCode: null,
      allocationPct: null,
      moduleHours: null,
      roleHours: null,
      rate: null,
      laborCostCents: null,
      manualCostCents: manual.operation.costCents,
      gapReason: null,
      overrideRationale: null,
      formulaTrace: `manual cost line: $${(manual.operation.costCents / 100).toFixed(2)} — ${manual.operation.rationale}`,
    });
  }

  // --- Scenario-added cost lines (ai_accelerated platform/compute costs) --
  const scenarioAddedLines = selectAgentCostLinesForScenario(input.scenarioKey, input.archetypeCode, pack.agentCosts);
  for (const added of scenarioAddedLines) {
    lineItems.push({
      archetypeCode: input.archetypeCode,
      activityPackCode: "SCENARIO-AI-ACCELERATION",
      activityPackName: "AI Acceleration — Platform & Compute Costs",
      category: "shared_nontechnical",
      ruleCode: added.agentCostCode,
      operation: "manual_cost_line",
      driverCode: null,
      driverQuantity: null,
      modelVersion: pack.modelVersion,
      scenarioKey: input.scenarioKey,
      classification: "shared_program",
      sharedCostRef: input.sharedCostRefs?.["SCENARIO-AI-ACCELERATION"] ?? null,
      roleCode: null,
      allocationPct: null,
      moduleHours: null,
      roleHours: null,
      rate: null,
      laborCostCents: null,
      manualCostCents: added.costCents,
      gapReason: null,
      overrideRationale: `AI-accelerated scenario approved cost assumption: ${added.costKey}`,
      formulaTrace: `AI-acceleration cost assumption '${added.costKey}': $${(added.costCents / 100).toFixed(2)} (${added.unit}) — ${added.rationale}`,
    });
  }

  const totals = aggregateTotals(lineItems);

  return {
    archetypeCode: input.archetypeCode,
    modelVersion: pack.modelVersion,
    scenarioKey: input.scenarioKey,
    tenantKey: input.tenantKey,
    lineItems,
    totals,
  };
}

export type { EffortOperationKind };
