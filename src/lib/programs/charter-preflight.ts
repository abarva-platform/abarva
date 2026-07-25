import "server-only";

import { CHARTER_CONTRACT } from "@/lib/deliverables/shared/artifact-contracts";
import { getModuleState } from "@/lib/programs/queries";
import type { TenancyCtx } from "@/lib/programs/types.db";

// Charter preflight — a structured answer to "can this Charter be generated
// credibly from what P0 actually captured?", computed BEFORE calling Claude.
// Scoped intentionally: this checks P0's structured capture only (the P0
// phase-capture bridge's values — see p0-phase-capture.ts's
// buildP0PhaseCaptureValues), not enterprise context / evidence / sponsor
// input directly, since those aren't yet exposed through a single typed
// interface the way P0 capture is. Extending source coverage beyond P0
// capture is real follow-up work (tracked in Known Gaps of this feature's
// release record), not silently assumed complete here.
//
// This is advisory today, not a hard generation blocker — see the release
// record for why: blocking generation needs a UI surface to show operators
// what's missing, which doesn't exist yet. Wiring this into
// assertPhaseReadyForGeneration (src/lib/programs/assert-phase-ready.ts) as
// an actual block is the next step once that UI exists.

export type CharterSectionCoverageStatus = "complete" | "partial" | "missing";

export interface CharterSectionCoverage {
  status: CharterSectionCoverageStatus;
  /** Which P0 capture keys backed this section, e.g. "p0_capture:problem_statement". */
  sourceRefs: string[];
}

export interface CharterPreflightResult {
  /** True only when no Charter section is fully unsupported by P0 capture. */
  ready: boolean;
  /** Charter section keys with status "missing" — nothing in P0 capture supports them at all. */
  missingRequiredInputs: string[];
  sourceCoverageBySection: Record<string, CharterSectionCoverage>;
}

/**
 * Maps each Charter section (src/lib/deliverables/shared/artifact-contracts.ts)
 * to the P0 phase-capture section keys (phase-capture-contract.ts's
 * P0_CAPTURE_SECTIONS) that can responsibly ground it. A section backed by
 * zero keys with content is "missing" — the model should not write it from
 * inference; it should use one of the three placeholder labels instead.
 */
const CHARTER_SECTION_TO_P0_CAPTURE_KEYS: Readonly<Record<string, string[]>> = {
  charter_decision: ["problem_statement", "initial_value_hypothesis"],
  opportunity_context: ["business_trigger", "problem_statement"],
  intended_outcomes: ["outcomes_success"],
  scope: ["affected_function_process", "scope_out"],
  success_measures: ["outcomes_success"],
  sponsorship_governance: ["stakeholder_owner_view"],
  known_constraints_dependencies: ["missing_evidence_open_questions"],
  discovery_preparation: ["discovery_questions", "known_evidence"],
  authorization_next_steps: ["recommendation_to_advance"],
};

function hasContent(value: string | undefined): boolean {
  return typeof value === "string" && value.trim().length > 0;
}

/**
 * Pure function — takes the P0 capture values record (the same shape
 * `buildP0PhaseCaptureValues` in p0-phase-capture.ts produces) and reports,
 * per Charter section, whether P0 gave it real grounding.
 */
export function computeCharterPreflight(
  p0CaptureValues: Record<string, string>,
): CharterPreflightResult {
  const sourceCoverageBySection: Record<string, CharterSectionCoverage> = {};
  const missingRequiredInputs: string[] = [];

  for (const section of CHARTER_CONTRACT.sections) {
    const keys = CHARTER_SECTION_TO_P0_CAPTURE_KEYS[section.key] ?? [];
    const present = keys.filter((key) => hasContent(p0CaptureValues[key]));
    const status: CharterSectionCoverageStatus =
      keys.length === 0 || present.length === 0
        ? "missing"
        : present.length < keys.length
          ? "partial"
          : "complete";

    sourceCoverageBySection[section.key] = {
      status,
      sourceRefs: present.map((key) => `p0_capture:${key}`),
    };
    if (status === "missing") missingRequiredInputs.push(section.key);
  }

  return {
    ready: missingRequiredInputs.length === 0,
    missingRequiredInputs,
    sourceCoverageBySection,
  };
}

/**
 * Loads a Move's saved P0 phase capture (one program_modules row per section,
 * state_jsonb = { capture_section_key, value, … }) — the same read pattern
 * `loadPhaseCapture` in moves-generate-deps.ts uses for other phases.
 */
export async function loadP0CaptureValues(
  ctx: TenancyCtx,
  moveId: string,
): Promise<Record<string, string>> {
  const modules = await getModuleState(ctx, moveId).catch(() => []);
  const values: Record<string, string> = {};
  for (const mod of modules) {
    if (mod.phaseNumber !== 0) continue;
    const state = (mod.state ?? {}) as Record<string, unknown>;
    const value = typeof state.value === "string" ? state.value.trim() : "";
    if (!value) continue;
    const key =
      typeof state.capture_section_key === "string"
        ? state.capture_section_key
        : mod.moduleKey;
    values[key] = value;
  }
  return values;
}

/** Convenience: load P0 capture for a Move and compute its Charter preflight in one call. */
export async function computeCharterPreflightForMove(
  ctx: TenancyCtx,
  moveId: string,
): Promise<CharterPreflightResult> {
  const values = await loadP0CaptureValues(ctx, moveId);
  return computeCharterPreflight(values);
}
