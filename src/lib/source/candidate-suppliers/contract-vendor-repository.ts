import { azureRead } from "@/lib/data-plane/azureRead";

/**
 * Which legal entities is this tenant already under contract with?
 *
 * The stage 04 vendor panel needs this to tell an existing-contract vendor
 * from a fresh candidate, and `buildVendorPanelProjection` refuses to render
 * at all when the answer is unknown. That refusal is only worth having if
 * something actually distinguishes "unknown" from "none", which is the whole
 * job of this module.
 *
 * `source.contract.vendor_id` is **nullable**, so there are three different
 * ways for the answer to contain no vendors, and only one of them is an
 * answer:
 *
 *   - the tenant has no contracts at all — genuinely nobody under contract;
 *   - the tenant has contracts and not one of them names a vendor — the
 *     linkage is unpopulated, so the question has not been answered;
 *   - the read failed — nothing is known.
 *
 * Collapsing the middle case into the first is the specific error that would
 * make the panel present every incumbent as a new candidate while looking
 * entirely healthy. `source.contract.vendor_id` and the candidate
 * authority's `legalEntityId` are the same identifier space: the NDA
 * authority's foreign key declares
 * `supplier_legal_entity_id REFERENCES source.vendor(tenant_key, vendor_id)`.
 */

export type ContractVendorReadState =
  | "available"
  | "no_contracts"
  | "linkage_unpopulated"
  | "unavailable";

export type ContractVendorRead = {
  state: ContractVendorReadState;
  /** Canonical vendor ids resolved against `source.vendor`. */
  legalEntityIds: readonly string[];
  /**
   * Contracts naming a vendor id that no canonical vendor row matches.
   * Reported rather than silently dropped, because a rising count here means
   * the register and the vendor master are drifting apart.
   */
  unresolvedVendorReferences: number;
  /** Why the read cannot answer, in words. Null when it can. */
  note: string | null;
};

const UNAVAILABLE: ContractVendorRead = {
  state: "unavailable",
  legalEntityIds: [],
  unresolvedVendorReferences: 0,
  note: "The contract register could not be read.",
};

type ContractCountsRow = {
  contract_count: number | string;
  linked_count: number | string;
  resolved_count: number | string;
};

type VendorIdRow = { vendor_id: string };

const count = (value: number | string): number => {
  const parsed = typeof value === "number" ? value : Number.parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : 0;
};

export async function readContractVendorLegalEntityIds(
  tenantKey: string,
): Promise<ContractVendorRead> {
  if (!tenantKey.trim()) return UNAVAILABLE;

  try {
    return await azureRead.withSession(async (run) => {
      await run("SELECT set_config('app.tenant_key', $1, false)", [tenantKey]);

      const [counts] = await run<ContractCountsRow>(
        `SELECT COUNT(*)::int AS contract_count,
                COUNT(NULLIF(BTRIM(contract.vendor_id), ''))::int AS linked_count,
                COUNT(vendor.vendor_id)::int AS resolved_count
           FROM source.contract contract
           LEFT JOIN source.vendor vendor
             ON vendor.tenant_key = contract.tenant_key
            AND vendor.vendor_id = contract.vendor_id
          WHERE contract.tenant_key = $1`,
        [tenantKey],
      );

      // A query that returns no summary row at all has told us nothing, and
      // reading nothing as zero is how this whole class of defect starts.
      // The outer catch would also reach `unavailable` here, by way of a
      // TypeError — that is an accident, not a decision, and it would not
      // say what happened. This does.
      if (!counts) {
        return {
          ...UNAVAILABLE,
          note: "The contract register returned no summary row.",
        };
      }

      const contractCount = count(counts.contract_count);
      const linkedCount = count(counts.linked_count);
      const resolvedCount = count(counts.resolved_count);

      if (contractCount === 0) {
        return {
          state: "no_contracts" as const,
          legalEntityIds: [],
          unresolvedVendorReferences: 0,
          note: null,
        };
      }

      if (linkedCount === 0) {
        return {
          state: "linkage_unpopulated" as const,
          legalEntityIds: [],
          unresolvedVendorReferences: 0,
          note:
            `This tenant has ${contractCount} contracts and none of them names a vendor, ` +
            "so which suppliers are already under contract is unknown rather than none.",
        };
      }

      const rows = await run<VendorIdRow>(
        `SELECT DISTINCT contract.vendor_id
           FROM source.contract contract
           JOIN source.vendor vendor
             ON vendor.tenant_key = contract.tenant_key
            AND vendor.vendor_id = contract.vendor_id
          WHERE contract.tenant_key = $1
            AND NULLIF(BTRIM(contract.vendor_id), '') IS NOT NULL
          ORDER BY contract.vendor_id ASC`,
        [tenantKey],
      );

      return {
        state: "available" as const,
        legalEntityIds: rows.map((row) => row.vendor_id),
        unresolvedVendorReferences: Math.max(linkedCount - resolvedCount, 0),
        note: null,
      };
    });
  } catch {
    return UNAVAILABLE;
  }
}

/**
 * Turn a read into the two inputs the panel takes.
 *
 * The mapping lives here rather than at each call site because getting it
 * wrong is silent: pass `[]` with `contractEvidenceAvailable: true` for an
 * unpopulated linkage and the panel renders happily, with every incumbent
 * filed as new.
 */
export function toVendorPanelContractInput(read: ContractVendorRead): {
  contractVendorLegalEntityIds: readonly string[];
  contractEvidenceAvailable: boolean;
} {
  return {
    contractVendorLegalEntityIds: read.legalEntityIds,
    // `no_contracts` is an answer. `linkage_unpopulated` and `unavailable`
    // are not, and both must stop the panel.
    contractEvidenceAvailable:
      read.state === "available" || read.state === "no_contracts",
  };
}
