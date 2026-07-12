/**
 * @jest-environment jsdom
 */

import "@testing-library/jest-dom";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { TextDecoder, TextEncoder } from "util";
import { ReadableStream } from "stream/web";
import { MovesPhaseStandaloneClient } from "../MovesPhaseStandaloneClient";
import type { MoveEvidenceNeedPacket } from "@/lib/programs/evidence-readiness/move-evidence-need-packet";
import type { PhaseTallyRow } from "@/lib/programs/phase-explorer-tallies";
import type { StrategicMove } from "@/lib/programs/types.ui";

// jsdom's test environment doesn't provide these globally; the component
// runs in a real browser in production, where all three always exist.
if (typeof global.TextEncoder === "undefined") {
  (global as unknown as { TextEncoder: typeof TextEncoder }).TextEncoder = TextEncoder;
}
if (typeof global.TextDecoder === "undefined") {
  (global as unknown as { TextDecoder: typeof TextDecoder }).TextDecoder =
    TextDecoder as unknown as typeof global.TextDecoder;
}
if (typeof global.ReadableStream === "undefined") {
  (global as unknown as { ReadableStream: typeof ReadableStream }).ReadableStream =
    ReadableStream;
}

jest.mock("next/link", () => {
  return function MockLink({
    children,
    href,
    ...props
  }: {
    children: ReactNode;
    href: string;
  }) {
    return (
      <a href={href} {...props}>
        {children}
      </a>
    );
  };
});

function makeMove(overrides: Partial<StrategicMove> = {}): StrategicMove {
  return {
    id: "37ee2d85-5dc0-4d1f-862e-ab8eff60fdd4",
    displayCode: "GLOBAL_NETWORK_AIRLINE-CANARY-2026",
    name: "CANARY - SkyHarbor Recovery Command IROPS Architecture",
    archetype: "ai_product_enablement",
    tenant: {
      id: "tenant-skyharbor",
      name: "Airline Demo",
      industryCode: "airline",
    },
    charter: null,
    functionPackKey: null,
    currentPhase: 3,
    phaseLabel: "P3 Design Future State",
    status: {
      key: "on_track",
      text: "On track",
      description: "Phase capture in progress",
    },
    statusColor: "green",
    sponsor: { id: "sponsor", name: "Victor Hale", role: "Chief Technology Officer" },
    participants: [],
    valueAtStake: {
      projected: { low: 75_000_000, high: 145_000_000, currency: "USD" },
      verified: null,
      assumptions: null,
    },
    deliverables: [
      {
        id: "d1",
        typeKey: "solution_approach",
        title: "Solution Approach Brief",
        status: "draft",
        updatedAt: null,
        preview: "",
        url: "#",
      },
    ],
    gateCriteria: [
      {
        id: "g1",
        label: "Decision evidence attached",
        completed: false,
        severity: "hard",
        verified: true,
      },
    ],
    recentActivity: [],
    linkedEvidence: [
      {
        id: "e1",
        anchor: "Workshop notes",
        summary: "SME session evidence",
        url: "#",
      },
    ],
    mapLabel: "Recovery command",
    createdAt: "2026-01-01T00:00:00Z",
    updatedAt: "2026-07-10T00:00:00Z",
    ...overrides,
  };
}

const phaseTallies: PhaseTallyRow[] = [0, 1, 2, 3, 4, 5].map((phase) => ({
  phase,
  label: `P${phase}`,
  met: phase < 3 ? 2 : 0,
  total: 2,
  state: phase < 3 ? "done" : phase === 3 ? "current" : "upcoming",
}));

