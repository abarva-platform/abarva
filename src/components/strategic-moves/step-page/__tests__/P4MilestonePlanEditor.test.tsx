/** @jest-environment jsdom */
import "@testing-library/jest-dom";
import { useState } from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { P4MilestonePlanEditor } from "../P4MilestonePlanEditor";
import {
  emptyP4RoadmapPlan,
  newP4RoadmapMilestone,
  parseP4RoadmapPlan,
  serializeP4RoadmapPlan,
} from "@/lib/programs/p4-roadmap-plan";

const row = (id = "m1") => ({
  ...newP4RoadmapMilestone(id),
  name: id === "m1" ? "Input scope" : "Validation",
  workstream: "Delivery",
  ownerRole: "Data owner",
  plannedWindow: "R1 first week",
  timingBasis: "ROM R1 [A:T1]",
  dependencyNotes: "No predecessor needed",
  dependenciesReviewed: true,
  reviewed: true,
});
const value = (rows = [row()]) =>
  serializeP4RoadmapPlan({ ...emptyP4RoadmapPlan(), milestones: rows });

function Harness({
  storedValue = "",
  onSave,
  saved,
  saveError,
}: {
  storedValue?: string;
  onSave: jest.Mock;
  saved?: boolean;
  saveError?: string;
}) {
  const [draft, setDraft] = useState(storedValue);
  return (
    <P4MilestonePlanEditor
      value={draft}
      storedValue={storedValue}
      onChange={setDraft}
      onSave={onSave}
      saved={saved}
      saveError={saveError}
    />
  );
}

