/** @jest-environment jsdom */

/**
 * The document cabinet's evidence-review readback, and what a refused review
 * decision says.
 *
 * The defect these cases pin is on the discovery step: a reviewer approves the
 * last pending evidence item, the POST succeeds, and the refresh that follows
 * fails. Before this, the panel's loader threw before any setter ran, so the
 * review-availability boolean kept its `true` initial value and every list
 * kept its last contents. The reviewer was shown the item they had just
 * approved, still listed as awaiting review, beneath copy saying pending
 * evidence is excluded from phase generation, with no warning that anything
 * had failed — and the one control on offer, approving it again, is refused
 * with 409 `no_pending_review`, which the panel printed as the reviewer's
 * only next action.
 *
 * Both halves are asserted against the REAL `FileCabinetPanel` and the REAL
 * `EvidenceReviewEditor`, not stubs, because the whole finding is that the
 * host's wiring — which state it reads, which prop it passes — is the thing
 * that was wrong.
 */

import "@testing-library/jest-dom";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { FileCabinetPanel } from "../FileCabinetPanel";
import {
  describeEvidenceCabinetReadback,
  describeEvidenceDecisionRefusal,
  describeAlreadyDecidedEvidenceReview,
  EVIDENCE_DECISION_REFUSAL_CODES,
  EVIDENCE_DECISION_REFUSAL_STATE,
  isEvidenceDecisionRefusalCode,
} from "@/lib/programs/evidence-cabinet-readback";
import { describeMoveReviewDecisionRefusal } from "@/lib/programs/move-review-decision-refusal";

