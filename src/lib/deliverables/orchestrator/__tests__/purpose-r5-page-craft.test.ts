/**
 * Round-5 page craft: the rules that took the purpose exports from "correct" to "readable".
 *
 * Four fresh outputs held at 72-74 against an 85 bar across twenty regenerations. Several of the
 * defects the reviewer kept naming were not the writer's at all -- deterministic code produced them
 * and the writer was told to copy the result verbatim. Each rule below is checked in code, with no
 * model judgement, so it cannot drift the way prompt wording did.
 *
 * Fixtures are synthetic and shaped like the defects observed, not copies of any tenant's output.
 */
import { deckContract } from "../../shared/deck-story-contract";
import { purposeFixture } from "../__fixtures__/purpose-pages";
import {
  purposePhasePrompt,
  validatePurposeStory,
} from "../purpose-story-contract";
import {
  PURPOSE_TITLE_MAX_CHARS,
  planPurposePages,
  purposeChartHeadline,
  purposeChartTrend,
  purposeFlowSteps,
  purposeStatusLabel,
  withSourceColumn,
  withoutConstantColumns,
  type PurposeChart,
} from "../purpose-page-plan";

function series(
  metric: string,
  unit: string,
  values: number[],
  key = metric.toLowerCase().replace(/\W+/g, "-"),
): PurposeChart {
  return {
    key,
    title: metric,
    metric,
    unit,
    period: "Twelve synthetic months",
    sourceIds: [1],
    interpretation: "No causal effect is established.",
    points: values.map((value, i) => ({
      label: `Month ${i + 1}`,
      value,
      sourceRow: `synthetic:row-${i + 1}`,
    })),
  };
}

/** A per-cent series that wanders about two points around seventy-five, then ends a point up. */
const flatRate = series(
  "First-contact resolution",
  "Percent of eligible contacts",
  [74.8, 74.2, 73.9, 74.1, 73.6, 72.9, 73.4, 74, 74.8, 75.1, 75.4, 75.7],
);
/** A volume series that grows by about a fifth over the same window. */
const growingVolume = series(
  "Offered calls per month",
  "Calls, thousands",
  [365, 378, 392, 381, 394, 407, 396, 410, 423, 412, 425, 438],
);

describe("R5 §5 — a direction word must match the bound data", () => {
  it("refuses 'recovers after a dip' for a series that barely moved", () => {
    // The defect: any series ending above its start, with one lower interior point, was called a
    // recovery. This one moves under a point end to end, and never strays three points from its mean.
    const trend = purposeChartTrend(flatRate);
    expect(trend.direction).toBe("steady");
    expect(trend.phrase).toBe("holds broadly steady");
    expect(purposeChartHeadline([flatRate])).not.toMatch(/recover|dip/);
  });

  it("accepts 'increases' for a series that grew by a fifth", () => {
    expect(purposeChartTrend(growingVolume).direction).toBe("rises");
    expect(purposeChartHeadline([growingVolume])).toContain(
      "increases overall",
    );
  });

  it("still names a recovery when the dip and the climb are both material", () => {
    const recovering = series("Resolved cases", "count", [40, 31, 47]);
    expect(purposeChartTrend(recovering).direction).toBe("recovers");
  });

  it("names a material dip that ends where it started, rather than calling it steady", () => {
    // Neither 'holds steady' nor 'recovers' is true of a series that fell hard and came back level.
    const dipping = series("Queue depth", "count", [100, 70, 100]);
    expect(purposeChartTrend(dipping).phrase).toBe(
      "dips and returns to its starting level",
    );
  });

  it("measures a per-cent series in points, not as a share of its mean", () => {
    // Five per cent of seventy-five is 3.75 points; the rule for a rate is three points.
    const rate = series("Approval rate", "percent", [70, 70.5, 73.2]);
    expect(purposeChartTrend(rate).direction).toBe("rises");
    const volume = series("Approvals", "count", [70, 70.5, 73.2]);
    expect(purposeChartTrend(volume).direction).toBe("steady");
  });
});

