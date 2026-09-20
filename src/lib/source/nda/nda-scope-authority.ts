/**
 * Stage 05 NDA — scope and waiver authority.
 *
 * A current NDA file could be described, but no policy said which template
 * version applied, which affiliate or event scope it covered, or when a waiver
 * may stand in for an NDA. The owner decision (recorded 2026-09-19) settles
 * all three:
 *
 *   - **Legal** owns versioned NDA text and any deviation from it.
 *   - **Procurement** owns event, supplier and affiliate scope metadata.
 *   - Day one is a controlled upload of an executed document. Nothing here
 *     generates, sends or signs anything.
 *   - **No silent waiver.** A waiver must be explicit, time-bound, reasoned,
 *     displayed separately from an executed NDA, and carry a named Legal
 *     approver before it can clear readiness.
 *
 * This module is the read-only contract for that. It decides whether a
 * supplier is *covered* for a given event, and it fails closed: an absent
 * registry, an unreadable scope, or a waiver missing any of its four
 * requirements yields `not_covered` with a stated reason, never a pass.
 *
 * What it deliberately does not do: generate NDA text, dispatch anything to a
 * supplier, record a signature, or write. Those are separate items and two of
 * them are gated on decisions this one does not make.
 */

export type NdaCoverageState =
  | "covered_by_nda"
  | "covered_by_waiver"
  | "not_covered";

export type NdaScopeLevel = "supplier_entity" | "supplier_and_affiliates" | "event_only";

/** An executed NDA document, uploaded under control. */
export type ExecutedNdaRecord = {
  ndaId: string;
  tenantKey: string;
  supplierLegalEntityId: string;
  /** Legal owns this. A record citing a template version Legal has not published is not authority. */
  templateVersion: string;
  scopeLevel: NdaScopeLevel;
  /** Procurement owns this. Empty means the NDA is not scoped to any event. */
  coveredEventIds: readonly string[];
  /** Affiliate entity ids this NDA reaches. Only consulted at supplier_and_affiliates. */
  coveredAffiliateEntityIds: readonly string[];
  effectiveFrom: string;
  effectiveTo?: string;
  uploadedBy: string;
};

/**
 * A waiver standing in for an NDA. Every field here is required by the
 * decision — this type is where "no silent waiver" is enforced, because a
 * waiver that cannot express a reason, an expiry and a named approver cannot
 * be constructed.
 */
export type NdaWaiverRecord = {
  waiverId: string;
  tenantKey: string;
  supplierLegalEntityId: string;
  eventId: string;
  /** Explicit: someone chose this, it is not a default. */
  reason: string;
  /** Time-bound: a waiver without an end is a policy change, not a waiver. */
  expiresAt: string;
  /** A named Legal approver. A role is not a name. */
  approvedByLegalName: string;
  approvedAt: string;
};

export type NdaCoverageInput = {
  registryAvailable: boolean;
  tenantKey: string;
  eventId: string;
  supplierLegalEntityId: string;
  /** Template versions Legal has published. A record outside this set is not authority. */
  publishedTemplateVersions: readonly string[];
  executedNdas: readonly ExecutedNdaRecord[];
  waivers: readonly NdaWaiverRecord[];
  /** Evaluation time, passed in so the decision is reproducible rather than clock-dependent. */
  asOf: string;
};

export type NdaCoverageResult = {
  state: NdaCoverageState;
  /** Always populated, including on a pass — the reason a gate cleared is evidence too. */
  reason: string;
  /** Set only when a waiver is what cleared it, so a surface can display it separately. */
  waiver?: NdaWaiverRecord;
  ndaId?: string;
  /**
   * Where this answer rested on something asserted rather than derived.
   *
   * Two inputs are taken on trust. The published template versions are
   * whatever the caller hands over, not a Legal-owned register; the covered
   * affiliate entity ids are whatever the NDA record claims, not a corporate
   * tree. Deriving either is blocked on register tables that do not exist
   * yet, so until then the honest thing is to say, beside the answer, that
   * the confidence exceeds the evidence.
   *
   * A caveat appears only when the answer actually depended on that input.
   * Attaching both to every result would train a reader to skip them, which
   * is the same as not stating them.
   */
  evidenceCaveats: readonly string[];
};

const TEMPLATE_CAVEAT =
  "The published template versions were supplied by the caller, not verified " +
  "against a Legal-owned register. A wrong list changes this answer.";

const AFFILIATE_CAVEAT =
  "This entity is covered as an affiliate, and the affiliate list was asserted " +
  "by the NDA record rather than derived from the corporate tree. A wrong list " +
  "changes this answer.";

function withinWindow(asOf: string, from: string, to?: string): boolean {
  const at = Date.parse(asOf);
  const start = Date.parse(from);
  if (Number.isNaN(at) || Number.isNaN(start) || at < start) return false;
  if (to === undefined) return true;
  const end = Date.parse(to);
  return !Number.isNaN(end) && at <= end;
}

function nonEmpty(value: string | undefined): boolean {
  return typeof value === "string" && value.trim().length > 0;
}

