/**
 * Nexus Pricing Engine — pod templates and the agent capacity scenario
 * (ROM increment 2a).
 *
 * Two pure helpers over the pod library imported from the cost-foundation
 * workbook (`datasets/reference/pricing-engine-v1/pricing_pod_templates.csv`,
 * `pricing_pod_template_roles.csv`, `pricing_agent_profiles.csv`; read via
 * `reference-pack-loader.ts#loadPodLibrary`).
 *
 * ## `podMembersFromTemplate` — never a partial pod
 *
 * Turns a template into `PodMember[]` for `pod-pricer.ts`, at one delivery
 * location and optional provider class. Each member takes its row's level:
 * the pod's blended level clamped into the role's allowed range (the source
 * has no per-role level). If ANY role row of the template is `unmatched` (no
 * role code — the import never guesses one), the whole template is refused
 * with the unmatched labels listed. Dropping those rows would price a smaller
 * team than the template describes.
 *
 * A row whose role was PROPOSED by a tower + label rule
 * (`proposed_unapproved`), or whose level was clamped, is accepted — but the
 * member carries `provenance`, from which the pod pricer prints "proposed
 * role mapping, unapproved" and "level clamped from X to Y" on its formula
 * terms, rate notes and trace (product-owner decision, 2026-10-10). A caller
 * that needs confirmed mappings only passes `requireConfirmedMappings: true`
 * and the template is refused instead.
 *
 * Agents in a template's agent mix are NOT members: they add no FTE, no
 * hours and no cost here. They are returned as information only.
 *
 * ## `agentCapacityScenario` — explicit, unconfirmed
 *
 * Mirrors the workbook's "Estimation Engine" sheet, which applies agents as
 * added FTE capacity:
 *
 *     effective FTE = humans + Σ count × equiv_eng_fte × utilization
 *
 * plus the agents' licence cost per month. It is computed ONLY when a caller
 * asks for it; nothing in the engine or the pod pricer calls it, so no
 * default path applies any agent credit. The profile figures are
 * product-owner planning assumptions with no external source, so the output
 * carries `assumptionStatus: "unconfirmed planning assumption"` and the
 * profiles' approval status, for a later step to record it as an assumption
 * register row. The productivity / documentation / testing / architecture
 * multipliers are echoed and applied nowhere.
 *
 * The workbook is not consistent about the licence basis: "Agent Economics"
 * prices each agent per month, and the "Estimation Engine" worked example
 * charges ONE platform subscription for twelve agents. `per_agent` charges
 * count × monthly cost; `per_platform` charges one monthly cost per agent
 * type with count > 0. The basis defaults to `per_agent` — the conservative
 * one, where cost scales with agent count as on the Agent Economics sheet
 * (product-owner decision, 2026-10-10). `per_platform` is accepted only with
 * a non-empty `licenceBasisReason`, and the output records the basis and the
 * reason.
 *
 * Pure, deterministic, no I/O. Invalid input returns a typed refusal —
 * never NaN or a silent zero.
 */
import type {
  PricingAgentProfileRow,
  PricingPodTemplateRoleRow,
  PricingPodTemplateRow,
} from "../types";
import { appendCostTerms, closeHoursTerms } from "./formula-terms";
import { dollarsToCents, roundHours, sumCents } from "./money";
import type { PodDefinition, PodMember, PodMemberProvenance } from "./pod-pricer";
import type { Cents, FormulaTerm } from "./types";

export const AGENT_SCENARIO_ASSUMPTION_STATUS = "unconfirmed planning assumption" as const;

export interface PodTemplateLibrary {
  podTemplates: readonly PricingPodTemplateRow[];
  podTemplateRoles: readonly PricingPodTemplateRoleRow[];
}

export interface PodMembersFromTemplateOptions {
  library: PodTemplateLibrary;
  locationCode: string;
  providerClassCode?: string | null;
  /** Refuse a template with any proposed (unapproved) role mapping, for a client that accepts confirmed mappings only. Default false. */
  requireConfirmedMappings?: boolean;
}

