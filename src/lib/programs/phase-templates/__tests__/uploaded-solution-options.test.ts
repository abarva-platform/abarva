// The options offered for the design decision are the client's own when the
// Move's approved evidence declares them.

import {
  inferSelectedOptionId,
  parseUploadedSolutionOptions,
  type UploadedOptionEvidence,
} from "../uploaded-solution-options";
import { assembleP3SolutionOptions } from "../p3-option-assembler";
import type { P3DesignInputsPack } from "../types";

const OPTIONS_CSV = [
  "option_id,name,benefit,tradeoff,condition,scope",
  'OPT-A,Extend native assist,Lower integration surface,Feature limits uncertain,"Review contract, ACL and security","Configuration, integration, change"',
  "OPT-B,Governed modular assist layer,Cross-system context,More runtime responsibility,Validate APIs and latency,Foundation and retrieval",
  "OPT-C,Selective capability replacement,Addresses a structural limit,Migration risk,Only if gap evidence justifies it,Excluded until condition met",
].join("\n");

function evidence(
  partial: Partial<UploadedOptionEvidence>,
): UploadedOptionEvidence {
  return {
    title: "approach_options.csv",
    phase: 3,
    extractedText: OPTIONS_CSV,
    ...partial,
  };
}

describe("parseUploadedSolutionOptions", () => {
  it("reads the declared option set from CSV evidence, quoted fields intact", () => {
    const set = parseUploadedSolutionOptions([evidence({})]);
    expect(set?.sourceTitle).toBe("approach_options.csv");
    expect(set?.options.map((o) => o.id)).toEqual(["OPT-A", "OPT-B", "OPT-C"]);
    expect(set?.options[0]).toEqual({
      id: "OPT-A",
      name: "Extend native assist",
      benefit: "Lower integration surface",
      tradeoff: "Feature limits uncertain",
      condition: "Review contract, ACL and security",
      scope: "Configuration, integration, change",
    });
  });

  it("reads the same set from a structured table", () => {
    const set = parseUploadedSolutionOptions([
      evidence({
        extractedText: null,
        extractedStructured: {
          tables: [
            {
              title: "Options",
              headers: ["Option ID", "Name", "Benefit"],
              rows: [
                ["OPT-A", "Extend native assist", "Lower integration surface"],
                [
                  "OPT-B",
                  "Governed modular assist layer",
                  "Cross-system context",
                ],
              ],
            },
          ],
        },
      }),
    ]);
    expect(set?.options.map((o) => [o.id, o.name, o.tradeoff])).toEqual([
      ["OPT-A", "Extend native assist", ""],
      ["OPT-B", "Governed modular assist layer", ""],
    ]);
  });

  it("does not infer an option set from a table with no declared option id", () => {
    const csv =
      "name,benefit\nExtend native assist,Lower surface\nModular layer,Context";
    expect(
      parseUploadedSolutionOptions([evidence({ extractedText: csv })]),
    ).toBeNull();
  });

  it("does not treat an unrelated id column as an option id", () => {
    const csv = "id,name,owner\n1,Claims API,Ops\n2,CRM,Service";
    expect(
      parseUploadedSolutionOptions([evidence({ extractedText: csv })]),
    ).toBeNull();
  });

  it("ignores evidence from another phase", () => {
    expect(parseUploadedSolutionOptions([evidence({ phase: 2 })])).toBeNull();
    expect(
      parseUploadedSolutionOptions([evidence({ phase: null })]),
    ).not.toBeNull();
  });

  it("returns null for a single option: one option is not a decision", () => {
    const csv = "option_id,name\nOPT-A,Only one";
    expect(
      parseUploadedSolutionOptions([evidence({ extractedText: csv })]),
    ).toBeNull();
  });

  it("returns null when an option id repeats", () => {
    const csv = "option_id,name\nOPT-A,First\nOPT-A,Second\nOPT-B,Third";
    expect(
      parseUploadedSolutionOptions([evidence({ extractedText: csv })]),
    ).toBeNull();
  });

  it("returns null when two evidence items each declare a set", () => {
    expect(
      parseUploadedSolutionOptions([
        evidence({}),
        evidence({ title: "other_options.csv" }),
      ]),
    ).toBeNull();
  });

  it("skips evidence that is prose, and still finds the one set", () => {
    const set = parseUploadedSolutionOptions([
      evidence({
        title: "notes.md",
        extractedText: "Workshop notes. No table here.",
      }),
      evidence({}),
    ]);
    expect(set?.sourceTitle).toBe("approach_options.csv");
  });
});

