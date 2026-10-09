/** @jest-environment jsdom */

/**
 * The document cabinet's client-approval controls, and what a refused approval
 * tells the reviewer.
 *
 * Accepting an AI-prepared draft as the authoritative phase deliverable — or
 * uploading an edited final to replace it — is how a Move's phase deliverable
 * becomes something the next phase is allowed to build on. The cabinet holds
 * the only two readers of that route in the repository, and both rendered its
 * refusals as `json.detail || json.error`.
 *
 * That precedence cannot be right, because `detail` on this route is authored
 * reviewer prose for some codes and a machine value for others. These cases
 * run the REAL `FileCabinetPanel` against the route's real response shapes and
 * assert what reaches the screen:
 *
 *   - `unsupported_type` sent the raw MIME string, so a reviewer who attached
 *     an archive was shown `application/zip`;
 *   - `internal_error` sent `(err as Error).message`, a raw JS message;
 *   - `not_found` sent no `detail` at all, so detail-first fell through to the
 *     bare token `not_found`;
 *   - `sign_off_failed` is reached only AFTER the document has been stored and
 *     a draft version recorded, and said neither, so a reviewer who read it as
 *     "nothing happened" and approved again recorded a second draft;
 *   - while `architecture_lineage_not_current` carries per-cause prose naming
 *     the remedy, which must still reach the reviewer unflattened.
 *
 * Both controls are exercised, because they are separate readers of the same
 * route writing the same `actionErr` state, and a fix applied to one would be
 * invisible from the other.
 */

import "@testing-library/jest-dom";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { FileCabinetPanel } from "../FileCabinetPanel";
import { describeMoveClientApprovalRefusal } from "@/lib/programs/move-client-approval-refusal";

/**
 * An artifact `supportsGeneratedClientApproval` accepts: a current generated
 * deliverable on the generated-artifact route, not already approved, with a
 * current evidence snapshot.
 */
const APPROVABLE_DRAFT = {
  artifactId: "artifact-1",
  artifactType: "current_state_diagnostic",
  family: "generated_deliverable",
  title: "Current state diagnostic",
  phase: 2,
  fileFormat: "docx",
  fileName: "current-state-diagnostic.docx",
  version: 1,
  status: "draft",
  lifecycleState: "current",
  qualityScore: null,
  unsupportedClaims: 0,
  generatedBy: "nexus",
  createdAt: "2026-10-08T00:00:00.000Z",
  fileSize: 4096,
  stored: "blob",
  openItems: [],
  evidenceSnapshotStatus: "current" as const,
  downloadUrl: "/api/v1/artifacts/artifact-1",
};

const DRAFT_PREVIEW_HTML =
  "<html><body><h1>Current state diagnostic</h1><p>Baseline findings for the discovery step.</p></body></html>";

type Refusal = { status: number; body: Record<string, unknown> };

/**
 * Serve the three reads this surface issues: the artifacts list, the inline
 * draft preview (which the accept control needs before it enables), and the
 * client-approval POST that answers with the refusal under test.
 */
function mockCabinet(refusal: Refusal) {
  const approvalCalls: RequestInit[] = [];
  global.fetch = jest.fn(async (url: string, init?: RequestInit) => {
    if (url.includes("/client-approval")) {
      approvalCalls.push(init ?? {});
      return {
        ok: false,
        status: refusal.status,
        json: async () => refusal.body,
      } as unknown as Response;
    }
    if (url.includes("format=html")) {
      return {
        ok: true,
        status: 200,
        text: async () => DRAFT_PREVIEW_HTML,
      } as unknown as Response;
    }
    return {
      ok: true,
      status: 200,
      json: async () => ({
        artifacts: [APPROVABLE_DRAFT],
        pendingEvidenceReviews: [],
        reviewedEvidence: [],
        rejectedEvidence: [],
        evidenceReviewStatus: "available",
      }),
    } as unknown as Response;
  }) as unknown as typeof fetch;
  return approvalCalls;
}

async function openReviewPanel() {
  render(<FileCabinetPanel moveId="move-1" phase={2} canApproveGates />);
  fireEvent.click(await screen.findByRole("button", { name: "Review" }));
}

/** Accept the prepared draft; its control waits for the preview body. */
async function clickAcceptDraft() {
  await openReviewPanel();
  const accept = await screen.findByRole("button", {
    name: "Accept AI draft as authoritative",
  });
  await waitFor(() => expect(accept).toBeEnabled());
  fireEvent.click(accept);
}

