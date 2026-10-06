/**
 * @jest-environment jsdom
 */

import "@testing-library/jest-dom";
import { fireEvent, render, screen, within } from "@testing-library/react";
import { SolutionOptionChooser } from "../SolutionOptionChooser";
import type { P3SolutionOption } from "@/lib/programs/phase-templates/p3-option-assembler";

function makeOption(
  overrides: Partial<P3SolutionOption> & Pick<P3SolutionOption, "id" | "label">,
): P3SolutionOption {
  return {
    summary: "What this option does.",
    businessImpact: "Impact",
    requiredBuildingBlocks: [],
    dataPlatformImplications: "Platform",
    humanAiSplit: "Split",
    controls: "Controls",
    timeToValue: "90 days",
    effort: "Medium effort",
    risks: [],
    dependencies: [],
    reusePotential: "Reusable",
    readinessConditions: [],
    notRecommendedYetReasons: [],
    scores: {} as P3SolutionOption["scores"],
    totalScore: 0,
    confidence: "medium",
    recommended: false,
    recommendationLabel: "",
    evidenceBasis: [],
    missingEvidence: [],
    ...overrides,
  };
}

const OPTIONS: P3SolutionOption[] = [
  makeOption({ id: "A", label: "Improve the current workflow" }),
  makeOption({
    id: "B",
    label: "Governed recommendation workflow",
    recommended: true,
    recommendationLabel: "aVa recommends this path",
    timeToValue: "120 days",
    effort: "High effort",
    confidence: "high",
  }),
];

describe("SolutionOptionChooser", () => {
  it("offers one selectable control per assembled option", () => {
    render(
      <SolutionOptionChooser
        options={OPTIONS}
        selectedOptionId=""
        onSelect={() => {}}
      />,
    );
    const radios = screen.getAllByRole("radio") as HTMLInputElement[];
    expect(radios.map((radio) => radio.value)).toEqual(["A", "B"]);
    for (const radio of radios) expect(radio).toBeEnabled();
  });

  it("reports the option the person picked", () => {
    const picked: string[] = [];
    render(
      <SolutionOptionChooser
        options={OPTIONS}
        selectedOptionId=""
        onSelect={(id) => picked.push(id)}
      />,
    );
    fireEvent.click(screen.getAllByRole("radio")[1]);
    expect(picked).toEqual(["B"]);
  });

  it("shows the option standing as checked, so a restored choice is visible", () => {
    render(
      <SolutionOptionChooser
        options={OPTIONS}
        selectedOptionId="B"
        onSelect={() => {}}
      />,
    );
    const radios = screen.getAllByRole("radio") as HTMLInputElement[];
    expect(radios[0].checked).toBe(false);
    expect(radios[1].checked).toBe(true);
  });

  it("nothing is checked when no option is standing", () => {
    render(
      <SolutionOptionChooser
        options={OPTIONS}
        selectedOptionId=""
        onSelect={() => {}}
      />,
    );
    for (const radio of screen.getAllByRole("radio") as HTMLInputElement[]) {
      expect(radio.checked).toBe(false);
    }
  });

  it("names each option by its id and label, and marks the recommended one", () => {
    render(
      <SolutionOptionChooser
        options={OPTIONS}
        selectedOptionId=""
        onSelect={() => {}}
      />,
    );
    const chooser = screen.getByTestId("solution-option-chooser");
    expect(
      within(chooser).getByText("A · Improve the current workflow"),
    ).toBeInTheDocument();
    expect(
      within(chooser).getByText("B · Governed recommendation workflow"),
    ).toBeInTheDocument();
    expect(
      within(chooser).getByText("aVa recommends this path"),
    ).toBeInTheDocument();
  });

  it("shows a client-supplied option's own fields and no generated effort meta", () => {
    render(
      <SolutionOptionChooser
        options={[
          makeOption({
            id: "C",
            label: "The client's own option",
            summary: "",
            timeToValue: "",
            effort: "",
            clientSupplied: {
              benefit: "Keeps the current vendor",
              tradeoff: "Slower to a measurable result",
              condition: "",
              scope: "",
            },
          }),
        ]}
        selectedOptionId=""
        onSelect={() => {}}
      />,
    );
    const chooser = screen.getByTestId("solution-option-chooser");
    expect(
      within(chooser).getByText("Benefit: Keeps the current vendor"),
    ).toBeInTheDocument();
    expect(
      within(chooser).getByText("Trade-off: Slower to a measurable result"),
    ).toBeInTheDocument();
    expect(within(chooser).queryByText(/confidence$/)).not.toBeInTheDocument();
  });

  it("states that nothing can be chosen when no option was assembled", () => {
    render(
      <SolutionOptionChooser
        options={[]}
        selectedOptionId=""
        onSelect={() => {}}
      />,
    );
    expect(screen.queryAllByRole("radio")).toHaveLength(0);
    expect(
      screen.getByText(/No solution option has been assembled/i),
    ).toBeInTheDocument();
  });
});
