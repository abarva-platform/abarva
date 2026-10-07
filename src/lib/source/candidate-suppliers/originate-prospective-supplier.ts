import { createHash } from "node:crypto";
import { createTxSession, type TxSessionRunner } from "@/lib/data-plane/read-adapters/azureSession";

/**
 * Originates a supplier that exists in Source before it exists anywhere else.
 *
 * Every writer of `source.vendor` today is a loader. A supplier a category lead
 * wants to approach therefore has nowhere to exist until somebody imports it —
 * which is backwards for most of the suppliers a sourcing team actually wants,
 * because a supplier is created in the ERP when it starts invoicing, after an
 * award. Until then it still needs somewhere to be qualified, sign an NDA and
 * compete.
 *
 * What this writes is a `potential` supplier: qualifiable, NDA-capable, and not
 * payable. Not payable is structural rather than a flag — `source.vendor` holds
 * no banking column of any kind, so the record cannot express how to pay it.
 * Becoming payable requires the ERP onboarding request raised at award, which
 * sends a request and never a record.
 */
export type ProspectiveSupplierInput = {
  clientKey: string;
  legalName: string;
  originatedByUserId: string;
  /** Why this supplier was originated: a market scan, referral, prior event. */
  originationEvidence: string;
  country?: string;
  supplierCategory?: string;
};

export type ProspectiveSupplierResult =
  | { ok: true; vendorId: string; created: boolean }
  | {
      ok: false;
      code: "invalid_record" | "name_taken_by_loaded_supplier" | "origination_unavailable";
    };

const filled = (value: string | null | undefined): boolean =>
  typeof value === "string" && value.trim().length > 0;

/**
 * Stable for the same tenant and legal name, so originating twice returns the
 * same supplier rather than a second one. The name is folded to a comparable
 * form first: trailing punctuation and case are not identity.
 */
function deterministicVendorId(clientKey: string, legalName: string): string {
  const comparable = legalName.trim().toLowerCase().replace(/\s+/g, " ");
  const digest = createHash("sha256")
    .update(`${clientKey.trim()}\u0000${comparable}`)
    .digest("hex")
    .slice(0, 12)
    .toUpperCase();
  return `PSP-${digest}`;
}

export async function originateProspectiveSupplier(
  input: ProspectiveSupplierInput,
  tx: TxSessionRunner = createTxSession("source-prospective-supplier"),
  now: () => string = () => new Date().toISOString(),
): Promise<ProspectiveSupplierResult> {
  if (
    ![input.clientKey, input.legalName, input.originatedByUserId].every(filled) ||
    // A name alone is not origination. The evidence says why this supplier is
    // worth approaching, and a word does not.
    input.originationEvidence.trim().length < 12
  ) {
    return { ok: false, code: "invalid_record" };
  }

  const originatedAt = now();
  if (!Number.isFinite(Date.parse(originatedAt))) {
    return { ok: false, code: "invalid_record" };
  }
  const vendorId = deterministicVendorId(input.clientKey, input.legalName);

  try {
    return await tx(async (run) => {
      await run("SELECT set_config('app.tenant_key', $1, true)", [input.clientKey]);

      // A loaded supplier already carrying this legal name is a different fact
      // from a replayed origination, and must not be quietly adopted: adopting
      // it would let an originated record take over a conformed one.
      //
      // This deliberately does NOT deduplicate against the loaded population in
      // general. The crosswalk's duplicate check belongs at award, where a
      // named person confirms it — blocking origination on a fuzzy name match
      // would stop a buyer approaching a supplier because something similar was
      // once imported.
      const clash = await run<{ vendor_id: string; supplier_population: string }>(
        `SELECT vendor_id, supplier_population
           FROM source.vendor
          WHERE tenant_key = $1
            AND lower(btrim(legal_name)) = lower(btrim($2))
            AND vendor_id <> $3
            AND supplier_population = 'known'
          LIMIT 1`,
        [input.clientKey, input.legalName, vendorId],
      );
      if (clash.length > 0) {
        return { ok: false, code: "name_taken_by_loaded_supplier" } as const;
      }

      const inserted = await run<{ vendor_id: string }>(
        `INSERT INTO source.vendor (
           tenant_key, vendor_id, legal_name, country, supplier_category,
           supplier_population, originated_by_user_id, originated_at,
           origination_evidence, active_state, quality_state, source_system
         ) VALUES (
           $1, $2, $3, $4, $5,
           'potential', $6, $7::timestamptz,
           $8, 'active', 'unreviewed', 'source-origination'
         ) ON CONFLICT (tenant_key, vendor_id) DO NOTHING
         RETURNING vendor_id`,
        [
          input.clientKey,
          vendorId,
          input.legalName.trim(),
          input.country?.trim() || null,
          input.supplierCategory?.trim() || null,
          input.originatedByUserId,
          originatedAt,
          input.originationEvidence.trim(),
        ],
      );

      // No row means this tenant already originated this name. That is the same
      // supplier, not a failure: the id is derived from the name, so returning
      // it lets the caller carry on to the panel.
      return { ok: true, vendorId, created: inserted.length > 0 } as const;
    });
  } catch {
    return { ok: false, code: "origination_unavailable" };
  }
}
