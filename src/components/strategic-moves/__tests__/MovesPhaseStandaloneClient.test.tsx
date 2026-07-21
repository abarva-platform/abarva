/**
 * @jest-environment jsdom
 */

import "@testing-library/jest-dom";
import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import type { ReactNode } from "react";
import { TextDecoder, TextEncoder } from "util";
import { ReadableStream } from "stream/web";
import { MovesPhaseStandaloneClient } from "../MovesPhaseStandaloneClient";
import type { MoveEvidenceNeedPacket } from "@/lib/programs/evidence-readiness/move-evidence-need-packet";
import type { ReadinessReport } from "@/lib/programs/current-state-readiness";
import type { PhaseTallyRow } from "@/lib/programs/phase-explorer-tallies";
import type { StrategicMove } from "@/lib/programs/types.ui";

// jsdom's test environment doesn't provide these globally; the component
// runs in a real browser in production, where all three always exist.
if (typeof global.TextEncoder === "undefined") {
  (global as unknown as { TextEncoder: typeof TextEncoder }).TextEncoder =
    TextEncoder;
}
if (typeof global.TextDecoder === "undefined") {
  (global as unknown as { TextDecoder: typeof TextDecoder }).TextDecoder =
    TextDecoder as unknown as typeof global.TextDecoder;
}
if (typeof global.ReadableStream === "undefined") {
  (
    global as unknown as { ReadableStream: typeof ReadableStream }
  ).ReadableStream = ReadableStream;
}

// MOVES-UI-001: `useFeature` resolves the active tenant via
// `useClientContext()`, which needs Clerk's `useUser()` + Next's router
// hooks. This test file renders the component with none of that provider
// stack, so without a mock the hook would throw and the component's own
// FinderShellErrorBoundary would (correctly) fall back to flag-off — which
// is exactly what we want for every existing test in this file (flag-off
// parity). The flag-on assertions below override this mock per-test.
const mockUseFeature = jest.fn<boolean, [string]>(() => false);
jest.mock("@/lib/features/use-feature", () => ({
  useFeature: (key: string) => mockUseFeature(key),
}));

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
    sponsor: {
      id: "sponsor",
      name: "Victor Hale",
      role: "Chief Technology Officer",
    },
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

function makeCurrentStateReadiness(): ReadinessReport {
  return {
    phase: 2,
    archetypeId: "AI_PRODUCT_DEVELOPMENT_LIFECYCLE",
    archetypeName: "AI Product Development Lifecycle",
    archetypeVersion: "0.1.0",
    profile: {
      useCaseArchetype: "unknown",
      teamArchetypes: [],
      deliveryMaturity: "unknown",
      orgTopology: "unknown",
      cloudPosture: "unknown",
      existingAiTools: [],
      provenance: {},
    },
    instruments: [
      {
        key: "eng_performance_dora",
        label: "Engineering delivery baseline (DORA)",
        kind: "metric_baseline",
        whyNeeded:
          "Deploy frequency, lead time, change-failure rate, and MTTR are the measurable current-state baseline.",
        sourceDocHint: "CI/CD export as CSV",
        severity: "hard",
        status: "missing",
        backingTable: "tower_dora_metrics",
        committedRows: 0,
        rationale:
          "AI Product Development Lifecycle requires Engineering delivery baseline at diagnose.",
        documentFamily: false,
        pendingReviews: [],
        evidenceDigest: [],
      },
    ],
    coverageScore: 0,
    hardGaps: ["eng_performance_dora"],
    softGaps: [],
  };
}

