import {
  acceptCoverage,
  architectureChoiceGateText,
  architectureChoiceText,
  chooseOption,
  confirmWhy,
  coverageElements,
  coverageFor,
  coverageOpenCount,
  explainCoverage,
  isCoverageAccepted,
  isWhyConfirmed,
  markCoverage,
  optionComparison,
  parseArchitectureChoice,
  reopenCoverage,
  serializeArchitectureChoice,
  type ArchitectureChoice,
  type ChoiceEdit,
} from "@/lib/programs/architecture-choice";
import {
  captureValueGateText,
  captureValueText,
} from "@/lib/programs/structured-capture-text";
import {
  serializeDesignTraceability,
  parseDesignTraceability,
} from "@/lib/programs/design-traceability";
import { serializeRootCauseRegister } from "@/lib/programs/root-cause-register";
import type {
  P3OptionSet,
  P3SolutionOption,
} from "@/lib/programs/phase-templates/p3-option-assembler";

const P2 = serializeRootCauseRegister({
  kind: "root_cause_register",
  version: 1,
  orderConfirmedAt: "2026-10-02",
  causes: [
    {
      id: "RC-2",
      cause: "Definitions conflict",
      short: "definitions",
      status: "accepted",
      evidence: ["Profile"],
    },
    {
      id: "RC-3",
      cause: "No lineage",
      short: "lineage",
      status: "accepted",
      evidence: ["Inventory"],
    },
    {
      id: "RC-4",
      cause: "Identity unresolved",
      short: "identity",
      status: "known_gap",
      owner: "MDM lead",
    },
    {
      id: "RC-6",
      cause: "Defects reach reports",
      short: "quality",
      status: "accepted",
      evidence: ["Profile"],
    },
  ],
});

const TRACE = parseDesignTraceability(
  serializeDesignTraceability({
    kind: "design_traceability",
    version: 1,
    links: [
      {
        causeId: "RC-2",
        cause: "Definitions conflict",
        rank: 1,
        status: "accepted",
        element: "Certified semantic layer: a governed measure register",
      },
      {
        causeId: "RC-3",
        cause: "No lineage",
        rank: 2,
        status: "accepted",
        element: "Captured at intake and at every transform",
      },
      {
        causeId: "RC-4",
        cause: "Identity unresolved",
        rank: 3,
        status: "handed_off",
        program: "Master-data program",
        owner: "Dana Ruiz",
      },
      {
        causeId: "RC-6",
        cause: "Defects reach reports",
        rank: 4,
        status: "accepted",
        element: "Quarantine zone held until a steward releases it",
      },
    ],
  }),
)!;

function clientOption(
  id: string,
  name: string,
  c: { scope: string; benefit: string; tradeoff: string; condition: string },
): P3SolutionOption {
  return {
    id,
    label: name,
    summary: c.benefit,
    businessImpact: c.benefit,
    requiredBuildingBlocks: [],
    dataPlatformImplications: "",
    humanAiSplit: "",
    controls: "",
    timeToValue: "",
    effort: "",
    risks: [c.tradeoff],
    dependencies: [],
    reusePotential: "",
    readinessConditions: [c.condition],
    notRecommendedYetReasons: [],
    scores: {} as P3SolutionOption["scores"],
    totalScore: 0,
    confidence: "low",
    recommended: false,
    recommendationLabel: "Client-supplied option",
    evidenceBasis: [],
    missingEvidence: [],
    clientSupplied: c,
  };
}

const SET: P3OptionSet = {
  moveId: "m1",
  source: "move_uploaded_options",
  sourceTitle: "Architecture options deck",
  useCasePattern: "generic_governed_ai" as P3OptionSet["useCasePattern"],
  options: [
    clientOption("OPT-A", "Configure", {
      scope: "Govern the existing warehouse: owners and purpose-bound access.",
      benefit: "Fastest visible progress.",
      tradeoff: "Lineage only partly; quality untouched.",
      condition: "The warehouse licence holds.",
    }),
    clientOption("OPT-B", "Build", {
      scope:
        "Governed medallion layers with a certified semantic layer and lineage captured at every transform.",
      benefit: "Certifies measures before any AI use.",
      tradeoff: "Identity is left to the master-data program.",
      condition: "The master-data program owns identity, in writing.",
    }),
  ],
  recommendedOptionId: null,
  recommendationConfidence: "low",
  missingEvidence: [],
  evidenceBasis: [],
  usedGlobalStaticFallback: false,
};

