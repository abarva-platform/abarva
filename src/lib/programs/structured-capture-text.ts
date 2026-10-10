import {
  rootCauseCaptureText,
  rootCauseGateText,
} from "@/lib/programs/root-cause-register";
import {
  architectureChoiceGateText,
  architectureChoiceText,
  parseArchitectureChoice,
} from "@/lib/programs/architecture-choice";
import {
  operatingAdoptionGateText,
  operatingAdoptionText,
  parseOperatingAdoption,
} from "@/lib/programs/operating-adoption";
import {
  designTraceabilityGateText,
  designTraceabilityText,
  parseDesignTraceability,
} from "@/lib/programs/design-traceability";

/**
 * How a capture answer reads as text, by section key. Step pages store some
 * answers as structured registers (P2 root causes, P3 design traceability,
 * the P3 architecture choice);
 * every text reader — the build's decision context, the next phase's carried
 * capture, cited evidence — reads them through `captureValueText`, and the
 * gate's phrase checks through `captureValueGateText`. Any other value, and
 * any value that is not a register, is returned exactly as written.
 */

export function captureValueText(key: string, raw: string): string {
  if (key === "gaps_root_causes") return rootCauseCaptureText(raw);
  if (key === "design_traceability") {
    const value = parseDesignTraceability(raw);
    return value ? designTraceabilityText(value) : raw;
  }
  if (key === "architecture_choice") {
    const value = parseArchitectureChoice(raw);
    return value ? architectureChoiceText(value) : raw;
  }
  if (key === "operating_adoption") {
    const value = parseOperatingAdoption(raw);
    return value ? operatingAdoptionText(value) : raw;
  }
  return raw;
}

/** Only the team's own words, never a register's labels, for phrase checks. */
export function captureValueGateText(key: string, raw: string): string {
  if (key === "gaps_root_causes") return rootCauseGateText(raw);
  if (key === "design_traceability") {
    const value = parseDesignTraceability(raw);
    return value ? designTraceabilityGateText(value) : raw;
  }
  if (key === "architecture_choice") {
    const value = parseArchitectureChoice(raw);
    return value ? architectureChoiceGateText(value) : raw;
  }
  if (key === "operating_adoption") {
    const value = parseOperatingAdoption(raw);
    return value ? operatingAdoptionGateText(value) : raw;
  }
  return raw;
}
