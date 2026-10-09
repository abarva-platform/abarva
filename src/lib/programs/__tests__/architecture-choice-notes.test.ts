import type { ArchitectureChoice } from "@/lib/programs/architecture-choice";
import { proposeChoiceFromNotes } from "@/lib/programs/architecture-choice-notes";

const ELEMENTS = [
  {
    causeId: "RC-2",
    rank: 1,
    short: "definitions",
    element: "Certified semantic layer",
  },
  { causeId: "RC-6", rank: 2, short: "quality", element: "Quarantine zone" },
];

const choice = (
  coverage: ArchitectureChoice["coverage"],
): ArchitectureChoice => ({
  kind: "architecture_choice",
  version: 1,
  optionId: "OPT-B",
  optionLabel: "Build",
  optionSetSource: "move_uploaded_options",
  chosenBy: "me",
  chosenAt: "2026-10-09",
  coverage,
});

const NOTES = [
  "We back option B because it certifies measures first.",
  "Build also keeps us on the licensed warehouse.",
  "The quality release step goes to package C.",
  "Definitions get certified in the semantic layer.",
].join("\n");

describe("proposeChoiceFromNotes", () => {
  it("drafts why from the sentences naming the chosen option, verbatim with their lines", () => {
    expect(
      proposeChoiceFromNotes(NOTES, {
        choice: choice([]),
        recommendation: "",
        elements: ELEMENTS,
      }),
    ).toEqual([
      {
        kind: "why",
        value:
          "We back option B because it certifies measures first. Build also keeps us on the licensed warehouse.",
        sourceLines: [1, 2],
      },
    ]);
  });

  it("never replaces a why already written", () => {
    expect(
      proposeChoiceFromNotes(NOTES, {
        choice: choice([]),
        recommendation: "Typed by the team.",
        elements: ELEMENTS,
      }).filter((p) => p.kind === "why"),
    ).toEqual([]);
  });

  it("drafts a how only under a Partly or Doesn't with none yet", () => {
    const proposals = proposeChoiceFromNotes(NOTES, {
      choice: choice([
        {
          causeId: "RC-2",
          element: "Certified semantic layer",
          mark: "covers",
          source: "team",
        },
        {
          causeId: "RC-6",
          element: "Quarantine zone",
          mark: "partly",
          source: "team",
        },
      ]),
      recommendation: "x",
      elements: ELEMENTS,
    });
    expect(proposals).toEqual([
      {
        kind: "how",
        causeId: "RC-6",
        value: "The quality release step goes to package C",
        sourceLines: [3],
      },
    ]);
    expect(
      proposeChoiceFromNotes(NOTES, {
        choice: choice([
          {
            causeId: "RC-6",
            element: "Quarantine zone",
            mark: "no",
            how: "Owner named",
            source: "team",
          },
        ]),
        recommendation: "x",
        elements: ELEMENTS,
      }),
    ).toEqual([]);
  });
});
