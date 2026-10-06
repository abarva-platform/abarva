const withSession = jest.fn();

jest.mock("@/lib/data-plane/azureRead", () => ({
  azureRead: { withSession: (fn: unknown) => withSession(fn) },
}));

import {
  readContractVendorLegalEntityIds,
  toVendorPanelContractInput,
} from "@/lib/source/candidate-suppliers/contract-vendor-repository";
import { buildVendorPanelProjection } from "@/lib/source/candidate-suppliers/vendor-panel-projection";
import {
  buildCandidateSupplierRegistrySlice,
  type CandidateSupplierAuthorityRow,
} from "@/lib/source/candidate-suppliers/candidate-supplier-authority";

/**
 * `source.contract.vendor_id` is nullable, so "no vendors came back" has
 * three causes and only one of them is an answer. The panel refuses to
 * render when the answer is unknown, and that refusal is worth nothing
 * unless something upstream can tell the three apart.
 *
 * The last case is the one that justifies the module: it drives the real
 * panel from a real read, because a reader that returns the right shape
 * while the panel is wired to it incorrectly is still the defect.
 */

type QueryResult = unknown[] | Error;

/** Drive the module against a scripted sequence of query results. */
function scriptQueries(results: QueryResult[]) {
  withSession.mockImplementation(async (fn: (run: unknown) => unknown) => {
    const queue = [...results];
    const run = async () => {
      const next = queue.shift();
      if (next instanceof Error) throw next;
      return next ?? [];
    };
    return fn(run);
  });
}

const SET_CONFIG: QueryResult = [];

beforeEach(() => {
  withSession.mockReset();
});

describe("reading which vendors are already under contract", () => {
  it("reports a tenant with no contracts as an answer, not an outage", () => {
    scriptQueries([
      SET_CONFIG,
      [{ contract_count: 0, linked_count: 0, resolved_count: 0 }],
    ]);

    return readContractVendorLegalEntityIds("t1").then((read) => {
      expect(read.state).toBe("no_contracts");
      expect(read.legalEntityIds).toEqual([]);
      expect(toVendorPanelContractInput(read).contractEvidenceAvailable).toBe(true);
    });
  });

  it("refuses to call an unpopulated linkage an empty one", async () => {
    // The defect this module exists to prevent. 40 contracts, not one
    // naming a vendor: the question has not been answered.
    scriptQueries([
      SET_CONFIG,
      [{ contract_count: 40, linked_count: 0, resolved_count: 0 }],
    ]);

    const read = await readContractVendorLegalEntityIds("t1");

    expect(read.state).toBe("linkage_unpopulated");
    expect(read.legalEntityIds).toEqual([]);
    expect(read.note).toContain("unknown rather than none");
    expect(toVendorPanelContractInput(read).contractEvidenceAvailable).toBe(false);
  });

  it("returns the resolved vendor ids when the linkage is populated", async () => {
    scriptQueries([
      SET_CONFIG,
      [{ contract_count: 3, linked_count: 3, resolved_count: 3 }],
      [{ vendor_id: "v-a" }, { vendor_id: "v-b" }],
    ]);

    const read = await readContractVendorLegalEntityIds("t1");

    expect(read.state).toBe("available");
    expect(read.legalEntityIds).toEqual(["v-a", "v-b"]);
    expect(read.unresolvedVendorReferences).toBe(0);
  });

  it("counts contracts naming a vendor no canonical row matches", async () => {
    // Dropped rows are how a register and a vendor master drift apart
    // without anyone noticing.
    scriptQueries([
      SET_CONFIG,
      [{ contract_count: 5, linked_count: 5, resolved_count: 2 }],
      [{ vendor_id: "v-a" }, { vendor_id: "v-b" }],
    ]);

    const read = await readContractVendorLegalEntityIds("t1");

    expect(read.state).toBe("available");
    expect(read.unresolvedVendorReferences).toBe(3);
  });

  it("reports a failed query as unavailable rather than as an empty register", async () => {
    scriptQueries([SET_CONFIG, new Error("relation does not exist")]);

    const read = await readContractVendorLegalEntityIds("t1");

    expect(read.state).toBe("unavailable");
    expect(toVendorPanelContractInput(read).contractEvidenceAvailable).toBe(false);
  });

  it("says a summary query returned no row, rather than crashing into the same state", async () => {
    // Without the explicit guard the outer catch still reaches
    // `unavailable`, by way of a TypeError — same state, no idea why. The
    // note is what separates a decision from an accident, so it is what
    // this case asserts.
    scriptQueries([SET_CONFIG, []]);

    const read = await readContractVendorLegalEntityIds("t1");

    expect(read.state).toBe("unavailable");
    expect(read.note).toBe("The contract register returned no summary row.");
  });

  it("refuses without a tenant key, and never opens a session to find out", async () => {
    const read = await readContractVendorLegalEntityIds("   ");

    expect(read.state).toBe("unavailable");
    expect(withSession).not.toHaveBeenCalled();
  });

  it("stops the real panel when the linkage is unpopulated", async () => {
    // End to end, because a correct reader wired to the panel incorrectly
    // is the same defect. The panel must go blocked, not render two
    // incumbents as fresh candidates.
    const authorityRow = (
      supplierId: string,
      legalEntityId: string,
    ): CandidateSupplierAuthorityRow => ({
      tenantKey: "t1",
      supplierId,
      legalEntityId,
      legalName: `Supplier ${supplierId}`,
      authorityState: "accepted",
      eligibility: {
        categoryKeys: ["cat-a"],
        functionKeys: [],
        archetypeKeys: [],
      },
      contactPolicy: "contact_allowed",
      contacts: [
        {
          contactId: "c1",
          role: "account",
          email: "a@example.test",
          state: "active",
        },
      ],
      source: {
        system: "vendor-master",
        reference: "VM-1",
        recordedAt: "2026-06-01T00:00:00Z",
        recordedBy: "ops",
      },
    });

    const slice = buildCandidateSupplierRegistrySlice({
      registryAvailable: true,
      tenantKey: "t1",
      eventId: "evt-1",
      filters: { categoryKey: "cat-a" },
      rows: [authorityRow("s1", "v-a"), authorityRow("s2", "v-b")],
      selectedSupplierIds: [],
    });

    scriptQueries([
      SET_CONFIG,
      [{ contract_count: 40, linked_count: 0, resolved_count: 0 }],
    ]);
    const unpopulated = await readContractVendorLegalEntityIds("t1");
    const blockedPanel = buildVendorPanelProjection({
      slice,
      ...toVendorPanelContractInput(unpopulated),
    });
    expect(blockedPanel.status).toBe("blocked");
    expect(blockedPanel.counts.eligible_candidate).toBe(0);

    scriptQueries([
      SET_CONFIG,
      [{ contract_count: 40, linked_count: 40, resolved_count: 40 }],
      [{ vendor_id: "v-a" }],
    ]);
    const populated = await readContractVendorLegalEntityIds("t1");
    const livePanel = buildVendorPanelProjection({
      slice,
      ...toVendorPanelContractInput(populated),
    });
    expect(livePanel.status).toBe("available");
    expect(livePanel.counts.existing_contract_vendor).toBe(1);
    expect(livePanel.counts.eligible_candidate).toBe(1);
  });
});
