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
import type { ReadinessReport } from "@/lib/programs/current-state-readiness";
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
    window.open = jest.fn(() => ({} as Window));
    uploadedEvidenceArtifacts = [];
    global.fetch = jest.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
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
        return { ok: true, status: 200, json: async () => ({ ok: true }) } as Response;
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
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
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
    expect(screen.getByRole("button", { name: "Continue to Frame →" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Review P0 gate →" })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Open gate link" })).not.toBeInTheDocument();
    expect(screen.queryByText("Originate a strategic move")).not.toBeInTheDocument();
    expect(screen.queryByText(/Capture each section by talking to aVa/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Let aVa draft this/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Promote to P1 Charter/i)).not.toBeInTheDocument();
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

    expect(screen.getByRole("heading", { name: "Gate approval" })).toBeInTheDocument();
    expect(screen.getAllByRole("button", { name: "Approve gate →" }).length).toBeGreaterThan(0);
    expect(screen.queryByText("Originate a strategic move")).not.toBeInTheDocument();
    expect(screen.queryByText(/What's the bet \/ hypothesis/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Let aVa draft this/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Promote to P1 Charter/i)).not.toBeInTheDocument();
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
    expect(screen.getAllByRole("button", { name: /Continue to P1 Charter/i }).length).toBeGreaterThan(0);
    expect(screen.queryByRole("button", { name: "Approve gate →" })).not.toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Gate criteria" })).not.toBeInTheDocument();
    expect(screen.queryByText("Blocking hard gate")).not.toBeInTheDocument();
    expect(screen.queryByText("Carry-forward soft criteria")).not.toBeInTheDocument();
    expect(screen.queryByText("Originate a strategic move")).not.toBeInTheDocument();
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
      screen.getByRole("link", { name: /Prepare to Execute\s+Complete/i }),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Open Tower →" })).toBeInTheDocument();
    expect(screen.getByText("Tower handoff complete")).toBeInTheDocument();
    expect(screen.queryByText(/Complete this phase/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Attest and advance to Tower handoff/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Complete the steps above/i)).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Generate Session Pack/i })).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /Generate Execution & Readiness/i }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /Continue to P5 Prepare to Execute/i }),
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

    expect(screen.getByText("Review your seven Originate answers")).toBeInTheDocument();
    expect(screen.getByText("7 of 7")).toBeInTheDocument();
    expect(screen.getByText("Move name")).toBeInTheDocument();
    expect(screen.getAllByText("Member Service Agent Assist").length).toBeGreaterThan(0);
    expect(screen.getByText("Business problem / opportunity")).toBeInTheDocument();
    expect(screen.getByText(/Members experience long calls/i)).toBeInTheDocument();
    expect(screen.getByText("Sponsor / title")).toBeInTheDocument();
    expect(screen.getByText(/Chief Digital and Information Officer/i)).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Gate approval" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Gate criteria" })).toBeInTheDocument();
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
    expect(screen.getByRole("heading", { name: "Charter inputs" })).toBeInTheDocument();
    expect((screen.getByLabelText("Sponsor commitment") as HTMLTextAreaElement).value).toContain(
      "Sponsor/title:",
    );
    expect((screen.getByLabelText("Scope boundary") as HTMLTextAreaElement).value).not.toBe("");
    expect((screen.getByLabelText("Success criteria") as HTMLTextAreaElement).value).not.toBe("");
    expect(screen.getByText(/starting hypothesis for P2 discovery/i)).toBeInTheDocument();
    expect(screen.getByText("Improve the current process")).toBeInTheDocument();
    expect(screen.getByText("Explore a balanced transformation")).toBeInTheDocument();
    expect(screen.getByText("Evaluate major transformation potential")).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Decide the approach" })).not.toBeInTheDocument();
    expect(screen.queryByText("Phased platform + operating-model shift")).not.toBeInTheDocument();
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

    expect(screen.getByRole("heading", { name: "Upload evidence for P1" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Files to upload" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Continue to Approve & Build →" })).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Charter inputs" })).not.toBeInTheDocument();

    const input = screen.getByLabelText("Upload decision files") as HTMLInputElement;
    expect(input).toHaveAttribute("multiple");

    fireEvent.change(input, {
      target: {
        files: [
          new File(["scope"], "scope-boundary.xlsx", { type: "application/vnd.ms-excel" }),
          new File(["notes"], "sponsor-review.docx", { type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document" }),
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
    expect(screen.getByRole("button", { name: "Open Files & Evidence" })).toBeInTheDocument();
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

    expect(screen.getByRole("heading", { name: "Charter inputs" })).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText("Sponsor commitment"), {
      target: { value: "" },
    });

    const buildButton = screen.getByRole("button", {
      name: /Complete phase inputs before build/i,
    });
    expect(buildButton).toBeDisabled();
    expect(screen.getAllByText(/Complete 1 phase input before Approve & Build/i).length).toBeGreaterThan(0);
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

    expect(screen.getByRole("heading", { name: "Decide the approach" })).toBeInTheDocument();
    expect(
      screen.getAllByText("Governed agent-assist layer on current systems").length,
    ).toBeGreaterThan(0);
    expect(screen.queryByText("Phased platform + operating-model shift")).not.toBeInTheDocument();
    expect(screen.queryByText("Optimize the current workflow")).not.toBeInTheDocument();
    expect(screen.queryByText("Large transformation program")).not.toBeInTheDocument();
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
        carriesForwardContent={[]}
        evidenceNeedPackets={evidenceNeedPackets}
        move={makeMove()}
        phaseNum={3}
        phaseTallies={[...phaseTallies]}
      />,
    );

    fireEvent.click(screen.getByRole("tab", { name: /Approve & Build/i }));

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

  it("surfaces real carries-forward content extracted from this phase's generated deliverable", () => {
    render(
      <MovesPhaseStandaloneClient
        carriesForwardContent={[
          {
            key: "workstreams",
            heading: "Workstream Breakdown",
            snippet: "Data platform migration led by J. Alvarez; clinical workflow cutover led by R. Chen.",
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
    expect(screen.getByText(/Data platform migration led by J. Alvarez/i)).toBeInTheDocument();
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

  it("renders the compact phase command center for P2-P5 instead of the legacy prepare wall", () => {
    render(
      <MovesPhaseStandaloneClient
        carriesForwardContent={[]}
        evidenceNeedPackets={[]}
        move={makeMove()}
        phaseNum={3}
        phaseTallies={[...phaseTallies]}
      />,
    );

    expect(screen.getByRole("heading", { name: "Choose the Approach" })).toBeInTheDocument();
    expect(screen.getByText("Files & Evidence")).toBeInTheDocument();
    expect(screen.getByText("Step 1 of 5")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Use the tabs to finish this phase" })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: /Prepare/i })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: /Compare Options/i })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: /Approve & Build/i })).toBeInTheDocument();
    expect(screen.getByText("Recommended sessions")).toBeInTheDocument();
    expect(screen.getByText("Current blockers")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Upload files" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Review gate" })).not.toBeInTheDocument();
    expect(screen.getByText("Solution Options Canvas")).toBeInTheDocument();
    expect(screen.queryByText("How to complete this phase")).not.toBeInTheDocument();
    expect(screen.queryByText("Sessions and templates for this phase")).not.toBeInTheDocument();
    expect(screen.queryByText(/Phase Sessions/i)).not.toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Templates & sessions" })).not.toBeInTheDocument();
    expect(screen.queryByText(/Phase complete/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/To advance to P4/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/View dossier/i)).not.toBeInTheDocument();
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

    expect(screen.queryByText(/Phase Sessions · P3 Design/i)).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Generate Session Pack/i })).not.toBeInTheDocument();
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

    fireEvent.click(screen.getByRole("button", { name: /Phase Intelligence/i }));
    expect(screen.getByRole("heading", { name: "Phase Intelligence" })).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText("Governed agent workspace")).toBeInTheDocument();
    });
    expect(screen.getByText(/labeled planning range/)).toBeInTheDocument();
    expect(screen.getByText("1 hard gate open; 1 required evidence gap.")).toBeInTheDocument();
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
            whyItMatters: "The design lane needs real architecture constraints.",
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

    expect(screen.getByRole("heading", { name: "Decide the approach" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Upload evidence for approach decision" })).toBeInTheDocument();

    fireEvent.click(screen.getByRole("tab", { name: /Approve & Build/i }));

    expect(screen.getByRole("heading", { name: "Gate approval" })).toBeInTheDocument();
    expect(
      screen.getByText(/1 required next-phase prep item/i),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/These items are carried forward as next-phase preparation/i),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Approve & Build P3 Choose the Approach/i }),
    ).toBeEnabled();
  });

  it("Files & Evidence renders a real generated deliverable as an actual downloadable link", async () => {
    (global.fetch as jest.Mock).mockImplementation(async (input: RequestInfo | URL) => {
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
                title: "CANARY — SkyHarbor Recovery Command IROPS Target Architecture",
                phase: 3,
                fileFormat: "html",
                fileName: null,
                version: 1,
                status: "board_ready",
                lifecycleState: "current",
                qualityScore: 100,
                createdAt: "2026-07-11T23:26:23.000Z",
                downloadUrl: "/api/v1/artifacts/d74ed94a-a600-46ee-ad5d-a505556c4cac",
              },
            ],
          }),
        } as Response;
      }
      return { ok: true, status: 200, json: async () => ({ ok: true }) } as Response;
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

    fireEvent.click(screen.getByRole("button", { name: /Files & Evidence/i }));

    await waitFor(() => {
      expect(
        screen.getByText(/CANARY — SkyHarbor Recovery Command IROPS Target Architecture/i),
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
    expect(screen.getByRole("heading", { name: "Files & Evidence" })).toBeInTheDocument();
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

    fireEvent.click(screen.getByRole("button", { name: /CANARY - SkyHarbor/i }));
    fireEvent.click(screen.getByRole("tab", { name: /Approve & Build/i }));
    expect(screen.getByRole("button", { name: /Review governed build/i })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Approve & advance/i })).not.toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Approve & Build P3 Choose the Approach/i }),
    ).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /Approve & Build P3 Choose the Approach/i }));
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
        carriesForwardContent={[]}
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
        carriesForwardContent={[]}
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
