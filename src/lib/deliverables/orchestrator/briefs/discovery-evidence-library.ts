// Reusable evidence-family library + composition (Phase 3 of the configurable
// archetype layer).
//
// Phase 1 made the archetype catalog data; Phase 2 defined the contract a
// configured source must satisfy. Both still require every archetype to spell
// out each evidence family in full. That is the cost a deploying firm pays per
// archetype, and it is where drift starts: the SAME family id is already
// written four different ways across the built-in seed (see
// `finance_baseline_value_plan`), because nothing held a canonical definition
// for it.
//
// This module holds that canonical definition once and lets an archetype
// REFERENCE it — optionally restating the fields its own context needs. The
// reference carries the id, so a reference can never rename the family it
// points at, and an archetype that wants wording of its own still says so
// explicitly rather than by accident.
//
// Composition is pure and additive: nothing in the built-in seed is recomposed
// by this slice, so resolution behaviour is unchanged. The seam is what a
// configured source (and the Phase 4 setup UI) composes against.

import type { EvidenceFamily, InterviewRole } from "./discovery-blueprint";

/**
 * Canonical, archetype-neutral evidence families, keyed by family id.
 *
 * Two groups: the five families any Move needs regardless of archetype
 * (current state, systems, KPI baseline, cost baseline, org) and the four
 * value/governance families that the specific archetypes in the seed already
 * repeat. The five neutral ones are the `general_default` archetype's own
 * wording, verbatim — that archetype IS the general case, so copying it is
 * what makes "canonical" mean something checkable rather than a sixth opinion.
 * An archetype with a sharper phrasing overrides the field instead of
 * redefining the family.
 */
export const SHARED_EVIDENCE_FAMILIES: Readonly<
  Record<string, EvidenceFamily>
> = Object.freeze({
  current_state_process: {
    id: "current_state_process",
    label: "Current-state process / operating documentation",
    grounds: "Current-State Assessment",
    required: true,
    likelySource: "Process owner",
    format: "Doc",
  },
  it_systems_landscape: {
    id: "it_systems_landscape",
    label: "Systems landscape",
    grounds: "Current-State · Target Architecture",
    required: true,
    likelySource: "Enterprise Architecture",
    format: "CSV",
  },
  kpi_baseline: {
    id: "kpi_baseline",
    label: "KPI / metric baseline",
    grounds: "Value Model · Business Case",
    required: true,
    likelySource: "Finance / Analytics",
    format: "XLSX",
  },
  cost_baseline: {
    id: "cost_baseline",
    label: "Cost baseline",
    grounds: "Value Model · ROI",
    required: true,
    likelySource: "Finance",
    format: "XLSX",
  },
  org_workforce: {
    id: "org_workforce",
    label: "Org / workforce model",
    grounds: "Operating Model",
    required: false,
    likelySource: "HR / Workforce",
    format: "Doc",
  },
  finance_baseline_value_plan: {
    id: "finance_baseline_value_plan",
    label: "Finance baseline and value measurement plan",
    grounds: "Business Case · Value Proof",
    required: true,
    likelySource: "Finance / FP&A",
    format: "XLSX",
  },
  measurement_owner_cadence: {
    id: "measurement_owner_cadence",
    label: "Measurement owner and cadence",
    grounds: "Value Measurement Contract",
    required: true,
    likelySource: "Analytics / Finance / PMO",
    format: "Metric owner table",
  },
  model_risk_responsible_ai_controls: {
    id: "model_risk_responsible_ai_controls",
    label: "Model risk and responsible AI controls",
    grounds: "Risk · Approval Guardrails",
    required: true,
    likelySource: "Model Risk / Responsible AI / Compliance",
    format: "Control checklist",
  },
  change_adoption_owner: {
    id: "change_adoption_owner",
    label: "Change and adoption owner",
    grounds: "Change Plan · Adoption Risk",
    required: false,
    likelySource: "Transformation / Change Lead",
    format: "RACI or adoption plan",
  },
});

/**
 * A reference to a library family, with any field restated for this archetype.
 * `id` is not overridable: it comes from `ref`, so a reference always resolves
 * to the family it names.
 */
export interface EvidenceFamilyRef extends Partial<Omit<EvidenceFamily, "id">> {
  ref: string;
}

/** Either a family written out in full, or a reference to a library family. */
export type EvidenceFamilySpec = EvidenceFamily | EvidenceFamilyRef;

/** A spec is a reference when it names a `ref` instead of carrying an `id`. */
export function isEvidenceFamilyRef(
  spec: EvidenceFamilySpec,
): spec is EvidenceFamilyRef {
  return typeof (spec as EvidenceFamilyRef).ref === "string";
}

export interface ComposedEvidenceFamilies {
  families: EvidenceFamily[];
  /** Why a spec was dropped. Empty means every spec resolved. */
  errors: string[];
}

/**
 * Resolve a list of specs into concrete evidence families, in order.
 *
 * A reference to an unknown family and a duplicate id are both errors rather
 * than silently-dropped specs: a configured archetype that half-resolved would
 * produce an evidence request a client could not satisfy, with nothing on the
 * screen saying a family went missing. The caller decides what to do with
 * `errors`; `loadDiscoveryBlueprintCatalog`-style callers reject the source
 * whole.
 */