const PENDING_REVIEW = {
  evidenceId: "evidence-1",
  title: "discovery-workshop.md",
  phase: 2,
  parseMethod: "markdown-line-parser",
  confidence: 0.82,
  sourceTextPreview: "Baseline interview notes",
  extraction: {
    version: 1,
    summary: "Baseline captured",
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
};

function artifactsBody(overrides: Record<string, unknown> = {}) {
  return {
    artifacts: [],
    pendingEvidenceReviews: [PENDING_REVIEW],
    reviewedEvidence: [],
    rejectedEvidence: [],
    evidenceReviewStatus: "available",
    ...overrides,
  };
}

const STALE_WARNING = /lists below may be out of date/;
const UNAVAILABLE_WARNING = /Evidence review status is unavailable/;

describe("evidence cabinet readback state", () => {
  it("treats a completed read that reports availability as current", () => {
    expect(
      describeEvidenceCabinetReadback({ evidenceReviewStatus: "available" }),
    ).toEqual({ state: "available", warning: null, queueIsCurrent: true });
  });

  it("warns, but keeps the queue current, when only the review sub-read failed", () => {
    const readback = describeEvidenceCabinetReadback({
      evidenceReviewStatus: "unavailable",
    });
    expect(readback.state).toBe("unavailable");
    expect(readback.queueIsCurrent).toBe(true);
    expect(readback.warning).toMatch(UNAVAILABLE_WARNING);
  });

  it("reports a failed read as unknown and its lists as stale", () => {
    const readback = describeEvidenceCabinetReadback({ loadFailed: true });
    expect(readback.state).toBe("unknown");
    expect(readback.queueIsCurrent).toBe(false);
    expect(readback.warning).toMatch(STALE_WARNING);
  });

  it("lets a failed read outrank a status the same call carries", () => {
    // The caller passes both when a refresh fails after a successful read. The
    // lists on screen are stale whatever the last status said.
    expect(
      describeEvidenceCabinetReadback({
        loadFailed: true,
        evidenceReviewStatus: "available",
      }).queueIsCurrent,
    ).toBe(false);
  });

  it("does not read an absent status as available", () => {
    // A route that stops sending the field must not make the panel assert
    // health it was never told about.
    const readback = describeEvidenceCabinetReadback({});
    expect(readback.state).toBe("unknown");
    expect(readback.queueIsCurrent).toBe(false);
  });

  it("does not read an unrecognised status as available", () => {
    expect(
      describeEvidenceCabinetReadback({ evidenceReviewStatus: "degraded" })
        .state,
    ).toBe("unknown");
  });

  it("warns about nothing before the first read completes", () => {
    // Distinct from `unknown`: there are no lists to mistrust yet, and a
    // warning here would fire on every initial paint.
    expect(describeEvidenceCabinetReadback({ completed: false })).toEqual({
      state: "unread",
      warning: null,
      queueIsCurrent: false,
    });
  });
});

describe("refused evidence review decisions", () => {
  it("names every refusal code the approve route declares", () => {
    // The route's declared codes. One added there and not here would fall
    // through to the default sentence, so the list is asserted whole.
    expect([...EVIDENCE_DECISION_REFUSAL_CODES]).toEqual([
      "not_found",
      "forbidden",
      "reviewed_extraction_required",
      "no_pending_review",
      "evidence_not_in_move",
      "review_decision_unconfirmed",
    ]);
    for (const code of EVIDENCE_DECISION_REFUSAL_CODES) {
      expect(isEvidenceDecisionRefusalCode(code)).toBe(true);
      const sentence = describeEvidenceDecisionRefusal({ code });
      expect(sentence).not.toContain(code);
      expect(sentence.length).toBeGreaterThan(40);
    }
  });

  it("says an already-decided review cannot be decided again", () => {
    const sentence = describeEvidenceDecisionRefusal({
      code: "no_pending_review",
    });
    expect(sentence).toMatch(/already/);
    expect(sentence).toMatch(/refused/);
  });

  it("sends a permission refusal to someone who can act on it", () => {
    expect(describeEvidenceDecisionRefusal({ code: "forbidden" })).toMatch(
      /permission/,
    );
  });

  it("keeps an unrecognised code out of the reviewer's sentence", () => {
    const sentence = describeEvidenceDecisionRefusal({ code: "wat_is_this" });
    expect(sentence).not.toContain("wat_is_this");
    expect(sentence).toMatch(/not confirmed/);
  });

  it("does not settle whether the decision landed when nothing is readable", () => {
    // The reviewer's real question after a failure is whether the decision
    // half-landed, and this is the one arm reached when the client could read
    // no answer at all — an unbodied 500 parses to `{}`. It used to assert
    // "nothing was approved", which is a claim about a write nobody read back:
    // the promotion's update is what throws, and neither the route nor this
    // screen re-reads the row to find out whether it applied.
    const sentence = describeEvidenceDecisionRefusal({ code: undefined });
    expect(sentence).not.toMatch(/nothing was approved/);
    expect(sentence).not.toMatch(/unchanged/);
    expect(sentence).toMatch(/cannot tell whether it was recorded/);
    expect(sentence).toMatch(/[Rr]eload/);
  });

  it("tells a reviewer whose evidence is not on the Move that nothing is there to re-read", () => {
    // Split out of `no_pending_review`, whose sentence promises a recorded
    // decision to reload and read. There is none: neither a review row nor an
    // evidence row exists for this id on this Move.
    const sentence = describeEvidenceDecisionRefusal({
      code: "evidence_not_in_move",
    });
    expect(sentence).toMatch(/not on this Move/);
    expect(sentence).toMatch(/nothing was recorded/);
    expect(sentence).not.toMatch(/already decided/);
  });

  it("claims no direction for an unconfirmed decision", () => {
    const sentence = describeEvidenceDecisionRefusal({
      code: "review_decision_unconfirmed",
    });
    expect(sentence).toMatch(/may or may not/);
    expect(sentence).not.toMatch(/nothing was recorded/);
  });

  it("lets every sentence claim only what its recorded state allows", () => {
    // The state labels are the contract; the sentences are read against them so
    // a reworded one cannot quietly start asserting a write it never read.
    const claimsNothingLanded = /nothing was recorded|nothing was approved/;
    const claimsSomethingLanded = /already on record|already\s+decided/;
    for (const code of EVIDENCE_DECISION_REFUSAL_CODES) {
      const sentence = describeEvidenceDecisionRefusal({ code });
      const state = EVIDENCE_DECISION_REFUSAL_STATE[code];
      if (state === "unknown") {
        expect(sentence).not.toMatch(claimsNothingLanded);
        expect(sentence).not.toMatch(claimsSomethingLanded);
      }
      if (state === "recorded") {
        expect(sentence).not.toMatch(claimsNothingLanded);
      }
    }
    // Non-vacuous: at least one code sits in each label this asserts over.
    const labels = EVIDENCE_DECISION_REFUSAL_CODES.map(
      (code) => EVIDENCE_DECISION_REFUSAL_STATE[code],
    );
    expect(labels).toContain("unknown");
    expect(labels).toContain("recorded");
    expect(labels).toContain("nothing");
  });

  it("names the decision on record when the promotion knows it", () => {
    expect(describeAlreadyDecidedEvidenceReview("rejected")).toMatch(
      /already on record as rejected/,
    );
    expect(describeAlreadyDecidedEvidenceReview("approved")).toMatch(
      /already on record as approved/,
    );
  });

  it("falls back to the unnamed-decision sentence when it does not", () => {
    // A review row can exist with `decision = 'pending'` and still fail the
    // promotion's pending-filtered update, so the decision is not always known.
    expect(describeAlreadyDecidedEvidenceReview("pending")).toBe(
      describeEvidenceDecisionRefusal({ code: "no_pending_review" }),
    );
    expect(describeAlreadyDecidedEvidenceReview(undefined)).toBe(
      describeEvidenceDecisionRefusal({ code: "no_pending_review" }),
    );
  });

  it("prefers a server-supplied sentence over its own", () => {
    expect(
      describeEvidenceDecisionRefusal({
        code: "no_pending_review",
        detail: "The review was withdrawn by another reviewer.",
      }),
    ).toBe("The review was withdrawn by another reviewer.");
  });

  it("ignores a blank detail rather than rendering an empty reason", () => {
    expect(
      describeEvidenceDecisionRefusal({ code: "forbidden", detail: "   " }),
    ).toMatch(/permission/);
  });
});

describe("the cabinet surfaces its own readback state", () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("warns about nothing on a healthy read", async () => {
    global.fetch = jest.fn(async () => ({
      ok: true,
      json: async () => artifactsBody(),
    })) as unknown as typeof fetch;

    render(<FileCabinetPanel moveId="move-1" phase={2} canApproveGates />);

    expect(
      await screen.findByRole("button", { name: "Approve reviewed version" }),
    ).toBeEnabled();
    expect(screen.queryByText(STALE_WARNING)).toBeNull();
    expect(screen.queryByText(UNAVAILABLE_WARNING)).toBeNull();
  });

  it("carries the route's own unavailable warning through", async () => {
    global.fetch = jest.fn(async () => ({
      ok: true,
      json: async () => artifactsBody({ evidenceReviewStatus: "unavailable" }),
    })) as unknown as typeof fetch;

    render(<FileCabinetPanel moveId="move-1" phase={2} canApproveGates />);

    expect(await screen.findByText(UNAVAILABLE_WARNING)).toBeInTheDocument();
    // Only the review sub-read failed, so the queue it returned is current and
    // a decision on it can still succeed.
    expect(
      screen.getByRole("button", { name: "Approve reviewed version" }),
    ).toBeEnabled();
  });

  it("stops asserting review health when the read itself fails", async () => {
    // The strictly worse case, and the one that showed no warning at all: the
    // whole artifacts read failed, so the review state is not degraded but
    // unknown.
    global.fetch = jest.fn(async () => ({
      ok: false,
      status: 503,
      json: async () => ({}),
    })) as unknown as typeof fetch;

    render(<FileCabinetPanel moveId="move-1" phase={2} canApproveGates />);

    expect(await screen.findByText(STALE_WARNING)).toBeInTheDocument();
  });

  it("withholds a second decision on a queue a failed refresh left stale", async () => {
    // The live scenario end to end. First read succeeds and the item is
    // decidable. The decision succeeds. The refresh that follows fails, so the
    // approved item is STILL listed — and approving it again would be refused.
    let artifactsCalls = 0;
    global.fetch = jest.fn(async (url: string, init?: RequestInit) => {
      if (init?.method === "POST") {
        return { ok: true, json: async () => ({ ok: true }) } as Response;
      }
      artifactsCalls += 1;
      if (artifactsCalls === 1) {
        return { ok: true, json: async () => artifactsBody() } as Response;
      }
      return { ok: false, status: 503, json: async () => ({}) } as Response;
    }) as unknown as typeof fetch;

    render(<FileCabinetPanel moveId="move-1" phase={2} canApproveGates />);

    const approve = await screen.findByRole("button", {
      name: "Approve reviewed version",
    });
    expect(approve).toBeEnabled();

    fireEvent.click(approve);

    await waitFor(() => {
      expect(screen.getByText(STALE_WARNING)).toBeInTheDocument();
    });
    // The item the server already approved is still on the queue, because the
    // refresh that would have removed it failed.
    expect(
      screen.getByRole("heading", { name: /1 evidence item awaiting review/ }),
    ).toBeInTheDocument();
    // And it is not offered again.
    expect(
      screen.getByRole("button", { name: "Approve reviewed version" }),
    ).toBeDisabled();
    expect(screen.getByRole("button", { name: "Reject" })).toBeDisabled();
  });

  it("gives a refused decision a sentence instead of its error code", async () => {
    global.fetch = jest.fn(async (url: string, init?: RequestInit) => {
      if (init?.method === "POST") {
        return {
          ok: false,
          status: 409,
          json: async () => ({
            error: "no_pending_review",
            evidenceId: "evidence-1",
          }),
        } as Response;
      }
      return { ok: true, json: async () => artifactsBody() } as Response;
    }) as unknown as typeof fetch;

    render(<FileCabinetPanel moveId="move-1" phase={2} canApproveGates />);

    fireEvent.click(
      await screen.findByRole("button", { name: "Approve reviewed version" }),
    );

    await waitFor(() => {
      expect(screen.getByText(/already/)).toBeInTheDocument();
    });
    expect(screen.queryByText(/no_pending_review/)).toBeNull();
    expect(screen.queryByText(/HTTP 409/)).toBeNull();
  });
});

