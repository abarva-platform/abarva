/**
 * @jest-environment jsdom
 */

/**
 * U-520 — the three ROUTE-MOUNTED Source components that print exact financial
 * magnitudes with no entitlement flag anywhere in the file.
 *
 * This is the third item in the family. `U-508` removed a fail-open default
 * from eight components that already read `canViewFinancialValues`; `U-509`
 * fixed a component that took the prop and ignored it in its body. These three
 * never asked the question at all — none of the files contained the string
 * before this change — so there was nothing to thread and nothing to flip.
 *
 * WHY ONLY THREE, when the item names seven components and nineteen sites.
 * Reachability was settled first, from the route tree and from a REGENERATED
 * `docs/architecture/unreachable-components.json` rather than the committed
 * copy, because a fix mounted inside a component no route reaches is the
 * failure this lane keeps rediscovering: an assertion that stays green over a
 * surface no reader can open.
 *
 *   route-mounted, fixed here — 12 of the 19 sites
 *     RenewalCockpitView                 9  /source/renewal/[contractId]
 *     VendorResponseDecisionProofPanel   2  /source/events/[eventId]
 *                                           -> SourceAnalyticsCanvas
 *                                           -> ResponsesStageView
 *     SourceExecutionRoomPage            1  /source/renewal/[contractId]/execution
 *
 *   declared unreachable, NOT fixed here — 7 of the 19 sites
 *     SourceDecisionQueueView            3  orphan; only test importers
 *     BafoScenarioComparePanel           3  its only importer, BafoStageView,
 *                                           is itself an orphan
 *     SourcePortfolioReactivePanel       1  orphan; only its own suite
 *
 * 12 + 7 = 19, which reconciles with the count the item measured.
 *
 * MECHANISM, and why it is the prop rather than redaction-before-arrival. The
 * item offers both and says redaction is stronger where a component takes a
 * typed payload. None of these three does, in the relevant sense: every figure
 * below is DERIVED inside the component or inside a builder it calls
 * (`buildRenewalCockpit`, `buildSourceBafoLeverageOptimizer`,
 * `loadExecutionRoom`), so there is no arriving field to remove. Redacting the
 * inputs instead would have to zero the numbers, and a zeroed should-cost range
 * renders as "$0-$0" — which reads as a real benchmark of zero rather than as a
 * figure withheld. A required flag plus the existing flag-taking helper prints
 * the literal label, which is honest about what happened.
 *
 * The helper is `formatSourceFinancialValue(value, canViewFinancialValues)`,
 * which already existed: two required parameters, so omitting the flag is a
 * COMPILE error rather than a silent grant. That is the point the item makes
 * about consolidation — the eight duplicate local `formatUsd` definitions are
 * not the defect and a shared ungated `formatUsd` would not be an improvement
 * over them. Only the three reachable components' formatters are replaced.
 *
 * BOTH DIRECTIONS, PER COMPONENT, ASSERTED AGAINST THE LABEL BESIDE IT. A
 * restricted-only assertion is satisfied by a component that restricts
 * unconditionally, and a container-wide granted assertion is satisfied by a
 * sibling panel's figure — that is how `U-509`'s first draft passed 10 of 10
 * over a component that never consulted the flag. So each case below reads the
 * figure from the element that owns it and asserts the granted direction too.
 */

import "@testing-library/jest-dom";
import { render } from "@testing-library/react";

/*
 * `SourceExecutionRoomPage` imports `@/lib/notifications`, which reaches the
 * notification store, the Azure read adapter and the pg driver — none of which
 * is under test here and none of which loads under jsdom. The two functions it
 * actually calls are pure over the room, so they are stubbed to their real
 * shapes rather than the module being faked wholesale.
 */
jest.mock("@/lib/notifications", () => ({
  buildSourceExecutionRoomNotifications: () => [],
  routeNotification: () => ({ channels: [], suppressed: true }),
}));

/* The canvas mount below is a client component behind the router and Clerk. */
jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: jest.fn(), replace: jest.fn(), refresh: jest.fn() }),
  usePathname: () => "/source/events/evt-u520",
  useSearchParams: () => new URLSearchParams(),
  useParams: () => ({ eventId: "evt-u520" }),
}));
jest.mock("@clerk/nextjs", () => ({
  useUser: () => ({ isLoaded: true, user: null }),
  useClerk: () => ({ signOut: jest.fn() }),
  ClerkProvider: ({ children }: { children: React.ReactNode }) => children,
  SignedIn: ({ children }: { children: React.ReactNode }) => children,
  SignedOut: () => null,
  UserButton: () => null,
}));

