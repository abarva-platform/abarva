/** @jest-environment jsdom */

import "@testing-library/jest-dom";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { FileCabinetPanel } from "../FileCabinetPanel";
import {
  describeMoveUploadRefusal,
  MOVE_UPLOAD_REFUSAL_CODES,
} from "@/lib/programs/move-upload-refusal";

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

// ── The rejected decision ─────────────────────────────────────────────────────
//
// `program_evidence_reviews.decision` admits `pending | approved | rejected`.
// The cabinet's queue reads the first and its reviewed list reads the second,
// so a REJECTED review was on no surface: the card left the queue on the
// decision and arrived nowhere, taking the rationale the reviewer had just
// recorded with it, while the queue's own explainer sentence told them that
// "pending and rejected evidence is excluded from phase generation" — naming a
// state the panel then refused to show.
//
// These cases render the real panel, so they pin the WIRING: that the panel
// asks the route for the rejected list and renders what the presentation module
// answers. Asserting the pure split and the sentence is that module's own
// suite; neither case here passes if the panel stops asking.
describe("Moves File Cabinet rejected evidence", () => {
  const REJECTED = {
    evidenceId: "evidence-9",
    reviewId: "review-9",
    title: "finance-baseline.xlsx",
    familyKey: "kpi_baseline",
    phase: 2,
    reviewedAt: "2026-10-07T00:00:00.000Z",
    rationale: "The parser merged two baselines into one row.",
  };

  const mockCabinet = (payload: Record<string, unknown>) => {
    global.fetch = jest.fn(async () => ({
      ok: true,
      json: async () => ({
        artifacts: [],
        pendingEvidenceReviews: [],
        reviewedEvidence: [],
        rejectedEvidence: [],
        evidenceReviewStatus: "available",
        ...payload,
      }),
    })) as unknown as typeof fetch;
  };

  it("gives a rejected review a place, with the reason that was recorded", async () => {
    mockCabinet({ rejectedEvidence: [REJECTED] });

    render(<FileCabinetPanel moveId="move-1" phase={2} canApproveGates />);

    const section = await screen.findByRole("region", {
      name: "Rejected evidence",
    });
    // Before this, none of these reached any surface: not the file, not the
    // state, not the reason.
    expect(section).toHaveTextContent("finance-baseline.xlsx");
    expect(section).toHaveTextContent("Rejected");
    expect(section).toHaveTextContent(
      "The parser merged two baselines into one row.",
    );
  });

  it("states the action that can succeed and not the two that cannot", async () => {
    mockCabinet({ rejectedEvidence: [REJECTED] });

    render(<FileCabinetPanel moveId="move-1" phase={2} canApproveGates />);

    const section = await screen.findByRole("region", {
      name: "Rejected evidence",
    });
    // The stored decision is never re-decided (the guarded update filters on
    // `pending`) and the same file parses to the extraction that was rejected,
    // so the only instruction that works is a corrected or different source.
    expect(section).toHaveTextContent(/cannot be re-decided/i);
    expect(section).toHaveTextContent(/corrected file or a different source/i);
    // And no approve control: there is nothing here approving can act on.
    expect(section.querySelectorAll("button").length).toBe(0);
  });

  it("renders the rejected section only for a rejected review", async () => {
    // The control for the fix. An approved review is the neighbouring state and
    // has its own list; if the section rendered for it too, the first two cases
    // would pass without the decision having been read at all.
    mockCabinet({
      reviewedEvidence: [
        {
          evidenceId: REJECTED.evidenceId,
          reviewId: REJECTED.reviewId,
          title: REJECTED.title,
          familyKey: REJECTED.familyKey,
          phase: REJECTED.phase,
          reviewedAt: REJECTED.reviewedAt,
        },
      ],
    });

    render(<FileCabinetPanel moveId="move-1" phase={2} canApproveGates />);

    expect(
      await screen.findByRole("region", { name: "Reviewed evidence" }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("region", { name: "Rejected evidence" }),
    ).toBeNull();
  });

  it("shows a rejected review to a reader who cannot approve", async () => {
    // Exclusion from generation is a fact about the Move, not a reviewer
    // privilege, so the reader without approval rights must see it too.
    mockCabinet({ rejectedEvidence: [REJECTED] });

    render(<FileCabinetPanel moveId="move-1" phase={2} />);

    expect(
      await screen.findByRole("region", { name: "Rejected evidence" }),
    ).toHaveTextContent("finance-baseline.xlsx");
  });

  // A refused upload is how off-platform evidence FAILS to enter a Move, and
  // approved evidence is a HARD precondition for crossing the discovery gate.
  // Every code the route declares used to reach this panel as its bare token,
  // because the reader preferred `error` over `detail`.
  describe("a refused upload states what the reviewer can do", () => {
    function mockRefusal(payload: Record<string, unknown>, status = 400) {
      global.fetch = jest.fn(async (url: string, init?: RequestInit) => {
        if (url.includes("/artifacts/upload") && init?.method === "POST") {
          return {
            ok: false,
            status,
            json: async () => ({ ok: false, ...payload }),
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

    async function uploadAndReadMessage(payload: Record<string, unknown>) {
      mockRefusal(payload);
      render(<FileCabinetPanel moveId="move-1" phase={2} />);
      fireEvent.change(screen.getByLabelText("Upload Move file"), {
        target: {
          files: [new File(["a,b"], "controls.csv", { type: "text/csv" })],
        },
      });
      const sentence = describeMoveUploadRefusal({
        code: payload.error,
        detail: payload.detail,
        fileName: "controls.csv",
      });
      await waitFor(() =>
        expect(screen.getByText(sentence)).toBeInTheDocument(),
      );
      return sentence;
    }

    it.each([...MOVE_UPLOAD_REFUSAL_CODES])(
      "renders the sentence for %s and not the code",
      async (code) => {
        const sentence = await uploadAndReadMessage({ error: code });
        expect(sentence).not.toContain(code);
        expect(screen.queryByText(code, { exact: false })).toBeNull();
      },
    );

    it("does not put the raw MIME type on screen for an unreadable file", async () => {
      await uploadAndReadMessage({
        error: "unsupported_type",
        detail: "application/zip",
      });
      expect(screen.queryByText(/application\/zip/)).toBeNull();
      expect(
        screen.getByText(/not a file type this workspace can read/),
      ).toBeInTheDocument();
    });

    it("names the upload cap rather than a byte count", async () => {
      await uploadAndReadMessage({
        error: "file_too_large",
        detail: "max 104857600 bytes",
      });
      expect(screen.queryByText(/104857600/)).toBeNull();
      expect(screen.getByText(/100 MB upload limit/)).toBeInTheDocument();
    });

    it("renders the server sentence for a declared family the Move does not require", async () => {
      await uploadAndReadMessage({
        error: "unknown_evidence_family",
        detail: "'ops_runbook' is not an evidence family this Move requires.",
      });
      expect(
        screen.getByText(
          "'ops_runbook' is not an evidence family this Move requires.",
        ),
      ).toBeInTheDocument();
    });

    it("still answers when the refusal carries no code at all", async () => {
      await uploadAndReadMessage({});
      expect(screen.getByText(/did not say why/)).toBeInTheDocument();
    });
  });
});
