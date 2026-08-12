/**
 * @jest-environment jsdom
 */

import "@testing-library/jest-dom";
import { fireEvent, render, screen } from "@testing-library/react";
import { SimpleStageFront } from "../SimpleStageFront";
import type { SimpleStageScreenView } from "@/lib/source/simple-front";

const BASE_VIEW: SimpleStageScreenView = {
  stageLabel: "Scope",
  required: [
    {
      requirementId: "EVID-SRC-SCOPE-APP-INV",
      label: "Application inventory",
      why: "Defines what services and applications are in the event.",
      acceptHint: "CMDB / application owner extract · needs available",
      state: "Available",
      sourceLabel: "CMDB / application owner extract",
      minimumState: "Available",
    },
    {
      requirementId: "EVID-SRC-SCOPE-TICKET-HISTORY",
      label: "Ticket and SLA history",
      why: "Sizes workload and chronic service issues before pricing.",
      acceptHint: "ITSM / service management · needs usable evidence",
      state: "Usable Evidence",
      sourceLabel: "ITSM / service management",
      minimumState: "Usable Evidence",
    },
  ],
  extras: [],
  deliverable: {
    artifactCode: "d05_scope_memo",
    name: "Scope Memo with Boundaries",
  },
  nextStep: {
    label: "Issue the RFP",
    stage: "rfp",
  },
};

function renderFront(view: SimpleStageScreenView = BASE_VIEW) {
  const onGenerateArtifact = jest.fn().mockResolvedValue({ ok: true as const });
  const onAdvanceStage = jest.fn();

  render(
    <SimpleStageFront
      eventId="evt-1"
      stage="scope"
      view={view}
      generating={false}
      registryArtifacts={[]}
      onGenerateArtifact={onGenerateArtifact}
      onAdvanceStage={onAdvanceStage}
      onRefresh={jest.fn()}
      advanced={<div>Advanced workspace</div>}
    />,
  );

  return { onGenerateArtifact, onAdvanceStage };
}

describe("SimpleStageFront", () => {
  it("renders required stage asks as an evidence table with source, status, and actions", () => {
    renderFront({
      ...BASE_VIEW,
      required: [
        BASE_VIEW.required[0],
        {
          ...BASE_VIEW.required[1],
          state: "Not Requested",
        },
      ],
    });

    expect(
      screen.getByRole("heading", { name: "Complete Scope evidence" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Evidence needed")).toBeInTheDocument();
    expect(screen.getByText("Source / acceptable input")).toBeInTheDocument();
    expect(screen.getByText("Status")).toBeInTheDocument();
    expect(screen.getByText("Action")).toBeInTheDocument();
    expect(screen.getByText("Application inventory")).toBeInTheDocument();
    expect(screen.getByText("Ticket and SLA history")).toBeInTheDocument();
    expect(screen.getByText("Ready")).toBeInTheDocument();
    expect(screen.getByText("Needed")).toBeInTheDocument();
    expect(screen.getAllByText("Template")).toHaveLength(2);
    expect(screen.getAllByRole("button", { name: "Upload" })).toHaveLength(2);
    expect(screen.getByText("1 required input still open")).toBeInTheDocument();
  });

  it("makes the completed-state approval action explicit", () => {
    const { onGenerateArtifact, onAdvanceStage } = renderFront();

    expect(screen.getByText("Approval gate")).toBeInTheDocument();
    expect(screen.getByText("Ready to open RFP")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Approve stage → RFP" }),
    ).toBeInTheDocument();

    fireEvent.click(
      screen.getByRole("button", { name: "Approve stage → RFP" }),
    );

    expect(onGenerateArtifact).toHaveBeenCalledWith("d05_scope_memo");
    expect(onAdvanceStage).toHaveBeenCalledWith("rfp");
  });
});
