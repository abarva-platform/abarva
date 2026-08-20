import "server-only";

import { requireTenancy, TenancyError } from "@/app/api/v1/programs/_auth";
import { getActiveClientRow } from "@/lib/active-client";
import { loadUserProgramAccessPolicy } from "@/lib/auth/program-access-policy";
import { CLIENT_KEY_TO_INDUSTRY_CODE } from "@/lib/client-config";
import { getAzureWriteFluentClient } from "@/lib/data-plane/postgresCompat";
import { submitForApproval } from "@/lib/programs/approval";
import { markDraftCommitted } from "@/lib/programs/origination-drafts";
import type { OriginSource } from "@/lib/programs/types.db";
import { normalizeProgramArchetype } from "@/lib/programs/archetype-normalization";
import { buildEngagementGraphNodeId } from "@/lib/programs/mutations";
import { parseUsdRangeFromText } from "@/lib/programs/value-utils";
import {
  assessOriginationBrief,
  suitabilityCharterFragment,
} from "@/lib/programs/suitability/origination-suitability";
import { originationCharterExtensions } from "@/lib/programs/origination-charter-extensions";
import {
  CHARTER_FUNCTION_PACK_CONFIDENCE_KEY,
  CHARTER_FUNCTION_PACK_KEY,
  classifyFunctionKey,
  industryKeyForCode,
} from "@/lib/programs/function-identity";
import { ensureThreadForMove } from "@/lib/decisions/auto-linker";
import { linkAskSessionToMove } from "@/lib/intelligence/ask/session-memory";
import {
  normalizePromotionRationale,
  optionalStringArray,
  validateIntelligencePromotionApproval,
} from "@/lib/programs/intelligence-promotion-approval";
import { isFeatureEnabled } from "@/lib/features/is-feature-enabled";
import {
  applyDiscoveryShapeIfEnabled,
  embedDiscoveryPlanInCharter,
} from "@/lib/programs/discovery/charter-transformers";
import { applyExtendedIntakeFieldsIfEnabled } from "@/lib/programs/p0-extended-intake-fields";
import type { ExtendedIntakeFields } from "@/lib/programs/p0-extended-intake-fields";
import { persistP0PhaseCaptureFromSource } from "@/lib/programs/p0-phase-capture";
import { planFromShape } from "@/lib/programs/discovery/discovery-intake";
import type { DiscoveryShape } from "@/lib/programs/discovery/discovery-intake";
import {
  parsePersonLabelForOrigination,
  parsePersonMentionsForOrigination,
  type ParsedPersonLabel,
} from "@/lib/programs/person-label";

export interface OriginationTurn {
  role: "user" | "assistant";
  text: string;
}

export interface SubmitOriginationBriefInput {
  surface: string;
  programName: string;
  problemStatement: string;
  targetOutcome?: string | null;
  timeline?: string | null;
  classification?: string | null;
  sponsor: string;
  lead?: string | null;
  matchedPatternId?: string | null;
  // Extended scaffold fields (steps 4–9). `scopeBoundary` is the legacy
  // blended field (kept for backward-compatible reads of older callers);
  // `scopeIn`/`scopeOut` are the current split fields the P0 scaffold
  // captures — when present they are the source of truth and `scopeBoundary`
  // is derived from them for anything still reading the old shape.
  scopeBoundary?: string | null;
  scopeIn?: string | null;
  scopeOut?: string | null;
  outcomesSuccess?: string | null;
  discoveryQuestions?: string | null;
  evidenceFamily?: string | null;
  // From "Shape into a Move →" initiative context
  fromInitiativeId?: string | null;
  fromGapUsd?: number | null;
  // Origination chat turns for persistence to turns table
  originationTurns?: OriginationTurn[] | null;
  // Packet 22 acceleration: Intelligence -> Move continuity.
  originatingIntelligenceSessionId?: string | null;
  decisionThreadTitle?: string | null;
  decisionThreadOwnerRole?: string | null;
  humanPromotionAccepted?: boolean | null;
  humanPromotionRationale?: string | null;
  promotionEvidenceRefs?: string[] | null;
  // Discovery Intake (S2b): the captured P0 discovery shape. Persisted into the
  // charter JSONB only when the tenant has `discovery_intake_v2` enabled.
  discoveryShape?: DiscoveryShape | null;
  // Extended intake fields (Business Segment, Office Lens, Care Type,
  // Value Hypothesis quant/qual, Stakeholders). Persisted into the charter
  // JSONB only when the tenant has `moves_extended_intake_fields_v1` enabled.
  extendedIntake?: ExtendedIntakeFields | null;
}

export interface SubmitOriginationBriefResult {
  engagementId: string;
  approvalRequestId: string;
  programName: string;
  lifecycleState: "submitted_for_approval";
  redirectTo: string;
  decisionThreadId?: string | null;
  dossierUrl?: string | null;
}

