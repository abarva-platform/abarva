import fs from "node:fs";
import path from "node:path";

import {
  deriveHomeRelationshipEdges,
  isBusinessReadableRelationshipLabel,
} from "../derive-relationship-edges";
import type { HomeKnowledgeDesignContractPack } from "../home-knowledge-design-contract";

describe("deriveHomeRelationshipEdges", () => {
  it("parses semicolon-delimited integration fields into edges", () => {
    const edges = deriveHomeRelationshipEdges({
      apps: {
        columns: [],
        rows: [
          {
            business_name: "Epic Hyperspace",
            integrations: "Epic Bridges; Clarity; Caboodle",
          },
        ],
      },
    });
    expect(edges).toEqual([
      {
        from: "Epic Hyperspace",
        fromType: "application",
        relationship: "integrates with",
        to: "Epic Bridges",
        sourceDimension: "apps",
        sourceField: "integrations",
      },
      {
        from: "Epic Hyperspace",
        fromType: "application",
        relationship: "integrates with",
        to: "Clarity",
        sourceDimension: "apps",
        sourceField: "integrations",
      },
      {
        from: "Epic Hyperspace",
        fromType: "application",
        relationship: "integrates with",
        to: "Caboodle",
        sourceDimension: "apps",
        sourceField: "integrations",
      },
    ]);
  });

  it("excludes rows whose field is empty or the 'Needs evidence' placeholder", () => {
    const edges = deriveHomeRelationshipEdges({
      apps: {
        columns: [],
        rows: [
          { business_name: "System A", integrations: "Needs evidence" },
          { business_name: "System B", integrations: "" },
          { business_name: "System C" },
        ],
      },
    });
    expect(edges).toEqual([]);
  });

  it("excludes non-business placeholders and pack ids from graph labels", () => {
    expect(isBusinessReadableRelationshipLabel("Passenger service system")).toBe(
      true,
    );
    expect(isBusinessReadableRelationshipLabel("not_loaded")).toBe(false);
    expect(
      isBusinessReadableRelationshipLabel("owner_to_confirm_in_workshops"),
    ).toBe(false);
    expect(isBusinessReadableRelationshipLabel("APP-0418")).toBe(false);
    expect(
      isBusinessReadableRelationshipLabel("skyharbor-air-v6-v7-upgrade"),
    ).toBe(false);

    const edges = deriveHomeRelationshipEdges({
      rel: {
        columns: [],
        rows: [
          {
            from_object_name: "Commercial",
            relationship_type: "depends_on",
            to_object_name: "not_loaded",
          },
          {
            from_object_name: "Ground Ops",
            relationship_type: "uses",
            to_object_name: "Passenger service system",
          },
        ],
      },
      apps: {
        columns: [],
        rows: [
          {
            business_name: "skyharbor-air-v6-v7-upgrade",
            integrations: "SAP Finance",
          },
          {
            business_name: "Cargo operations portal",
            integrations: "APP-0418; Crew scheduling platform",
          },
        ],
      },
    });
    expect(edges).toEqual([
      expect.objectContaining({
        from: "Ground Ops",
        to: "Passenger service system",
      }),
      expect.objectContaining({
        from: "Cargo operations portal",
        to: "Crew scheduling platform",
      }),
    ]);
  });

  it("drops a self-referential edge", () => {
    const edges = deriveHomeRelationshipEdges({
      apps: {
        columns: [],
        rows: [
          { business_name: "System A", integrations: "System A; System B" },
        ],
      },
    });
    expect(edges).toHaveLength(1);
    expect(edges[0].to).toBe("System B");
  });

  it("deduplicates identical edges across dimensions sharing a schema", () => {
    const row = {
      business_name: "Epic Hyperspace",
      integrations: "Clarity",
    };
    const edges = deriveHomeRelationshipEdges({
      apps: { columns: [], rows: [row] },
      infra: { columns: [], rows: [row] },
    });
    expect(edges).toHaveLength(1);
  });

  it("parses explicit relationship rows from the rel dimension", () => {
    const edges = deriveHomeRelationshipEdges({
      rel: {
        columns: [],
        rows: [
          {
            from_object_name: "Finance",
            relationship_type: "uses",
            to_object_name: "SAP S/4HANA",
          },
        ],
      },
    });
    expect(edges).toEqual([
      {
        from: "Finance",
        fromType: "entity",
        relationship: "uses",
        to: "SAP S/4HANA",
        sourceDimension: "rel",
        sourceField: "from_object_name/to_object_name",
      },
    ]);
  });

  it("parses Meridian-style affected systems relationship rows", () => {
    const edges = deriveHomeRelationshipEdges({
      rel: {
        columns: [],
        rows: [
          {
            business_name:
              "Unified clinical + claims lakehouse: No certified medallion architecture",
            use_case: "Unified clinical + claims lakehouse",
            affected_systems: "Epic Clarity; Epic Caboodle; Databricks on AWS",
          },
        ],
      },
    });
    expect(edges).toEqual([
      expect.objectContaining({
        from: "Unified clinical + claims lakehouse: No certified medallion architecture",
        relationship: "depends on",
        to: "Epic Clarity",
        sourceDimension: "rel",
        sourceField: "affected_systems",
      }),
      expect.objectContaining({ to: "Epic Caboodle" }),
      expect.objectContaining({ to: "Databricks on AWS" }),
    ]);
  });

  it("returns [] for an empty/missing data map", () => {
    expect(deriveHomeRelationshipEdges({})).toEqual([]);
  });

  it("produces real, non-trivial edges from the actual Meridian dataset", () => {
    const pack = JSON.parse(
      fs.readFileSync(
        path.resolve(
          "datasets/tenant-inputs/meridian-health/approved-content/home/design-contract-pack.json",
        ),
        "utf8",
      ),
    ) as HomeKnowledgeDesignContractPack;
    const edges = deriveHomeRelationshipEdges(pack.design_slots.DATA);
    expect(edges.length).toBeGreaterThan(20);
    expect(
      edges.some(
        (edge) => edge.from === "Epic Hyperspace" && edge.to === "Clarity",
      ),
    ).toBe(true);
    // Every edge must trace back to a real evidenced value, never a
    // placeholder string.
    expect(
      edges.every((edge) => edge.to.toLowerCase() !== "needs evidence"),
    ).toBe(true);
  });
});
