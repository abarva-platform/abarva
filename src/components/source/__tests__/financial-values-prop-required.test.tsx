/**
 * @jest-environment jsdom
 */

// U-508. Eight Source components declared `canViewFinancialValues?: boolean`
// and defaulted it to `true`, so a caller that simply forgot the prop printed
// exact financial figures. `U-517` fixed one literal `true` at one call site;
// this is the same fail-open shape one level down, in the components those call
// sites mount.
//
// The fix is to REMOVE the default, not to flip it. `= false` still lets a
// caller stay silent and still answers for them; a required prop makes the
// caller answer. So this file proves the removal at two layers, because either
// one alone can be satisfied without the other:
//
//   1. TYPE — omitting the prop must not compile. Each `@ts-expect-error` below
//      fails `tsc --noEmit` the moment the prop goes optional again, because an
//      unused suppression is itself an error. This is a compiler-run control,
//      not a name a scanner greps for.
//   2. RENDER — with the prop absent at run time the value is `undefined`,
//      which every consumer must read as "no", so a JavaScript caller (or a
//      `any`-typed mount) also fails closed.
//
// Both directions are asserted: explicit `true` must still print the amount, or
// the suite could be satisfied by a component that restricts unconditionally.

import "@testing-library/jest-dom";
import { render } from "@testing-library/react";

jest.mock("@/components/shell/AppShell", () => ({
  AppShell: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
}));
jest.mock("@/components/source/SourceSubNav", () => ({
  SourceSubNav: () => <nav data-testid="subnav-mock" />,
}));
jest.mock("@/components/agent/AgentDock", () => ({
  AgentDock: ({ workspace }: { workspace?: React.ReactNode }) => (
    <div data-testid="agent-dock-mock">{workspace}</div>
  ),
}));
// The canvas pulls @/lib/source -> queries -> active-client -> resolveTenant,
// which reaches Clerk's ESM-only browser runtime and the pg driver. None of
// that is under test here: these components are pure renderers.
jest.mock("@/lib/source/queries", () => ({}));
jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: jest.fn(), refresh: jest.fn() }),
  usePathname: () => "/source",
  useSearchParams: () => new URLSearchParams(),
}));

import { SentinelEngagementCanvas } from "../SentinelEngagementCanvas";
import { SourceAlertPanel } from "../SourceAlertPanel";
import { SourceEventsPortfolio } from "../SourceEventsPortfolio";
import { SourceOptimizeContractPage } from "../SourceOptimizeContractPage";
import { SourcePortfolioBookPage } from "../SourcePortfolioBookPage";
import { SourcePortfolioPage } from "../SourcePortfolioPage";
import { SourceValueLedger } from "../SourceValueLedger";
import { SourcingEventTable } from "../SourcingEventTable";

import { AbarVaSourceDashboard } from "../AbarVaSourceDashboard";
import {
  getSourceDashboardSeed,
  getSourceEventSeed,
  listSourceEventSeed,
} from "@/lib/source/mock-seed";
import type { ContractOptimizationSpine } from "@/lib/source/data-model/contract-optimization-spine";
import type {
  SourceValueLedgerSnapshot,
  SourcingEventDetail,
  SourcingEventSummary,
} from "@/lib/source/types";

// One distinctive amount, so an assertion cannot pass by matching some other
// figure the surface happens to render.
const AMOUNT_USD = 12_300_000;
const AMOUNT_TEXT = "$12.3M";

function makeEvent(over: Partial<SourcingEventSummary> = {}): SourcingEventSummary {
  const seed = listSourceEventSeed()[0];
  return {
    ...seed,
    id: "evt-u508",
    code: "U508-2026",
    name: "U508 Fixture Event",
    valueAtStakeUsd: AMOUNT_USD,
    projectedValueUsd: AMOUNT_USD,
    realizedValueUsd: 0,
    blocker: null,
    ...over,
  };
}

function makeEventDetail(): SourcingEventDetail {
  const seed = getSourceEventSeed(listSourceEventSeed()[0].id);
  if (!seed) throw new Error("U-508 fixture: no seeded sourcing event detail");
  return { ...seed, valueAtStakeUsd: AMOUNT_USD };
}

function makeLedger(): SourceValueLedgerSnapshot {
  return {
    updatedAt: "2026-09-25",
    projected: [
      {
        id: "vle-u508",
        eventId: "evt-u508",
        eventName: "U508 Fixture Event",
        kind: "projected",
        label: "Projected savings",
        stageKey: null,
        amountUsd: AMOUNT_USD,
        confidence: "high",
        evidenceCount: 2,
        note: "Fixture entry",
      },
    ],
    realized: [],
  };
}

function makeSpine(): ContractOptimizationSpine {
  return {
    selected: null,
    candidates: [],
    topCandidates: [],
    sourceConnections: [],
    missingEvidenceSources: [],
    contractStory: [],
    missingEvidenceStory: [],
  } as unknown as ContractOptimizationSpine;
}

