// Origination ↔ Wave 2 charter extensions adapter.
//
// The seam that lets the Moves origination/charter path carry the three
// Wave 2 standalone modules — workflow decomposition (Slice 2.2), solution
// architecture options (Slice 2.3), and the control & eval matrix (Slice
// 2.5) — alongside the already-wired agentic suitability assessment (Slice
// 2.1).
//
// Each Wave 2 module is a pure, deterministic builder. Slice 2.1's
// `assessOriginationBrief` already produces the suitability result the
// other three modules depend on; this adapter takes that one result and
// composes the remaining three so the origination path makes a single
// call. Like 2.1's `suitabilityCharterFragment`, every fragment here is a
// stable, versioned plain-JSON object — additive charter JSONB fields,
// no DB migration, no surface change, no signature breakage.

import { buildSolutionArchitectureOptions } from '@/lib/programs/architecture/solution-architecture-options';
import { buildControlEvalMatrix } from '@/lib/programs/controls/control-eval-matrix';
import { decomposeWorkflow } from '@/lib/programs/decomposition/workflow-decomposition';
import { getSolutionArchetype } from '@/lib/programs/taxonomy/solution-archetype-taxonomy';
import type { OriginationSuitabilityResult } from '@/lib/programs/suitability/origination-suitability';

/**
 * The Wave 2 charter extension fragments derived from a single Slice 2.1
 * suitability result. Each is an additive charter JSONB field — downstream
 * readers version against each fragment's own `version`.
 */
export interface OriginationCharterExtensions {
  /** Slice 2.2 — implementable workflow decomposition. */
  workflow_decomposition: Record<string, unknown>;
  /** Slice 2.3 — scored solution-architecture option set. */
  solution_architecture: Record<string, unknown>;
  /** Slice 2.5 — control & eval matrix for the phase gate. */
  control_eval_matrix: Record<string, unknown>;
}

/** Serialize the Slice 2.2 workflow decomposition to a versioned fragment. */
function workflowDecompositionFragment(
  result: OriginationSuitabilityResult,
): Record<string, unknown> {
  const decomposition = decomposeWorkflow(
    result.proposedMove,
    result.assessment,
  );
  return {
    version: 1,
    derived_at: new Date().toISOString(),
    archetype: decomposition.archetype,
    archetype_name: decomposition.archetypeName,
    node_count: decomposition.nodes.length,
    approval_count: decomposition.approvalCount,
    exception_count: decomposition.exceptionCount,
    nodes: decomposition.nodes.map((n) => ({
      id: n.id,
      kind: n.kind,
      actor: n.actor,
      risk: n.risk,
      label: n.label,
      description: n.description,
      depends_on: n.dependsOn,
      controls: n.controls.map((c) => ({
        kind: c.kind,
        description: c.description,
        satisfiable: c.satisfiable,
        blocked_by: c.blockedBy,
      })),
    })),
    blocked_controls: decomposition.blockedControls.map((c) => ({
      kind: c.kind,
      description: c.description,
      blocked_by: c.blockedBy,
    })),
    notes: decomposition.notes,
  };
}

/** Serialize the Slice 2.3 architecture option set to a versioned fragment. */
function solutionArchitectureFragment(
  result: OriginationSuitabilityResult,
): Record<string, unknown> {
  const optionSet = buildSolutionArchitectureOptions({
    recommendedArchetype: result.assessment.recommendedArchetype,
    readiness: result.readiness,
    proposedMove: result.proposedMove,
  });
  return {
    version: 1,
    derived_at: new Date().toISOString(),
    archetype: optionSet.archetype,
    recommended_option_id: optionSet.recommendedOptionId,
    open_component_gaps: optionSet.openComponentGaps,
    reasons: optionSet.reasons,
    options: optionSet.options.map((o) => ({
      id: o.id,
      name: o.name,
      shape: o.shape,
      retrieval: o.retrieval,
      delivery_lean: o.deliveryLean,
      reference_score: o.referenceScore,
      production_shaped: o.productionShaped,
      summary: o.summary,
      trade_offs: o.tradeOffs,
      component_coverage: o.componentCoverage.map((c) => ({
        component: c.component,
        coverage: c.coverage,
        note: c.note,
      })),
    })),
  };
}

/** Serialize the Slice 2.5 control & eval matrix to a versioned fragment. */
function controlEvalMatrixFragment(
  result: OriginationSuitabilityResult,
): Record<string, unknown> {
  const archetype = getSolutionArchetype(
    result.assessment.recommendedArchetype,
  );
  const matrix = buildControlEvalMatrix(archetype);
  return {
    version: 1,
    derived_at: new Date().toISOString(),
    archetype_key: matrix.archetypeKey,
    archetype_name: matrix.archetypeName,
    mandatory_count: matrix.mandatoryCount,
    uncovered_gates: matrix.uncoveredGates,
    gate_coverage: matrix.gateCoverage.map((g) => ({
      gate: g.gate,
      control_count: g.controlCount,
      covered: g.covered,
    })),
    controls: matrix.controls.map((c) => ({
      id: c.id,
      name: c.name,
      risk: c.risk,
      mitigates: c.mitigates,
      rmf_function: c.rmfFunction,
      gate: c.gate,
      verification: c.verification,
      enforcement: c.enforcement,
      rationale: c.rationale,
    })),
    checklist: matrix.checklist.map((item) => ({
      test_id: item.testId,
      control_id: item.controlId,
      label: item.label,
      method: item.method,
      gate: item.gate,
      blocking: item.blocking,
    })),
  };
}

/**
 * The single call the Moves origination path makes after Slice 2.1 has
 * produced the suitability result: compose the remaining three Wave 2
 * builders into their charter fragments. Pure and deterministic — the same
 * suitability result always yields the same extensions.
 */
export function originationCharterExtensions(
  result: OriginationSuitabilityResult,
): OriginationCharterExtensions {
  return {
    workflow_decomposition: workflowDecompositionFragment(result),
    solution_architecture: solutionArchitectureFragment(result),
    control_eval_matrix: controlEvalMatrixFragment(result),
  };
}
