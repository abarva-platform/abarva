/**
 * @jest-environment jsdom
 */

import "@testing-library/jest-dom";
import { fireEvent, render, screen } from "@testing-library/react";
import { useState } from "react";
import { DiagnosisFactsEditor } from "../DiagnosisFactsEditor";
import { parseDiagnosisFacts } from "@/lib/programs/diagnosis-facts";

/**
 * Host harness. The capture host owns the section value and echoes it straight
 * back, which is exactly the loop that made a derived-rows editor lose a
 * half-typed row — so the harness must echo, not swallow.
 */
function Harness({
  initial = "",
  onChangeSpy,
}: {
  initial?: string;
  onChangeSpy?: (next: string) => void;
}) {
  const [value, setValue] = useState(initial);
  return (
    <>
      <DiagnosisFactsEditor
        label="Baseline metrics"
        onChange={(next) => {
          setValue(next);
          onChangeSpy?.(next);
        }}
        value={value}
      />
      <output data-testid="stored">{value}</output>
    </>
  );
}

const stored = () => screen.getByTestId("stored").textContent ?? "";

describe("DiagnosisFactsEditor", () => {
  it("offers a writable row for an empty section, so a required baseline can be captured at all", () => {
    render(<Harness />);
    // All three columns, including provenance: a source column that renders but
    // refuses input would leave every captured number unsourced, which is the
    // one thing this section exists to prevent.
    for (const field of ["metric", "value", "source"]) {
      const input = screen.getByLabelText(
        `Baseline metrics — ${field}, row 1`,
      );
      expect(input).toBeEnabled();
      expect(input.tagName).toBe("TEXTAREA");
      expect(input).toHaveAttribute("rows", "1");
      expect(input).not.toHaveAttribute("readonly");
      expect(input).not.toHaveAttribute("disabled");
    }
  });

  it("reports a stored value the facts contract round-trips", () => {
    render(<Harness />);
    fireEvent.change(
      screen.getByLabelText("Baseline metrics — metric, row 1"),
      {
        target: { value: "Intake cycle time" },
      },
    );
    fireEvent.change(screen.getByLabelText("Baseline metrics — value, row 1"), {
      target: { value: "18.4 days median" },
    });
    fireEvent.change(
      screen.getByLabelText("Baseline metrics — source, row 1"),
      {
        target: { value: "Intake work queue export" },
      },
    );

    expect(parseDiagnosisFacts(stored())).toEqual([
      {
        metric: "Intake cycle time",
        value: "18.4 days median",
        source: "Intake work queue export",
      },
    ]);
  });

  it("reports a non-empty value once anything is typed, which is what the required section's completeness reads", () => {
    render(<Harness />);
    expect(stored()).toBe("");
    fireEvent.change(
      screen.getByLabelText("Baseline metrics — metric, row 1"),
      {
        target: { value: "Handle time" },
      },
    );
    expect(stored().length).toBeGreaterThan(0);
  });

  it("keeps a half-typed row through the host's echo of the stored value", () => {
    render(<Harness />);
    // Only the source is filled — the facts contract drops such a row on parse,
    // so a derived-rows editor would delete the row mid-typing.
    fireEvent.change(
      screen.getByLabelText("Baseline metrics — source, row 1"),
      {
        target: { value: "Queue export" },
      },
    );
    expect(
      screen.getByLabelText("Baseline metrics — source, row 1"),
    ).toHaveValue("Queue export");
    fireEvent.change(
      screen.getByLabelText("Baseline metrics — metric, row 1"),
      {
        target: { value: "Rework rate" },
      },
    );
    expect(
      screen.getByLabelText("Baseline metrics — source, row 1"),
    ).toHaveValue("Queue export");
    expect(parseDiagnosisFacts(stored())).toEqual([
      { metric: "Rework rate", value: "", source: "Queue export" },
    ]);
  });

  it("adds and removes rows, and never leaves the section with no row to type into", () => {
    render(<Harness />);
    fireEvent.click(screen.getByRole("button", { name: "+ Add metric" }));
    expect(
      screen.getByLabelText("Baseline metrics — metric, row 2"),
    ).toBeInTheDocument();

    fireEvent.change(
      screen.getByLabelText("Baseline metrics — metric, row 2"),
      {
        target: { value: "Rework rate" },
      },
    );
    fireEvent.click(
      screen.getByRole("button", { name: "Remove Baseline metrics row 2" }),
    );
    expect(
      screen.queryByLabelText("Baseline metrics — metric, row 2"),
    ).not.toBeInTheDocument();

    // The last row's remove is refused rather than emptying the editor.
    expect(
      screen.getByRole("button", { name: "Remove Baseline metrics row 1" }),
    ).toBeDisabled();
  });

  it("seeds from a stored value so a reload shows what was captured", () => {
    render(
      <Harness
        initial={JSON.stringify([
          { metric: "Volume", value: "1,240 / month", source: "Case system" },
          { metric: "Cost", value: "$41 per case", source: "Finance extract" },
        ])}
      />,
    );
    expect(
      screen.getByLabelText("Baseline metrics — metric, row 1"),
    ).toHaveValue("Volume");
    expect(
      screen.getByLabelText("Baseline metrics — source, row 2"),
    ).toHaveValue("Finance extract");
  });

  it("preserves a legacy free-text capture instead of discarding it", () => {
    render(<Harness initial={"Median cycle time is about 18 days"} />);
    expect(
      screen.getByLabelText("Baseline metrics — metric, row 1"),
    ).toHaveValue("Captured note");
    expect(
      screen.getByLabelText("Baseline metrics — value, row 1"),
    ).toHaveValue("Median cycle time is about 18 days");
  });

  it("re-seeds when the value arrives from somewhere other than this editor", () => {
    function Insertable() {
      const [value, setValue] = useState("");
      return (
        <>
          <button
            onClick={() =>
              setValue(
                JSON.stringify([
                  { metric: "Backlog", value: "312 cases", source: "Queue" },
                ]),
              )
            }
            type="button"
          >
            Insert draft
          </button>
          <DiagnosisFactsEditor
            label="Baseline metrics"
            onChange={setValue}
            value={value}
          />
        </>
      );
    }
    render(<Insertable />);
    fireEvent.click(screen.getByRole("button", { name: "Insert draft" }));
    expect(
      screen.getByLabelText("Baseline metrics — metric, row 1"),
    ).toHaveValue("Backlog");
  });

  it("names provenance as the standard, so a sourceless number is not read as measured", () => {
    render(<Harness />);
    expect(
      screen.getByText(/Name the source for every number/i),
    ).toBeInTheDocument();
  });
});
