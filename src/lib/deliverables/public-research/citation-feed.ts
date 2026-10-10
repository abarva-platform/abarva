import type { PublicCitationSource } from "@/lib/deliverables/orchestrator/types";

import { publicSourceCiteNumbers } from "./review-contract";
import type { PublicSource } from "./types";

/** Use the review panel's approval-order numbering for every generation path. */
export function publicCitationSourcesFromApproved(
  sources: readonly PublicSource[],
): PublicCitationSource[] {
  const approved = sources.filter(
    (source) =>
      source.decision === "approved" &&
      source.kind === "public_source" &&
      source.sourceClass === "public_source",
  );
  const numbers = publicSourceCiteNumbers(approved);
  return approved
    .map((source) => ({
      citationNumber: numbers.get(source.id) as number,
      url: source.url,
      title: source.title,
      publisher: source.publisher,
      publishedAt: source.publishedAt,
      retrievedAt: source.retrievedAt,
      excerpt: source.excerpt,
      claim: source.claim,
    }))
    .sort((a, b) => a.citationNumber - b.citationNumber);
}
