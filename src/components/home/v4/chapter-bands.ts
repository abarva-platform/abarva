import type { ChapterView, EnterpriseSignalPacket, GroundedClaim } from "@/lib/home/preview/types";

/**
 * Routes a chapter's claims into v4's four bands.
 *
 * Every rule here is deterministic and reads a value the claim already carries -- its
 * `claim_type`, or the canonical domains its cited evidence declares. Nothing is decided by
 * reading the prose, because a router that interprets sentences would quietly become a second,
 * unverified opinion about what the enterprise is.
 *
 * The bands, and why the split is where it is:
 *  - RECORD    things counted in the client's own systems and interviews (FACT / OBSERVATION)
 *  - FOLLOWS   readings of those things (CROSS_DOMAIN_INSIGHT / ADVISORY_INFERENCE)
 *  - EXPOSURES tensions and watch-items whose evidence comes from the risk/control register --
 *              severity is the client's own rating, not ours
 *  - GAPS      `limitations[]`: what the chapter deliberately does not assert
 */

const COUNTED: ReadonlySet<GroundedClaim["claim_type"]> = new Set(["FACT", "OBSERVATION"]);

/** The canonical domain that makes something an exposure rather than an interpretation. */
const RISK_DOMAIN = "risk_or_control";

export interface ChapterBands {
  record: GroundedClaim[];
  follows: GroundedClaim[];
  exposures: GroundedClaim[];
  gaps: string[];
  questions: string[];
  /** How many bands actually carry content. A chapter with one or two is a real shape, not a
   * defect -- callers use this to lay out rather than to decide whether to render. */
  filledBandCount: number;
}

function domainsOf(claim: GroundedClaim, byId: Map<string, readonly string[]>): Set<string> {
  const out = new Set<string>();
  for (const id of claim.evidence_ids) for (const d of byId.get(id) ?? []) out.add(d);
  return out;
}

export function splitChapterIntoBands(chapter: ChapterView, signalPacket: EnterpriseSignalPacket): ChapterBands {
  const byId = new Map<string, readonly string[]>([
    ...signalPacket.signals.map((s) => [s.id, s.domains] as const),
    ...signalPacket.contextItems.map((c) => [c.id, c.domains] as const),
  ]);

  const record = chapter.key_insights.filter((c) => COUNTED.has(c.claim_type));
  const analysis = chapter.key_insights.filter((c) => !COUNTED.has(c.claim_type));
  const rest = [...chapter.tensions, ...chapter.what_to_watch];
  const exposures = rest.filter((c) => domainsOf(c, byId).has(RISK_DOMAIN));
  const follows = [...analysis, ...rest.filter((c) => !exposures.includes(c))];

  const gaps = chapter.limitations;
  const questions = chapter.questions_to_ask;
  const filledBandCount = [record, follows, exposures, gaps].filter((b) => b.length > 0).length;

  return { record, follows, exposures, gaps, questions, filledBandCount };
}
