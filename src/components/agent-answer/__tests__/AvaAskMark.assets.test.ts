import fs from "node:fs";
import path from "node:path";

describe("AvaAskMark canonical assets", () => {
  it("keeps the default light-surface wordmark contrast-safe", () => {
    const darkWordmark = fs.readFileSync(
      path.join(
        process.cwd(),
        "public/brand/ava/ava-wordmark-2tone-dark.svg",
      ),
      "utf8",
    );
    const lightWordmark = fs.readFileSync(
      path.join(
        process.cwd(),
        "public/brand/ava/ava-wordmark-2tone-light.svg",
      ),
      "utf8",
    );

    expect(darkWordmark).toContain('fill="#0b1626"');
    expect(darkWordmark).not.toContain('fill="#ffffff"');
    expect(lightWordmark).toContain('fill="#ffffff"');
  });
});
