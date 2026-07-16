import fs from "node:fs";
import path from "node:path";

const repoRoot = process.cwd();

function read(relativePath: string): string {
  return fs.readFileSync(path.join(repoRoot, relativePath), "utf8");
}

describe("Moves detail route sunset", () => {
  it("keeps the legacy detail route as a current-phase redirect only", () => {
    const source = read("src/app/(maestro)/strategic-moves/[moveId]/page.tsx");

    expect(source).not.toContain("StrategicMoveDetailView");
    expect(source).not.toContain("StrategicMoveDetailClient");
    expect(source).not.toContain("AppShell");
    expect(source).toContain("redirect(`/strategic-moves/${move.id}/phase/${move.currentPhase ?? 0}`)");
  });

  it("sends portfolio links straight to phase workspace routes", () => {
    const homeClient = read("src/components/strategic-moves/StrategicMovesHomeClient.tsx");
    const table = read("src/components/strategic-moves/MoveListTable.tsx");
    const combined = `${homeClient}\n${table}`;

    expect(combined).toContain("/phase/${move.currentPhase ?? 0}");
    expect(combined).not.toContain("href={`/strategic-moves/${move.id}`}");
  });

  it("does not embed a second product nav inside the phase workspace", () => {
    const source = read("src/components/strategic-moves/MovesPhaseStandaloneClient.tsx");

    expect(source).not.toContain("mxw-chrome");
    expect(source).not.toContain("mxw-topnav");
    expect(source).not.toContain("tenantInitials");
  });

  it("does not keep the retired P0 originate form mounted in the phase workspace", () => {
    const source = read("src/components/strategic-moves/MovesPhaseStandaloneClient.tsx");
    const route = read("src/app/(maestro)/strategic-moves/[moveId]/phase/[phaseNum]/page.tsx");

    expect(source).not.toContain("function OriginateConsole");
    expect(source).not.toContain("mxw-originate");
    expect(source).not.toContain("Let aVa draft this");
    expect(source).not.toContain("Promote to P1 Charter");
    expect(route).toContain("initialSubstepKey");
    expect(route).toContain('resolvedSearchParams.focus === "gate"');
  });
});
