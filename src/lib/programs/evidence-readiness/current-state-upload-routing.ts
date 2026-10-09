/**
 * Which current-state evidence family a file uploaded on a Move's P2 surface
 * covers.
 *
 * Two surfaces take discovery evidence. `EvidenceUploadControl` offers a
 * family picker and trusts what the uploader declares; the P2 readiness panel
 * (`CurrentStateFamilyUploadPanel`) offered none, so on that surface the
 * FILENAME decided the family, and a filename the heuristic could not place
 * was refused outright rather than filed for review. The declaration the other
 * surface already honours had no counterpart on the one the readiness map
 * renders.
 *
 * So the decision lives here, in one place, with the same precedence as the
 * coverage reader's: a DECLARED family wins, and inference is the fallback for
 * an undeclared file only. Declaring routes review and nothing else — coverage
 * still counts only evidence a human has approved, so a declaration cannot
 * clear a gate, advance a phase, or stand in for review.
 */

/**
 * The identity a current-state evidence family is routed by.
 *
 * Structural on purpose: the readiness report's instrument carries far more
 * than routing needs, and the panel keeps its own instrument type. Only these
 * three fields take part in placing a file.
 */
export interface CurrentStateFamilyIdentity {
  key: string;
  label: string;
  /**
   * Whether the family takes a document (as opposed to a canonical-backed
   * structured load). The readiness report declares this as a boolean, and the
   * second inference tier folds it into the family's token blob with
   * `${documentFamily ?? ""}`, so a document family carries the literal token
   * "true" there. Typed to accept both shapes rather than narrowed to a
   * string, because narrowing it would quietly change where a file lands.
   */
  documentFamily?: boolean | string | null;
}

function normalizeUploadName(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, " ");
}

const CURRENT_STATE_FILENAME_ALIASES: Record<string, readonly string[]> = {
  member_service_process_map: [
    "workflow walkthrough",
    "member service process",
    "process and escalation map",
    "agent journey",
  ],
  member_service_metrics_baseline: [
    "monthly kpi baseline",
    "metric dictionary",
    "contact center performance baseline",
    "contact center kpi",
    "conflict register",
  ],
  member_service_systems_data_landscape: [
    "system inventory",
    "systems data landscape",
    "integration inventory",
    "application inventory",
    "data source inventory",
  ],
  knowledge_policy_content_inventory: [
    "knowledge inventory",
    "policy inventory",
    "script inventory",
  ],
  contact_center_transcripts_intents: [
    "transcript",
    "intent taxonomy",
    "speech analytics",
  ],
  phi_controls_and_human_approval: [
    "security control matrix",
    "phi controls",
    "privacy control inventory",
    "human approval control matrix",
    "human approval boundaries",
  ],
  member_service_org_change_readiness: [
    "org change readiness",
    "stakeholder map",
    "training adoption",
    "change readiness",
  ],
  solution_delivery_estimation_context: [
    "delivery estimation context",
    "implementation capacity",
    "delivery cadence",
  ],
};

/**
 * The families a filename alone points at, in three descending tiers:
 * an explicit filename alias, then a token/phrase overlap with the family's
 * own key and label, then a hardcoded keyword map.
 *
 * The tiers are kept byte-for-byte as the panel ran them, so an undeclared
 * file is placed exactly where it was placed before. What changed is that the
 * caller now reaches this only when the uploader declared nothing.
 *
 * The third tier names family keys from two specific archetypes, so it can
 * only ever match a Move whose blueprint uses those keys; for every other
 * archetype the second tier is the last one that can match at all. That is
 * why an undeclared file is not a reliable way to supply evidence and the
 * declaration is the primary path, not a convenience.
 */
export function inferCurrentStateFamilies<T extends CurrentStateFamilyIdentity>(
  fileName: string,
  instruments: readonly T[],
): T[] {
  const normalized = normalizeUploadName(fileName);
  const explicitMatches = instruments.filter((instrument) =>
    (CURRENT_STATE_FILENAME_ALIASES[instrument.key] ?? []).some((alias) =>
      normalized.includes(normalizeUploadName(alias)),
    ),
  );
  if (explicitMatches.length > 0) return explicitMatches;

  const semanticMatches = instruments.filter((instrument) => {
    const family = normalizeUploadName(
      `${instrument.key} ${instrument.label} ${instrument.documentFamily ?? ""}`,
    );
    if (
      /\bsla\b|\bservice level\b/.test(family) &&
      /\bsla\b|\bservice level\b|\bbaseline\b|\btarget\b|\bvendor handler\b/.test(
        normalized,
      )
    ) {
      return true;
    }
    if (
      /\bvendor\b.*\bspend\b|\bspend\b.*\bvendor\b|\bcost\b/.test(family) &&
      /\bvendor\b|\bspend\b|\bcost\b|\bexpense\b|\bcompensation\b|\bexpedite\b/.test(
        normalized,
      )
    ) {
      return true;
    }
    if (
      /\bincumbent\b|\bperformance\b/.test(family) &&
      /\bincumbent\b|\bperformance\b|\bcase\b|\bscan\b|\bevent\b|\bcontact\b|\bqueue\b|\bmetric\b/.test(
        normalized,
      )
    ) {
      return true;
    }
    const familyTokens = family
      .split(/\s+/)
      .filter(
        (token) =>
          token.length >= 4 &&
          !/^(current|state|evidence|family|baseline)$/.test(token),
      );
    return familyTokens.some((token) => normalized.includes(token));
  });
  if (semanticMatches.length > 0) return semanticMatches;

  const candidateKeys = new Set<string>();

  if (
    /\b(workshop|process|handoff|workflow|current state|sop|walkthrough)\b/.test(
      normalized,
    )
  ) {
    candidateKeys.add("commercial_lending_process_map");
  }
  if (
    /\b(metric|metrics|baseline|kpi|cycle|volume|queue|aging|onboarding)\b/.test(
      normalized,
    )
  ) {
    candidateKeys.add("commercial_lending_metrics_baseline");
  }
  if (/\b(kyc|defect|exception|audit|document)\b/.test(normalized)) {
    candidateKeys.add("kyc_document_defect_log");
  }
  if (
    /\b(system|systems|application|apps|data|inventory|integration|architecture|core|crm|los)\b/.test(
      normalized,
    )
  ) {
    candidateKeys.add("lending_systems_data_landscape");
  }
  if (
    /\b(policy|knowledge|checklist|covenant|content|procedure|guidance)\b/.test(
      normalized,
    )
  ) {
    candidateKeys.add("credit_policy_knowledge_inventory");
  }
  if (
    /\b(control|controls|approval|authority|risk|compliance|guardrail|privacy)\b/.test(
      normalized,
    )
  ) {
    candidateKeys.add("banking_controls_human_approval");
  }
  if (
    /\b(org|organization|stakeholder|change|training|adoption|readiness|role|owner)\b/.test(
      normalized,
    )
  ) {
    candidateKeys.add("lending_org_change_readiness");
  }
  if (
    /\b(delivery|estimate|estimation|implementation|capacity|release|sdlc|itsm|roadmap)\b/.test(
      normalized,
    )
  ) {
    candidateKeys.add("solution_delivery_estimation_context");
  }

  const directMatches = instruments.filter((instrument) =>
    candidateKeys.has(instrument.key),
  );
  return directMatches;
}

