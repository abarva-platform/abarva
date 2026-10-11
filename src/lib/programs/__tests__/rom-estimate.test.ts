/**
 * P3 Step 4's `rom_estimate` record: parsing, the no-default unit-hour
 * resolution against the register, the four input categories, the next
 * action (clauses in row order, the "{n} of 4" count, the open count, done
 * and blocked), the structure handed to the ROM service, approval, edits,
 * the notes fill and the text dispatcher. Synthetic fixtures only.
 */

import {
  acceptReleases,
  addFoundation,
  addRelease,
  addUseCase,
  approveMapping,
  approveRomEstimate,
  buildRomStructure,
  confirmCounts,
  emptyRomEstimate,
  formatAllocation,
  formatFactor,
  formatRomMoney,
  formatRomWeeks,
  isRomApprovalCurrent,
  isRomEstimateDone,
  parseRomEstimate,
  provisionalSentence,
  releaseGroupingProblem,
  removeRelease,
  reopenCounts,
  reopenReleases,
  reopenRomApproval,
  resolveRomUnitHours,
  romCategories,
  romEstimateNextAction,
  romInputsFingerprint,
  romProvisionalBecause,
  romReliedRegisterIds,
  romRowStates,
  serializeRomEstimate,
  setCount,
  setFactors,
  setPod,
  setUnitHoursRef,
  type RomEstimate,
  type RomRegisterRow,
} from "@/lib/programs/rom-estimate";
import {
  applyRomNotesProposals,
  proposalDrivers,
  proposeRomCountsFromNotes,
} from "@/lib/programs/rom-estimate-notes";
import {
  captureValueGateText,
  captureValueText,
} from "@/lib/programs/structured-capture-text";
import type { RomResult } from "@/lib/pricing/moves-workflow/rom-service";

const reg = (
  registerId: string,
  status: RomRegisterRow["status"],
  extra: Partial<RomRegisterRow> = {},
): RomRegisterRow => ({
  registerId,
  status,
  statement: `Statement ${registerId}`,
  whyItMatters: `Why ${registerId}`,
  workingFigure: null,
  workingValue: null,
  source: "Delivery notes, Oct 16",
  confidence: 3,
  ownerRole: "Delivery lead",
  answer: null,
  answerFigure: null,
  answerValue: null,
  answerSource: null,
  ...extra,
});

const REGISTER: RomRegisterRow[] = [
  reg("DL1", "confirmed", {
    workingFigure: "24 h per source",
    workingValue: 24,
    answer: "Confirmed at 24 h",
    answerSource: "Benchmark",
  }),
  reg("DL2", "confirmed", {
    workingFigure: "6 h per table",
    workingValue: 6,
    answerValue: 6,
  }),
  reg("DL3", "open", {
    workingFigure: "~20 h per view",
    workingValue: 20,
    ownerRole: "BI lead",
    confidence: 1,
  }),
  reg("DL4", "confirmed", { workingFigure: "×1.10", workingValue: 1.1 }),
  reg("DL5", "corrected", {
    workingFigure: "1.5 h per row",
    workingValue: 1.5,
    answerValue: 2,
    answer: "Corrected to 2 h",
  }),
];

const AT = "2026-10-16";
function fixture(): RomEstimate {
  return {
    ...emptyRomEstimate(),
    useCases: [
      {
        code: "UC-1",
        name: "Certified measure layer",
        counts: {
          data_source_count: 4,
          source_table_count: 18,
          standard_data_entity_count: 6,
          dashboard_view_count: 4,
          design_row_count: 40,
          validation_row_count: 60,
        },
        source: { kind: "team" },
        confirmedBy: "me",
        confirmedAt: AT,
      },
      {
        code: "UC-2",
        name: "Lineage and controlled serving",
        counts: {
          data_source_count: 6,
          source_table_count: 30,
          dashboard_view_count: 2,
        },
        source: {
          kind: "session_notes",
          citation: "delivery notes, Oct 16, p.2",
          excerpt: "UC-2 is about 6 sources",
        },
      },
      {
        code: "UC-3",
        name: "Purpose-bound access",
        counts: {
          data_source_count: 3,
          source_table_count: 10,
          dashboard_view_count: 1,
        },
        source: {
          kind: "session_notes",
          citation: "delivery notes, Oct 16, p.2",
          excerpt: "UC-3 is 3 sources",
        },
      },
    ],
    foundation: {
      code: "FOUNDATION",
      name: "Shared foundation",
      counts: {
        source_table_count: 12,
        standard_data_entity_count: 4,
        design_row_count: 25,
      },
      source: { kind: "team" },
      confirmedBy: "me",
      confirmedAt: AT,
    },
    unitHours: {
      data_source_count: { kind: "register", registerId: "DL1" },
      source_table_count: { kind: "register", registerId: "DL2" },
      standard_data_entity_count: {
        kind: "benchmark",
        benchmarkId: "BM-ENT-01",
        value: 16,
        confidence: "high",
        approvedBy: "lead",
        approvedAt: AT,
      },
      dashboard_view_count: { kind: "register", registerId: "DL3" },
      design_row_count: { kind: "register", registerId: "DL5" },
      validation_row_count: {
        kind: "benchmark",
        benchmarkId: "BM-VAL-03",
        value: 1.5,
        confidence: "medium",
        approvedBy: "lead",
        approvedAt: AT,
      },
    },
    pod: {
      members: [
        {
          roleCode: "ROL-LEAD",
          roleLabel: "Engagement lead",
          levelCode: "LVL-P",
          levelLabel: "Principal",
          fte: 0.25,
        },
        {
          roleCode: "ROL-DE",
          roleLabel: "Data engineer",
          levelCode: "LVL-S",
          levelLabel: "Senior",
          fte: 2,
          levelClamp: {
            from: "Lead",
            reason: "the rate foundation has no nearshore Lead rate",
          },
        },
        {
          roleCode: "ROL-AE",
          roleLabel: "Analytics engineer",
          levelCode: "LVL-M",
          levelLabel: "Mid",
          fte: 1,
          proposedMapping: { from: "BI developer" },
        },
      ],
      locationCode: "LOC-NEAR",
      locationLabel: "Nearshore",
      providerClassCode: "PRV-DP",
      providerClassLabel: "Delivery partner",
      rateBasis: "loaded_cost",
    },
    friction: { value: 1.1, source: "[A:DL4] confirmed" },
    productiveShare: { value: 0.65, source: "approved benchmark BM-PROD-02" },
    hoursPerFteWeek: { value: 40, source: "40-hour week per allocated FTE" },
    releases: {
      items: [
        {
          code: "R1",
          name: "Pilot · certified measures",
          useCaseCodes: ["UC-1"],
          designStatus: "not_designed",
          carriesFoundation: true,
        },
        {
          code: "R2",
          name: "Scale · lineage and access",
          useCaseCodes: ["UC-2", "UC-3"],
          designStatus: "not_designed",
        },
      ],
      source: {
        kind: "session_notes",
        citation: "delivery notes, Oct 16, p.4",
        excerpt: "Pilot first, then scale.",
      },
    },
  };
}

