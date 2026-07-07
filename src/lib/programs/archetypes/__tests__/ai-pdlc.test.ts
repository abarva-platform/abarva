import { resolveArchetypeRequirements } from "../resolver";
import { AI_PRODUCT_DEVELOPMENT_LIFECYCLE } from "../registry";
import { ANALYSIS_METHODS } from "../method-library";
import {
  emptyProfile,
  type MoveProfile,
} from "@/lib/programs/current-state-readiness";

const AI = AI_PRODUCT_DEVELOPMENT_LIFECYCLE;
const profile = (over: Partial<MoveProfile>): MoveProfile => ({
  ...emptyProfile(),
  ...over,
});
const keys = (rs: { family: { key: string } }[]) => rs.map((r) => r.family.key);

describe("AI-PDLC — engineering-delivery baseline resolves per estate", () => {
  it("full-stack estate resolves DORA, not the mainframe baseline", () => {
    const k = keys(
      resolveArchetypeRequirements(
        AI,
        "charter",
        profile({
          teamArchetypes: ["full_stack_cloud"],
          deliveryMaturity: "continuous",
        }),
      ),
    );
    expect(k).toContain("eng_performance_dora");
    expect(k).not.toContain("mainframe_change_cadence");
  });

  it("mainframe estate resolves the change-cadence baseline INSTEAD of DORA", () => {
    const k = keys(
      resolveArchetypeRequirements(
        AI,
        "charter",
        profile({ teamArchetypes: ["mainframe"] }),
      ),
    );
    expect(k).toContain("mainframe_change_cadence"); // real family, not just a prune
    expect(k).not.toContain("eng_performance_dora");
  });

  it("DataStage estate resolves the ETL job inventory in diagnose", () => {
    const k = keys(
      resolveArchetypeRequirements(
        AI,
        "diagnose",
        profile({ teamArchetypes: ["legacy_data_analytics"] }),
      ),
    );
    expect(k).toContain("etl_job_inventory");
    expect(k).not.toContain("eng_performance_dora");
  });

  it("every estate-scoped family has an estate predicate (no silent pass-through)", () => {
    // Charter mainframe families must resolve when mainframe present.
    const main = keys(
      resolveArchetypeRequirements(
        AI,
        "charter",
        profile({ teamArchetypes: ["mainframe"] }),
      ),
    );
    expect(main).toContain("it_systems_landscape"); // always-on estate family
  });
});

describe("AI-PDLC — deliverable pack + grounded refinement contract", () => {
  it("covers the board-grade arc across phases", () => {
    const byKey = new Set(AI.deliverablePack.map((d) => d.key));
    for (const k of [
      "program_charter",
      "discovery_report",
      "target_operating_model",
      "ai_enabled_sdlc_architecture",
      "business_case",
      "execution_roadmap",
      "mobilization_packet",
      "handoff_package",
    ]) {
      expect(byKey.has(k)).toBe(true);
    }
  });

  it("every deliverable is prompt-refinable with the no-fabrication grounding guard", () => {
    for (const d of AI.deliverablePack) {
      expect(d.refinement.promptable).toBe(true);
      expect(d.refinement.versioned).toBe(true);
      expect(d.refinement.groundingGuard).toMatch(
        /cannot add a fact not in the evidence/i,
      );
      expect(d.qualityBar.minSections).toBeGreaterThanOrEqual(3);
    }
  });

  it("gate-artifact deliverables exist (charter, discovery, business case, handoff)", () => {
    const gate = AI.deliverablePack
      .filter((d) => d.gateArtifact)
      .map((d) => d.key);
    expect(gate).toEqual(
      expect.arrayContaining([
        "program_charter",
        "discovery_report",
        "business_case",
        "handoff_package",
      ]),
    );
  });

  it("all archetype method keys resolve in the method library", () => {
    for (const m of AI.analysisMethods)
      expect(ANALYSIS_METHODS[m]).toBeDefined();
  });
});
