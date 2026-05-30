/**
 * SetupAuditPage broker-wiring tests · Wave 2 PR-E (2026-05-30).
 *
 * Closes the P0 Apex-leak: SetupAuditPage now reads via the
 * tenant-scoped `getAdminAuditEvents` broker, not the Apex-only
 * `AUDIT_LOG_FIXTURE`.
 *
 * Contract under test:
 *   1. Apex tenant — broker returns events → page renders rows
 *      with Apex content.
 *   2. Non-Apex tenant — broker returns [] → page renders the clean
 *      empty state ("No activity in this tenant yet.").
 *   3. Filter scoping — when a `filterSource` is supplied AND broker
 *      returns rows, only matching-surface rows are rendered.
 *   4. Empty-state language is honest — "No activity in this tenant
 *      yet." when the broker is empty, vs. "No audit events match
 *      this filter." when the filter excluded all rows.
 */

import { renderToStaticMarkup } from "react-dom/server";

import type { AdminAuditEvent } from "@/lib/admin/data/admin-audit-log-adapter-types";

const mockGetAdminAuditEvents = jest.fn<
  Promise<ReadonlyArray<AdminAuditEvent>>,
  [string]
>();

jest.mock("@/lib/admin/data/admin-audit-log-adapter", () => ({
  getAdminAuditEvents: (tenantSlug: string) =>
    mockGetAdminAuditEvents(tenantSlug),
}));

// SetupAuditPage is an async server component. Importing here after
// the mock is registered so the module sees the mocked broker.
import { SetupAuditPage } from "../SetupAuditPage";

const APEX_EVENTS: ReadonlyArray<AdminAuditEvent> = [
  {
    id: "a1",
    category: "approval",
    action: "approved_decision_grade",
    actorPersonId: "usr_001",
    actorDisplayName: "Sundaram",
    targetKind: "admin_datasets",
    targetId: "apex_outcome_lock_v1",
    summary:
      "Sundaram (MAESTRO) approved decision grade — rung decision_grade",
    createdAt: "2026-04-25T09:00:00.000Z",
  },
  {
    id: "a2",
    category: "dataset",
    action: "ingested",
    actorPersonId: "team:apex-it",
    actorDisplayName: "Apex IT",
    targetKind: "admin_datasets",
    targetId: "apex_pos_raw",
    summary: "Apex IT (TENANT) ingested — rung loaded",
    createdAt: "2026-04-22T10:14:00.000Z",
  },
];

async function renderPage(
  tenantSlug: string,
  filterSource: Parameters<typeof SetupAuditPage>[0]["filterSource"] = null,
): Promise<string> {
  const tree = await SetupAuditPage({ tenantSlug, filterSource });
  return renderToStaticMarkup(tree);
}

describe("SetupAuditPage (broker wiring)", () => {
  beforeEach(() => {
    mockGetAdminAuditEvents.mockReset();
  });

  it("calls the broker with the given tenantSlug", async () => {
    mockGetAdminAuditEvents.mockResolvedValueOnce([]);
    await renderPage("first-capital");
    expect(mockGetAdminAuditEvents).toHaveBeenCalledWith("first-capital");
  });

  it("renders Apex events for the Apex tenant", async () => {
    mockGetAdminAuditEvents.mockResolvedValueOnce(APEX_EVENTS);
    const html = await renderPage("apex-retail");
    // The humanized action and the broker-provided summary are both
    // visible (the row chrome carries them in distinct lines).
    expect(html).toContain("Approved decision grade");
    expect(html).toContain("Sundaram (MAESTRO) approved decision grade");
    expect(html).toContain("Ingested");
    expect(html).toContain("Apex IT (TENANT) ingested");
    expect(html).toContain("Audit log · 2 events");
  });

  it("renders the tenant-empty state for non-Apex tenants", async () => {
    mockGetAdminAuditEvents.mockResolvedValueOnce([]);
    const html = await renderPage("first-capital");
    expect(html).toContain("No activity in this tenant yet.");
    // Crucially, must NOT leak Apex content.
    expect(html).not.toContain("APX-CDP-2026");
    expect(html).not.toContain("apex_outcome_lock_v1");
    expect(html).not.toContain("ServiceNow OAuth");
    expect(html).toContain("Audit log · 0 events");
  });

  it("renders the tenant-empty state for all non-Apex demo tenants", async () => {
    for (const tenantSlug of [
      "meridian",
      "first-capital",
      "northstar-clinical",
      "skyharbor-air",
    ]) {
      mockGetAdminAuditEvents.mockResolvedValueOnce([]);
      const html = await renderPage(tenantSlug);
      expect(html).toContain("No activity in this tenant yet.");
      expect(html).not.toContain("apex_");
    }
  });

  it("applies the source filter on top of broker results", async () => {
    mockGetAdminAuditEvents.mockResolvedValueOnce(APEX_EVENTS);
    // approval filter only keeps surface=Programs (category=approval)
    const html = await renderPage("apex-retail", "approval");
    expect(html).toContain("Audit log · Approval · 1 event");
    expect(html).toContain("Approved decision grade");
    expect(html).not.toContain("Ingested");
  });

  it("distinguishes filter-empty from tenant-empty", async () => {
    // Broker returns rows, but all rows are Programs (approval); a
    // policy/auth filter (surface=Setup) would normally match these
    // datasets/connectors. Here we pass an approval-only event set
    // through the `policy` filter, which maps to surface=Setup, so
    // it filters everything out.
    mockGetAdminAuditEvents.mockResolvedValueOnce([APEX_EVENTS[0]]);
    const html = await renderPage("apex-retail", "policy");
    expect(html).toContain("No audit events match this filter.");
    expect(html).not.toContain("No activity in this tenant yet.");
  });
});
