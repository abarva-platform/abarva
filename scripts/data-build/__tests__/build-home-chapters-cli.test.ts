import { getHomeChapterCliArg } from "../build-home-chapters";

describe("build-home-chapters CLI parsing", () => {
  it("uses the last repeated flag so workflow-provided output paths override package defaults", () => {
    const argv = [
      "node",
      "scripts/data-build/build-home-chapters.ts",
      "--out-dir",
      "/tmp/package-default",
      "--measure-quality",
      "--tenant",
      "tenant-a",
      "--out-dir",
      "/tmp/workflow-artifact",
    ];

    expect(getHomeChapterCliArg(argv, "--out-dir")).toBe("/tmp/workflow-artifact");
    expect(getHomeChapterCliArg(argv, "--tenant")).toBe("tenant-a");
  });
});
