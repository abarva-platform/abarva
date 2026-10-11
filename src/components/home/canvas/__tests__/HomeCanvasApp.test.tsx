/** @jest-environment jsdom */
import "@testing-library/jest-dom";
import fs from "node:fs";
import path from "node:path";
import { fireEvent, render, screen } from "@testing-library/react";
import type { HomeReviewBundle } from "@/lib/home/preview/types";
import { HomeCanvasApp } from "../HomeCanvasApp";

let mockParams = new URLSearchParams();
const mockPush = jest.fn();
const mockAva = jest.fn();
jest.mock("next/navigation", () => ({
  useSearchParams: () => mockParams,
  useRouter: () => ({ push: mockPush }),
}));
jest.mock("next/link", () => ({
  __esModule: true,
  default: ({
    children,
    href,
    scroll,
    prefetch,
    ...props
  }: React.AnchorHTMLAttributes<HTMLAnchorElement> & {
    scroll?: boolean;
    prefetch?: boolean;
  }) => {
    void scroll;
    void prefetch;
    return (
      <a href={href} {...props}>
        {children}
      </a>
    );
  },
}));
jest.mock("@/components/home/preview/HomeAvaChat", () => ({
  HomeAvaChat: (props: { children: React.ReactNode }) => {
    mockAva(props);
    return <>{props.children}</>;
  },
}));
jest.mock("@/components/home/preview/BrowseTheData", () => ({
  BrowseTheData: () => <div data-testid="record-context" />,
}));
jest.mock("../../v4/RecordBrowser", () => ({
  RecordBrowser: (props: {
    recordType: { rows: unknown[]; label: string };
  }) => (
    <div data-testid="family-browser">
      {props.recordType.label}: {props.recordType.rows.length}
    </div>
  ),
  RelationshipLens: () => <div data-testid="relationship-lens" />,
}));
jest.mock("../ArchitectureCanvas", () => ({
  ArchitectureCanvas: () => <div data-testid="native-map" />,
}));
jest.mock("recharts", () => {
  const Container = ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  );
  return {
    ResponsiveContainer: Container,
    BarChart: Container,
    Bar: () => null,
    LabelList: () => null,
    CartesianGrid: () => null,
    Tooltip: () => null,
    XAxis: () => null,
    YAxis: () => null,
  };
});

function bundle(): HomeReviewBundle {
  return JSON.parse(
    fs.readFileSync(
      path.join(
        process.cwd(),
        "src/lib/home/preview/golden-snapshots/meridian-health.json",
      ),
      "utf8",
    ),
  );
}
const source = {
  kind: "reviewed_snapshot" as const,
  canonicalSnapshotHash: "shared-record-version",
};
function app(record = bundle(), recordSource = source) {
  return (
    <HomeCanvasApp
      bundle={record}
      recordSource={recordSource}
      recordToken="same-export-binding"
      tenantKey="meridian-health"
      tenantName="Reference enterprise"
      requestedProvider="ecl"
    />
  );
}

beforeEach(() => {
  mockParams = new URLSearchParams();
  mockPush.mockClear();
  mockAva.mockClear();
  HTMLDialogElement.prototype.showModal = function () {
    this.open = true;
  };
  HTMLDialogElement.prototype.close = function () {
    this.open = false;
  };
});

