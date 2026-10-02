/**
 * @jest-environment jsdom
 */

/**
 * The enterprise context, on the page a reader opens.
 *
 * The panel and the builder each have their own suite, and both can be right while the page shows
 * neither: the panel is mounted by the application, opens rows through the application, and sits
 * beside statements about the record that the application prints. So this renders Home itself from
 * the generated source and reads what is on screen.
 */
import "@testing-library/jest-dom";
// Must precede the served-path builder import below; see the module for why.
import "../test-support/text-encoder-polyfill";

import { fireEvent, render, within } from "@testing-library/react";
import { rm } from "node:fs/promises";

import {
  buildHomeReviewBundleFromEclProjectionRows,
  type HomeProjectionRow,
  type HomeSourceFileReviewRow,
} from "@/lib/home/preview/ecl-projection-bundle";
import {
  HOME_PREVIEW_TENANT_KEYS,
  getHomeReviewBundle,
} from "@/lib/home/preview/golden-snapshot";
import type { HomeReviewBundle } from "@/lib/home/preview/types";
import {
  generatePack,
  type GeneratedPack,
} from "../../../../../scripts/ecl/load_synthetic_enterprise_v1";
import { buildSyntheticHomeRows } from "../../../../../scripts/ecl/synthetic_enterprise_home_rows";
import { findBuilderLanguage } from "../cxo-language";
import { HomeV4App } from "../HomeV4App";