export class OriginationSubmitError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly status = 400,
  ) {
    super(message);
    this.name = "OriginationSubmitError";
  }
}

interface ResolvedPerson {
  id: string;
  name: string;
  role: string | null;
}

interface Classification {
  functionCode: "FRONT_OFFICE" | "MIDDLE_OFFICE" | "BACK_OFFICE";
  objectiveCode: "GROW" | "OPTIMISE" | "CONTROL";
  topicCode: string;
}

interface PersonRow {
  id: string;
  name: string;
  role: string | null;
  organization: string | null;
  email: string | null;
}

const ORIGINATION_PLACEHOLDER_PERSON_MARKER = "origination_placeholder";

function requiredText(value: unknown, field: string): string {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new OriginationSubmitError("missing_field", `${field} is required`);
  }
  return value.trim();
}

function optionalText(value: string | null | undefined): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function originationRedirectForSurface(
  surface: string,
  programId: string,
): string {
  return surface === "/strategic-moves/new"
    ? `/strategic-moves/${programId}/phase/0?focus=gate`
    : `/programs/${programId}`;
}

function normalizeLabel(value: string): string {
  return value
    .toLowerCase()
    .replace(/\([^)]*\)/g, " ")
    .replace(/[^\p{L}\p{N}@.]+/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function roleOnlyPlaceholderForOrigination(
  parsedLabel: ParsedPersonLabel,
): { name: string; role: string } | null {
  if (parsedLabel.placeholderName) return null;
  const role =
    optionalText(parsedLabel.placeholderRole) ?? parsedLabel.lookupLabel;
  const normalized = normalizeLabel(role);
  if (
    !/\b(ceo|cfo|coo|cio|cto|cmo|cco|cdo|cdao|ciso|chro|cro|caio|cmio|vp|svp|evp|director|chief|officer|sponsor|owner|lead)\b/.test(
      normalized,
    )
  ) {
    return null;
  }
  const name = role
    .split(/\s+/)
    .map((part) =>
      /^[A-Z]{2,6}$/.test(part)
        ? part
        : part.charAt(0).toUpperCase() + part.slice(1).toLowerCase(),
    )
    .join(" ");
  return { name, role };
}

function personTokens(value: string): string[] {
  const stop = new Set([
    "the",
    "a",
    "an",
    "is",
    "as",
    "sponsor",
    "lead",
    "owner",
    "program",
    "director",
    "chief",
    "officer",
    "vp",
    "vice",
    "president",
  ]);
  return normalizeLabel(value)
    .split(" ")
    .filter((token) => token.length >= 2 && !stop.has(token))
    .slice(0, 4);
}

function scorePersonLabelMatch(row: PersonRow, label: string): number {
  const labelNorm = normalizeLabel(label);
  const nameNorm = normalizeLabel(row.name);
  if (!nameNorm) return 0;

  let score = 0;
  const nameIndex = labelNorm.indexOf(nameNorm);
  if (nameIndex >= 0) {
    score += 100 + Math.max(0, 40 - nameIndex);
    if (nameIndex === 0) score += 30;

    const window = labelNorm.slice(
      Math.max(0, nameIndex - 24),
      Math.min(labelNorm.length, nameIndex + nameNorm.length + 48),
    );
    if (
      /\b(consulted|informed|not co sponsor|not sponsor|not accountable|not responsible)\b/.test(
        window,
      )
    ) {
      score -= 120;
    }
  }

  for (const token of nameNorm.split(" ").filter((part) => part.length >= 2)) {
    if (labelNorm.includes(token)) score += 8;
  }

  const roleNorm = normalizeLabel(row.role ?? "");
  if (roleNorm && labelNorm.includes(roleNorm)) score += 12;

  return score;
}

function slugifyTopicCode(value: string): string {
  const slug = value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 80);
  return slug || "program_origination";
}

function classifyBrief(input: SubmitOriginationBriefInput): Classification {
  const text = [
    input.programName,
    input.problemStatement,
    input.targetOutcome ?? "",
    input.timeline ?? "",
    input.classification ?? "",
    input.matchedPatternId ?? "",
  ]
    .join(" ")
    .toLowerCase();

  let functionCode: Classification["functionCode"] = "MIDDLE_OFFICE";
  if (
    /\b(finance|hr|hcm|erp|procurement|supply chain|payroll|back[- ]office|revenue cycle|rcm)\b/.test(
      text,
    )
  ) {
    functionCode = "BACK_OFFICE";
  } else if (
    /\b(customer|consumer|patient|member|sales|marketing|commerce|checkout|store|portal|front[- ]office)\b/.test(
      text,
    )
  ) {
    functionCode = "FRONT_OFFICE";
  }

  let objectiveCode: Classification["objectiveCode"] = "OPTIMISE";
  if (
    /\b(risk|control|compliance|governance|audit|security|regulatory|privacy)\b/.test(
      text,
    )
  ) {
    objectiveCode = "CONTROL";
  } else if (
    /\b(growth|grow|revenue|acquisition|retention|conversion|market share)\b/.test(
      text,
    )
  ) {
    objectiveCode = "GROW";
  }

  return {
    functionCode,
    objectiveCode,
    topicCode: slugifyTopicCode(input.programName),
  };
}