export interface UnmatchedTemplateRole {
  rawRoleText: string;
  fte: number;
}

export interface ProposedTemplateRole {
  rawRoleText: string;
  roleCode: string;
  mappingRuleId: string | null;
  fte: number;
}

export type PodTemplateRefusalCode =
  | "unknown_template"
  | "inactive_template"
  | "invalid_location"
  | "template_has_no_roles"
  | "unmatched_roles"
  | "unconfirmed_role_mappings";

export interface PodTemplateRefusal {
  ok: false;
  code: PodTemplateRefusalCode;
  message: string;
  /** For `unmatched_roles`: every unmatched role entry of the template, in source order. */
  unmatchedRoles?: readonly UnmatchedTemplateRole[];
  /** For `unconfirmed_role_mappings`: every proposed role entry of the template, in source order. */
  proposedRoles?: readonly ProposedTemplateRole[];
}

export interface PodMembersFromTemplateResult {
  ok: true;
  podCode: string;
  templateName: string;
  blendedLevelCode: string;
  members: readonly PodMember[];
  /** Ready for `pricePod({ pod, ... })`. */
  pod: PodDefinition;
  /** The template's agent mix — information only; agents are not members and add nothing here. */
  agentMixCodes: readonly string[];
  /** True exactly when every member's mapping is confirmed (no proposed role). */
  allMappingsConfirmed: boolean;
  proposedMappingCount: number;
  clampedLevelCount: number;
  source: string;
}

function refuseTemplate(
  code: PodTemplateRefusalCode,
  message: string,
  detail: Pick<PodTemplateRefusal, "unmatchedRoles" | "proposedRoles"> = {},
): PodTemplateRefusal {
  return { ok: false, code, message, ...detail };
}

/** Confirmed only when BOTH the method and the status say so; anything else that has a role code is a proposal. */
function isConfirmedRow(r: PricingPodTemplateRoleRow): boolean {
  return r.mapping_status === "confirmed" && (r.match_method === "exact" || r.match_method === "alias");
}

function plural(n: number): string {
  return n === 1 ? "y" : "ies";
}

/** Build a pod's members from a template, or refuse the whole template. */
export function podMembersFromTemplate(
  templateCode: string,
  options: PodMembersFromTemplateOptions,
): PodMembersFromTemplateResult | PodTemplateRefusal {
  const template = options.library.podTemplates.find((t) => t.pod_code === templateCode);
  if (!template) {
    return refuseTemplate("unknown_template", `pod template '${templateCode}' is not in the pod library`);
  }
  if (template.status !== "active") {
    return refuseTemplate(
      "inactive_template",
      `pod template '${templateCode}' has status '${template.status}'`,
    );
  }
  if (typeof options.locationCode !== "string" || options.locationCode.trim() === "") {
    return refuseTemplate("invalid_location", "a delivery locationCode is required");
  }
  const rows = options.library.podTemplateRoles.filter((r) => r.pod_code === templateCode);
  if (rows.length === 0) {
    return refuseTemplate("template_has_no_roles", `pod template '${templateCode}' has no role rows`);
  }
  const unmatched = rows.filter(
    (r) => r.match_method === "unmatched" || r.mapping_status === "unmatched" || r.role_code === null,
  );
  if (unmatched.length > 0) {
    const unmatchedRoles = unmatched.map((r) => ({ rawRoleText: r.raw_role_text, fte: r.fte }));
    return refuseTemplate(
      "unmatched_roles",
      `pod template '${templateCode}' has ${unmatched.length} role entr${plural(unmatched.length)} with no role code (${unmatchedRoles.map((u) => `"${u.rawRoleText}"`).join(", ")}); a partial pod is never priced`,
      { unmatchedRoles },
    );
  }
  const proposed = rows.filter((r) => !isConfirmedRow(r));
  if (options.requireConfirmedMappings === true && proposed.length > 0) {
    const proposedRoles = proposed.map((r) => ({
      rawRoleText: r.raw_role_text,
      roleCode: r.role_code as string,
      mappingRuleId: r.mapping_rule_id,
      fte: r.fte,
    }));
    return refuseTemplate(
      "unconfirmed_role_mappings",
      `pod template '${templateCode}' has ${proposed.length} role entr${plural(proposed.length)} with a proposed, unapproved role mapping (${proposedRoles.map((u) => `"${u.rawRoleText}" → ${u.roleCode}`).join(", ")}); confirmed mappings were required`,
      { proposedRoles },
    );
  }
  const members: PodMember[] = rows.map((r) => {
    const provenance: PodMemberProvenance = {
      roleMapping: isConfirmedRow(r) ? "confirmed" : "proposed_unapproved",
      mappingRuleId: r.mapping_rule_id,
      rawRoleText: r.raw_role_text,
      levelAdjustment: r.level_adjustment,
      originalLevelCode: r.original_level_code,
    };
    return {
      roleCode: r.role_code as string,
      levelCode: r.level_code,
      locationCode: options.locationCode,
      providerClassCode: options.providerClassCode ?? null,
      fte: r.fte,
      provenance,
    };
  });
  return {
    ok: true,
    podCode: template.pod_code,
    templateName: template.name,
    blendedLevelCode: template.blended_level_code,
    members,
    pod: { podCode: template.pod_code, members },
    agentMixCodes: [...template.agent_mix_codes],
    allMappingsConfirmed: proposed.length === 0,
    proposedMappingCount: proposed.length,
    clampedLevelCount: rows.filter((r) => r.level_adjustment !== "none").length,
    source: `${template.source_artifact} row ${template.source_row}`,
  };
}

