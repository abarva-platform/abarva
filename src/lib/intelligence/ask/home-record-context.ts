import type {
  HomeReviewBundle,
  HomeRecordRenderSource,
} from "@/lib/home/preview/types";
import { sanitizeHomeReviewBundleNarrative } from "@/lib/home/preview/stale-claim-guard";
import { homeRecordSourceLabel } from "@/lib/home/preview/record-source";
import type { AskSource } from "./types";

export interface BoundHomeRecordContext {
  tenantKey: string;
  recordToken: string;
  sources: AskSource[];
}

export function buildHomeRecordSources(
  rawBundle: HomeReviewBundle,
  recordSource: HomeRecordRenderSource,
  recordToken: string,
): AskSource[] {
  const bundle = sanitizeHomeReviewBundleNarrative(rawBundle);
  const sources: AskSource[] = [
    {
      type: "SURFACE",
      id: `home:${recordToken}:record`,
      name: `Home record on screen: ${homeRecordSourceLabel(recordSource)}`,
      confidence: 0.5,
      detail: [
        "These sources come from the exact Home record selected for this question.",
        "Recorded claims and interpretations are not new client attestations or approved recommendations.",
        bundle.declaredSyntheticDemo
          ? "Synthetic reference; not client-attested."
          : "Retain each source's evidence limits.",
        "Industry patterns may inform options, but do not establish tenant facts or benefits.",
        "Counts below are rows in this selected record, not enterprise-wide completeness or verified outcome metrics.",
      ].join("\n"),
      structured: {
        tables: [
          {
            id: "home-record-families",
            title: "Evidence families in the selected Home record",
            columns: [
              { key: "family", label: "Evidence family" },
              { key: "count", label: "Rows", format: "number" },
            ],
            rows: (bundle.technologyEstate?.recordTypes ?? []).map(
              (family) => ({ family: family.label, count: family.rows.length }),
            ),
            note: "Record row counts; not unique business objects, completeness or value proof.",
          },
        ],
      },
    },
  ];
  for (const chapter of bundle.chapters) {
    const claims = [
      ...chapter.key_insights,
      ...chapter.tensions,
      ...chapter.what_to_watch,
    ].filter((claim) => claim.evidence_ids.length > 0);
    if (claims.length === 0) continue;
    sources.push({
      type: "TENANT",
      id: `home:${recordToken}:${chapter.chapterId}`,
      name: `Recorded Home evidence: ${chapter.title}`,
      confidence: 0.5,
      detail: [
        `Question addressed: ${chapter.guidingQuestion}`,
        ...claims.map(
          (claim) =>
            `[${claim.claim_type}; rated ${claim.confidence}] ${claim.statement}\nSource references: ${claim.evidence_ids.join(", ")}`,
        ),
        ...chapter.limitations.map((limit) => `Limit: ${limit}`),
      ].join("\n"),
    });
  }
  return sources;
}

export function homeRecordTenantMatches(
  context: BoundHomeRecordContext,
  canonicalTenantKey: string | null | undefined,
): boolean {
  return context.tenantKey === canonicalTenantKey;
}