describe("R5 §3 — a computed headline is one clause that fits on a title line", () => {
  it("never joins two series with a semicolon", () => {
    // Two charts used to be joined with '; ', so every two-chart page carried two findings and a
    // capital letter in the middle of its title -- which the writer then copied verbatim.
    const headline = purposeChartHeadline([growingVolume, flatRate]);
    expect(headline).not.toContain(";");
    expect(headline.length).toBeLessThanOrEqual(PURPOSE_TITLE_MAX_CHARS);
  });

  it("leads with the series that moved when both will not fit", () => {
    expect(purposeChartHeadline([growingVolume, flatRate])).toBe(
      "Offered calls per month increases overall",
    );
  });

  it("joins two short series into one clause when they fit", () => {
    const a = series("Volume", "count", [100, 110, 125]);
    const b = series("Backlog", "count", [50, 50.5, 51]);
    expect(purposeChartHeadline([a, b])).toBe(
      "Volume increases overall while backlog holds broadly steady",
    );
  });

  it("does not lower-case an acronym that starts the second series", () => {
    const a = series("Volume", "count", [100, 110, 125]);
    const b = series("AHT", "sec", [600, 601, 602]);
    expect(purposeChartHeadline([a, b])).toContain("while AHT");
  });
});

describe("R5 §2 — client language, not taxonomy labels", () => {
  it("never renders the slash form", () => {
    for (const tone of ["candidate", "condition", "later", "risk"] as const)
      for (const label of [
        "Proposed decision",
        "Outside the evidence",
        "Later",
        "Access boundary",
      ])
        expect(purposeStatusLabel(tone, label)).not.toContain("/");
  });

  it("uses the reference decks' own words for each state", () => {
    expect(purposeStatusLabel("candidate", "Proposed decision")).toBe(
      "DESIGN CANDIDATE",
    );
    expect(purposeStatusLabel("candidate", "Supported now")).toBe(
      "SUPPORTED NOW",
    );
    expect(purposeStatusLabel("condition", "Condition")).toBe(
      "CONDITIONS TO CLOSE",
    );
    expect(purposeStatusLabel("later", "Later")).toBe("LATER APPROVAL");
  });

  it("keeps an item's own name as its label rather than discarding it", () => {
    // A risk called "Access boundary" names WHICH risk. Losing that would lose information, so only
    // the taxonomy prefix goes.
    expect(purposeStatusLabel("risk", "Access boundary")).toBe(
      "Access boundary",
    );
  });

  it("collapses a decision page to one row per state, keeping each item's name in its detail", () => {
    const doc = purposeFixture();
    doc.exhibits = [];
    doc.nextActions = [];
    doc.tables = [
      {
        key: "decision",
        title: "Decision",
        targetFormat: "pptx",
        pageShape: "decision",
        columns: ["Status", "Statement"],
        rowTones: ["candidate", "condition", "condition", "condition", "later"],
        rows: [
          ["Proposed decision", "Read-only assistance in one queue [1]."],
          ["Outside the evidence", "Confirm the cohort [1]."],
          ["Change assumption", "Confirm approved read interfaces [1]."],
          ["First release", "Confirm knowledge ownership [1]."],
          ["Later", "Build and live access need their own approval [1]."],
        ],
      },
    ];
    doc.deckSlides = [
      {
        key: "decision",
        governingMessage: "Proceed with a bounded read-only design",
        pageIntent: {
          question: "What is proposed?",
          scopeNote: "For review.",
          tableKey: "decision",
        },
      },
    ];
    const page = planPurposePages(doc).find((p) =>
      p.id.startsWith("decision"),
    )!;
    // A short decision page may be compacted into a register table; read it in whichever form it
    // ended up, since the claim is about what a reader sees, not about the internal shape.
    const labels = page.items.length
      ? page.items.map((i) => purposeStatusLabel(i.tone!, i.label))
      : page.rows!.map((r) => r[0]);
    const details = page.items.length
      ? page.items.map((i) => i.detail)
      : page.rows!.map((r) => r[1]);
    // Five rows, three states: the reference decision page carries it in three.
    expect(labels).toEqual([
      "DESIGN CANDIDATE",
      "CONDITIONS TO CLOSE",
      "LATER APPROVAL",
    ]);
    // Grouping drops the per-row label, not what it said.
    expect(details[1]).toContain("Outside the evidence: Confirm the cohort");
    expect(details[1]).toContain("First release: Confirm knowledge ownership");
  });

  it("does not group a readiness page whose conditions are distinct items", () => {
    // Grouping a list of named conditions would print one state where each item's name belongs;
    // outside the decision page each keeps its own row and name.
    const doc = purposeFixture();
    doc.exhibits = [];
    doc.nextActions = [];
    doc.tables = [
      {
        key: "readiness",
        title: "Readiness",
        targetFormat: "pptx",
        pageShape: "labelled_statements",
        columns: ["Condition", "Detail"],
        rowTones: ["condition", "condition", "condition"],
        rows: [
          ["Identity access", "Approve read access [1]."],
          ["Data quality", "Reconcile the baseline [1]."],
          ["Ownership", "Name the knowledge owner [1]."],
        ],
      },
    ];
    doc.deckSlides = [
      {
        key: "readiness",
        governingMessage: "Three conditions remain before build",
        pageIntent: {
          question: "What must close?",
          scopeNote: "For review.",
          tableKey: "readiness",
        },
      },
    ];
    const page = planPurposePages(doc).find((p) =>
      p.id.startsWith("readiness"),
    )!;
    const labels = page.items.length
      ? page.items.map((i) => purposeStatusLabel(i.tone!, i.label))
      : page.rows!.map((r) => r[0]);
    expect(labels).toEqual(["Identity access", "Data quality", "Ownership"]);
  });

  it("carries each row's state beside it, so colour does not depend on the label text", () => {
    // Colour used to be parsed back out of the label by splitting on " / ". With the slash gone,
    // a named row would have lost its colour; the state now travels with the row.
    const doc = purposeFixture();
    doc.exhibits = [];
    doc.nextActions = [];
    const tones = ["candidate", "risk", "condition", "later", "risk"] as const;
    doc.tables = [
      {
        key: "status",
        title: "Status",
        targetFormat: "pptx",
        pageShape: "labelled_statements",
        columns: ["Position", "Basis"],
        rowTones: [...tones],
        rows: tones.map((_, i) => [
          `Named item ${i}`,
          "Review the documented operating alternatives and the accountable owner before choosing the next route for delivery [1].",
        ]),
      },
    ];
    doc.deckSlides = [
      {
        key: "status",
        governingMessage: "Each position keeps its state",
        pageIntent: {
          question: "What is proposed?",
          scopeNote: "For review.",
          tableKey: "status",
        },
      },
    ];
    const pages = planPurposePages(doc).filter((p) =>
      p.id.startsWith("status"),
    );
    const toned = pages.flatMap((p) => p.rowTones ?? []);
    expect(toned).toEqual([...tones]);
  });
});