describe("native Home preview", () => {
  it("passes the exact record and active focus to the unchanged shared aVa", () => {
    mockParams.set("view", "technology_data");
    render(app());
    const props = mockAva.mock.calls.at(-1)![0];
    expect(props.recordSource).toBe(source);
    expect(props.activeChapterId).toBe("technology_data");
    expect(props.requestedProvider).toBe("ecl");
    expect(document.querySelector("[data-home-canvas]")).toHaveAttribute(
      "data-record-version",
      source.canonicalSnapshotHash,
    );
  });
  it.each([
    "executive_brief",
    "our_business",
    "strategy_value_creation",
    "how_we_operate",
    "technology_data",
    "performance_value",
    "leadership_perspective",
    "what_needs_attention",
  ])("mounts one overview, not a scrolling dossier: %s", (view) => {
    mockParams.set("view", view);
    render(app());
    expect(document.querySelectorAll("[data-canvas-overview]")).toHaveLength(1);
    expect(document.querySelector("[data-canvas-overview]")).toHaveAttribute(
      "data-canvas-overview",
      view,
    );
    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
  });
  it("uses navigable URLs for chapters and panels without page anchor jumps", () => {
    render(app());
    for (const link of screen
      .getByRole("navigation", { name: "Home explorer" })
      .querySelectorAll("a")) {
      expect(link.getAttribute("href")).toMatch(/^\/home\/canvas\?/);
      expect(link.getAttribute("href")).not.toContain("#");
    }
    expect(screen.getByRole("link", { name: "Evidence" })).toHaveAttribute(
      "href",
      expect.stringContaining("panel=evidence"),
    );
  });
  it("binds export to this record version and labels its existing scope", () => {
    render(app());
    const link = screen.getByRole("link", { name: "Download PDF" });
    expect(link).toHaveAttribute(
      "href",
      expect.stringContaining("context=same-export-binding"),
    );
    expect(link).toHaveAttribute(
      "title",
      "Download the existing full Home walkthrough PDF",
    );
    expect(screen.getByRole("link", { name: "Current Home" })).toHaveAttribute(
      "href",
      "/home?tenant=meridian-health&provider=ecl",
    );
  });
  it("renders one selected evidence table and makes the others selectable", () => {
    mockParams = new URLSearchParams("view=technology_data&panel=evidence");
    render(app());
    expect(screen.getAllByRole("table")).toHaveLength(1);
    expect(
      screen
        .getByRole("navigation", { name: "Evidence exhibits" })
        .querySelectorAll("button").length,
    ).toBeGreaterThan(5);
  });
  it("retains full text and evidence in an accessible inspection dialog", () => {
    render(app());
    fireEvent.click(
      screen.getAllByRole("button", { name: "Read & verify" })[0],
    );
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(
      screen.getByRole("heading", {
        name: /^(Claim|Interpretation) and evidence$/,
      }),
    ).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Close" }));
    expect(document.querySelector("dialog")).not.toHaveAttribute("open");
  });
  it("clearly labels reviewed fallback", () => {
    render(
      <HomeCanvasApp
        bundle={bundle()}
        recordSource={{ ...source, kind: "reviewed_snapshot_fallback" }}
        recordToken="fallback"
        tenantKey="meridian-health"
        tenantName="Reference enterprise"
      />,
    );
    expect(
      document.querySelector("[data-canvas-source-label]"),
    ).toHaveTextContent("Reviewed stored record fallback");
  });
  it("keeps old interpretation off an unverified current overview", () => {
    const record = bundle();
    record.chapters[0].key_insights[0].statement =
      "OLD INTERPRETATION MUST NOT LEAD";
    render(
      <HomeCanvasApp
        bundle={record}
        recordSource={{
          kind: "ecl_serving_projection",
          canonicalSnapshotHash: "current-rows",
        }}
        recordToken="current"
        tenantKey="meridian-health"
        tenantName="Reference enterprise"
      />,
    );
    expect(
      screen.queryByText("OLD INTERPRETATION MUST NOT LEAD"),
    ).not.toBeInTheDocument();
    expect(
      screen.getByText(/earlier executive interpretation is not verified/),
    ).toBeInTheDocument();
    expect(
      document.querySelector("[data-canvas-source-label]"),
    ).toHaveTextContent("Live governed rows");
  });
  it("makes every supplied family available with its exact row count", () => {
    const record = bundle();
    mockParams.set(
      "view",
      `tech:${record.technologyEstate!.recordTypes[1].objectType}`,
    );
    mockParams.set("panel", "evidence");
    render(app(record));
    expect(screen.getByTestId("family-browser")).toHaveTextContent(
      String(record.technologyEstate!.recordTypes[1].rows.length),
    );
    expect(
      screen.queryByRole("navigation", { name: "Chapter views" }),
    ).not.toBeInTheDocument();
  });
});