import type { VendorContractInput } from "@/lib/source/decision-queue/detector-inputs";
import {
  buildRenewalCockpit,
  type RenewalCockpit,
  type RenewalCockpitInput,
} from "@/lib/source/renewal-cockpit/cockpit";
import { buildVendorResponseParseReport } from "@/lib/source/proposal-intelligence";
import { RESTRICTED_SOURCE_FINANCIAL_LABEL } from "@/lib/source/financial-display";

import { buildExecutionRoom } from "@/lib/source/execution-room/execution-room";

import { RenewalCockpitView } from "../RenewalCockpitView";
import { SourceExecutionRoomPage } from "../SourceExecutionRoomPage";
import type { SourcingEventSummary } from "@/lib/source/types";

import { SourceAnalyticsCanvas } from "../canvas/analytics/SourceAnalyticsCanvas";
import { ResponsesStageView } from "../canvas/responses/ResponsesStageView";
import { VendorResponseDecisionProofPanel } from "../canvas/responses/VendorResponseDecisionProofPanel";

const AS_OF = new Date("2026-05-17T00:00:00Z");

/** A magnitude pattern, so a case cannot pass by matching some other figure. */
const EXACT_MAGNITUDE = /\$[\d,]{4,}/;

function isoOffset(days: number): string {
  const d = new Date(AS_OF);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

function contract(overrides: Partial<VendorContractInput> = {}): VendorContractInput {
  return {
    contractId: "vc:u520",
    vendorName: "TestVendor",
    product: "Test Product",
    category: "crm",
    annualSpendUsd: 500_000,
    termEndDate: isoOffset(120),
    autoRenew: false,
    noticePeriodDays: null,
    utilizationRate: 0.9,
    criticality: "medium",
    ...overrides,
  };
}

function cockpitInput(overrides: Partial<RenewalCockpitInput> = {}): RenewalCockpitInput {
  return {
    clientKey: "apexretail",
    contract: contract(),
    categoryBenchmarkUsd: 420_000,
    alternatives: [
      {
        vendorName: "AlternativeVendor",
        indicativeAnnualUsd: 310_000,
        switchingNote: "Indicative only",
      },
    ],
    asOf: AS_OF,
    ...overrides,
  };
}

function cockpit(): RenewalCockpit {
  return buildRenewalCockpit(cockpitInput());
}

function canvasEvent(): SourcingEventSummary {
  return {
    id: "evt-u520",
    code: "U520-2026",
    name: "U520 sourcing event",
    accountName: "Demo account",
    leadAgent: "Sentinel",
    archetype: "AMS",
    rigor: "standard",
    status: "active",
    statusLabel: "Active",
    priority: "high",
    currentStageKey: "responses",
    currentStageLabel: "Responses",
    openAlerts: 0,
    owner: "Owner",
    agingDays: 4,
    blocker: null,
    nextAction: "Confirm response coverage",
    isAtRisk: false,
    valueAtStakeUsd: 0,
    projectedValueUsd: 0,
    realizedValueUsd: 0,
    nextDecision: "Approve responses gate",
  } as SourcingEventSummary;
}

function executionRoom() {
  return buildExecutionRoom(cockpit(), AS_OF);
}

/**
 * The panel's figure is the EVIDENCED BAFO leverage range, and a lever only
 * counts as evidenced when the report carries an annual run rate — which comes
 * from a priced pricing workbook. The MVE-profile fixture the panel's own suite
 * uses produces only `opportunity_to_test` levers, so the card renders "5 to
 * test" and no magnitude at all.
 *
 * That matters more than a fixture detail: a restricted-direction assertion over
 * that fixture PASSES over the unfixed component, because there is no figure to
 * find. The non-vacuity guard above is what surfaced it. So this builds reports
 * with a priced workbook, reaching the branch the item is actually about.
 */
function parseReports() {
  return [
    buildVendorResponseParseReport({
      sourceEventId: "source-event-u520",
      tenantKey: "tenant-u520",
      vendorName: "Vendor Alpha",
      responseVersion: 1,
      requiredSections: [
        "Scope confirmation",
        "Pricing template",
        "SLA response",
        "Staffing model",
        "Transition plan",
        "Security and compliance response",
        "Automation / productivity roadmap",
      ],
      documents: [
        {
          fileName: "vendor-alpha-main-response.pdf",
          role: "response_package",
          text: [
            "Scope: Vendor Alpha confirms all in-scope work.",
            "SLA response: Service credits apply, but the earn-back is easy.",
            "Staffing model: Named FTE locations and shift coverage are provided.",
            "Transition plan: Transition fee is not at risk and is not milestone-gated.",
            "Security and compliance response: SOC 2 bridge letter is included.",
            "Automation productivity roadmap: Productivity is not committed in price.",
          ].join("\n\n"),
        },
        {
          fileName: "vendor-alpha-pricing.xlsx",
          role: "pricing_workbook",
          text: "Pricing: year one run-rate 10000000 with tower breakout and uncapped pass-through tooling.",
        },
      ],
    }),
  ];
}

/**
 * The fixture must actually contain magnitudes in the granted direction, or
 * every restricted assertion below is vacuous — a component rendering no
 * figures at all would pass them. This runs first for that reason.
 */
describe("U-520 — the fixtures carry exact magnitudes when granted", () => {
  it("the renewal cockpit prints magnitudes for a granted reader", () => {
    const { container } = render(
      <RenewalCockpitView cockpit={cockpit()} canViewFinancialValues />,
    );
    expect(container.textContent ?? "").toMatch(EXACT_MAGNITUDE);
  });

  it("the decision proof panel prints a magnitude for a granted reader", () => {
    const { container } = render(
      <VendorResponseDecisionProofPanel
        parseReports={parseReports()}
        canViewFinancialValues
      />,
    );
    expect(container.textContent ?? "").toMatch(EXACT_MAGNITUDE);
  });

  it("the execution room prints a magnitude for a granted reader", () => {
    const { container } = render(
      <SourceExecutionRoomPage room={executionRoom()} canViewFinancialValues />,
    );
    expect(container.textContent ?? "").toMatch(EXACT_MAGNITUDE);
  });

  /**
   * The execution room is redacted by a DEEP walk over its view model, which is
   * the one mechanism here that could quietly damage a granted reader's page —
   * a named-field redactor can only miss fields, a deep one can also touch the
   * wrong ones. So the granted path is asserted to be byte-identical to a render
   * of the untouched room, which is the property the redactor's comment claims
   * and would otherwise merely assert about itself.
   */
  it("the deep prose redaction is a strict no-op for a granted reader", () => {
    const room = executionRoom();
    const { container } = render(
      <SourceExecutionRoomPage room={room} canViewFinancialValues />,
    );
    const text = container.textContent ?? "";

    // Read the builder's own sentences back off the DOM, verbatim. Comparing two
    // granted renders would prove nothing — the redactor early-returns when
    // granted, so both sides would be the same object. What has to hold is that
    // the ORIGINAL prose, magnitudes included, survives untouched.
    expect(room.statusRationale).toMatch(/\S/);
    expect(text).toContain(room.statusRationale);
    expect(text).toContain(room.nextBestAction);
    expect(text).toContain(room.rebidReadiness.rationale);

    const withMagnitude = room.actions
      .map((action) => action.evidenceBasis)
      .filter((basis) => EXACT_MAGNITUDE.test(basis));
    expect(withMagnitude.length).toBeGreaterThan(0);
    for (const basis of withMagnitude) expect(text).toContain(basis);

    expect(text).not.toContain("restricted financial value");
  });
});

describe("U-520 — SourceExecutionRoomPage gates its annual-spend metric", () => {
  it("prints no exact magnitude when the reader is restricted", () => {
    const { container } = render(
      <SourceExecutionRoomPage
        room={executionRoom()}
        canViewFinancialValues={false}
      />,
    );
    expect(container.textContent ?? "").not.toMatch(EXACT_MAGNITUDE);
  });

  /**
   * The one site is a labelled metric, so the label must survive: a reader has
   * to see that an annual spend exists and is withheld, not that the surface
   * has no spend. "No magnitude" alone would be satisfied by dropping the tile.
   */
  it("keeps the Annual spend metric present and labelled restricted", () => {
    const { container } = render(
      <SourceExecutionRoomPage
        room={executionRoom()}
        canViewFinancialValues={false}
      />,
    );
    const text = container.textContent ?? "";
    expect(text).toContain("Annual spend");
    expect(text).toContain(RESTRICTED_SOURCE_FINANCIAL_LABEL);
  });
});

describe("U-520 — RenewalCockpitView gates all nine of its financial sites", () => {
  /**
   * Nine sites, and they are asserted as a SET rather than one at a time,
   * because the failure that matters is one site left ungated while its
   * neighbours are fixed. A whole-container scan catches exactly that: any
   * surviving `formatUsd` call prints a magnitude into this text.
   */
  it("prints no exact magnitude anywhere when the reader is restricted", () => {
    const { container } = render(
      <RenewalCockpitView cockpit={cockpit()} canViewFinancialValues={false} />,
    );
    const text = container.textContent ?? "";
    expect(text).not.toMatch(EXACT_MAGNITUDE);
    expect(text).toContain(RESTRICTED_SOURCE_FINANCIAL_LABEL);
  });

  /**
   * The should-cost range is the site that most needs the label rather than a
   * zero: "Should-cost low $0 / high $0" is a statement about the benchmark,
   * not about the reader's entitlement. Read off the owning card so a sibling
   * cannot absorb the assertion.
   */
  it("labels the should-cost range restricted instead of zeroing it", () => {
    const { container } = render(
      <RenewalCockpitView cockpit={cockpit()} canViewFinancialValues={false} />,
    );
    const card = Array.from(container.querySelectorAll("section")).find((s) =>
      (s.textContent ?? "").includes("Should-cost low"),
    );
    expect(card).toBeDefined();
    const cardText = card?.textContent ?? "";
    expect(cardText).toContain(RESTRICTED_SOURCE_FINANCIAL_LABEL);
    expect(cardText).not.toMatch(/\$0\b/);
    expect(cardText).not.toMatch(EXACT_MAGNITUDE);
  });

  /**
   * The evidence-trace claim labels are a second, separate escape: they compose
   * the amount into a STRING passed as a prop rather than rendering it as a
   * child, so a fix applied only to visible text would leave the magnitude in
   * the trace trigger's label. Asserted here because the item's "both
   * directions per changed site" is about sites, not about visible text.
   */
  it("keeps the amount out of the evidence-trace claim labels too", () => {
    const { container } = render(
      <RenewalCockpitView cockpit={cockpit()} canViewFinancialValues={false} />,
    );
    const labelled = Array.from(container.querySelectorAll("[aria-label]"));
    for (const el of labelled) {
      expect(el.getAttribute("aria-label") ?? "").not.toMatch(EXACT_MAGNITUDE);
    }
  });
});

describe("U-520 — VendorResponseDecisionProofPanel gates its BAFO leverage range", () => {
  it("prints no exact magnitude when the reader is restricted", () => {
    const { container } = render(
      <VendorResponseDecisionProofPanel
        parseReports={parseReports()}
        canViewFinancialValues={false}
      />,
    );
    expect(container.textContent ?? "").not.toMatch(EXACT_MAGNITUDE);
  });

  /**
   * The panel's own structure is the assertion target: the BAFO card must still
   * be present and still say something, or "no magnitude" could be satisfied by
   * a panel that stopped rendering. This is the "assert the destination"
   * discipline applied to a redaction.
   */
  it("still renders the BAFO leverage card, labelled rather than blank", () => {
    const { container } = render(
      <VendorResponseDecisionProofPanel
        parseReports={parseReports()}
        canViewFinancialValues={false}
      />,
    );
    const text = container.textContent ?? "";
    expect(text).toContain("BAFO leverage");
    expect(text).toContain(RESTRICTED_SOURCE_FINANCIAL_LABEL);
  });
});

/**
 * The compiler-run half. Each suppression fails `tsc --noEmit` the moment the
 * prop is made optional again or given a default, because an unused
 * `@ts-expect-error` is itself an error. This is the control that survives a
 * rename; the render cases above are the control that survives a type-only
 * change. Neither alone is sufficient, which is why both are here — the same
 * two-layer shape U-508 established.
 */
describe("U-520 — the type forces each caller to answer", () => {
  it("rejects every omitted mount at compile time", () => {
    const rejected = [
      // @ts-expect-error U-520: canViewFinancialValues is required
      () => <RenewalCockpitView cockpit={cockpit()} />,
      // @ts-expect-error U-520: canViewFinancialValues is required
      () => <VendorResponseDecisionProofPanel parseReports={parseReports()} />,
      // @ts-expect-error U-520: canViewFinancialValues is required
      () => <SourceExecutionRoomPage room={executionRoom()} />,
    ];
    expect(rejected).toHaveLength(3);
  });
});

/**
 * The run-time direction of the same requirement. A JavaScript caller, or an
 * `any`-typed mount, reaches the component with the prop absent; `undefined`
 * must read as "no". A component that wrote `canViewFinancialValues !== false`
 * would pass every case above and fail these.
 */
describe("U-520 — the prop absent at run time reads as NO", () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const omit = (Component: any, props: Record<string, unknown>) => (
    <Component {...props} />
  );

  it("RenewalCockpitView fails closed with the prop absent", () => {
    const { container } = render(omit(RenewalCockpitView, { cockpit: cockpit() }));
    expect(container.textContent ?? "").not.toMatch(EXACT_MAGNITUDE);
  });

  it("VendorResponseDecisionProofPanel fails closed with the prop absent", () => {
    const { container } = render(
      omit(VendorResponseDecisionProofPanel, { parseReports: parseReports() }),
    );
    expect(container.textContent ?? "").not.toMatch(EXACT_MAGNITUDE);
  });

  it("SourceExecutionRoomPage fails closed with the prop absent", () => {
    const { container } = render(
      omit(SourceExecutionRoomPage, { room: executionRoom() }),
    );
    expect(container.textContent ?? "").not.toMatch(EXACT_MAGNITUDE);
  });
});

