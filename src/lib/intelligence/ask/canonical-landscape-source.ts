import "server-only";

import { loadHomeLandscape } from "@/lib/home/landscape-read-adapter";
import { canonicalTenantKey } from "@/lib/tenant/aliases";
import type { AskSource } from "./types";

/**
 * The canonical landscape as an answer source.
 *
 * Asked how many applications and business functions a client has, aVa replied that the estate
 * "[is] not yet loaded into the connected enterprise context" — with `sources: []` and a coverage
 * report naming `enterprise_profile`, `program_inventory` and `evidence_ledger` as missing. At the
 * same moment the landscape projection held thousands of that client's records and Home was
 * rendering them one click away.
 *
 * Telling a client their own data is not loaded, when it is, is the most damaging thing this product
 * can do. It is worse than an error: it is a confident, specific claim about their data maturity that
 * a reader has no reason to doubt and every reason to repeat.
 *
 * Six retrievers feed the ask path and all of them returned nothing. Rather than chase each, this
 * makes the projection itself a source — the same store Home and Intelligence read, already written,
 * already readback-verified. When the others find nothing, canonical still grounds the answer.
 *
 * It emits counts, distinct names and evidence status, never prose. The model narrates these; it does
 * not produce them.
 */
export async function buildCanonicalLandscapeSource(
  tenantKeyCandidates: ReadonlyArray<string | null | undefined>,
): Promise<AskSource | null> {
  for (const candidate of tenantKeyCandidates) {
    const key = canonicalTenantKey(candidate ?? null);
    if (!key) continue;
    const landscape = await loadHomeLandscape(key).catch(() => null);
    if (!landscape) continue;

    const populated = landscape.dimensions.filter((d) => d.recordCount > 0);
    if (populated.length === 0) continue;

    const rows = populated.map((d) => ({
      dimension: d.displayName,
      records: d.recordCount,
      distinctNamed: d.distinctNameCount,
      evidenceRefs: d.evidenceCount,
      status: d.confidenceStatus,
      // Named examples make a count checkable by a human who knows the client. A count on its own is
      // an assertion; a count with names is a claim they can falsify.
      examples: d.sampleEntities.slice(0, 4).join("; "),
    }));

    const notSupplied = landscape.dimensions
      .filter((d) => d.recordCount === 0)
      .map((d) => d.displayName);

    return {
      type: "TENANT",
      name: "Canonical enterprise landscape",
      id: `canonical-landscape:${key}:${landscape.buildVersion}`,
      detail:
        `${landscape.totalEntities.toLocaleString()} canonical records across ${populated.length} dimensions, ` +
        `build ${landscape.buildVersion}` +
        (notSupplied.length
          ? `. Not supplied by this client: ${notSupplied.join(", ")}.`
          : ". Every dimension supplied."),
      confidence: 0.9,
      structured: {
        tables: [
          {
            id: `canonical-landscape-${key}`,
            title: "Enterprise landscape by dimension",
            columns: [
              { key: "dimension", label: "Dimension" },
              { key: "records", label: "Records", align: "right", format: "number" },
              { key: "distinctNamed", label: "Distinct named", align: "right", format: "number" },
              { key: "evidenceRefs", label: "Evidence refs", align: "right", format: "number" },
              { key: "status", label: "Status" },
              { key: "examples", label: "Examples" },
            ],
            rows,
            note: `Canonical build ${landscape.buildVersion}. Counts are records; distinct named is usually lower and is the figure to quote as "how many X".`,
          },
        ],
      },
    };
  }
  return null;
}