describe("MovesPhaseStandaloneClient", () => {
  let uploadedEvidenceArtifacts: Array<{
    artifactId: string;
    fileName: string;
    title: string;
    phase: number;
    version: number;
    status: string;
    lifecycleState: string;
    qualityScore: number | null;
    createdAt: string;
    downloadUrl: string;
  }>;

  beforeEach(() => {
    window.scrollTo = jest.fn();
    window.open = jest.fn(() => ({}) as Window);
    mockUseFeature.mockReset();
    mockUseFeature.mockImplementation(() => false);
    uploadedEvidenceArtifacts = [];
    global.fetch = jest.fn(
      async (input: RequestInfo | URL, init?: RequestInit) => {
        const url = String(input);

        if (url.includes("/artifacts/upload") && init?.method === "POST") {
          const form = init.body as FormData;
          const file = form.get("file") as File;
          uploadedEvidenceArtifacts.push({
            artifactId: `artifact-${uploadedEvidenceArtifacts.length + 1}`,
            fileName: file.name,
            title: String(form.get("title") ?? file.name),
            phase: Number(form.get("phase") ?? 0),
            version: 1,
            status: "draft",
            lifecycleState: "current",
            qualityScore: null,
            createdAt: new Date(0).toISOString(),
            downloadUrl: "#",
          });
          return {
            ok: true,
            status: 200,
            json: async () => ({ ok: true }),
          } as Response;
        }

        if (url.includes("/artifacts?family=uploaded_evidence")) {
          return {
            ok: true,
            status: 200,
            json: async () => ({ artifacts: uploadedEvidenceArtifacts }),
          } as Response;
        }

        if (url.includes("/api/chat/agent")) {
          const encoder = new TextEncoder();
          const body = new ReadableStream({
            start(controller) {
              controller.enqueue(
                encoder.encode("The two blocking gate items are "),
              );
              controller.enqueue(
                encoder.encode("the requirements trace and the risk register."),
              );
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
                  deliverableTypeKey: "target_state_architecture",
                  documentTitle: "Target State Reference Architecture",
                  runId: "run-1",
                  status: "queued",
                },
                {
                  deliverableTypeKey: "solution_design",
                  documentTitle: "Solution Design Specification",
                  runId: "run-2",
                  status: "queued",
                },
              ],
            }),
          } as Response;
        }

        if (url.includes("/api/v1/deliverables/runs/")) {
          return {
            ok: true,
            status: 200,
            json: async () => ({
              status: "succeeded",
              artifactId: "artifact-1",
              blobUrl: "/api/v1/artifacts/artifact-1?download=1",
              progressPct: 100,
              progressLabel: "Built",
            }),
          } as Response;
        }

        if (url.includes("/playbook")) {
          return new Promise<Response>(() => {});
        }

        if (url.includes("/phase-intelligence")) {
          return {
            ok: true,
            status: 200,
            json: async () => ({
              ok: true,
              moveId: "37ee2d85-5dc0-4d1f-862e-ab8eff60fdd4",
              phase: 3,
              generatedAt: "2026-07-18T00:00:00Z",
              items: [
                {
                  id: "decision",
                  eyebrow: "Key design decision",
                  title: "Governed agent workspace",
                  body: "Selected because it balances productivity, control, and adoption.",
                  sourceLabel: "Decision thread",
                  tone: "success",
                  href: "/dossier/thread-1",
                  hrefLabel: "See full decision record",
                  facts: ["3 alternatives captured"],
                },
                {
                  id: "strategic_signal",
                  eyebrow: "Strategic signal",
                  title: "Agent-handled productivity improvement",
                  body: "8-22% is a labeled planning range, not a committed target.",
                  sourceLabel: "Member-service Agent Assist Function Pack",
                  tone: "default",
                  facts: ["Measured as: cost per resolved contact"],
                },
                {
                  id: "gate_evidence",
                  eyebrow: "Gate and evidence truth",
                  title: "1 hard gate open; 1 required evidence gap.",
                  body: "Upload the missing source file or record a waiver.",
                  sourceLabel: "Governance + evidence readiness",
                  tone: "danger",
                  facts: ["1/2 hard gates met"],
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
      },
    );
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe("MOVES-UI-001 finder-shell flag (moves_finder_shell_v1)", () => {
    it("renders exactly the legacy markup when the flag is off — no finder-shell class or data attribute", () => {
      mockUseFeature.mockImplementation(() => false);
      render(
        <MovesPhaseStandaloneClient
          carriesForwardContent={[]}
          evidenceNeedPackets={[]}
          move={makeMove()}
          phaseNum={3}
          phaseTallies={[...phaseTallies]}
        />,
      );

      const root = screen.getByTestId("moves-phase-standalone");
      expect(root.className).toBe("mxw");
      expect(root).not.toHaveClass("mxw-finder-on");
      expect(root).not.toHaveAttribute("data-finder-shell");
    });

    it("falls back to the legacy render when useFeature throws (no Clerk/router context)", () => {
      mockUseFeature.mockImplementation(() => {
        throw new Error("useUser must be used within <ClerkProvider>");
      });
      render(
        <MovesPhaseStandaloneClient
          carriesForwardContent={[]}
          evidenceNeedPackets={[]}
          move={makeMove()}
          phaseNum={3}
          phaseTallies={[...phaseTallies]}
        />,
      );

      const root = screen.getByTestId("moves-phase-standalone");
      expect(root.className).toBe("mxw");
      expect(root).not.toHaveClass("mxw-finder-on");
    });

    it("adds the finder-shell class and data attribute when the flag is on, without changing tab/phase structure", () => {
      mockUseFeature.mockImplementation(() => true);
      render(
        <MovesPhaseStandaloneClient
          carriesForwardContent={[]}
          evidenceNeedPackets={[]}
          move={makeMove()}
          phaseNum={3}
          phaseTallies={[...phaseTallies]}
        />,
      );

      const root = screen.getByTestId("moves-phase-standalone");
      expect(root).toHaveClass("mxw", "mxw-finder-on");
      expect(root).toHaveAttribute("data-finder-shell", "on");

      // The tab/step control structure and phase nav are untouched — only
      // presentation (CSS scoped under .mxw-finder-on) changes, per the
      // "no restructuring" constraint.
      expect(
        screen.getByRole("tablist", { name: "Move workspace views" }),
      ).toBeInTheDocument();
      expect(
        screen.getByRole("complementary", { name: "Move phases" }),
      ).toBeInTheDocument();
    });

    it("flag on, P1: renders the P0-style contract canvas while preserving real workflow controls", () => {
      mockUseFeature.mockImplementation(
        (key: string) => key === "moves_finder_shell_v1",
      );
      render(
        <MovesPhaseStandaloneClient
          carriesForwardContent={[]}
          evidenceNeedPackets={[]}
          move={makeMove({
            currentPhase: 1,
            phaseLabel: "P1 Charter",
          })}
          phaseNum={1}
          phaseTallies={[...phaseTallies]}
        />,
      );

      const contractCard = screen.getByTestId("mxw-contract-card");
      expect(contractCard).toBeInTheDocument();
      expect(
        within(contractCard).getAllByText("Sponsor commitment").length,
      ).toBeGreaterThan(0);
      expect(
        within(contractCard).getByRole("button", { name: /Upload Evidence/i }),
      ).toBeInTheDocument();
      expect(
        within(contractCard).getByRole("button", { name: /Approve & Build/i }),
      ).toBeInTheDocument();

      fireEvent.click(
        within(contractCard).getByRole("button", { name: /Upload Evidence/i }),
      );
      expect(
        screen.getByRole("heading", { name: "Upload evidence for P1" }),
      ).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: "Upload decision files" }),
      ).toBeInTheDocument();

      fireEvent.click(
        within(contractCard).getByRole("button", { name: /Approve & Build/i }),
      );
      expect(
        screen.getByRole("heading", { name: "Gate approval" }),
      ).toBeInTheDocument();
      expect(screen.getByText("Full phase close executed")).toBeInTheDocument();
      expect(
        screen.getByText(/Approve & Build runs context extract/i),
      ).toBeInTheDocument();
    });
  });

  describe("MOVES-UI-003 rail collapse/expand toggle (moves_finder_shell_v1)", () => {
    it("flag off: no collapse toggle renders at all, and the rail is byte-parity with pre-existing (expanded-only) behavior", () => {
      mockUseFeature.mockImplementation(() => false);
      render(
        <MovesPhaseStandaloneClient
          carriesForwardContent={[]}
          evidenceNeedPackets={[]}
          move={makeMove()}
          phaseNum={3}
          phaseTallies={[...phaseTallies]}
        />,
      );

      expect(
        screen.queryByRole("button", { name: /collapse phase rail/i }),
      ).not.toBeInTheDocument();
      expect(
        screen.queryByRole("button", { name: /expand phase rail/i }),
      ).not.toBeInTheDocument();

      const rail = screen.getByRole("complementary", { name: "Move phases" });
      expect(rail).not.toHaveClass("mxw-side-collapsed");
      // Labels are always present — the collapsed, icon-only code path is
      // unreachable when the flag is off.
      expect(screen.getByText("Understand Current State")).toBeInTheDocument();
      expect(screen.getByText("Stage workspace")).toBeInTheDocument();
    });

    it("flag on: renders a collapse toggle; clicking it collapses the rail to an icon-only strip (real DOM/class change), and clicking again expands it back", () => {
      mockUseFeature.mockImplementation(() => true);
      render(
        <MovesPhaseStandaloneClient
          carriesForwardContent={[]}
          evidenceNeedPackets={[]}
          move={makeMove()}
          phaseNum={3}
          phaseTallies={[...phaseTallies]}
        />,
      );

      const rail = screen.getByRole("complementary", { name: "Move phases" });
      expect(rail).not.toHaveClass("mxw-side-collapsed");
      expect(screen.getByText("Understand Current State")).toBeInTheDocument();

      const toggle = screen.getByRole("button", {
        name: "Collapse phase rail",
      });
      expect(toggle).toHaveAttribute("aria-expanded", "true");
      expect(toggle).toHaveTextContent("«");

      fireEvent.click(toggle);

      // Real DOM/class change, not just an internal state flip: the rail
      // picks up the collapsed modifier class and its group/phase labels
      // stop rendering entirely.
      expect(rail).toHaveClass("mxw-side-collapsed");
      expect(
        screen.queryByText("Understand Current State"),
      ).not.toBeInTheDocument();
      expect(screen.queryByText("Stage workspace")).not.toBeInTheDocument();
      const expandToggle = screen.getByRole("button", {
        name: "Expand phase rail",
      });
      expect(expandToggle).toHaveAttribute("aria-expanded", "false");
      expect(expandToggle).toHaveTextContent("»");

      fireEvent.click(expandToggle);

      expect(rail).not.toHaveClass("mxw-side-collapsed");
      expect(screen.getByText("Understand Current State")).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: "Collapse phase rail" }),
      ).toBeInTheDocument();
    });

    it("flag on, collapsed: a reachable phase's icon is still a real link to its phase route (navigation survives collapse)", () => {
      mockUseFeature.mockImplementation(() => true);
      render(
        <MovesPhaseStandaloneClient
          carriesForwardContent={[]}
          evidenceNeedPackets={[]}
          move={makeMove()}
          phaseNum={3}
          phaseTallies={[...phaseTallies]}
        />,
      );

      fireEvent.click(
        screen.getByRole("button", { name: "Collapse phase rail" }),
      );

      // Phase 2 ("Understand Current State") is <= currentPhase (3), so it
      // renders as a Link both expanded and collapsed — reuses the same
      // click/navigation handler, just hides the text label.
      const rail = screen.getByRole("complementary", { name: "Move phases" });
      const phaseLink = within(rail).getByTitle(
        "Understand Current State · 2 of 2",
      );
      expect(phaseLink.tagName).toBe("A");
      expect(phaseLink).toHaveAttribute(
        "href",
        `/strategic-moves/${"37ee2d85-5dc0-4d1f-862e-ab8eff60fdd4"}/phase/2`,
      );
      expect(
        within(phaseLink).queryByText("Understand Current State"),
      ).toBeNull();
    });
  });

  describe("MOVES-UI-002 approvals overview (moves_approvals_overview_v1)", () => {
    it("flag off: the rail's Approvals link behaves exactly as before — jumps straight into the current phase's approve substep, no overview rendered", () => {
      mockUseFeature.mockImplementation(() => false);
      render(
        <MovesPhaseStandaloneClient
          carriesForwardContent={[]}
          evidenceNeedPackets={[]}
          move={makeMove()}
          phaseNum={3}
          phaseTallies={[...phaseTallies]}
        />,
      );

      fireEvent.click(
        screen.getByRole("button", { name: /^.?\s*Approvals$/i }),
      );

      expect(
        screen.getByRole("tab", { name: /Approve & Build/i }),
      ).toHaveAttribute("aria-selected", "true");
      expect(screen.queryByText("Approvals overview")).not.toBeInTheDocument();
      expect(
        screen.queryByLabelText("Approvals overview"),
      ).not.toBeInTheDocument();
    });

    it("flag on: opens the overview list instead, with every row reproducible from the mocked getMovePhaseTallies output alone", () => {
      mockUseFeature.mockImplementation(
        (key: string) => key === "moves_approvals_overview_v1",
      );
      render(
        <MovesPhaseStandaloneClient
          carriesForwardContent={[]}
          evidenceNeedPackets={[]}
          move={makeMove({ currentPhase: 3 })}
          phaseNum={3}
          phaseTallies={[...phaseTallies]}
        />,
      );

      fireEvent.click(
        screen.getByRole("button", { name: /^.?\s*Approvals$/i }),
      );

      expect(
        screen.getByRole("heading", { name: "Approvals overview" }),
      ).toBeInTheDocument();
      const overview = screen.getByLabelText("Approvals overview");

      // P0-P2 are "done" in the mocked tallies (met === total) -> Approved.
      expect(screen.getAllByText("Approved").length).toBe(3);
      // P3 is "current" with met=0/total=2 -> not yet submitted, exact tally
      // text sourced only from the mocked row's met/total fields.
      expect(
        screen.getByText("0/2 met — not yet submitted"),
      ).toBeInTheDocument();
      expect(screen.getAllByText("0 of 2 met").length).toBeGreaterThan(0);
      // P4/P5 are "upcoming" -> Not reached.
      expect(screen.getAllByText("Not reached").length).toBe(2);
      // Approver is always the static "Sponsor" label, once per phase row.
      expect(within(overview).getAllByText("Sponsor").length).toBe(6);
    });

    it("flag on, current-phase row: Review & approve returns to the phase workspace at the approve substep", () => {
      mockUseFeature.mockImplementation(
        (key: string) => key === "moves_approvals_overview_v1",
      );
      render(
        <MovesPhaseStandaloneClient
          carriesForwardContent={[]}
          evidenceNeedPackets={[]}
          move={makeMove({ currentPhase: 3 })}
          phaseNum={3}
          phaseTallies={[...phaseTallies]}
        />,
      );

      fireEvent.click(
        screen.getByRole("button", { name: /^.?\s*Approvals$/i }),
      );
      const overview = screen.getByLabelText("Approvals overview");
      fireEvent.click(
        within(overview).getByRole("button", { name: /Review & approve/i }),
      );

      expect(
        screen.getByRole("tab", { name: /Approve & Build/i }),
      ).toHaveAttribute("aria-selected", "true");
      expect(screen.queryByText("Approvals overview")).not.toBeInTheDocument();
    });

    it("flag on, another reachable phase row: Review & approve is a real link to that phase's route", () => {
      mockUseFeature.mockImplementation(
        (key: string) => key === "moves_approvals_overview_v1",
      );
      render(
        <MovesPhaseStandaloneClient
          carriesForwardContent={[]}
          evidenceNeedPackets={[]}
          move={makeMove({ currentPhase: 3 })}
          phaseNum={3}
          phaseTallies={[...phaseTallies]}
        />,
      );

      fireEvent.click(
        screen.getByRole("button", { name: /^.?\s*Approvals$/i }),
      );
      const overview = screen.getByLabelText("Approvals overview");

      const links = within(overview).getAllByRole("link", {
        name: /Review & approve/i,
      });
      // P0, P1, P2 are reachable (<= currentPhase 3) and are not the viewed
      // phase (P3), so each renders a real Link to its own phase route.
      expect(links.map((link) => link.getAttribute("href"))).toEqual([
        "/strategic-moves/37ee2d85-5dc0-4d1f-862e-ab8eff60fdd4/phase/0",
        "/strategic-moves/37ee2d85-5dc0-4d1f-862e-ab8eff60fdd4/phase/1",
        "/strategic-moves/37ee2d85-5dc0-4d1f-862e-ab8eff60fdd4/phase/2",
      ]);

      // P4/P5 are not yet reachable — no link, no button, just a plain label.
      expect(within(overview).getAllByText("Not yet reachable").length).toBe(2);
    });
  });

  it("does not render the retired P0 originate form inside the phase workspace", () => {
    render(
      <MovesPhaseStandaloneClient
        carriesForwardContent={[]}
        evidenceNeedPackets={[]}
        move={makeMove({
          currentPhase: 0,
          phaseLabel: "P0 Originate",
        })}
        phaseNum={0}
        phaseTallies={[...phaseTallies]}
      />,
    );

    expect(
      screen.getByRole("heading", {
        name: "Review the captured Move brief and approve the gate",
      }),
    ).toBeInTheDocument();
    // Single primary CTA (the step-navigation bar) drives progress here now —
    // the P0 handoff card no longer renders its own duplicate button/link.
    expect(
      screen.getByRole("button", { name: "Continue to Frame →" }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Review P0 gate →" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("link", { name: "Open gate link" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByText("Originate a strategic move"),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByText(/Capture each section by talking to aVa/i),
    ).not.toBeInTheDocument();
    expect(screen.queryByText(/Let aVa draft this/i)).not.toBeInTheDocument();
    expect(
      screen.queryByText(/Promote to P1 Charter/i),
    ).not.toBeInTheDocument();
  });

  it("honors P0 focus=gate by opening gate approval instead of the retired form", () => {
    render(
      <MovesPhaseStandaloneClient
        carriesForwardContent={[]}
        evidenceNeedPackets={[]}
        initialSubstepKey="approve"
        move={makeMove({
          currentPhase: 0,
          phaseLabel: "P0 Originate",
        })}
        phaseNum={0}
        phaseTallies={[...phaseTallies]}
      />,
    );

    expect(
      screen.getByRole("heading", { name: "Gate approval" }),
    ).toBeInTheDocument();
    expect(
      screen.getAllByRole("button", { name: "Approve gate →" }).length,
    ).toBeGreaterThan(0);
    expect(
      screen.queryByText("Originate a strategic move"),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByText(/What's the bet \/ hypothesis/i),
    ).not.toBeInTheDocument();
    expect(screen.queryByText(/Let aVa draft this/i)).not.toBeInTheDocument();
    expect(
      screen.queryByText(/Promote to P1 Charter/i),
    ).not.toBeInTheDocument();
  });

  it("shows completed P0 as read-only when the Move has already advanced to P1", () => {
    render(
      <MovesPhaseStandaloneClient
        carriesForwardContent={[]}
        evidenceNeedPackets={[]}
        initialSubstepKey="approve"
        move={makeMove({
          currentPhase: 1,
          phaseLabel: "P1 Charter",
        })}
        phaseNum={0}
        phaseTallies={[...phaseTallies]}
      />,
    );

    expect(screen.getAllByText(/already approved/i).length).toBeGreaterThan(0);
    expect(
      screen.getAllByRole("button", { name: /Continue to P1 Charter/i }).length,
    ).toBeGreaterThan(0);
    expect(
      screen.queryByRole("button", { name: "Approve gate →" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("heading", { name: "Gate criteria" }),
    ).not.toBeInTheDocument();
    expect(screen.queryByText("Blocking hard gate")).not.toBeInTheDocument();
    expect(
      screen.queryByText("Carry-forward soft criteria"),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByText("Originate a strategic move"),
    ).not.toBeInTheDocument();
  });

  it("renders terminal P5 as complete and routes the primary action to Tower", () => {
    const terminalTallies = phaseTallies.map((row) => ({
      ...row,
      met: row.total,
      state: "done" as const,
    }));

    render(
      <MovesPhaseStandaloneClient
        carriesForwardContent={[]}
        evidenceNeedPackets={[]}
        move={makeMove({
          currentPhase: 5,
          phaseLabel: "P5 Prepare to Execute",
          terminalComplete: true,
        })}
        phaseNum={5}
        phaseTallies={terminalTallies}
      />,
    );

    expect(
      screen.getByRole("link", { name: /Prepare to Execute\s+2 of 2/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Open Tower →" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Tower handoff complete")).toBeInTheDocument();
    expect(screen.queryByText(/Complete this phase/i)).not.toBeInTheDocument();
    expect(
      screen.queryByText(/Attest and advance to Tower handoff/i),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByText(/Complete the steps above/i),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /Generate Session Pack/i }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /Generate Execution & Readiness/i }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", {
        name: /Continue to P5 Prepare to Execute/i,
      }),
    ).not.toBeInTheDocument();
  });

  it("shows the saved seven-answer P0 brief separately from gate criteria", () => {
    render(
      <MovesPhaseStandaloneClient
        carriesForwardContent={[]}
        evidenceNeedPackets={[]}
        initialSubstepKey="approve"
        move={makeMove({
          currentPhase: 0,
          phaseLabel: "P0 Originate",
          name: "Member Service Agent Assist",
          archetype: "Contact Center Agent Assist",
          charter: {
            scaffold: {
              problem_statement:
                "Members experience long calls because agents navigate multiple systems.",
              archetype: "Contact Center Agent Assist",
              sponsor_candidate: "Chief Digital and Information Officer",
              scope_boundary:
                "In: claims status, prior auth, eligibility, benefits, CRM history, knowledge lookup. Out: clinical decisions.",
              evidence_family:
                "Member-service metrics, call transcripts, CRM history, claims/auth/benefits samples, knowledge base, systems inventory.",
              value_hypothesis:
                "Reduce avoidable handle time, repeat contact, transfers, and after-call work.",
              foundation_readiness:
                "Cloud data foundation must prove source ownership, quality, access, and PHI controls.",
            },
          },
        })}
        phaseNum={0}
        phaseTallies={[...phaseTallies]}
      />,
    );

    expect(
      screen.getByText("Review your seven Originate answers"),
    ).toBeInTheDocument();
    expect(screen.getByText("7 of 7")).toBeInTheDocument();
    expect(screen.getByText("Move name")).toBeInTheDocument();
    expect(
      screen.getAllByText("Member Service Agent Assist").length,
    ).toBeGreaterThan(0);
    expect(
      screen.getByText("Business problem / opportunity"),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Members experience long calls/i),
    ).toBeInTheDocument();
    expect(screen.getByText("Sponsor / title")).toBeInTheDocument();
    expect(
      screen.getByText(/Chief Digital and Information Officer/i),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Gate approval" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Gate criteria" }),
    ).toBeInTheDocument();
  });

  it("frames P1 as a posture hypothesis, not a solution approach recommendation", () => {
    render(
      <MovesPhaseStandaloneClient
        carriesForwardContent={[]}
        evidenceNeedPackets={[]}
        initialSubstepKey="prepare"
        move={makeMove({
          currentPhase: 1,
          phaseLabel: "P1 Charter",
        })}
        phaseNum={1}
        phaseTallies={[...phaseTallies]}
      />,
    );

    expect(
      screen.getByRole("heading", { name: "Initial transformation posture" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Charter inputs" }),
    ).toBeInTheDocument();
    expect(
      (screen.getByLabelText("Sponsor commitment") as HTMLTextAreaElement)
        .value,
    ).toContain("Sponsor/title:");
    expect(
      (screen.getByLabelText("Scope boundary") as HTMLTextAreaElement).value,
    ).not.toBe("");
    expect(
      (screen.getByLabelText("Success criteria") as HTMLTextAreaElement).value,
    ).not.toBe("");
    expect(
      screen.getByText(/starting hypothesis for P2 discovery/i),
    ).toBeInTheDocument();
    expect(screen.getByText("Improve the current process")).toBeInTheDocument();
    expect(
      screen.getByText("Explore a balanced transformation"),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Evaluate major transformation potential"),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("heading", { name: "Decide the approach" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByText("Phased platform + operating-model shift"),
    ).not.toBeInTheDocument();
    expect(screen.queryByText(/aVa recommends/i)).not.toBeInTheDocument();
  });

  it("uses P1 step 2 for uploading evidence, with multiple files enabled", async () => {
    render(
      <MovesPhaseStandaloneClient
        carriesForwardContent={[]}
        evidenceNeedPackets={[]}
        initialSubstepKey="decide"
        move={makeMove({
          currentPhase: 1,
          phaseLabel: "P1 Charter",
        })}
        phaseNum={1}
        phaseTallies={[...phaseTallies]}
      />,
    );

    expect(
      screen.getByRole("heading", { name: "Upload evidence for P1" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Files to upload" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Continue to Approve & Build →" }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("heading", { name: "Charter inputs" }),
    ).not.toBeInTheDocument();

    const input = screen.getByLabelText(
      "Upload decision files",
    ) as HTMLInputElement;
    expect(input).toHaveAttribute("multiple");

    fireEvent.change(input, {
      target: {
        files: [
          new File(["scope"], "scope-boundary.xlsx", {
            type: "application/vnd.ms-excel",
          }),
          new File(["notes"], "sponsor-review.docx", {
            type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
          }),
        ],
      },
    });

    await waitFor(() => {
      expect(screen.getByText("scope-boundary.xlsx")).toBeInTheDocument();
      expect(screen.getByText("sponsor-review.docx")).toBeInTheDocument();
    });
    // The list is real lifecycle data re-fetched from the artifact vault after
    // upload, not an ephemeral client-side echo of what was just picked.
    expect(screen.getAllByText(/v1 · draft/).length).toBe(2);
    expect(
      screen.getByRole("button", { name: "Open Files & Evidence" }),
    ).toBeInTheDocument();
  });

  it("shows the P1 charter capture fields at gate approval and blocks build until they are complete", () => {
    render(
      <MovesPhaseStandaloneClient
        carriesForwardContent={[]}
        evidenceNeedPackets={[]}
        initialSubstepKey="approve"
        move={makeMove({
          currentPhase: 1,
          phaseLabel: "P1 Charter",
        })}
        phaseNum={1}
        phaseTallies={[...phaseTallies]}
      />,
    );

    expect(
      screen.getByRole("heading", { name: "Charter inputs" }),
    ).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText("Sponsor commitment"), {
      target: { value: "" },
    });

    const buildButton = screen.getByRole("button", {
      name: /Complete phase inputs before build/i,
    });
    expect(buildButton).toBeDisabled();
    expect(
      screen.getAllByText(/Complete 1 phase input before Approve & Build/i)
        .length,
    ).toBeGreaterThan(0);
  });

  it("keeps solution approach selection in P3 after discovery evidence", () => {
    render(
      <MovesPhaseStandaloneClient
        carriesForwardContent={[]}
        evidenceNeedPackets={[]}
        initialSubstepKey="decide"
        move={makeMove({
          name: "Meridian Member Experience AI Assist",
          archetype: "Contact Center Agent Assist",
          tenant: {
            id: "tenant-meridian",
            name: "Healthcare Demo",
            industryCode: "healthcare_provider",
          },
          charter: {
            scaffold: {
              problem_statement:
                "Agents navigate CRM, claims, benefits, prior authorization, policy, and knowledge sources.",
              scope_boundary:
                "In: claims, eligibility, benefits, CRM history, and knowledge lookup. Out: clinical decisions.",
              evidence_family:
                "Member-service metrics, call transcripts, CRM history, claims samples, systems inventory.",
              value_hypothesis:
                "Improve member experience, reduce avoidable rework, and support a 90-day proof.",
              foundation_readiness:
                "Trusted data access, PHI controls, source freshness, quality, and lineage.",
            },
          },
        })}
        phaseNum={3}
        phaseTallies={[...phaseTallies]}
      />,
    );

    expect(
      screen.getByRole("heading", { name: "Decide the approach" }),
    ).toBeInTheDocument();
    expect(
      screen.getAllByText("Governed agent-assist layer on current systems")
        .length,
    ).toBeGreaterThan(0);
    expect(
      screen.queryByText("Phased platform + operating-model shift"),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByText("Optimize the current workflow"),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByText("Large transformation program"),
    ).not.toBeInTheDocument();
    expect(screen.getAllByText(/aVa recommends/i).length).toBeGreaterThan(0);
    expect(
      screen.queryByRole("heading", { name: "Initial transformation posture" }),
    ).not.toBeInTheDocument();
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
            reason:
              "Cost baseline is needed for a final-quality Roadmap & Business Case.",
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
        carriesForwardContent={[]}
        evidenceNeedPackets={evidenceNeedPackets}
        move={makeMove()}
        phaseNum={3}
        phaseTallies={[...phaseTallies]}
      />,
    );

    fireEvent.click(screen.getByRole("tab", { name: /Approve & Build/i }));

    expect(
      screen.getByText(/Next: P4 Build the Plan readiness/i),
    ).toBeInTheDocument();
    expect(screen.getByText("Cost baseline")).toBeInTheDocument();
    expect(screen.getByText(/Format: CSV, XLSX/i)).toBeInTheDocument();
    expect(
      screen.getByText(
        /traceable cost and value assumptions before funding-grade estimates/i,
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Suggested working sessions for P4 Build the Plan"),
    ).toBeInTheDocument();
    expect(screen.getByText("Value case workshop")).toBeInTheDocument();
  });

  it("surfaces real carries-forward content extracted from this phase's generated deliverable", () => {
    render(
      <MovesPhaseStandaloneClient
        carriesForwardContent={[
          {
            key: "workstreams",
            heading: "Workstream Breakdown",
            snippet:
              "Data platform migration led by J. Alvarez; clinical workflow cutover led by R. Chen.",
          },
        ]}
        evidenceNeedPackets={[]}
        move={makeMove()}
        phaseNum={3}
        phaseTallies={[...phaseTallies]}
      />,
    );

    fireEvent.click(screen.getByRole("tab", { name: /Approve & Build/i }));

    expect(
      screen.getByText("Carries forward from this phase's generated work"),
    ).toBeInTheDocument();
    expect(screen.getByText("Workstream Breakdown")).toBeInTheDocument();
    expect(
      screen.getByText(/Data platform migration led by J. Alvarez/i),
    ).toBeInTheDocument();
  });

  it("omits the carries-forward section when no real content signals were extracted", () => {
    render(
      <MovesPhaseStandaloneClient
        carriesForwardContent={[]}
        evidenceNeedPackets={[]}
        move={makeMove()}
        phaseNum={3}
        phaseTallies={[...phaseTallies]}
      />,
    );

    fireEvent.click(screen.getByRole("tab", { name: /Approve & Build/i }));

    expect(
      screen.queryByText("Carries forward from this phase's generated work"),
    ).not.toBeInTheDocument();
  });

  it("renders P3 in the contract shell instead of the older prepare wall", () => {
    mockUseFeature.mockImplementation(() => true);
    render(
      <MovesPhaseStandaloneClient
        carriesForwardContent={[]}
        evidenceNeedPackets={[]}
        move={makeMove()}
        phaseNum={3}
        phaseTallies={[...phaseTallies]}
      />,
    );

    expect(
      screen.getByRole("heading", { name: "Choose the Approach" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Files & Evidence")).toBeInTheDocument();
    expect(screen.getByTestId("mxw-contract-card")).toBeInTheDocument();
    expect(screen.queryByTestId("mxw-finder-steps")).not.toBeInTheDocument();
    const menu = screen.getByLabelText("P3 steps");
    expect(
      within(menu).getByRole("button", {
        name: /Solution approach & options/i,
      }),
    ).toBeInTheDocument();
    expect(screen.getByText("Step 1 of 12")).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: /Solution approach & options/i }),
    ).toBeInTheDocument();
    expect(
      within(menu).getByRole("button", { name: /Compare Options/i }),
    ).toBeInTheDocument();
    expect(
      within(menu).getByRole("button", { name: /Record Decision/i }),
    ).toBeInTheDocument();
    expect(
      within(menu).getByRole("button", { name: /Design Canvas/i }),
    ).toBeInTheDocument();
    expect(
      within(menu).getByRole("button", { name: /Approve & Build/i }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Upload files" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Review gate" }),
    ).not.toBeInTheDocument();

    fireEvent.click(
      within(menu).getByRole("button", { name: /Compare Options/i }),
    );
    expect(screen.getByText("Options & recommendation")).toBeInTheDocument();
    expect(screen.getByText("P2 design inputs pack")).toBeInTheDocument();
    expect(
      screen.queryByText("How to complete this phase"),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("heading", { name: "What this phase needs" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByText("Sessions and templates for this phase"),
    ).not.toBeInTheDocument();
    expect(screen.queryByText(/Phase Sessions/i)).not.toBeInTheDocument();
    expect(
      screen.queryByRole("heading", { name: "Templates & sessions" }),
    ).not.toBeInTheDocument();
    expect(screen.queryByText(/Phase complete/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/To advance to P4/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/View dossier/i)).not.toBeInTheDocument();
  });

  it("renders P4 in the contract shell instead of the older prepare wall", () => {
    mockUseFeature.mockImplementation(() => true);
    render(
      <MovesPhaseStandaloneClient
        carriesForwardContent={[]}
        evidenceNeedPackets={[]}
        move={makeMove({
          currentPhase: 4,
          phaseLabel: "P4 Build the Plan",
        })}
        phaseNum={4}
        phaseTallies={[...phaseTallies]}
      />,
    );

    expect(
      screen.getByRole("heading", { name: "Build the Plan" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Files & Evidence")).toBeInTheDocument();
    expect(screen.getByTestId("mxw-contract-card")).toBeInTheDocument();
    expect(screen.queryByTestId("mxw-finder-steps")).not.toBeInTheDocument();
    const menu = screen.getByLabelText("P4 steps");
    expect(
      within(menu).getByRole("button", { name: /Roadmap & sequencing/i }),
    ).toBeInTheDocument();
    expect(screen.getByText("Step 1 of 11")).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: /Roadmap & sequencing/i }),
    ).toBeInTheDocument();
    expect(
      within(menu).getByRole("button", { name: /Estimates & capacity/i }),
    ).toBeInTheDocument();
    expect(
      within(menu).getByRole("button", {
        name: /Value plan & business case/i,
      }),
    ).toBeInTheDocument();
    expect(
      within(menu).getByRole("button", {
        name: /Funding ask & governance/i,
      }),
    ).toBeInTheDocument();
    expect(
      within(menu).getByRole("button", { name: /Source \/ Tower handoff/i }),
    ).toBeInTheDocument();
    expect(
      within(menu).getByRole("button", { name: /Value Case/i }),
    ).toBeInTheDocument();
    expect(
      within(menu).getByRole("button", { name: /Plan Workstreams/i }),
    ).toBeInTheDocument();
    expect(
      within(menu).getByRole("button", { name: /Approve & Build/i }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Upload files" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Review gate" }),
    ).not.toBeInTheDocument();

    fireEvent.click(within(menu).getByRole("button", { name: /Value Case/i }));
    expect(screen.getByText("The value case")).toBeInTheDocument();
    expect(screen.getByText("Projected")).toBeInTheDocument();
    expect(screen.getByText("Evidence posture")).toBeInTheDocument();
    expect(
      screen.queryByText("How to complete this phase"),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("heading", { name: "What this phase needs" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByText("Sessions and templates for this phase"),
    ).not.toBeInTheDocument();
    expect(screen.queryByText(/Phase Sessions/i)).not.toBeInTheDocument();
    expect(
      screen.queryByRole("heading", { name: "Templates & sessions" }),
    ).not.toBeInTheDocument();
  });

  it("renders P5 in the contract shell instead of the older prepare wall", () => {
    mockUseFeature.mockImplementation(() => true);
    render(
      <MovesPhaseStandaloneClient
        carriesForwardContent={[]}
        evidenceNeedPackets={[]}
        move={makeMove({
          currentPhase: 5,
          phaseLabel: "P5 Prepare to Execute",
        })}
        phaseNum={5}
        phaseTallies={[...phaseTallies]}
      />,
    );

    expect(
      screen.getByRole("heading", { name: "Prepare to Execute" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Files & Evidence")).toBeInTheDocument();
    expect(screen.getByTestId("mxw-contract-card")).toBeInTheDocument();
    expect(screen.queryByTestId("mxw-finder-steps")).not.toBeInTheDocument();
    const menu = screen.getByLabelText("P5 steps");
    expect(
      within(menu).getByRole("button", { name: /Mobilization plan & RACI/i }),
    ).toBeInTheDocument();
    expect(screen.getByText("Step 1 of 10")).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: /Mobilization plan & RACI/i }),
    ).toBeInTheDocument();
    expect(
      within(menu).getByRole("button", { name: /Launch readiness/i }),
    ).toBeInTheDocument();
    expect(
      within(menu).getByRole("button", {
        name: /Value-proof rules & metrics/i,
      }),
    ).toBeInTheDocument();
    expect(
      within(menu).getByRole("button", {
        name: /Governance & Tower cadence/i,
      }),
    ).toBeInTheDocument();
    expect(
      within(menu).getByRole("button", {
        name: /Open risks & client-to-complete/i,
      }),
    ).toBeInTheDocument();
    expect(
      within(menu).getByRole("button", { name: /Recommendation to launch/i }),
    ).toBeInTheDocument();
    expect(
      within(menu).getByRole("button", { name: /Execution Readiness/i }),
    ).toBeInTheDocument();
    expect(
      within(menu).getByRole("button", { name: /Approve & Build/i }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Upload files" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Review gate" }),
    ).not.toBeInTheDocument();

    fireEvent.click(
      within(menu).getByRole("button", { name: /Execution Readiness/i }),
    );
    expect(
      screen.getByRole("heading", { name: "Execution Readiness" }),
    ).toBeInTheDocument();
    expect(
      screen.queryByText("How to complete this phase"),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("heading", { name: "What this phase needs" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByText("Sessions and templates for this phase"),
    ).not.toBeInTheDocument();
    expect(screen.queryByText(/Phase Sessions/i)).not.toBeInTheDocument();
    expect(
      screen.queryByRole("heading", { name: "Templates & sessions" }),
    ).not.toBeInTheDocument();
  });

  it("mounts governed current-state readiness in the current-state workspace before the static findings lanes", () => {
    render(
      <MovesPhaseStandaloneClient
        carriesForwardContent={[]}
        currentStateReadiness={makeCurrentStateReadiness()}
        evidenceNeedPackets={[]}
        move={makeMove({
          currentPhase: 2,
          phaseLabel: "P2 Understand Current State",
        })}
        phaseNum={2}
        phaseTallies={[...phaseTallies]}
      />,
    );

    fireEvent.click(screen.getByRole("tab", { name: /Review Findings/i }));

    expect(screen.getByText("Current-state readiness")).toBeInTheDocument();
    expect(screen.getByText(/0% collected/i)).toBeInTheDocument();
    expect(screen.getByText(/1 hard current-state gap/i)).toBeInTheDocument();
    expect(
      screen.getAllByText("Engineering delivery baseline (DORA)").length,
    ).toBeGreaterThanOrEqual(2);
    expect(screen.getByText("Upload CI/CD export as CSV")).toBeInTheDocument();
    expect(screen.getByText("Findings to review")).toBeInTheDocument();
    expect(screen.getByText("Process")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Open Files & Evidence" }),
    ).toBeInTheDocument();
    // The duplicate header CTA was removed — only the active workflow card owns
    // the contextual next action.
    expect(
      screen.queryByRole("button", { name: "Continue to Approve & Build" }),
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Continue to Approve & Build →" }),
    ).toBeInTheDocument();
  });

  it("does not load the legacy facilitated session playbook on the Prepare tab", () => {
    render(
      <MovesPhaseStandaloneClient
        carriesForwardContent={[]}
        evidenceNeedPackets={[]}
        move={makeMove()}
        phaseNum={3}
        phaseTallies={[...phaseTallies]}
      />,
    );

    expect(
      screen.queryByText(/Phase Sessions · P3 Design/i),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /Generate Session Pack/i }),
    ).not.toBeInTheDocument();
    expect(global.fetch).not.toHaveBeenCalledWith(
      "/api/v1/programs/37ee2d85-5dc0-4d1f-862e-ab8eff60fdd4/playbook?phase=3",
      expect.anything(),
    );
  });

  it("does not load Phase Intelligence until the user opens its workspace tab", async () => {
    render(
      <MovesPhaseStandaloneClient
        carriesForwardContent={[]}
        evidenceNeedPackets={[]}
        move={makeMove()}
        phaseNum={3}
        phaseTallies={[...phaseTallies]}
      />,
    );

    expect(global.fetch).not.toHaveBeenCalledWith(
      "/api/v1/programs/37ee2d85-5dc0-4d1f-862e-ab8eff60fdd4/phase-intelligence?phase=3",
      expect.anything(),
    );

    fireEvent.click(
      screen.getByRole("button", { name: /Phase Intelligence/i }),
    );
    expect(
      screen.getByRole("heading", { name: "Phase Intelligence" }),
    ).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText("Governed agent workspace")).toBeInTheDocument();
    });
    expect(screen.getByText(/labeled planning range/)).toBeInTheDocument();
    expect(
      screen.getByText("1 hard gate open; 1 required evidence gap."),
    ).toBeInTheDocument();
    expect(global.fetch).toHaveBeenCalledWith(
      "/api/v1/programs/37ee2d85-5dc0-4d1f-862e-ab8eff60fdd4/phase-intelligence?phase=3",
      expect.objectContaining({ credentials: "include" }),
    );
  });

  it("wires phase workspace v2 task actions to the existing Files and gate controls", async () => {
    render(
      <MovesPhaseStandaloneClient
        carriesForwardContent={[]}
        evidenceNeedPackets={[
          {
            moveId: "37ee2d85-5dc0-4d1f-862e-ab8eff60fdd4",
            phase: 3,
            artifactType: "solution_design",
            evidenceSlot: "Solution architecture constraints",
            familyId: "architecture_constraints",
            priority: "required",
            ownerSource: "Client owner / evidence steward",
            acceptedFormats: ["DOCX"],
            exampleTemplate: "Architecture constraints memo",
            exampleContent: [],
            whyItMatters:
              "The design lane needs real architecture constraints.",
            blockedArtifacts: [],
            canDraftBoundary: {
              canDraft: false,
              canDraftLabel: "",
              cannotDraftLabel: "",
            },
            preliminaryGenerationCaveat: null,
            waiverOption: null,
            nextAction: "Upload the architecture constraints memo.",
            status: "missing",
            evidenceTitles: [],
          },
        ]}
        move={makeMove()}
        phaseNum={3}
        phaseTallies={[...phaseTallies]}
      />,
    );

    fireEvent.click(screen.getByRole("tab", { name: /Record Decision/i }));

    expect(
      screen.getByRole("heading", { name: "Decide the approach" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", {
        name: "Upload evidence for approach decision",
      }),
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole("tab", { name: /Approve & Build/i }));

    expect(
      screen.getByRole("heading", { name: "Gate approval" }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/1 required next-phase prep item/i),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        /These items are carried forward as next-phase preparation/i,
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", {
        name: /Approve & Build P3 Choose the Approach/i,
      }),
    ).toBeEnabled();
  });

  it("Files & Evidence renders a real generated deliverable as an actual downloadable link", async () => {
    (global.fetch as jest.Mock).mockImplementation(
      async (input: RequestInfo | URL) => {
        const url = String(input);
        if (url.includes("/artifacts") && !url.includes("/artifacts/")) {
          return {
            ok: true,
            status: 200,
            json: async () => ({
              ok: true,
              count: 1,
              artifacts: [
                {
                  artifactId: "d74ed94a-a600-46ee-ad5d-a505556c4cac",
                  artifactType: "target_state_architecture",
                  family: "generated_deliverable",
                  title:
                    "CANARY — SkyHarbor Recovery Command IROPS Target Architecture",
                  phase: 3,
                  fileFormat: "html",
                  fileName: null,
                  version: 1,
                  status: "board_ready",
                  lifecycleState: "current",
                  qualityScore: 100,
                  createdAt: "2026-07-11T23:26:23.000Z",
                  downloadUrl:
                    "/api/v1/artifacts/d74ed94a-a600-46ee-ad5d-a505556c4cac",
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
      },
    );

    render(
      <MovesPhaseStandaloneClient
        carriesForwardContent={[]}
        evidenceNeedPackets={[]}
        move={makeMove()}
        phaseNum={3}
        phaseTallies={[...phaseTallies]}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: /Files & Evidence/i }));

    await waitFor(() => {
      expect(
        screen.getByText(
          /CANARY — SkyHarbor Recovery Command IROPS Target Architecture/i,
        ),
      ).toBeInTheDocument();
    });

    // Real click on the real "Open" action must open the stable artifact route
    // in a separate tab. It must never navigate the Moves workspace away.
    fireEvent.click(screen.getByRole("button", { name: /^Open$/i }));
    await waitFor(() => {
      expect(window.open).toHaveBeenCalledWith(
        "/api/v1/artifacts/d74ed94a-a600-46ee-ad5d-a505556c4cac?inline=1",
        "moves-artifact-d74ed94a-a600-46ee-ad5d-a505556c4cac",
        "noopener,noreferrer",
      );
    });
  });

  it("supports the explorer, upload, aVa launcher, and gate ceremony interactions", async () => {
    const { container } = render(
      <MovesPhaseStandaloneClient
        carriesForwardContent={[]}
        evidenceNeedPackets={[]}
        move={makeMove()}
        phaseNum={3}
        phaseTallies={[...phaseTallies]}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: /Files & Evidence/i }));
    expect(
      screen.getByRole("heading", { name: "Files & Evidence" }),
    ).toBeInTheDocument();
    // The real File Cabinet vault (FileCabinetPanel) is mounted here, not a
    // static per-phase mock — it fetches the move's real artifacts and shows
    // this loading/empty state until they resolve.
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        "/api/v1/programs/37ee2d85-5dc0-4d1f-862e-ab8eff60fdd4/artifacts",
        expect.anything(),
      );
    });
    expect(
      Array.from(container.querySelectorAll("a")).some((anchor) =>
        anchor.getAttribute("href")?.includes("?tab="),
      ),
    ).toBe(false);

    fireEvent.click(
      screen.getByRole("button", { name: /CANARY - SkyHarbor/i }),
    );
    fireEvent.click(screen.getByRole("tab", { name: /Approve & Build/i }));
    expect(
      screen.getByRole("button", { name: /Review governed build/i }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /Approve & advance/i }),
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole("button", {
        name: /Approve & Build P3 Choose the Approach/i,
      }),
    ).toBeInTheDocument();
    fireEvent.click(
      screen.getByRole("button", {
        name: /Approve & Build P3 Choose the Approach/i,
      }),
    );
    await waitFor(() => {
      expect(screen.getAllByText(/Gate approved/i).length).toBeGreaterThan(0);
    });
    await waitFor(() => {
      expect(screen.getAllByText(/^Built$/i).length).toBeGreaterThan(0);
    });
    expect(global.fetch).toHaveBeenCalledWith(
      "/api/v1/deliverables/generate-phase",
      expect.objectContaining({ credentials: "include", method: "POST" }),
    );
    expect(global.fetch).toHaveBeenCalledWith(
      "/api/v1/deliverables/runs/run-1",
      expect.objectContaining({ credentials: "include" }),
    );
    expect(global.fetch).toHaveBeenCalledWith(
      "/api/v1/programs/37ee2d85-5dc0-4d1f-862e-ab8eff60fdd4/phase-gate-approval",
      expect.objectContaining({ credentials: "include", method: "POST" }),
    );
    const phaseCaptureCall = (global.fetch as jest.Mock).mock.calls.find(
      ([url]) => String(url).includes("/phase-capture"),
    );
    expect(phaseCaptureCall).toBeTruthy();
    const phaseCaptureBody = JSON.parse(
      String(phaseCaptureCall?.[1]?.body ?? "{}"),
    );
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
        carriesForwardContent={[]}
        evidenceNeedPackets={[]}
        move={makeMove()}
        phaseNum={3}
        phaseTallies={[...phaseTallies]}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: /Ask aVa/i }));
    fireEvent.click(
      screen.getByRole("button", { name: /What must be true before P4\?/i }),
    );

    await waitFor(() => {
      expect(
        screen.getByText(
          /The two blocking gate items are the requirements trace/i,
        ),
      ).toBeInTheDocument();
    });

    const chatCall = (global.fetch as jest.Mock).mock.calls.find(([url]) =>
      String(url).includes("/api/chat/agent"),
    );
    expect(chatCall).toBeTruthy();
    const chatBody = JSON.parse(String(chatCall?.[1]?.body ?? "{}"));
    expect(chatBody.message).toBe("What must be true before P4?");
    expect(chatBody.programId).toBe("37ee2d85-5dc0-4d1f-862e-ab8eff60fdd4");
    expect(chatBody.surfaceContext.programId).toBe(
      "37ee2d85-5dc0-4d1f-862e-ab8eff60fdd4",
    );
    expect(chatBody.surfaceContext.moveId).toBe(
      "37ee2d85-5dc0-4d1f-862e-ab8eff60fdd4",
    );
    expect(chatBody.surfaceContext.phase).toBe(3);
  });

  it("supports typing and sending a free-form question via the composer", async () => {
    render(
      <MovesPhaseStandaloneClient
        carriesForwardContent={[]}
        evidenceNeedPackets={[]}
        move={makeMove()}
        phaseNum={3}
        phaseTallies={[...phaseTallies]}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: /Ask aVa/i }));
    const textarea = screen.getByPlaceholderText(/Ask aVa about/i);
    fireEvent.change(textarea, {
      target: { value: "Where are we over-designing?" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Send" }));

    await waitFor(() => {
      expect(
        screen.getByText("Where are we over-designing?"),
      ).toBeInTheDocument();
    });
    await waitFor(() => {
      expect(
        screen.getByText(
          /The two blocking gate items are the requirements trace/i,
        ),
      ).toBeInTheDocument();
    });
    expect((textarea as HTMLTextAreaElement).value).toBe("");
  });

  describe("MOVES-UI-001 Steps two-column view (moves_finder_shell_v1)", () => {
    it("flag off: renders no two-column steps view, and the legacy horizontal stepper still drives substep navigation", () => {
      mockUseFeature.mockImplementation(() => false);
      render(
        <MovesPhaseStandaloneClient
          carriesForwardContent={[]}
          evidenceNeedPackets={[]}
          move={makeMove({
            currentPhase: 2,
            phaseLabel: "P2 Understand Current State",
          })}
          phaseNum={2}
          phaseTallies={[...phaseTallies]}
        />,
      );

      expect(screen.queryByTestId("mxw-finder-steps")).not.toBeInTheDocument();
      expect(
        screen.getByRole("tablist", { name: "Phase steps" }),
      ).toBeInTheDocument();
      fireEvent.click(screen.getByRole("tab", { name: /Upload & Review/i }));
      expect(
        screen.getByRole("heading", { name: "Evidence checklist" }),
      ).toBeInTheDocument();
    });

    it("flag on: renders the contract-card Steps view sourced only from getPhaseCaptureSections/phaseCaptureValues — no fabricated section names", () => {
      mockUseFeature.mockImplementation(() => true);
      const move = makeMove({
        currentPhase: 2,
        phaseLabel: "P2 Understand Current State",
      });
      render(
        <MovesPhaseStandaloneClient
          carriesForwardContent={[]}
          evidenceNeedPackets={[]}
          move={move}
          phaseNum={2}
          phaseTallies={[...phaseTallies]}
        />,
      );

      expect(screen.queryByTestId("mxw-finder-steps")).not.toBeInTheDocument();
      expect(screen.getByTestId("mxw-contract-card")).toBeInTheDocument();
      const menu = screen.getByLabelText("P2 steps");
      // Every real P2 capture-section label appears — nothing invented.
      [
        "Current-state findings",
        "Baseline metrics",
        "Gaps / root causes",
        "Process handoffs",
        "Data quality / governance",
        "Evidence confidence",
        "Recommendation",
      ].forEach((label) => {
        expect(within(menu).getByText(label)).toBeInTheDocument();
      });
      // The real substeps (same array driving the legacy stepper) appear
      // under "Workflow" — not a fabricated category.
      expect(within(menu).getByText("Upload & Review")).toBeInTheDocument();
      expect(within(menu).getByText("Approve & Build")).toBeInTheDocument();
      // P2 now follows the same shell contract as P1: the first real input is
      // selected by default instead of landing on an old workflow summary.
      expect(
        screen.getByRole("heading", { name: "Current-state findings" }),
      ).toBeInTheDocument();
    });

    it("clicking a phase-input row updates the detail pane to that section's real captured value; clicking a workflow row restores the real substep content", () => {
      mockUseFeature.mockImplementation(() => true);
      const move = makeMove({
        currentPhase: 2,
        phaseLabel: "P2 Understand Current State",
      });
      render(
        <MovesPhaseStandaloneClient
          carriesForwardContent={[]}
          evidenceNeedPackets={[]}
          move={move}
          phaseNum={2}
          phaseTallies={[...phaseTallies]}
        />,
      );

      const menu = screen.getByLabelText("P2 steps");
      fireEvent.click(
        within(menu).getByRole("button", { name: /Current-state findings/i }),
      );

      // Detail pane really switched: heading + description now visible, and
      // the value shown is the section's real captured value (traces to the
      // real move.name — not invented text).
      expect(
        screen.getByRole("heading", { name: "Current-state findings" }),
      ).toBeInTheDocument();
      expect(
        (screen.getByLabelText("Current-state findings") as HTMLTextAreaElement)
          .value,
      ).toContain(move.name);
      expect(
        screen.queryByRole("heading", { name: "What this phase needs" }),
      ).not.toBeInTheDocument();

      // Now click a real Workflow (substep) row — the detail pane must show
      // that substep's real, already-existing PhaseBody content again.
      fireEvent.click(
        within(menu).getByRole("button", { name: /Upload & Review/i }),
      );
      expect(
        screen.getByRole("heading", { name: "Evidence checklist" }),
      ).toBeInTheDocument();
      expect(
        screen.queryByRole("heading", { name: "Current-state findings" }),
      ).not.toBeInTheDocument();
    });

    it("citation toggle: absent by default (no captured source), then appears and actually reveals/hides the source caption once a real source is captured", () => {
      mockUseFeature.mockImplementation(() => true);
      render(
        <MovesPhaseStandaloneClient
          carriesForwardContent={[]}
          evidenceNeedPackets={[]}
          move={makeMove({
            currentPhase: 2,
            phaseLabel: "P2 Understand Current State",
          })}
          phaseNum={2}
          phaseTallies={[...phaseTallies]}
        />,
      );

      const menu = screen.getByLabelText("P2 steps");
      fireEvent.click(
        within(menu).getByRole("button", { name: /Baseline metrics/i }),
      );

      // The auto-populated default value is free text, not structured JSON,
      // so parseDiagnosisFacts yields a single source-less fact — the
      // citation toggle must not render for it. This is the explicit
      // "absent, not fabricated" case.
      expect(screen.getByText("Captured note")).toBeInTheDocument();
      expect(
        screen.queryByRole("button", { name: /Show source for/i }),
      ).not.toBeInTheDocument();

      // Capture a real structured fact with a source (as
      // diagnosis-facts.ts's own contract supports) via the same textarea
      // the legacy PhaseCaptureEditor already uses to write this value.
      fireEvent.change(screen.getByLabelText("Baseline metrics"), {
        target: {
          value: JSON.stringify([
            {
              metric: "Cycle time",
              value: "18.4 days",
              source: "Intake work queue export",
            },
          ]),
        },
      });

      expect(screen.getByText("Cycle time")).toBeInTheDocument();
      const toggle = screen.getByRole("button", {
        name: "Show source for Cycle time",
      });
      expect(
        screen.queryByText("Intake work queue export"),
      ).not.toBeInTheDocument();

      fireEvent.click(toggle);
      expect(screen.getByText("Intake work queue export")).toBeInTheDocument();

      fireEvent.click(toggle);
      expect(
        screen.queryByText("Intake work queue export"),
      ).not.toBeInTheDocument();
    });

    it("upload-type workflow step: the real file input reachable from the two-column detail pane invokes the same existing upload wiring (no new handler built)", async () => {
      mockUseFeature.mockImplementation(() => true);
      render(
        <MovesPhaseStandaloneClient
          carriesForwardContent={[]}
          evidenceNeedPackets={[]}
          move={makeMove({
            currentPhase: 2,
            phaseLabel: "P2 Understand Current State",
          })}
          phaseNum={2}
          phaseTallies={[...phaseTallies]}
        />,
      );

      const menu = screen.getByLabelText("P2 steps");
      // P2's real "current" substep is literally "Upload & Review" — the
      // only upload-type step reachable for this phase's real data.
      fireEvent.click(
        within(menu).getByRole("button", { name: /Upload & Review/i }),
      );

      const input = screen.getByLabelText(
        "Upload P2 files",
      ) as HTMLInputElement;
      fireEvent.change(input, {
        target: {
          files: [
            new File(["baseline"], "baseline-extract.csv", {
              type: "text/csv",
            }),
          ],
        },
      });

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          "/api/v1/programs/37ee2d85-5dc0-4d1f-862e-ab8eff60fdd4/artifacts/upload",
          expect.objectContaining({ method: "POST" }),
        );
      });
      await waitFor(() => {
        expect(screen.getByText("baseline-extract.csv")).toBeInTheDocument();
      });
    });

    it("'Coming up' card: collapsed by default, expands/collapses the real readiness-pack chips in the DOM, and is bound only to real evidence-need packets", () => {
      mockUseFeature.mockImplementation(() => true);
      render(
        <MovesPhaseStandaloneClient
          carriesForwardContent={[]}
          evidenceNeedPackets={[
            {
              moveId: "37ee2d85-5dc0-4d1f-862e-ab8eff60fdd4",
              phase: 2,
              artifactType: "solution_design",
              evidenceSlot: "Systems inventory",
              familyId: "systems_inventory",
              priority: "required",
              ownerSource: "Client owner / evidence steward",
              acceptedFormats: ["XLSX"],
              exampleTemplate: "Systems landscape extract",
              exampleContent: [],
              whyItMatters: "P3 solution options need the real systems map.",
              blockedArtifacts: [
                {
                  artifactType: "solution_options",
                  title: "Solution Options Canvas",
                  phase: 3,
                  reason: "Systems inventory is needed to scope integration.",
                },
              ],
              canDraftBoundary: {
                canDraft: false,
                canDraftLabel: "",
                cannotDraftLabel: "",
              },
              preliminaryGenerationCaveat: null,
              waiverOption: null,
              nextAction: "Upload the systems landscape extract.",
              status: "missing",
              evidenceTitles: [],
            },
          ]}
          move={makeMove({
            currentPhase: 2,
            phaseLabel: "P2 Understand Current State",
          })}
          phaseNum={2}
          phaseTallies={[...phaseTallies]}
        />,
      );

      const comingUp = screen.getByTestId("mxw-contract-comingup");
      const toggle = within(comingUp).getByRole("button", {
        name: "What P3 Choose the Approach will need",
      });
      expect(toggle).toHaveAttribute("aria-expanded", "false");
      expect(
        screen.queryByTestId("mxw-contract-comingup-chips"),
      ).not.toBeInTheDocument();

      fireEvent.click(toggle);
      expect(toggle).toHaveAttribute("aria-expanded", "true");
      expect(
        within(screen.getByTestId("mxw-contract-comingup-chips")).getByText(
          "Systems inventory",
        ),
      ).toBeInTheDocument();

      fireEvent.click(toggle);
      expect(toggle).toHaveAttribute("aria-expanded", "false");
      expect(
        screen.queryByTestId("mxw-contract-comingup-chips"),
      ).not.toBeInTheDocument();
    });
  });
});