describe("inferSelectedOptionId", () => {
  const client = [
    { id: "OPT-A", label: "Extend native assist" },
    { id: "OPT-B", label: "Governed modular assist layer" },
    { id: "OPT-C", label: "Selective capability replacement" },
  ];
  const template = [
    { id: "A", label: "Stabilize the workflow first" },
    {
      id: "B",
      label: "Governed assist layer on current systems",
      recommended: true,
    },
    { id: "C", label: "Broader orchestration platform" },
  ];

  it("selects the client option named by id", () => {
    expect(
      inferSelectedOptionId(
        "Proceed with OPT-B for the bounded scope.",
        client,
      ),
    ).toBe("OPT-B");
  });

  it("selects the client option named by its name", () => {
    expect(
      inferSelectedOptionId(
        "We recommend the governed modular assist layer.",
        client,
      ),
    ).toBe("OPT-B");
  });

  it("takes the option the recommendation opens with when rejected ones are also named", () => {
    expect(
      inferSelectedOptionId(
        "OPT-B is recommended for the bounded read-only scope. " +
          "x".repeat(200) +
          " OPT-A stays as fallback and OPT-C is excluded until its condition is met.",
        client,
      ),
    ).toBe("OPT-B");
  });

  it("selects nothing when several options are named and none leads", () => {
    expect(
      inferSelectedOptionId("Compare OPT-A and OPT-B before deciding.", client),
    ).toBe("");
  });

  it("does not let a template letter match a different option set's id", () => {
    // The defect: "b:" as a substring matched "OPT-B:" and selected template B.
    expect(
      inferSelectedOptionId("OPT-B: governed modular layer.", template),
    ).toBe("");
  });

  it("does not match a one-letter id inside ordinary words before a colon", () => {
    expect(
      inferSelectedOptionId(
        "Supporting data: handle time is unreconciled.",
        template,
      ),
    ).toBe("");
    expect(
      inferSelectedOptionId("Decision criteria: cost and risk.", template),
    ).toBe("");
  });

  it("still selects a template option written as 'Option B'", () => {
    expect(
      inferSelectedOptionId("Go with Option B for the first phase.", template),
    ).toBe("B");
  });

  it("falls back to the recommended template option only when the text says recommended", () => {
    expect(
      inferSelectedOptionId("Use the recommended approach.", template),
    ).toBe("B");
    expect(inferSelectedOptionId("Use the approach discussed.", template)).toBe(
      "",
    );
    expect(inferSelectedOptionId("Use the recommended approach.", client)).toBe(
      "",
    );
  });

  it("selects nothing for empty input", () => {
    expect(inferSelectedOptionId("", client)).toBe("");
    expect(inferSelectedOptionId(null, client)).toBe("");
  });
});

describe("assembleP3SolutionOptions with a client option set", () => {
  const designInputs = {
    currentWorkflowWithPainPoints: [
      "Agents navigate several systems per inquiry.",
    ],
  } as unknown as P3DesignInputsPack;
  const base = {
    moveId: "m1",
    moveName: "Member service agent assist",
    designInputs,
  };

  it("offers the client's options, as written, and nothing from the template set", () => {
    const uploadedOptionSet = parseUploadedSolutionOptions([evidence({})]);
    const set = assembleP3SolutionOptions({ ...base, uploadedOptionSet });

    expect(set.source).toBe("move_uploaded_options");
    expect(set.sourceTitle).toBe("approach_options.csv");
    expect(set.options.map((o) => [o.id, o.label])).toEqual([
      ["OPT-A", "Extend native assist"],
      ["OPT-B", "Governed modular assist layer"],
      ["OPT-C", "Selective capability replacement"],
    ]);
    expect(set.options[1].clientSupplied).toEqual({
      benefit: "Cross-system context",
      tradeoff: "More runtime responsibility",
      condition: "Validate APIs and latency",
      scope: "Foundation and retrieval",
    });
  });

  it("does not score, rank, or recommend a client option", () => {
    const set = assembleP3SolutionOptions({
      ...base,
      uploadedOptionSet: parseUploadedSolutionOptions([evidence({})]),
    });
    expect(set.recommendedOptionId).toBeNull();
    for (const option of set.options) {
      expect(option.recommended).toBe(false);
      expect(option.totalScore).toBe(0);
      expect(option.requiredBuildingBlocks).toEqual([]);
      expect(option.effort).toBe("");
    }
  });

  it("uses the template set when the Move declares no options", () => {
    const set = assembleP3SolutionOptions({ ...base, uploadedOptionSet: null });
    expect(set.source).toBe("p3_design_inputs_pack");
    expect(set.options.length).toBeGreaterThanOrEqual(2);
    expect(set.options.every((o) => o.clientSupplied === undefined)).toBe(true);
  });
});
