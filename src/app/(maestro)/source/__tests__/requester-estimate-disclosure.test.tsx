/**
 * @jest-environment jsdom
 */

/**
 * Item U-514. `source_events.estimated_value_usd` is a number the requester
 * typed. Four Source surfaces render it; two of them said so and two printed
 * it bare, so on the approvals inbox and on the event approval page a
 * self-declared figure read exactly like a measured one — beside an event code
 * and a stage label, which are facts.
 *
 * These cases assert the qualifier from RENDERED OUTPUT. The byte-scan
 * equivalent ("the file contains 'Requester estimate'") is the check this
 * backlog keeps finding green over surfaces that render nothing of the kind,
 * so the page component is invoked and the assertion is made against the DOM
 * a reader would see.
 *
 * The false-positive direction is asserted too: `SourceValueLedger` renders
 * realized value — read from the ledger, not declared by a requester — and
 * must NOT pick up this label. A control that fires everywhere says nothing.
 */
import { render, screen } from "@testing-library/react";
import type { ReactNode } from "react";

jest.mock("server-only", () => ({}));

// ---------------------------------------------------------------------------
// Shell and navigation are not the subject: passthroughs, so the surfaces
// under test render their own content into the document.
// ---------------------------------------------------------------------------
jest.mock("@/components/shell/AppShell", () => ({
  AppShell: ({ children }: { children: ReactNode }) => <div>{children}</div>,
}));
jest.mock("@/components/source/SourceSubNav", () => ({
  SourceSubNav: () => null,
}));
jest.mock("@/components/source/SourceWorkingPane", () => ({
  SourceWorkingPane: ({ children }: { children: ReactNode }) => (
    <div>{children}</div>
  ),
}));
jest.mock("next/navigation", () => ({
  notFound: () => {
    throw new Error("notFound() was called; the fixture should not reach it");
  },
  redirect: (href: string) => {
    throw new Error(`redirect(${href}) was called; the fixture should not reach it`);
  },
  useRouter: () => ({ push: jest.fn(), refresh: jest.fn() }),
}));

const getActiveClientRow = jest.fn();
jest.mock("@/lib/active-client", () => ({
  getActiveClientRow: (...args: unknown[]) => getActiveClientRow(...args),
}));

const loadApprovalsInbox = jest.fn();
jest.mock("@/lib/source/approvals-inbox", () => ({
  loadApprovalsInbox: (...args: unknown[]) => loadApprovalsInbox(...args),
}));

// --- event approval page data plane -----------------------------------------
const getSourcingEvent = jest.fn();
// Mocked whole, not `requireActual`-spread: `@/lib/source/queries` imports the
// Clerk server SDK, whose ESM jest will not parse here, and the only other
// export this page uses is `isUuid`.
jest.mock("@/lib/source/queries", () => ({
  getSourcingEvent: (...args: unknown[]) => getSourcingEvent(...args),
  isUuid: (value: unknown) =>
    typeof value === "string" &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
      value,
    ),
}));

const requireTenancy = jest.fn();
jest.mock("@/lib/auth/tenancy", () => ({
  requireTenancy: (...args: unknown[]) => requireTenancy(...args),
}));

// The fixture viewer is PERMITTED to see exact financial values. That was
// implicit until item U-517: the page passed a literal `true` for
// `canViewFinancialValues`, so the policy's answer to that question was never
// read and the mock did not need to give one. It does now, and it is stated
// rather than defaulted, because this suite's subject is the provenance LABEL
// on a figure the viewer may see — a restricted viewer renders `Restricted`
// instead of the figure, which is U-517's subject and is asserted there.
jest.mock("@/lib/auth/source-access-policy", () => ({
  loadUserSourceAccessPolicy: jest.fn(async () => ({
    canApproveSourceStages: true,
    canViewFinancialData: true,
  })),
}));

let persistedEventRow: Record<string, unknown> | null = null;
jest.mock("@/lib/data-plane/postgresCompat", () => ({
  getAzureReadFluentClient: () => ({
    from: () => ({
      select: () => ({
        eq: () => ({
          eq: () => ({
            single: async () => ({ data: persistedEventRow, error: null }),
          }),
        }),
      }),
    }),
  }),
}));

jest.mock("@/lib/source/artifact-registry", () => ({
  listSourceArtifactsForSourceEventId: jest.fn(async () => []),
}));
jest.mock("@/lib/source/artifact-acceptances", () => ({
  getLatestArtifactAcceptancesByArtifactIds: jest.fn(async () => new Map()),
}));
jest.mock("@/lib/source/approval-ledger", () => ({
  loadApprovalLedger: jest.fn(async () => []),
}));
jest.mock("@/lib/source/contract-optimization/read", () => ({
  getContractOptimizationProfile: jest.fn(async () => null),
}));
jest.mock("@/lib/source/new-workspace/authority-version-store", () => ({
  readSourceAuthorityVersionState: jest.fn(async () => ({
    kind: "unavailable" as const,
  })),
}));
jest.mock("@/lib/features/is-feature-enabled", () => ({
  isFeatureEnabled: jest.fn(() => false),
}));

const CLIENT = { key: "meridian-grid", name: "Meridian Grid" };

const EVENT_ROW = {
  id: "11111111-2222-4333-8444-555555555555",
  client_key: "meridian-grid",
  event_code: "SRC-0042",
  event_name: "Network operations managed service",
  event_type: "managed_service",
  sourcing_motion: "competitive_rfp",
  current_stage_key: "intake",
  lifecycle_state: "waiting_on_client",
  linked_program_id: null,
  estimated_value_usd: 4_200_000,
  trigger_description: "Incumbent term expires and scope has drifted.",
  scope_description: "Scope boundary: Tier 1 and Tier 2 network operations.",
  decision_owner: "VP Network Operations",
  created_by_user_id: "user-7",
  created_at: "2026-02-03T10:00:00.000Z",
  updated_at: "2026-02-04T10:00:00.000Z",
};