async function resolvePersonByLabel(input: {
  label: string;
  clientName: string;
  fallbackUserId: string;
  parsedLabel?: ParsedPersonLabel;
}): Promise<ResolvedPerson> {
  const sb = getAzureWriteFluentClient();
  const fallbackLooksLikeUuid =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
      input.fallbackUserId,
    );

  const parsedLabel =
    input.parsedLabel ?? parsePersonLabelForOrigination(input.label);
  const lookupLabel = parsedLabel.lookupLabel;
  const tokens = personTokens(lookupLabel);
  const clauses = tokens.flatMap((token) => [
    `name.ilike.%${token}%`,
    `email.ilike.%${token}%`,
    `role.ilike.%${token}%`,
  ]);

  const query =
    clauses.length > 0
      ? sb
          .from("persons")
          .select("id, name, role, organization, email")
          .or(clauses.join(","))
          .limit(25)
      : sb
          .from("persons")
          .select("id, name, role, organization, email")
          .eq("id", input.fallbackUserId)
          .limit(25);

  const { data, error } = await query;
  if (error) {
    throw new OriginationSubmitError(
      "person_lookup_failed",
      error.message,
      500,
    );
  }

  const labelNorm = normalizeLabel(lookupLabel);
  const clientNorm = normalizeLabel(input.clientName);
  const rows = ((data ?? []) as PersonRow[]).filter((row) => {
    const orgNorm = normalizeLabel(row.organization ?? "");
    return orgNorm.includes(clientNorm) || clientNorm.includes(orgNorm);
  });

  const exact = rows.find((row) => normalizeLabel(row.name) === labelNorm);
  const scored = rows
    .map((row) => ({ row, score: scorePersonLabelMatch(row, lookupLabel) }))
    .sort((a, b) => b.score - a.score);
  const contains = exact ?? (scored[0]?.score > 0 ? scored[0].row : undefined);
  const currentUser = rows.find(
    (row) => fallbackLooksLikeUuid && row.id === input.fallbackUserId,
  );
  const picked = contains ?? currentUser ?? rows[0];

  const placeholderSpec = parsedLabel.placeholderName
    ? {
        name: parsedLabel.placeholderName,
        role: parsedLabel.placeholderRole,
      }
    : roleOnlyPlaceholderForOrigination(parsedLabel);

  if (!picked && placeholderSpec) {
    const { data: placeholderRow, error: placeholderError } = await sb
      .from("persons")
      .insert({
        name: placeholderSpec.name,
        email: null,
        role: placeholderSpec.role,
        organization: input.clientName,
        familiarity: "first_meeting",
        personal_threads: [ORIGINATION_PLACEHOLDER_PERSON_MARKER],
      })
      .select("id, name, role")
      .single();
    if (placeholderError || !placeholderRow) {
      throw new OriginationSubmitError(
        "person_placeholder_failed",
        placeholderError?.message ??
          `Could not register "${placeholderSpec.name}" as a pending sponsor in ${input.clientName}'s people records`,
        500,
      );
    }
    const row = placeholderRow as Pick<PersonRow, "id" | "name" | "role">;
    return { id: row.id, name: row.name, role: row.role };
  }

  if (!picked) {
    throw new OriginationSubmitError(
      "person_not_found",
      `Could not resolve "${lookupLabel}" in ${input.clientName}'s people records`,
      422,
    );
  }

  return { id: picked.id, name: picked.name, role: picked.role };
}

async function insertParticipant(input: {
  programId: string;
  person: ResolvedPerson;
  role: string;
  approvalAuthority: "sponsor" | "contributor";
}): Promise<void> {
  const sb = getAzureWriteFluentClient();
  const basePayload = {
    engagement_id: input.programId,
    user_id: input.person.id,
    user_name: input.person.name,
    role: input.role,
    notify_on: ["phase_gate", "approval"],
    approval_authority: input.approvalAuthority,
    last_touchpoint_at: new Date().toISOString(),
  };
  const { error } = await sb.from("engagement_participants").insert({
    ...basePayload,
    program_access_level: "program_member",
    can_view_financial: false,
    can_upload: true,
    can_generate_deliverables: true,
    can_publish_deliverables: input.approvalAuthority === "sponsor",
    can_approve_phase_gates: input.approvalAuthority === "sponsor",
  });
  if (
    error &&
    /program_access_level|can_view_financial|can_upload|can_generate_deliverables|can_publish_deliverables|can_approve_phase_gates/i.test(
      error.message,
    )
  ) {
    const { error: retryError } = await sb
      .from("engagement_participants")
      .insert(basePayload);
    if (retryError) throw retryError;
    return;
  }
  if (error) throw error;
}