/** Every input confirmed: counts, DL3 answered, the mapping approved, the grouping accepted. */
function settled(): { record: RomEstimate; register: RomRegisterRow[] } {
  let r = fixture();
  for (const code of ["UC-2", "UC-3"]) {
    const e = confirmCounts(r, code, "me", AT);
    if (!e.ok) throw new Error(e.reason);
    r = e.value;
  }
  const m = approveMapping(r, "ROL-AE", "me", AT);
  if (!m.ok) throw new Error(m.reason);
  const a = acceptReleases(m.value, "me", AT);
  if (!a.ok) throw new Error(a.reason);
  const register = REGISTER.map((row) =>
    row.registerId === "DL3"
      ? { ...row, status: "confirmed" as const, answerValue: 20 }
      : row,
  );
  return { record: a.value, register };
}

/** A result shaped like the ROM service's, for exactly this structure. */
function fakeRom(
  record: RomEstimate,
  register: RomRegisterRow[] | null,
): RomResult {
  const build = buildRomStructure(record, register);
  if (!build.ok) throw new Error(build.reason);
  const block = (code: string, hours: number, weeks: number, plan: number) => ({
    kind: "release" as const,
    code,
    name: code,
    designStatus: "not_designed" as const,
    hours,
    weeks,
    pod: {
      memberLines: [],
    } as unknown as RomResult["releases"][number]["own"]["pod"],
    range: {
      basis: "named" as const,
      policyCode: "ROM-NOT-DESIGNED",
      score: null,
      lowMultiplier: 0.75,
      highMultiplier: 1.5,
      lowCents: plan * 0.75,
      planCents: plan,
      highCents: plan * 1.5,
    },
  });
  return {
    ok: true,
    structure: build.structure,
    pod: {
      podCode: "ROM-EXPLICIT-POD",
      source: "x",
      locationCode: "LOC-NEAR",
      providerClassCode: "PRV-DP",
      rateBasis: "loaded_cost",
      members: [],
      memberMappingStatus: [],
    },
    releases: [
      {
        code: "R1",
        name: "Pilot · certified measures",
        designStatus: "not_designed",
        useCases: [],
        own: block("R1", 410, 5, 8_000_000),
        sharesFoundation: true,
        standalone: { lowCents: 0, planCents: 0, highCents: 0 },
      },
      {
        code: "R2",
        name: "Scale · lineage and access",
        designStatus: "not_designed",
        useCases: [],
        own: block("R2", 520, 6, 9_600_000),
        sharesFoundation: false,
        standalone: { lowCents: 0, planCents: 0, highCents: 0 },
      },
    ],
    foundation: {
      hours: {} as never,
      priced: {
        ...block("FOUNDATION", 300, 4, 6_400_000),
        kind: "foundation",
        name: "Shared foundation",
      },
      sharedByReleaseCodes: ["R1"],
    },
    total: {
      hours: 1230,
      weeks: 15,
      lowCents: 18_000_000,
      planCents: 24_000_000,
      highCents: 36_000_000,
      naiveSumCents: 0,
      rollup: {} as never,
    },
    productivityCreditApplied: false,
  };
}

describe("parsing", () => {
  it("round-trips a record and refuses anything that is not one", () => {
    const r = fixture();
    expect(parseRomEstimate(serializeRomEstimate(r))).toEqual(r);
    expect(parseRomEstimate("")).toBeNull();
    expect(parseRomEstimate("Estimate is about 400 hours")).toBeNull();
    expect(parseRomEstimate("{not json")).toBeNull();
    expect(
      parseRomEstimate(JSON.stringify({ ...r, kind: "architecture_choice" })),
    ).toBeNull();
    expect(parseRomEstimate(JSON.stringify({ ...r, version: 2 }))).toBeNull();
  });

  it("drops malformed items instead of inventing values", () => {
    const raw = JSON.stringify({
      ...fixture(),
      useCases: [
        {
          code: "UC-1",
          name: "A",
          counts: {
            data_source_count: 2.5,
            source_table_count: -1,
            design_row_count: 3,
            bogus: 9,
          },
        },
        { code: "UC-1", name: "Duplicate" },
        { name: "No code" },
      ],
      unitHours: {
        data_source_count: { kind: "register" },
        dashboard_view_count: {
          kind: "benchmark",
          benchmarkId: "BM",
          value: 3,
          confidence: "medium",
        },
      },
      pod: {
        templateCode: "POD-1",
        members: [{ roleCode: "R", levelCode: "L", fte: 1 }],
        locationCode: "LOC",
        rateBasis: "loaded_cost",
      },
      friction: { value: 1.1 },
      releases: {
        items: [
          {
            code: "R1",
            name: "x",
            useCaseCodes: ["UC-1"],
            designStatus: "maybe",
          },
        ],
        source: { kind: "session_notes" },
      },
      approval: { version: 1, approvedBy: "me" },
      snapshotsIssued: -2,
    });
    const r = parseRomEstimate(raw)!;
    expect(r.useCases).toEqual([
      {
        code: "UC-1",
        name: "A",
        counts: { design_row_count: 3 },
        source: { kind: "team" },
      },
    ]);
    // A reference without an id, or a benchmark nobody approved, is no reference.
    expect(r.unitHours).toEqual({});
    // A pod with both a template and members is refused whole.
    expect(r.pod).toBeNull();
    expect(r.friction).toBeNull();
    expect(r.releases).toEqual({ items: [], source: { kind: "team" } });
    expect(r.approval).toBeNull();
    expect(r.snapshotsIssued).toBe(0);
  });
});