/** Upload an edited final through the hidden file input. */
async function uploadApprovedFinal(file: File) {
  await openReviewPanel();
  const trigger = await screen.findByRole("button", {
    name: "Upload approved final",
  });
  // The cabinet holds TWO file inputs — this one and the evidence upload in
  // the panel body — so it is reached from its own control rather than by
  // document order, which would silently drive the wrong reader.
  const input = trigger.parentElement?.parentElement?.querySelector(
    'input[type="file"]',
  ) as HTMLInputElement;
  expect(input).toBeTruthy();
  Object.defineProperty(input, "files", { value: [file] });
  fireEvent.change(input);
}

describe("a refused accept-the-draft approval", () => {
  it("never shows the bare code when the route sent no detail", async () => {
    mockCabinet({ status: 404, body: { error: "not_found" } });

    await clickAcceptDraft();

    const message = await screen.findByText(/could not be read/);
    expect(message).toBeInTheDocument();
    expect(screen.queryByText("not_found")).toBeNull();
    expect(message.textContent).toContain("not recorded");
    expect(message.textContent).toMatch(/Reload Files & Evidence/);
  });

  it("does not show a raw thrown message to the reviewer", async () => {
    mockCabinet({
      status: 500,
      body: {
        error: "internal_error",
        detail: "Cannot read properties of undefined (reading 'id')",
      },
    });

    await clickAcceptDraft();

    expect(await screen.findByText(/did not say where/)).toBeInTheDocument();
    expect(screen.queryByText(/Cannot read properties/)).toBeNull();
  });

  it("states what WAS recorded when only the sign-off failed", async () => {
    // The route reaches this refusal after storing the document and recording
    // a draft version, so "could not be signed off" alone invites the one
    // action that records a second draft.
    mockCabinet({
      status: 409,
      body: {
        error: "sign_off_failed",
        detail: "Deliverable could not be signed off.",
      },
    });

    await clickAcceptDraft();

    const message = await screen.findByText(/was stored/);
    expect(message.textContent).toContain("draft version recorded");
    expect(message.textContent).toContain("approval itself was not");
    expect(message.textContent).toContain("rather than approving this one");
    expect(
      screen.queryByText("Deliverable could not be signed off."),
    ).toBeNull();
  });

  it("carries the lineage refusal's own per-cause prose through unflattened", async () => {
    const serverProse =
      "This Move has no approved P3 solution option, so there is no approved basis to check this document's lineage against.";
    mockCabinet({
      status: 409,
      body: {
        error: "architecture_lineage_not_current",
        detail: serverProse,
      },
    });

    await clickAcceptDraft();

    expect(await screen.findByText(serverProse)).toBeInTheDocument();
  });

  it("leaves the approval controls in place so the reviewer can act on what it said", async () => {
    mockCabinet({ status: 404, body: { error: "not_found" } });

    await clickAcceptDraft();

    await screen.findByText(/could not be read/);
    // The regression direction: a refusal must not take away the controls its
    // own sentence prescribes using.
    expect(
      screen.getByRole("button", { name: "Accept AI draft as authoritative" }),
    ).toBeEnabled();
    expect(
      screen.getByRole("button", { name: "Upload approved final" }),
    ).toBeEnabled();
  });
});

describe("a refused approved-final upload", () => {
  it("names accepted formats instead of echoing the MIME type", async () => {
    mockCabinet({
      status: 415,
      body: { error: "unsupported_type", detail: "application/zip" },
    });

    await uploadApprovedFinal(
      new File(["zip bytes"], "final.zip", { type: "application/zip" }),
    );

    const message = await screen.findByText(/not a format this workspace/);
    expect(message.textContent).toContain("Word");
    expect(message.textContent).not.toContain("application/zip");
    expect(screen.queryByText("application/zip")).toBeNull();
  });

  it("states the size limit in megabytes, not a byte count", async () => {
    mockCabinet({
      status: 413,
      body: { error: "file_too_large", detail: "max 104857600 bytes" },
    });

    await uploadApprovedFinal(
      new File(["big"], "final.docx", {
        type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      }),
    );

    const message = await screen.findByText(/over the 100 MB upload limit/);
    expect(message.textContent).toContain("not recorded");
    expect(screen.queryByText(/104857600/)).toBeNull();
  });

  it("reads the same describer as the accept control", async () => {
    // Both readers write one `actionErr`; this pins that neither keeps a
    // private sentence of its own.
    mockCabinet({ status: 404, body: { error: "not_found" } });

    await uploadApprovedFinal(
      new File(["doc"], "final.docx", {
        type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      }),
    );

    expect(
      await screen.findByText(
        describeMoveClientApprovalRefusal({ code: "not_found" }),
      ),
    ).toBeInTheDocument();
  });
});
