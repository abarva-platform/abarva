/**
 * @jest-environment jsdom
 */
import "@testing-library/jest-dom";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { ArtifactAcceptancePanel } from "../ArtifactAcceptancePanel";
import type { ArtifactAcceptanceRecord } from "@/lib/source/artifact-acceptances";
import type { SourceArtifactOperation } from "@/lib/source/artifact-operations";

const LATEST: ArtifactAcceptanceRecord = {
  id: "acceptance-1",
  artifactId: "artifact-1",
  eventId: "event-1",
  stageKey: "responses",
  artifactState: "approved_for_external_use",
  authoritativeVersionId: "artifact-1",
  artifactRole: "evidence",
  contentDriftStatus: "current",
  gatePreconditionStatus: "ready",
  downstreamContextPolicy: "restricted",
  diffSummary: "Added Cormorant IT's late response.",
  approvalRationale: "Coverage complete across all three bidders.",
  acceptedBy: "K. Oshima",
  acceptedAt: "2026-07-22T00:00:00.000Z",
  createdAt: "2026-07-22T00:00:00.000Z",
};

const OPERATION: SourceArtifactOperation = {
  artifactCode: "d11_response_checklist",
  artifactName: "Response coverage matrix",
  stage: "responses",
  stageLabel: "Responses",
  requirementLevel: "required",
  gateDefining: true,
  documentType: "Checklist / completeness report",
  sourceOfRecord:
    "RFP response requirements, uploaded vendor responses, and parser output.",
  intakePath:
    "Checklist can be generated/rendered; vendor response completeness should be built from imported response packets.",
  acceptedFormats: ["xlsx", "csv", "pdf"],
  parseAndStore:
    "Generic Source upload stores the file, hashes it, and records parser state.",
  agentUse:
    "Sentinel uses checklist gaps to block premature evaluation and produce vendor follow-up actions.",
  contentStandard: "Completeness report with vendor gaps and action owners.",
  responsibleAiControl:
    "AI can produce the gap report, but the Maestro decides whether each response is evaluation-ready.",
  currentCapability:
    "Partial: seeded completeness model exists; live parsing does not yet drive this report.",
  nextGap:
    "Connect uploaded response sections to completeness rules and gate blockers.",
  bestInClassOutcome:
    "Every response is complete, comparable, and exception-flagged before scoring.",
  status: "partial",
  goldStandard: {
    purpose: "Make response coverage reviewable before evaluation.",
    outcome: "Every gap has a vendor follow-up action.",
    tableOfContents: ["Executive answer", "Evidence basis"],
    evidenceInputs: ["Vendor response pack", "RFP requirements"],
    bestInClassExpectations: ["Cited parser output"],
    approvalOwner: "Procurement lead",
    supportedUploads: ["xlsx", "csv", "pdf"],
    supportedDownloads: ["xlsx", "pdf"],
    dataBindingChecks: ["Artifact code matches canonical spec."],
  },
};