describe("unit hours: references, never defaults", () => {
  it("reads a confirmed row's answer, else its working figure", () => {
    expect(
      resolveRomUnitHours({ kind: "register", registerId: "DL1" }, REGISTER),
    ).toEqual({
      state: "confirmed",
      value: 24,
      confidence: "medium",
      sourceLabel: "[A:DL1] confirmed · Delivery lead",
      registerId: "DL1",
    });
    const answered = [
      reg("DL9", "confirmed", { workingValue: 5, answerValue: 7 }),
    ];
    expect(
      resolveRomUnitHours({ kind: "register", registerId: "DL9" }, answered),
    ).toMatchObject({ state: "confirmed", value: 7 });
  });

  it("reads a corrected row only from its corrected value", () => {
    expect(
      resolveRomUnitHours({ kind: "register", registerId: "DL5" }, REGISTER),
    ).toMatchObject({
      state: "confirmed",
      value: 2,
      sourceLabel: "[A:DL5] corrected · Delivery lead",
    });
    const noNumber = [reg("DL9", "corrected", { workingValue: 5 })];
    expect(
      resolveRomUnitHours({ kind: "register", registerId: "DL9" }, noNumber),
    ).toEqual({ state: "unusable", registerId: "DL9", reason: "no_value" });
    const confirmedNoNumber = [reg("DL9", "confirmed")];
    expect(
      resolveRomUnitHours(
        { kind: "register", registerId: "DL9" },
        confirmedNoNumber,
      ),
    ).toMatchObject({ state: "unusable", reason: "no_value" });
  });

  it("keeps an open row open, with its working figure for the preview only", () => {
    expect(
      resolveRomUnitHours({ kind: "register", registerId: "DL3" }, REGISTER),
    ).toEqual({
      state: "open",
      registerId: "DL3",
      ownerRole: "BI lead",
      workingFigure: "~20 h per view",
      workingValue: 20,
      confidence: "low",
    });
  });

  it.each(["proposed", "superseded", "rejected"] as const)(
    "a %s row supplies nothing",
    (status) => {
      expect(
        resolveRomUnitHours({ kind: "register", registerId: "DL9" }, [
          reg("DL9", status, { workingValue: 3 }),
        ]),
      ).toEqual({ state: "unusable", registerId: "DL9", reason: status });
    },
  );

  it("names a missing row, an unread register, a benchmark and no reference apart", () => {
    expect(
      resolveRomUnitHours({ kind: "register", registerId: "DL8" }, REGISTER),
    ).toEqual({ state: "unusable", registerId: "DL8", reason: "missing" });
    expect(
      resolveRomUnitHours({ kind: "register", registerId: "DL1" }, null),
    ).toEqual({ state: "unread", registerId: "DL1" });
    expect(
      resolveRomUnitHours(fixture().unitHours.standard_data_entity_count, null),
    ).toEqual({
      state: "confirmed",
      value: 16,
      confidence: "high",
      sourceLabel: "Approved benchmark BM-ENT-01",
    });
    expect(resolveRomUnitHours(undefined, REGISTER)).toEqual({
      state: "unset",
    });
  });

  it("lists the register rows the estimate relies on, unit hours first", () => {
    expect(romReliedRegisterIds(fixture())).toEqual([
      "DL1",
      "DL2",
      "DL3",
      "DL5",
      "DL4",
    ]);
  });
});

