// =============================================================================
// Archetype context bundle + grounded answering (PR-6).
// -----------------------------------------------------------------------------
// The context an agent MUST receive before reasoning about a Move: tenant,
// archetype (id/name/version), phase, estate profile, current-state readiness
// (instruments + states + gaps), the recommendation (maturity + where-to-start +
// gaps), the plan summary, and the missing-evidence list. No raw user-only prompt
// should reach Claude — it reasons over THIS bundle, tenant-scoped.
//
// answerGrounded() answers the canonical CXO questions deterministically from the
// bundle, emitting a GroundedAnswer envelope: every answer cites committed
// evidence or names the missing evidence — unsupportedClaims is always []. This
// is the grounding proof seam (and the contract any LLM agent answer must meet).
// =============================================================================

import "server-only";
import type { TenancyCtx } from "@/lib/programs/types.db";
import {
  inferMoveProfile,
  resolveCurrentStateReadiness,
  type MoveProfile,
  type ReadinessReport,
} from "@/lib/programs/current-state-readiness";
import {
  buildCurrentStateRecommendation,
  type CurrentStateRecommendation,
} from "@/lib/programs/current-state-maturity";
import {
  buildCurrentStatePlan,
  type CurrentStatePlan,
} from "@/lib/programs/current-state-plan";
import {
  getArchetype,
  resolveProgramArchetype,
} from "@/lib/programs/archetypes/registry";
import { getStrategicMoveById } from "@/lib/programs/queries";
import { resolveArchetypeRequirements } from "@/lib/programs/archetypes/resolver";
import type { GroundedAnswerEnvelope } from "@/lib/programs/archetypes/types";
import { resolveSourceLabel } from "@/lib/programs/deliverables/source-labels";

export interface ArchetypeContextBundle {
  tenant: string;
  archetype: { id: string; name: string; version: string };
  phase: number;
  profile: MoveProfile;
  readiness: ReadinessReport;
  recommendation: CurrentStateRecommendation;
  plan: CurrentStatePlan;
  missingEvidence: string[];
}

/** Build the grounded context bundle for a Move at a phase. Tenant-scoped. */
export async function buildArchetypeContextBundle(
  ctx: TenancyCtx,
  moveId: string,
  phase: number,
): Promise<ArchetypeContextBundle> {
  // Archetype resolved from the Move's own row (best-effort) — never a
  // hardcoded default for a Move we can read.
  let moveName = moveId;
  let archetype = resolveProgramArchetype({});
  try {
    const move = await getStrategicMoveById(ctx, moveId);
    if (move?.name) moveName = move.name;
    if (move) {
      archetype = resolveProgramArchetype({
        archetype: move.archetype,
        classification: (move.charter as { classification?: string } | null)
          ?.classification,
        name: move.name,
      });
    }
  } catch {
    /* best-effort */
  }
  const profile = await inferMoveProfile(ctx);
  const readiness = await resolveCurrentStateReadiness(
    ctx,
    archetype,
    profile,
    phase,
    moveId,
  );
  const recommendation = await buildCurrentStateRecommendation(ctx, profile);
  const plan = buildCurrentStatePlan(recommendation, { moveName });
  const missingEvidence = readiness.instruments
    .filter((i) => i.status !== "committed")
    .map((i) => i.key);
  return {
    tenant: ctx.clientKey ?? ctx.clientId,
    archetype: {
      id: archetype.id,
      name: archetype.name,
      version: archetype.version,
    },
    phase,
    profile,
    readiness,
    recommendation,
    plan,
    missingEvidence,
  };
}

export interface GroundedAnswer {
  question: string;
  answer: string;
  envelope: GroundedAnswerEnvelope;
}

function envelope(
  b: ArchetypeContextBundle,
  opts: {
    citations: string[];
    missing: string[];
    specific: boolean;
  },
): GroundedAnswerEnvelope {
  return {
    tenantResolved: b.tenant,
    archetypeResolved: b.archetype.id,
    evidenceUsed: opts.citations,
    missingEvidence: opts.missing,
    citations: opts.citations,
    unsupportedClaims: [], // by construction — every claim cites or names-missing
    confidence:
      opts.citations.length === 0
        ? "insufficient_evidence"
        : b.recommendation.overallConfidence,
    specific: opts.specific,
  };
}

const committed = (b: ArchetypeContextBundle, key: string) =>
  b.readiness.instruments.find(
    (i) => i.key === key && i.status === "committed",
  );

// Render an evidence-family key as its HUMAN label in answer text — never the
// raw snake_case key (e.g. "it_systems_landscape" → "IT systems & application
// landscape"). The bundle's readiness instruments carry the curated label;
// fall back to the deterministic source-label humanizer. Envelope fields keep
// the raw key for machine traceability — only the human-facing answer text is
// humanized.
const familyLabel = (b: ArchetypeContextBundle, key: string): string =>
  b.readiness.instruments.find((i) => i.key === key)?.label ??
  resolveSourceLabel(key).title;

/**
 * Answer a canonical CXO question grounded in the bundle. Deterministic — the
 * proof that the engine cites or refuses, never fabricates. (An LLM agent answer
 * must meet the same GroundedAnswer contract.)
 */