// ---------------------------------------------------------------------------
// Agent capacity scenario
// ---------------------------------------------------------------------------

export type AgentLicenceBasis = "per_agent" | "per_platform";

/** The basis used when the caller names none (product-owner decision, 2026-10-10). */
export const DEFAULT_AGENT_LICENCE_BASIS: AgentLicenceBasis = "per_agent";
/** The reason recorded when the default basis applies. */
export const DEFAULT_AGENT_LICENCE_BASIS_REASON =
  "default per_agent (product-owner decision 2026-10-10): cost scales with agent count, as on the Agent Economics sheet";

export interface AgentScenarioRequest {
  agentCode: string;
  /** Number of agents of this type. A whole number >= 0. */
  count: number;
}

export interface AgentCapacityScenarioOptions {
  profiles: readonly PricingAgentProfileRow[];
  /** Defaults to `per_agent`. */
  licenceBasis?: AgentLicenceBasis;
  /** Why this basis. Required (non-blank) for `per_platform`; optional for `per_agent`. */
  licenceBasisReason?: string;
}

export interface AgentCapacityLine {
  agentCode: string;
  count: number;
  equivEngFte: number;
  utilization: number;
  /** count × equivEngFte × utilization, 4 dp. */
  addedFte: number;
  /** Licences charged per month: count (per_agent) or 1 when count > 0 (per_platform). */
  licenceQuantity: number;
  monthlyCostCentsPerLicence: Cents;
  licenceCostCentsPerMonth: Cents;
  /** count × equiv FTE × utilization = added FTE (reconciles via `evaluateFormulaTerms`). */
  capacityTerms: readonly FormulaTerm[];
  /** licences × monthly cost = licence cost per month (reconciles via `evaluateFormulaTerms`). */
  licenceTerms: readonly FormulaTerm[];
  /** Echoed for reference and applied nowhere (1.00 = no gain). */
  unappliedMultipliers: {
    productivity: number;
    documentation: number;
    testing: number;
    architecture: number;
  };
  /** e.g. `pricing_agent_profiles:AGENT-B (global_starter_unapproved, confidence low)`. */
  source: string;
}

