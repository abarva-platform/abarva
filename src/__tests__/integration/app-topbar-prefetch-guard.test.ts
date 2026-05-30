import { readFileSync } from "fs";
import { join } from "path";

const appTopBarSource = readFileSync(
  join(process.cwd(), "src/components/shell/AppTopBar.tsx"),
  "utf8",
);

describe("AppTopBar product navigation prefetch guard", () => {
  it("disables Next.js prefetch for product module links", () => {
    expect(appTopBarSource).toContain('aria-label="Product modules"');
    expect(appTopBarSource).toContain("prefetch={false}");
    expect(appTopBarSource.indexOf("prefetch={false}")).toBeGreaterThan(
      appTopBarSource.indexOf("key={item.key}"),
    );
  });
});