describe("categories and the next action", () => {
  it("opens on the design's state: 0 of 4, six open, three clauses at most", () => {
    const na = romEstimateNextAction({
      record: fixture(),
      register: REGISTER,
      depth: "full",
    });
    expect(na.countLabel).toBe("0 of 4 inputs confirmed");
    expect(na.nextAction.state).toBe("in_progress");
    expect(na.nextAction.eyebrow).toBe("Next");
    expect(na.nextAction.sentence).toBe(
      "Confirm counts for 2 use cases; answer A:DL3 to set dashboard view hours; 2 more below.",
    );
    // Two count rows, A:DL3, one mapping, the grouping, and the approval.
    expect(na.nextAction.total - na.nextAction.settled).toBe(6);
    expect(na.nextAction.continueEnabled).toBe(false);
    expect(na.approvable).toBe(false);
  });

  it("orders clauses by row: counts, unit hours, pod, factors, releases", () => {
    const r = { ...fixture(), friction: null };
    expect(
      romRowStates(r, REGISTER).map((s) => [s.id, s.state, s.clause]),
    ).toEqual([
      ["CNT", "decision", "confirm counts for 2 use cases"],
      ["UNIT", "decision", "answer A:DL3 to set dashboard view hours"],
      ["POD", "decision", "approve 1 pod role mapping"],
      ["FAC", "decision", "source the delivery factors"],
      ["REL", "draft", "fix the release grouping"],
    ]);
  });

  it("counts each category as it settles", () => {
    let r = fixture();
    r = (confirmCounts(r, "UC-2", "me", AT) as { value: RomEstimate }).value;
    r = (confirmCounts(r, "UC-3", "me", AT) as { value: RomEstimate }).value;
    let na = romEstimateNextAction({
      record: r,
      register: REGISTER,
      depth: "full",
    });
    expect(na.countLabel).toBe("1 of 4 inputs confirmed");
    expect(na.nextAction.sentence).toBe(
      "Answer A:DL3 to set dashboard view hours; approve 1 pod role mapping; review the release grouping.",
    );
    r = (approveMapping(r, "ROL-AE", "me", AT) as { value: RomEstimate }).value;
    na = romEstimateNextAction({
      record: r,
      register: REGISTER,
      depth: "full",
    });
    expect(na.countLabel).toBe("2 of 4 inputs confirmed");
    expect(na.nextAction.total - na.nextAction.settled).toBe(3);
  });

  it("names a foundation still to confirm, and the missing pieces of an empty record", () => {
    const r = fixture();
    const open = {
      ...r,
      foundation: {
        ...r.foundation!,
        confirmedAt: undefined,
        confirmedBy: undefined,
      },
    };
    expect(romRowStates(open, REGISTER)[0].clause).toBe(
      "confirm counts for 2 use cases and the shared foundation",
    );
    const empty = romEstimateNextAction({
      record: emptyRomEstimate(),
      register: [],
      depth: "full",
    });
    expect(empty.nextAction.sentence).toBe(
      "Add the use cases and their counts; count something before setting unit hours; 3 more below.",
    );
  });

  it("merges unit-hour sources into one clause, and names an unread register", () => {
    const r = fixture();
    const twoOpen = REGISTER.map((x) =>
      x.registerId === "DL5" ? { ...x, status: "open" as const } : x,
    );
    const rows = romRowStates(
      { ...r, unitHours: { ...r.unitHours, validation_row_count: undefined } },
      twoOpen,
    );
    expect(rows[1].clause).toBe(
      "answer A:DL3 and A:DL5 to set dashboard view and design row hours and source the validation row hours",
    );
    expect(romRowStates(r, null)[1].clause).toBe(
      "read the assumptions register again",
    );
    expect(romRowStates(r, null, "loading")[1].clause).toBe(
      "check the unit hours once the register loads",
    );
    expect(romRowStates(r, null, "withheld")[1].clause).toBe(
      "ask someone with financial visibility to confirm the unit hours",
    );
    expect(
      romEstimateNextAction({
        record: r,
        register: null,
        depth: "full",
        registerUnreadBecause: "loading",
      }).nextAction.sentence,
    ).toContain("check the unit hours once the register loads");
  });

  it("asks to approve only once every input is confirmed, and is Ready only after", () => {
    const { record, register } = settled();
    let na = romEstimateNextAction({ record, register, depth: "full" });
    expect(na.countLabel).toBe("4 of 4 inputs confirmed");
    expect(na.nextAction.sentence).toBe("Approve the estimate.");
    expect(na.nextAction.total - na.nextAction.settled).toBe(1);
    expect(na.approvable).toBe(true);
    const refused = romEstimateNextAction({
      record,
      register,
      depth: "full",
      estimateRefused: true,
    });
    expect(refused.nextAction.sentence).toBe(
      "Resolve what the estimate refuses.",
    );
    expect(refused.approvable).toBe(false);
    const approved = (
      approveRomEstimate(
        record,
        register,
        fakeRom(record, register),
        "me",
        AT,
      ) as { value: RomEstimate }
    ).value;
    na = romEstimateNextAction({ record: approved, register, depth: "full" });
    expect(na.nextAction.state).toBe("ready");
    expect(na.nextAction.eyebrow).toBe("✓ Ready");
    expect(na.nextAction.sentence).toBe(
      "Every input is confirmed and the estimate is approved; P4 plans from snapshot v1; continue to Gate readiness.",
    );
    expect(na.nextAction.continueEnabled).toBe(true);
    expect(na.nextAction.total - na.nextAction.settled).toBe(0);
  });

  it("is blocked by an outside cause whatever its rows say", () => {
    const na = romEstimateNextAction({
      record: fixture(),
      register: REGISTER,
      depth: "full",
      blockedBy: "Waiting on Step 2: no direction",
    });
    expect(na.nextAction.state).toBe("blocked");
    expect(na.nextAction.sentence).toBe("Waiting on Step 2: no direction.");
    expect(na.nextAction.continueEnabled).toBe(false);
  });

  it("leads with the page's own rows, inside the three-clause cap", () => {
    const na = romEstimateNextAction({
      record: fixture(),
      register: REGISTER,
      depth: "full",
      leadingRows: [
        {
          id: "EV-1",
          rank: -10,
          subject: "x",
          state: "decision",
          clause: "review the staffing note extraction",
        },
      ],
    });
    expect(na.nextAction.sentence).toBe(
      "Review the staffing note extraction; confirm counts for 2 use cases; 3 more below.",
    );
    expect(na.nextAction.total - na.nextAction.settled).toBe(7);
  });

  it("reads releases as a decision until every use case is grouped", () => {
    const r = fixture();
    const missing = {
      ...r,
      releases: { ...r.releases!, items: [r.releases!.items[0]] },
    };
    expect(romRowStates(missing, REGISTER)[4]).toMatchObject({
      state: "decision",
      clause: "put UC-2 and UC-3 in a release",
    });
    expect(romRowStates({ ...r, releases: null }, REGISTER)[4]).toMatchObject({
      state: "decision",
      clause: "group the use cases into releases",
    });
    expect(releaseGroupingProblem(missing)).toEqual({
      unassigned: ["UC-2", "UC-3"],
      inTwo: [],
      foundationCarriers: null,
    });
    const twice = {
      ...r,
      releases: {
        ...r.releases!,
        items: [
          r.releases!.items[0],
          {
            ...r.releases!.items[1],
            useCaseCodes: ["UC-1", "UC-2", "UC-3"],
            carriesFoundation: true,
          },
        ],
      },
    };
    expect(releaseGroupingProblem(twice)).toEqual({
      unassigned: [],
      inTwo: ["UC-1"],
      foundationCarriers: 2,
    });
    const uncarried = {
      ...r,
      releases: {
        ...r.releases!,
        items: [
          { ...r.releases!.items[0], carriesFoundation: undefined },
          r.releases!.items[1],
        ],
      },
    };
    expect(releaseGroupingProblem(uncarried)).toEqual({
      unassigned: [],
      inTwo: [],
      foundationCarriers: 0,
    });
    const noFoundation = { ...r, foundation: null };
    expect(releaseGroupingProblem(noFoundation)).toEqual({
      unassigned: [],
      inTwo: [],
      foundationCarriers: 1,
    });
    expect(
      romCategories(
        {
          ...r,
          releases: { ...r.releases!, acceptedAt: AT, acceptedBy: "me" },
        },
        REGISTER,
      ).releases,
    ).toBe(true);
  });

  it("says what keeps the estimate provisional", () => {
    expect(
      provisionalSentence(
        romProvisionalBecause(romCategories(fixture(), REGISTER)),
      ),
    ).toBe(
      "Provisional until counts, unit hours, the pod mapping and the release grouping are confirmed.",
    );
    expect(provisionalSentence(["unit hours"])).toBe(
      "Provisional until unit hours is confirmed.",
    );
    expect(provisionalSentence([])).toBeNull();
    expect(
      romProvisionalBecause(
        romCategories(
          { ...fixture(), pod: null, hoursPerFteWeek: null },
          REGISTER,
        ),
      ),
    ).toEqual([
      "counts",
      "unit hours",
      "the pod mapping",
      "the release grouping",
      "the delivery factors",
    ]);
  });
});

