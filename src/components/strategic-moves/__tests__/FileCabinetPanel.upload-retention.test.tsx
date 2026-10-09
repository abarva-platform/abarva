/** @jest-environment jsdom */

/**
 * The document cabinet's storage state, on the real panel.
 *
 * One boolean decided a red chip, so three situations shared two words and
 * only one of them is a problem:
 *
 *   - Every `generated_artifacts` row — the output of Approve & Build — came
 *     back with no `stored` field, because those deliverables are rendered
 *     from their recorded content on download and never occupy the vault. They
 *     were all marked red `Storage pending` with nothing pending.
 *   - A vault row written while object storage was unavailable records
 *     `storage: "unconfigured"`. For an UPLOAD that is unrecoverable, and it
 *     got the same two words.
 *
 * And the upload confirmation differed from a healthy one only by the absence
 * of " to secure storage", in the success colour, with the file's only copy
 * gone. These cases drive the REAL panel through a real upload, because the
 * finding is about what the reviewer is shown.
 */

import "@testing-library/jest-dom";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { FileCabinetPanel } from "../FileCabinetPanel";
import { describeMoveUploadRefusal } from "@/lib/programs/move-upload-refusal";
import {
  ACCEPTED_UPLOAD_FORMATS,
  UPLOAD_ACCEPT_ATTRIBUTE,
  describeUploadBounds,
  describeUploadSizeLimit,
} from "@/lib/programs/attachments/upload-control-bounds";

function row(overrides: Record<string, unknown> = {}) {
  return {
    artifactId: "artifact-1",
    artifactType: "discovery_evidence",
    family: "uploaded_evidence",
    title: "Discovery workshop notes",
    phase: 2,
    fileFormat: "pdf",
    fileName: "discovery-workshop.pdf",
    version: 1,
    status: "aligned",
    lifecycleState: "current",
    qualityScore: null,
    unsupportedClaims: 0,
    generatedBy: "reviewer@example.com",
    createdAt: "2026-10-08T00:00:00.000Z",
    fileSize: 4096,
    stored: "azure_blob",
    openItems: [],
    downloadUrl: "/api/v1/programs/move-1/artifacts/artifact-1/download",
    ...overrides,
  };
}

function cabinetBody(artifacts: Array<Record<string, unknown>>) {
  return {
    artifacts,
    pendingEvidenceReviews: [],
    reviewedEvidence: [],
    rejectedEvidence: [],
    evidenceReviewStatus: "available",
  };
}

function mockCabinet(artifacts: Array<Record<string, unknown>>) {
  global.fetch = jest.fn(async () => ({
    ok: true,
    json: async () => cabinetBody(artifacts),
  })) as unknown as typeof fetch;
}

/**
 * The cabinet read, then one upload answering with `body`. Returns the form
 * the upload posted so the family it declared can be asserted.
 */
function mockCabinetAndUpload(body: Record<string, unknown>) {
  const posted: FormData[] = [];
  global.fetch = jest.fn(async (_url: string, init?: RequestInit) => {
    if (init?.method === "POST") {
      posted.push(init.body as FormData);
      return { ok: true, json: async () => body } as Response;
    }
    return {
      ok: true,
      json: async () => cabinetBody([]),
    } as Response;
  }) as unknown as typeof fetch;
  return posted;
}

async function uploadOneFile() {
  const input = await screen.findByLabelText("Upload Move file");
  fireEvent.change(input, {
    target: {
      files: [
        new File(["notes"], "discovery-workshop.pdf", {
          type: "application/pdf",
        }),
      ],
    },
  });
}

afterEach(() => {
  jest.restoreAllMocks();
});

