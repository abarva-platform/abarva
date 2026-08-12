/**
 * Derive vendor-response completeness inputs from the parsed profile set.
 *
 * The Responses stage reads two independent models. `buildSourceVendorResponseCompleteness`
 * resolves its vendors by exact event id against a fixed seed table, while
 * `buildVendorResponseMveProfiles` resolves an event by id, code, name or
 * account. On any event outside the seed table, that split produced a stage
 * that reported parsed vendor packages and parser citations in one panel while
 * the package cockpit and the file-readiness ledger showed nothing bound.
 *
 * This adapter closes the gap without introducing persistence or parser
 * ingestion: when the seed table has no entry for an event, the completeness
 * model is built from the same parsed profiles the rest of the stage already
 * renders. Seeded events keep their existing seed exactly.
 */

import { getSourceVendorResponseSeed } from "./mock-seed";
import { REQUIRED_RESPONSE_SECTIONS } from "./vendor-response-completeness";
import type {
  VendorResponseExhibitKind,
  VendorResponseProfile,
  VendorResponseProfileSet,
} from "./proposal-intelligence";
import type {
  SourceDataReadinessState,
  SourceEvidenceUsability,
} from "./types";
import type {
  SourceVendorResponseSeedInput,
  SourceVendorTemplateStatus,
} from "./vendor-response-types";

type SectionPresence = "complete" | "partial" | "missing";

/**
 * How each canonical required section is evidenced in a parsed profile. An
 * exhibit is the strongest signal; sections that are not exhibit-backed fall
 * back to the response section map.
 */
const SECTION_EVIDENCE: Record<
  (typeof REQUIRED_RESPONSE_SECTIONS)[number],
  { exhibit?: VendorResponseExhibitKind; sectionPattern?: RegExp }
> = {
  "Executive response": { sectionPattern: /executive|summary|overview/i },
  "Scope confirmation": { sectionPattern: /scope/i },
  "Pricing template": { exhibit: "pricing_workbook" },
  "Assumptions and exclusions": { exhibit: "assumptions_exclusions" },
  "Transition plan": { exhibit: "transition_milestones" },
  "Delivery model": { exhibit: "staffing_location_model" },
  "SLA response": { exhibit: "sla_commitments" },
  "Security and compliance response": {
    sectionPattern: /security|compliance/i,
  },
  "Automation / productivity roadmap": {
    exhibit: "productivity_commitments",
  },
  "References and evidence": { exhibit: "evidence_index" },
};

function exhibitPresence(
  profile: VendorResponseProfile,
  kind: VendorResponseExhibitKind,
): SectionPresence | null {
  const exhibit = profile.exhibits.find((item) => item.kind === kind);
  if (!exhibit) return null;
  return exhibit.status;
}

function sectionMapPresence(
  profile: VendorResponseProfile,
  pattern: RegExp,
): SectionPresence | null {
  const rows = profile.sectionMap.filter((row) => pattern.test(row.rfpSection));
  if (rows.length === 0) return null;
  if (rows.some((row) => row.status === "complete")) {
    return rows.every((row) => row.status === "complete")
      ? "complete"
      : "partial";
  }
  if (
    rows.some((row) => row.status === "partial" || row.status === "exception")
  )
    return "partial";
  return "missing";
}

function sectionPresence(
  profile: VendorResponseProfile,
  section: (typeof REQUIRED_RESPONSE_SECTIONS)[number],
): SectionPresence | null {
  const evidence = SECTION_EVIDENCE[section];
  if (evidence.exhibit) {
    const fromExhibit = exhibitPresence(profile, evidence.exhibit);
    if (fromExhibit) return fromExhibit;
  }
  if (evidence.sectionPattern) {
    return sectionMapPresence(profile, evidence.sectionPattern);
  }
  return null;
}

/**
 * A section counts as submitted when the parser found it, even partially — a
 * partial section is present but weak, and the template statuses below carry
 * that weakness. A section the parser could not find at all is not submitted.
 */
function isSubmitted(presence: SectionPresence | null): boolean {
  return presence === "complete" || presence === "partial";
}

function toTemplateStatus(
  presence: SectionPresence | null,
): SourceVendorTemplateStatus {
  if (presence === "complete") return "complete";
  if (presence === "partial") return "incomplete";
  if (presence === "missing") return "missing";
  return "not_started";
}

function toEvidenceStatus(
  presence: SectionPresence | null,
): SourceDataReadinessState {
  if (presence === "complete") return "Parsed";
  if (presence === "partial") return "Low Confidence";
  return "Missing";
}

function toEvidenceUsability(
  presence: SectionPresence | null,
): SourceEvidenceUsability {
  if (presence === "complete") return "usable";
  if (presence === "partial") return "low_confidence";
  return "not_available";
}

function toResponseRisk(
  profile: VendorResponseProfile,
): SourceVendorResponseSeedInput["responseRiskLevel"] {
  if (profile.readyForEvaluation === "yes") return "low";
  if (profile.readyForEvaluation === "conditional") return "medium";
  return "high";
}

export function deriveVendorResponseSeedInputsFromProfiles(
  profileSet?: VendorResponseProfileSet | null,
): SourceVendorResponseSeedInput[] {
  return (profileSet?.profiles ?? []).map((profile) => {
    const presenceBySection = new Map(
      REQUIRED_RESPONSE_SECTIONS.map((section) => [
        section,
        sectionPresence(profile, section),
      ]),
    );
    const submittedSections = REQUIRED_RESPONSE_SECTIONS.filter((section) =>
      isSubmitted(presenceBySection.get(section) ?? null),
    );
    const evidencePresence =
      presenceBySection.get("References and evidence") ?? null;

    return {
      vendorId: profile.vendorId,
      vendorName: profile.vendorName,
      // A parsed profile exists only for a package Source actually received.
      responseStatus: "submitted",
      receivedAt: null,
      requiredSections: [...REQUIRED_RESPONSE_SECTIONS],
      submittedSections,
      assumptions: profile.assumptionsExclusions,
      exclusions: profile.commercialExceptions,
      pricingTemplateStatus: toTemplateStatus(
        presenceBySection.get("Pricing template") ?? null,
      ),
      transitionPlanStatus: toTemplateStatus(
        presenceBySection.get("Transition plan") ?? null,
      ),
      securityResponseStatus: toTemplateStatus(
        presenceBySection.get("Security and compliance response") ?? null,
      ),
      automationRoadmapStatus: toTemplateStatus(
        presenceBySection.get("Automation / productivity roadmap") ?? null,
      ),
      evidenceStatus: toEvidenceStatus(evidencePresence),
      evidenceUsability: toEvidenceUsability(evidencePresence),
      responseRiskLevel: toResponseRisk(profile),
    } satisfies SourceVendorResponseSeedInput;
  });
}

/**
 * Seeded events keep their seed. Everything else is built from parsed
 * profiles, so the Responses stage reports one vendor population instead of
 * two. Returns undefined when neither source has vendors, which leaves the
 * existing empty states in place.
 */
export function resolveVendorResponseSeedInputs(
  eventId: string,
  profileSet?: VendorResponseProfileSet | null,
): SourceVendorResponseSeedInput[] | undefined {
  if (getSourceVendorResponseSeed(eventId).responses.length > 0) {
    return undefined;
  }
  const derived = deriveVendorResponseSeedInputsFromProfiles(profileSet);
  return derived.length > 0 ? derived : undefined;
}
