/** @jest-environment jsdom */
/**
 * One rendered row per record, and the row a reader clicks is the row they are shown.
 *
 * The record browser keyed its rendered rows on `originalRowId`, which is the intake's row stamp
 * rather than an identity the view guarantees. One governed tenant's infrastructure estate carries
 * that stamp fourteen times over -- thirteen rows appended by a fixture generator inherited the
 * first row's whole provenance block -- so fourteen distinct platforms arrived at the table with
 * one key between them.
 *
 * React's own warning about that is a development-build artefact, so a case that asserted on the
 * warning would vanish in the build that ships. Two things break in every build instead, and both
 * are asserted here:
 *
 * - the table renders fewer rows than the record holds, because React may drop a duplicate child;
 * - selection resolves by key (`filtered.find((r) => r.key === selectedKey)`), so clicking the
 *   thirty-fourth platform opens the *first* platform's detail panel, under the first platform's
 *   ordinal, with nothing on screen saying so.
 *
 * The second is the reader-visible one: someone asking what the Amadeus data centre costs is shown
 * a Chicago data centre's numbers and has no way to tell.
 *
 * Both cases drive the real golden bundle rather than a hand-built fixture. A fixture would have to
 * reproduce the collision to test it, and a collision an author put there on purpose proves nothing
 * about the bundle that ships -- so the fixture case below exists only to pin the behaviour for the
 * *next* bundle, and the bundle cases are what prove today's.
 */
import "@testing-library/jest-dom";
import fs from "node:fs";
import path from "node:path";
import { render, screen } from "@testing-library/react";
import { act } from "react";
import type { TechRecordType } from "@/lib/home/preview/types";
import { RecordBrowser } from "../RecordBrowser";

function recordTypeOf(tenantKey: string, objectType: string): TechRecordType {
  const snapshot = JSON.parse(
    fs.readFileSync(
      path.join(
        process.cwd(),
        "src/lib/home/preview/golden-snapshots",
        `${tenantKey}.json`,
      ),
      "utf8",
    ),
  );
  const found = snapshot.technologyEstate.recordTypes.find(
    (r: { objectType: string }) => r.objectType === objectType,
  );
  if (!found) throw new Error(`${tenantKey} has no ${objectType} record type`);
  return found as TechRecordType;
}

/**
 * The lens the collision lives on today. Named, not swept: the sibling record types on this tenant
 * and every record type on the other governed tenant were measured through the same key function
 * and are unique, so this is the one known positive.
 */
const COLLIDING = { tenant: "skyharbor-air", objectType: "infrastructure_platform" };

/**
 * A control, so a green suite cannot mean "the assertions do not bite". If the row cap or the
 * filter silently dropped rows, this record type would fail too.
 */
const CLEAN = { tenant: "meridian-health", objectType: "infrastructure_platform" };

describe("record browser row identity", () => {
  for (const { tenant, objectType } of [COLLIDING, CLEAN]) {
    it(`renders one row per record for ${tenant} ${objectType}`, () => {
      const recordType = recordTypeOf(tenant, objectType);
      const total = (recordType.rows ?? []).length;
      // The browser pages at 120. Both records are under it, so a short table is a dropped row and
      // not a page boundary -- asserted rather than assumed, because the day a record crosses 120
      // this case would otherwise start passing for the wrong reason.
      expect(total).toBeLessThanOrEqual(120);
      expect(total).toBeGreaterThan(0);

      const { container } = render(<RecordBrowser recordType={recordType} />);
      const rendered = container.querySelectorAll("table[data-records] tbody tr");
      expect(rendered).toHaveLength(total);
    });

    it(`opens the clicked row's own detail for ${tenant} ${objectType}`, () => {
      const recordType = recordTypeOf(tenant, objectType);
      const rows = (recordType.rows ?? []) as Record<string, unknown>[];
      const { container } = render(<RecordBrowser recordType={recordType} />);
      const rendered = container.querySelectorAll<HTMLTableRowElement>(
        "table[data-records] tbody tr",
      );

      // Every row, not a sample. The collision is a run of fourteen inside a record of forty-seven,
      // so a sampled index can miss it entirely, and asserting "some row misroutes" would pass on a
      // bundle where a different one did.
      const misrouted: string[] = [];
      rendered.forEach((tr, index) => {
        act(() => {
          tr.click();
        });
        const pane = container.querySelector("[data-detail-pane]");
        const heading = pane?.querySelector("h2")?.textContent ?? "";
        const expected = String(
          rows[index]?.platformName ??
            rows[index]?.systemName ??
            rows[index]?.contractName ??
            rows[index]?.dataAssetName ??
            "",
        ).replace(/_/g, " ");
        if (expected && heading !== expected) {
          misrouted.push(`row ${index + 1}: clicked "${expected}", shown "${heading}"`);
        }
      });

      expect(misrouted).toEqual([]);
    });
  }

  /**
   * The half that protects the next bundle. The reader must not be the only thing standing between
   * a duplicated identifier and a misrouted panel, so a colliding record is *reported* on screen
   * rather than quietly rekeyed -- otherwise the fix hides the data defect it works around.
   */
  it("reports a record whose identifiers collide instead of collapsing it silently", () => {
    const recordType = {
      objectType: "infrastructure_platform",
      label: "Infrastructure",
      rows: [
        { platformName: "Alpha", originalRowId: "SAME-1", criticality: "tier1" },
        { platformName: "Beta", originalRowId: "SAME-1", criticality: "tier2" },
        { platformName: "Gamma", originalRowId: "OWN-2", criticality: "tier3" },
      ],
    } as unknown as TechRecordType;

    const { container } = render(<RecordBrowser recordType={recordType} />);
    expect(
      container.querySelectorAll("table[data-records] tbody tr"),
    ).toHaveLength(3);

    // Each of the three is reachable and shows its own name, including the two that shared a stamp.
    const rendered = container.querySelectorAll<HTMLTableRowElement>(
      "table[data-records] tbody tr",
    );
    for (const [index, name] of ["Alpha", "Beta", "Gamma"].entries()) {
      act(() => {
        rendered[index].click();
      });
      expect(
        container.querySelector("[data-detail-pane]")?.querySelector("h2")
          ?.textContent,
      ).toBe(name);
    }

    // And the collision is on screen, naming the count, rather than absorbed in silence.
    const notice = screen.getByTestId("record-identity-collision");
    expect(notice).toBeInTheDocument();
    expect(notice.textContent).toMatch(/2 of 3/);
  });

  it("says nothing when every identifier is already unique", () => {
    const recordType = {
      objectType: "infrastructure_platform",
      label: "Infrastructure",
      rows: [
        { platformName: "Alpha", originalRowId: "A-1" },
        { platformName: "Beta", originalRowId: "B-2" },
      ],
    } as unknown as TechRecordType;
    render(<RecordBrowser recordType={recordType} />);
    expect(
      screen.queryByTestId("record-identity-collision"),
    ).not.toBeInTheDocument();
  });
});
