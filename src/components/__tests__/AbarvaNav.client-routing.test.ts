import { readFileSync } from "node:fs";
import { join } from "node:path";

describe("AbarvaNav client routing", () => {
  const source = readFileSync(
    join(process.cwd(), "src/components/AbarvaNav.tsx"),
    "utf8",
  );

  it("uses Next Link for product nav items instead of document reload anchors", () => {
    expect(source).toContain("const navLink = ");
    expect(source).toContain("<Link href={href} prefetch");
    expect(source).not.toContain("<a href={href}");
  });
});