describe("the cabinet's storage chip", () => {
  it("confirms a vault row as stored", async () => {
    mockCabinet([row()]);
    render(<FileCabinetPanel moveId="move-1" phase={2} canApproveGates />);

    expect(await screen.findByText("Vault")).toBeInTheDocument();
    expect(screen.queryByText("Not retained")).toBeNull();
  });

  it("stops warning about a deliverable that is rendered on request", async () => {
    // The live regression: a generated deliverable carries no `stored` field,
    // so every one of them was red.
    mockCabinet([
      row({
        artifactId: "generated-1",
        family: "generated_deliverable",
        artifactType: "current_state_diagnostic",
        title: "Current state diagnostic",
        stored: undefined,
        downloadUrl: "/api/v1/artifacts/generated-1",
      }),
    ]);
    render(<FileCabinetPanel moveId="move-1" phase={2} canApproveGates />);

    expect(await screen.findByText("Rendered on request")).toBeInTheDocument();
    expect(screen.queryByText("Storage pending")).toBeNull();
    expect(screen.queryByText("Not retained")).toBeNull();
  });

  it("names an upload whose bytes were not stored, and the action", async () => {
    mockCabinet([row({ stored: "unconfigured" })]);
    render(<FileCabinetPanel moveId="move-1" phase={2} canApproveGates />);

    const chip = await screen.findByText("Not retained");
    expect(chip).toBeInTheDocument();
    expect(chip.getAttribute("title")).toMatch(/Upload the file again/);
    expect(screen.queryByText("Storage pending")).toBeNull();
  });

  it("does not claim a row that records nothing was lost", async () => {
    mockCabinet([
      row({
        stored: null,
        downloadUrl: "/api/v1/programs/move-1/artifacts/artifact-1/download",
      }),
    ]);
    render(<FileCabinetPanel moveId="move-1" phase={2} canApproveGates />);

    expect(await screen.findByText("Storage not recorded")).toBeInTheDocument();
    expect(screen.queryByText("Not retained")).toBeNull();
  });
});

describe("what an upload tells the reviewer", () => {
  it("confirms a retained evidence upload", async () => {
    mockCabinetAndUpload({
      ok: true,
      artifactId: "artifact-9",
      blobStored: true,
      family: "uploaded_evidence",
      evidence: {
        id: "evidence-9",
        reviewId: "review-9",
        reviewStatus: "pending_review",
        parseMethod: "pdf-parse",
      },
    });
    render(<FileCabinetPanel moveId="move-1" phase={2} canApproveGates />);
    await uploadOneFile();

    const message = await screen.findByText(/to secure storage/);
    expect(message).toHaveTextContent(/Human review is required/);
    expect(message).toHaveStyle({ color: "#1E7E34" });
  });

  it("says a file whose bytes were not retained has to be uploaded again", async () => {
    // Before this the only difference from the case above was that four words
    // were missing, in the same green, and the phase selector advanced as if
    // the upload had completed.
    mockCabinetAndUpload({
      ok: true,
      artifactId: "artifact-9",
      blobStored: false,
      family: "uploaded_evidence",
      evidence: {
        id: "evidence-9",
        reviewId: "review-9",
        reviewStatus: "pending_review",
        parseMethod: "pdf-parse",
      },
    });
    render(<FileCabinetPanel moveId="move-1" phase={2} canApproveGates />);
    await uploadOneFile();

    const message = await screen.findByText(/not retained in secure storage/);
    expect(message).toHaveTextContent(/Upload the file again/);
    expect(message).toHaveTextContent(/do not approve evidence/);
    expect(message).toHaveStyle({ color: "#B71C1C" });
  });

  it("keeps reporting a retained file whose extraction did not register", async () => {
    mockCabinetAndUpload({
      ok: true,
      artifactId: "artifact-9",
      blobStored: true,
      family: "uploaded_evidence",
      evidence: {
        id: null,
        status: "not_captured",
        warning: "parser crashed",
      },
    });
    render(<FileCabinetPanel moveId="move-1" phase={2} canApproveGates />);
    await uploadOneFile();

    const message = await screen.findByText(
      /parsing\/review registration failed/,
    );
    expect(message).toHaveTextContent(/not available to generation/);
    expect(message).toHaveStyle({ color: "#B71C1C" });
  });

  it("still names a refusal in product language", async () => {
    // The refusal half is `describeMoveUploadRefusal`'s and must not have been
    // displaced by the retention classification.
    global.fetch = jest.fn(async (_url: string, init?: RequestInit) => {
      if (init?.method === "POST") {
        return {
          ok: false,
          status: 415,
          json: async () => ({
            error: "unsupported_type",
            detail: "application/zip",
          }),
        } as Response;
      }
      return { ok: true, json: async () => cabinetBody([]) } as Response;
    }) as unknown as typeof fetch;
    render(<FileCabinetPanel moveId="move-1" phase={2} canApproveGates />);
    await uploadOneFile();

    await waitFor(() => {
      expect(
        screen.getByText(/not a file type this workspace can read/),
      ).toBeInTheDocument();
    });
    expect(screen.queryByText(/application\/zip/)).toBeNull();
  });
});