/** A complete P2 spine that passes every existing rule, so each case isolates one defect. */
function readout() {
  const doc = purposeFixture();
  doc.tables = [];
  doc.exhibits = [];
  doc.nextActions = [];
  doc.deckSlides = deckContract("REF_DECK_P2_DISCOVERY_READOUT").slides.map(
    (s) => ({
      key: s.id,
      governingMessage:
        s.id === "executive_answer"
          ? "Hold design until the definitions agree"
          : s.id.replaceAll("_", " "),
      points: ["Owner review is the next step."],
    }),
  );
  return doc;
}

describe("R5 §3 and §1 — what the writer authors on a page", () => {
  const errorsFor = (edit: (doc: ReturnType<typeof readout>) => void) => {
    const doc = readout();
    edit(doc);
    return validatePurposeStory(doc, []);
  };

  it("passes the clean spine, so every case below fails for its own reason", () => {
    expect(validatePurposeStory(readout(), [])).toEqual([]);
  });

  it.each([
    [
      "a title over 72 characters",
      "Routine lookups and authorization exceptions follow two recorded paths today",
      "title_too_long",
    ],
    [
      "a title carrying two findings",
      "Baselines reconcile; propose a bounded validation",
      "title_two_clauses",
    ],
    [
      "a citation code in the title",
      "Routine calls cross several sources [3]",
      "citation_in_title",
    ],
  ])("rejects %s", (_name, title, error) => {
    expect(
      errorsFor((doc) => {
        doc.deckSlides![1]!.governingMessage = title;
      }).join(),
    ).toContain(`purpose_story:${error}`);
  });

  it.each([
    [
      "a scope note opening 'This page'",
      "This page shows recorded steps; it does not establish frequency.",
      "caveat_this_page",
    ],
    [
      "a scope note over 110 characters",
      "Shows the recorded steps and timings for the two walkthrough cases supplied; not how often either of the paths occurs.",
      "caveat_too_long",
    ],
    [
      "a citation code in the scope note",
      "Shows recorded steps [2]; not frequency.",
      "citation_in_caveat",
    ],
  ])("rejects %s", (_name, scopeNote, error) => {
    expect(
      errorsFor((doc) => {
        doc.deckSlides![1]!.pageIntent = { question: "Q?", scopeNote };
      }).join(),
    ).toContain(`purpose_story:${error}`);
  });

  it("rejects the same scope note on two pages", () => {
    // Every page of the observed readout carried the same "This page… ; it does not…" frame.
    const errors = errorsFor((doc) => {
      for (const slide of doc.deckSlides!.slice(1, 3))
        slide.pageIntent = {
          question: "Q?",
          scopeNote: "Shows the recorded steps; not frequency.",
        };
    });
    expect(errors.join()).toContain("purpose_story:caveat_repeated");
  });

  it.each([
    "Shows the next decision; establishes no funding approval.",
    "Shows the proposed decision; does not authorize a build or benefit figure.",
    "Shows recorded steps for two cases; not how often each path occurs.",
    "Shows observed controls; not how consistently they are applied.",
  ])(
    "accepts the round-5 form without mistaking it for an absence claim: %s",
    (scopeNote) => {
      // The claim classifier recognises a disclaimer partly by a "this page… no" construction. If it
      // read the round-5 form as an unsupported absence, every compliant caveat would be rejected and
      // generation would stall -- so this pins that it does not.
      expect(
        errorsFor((doc) => {
          doc.deckSlides![0]!.governingMessage =
            "Measurement definitions differ";
          doc.deckSlides![0]!.pageIntent = {
            question: "Next decision?",
            scopeNote,
            takeaway: "Hold design until definitions agree.",
          };
        }),
      ).toEqual([]);
    },
  );

  it("tells the writer the same limits it is checked against", () => {
    const prompt = purposePhasePrompt("discovery_readout");
    expect(prompt).toContain("at most 72 characters");
    expect(prompt).toContain("at most 110 characters");
    expect(prompt).toContain("never starting 'This page'");
  });
});

