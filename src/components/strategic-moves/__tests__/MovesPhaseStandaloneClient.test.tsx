/**
 * @jest-environment jsdom
 */

import "@testing-library/jest-dom";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { MovesPhaseStandaloneClient } from "../MovesPhaseStandaloneClient";
import type { PhaseTallyRow } from "@/lib/programs/phase-explorer-tallies";
import type { StrategicMove } from "@/lib/programs/types.ui";

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

    fireEvent.click(screen.getByRole("button", { name: /Ask aVa/i }));
    expect(screen.getByText(/Ask about this phase/i)).toBeInTheDocument();
  });
});
