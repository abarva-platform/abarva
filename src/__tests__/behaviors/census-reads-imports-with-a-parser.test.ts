import { readFileSync } from "node:fs";

import { runtimeModuleSpecifiers } from "../../../scripts/quality/test-ci-coverage-census.mjs";

/**
 * The census decides which directory gets wired next. To do that it has to
 * know which modules a test file actually loads, and it read that with three
 * regular expressions over source text — grown one branch at a time, each
 * added after somebody noticed a form the previous branches missed.
 *
 * T-075 asked for the gap to be bounded rather than enumerated. The whole
 * tree was parsed with TypeScript's own scanner and the two readers compared
 * over 2,321 test files and 5,705 runtime edges. The result inverted the
 * worry: the regexes missed **zero** runtime edges, and instead credited
 * **608** specifiers that are not edges at all — because a quoted module path
 * inside an assertion is indistinguishable, to a regex, from one inside an
 * import.
 *
 * Over-crediting is the dangerous direction for a ranking: a directory looks
 * covered when nothing imports the module.
 *
 * These cases run the reader. Each names one form and says whether it loads
 * anything, because "does this load the module" is the only question the
 * census is asking.
 */

const FILE = "src/__tests__/example.test.ts";

function read(source: string): string[] {
  return runtimeModuleSpecifiers(source, FILE);
}

describe("the census counts modules a test actually loads", () => {
  describe("forms that load the module", () => {
    it.each([
      ["a named import", `import { a } from "@/lib/loaded";`],
      ["a default import", `import a from "@/lib/loaded";`],
      ["a namespace import", `import * as a from "@/lib/loaded";`],
      ["a bare side-effect import", `import "@/lib/loaded";`],
      ["a re-export", `export { a } from "@/lib/loaded";`],
      ["a dynamic import", `const a = await import("@/lib/loaded");`],
      ["a require call", `const a = require("@/lib/loaded");`],
      [
        "a brace list with one value specifier among the types",
        `import { type A, b } from "@/lib/loaded";`,
      ],
    ])("counts %s", (_label, source) => {
      expect(read(source)).toContain("@/lib/loaded");
    });

    it("counts an import that does not begin its line", () => {
      // The item named "any import statement not at the start of its line"
      // as an unread form. Measured, that was half right: the side-effect
      // regex was anchored as /^[ \t]*import/, so an INDENTED statement was
      // read fine and only one sharing a line with something else was
      // missed. Both are pinned here; the parser does not care where a
      // statement sits.
      expect(read(`  \timport "@/lib/loaded";`)).toContain("@/lib/loaded");
      expect(read(`;import "@/lib/loaded";`)).toContain("@/lib/loaded");
    });
  });

  describe("forms that load nothing", () => {
    it.each([
      ["a type-only import", `import type { A } from "@/lib/erased";`],
      ["a type-only re-export", `export type { A } from "@/lib/erased";`],
      [
        "a brace list whose every specifier is a type",
        `import { type A, type B } from "@/lib/erased";`,
      ],
      [
        "typeof import() in a type position",
        `type S = Parameters<typeof import("@/lib/erased").send>[0];`,
      ],
      ["a jest.mock target", `jest.mock("@/lib/erased");`],
      ["a jest.mock target with a factory", `jest.mock("@/lib/erased", () => ({}));`],
    ])("does not count %s", (_label, source) => {
      expect(read(source)).not.toContain("@/lib/erased");
    });

    it("does not count a module path quoted inside an assertion", () => {
      // The 608. This exact line pattern is what the regexes read as an
      // import — from an assertion saying the module must NOT be imported.
      const source = [
        `import { readFileSync } from "node:fs";`,
        `it("stays off it", () => {`,
        `  expect(pageSource).not.toContain('from "@/lib/erased"');`,
        `  expect(pageSource).toContain('from "@/lib/also-erased"');`,
        `});`,
      ].join("\n");

      const found = read(source);
      expect(found).toContain("node:fs");
      expect(found).not.toContain("@/lib/erased");
      expect(found).not.toContain("@/lib/also-erased");
    });

    it("does not count a module path in a comment", () => {
      const source = [
        `// import { a } from "@/lib/erased";`,
        `/* export { b } from "@/lib/also-erased"; */`,
        `import { c } from "@/lib/loaded";`,
      ].join("\n");

      const found = read(source);
      expect(found).toEqual(["@/lib/loaded"]);
    });
  });

  describe("the reader is not vacuous", () => {
    it("returns nothing for a file with no imports", () => {
      expect(read(`const a = 1;`)).toEqual([]);
    });

    it("returns every distinct module in a file with several", () => {
      // A reader that returned only the first, or stopped at the first
      // non-import statement, would satisfy most cases above.
      const source = [
        `import { a } from "@/lib/one";`,
        `const x = 1;`,
        `import "@/lib/two";`,
        `const y = require("@/lib/three");`,
        `export { z } from "@/lib/four";`,
      ].join("\n");

      expect(read(source).sort()).toEqual([
        "@/lib/four",
        "@/lib/one",
        "@/lib/three",
        "@/lib/two",
      ]);
    });

    it("reads a real test file in this repository", () => {
      // Fixtures are strings this file wrote, so they prove the reader
      // handles what was imagined. One real file keeps it honest.
      const real = runtimeModuleSpecifiers(readFileSync(__filename, "utf8"), __filename);
      expect(real).toContain("../../../scripts/quality/test-ci-coverage-census.mjs");
      // And the quoted module paths in the fixtures above must not appear.
      expect(real).not.toContain("@/lib/loaded");
      expect(real).not.toContain("@/lib/erased");
    });
  });
});