const ALERTS = [
  {
    id: "alert-u508",
    title: "Decision needed",
    detail: "Confirm the shortlist",
    severity: "critical" as const,
    eventId: "evt-u508",
  },
];

const ALERT_CONTEXT = {
  "evt-u508": {
    name: "U508 Fixture Event",
    valueAtStakeUsd: AMOUNT_USD,
    agingDays: 4,
    statusLabel: "Active",
    blocker: null,
  },
};

// Each entry renders one component TWICE: once with the prop omitted, once with
// it explicitly `true`. `omitted` deliberately drops the prop at run time; the
// cast is what a JavaScript caller or an `any`-typed mount does by accident,
// and is the only way to reach the run-time path once the type is required.
type Mount = {
  name: string;
  omitted: () => React.ReactElement;
  granted: () => React.ReactElement;
  /** Text that must appear ONLY when the prop is explicitly true. */
  exact: string;
  /** Text that must appear ONLY when the prop is absent. */
  restricted: string;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const omit = (Component: any, props: Record<string, unknown>) => (
  <Component {...props} />
);

const MOUNTS: Mount[] = [
  {
    name: "SourcingEventTable",
    omitted: () => omit(SourcingEventTable, { events: [makeEvent()] }),
    granted: () => (
      <SourcingEventTable events={[makeEvent()]} canViewFinancialValues />
    ),
    exact: AMOUNT_TEXT,
    restricted: "Restricted",
  },
  {
    name: "SourceAlertPanel",
    omitted: () =>
      omit(SourceAlertPanel, { alerts: ALERTS, eventContextById: ALERT_CONTEXT }),
    granted: () => (
      <SourceAlertPanel
        alerts={ALERTS}
        eventContextById={ALERT_CONTEXT}
        canViewFinancialValues
      />
    ),
    exact: AMOUNT_TEXT,
    restricted: "Restricted",
  },
  {
    name: "SentinelEngagementCanvas",
    omitted: () => omit(SentinelEngagementCanvas, { event: makeEventDetail() }),
    granted: () => (
      <SentinelEngagementCanvas event={makeEventDetail()} canViewFinancialValues />
    ),
    exact: AMOUNT_TEXT,
    restricted: "Restricted",
  },
  {
    name: "SourceEventsPortfolio",
    omitted: () =>
      omit(SourceEventsPortfolio, {
        events: [makeEvent()],
        activeStage: null,
        activeStatus: null,
      }),
    granted: () => (
      <SourceEventsPortfolio
        events={[makeEvent()]}
        activeStage={null}
        activeStatus={null}
        canViewFinancialValues
      />
    ),
    exact: AMOUNT_TEXT,
    restricted: "Restricted",
  },
  {
    name: "SourcePortfolioPage",
    omitted: () =>
      omit(SourcePortfolioPage, {
        events: [makeEvent()],
        tenantName: "Lakeshore",
        searchParams: {},
      }),
    granted: () => (
      <SourcePortfolioPage
        events={[makeEvent()]}
        tenantName="Lakeshore"
        searchParams={{}}
        canViewFinancialValues
      />
    ),
    exact: AMOUNT_TEXT,
    restricted: "Restricted",
  },
  {
    name: "SourcePortfolioBookPage",
    omitted: () =>
      omit(SourcePortfolioBookPage, {
        events: [makeEvent()],
        tenantName: "Lakeshore",
      }),
    granted: () => (
      <SourcePortfolioBookPage
        events={[makeEvent()]}
        tenantName="Lakeshore"
        canViewFinancialValues
      />
    ),
    exact: AMOUNT_TEXT,
    restricted: "Restricted",
  },
  {
    name: "SourceValueLedger",
    omitted: () => omit(SourceValueLedger, { snapshot: makeLedger() }),
    granted: () => (
      <SourceValueLedger snapshot={makeLedger()} canViewFinancialValues />
    ),
    exact: AMOUNT_TEXT,
    restricted: "Restricted",
  },
  {
    name: "SourceOptimizeContractPage",
    omitted: () =>
      omit(SourceOptimizeContractPage, {
        tenantName: "SkyHarbor Global",
        asOfDateIso: "2027-06-30T00:00:00.000Z",
        spine: makeSpine(),
        opportunitySet: null,
      }),
    granted: () => (
      <SourceOptimizeContractPage
        tenantName="SkyHarbor Global"
        asOfDateIso="2027-06-30T00:00:00.000Z"
        spine={makeSpine()}
        opportunitySet={null}
        canViewFinancialValues
      />
    ),
    // This one gates the whole workflow rather than one figure.
    exact: "Select a contract to optimize",
    restricted: "Financial access required",
  },
];

describe("U-508 — canViewFinancialValues has no fail-open default", () => {
  it("covers every component in the family that reads the prop", () => {
    // A guard against this file quietly covering fewer components than the
    // item names. SourceEventsViewToggle is the ninth reader of the prop and
    // is deliberately NOT here: it already defaulted to `false`, so it has no
    // fail-open default to remove, and widening the change to it would be
    // scope this item does not name.
    expect(MOUNTS.map((m) => m.name).sort()).toEqual(
      [
        "SentinelEngagementCanvas",
        "SourceAlertPanel",
        "SourceEventsPortfolio",
        "SourceOptimizeContractPage",
        "SourcePortfolioBookPage",
        "SourcePortfolioPage",
        "SourceValueLedger",
        "SourcingEventTable",
      ].sort(),
    );
  });

  describe("render — the prop absent at run time reads as NO", () => {
    for (const mount of MOUNTS) {
      it(`${mount.name} prints no exact amount when the prop is omitted`, () => {
        const { container } = render(mount.omitted());
        const text = container.textContent ?? "";
        expect(text).not.toContain(mount.exact);
        expect(text).toContain(mount.restricted);
      });
    }
  });

  describe("render — the prop explicitly true still prints the amount", () => {
    for (const mount of MOUNTS) {
      it(`${mount.name} prints the exact amount when the prop is true`, () => {
        const { container } = render(mount.granted());
        expect(container.textContent ?? "").toContain(mount.exact);
      });
    }
  });
});

// The three call sites the type change forced. Each had to answer, and the
// answer must be the caller's own value rather than a literal — a literal
// `true` would satisfy the compiler and reinstate the defect one level up,
// which is how it was authored the first time. Only a mount that RESTRICTS can
// tell the two apart, so that is what these assert.
//
// Scope, stated rather than implied: these assert the two CHILDREN the type
// change forced this component to answer for. AbarVaSourceDashboard also
// prints exact figures from its OWN body — "$98.3M under management", the
// value-at-stake KPI, "Value exposed $18.5M" — through `formatUsd` calls that
// never consulted any flag and that this item does not touch. That is filed
// separately; it is not fixed here and is not claimed to be.
describe("U-508 — the forced call sites pass their caller's value, not a literal", () => {
  function dashboardRegions(canView: boolean) {
    const { container } = render(
      <AbarVaSourceDashboard
        data={getSourceDashboardSeed()}
        canViewFinancialValues={canView}
      />,
    );
    return {
      all: container.textContent ?? "",
      table: container.querySelector("table")?.textContent ?? "",
    };
  }

  it("threads its own value into the alert panel and the event table", () => {
    const restricted = dashboardRegions(false);
    // The alert panel renders "<amount> exposed"; this phrasing is unique to it.
    expect(restricted.all).toContain("Restricted exposed");
    expect(restricted.all).not.toContain("$18.5M exposed");
    // The event table's value column is the second forced call site.
    expect(restricted.table).not.toMatch(/\$\d[\d.,]*[KMB]/);
    expect(restricted.table).toContain("Restricted");
  });

  it("still prints amounts in both children when granted", () => {
    const granted = dashboardRegions(true);
    expect(granted.all).toContain("$18.5M exposed");
    expect(granted.table).toMatch(/\$\d[\d.,]*[KMB]/);
  });
});

describe("U-508 — the type forces the caller to answer", () => {
  // Each suppression below is a compiler-run control. If the prop is made
  // optional again — or given a default — the error disappears and tsc fails
  // the build with "Unused '@ts-expect-error' directive". A gate that cannot
  // fail is not a gate; this one fails in the direction the defect reappears.
  it("rejects every omitted mount at compile time", () => {
    const rejected = [
      // @ts-expect-error U-508: canViewFinancialValues is required
      () => <SourcingEventTable events={[]} />,
      // @ts-expect-error U-508: canViewFinancialValues is required
      () => <SourceAlertPanel alerts={[]} />,
      // @ts-expect-error U-508: canViewFinancialValues is required
      () => <SentinelEngagementCanvas event={makeEventDetail()} />,
      () => (
        // @ts-expect-error U-508: canViewFinancialValues is required
        <SourceEventsPortfolio events={[]} activeStage={null} activeStatus={null} />
      ),
      () => (
        // @ts-expect-error U-508: canViewFinancialValues is required
        <SourcePortfolioPage events={[]} tenantName="t" searchParams={{}} />
      ),
      // @ts-expect-error U-508: canViewFinancialValues is required
      () => <SourcePortfolioBookPage events={[]} tenantName="t" />,
      // @ts-expect-error U-508: canViewFinancialValues is required
      () => <SourceValueLedger snapshot={makeLedger()} />,
      () => (
        // @ts-expect-error U-508: canViewFinancialValues is required
        <SourceOptimizeContractPage
          tenantName="t"
          asOfDateIso="2027-06-30T00:00:00.000Z"
          spine={makeSpine()}
          opportunitySet={null}
        />
      ),
    ];
    expect(rejected).toHaveLength(8);
  });
});