async function renderApprovalsInbox() {
  const { default: SourceApprovalsPage } = await import(
    "@/app/(maestro)/source/approvals/page"
  );
  render(await SourceApprovalsPage());
}

async function renderEventApproval() {
  const { default: SourceEventApprovalPage } = await import(
    "@/app/(maestro)/source/events/[eventId]/approval/page"
  );
  render(
    await SourceEventApprovalPage({
      params: Promise.resolve({ eventId: EVENT_ROW.id }),
    }),
  );
}

beforeEach(() => {
  jest.clearAllMocks();
  persistedEventRow = { ...EVENT_ROW };
  getActiveClientRow.mockResolvedValue(CLIENT);
  requireTenancy.mockResolvedValue({
    userId: "user-7",
    clientKey: "meridian-grid",
  });
  getSourcingEvent.mockResolvedValue({
    id: EVENT_ROW.id,
    code: EVENT_ROW.event_code,
    name: EVENT_ROW.event_name,
    accountName: "Meridian Grid",
  });
  loadApprovalsInbox.mockResolvedValue({
    items: [
      {
        kind: "intake_approval",
        eventId: EVENT_ROW.id,
        eventCode: "SRC-0042",
        eventName: "Network operations managed service",
        ask: "Approve the request so sourcing can start.",
        readiness: "3 of 3 intake facts captured",
        status: "ready",
        stageKey: "intake",
        stageLabel: "Intake",
        estimatedValueUsd: 4_200_000,
        href: `/source/events/${EVENT_ROW.id}/approval`,
        actionLabel: "Review request",
      },
    ],
    intakeCount: 1,
    gateReadyCount: 0,
  });
});

describe("U-514 · the approvals inbox qualifies the requester's declared estimate", () => {
  it("renders the figure with the requester-estimate label and the not-validated qualifier", async () => {
    await renderApprovalsInbox();

    // The metadata line is one text node chain: event code · stage · figure.
    const metadata = screen.getByText(/SRC-0042/);
    expect(metadata.textContent).toContain("$4.2M");
    expect(metadata.textContent).toMatch(/Requester estimate/i);
    expect(metadata.textContent).toMatch(/not validated/i);
  });

  it("says nothing about a requester estimate when the row carries no figure", async () => {
    loadApprovalsInbox.mockResolvedValue({
      items: [
        {
          kind: "intake_approval",
          eventId: EVENT_ROW.id,
          eventCode: "SRC-0043",
          eventName: "Field services",
          ask: "Approve the request so sourcing can start.",
          readiness: "3 of 3 intake facts captured",
          status: "ready",
          stageKey: "intake",
          stageLabel: "Intake",
          estimatedValueUsd: null,
          href: `/source/events/${EVENT_ROW.id}/approval`,
          actionLabel: "Review request",
        },
      ],
      intakeCount: 1,
      gateReadyCount: 0,
    });
    await renderApprovalsInbox();

    expect(screen.queryByText(/Requester estimate/i)).toBeNull();
  });
});

describe("U-514 · the event approval page qualifies the declared estimate it falls back to", () => {
  /**
   * The page renders the value-target fact TWICE — once in the brief `<dl>`
   * above the fold and once inside `IntakeFactsReview` — so every rendering is
   * asserted. Reading only the first would let the other keep printing the
   * bare figure.
   */
  function valueTargetRenderings(): string[] {
    const labels = screen.getAllByText("Value or savings target");
    expect(labels.length).toBeGreaterThan(0);
    return labels.map((label) => label.parentElement?.textContent ?? "");
  }

  it("labels every rendering of the fact it builds from the declared figure", async () => {
    await renderEventApproval();

    const renderings = valueTargetRenderings();
    expect(renderings).toHaveLength(2);
    for (const text of renderings) {
      expect(text).toContain("$4.2M");
      expect(text).toMatch(/Requester estimate/i);
      expect(text).toMatch(/not validated/i);
    }
  });

  it("does not relabel a value target the intake captured in its own words", async () => {
    persistedEventRow = {
      ...EVENT_ROW,
      scope_description:
        "Scope boundary: Tier 1 and Tier 2 network operations.\nValue target: Hold contracted annual value flat against the signed agreement.",
    };
    await renderEventApproval();

    const renderings = valueTargetRenderings();
    expect(renderings).toHaveLength(2);
    for (const text of renderings) {
      expect(text).toContain("Hold contracted annual value flat");
      expect(text).not.toMatch(/Requester estimate/i);
    }
  });
});

describe("U-514 · the label does not spread to a measured figure", () => {
  it("leaves realized ledger value unlabelled on the Source value ledger", async () => {
    const { SourceValueLedger } = await import(
      "@/components/source/SourceValueLedger"
    );
    const entry = {
      id: "vl-1",
      eventId: EVENT_ROW.id,
      eventName: "Network operations managed service",
      kind: "realized" as const,
      label: "Renegotiated support tier",
      stageKey: null,
      amountUsd: 4_200_000,
      confidence: "high" as const,
      evidenceCount: 3,
      note: "Read from the executed amendment.",
    };
    render(
      <SourceValueLedger
        snapshot={{
          updatedAt: "2026-03-01T00:00:00.000Z",
          projected: [],
          realized: [entry],
        }}
        canViewFinancialValues
      />,
    );

    expect(screen.queryByText(/Requester estimate/i)).toBeNull();
  });
});
