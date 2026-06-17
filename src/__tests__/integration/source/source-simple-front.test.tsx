/**
 * @jest-environment jsdom
 */
import { createElement } from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { SimpleStageFront } from "@/components/source/canvas/SimpleStageFront";
import type { SimpleStageScreenView } from "@/lib/source/simple-front";

const view: SimpleStageScreenView = {
  stageLabel: "Scope",
  required: [
    {
      requirementId: "EVID-SRC-SCOPE-APP-INV",
      label: "Application inventory",
      why: "Scope memo and RFP application list.",
      acceptHint: "CMDB / EA tool · needs usable evidence",
      state: "Not Requested",
      sourceLabel: "CMDB / EA tool",
      minimumState: "Usable Evidence",
    },
    {
      requirementId: "EVID-SRC-SCOPE-ORG",
      label: "Org chart",
      why: "KT planning and sizing model.",
      acceptHint: "Workday / HRIS · needs available",
      state: "Not Requested",
      sourceLabel: "Workday / HRIS",
      minimumState: "Available",
    },
    {
      requirementId: "EVID-SRC-SCOPE-TICKET-HISTORY",
      label: "L2/L3 ticket history",
      why: "Support-tier sizing.",
      acceptHint: "ServiceNow / ITSM tool · needs available",
      state: "Not Requested",
      sourceLabel: "ServiceNow / ITSM tool",
      minimumState: "Available",
    },
  ],
  extras: [
    {
      requirementId: "EVID-SRC-SCOPE-FY-CONTRACT",
      label: "Prior fiscal AMS contract",
      why: "Pricing assumptions.",
      acceptHint: "Procurement · needs available",
      state: "Not Requested",
      sourceLabel: "Procurement",
      minimumState: "Available",
    },
  ],
  deliverable: {
    artifactCode: "d05_scope_memo",
    name: "Scope Memo with Boundaries",
  },
  nextStep: { label: "Issue the RFP", stage: "rfp" },
};

describe("SimpleStageFront", () => {
  const originalFetch = global.fetch;

  afterEach(() => {
    global.fetch = originalFetch;
    jest.restoreAllMocks();
  });

  it("keeps skip local and still allows document generation", async () => {
    const fetchMock = jest.fn();
    global.fetch = fetchMock as typeof fetch;
    const onGenerateArtifact = jest.fn(async () => ({ ok: true as const }));
    render(
      createElement(SimpleStageFront, {
        eventId: "event-1",
        stage: "scope",
        view,
        generating: false,
        registryArtifacts: [],
        onGenerateArtifact,
        onAdvanceStage: jest.fn(),
        onRefresh: jest.fn(),
        advanced: createElement("div", null, "Advanced workspace"),
      }),
    );

    fireEvent.click(screen.getAllByText("Skip")[0]!);
    expect(fetchMock).not.toHaveBeenCalled();
    fireEvent.click(screen.getByTestId("source-simple-front-write"));

    expect(onGenerateArtifact).toHaveBeenCalledWith("d05_scope_memo");
  });

  it("saves a just-tell-me answer through the evidence answer route", async () => {
    const fetchMock = jest.fn(async () => ({
      ok: true,
      json: async () => ({ ok: true }),
    }));
    global.fetch = fetchMock as unknown as typeof fetch;
    render(
      createElement(SimpleStageFront, {
        eventId: "event-1",
        stage: "scope",
        view,
        generating: false,
        registryArtifacts: [],
        onGenerateArtifact: jest.fn(async () => ({ ok: true as const })),
        onAdvanceStage: jest.fn(),
        onRefresh: jest.fn(),
        advanced: createElement("div", null, "Advanced workspace"),
      }),
    );

    fireEvent.click(screen.getAllByText("Just tell me")[0]!);
    fireEvent.change(
      screen.getByTestId("source-simple-front-answer-EVID-SRC-SCOPE-APP-INV"),
      {
        target: { value: "The app inventory is owned by EA and current." },
      },
    );
    fireEvent.click(screen.getByText("Save answer"));

    expect(fetchMock).toHaveBeenCalledWith(
      "/api/v1/source/event-1/evidence/EVID-SRC-SCOPE-APP-INV/answer",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({
          answer: "The app inventory is owned by EA and current.",
          stage: "scope",
        }),
      }),
    );
  });
});
