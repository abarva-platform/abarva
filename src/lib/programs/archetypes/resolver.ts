// =============================================================================
// Two-axis requirement resolver (PR-1).
// -----------------------------------------------------------------------------
//   required(phase) = archetype.requirements(phase)  ⨯  estate(profile)
// The ARCHETYPE declares what evidence the work needs at a phase; the client's
// real ESTATE (profile) prunes/re-severities the estate-scoped ones (e.g. drop
// DORA for a mainframe estate, soften it for a waterfall team). This is the only
// place phase requirements come from — Charter/phase code never hardcodes them.
// =============================================================================

import type {
  StrategicMoveArchetype,
  PhaseKey,
  Severity,
  ResolvedEvidenceRequirement,
} from "./types";
import type {
  MoveProfile,
  TeamArchetype,
} from "@/lib/programs/current-state-readiness";

const has = (p: MoveProfile, ...t: TeamArchetype[]) =>
  t.some((x) => p.teamArchetypes.includes(x));
const archetypesUnknown = (p: MoveProfile) => p.teamArchetypes.length === 0;

/**
 * Estate predicates for estate-scoped evidence families. The second axis: given
 * the client's estate, does an archetype-required family still apply, and at what
 * severity? Families without a predicate keep the archetype's declared severity.
 */
const ESTATE_PREDICATES: Record<
  string,
  {
    appliesWhen: (p: MoveProfile) => boolean;
    severityFor: (p: MoveProfile) => Severity;
  }
> = {
  eng_performance_dora: {
    // DORA is meaningful for teams that ship via CI/CD; for a mainframe-only
    // estate it doesn't apply (the archetype would resolve a change-cadence
    // family instead — added in PR-2).
    appliesWhen: (p) =>
      has(p, "full_stack_cloud", "data_engineering") || archetypesUnknown(p),
    severityFor: (p) =>
      p.deliveryMaturity === "scrum" ||
      p.deliveryMaturity === "continuous" ||
      archetypesUnknown(p)
        ? "hard"
        : "soft",
  },
  it_systems_landscape: {
    // Always applicable (every estate has systems); estate doesn't prune it.
    appliesWhen: () => true,
    severityFor: () => "hard",
  },
  // Mainframe baseline — the engineering-delivery family for mainframe estates
  // (resolves INSTEAD of DORA). Applies only when a mainframe estate is present.
  mainframe_change_cadence: {
    appliesWhen: (p) => has(p, "mainframe"),
    severityFor: () => "hard",
  },
  mainframe_modernization_candidates: {
    appliesWhen: (p) => has(p, "mainframe"),
    severityFor: () => "soft",
  },
  // DataStage/Informatica estates: the unit of leverage is the ETL job.
  etl_job_inventory: {
    appliesWhen: (p) => has(p, "legacy_data_analytics"),
    severityFor: () => "soft",
  },
};

/**
 * Resolve the evidence requirements for an archetype at a phase, refined by the
 * estate profile. Pure + deterministic.
 */
export function resolveArchetypeRequirements(
  archetype: StrategicMoveArchetype,
  phaseKey: PhaseKey,
  profile?: MoveProfile,
): ResolvedEvidenceRequirement[] {
  const phaseReq = archetype.phaseModel.find((p) => p.phase === phaseKey);
  if (!phaseReq) return [];

  const familyByKey = new Map(
    archetype.evidenceFamilies.map((f) => [f.key, f]),
  );

  const out: ResolvedEvidenceRequirement[] = [];
  for (const req of phaseReq.requiredEvidence) {
    const spec = familyByKey.get(req.family);
    if (!spec) continue; // archetype mis-declared a family; skip defensively

    let severity = req.severity;
    let estateResolved = false;
    let rationale =
      severity === "hard"
        ? `${archetype.name} requires ${spec.label} at ${phaseKey}.`
        : `${archetype.name} can use ${spec.label} at ${phaseKey} as optional context; it is not a hard blocker.`;

    if (req.estateScoped && profile) {
      const pred = ESTATE_PREDICATES[req.family];
      if (pred) {
        estateResolved = true;
        if (!pred.appliesWhen(profile)) {
          // Estate prunes this requirement entirely.
          continue;
        }
        severity = pred.severityFor(profile);
        const estateLabel =
          profile.teamArchetypes.join(", ") || "estate not yet discovered";
        rationale =
          severity === "hard"
            ? `${archetype.name} requires ${spec.label}; estate-resolved severity ${severity} (${estateLabel}).`
            : `${archetype.name} can use ${spec.label} as optional context; estate-resolved severity ${severity} (${estateLabel}).`;
      }
    }

    out.push({ family: spec, severity, estateResolved, rationale });
  }

  return out;
}