/**
 * Resolve the Domain Function Pack key for a Move from its brief text and
 * industry code. Additive — runs alongside the legacy `classifyBrief` /
 * `function_code` office bucket, never replaces it. Returns `null` honestly
 * when the industry does not resolve or no pack clears the confidence floor.
 */
function deriveFunctionPackIdentity(
  input: SubmitOriginationBriefInput,
  industryCode: string,
): { functionPackKey: string; functionPackConfidence: number } | null {
  const industryKey = industryKeyForCode(industryCode);
  if (!industryKey) return null;

  // The Move's brief text — title / objective / topic / brief — the same
  // signal `classifyBrief` reads, concatenated for the function classifier.
  const briefText = [
    input.programName,
    input.problemStatement,
    input.targetOutcome ?? "",
    input.classification ?? "",
  ]
    .filter((part) => part.trim().length > 0)
    .join(" ");

  const classified = classifyFunctionKey(industryKey, briefText);
  if (!classified) return null;
  return {
    functionPackKey: classified.functionKey,
    functionPackConfidence: classified.confidence,
  };
}

/** The charter JSONB plus the function-pack identity promoted out of it. */
interface OriginationCharterResult {
  /** The full charter JSONB written to `engagements.charter`. */
  charter: Record<string, unknown>;
  /**
   * The classified function-pack identity, or `null` when no pack matched.
   * Dual-written: the keys also live inside `charter` for rollback safety, but
   * the caller sets the first-class `engagements.function_pack_key` /
   * `function_pack_confidence` columns from this.
   */
  functionPackIdentity: {
    functionPackKey: string;
    functionPackConfidence: number;
  } | null;
}

/** Build the charter JSONB written to engagements.charter at P0 origination. */
function buildOriginationCharter(
  input: SubmitOriginationBriefInput,
  derived: Classification,
  sponsor: ResolvedPerson,
  programArchetype: string | null,
  industryCode: string,
): OriginationCharterResult {
  // Slice 2.1 · agentic suitability assessment. Run once at P0 from the brief
  // text alone — no data-readiness ledger entry exists yet, so the readiness
  // profile defaults conservatively. The single result is reused below to
  // derive the Wave 2 charter extensions (2.2 / 2.3 / 2.5) so all four
  // fragments are coherent with one another.
  const suitabilityResult = assessOriginationBrief({
    programName: input.programName,
    problemStatement: input.problemStatement,
    targetOutcome: input.targetOutcome,
    classification: input.classification,
  });
  // Slices 2.2 / 2.3 / 2.5 · workflow decomposition, solution-architecture
  // options, and the control & eval matrix. Pure builders composed from the
  // 2.1 result above — additive charter JSONB fields, no surface change.
  const charterExtensions = originationCharterExtensions(suitabilityResult);
  // Function-identity spine · resolve the Move to a Domain Function Pack key
  // from its brief text + industry code. Persisted into the charter so a
  // surface can later call resolveMoveFunctionIdentity → resolveFunctionPack
  // and bind curated industry depth. Honest `null` when no pack matches —
  // additive, never blocks origination, never overrides `function_code`.
  const functionPackIdentity = deriveFunctionPackIdentity(input, industryCode);
  const charter: Record<string, unknown> = {
    version: 1,
    captured_at: new Date().toISOString(),
    ...(functionPackIdentity
      ? {
          [CHARTER_FUNCTION_PACK_KEY]: functionPackIdentity.functionPackKey,
          [CHARTER_FUNCTION_PACK_CONFIDENCE_KEY]:
            functionPackIdentity.functionPackConfidence,
        }
      : {}),
    scaffold: {
      problem_statement: input.problemStatement,
      archetype: input.classification ?? programArchetype,
      resolved_program_archetype: programArchetype,
      // Preserve the P0 scaffold label exactly as captured. Role-level sponsor
      // candidates such as "CFO + Treasurer" may intentionally not resolve to
      // named people yet; the resolved sponsor person is stored separately for
      // approval/permission plumbing.
      sponsor_candidate: input.sponsor,
      resolved_sponsor_candidate: `${sponsor.name}${sponsor.role ? ` · ${sponsor.role}` : ""}`,
      // scope_boundary stays populated (from the split fields when present)
      // for any reader still on the pre-split shape (e.g. p0-brief/route.ts's
      // fallback default text).
      scope_boundary:
        input.scopeIn || input.scopeOut
          ? [
              input.scopeIn ? `In: ${input.scopeIn}` : null,
              input.scopeOut ? `Out: ${input.scopeOut}` : null,
            ]
              .filter(Boolean)
              .join(" ")
          : (input.scopeBoundary ?? null),
      scope_in: input.scopeIn ?? null,
      scope_out: input.scopeOut ?? null,
      outcomes_success: input.outcomesSuccess ?? null,
      discovery_questions: input.discoveryQuestions ?? null,
      evidence_family: input.evidenceFamily ?? null,
      value_hypothesis: input.targetOutcome ?? null,
      foundation_readiness: input.timeline ?? null,
    },
    classification: {
      function_code: derived.functionCode,
      objective_code: derived.objectiveCode,
      topic_code: derived.topicCode,
    },
    initiative_context: input.fromInitiativeId
      ? {
          initiative_id: input.fromInitiativeId,
          gap_usd: input.fromGapUsd ?? null,
        }
      : null,
    // Slice 2.1 · agentic suitability assessment. Scores the proposed Move
    // against the §0.2 archetype spectrum from the brief text alone. The P1
    // Evidence & Assessment phase re-runs this with the real readiness
    // ledger. Logic-only — no surface change.
    agentic_suitability: suitabilityCharterFragment(suitabilityResult),
    // Slice 2.2 · implementable workflow decomposition for the recommended
    // archetype — the node canvas plus blocked-control roll-up.
    workflow_decomposition: charterExtensions.workflow_decomposition,
    // Slice 2.3 · scored solution-architecture option set against the §4
    // reference architecture, with the recommended option flagged.
    solution_architecture: charterExtensions.solution_architecture,
    // Slice 2.5 · control & eval matrix — the controls, verification
    // checklist, and §5 readiness-gate coverage for the phase gate.
    control_eval_matrix: charterExtensions.control_eval_matrix,
  };
  return { charter, functionPackIdentity };
}

