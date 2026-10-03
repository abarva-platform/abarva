import { execFileSync } from "node:child_process";
import { mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

/**
 * Item C-636. The AI surface control gate already refuses a required-control
 * entry that declares no `behavioralTest` at all, and it already names every
 * uncovered control in its report so the next one can be read off the gate
 * rather than searched for in the test tree.
 *
 * What it could not say is which of those names a behavioral test would
 * actually fix. The report qualifies an uncovered control only when no route
 * reaches its surface. For a control on a surface a route *does* reach, the
 * report offers it on the same terms whether the control is present and
 * untested — where a test is the remedy — or measured absent from the surface
 * altogether, where a test would pin an absence and the remedy is to render
 * the control, which is an owner decision and not this lane's to make.
 *
 * Both states were distinguished only in the `reason` prose, and the report
 * cannot act on prose. So all ten uncovered controls read as a draw pool, and
 * an agent drawing "the next declared control with no behavioral test" writes
 * a test for a control no reader can see. That is the same shape as a gate
 * that proved a control existed because its name appeared in the file: the
 * number goes up and the product does not change.
 *
 * The discriminator is therefore a declared field the gate enforces, and the
 * report states the *drawable* count rather than the uncovered count. Today
 * that count is zero, which is the honest answer and the reason the draw stops.
 */

const repoRoot = path.resolve(__dirname, "../../..");
const CATALOG_REL = "docs/security/ai-surface-control-catalog.json";
const SCRIPT = path.join(repoRoot, "scripts/audit/ai-surface-control-catalog.mjs");

type Behavioral = {
  status?: string;
  path?: string;
  reason?: string;
  remedy?: string;
  knownSuites?: string[];
};

type Catalog = {
  controls: Array<{
    id: string;
    path: string;
    routeReachable?: boolean;
    requiredControls: Array<{ kind: string; behavioralTest: Behavioral }>;
  }>;
};

const RENDER_THE_CONTROL = "render-the-control";
const WRITE_A_TEST = "write-a-test";

function readCatalog(): Catalog {
  return JSON.parse(readFileSync(path.join(repoRoot, CATALOG_REL), "utf8")) as Catalog;
}

function uncoveredControls(catalog: Catalog) {
  return catalog.controls.flatMap((surface) =>
    surface.requiredControls
      .filter((control) => control.behavioralTest?.status === "none")
      .map((control) => ({ surface, control })),
  );
}

function runAudit(catalogPath: string): { code: number; output: string } {
  try {
    const output = execFileSync(process.execPath, [SCRIPT], {
      cwd: repoRoot,
      encoding: "utf8",
      env: { ...process.env, AI_SURFACE_CONTROL_CATALOG_PATH: catalogPath },
      stdio: ["ignore", "pipe", "pipe"],
    });
    return { code: 0, output };
  } catch (error) {
    const err = error as { status?: number; stdout?: string; stderr?: string };
    return { code: err.status ?? 1, output: `${err.stdout ?? ""}${err.stderr ?? ""}` };
  }
}

function writeFixture(mutate: (catalog: Catalog) => void): string {
  const catalog = readCatalog();
  mutate(catalog);
  const file = path.join(mkdtempSync(path.join(tmpdir(), "c636-catalog-")), "catalog.json");
  writeFileSync(file, JSON.stringify(catalog, null, 2));
  return file;
}

describe("an uncovered AI-surface control declares which remedy would fix it", () => {
  it("every uncovered control in the live catalog declares a remedy the gate recognises", () => {
    const uncovered = uncoveredControls(readCatalog());
    // A vacuous pass is the failure mode this catalog exists against: with no
    // uncovered control the loop below asserts nothing at all.
    expect(uncovered.length).toBeGreaterThan(0);

    for (const { surface, control } of uncovered) {
      expect({
        control: `${surface.id}:${control.kind}`,
        remedy: control.behavioralTest.remedy,
      }).toEqual({
        control: `${surface.id}:${control.kind}`,
        remedy: expect.stringMatching(new RegExp(`^(${RENDER_THE_CONTROL}|${WRITE_A_TEST})$`)),
      });
    }
  });

  it("refuses an uncovered control that declares no remedy", () => {
    const fixture = writeFixture((catalog) => {
      const [first] = uncoveredControls(catalog);
      delete first.control.behavioralTest.remedy;
    });

    const { code, output } = runAudit(fixture);
    expect(code).toBe(1);
    expect(output).toContain("remedy");
  });

  it("refuses a remedy the gate does not define, rather than treating it as drawable", () => {
    const fixture = writeFixture((catalog) => {
      const [first] = uncoveredControls(catalog);
      first.control.behavioralTest.remedy = "someone-will-look-at-it";
    });

    const { code, output } = runAudit(fixture);
    expect(code).toBe(1);
    expect(output).toContain("someone-will-look-at-it");
  });

  // The contradiction is the half that makes the field more than a formality.
  // If no route reaches the surface, a behavioral test cannot be the remedy —
  // it would render an unmounted component and prove the component, not the
  // product. Closed item 41 ruled that out explicitly.
  it("refuses write-a-test on a surface no route reaches", () => {
    const catalog = readCatalog();
    const unreachable = uncoveredControls(catalog).find(
      ({ surface }) => surface.routeReachable === false,
    );
    expect(unreachable).toBeDefined();

    const fixture = writeFixture((mutable) => {
      for (const { surface, control } of uncoveredControls(mutable)) {
        if (surface.id !== unreachable!.surface.id) continue;
        if (control.kind !== unreachable!.control.kind) continue;
        control.behavioralTest.remedy = WRITE_A_TEST;
      }
    });

    const { code, output } = runAudit(fixture);
    expect(code).toBe(1);
    expect(output).toContain(unreachable!.surface.id);
  });
});

describe("the gate reports how many uncovered controls a test would actually fix", () => {
  it("states the drawable count, and it is the count derived independently here", () => {
    const catalog = readCatalog();
    const drawable = uncoveredControls(catalog).filter(
      ({ control }) => control.behavioralTest.remedy === WRITE_A_TEST,
    );

    const { code, output } = runAudit(path.join(repoRoot, CATALOG_REL));
    expect(code).toBe(0);
    expect(output).toContain(`Drawable by a behavioral test: ${drawable.length}`);
  });

  // Zero is stated in words rather than left as an absent section. "No output
  // read as nothing wrong" is how a removed section and an empty one become
  // indistinguishable, which is the failure this gate was built against.
  it("says in words that nothing is drawable, and says why each uncovered control is not", () => {
    const catalog = readCatalog();
    const drawable = uncoveredControls(catalog).filter(
      ({ control }) => control.behavioralTest.remedy === WRITE_A_TEST,
    );
    // Keyed to today's catalog on purpose: if a control becomes drawable this
    // case must be revisited rather than silently skipped.
    expect(drawable).toHaveLength(0);

    const { output } = runAudit(path.join(repoRoot, CATALOG_REL));
    expect(output).toContain("Drawable by a behavioral test: 0");
    expect(output).toContain("a behavioral test is not the remedy for any of them");

    for (const { surface, control } of uncoveredControls(catalog)) {
      expect(output).toContain(`${surface.id}:${control.kind}`);
    }
    expect(output).toContain(RENDER_THE_CONTROL);
  });

  it("counts a drawable control when one exists, so the zero above is a measurement and not a constant", () => {
    const catalog = readCatalog();
    // Pick a reachable uncovered control: by the contradiction rule above,
    // only a reachable surface may declare write-a-test.
    const reachable = uncoveredControls(catalog).find(
      ({ surface }) => surface.routeReachable !== false,
    );
    expect(reachable).toBeDefined();

    const fixture = writeFixture((mutable) => {
      for (const { surface, control } of uncoveredControls(mutable)) {
        if (surface.id !== reachable!.surface.id) continue;
        if (control.kind !== reachable!.control.kind) continue;
        control.behavioralTest.remedy = WRITE_A_TEST;
      }
    });

    const { code, output } = runAudit(fixture);
    expect(code).toBe(0);
    expect(output).toContain("Drawable by a behavioral test: 1");
    expect(output).toContain(`${reachable!.surface.id}:${reachable!.control.kind}`);
  });
});