describe("R5 §4 — a column that says the same thing on every row says it once", () => {
  const handoffs = {
    columns: ["From", "To", "Handoff"],
    rows: [
      ["Intake", "Review", "Declared connection"],
      ["Review", "Decision", "Declared connection"],
      ["Decision", "Record", "Declared connection"],
    ],
  };

  it("removes the constant column and states its value once in the header", () => {
    const table = withoutConstantColumns(handoffs);
    expect(table.columns).toEqual([
      "From (handoff: Declared connection)",
      "To",
    ]);
    expect(table.rows).toEqual([
      ["Intake", "Review"],
      ["Review", "Decision"],
      ["Decision", "Record"],
    ]);
  });

  it("keeps a shared status visible rather than dropping it", () => {
    // The safety half. A register whose every row is pending must not read as settled once the
    // repeated word is removed, so the status moves to the header instead of disappearing.
    const table = withoutConstantColumns({
      columns: ["Action", "Owner", "Approval"],
      rows: [
        ["Reconcile baseline", "Finance lead", "Pending"],
        ["Confirm cohort", "Operations lead", "Pending"],
        ["Approve read access", "Security lead", "Pending"],
      ],
    });
    expect(table.columns[0]).toBe("Action (approval: Pending)");
    expect(table.columns).not.toContain("Approval");
  });

  it.each([
    [
      "two rows, where 'every row' is coincidence",
      {
        columns: ["A", "B", "C"],
        rows: [
          ["1", "2", "x"],
          ["3", "4", "x"],
        ],
      },
    ],
    [
      "two columns, where removing one leaves a list",
      {
        columns: ["A", "B"],
        rows: [
          ["1", "x"],
          ["2", "x"],
          ["3", "x"],
        ],
      },
    ],
    [
      "a column whose rows cite different sources",
      {
        columns: ["A", "B", "C"],
        rows: [
          ["1", "2", "Declared [1]"],
          ["3", "4", "Declared [2]"],
          ["5", "6", "Declared [1]"],
        ],
      },
    ],
    [
      "a long sentence repeated down a column",
      {
        columns: ["A", "B", "C"],
        rows: [
          ["1", "2", "This long statement repeats on every row of the table"],
          ["3", "4", "This long statement repeats on every row of the table"],
          ["5", "6", "This long statement repeats on every row of the table"],
        ],
      },
    ],
  ])("leaves a table alone with %s", (_name, table) => {
    expect(withoutConstantColumns(table)).toEqual(table);
  });

  it("keeps a cited constant column, so its source stays on the page", () => {
    // The page footer lists the evidence that stays visible. Removing a cited column would leave its
    // value in the header with the source gone from the footer -- a claim with nothing behind it.
    expect(
      withoutConstantColumns({
        columns: ["Step", "Owner", "Status"],
        rows: [
          ["Intake", "Desk", "Recorded [2]"],
          ["Review", "Lead", "Recorded [2]"],
          ["Decision", "Sponsor", "Recorded [2]"],
        ],
      }).columns,
    ).toEqual(["Step", "Owner", "Status"]);
  });

  it("never drops a source from the page when a column goes", () => {
    const doc = purposeFixture();
    doc.exhibits = [];
    doc.nextActions = [];
    doc.tables = [
      {
        key: "steps",
        title: "Steps",
        targetFormat: "pptx",
        columns: ["Step", "Owner", "Status"],
        rows: [
          ["Intake", "Desk [1]", "Recorded [2]"],
          ["Review", "Lead [1]", "Recorded [2]"],
          ["Decision", "Sponsor [1]", "Recorded [2]"],
        ],
      },
    ];
    doc.deckSlides = [
      {
        key: "steps",
        governingMessage: "Three recorded steps reach a decision",
        pageIntent: {
          question: "How does work flow?",
          scopeNote: "For review.",
          tableKey: "steps",
        },
      },
    ];
    const page = planPurposePages(doc).find((p) => p.id.startsWith("steps"))!;
    expect(page.sources).toEqual(expect.arrayContaining([1, 2]));
  });
});

