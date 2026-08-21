import fs from "node:fs";
import path from "node:path";

const REPO_ROOT = process.cwd();

const CLIENT_ARCHITECTURE_PAGES = [
  "src/components/home/v4/ArchitecturePage.tsx",
  "src/components/home/v4/DataFlowPage.tsx",
];

const FORBIDDEN_IMPORT_PATTERNS = [
  /@\/lib\/visual-system\/projections\//,
  /\.\.\/\.\.\/\.\.\/lib\/visual-system\/projections\//,
  /@\/lib\/visual-system\/semantics\/topology-fitness/,
  /semantics\/topology-fitness/,
  /\bbuildBusinessCapabilityLandscapeView\b/,
  /\bbuildCapabilityToTechnologyView\b/,
  /\bbuildCurrentStateFlow(View)?\b/,
  /\bassessTopologyFitness\b/,
];

describe("Home v4 architecture boundary", () => {
  it.each(CLIENT_ARCHITECTURE_PAGES)(
    "%s obtains architecture views through the shared resolver",
    (file) => {
      const source = fs.readFileSync(path.join(REPO_ROOT, file), "utf8");

      expect(source).toContain("resolveArchitectureView");
      for (const pattern of FORBIDDEN_IMPORT_PATTERNS) {
        expect(source).not.toMatch(pattern);
      }
    },
  );
});
