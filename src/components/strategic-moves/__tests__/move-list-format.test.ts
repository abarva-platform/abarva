import {
  chipCounts,
  filterByChip,
  formatValueAtStake,
  isArchived,
  moveLifecyclePct,
  relativeTime,
  searchMoves,
  summaryStats,
} from "../move-list-format";
import type { StrategicMove } from "@/lib/programs/types.ui";

function move(over: Partial<StrategicMove> & { id: string }): StrategicMove {
  return {
    id: over.id,
    displayCode: over.displayCode ?? `CODE-${over.id}`,
    name: over.name ?? `Move ${over.id}`,
    tenant: { id: "t", name: "SkyHarbor Air", industryCode: "air" },
    charter: null,
    functionPackKey: null,
    archetype: "operational_optimization",
    currentPhase: over.currentPhase ?? 1,
    phaseLabel: over.phaseLabel ?? "P1 Charter",
    status: over.status ?? {
      key: "on_track",
      text: "On track",
      description: "",
    },
    statusColor: over.statusColor ?? "green",
    sponsor: over.sponsor ?? null,
    participants: [],
    valueAtStake: over.valueAtStake ?? {
      projected: { low: 0, high: 4_000_000 },
      verified: { amount: 0, status: "pending" },
    },
    mapLabel: "M",
    createdAt: "2026-06-01T00:00:00.000Z",
    updatedAt: over.updatedAt ?? "2026-06-11T00:00:00.000Z",
    lifecycleState: over.lifecycleState,
    archivedAt: over.archivedAt,
    archiveReason: over.archiveReason,
  } as unknown as StrategicMove;
}

describe("move-list-format", () => {
  const moves: StrategicMove[] = [
    move({
      id: "1",
      status: { key: "gate_blocked", text: "Needs approval", description: "" },
      statusColor: "red",
    }),
    move({
      id: "2",
      status: {
        key: "awaiting_decision",
        text: "Awaiting decision",
        description: "",
      },
      statusColor: "amber",
    }),
    move({
      id: "3",
      status: { key: "on_track", text: "On track", description: "" },
      statusColor: "green",
    }),
    move({
      id: "4",
      status: { key: "on_track", text: "On track", description: "" },
      statusColor: "green",
    }),
    move({
      id: "5",
      lifecycleState: "archived",
      archivedAt: "2026-06-10T00:00:00.000Z",
      archiveReason: "duplicate",
    }),
  ];

  it("isArchived detects lifecycle + archivedAt", () => {
    expect(isArchived(moves[4])).toBe(true);
    expect(isArchived(moves[0])).toBe(false);
  });

  it("filterByChip: active chips exclude archived; archived chip shows only archived", () => {
    expect(filterByChip(moves, "all").map((m) => m.id)).toEqual([
      "1",
      "2",
      "3",
      "4",
    ]);
    expect(filterByChip(moves, "attention").map((m) => m.id)).toEqual(["1"]);
    expect(filterByChip(moves, "awaiting").map((m) => m.id)).toEqual(["2"]);
    expect(filterByChip(moves, "on_track").map((m) => m.id)).toEqual([
      "3",
      "4",
    ]);
    expect(filterByChip(moves, "archived").map((m) => m.id)).toEqual(["5"]);
  });

  it("chipCounts mirrors the filters", () => {
    expect(chipCounts(moves)).toEqual({
      all: 4,
      attention: 1,
      awaiting: 1,
      on_track: 2,
      archived: 1,
    });
  });

  it("summaryStats derives the four cards from the active subset", () => {
    const s = summaryStats(moves);
    expect(s.active).toBe(4);
    expect(s.needAttention).toBe(1); // statusColor red
    expect(s.onTrack).toBe(2);
    expect(s.valueAtStake).toBe(16_000_000); // 4 active × $4M
  });

  it("searchMoves matches name and code, case-insensitive", () => {
    expect(searchMoves(moves, "move 3").map((m) => m.id)).toEqual(["3"]);
    expect(searchMoves(moves, "CODE-2").map((m) => m.id)).toEqual(["2"]);
    expect(searchMoves(moves, "").length).toBe(moves.length);
  });

  it("formatValueAtStake", () => {
    expect(formatValueAtStake(4_000_000)).toBe("$4M");
    expect(formatValueAtStake(1_500_000_000)).toBe("$1.5B");
    expect(formatValueAtStake(0)).toBe("$—");
  });

  it("relativeTime buckets", () => {
    const now = Date.parse("2026-06-11T12:00:00.000Z");
    expect(relativeTime("2026-06-11T02:00:00.000Z", now)).toBe("Today");
    expect(relativeTime("2026-06-10T12:00:00.000Z", now)).toBe("Yesterday");
    expect(relativeTime("2026-06-08T12:00:00.000Z", now)).toBe("3 days ago");
    expect(relativeTime(null, now)).toBe("—");
  });

  it("moveLifecyclePct: 0/20/40/…/100 by current phase, clamped", () => {
    expect(moveLifecyclePct(move({ id: "a", currentPhase: 0 }))).toBe(0);
    expect(moveLifecyclePct(move({ id: "b", currentPhase: 1 }))).toBe(20);
    expect(moveLifecyclePct(move({ id: "c", currentPhase: 2 }))).toBe(40);
    expect(moveLifecyclePct(move({ id: "d", currentPhase: 5 }))).toBe(100);
    // clamps out-of-range values
    expect(moveLifecyclePct(move({ id: "e", currentPhase: 7 }))).toBe(100);
    expect(moveLifecyclePct(move({ id: "f", currentPhase: -1 }))).toBe(0);
  });
});