describe("R5 §6 — a repetition budget", () => {
  function readout() {
    const doc = purposeFixture();
    doc.tables = [];
    doc.exhibits = [];
    doc.nextActions = [];
    doc.deckSlides = deckContract("REF_DECK_P2_DISCOVERY_READOUT").slides.map(
      (s) => ({
        key: s.id,
        governingMessage:
          s.id === "executive_answer"
            ? "Hold design until the definitions agree"
            : s.id.replaceAll("_", " "),
        points: ["Owner review is the next step."],
      }),
    );
    return doc;
  }

  it("rejects the same takeaway label and sentence on two pages", () => {
    const doc = readout();
    for (const slide of doc.deckSlides!.slice(1, 3))
      slide.pageIntent = {
        question: "Q?",
        scopeNote: "",
        takeawayLabel: "Design constraint",
        takeaway: "An assist design should inherit these checks.",
      };
    expect(validatePurposeStory(doc, []).join()).toContain(
      "purpose_story:takeaway_repeated",
    );
  });

  it("allows the same label when the sentence differs", () => {
    const doc = readout();
    doc.deckSlides![1]!.pageIntent = {
      question: "Q?",
      scopeNote: "",
      takeawayLabel: "Design constraint",
      takeaway: "Inherit the verification check.",
    };
    doc.deckSlides![2]!.pageIntent = {
      question: "Q?",
      scopeNote: "",
      takeawayLabel: "Design constraint",
      takeaway: "Inherit the escalation route.",
    };
    expect(validatePurposeStory(doc, []).join()).not.toContain(
      "takeaway_repeated",
    );
  });

  it("rejects a takeaway that only repeats a row of its own table", () => {
    // The observed decision page ended with a "Proposed decision" line restating its first row.
    const doc = readout();
    doc.tables = [
      {
        key: "decision",
        title: "Decision",
        targetFormat: "pptx",
        columns: ["Status", "Statement"],
        rows: [
          ["Proposed decision", "Proceed with a bounded read-only design [1]."],
        ],
      },
    ];
    doc.deckSlides![1]!.pageIntent = {
      question: "Q?",
      scopeNote: "",
      tableKey: "decision",
      takeaway: "Proceed with a bounded read-only design.",
    };
    expect(validatePurposeStory(doc, []).join()).toContain(
      "purpose_story:takeaway_repeats_row",
    );
  });

  it("allows the decision once more on next steps, and rejects a third statement", () => {
    const decision = "Hold design until the definitions agree";
    const once = readout();
    once.deckSlides!.at(-1)!.pageIntent = {
      question: "Q?",
      scopeNote: "",
      takeaway: decision,
    };
    expect(validatePurposeStory(once, []).join()).not.toContain(
      "decision_restated",
    );
    const twice = readout();
    twice.deckSlides!.at(-1)!.pageIntent = {
      question: "Q?",
      scopeNote: "",
      takeaway: decision,
    };
    twice.deckSlides![3]!.points = [decision];
    expect(validatePurposeStory(twice, []).join()).toContain(
      "purpose_story:decision_restated",
    );
  });
});