export interface AgentCapacityScenario {
  ok: true;
  humansFte: number;
  agentLines: readonly AgentCapacityLine[];
  /** Σ added FTE, 4 dp. */
  agentFte: number;
  /** humans + agent FTE, 4 dp. */
  effectiveFte: number;
  licenceBasis: AgentLicenceBasis;
  /** The caller's reason, or `DEFAULT_AGENT_LICENCE_BASIS_REASON` when the caller gave none for `per_agent`. */
  licenceBasisReason: string;
  /** True when the caller named no basis and `per_agent` was applied. */
  licenceBasisDefaulted: boolean;
  licenceCostCentsPerMonth: Cents;
  /** No productivity multiplier is applied by this scenario or anywhere by default. */
  productivityCreditApplied: false;
  assumptionStatus: typeof AGENT_SCENARIO_ASSUMPTION_STATUS;
  /** The approval status of every profile used, deduplicated. */
  profileApprovalStatuses: readonly string[];
  formulaTrace: string;
}

export type AgentCapacityRefusalCode =
  | "invalid_humans_fte"
  | "invalid_licence_basis"
  | "licence_basis_reason_required"
  | "invalid_agent_count"
  | "duplicate_agent"
  | "unknown_agent"
  | "invalid_agent_profile";

export interface AgentCapacityRefusal {
  ok: false;
  code: AgentCapacityRefusalCode;
  message: string;
}

