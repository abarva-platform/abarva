import { azureRead } from "@/lib/data-plane/azureRead";
import type { ParsedYieldCounts } from "./parsed-yield-view";

/**
 * Counts what parsing extracted for one event, per family.
 *
 * Four of the six families `text-parser.ts` writes have had no reader. This is
 * it. It counts rows and nothing more: the tables hold extracted text with its
 * provenance, and summarising that text is a judgement this read path has no
 * business making.
 *
 * `registryAvailable: false` is returned for an unreadable store and for a
 * query that throws. The caller renders that differently from zero, because
 * "we could not look" and "we looked and found none" are different claims.
 */
const TABLES: Record<keyof ParsedYieldCounts, string> = {
  requirements: "source_requirements",
  pricingComponents: "source_pricing_components",
  vendorCommitments: "source_vendor_commitments",
  meetingOutcomes: "source_meeting_outcomes",
};

const EMPTY: ParsedYieldCounts = {
  requirements: 0,
  pricingComponents: 0,
  vendorCommitments: 0,
  meetingOutcomes: 0,
};

const filled = (value: string | null | undefined): boolean =>
  typeof value === "string" && value.trim().length > 0;

export async function readParsedYieldForEvent(input: {
  tenantKey: string;
  eventId: string;
}): Promise<{ registryAvailable: boolean; counts: ParsedYieldCounts }> {
  if (!filled(input.tenantKey) || !filled(input.eventId)) {
    return { registryAvailable: false, counts: EMPTY };
  }

  try {
    return await azureRead.withSession(async (run) => {
      await run("SELECT set_config('app.tenant_key', $1, false)", [input.tenantKey]);

      const counts: ParsedYieldCounts = { ...EMPTY };
      for (const [family, table] of Object.entries(TABLES) as [
        keyof ParsedYieldCounts,
        string,
      ][]) {
        // The table name comes from the constant map above, never from input,
        // so it cannot carry anything from a request into the statement.
        const rows = await run<{ total: string | number }>(
          `SELECT COUNT(*)::bigint AS total
             FROM ${table}
            WHERE tenant_key = $1 AND source_event_id = $2::uuid`,
          [input.tenantKey, input.eventId],
        );
        // Postgres returns bigint as a string through this driver; Number() on
        // a missing row yields NaN, which the projection floors to zero rather
        // than letting it poison the total.
        counts[family] = Number(rows[0]?.total ?? 0);
      }
      return { registryAvailable: true, counts };
    });
  } catch {
    return { registryAvailable: false, counts: EMPTY };
  }
}