describe("the structure the ROM service prices", () => {
  it("maps the record field for field, with the working figure only for an open row", () => {
    const build = buildRomStructure(fixture(), REGISTER);
    if (!build.ok) throw new Error(build.reason);
    expect(build.workingFigureDrivers).toEqual(["dashboard_view_count"]);
    expect(build.structure.unitHours.dashboard_view_count).toEqual({
      value: 20,
      source: "[A:DL3] open · working figure, provisional",
      confidence: "low",
    });
    expect(build.structure.unitHours.design_row_count).toEqual({
      value: 2,
      source: "[A:DL5] corrected · Delivery lead",
      confidence: "medium",
    });
    expect(build.unitHoursUsed.dashboard_view_count).toBeUndefined();
    expect(build.structure.foundation).toEqual({
      code: "FOUNDATION",
      name: "Shared foundation",
      counts: {
        source_table_count: 12,
        standard_data_entity_count: 4,
        design_row_count: 25,
      },
      designStatus: "not_designed",
      sharedByReleaseCodes: ["R1"],
    });
    expect(build.structure.pod).toEqual({
      members: [
        { roleCode: "ROL-LEAD", levelCode: "LVL-P", fte: 0.25 },
        { roleCode: "ROL-DE", levelCode: "LVL-S", fte: 2 },
        {
          roleCode: "ROL-AE",
          levelCode: "LVL-M",
          fte: 1,
          proposedMapping: true,
        },
      ],
      locationCode: "LOC-NEAR",
      providerClassCode: "PRV-DP",
      rateBasis: "loaded_cost",
    });
    expect(build.structure.releases[1]).toEqual({
      code: "R2",
      name: "Scale · lineage and access",
      designStatus: "not_designed",
      useCaseCodes: ["UC-2", "UC-3"],
    });
    expect(build.structure.friction).toEqual({
      value: 1.1,
      source: "[A:DL4] confirmed",
    });
  });

  it("computes nothing for a counted driver with no figure: there is no default", () => {
    const noFigure = REGISTER.map((x) =>
      x.registerId === "DL3" ? { ...x, workingValue: null } : x,
    );
    expect(buildRomStructure(fixture(), noFigure)).toEqual({
      ok: false,
      reason: "unit_hours_missing",
      drivers: ["dashboard_view_count"],
    });
    const r = fixture();
    expect(
      buildRomStructure(
        {
          ...r,
          unitHours: { ...r.unitHours, dashboard_view_count: undefined },
        },
        REGISTER,
      ),
    ).toMatchObject({ ok: false, drivers: ["dashboard_view_count"] });
    expect(buildRomStructure(r, null)).toMatchObject({
      ok: false,
      reason: "unit_hours_missing",
    });
  });

  it("says which input is missing before it calls the service", () => {
    const r = fixture();
    expect(buildRomStructure({ ...r, useCases: [] }, REGISTER)).toEqual({
      ok: false,
      reason: "no_use_cases",
    });
    expect(buildRomStructure({ ...r, releases: null }, REGISTER)).toEqual({
      ok: false,
      reason: "no_releases",
    });
    expect(
      buildRomStructure(
        { ...r, releases: { ...r.releases!, items: [r.releases!.items[0]] } },
        REGISTER,
      ),
    ).toEqual({ ok: false, reason: "grouping" });
    expect(buildRomStructure({ ...r, pod: null }, REGISTER)).toEqual({
      ok: false,
      reason: "no_pod",
    });
    expect(
      buildRomStructure({ ...r, productiveShare: null }, REGISTER),
    ).toEqual({ ok: false, reason: "no_factors" });
  });

  it("passes a template pod and a designed release's range inputs through", () => {
    const r = fixture();
    const range = {
      scopeMaturity: "high",
      evidenceQuality: "medium",
      deliveryNovelty: "low",
      quantityUncertainty: "low",
      rateCardCoveragePct: 90,
    } as const;
    const designed = {
      ...r,
      pod: {
        templateCode: "POD-7",
        locationCode: "LOC-NEAR",
        providerClassCode: null,
        rateBasis: "bill_rate" as const,
      },
      releases: {
        ...r.releases!,
        items: [
          {
            ...r.releases!.items[0],
            designStatus: "designed" as const,
            rangeInputs: range,
          },
          r.releases!.items[1],
        ],
      },
    };
    const build = buildRomStructure(designed, REGISTER);
    if (!build.ok) throw new Error(build.reason);
    expect(build.structure.pod).toEqual({
      templateCode: "POD-7",
      locationCode: "LOC-NEAR",
      providerClassCode: null,
      rateBasis: "bill_rate",
    });
    expect(build.structure.releases[0].rangeInputs).toEqual(range);
    expect(build.structure.foundation).toMatchObject({
      designStatus: "designed",
      rangeInputs: range,
    });
  });
});

