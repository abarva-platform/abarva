import { moveDetailParticipantRows } from "../StrategicMoveDetailView";
import type { StrategicMove } from "@/lib/programs/types.ui";

function makeMove(overrides: Partial<StrategicMove> = {}): StrategicMove {
  const base: StrategicMove = {
    id: "move-1",
    displayCode: "MOVE-1",
    name: "Kyriba Treasury Controls Proof",
    tenant: {
      id: "tenant-industrial",
      name: "Industrial Demo",
      industryCode: "manufacturing",
    },
    charter: null,
    functionPackKey: null,
    archetype: "PLATFORM MODERNIZATION",
    currentPhase: 0,
    phaseLabel: "P0 Originate",
    status: {
      key: "awaiting_decision",
      text: "Awaiting decision",
      description: "Origination brief awaiting sponsor approval",
    },
    statusColor: "amber",
    sponsor: {
      id: "person-stale",
      name: "Dr. Anita Krishnamurthy",
      role: "Chief Digital and Information Officer",
    },
    participants: [
      {
        personId: "person-stale",
        name: "Dr. Anita Krishnamurthy",
        role: "Sponsor",
      },
      {
        personId: "person-program-lead",
        name: "User",
        role: "Program Lead",
      },
    ],
    valueAtStake: { projected: null, verified: null, assumptions: null },
    deliverables: [],
    gateCriteria: [],
    recentActivity: [],
    linkedEvidence: [],
    mapLabel: "TREASURY",
    createdAt: "2026-07-03T00:00:00.000Z",
    updatedAt: "2026-07-03T00:00:00.000Z",
  };
  return { ...base, ...overrides };
}

describe("moveDetailParticipantRows", () => {
  it("suppresses stale sponsor participants when the P0 scaffold has a captured sponsor candidate", () => {
    const rows = moveDetailParticipantRows(
      makeMove({
        charter: {
          scaffold: {
            sponsor_candidate:
              "CFO and Treasurer (co-primary); CIO (supporting) — named by user",
          },
        },
      }),
    );

    expect(rows).toEqual([
      {
        personId: "person-program-lead",
        name: "User",
        role: "Program Lead",
      },
    ]);
  });

  it("keeps sponsor participants for legacy Moves without captured scaffold sponsor text", () => {
    const rows = moveDetailParticipantRows(makeMove());

    expect(rows.map((row) => row.name)).toContain("Dr. Anita Krishnamurthy");
  });
});
