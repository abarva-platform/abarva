import fs from "node:fs";
import path from "node:path";

const repoRoot = path.resolve(__dirname, "../../..");
const sourceRoot = path.join(repoRoot, "src");
const retiredRoute = path.join(sourceRoot, "app/api/chat/route.ts");

function sourceFiles(root: string): string[] {
  return fs.readdirSync(root, { withFileTypes: true }).flatMap((entry) => {
    const fullPath = path.join(root, entry.name);
    if (entry.isDirectory()) {
      return sourceFiles(fullPath);
    }
    return /\.(?:ts|tsx|js|jsx)$/.test(entry.name) ? [fullPath] : [];
  });
}

describe("legacy generic chat route retirement", () => {
  it("does not expose the duplicate /api/chat handler", () => {
    expect(fs.existsSync(retiredRoute)).toBe(false);
  });

  it("keeps mounted source clients on a governed, named chat endpoint", () => {
    const offenders = sourceFiles(sourceRoot)
      .filter((file) => !file.includes(`${path.sep}__tests__${path.sep}`))
      .filter((file) => !/\.(?:test|spec)\.[jt]sx?$/.test(file))
      .filter((file) => {
        const source = fs.readFileSync(file, "utf8");
        return /(?:fetch|axios(?:\.post)?)\s*\(\s*["']\/api\/chat["']/.test(source);
      })
      .map((file) => path.relative(repoRoot, file));

    expect(offenders).toEqual([]);
  });
});