describe("§4 recorded handoffs read as a flow", () => {
  const nodes = (n: number) =>
    Array.from({ length: n }, (_, i) => ({ id: `s${i}`, label: `Step ${i}` }));
  const chain = (n: number, label?: string) =>
    Array.from({ length: n - 1 }, (_, i) => ({
      from: `s${i}`,
      to: `s${i + 1}`,
      ...(label ? { label } : {}),
    }));
  const name = (id: string) => id;

  it("drops a handoff label that is identical on every step", () => {
    const flow = purposeFlowSteps(
      { nodes: nodes(4), edges: chain(4, "Declared connection") },
      name,
    );
    expect(flow?.steps.map((s) => s.id)).toEqual(["s0", "s1", "s2", "s3"]);
    expect(flow?.exceptionPath).toBeUndefined();
  });

  it("keeps the register when handoff labels differ per step, because they carry information", () => {
    const edges = chain(3).map((edge, i) => ({ ...edge, label: `Hand ${i}` }));
    expect(purposeFlowSteps({ nodes: nodes(3), edges }, name)).toBeNull();
  });

  it("states a branch once as the exception path", () => {
    const flow = purposeFlowSteps(
      {
        nodes: [...nodes(3), { id: "x", label: "Manual review" }],
        edges: [...chain(3), { from: "s1", to: "x", label: "No match" }],
      },
      (id) => `${id}!`,
    );
    expect(flow?.steps).toHaveLength(3);
    expect(flow?.exceptionPath).toBe("Step 1 → x! (No match)");
  });

  it("keeps the register for an unconnected node, too many steps, or a branch too long for one line", () => {
    expect(
      purposeFlowSteps({ nodes: nodes(3), edges: chain(3) }, name, 1),
    ).toBeNull();
    expect(
      purposeFlowSteps({ nodes: nodes(6), edges: chain(6) }, name),
    ).toBeNull();
    const long = "a very long branch condition ".repeat(5);
    expect(
      purposeFlowSteps(
        {
          nodes: [...nodes(3), { id: "x", label: "Review" }],
          edges: [...chain(3), { from: "s1", to: "x", label: long }],
        },
        name,
      ),
    ).toBeNull();
  });

  it("keeps the register when the declared order is not the path", () => {
    const flow = purposeFlowSteps(
      {
        nodes: nodes(4),
        edges: [
          { from: "s0", to: "s2" },
          { from: "s2", to: "s1" },
          { from: "s1", to: "s3" },
        ],
      },
      name,
    );
    expect(flow).toBeNull();
  });
});

describe("§1 table citations leave the sentences", () => {
  it("moves each row's codes into one final Source column and keeps differing cell sources for the notes", () => {
    const { table, cellSources } = withSourceColumn({
      columns: ["Finding", "Basis"],
      rows: [
        ["Handoffs repeat [1]", "Recorded sequence [2]."],
        ["Definitions differ", "Two glossaries [1, 2]."],
        ["Volume rises", "Monthly series [3]."],
      ],
    });
    expect(table.columns).toEqual(["Finding", "Basis", "Source"]);
    expect(table.rows).toEqual([
      ["Handoffs repeat", "Recorded sequence.", "[1, 2]"],
      ["Definitions differ", "Two glossaries.", "[1, 2]"],
      ["Volume rises", "Monthly series.", "[3]"],
    ]);
    expect(cellSources).toEqual(["Handoffs repeat: Finding [1], Basis [2]"]);
  });

  it("states a source shared by every row once in the footer, and leaves a declared Source column alone", () => {
    const same = {
      columns: ["Finding", "Basis"],
      rows: [
        ["A", "Seen [1]."],
        ["B", "Seen [1]."],
      ],
    };
    const shared = withSourceColumn(same);
    expect(shared.table.columns).toEqual(["Finding", "Basis"]);
    expect(shared.table.rows).toEqual([
      ["A", "Seen."],
      ["B", "Seen."],
    ]);
    expect(shared.sharedSources).toEqual([1]);
    const declared = {
      columns: ["Finding", "Source"],
      rows: [
        ["A [1]", "[1]"],
        ["B [2]", "[2]"],
      ],
    };
    expect(withSourceColumn(declared).table).toBe(declared);
  });

  it("keeps every source in the planned page footer after the move", () => {
    const doc = purposeFixture();
    doc.exhibits = [];
    doc.nextActions = [];
    doc.tables = [
      {
        key: "evidence",
        title: "Evidence",
        targetFormat: "pptx",
        columns: ["Finding", "Basis"],
        rows: [
          ["Workflow", "Recorded handoff [1]."],
          ["Comparison", "Separate observation [2]."],
        ],
      },
    ];
    doc.deckSlides = [
      {
        key: "evidence",
        governingMessage: "Separate findings retain their source",
        pageIntent: { question: "Q?", scopeNote: "", tableKey: "evidence" },
      },
    ];
    const page = planPurposePages(doc).find((p) =>
      p.columns?.includes("Source"),
    )!;
    expect(page.sources).toEqual(expect.arrayContaining([1, 2]));
  });
});

