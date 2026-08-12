/**
 * @jest-environment jsdom
 */

// The redesigned canvas dropzone must be a REAL uploader, not a presentational
// placeholder. These tests assert the honesty contract for the `provide` task:
//   1. Selecting a file POSTs it to the governed artifacts upload endpoint.
//   2. On success it renders the uploaded-file card with the returned metadata
//      (name · "{size} · uploaded") — a real persisted file, not a fake state.
//   3. On failure it renders an error, never a fake "uploaded" success.
//   4. Without an eventId (sample/preview mode) the dropzone does NOT upload.

import "@testing-library/jest-dom";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";

// The dropzone calls next/navigation's useRouter (to refresh the page after a
// fact ingest flips the step insight live). Stub it so the component renders
// under jsdom without an App Router.
const routerRefresh = jest.fn();
jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: jest.fn(), refresh: routerRefresh }),
}));

import { TaskChecklist } from "../TaskChecklist";
import type { StageTaskView } from "../view-model";

const PROVIDE_TASK: StageTaskView = {
  id: "provide-volumetrics",
  title: "Provide the volumetrics",
  subtitle: "147 apps · pre-filled",
  type: "provide",
  state: "todo",
  guide: "Attach the 18-month service baseline as a CSV or XLSX.",
  cta: "Confirm volumetrics",
  provenance: {
    owner: "IT operations owner",
    source: "ITSM / finance baseline",
  },
};

const EXECUTIVE_DECISION_TASK: StageTaskView = {
  id: "executive-decision.recommendation-packet",
  title: "Confirm executive recommendation packet",
  subtitle: "Recommendation · value case · risk conditions",
  type: "decide",
  state: "todo",
  guide:
    "Review the executive decision packet: recommended supplier, value case, residual risks, stakeholder objections, and approval conditions.",
  cta: "Confirm recommendation packet",
};

const originalFetch = global.fetch;

afterEach(() => {
  global.fetch = originalFetch;
  jest.clearAllMocks();
});

function selectFile(file: File) {
  const input = screen.getByTestId("task-file-input") as HTMLInputElement;
  fireEvent.change(input, { target: { files: [file] } });
}