/**
 * A phase-2 current artifact whose download URL is under this Move, which is
 * what `supportsWorkspaceReviewDecisionArtifact` requires before the row
 * fetches its review packet at all.
 */
const REVIEWABLE_ARTIFACT = {
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
  downloadUrl: "/api/v1/programs/move-1/artifacts/artifact-1/download",
};

const REVIEW_PACKET = {
  ok: true,
  canRecordDecision: true,
  reviewPackage: {
    htmlVisualCompanionArtifactId: null,
    docxEditableArtifactId: null,
  },
  packet: {
    diagnosticThesis: "Baseline spend is unmanaged.",
    quantifiedFacts: [],
    strongestEvidence: [],
    knownLimitations: [],
    missingEvidence: [],
    p3Implication: "Shape the governed-foundation route.",
  },
  latestDecision: null,
  readiness: {
    readyForP3Draft: false,
    readyForP3Final: false,
    p2FinalApproved: false,
    reason: "No decision recorded.",
  },
};

/**
 * Serve the artifacts list, then answer the review-decision route with
 * `respond`. The cabinet GETs that route on open and POSTs it on a decision,
 * so one hook covers both calls.
 */
function mockCabinet(
  respond: (method: string) => {
    ok: boolean;
    status: number;
    body: Record<string, unknown>;
  },
) {
  global.fetch = jest.fn(async (url: string, init?: RequestInit) => {
    const method = init?.method ?? "GET";
    if (String(url).includes("/review-decision")) {
      const out = respond(method);
      return {
        ok: out.ok,
        status: out.status,
        json: async () => out.body,
      } as Response;
    }
    return {
      ok: true,
      json: async () => artifactsBody({ artifacts: [REVIEWABLE_ARTIFACT] }),
    } as Response;
  }) as unknown as typeof fetch;
}