/** Does this executed NDA reach this event and this entity? */
function ndaCovers(
  nda: ExecutedNdaRecord,
  input: NdaCoverageInput,
): boolean {
  if (nda.tenantKey !== input.tenantKey) return false;
  if (!input.publishedTemplateVersions.includes(nda.templateVersion)) return false;
  if (!withinWindow(input.asOf, nda.effectiveFrom, nda.effectiveTo)) return false;

  const entityMatches =
    nda.supplierLegalEntityId === input.supplierLegalEntityId ||
    (nda.scopeLevel === "supplier_and_affiliates" &&
      nda.coveredAffiliateEntityIds.includes(input.supplierLegalEntityId));
  if (!entityMatches) return false;

  // `event_only` reaches exactly the events it names. The other two levels are
  // entity-scoped and still have to name the event, because an NDA with a
  // supplier is not automatically an NDA for this engagement — that inference
  // is the thing the decision refuses.
  return nda.coveredEventIds.includes(input.eventId);
}

/**
 * Is this waiver usable? Every requirement from the decision, checked
 * individually so the failure says which one is missing.
 */
export function describeWaiverDefects(
  waiver: NdaWaiverRecord,
  input: NdaCoverageInput,
): string[] {
  const defects: string[] = [];
  if (waiver.tenantKey !== input.tenantKey) defects.push("belongs to another tenant");
  if (waiver.eventId !== input.eventId) defects.push("was granted for another event");
  if (waiver.supplierLegalEntityId !== input.supplierLegalEntityId) {
    defects.push("was granted for another legal entity");
  }
  if (!nonEmpty(waiver.reason)) defects.push("states no reason");
  if (!nonEmpty(waiver.approvedByLegalName)) defects.push("names no Legal approver");
  if (!nonEmpty(waiver.expiresAt)) {
    defects.push("has no expiry, which makes it a policy change rather than a waiver");
  } else if (!withinWindow(input.asOf, waiver.approvedAt, waiver.expiresAt)) {
    defects.push("is expired or not yet in effect");
  }
  return defects;
}

/**
 * Decide NDA coverage for one supplier on one event.
 *
 * Fails closed throughout: the only paths to a covered state are an executed
 * NDA that reaches this event on a template Legal published, or a waiver with
 * all four of its requirements met.
 */
export function evaluateNdaCoverage(input: NdaCoverageInput): NdaCoverageResult {
  if (!input.registryAvailable) {
    return {
      state: "not_covered",
      reason:
        "The NDA registry slice is unavailable. Coverage is unknown, and unknown is not covered.",
      // Nothing was consulted, so nothing was taken on trust.
      evidenceCaveats: [],
    };
  }

  if (input.publishedTemplateVersions.length === 0) {
    return {
      state: "not_covered",
      reason:
        "Legal has published no NDA template versions, so no executed document can be checked against one.",
      evidenceCaveats: [TEMPLATE_CAVEAT],
    };
  }

  const match = input.executedNdas.find((nda) => ndaCovers(nda, input));
  if (match) {
    const viaAffiliateList =
      match.supplierLegalEntityId !== input.supplierLegalEntityId;
    return {
      state: "covered_by_nda",
      ndaId: match.ndaId,
      reason: `Executed NDA ${match.ndaId} on template ${match.templateVersion} covers this event and entity.`,
      evidenceCaveats: viaAffiliateList
        ? [TEMPLATE_CAVEAT, AFFILIATE_CAVEAT]
        : [TEMPLATE_CAVEAT],
    };
  }

  // Only now consider a waiver. An executed NDA always outranks one, so a
  // waiver can never be the reason a gate cleared while an NDA would have done.
  const candidates = input.waivers.map((waiver) => ({
    waiver,
    defects: describeWaiverDefects(waiver, input),
  }));
  const usable = candidates.find((candidate) => candidate.defects.length === 0);
  if (usable) {
    return {
      state: "covered_by_waiver",
      waiver: usable.waiver,
      reason:
        `No executed NDA covers this event. Waiver ${usable.waiver.waiverId} applies, approved by ` +
        `${usable.waiver.approvedByLegalName} until ${usable.waiver.expiresAt}: ${usable.waiver.reason}. ` +
        "Display it as a waiver, not as an NDA.",
      // A waiver cites no template and no affiliate list. Nothing asserted
      // stood behind this answer.
      evidenceCaveats: [],
    };
  }

  const rejected = candidates
    .filter((candidate) => candidate.defects.length > 0)
    .map((candidate) => `${candidate.waiver.waiverId} (${candidate.defects.join("; ")})`);

  // A refusal rests on the asserted template list only when some executed
  // NDA would otherwise have covered this event and was turned away for its
  // template alone. Any other refusal stands on its own facts, and saying
  // "the list might be wrong" there would be noise.
  const turnedAwayOnTemplateAlone = input.executedNdas.some(
    (nda) =>
      !input.publishedTemplateVersions.includes(nda.templateVersion) &&
      ndaCovers(
        nda,
        {
          ...input,
          publishedTemplateVersions: [
            ...input.publishedTemplateVersions,
            nda.templateVersion,
          ],
        },
      ),
  );

  return {
    state: "not_covered",
    reason:
      rejected.length > 0
        ? `No executed NDA covers this event, and no waiver is usable: ${rejected.join(", ")}.`
        : "No executed NDA covers this event and no waiver has been granted.",
    evidenceCaveats: turnedAwayOnTemplateAlone ? [TEMPLATE_CAVEAT] : [],
  };
}