describe("TaskChecklist provide-task upload", () => {
  it("renders the evidence request as a clear upload row before file selection", () => {
    const boundTask: StageTaskView = {
      ...PROVIDE_TASK,
      factTemplateCode: "VOLUMETRICS_V1",
    };
    render(
      <TaskChecklist tasks={[boundTask]} eventId="evt-1" stageKey="scope" />,
    );

    const request = screen.getByTestId("task-evidence-request");
    expect(request).toHaveTextContent("Evidence request");
    expect(request).toHaveTextContent("Action needed");
    expect(request).toHaveTextContent("What to load");
    expect(request).toHaveTextContent("Provide the volumetrics file");
    expect(request).toHaveTextContent("Source system");
    expect(request).toHaveTextContent("ITSM / finance baseline");
    expect(request).toHaveTextContent("Owner");
    expect(request).toHaveTextContent("IT operations owner");
    expect(request).toHaveTextContent("Format");
    expect(request).toHaveTextContent("CSV or XLSX");
    expect(request).toHaveTextContent("Parse/writeback");
    expect(request).toHaveTextContent("Parse with VOLUMETRICS_V1");
    expect(request).toHaveTextContent("Upload status");
    expect(request).toHaveTextContent("Upload file");
  });

  it("POSTs the file and renders the uploaded-file card on success", async () => {
    const fetchMock = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        ok: true,
        artifact: {
          id: "artifact-1",
          originalName: "apex-svc-baseline-18mo.xlsx",
          sourceFormat: "spreadsheet",
          sizeBytes: 2_200_000,
          parseStatus: "pending",
        },
      }),
    });
    global.fetch = fetchMock as unknown as typeof fetch;

    render(
      <TaskChecklist tasks={[PROVIDE_TASK]} eventId="evt-1" stageKey="scope" />,
    );

    selectFile(
      new File([new Uint8Array(16)], "apex-svc-baseline-18mo.xlsx", {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      }),
    );

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledTimes(1);
    });
    const [url, init] = fetchMock.mock.calls[0];
    expect(String(url)).toContain("/api/v1/source/evt-1/artifacts/upload");
    expect((init as RequestInit).method).toBe("POST");
    expect((init as RequestInit).body).toBeInstanceOf(FormData);

    // The uploaded-file card reflects the REAL persisted file.
    await screen.findByText("apex-svc-baseline-18mo.xlsx");
    expect(screen.getByText(/uploaded/)).toBeInTheDocument();
    expect(screen.getByTestId("task-evidence-request")).toHaveTextContent(
      "Accepted",
    );
    // A remove affordance is present.
    expect(
      screen.getByLabelText(/Remove apex-svc-baseline-18mo\.xlsx/),
    ).toBeInTheDocument();
    await waitFor(() => expect(routerRefresh).toHaveBeenCalled());
  });

  it("renders an error (not a fake success) when the upload fails", async () => {
    const fetchMock = jest.fn().mockResolvedValue({
      ok: false,
      status: 500,
      json: async () => ({ ok: false, error: "storage_upload_failed" }),
    });
    global.fetch = fetchMock as unknown as typeof fetch;

    render(<TaskChecklist tasks={[PROVIDE_TASK]} eventId="evt-1" />);

    selectFile(
      new File([new Uint8Array(16)], "baseline.csv", { type: "text/csv" }),
    );

    const alert = await screen.findByRole("alert");
    expect(alert).toHaveTextContent("storage_upload_failed");
    // No fake uploaded card.
    expect(screen.queryByText(/· uploaded/)).not.toBeInTheDocument();
  });

  it("rejects a wrong-type file before any network call", async () => {
    const fetchMock = jest.fn();
    global.fetch = fetchMock as unknown as typeof fetch;

    render(<TaskChecklist tasks={[PROVIDE_TASK]} eventId="evt-1" />);

    selectFile(
      new File([new Uint8Array(16)], "evil.exe", {
        type: "application/x-msdownload",
      }),
    );

    const alert = await screen.findByRole("alert");
    expect(alert).toHaveTextContent(/CSV or XLSX/i);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("does not render a file input in sample/preview mode (no eventId)", () => {
    render(<TaskChecklist tasks={[PROVIDE_TASK]} />);
    expect(screen.getByTestId("task-dropzone")).toBeInTheDocument();
    expect(screen.queryByTestId("task-file-input")).not.toBeInTheDocument();
  });

  it("reflects server-hydrated done-state on mount (reload survives)", () => {
    // A task whose persisted evidence was re-derived server-side (evidenceComplete)
    // must render done + count in the "N of M complete" counter WITHOUT a fresh
    // in-session upload — this is the reload / tab-switch fix.
    const hydratedDone: StageTaskView = {
      ...PROVIDE_TASK,
      id: "provide-volumetrics",
      evidenceComplete: true,
    };
    const stillTodo: StageTaskView = {
      ...PROVIDE_TASK,
      id: "provide-app-inventory",
      title: "Provide the application inventory",
    };
    render(<TaskChecklist tasks={[hydratedDone, stillTodo]} eventId="evt-1" />);

    // Counter reflects the hydrated evidence: 1 of 2.
    expect(screen.getByText(/1 \/ 2 complete/)).toBeInTheDocument();
  });

  it("does NOT mark a task done without persisted evidence (no fake done)", () => {
    render(<TaskChecklist tasks={[PROVIDE_TASK]} eventId="evt-1" />);
    // No evidenceComplete + no upload → 0 of 1; never a fabricated done.
    expect(screen.getByText(/0 \/ 1 complete/)).toBeInTheDocument();
  });

  it("also ingests facts and refreshes when the task binds a template", async () => {
    // Two POSTs: 1) artifact upload, 2) fact ingest-file. Both return ok.
    const fetchMock = jest
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          ok: true,
          artifact: {
            id: "artifact-1",
            originalName: "volumetrics.csv",
            sourceFormat: "csv",
            sizeBytes: 4096,
            parseStatus: "parsed",
          },
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          ok: true,
          eventId: "evt-1",
          templateCode: "VOLUMETRICS_V1",
          factsWritten: 5,
          unmappedColumns: ["Notes"],
          rejectedRows: [],
        }),
      });
    global.fetch = fetchMock as unknown as typeof fetch;

    const boundTask: StageTaskView = {
      ...PROVIDE_TASK,
      factTemplateCode: "VOLUMETRICS_V1",
    };
    render(
      <TaskChecklist tasks={[boundTask]} eventId="evt-1" stageKey="scope" />,
    );

    selectFile(
      new File([new Uint8Array(16)], "volumetrics.csv", { type: "text/csv" }),
    );

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2));
    // The second call is the deterministic fact ingest-file route.
    const secondUrl = String(fetchMock.mock.calls[1][0]);
    expect(secondUrl).toContain("/api/v1/source/evt-1/facts/ingest-file");
    const secondBody = fetchMock.mock.calls[1][1]?.body as FormData;
    expect(secondBody.get("artifactId")).toBe("artifact-1");

    // The honest result chip renders the real written count.
    const chip = await screen.findByTestId("fact-ingest-result");
    expect(chip).toHaveTextContent(/5 facts written/i);
    // And the page is refreshed so the step insight re-reads the new facts.
    await waitFor(() => expect(routerRefresh).toHaveBeenCalled());
  });

  it("shows a parse warning instead of fake success when a template upload writes zero facts", async () => {
    const fetchMock = jest
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          ok: true,
          artifact: {
            id: "artifact-1",
            originalName: "official-but-mismatched.csv",
            sourceFormat: "csv",
            sizeBytes: 1024,
            parseStatus: "parsed",
          },
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          ok: true,
          eventId: "evt-1",
          templateCode: "VOLUMETRICS_V1",
          factsWritten: 0,
          unmappedColumns: ["Month", "Ticket volume", "P1/P2 count"],
          rejectedRows: [],
        }),
      });
    global.fetch = fetchMock as unknown as typeof fetch;

    const boundTask: StageTaskView = {
      ...PROVIDE_TASK,
      factTemplateCode: "VOLUMETRICS_V1",
    };
    render(
      <TaskChecklist tasks={[boundTask]} eventId="evt-1" stageKey="scope" />,
    );

    selectFile(
      new File([new Uint8Array(16)], "official-but-mismatched.csv", {
        type: "text/csv",
      }),
    );

    const alert = await screen.findByRole("alert");
    expect(alert).toHaveTextContent(/No facts were written/i);
    expect(alert).toHaveTextContent(/Month, Ticket volume, P1\/P2 count/i);
    expect(
      screen.queryByText("official-but-mismatched.csv"),
    ).not.toBeInTheDocument();
    expect(routerRefresh).not.toHaveBeenCalled();
  });

  it("renders a real template download link for template-bound uploads", () => {
    const boundTask: StageTaskView = {
      ...PROVIDE_TASK,
      factTemplateCode: "VOLUMETRICS_V1",
    };
    render(
      <TaskChecklist tasks={[boundTask]} eventId="evt-1" stageKey="scope" />,
    );

    const link = screen.getByTestId("task-template-download");
    expect(link).toHaveAttribute(
      "href",
      "/api/v1/source/evt-1/evidence/EVID-SRC-SCOPE-TICKET-HISTORY/template",
    );
  });

  it("falls back to the canonical task id when live payload omits factTemplateCode", async () => {
    const fetchMock = jest
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          ok: true,
          artifact: {
            id: "artifact-1",
            originalName: "volumetrics.csv",
            sourceFormat: "csv",
            sizeBytes: 4096,
            parseStatus: "pending",
          },
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          ok: true,
          eventId: "evt-1",
          templateCode: "VOLUMETRICS_V1",
          factsWritten: 5,
          unmappedColumns: [],
          rejectedRows: [],
        }),
      });
    global.fetch = fetchMock as unknown as typeof fetch;

    const livePayloadTask: StageTaskView = {
      ...PROVIDE_TASK,
      id: "scope.volumetrics",
      template: {
        format: "XLSX",
        name: "Volumetrics workbook",
        meta: "Template metadata from the live payload",
      },
    };
    render(
      <TaskChecklist
        tasks={[livePayloadTask]}
        eventId="evt-1"
        stageKey="scope"
      />,
    );

    expect(screen.getByTestId("task-template-download")).toHaveAttribute(
      "href",
      "/api/v1/source/evt-1/evidence/EVID-SRC-SCOPE-TICKET-HISTORY/template",
    );

    selectFile(
      new File([new Uint8Array(16)], "volumetrics.csv", { type: "text/csv" }),
    );

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2));
    const ingestBody = fetchMock.mock.calls[1][1]?.body as FormData;
    expect(ingestBody.get("templateCode")).toBe("VOLUMETRICS_V1");
    expect(ingestBody.get("artifactId")).toBe("artifact-1");
  });

  it("persists a mapped decide task as governed evidence and refreshes", async () => {
    const fetchMock = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        ok: true,
        evidence: {
          requirementId: "EVID-SRC-DEC-STAKEHOLDER-ENDORSEMENT",
          currentState: "Available",
        },
      }),
    });
    global.fetch = fetchMock as unknown as typeof fetch;

    render(
      <TaskChecklist
        tasks={[EXECUTIVE_DECISION_TASK]}
        eventId="evt-1"
        stageKey="executive_decision"
      />,
    );

    fireEvent.click(
      screen.getByRole("button", { name: "Confirm recommendation packet" }),
    );

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
    const [url, init] = fetchMock.mock.calls[0];
    expect(String(url)).toBe(
      "/api/v1/source/evt-1/evidence/EVID-SRC-DEC-STAKEHOLDER-ENDORSEMENT/answer",
    );
    expect((init as RequestInit).method).toBe("POST");
    expect(JSON.parse(String((init as RequestInit).body))).toMatchObject({
      stage: "executive_decision",
    });
    await waitFor(() => expect(routerRefresh).toHaveBeenCalled());
    expect(screen.getByText(/1 \/ 1 complete/)).toBeInTheDocument();
  });

  it("shows an error and does not fake completion when a mapped decide save fails", async () => {
    const fetchMock = jest.fn().mockResolvedValue({
      ok: false,
      status: 500,
      json: async () => ({ ok: false, error: "evidence_answer_failed" }),
    });
    global.fetch = fetchMock as unknown as typeof fetch;

    render(
      <TaskChecklist
        tasks={[EXECUTIVE_DECISION_TASK]}
        eventId="evt-1"
        stageKey="executive_decision"
      />,
    );

    fireEvent.click(
      screen.getByRole("button", { name: "Confirm recommendation packet" }),
    );

    const alert = await screen.findByRole("alert");
    expect(alert).toHaveTextContent("evidence_answer_failed");
    expect(screen.getByText(/0 \/ 1 complete/)).toBeInTheDocument();
    expect(routerRefresh).not.toHaveBeenCalled();
  });
});