describe("the cabinet states why a review decision was refused", () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("explains a failed packet read instead of printing its code", async () => {
    // The GET failure is the worse of the two: clearing `workspaceReview`
    // hides the packet AND every decision control, so a bare `not_found` left
    // the reviewer with no account of the missing controls.
    mockCabinet(() => ({
      ok: false,
      status: 404,
      body: { error: "not_found" },
    }));

    render(<FileCabinetPanel moveId="move-1" phase={2} canApproveGates />);
    // The packet GET only fires once the row's Review panel is open.
    fireEvent.click(await screen.findByRole("button", { name: "Review" }));

    const refusal = await screen.findByText(/controls are hidden/);
    expect(refusal).toBeInTheDocument();
    expect(refusal.textContent).toBe(
      describeMoveReviewDecisionRefusal({
        action: "load",
        code: "not_found",
      }),
    );
    expect(screen.queryByText(/not_found/)).toBeNull();
    expect(screen.queryByText(/HTTP 404/)).toBeNull();
    // And it does not claim a decision was lost, because the GET writes
    // nothing.
    expect(screen.queryByText(/NOT recorded/)).toBeNull();
  });

  it("carries the route's own prose detail through on a failed read", async () => {
    // The GET reader read `json.error` alone, so a sentence the route DID
    // send was dropped in favour of the code beside it.
    mockCabinet(() => ({
      ok: false,
      status: 503,
      body: {
        error: "tenant_lookup_unavailable",
        detail: "Tenant lookup is temporarily unavailable. Retry shortly.",
      },
    }));

    render(<FileCabinetPanel moveId="move-1" phase={2} canApproveGates />);
    fireEvent.click(await screen.findByRole("button", { name: "Review" }));

    expect(
      await screen.findByText(
        "Tenant lookup is temporarily unavailable. Retry shortly.",
      ),
    ).toBeInTheDocument();
    expect(screen.queryByText(/tenant_lookup_unavailable/)).toBeNull();
  });

  it("tells a reviewer whose decision was refused that nothing was recorded", async () => {
    mockCabinet((method) =>
      method === "POST"
        ? { ok: false, status: 404, body: { error: "not_found" } }
        : { ok: true, status: 200, body: REVIEW_PACKET },
    );

    render(<FileCabinetPanel moveId="move-1" phase={2} canApproveGates />);

    fireEvent.click(await screen.findByRole("button", { name: "Review" }));
    fireEvent.click(
      await screen.findByRole("button", { name: "Approve for P3 draft" }),
    );

    await waitFor(() => {
      expect(screen.getByText(/NOT recorded/)).toBeInTheDocument();
    });
    expect(screen.queryByText(/not_found/)).toBeNull();
    expect(screen.queryByText(/HTTP 404/)).toBeNull();
  });

  it("says a refusal it cannot name may still have been recorded", async () => {
    // The catch-all also covers a 5xx thrown after the row was written, so
    // claiming nothing was recorded would be a guess.
    mockCabinet((method) =>
      method === "POST"
        ? { ok: false, status: 500, body: { error: "internal_error" } }
        : { ok: true, status: 200, body: REVIEW_PACKET },
    );

    render(<FileCabinetPanel moveId="move-1" phase={2} canApproveGates />);

    fireEvent.click(await screen.findByRole("button", { name: "Review" }));
    fireEvent.click(
      await screen.findByRole("button", { name: "Approve for P3 draft" }),
    );

    await waitFor(() => {
      expect(screen.getByText(/whether it was recorded/)).toBeInTheDocument();
    });
    expect(screen.queryByText(/internal_error/)).toBeNull();
    expect(screen.queryByText(/HTTP 500/)).toBeNull();
  });

  it("lays the sentence out so it can wrap", async () => {
    // The refusal used to render in the control row: an `auto` grid column
    // beside a `minmax(0, 1fr)` title, at 10.5px, `whiteSpace: "nowrap"`. A
    // sentence there is one unbreakable line. It now has its own full-width
    // row, so assert the computed property rather than the text alone.
    mockCabinet(() => ({
      ok: false,
      status: 404,
      body: { error: "not_found" },
    }));

    render(<FileCabinetPanel moveId="move-1" phase={2} canApproveGates />);
    // The packet GET only fires once the row's Review panel is open.
    fireEvent.click(await screen.findByRole("button", { name: "Review" }));

    const refusal = await screen.findByText(/controls are hidden/);
    expect(window.getComputedStyle(refusal).whiteSpace).not.toBe("nowrap");
    expect(refusal).toHaveAttribute("role", "status");
  });
});
