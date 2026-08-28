/**
 * Regression: freshness on the Tower header is reported from the posture row, never invented.
 *
 * Two fabricated dates previously sat side by side in the executive header — a `new Date()`
 * evaluated at render (so it always claimed "today") and a frozen string literal. Both asserted
 * currency the data had not earned, on the one surface whose whole premise is evidence discipline.
 */

import * as fs from "node:fs";
import * as path from "node:path";

const SRC = path.resolve(__dirname, "../../..");

function read(rel: string): string {
  return fs.readFileSync(path.resolve(SRC, rel), "utf-8");
}

describe("Tower freshness is provenance-derived", () => {
  it("carries as_of_period and refresh_timestamp from the ECL serving model", () => {
    const reader = read("lib/tower/readTowerCommandCenter.ts");
    expect(reader).toMatch(/asOfPeriod: "2026-08-24"/);
    expect(reader).toMatch(/refreshTimestamp: null/);
    expect(reader).toMatch(/sourceFiles/);
  });

  it("exposes both fields on the command-center summary", () => {
    const types = read("lib/tower/command-center/types.ts");
    expect(types).toMatch(/asOfPeriod: string \| null;/);
    expect(types).toMatch(/refreshTimestamp: string \| null;/);

    const viewModel = read("lib/tower/command-center/view-model.ts");
    expect(viewModel).toMatch(/asOfPeriod: command\.asOfPeriod \?\? null/);
    expect(viewModel).toMatch(
      /refreshTimestamp: command\.refreshTimestamp \?\? null/,
    );
  });

  it("does not evaluate a date at render time anywhere in the Tower route", () => {
    const route = read("app/(maestro)/tower/page.tsx");
    expect(route).not.toMatch(/new Date\(\)/);
  });

  it("has no hardcoded date literal in the command-center header", () => {
    const component = read(
      "components/tower/command-center/views/CommandCenterView.tsx",
    );
    expect(component).not.toMatch(/Updated \w+ \d{1,2}, \d{4}/);
    expect(component).not.toMatch(/BOARDROOM_UPDATED_LABEL/);
  });

  it("says the date is unrecorded rather than substituting one", () => {
    const component = read(
      "components/tower/command-center/views/CommandCenterView.tsx",
    );
    expect(component).toMatch(/As-of date not recorded/);
    expect(component).toMatch(/build date not recorded/);
  });
});

describe("Command Center owns the first viewport", () => {
  it("renders the Command Center before the reconciliation and projection panels", () => {
    const route = read("app/(maestro)/tower/page.tsx");
    const body = route.slice(route.indexOf("<Suspense"));
    const commandCenter = body.indexOf("<TowerCommandCenterAvaShell");
    const projection = body.indexOf("<TowerEclProjectionPanel");

    expect(commandCenter).toBeGreaterThan(-1);
    expect(projection).toBeGreaterThan(commandCenter);
  });

  it("keeps the supporting panels on the page", () => {
    const route = read("app/(maestro)/tower/page.tsx");
    expect(route).toMatch(
      /<TowerEclProjectionPanel preview=\{towerEclPreview\} \/>/,
    );
    expect(route).toMatch(/<EclServingSurfaceCoverage product="tower" \/>/);
  });

  it("shows the Tower proof surfaces in serving-surface diagnostics", () => {
    const component = read("components/ecl/EclServingSurfaceCoverage.tsx");
    const towerLabels = component.slice(
      component.indexOf("tower: ["),
      component.indexOf("],", component.indexOf("tower: [")),
    );

    expect(towerLabels).toMatch(/"Executive View"/);
    expect(towerLabels).toMatch(/"Evidence & Actions"/);
    expect(towerLabels).toMatch(/"Decision Lanes"/);
    expect(towerLabels).toMatch(/"Evidence"/);
    expect(towerLabels).toMatch(/"Recommended Actions"/);
  });

  it("keeps Tower tab controls out of the global toolbar layer", () => {
    const styles = read(
      "components/tower/command-center/TowerCommandCenter.module.css",
    );
    const tabShell = styles.slice(
      styles.indexOf(".executiveTabsShell"),
      styles.indexOf(".executiveTabs", styles.indexOf(".executiveTabsShell")),
    );

    expect(tabShell).not.toMatch(/position:\s*sticky/);
    expect(tabShell).not.toMatch(/top:\s*0/);
  });
});
