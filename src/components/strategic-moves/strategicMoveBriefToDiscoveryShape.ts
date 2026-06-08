// strategicMoveBriefToDiscoveryShape · discovery re-home (live Originate surface)
//
// Pure mapper: project the live Strategic Moves originate scaffold (the 7-field
// `brief.fields` map in StrategicMoveOriginateClient) into a DiscoveryShape so
// the DiscoveryCapturePanel can render the captured frame on /strategic-moves/new.
//
// Mirrors components/programs/discovery/brief-to-shape.ts (which mapped the old
// ProgramBriefDraft) — same faithful subset: only the fields with a clean
// discovery-dimension home are projected; landscape/context/upload fields are
// populated later by the extraction + pre-fill paths. Pure — no state, no I/O.

import {
  captureField,
  emptyDiscoveryShape,
  type DiscoveryShape,
} from "@/lib/programs/discovery/discovery-intake";

/** The live originate scaffold field ids → discovery dimensions. */
export function strategicMoveBriefToDiscoveryShape(
  fields: Record<string, string>,
): DiscoveryShape {
  const s = emptyDiscoveryShape();
  const problem = fields["problem-statement"]?.trim();
  if (problem) {
    s.problem = captureField(s.problem, problem, "chat");
  }
  const value = fields["value-hypothesis"]?.trim();
  if (value) {
    s.valueHypothesis = captureField(s.valueHypothesis, value, "chat", {
      confidence: "medium",
    });
  }
  const archetype = fields["archetype"]?.trim();
  if (archetype) {
    s.archetype = captureField(s.archetype, archetype, "chat");
  }
  const sponsor = fields["sponsor-candidate"]?.trim();
  if (sponsor) {
    s.sponsor = captureField(s.sponsor, sponsor, "chat");
  }
  return s;
}
