import fs from "node:fs";
import path from "node:path";

describe("Atlas client timeout contract", () => {
  it("allows live model turns enough time before showing a timeout message", () => {
    const towerSource = fs.readFileSync(
      path.join(
        process.cwd(),
        "src/components/tower/command-center/TowerCommandCenterAvaShell.tsx",
      ),
      "utf8",
    );
    const railSource = fs.readFileSync(
      path.join(process.cwd(), "src/components/atlas/AtlasRail.tsx"),
      "utf8",
    );

    expect(towerSource).toContain("90_000");
    expect(railSource).toContain("45_000");
    expect(towerSource).not.toContain("18_000");
    expect(railSource).not.toContain("18_000");
    expect(towerSource).not.toContain("timed out before");
    expect(railSource).not.toContain("timed out before");
    expect(towerSource).toContain("aVa did not finish the Tower answer within the response window");
    expect(railSource).toContain("I could not complete the live aVa answer");
  });
});