/**
 * The refusal above is worded well and arrives too late: it is what a reviewer
 * reads AFTER the whole file has uploaded. The route refuses on two bounds the
 * control never declared — a MIME allowlist and a 100 MB cap — so a .zip or a
 * 300 MB recording was a full upload spent to learn a fact the picker already
 * had.
 *
 * These cases are on the real panel because the finding is about what the
 * control offers before a file is chosen, and because a bound exported but
 * never wired into the input is the same defect with extra steps.
 */
describe("the upload control states its bounds before a file is chosen", () => {
  it("states the formats and the cap beside the upload button", async () => {
    mockCabinet([]);
    render(<FileCabinetPanel moveId="move-1" phase={2} canApproveGates />);

    const bounds = await screen.findByTestId("move-upload-bounds");
    expect(bounds).toHaveTextContent(describeUploadBounds());
    expect(bounds).toHaveTextContent(describeUploadSizeLimit());
    expect(bounds).toHaveTextContent(/PDF/);
  });

  // The wiring. An `accept` derived in the module and never passed to the
  // input leaves the picker exactly as wide as it was.
  it("constrains the picker to the types the route accepts", async () => {
    mockCabinet([]);
    render(<FileCabinetPanel moveId="move-1" phase={2} canApproveGates />);

    const input = await screen.findByLabelText("Upload Move file");
    expect(input).toHaveAttribute("accept", UPLOAD_ACCEPT_ATTRIBUTE);
    const offered = (input.getAttribute("accept") ?? "").split(",");
    expect(offered).toContain("application/pdf");
    expect(offered).toContain(".pdf");
    // The two formats the allowlist deliberately excludes.
    expect(offered).not.toContain("application/zip");
    expect(offered).not.toContain("application/octet-stream");
  });

  it("keeps the bounds stated while an upload is in flight", async () => {
    mockCabinetAndUpload({ ok: true, blobStored: true });
    render(<FileCabinetPanel moveId="move-1" phase={2} canApproveGates />);
    await uploadOneFile();

    // The control's own sentence must survive the uploading state, because the
    // refusal it explains arrives at the end of that state, not before it.
    expect(await screen.findByTestId("move-upload-bounds")).toHaveTextContent(
      describeUploadBounds(),
    );
  });

  // The pre-upload sentence and the post-refusal sentence must name the same
  // formats, which is the whole reason the prose has one home.
  it("names the same formats before the upload as the refusal does after it", async () => {
    mockCabinet([]);
    render(<FileCabinetPanel moveId="move-1" phase={2} canApproveGates />);

    const bounds = await screen.findByTestId("move-upload-bounds");
    const refusal = describeMoveUploadRefusal({
      code: "unsupported_type",
      detail: "application/zip",
      fileName: "archive.zip",
    });
    expect(bounds).toHaveTextContent(ACCEPTED_UPLOAD_FORMATS);
    expect(refusal).toContain(ACCEPTED_UPLOAD_FORMATS);
  });
});
