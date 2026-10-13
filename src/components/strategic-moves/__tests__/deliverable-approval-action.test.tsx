/**
 * @jest-environment jsdom
 */

import "@testing-library/jest-dom";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { AuthoredDeliverableUploadAction } from "../AuthoredDeliverableUploadAction";
const mockRefresh = jest.fn();
jest.mock("next/navigation", () => ({ useRouter: () => ({ refresh: mockRefresh }) }));

import { DeliverableApprovalAction } from "../DeliverableApprovalAction";

function jsonResponse(body: unknown, status: number): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
  } as Response;
}

describe("DeliverableApprovalAction", () => {
  const originalFetch = global.fetch;

  afterEach(() => {
    global.fetch = originalFetch;
    jest.restoreAllMocks();
  });

  it("surfaces readiness blockers and requires a second explicit acknowledgement before approval", async () => {
    const fetchMock = jest
      .fn()
      .mockResolvedValueOnce(
        jsonResponse(
          {
            error: "client_readiness_blockers",
            detail: "Client-readiness blockers found.",
            blockers: [
              {
                kind: "model_name",
                match: "claude-sonnet-5",
                why: "Internal model names are not client-facing.",
              },
            ],
            acknowledgeField: "acknowledgeReadinessBlockers",
          },
          422,
        ),
      )
      .mockReturnValueOnce(new Promise<Response>(() => undefined));
    global.fetch = fetchMock as typeof fetch;

    render(
      <DeliverableApprovalAction
        moveId="move-1"
        deliverableId="deliverable-1"
        alreadyApproved={false}
      />,
    );

    fireEvent.change(screen.getByRole("textbox", { name: /approval note/i }), {
      target: { value: "Synthetic E2E smoke - reviewed current evidence-bound deliverable." },
    });

    fireEvent.click(screen.getByRole("button", { name: /approve as-is/i }));

    expect(
      await screen.findByText("Client-readiness blockers found."),
    ).toBeInTheDocument();
    expect(
      screen.getByText((_content, element) =>
        Boolean(
          element?.tagName === "LI" &&
            element.textContent?.includes("model_name: claude-sonnet-5"),
        ),
      ),
    ).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock.mock.calls[0][1]).toMatchObject({ method: "POST" });
    expect(fetchMock.mock.calls[0][1]).toMatchObject({
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        approvalRationale: "Synthetic E2E smoke - reviewed current evidence-bound deliverable.",
      }),
    });

    fireEvent.click(
      screen.getByRole("button", {
        name: /acknowledge blockers and approve/i,
      }),
    );

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2));
    expect(fetchMock.mock.calls[1][1]).toMatchObject({
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        approvalRationale: "Synthetic E2E smoke - reviewed current evidence-bound deliverable.",
        acknowledgeReadinessBlockers: true,
      }),
    });
  });

  it("keeps the reviewed upload attached to an explicit readiness acknowledgement", async () => {
    const fetchMock = jest
      .fn()
      .mockResolvedValueOnce(
        jsonResponse(
          {
            error: "client_readiness_blockers",
            detail: "The uploaded version contains client-readiness blockers.",
            blockers: [{ kind: "uuid", match: "5bbf2d7c-328c-41e0-8a69-50094cd15f75" }],
            acknowledgeField: "acknowledgeReadinessBlockers",
          },
          422,
        ),
      )
      .mockReturnValueOnce(new Promise<Response>(() => undefined));
    global.fetch = fetchMock as typeof fetch;

    const { container } = render(
      <DeliverableApprovalAction
        moveId="move-1"
        deliverableId="deliverable-1"
        alreadyApproved={false}
      />,
    );
    const file = new File(["reviewed charter"], "reviewed-charter.docx", {
      type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    });
    const fileInput = container.querySelector('input[type="file"]');
    const rationale = "Synthetic E2E smoke - reviewed current evidence-bound deliverable.";

    fireEvent.change(screen.getByRole("textbox", { name: /approval note/i }), {
      target: { value: rationale },
    });

    fireEvent.click(screen.getByRole("button", { name: /upload approved version/i }));
    fireEvent.change(fileInput!, { target: { files: [file] } });

    expect(
      await screen.findByText("The uploaded version contains client-readiness blockers."),
    ).toBeInTheDocument();
    fireEvent.click(
      screen.getByRole("button", {
        name: /acknowledge blockers and approve uploaded version/i,
      }),
    );

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2));
    const form = fetchMock.mock.calls[1][1]?.body as FormData;
    expect(form.get("file")).toBe(file);
    expect(form.get("acknowledgeReadinessBlockers")).toBe("true");
    expect(form.get("approvalRationale")).toBe(rationale);
  });

  it("shows non-readiness sign-off errors as reviewer-visible messages", async () => {
    global.fetch = jest.fn().mockResolvedValue(
      jsonResponse(
        {
          error: "generated_artifact_not_scannable",
          detail:
            "A generated Office companion must be readable before this deliverable can be signed off.",
        },
        422,
      ),
    ) as typeof fetch;

    render(
      <DeliverableApprovalAction
        moveId="move-1"
        deliverableId="deliverable-1"
        alreadyApproved={false}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: /approve as-is/i }));

    expect(
      await screen.findByText(
        "A generated Office companion must be readable before this deliverable can be signed off.",
      ),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", {
        name: /acknowledge blockers and approve/i,
      }),
    ).not.toBeInTheDocument();
  });
});


