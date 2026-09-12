import {
  contractTabNarrative,
  reviewStatusInWords,
} from "../WorkspaceExecutiveShell";
import type { SourceContract360Row } from "@/lib/source/data-model/types";
import type { SourceWorkspaceVM } from "../buildViewModel";

/**
 * The governed tab record's `action_prompt` is authored as an instruction to
 * whatever renders the tab:
 *
 *   "Show declared relationships and the boundary; no inferred dependency graph."
 *   "Render evidence lanes only when rows exist; otherwise show the specific missing input."
 *   "Keep contract value, actual spend, invoiced, paid, and finance-confirmed
 *    outcomes in separate ledgers."
 *
 * It was standing in for a missing-evidence summary, so on every tab with
 * nothing missing those directives reached an executive under the label
 * "Decision consequence". A blocker is a missing input; where none is recorded
 * there is no blocker.
 */

const contract = {
  contract_id: "C1",
  contract_name: "Test Agreement",
  vendor_name: "Test Vendor",
} as unknown as SourceContract360Row;

const vmWithTab = (row: Record<string, unknown>) =>
  ({
    detail: { contractTabIntelligence: [row] },
    contractEducation: {
      facetRequirements: {
        Relationship: { state: "required", reason: "" },
      },
    },
  }) as unknown as SourceWorkspaceVM;

const narrativeFor = (row: Record<string, unknown>) =>
  contractTabNarrative(
    "Relationship",
    vmWithTab(row),
    contract,
    null as never,
    [],
    undefined,
  );

describe("governed tab narrative", () => {
  it("does not present an authoring directive as a decision consequence", () => {
    const narrative = narrativeFor({
      tab_key: "relationship",
      headline: "Vendor links to 4 scoped workloads.",
      allowed_executive_statement: "The governed relationship is loaded.",
      supporting_evidence_summary: "4 scope relationships",
      missing_evidence_summary: null,
      action_prompt:
        "Show declared relationships and the boundary; no inferred dependency graph.",
      review_status: "system_generated_from_reviewed_sources",
    });

    expect(narrative.blocker).toBeNull();
    expect(narrative.headline).toBe("Vendor links to 4 scoped workloads.");
  });

  it("still carries a real missing input as the consequence", () => {
    const narrative = narrativeFor({
      tab_key: "relationship",
      headline: "Relationship is limited to vendor and contract header.",
      allowed_executive_statement: "Do not infer dependency coverage.",
      supporting_evidence_summary: "0 scope relationships",
      missing_evidence_summary:
        "Load declared relationship rows before drawing dependency maps or owner paths.",
      action_prompt:
        "Show declared relationships and the boundary; no inferred dependency graph.",
      review_status: "draft_gap",
    });

    expect(narrative.blocker).toBe(
      "Load declared relationship rows before drawing dependency maps or owner paths.",
    );
  });

  it("states the review status in words, not as an identifier", () => {
    const narrative = narrativeFor({
      tab_key: "relationship",
      headline: "Vendor links to 4 scoped workloads.",
      allowed_executive_statement: "The governed relationship is loaded.",
      supporting_evidence_summary: "4 scope relationships",
      missing_evidence_summary: null,
      action_prompt: "Show declared relationships and the boundary.",
      review_status: "system_generated_from_reviewed_sources",
    });

    expect(narrative.provenance).toBe(
      "Relationship intelligence · generated from reviewed rows",
    );
    expect(narrative.provenance).not.toContain("_");
  });
});

describe("reviewStatusInWords", () => {
  it("translates every status the projector can write", () => {
    expect(reviewStatusInWords("system_generated_from_reviewed_sources")).toBe(
      "generated from reviewed rows",
    );
    expect(reviewStatusInWords("draft_gap")).toBe(
      "draft, evidence incomplete",
    );
    expect(reviewStatusInWords("reviewed")).toBe("reviewed");
  });

  it("strips an unrecognised identifier rather than leaking it", () => {
    // A status added upstream must not reach the surface as snake_case.
    expect(reviewStatusInWords("some_new_machine_state")).toBe(
      "review status not recorded",
    );
    expect(reviewStatusInWords("some_new_machine_state")).not.toContain("_");
  });

  it("refuses rather than inventing a status", () => {
    expect(reviewStatusInWords(null)).toBe("review status not recorded");
    expect(reviewStatusInWords("   ")).toBe("review status not recorded");
  });
});