/** A family the P2 readiness panel may offer as a declaration. */
export interface CurrentStateUploadFamilyOption {
  key: string;
  label: string;
}

/**
 * Whether the surface can declare every open family it asks the user to
 * supply.
 *
 * `offeredFamilyKeys` is what the surface actually renders in its picker, not
 * what the readiness map needs: a surface that renders no picker offers none
 * of them, and `undeclarableOpenFamilyKeys` then names every open family. A
 * non-empty list is a dead end — the readiness table beside the control names
 * families the control gives no way to declare, and every file dropped there
 * is left to the filename.
 */
export function currentStateUploadDeclarationState<
  T extends CurrentStateFamilyIdentity,
>(input: {
  openFamilies: readonly T[];
  offeredFamilyKeys?: readonly string[];
}): {
  options: CurrentStateUploadFamilyOption[];
  undeclarableOpenFamilyKeys: string[];
} {
  const options = declarableCurrentStateFamilies(input.openFamilies);
  const offered = new Set(
    input.offeredFamilyKeys ?? options.map((option) => option.key),
  );
  const undeclarableOpenFamilyKeys = options
    .map((option) => option.key)
    .filter((key) => !offered.has(key));
  return { options, undeclarableOpenFamilyKeys };
}

/**
 * The open families a file may be declared as covering, deduplicated by key
 * and in the order the readiness map lists them.
 */
export function declarableCurrentStateFamilies<
  T extends CurrentStateFamilyIdentity,
>(openFamilies: readonly T[]): CurrentStateUploadFamilyOption[] {
  const seen = new Set<string>();
  const options: CurrentStateUploadFamilyOption[] = [];
  for (const family of openFamilies) {
    if (!family.key || seen.has(family.key)) continue;
    seen.add(family.key);
    options.push({ key: family.key, label: family.label });
  }
  return options;
}

/** How a file's family was decided, or why it could not be. */
export type CurrentStateUploadBasis = "declared" | "inferred";

export interface CurrentStateUploadRouting<T> {
  /** `null` when the file cannot be placed and nothing should be uploaded. */
  basis: CurrentStateUploadBasis | null;
  /**
   * The families to upload this file into. A declared file lands in exactly
   * one; an inferred file lands in every family the filename pointed at, which
   * is how the panel has always behaved.
   */
  families: T[];
  /** Why the file was not placed. `null` whenever `basis` is set. */
  refusal: string | null;
}

/**
 * Where one file goes: the declaration if there is one, the filename if there
 * is not.
 *
 * A declaration that names a family which is not open is REFUSED, not quietly
 * re-inferred. Falling back there would make the picker honoured sometimes and
 * overridden other times, with nothing on screen saying which happened — and a
 * stale picked value (a family committed since the page loaded) is exactly when
 * the uploader most needs to be told rather than guessed for.
 */
export function resolveCurrentStateUploadFamilies<
  T extends CurrentStateFamilyIdentity,
>(input: {
  fileName: string;
  declaredFamilyKey?: string | null;
  openFamilies: readonly T[];
}): CurrentStateUploadRouting<T> {
  const declared = input.declaredFamilyKey?.trim();
  if (declared) {
    const match = input.openFamilies.find((family) => family.key === declared);
    if (match) return { basis: "declared", families: [match], refusal: null };
    return {
      basis: null,
      families: [],
      refusal: `"${declared}" is not an open evidence family on this readiness map, so the declaration could not be honoured. Pick a family that is still open, or reload the readiness map.`,
    };
  }

  const inferred = inferCurrentStateFamilies(
    input.fileName,
    input.openFamilies,
  );
  if (inferred.length > 0) {
    return { basis: "inferred", families: inferred, refusal: null };
  }
  return {
    basis: null,
    families: [],
    refusal:
      "No open current-state family matched this file name. Declare the family this file covers and upload it again.",
  };
}
