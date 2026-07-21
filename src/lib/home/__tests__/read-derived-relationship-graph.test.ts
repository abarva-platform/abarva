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

  it("returns [] for a tenant with no derived graph file", () => {
    expect(
      readDerivedRelationshipGraphEdges("skyharbor-air", { rootDir }),
    ).toEqual([]);
    expect(
      readDerivedRelationshipGraphEdges("first-capital", { rootDir }),
    ).toEqual([]);
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
