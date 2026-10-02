// The reviewed estimate, as a citable evidence statement.
//
// Saved phase inputs become governed evidence so a deliverable can cite them.
// For most inputs the saved text IS the statement. The estimate is different:
// what is saved is the reviewer's inputs (hours, rates, sensitivities), and
// the figures a roadmap or business case must present — adjusted hours, costs,
// scenario totals — are calculated from them. Those calculated figures were
// in no evidence statement, so the numeric-lineage check could not trace a
// correctly reproduced total to anything and blocked it as unsupported.
//
// This returns the same deterministic rendering the writer is given, so every
// figure the writer is told is authoritative is also a figure the lineage
// check can match. The check is unchanged: a figure that is not in this
// statement, or in other governed evidence, is still unsupported.

import { formatEstimateModelForPrompt } from "@/lib/programs/estimate-model";

/** The phase-capture section that holds the reviewed estimate model. */
export const ESTIMATE_CAPTURE_SECTION_KEY = "estimates_capacity";

/**
 * The evidence statement for a saved estimate, or null when this capture is
 * not a reviewed estimate (another section, unreadable, or not yet reviewed
 * and confirmed — an unreviewed estimate is not authoritative and gets no
 * calculated figures).
 */
export function estimateCaptureStatement(
  sectionKey: string,
  value: string,
): string | null {
  if (sectionKey !== ESTIMATE_CAPTURE_SECTION_KEY) return null;
  return formatEstimateModelForPrompt(value);
}