export function composeEvidenceFamilies(
  specs: readonly EvidenceFamilySpec[],
  library: Readonly<Record<string, EvidenceFamily>> = SHARED_EVIDENCE_FAMILIES,
): ComposedEvidenceFamilies {
  const families: EvidenceFamily[] = [];
  const errors: string[] = [];
  const seen = new Set<string>();

  specs.forEach((spec, index) => {
    let resolved: EvidenceFamily;
    if (isEvidenceFamilyRef(spec)) {
      // An OWN-property read, not a plain index. The library is an ordinary
      // object, so a `ref` of `constructor` / `toString` / `__proto__` indexes
      // an inherited `Object.prototype` member: truthy, and not a family. The
      // composed result would then carry `id: undefined` and a family nobody
      // declared would reach a client's evidence request. A reference resolves
      // only to a family the library itself holds.
      const base = Object.hasOwn(library, spec.ref)
        ? library[spec.ref]
        : undefined;
      if (!base) {
        errors.push(
          `evidenceFamilies[${index}]: unknown shared family "${spec.ref}"`,
        );
        return;
      }
      const applied = Object.fromEntries(
        Object.entries(spec).filter(
          ([field, value]) => field !== "ref" && value !== undefined,
        ),
      );
      resolved = { ...base, ...applied, id: base.id };
    } else {
      resolved = { ...spec };
    }
    if (seen.has(resolved.id)) {
      errors.push(
        `evidenceFamilies[${index}]: duplicate family id "${resolved.id}"`,
      );
      return;
    }
    seen.add(resolved.id);
    families.push(resolved);
  });

  return { families, errors };
}

/**
 * An archetype as a configured source may express it: evidence families given
 * as specs rather than as fully-written families.
 */
export interface DiscoveryBlueprintComposition {
  blueprintId: string;
  blueprintVersion: string;
  archetypeLabel: string;
  suggestionKeywords?: string[];
  evidenceFamilies: EvidenceFamilySpec[];
  interviewRoster: InterviewRole[];
}

export interface ComposedDiscoveryBlueprint {
  /** Null when composition failed; `errors` then says why. */
  blueprint: {
    blueprintId: string;
    blueprintVersion: string;
    archetypeLabel: string;
    suggestionKeywords?: string[];
    evidenceFamilies: EvidenceFamily[];
    interviewRoster: InterviewRole[];
  } | null;
  errors: string[];
}

/**
 * Compose one archetype from its specs. Rejected whole on any composition
 * error, matching how a configured catalog source is validated: a partially
 * composed archetype is worse than a rejected one, because the gap is
 * invisible downstream.
 */
export function composeDiscoveryBlueprint(
  composition: DiscoveryBlueprintComposition,
  library: Readonly<Record<string, EvidenceFamily>> = SHARED_EVIDENCE_FAMILIES,
): ComposedDiscoveryBlueprint {
  const { families, errors } = composeEvidenceFamilies(
    composition.evidenceFamilies,
    library,
  );
  if (errors.length > 0) {
    return { blueprint: null, errors };
  }
  if (families.length === 0) {
    return {
      blueprint: null,
      errors: ["evidenceFamilies: an archetype must request some evidence"],
    };
  }
  return {
    blueprint: {
      blueprintId: composition.blueprintId,
      blueprintVersion: composition.blueprintVersion,
      archetypeLabel: composition.archetypeLabel,
      ...(composition.suggestionKeywords
        ? { suggestionKeywords: composition.suggestionKeywords }
        : {}),
      evidenceFamilies: families,
      interviewRoster: composition.interviewRoster,
    },
    errors: [],
  };
}

export interface SharedEvidenceFamilyDrift {
  blueprintId: string;
  familyId: string;
  /** Fields the archetype states differently from the canonical definition. */
  restatedFields: string[];
}

/**
 * Report where an archetype states a shared family differently from the
 * library's canonical definition.
 *
 * This is not a failure: an archetype restating `likelySource` because its
 * evidence sits with a different team is the point of overrides. It is a
 * reading of how far the catalog has drifted from the canonical wording, so a
 * setup flow can show "this archetype restates 3 fields" instead of leaving a
 * deployer to diff two blocks of prose by eye. Families absent from the
 * library are not reported — there is nothing canonical to drift from.
 */
export function sharedEvidenceFamilyDrift(
  catalog: Readonly<Record<string, { evidenceFamilies: EvidenceFamily[] }>>,
  library: Readonly<Record<string, EvidenceFamily>> = SHARED_EVIDENCE_FAMILIES,
): SharedEvidenceFamilyDrift[] {
  const drift: SharedEvidenceFamilyDrift[] = [];
  const fields: (keyof Omit<EvidenceFamily, "id">)[] = [
    "label",
    "grounds",
    "required",
    "likelySource",
    "format",
  ];
  for (const [blueprintId, blueprint] of Object.entries(catalog)) {
    for (const family of blueprint.evidenceFamilies) {
      const canonical = library[family.id];
      if (!canonical) continue;
      const restatedFields = fields.filter(
        (field) => family[field] !== canonical[field],
      );
      if (restatedFields.length > 0) {
        drift.push({ blueprintId, familyId: family.id, restatedFields });
      }
    }
  }
  return drift;
}