describe("authored DOCX draft upload action", () => {
  const originalFetch = global.fetch;
  const originalCrypto = global.crypto;
  beforeEach(() => {
    mockRefresh.mockClear();
    Object.defineProperty(global, "crypto", { configurable: true, value: {
      randomUUID: () => "50000000-0000-4000-8000-000000000001",
      subtle: { digest: jest.fn(async () => new Uint8Array(32).fill(1).buffer) },
    } });
  });
  afterEach(() => { global.fetch = originalFetch; Object.defineProperty(global, "crypto", { configurable: true, value: originalCrypto }); });
  function select() {
    const file = new File(["synthetic authored words"], "charter.docx", { type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document" });
    Object.defineProperty(file, "arrayBuffer", { value: async () => new Uint8Array([1, 2, 3]).buffer });
    fireEvent.change(screen.getByLabelText("Authored DOCX"), { target: { files: [file] } });
  }
  it("keeps an empty selection unsigned and requires file selection before upload", () => {
    const fetchMock = jest.fn(); global.fetch = fetchMock;
    render(<AuthoredDeliverableUploadAction moveId="move-1" documentKey="charter" />);
    expect(screen.getByRole("button", { name: "Upload authored draft" })).toBeDisabled(); expect(fetchMock).not.toHaveBeenCalled();
  });
  it("submits only draft admission with declared identity and computed byte hash", async () => {
    const recorded = jest.fn(); window.addEventListener("moves:authored-admission-recorded", recorded);
    const fetchMock = jest.fn().mockResolvedValue(jsonResponse({ ok: true, admittedVersion: 1, artifactVersion: 1, originalDownloadUrl: "/uploaded-original" }, 201)); global.fetch = fetchMock;
    render(<AuthoredDeliverableUploadAction moveId="move-1" documentKey="charter" />); select();
    await waitFor(() => expect(screen.getByRole("button", { name: "Upload authored draft" })).toBeEnabled());
    fireEvent.click(screen.getByRole("button", { name: "Upload authored draft" }));
    await waitFor(() => expect(mockRefresh).toHaveBeenCalledTimes(1));
    expect(fetchMock.mock.calls[0][0]).toBe("/api/v1/programs/move-1/deliverables/authored-upload");
    const form = fetchMock.mock.calls[0][1].body as FormData;
    expect(form.get("expectedState")).toBe("absent"); expect(form.get("deliverableTypeKey")).toBe("charter");
    expect(form.get("expectedFileSha256")).toBe("01".repeat(32)); expect(form.get("signOff")).toBeNull();
    expect(screen.getByRole("link", { name: "Download uploaded original" })).toHaveAttribute("href", "/uploaded-original");
    expect(recorded).toHaveBeenCalledTimes(1);
    expect((recorded.mock.calls[0][0] as CustomEvent).detail).toEqual({ moveId: "move-1" });
    window.removeEventListener("moves:authored-admission-recorded", recorded);
  });
  it("retains the same operation receipt after partial storage or a lost response", async () => {
    const fetchMock = jest.fn().mockResolvedValueOnce(jsonResponse({ detail: "Original retained; document admission unconfirmed.", storedArtifactId: "file-1" }, 503))
      .mockRejectedValueOnce(new Error("connection lost")); global.fetch = fetchMock;
    render(<AuthoredDeliverableUploadAction moveId="move-1" documentKey="charter" />); select();
    await waitFor(() => expect(screen.getByRole("button", { name: "Upload authored draft" })).toBeEnabled());
    fireEvent.click(screen.getByRole("button", { name: "Upload authored draft" }));
    await waitFor(() => expect(screen.getByRole("alert")).toHaveTextContent("Original retained"));
    expect(screen.getByRole("link", { name: "Download retained upload" })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Upload authored draft" }));
    await waitFor(() => expect(screen.getByRole("alert")).toHaveTextContent("same request"));
    expect(fetchMock.mock.calls.map(c => (c[1].body as FormData).get("requestId"))).toEqual(Array(2).fill("50000000-0000-4000-8000-000000000001"));
  });
  it("reports the exact refusal and does not refresh or sign off", async () => {
    const recorded = jest.fn(); window.addEventListener("moves:authored-admission-recorded", recorded);
    const fetchMock = jest.fn().mockResolvedValue(jsonResponse({ detail: "This document already has a version." }, 409)); global.fetch = fetchMock;
    render(<AuthoredDeliverableUploadAction moveId="move-1" documentKey="discovery_plan" />); select();
    await waitFor(() => expect(screen.getByRole("button", { name: "Upload authored draft" })).toBeEnabled());
    fireEvent.click(screen.getByRole("button", { name: "Upload authored draft" }));
    await waitFor(() => expect(screen.getByRole("alert")).toHaveTextContent("already has a version")); expect(mockRefresh).not.toHaveBeenCalled();
    expect(recorded).not.toHaveBeenCalled(); window.removeEventListener("moves:authored-admission-recorded", recorded);
  });
});
