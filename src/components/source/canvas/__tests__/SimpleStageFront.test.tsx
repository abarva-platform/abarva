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
      sourceSystems: ["ServiceNow CMDB", "LeanIX", "Excel portfolio inventory"],
      acceptedFileTypes: ["xlsx", "csv"],
      recordGrain: "one application, service, or platform per row",
      criticalFields: [
        "application_id",
        "application_name",
        "business_function",
        "criticality",
      ],
      minimumState: "Available",
      level: "required",
    },
    {
      requirementId: "EVID-SRC-SCOPE-TICKET-HISTORY",
      label: "Ticket and SLA history",
      why: "Sizes workload and chronic service issues before pricing.",
      acceptHint: "ITSM / service management · needs usable evidence",
      state: "Usable Evidence",
      sourceLabel: "ITSM / service management",
      sourceSystems: [
        "ServiceNow ITSM",
        "Jira Service Management",
        "Power BI ops mart",
      ],
      acceptedFileTypes: ["xlsx", "csv"],
      recordGrain:
        "one service tower, queue, month, severity, or ticket class per row",
      criticalFields: ["service_tower", "period", "ticket_count", "severity"],
      minimumState: "Usable Evidence",
      level: "required",
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

function renderFrontWithSpotlight(view: SimpleStageScreenView = BASE_VIEW) {
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
      spotlight={<section>Scenario spotlight</section>}
    />,
  );

  return { onGenerateArtifact, onAdvanceStage };
}

