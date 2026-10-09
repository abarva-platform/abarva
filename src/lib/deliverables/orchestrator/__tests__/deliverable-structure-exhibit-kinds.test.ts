// Guards against a deliverable structure declaring an exhibit `kind` the
// validator cannot keep.
//
// The exhibit `kind` is sent to the authoring model ("- <title> [<kind>]: ...")
// and the model produces a payload stamped with that kind. The validator
// (exhibitHasStructuredData, surfaced by exhibitRejectionReason) keeps an
// exhibit only for a known payload kind with real content; any other kind hits
// the default branch and is discarded, so the deliverable blocks on
// "missing exhibits". root_cause_tree once declared kind "diagram" — not a
// handled payload kind — so the Root Cause Worksheet reliably failed to build.

import { DELIVERABLE_STRUCTURES } from "../briefs/deliverable-structures";
import { exhibitRejectionReason } from "../section-generation";
import type { RenderableExhibit } from "../types";

// The payload kinds exhibitHasStructuredData accepts. Test A below pins this
// set to the validator so it cannot silently drift.
const HANDLED_KINDS = [
  "flow",
  "matrix",
  "heatmap",
  "comparison",
  "timeline",
  "roadmap",
  "value_tree",
  "conceptual_architecture",
  "logical_architecture",
  "physical_architecture",
  "agent_orchestration",
] as const;

function minimalData(kind: string): RenderableExhibit["data"] {
  switch (kind) {
    case "flow":
      return {
        kind: "flow",
        nodes: [{ id: "a", label: "A" }, { id: "b", label: "B" }],
        edges: [{ from: "a", to: "b" }],
      } as RenderableExhibit["data"];
    case "matrix":
    case "heatmap":
    case "comparison":
      return {
        kind,
        cells: [
          { x: "1", y: "1", label: "a" },
          { x: "2", y: "1", label: "b" },
        ],
      } as RenderableExhibit["data"];
    case "timeline":
    case "roadmap":
      return {
        kind,
        lanes: [{ label: "L", items: [{ label: "i", start: "a", end: "b" }] }],
      } as RenderableExhibit["data"];
    case "value_tree":
      return {
        kind: "value_tree",
        root: { label: "R" },
        branches: [{ label: "B" }],
      } as RenderableExhibit["data"];
    case "conceptual_architecture":
    case "logical_architecture":
    case "physical_architecture":
    case "agent_orchestration":
      return {
        kind,
        lanes: [{ label: "L", items: ["component"] }],
      } as RenderableExhibit["data"];
    default:
      throw new Error("no minimal payload for kind: " + kind);
  }
}

function fullExhibit(kind: string): RenderableExhibit {
  return {
    key: "k",
    title: "T",
    kind,
    description:
      "Shows the thing. It means the decision can proceed. One item stays open.",
    targetFormat: "docx",
    data: minimalData(kind),
  } as RenderableExhibit;
}

describe("deliverable structure exhibit kinds", () => {
  it("HANDLED_KINDS stays in sync with the validator (each is keepable)", () => {
    for (const kind of HANDLED_KINDS) {
      expect(exhibitRejectionReason(fullExhibit(kind))).toBeNull();
    }
  });

  it("every declared exhibit kind is one the validator handles", () => {
    const offenders: Array<{ deliverable: string; key: string; kind: string }> = [];
    for (const structure of DELIVERABLE_STRUCTURES) {
      for (const exhibit of structure.expectedExhibits ?? []) {
        if (!(HANDLED_KINDS as readonly string[]).includes(exhibit.kind)) {
          offenders.push({
            deliverable: structure.deliverableType,
            key: exhibit.key,
            kind: exhibit.kind,
          });
        }
      }
    }
    expect(offenders).toEqual([]);
  });
});