/**
 * The THREADING, asserted separately from the components.
 *
 * Every case above mounts a leaf directly, which says nothing about whether its
 * ancestors pass the reader's real answer down. A mutation proved that gap was
 * live: replacing the canvas's `canViewFinancialValues={canViewFinancialValues}`
 * with a literal `true` left all fifteen cases green. That is not a hypothetical
 * failure mode — it is how the whole family was authored the first time, and
 * `U-508`'s record says so in as many words: "the answer must be the caller's
 * own value rather than a literal — a literal `true` would satisfy the compiler
 * and reinstate the defect one level up".
 *
 * Only a mount that RESTRICTS can tell a pass-through from a literal, so that is
 * what these do: drive the intermediate view with `false` and read the leaf.
 */
describe("U-520 — the intermediate views pass their caller's value, not a literal", () => {
  it("ResponsesStageView carries a restricting answer into the decision proof panel", () => {
    const { container } = render(
      <ResponsesStageView
        parseReports={parseReports()}
        canViewFinancialValues={false}
        documentWorkspace={null}
      />,
    );
    const text = container.textContent ?? "";
    // The panel is genuinely mounted — otherwise "no magnitude" is vacuous.
    expect(text).toContain("BAFO leverage");
    expect(text).not.toMatch(EXACT_MAGNITUDE);
  });

  it("ResponsesStageView still carries a granting answer through", () => {
    const { container } = render(
      <ResponsesStageView
        parseReports={parseReports()}
        canViewFinancialValues
        documentWorkspace={null}
      />,
    );
    expect(container.textContent ?? "").toMatch(EXACT_MAGNITUDE);
  });

  /**
   * The full route chain, mounted. `/source/events/[eventId]` renders the canvas,
   * the canvas renders `ResponsesStageView`, and that renders the panel — two
   * hops, and the case above only covers the second. Mutating the canvas's
   * pass-through to a literal `true` left all seventeen other cases green, so
   * this is the only assertion standing between that mutation and production.
   */
  it("SourceAnalyticsCanvas carries a restricting answer down the whole chain", () => {
    const { container } = render(
      <SourceAnalyticsCanvas
        event={canvasEvent()}
        viewStage="responses"
        tenantName="Demo account"
        vendorResponseParseReports={parseReports()}
        canViewFinancialValues={false}
      />,
    );
    const text = container.textContent ?? "";
    // The leaf really is on screen — otherwise this proves nothing.
    expect(text).toContain("BAFO leverage");
    expect(text).not.toMatch(EXACT_MAGNITUDE);
  });

  it("SourceAnalyticsCanvas carries a granting answer down the whole chain", () => {
    const { container } = render(
      <SourceAnalyticsCanvas
        event={canvasEvent()}
        viewStage="responses"
        tenantName="Demo account"
        vendorResponseParseReports={parseReports()}
        canViewFinancialValues
      />,
    );
    expect(container.textContent ?? "").toMatch(EXACT_MAGNITUDE);
  });
});
