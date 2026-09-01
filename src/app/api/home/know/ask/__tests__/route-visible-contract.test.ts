import { assertVisibleAnswerContract } from "@/lib/agent/visible-answer-contract";
import { DEMO_SAFE_CLIENT_NAMES } from "@/lib/client-config";
import { buildHomeKnowResponse } from "@/lib/home/know/home-know-engine";
import type { HomeKnowResponse } from "@/lib/home/know/home-know-contract";

import { POST } from "../route";

jest.mock("@/lib/tenant/resolveTenant", () => ({
  resolveTenant: jest.fn(async () => ({
    canonicalKey: "skyharbor",
    displayName: DEMO_SAFE_CLIENT_NAMES.skyharbor,
  })),
}));

jest.mock("@/lib/home/know/home-know-engine", () => ({
  buildHomeKnowResponse: jest.fn(async () => unsafeHomeKnowResponse()),
}));

function req(body: unknown): import("next/server").NextRequest {
  return {
    json: async () => body,
    headers: new Headers(),
  } as import("next/server").NextRequest;
}

describe("/api/home/know/ask visible contract recovery", () => {
  beforeEach(() => {
    jest
      .mocked(buildHomeKnowResponse)
      .mockResolvedValue(unsafeHomeKnowResponse());
  });

  it("returns a safe Home answer when final prose leaks answer-construction language", async () => {
    const res = await POST(
      req({
        question: "Show the loaded context dimensions in a table.",
        tenantKey: "skyharbor_global",
      }),
    );
    const payload = (await res.json()) as HomeKnowResponse;

    expect(res.status).toBe(200);
    expect(payload.mode).toBe("KNOW");
    expect(payload.answerStatus).toBe("partial");
    expect(payload.prose).toContain(
      "The available evidence is being shown in a conservative review-safe form.",
    );
    expect(payload.prose).not.toContain("I tightened the wording");
    expect(payload.prose).not.toContain("first draft");
    expect(payload.prose).not.toContain("answer-construction language");
    expect(payload.tables).toHaveLength(1);
    expect(payload.safety.composerTrace?.fallbackUsed).toBe(true);
    expect(payload.safety.composerTrace?.reason).toContain(
      "final visible-answer fallback applied",
    );
    expect(assertVisibleAnswerContract(payload.prose).passed).toBe(true);
  });

  it("emits a terminal blocked answer when the streaming Home read fails", async () => {
    jest
      .mocked(buildHomeKnowResponse)
      .mockRejectedValueOnce(new Error("mocked Home read failure"));

    const res = await POST(
      req({
        question:
          "Can you provide a 2x2 explanation for value potential and proof readiness?",
        tenantKey: "skyharbor_global",
        stream: true,
      }),
    );
    const text = await res.text();
    const events = text
      .split(/\n+/)
      .filter(Boolean)
      .map((line) => JSON.parse(line) as Record<string, unknown>);
    const answer = events.find((event) => event.type === "home-answer");
    const done = events.find((event) => event.type === "done");
    const response = answer?.response as HomeKnowResponse | undefined;

    expect(res.status).toBe(200);
    expect(events.map((event) => event.type)).toEqual(
      expect.arrayContaining(["status", "home-answer", "done"]),
    );
    expect(events.at(-1)?.type).toBe("done");
    expect(response?.answerStatus).toBe("blocked");
    expect(response?.prose).toContain("not falling back to old packs");
    expect(done?.answerStatus).toBe("blocked");
  });
});

function unsafeHomeKnowResponse(): HomeKnowResponse {
  return {
    mode: "KNOW",
    tenantKey: "skyharbor",
    question: "Show the loaded context dimensions in a table.",
    intent: "table",
    answerStatus: "answered",
    artifactStatus: "rendered",
    prose:
      "The answer should render from <div>debug</div> output before the table.",
    dimensionsUsed: ["enterprise_profile"],
    facts: [],
    tables: [
      {
        id: "context-table",
        title: "Home business areas",
        dimensionId: "enterprise_profile",
        columns: [
          { key: "area", label: "Area" },
          { key: "status", label: "Status" },
        ],
        rows: [{ area: "Enterprise profile", status: "Usable" }],
        citationIds: [],
      },
    ],
    charts: [],
    graphs: [],
    gaps: [],
    conflicts: [],
    citations: [],
    handoff: null,
    safety: {
      serverValidated: true,
      blockedExperts: true,
      blockedDecisionFrames: true,
      blockedInternalCodes: true,
      unsupportedClaimsRemoved: 0,
      frontendTripwireShouldFire: false,
      usableEvidence: true,
      evidenceStatus: "usable_dossier",
      evidenceReason: "mocked route test",
      composerTrace: {
        route: "/api/home/know/ask",
        composer: "claude_text_synthesis",
        goldenComposerAttempted: true,
        goldenComposerUsed: true,
        fallbackUsed: false,
        dimensionsUsed: ["enterprise_profile"],
        factsBound: 0,
        tablesBound: 1,
        chartsBound: 0,
        graphsBound: 0,
        citationsBound: 0,
        sourceCoverageBound: 0,
        sectionsBound: 0,
        rollupsBound: 0,
        relationshipPathsBound: 0,
        metricsBound: 0,
        gapsBound: 0,
        usableEvidence: true,
        answerStatus: "answered",
        reason: "mocked unsafe prose",
      },
    },
  };
}