describe("approval", () => {
  it("refuses while an input is open, or for a result of other inputs", () => {
    const r = fixture();
    expect(
      approveRomEstimate(r, REGISTER, fakeRom(r, REGISTER), "me", AT),
    ).toEqual({
      ok: false,
      reason:
        "Provisional until counts, unit hours, the pod mapping and the release grouping are confirmed. Approve once they are.",
    });
    const { record, register } = settled();
    const other = fakeRom(
      { ...record, friction: { value: 1.2, source: "x" } },
      register,
    );
    expect(approveRomEstimate(record, register, other, "me", AT)).toMatchObject(
      { ok: false, reason: expect.stringContaining("inputs changed") },
    );
  });

  it("stores who, when, the inputs it saw, the hours it used and the computed snapshot", () => {
    const { record, register } = settled();
    const edit = approveRomEstimate(
      record,
      register,
      fakeRom(record, register),
      "me",
      AT,
    );
    if (!edit.ok) throw new Error(edit.reason);
    const a = edit.value.approval!;
    expect(a).toMatchObject({
      version: 1,
      approvedBy: "me",
      approvedAt: AT,
      inputsFingerprint: romInputsFingerprint(record),
    });
    expect(a.unitHours.dashboard_view_count).toEqual({
      value: 20,
      source: "[A:DL3] confirmed · BI lead",
    });
    expect(
      a.releases.map((x) => [x.code, x.hours, x.weeks, x.planCents]),
    ).toEqual([
      ["R1", 410, 5, 8_000_000],
      ["R2", 520, 6, 9_600_000],
    ]);
    expect(a.foundation).toMatchObject({
      code: "FOUNDATION",
      releaseCode: "R1",
      planCents: 6_400_000,
    });
    expect(a.combined).toEqual({
      hours: 1230,
      weeks: 15,
      lowCents: 18_000_000,
      planCents: 24_000_000,
      highCents: 36_000_000,
    });
    expect(edit.value.snapshotsIssued).toBe(1);
    expect(isRomEstimateDone(edit.value)).toBe(true);
    // The approval survives a round trip through the capture record.
    expect(
      isRomEstimateDone(parseRomEstimate(serializeRomEstimate(edit.value))),
    ).toBe(true);
  });

  it("stops being done when an input changes, or a unit hour moves in the register", () => {
    const { record, register } = settled();
    const approved = (
      approveRomEstimate(
        record,
        register,
        fakeRom(record, register),
        "me",
        AT,
      ) as { value: RomEstimate }
    ).value;
    const reopened = reopenCounts(approved);
    expect(isRomEstimateDone(reopened)).toBe(false);
    const edited = (
      setCount(reopened, "UC-2", "dashboard_view_count", "3") as {
        value: RomEstimate;
      }
    ).value;
    expect(isRomApprovalCurrent(edited)).toBe(false);
    const moved = register.map((x) =>
      x.registerId === "DL3" ? { ...x, answerValue: 30 } : x,
    );
    expect(isRomApprovalCurrent(approved, moved)).toBe(false);
    expect(isRomApprovalCurrent(approved, register)).toBe(true);
    // Without the register to compare, only the record's own inputs are checked.
    expect(isRomApprovalCurrent(approved)).toBe(true);
    expect(isRomEstimateDone(null)).toBe(false);
  });

  it("numbers each new snapshot after a reopen", () => {
    const { record, register } = settled();
    const once = (
      approveRomEstimate(
        record,
        register,
        fakeRom(record, register),
        "me",
        AT,
      ) as { value: RomEstimate }
    ).value;
    const again = approveRomEstimate(
      reopenRomApproval(once),
      register,
      fakeRom(record, register),
      "me",
      AT,
    );
    if (!again.ok) throw new Error(again.reason);
    expect(again.value.approval?.version).toBe(2);
  });

  it("fingerprints inputs and their status, never the approval itself", () => {
    const r = fixture();
    expect(romInputsFingerprint(r)).toBe(
      romInputsFingerprint(JSON.parse(JSON.stringify(r))),
    );
    expect(romInputsFingerprint({ ...r, snapshotsIssued: 4 })).toBe(
      romInputsFingerprint(r),
    );
    expect(
      romInputsFingerprint(
        reopenReleases({
          ...r,
          releases: { ...r.releases!, acceptedAt: AT, acceptedBy: "me" },
        }),
      ),
    ).toBe(romInputsFingerprint(r));
    expect(
      romInputsFingerprint({ ...r, friction: { value: 1.2, source: "x" } }),
    ).not.toBe(romInputsFingerprint(r));
  });
});