describe("ArtifactAcceptancePanel", () => {
  beforeEach(() => {
    global.fetch = jest.fn();
  });

  it("shows nothing extra when the artifact has never been accepted", () => {
    render(
      <ArtifactAcceptancePanel
        eventId="event-1"
        artifactCode="d11_response_checklist"
        artifactName="Response coverage matrix"
        latestAcceptance={null}
      />,
    );
    expect(screen.queryByText(/Artifact status/i)).not.toBeInTheDocument();
    expect(screen.getByText("Accept as authoritative")).toBeInTheDocument();
  });

  it("renders the real latest acceptance — rationale, accepted-by, drift, gate precondition", () => {
    render(
      <ArtifactAcceptancePanel
        eventId="event-1"
        artifactCode="d11_response_checklist"
        artifactName="Response coverage matrix"
        latestAcceptance={LATEST}
      />,
    );
    const panel = screen.getByTestId(
      "source-shell-artifact-status-d11_response_checklist",
    );
    expect(panel).toHaveTextContent("Accepted by K. Oshima");
    expect(panel).toHaveTextContent(
      "Coverage complete across all three bidders.",
    );
    expect(panel).toHaveTextContent("Added Cormorant IT's late response.");
    expect(panel).toHaveTextContent("current");
    expect(panel).toHaveTextContent("ready");
    expect(screen.getByText("Re-accept with a new reason")).toBeInTheDocument();
  });

  it("shows the artifact context manifest so acceptance is tied to source, parser, agent use, and the next gap", () => {
    render(
      <ArtifactAcceptancePanel
        eventId="event-1"
        artifactCode="d11_response_checklist"
        artifactName="Response coverage matrix"
        latestAcceptance={LATEST}
        operation={OPERATION}
      />,
    );
    const manifest = screen.getByTestId(
      "source-shell-artifact-context-d11_response_checklist",
    );
    expect(manifest).toHaveTextContent("Context manifest");
    expect(manifest).toHaveTextContent(
      "RFP response requirements, uploaded vendor responses, and parser output.",
    );
    expect(manifest).toHaveTextContent(
      "Generic Source upload stores the file, hashes it, and records parser state.",
    );
    expect(manifest).toHaveTextContent(
      "Sentinel uses checklist gaps to block premature evaluation",
    );
    expect(manifest).toHaveTextContent(
      "Connect uploaded response sections to completeness rules and gate blockers.",
    );
    expect(manifest).toHaveTextContent(
      "Human approval owner: Procurement lead",
    );
    expect(manifest).toHaveTextContent("Supported uploads: xlsx, csv, pdf.");
  });

  it("shows a quality gate with parser, acceptance, search, graph, operation, and compliance readiness", () => {
    render(
      <ArtifactAcceptancePanel
        eventId="event-1"
        artifactCode="d11_response_checklist"
        artifactName="Response coverage matrix"
        latestAcceptance={null}
        operation={OPERATION}
        artifactRole="authoritative"
        parseStatus="registered"
        embeddingStatus={null}
        graphStatus={null}
        needsComplianceReview={false}
      />,
    );
    const gate = screen.getByTestId(
      "source-shell-artifact-quality-d11_response_checklist",
    );
    expect(gate).toHaveTextContent("Quality gate");
    expect(gate).toHaveTextContent("Parse");
    expect(gate).toHaveTextContent("not parsed");
    expect(gate).toHaveTextContent("Human acceptance");
    expect(gate).toHaveTextContent("not final");
    expect(gate).toHaveTextContent("Search");
    expect(gate).toHaveTextContent("not indexed");
    expect(gate).toHaveTextContent("Graph");
    expect(gate).toHaveTextContent("not projected");
    expect(gate).toHaveTextContent("Operation");
    expect(gate).toHaveTextContent("partial");
    expect(gate).toHaveTextContent("Compliance");
    expect(gate).toHaveTextContent("clear");
    expect(gate).toHaveTextContent(
      "Run parser before this artifact influences scoring, aVa, or approval.",
    );
  });

  it("shows ready quality when the artifact is parsed, accepted, indexed, projected, wired, and compliance-clear", () => {
    render(
      <ArtifactAcceptancePanel
        eventId="event-1"
        artifactCode="d11_response_checklist"
        artifactName="Response coverage matrix"
        latestAcceptance={LATEST}
        operation={{ ...OPERATION, status: "wired" }}
        artifactRole="authoritative"
        parseStatus="parsed"
        embeddingStatus="embedded"
        graphStatus="projected"
        needsComplianceReview={false}
      />,
    );
    const gate = screen.getByTestId(
      "source-shell-artifact-quality-d11_response_checklist",
    );
    expect(gate).toHaveTextContent("ready");
    expect(gate).toHaveTextContent("accepted");
    expect(gate).toHaveTextContent("indexed");
    expect(gate).toHaveTextContent("projected");
    expect(gate).toHaveTextContent(
      "Ready for workflow use, subject to the acceptance decision below.",
    );
  });

  it("requires a rationale before submitting — never POSTs an empty reason", async () => {
    render(
      <ArtifactAcceptancePanel
        eventId="event-1"
        artifactCode="d11_response_checklist"
        artifactName="Response coverage matrix"
        latestAcceptance={null}
      />,
    );
    fireEvent.click(
      screen.getByTestId(
        "source-shell-artifact-accept-toggle-d11_response_checklist",
      ),
    );
    fireEvent.submit(
      screen.getByTestId(
        "source-shell-artifact-accept-form-d11_response_checklist",
      ),
    );
    await waitFor(() => {
      expect(
        screen.getByText("A reason for accepting this artifact is required."),
      ).toBeInTheDocument();
    });
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it("POSTs the real form values to the accept route and calls onAccepted on success", async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ ok: true, acceptance: LATEST }),
    });
    const onAccepted = jest.fn();
    render(
      <ArtifactAcceptancePanel
        eventId="event-1"
        artifactCode="d11_response_checklist"
        artifactName="Response coverage matrix"
        latestAcceptance={null}
        onAccepted={onAccepted}
      />,
    );
    fireEvent.click(
      screen.getByTestId(
        "source-shell-artifact-accept-toggle-d11_response_checklist",
      ),
    );
    fireEvent.change(
      screen.getByPlaceholderText("Why is this version being accepted now?"),
      { target: { value: "Vendor coverage matrix reviewed and complete." } },
    );
    fireEvent.submit(
      screen.getByTestId(
        "source-shell-artifact-accept-form-d11_response_checklist",
      ),
    );

    await waitFor(() => expect(onAccepted).toHaveBeenCalledTimes(1));

    expect(global.fetch).toHaveBeenCalledWith(
      "/api/v1/source/event-1/artifacts/d11_response_checklist/accept",
      expect.objectContaining({ method: "POST" }),
    );
    const body = JSON.parse((global.fetch as jest.Mock).mock.calls[0][1].body);
    expect(body.approvalRationale).toBe(
      "Vendor coverage matrix reviewed and complete.",
    );
  });

  it("shows the server error message and does not call onAccepted on failure", async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      json: async () => ({
        error: "forbidden",
        detail: "Upload rights are required.",
      }),
    });
    const onAccepted = jest.fn();
    render(
      <ArtifactAcceptancePanel
        eventId="event-1"
        artifactCode="d11_response_checklist"
        artifactName="Response coverage matrix"
        latestAcceptance={null}
        onAccepted={onAccepted}
      />,
    );
    fireEvent.click(
      screen.getByTestId(
        "source-shell-artifact-accept-toggle-d11_response_checklist",
      ),
    );
    fireEvent.change(
      screen.getByPlaceholderText("Why is this version being accepted now?"),
      { target: { value: "Reviewed." } },
    );
    fireEvent.submit(
      screen.getByTestId(
        "source-shell-artifact-accept-form-d11_response_checklist",
      ),
    );

    await waitFor(() => {
      expect(
        screen.getByText("Upload rights are required."),
      ).toBeInTheDocument();
    });
    expect(onAccepted).not.toHaveBeenCalled();
  });

  // PR 4D (ADR-0015): a real 409 stage_not_eligible response from the
  // accept route is a single flattened blocker, not a blockers[] array —
  // it must still render through the same list rather than being dropped.
  it("shows a real stage_not_eligible 409's detail sentence, not just a generic failure message", async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      json: async () => ({
        error: "stage_not_eligible",
        detail:
          'd24_decision_brief is not eligible to accept before stage "executive_decision".',
        earliestEligibleStage: "executive_decision",
        currentStage: "scope",
      }),
    });
    render(
      <ArtifactAcceptancePanel
        eventId="event-1"
        artifactCode="d24_decision_brief"
        artifactName="Decision brief"
        latestAcceptance={null}
      />,
    );
    fireEvent.click(
      screen.getByTestId(
        "source-shell-artifact-accept-toggle-d24_decision_brief",
      ),
    );
    fireEvent.change(
      screen.getByPlaceholderText("Why is this version being accepted now?"),
      { target: { value: "Reviewed." } },
    );
    fireEvent.submit(
      screen.getByTestId(
        "source-shell-artifact-accept-form-d24_decision_brief",
      ),
    );
    await waitFor(() => {
      expect(
        screen.getByText(
          'd24_decision_brief is not eligible to accept before stage "executive_decision".',
        ),
      ).toBeInTheDocument();
    });
    expect(screen.getByText("Stage")).toBeInTheDocument();
  });

  it("surfaces the real authority decision after a successful accept — authoritative but not yet export-eligible", async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        ok: true,
        acceptance: LATEST,
        authority: {
          code: "d05_scope_memo",
          governanceStage: "human_review",
          isDraft: false,
          isAccepted: true,
          isAuthoritative: true,
          isExportEligible: false,
          isFinal: false,
          blockers: [
            {
              code: "governance_stage_below_export_minimum",
              detail: "Below the required approval minimum.",
            },
          ],
        },
      }),
    });
    render(
      <ArtifactAcceptancePanel
        eventId="event-1"
        artifactCode="d05_scope_memo"
        artifactName="Scope memo"
        latestAcceptance={null}
      />,
    );
    fireEvent.click(
      screen.getByTestId("source-shell-artifact-accept-toggle-d05_scope_memo"),
    );
    fireEvent.change(
      screen.getByPlaceholderText("Why is this version being accepted now?"),
      { target: { value: "Reviewed and complete." } },
    );
    fireEvent.submit(
      screen.getByTestId("source-shell-artifact-accept-form-d05_scope_memo"),
    );
    await waitFor(() => {
      expect(
        screen.getByTestId("source-shell-artifact-authority-d05_scope_memo"),
      ).toBeInTheDocument();
    });
    expect(
      screen.getByText(
        "Accepted and authoritative, but not yet cleared for export — see below.",
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Below the required approval minimum."),
    ).toBeInTheDocument();
  });
});
