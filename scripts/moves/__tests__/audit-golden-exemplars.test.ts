import { mkdtemp, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";

import { buildExemplarCoverageReport } from "../audit-golden-exemplars";

describe("audit-golden-exemplars", () => {
  it("reports missing coverage when no manifest maps the existing HTML files", async () => {
    const dir = await mkdtemp(join(tmpdir(), "golden-exemplars-"));
    await writeFile(join(dir, "Target-State-Architecture.html"), "<html></html>");

    const report = await buildExemplarCoverageReport({
      dir,
      manifest: join(dir, "golden-exemplar-manifest.json"),
    });

    expect(report.readyForJudge).toBe(false);
    expect(report.requiredCount).toBeGreaterThan(10);
    expect(report.completeCount).toBe(0);
    expect(report.missingCount).toBe(report.requiredCount);
    expect(report.unmappedHtmlFiles).toEqual([
      join(dir, "Target-State-Architecture.html"),
    ]);
  });

  it("requires approved status, owner/date, and human rationale before marking an exemplar complete", async () => {
    const dir = await mkdtemp(join(tmpdir(), "golden-exemplars-"));
    await writeFile(join(dir, "charter.html"), "<html></html>");
    await writeFile(
      join(dir, "charter-rationale.md"),
      Array.from({ length: 55 }, (_, index) => `word${index}`).join(" "),
    );
    await writeFile(
      join(dir, "golden-exemplar-manifest.json"),
      JSON.stringify({
        exemplars: [
          {
            module: "moves",
            deliverableType: "charter",
            artifactPath: "charter.html",
            rationalePath: "charter-rationale.md",
            status: "approved",
            reviewedBy: "artifact-quality-owner",
            reviewedAt: "2026-09-24",
          },
        ],
      }),
    );

    const report = await buildExemplarCoverageReport({
      dir,
      manifest: join(dir, "golden-exemplar-manifest.json"),
    });
    const charter = report.entries.find((entry) => entry.key === "moves:charter");

    expect(charter?.state).toBe("complete");
    expect(charter?.issues).toEqual([]);
    expect(report.completeCount).toBe(1);
    expect(report.readyForJudge).toBe(false);
  });
});