/** Persist origination chat turns to the turns table (phase 0, best-effort). */
async function persistOriginationTurns(
  programId: string,
  turns: OriginationTurn[],
): Promise<void> {
  if (!turns.length) return;
  const sb = getAzureWriteFluentClient();
  const rows = turns
    .filter((t) => t.text.trim().length > 0)
    .map((t) => ({
      engagement_id: programId,
      phase: 0,
      sender: t.role === "assistant" ? "agent" : "user",
      text: t.text.trim(),
    }));
  if (!rows.length) return;
  const { error } = await sb.from("turns").insert(rows);
  if (error) {
    // Non-fatal — turns are enrichment. Log and continue.
    console.error("[origination-submit] turns persist failed", {
      programId,
      error: error.message,
    });
  }
}

async function rollbackEngagement(programId: string): Promise<void> {
  try {
    await getAzureWriteFluentClient()
      .from("engagements")
      .delete()
      .eq("id", programId);
  } catch (err) {
    console.error("[origination-submit] rollback failed", {
      programId,
      err: err instanceof Error ? err.message : String(err),
    });
  }
}

export async function submitOriginationBrief(
  rawInput: SubmitOriginationBriefInput,
): Promise<SubmitOriginationBriefResult> {
  const input: SubmitOriginationBriefInput = {
    ...rawInput,
    surface: optionalText(rawInput.surface) ?? "/programs/new",
    programName: requiredText(rawInput.programName, "programName"),
    problemStatement: requiredText(
      rawInput.problemStatement,
      "problemStatement",
    ),
    targetOutcome: optionalText(rawInput.targetOutcome),
    timeline: optionalText(rawInput.timeline),
    classification: optionalText(rawInput.classification),
    sponsor: requiredText(rawInput.sponsor, "sponsor"),
    lead:
      optionalText(rawInput.lead) ?? requiredText(rawInput.sponsor, "sponsor"),
    matchedPatternId: optionalText(rawInput.matchedPatternId),
    scopeBoundary: optionalText(rawInput.scopeBoundary),
    scopeIn: optionalText(rawInput.scopeIn),
    scopeOut: optionalText(rawInput.scopeOut),
    outcomesSuccess: optionalText(rawInput.outcomesSuccess),
    discoveryQuestions: optionalText(rawInput.discoveryQuestions),
    evidenceFamily: optionalText(rawInput.evidenceFamily),
    fromInitiativeId: optionalText(rawInput.fromInitiativeId),
    fromGapUsd:
      typeof rawInput.fromGapUsd === "number" ? rawInput.fromGapUsd : null,
    originationTurns: Array.isArray(rawInput.originationTurns)
      ? rawInput.originationTurns
      : null,
    originatingIntelligenceSessionId: optionalText(
      rawInput.originatingIntelligenceSessionId,
    ),
    decisionThreadTitle: optionalText(rawInput.decisionThreadTitle),
    decisionThreadOwnerRole: optionalText(rawInput.decisionThreadOwnerRole),
    humanPromotionAccepted: rawInput.humanPromotionAccepted === true,
    humanPromotionRationale: normalizePromotionRationale(
      rawInput.humanPromotionRationale,
    ),
    promotionEvidenceRefs: optionalStringArray(rawInput.promotionEvidenceRefs),
  };

  const promotionApproval = validateIntelligencePromotionApproval(input);
  if (promotionApproval.error) {
    throw new OriginationSubmitError(
      "intelligence_promotion_approval_required",
      promotionApproval.error,
      400,
    );
  }

  let tenancy;
  try {
    tenancy = await requireTenancy();
  } catch (err) {
    if (err instanceof TenancyError) {
      throw new OriginationSubmitError(
        err.code,
        err.code,
        err.code === "unauthenticated" ? 401 : 403,
      );
    }
    throw err;
  }

  const accessPolicy = await loadUserProgramAccessPolicy(tenancy).catch(
    () => null,
  );
  if (!accessPolicy?.canCreatePrograms) {
    throw new OriginationSubmitError(
      "forbidden",
      "Your Programs access does not allow creating new programs for this client.",
      403,
    );
  }

  const activeClient = await getActiveClientRow();
  if (!activeClient || activeClient.id !== tenancy.clientId) {
    throw new OriginationSubmitError(
      "tenant_resolution_failed",
      "Active client does not match tenancy.",
      403,
    );
  }

  const sponsorMentions = parsePersonMentionsForOrigination(input.sponsor);
  const sponsor = await resolvePersonByLabel({
    label: input.sponsor,
    clientName: activeClient.name,
    fallbackUserId: tenancy.userId,
    parsedLabel: sponsorMentions.find(
      (mention) => mention.relationship === "primary",
    ),
  });
  const coSponsorMention = sponsorMentions.find(
    (mention) => mention.relationship === "co_sponsor",
  );
  const coSponsor = coSponsorMention
    ? await resolvePersonByLabel({
        label: input.sponsor,
        clientName: activeClient.name,
        fallbackUserId: tenancy.userId,
        parsedLabel: coSponsorMention,
      })
    : null;
  const lead = input.lead
    ? await resolvePersonByLabel({
        label: input.lead,
        clientName: activeClient.name,
        fallbackUserId: tenancy.userId,
      })
    : sponsor;

  const sb = getAzureWriteFluentClient();
  const fiveMinutesAgo = new Date(Date.now() - 5 * 60_000).toISOString();
  const { data: existing } = await sb
    .from("engagements")
    .select("id, name, lifecycle_state, created_at")
    .eq("client_id", tenancy.clientId)
    .eq("name", input.programName)
    .gte("created_at", fiveMinutesAgo)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (existing) {
    const row = existing as {
      id: string;
      name: string;
      lifecycle_state: string | null;
    };
    const { data: approval } = await sb
      .from("program_approval_requests")
      .select("id")
      .eq("program_id", row.id)
      .eq("request_status", "pending")
      .order("requested_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    const decisionThread = await ensureThreadForMove({
      clientId: activeClient.key,
      moveId: row.id,
      title: input.decisionThreadTitle ?? row.name,
      ownerRole: input.decisionThreadOwnerRole ?? sponsor.role ?? "CIO",
      intelligenceSessionId:
        input.originatingIntelligenceSessionId ?? undefined,
      linkedBy: tenancy.userId,
      linkReason: input.originatingIntelligenceSessionId
        ? "Move reused from Intelligence Shape Move handoff"
        : "Move reused from origination submit",
    }).catch((err) => {
      console.error(
        "[origination-submit] decision thread link failed for existing move",
        {
          programId: row.id,
          err: err instanceof Error ? err.message : String(err),
        },
      );
      return null;
    });
    await linkAskSessionToMove({
      sessionId: input.originatingIntelligenceSessionId,
      tenantId: tenancy.clientId,
      moveId: row.id,
    }).catch((err) => {
      console.error(
        "[origination-submit] Intelligence ask session link failed for existing move",
        {
          programId: row.id,
          err: err instanceof Error ? err.message : String(err),
        },
      );
    });
    return {
      engagementId: row.id,
      approvalRequestId: (approval as { id: string } | null)?.id ?? "",
      programName: row.name,
      lifecycleState: "submitted_for_approval",
      redirectTo: originationRedirectForSurface(input.surface, row.id),
      decisionThreadId: decisionThread?.id ?? null,
      dossierUrl: decisionThread ? `/dossier/${decisionThread.id}` : null,
    };
  }

  const derived = classifyBrief(input);
  const programArchetype = normalizeProgramArchetype(input.classification);
  const parsedValueRange = parseUsdRangeFromText(input.targetOutcome);
  const valueAssumptions = input.targetOutcome
    ? {
        source: "origination_scaffold",
        captured_text: input.targetOutcome,
      }
    : null;
  const industryCode = (
    activeClient.industry_code?.trim() ||
    CLIENT_KEY_TO_INDUSTRY_CODE[activeClient.key]
  ).toUpperCase();
  const graphNodeId = buildEngagementGraphNodeId(input.programName);
  // Charter JSONB: persists all 7 scaffold fields + classification + initiative
  // context at the moment the brief is promoted. Written once; amended later
  // by the P1 Evidence & Assessment phase when the brief is upgraded to a
  // full charter document. `functionPackIdentity` is the classified function
  // key — DUAL-WRITTEN below: into the `function_pack_key` column AND kept
  // inside `charter` (so a rollback to the pre-column code is harmless).
  const { charter, functionPackIdentity } = buildOriginationCharter(
    input,
    derived,
    sponsor,
    programArchetype,
    industryCode,
  );

  // Discovery Intake (S2b): embed the captured P0 shape into the charter when
  // `discovery_intake_v2` is enabled for this tenant. Default-off flag → no-op,
  // so the charter written is byte-identical to today's behaviour.
  const discoveryFlagEnabled = isFeatureEnabled(
    { clientKey: activeClient.key },
    "discovery_intake_v2",
  );
  let charterToWrite = applyDiscoveryShapeIfEnabled(
    charter,
    input.discoveryShape,
    discoveryFlagEnabled,
  );
  // Discovery Intake (Tier B): also embed the derived discovery plan so the
  // current-state assessment template is downloadable from the Move surface
  // post-promote. Default-off flag → no-op (no plan written, route stays 404).
  if (discoveryFlagEnabled && input.discoveryShape) {
    charterToWrite = embedDiscoveryPlanInCharter(
      charterToWrite,
      planFromShape(input.discoveryShape),
    );
  }

  // Extended intake fields: same isolated charter-JSONB seam as Discovery
  // Intake above. Default-off flag → no-op, so the charter written is
  // byte-identical to today's behaviour for every tenant without the flag.
  const extendedIntakeFlagEnabled = isFeatureEnabled(
    { clientKey: activeClient.key },
    "moves_extended_intake_fields_v1",
  );
  charterToWrite = applyExtendedIntakeFieldsIfEnabled(
    charterToWrite,
    input.extendedIntake,
    extendedIntakeFlagEnabled,
  );

  let legacySolutionSlot = input.programName;
  const engagementInsertPayload = {
    graph_node_id: graphNodeId,
    client_id: tenancy.clientId,
    industry_code: industryCode,
    function_code: derived.functionCode,
    objective_code: derived.objectiveCode,
    topic_code: derived.topicCode,
    name: input.programName,
    // Legacy compatibility: the original engagement engine used `solution`
    // as the required display field and production schemas still enforce one
    // active row per client × solution. New Programs code reads `name`, so on
    // duplicate legacy slots we keep the visible name and make only the slot
    // collision-safe.
    solution: legacySolutionSlot,
    sponsor_person_id: sponsor.id,
    co_sponsor_person_id: coSponsor?.id ?? null,
    maestro_person_id: lead.id,
    status: "draft",
    lifecycle_state: "submitted_for_approval",
    current_phase: 0,
    value_projected_low_usd: parsedValueRange?.low ?? null,
    value_projected_high_usd: parsedValueRange?.high ?? null,
    value_verified_status: parsedValueRange ? "pending" : null,
    value_currency: "USD",
    value_assumptions_jsonb: valueAssumptions,
    program_archetype: programArchetype,
    origin_source: "user_initiated" as OriginSource,
    origin_source_ref: null,
    maestro_oversight_level: "partial",
    founder_approval_required: false,
    data_residency_region: null,
    retention_policy_years: 7,
    charter: charterToWrite,
    // Function-identity spine · first-class column. Dual-written with
    // `charter.functionPackKey` (above) — the column is the queryable,
    // indexable source of truth; the charter copy keeps a rollback to the
    // pre-column code harmless. `null` when no pack cleared the floor.
    function_pack_key: functionPackIdentity?.functionPackKey ?? null,
    function_pack_confidence:
      functionPackIdentity?.functionPackConfidence ?? null,
  };

  let { data: inserted, error: insertError } = await sb
    .from("engagements")
    .insert(engagementInsertPayload)
    .select("id, name")
    .single();

  if (
    insertError &&
    /idx_engagements_one_active|duplicate key value violates unique constraint/i.test(
      insertError.message,
    )
  ) {
    legacySolutionSlot = `${input.programName} · ${new Date().toISOString()}`;
    engagementInsertPayload.solution = legacySolutionSlot;
    ({ data: inserted, error: insertError } = await sb
      .from("engagements")
      .insert(engagementInsertPayload)
      .select("id, name")
      .single());
  }

  if (insertError || !inserted) {
    throw new OriginationSubmitError(
      "engagement_insert_failed",
      insertError?.message ?? "Unknown engagement insert failure",
      500,
    );
  }

  const programId = (inserted as { id: string }).id;
  const programName = (inserted as { name: string }).name;
  try {
    await persistP0PhaseCaptureFromSource(tenancy, programId, {
      name: programName,
      problemStatement: input.problemStatement,
      targetOutcome: input.targetOutcome,
      timelineHorizon: input.timeline,
      charter: charterToWrite,
    });

    const briefSnapshot: Record<string, unknown> = {
      program_name: input.programName,
      problem_statement: input.problemStatement,
      sponsor_person_id: sponsor.id,
      sponsor_name: sponsor.name,
      co_sponsor_person_id: coSponsor?.id ?? null,
      co_sponsor_name: coSponsor?.name ?? null,
      lead_person_id: lead.id,
      lead_name: lead.name,
      function_code: derived.functionCode,
      objective_code: derived.objectiveCode,
      topic_code: derived.topicCode,
      classification: programArchetype,
      matched_pattern_id: input.matchedPatternId ?? null,
      submitted_from_surface: input.surface,
      submitted_at: new Date().toISOString(),
    };
    if (promotionApproval.required) {
      briefSnapshot.intelligence_promotion_gate = {
        source: "intelligence_thread",
        source_thread_id: input.originatingIntelligenceSessionId,
        selected_pattern_key: input.matchedPatternId,
        human_promotion_accepted: input.humanPromotionAccepted === true,
        human_promotion_rationale: promotionApproval.rationale,
        evidence_refs: promotionApproval.evidenceRefs,
        decision_support_warning:
          "Pattern matches are AI-assisted decision support; a human owner reviewed evidence before Move promotion.",
        accepted_at: new Date().toISOString(),
        accepted_by_user_id: tenancy.userId,
      };
    }
    if (input.targetOutcome) briefSnapshot.target_outcome = input.targetOutcome;
    if (input.timeline) briefSnapshot.timeline = input.timeline;

    const approval = await submitForApproval({
      tenantKey: activeClient.key,
      programId,
      requestedByUserId: tenancy.userId,
      briefSnapshot,
    });

    await insertParticipant({
      programId,
      person: sponsor,
      role: "Sponsor",
      approvalAuthority: "sponsor",
    });
    if (coSponsor && coSponsor.id !== sponsor.id) {
      await insertParticipant({
        programId,
        person: coSponsor,
        role: "Co-sponsor",
        approvalAuthority: "sponsor",
      });
    }
    if (lead.id !== sponsor.id) {
      await insertParticipant({
        programId,
        person: lead,
        role: "Program Lead",
        approvalAuthority: "contributor",
      });
    }
    await markDraftCommitted(tenancy, input.surface, programId).catch(
      () => undefined,
    );

    // Persist origination chat turns (best-effort — non-fatal).
    if (input.originationTurns?.length) {
      await persistOriginationTurns(programId, input.originationTurns);
    }

    const decisionThread = await ensureThreadForMove({
      clientId: activeClient.key,
      moveId: programId,
      title: input.decisionThreadTitle ?? programName,
      ownerRole: input.decisionThreadOwnerRole ?? sponsor.role ?? "CIO",
      intelligenceSessionId:
        input.originatingIntelligenceSessionId ?? undefined,
      linkedBy: tenancy.userId,
      linkReason: input.originatingIntelligenceSessionId
        ? "Move created from Intelligence Shape Move handoff"
        : "Move created from origination submit",
    });
    await linkAskSessionToMove({
      sessionId: input.originatingIntelligenceSessionId,
      tenantId: tenancy.clientId,
      moveId: programId,
    }).catch((err) => {
      console.error(
        "[origination-submit] Intelligence ask session link failed",
        {
          programId,
          err: err instanceof Error ? err.message : String(err),
        },
      );
    });

    return {
      engagementId: programId,
      approvalRequestId: approval.id,
      programName,
      lifecycleState: "submitted_for_approval",
      redirectTo: originationRedirectForSurface(input.surface, programId),
      decisionThreadId: decisionThread.id,
      dossierUrl: `/dossier/${decisionThread.id}`,
    };
  } catch (err) {
    await rollbackEngagement(programId);
    throw err;
  }
}
