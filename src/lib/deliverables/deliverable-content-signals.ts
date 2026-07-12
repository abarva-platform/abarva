// Stage 2 of surfacing real "carries forward" content in the Moves Next-
// Phase Readiness Pack (see memory: project_moves_readiness_pack_and_
// generation_pipeline). Reads a Move's latest generated deliverable content
// for a given type and extracts real signal snippets via Stage 1's
// `extractExhibitContent`. Never fabricates: a signal with no real matching
// content is simply absent from the result, not invented or guessed.

import "server-only";

import { azureRead } from "@/lib/data-plane/azureRead";
import { extractExhibitContent } from "@/lib/deliverables/exhibit-content-extractor";

export interface DeliverableContentSignal {
  /** Stable key for the signal, e.g. "workstreams", "owners", "metrics". */
  key: string;
  /** The real heading or table header the content was found under. */
  heading: string;
  /** Real extracted text — never fabricated. */
  snippet: string;
}

/**
 * Keyword vocabulary reused from `golden-bar.ts`'s `extractExhibitKinds` —
 * these are the same terms already used to detect whether a required
 * visual/table is present in generated Moves deliverables.
 */
const SIGNAL_KEYWORDS: ReadonlyArray<{ key: string; keyword: string }> = [
  { key: "workstreams", keyword: "workstream" },
  { key: "owners", keyword: "raci" },
  { key: "metrics", keyword: "kpi" },
];

interface LatestDeliverableContentRow {
  content: string;
  version: number;
}

async function readLatestDeliverableContent(
  moveId: string,
  deliverableTypeKey: string,
): Promise<LatestDeliverableContentRow | null> {
  const rows = await azureRead.query<LatestDeliverableContentRow>(
    "SELECT dv.content, dv.version " +
      "FROM deliverable_versions dv " +
      "JOIN deliverables_v2 d ON d.id = dv.deliverable_id " +
      "WHERE d.engagement_id = $1 AND d.deliverable_type_key = $2 " +
      "ORDER BY dv.version DESC " +
      "LIMIT 1",
    [moveId, deliverableTypeKey],
    { missingTable: "empty" },
  );
  return rows[0] ?? null;
}

/**
 * Reads a Move's latest generated deliverable of the given type and extracts
 * real content signals (workstreams, owners, metrics) from it. Returns an
 * empty array when the deliverable hasn't been generated yet, or when none
 * of the signal keywords have a real matching heading/table — this is
 * expected and honest, not an error.
 */
export async function readDeliverableContentSignals(
  moveId: string,
  deliverableTypeKey: string,
): Promise<DeliverableContentSignal[]> {
  const latest = await readLatestDeliverableContent(moveId, deliverableTypeKey);
  if (!latest?.content) return [];

  const signals: DeliverableContentSignal[] = [];
  for (const { key, keyword } of SIGNAL_KEYWORDS) {
    const match = extractExhibitContent(latest.content, keyword);
    if (match) signals.push({ key, heading: match.heading, snippet: match.snippet });
  }
  return signals;
}