const done = (edit: ChoiceEdit): ArchitectureChoice => {
  if (!edit.ok) throw new Error(edit.reason);
  return edit.value;
};
const ELEMENTS = coverageElements(P2, TRACE);
const el = (id: string) => ELEMENTS.find((e) => e.causeId === id)!;
const chooseB = () =>
  done(chooseOption(SET, "OPT-B", ELEMENTS, "me", "2026-10-09"));

describe("coverageElements", () => {
  it("are Step 1's settled rows in rank; a hand-off is listed, not asked", () => {
    expect(
      ELEMENTS.map((e) => [e.causeId, e.short, Boolean(e.element), e.handedTo]),
    ).toEqual([
      ["RC-2", "definitions", true, undefined],
      ["RC-3", "lineage", true, undefined],
      ["RC-4", "identity", false, "Master-data program"],
      ["RC-6", "quality", true, undefined],
    ]);
  });
});

describe("optionComparison", () => {
  it("shows the client's fields as written, no scores, and drops fields no option fills", () => {
    const c = optionComparison(SET);
    expect(c.options).toEqual([
      { id: "OPT-A", label: "Configure" },
      { id: "OPT-B", label: "Build" },
    ]);
    expect(c.fields.map((f) => f.label)).toEqual([
      "Scope",
      "Benefit",
      "Tradeoff",
      "Condition",
    ]);
    expect(c.fields.some((f) => f.estimateSource)).toBe(false);
  });

  it("leaves out a field no option fills", () => {
    const noConditions: P3OptionSet = {
      ...SET,
      options: SET.options.map((o) => ({
        ...o,
        clientSupplied: { ...o.clientSupplied!, condition: "" },
      })),
    };
    expect(optionComparison(noConditions).fields.map((f) => f.label)).toEqual([
      "Scope",
      "Benefit",
      "Tradeoff",
    ]);
  });

  it("marks a template set's effort and time to value as template estimates", () => {
    const template: P3OptionSet = {
      ...SET,
      source: "p3_design_inputs_pack",
      sourceTitle: undefined,
      options: SET.options.map((o) => ({
        ...o,
        clientSupplied: undefined,
        effort: "Medium effort.",
        timeToValue: "Twelve weeks.",
      })),
    };
    const fields = optionComparison(template).fields;
    expect(fields.find((f) => f.label === "Effort")).toMatchObject({
      estimateSource: "template estimate",
      values: ["Medium effort.", "Medium effort."],
    });
    expect(
      fields.find((f) => f.label === "Scope")?.estimateSource,
    ).toBeUndefined();
  });
});

describe("chooseOption", () => {
  it("pre-marks Covers as aVa's draft only where the option's scope or benefit names the element", () => {
    const choice = chooseB();
    expect(choice.coverage).toEqual([
      expect.objectContaining({
        causeId: "RC-2",
        mark: "covers",
        source: "ava",
      }),
      expect.objectContaining({
        causeId: "RC-3",
        mark: "covers",
        source: "ava",
      }),
    ]);
    // A's tradeoff names lineage and quality; a tradeoff is not a claim.
    expect(
      done(chooseOption(SET, "OPT-A", ELEMENTS, "me", "d")).coverage,
    ).toEqual([]);
  });

  it("does not pre-mark on a short name too short to be a name", () => {
    const withAi = ELEMENTS.map((e) =>
      e.causeId === "RC-6" ? { ...e, short: "ai" } : e,
    );
    // B's benefit says "before any AI use"; two letters are not a name.
    expect(
      done(chooseOption(SET, "OPT-B", withAi, "me", "d")).coverage.map(
        (c) => c.causeId,
      ),
    ).toEqual(["RC-2", "RC-3"]);
  });

  it("refuses an option outside the set", () => {
    expect(chooseOption(SET, "OPT-Z", ELEMENTS, "me", "d").ok).toBe(false);
  });
});