jest.mock("@/components/home/preview/HomeAvaChat", () => ({
  HomeAvaChat: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));
// The source generator lives in the same module as the load job, whose storage and database
// clients have no build this environment can read. Nothing here loads anything: the clients are
// named so the module imports, and never constructed.
jest.mock("@azure/storage-blob", () => ({ BlobServiceClient: class {} }));
jest.mock("@azure/identity", () => ({ ManagedIdentityCredential: class {} }));
jest.mock("pg", () => ({ __esModule: true, default: { Client: class {} } }));

const TENANT_KEY = HOME_PREVIEW_TENANT_KEYS[0];
const APPROVAL = {
  approved_by: "A named approver",
  approved_at: "2026-10-01",
  release_record: "docs/releases/records/example-load-approval.md",
};

let pack: GeneratedPack;
let rows: HomeProjectionRow[];
let links: Map<string, Map<string, Set<string>>>;

function servedBundle(
  input: HomeProjectionRow[] = rows,
  load_approval?: unknown,
): HomeReviewBundle {
  const base = getHomeReviewBundle(TENANT_KEY);
  if (!base) throw new Error("stored copy missing");
  const catalog: HomeSourceFileReviewRow[] = pack.manifest.files.map(
    (file, index) => ({
      id: `source-file-${index}`,
      file_name: file.file_path,
      file_hash: file.sha256,
      source_date: pack.manifest.as_of,
      quality_state: "accepted",
      load_approval,
    }),
  );
  return buildHomeReviewBundleFromEclProjectionRows(
    base,
    input,
    pack.manifest.assessment_id,
    links,
    catalog,
  );
}

function open(view: string, bundle: HomeReviewBundle = servedBundle()) {
  window.location.hash = view;
  return render(<HomeV4App bundle={bundle} tenantKey={TENANT_KEY} />);
}

const text = (element: Element | null | undefined) =>
  (element?.textContent ?? "").replace(/\s+/g, " ").trim();

function panel(container: HTMLElement): HTMLElement {
  const element = container.querySelector("[data-home-enterprise-context]");
  if (!element)
    throw new Error("the enterprise context panel is not on the page");
  return element as HTMLElement;
}

function rowNamed(scope: HTMLElement, name: string): HTMLElement {
  const row = within(scope).getByText(name).closest("tr");
  if (!row) throw new Error(`no table row for ${name}`);
  return row as HTMLElement;
}

const cells = (row: HTMLElement) =>
  within(row)
    .getAllByRole("cell")
    .map((cell) => text(cell));

/** The rows the record browser is showing, and what it says it arrived filtered to. */
function browser(container: HTMLElement) {
  return {
    rows: container.querySelectorAll("table[data-records] tbody tr").length,
    banner: text(container.querySelector("[data-record-arrived-filtered]")),
    detail: text(container.querySelector("[data-detail-pane]")),
  };
}

beforeAll(async () => {
  pack = await generatePack("v2");
  const sourceHash = "a".repeat(64);
  rows = buildSyntheticHomeRows(
    pack.normalized.objects.map((item) => ({
      id: item.id,
      object_key: item.id,
      object_type: item.type,
      display_name: item.name,
      source_record_id: `source-${item.id}`,
      value_state: "known",
      // As the load stores it: the source's own date travels with the object.
      attributes_json: { ...item.attributes, source_as_of: item.source_as_of },
    })),
  ).map((row, index) => ({
    page_key: row.page_key,
    row_key: row.row_key,
    row_type: row.row_type,
    title: row.title,
    summary: row.summary,
    display_payload_json: { display_payload_json: row.display_payload_json },
    projection_entry_id: `entry-${index}`,
    source_hash: sourceHash,
    source_refs_json: [`source-${row.row_key}`],
    admission_status: "not_applicable",
  }));
  links = new Map(
    rows.map((row) => [
      row.projection_entry_id as string,
      new Map([[sourceHash, new Set([`source-${row.row_key}`])]]),
    ]),
  );
}, 60_000);

afterAll(async () => {
  if (pack) await rm(pack.dir, { recursive: true, force: true });
});

afterEach(() => {
  window.location.hash = "";
});

describe("the enterprise context on the Home page", () => {
  it("is on the four chapters it has a view for, and on no other", () => {
    const expected: Record<string, string> = {
      executive_brief: "The enterprise, in evidence",
      our_business: "Business model and segment economics",
      strategy_value_creation: "Priorities and execution",
      how_we_operate: "How accountability runs",
    };
    for (const [chapterId, heading] of Object.entries(expected)) {
      const { container, unmount } = open(chapterId);
      expect(text(container.querySelector("h1"))).toBe(heading);
      expect(panel(container)).toHaveAttribute(
        "data-home-enterprise-context",
        chapterId,
      );
      expect(panel(container)).toHaveTextContent(
        "Synthetic reference · Not client-attested · Source-linked records",
      );
      unmount();
    }
    for (const chapterId of ["technology_data", "what_needs_attention"]) {
      const { container, unmount } = open(chapterId);
      expect(text(container.querySelector("h1"))).toBe(
        "Current record, interpretation pending review",
      );
      expect(
        container.querySelector("[data-home-enterprise-context]"),
      ).toBeNull();
      unmount();
    }
  });

  it("is not on the page when the record carries no enterprise profile", () => {
    const { container } = open(
      "executive_brief",
      servedBundle(rows.filter((row) => row.row_type !== "enterprise_profile")),
    );
    expect(text(container.querySelector("h1"))).toBe(
      "Current record, interpretation pending review",
    );
    expect(
      container.querySelector("[data-home-enterprise-context]"),
    ).toBeNull();
  });

  it("shows the figures counted from the record", () => {
    const business = open("our_business");
    const table = panel(business.container);
    expect(cells(rowNamed(table, "Health Plan"))).toEqual([
      "Health PlanView segment",
      "$7.6B",
      "38.0%",
      "President, Health Plan",
      "105",
      "4",
      "45",
      "As of 2026-09-30 · 1 source record",
    ]);
    expect(cells(rowNamed(table, "Care Delivery")).slice(1, 7)).toEqual([
      "$8.8B",
      "44.0%",
      "Chief Clinical Officer",
      "67",
      "7",
      "35",
    ]);
    expect(table).toHaveTextContent(
      "Under functions with no declared segment: 136 applications, 11 programs, 87 risks. Customer/channel economics are not established by this record.",
    );
    business.unmount();

    const executive = open("executive_brief");
    const tiles = panel(executive.container);
    const tile = (label: string) =>
      text(within(tiles).getByText(label).previousElementSibling);
    expect(tile("Declared annual revenue")).toBe("$20B");
    expect(tile("Business segments")).toBe("3");
    expect(tile("Declared priorities")).toBe("5");
    expect(tile("Programs")).toBe("24");
    expect(tile("At-risk linked programs")).toBe("3");
    expect(tiles).toHaveTextContent(
      "6 functions have no declared segment; 1 program has no declared priority.",
    );
    executive.unmount();

    const strategy = open("strategy_value_creation");
    expect(
      cells(
        rowNamed(panel(strategy.container), "Improve MA Star Rating"),
      ).slice(1, 6),
    ).toEqual(["President, Health Plan", "4.5+ by 2028", "4", "0", "11"]);
    strategy.unmount();

    const operating = open("how_we_operate");
    expect(
      cells(
        rowNamed(panel(operating.container), "Information Technology"),
      ).slice(1, 6),
    ).toEqual([
      "No declared segment",
      "Chief Information Officer",
      "31",
      "4",
      "16",
    ]);
  });

  it("says a segment's revenue is not recorded when its row records none", () => {
    const { container } = open(
      "our_business",
      servedBundle(
        rows.map((row) =>
          row.row_type === "business_segment" && row.title === "Care Delivery"
            ? {
                ...row,
                display_payload_json: {
                  display_payload_json: {
                    ...((row.display_payload_json as Record<string, unknown>)
                      .display_payload_json as Record<string, unknown>),
                    revenue_usd: "",
                    revenue_share_pct: "",
                  },
                },
              }
            : row,
        ),
      ),
    );
    const row = cells(rowNamed(panel(container), "Care Delivery"));
    expect(row.slice(1, 3)).toEqual(["Not recorded", "Not recorded"]);
    expect(panel(container)).not.toHaveTextContent("$0");
    expect(panel(container)).not.toHaveTextContent("0.0%");
    // The counts beside it are untouched.
    expect(row.slice(4, 7)).toEqual(["67", "7", "35"]);
  });

  it("opens a priority's programs: exactly the programs counted, named by the priority", () => {
    const { container } = open("strategy_value_creation");
    const row = rowNamed(
      panel(container),
      "Reduce avoidable care and improve access",
    );
    const counted = Number(cells(row)[3]);
    expect(counted).toBe(6);
    fireEvent.click(within(row).getByRole("button", { name: "View programs" }));

    expect(window.location.hash).toBe("#tech:program_initiative");
    const shown = browser(container);
    expect(shown.rows).toBe(counted);
    expect(shown.banner).toContain(
      "filtered to Reduce avoidable care and improve access.",
    );
    // The identifier found the rows. It is not something the reader is shown.
    expect(shown.banner).not.toMatch(/PRI-\d/);
    expect(shown.detail).not.toMatch(/Priority Id|Sponsor Function Id/);
    expect(shown.detail).not.toMatch(/\b(?:PRI|FUNC)-\d/);
    expect(
      (container.querySelector('input[type="search"]') as HTMLInputElement)
        .value,
    ).toBe("");

    fireEvent.click(
      within(container).getByRole("button", { name: /^Show all/ }),
    );
    expect(browser(container).rows).toBe(24);
    expect(
      container.querySelector("[data-record-arrived-filtered]"),
    ).toBeNull();
  });

  it("opens a function, a segment and an unlinked program the same way", () => {
    const operating = open("how_we_operate");
    fireEvent.click(
      within(
        rowNamed(panel(operating.container), "Health Plan Operations"),
      ).getByRole("button", { name: "View function" }),
    );
    expect(window.location.hash).toBe("#tech:business_function");
    let shown = browser(operating.container);
    expect(shown.rows).toBe(1);
    expect(shown.banner).toContain("filtered to Health Plan Operations.");
    expect(shown.banner).not.toMatch(/FUNC-\d/);
    expect(shown.detail).toContain("Health Plan Operations");
    expect(shown.detail).not.toContain("Function Id");
    operating.unmount();

    const business = open("our_business");
    fireEvent.click(
      within(rowNamed(panel(business.container), "Care Delivery")).getByRole(
        "button",
        { name: "View segment" },
      ),
    );
    expect(window.location.hash).toBe("#tech:business_segment");
    shown = browser(business.container);
    expect(shown.rows).toBe(1);
    expect(shown.banner).toContain("filtered to Care Delivery.");
    expect(shown.banner).not.toMatch(/SEG-\d/);
    business.unmount();

    const strategy = open("strategy_value_creation");
    fireEvent.click(
      within(panel(strategy.container)).getByRole("button", {
        name: "Workforce capability academy",
      }),
    );
    expect(window.location.hash).toBe("#tech:program_initiative");
    shown = browser(strategy.container);
    expect(shown.rows).toBe(1);
    expect(shown.banner).toContain("filtered to Workforce capability academy.");
    expect(shown.banner).not.toMatch(/PROG-\d/);
    expect(shown.detail).toContain("Workforce capability academy");
  });

  it("keeps the identifiers records name each other by out of the record browser", () => {
    const { container } = open("tech:application_system");
    const detail = browser(container).detail;
    expect(detail).toContain("System Name");
    expect(detail).not.toMatch(/Segment Id|Business Function Id/);
    expect(detail).not.toMatch(/\b(?:SEG|FUNC)-\d/);
    // Nor can they be found by typing one: they are not part of what the reader was shown.
    fireEvent.change(
      container.querySelector('input[type="search"]') as HTMLInputElement,
      { target: { value: "FUNC-0001" } },
    );
    expect(browser(container).rows).toBe(0);
  });

  it("says nothing in builder vocabulary on the views it adds", () => {
    for (const chapterId of [
      "executive_brief",
      "our_business",
      "strategy_value_creation",
      "how_we_operate",
    ]) {
      const { container, unmount } = open(chapterId);
      const opening = container.querySelector(
        "[data-home-mixed-chapter-opening]",
      );
      const heading = [
        text(opening?.querySelector("h1")),
        text(opening?.querySelector("h1 + p")),
      ];
      const tooltips = Array.from(
        panel(container).querySelectorAll("[title]"),
      ).map((element) => element.getAttribute("title") ?? "");
      for (const shown of [...heading, text(panel(container)), ...tooltips]) {
        expect(shown.length).toBeGreaterThan(0);
        expect(findBuilderLanguage([shown])).toEqual([]);
        expect(shown).not.toMatch(/governed|source rows?/i);
      }
      unmount();
    }
  });
});

describe("the source-file statement on the Home page", () => {
  it("does not call a file accepted until an approval is recorded for its load", () => {
    const stateOnly = open("executive_brief");
    for (const selector of [
      "nav",
      "[data-home-record-state-band]",
      "[data-home-mixed-chapter-opening]",
    ]) {
      const element = stateOnly.container.querySelector(selector);
      expect(element).toHaveTextContent(
        "Source-file quality: 0 of 22 accepted; 22 not reviewed",
      );
      expect(element).not.toHaveTextContent("22 of 22 accepted");
    }
    stateOnly.unmount();

    const approved = open("executive_brief", servedBundle(rows, APPROVAL));
    for (const selector of [
      "nav",
      "[data-home-record-state-band]",
      "[data-home-mixed-chapter-opening]",
    ]) {
      const element = approved.container.querySelector(selector);
      expect(element).toHaveTextContent(
        "Source-file quality: 22 of 22 accepted",
      );
      expect(element).not.toHaveTextContent("not reviewed");
    }
    // Who approved decides the count and stays off the page.
    expect(approved.container).not.toHaveTextContent(APPROVAL.approved_by);
  });
});