describe("SimpleStageFront", () => {
  it("renders an optional workflow spotlight before the evidence table", () => {
    renderFrontWithSpotlight();

    expect(
      screen.getByTestId("source-simple-front-spotlight"),
    ).toHaveTextContent("Scenario spotlight");
    expect(
      screen.getByRole("heading", { name: "Complete Scope evidence" }),
    ).toBeInTheDocument();
  });

  it("renders a compact working-session guide from the evidence requirements", () => {
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

    const guide = screen.getByTestId("source-simple-front-session-guide");
    expect(guide).toHaveTextContent("Working session guide");
    expect(guide).toHaveTextContent(
      "Run the Scope working session with the right evidence.",
    );
    expect(guide).toHaveTextContent("2 required · 0 optional");
    expect(guide).toHaveTextContent("Invite");
    expect(guide).toHaveTextContent("ServiceNow CMDB");
    expect(guide).toHaveTextContent("Pull");
    expect(guide).toHaveTextContent(
      "one application, service, or platform per row",
    );
    expect(guide).toHaveTextContent("Template");
    expect(guide).toHaveTextContent("xlsx, csv");
    expect(guide).toHaveTextContent("application_id");
    expect(guide).toHaveTextContent("Unlock");
    expect(guide).toHaveTextContent(
      "1 blocking input remains before Scope Memo with Boundaries.",
    );
  });

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
    expect(
      screen.getByText("Where to get it and what to load"),
    ).toBeInTheDocument();
    expect(screen.getByText("Gate status")).toBeInTheDocument();
    expect(screen.getByText("Action")).toBeInTheDocument();
    expect(screen.getByText("Application inventory")).toBeInTheDocument();
    expect(screen.getByText("Ticket and SLA history")).toBeInTheDocument();
    expect(screen.getAllByText("Required")).toHaveLength(2);
    expect(
      screen.getAllByText(/ServiceNow CMDB, LeanIX/).length,
    ).toBeGreaterThanOrEqual(1);
    expect(
      screen.getAllByText("one application, service, or platform per row")
        .length,
    ).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText(/application_id/).length).toBeGreaterThanOrEqual(
      1,
    );
    expect(screen.getByText("Ready")).toBeInTheDocument();
    expect(screen.getByText("Needed")).toBeInTheDocument();
    expect(
      screen.getByText("Blocks approval until Usable Evidence."),
    ).toBeInTheDocument();
    expect(
      screen
        .getByTestId("source-simple-front-requirement-EVID-SRC-SCOPE-APP-INV")
        .getAttribute("data-ready"),
    ).toBe("true");
    expect(
      screen.getByTestId("source-simple-front-done-EVID-SRC-SCOPE-APP-INV"),
    ).toHaveTextContent("Done");
    expect(
      screen
        .getByTestId(
          "source-simple-front-requirement-EVID-SRC-SCOPE-TICKET-HISTORY",
        )
        .getAttribute("data-ready"),
    ).toBe("false");
    expect(
      screen.queryByTestId(
        "source-simple-front-template-EVID-SRC-SCOPE-APP-INV",
      ),
    ).not.toBeInTheDocument();
    expect(
      screen.getByTestId(
        "source-simple-front-template-EVID-SRC-SCOPE-TICKET-HISTORY",
      ),
    ).toBeInTheDocument();
    expect(screen.getAllByRole("button", { name: "Upload" })).toHaveLength(1);
    expect(
      screen.queryByRole("button", { name: "Not needed" }),
    ).not.toBeInTheDocument();
    expect(screen.getByText("1 required input still open")).toBeInTheDocument();
    const blockedButton = screen.getByRole("button", {
      name: "Complete 1 input",
    });
    expect(blockedButton).toBeDisabled();
  });

  it("renders optional evidence as rows with the same template and upload affordances", () => {
    renderFront({
      ...BASE_VIEW,
      extras: [
        {
          requirementId: "EVID-SRC-SCOPE-OPTIONAL-RACI",
          label: "Service owner RACI",
          why: "Improves accountability and scoring confidence.",
          acceptHint: "Operating model extract · needs available",
          state: "Not Requested",
          sourceLabel: "Operating model extract",
          sourceSystems: ["ServiceNow Catalog", "SharePoint"],
          acceptedFileTypes: ["xlsx", "csv", "docx"],
          recordGrain: "one source system, owner role, or extract per row",
          criticalFields: ["source_system", "owner_role", "extract_method"],
          minimumState: "Available",
          level: "recommended",
        },
      ],
    });

    const optionalSection = screen.getByTestId(
      "source-simple-front-optional-evidence",
    );
    expect(optionalSection).toHaveTextContent(
      "Optional evidence that improves confidence",
    );
    expect(optionalSection).toHaveTextContent("Service owner RACI");
    expect(optionalSection).toHaveTextContent(
      "These rows do not block the gate",
    );
    expect(optionalSection).toHaveTextContent("Optional");
    expect(optionalSection).toHaveTextContent("ServiceNow Catalog, SharePoint");
    expect(optionalSection).toHaveTextContent(
      "Helps confidence; does not block approval.",
    );
    expect(
      screen.getByTestId(
        "source-simple-front-optional-EVID-SRC-SCOPE-OPTIONAL-RACI",
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByTestId(
        "source-simple-front-template-EVID-SRC-SCOPE-OPTIONAL-RACI",
      ),
    ).toHaveAttribute(
      "href",
      "/api/v1/source/evt-1/evidence/EVID-SRC-SCOPE-OPTIONAL-RACI/template",
    );
    expect(
      screen.getByTestId(
        "source-simple-front-file-EVID-SRC-SCOPE-OPTIONAL-RACI",
      ),
    ).toHaveAttribute("type", "file");
    expect(
      screen.getByRole("button", { name: "Open approval gate → RFP" }),
    ).toBeEnabled();
  });

  it("shows the artifact context manifest before approval", () => {
    renderFront({
      ...BASE_VIEW,
      required: [
        BASE_VIEW.required[0],
        {
          ...BASE_VIEW.required[1],
          state: "Not Requested",
        },
      ],
      extras: [
        {
          requirementId: "EVID-SRC-SCOPE-OPTIONAL-RACI",
          label: "Service owner RACI",
          why: "Improves accountability and scoring confidence.",
          acceptHint: "Operating model extract · needs available",
          state: "Loaded",
          sourceLabel: "Operating model extract",
          sourceSystems: ["ServiceNow Catalog", "SharePoint"],
          acceptedFileTypes: ["xlsx", "csv", "docx"],
          recordGrain: "one source system, owner role, or extract per row",
          criticalFields: ["source_system", "owner_role", "extract_method"],
          minimumState: "Available",
          level: "recommended",
        },
      ],
    });

    const manifest = screen.getByTestId("source-simple-front-context-manifest");
    expect(manifest).toHaveTextContent(
      "What will support Scope Memo with Boundaries",
    );
    expect(manifest).toHaveTextContent("1 used · 1 pending");
    expect(manifest).toHaveTextContent("Used as evidence");
    expect(manifest).toHaveTextContent("Application inventory · Available");
    expect(manifest).toHaveTextContent("Carried as gaps");
    expect(manifest).toHaveTextContent(
      "Ticket and SLA history · Not Requested",
    );
    expect(manifest).toHaveTextContent("Not used yet");
    expect(manifest).toHaveTextContent("Service owner RACI · Loaded");
    expect(manifest).toHaveTextContent(
      "generation receipt records the model, prompt version, token usage",
    );
  });

  it("makes the completed-state approval action explicit", () => {
    const { onGenerateArtifact, onAdvanceStage } = renderFront();

    expect(screen.getByText("Approval gate")).toBeInTheDocument();
    expect(screen.getByText("Ready to open RFP")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Open approval gate → RFP" }),
    ).toBeInTheDocument();

    fireEvent.click(
      screen.getByRole("button", { name: "Open approval gate → RFP" }),
    );

    expect(onGenerateArtifact).toHaveBeenCalledWith("d05_scope_memo");
    expect(onAdvanceStage).toHaveBeenCalledWith("rfp");
  });
});