describe("coverage", () => {
  it("is open until every asked element is marked, and Partly needs a how", () => {
    let choice = chooseB();
    expect(coverageOpenCount(choice, ELEMENTS)).toBe(1);
    expect(acceptCoverage(choice, ELEMENTS, "me", "d").ok).toBe(false);
    choice = done(markCoverage(choice, el("RC-6"), "partly"));
    expect(coverageOpenCount(choice, ELEMENTS)).toBe(1);
    choice = done(
      explainCoverage(choice, el("RC-6"), "Release step in package C"),
    );
    expect(coverageOpenCount(choice, ELEMENTS)).toBe(0);
    choice = done(acceptCoverage(choice, ELEMENTS, "me", "2026-10-09"));
    expect(isCoverageAccepted(choice, ELEMENTS)).toBe(true);
    expect(choice.coverage.every((c) => c.source === "team")).toBe(true);
    expect(isCoverageAccepted(reopenCoverage(choice), ELEMENTS)).toBe(false);
  });

  it("an edit after acceptance takes the acceptance back", () => {
    let choice = done(markCoverage(chooseB(), el("RC-6"), "covers"));
    choice = done(acceptCoverage(choice, ELEMENTS, "me", "d"));
    choice = done(markCoverage(choice, el("RC-2"), "no"));
    expect(choice.coverageAcceptedAt).toBeUndefined();
  });

  it("asks again when Step 1 rewrites an element", () => {
    let choice = done(markCoverage(chooseB(), el("RC-6"), "covers"));
    choice = done(acceptCoverage(choice, ELEMENTS, "me", "d"));
    const rewritten = ELEMENTS.map((e) =>
      e.causeId === "RC-6"
        ? { ...e, element: "A different quality design" }
        : e,
    );
    expect(
      coverageFor(choice, rewritten.find((e) => e.causeId === "RC-6")!),
    ).toBeUndefined();
    expect(isCoverageAccepted(choice, rewritten)).toBe(false);
  });

  it("does not ask a handed-off element", () => {
    expect(markCoverage(chooseB(), el("RC-4"), "covers").ok).toBe(false);
  });

  it("refuses a how on Covers", () => {
    expect(explainCoverage(chooseB(), el("RC-2"), "x").ok).toBe(false);
  });
});

describe("why", () => {
  it("is confirmed only while the recommendation still reads as confirmed", () => {
    const choice = done(
      confirmWhy(chooseB(), "  B certifies measures.  ", "me", "d"),
    );
    expect(isWhyConfirmed(choice, "B certifies measures.")).toBe(true);
    expect(isWhyConfirmed(choice, "B certifies measures, edited.")).toBe(false);
    expect(confirmWhy(chooseB(), " ", "me", "d").ok).toBe(false);
  });
});

describe("round trip and text", () => {
  it("parses what it serializes and rejects other shapes", () => {
    const choice = done(
      explainCoverage(
        done(markCoverage(chooseB(), el("RC-6"), "no")),
        el("RC-6"),
        "Gap owner: quality lead",
      ),
    );
    expect(
      parseArchitectureChoice(serializeArchitectureChoice(choice)),
    ).toEqual(choice);
    expect(parseArchitectureChoice("Option B")).toBeNull();
    expect(parseArchitectureChoice('{"kind":"other","version":1}')).toBeNull();
  });

  it("reads as text for the build, and gives the gate only the team's words", () => {
    let choice = done(markCoverage(chooseB(), el("RC-6"), "partly"));
    choice = done(
      explainCoverage(choice, el("RC-6"), "Release step in package C"),
    );
    const textOut = architectureChoiceText(choice);
    expect(textOut).toContain(
      "Chosen option: OPT-B · Build (as written in Architecture options deck), chosen by me on 2026-10-09.",
    );
    expect(textOut).toContain("(not yet accepted)");
    expect(textOut).toContain(
      "RC-6 Quarantine zone held until a steward releases it → Partly: Release step in package C",
    );
    expect(architectureChoiceGateText(choice)).toBe(
      "Release step in package C",
    );
  });
});

describe("structured capture text", () => {
  it("routes the architecture choice through both text readers", () => {
    let choice = done(markCoverage(chooseB(), el("RC-6"), "partly"));
    choice = done(
      explainCoverage(choice, el("RC-6"), "Release step in package C"),
    );
    const raw = serializeArchitectureChoice(choice);
    expect(captureValueText("architecture_choice", raw)).toBe(
      architectureChoiceText(choice),
    );
    expect(captureValueGateText("architecture_choice", raw)).toBe(
      "Release step in package C",
    );
    // Not a record: returned exactly as written.
    expect(captureValueText("architecture_choice", "Option B")).toBe(
      "Option B",
    );
  });
});
