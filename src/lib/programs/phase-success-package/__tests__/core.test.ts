import { getPhasePackV2 } from "@/lib/programs/phase-packs/v2";
import { getMovePhasePlaybook } from "@/lib/programs/playbook/move-phase-playbook";
import {
  buildDefaultPhaseSuccessRuntimeTruth,
  buildPhaseSuccessPackages,
} from "../core";
import type { StrategicMove } from "@/lib/programs/types.ui";

const move = {
  id: "move-123",
  name: "Meridian Member Experience AI Assist",
  tenant: {
    id: "tenant-123",
    name: "Meridian Health",
    industryCode: "healthcare",
  },
  archetype: "customer-service-ai",
  functionPackKey: "healthcare_member_services",
  currentPhase: 2,
  valueAtStake: {
    projected: { low: 2_000_000, high: 5_000_000, currency: "USD" },
    verified: null,
    assumptions: null,
  },
  gateCriteria: [
    {
      id: "GC-P2-1",
      label: "Baseline evidence accepted",
      completed: false,
      severity: "hard",
      verified: true,
    },
    {
      id: "GC-P2-2",
      label: "Sponsor reviewed findings",
      completed: true,
      severity: "hard",
      verified: true,
    },
  ],
  linkedEvidence: [
    {
      id: "ev-1",
      anchor: "Call center baseline",
      summary: "AHT and transfer-rate baseline uploaded by operations.",
      url: "/evidence/ev-1",
    },
  ],
} satisfies Pick<
  StrategicMove,
  | "id"
  | "name"
  | "tenant"
  | "archetype"
  | "functionPackKey"
  | "currentPhase"
  | "valueAtStake"
  | "gateCriteria"
  | "linkedEvidence"
>;

const lakeshoreMove = {
  ...move,
  id: "move-legal",
  name: "Lakeshore Legal Contract Intake",
  tenant: {
    id: "tenant-legal",
    name: "Lakeshore Holdings",
    industryCode: "diversified-holdco",
  },
  functionPackKey: "legal_operations",
  valueAtStake: {
    projected: { low: 600_000, high: 1_800_000, currency: "USD" },
    verified: null,
    assumptions: null,
  },
  linkedEvidence: [
    {
      id: "ev-legal-1",
      anchor: "Contract intake queue",
      summary: "Legal request aging and missing-field profile uploaded.",
      url: "/evidence/ev-legal-1",
    },
  ],
} satisfies typeof move;

function inputFor(
  phase: number,
  moveInput: typeof move = move,
  generatedAt = "2026-07-13T12:00:00.000Z",
) {
  const phasePack = getPhasePackV2(phase);
  return {
    move: moveInput,
    phase,
    phasePack,
    playbook: getMovePhasePlaybook(phase),
    runtime: buildDefaultPhaseSuccessRuntimeTruth({
      move: moveInput,
      phase,
      phasePack,
      generatedAt,
      generatedBy: "jest",
      sourceArtifacts: [
        {
          id: `${moveInput.id}-artifact-1`,
          title: `${moveInput.name} current-state evidence`,
          artifactType: "uploaded_evidence",
          status: "draft",
          createdAt: "2026-07-13T09:30:00.000Z",
          generatedAt: "2026-07-13T10:00:00.000Z",
        },
        {
          id: `${moveInput.id}-artifact-2`,
          title: `${moveInput.name} sponsor playback`,
          artifactType: "playback_notes",
          status: "approved",
          createdAt: "2026-07-13T10:30:00.000Z",
          generatedAt: null,
        },
      ],
    }),
  };
}

describe("buildPhaseSuccessPackages", () => {
  it("generates execution and next-phase readiness packages for P2", () => {
    const packages = buildPhaseSuccessPackages({
      ...inputFor(2),
    });

    expect(packages).toHaveLength(2);
    expect(packages.map((pkg) => pkg.kind)).toEqual([
      "phase_execution_package",
      "next_phase_readiness_package",
    ]);
    expect(packages[0].artifactType).toBe("p2_phase_execution_package");
    expect(packages[1].artifactType).toBe("p2_next_phase_readiness_package");
    expect(packages[0].body).toContain("Sessions To Run");
    expect(packages[0].body).toContain("Evidence Requirements");
    expect(packages[0].body).toContain("Recommended Templates");
    expect(packages[1].body).toContain("P3 Design Future State");
    expect(packages[1].body).toContain("Baseline evidence accepted");
    expect(packages[0].body).toContain("Package Status");
    expect(packages[0].metadata.sourcePhase).toBe(2);
    expect(packages[0].metadata.targetPhase).toBe(3);
    expect(packages[0].metadata.evidenceCutoffAt).toBe("2026-07-13T10:30:00.000Z");
    expect(packages[0].metadata.findingIds).toEqual([]);
    expect(packages[0].status).toBe("evidence_incomplete");
  });

  it("keeps phase packages version-safe by embedding phase in artifact type", () => {
    const p2 = buildPhaseSuccessPackages({
      ...inputFor(2),
    });
    const p3 = buildPhaseSuccessPackages({
      ...inputFor(3, { ...move, currentPhase: 3 }),
    });

    expect(p2[0].artifactType).toBe("p2_phase_execution_package");
    expect(p3[0].artifactType).toBe("p3_phase_execution_package");
    expect(p2[0].artifactType).not.toBe(p3[0].artifactType);
  });

  it("does not claim next phase is ready when hard evidence or gates are open", () => {
    const packages = buildPhaseSuccessPackages({
      ...inputFor(2),
    });
    const readiness = packages.find(
      (pkg) => pkg.kind === "next_phase_readiness_package",
    );

    expect(readiness?.metadata.blocked).toBe(true);
    expect(readiness?.body).toContain("Blocked or incomplete");
    expect(readiness?.body).toContain("Open Required Evidence");
    expect(readiness?.body).toContain("Open Gate Criteria");
    expect(readiness?.body).toContain("Assumptions");
    expect(readiness?.body).toContain("Unresolved Questions");
    expect(readiness?.body).toContain("Not Ready For Next Phase Blockers");
  });

  it("materially changes content for a different Move and phase", () => {
    const meridian = buildPhaseSuccessPackages(inputFor(2, move));
    const lakeshore = buildPhaseSuccessPackages(inputFor(2, lakeshoreMove));
    const meridianP3 = buildPhaseSuccessPackages(
      inputFor(3, { ...move, currentPhase: 3 }),
    );

    expect(meridian[0].body).toContain("Meridian Member Experience");
    expect(lakeshore[0].body).toContain("Lakeshore Legal Contract Intake");
    expect(meridian[0].body).toContain("healthcare_member_services");
    expect(lakeshore[0].body).toContain("legal_operations");
    expect(meridian[0].body).not.toBe(lakeshore[0].body);
    expect(meridian[0].body).not.toBe(meridianP3[0].body);
    expect(meridianP3[1].body).toContain("P4 Roadmap & Business Case");
  });
});
