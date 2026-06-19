/**
 * @jest-environment jsdom
 */
import { createElement } from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { SimpleStageFront } from "@/components/source/canvas/SimpleStageFront";
import { SimpleFrontErrorBoundary } from "@/components/source/canvas/SimpleFrontErrorBoundary";
import type { SimpleStageScreenView } from "@/lib/source/simple-front";
import type { SourceArtifactRegistryRecord } from "@/lib/source/artifact-registry/types";

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

  it("renders with empty substrate-derived asks and malformed generated artifact metadata", () => {
    const malformedRegistryRow = {
      id: "registry-doc-1",
      sourceOrigin: "generated",
      originalName: null,
      createdAt: null,
    } as unknown as SourceArtifactRegistryRecord;

    expect(() =>
      render(
        createElement(SimpleStageFront, {
          eventId: "event-1",
          stage: "scope",
          view: {
            ...view,
            required: [],
            extras: [],
          },
          generating: false,
          registryArtifacts: [malformedRegistryRow],
          onGenerateArtifact: jest.fn(async () => ({ ok: true as const })),
          onAdvanceStage: jest.fn(),
          onRefresh: jest.fn(),
          advanced: createElement("div", null, "Advanced workspace"),
        }),
      ),
    ).not.toThrow();

    expect(screen.getByTestId("source-simple-front")).toBeTruthy();
    expect(screen.queryByTestId("source-simple-front-download")).toBeNull();
  });

  it("falls back instead of blanking the surface when the simple view throws", () => {
    const errorSpy = jest.spyOn(console, "error").mockImplementation(() => {});

    function ThrowingSimpleView() {
      throw new Error("simple-front-test-crash");
      return createElement("div");
    }

    render(
      createElement(
        SimpleFrontErrorBoundary,
        {
          fallback: createElement(
            "div",
            { "data-testid": "advanced-fallback" },
            "Advanced workspace",
          ),
        },
        createElement(ThrowingSimpleView),
      ),
    );

    expect(screen.getByTestId("advanced-fallback")).toBeTruthy();
    expect(errorSpy).toHaveBeenCalled();
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
    fireEvent.click(screen.getByTestId("source-simple-front-approve"));

    expect(onGenerateArtifact).toHaveBeenCalledWith("d05_scope_memo");
  });

  it("APPROVE = generate + advance in one click; no separate generate button", () => {
    const onGenerateArtifact = jest.fn(async () => ({ ok: true as const }));
    const onAdvanceStage = jest.fn();
    render(
      createElement(SimpleStageFront, {
        eventId: "event-1",
        stage: "scope",
        view,
        generating: false,
        registryArtifacts: [],
        onGenerateArtifact,
        onAdvanceStage,
        onRefresh: jest.fn(),
        advanced: createElement("div", null, "Advanced workspace"),
      }),
    );

    // The Moves-parity contract: there is no standalone "Write/Generate"
    // button to forget — approving the step is the single action.
    expect(screen.queryByTestId("source-simple-front-next-step")).toBeNull();
    const approve = screen.getByTestId("source-simple-front-approve");
    expect(approve.textContent).toContain(
      "Approve & write Scope Memo with Boundaries",
    );

    fireEvent.click(approve);
    expect(onGenerateArtifact).toHaveBeenCalledWith("d05_scope_memo");
    expect(onAdvanceStage).toHaveBeenCalledWith("rfp");
  });

  it("on the final stage (no next), approve just writes the deliverable", () => {
    const onGenerateArtifact = jest.fn(async () => ({ ok: true as const }));
    const onAdvanceStage = jest.fn();
    const finalView: SimpleStageScreenView = {
      ...view,
      nextStep: { label: "Track the value", stage: undefined },
    };
    render(
      createElement(SimpleStageFront, {
        eventId: "event-1",
        stage: "value",
        view: finalView,
        generating: false,
        registryArtifacts: [],
        onGenerateArtifact,
        onAdvanceStage,
        onRefresh: jest.fn(),
        advanced: createElement("div", null, "Advanced workspace"),
      }),
    );

    const approve = screen.getByTestId("source-simple-front-approve");
    expect(approve.textContent).toContain("Write my Scope Memo with Boundaries");
    fireEvent.click(approve);
    expect(onGenerateArtifact).toHaveBeenCalledWith("d05_scope_memo");
    expect(onAdvanceStage).not.toHaveBeenCalled();
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
