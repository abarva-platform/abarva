/**
 * @jest-environment jsdom
 */
import { createElement } from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
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
      sourceSystems: ["ServiceNow CMDB", "LeanIX", "Excel portfolio inventory"],
      acceptedFileTypes: ["xlsx", "csv"],
      recordGrain: "one application, service, or platform per row",
      criticalFields: ["application_id", "application_name", "criticality"],
      minimumState: "Usable Evidence",
      level: "required",
    },
    {
      requirementId: "EVID-SRC-SCOPE-ORG",
      label: "Org chart",
      why: "KT planning and sizing model.",
      acceptHint: "Workday / HRIS · needs available",
      state: "Not Requested",
      sourceLabel: "Workday / HRIS",
      sourceSystems: ["Workday", "SAP SuccessFactors", "Fieldglass"],
      acceptedFileTypes: ["xlsx", "csv"],
      recordGrain: "one role, team, location, or worker class per row",
      criticalFields: ["role_ref", "role_title", "team", "fte_count"],
      minimumState: "Available",
      level: "required",
    },
    {
      requirementId: "EVID-SRC-SCOPE-TICKET-HISTORY",
      label: "L2/L3 ticket history",
      why: "Support-tier sizing.",
      acceptHint: "ServiceNow / ITSM tool · needs available",
      state: "Not Requested",
      sourceLabel: "ServiceNow / ITSM tool",
      sourceSystems: ["ServiceNow ITSM", "Jira Service Management"],
      acceptedFileTypes: ["xlsx", "csv"],
      recordGrain: "one queue, month, severity, or ticket class per row",
      criticalFields: ["service_tower", "period", "ticket_count", "severity"],
      minimumState: "Available",
      level: "required",
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
      sourceSystems: ["Icertis", "DocuSign CLM", "SAP S/4HANA AP"],
      acceptedFileTypes: ["xlsx", "csv", "pdf", "docx"],
      recordGrain:
        "one fiscal period, spend line, or commercial baseline per row",
      criticalFields: [
        "contract_id",
        "vendor_id",
        "fiscal_year",
        "actual_amount",
      ],
      minimumState: "Available",
      level: "recommended",
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

  it("does not allow required evidence to be skipped from the compact gate", async () => {
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

    expect(screen.queryByRole("button", { name: "Not needed" })).toBeNull();
    const approve = screen.getByTestId("source-simple-front-approve");
    expect((approve as HTMLButtonElement).disabled).toBe(true);
    expect(approve.textContent).toContain("Complete 3 inputs");

    fireEvent.click(approve);
    expect(fetchMock).not.toHaveBeenCalled();
    expect(onGenerateArtifact).not.toHaveBeenCalled();
  });

  it("APPROVE = generate + advance in one click; no separate generate button", async () => {
    const onGenerateArtifact = jest.fn(async () => ({ ok: true as const }));
    const onAdvanceStage = jest.fn();
    const readyView: SimpleStageScreenView = {
      ...view,
      required: view.required.map((requirement) => ({
        ...requirement,
        state: requirement.minimumState,
      })),
    };
    render(
      createElement(SimpleStageFront, {
        eventId: "event-1",
        stage: "scope",
        view: readyView,
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
    expect(approve.textContent).toContain("Open approval gate → RFP");

    fireEvent.click(approve);
    await waitFor(() => {
      expect(onGenerateArtifact).toHaveBeenCalledWith("d05_scope_memo");
      expect(onAdvanceStage).toHaveBeenCalledWith("rfp");
    });
  });

  it("on the final stage (no next), approve just writes the deliverable", async () => {
    const onGenerateArtifact = jest.fn(async () => ({ ok: true as const }));
    const onAdvanceStage = jest.fn();
    const finalView: SimpleStageScreenView = {
      ...view,
      required: view.required.map((requirement) => ({
        ...requirement,
        state: requirement.minimumState,
      })),
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
    expect(approve.textContent).toContain("Write Scope Memo with Boundaries");
    fireEvent.click(approve);
    await waitFor(() => {
      expect(onGenerateArtifact).toHaveBeenCalledWith("d05_scope_memo");
      expect(onAdvanceStage).not.toHaveBeenCalled();
    });
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

    fireEvent.click(screen.getAllByRole("button", { name: "Answer" })[0]!);
    fireEvent.change(
      screen.getByTestId("source-simple-front-answer-EVID-SRC-SCOPE-APP-INV"),
      {
        target: { value: "The app inventory is owned by EA and current." },
      },
    );
    fireEvent.click(screen.getByText("Save answer"));

    await waitFor(() => {
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
});
