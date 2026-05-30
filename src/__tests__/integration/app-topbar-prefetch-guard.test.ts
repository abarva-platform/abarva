import { readFileSync } from "fs";
import { join } from "path";

const appTopBarSource = readFileSync(
  join(process.cwd(), "src/components/shell/AppTopBar.tsx"),
  "utf8",
);

describe("AppTopBar product navigation document navigation guard", () => {
  it("uses document anchors for product module links", () => {
    expect(appTopBarSource).toContain('aria-label="Product modules"');
    expect(appTopBarSource).toContain("<a");
    expect(appTopBarSource).toContain("href={item.href}");
    expect(appTopBarSource.indexOf("<a")).toBeGreaterThan(
      appTopBarSource.indexOf("navItems.map"),
    );
    expect(appTopBarSource).not.toContain("prefetch={false}");
  });
});