it("keeps a shared table source in the planned footer after it leaves the cells", () => {
  const doc = purposeFixture();
  doc.exhibits = [];
  doc.nextActions = [];
  doc.tables = [
    {
      key: "routes",
      title: "Routes",
      targetFormat: "pptx",
      pageShape: "comparison",
      columns: ["Route", "Why consider it"],
      rows: [
        ["Batch", "Lowest change [2]."],
        ["Live", "Freshest data [2]."],
      ],
    },
  ];
  doc.deckSlides = [
    {
      key: "routes",
      governingMessage: "Three routes remain open",
      // A cited takeaway makes the footer read visible evidence, so the shared source must be carried.
      pageIntent: {
        question: "Q?",
        scopeNote: "",
        takeaway: "Batch changes least [1].",
        tableKey: "routes",
      },
    },
  ];
  const page = planPurposePages(doc).find((p) => p.id.startsWith("routes"))!;
  expect(page.rows!.flat().join(" ")).not.toMatch(/\[\d/);
  expect(page.sources).toContain(2);
});

describe("§2 the decision page holds three rows", () => {
  const decisionDoc = (
    tones: ("candidate" | "condition" | "later" | "risk")[],
  ) => {
    const doc = readout();
    doc.tables.push({
      key: "decision",
      title: "Decision",
      targetFormat: "pptx",
      pageShape: "decision",
      columns: ["Status", "Statement"],
      rows: tones.map((tone, i) => [tone, `Statement ${i}`]),
      rowTones: tones,
    });
    return doc;
  };

  it("counts rows after grouping, so several conditions are one row", () => {
    const doc = decisionDoc([
      "candidate",
      "condition",
      "condition",
      "condition",
      "later",
    ]);
    expect(validatePurposeStory(doc, []).join()).not.toContain(
      "decision_rows_exceed",
    );
  });

  it("rejects a fourth state on the decision page", () => {
    const doc = decisionDoc(["candidate", "condition", "later", "risk"]);
    expect(validatePurposeStory(doc, []).join()).toContain(
      "purpose_story:decision_rows_exceed:decision",
    );
  });
});

describe("§5 an approximate figure keeps its qualifier on the canvas", () => {
  it.each([
    ["~703 sec", "~703 sec"],
    ["approximately 703 sec", "~703 sec"],
  ])("renders %s as %s", (written, shown) => {
    const doc = purposeFixture();
    doc.exhibits = [];
    doc.nextActions = [];
    doc.tables = [
      {
        key: "handle",
        title: "Handle time",
        targetFormat: "pptx",
        pageShape: "big_numbers",
        columns: ["Label", "Value", "Basis"],
        rows: [
          ["Planning handle time", written, "Planning-derived [1]"],
          ["Measured handle time", "638 sec", "Recorded row [1]"],
        ],
        valueUnits: ["sec", "sec"],
      },
    ];
    doc.deckSlides = [
      {
        key: "handle",
        governingMessage: "Handle-time definitions still conflict",
        pageIntent: { question: "Q?", scopeNote: "", tableKey: "handle" },
      },
    ];
    const page = planPurposePages(doc).find((p) => p.family === "big_numbers")!;
    expect(page.items[0]!.value).toBe(shown);
  });
});
