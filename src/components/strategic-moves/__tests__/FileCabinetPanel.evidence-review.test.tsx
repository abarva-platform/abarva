/** @jest-environment jsdom */

import "@testing-library/jest-dom";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { FileCabinetPanel } from "../FileCabinetPanel";

describe("Moves File Cabinet evidence review", () => {
  it("does not expose evidence approval controls without workspace approval permission", async () => {
    global.fetch = jest.fn(async () => ({
      ok: true,
      json: async () => ({
        artifacts: [],
        pendingEvidenceReviews: [
          {
            evidenceId: "evidence-1",
            title: "workshop-notes.md",
            phase: 2,
            parseMethod: "markdown-line-parser",
            confidence: 0.8,
            sourceTextPreview: "Workshop notes",
            extraction: {
              version: 1,
              summary: "Notes",
              structured: {
                decisions: [],
                risks: [],
                baselineCandidates: [],
                actionItems: [],
                observations: [],
                assumptions: [],
                openQuestions: [],
                citations: [],
              },
            },
          },
        ],
        evidenceReviewStatus: "available",
      }),
    })) as unknown as typeof fetch;

    render(<FileCabinetPanel moveId="move-1" phase={2} />);

    expect(
      await screen.findByText(
        "Awaiting review by an authorized workspace user.",
      ),
    ).toBeInTheDocument();
    expect(screen.queryByText(/Review extracted information/)).toBeNull();
    expect(
      screen.queryByRole("button", { name: "Approve reviewed version" }),
    ).toBeNull();
  });

  it("makes absent review facts and evidence explicit", async () => {
    const fetchMock = jest.fn(async (url: string) => {
      if (url.endsWith("/review-decision")) {
        return {
          ok: true,
          json: async () => ({
            ok: true,
            reviewPackage: {
              reviewedArtifactId: "artifact-1",
              htmlVisualCompanionArtifactId: "artifact-1",
              docxEditableArtifactId: null,
              reviewedArtifactIds: ["artifact-1"],
            },
            packet: {
              headline: "Service diagnostic review",
              diagnosticThesis: "The artifact is presented for review.",
              strongestEvidence: [],
              quantifiedFacts: [],
              knownLimitations: ["P2 remains subject to final sign-off."],
              missingEvidence: [],
              decisionsRequired: [],
              recommendedNextAction: "Review the source evidence.",
              p3Implication: "Use only reviewed findings.",
            },
            latestDecision: null,
            readiness: {
              readyForP3Draft: false,
              readyForP3Final: false,
              p2FinalApproved: false,
              allowedNextAction: "review_p2",
              reason: "No review decision exists.",
            },
          }),
        } as Response;
      }
      return {
        ok: true,
        json: async () => ({
          artifacts: [
            {
              artifactId: "artifact-1",
              artifactType: "discovery_report",
              family: "generated_deliverable",
              title: "Service diagnostic",
              phase: 2,
              fileFormat: "html",
              fileName: "diagnostic.html",
              version: 1,
              status: "review_required",
              lifecycleState: "current",
              qualityScore: null,
              unsupportedClaims: 0,
              createdAt: "2026-09-30T00:00:00Z",
              fileSize: 1000,
              stored: "azure_blob",
              openItems: [],
              downloadUrl:
                "/api/v1/programs/move-1/artifacts/artifact-1/download",
            },
          ],
          pendingEvidenceReviews: [],
          evidenceReviewStatus: "available",
        }),
      } as Response;
    });
    global.fetch = fetchMock as typeof fetch;

    render(<FileCabinetPanel moveId="move-1" phase={2} />);
    fireEvent.click(await screen.findByRole("button", { name: "Review" }));

    expect(
      await screen.findByText(
        "No quantified facts were explicitly supplied for this review.",
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        "No strongest-evidence items were explicitly supplied for this review.",
      ),
    ).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/v1/programs/move-1/artifacts/artifact-1/review-decision",
      { credentials: "include" },
    );
  });

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
        files: [
          new File(["approved notes"], "operations_workshop.md", {
            type: "text/markdown",
          }),
        ],
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
        sourceArtifactId: "source-artifact-1",
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
        canApproveGates
        onEvidenceChanged={onEvidenceChanged}
      />,
    );

    await screen.findByText("1 evidence item awaiting review");
    expect(screen.getByRole("link", { name: "Open original" })).toHaveAttribute(
      "href",
      "/api/v1/programs/move-1/artifacts/source-artifact-1/download?inline=1",
    );
    expect(
      screen.getByRole("link", { name: "Download original" }),
    ).toHaveAttribute(
      "href",
      "/api/v1/programs/move-1/artifacts/source-artifact-1/download",
    );
    fireEvent.click(screen.getByText(/Review extracted information/));
    fireEvent.click(screen.getByText("Original parsed source text"));
    expect(
      screen.getByText("Original source says baseline is 18%."),
    ).toBeInTheDocument();

    fireEvent.change(
      screen.getByRole("textbox", { name: "baseline.docx reviewed summary" }),
      { target: { value: "Human-confirmed baseline is 18%." } },
    );
    fireEvent.change(
      screen.getByRole("textbox", { name: "baseline.docx review rationale" }),
      { target: { value: "Delegated automated smoke review on named operator instruction." } },
    );
    fireEvent.click(
      screen.getByRole("button", { name: "Approve reviewed version" }),
    );

    await waitFor(() => expect(postedBody).not.toBeNull());
    expect(postedBody).toEqual(
      expect.objectContaining({
        decision: "approved",
        rationale: "Delegated automated smoke review on named operator instruction.",
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

  it("keeps a reviewer's spaces and new lines while typing, and normalises them on save", async () => {
    // Each change event below is what one keystroke produces. The list fields
    // used to be rebuilt from trimmed, non-empty lines on every change, so the
    // keystroke that added a trailing space or a new line was undone before
    // the next one: corrections could be pasted but not typed.
    let pending = [
      {
        evidenceId: "evidence-1",
        reviewId: "review-1",
        sourceArtifactId: "source-artifact-1",
        title: "notes.md",
        familyKey: "baseline",
        phase: 1,
        parseMethod: "markdown-line-parser",
        confidence: 0.78,
        sourceTextPreview: "Queue and cohort remain assumptions.",
        extraction: {
          version: 1,
          summary: "Notes.",
          structured: {
            decisions: [],
            risks: [],
            baselineCandidates: [],
            actionItems: [],
            observations: [],
            assumptions: ["An assumption the source never states"],
            openQuestions: [],
            citations: [],
          },
        },
      },
    ];
    let postedBody: Record<string, unknown> | null = null;
    global.fetch = jest.fn(async (_url: string, init?: RequestInit) => {
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
    }) as typeof fetch;

    render(<FileCabinetPanel moveId="move-1" phase={1} canApproveGates />);
    await screen.findByText("1 evidence item awaiting review");
    fireEvent.click(screen.getByText(/Review extracted information/));

    const assumptions = screen.getByRole("textbox", {
      name: "notes.md reviewed assumptions",
    }) as HTMLTextAreaElement;

    // A word, then the space after it.
    fireEvent.change(assumptions, { target: { value: "Queue " } });
    expect(assumptions.value).toBe("Queue ");
    // A finished line, then Enter to start the next one.
    fireEvent.change(assumptions, {
      target: { value: "Queue and cohort remain assumptions\n" },
    });
    expect(assumptions.value).toBe("Queue and cohort remain assumptions\n");
    fireEvent.change(assumptions, {
      target: {
        value: "Queue and cohort remain assumptions\n\n  No PHI  \n",
      },
    });

    fireEvent.click(
      screen.getByRole("button", { name: "Approve reviewed version" }),
    );
    await waitFor(() => expect(postedBody).not.toBeNull());
    expect(postedBody).toEqual(
      expect.objectContaining({
        reviewedExtraction: expect.objectContaining({
          structured: expect.objectContaining({
            // Blank lines dropped and edges trimmed — once, at save.
            assumptions: ["Queue and cohort remain assumptions", "No PHI"],
          }),
        }),
      }),
    );
  });

  // A general upload is routed by keywords in the file's name and opening
  // lines unless the uploader says what it is. These pin that the statement
  // reaches the request, and that silence sends nothing.
  describe("declaring which required evidence a file covers", () => {
    function mockUpload(uploadedForms: FormData[]) {
      global.fetch = jest.fn(async (url: string, init?: RequestInit) => {
        if (url.includes("/artifacts/upload") && init?.method === "POST") {
          uploadedForms.push(init.body as FormData);
          return {
            ok: true,
            json: async () => ({
              ok: true,
              blobStored: true,
              evidence: {
                reviewStatus: "pending_review",
                parseMethod: "csv-line-parser",
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
      }) as typeof fetch;
    }
    const families = [
      { id: "kpi_family", label: "Baseline KPIs" },
      { id: "controls_family", label: "Risk controls" },
    ];
    const file = () => new File(["a,b"], "controls.csv", { type: "text/csv" });

    it("sends the declared family with the upload", async () => {
      const forms: FormData[] = [];
      mockUpload(forms);
      render(
        <FileCabinetPanel
          moveId="move-1"
          phase={2}
          evidenceFamilies={families}
        />,
      );
      fireEvent.change(
        screen.getByLabelText("Required evidence this file covers"),
        { target: { value: "controls_family" } },
      );
      fireEvent.change(screen.getByLabelText("Upload Move file"), {
        target: { files: [file()] },
      });
      await waitFor(() => expect(forms).toHaveLength(1));
      expect(forms[0].get("evidenceFamily")).toBe("controls_family");
    });

    it("sends the explicitly selected phase instead of the page phase", async () => {
      const forms: FormData[] = [];
      mockUpload(forms);
      render(
        <FileCabinetPanel
          moveId="move-1"
          phase={1}
          evidenceFamilies={families}
        />,
      );
      fireEvent.change(
        screen.getByLabelText("Required evidence this file covers"),
        { target: { value: "controls_family" } },
      );
      fireEvent.change(screen.getByLabelText("Evidence applies to phase"), {
        target: { value: "2" },
      });
      expect(
        screen.queryByLabelText("Required evidence this file covers"),
      ).toBeNull();
      fireEvent.change(screen.getByLabelText("Upload Move file"), {
        target: { files: [file()] },
      });
      await waitFor(() => expect(forms).toHaveLength(1));
      expect(forms[0].get("phase")).toBe("2");
      expect(forms[0].has("evidenceFamily")).toBe(false);
      expect(
        await screen.findByText(
          /Uploaded controls.csv for P2 Discover & Diagnose/,
        ),
      ).toBeInTheDocument();
    });

    it("defaults the declared upload phase to the page phase", async () => {
      const forms: FormData[] = [];
      mockUpload(forms);
      render(<FileCabinetPanel moveId="move-1" phase={2} />);
      expect(screen.getByLabelText("Evidence applies to phase")).toHaveValue(
        "2",
      );
      fireEvent.change(screen.getByLabelText("Upload Move file"), {
        target: { files: [file()] },
      });
      await waitFor(() => expect(forms).toHaveLength(1));
      expect(forms[0].get("phase")).toBe("2");
    });

    it("sends no family when none is stated", async () => {
      const forms: FormData[] = [];
      mockUpload(forms);
      render(
        <FileCabinetPanel
          moveId="move-1"
          phase={2}
          evidenceFamilies={families}
        />,
      );
      fireEvent.change(screen.getByLabelText("Upload Move file"), {
        target: { files: [file()] },
      });
      await waitFor(() => expect(forms).toHaveLength(1));
      expect(forms[0].has("evidenceFamily")).toBe(false);
    });

    it("does not send a family for session notes, and hides the choice", async () => {
      const forms: FormData[] = [];
      mockUpload(forms);
      render(
        <FileCabinetPanel
          moveId="move-1"
          phase={2}
          evidenceFamilies={families}
        />,
      );
      fireEvent.change(
        screen.getByLabelText("Required evidence this file covers"),
        { target: { value: "controls_family" } },
      );
      fireEvent.change(screen.getByLabelText("File Cabinet upload type"), {
        target: { value: "session_artifact" },
      });
      expect(
        screen.queryByLabelText("Required evidence this file covers"),
      ).toBeNull();
      fireEvent.change(screen.getByLabelText("Upload Move file"), {
        target: { files: [file()] },
      });
      await waitFor(() => expect(forms).toHaveLength(1));
      expect(forms[0].has("evidenceFamily")).toBe(false);
    });

    it("offers no choice when the phase has no required families", () => {
      mockUpload([]);
      render(<FileCabinetPanel moveId="move-1" phase={2} />);
      expect(
        screen.queryByLabelText("Required evidence this file covers"),
      ).toBeNull();
    });
  });
});