function refuseScenario(code: AgentCapacityRefusalCode, message: string): AgentCapacityRefusal {
  return { ok: false, code, message };
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

/**
 * Effective FTE and licence cost per month for humans plus agents, as the
 * workbook's Estimation Engine computes it. Call only when the scenario is
 * explicitly requested; its output is an unconfirmed planning assumption.
 */
export function agentCapacityScenario(
  humansFte: number,
  agents: readonly AgentScenarioRequest[],
  options: AgentCapacityScenarioOptions,
): AgentCapacityScenario | AgentCapacityRefusal {
  if (!isFiniteNumber(humansFte) || humansFte < 0) {
    return refuseScenario("invalid_humans_fte", `humansFte must be a finite number >= 0, got ${String(humansFte)}`);
  }
  const licenceBasisDefaulted = options.licenceBasis === undefined;
  const licenceBasis = options.licenceBasis ?? DEFAULT_AGENT_LICENCE_BASIS;
  if (licenceBasis !== "per_agent" && licenceBasis !== "per_platform") {
    return refuseScenario(
      "invalid_licence_basis",
      `licenceBasis must be 'per_agent' or 'per_platform', got ${String(licenceBasis)}`,
    );
  }
  const callerReason =
    typeof options.licenceBasisReason === "string" ? options.licenceBasisReason.trim() : "";
  if (licenceBasis === "per_platform" && callerReason === "") {
    return refuseScenario(
      "licence_basis_reason_required",
      "licenceBasis 'per_platform' charges one subscription however many agents run, so it needs a non-empty licenceBasisReason; the default is 'per_agent'",
    );
  }
  const licenceBasisReason = callerReason === "" ? DEFAULT_AGENT_LICENCE_BASIS_REASON : callerReason;
  const seen = new Set<string>();
  const approvalStatuses = new Set<string>();
  const lines: AgentCapacityLine[] = [];
  for (const request of agents) {
    if (!isFiniteNumber(request.count) || request.count < 0 || !Number.isInteger(request.count)) {
      return refuseScenario(
        "invalid_agent_count",
        `agent '${request.agentCode}' count must be a whole number >= 0, got ${String(request.count)}`,
      );
    }
    if (seen.has(request.agentCode)) {
      return refuseScenario("duplicate_agent", `agent '${request.agentCode}' is listed more than once`);
    }
    seen.add(request.agentCode);
    const profile = options.profiles.find((p) => p.agent_code === request.agentCode);
    if (!profile) {
      return refuseScenario("unknown_agent", `agent '${request.agentCode}' is not in the agent profiles`);
    }
    if (
      !isFiniteNumber(profile.equiv_eng_fte) ||
      profile.equiv_eng_fte <= 0 ||
      !isFiniteNumber(profile.utilization) ||
      profile.utilization <= 0 ||
      profile.utilization > 1 ||
      !isFiniteNumber(profile.monthly_cost_usd) ||
      profile.monthly_cost_usd < 0
    ) {
      return refuseScenario(
        "invalid_agent_profile",
        `agent profile '${profile.agent_code}' needs equiv_eng_fte > 0, 0 < utilization <= 1 and monthly_cost_usd >= 0`,
      );
    }
    approvalStatuses.add(profile.approval_status);
    const profileSource = `pricing_agent_profiles:${profile.agent_code}`;
    const addedFte = roundHours(request.count * profile.equiv_eng_fte * profile.utilization);
    const capacityTerms = closeHoursTerms(
      [
        { label: `${profile.agent_code} agents`, value: request.count, source: "scenario", cellRole: "count" },
        {
          label: "equivalent engineering FTE per agent",
          value: profile.equiv_eng_fte,
          source: `${profileSource}:equiv_eng_fte`,
          cellRole: "factor",
        },
        {
          label: "agent utilization",
          value: profile.utilization,
          source: `${profileSource}:utilization`,
          cellRole: "percentage",
        },
      ],
      addedFte,
      "added FTE-equivalent capacity",
    );
    const licenceQuantity =
      licenceBasis === "per_agent" ? request.count : request.count > 0 ? 1 : 0;
    const monthlyCostCentsPerLicence = dollarsToCents(profile.monthly_cost_usd);
    const licenceCostCentsPerMonth = licenceQuantity * monthlyCostCentsPerLicence;
    const licenceTerms = appendCostTerms(
      closeHoursTerms(
        [
          {
            label: licenceBasis === "per_agent" ? "licensed agents" : "platform subscriptions",
            value: licenceQuantity,
            source: `scenario:${licenceBasis}`,
            cellRole: "count",
          },
        ],
        licenceQuantity,
        "licences per month",
      ),
      monthlyCostCentsPerLicence,
      `${profileSource}:monthly_cost_usd`,
      licenceCostCentsPerMonth,
    );
    lines.push({
      agentCode: profile.agent_code,
      count: request.count,
      equivEngFte: profile.equiv_eng_fte,
      utilization: profile.utilization,
      addedFte,
      licenceQuantity,
      monthlyCostCentsPerLicence,
      licenceCostCentsPerMonth,
      capacityTerms,
      licenceTerms,
      unappliedMultipliers: {
        productivity: profile.productivity,
        documentation: profile.documentation,
        testing: profile.testing,
        architecture: profile.architecture,
      },
      source: `${profileSource} (${profile.approval_status}, confidence ${profile.confidence})`,
    });
  }

  const agentFte = roundHours(lines.reduce((acc, l) => acc + l.addedFte, 0));
  const effectiveFte = roundHours(humansFte + agentFte);
  const licenceCostCentsPerMonth = sumCents(...lines.map((l) => l.licenceCostCentsPerMonth));
  const dollars = (cents: Cents) => `$${(cents / 100).toFixed(2)}`;
  const formulaTrace =
    `effective FTE = ${humansFte} humans` +
    lines.map((l) => ` + ${l.count} × ${l.agentCode} ${l.equivEngFte} FTE × ${l.utilization} util (${l.addedFte})`).join("") +
    ` = ${effectiveFte}; licences/month (${licenceBasis}: ${licenceBasisReason}) = ` +
    (lines.length > 0
      ? lines.map((l) => `${l.licenceQuantity} × ${dollars(l.monthlyCostCentsPerLicence)}`).join(" + ")
      : "none") +
    ` = ${dollars(licenceCostCentsPerMonth)}; ${AGENT_SCENARIO_ASSUMPTION_STATUS}, no productivity credit applied`;

  return {
    ok: true,
    humansFte,
    agentLines: lines,
    agentFte,
    effectiveFte,
    licenceBasis,
    licenceBasisReason,
    licenceBasisDefaulted,
    licenceCostCentsPerMonth,
    productivityCreditApplied: false,
    assumptionStatus: AGENT_SCENARIO_ASSUMPTION_STATUS,
    profileApprovalStatuses: Array.from(approvalStatuses).sort(),
    formulaTrace,
  };
}
