import fs from "node:fs";
import path from "node:path";
import type {
  HomeReviewBundle,
  Signal,
  TechRecordType,
} from "@/lib/home/preview/types";
import {
  chapterContext,
  chapterCoverage,
  flowRecords,
  leadershipContext,
  operatingContext,
  recordCoverage,
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

function coverageBundle(): HomeReviewBundle {
  const record = bundle();
  const packet = record.thesis.signalPacket;
  packet.contextItems = [];
  packet.signals = [];
  packet.visualDatasets = {};
  packet.enterpriseIdentity = {
    businessModel: null,
    industry: null,
    revenue: null,
    employeeCount: null,
  };
  packet.businessEconomics = {
    operatingSegments: [],
    customerSegments: [],
    technologyBudget: null,
    technologyBudgetShareOfRevenue: null,
  };
  packet.strategicPriorities = [];
  packet.homeEnterpriseContext = null;
  return record;
}

describe("summary and detail coverage", () => {
  it("labels stored four-family coverage as compiled summaries without inventing detail counts", () => {
    const record = bundle();
    const original = JSON.stringify(record);
    expect(record.technologyEstate!.recordTypes).toHaveLength(4);
    for (const subject of [
      "program_initiative", "ai_use_case", "metric_outcome",
      "risk_control", "executive_interview",
    ] as const) {
      const coverage = recordCoverage(record, reviewed, subject);
      expect(coverage).toMatchObject({
        state: "summary",
        value: "Summary available",
        detailState: "not_supplied",
        rowCount: null,
        rowSourceRefs: null,
        summaryState: "available",
      });
      expect(coverage.basis).toContain("Reviewed stored record");
      expect(coverage.basis).toContain("enterprise coverage is unknown");
      expect(coverage.basis).toContain("Synthetic reference, not client-attested");
      expect(coverage.recordSource).toBe(reviewed);
    }
    expect(JSON.stringify(record)).toBe(original);
  });
  it("distinguishes declared profile and segment names from detailed operating rows", () => {
    const record = bundle();
    for (const subject of ["tenant_profile", "business_segment"] as const) {
      const coverage = recordCoverage(record, reviewed, subject);
      expect(coverage).toMatchObject({
        state: "profile",
        value: "Profile declared",
        detailState: "not_supplied",
        rowCount: null,
        summaryState: "not_supplied",
        profileState: "available",
        profileSourceRefs: [],
      });
      expect(coverage.profileEvidenceIds.length).toBeGreaterThan(0);
      expect(coverage.basis).toContain("not independently attested");
    }
  });
  it("recognizes a compiled chart without signals and never uses its rows as a portfolio count", () => {
    const record = coverageBundle();
    record.thesis.signalPacket.visualDatasets.stalled_programs = [
      { program: "Program A", pctComplete: 0, blocked: null },
    ];
    expect(recordCoverage(record, reviewed, "program_initiative")).toMatchObject({
      state: "summary",
      value: "Summary available",
      rowCount: null,
      summaryEvidenceIds: [],
      summaryDatasetKeys: ["stalled_programs"],
    });
  });
  it("does not promote a coverage manifest, empty chart or unrelated summary into subject coverage", () => {
    const record = coverageBundle();
    record.thesis.signalPacket.visualDatasets.stalled_programs = [];
    record.thesis.signalPacket.signals = [{
      id: "sig_reference",
      kind: "dependency",
      statement: "A declared relationship connects two records.",
      domains: ["relationship_source_row"],
      evidenceRefs: ["Reference A"],
    }];
    expect(recordCoverage(record, reviewed, "program_initiative")).toMatchObject({
      state: "missing",
      value: "Detail not supplied",
      rowCount: null,
      summaryState: "not_supplied",
      summaryEvidenceIds: [],
      summaryDatasetKeys: [],
    });
  });
  it("preserves served row counts, row references and version markers for a non-synthetic bundle", () => {
    const record = coverageBundle();
    record.declaredSyntheticDemo = false;
    const rows = family(record, "program_initiative", [
      { programId: "PROGRAM-001", programName: "Program A", pctComplete: 0 },
      { programId: "PROGRAM-002", programName: "Program B", pctComplete: null },
    ]);
    const source = {
      ...unverified,
      contextVersion: {
        assessmentId: "assessment-a",
        projectionContentHash: "projection-a",
        sourceLineageHash: "lineage-a",
        sourceCoverage: { totalRecordRows: 2, linkedRecordRows: 2, families: [] },
        deterministicPacketHash: "packet-a",
        narrativePacketHash: null,
        narrativeGeneratedAt: null,
        dataAsOf: null,
        coherence: "unverified" as const,
      },
    };
    const original = JSON.stringify(source);
    const coverage = recordCoverage(record, source, "program_initiative");
    expect(coverage).toMatchObject({
      state: "detail",
      value: "2",
      detailState: "available",
      rowCount: 2,
      summaryState: "not_supplied",
      rowSourceRefs: [["row-0"], ["row-1"]],
    });
    expect(coverage.rowSourceRefs).toBe(rows.rowSourceRefs);
    expect(coverage.recordSource).toBe(source);
    expect(coverage.basis).toContain("Live governed rows");
    expect(coverage.basis).toContain("not a whole-enterprise count");
    expect(coverage.basis).not.toContain("Synthetic");
    expect(JSON.stringify(source)).toBe(original);
    const coherent = {
      ...source,
      contextVersion: { ...source.contextVersion, coherence: "coherent" as const },
    };
    record.thesis.signalPacket.visualDatasets.stalled_programs = [
      { program: "Program A", pctComplete: 0 },
    ];
    const aligned = recordCoverage(record, coherent, "program_initiative");
    expect(aligned).toMatchObject({
      state: "detail", rowCount: 2, summaryState: "available",
      summaryDatasetKeys: ["stalled_programs"],
    });
    expect(aligned.basis).toContain("Live governed record");
    expect(aligned.recordSource).toBe(coherent);
  });
  it("reports detail and compiled summary independently when both are supplied", () => {
    const record = coverageBundle();
    family(record, "program_initiative", [{ programName: "Program A" }]);
    record.thesis.signalPacket.signals = [{
      id: "sig_program",
      kind: "portfolio",
      statement: "Program A has a declared delivery priority.",
      domains: ["program_initiative"],
      evidenceRefs: ["Program A"],
    }];
    expect(recordCoverage(record, reviewed, "program_initiative")).toMatchObject({
      state: "detail",
      rowCount: 1,
      summaryState: "available",
      summaryEvidenceIds: ["sig_program"],
    });
  });
  it("distinguishes a supplied empty family from an omitted family even when a chart exists", () => {
    const record = coverageBundle();
    family(record, "program_initiative", []);
    record.thesis.signalPacket.visualDatasets.stalled_programs = [
      { program: "Program A", pctComplete: 0 },
    ];
    expect(recordCoverage(record, reviewed, "program_initiative")).toMatchObject({
      state: "summary", value: "Summary available", rowCount: 0, detailState: "empty",
    });
    record.thesis.signalPacket.visualDatasets = {};
    const empty = recordCoverage(record, reviewed, "program_initiative");
    expect(empty).toMatchObject({
      state: "missing", value: "0", rowCount: 0, detailState: "empty",
    });
    expect(empty.basis).toContain("enterprise coverage is unknown");
    record.technologyEstate = undefined;
    expect(recordCoverage(record, reviewed, "program_initiative")).toMatchObject({
      state: "missing", value: "Detail not supplied", rowCount: null,
      detailState: "not_supplied",
    });
  });
  it("quarantines earlier summaries for unaligned serving while retaining supplied detail", () => {
    const record = bundle();
    expect(recordCoverage(record, unverified, "program_initiative")).toMatchObject({
      state: "missing",
      summaryState: "not_aligned",
      summaryEvidenceIds: [],
      summaryDatasetKeys: [],
      rowCount: null,
    });
    family(record, "program_initiative", [{ programName: "Program A" }]);
    const coverage = recordCoverage(record, unverified, "program_initiative");
    expect(coverage).toMatchObject({
      state: "detail", value: "1", rowCount: 1, summaryState: "not_aligned",
    });
    expect(coverage.basis).toContain("Earlier compiled summary is not aligned");
    expect(recordCoverage(record, unverified, "tenant_profile").profileState).toBe(
      "not_supplied",
    );
  });
  it("keeps reviewed fallback provenance and a declared zero distinct from a missing profile", () => {
    const record = coverageBundle();
    const fallback = { ...reviewed, kind: "reviewed_snapshot_fallback" as const };
    expect(recordCoverage(record, fallback, "tenant_profile").profileState).toBe(
      "not_supplied",
    );
    record.thesis.signalPacket.enterpriseIdentity.revenue = 0;
    const coverage = recordCoverage(record, fallback, "tenant_profile");
    expect(coverage).toMatchObject({ state: "profile", profileState: "available" });
    expect(coverage.basis).toContain("Reviewed stored record fallback");
    expect(coverage.recordSource).toBe(fallback);
  });
  it("maps compiled-domain aliases into readable chapter subjects without treating provenance as a subject", () => {
    const record = bundle();
    const coverage = chapterCoverage(record, reviewed, "strategy_value_creation");
    expect(coverage.map((item) => item.subject)).toEqual([
      "vendor_contract", "program_initiative", "ai_use_case",
    ]);
    expect(coverage.find((item) => item.subject === "ai_use_case")).toMatchObject({
      label: "AI & automation use cases", state: "summary", rowCount: null,
    });
    expect(chapterCoverage(record, reviewed, "how_we_operate").some(
      (item) => item.subject === "relationship_edge",
    )).toBe(false);
  });
});

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
