import { readDerivedRelationshipGraphEdges } from "../read-derived-relationship-graph";

describe("readDerivedRelationshipGraphEdges", () => {
  const rootDir = process.cwd();

  it("loads the real, richer derived graph for meridian-health", () => {
    const edges = readDerivedRelationshipGraphEdges("meridian-health", {
      rootDir,
    });
    // Confirmed 2,670 total edges, 28 self-loops -> 2,642 real cross-node
    // edges expected.
    expect(edges.length).toBeGreaterThan(2000);
    expect(edges.every((edge) => edge.from !== edge.to)).toBe(true);
    expect(
      edges.some(
        (edge) => edge.sourceDimension === "derived_relationship_graph",
      ),
    ).toBe(true);
  });

  it("loads derived graph files for every generated Home tenant", () => {
    for (const tenantKey of [
      "skyharbor-air",
      "first-capital",
      "lakeshore-holdings",
      "apex-retail",
    ]) {
      const edges = readDerivedRelationshipGraphEdges(tenantKey, { rootDir });
      expect(edges.length).toBeGreaterThan(100);
      expect(edges.every((edge) => edge.from !== edge.to)).toBe(true);
    }
  });

  it("uses display names from the generated graph when present", () => {
    const edges = readDerivedRelationshipGraphEdges("skyharbor-air", {
      rootDir,
    });
    expect(
      edges.some(
        (edge) => edge.from === "Catering" && edge.to === "Catering Hub 8",
      ),
    ).toBe(true);
    expect(
      edges.some((edge) => edge.from === "7dda43b02448c829"),
    ).toBe(false);
  });

  it("returns [] for null/undefined/empty tenant key", () => {
    expect(readDerivedRelationshipGraphEdges(null, { rootDir })).toEqual([]);
    expect(readDerivedRelationshipGraphEdges(undefined, { rootDir })).toEqual(
      [],
    );
    expect(readDerivedRelationshipGraphEdges("", { rootDir })).toEqual([]);
  });

  it("never throws for an unreadable/missing root", () => {
    expect(() =>
      readDerivedRelationshipGraphEdges("meridian-health", {
        rootDir: "/nonexistent/path",
      }),
    ).not.toThrow();
    expect(
      readDerivedRelationshipGraphEdges("meridian-health", {
        rootDir: "/nonexistent/path",
      }),
    ).toEqual([]);
  });
});