export function answerGrounded(
  b: ArchetypeContextBundle,
  question: string,
): GroundedAnswer {
  const q = question.toLowerCase();
  const cite = (key: string) =>
    b.readiness.instruments.find((i) => i.key === key)?.backingTable ??
    "method";

  // 1) What evidence is missing before charter approval?
  if (/missing|before charter|charter approv|what.*need/.test(q)) {
    const families = b.readiness.hardGaps;
    return {
      question,
      answer:
        families.length === 0
          ? "No hard current-state gaps remain — the charter's claims are all sourced."
          : `Missing before charter approval (${families.length} hard gaps): ${families.map((k) => familyLabel(b, k)).join(", ")}. Charter claims resting on these stay flagged [MISSING EVIDENCE] until provided + committed.`,
      envelope: envelope(b, {
        citations: [],
        missing: families,
        specific: families.length > 0,
      }),
    };
  }

  // 2) What does the DORA baseline imply?
  if (/dora|delivery baseline|deploy freq|engineering baseline/.test(q)) {
    const dora = committed(b, "eng_performance_dora");
    if (!dora) {
      return {
        question,
        answer: `Insufficient context: the engineering delivery baseline is not committed [MISSING EVIDENCE: ${familyLabel(b, "eng_performance_dora")}] — I cannot assert DORA implications without it.`,
        envelope: envelope(b, {
          citations: [],
          missing: ["eng_performance_dora"],
          specific: true,
        }),
      };
    }
    const plat = b.recommendation.maturity.find(
      (d) => d.dimension === "platform_infrastructure",
    );
    const ops = b.recommendation.maturity.find(
      (d) => d.dimension === "operating_model_process",
    );
    return {
      question,
      answer: `DORA baseline committed (cited ${resolveSourceLabel(dora.backingTable!).title}). Platform & Infrastructure maturity ${plat?.score ?? "n/a"}/5, Operating Model & Process ${ops?.score ?? "n/a"}/5 — implies AI-leverage is highest where delivery is already automated; ${b.recommendation.whereToStart}`,
      envelope: envelope(b, {
        citations: [dora.backingTable!, "method:maturity_scoring"],
        missing: [],
        specific: true,
      }),
    };
  }

  // 3) What IT systems are in scope?
  if (/it systems|systems in scope|cmdb|application landscape/.test(q)) {
    const sys = committed(b, "it_systems_landscape");
    if (!sys) {
      return {
        question,
        answer:
          `The IT systems & application landscape is not yet committed [MISSING EVIDENCE: ${familyLabel(b, "it_systems_landscape")}] — scope cannot be enumerated until the CMDB export is provided + committed (${resolveSourceLabel("tower_cmdb_cis").title}).`,
        envelope: envelope(b, {
          citations: [],
          missing: ["it_systems_landscape"],
          specific: true,
        }),
      };
    }
    return {
      question,
      answer: `IT systems in scope are committed (cited ${resolveSourceLabel(sys.backingTable!).title}, ${sys.committedRows} CIs).`,
      envelope: envelope(b, {
        citations: [sys.backingTable!],
        missing: [],
        specific: true,
      }),
    };
  }

  // 4) What org / stakeholder risks exist?
  if (/org|stakeholder|risk|decision rights/.test(q)) {
    const missing = ["it_org_structure", "stakeholder_map"].filter(
      (k) => !committed(b, k),
    );
    const risks = getArchetype(b.archetype.id)?.riskModel.dimensions ?? [];
    return {
      question,
      answer: `Org/stakeholder evidence: ${missing.length ? `${missing.map((k) => familyLabel(b, k)).join(", ")} not yet committed [MISSING EVIDENCE]` : "committed"}. Archetype risk dimensions to assess: ${risks.join("; ")}.`,
      envelope: envelope(b, {
        citations: missing.length ? [] : [cite("it_org_structure")],
        missing,
        specific: true,
      }),
    };
  }

  // 5) What should be diagnosed in P2?
  if (/diagnose|p2|discover/.test(q)) {
    const reqs = resolveArchetypeRequirements(
      getArchetype(b.archetype.id)!,
      "diagnose",
      b.profile,
    ).map((r) => r.family.key);
    return {
      question,
      answer: `P2 Diagnose (archetype-driven) requires: ${reqs.map((k) => familyLabel(b, k)).join(", ")}. These are computed from the ${b.archetype.name} archetype × this estate — not a fixed list.`,
      envelope: envelope(b, {
        citations: ["archetype:" + b.archetype.id],
        missing: [],
        specific: true,
      }),
    };
  }

  // 6) What deliverables should be generated next?
  if (/deliverable|next|generate|artifact/.test(q)) {
    const arch = getArchetype(b.archetype.id)!;
    const phaseKey =
      b.phase === 1 ? "charter" : b.phase === 2 ? "diagnose" : "charter";
    const d = arch.deliverablePack
      .filter((x) => x.phase === phaseKey)
      .map((x) => x.label);
    return {
      question,
      answer: `Next deliverables for the ${arch.name} archetype at this phase: ${d.join(", ") || "none defined"}. Each is generated grounded — claims cited or flagged [MISSING EVIDENCE].`,
      envelope: envelope(b, {
        citations: ["archetype:" + arch.id],
        missing: b.readiness.hardGaps,
        specific: true,
      }),
    };
  }

  // Fallback — refuse rather than guess.
  return {
    question,
    answer:
      "Insufficient context to answer this specifically from the committed evidence for this Move. State the question in terms of the current-state evidence, maturity, or the plan.",
    envelope: envelope(b, {
      citations: [],
      missing: b.missingEvidence,
      specific: false,
    }),
  };
}

export const CANONICAL_QUESTIONS = [
  "What evidence is missing before charter approval?",
  "What does the DORA baseline imply?",
  "What IT systems are in scope?",
  "What org/stakeholder risks exist?",
  "What should be diagnosed in P2?",
  "What deliverables should be generated next?",
];
