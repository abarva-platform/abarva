import fs from "node:fs";
import path from "node:path";
import type {
  HomeReviewBundle,
  Signal,
  TechRecordType,
} from "@/lib/home/preview/types";
import {
  chapterContext,
  flowRecords,
  leadershipContext,
  operatingContext,
  selectedTestimony,
} from "../context-coverage";

const reviewed = {
  kind: "reviewed_snapshot" as const,
  canonicalSnapshotHash: "reviewed-version",
};
const unverified = {
  kind: "ecl_serving_projection" as const,
  canonicalSnapshotHash: "different-version",
};
function bundle(): HomeReviewBundle {
  return {
    ...JSON.parse(
      fs.readFileSync(
        path.join(
          process.cwd(),
          "src/lib/home/preview/golden-snapshots/meridian-health.json",
        ),
        "utf8",
      ),
    ),
    declaredSyntheticDemo: true,
  };
}
function family(
  record: HomeReviewBundle,
  objectType: TechRecordType["objectType"],
  rows: TechRecordType["rows"],
): TechRecordType {
  const result = {
    objectType,
    label: objectType,
    columns: Object.keys(rows[0] ?? {}),
    rows,
    primaryDimension: Object.keys(rows[0] ?? {})[0] ?? "name",
    dimensionCounts: [],
    rowSourceRefs: rows.map((_, i) => [`row-${i}`]),
  };
  record.technologyEstate!.recordTypes = record
    .technologyEstate!.recordTypes.filter(
      (item) => item.objectType !== objectType,
    )
    .concat(result);
  return result;
}