describe("MovesPhaseStandaloneClient", () => {
  beforeEach(() => {
    window.scrollTo = jest.fn();
    global.fetch = jest.fn(async (input: RequestInfo | URL) => {
      const url = String(input);

      if (url.includes("/api/chat/agent")) {
        const encoder = new TextEncoder();
        const body = new ReadableStream({
          start(controller) {
            controller.enqueue(encoder.encode("The two blocking gate items are "));
            controller.enqueue(encoder.encode("the requirements trace and the risk register."));
            controller.close();
          },
        });
        return { ok: true, status: 200, body } as unknown as Response;
      }

      if (url.includes("/api/v1/deliverables/generate-phase")) {
        return {
          ok: true,
          status: 202,
          json: async () => ({
            deliverables: [
              {
                deliverableTypeKey: "solution_approach_options",
                documentTitle: "Solution Approach Brief",
                runId: "run-1",
                status: "queued",
              },
              {
                deliverableTypeKey: "traceability_pack",
                documentTitle: "Traceability Pack",
                runId: "run-2",
                status: "queued",
              },
            ],
          }),
        } as Response;
      }

      return {
        ok: true,
        status: 200,
        json: async () => ({ ok: true }),
      } as Response;
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("surfaces a Next-Phase Readiness Pack with real evidence gaps at gate approval", () => {
    const evidenceNeedPackets: MoveEvidenceNeedPacket[] = [
      {
        moveId: "37ee2d85-5dc0-4d1f-862e-ab8eff60fdd4",
        phase: 3,
        artifactType: "execution_roadmap",
        evidenceSlot: "Cost baseline",
        familyId: "cost_baseline",
        priority: "required",
        ownerSource: "Client owner / evidence steward",
        acceptedFormats: ["CSV", "XLSX"],
        exampleTemplate: "Cost and effort baseline packet",
        exampleContent: [],
        whyItMatters:
          "The business case and financial model need traceable cost and value assumptions before funding-grade estimates.",
        blockedArtifacts: [
          {
            artifactType: "execution_roadmap",
            title: "Roadmap & Business Case",
            phase: 4,
            reason: "Cost baseline is needed for a final-quality Roadmap & Business Case.",
          },
        ],
        canDraftBoundary: {
          canDraft: false,
          canDraftLabel: "",
          cannotDraftLabel: "",
        },
        preliminaryGenerationCaveat: null,
        waiverOption: null,
        nextAction:
          "Upload finance baseline, AP cost model, rate-card assumptions, or value-estimate worksheet.",
        status: "missing",
        evidenceTitles: [],
      },
    ];

    render(
      <MovesPhaseStandaloneClient
        evidenceNeedPackets={evidenceNeedPackets}
        move={makeMove()}
        phaseNum={3}
        phaseTallies={[...phaseTallies]}
      />,
    );

    fireEvent.click(screen.getByRole("tab", { name: /Gate approval/i }));

    expect(screen.getByText(/Next: P4 Build the Plan readiness/i)).toBeInTheDocument();
    expect(screen.getByText("Cost baseline")).toBeInTheDocument();
    expect(screen.getByText(/Format: CSV, XLSX/i)).toBeInTheDocument();
    expect(
      screen.getByText(/traceable cost and value assumptions before funding-grade estimates/i),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Suggested working sessions for P4 Build the Plan"),
    ).toBeInTheDocument();
    expect(screen.getByText("Value case workshop")).toBeInTheDocument();
  });

  it("renders the Claude Design standalone phase workspace instead of the old workbench", () => {
    render(
      <MovesPhaseStandaloneClient
        evidenceNeedPackets={[]}
        move={makeMove()}
        phaseNum={3}
        phaseTallies={[...phaseTallies]}
      />,
    );

    expect(screen.getByRole("heading", { name: "Choose the Approach" })).toBeInTheDocument();
    expect(screen.getByText("Files & Evidence")).toBeInTheDocument();
    expect(screen.getByText("Step 1 of 5")).toBeInTheDocument();
    expect(screen.getByText("Templates & sessions")).toBeInTheDocument();
    expect(screen.queryByText(/Phase complete/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/To advance to P4/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/View dossier/i)).not.toBeInTheDocument();
  });

  it("supports the explorer, upload, aVa launcher, and gate ceremony interactions", async () => {
    const { container } = render(
      <MovesPhaseStandaloneClient
        evidenceNeedPackets={[]}
        move={makeMove()}
        phaseNum={3}
        phaseTallies={[...phaseTallies]}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: /Files & Evidence/i }));
    expect(screen.getByRole("heading", { name: "Files & Evidence" })).toBeInTheDocument();
    expect(screen.getAllByText(/Input template/i).length).toBeGreaterThan(0);
    expect(
      Array.from(container.querySelectorAll("a")).some((anchor) =>
        anchor.getAttribute("href")?.includes("?tab="),
      ),
    ).toBe(false);

    fireEvent.change(screen.getByLabelText(/Upload evidence file/i), {
      target: {
        files: [
          new File(["phase evidence"], "phase-evidence.md", {
            type: "text/markdown",
          }),
        ],
      },
    });
    await waitFor(() => {
      expect(screen.getByText(/Uploaded phase-evidence.md/i)).toBeInTheDocument();
    });
    expect(global.fetch).toHaveBeenCalledWith(
      "/api/v1/programs/37ee2d85-5dc0-4d1f-862e-ab8eff60fdd4/artifacts/upload",
      expect.objectContaining({ method: "POST" }),
    );

    fireEvent.click(screen.getByRole("button", { name: /CANARY - SkyHarbor/i }));
    fireEvent.click(screen.getByRole("tab", { name: /Gate approval/i }));
    expect(screen.getByRole("button", { name: /Approve & generate →/i })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Approve & advance/i })).not.toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Approve & generate deliverables/i }),
    ).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /Approve & generate deliverables/i }));
    await waitFor(() => {
      expect(screen.getByText(/Approved and queued/i)).toBeInTheDocument();
    });
    expect(screen.getAllByText(/Queued in worker/i).length).toBeGreaterThan(0);
    expect(global.fetch).toHaveBeenCalledWith(
      "/api/v1/deliverables/generate-phase",
      expect.objectContaining({ method: "POST" }),
    );
    const phaseCaptureCall = (global.fetch as jest.Mock).mock.calls.find(([url]) =>
      String(url).includes("/phase-capture"),
    );
    expect(phaseCaptureCall).toBeTruthy();
    const phaseCaptureBody = JSON.parse(String(phaseCaptureCall?.[1]?.body ?? "{}"));
    expect(phaseCaptureBody.sections).toEqual(
      expect.objectContaining({
        solution_approach: expect.any(String),
        operating_model: expect.any(String),
        process_design: expect.any(String),
        controls_governance: expect.any(String),
        architecture_integration: expect.any(String),
        evidence_confidence: expect.any(String),
        recommendation: expect.any(String),
      }),
    );

    fireEvent.click(screen.getByRole("button", { name: /Ask aVa/i }));
    expect(screen.getByText(/Ask about this phase/i)).toBeInTheDocument();
  });

  it("wires the aVa suggested questions to a real chat send, with programId set correctly to avoid the 'no active Move session' regression", async () => {
    render(
      <MovesPhaseStandaloneClient
        evidenceNeedPackets={[]}
        move={makeMove()}
        phaseNum={3}
        phaseTallies={[...phaseTallies]}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: /Ask aVa/i }));
    fireEvent.click(screen.getByRole("button", { name: /What must be true before P4\?/i }));

    await waitFor(() => {
      expect(
        screen.getByText(/The two blocking gate items are the requirements trace/i),
      ).toBeInTheDocument();
    });

    const chatCall = (global.fetch as jest.Mock).mock.calls.find(([url]) =>
      String(url).includes("/api/chat/agent"),
    );
    expect(chatCall).toBeTruthy();
    const chatBody = JSON.parse(String(chatCall?.[1]?.body ?? "{}"));
    expect(chatBody.message).toBe("What must be true before P4?");
    expect(chatBody.programId).toBe("37ee2d85-5dc0-4d1f-862e-ab8eff60fdd4");
    expect(chatBody.surfaceContext.programId).toBe("37ee2d85-5dc0-4d1f-862e-ab8eff60fdd4");
    expect(chatBody.surfaceContext.moveId).toBe("37ee2d85-5dc0-4d1f-862e-ab8eff60fdd4");
    expect(chatBody.surfaceContext.phase).toBe(3);
  });

  it("supports typing and sending a free-form question via the composer", async () => {
    render(
      <MovesPhaseStandaloneClient
        evidenceNeedPackets={[]}
        move={makeMove()}
        phaseNum={3}
        phaseTallies={[...phaseTallies]}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: /Ask aVa/i }));
    const textarea = screen.getByPlaceholderText(/Ask aVa about/i);
    fireEvent.change(textarea, { target: { value: "Where are we over-designing?" } });
    fireEvent.click(screen.getByRole("button", { name: "Send" }));

    await waitFor(() => {
      expect(screen.getByText("Where are we over-designing?")).toBeInTheDocument();
    });
    await waitFor(() => {
      expect(
        screen.getByText(/The two blocking gate items are the requirements trace/i),
      ).toBeInTheDocument();
    });
    expect((textarea as HTMLTextAreaElement).value).toBe("");
  });
});
