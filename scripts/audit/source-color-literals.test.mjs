import assert from "node:assert/strict";
import { execFileSync, spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { test } from "node:test";
import {
  compareColorLiterals,
  isSourceColorFile,
  scanColorLiterals,
} from "./source-color-literals.mjs";

const component = "src/components/source/Example.tsx";
const stylesheet = "src/components/source/new-workspace/workspace.css";
const colors = (file, source) =>
  scanColorLiterals(file, source).map((row) => row.color);

test("the architecture PR job runs the tests and committed-tree guard", () => {
  const root = fileURLToPath(new URL("../../", import.meta.url));
  const workflow = fs.readFileSync(
    path.join(root, ".github/workflows/architecture-boundary.yml"),
    "utf8",
  );
  const pkg = JSON.parse(
    fs.readFileSync(path.join(root, "package.json"), "utf8"),
  );
  assert.match(workflow, /fetch-depth: 0/);
  assert.match(workflow, /run: npm run test:source-color-literals/);
  assert.match(
    workflow,
    /run: npm run audit:source-color-literals -- --base=origin\/\$\{BASE_REF\} --head=HEAD/,
  );
  assert.equal(
    pkg.scripts["audit:source-color-literals"],
    "node scripts/audit/source-color-literals.mjs",
  );
  assert.equal(
    pkg.scripts["test:source-color-literals"],
    "node --test scripts/audit/source-color-literals.test.mjs",
  );
});

test("scans CSS declarations, not selectors, comments, strings or asset URLs", () => {
  assert.deepEqual(
    colors(
      stylesheet,
      `
    /* color: #bad; */
    #abc { color: #AABBCC; border: 1px solid red;
      background: linear-gradient(white, rgba(0, 0, 0, .2));
      content: "blue #def"; background-image: url("/icon.svg#abc"); }
  `,
    ),
    ["#aabbcc", "red", "white", "rgba(0,0,0,.2)"],
  );
});

test("scans inline styles, shorthand, SVG paint, palettes and styled JSX", () => {
  assert.deepEqual(
    colors(
      component,
      `
    const palette = { ink: "#abc", warning: "gold" };
    export const View = () => <>
      <svg fill="red" stroke="rgb(1 2 3 / .5)" />
      <div style={{ border: "1px solid white", boxShadow: "0 0 2px #0008" }} />
      <style jsx>{\`.a { color: hsl(20 30% 40%); }\`}</style>
    </>;
  `,
    ),
    [
      "#abc",
      "gold",
      "red",
      "rgb(1 2 3/.5)",
      "white",
      "#0008",
      "hsl(20 30% 40%)",
    ],
  );
});

test("finds Tailwind arbitrary colors without banning semantic utility classes", () => {
  assert.deepEqual(
    colors(
      component,
      `
    const cls = "text-[#abc] bg-[rgb(1_2_3)] border-white hover:text-red-500";
  `,
    ),
    ["#abc", "rgb(1 2 3)"],
  );
});

test("finds literals in template spans and var fallbacks", () => {
  assert.deepEqual(
    colors(
      component,
      `
    const border = \`1px solid \${active ? "#abc" : INK}\`;
    const background = \`linear-gradient(\${INK}, #def)\`;
    const ink = "var(--source-ink, blue)";
  `,
    ),
    ["#abc", "#def", "blue"],
  );
});

test("does not treat adaptive colors, identifiers, copy or navigation as colors", () => {
  assert.deepEqual(
    colors(
      component,
      `
    // color: "#abc"
    const copy = "Review the red flags";
    const node = document.querySelector("#abc");
    const asset = "/icon.svg#def";
    const ref = "var(--source-ink)";
    export const View = () => <a href="#abc" id="abc" title="red">red
      <div style={{ color: "currentColor", background: "transparent" }} />
    </a>;
  `,
    ),
    [],
  );
});

test("recognises modern CSS color functions and nested color-mix literals", () => {
  assert.deepEqual(
    colors(
      stylesheet,
      `
    .a { color: oklch(70% .2 120); background: color(display-p3 1 0 0);
      outline-color: color-mix(in srgb, var(--ink), #abc 20%); }
  `,
    ),
    ["oklch(70% .2 120)", "color(display-p3 1 0 0)", "#abc"],
  );
});

test("styled JSX scans declarations, not selectors, including attribute selectors", () => {
  assert.deepEqual(
    colors(
      component,
      "const View = () => <style jsx>{`.a[data-x] { color: #abc; background: red; } #def {color:var(--ink)}`}</style>;",
    ),
    ["#abc", "red"],
  );
});

test("brackets inside asset URLs cannot hide surrounding paint", () => {
  assert.deepEqual(
    colors(
      component,
      `const s = { backgroundImage: 'url("/icons/[logo].svg"), linear-gradient(#abc, #def)' };`,
    ),
    ["#abc", "#def"],
  );
});

test("Tailwind decoding finds shadow, gradient and fallback colors", () => {
  assert.deepEqual(
    colors(
      component,
      'const cls = "shadow-[0_0_2px_#abc] bg-[var(--ink,_#def)] bg-[linear-gradient(white,_black)] bg-[url(/logo_name.svg)]";',
    ),
    ["#abc", "#def", "white", "black"],
  );
});

test("type labels and CSS animation names cannot grant paint allowances", () => {
  assert.deepEqual(colors(component, 'type Status = "red";'), []);
  assert.deepEqual(colors(stylesheet, ".a { animation-name: red; }"), []);
  assert.equal(
    compareColorLiterals(
      new Map([[component, 'type Status = "red";']]),
      new Map([[component, 'const ink = "red";']]),
    ).violations.length,
    1,
  );
});

test("local custom properties and arbitrary paint properties still contain raw colors", () => {
  assert.deepEqual(colors(stylesheet, ".a { --ink: white; }"), ["white"]);
  assert.deepEqual(
    colors(component, 'const cls = "[color:#abc] [--ink:white]";'),
    ["#abc", "white"],
  );
});

test("token-derived functions and interpolation are allowed, raw fallbacks are not", () => {
  assert.deepEqual(
    colors(
      component,
      'const ink = "rgb(from var(--source-ink) r g b / .5)"; const x = `rgb(${r} ${g} ${b})`;',
    ),
    [],
  );
  assert.deepEqual(
    colors(
      component,
      'const ink = "rgb(from var(--source-ink, #abc) r g b / .5)";',
    ),
    ["#abc"],
  );
});

test("JSX expression wrappers preserve navigation and copy exclusions", () => {
  assert.deepEqual(
    colors(
      component,
      'const View = () => <a href={"#abc"} title={"red"} data-tone={"blue"} aria-label={active ? "gold" : "red"} />;',
    ),
    [],
  );
});

test("named colors in additional paint shorthands and light-dark are found", () => {
  assert.deepEqual(
    colors(
      component,
      'const s = { textDecoration: "underline red", columnRule: "1px solid blue", "box-shadow": "0 0 2px white" }; const ink = "light-dark(white, black)";',
    ),
    ["red", "blue", "white", "white", "black"],
  );
});

test("CSS comments and whitespace do not consume a fresh literal allowance", () => {
  const before = new Map([[component, 'const ink = "rgb(1 2 3)";']]);
  const after = new Map([[component, 'const ink = "rgb(1 /* note */ 2 3)";']]);
  assert.deepEqual(compareColorLiterals(before, after).violations, []);
});

test("line locations point at the real declaration and JSX expression", () => {
  assert.equal(
    scanColorLiterals(stylesheet, ".a {\n color: #abc;\n}")[0].line,
    2,
  );
  assert.equal(
    scanColorLiterals(component, "\nconst ink = '#abc';")[0].line,
    2,
  );
});

test("malformed CSS and TypeScript fail rather than silently disappear", () => {
  assert.throws(
    () => scanColorLiterals(stylesheet, ".a { color: #abc"),
    /parse/i,
  );
  assert.throws(() => scanColorLiterals(component, "const ink = ;"), /parse/i);
});

test("Source scope includes new files, excludes tests, and has exact token authorities", () => {
  for (const file of [
    component,
    stylesheet,
    "src/app/(maestro)/source/page.tsx",
    "src/lib/source/palette.ts",
  ]) {
    assert.equal(isSourceColorFile(file), true, file);
  }
  for (const file of [
    "src/components/source/__tests__/Example.test.tsx",
    "src/components/source/Example.spec.tsx",
    "src/components/source/canvas/canvas-tokens.ts",
    "src/components/source/portfolio/portfolio-tokens.ts",
    "src/components/home/Example.tsx",
    "docs/design/Source.html",
  ])
    assert.equal(isSourceColorFile(file), false, file);
  assert.equal(isSourceColorFile("src/components/source/new-tokens.ts"), true);
});

test("unchanged debt, formatting, removals and token replacement pass", () => {
  const before = new Map([
    [component, 'const ink = "#ABC"; const wash = "rgba(0, 0, 0, .2)";'],
  ]);
  for (const after of [
    'const ink = "#abc"; const wash = "rgba(0,0,0,.2)";',
    'const ink = INK; const wash = "rgba(0,0,0,.2)";',
    "const ink = INK; const wash = WASH;",
  ])
    assert.deepEqual(
      compareColorLiterals(before, new Map([[component, after]])).violations,
      [],
    );
});

test("new color fails even when the global count decreases", () => {
  const result = compareColorLiterals(
    new Map([[component, 'const p = ["#abc", "#abc", "#def"];']]),
    new Map([[component, 'const p = ["#123"];']]),
  );
  assert.equal(result.violations.length, 1);
  assert.equal(result.violations[0].color, "#123");
});

test("duplicating an existing color fails; deleting it elsewhere cannot pay for it", () => {
  const result = compareColorLiterals(
    new Map([
      [component, 'const ink = "#abc";'],
      [stylesheet, ".a {color:#abc}"],
    ]),
    new Map([[component, 'const p = ["#abc", "#abc"];']]),
  );
  assert.equal(result.violations.length, 1);
  assert.equal(result.violations[0].file, component);
});

test("new files and moving debt to a different file cannot inherit an allowance", () => {
  const result = compareColorLiterals(
    new Map([[component, 'const ink = "#abc";']]),
    new Map([["src/components/source/New.tsx", 'const ink = "#abc";']]),
  );
  assert.equal(result.violations.length, 1);
});

test("CLI checks committed refs plus local and untracked files, and fails on invalid refs", () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "source-color-ratchet-"));
  const script = fileURLToPath(
    new URL("./source-color-literals.mjs", import.meta.url),
  );
  const git = (...args) =>
    execFileSync("git", args, { cwd: root, stdio: "pipe" });
  const write = (file, source) => {
    fs.mkdirSync(path.dirname(path.join(root, file)), { recursive: true });
    fs.writeFileSync(path.join(root, file), source);
  };
  const run = (...args) =>
    spawnSync(process.execPath, [script, "--base=main", ...args], {
      cwd: root,
      encoding: "utf8",
    });
  try {
    git("init", "-b", "main");
    git("config", "user.email", "test@example.invalid");
    git("config", "user.name", "Test");
    write(component, 'const ink = "#abc";');
    git("add", ".");
    git("commit", "-m", "baseline");
    git("switch", "-c", "feature");
    assert.equal(run("--head=HEAD").status, 0);
    write(component, 'const ink = "#abc"; const extra = "red";');
    assert.equal(run().status, 1);
    git("add", ".");
    git("commit", "-m", "literal");
    const committed = run("--head=HEAD");
    assert.equal(committed.status, 1);
    assert.match(committed.stderr, /Example\.tsx:1.*red/);
    write(component, "const ink = INK;");
    assert.equal(run().status, 0);
    write("src/components/source/New file.tsx", 'const ink = "#123";');
    assert.equal(run().status, 1);
    assert.notEqual(run("--base=missing").status, 0);
    assert.notEqual(run("--head=missing").status, 0);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});