describe("edits", () => {
  it("takes a whole count or a blank, marks it typed, and never edits a confirmed row", () => {
    const r = fixture();
    expect(setCount(r, "UC-2", "data_source_count", "2.5")).toEqual({
      ok: false,
      reason: "A count is a whole number of 0 or more.",
    });
    const e = setCount(r, "UC-2", "data_source_count", " 7 ");
    if (!e.ok) throw new Error(e.reason);
    expect(e.value.useCases[1].counts.data_source_count).toBe(7);
    expect(e.value.useCases[1].typed).toEqual(["data_source_count"]);
    const blank = (
      setCount(e.value, "UC-2", "data_source_count", "") as {
        value: RomEstimate;
      }
    ).value;
    expect(blank.useCases[1].counts.data_source_count).toBeUndefined();
    const locked = (
      setCount(r, "UC-1", "data_source_count", "99") as { value: RomEstimate }
    ).value;
    expect(locked.useCases[0].counts.data_source_count).toBe(4);
    expect(setCount(r, "UC-9", "data_source_count", "1")).toEqual({
      ok: false,
      reason: "There is no use case UC-9.",
    });
    const f = (
      setCount(
        { ...r, foundation: { ...r.foundation!, confirmedAt: undefined } },
        "FOUNDATION",
        "data_source_count",
        "2",
      ) as { value: RomEstimate }
    ).value;
    expect(f.foundation?.counts.data_source_count).toBe(2);
  });

  it("refuses to confirm a row that counts nothing", () => {
    const added = (
      addUseCase(fixture(), "  Quality quarantine ") as { value: RomEstimate }
    ).value;
    expect(added.useCases[3]).toEqual({
      code: "UC-4",
      name: "Quality quarantine",
      counts: {},
      source: { kind: "team" },
    });
    expect(confirmCounts(added, "UC-4", "me", AT)).toEqual({
      ok: false,
      reason:
        "Quality quarantine counts nothing yet. Give it at least one count above zero.",
    });
    expect(addUseCase(added, " ")).toEqual({
      ok: false,
      reason: "A use case needs a name.",
    });
    expect(addFoundation(added)).toEqual({
      ok: false,
      reason: "The shared foundation is already listed.",
    });
    expect(
      (addFoundation({ ...added, foundation: null }) as { value: RomEstimate })
        .value.foundation,
    ).toEqual({
      code: "FOUNDATION",
      name: "Shared foundation",
      counts: {},
      source: { kind: "team" },
    });
    expect(
      (addUseCase(emptyRomEstimate(), "First") as { value: RomEstimate }).value
        .useCases[0].code,
    ).toBe("UC-1");
  });

  it("references only a register id, and sets a pod with a template or members", () => {
    const r = fixture();
    expect(setUnitHoursRef(r, "dashboard_view_count", "twenty")).toEqual({
      ok: false,
      reason: "Choose a register row such as DL3.",
    });
    expect(
      (
        setUnitHoursRef(r, "dashboard_view_count", "DL7") as {
          value: RomEstimate;
        }
      ).value.unitHours.dashboard_view_count,
    ).toEqual({ kind: "register", registerId: "DL7" });
    expect(
      setPod(r, {
        locationCode: " ",
        templateCode: "P",
        providerClassCode: null,
        rateBasis: "loaded_cost",
      }),
    ).toMatchObject({ ok: false });
    expect(
      setPod(r, {
        locationCode: "L",
        providerClassCode: null,
        rateBasis: "loaded_cost",
      }),
    ).toMatchObject({ ok: false });
    expect(
      setPod(r, {
        locationCode: "L",
        templateCode: "P",
        providerClassCode: null,
        rateBasis: "loaded_cost",
      }),
    ).toMatchObject({ ok: true });
    expect(approveMapping(r, "ROL-LEAD", "me", AT)).toEqual({
      ok: false,
      reason: "That pod member has no proposed mapping.",
    });
  });

  it("sources every factor and keeps each in range", () => {
    const f = (value: number, source = "s") => ({ value, source });
    expect(
      setFactors(fixture(), {
        friction: f(1.1),
        productiveShare: f(0.65),
        hoursPerFteWeek: f(40, " "),
      }),
    ).toEqual({ ok: false, reason: "Each factor needs a source." });
    expect(
      setFactors(fixture(), {
        friction: f(0),
        productiveShare: f(0.65),
        hoursPerFteWeek: f(40),
      }),
    ).toEqual({ ok: false, reason: "Friction must be above 0." });
    expect(
      setFactors(fixture(), {
        friction: f(1),
        productiveShare: f(1.2),
        hoursPerFteWeek: f(40),
      }),
    ).toEqual({
      ok: false,
      reason: "Productive share must be above 0 and at most 1.",
    });
    expect(
      setFactors(fixture(), {
        friction: f(1),
        productiveShare: f(1),
        hoursPerFteWeek: f(0),
      }),
    ).toEqual({ ok: false, reason: "Hours per FTE-week must be above 0." });
    const ok = setFactors(fixture(), {
      friction: f(1.2, " [A:DL4] "),
      productiveShare: f(1),
      hoursPerFteWeek: f(38),
    });
    expect(ok).toMatchObject({
      ok: true,
      value: {
        friction: { value: 1.2, source: "[A:DL4]" },
        productiveShare: { value: 1 },
        hoursPerFteWeek: { value: 38 },
      },
    });
  });

  it("adds and removes releases, moving the foundation to the newest carrier", () => {
    const r = { ...fixture(), releases: null };
    expect(
      addRelease(r, {
        name: " ",
        useCaseCodes: ["UC-1"],
        designStatus: "not_designed",
      }),
    ).toEqual({ ok: false, reason: "A release needs a name." });
    expect(
      addRelease(r, {
        name: "Pilot",
        useCaseCodes: [],
        designStatus: "not_designed",
      }),
    ).toEqual({ ok: false, reason: "A release groups at least one use case." });
    expect(
      addRelease(r, {
        name: "Pilot",
        useCaseCodes: ["UC-1"],
        designStatus: "designed",
      }),
    ).toEqual({
      ok: false,
      reason: "A designed release needs its five range inputs.",
    });
    const one = (
      addRelease(r, {
        name: "Pilot",
        useCaseCodes: ["UC-1"],
        designStatus: "not_designed",
        carriesFoundation: true,
      }) as { value: RomEstimate }
    ).value;
    const two = (
      addRelease(one, {
        name: "Scale",
        useCaseCodes: ["UC-2", "UC-3"],
        designStatus: "not_designed",
        carriesFoundation: true,
      }) as { value: RomEstimate }
    ).value;
    expect(
      two.releases?.items.map((x) => [x.code, x.carriesFoundation ?? false]),
    ).toEqual([
      ["R1", false],
      ["R2", true],
    ]);
    expect(two.releases?.source).toEqual({ kind: "team" });
    expect(acceptReleases(two, "me", AT)).toMatchObject({ ok: true });
    const removed = (removeRelease(two, "R2") as { value: RomEstimate }).value;
    expect(removed.releases?.items.map((x) => x.code)).toEqual(["R1"]);
    expect(acceptReleases(removed, "me", AT)).toMatchObject({ ok: false });
    expect(
      (removeRelease(removed, "R1") as { value: RomEstimate }).value.releases,
    ).toBeNull();
    expect(removeRelease(removed, "R9")).toEqual({
      ok: false,
      reason: "There is no release R9.",
    });
    expect(acceptReleases({ ...r }, "me", AT)).toEqual({
      ok: false,
      reason: "There is no release grouping to accept.",
    });
  });
});

describe("display formatting", () => {
  it("formats money, weeks, allocation and factors without computing an estimate", () => {
    expect(formatRomMoney(15_600_000)).toBe("$0.16M");
    expect(formatRomMoney(95_000)).toBe("$950");
    expect(formatRomWeeks(1)).toBe("1 wk");
    expect(formatRomWeeks(9)).toBe("9 wks");
    expect(formatAllocation(0.25)).toBe("25%");
    expect(formatAllocation(2)).toBe("2 FTE");
    expect(formatFactor("friction", 1.1)).toBe("×1.10");
    expect(formatFactor("share", 0.65)).toBe("65%");
    expect(formatFactor("week", 40)).toBe("40 h per FTE-week");
  });
});