describe("P4 milestone plan editor", () => {
  it("adds stable structured rows and saves only a reviewed plan through its host", () => {
    const onSave = jest.fn();
    render(<Harness onSave={onSave} />);
    fireEvent.click(screen.getByRole("button", { name: "Add milestone" }));
    for (const [label, text] of [
      ["Milestone name", "Agree source scope"],
      ["Workstream", "Data readiness"],
      ["Owner role", "Data owner"],
      ["Planned window", "R1 first week"],
      ["Timing source or assumption reference", "Approved ROM R1 [A:T1]"],
      [
        "Dependency notes, including why none apply",
        "First decision; no predecessor",
      ],
    ])
      fireEvent.change(screen.getByLabelText(`${label} · 1`), {
        target: { value: text },
      });
    fireEvent.click(
      screen.getByLabelText("Dependency list reviewed, including none · 1"),
    );
    fireEvent.click(screen.getByLabelText("Milestone reviewed · 1"));
    fireEvent.click(screen.getByRole("button", { name: "Save reviewed plan" }));
    const plan = parseP4RoadmapPlan(onSave.mock.calls[0][0]);
    expect(plan?.milestones[0]).toEqual(
      expect.objectContaining({
        name: "Agree source scope",
        workstream: "Data readiness",
        ownerRole: "Data owner",
        plannedWindow: "R1 first week",
        timingBasis: "Approved ROM R1 [A:T1]",
        dependsOn: [],
        dependenciesReviewed: true,
        reviewed: true,
      }),
    );
    expect(plan?.milestones[0].id).toBeTruthy();
  });

  it("names missing fields and never treats a milestone name alone as complete", () => {
    const onSave = jest.fn();
    render(<Harness onSave={onSave} />);
    fireEvent.click(screen.getByRole("button", { name: "Save reviewed plan" }));
    expect(screen.getByRole("alert")).toHaveTextContent("Add at least one");
    fireEvent.click(screen.getByRole("button", { name: "Add milestone" }));
    fireEvent.change(screen.getByLabelText("Milestone name · 1"), {
      target: { value: "Input scope" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Save reviewed plan" }));
    expect(
      screen
        .getAllByRole("alert")
        .map((item) => item.textContent)
        .join(" "),
    ).toMatch(/owner role.*timing source/);
    expect(onSave).not.toHaveBeenCalled();
  });

  it("editing a reviewed milestone requires a fresh review before saving", () => {
    const onSave = jest.fn();
    render(<Harness storedValue={value()} onSave={onSave} saved />);
    fireEvent.change(screen.getByLabelText("Owner role · 1"), {
      target: { value: "Validation lead" },
    });
    expect(screen.getByLabelText("Milestone reviewed · 1")).not.toBeChecked();
    fireEvent.click(screen.getByRole("button", { name: "Save reviewed plan" }));
    expect(onSave).not.toHaveBeenCalled();
    fireEvent.click(screen.getByLabelText("Milestone reviewed · 1"));
    fireEvent.click(screen.getByRole("button", { name: "Save reviewed plan" }));
    expect(
      parseP4RoadmapPlan(onSave.mock.calls[0][0])?.milestones[0].ownerRole,
    ).toBe("Validation lead");
  });

  it("dependency edits invalidate both confirmations and persist predecessor IDs", () => {
    const onSave = jest.fn();
    render(<Harness storedValue={value([row(), row("m2")])} onSave={onSave} />);
    fireEvent.click(screen.getByLabelText("Depends on Input scope · 2"));
    expect(
      screen.getByLabelText("Dependency list reviewed, including none · 2"),
    ).not.toBeChecked();
    expect(screen.getByLabelText("Milestone reviewed · 2")).not.toBeChecked();
    fireEvent.click(
      screen.getByLabelText("Dependency list reviewed, including none · 2"),
    );
    fireEvent.click(screen.getByLabelText("Milestone reviewed · 2"));
    fireEvent.click(screen.getByRole("button", { name: "Save reviewed plan" }));
    expect(
      parseP4RoadmapPlan(onSave.mock.calls[0][0])?.milestones[1].dependsOn,
    ).toEqual(["m1"]);
  });

  it("holds a dependency cycle even when both milestones were reviewed", () => {
    const onSave = jest.fn();
    render(
      <Harness
        storedValue={value([
          { ...row(), dependsOn: ["m2"] },
          { ...row("m2"), dependsOn: ["m1"] },
        ])}
        onSave={onSave}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: "Save reviewed plan" }));
    expect(screen.getByText(/dependencies form a cycle/)).toBeInTheDocument();
    expect(onSave).not.toHaveBeenCalled();
  });

  it("removing a predecessor reopens dependent review and keeps remaining row identity", () => {
    const onSave = jest.fn();
    render(
      <Harness
        storedValue={value([row(), { ...row("m2"), dependsOn: ["m1"] }])}
        onSave={onSave}
      />,
    );
    fireEvent.click(
      screen.getByRole("button", { name: "Remove milestone · 1" }),
    );
    expect(screen.getByLabelText("Milestone name · 1")).toHaveValue(
      "Validation",
    );
    expect(
      screen.getByLabelText("Dependency list reviewed, including none · 1"),
    ).not.toBeChecked();
    fireEvent.click(screen.getByRole("button", { name: "Save reviewed plan" }));
    expect(onSave).not.toHaveBeenCalled();
    fireEvent.click(
      screen.getByLabelText("Dependency list reviewed, including none · 1"),
    );
    fireEvent.click(screen.getByLabelText("Milestone reviewed · 1"));
    fireEvent.click(screen.getByRole("button", { name: "Save reviewed plan" }));
    expect(parseP4RoadmapPlan(onSave.mock.calls[0][0])?.milestones[0]).toEqual(
      expect.objectContaining({ id: "m2", dependsOn: [] }),
    );
  });

  it("keeps malformed saved records for repair and offers no replacement write", () => {
    const onSave = jest.fn();
    render(<Harness storedValue="malformed" onSave={onSave} />);
    expect(screen.getByRole("alert")).toHaveTextContent("could not be read");
    expect(
      screen.queryByRole("button", { name: "Save reviewed plan" }),
    ).not.toBeInTheDocument();
    expect(onSave).not.toHaveBeenCalled();
  });

  it("shows the saved-state hold and exact save refusal, then allows a reviewed retry", () => {
    const onSave = jest.fn();
    render(
      <Harness
        storedValue={value()}
        onSave={onSave}
        saved={false}
        saveError="This page was loaded before the capture state changed."
      />,
    );
    expect(screen.getByRole("status")).toHaveTextContent("saved readback");
    expect(screen.getByRole("alert")).toHaveTextContent(
      "This page was loaded before the capture state changed.",
    );
    fireEvent.click(screen.getByRole("button", { name: "Save reviewed plan" }));
    expect(onSave).toHaveBeenCalledWith(value());
  });
});
