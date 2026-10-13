import { resolveEvidence } from "@/components/home/preview/evidence-resolver";
import type { HomeReviewBundle } from "./types";

export function interpretationCaveats(
  text: string,
  evidenceIds: string[],
  bundle: HomeReviewBundle,
  leadershipChapter = false,
): string[] {
  const evidence = resolveEvidence(evidenceIds, bundle.thesis.signalPacket);
  const voices =
    leadershipChapter ||
    /\b(leadership|leaders?|interviews?|testimony|testified|CEO|CFO)\b/i.test(
      text,
    ) ||
    evidence.some(
      (item) =>
        item.signalKind === "testimony" ||
        item.domains.some((domain) =>
          ["ai_value_interview_evidence", "executive_interview"].includes(
            domain,
          ),
        ),
    );
  const caveats: string[] = [];
  if (voices) {
    const synthetic =
      bundle.declaredSyntheticDemo ||
      bundle.thesis.signalPacket.homeEnterpriseContext?.evidenceClass ===
        "synthetic_reference";
    const modelled = bundle.technologyEstate?.recordTypes.some(
      (family) =>
        family.objectType === "executive_interview" &&
        family.rows.some((row) =>
          /modelled|modeled/i.test(String(row.responseBasis ?? "")),
        ),
    );
    caveats.push(
      `${
        synthetic
          ? "Synthetic leadership reference; not client-attested testimony."
          : modelled
            ? "Modelled responses present; published transcript basis not established."
            : "Leadership response basis not established."
      } Mentions are not agreement.`,
    );
  }
  if (
    /(Medicare Advantage|\bMA\b)/i.test(text) &&
    /(Medicare FFS|fee.for.service|\bFFS\b)/i.test(text)
  )
    caveats.push(
      "Combined MA + Medicare FFS share is not an MA-only share or Star Rating exposure.",
    );
  if (
    /vendor|third-party/i.test(text) &&
    /spend|budget|internal.control/i.test(text)
  )
    caveats.push(
      "Vendor spend does not establish an internal-control deficit.",
    );
  return caveats;
}
