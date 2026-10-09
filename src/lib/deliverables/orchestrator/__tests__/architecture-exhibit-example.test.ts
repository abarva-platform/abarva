// Guards the architecture-exhibit payload example against the empty-lane footgun.
//
// The exhibit validator (exhibitHasStructuredData) keeps a conceptual/logical/
// physical_architecture or agent_orchestration exhibit only when its `lanes`
// carry at least one item. The prompt's payload example for those kinds once
// seeded `"items":[]` (empty), so the model copied an empty lane and the
// exhibit was discarded -> the P3 target_state_architecture deliverable blocked
// on "missing exhibits". The example must show a populated lane to match the
// validator it is teaching toward.

import { SYNTHESIS_SCHEMA_HINT } from "../prompt-builder";
import { exhibitRejectionReason } from "../section-generation";
import type { RenderableExhibit } from "../types";

describe("architecture exhibit payload example", () => {
  it("never seeds an empty lane (items:[]) in any payload example", () => {
    // Every lane-based example (roadmap and the four architecture kinds) must
    // show at least one lane item; an empty items array is exactly what the
    // validator rejects.
    expect(SYNTHESIS_SCHEMA_HINT).toContain("conceptual_architecture");
    expect(SYNTHESIS_SCHEMA_HINT).not.toContain('"items":[]');
  });

  const archKind = "logical_architecture" as const;

  function exhibit(
    data: RenderableExhibit["data"],
  ): RenderableExhibit {
    return {
      key: "logical_architecture",
      title: "Target logical architecture",
      kind: archKind,
      description:
        "Shows the certified-layer target. It means certification runs by domain. Sequencing of later domains stays open.",
      targetFormat: "docx",
      data,
    } as RenderableExhibit;
  }

  it("keeps an architecture exhibit whose lane has an item", () => {
    const kept = exhibit({
      kind: archKind,
      lanes: [{ label: "Certified layer", items: ["Semantic layer"] }],
    } as RenderableExhibit["data"]);
    expect(exhibitRejectionReason(kept)).toBeNull();
  });

  it("rejects an architecture exhibit whose lanes are empty", () => {
    const empty = exhibit({
      kind: archKind,
      lanes: [{ label: "Certified layer", items: [] }],
    } as RenderableExhibit["data"]);
    expect(exhibitRejectionReason(empty)).not.toBeNull();
  });
});