describe("filling counts from notes", () => {
  const NOTES = [
    "Session 4.",
    "UC-2 lineage is about 6 sources, 30 source tables, 4 entities, 2 views, 55 design rows, 80 validation rows.",
    "UC-1 is now 9 sources.",
    "UC-4 quality quarantine zone is 2 sources and 5 tables.",
    "Unit hours for views are 20 h each at $95 per hour.",
  ].join("\n");

  it("drafts counts verbatim into open use cases, and adds a named new one", () => {
    const proposals = proposeRomCountsFromNotes(NOTES, fixture());
    expect(proposals).toEqual([
      {
        code: "UC-2",
        counts: {
          data_source_count: 6,
          source_table_count: 30,
          standard_data_entity_count: 4,
          dashboard_view_count: 2,
          design_row_count: 55,
          validation_row_count: 80,
        },
        excerpt:
          "UC-2 lineage is about 6 sources, 30 source tables, 4 entities, 2 views, 55 design rows, 80 validation rows.",
        line: 2,
      },
      {
        code: "UC-4",
        newName: "quality quarantine zone",
        counts: { data_source_count: 2, source_table_count: 5 },
        excerpt: "UC-4 quality quarantine zone is 2 sources and 5 tables.",
        line: 4,
      },
    ]);
    expect(proposalDrivers(proposals[1])).toEqual([
      "data_source_count",
      "source_table_count",
    ]);
  });

  it("never overwrites a confirmed row or a typed count, and fills no unit hours or rates", () => {
    const typed = (
      setCount(fixture(), "UC-2", "data_source_count", "5") as {
        value: RomEstimate;
      }
    ).value;
    const next = applyRomNotesProposals(
      typed,
      proposeRomCountsFromNotes(NOTES, typed),
    );
    expect(next.useCases[0]).toEqual(typed.useCases[0]);
    expect(next.useCases[1].counts.data_source_count).toBe(5);
    expect(next.useCases[1].counts.source_table_count).toBe(30);
    expect(next.useCases[1].source).toEqual({
      kind: "session_notes",
      citation: "your notes, line 2",
      excerpt: NOTES.split("\n")[1],
    });
    expect(next.useCases[1].confirmedAt).toBeUndefined();
    expect(next.useCases[3]).toMatchObject({
      code: "UC-4",
      name: "quality quarantine zone",
      source: { kind: "session_notes" },
    });
    expect(next.unitHours).toEqual(typed.unitHours);
    expect(next.pod).toEqual(typed.pod);
    expect(next.friction).toEqual(typed.friction);
  });

  it("fills the foundation by name, and ignores a sentence with no counts or no use case", () => {
    const r = {
      ...fixture(),
      foundation: {
        ...fixture().foundation!,
        confirmedAt: undefined,
        confirmedBy: undefined,
      },
    };
    const p = proposeRomCountsFromNotes(
      "The shared foundation needs 3 entities.\nPilot first, then scale.\nAbout 4 tables somewhere.",
      r,
    );
    expect(p).toEqual([
      {
        code: "FOUNDATION",
        counts: { standard_data_entity_count: 3 },
        excerpt: "The shared foundation needs 3 entities.",
        line: 1,
      },
    ]);
    expect(proposeRomCountsFromNotes("UC-7 is 3 sources.", r)).toEqual([]);
    // "source tables" are tables, never sources.
    expect(
      proposeRomCountsFromNotes("UC-3 needs 12 source tables.", r),
    ).toEqual([
      {
        code: "UC-3",
        counts: { source_table_count: 12 },
        excerpt: "UC-3 needs 12 source tables.",
        line: 1,
      },
    ]);
  });
});

describe("the capture-text dispatcher", () => {
  it("reads the record as ranked text, with figures labelled and register rows cited", () => {
    const { record, register } = settled();
    const approved = (
      approveRomEstimate(
        record,
        register,
        fakeRom(record, register),
        "me",
        AT,
      ) as { value: RomEstimate }
    ).value;
    const text = captureValueText(
      "rom_estimate",
      serializeRomEstimate(approved),
    );
    const lines = text.split("\n");
    expect(lines[0]).toBe("Bottom-up estimate (ROM) inputs, in order:");
    expect(text.indexOf("1. Counts")).toBeLessThan(
      text.indexOf("2. Unit hours"),
    );
    expect(text.indexOf("2. Unit hours")).toBeLessThan(
      text.indexOf("3. Delivery pod"),
    );
    expect(text.indexOf("3. Delivery pod")).toBeLessThan(
      text.indexOf("4. Factors"),
    );
    expect(text.indexOf("4. Factors")).toBeLessThan(
      text.indexOf("5. Releases"),
    );
    expect(text).toContain(
      "   UC-2 Lineage and controlled serving: 6 data sources, 30 source tables, 2 dashboard views (from session notes (delivery notes, Oct 16, p.2), confirmed by me on 2026-10-16)",
    );
    expect(text).toContain("   Shared foundation, counted once in R1:");
    expect(text).toContain(
      "   Dashboard views: [A:DL3] from the assumptions register",
    );
    expect(text).toContain(
      "   Standard data entities: ESTIMATE 16 h per standard data entity, approved benchmark BM-ENT-01",
    );
    expect(text).toContain(
      "Analytics engineer, Mid, 1 FTE (mapped from BI developer, approved by me)",
    );
    expect(text).toContain(
      "4. Factors: friction ESTIMATE ×1.10 ([A:DL4] confirmed); productive share ESTIMATE 65% (approved benchmark BM-PROD-02); capacity ESTIMATE 40 h per FTE-week (40-hour week per allocated FTE)",
    );
    expect(text).toContain("5. Releases (accepted by me on 2026-10-16):");
    expect(text).toContain(
      "Approved estimate: snapshot v1, approved by me on 2026-10-16. ESTIMATE, low / plan / high:",
    );
    expect(text).toContain(
      "   Combined, foundation counted once: 1,230 h, 15 wks, $0.18M / $0.24M / $0.36M",
    );
    expect(text).toContain(
      "   Shared foundation (counted once, in R1): 300 h, 4 wks, $48.0K / $64.0K / $96.0K",
    );
    const stale = captureValueText(
      "rom_estimate",
      serializeRomEstimate(reopenCounts(approved)),
    );
    expect(stale).toContain("(inputs changed since; not current)");
    expect(
      captureValueText("rom_estimate", serializeRomEstimate(fixture())),
    ).toContain("Estimate not yet approved.");
    expect(
      captureValueText("rom_estimate", serializeRomEstimate(fixture())),
    ).toContain("(proposed mapping from BI developer, unapproved)");
    const tpl = {
      ...fixture(),
      pod: {
        templateCode: "POD-7",
        templateName: "Data product pod",
        locationCode: "LOC",
        providerClassCode: null,
        rateBasis: "loaded_cost" as const,
      },
    };
    expect(
      captureValueText("rom_estimate", serializeRomEstimate(tpl)),
    ).toContain("3. Delivery pod: template Data product pod (LOC)");
  });

  it("gives the gate only the team's own names, never a figure", () => {
    expect(
      captureValueGateText("rom_estimate", serializeRomEstimate(fixture())),
    ).toBe(
      [
        "Certified measure layer",
        "Lineage and controlled serving",
        "Purpose-bound access",
        "Shared foundation",
        "Pilot · certified measures",
        "Scale · lineage and access",
      ].join("\n"),
    );
  });

  it("returns anything that is not the record exactly as written", () => {
    expect(captureValueText("rom_estimate", "about 400 hours")).toBe(
      "about 400 hours",
    );
    expect(captureValueGateText("rom_estimate", "about 400 hours")).toBe(
      "about 400 hours",
    );
  });
});
