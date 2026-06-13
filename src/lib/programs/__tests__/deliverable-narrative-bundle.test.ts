import { describe, it, expect } from "@jest/globals";
import { buildEvidenceBundle } from "@/lib/programs/deliverable-narrative";
import { findForbiddenTags } from "@/lib/programs/deliverables/source-labels";
import type { GeneratedDeliverable } from "@/lib/programs/deliverable-refinement";

// The narrative engine hands Claude the evidence bundle and instructs it to keep
// the `[source: ...]` inline — so the bundle MUST carry human-readable source
// names, never raw internal ids (the P0 leak the browser eval found in the
// SkyHarbor charter: `tower_cmdb_cis`, `tower_workforce`, `tower_dora_metrics`).

function base(claims: GeneratedDeliverable["sections"][number]["claims"]): GeneratedDeliverable {
  return {
    key: "program_charter",
    label: "Program Charter",
    archetypeId: "AI_OPERATIONS_DECISION_SUPPORT",
    moveId: "m1",
    version: 1,
    sections: [{ heading: "Current state", claims }],
    envelope: {
      tenantResolved: "skyharbor",
      archetypeResolved: "AI_OPERATIONS_DECISION_SUPPORT",
      evidenceUsed: [],
      missingEvidence: [],
      citations: [],
      unsupportedClaims: [],
      confidence: "low",
      specific: true,
    },
    refinementLog: [],
  };
}

describe("buildEvidenceBundle — no internal id ever reaches Claude/body", () => {
  it("humanizes a cited tower_* table into its source name", () => {
    const { facts } = buildEvidenceBundle(
      base([
        { text: "4 application CIs are in scope.", citation: "tower_cmdb_cis", missingEvidence: null },
        { text: "Engineering org evidence committed.", citation: "tower_workforce", missingEvidence: null },
      ]),
    );
    const joined = facts.join("\n");
    expect(findForbiddenTags(joined)).toEqual([]);
    expect(joined).not.toMatch(/tower_/);
    expect(joined).toMatch(/Application|Systems/);
    expect(joined).toMatch(/Organization|Workforce/i);
  });

  it("humanizes a missing-evidence family in the gap list", () => {
    const { gaps } = buildEvidenceBundle(
      base([
        { text: "IT systems landscape not yet provided.", citation: null, missingEvidence: "tower_cmdb_cis" },
      ]),
    );
    const joined = gaps.join("\n");
    expect(findForbiddenTags(joined)).toEqual([]);
    expect(joined).not.toMatch(/tower_/);
  });
});