describe("canvas context coverage", () => {
  it("surfaces subject-aligned context for every chapter, without broadening provenance into a subject", () => {
    const record = bundle();
    for (const chapter of record.chapters)
      expect(
        chapterContext(record, reviewed, chapter.chapterId).length,
      ).toBeGreaterThan(0);
    expect(
      chapterContext(record, reviewed, "how_we_operate").some((item) =>
        item.domains.includes("relationship_source_row"),
      ),
    ).toBe(false);
  });
  it("never presents earlier compiled signals as unverified current facts", () => {
    const record = bundle();
    for (const chapter of record.chapters)
      expect(chapterContext(record, unverified, chapter.chapterId)).toEqual([]);
  });
  it("retains every supplied theme and selected quote verbatim with a synthetic basis", () => {
    const record = bundle();
    const context = leadershipContext(record, reviewed);
    expect(context.themes).toHaveLength(29);
    expect(context.excerpts).toHaveLength(17);
    for (const excerpt of context.excerpts) {
      const original = record.thesis.signalPacket.signals.find(
        (item) => item.id === excerpt.evidenceIds[0],
      )!;
      expect(original.statement).toContain(excerpt.text);
      expect(excerpt.basis).toContain("not client testimony");
    }
  });
  it("does not turn a paraphrase or a non-testimony signal into a quotation", () => {
    const template = bundle().thesis.signalPacket.signals.find(
      (item) => item.kind === "testimony",
    )!;
    expect(
      selectedTestimony(
        { ...template, statement: "The CEO appeared concerned about funding." },
        true,
      ),
    ).toBeNull();
    expect(
      selectedTestimony({ ...template, kind: "dependency" } as Signal, true),
    ).toBeNull();
    expect(selectedTestimony(template, false)?.basis).toContain(
      "transcript basis not supplied",
    );
  });
  it("counts distinct areas, not answer rows, and carries modelled/attributed source basis", () => {
    const record = bundle();
    family(record, "executive_interview", [
      {
        executiveArea: "Finance",
        priorityTheme: "Value",
        stakeholderRole: "CFO",
        response: "Response one",
        responseBasis: "modelled — not a transcript",
      },
      {
        executiveArea: "Finance",
        priorityTheme: "Value",
        stakeholderRole: "CFO",
        response: "Response two",
        responseBasis: "attributed",
      },
      {
        executiveArea: "Operations",
        priorityTheme: "Value",
        stakeholderRole: "COO",
        response: "Response three",
        responseBasis: "attributed",
      },
      {
        executiveArea: "",
        priorityTheme: "Value",
        response: "Unknown area",
        responseBasis: "",
      },
    ]);
    const context = leadershipContext(record, unverified);
    expect(context.themes).toEqual([
      { name: "Value", count: 2, unit: "executive areas", sourceRefs: [] },
    ]);
    expect(context.excerpts).toHaveLength(4);
    expect(context.excerpts[0].basis).toBe(
      "Modelled response - not a transcript",
    );
    expect(context.excerpts[1].basis).toContain("not client testimony");
    expect(context.excerpts[0].sourceRefs).toEqual(["row-0"]);
  });
  it("quarantines selected older quotes when current interviews are not supplied", () => {
    expect(leadershipContext(bundle(), unverified)).toMatchObject({
      available: false,
      themes: [],
      excerpts: [],
    });
  });
  it("keeps reviewed segment names distinct from missing segment detail", () => {
    const context = operatingContext(bundle(), reviewed);
    expect(context.segments).toHaveLength(4);
    expect(context.hasDeclaredMapping).toBe(false);
    expect(
      context.segments.every(
        (item) =>
          item.owner === null &&
          item.revenue === null &&
          !item.functions.length,
      ),
    ).toBe(true);
    expect(context.signals).toHaveLength(10);
    expect(context.accountability).toHaveLength(22);
    expect(
      context.accountability.reduce((sum, item) => sum + item.count, 0),
    ).toBe(306);
  });
  it("joins served functions only by a declared segment key, never a matching name", () => {
    const record = bundle();
    family(record, "business_segment", [
      {
        segmentKey: "segment-a",
        segmentName: "Operating A",
        pnlOwnerRole: "COO",
        revenueUsd: 0,
        governanceCouncil: "Council",
        regulatoryRegime: "Recorded regime",
        segmentNotes: "Deliver acute care at owned facilities.",
      },
    ]);
    family(record, "business_function", [
      {
        functionName: "Known function",
        businessSegmentKey: "segment-a",
        executiveOwner: "Declared owner",
        businessCapabilities: "Care delivery; clinical documentation",
        annualBudgetUsd: 0,
        fteCount: 12,
      },
      {
        functionName: "Operating A",
        businessSegment: "Operating A",
        executiveOwner: "Not a declared link",
      },
      { functionName: "Unlinked", businessSegmentKey: "segment-b" },
    ]);
    const context = operatingContext(record, unverified);
    expect(context.segments[0]).toMatchObject({
      owner: "COO",
      revenue: 0,
      governance: "Council",
      regulation: "Recorded regime",
      description: "Deliver acute care at owned facilities.",
    });
    expect(context.segments[0].functions.map((item) => item.name)).toEqual([
      "Known function",
    ]);
    expect(context.signals).toEqual([]);
    expect(context.segments[0].functions[0]).toMatchObject({
      capabilities: "Care delivery; clinical documentation",
      budget: 0,
      fte: 12,
      sourceRefs: ["row-0"],
    });
    expect(context.unlinkedFunctions).toBe(2);
    expect(context.segmentsWithDetail).toBe(1);
  });
  it("does not call two empty families a declared segment mapping", () => {
    const record = bundle();
    family(record, "business_segment", [{ segmentKey: "a", segmentName: "A" }]);
    family(record, "business_function", [
      { functionName: "A", businessSegment: "A" },
    ]);
    expect(operatingContext(record, unverified).hasDeclaredMapping).toBe(false);
  });
  it("does not invent a segment structure when the current bundle omits it", () => {
    expect(operatingContext(bundle(), unverified).segments).toEqual([]);
  });
  it("groups only identical movement tuples and never adds an ordered platform hop", () => {
    const record = bundle();
    family(record, "data_asset_or_integration", [
      {
        sourceSystem: "A",
        targetSystem: "B",
        platformOrDatabase: "P",
        integrationType: "API",
        currentStateOrTargetState: "current_state",
      },
      {
        sourceSystem: "A",
        targetSystem: "B",
        platformOrDatabase: "P",
        integrationType: "API",
      },
      {
        sourceSystem: "A",
        targetSystem: "B",
        platformOrDatabase: "P",
        integrationType: "Batch",
      },
      {
        sourceSystem: "A",
        targetSystem: "C",
        currentStateOrTargetState: "target_state",
      },
      {
        recordKind: "data_analytics_workload",
        sourceSystem: "A",
        targetSystem: "C",
      },
      { sourceSystem: "A", targetSystem: "" },
    ]);
    const context = flowRecords(record);
    expect(context.rows).toHaveLength(4);
    expect(context.pairs).toHaveLength(2);
    expect(context.pairs[0]).toMatchObject({
      source: "A",
      target: "B",
      platform: "P",
      mechanism: "API",
    });
    expect(context.pairs[0].members).toHaveLength(2);
    expect(
      context.pairs.flatMap((item) => [item.source, item.target]),
    ).not.toContain("P");
    expect(context.missingEndpoints).toBe(1);
    expect(context.unstatedState).toBe(3);
  });
  it("keeps a missing flow slice distinguishable from recorded zero flows", () => {
    const record = bundle();
    record.technologyEstate!.recordTypes = [];
    expect(flowRecords(record).family).toBeUndefined();
    family(record, "data_asset_or_integration", []);
    expect(flowRecords(record).family?.rows).toEqual([]);
  });
});
