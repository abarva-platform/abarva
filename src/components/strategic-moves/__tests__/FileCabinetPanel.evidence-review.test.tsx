/** @jest-environment jsdom */

import "@testing-library/jest-dom";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { FileCabinetPanel } from "../FileCabinetPanel";

describe("Moves File Cabinet evidence review", () => {
  it("preserves a deliberate session-file classification through the upload request", async () => {
    const uploadedForms: FormData[] = [];
    const fetchMock = jest.fn(async (url: string, init?: RequestInit) => {
      if (url.includes("/artifacts/upload") && init?.method === "POST") {
        uploadedForms.push(init.body as FormData);
        return {
          ok: true,
          json: async () => ({
            ok: true,
            blobStored: true,
            evidence: {
              id: "evidence-session-1",
              reviewId: "review-session-1",
              reviewStatus: "pending_review",
              parseMethod: "markdown-text-extract",
            },
          }),
        } as Response;
      }
      return {
        ok: true,
        json: async () => ({
          artifacts: [],
          pendingEvidenceReviews: [],
          evidenceReviewStatus: "available",
        }),
      } as Response;
    });
    global.fetch = fetchMock as typeof fetch;

    render(<FileCabinetPanel moveId="move-1" phase={2} />);
    fireEvent.change(screen.getByLabelText("File Cabinet upload type"), {
      target: { value: "session_artifact" },
    });
    fireEvent.change(screen.getByLabelText("Upload Move file"), {
      target: {
        files: [new File(["approved notes"], "operations_workshop.md", { type: "text/markdown" })],
      },
    });

    await screen.findByText(/as a session file.*Human review is required/i);
    expect(uploadedForms[0]?.get("family")).toBe("session_artifact");
    expect(uploadedForms[0]?.get("phase")).toBe("2");
  });

  it("lets a reviewer correct parsed facts against source text before approval", async () => {
    let pending = [
      {
        evidenceId: "evidence-1",
        reviewId: "review-1",
        title: "baseline.docx",
        familyKey: "baseline",
        phase: 2,
        parseMethod: "docx-text-extract/v1",
        confidence: 0.86,
        sourceTextPreview: "Original source says baseline is 18%.",
        extraction: {
          version: 1,
          summary: "Parser found the current baseline.",
          structured: {
            decisions: [],
            risks: [],
            baselineCandidates: ["18%"],
            actionItems: [],
            observations: [],
            assumptions: [],
            openQuestions: [],
            citations: [{ quote: "18%", locator: "page 4" }],
          },
        },
      },
    ];
    let postedBody: Record<string, unknown> | null = null;
    const onEvidenceChanged = jest.fn();
    const fetchMock = jest.fn(async (_url: string, init?: RequestInit) => {
      if (init?.method === "POST") {
        postedBody = JSON.parse(String(init.body)) as Record<string, unknown>;
        pending = [];
        return { ok: true, json: async () => ({ ok: true }) } as Response;
      }
      return {
        ok: true,
        json: async () => ({
          artifacts: [],
          pendingEvidenceReviews: pending,
          evidenceReviewStatus: "available",
        }),
      } as Response;
    });
    global.fetch = fetchMock as typeof fetch;

    render(
      <FileCabinetPanel
        moveId="move-1"
        phase={2}
        onEvidenceChanged={onEvidenceChanged}
      />,
    );

    await screen.findByText("1 evidence item awaiting review");
    fireEvent.click(screen.getByText(/Review extracted information/));
    fireEvent.click(screen.getByText("Original parsed source text"));
    expect(
      screen.getByText("Original source says baseline is 18%."),
    ).toBeInTheDocument();

    fireEvent.change(
      screen.getByRole("textbox", { name: "baseline.docx reviewed summary" }),
      { target: { value: "Human-confirmed baseline is 18%." } },
    );
    fireEvent.click(
      screen.getByRole("button", { name: "Approve reviewed version" }),
    );

    await waitFor(() => expect(postedBody).not.toBeNull());
    expect(postedBody).toEqual(
      expect.objectContaining({
        decision: "approved",
        reviewedExtraction: expect.objectContaining({
          summary: "Human-confirmed baseline is 18%.",
          structured: expect.objectContaining({
            baselineCandidates: ["18%"],
            citations: [{ quote: "18%", locator: "page 4" }],
          }),
        }),
      }),
    );
    await waitFor(() =>
      expect(screen.queryByText("1 evidence item awaiting review")).toBeNull(),
    );
    expect(onEvidenceChanged).toHaveBeenCalledTimes(1);
  });
});
