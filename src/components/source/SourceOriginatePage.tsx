"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { CSSProperties, ReactNode } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AppShell } from "@/components/shell/AppShell";
import { SourceSubNav } from "@/components/source/SourceSubNav";
import { useAtlasPageState } from "@/components/shell/AtlasPageStateProvider";
import {
  AgentDock,
  type AttachmentRef,
  type ChatMessage,
} from "@/components/agent/AgentDock";
import { SourceOnboardingTour } from "@/components/source/onboarding/SourceOnboardingTour";
import {
  IntakeCompletionFooter,
  type CapturedFact,
  type IntakeApproverPreview,
} from "@/components/source/intake/IntakeCompletionFooter";
import { SHELL } from "@/lib/shell/shell-tokens";
import type { Artifact, BriefProgressArtifact } from "@/lib/agent/artifacts";
import {
  resolveSourceIntakeShape,
  type IntakeFieldId,
  type SourceIntakeShape,
} from "@/lib/source/intake-intent";
import { buildSourceOptimizeContractHref } from "@/lib/source/optimize-routing";
import type { SourceSourcingMotion } from "@/lib/source/sourcing-motion-journeys";
import { parseSourceIntakeText } from "@/lib/source/intake-summary";
import { buildAvaIntakeResponseParts } from "@/lib/source/ava-intake-response-parts";
import {
  isCapturedApprovalFact,
  isReviewableContractScope,
} from "@/lib/source/contract-optimization-intake";
import {
  SOURCE_CATEGORIES as SOURCE_CATEGORY_DEFINITIONS,
  type SourceCategory,
  type SourceCategoryId,
} from "@/lib/source/taxonomy/category-taxonomy";
export {
  isCapturedApprovalFact,
  isReviewableContractScope,
} from "@/lib/source/contract-optimization-intake";
type SubmitState =
  | { status: "idle" }
  | { status: "submitting" }
  | { status: "error"; message: string };

type SourceEventCreatePayload = {
  ok?: boolean;
  event?: { id?: string };
  eventId?: string;
  eventUrl?: string;
  approvalUrl?: string;
  detail?: string;
  error?: string;
};

interface IntakeFieldDefinition {
  id: IntakeFieldId;
  label: string;
  prompt: string;
  placeholder: string;
  /** Optional — only the generic intake assigns a guiding agent per field. */
  agent?: "aVa";
}

type IntakeState = Record<IntakeFieldId, string>;

interface SourceOriginatePageProps {
  clientName?: string;
  clientShortName?: string;
  clientKey?: string;
  contractOptimizationCandidates?: readonly ContractOptimizationCandidate[];
}

export interface ContractOptimizationCandidate {
  readonly contractId: string;
  readonly contractName: string;
  readonly vendorName: string;
  readonly annualValueUsd: number | null;
  readonly actualAnnualSpendUsd: number | null;
  readonly weakSignalCount: number;
  readonly scopeSummary?: string | null;
  readonly decisionOwner?: string | null;
  readonly reason: string;
}

const INTAKE_FIELDS: IntakeFieldDefinition[] = [
  {
    id: "trigger",
    label: "Why now / trigger",
    prompt: "What event makes this sourcing work necessary now?",
    placeholder:
      "Renewal date, spend pressure, service issue, merger, cloud-cost spike...",
    agent: "aVa",
  },
  {
    id: "decisionOwner",
    label: "Decision owner",
    prompt: "Who can make or sponsor the technology sourcing decision?",
    placeholder:
      "CIO, CTO, VP Infrastructure, app owner, procurement sponsor...",
    agent: "aVa",
  },
  {
    id: "scopeBoundary",
    label: "Scope boundary",
    prompt:
      "Which IT services, platforms, software, cloud, data, or delivery towers are in and out?",
    placeholder:
      "In: AMS for SAP and eCommerce. Out: security operations and deskside support.",
    agent: "aVa",
  },
  {
    id: "valueTarget",
    label: "Value or savings target",
    prompt: "What commercial outcome justifies standing up the event?",
    placeholder:
      "$4M run-rate savings, 15% unit-cost reduction, risk reduction, SLA uplift...",
    agent: "aVa",
  },
  {
    id: "baselineOwner",
    label: "Minimum data / baseline owner",
    prompt:
      "Who owns the minimum baseline Source can use without pretending evidence is ready?",
    placeholder:
      "Finance owns spend baseline; ServiceNow owner owns ticket volume extract by May 8.",
    agent: "aVa",
  },
];

// ─── T02 — Category definitions ───────────────────────────────────────────────

type CategoryEventType =
  | "managed_service"
  | "infrastructure"
  | "software"
  | "consulting"
  | "staffing"
  | "other";

export const SOURCE_INTAKE_CATEGORIES = SOURCE_CATEGORY_DEFINITIONS;
const SOURCE_CATEGORIES = SOURCE_INTAKE_CATEGORIES;
export const SOURCE_INTAKE_CATEGORY_PICKER_DEFAULT_OPEN = true;

const CATEGORY_EVENT_TYPE_BY_ID: Record<SourceCategoryId, CategoryEventType> = {
  ams: "managed_service",
  data_ai_platform: "software",
  ai_engineering_partner: "consulting",
  saas_renewal: "software",
  cloud_finops: "infrastructure",
  bpo_contact_centre: "managed_service",
  bpo_shared_services: "managed_service",
  cyber_grc: "managed_service",
  staff_aug_vs_managed_service: "staffing",
};

function CategoryOption({
  category,
  selected,
  onSelect,
}: {
  category: SourceCategory;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      style={{
        display: "grid",
        gridTemplateColumns: "1fr auto",
        alignItems: "center",
        gap: 8,
        minHeight: 34,
        padding: "8px 10px",
        background: selected ? SHELL.INK : SHELL.CARD_WHITE,
        border: `1px solid ${selected ? SHELL.INK : SHELL.CARD_LINE}`,
        borderRadius: 8,
        cursor: "pointer",
        textAlign: "left",
      }}
      aria-pressed={selected}
    >
      <div>
        <div
          style={{
            fontFamily: SHELL.SANS,
            fontSize: 12,
            fontWeight: 700,
            color: selected ? SHELL.CARD_WHITE : SHELL.INK,
            lineHeight: 1.25,
          }}
        >
          {category.label}
        </div>
        <div
          style={{
            fontFamily: SHELL.SANS,
            fontSize: 10.5,
            lineHeight: 1.35,
            color: selected ? "rgba(255,255,255,0.65)" : SHELL.INK_MUTED,
          }}
        >
          {category.outputArtifacts.length} suggested artifacts
        </div>
      </div>
      <span
        style={{
          ...STATUS_CHIP,
          background: selected ? "rgba(255,255,255,0.12)" : SHELL.PAPER_SOFT,
          borderColor: selected ? "rgba(255,255,255,0.22)" : SHELL.CARD_LINE,
          color: selected ? "rgba(255,255,255,0.78)" : SHELL.INK_MUTED,
        }}
      >
        {selected ? "Selected" : "Optional"}
      </span>
    </button>
  );
}

function GuidanceCard({
  agent,
  label,
  body,
}: {
  agent: string;
  label: string;
  body: string;
}) {
  return (
    <div
      style={{
        border: `1px solid ${SHELL.CARD_LINE}`,
        borderRadius: 10,
        background: SHELL.CARD_WHITE,
        padding: "9px 11px",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          gap: 8,
          marginBottom: 5,
        }}
      >
        <span
          style={{
            fontFamily: SHELL.MONO,
            fontSize: 9,
            color: SHELL.INK,
            letterSpacing: "0.08em",
            fontWeight: 700,
          }}
        >
          {agent}
        </span>
        <span
          style={{
            fontFamily: SHELL.MONO,
            fontSize: 9,
            color: SHELL.INK_MUTED,
          }}
        >
          {label}
        </span>
      </div>
      <div
        style={{
          fontFamily: SHELL.SANS,
          fontSize: 11.5,
          lineHeight: 1.45,
          color: SHELL.INK_SOFT,
        }}
      >
        {body}
      </div>
    </div>
  );
}

function ContractOptimizationSelectionGate({
  candidates,
}: {
  candidates: readonly ContractOptimizationCandidate[];
}) {
  return (
    <section
      aria-label="Select contract to optimize"
      data-testid="contract-optimization-selection-gate"
      style={CONTRACT_SELECT_GATE}
    >
      <div style={{ display: "grid", gap: 5 }}>
        <div style={SECTION_LABEL}>Required first</div>
        <h3 style={CONTRACT_SELECT_TITLE}>Select the contract to optimize</h3>
        <p style={CONTRACT_SELECT_BODY}>
          Contract optimization is contract-bound. Pick one governed contract
          first so Source can prefill the intake from Contract 360 and route
          through the contract-specific optimization service.
        </p>
      </div>
      {candidates.length > 0 ? (
        <div style={CONTRACT_SELECT_LIST}>
          {candidates.slice(0, 6).map((candidate, index) => (
            <a
              key={candidate.contractId}
              href={buildContractOptimizationCandidateHref(candidate)}
              style={CONTRACT_SELECT_CARD}
            >
              <span style={CONTRACT_SELECT_RANK}>
                {String(index + 1).padStart(2, "0")}
              </span>
              <span style={{ minWidth: 0, display: "grid", gap: 3 }}>
                <span style={CONTRACT_SELECT_NAME}>
                  {candidate.vendorName} · {candidate.contractName}
                </span>
                <span style={CONTRACT_SELECT_REASON}>{candidate.reason}</span>
              </span>
              <span style={CONTRACT_SELECT_VALUE}>
                {formatContractOptimizationUsd(
                  candidate.annualValueUsd ?? undefined,
                ) ?? "Value not quantified"}
              </span>
            </a>
          ))}
        </div>
      ) : (
        <div style={CONTRACT_SELECT_EMPTY}>
          No ranked contract candidates were returned for this tenant. Open
          Contract 360 from Source Workspace and launch optimization from a
          specific contract.
        </div>
      )}
      <a href="/source/preview/workspace" style={CONTRACT_SELECT_EXPLORE_LINK}>
        Open contract explorer →
      </a>
    </section>
  );
}

const AGENT_GUIDANCE = [
  {
    agent: "aVa",
    label: "Chat-driven brief",
    body: "Tell aVa your sourcing situation in plain language; the brief on the right fills as you talk. Override any field manually if aVa got it wrong.",
  },
  {
    agent: "aVa",
    label: "Five fields",
    body: "Trigger, decision owner, scope boundary, value basis, baseline owner. Capture all five before the event opens for approval.",
  },
  {
    agent: "aVa",
    label: "Evidence caution",
    body: "Loaded or promised data is not usable evidence yet; name the baseline owner and confidence limits.",
  },
];

const CONTRACT_OPTIMIZATION_LEDGER_HINTS = [
  {
    label: "Recoverable leakage",
    body: "SLA credits, invoice exceptions, off-contract spend, duplicate charges, and rate variance.",
  },
  {
    label: "Avoided cost",
    body: "Renewal uplift avoided, unused scope removed, shelfware reduced, and demand re-based.",
  },
  {
    label: "Negotiated improvement",
    body: "Price, term, index cap, volume tier, exit rights, and supplier concessions.",
  },
  {
    label: "Realized value",
    body: "Finance-confirmed value only. Missing proof stays missing; it never becomes zero.",
  },
] as const;

interface ContractOptimizationContext {
  contractId?: string;
  contractName?: string;
  vendorName?: string;
  annualValueUsd?: number;
  actualAnnualSpendUsd?: number;
  weakSignalCount?: number;
  scopeSummary?: string;
  decisionOwner?: string;
}

function isContractOptimizationMotion(
  intent: string | null | undefined,
): boolean {
  return intent === "contract-optimization" || intent === "renewal";
}

function readContractOptimizationContext(
  searchParams: ReturnType<typeof useSearchParams>,
): ContractOptimizationContext {
  return {
    contractId: searchParams?.get("contractId")?.trim() || undefined,
    contractName: searchParams?.get("contractName")?.trim() || undefined,
    vendorName: searchParams?.get("vendorName")?.trim() || undefined,
    annualValueUsd: readOptionalNumberParam(searchParams, "annualValueUsd"),
    actualAnnualSpendUsd: readOptionalNumberParam(
      searchParams,
      "actualAnnualSpendUsd",
    ),
    weakSignalCount: readOptionalNumberParam(searchParams, "weakSignalCount"),
    scopeSummary: searchParams?.get("scopeSummary")?.trim() || undefined,
    decisionOwner: searchParams?.get("decisionOwner")?.trim() || undefined,
  };
}

function readOptionalNumberParam(
  searchParams: ReturnType<typeof useSearchParams>,
  key: string,
): number | undefined {
  const raw = searchParams?.get(key)?.trim();
  if (!raw) return undefined;
  const parsed = Number(raw);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function buildContractOptimizationPrefill(
  context: ContractOptimizationContext,
): Partial<IntakeState> {
  if (!context.contractId && !context.contractName && !context.vendorName) {
    return {};
  }
  const contractLabel =
    context.contractName ?? context.contractId ?? "selected contract";
  const vendorLabel = context.vendorName ? ` with ${context.vendorName}` : "";
  const contractRef = context.contractId
    ? ` Contract ref: ${context.contractId}.`
    : "";
  const annual = formatContractOptimizationUsd(context.annualValueUsd);
  const actual = formatContractOptimizationUsd(context.actualAnnualSpendUsd);
  const valueBasis = [
    annual ? `annual value ${annual}` : null,
    actual ? `actual annual spend ${actual}` : null,
    context.weakSignalCount != null
      ? `${context.weakSignalCount} weak leverage signal${
          context.weakSignalCount === 1 ? "" : "s"
        }`
      : null,
  ]
    .filter(Boolean)
    .join("; ");
  const scopeBasis =
    context.scopeSummary && isReviewableContractScope(context.scopeSummary)
      ? context.scopeSummary
      : "Scope not loaded. Needs review before approval.";
  const ownerBasis =
    context.decisionOwner && isCapturedApprovalFact(context.decisionOwner)
      ? context.decisionOwner
      : "Confirm the named accountable owner before any external action.";
  return {
    trigger: `Optimize ${contractLabel}${vendorLabel}.${contractRef}`,
    decisionOwner: ownerBasis,
    scopeBoundary: scopeBasis,
    valueTarget:
      valueBasis.length > 0
        ? `Test recoverable leakage, avoided cost, negotiated improvement, and realized value against ${valueBasis}. Do not state a savings target until evidence supports it.`
        : "Test recoverable leakage, avoided cost, negotiated improvement, and realized value. Do not state a savings target until evidence supports it.",
    baselineOwner:
      "Vendor management owns the executed agreement and SOWs; AP owns invoice history; the service owner owns SLA and usage evidence.",
  };
}

function formatContractOptimizationUsd(
  value: number | undefined,
): string | null {
  if (value == null || !Number.isFinite(value)) return null;
  if (Math.abs(value) >= 1_000_000_000)
    return `$${(value / 1_000_000_000).toFixed(1)}B`;
  if (Math.abs(value) >= 1_000_000)
    return `$${(value / 1_000_000).toFixed(1)}M`;
  if (Math.abs(value) >= 1_000) return `$${(value / 1_000).toFixed(1)}K`;
  return `$${Math.round(value).toLocaleString("en-US")}`;
}

export function buildContractOptimizationCandidateHref(
  candidate: ContractOptimizationCandidate,
): string {
  return buildSourceOptimizeContractHref({
    contractId: candidate.contractId,
  });
}

function motionForIntent(
  intent: string | null | undefined,
): SourceSourcingMotion | undefined {
  return isContractOptimizationMotion(intent)
    ? "contract_optimization"
    : undefined;
}

function ContractOptimizationLoadedPanel({
  context,
}: {
  context: ContractOptimizationContext;
}) {
  if (!context.contractId && !context.contractName && !context.vendorName)
    return null;
  const rows = [
    ["Contract ID", context.contractId ?? "Not established"],
    ["Contract name", context.contractName ?? "Not established"],
    ["Vendor", context.vendorName ?? "Not established"],
    [
      "Annual value",
      formatContractOptimizationUsd(context.annualValueUsd) ??
        "Not established",
    ],
    [
      "Actual spend",
      formatContractOptimizationUsd(context.actualAnnualSpendUsd) ??
        "Not established",
    ],
    [
      "Weak leverage",
      context.weakSignalCount != null
        ? `${context.weakSignalCount} signal${context.weakSignalCount === 1 ? "" : "s"}`
        : "Not established",
    ],
  ] as const;
  return (
    <section
      aria-label="Loaded Contract 360 context"
      data-testid="contract-optimization-loaded-context"
      style={LOADED_CONTRACT_PANEL}
    >
      <div style={LOADED_CONTRACT_HEADER}>
        <div>
          <div style={{ ...SECTION_LABEL, color: SHELL.INK_SOFT }}>
            Loaded from Contract 360
          </div>
          <h3 style={LOADED_CONTRACT_TITLE}>
            {context.contractName ?? context.contractId ?? "Selected contract"}
          </h3>
        </div>
        <span
          style={{
            ...STATUS_CHIP,
            background: SHELL.MINT_BG,
            borderColor: SHELL.MINT_LINE,
            color: SHELL.MINT_TEXT,
          }}
        >
          Contract selected
        </span>
      </div>
      <div style={LOADED_CONTRACT_GRID}>
        {rows.map(([label, value]) => (
          <div key={label} style={LOADED_CONTRACT_FACT}>
            <div style={LOADED_CONTRACT_FACT_LABEL}>{label}</div>
            <div style={LOADED_CONTRACT_FACT_VALUE}>{value}</div>
          </div>
        ))}
      </div>
      <div style={LOADED_CONTRACT_SCOPE}>
        <strong>
          {isReviewableContractScope(context.scopeSummary)
            ? "Scope loaded for review:"
            : "Scope not loaded:"}
        </strong>{" "}
        {context.scopeSummary && isReviewableContractScope(context.scopeSummary)
          ? context.scopeSummary
          : "Needs review before approval. Contract 360 scope, SOWs, services, applications, geographies, amendments, and exclusions should be provided before negotiation."}
      </div>
    </section>
  );
}

const initialIntakeState: IntakeState = {
  trigger: "",
  decisionOwner: "",
  scopeBoundary: "",
  valueTarget: "",
  baselineOwner: "",
};

// Legacy cleanup only. Earlier builds restored /source/new drafts from
// localStorage, which made a new intake open with stale values and even kept
// the optional category selector expanded. A new sourcing event now starts
// clean; aVa fills the brief from chat instead of browser residue.
const AUTOSAVE_KEY_PREFIX = "abarva.source.originate.intake";
function autosaveKey(clientKey: string): string {
  return `${AUTOSAVE_KEY_PREFIX}.${clientKey}`;
}

function clearLegacyAutosavedDraft(clientKey: string): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(autosaveKey(clientKey));
    for (let i = window.localStorage.length - 1; i >= 0; i -= 1) {
      const key = window.localStorage.key(i);
      if (key?.startsWith(`${AUTOSAVE_KEY_PREFIX}.`)) {
        window.localStorage.removeItem(key);
      }
    }
  } catch {
    /* swallow — incognito + no quota */
  }
}

function explicitDraftKey(clientKey: string): string {
  return `abarva.source.originate.explicit-draft.${clientKey}`;
}

function createSourceEventRequestId(): string {
  const randomId = globalThis.crypto?.randomUUID?.();
  if (randomId) return randomId;
  return `source-${Date.now().toString(36)}-${Math.random()
    .toString(36)
    .slice(2, 10)}`;
}

function inferEventType(
  scopeBoundary: string,
  selectedCategory?: SourceCategory | null,
): CategoryEventType {
  if (selectedCategory) return CATEGORY_EVENT_TYPE_BY_ID[selectedCategory.id];
  const normalized = scopeBoundary.toLowerCase();
  if (
    /\bams\b|managed service|managed services|outsourcing|run operation|application support/.test(
      normalized,
    )
  )
    return "managed_service";
  if (
    /cloud|infrastructure|hosting|network|platform operations/.test(normalized)
  )
    return "infrastructure";
  if (/software|saas|license|enterprise application/.test(normalized))
    return "software";
  if (
    /systems integrator|implementation|consulting|si partner/.test(normalized)
  )
    return "consulting";
  if (/staff augmentation|staffing|contractor|contingent/.test(normalized))
    return "staffing";
  return "other";
}

/**
 * Parse a currency amount out of the free-text value-target field for use as the
 * event's `estimated_value_usd` baseline.
 *
 * A number only becomes a dollar amount when the text carries a clear CURRENCY
 * signal — a leading `$` OR a magnitude suffix (k/thousand, m/million,
 * b/bn/billion). Bare numbers ("15", "top 3 vendors") and rates/targets
 * ("15-20%", "15%") are rejected, because a percentage or bare count must never
 * be mistaken for a USD baseline denominator in the value-pool waterfall.
 *
 * All candidates are scanned and the FIRST currency-signalled one wins, so
 * "target $4M savings, 15% unit cost" returns 4_000_000 and the "15%" is skipped.
 */
export function extractEstimatedValue(valueTarget: string): number | undefined {
  const normalized = valueTarget.toLowerCase().replace(/,/g, "");
  // Capture: optional `$`, the number, and (only) a currency-magnitude suffix.
  // A trailing `%` is intentionally NOT part of the suffix group; we look ahead
  // for it separately to reject rate/target numbers like "15%" / "15-20%".
  const candidatePattern =
    /(\$)?\s*(\d+(?:\.\d+)?)\s*(bn|billion|b|m|million|k|thousand)?/g;

  for (const match of normalized.matchAll(candidatePattern)) {
    const hasDollar = Boolean(match[1]);
    const raw = Number(match[2]);
    if (!Number.isFinite(raw)) continue;
    const suffix = match[3];

    // Reject rate/target numbers: a number immediately followed (allowing
    // spaces) by `%` is a percentage, not a currency amount. Only skip when
    // there is no explicit currency suffix — a bare "15%" or "15-20%" must be
    // ignored.
    if (!suffix) {
      const afterIndex = (match.index ?? 0) + match[0].length;
      const rest = normalized.slice(afterIndex);
      if (/^\s*%/.test(rest)) continue;
    }

    if (suffix === "b" || suffix === "bn" || suffix === "billion")
      return Math.round(raw * 1_000_000_000);
    if (suffix === "m" || suffix === "million")
      return Math.round(raw * 1_000_000);
    if (suffix === "k" || suffix === "thousand") return Math.round(raw * 1_000);

    // No magnitude suffix: only accept when a `$` currency signal is present.
    // A bare number with neither `$` nor a magnitude suffix is not a baseline.
    if (hasDollar) return Math.round(raw);
  }

  return undefined;
}

function buildDecisionOwnerPreview(
  value: string,
  clientShortName: string,
): IntakeApproverPreview {
  const trimmed = value.trim();
  const firstNamedOwner = trimmed
    .split(/\b(?:with|and|\+|,)\b/i)[0]
    ?.replace(/^(decision owner|owner|sponsor)\s*:\s*/i, "")
    .trim();
  // Prefilled/aVa-authored owner text can be a full instructional sentence
  // (e.g. "Vendor Management / Sourcing Lead. Confirm the named accountable
  // owner before any external action.") rather than an actual name — render
  // that as-is and it reads as a fabricated person plus a stray role tag.
  // Anything sentence-length or containing a mid-string sentence break isn't
  // a name; fall back to the generic label instead.
  const looksLikeAName = Boolean(
    firstNamedOwner &&
    firstNamedOwner.length <= 60 &&
    !/[.!?]\s+\S/.test(firstNamedOwner),
  );
  const resolvedName = looksLikeAName ? firstNamedOwner : undefined;
  return {
    name: resolvedName || `${clientShortName} decision owner`,
    role: inferApproverRole(resolvedName) || "decision owner",
  };
}

function buildCoApproverPreview(
  value: string,
): IntakeApproverPreview | undefined {
  const trimmed = value.trim();
  if (!/\b(co-?decision|co-?approv|with|and|\+)\b/i.test(trimmed))
    return undefined;
  const candidate = trimmed
    .split(/\b(?:with|and|\+)\b/i)
    .slice(1)
    .join(" ")
    .replace(/^(finance|procurement|legal|sourcing)\s*:\s*/i, "")
    .trim();
  if (!candidate) return undefined;
  return {
    name: candidate,
    role: inferApproverRole(candidate) || "co-decision",
  };
}

function inferApproverRole(value: string | undefined): string | null {
  const normalized = (value ?? "").toLowerCase();
  if (/\bcio\b|chief information officer/.test(normalized)) return "CIO";
  if (/\bcfo\b|finance|chief financial officer/.test(normalized))
    return "finance";
  if (/\bcdo\b|data|chief data/.test(normalized)) return "data";
  if (/procurement|sourcing/.test(normalized)) return "sourcing";
  if (/legal|counsel/.test(normalized)) return "legal";
  return null;
}

export function buildEventName(
  clientShortName: string,
  intake: IntakeState,
  selectedCategory?: SourceCategory | null,
  sourcingMotion?: SourceSourcingMotion,
): string {
  if (sourcingMotion === "contract_optimization") {
    const triggerClause = sanitizeEventNameClause(
      intake.trigger.split(/[.;\n]/)[0]?.trim(),
    );
    const contractPhrase = triggerClause
      .replace(/^optimi[sz]e\s+/i, "")
      .replace(/\s+contract ref:\s*[^.]+$/i, "")
      .trim();
    const eventSubject = contractPhrase || "Existing Contract";
    return `${clientShortName} ${eventSubject} Contract Optimization`.slice(
      0,
      120,
    );
  }
  if (selectedCategory)
    return `${clientShortName} ${selectedCategory.label} Sourcing Event`.slice(
      0,
      120,
    );
  const scope = intake.scopeBoundary.trim();
  const combined =
    `${scope} ${intake.trigger} ${intake.valueTarget}`.toLowerCase();
  if (
    /integration fabric|integration[-\s]?hub|hub ambiguity|data[-\s]?contract/.test(
      combined,
    )
  ) {
    return `${clientShortName} Integration Fabric Commercial Control Event`;
  }
  if (
    /adobe/.test(combined) &&
    /salesforce/.test(combined) &&
    /accenture/.test(combined)
  ) {
    return `${clientShortName} Integration Fabric Commercial Control Event`;
  }
  if (/\bams\b|managed service|outsourcing/i.test(scope))
    return `${clientShortName} AMS Sourcing Event`;
  if (/prior.?authorization|prior auth/i.test(scope))
    return `${clientShortName} Prior Authorization Automation Sourcing`;
  if (/fraud/i.test(scope))
    return `${clientShortName} Fraud Detection AI Sourcing`;
  const firstClause = sanitizeEventNameClause(scope.split(/[.;\n]/)[0]?.trim());
  if (firstClause)
    return `${clientShortName} ${firstClause} Sourcing Event`.slice(0, 120);
  const triggerClause = sanitizeEventNameClause(
    intake.trigger.split(/[.;\n]/)[0]?.trim(),
  );
  return `${clientShortName} ${triggerClause || "Technology"} Sourcing Event`.slice(
    0,
    120,
  );
}

function sanitizeEventNameClause(value: string | undefined): string {
  return (value ?? "")
    .replace(
      /^(scope boundary|scope|in scope|out of scope|in|out|value basis|baseline owner|trigger)\s*:\s*/i,
      "",
    )
    .replace(/\b(in scope|out of scope)\b\s*:\s*/gi, "")
    .replace(/\s+/g, " ")
    .trim();
}

const AVA_INTAKE_AGENT = {
  initials: "aVa",
  name: "aVa",
  role: "End-to-end sourcing advisor",
} as const;

export function SourceOriginatePage({
  clientName = "Retail Demo",
  clientShortName = "Apex Retail",
  clientKey = "apexretail",
  contractOptimizationCandidates = [],
}: SourceOriginatePageProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tourActive = searchParams?.get("tour") === "1";
  const [creationRequestId, setCreationRequestId] = useState("");

  // Iteration-2 punch-list: `/source/new?intent=...` must reshape the intake.
  // When a known intent is present we swap in a tailored field set, a
  // prefilled prompt, a re-worded header, and a downstream routing hint.
  // With no intent (or an unknown one) the generic origination experience is
  // preserved unchanged — fully backward compatible.
  const intakeShape: SourceIntakeShape | null = useMemo(
    () => resolveSourceIntakeShape(searchParams?.get("intent")),
    [searchParams],
  );
  const sourceIntent = intakeShape?.intent ?? null;
  const sourcingMotion = motionForIntent(sourceIntent);
  const contractOptimizationContext = useMemo(
    () => readContractOptimizationContext(searchParams),
    [searchParams],
  );
  const contractOptimizationRequiresSelection =
    sourceIntent === "contract-optimization" &&
    !contractOptimizationContext.contractId;
  const showCategoryPicker =
    !contractOptimizationRequiresSelection &&
    sourceIntent !== "contract-optimization";
  const intakeFields: IntakeFieldDefinition[] =
    intakeShape?.fields ?? INTAKE_FIELDS;
  const intakeSurfaceLabel =
    sourceIntent === "contract-optimization"
      ? "Contract optimization"
      : intakeShape
        ? intakeShape.eyebrow
        : "New sourcing event";
  const intakeContextLabel =
    sourceIntent === "contract-optimization"
      ? "Existing-contract optimization"
      : intakeShape
        ? intakeShape.eyebrow
        : "New sourcing event";

  const [intake, setIntake] = useState<IntakeState>(initialIntakeState);
  const [selectedCategoryId, setSelectedCategoryId] =
    useState<SourceCategoryId | null>(null);
  const [submitState, setSubmitState] = useState<SubmitState>({
    status: "idle",
  });
  const [draftSaved, setDraftSaved] = useState(false);

  // Founder feedback 2026-05-10: 'create new source has an ugly form on the
  // right - why have a form when you have agent interface on left to create?
  // The experience should be similar to create a Move - right side getting
  // filled up - also displaying any other relevant info as we start
  // chatting.' This mirrors the StrategicMoveOriginateClient pattern: the
  // agent emits brief-progress artifacts on each turn and we patch the
  // intake state from them. The user can still override any field manually.
  const [chatFilledFields, setChatFilledFields] = useState<Set<IntakeFieldId>>(
    () => new Set(),
  );

  useEffect(() => {
    clearLegacyAutosavedDraft(clientKey);
  }, [clientKey]);

  useEffect(() => {
    setCreationRequestId((current) => current || createSourceEventRequestId());
  }, []);

  useEffect(() => {
    if (!isContractOptimizationMotion(sourceIntent)) return;
    const prefill = buildContractOptimizationPrefill(
      contractOptimizationContext,
    );
    const entries = Object.entries(prefill).filter(
      (entry): entry is [IntakeFieldId, string] =>
        typeof entry[1] === "string" && entry[1].trim().length > 0,
    );
    if (entries.length === 0) return;
    setIntake((current) => {
      let changed = false;
      const next = { ...current };
      for (const [fieldId, value] of entries) {
        if (next[fieldId].trim().length > 0) continue;
        next[fieldId] = value;
        changed = true;
      }
      return changed ? next : current;
    });
  }, [contractOptimizationContext, sourceIntent]);

  const handleArtifact = useCallback((artifact: Artifact) => {
    if (artifact.type !== "brief-progress") return;
    const briefProgress = artifact as BriefProgressArtifact;
    setIntake((current) => {
      const next: IntakeState = { ...current };
      const newlyFilled: IntakeFieldId[] = [];
      for (const f of briefProgress.fields) {
        const id = f.id as IntakeFieldId;
        if (!(id in initialIntakeState)) continue;
        const incoming = typeof f.value === "string" ? f.value.trim() : "";
        if (f.status === "empty" || incoming.length === 0) continue;
        if (
          !current[id] ||
          current[id].trim().length === 0 ||
          current[id] !== incoming
        ) {
          next[id] = incoming;
          newlyFilled.push(id);
        }
      }
      if (newlyFilled.length > 0) {
        setChatFilledFields((prev) => {
          const merged = new Set(prev);
          for (const id of newlyFilled) merged.add(id);
          return merged;
        });
        setSubmitState({ status: "idle" });
      }
      return next;
    });
  }, []);

  const selectedCategory =
    SOURCE_CATEGORIES.find((c) => c.id === selectedCategoryId) ?? null;
  const capturedFacts = useMemo<CapturedFact[]>(
    () =>
      intakeFields
        .filter((field) => isCapturedApprovalFact(intake[field.id]))
        .map((field) => ({
          id: field.id,
          label: field.label,
          value: intake[field.id].trim(),
        })),
    [intake, intakeFields],
  );
  const capturedFactsCount = capturedFacts.length;
  const allFactsCaptured = capturedFactsCount === intakeFields.length;
  const canCreate =
    allFactsCaptured &&
    !contractOptimizationRequiresSelection &&
    submitState.status !== "submitting";
  const decisionOwnerPreview = useMemo(
    () => buildDecisionOwnerPreview(intake.decisionOwner, clientShortName),
    [clientShortName, intake.decisionOwner],
  );
  const coApproverPreview = useMemo(
    () => buildCoApproverPreview(intake.decisionOwner),
    [intake.decisionOwner],
  );

  function patchIntake(fieldId: IntakeFieldId, value: string) {
    setSubmitState({ status: "idle" });
    setDraftSaved(false);
    setIntake((current) => ({ ...current, [fieldId]: value }));
  }

  const patchIntakeFromText = useCallback((text: string) => {
    const parsed = parseSourceIntakeText(text);
    const entries = Object.entries(parsed).filter(
      (entry): entry is [IntakeFieldId, string] =>
        typeof entry[1] === "string" && entry[1].trim().length > 0,
    );
    if (entries.length === 0) return;
    setSubmitState({ status: "idle" });
    setDraftSaved(false);
    setIntake((current) => {
      const next = { ...current };
      const newlyFilled: IntakeFieldId[] = [];
      for (const [fieldId, value] of entries) {
        const incoming = value.trim();
        if (incoming && next[fieldId] !== incoming) {
          next[fieldId] = incoming;
          newlyFilled.push(fieldId);
        }
      }
      if (newlyFilled.length > 0) {
        setChatFilledFields((prev) => {
          const merged = new Set(prev);
          for (const id of newlyFilled) merged.add(id);
          return merged;
        });
      }
      return next;
    });
  }, []);

  async function createEvent() {
    if (contractOptimizationRequiresSelection) {
      setSubmitState({
        status: "error",
        message:
          "Select a governed contract before opening contract optimization.",
      });
      return;
    }
    if (!canCreate) return;
    setSubmitState({ status: "submitting" });

    const requestId = creationRequestId || createSourceEventRequestId();
    if (!creationRequestId) setCreationRequestId(requestId);

    let response: Response;
    let payload: SourceEventCreatePayload | null = null;
    try {
      if (
        sourcingMotion === "contract_optimization" &&
        contractOptimizationContext.contractId
      ) {
        response = await fetch(
          `/api/source/workspace/contract/${encodeURIComponent(
            contractOptimizationContext.contractId,
          )}/optimization`,
          { method: "POST" },
        );
      } else {
        const eventName = buildEventName(
          clientShortName,
          intake,
          selectedCategory,
          sourcingMotion,
        );
        response = await fetch("/api/v1/source/events", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            eventName,
            eventType: inferEventType(intake.scopeBoundary, selectedCategory),
            triggerDescription: intake.trigger,
            decisionOwner: intake.decisionOwner || undefined,
            scopeDescription: intake.scopeBoundary || undefined,
            valueTargetDescription: intake.valueTarget || undefined,
            baselineOwnerDescription: intake.baselineOwner || undefined,
            categoryId: selectedCategory?.id,
            categoryLabel: selectedCategory?.label,
            sourcingMotion,
            creationRequestId: requestId,
            estimatedValueUsd: extractEstimatedValue(intake.valueTarget),
          }),
        });
      }
      payload = (await response
        .json()
        .catch(() => null)) as SourceEventCreatePayload | null;
    } catch (error) {
      setSubmitState({
        status: "error",
        message:
          error instanceof Error
            ? error.message
            : "Source event creation failed before the server responded.",
      });
      return;
    }

    const sourceEventId = payload?.event?.id ?? payload?.eventId;
    if (!response.ok || !sourceEventId) {
      setSubmitState({
        status: "error",
        message:
          payload?.detail ?? payload?.error ?? "Source event creation failed.",
      });
      return;
    }

    // Submission succeeded — keep the next visit clean.
    clearLegacyAutosavedDraft(clientKey);
    try {
      window.localStorage.removeItem(explicitDraftKey(clientKey));
    } catch {
      /* local draft cleanup is best-effort */
    }
    if (
      sourcingMotion === "contract_optimization" &&
      !contractOptimizationContext.contractId
    ) {
      void fetch(`/api/v1/source/${sourceEventId}/door1/diagnose`, {
        method: "POST",
      }).catch(() => undefined);
    }
    const approvalUrl =
      payload?.approvalUrl && payload.approvalUrl.includes(sourceEventId)
        ? payload.approvalUrl
        : `/source/events/${sourceEventId}/approval`;
    // Forward the tour into approval; the canvas unlocks after approval.
    const finalUrl = tourActive
      ? approvalUrl + (approvalUrl.includes("?") ? "&tour=1" : "?tour=1")
      : approvalUrl;
    router.push(finalUrl);
    window.setTimeout(() => {
      if (window.location.pathname === "/source/new") {
        window.location.assign(finalUrl);
      }
    }, 1200);
  }

  function saveDraft() {
    try {
      window.localStorage.setItem(
        explicitDraftKey(clientKey),
        JSON.stringify({
          intake,
          categoryId: selectedCategoryId,
          savedAt: new Date().toISOString(),
        }),
      );
      setDraftSaved(true);
      setSubmitState({ status: "idle" });
    } catch {
      setSubmitState({
        status: "error",
        message: "Draft could not be saved in this browser.",
      });
    }
  }

  const intakeWorkspace: ReactNode = (
    <aside style={INTAKE_PANE_STYLE}>
      <section aria-label={`${intakeSurfaceLabel} intake`} style={INTAKE_PANEL}>
        {/* Context strip */}
        <div style={CONTEXT_STRIP}>
          <span style={STRIP_TOKEN}>
            {clientName.length > 26
              ? clientName.slice(0, 24) + "…"
              : clientName}
          </span>
          <span style={STRIP_DOT}>·</span>
          <span style={STRIP_TOKEN}>
            {intakeShape ? intakeShape.eyebrow : "New sourcing event"}
          </span>
        </div>

        {/* Header — re-worded when an intent reshapes the intake. */}
        <div>
          <div style={EYEBROW}>
            {intakeShape
              ? `Start · ${intakeShape.eyebrow}`
              : "Start · Source intake"}
          </div>
          <h2 style={HEADING}>
            {intakeShape ? intakeShape.heading : "Sourcing event intake"}
          </h2>
          <p style={SUBHEAD}>
            {intakeShape
              ? intakeShape.subhead
              : "Tell aVa your sourcing situation in plain language — the brief on the right fills as you talk. Override any field manually if aVa got it wrong. The event opens for approval only after all five facts are captured."}
          </p>
        </div>

        {/* Routing hint — only when an intent steers the intake downstream. */}
        {intakeShape && (
          <div
            style={ROUTING_HINT_STYLE}
            aria-label="Where this intake is heading"
          >
            <span
              style={{
                ...STATUS_CHIP,
                background: SHELL.MINT_BG,
                borderColor: SHELL.MINT_LINE,
                color: SHELL.MINT_TEXT,
              }}
            >
              Next step
            </span>
            <div style={{ display: "grid", gap: 2 }}>
              <div
                style={{
                  fontFamily: SHELL.SANS,
                  fontSize: 12,
                  fontWeight: 700,
                  color: SHELL.INK,
                }}
              >
                {intakeShape.routingHint.label}
              </div>
              <div
                style={{
                  fontFamily: SHELL.SANS,
                  fontSize: 11,
                  lineHeight: 1.4,
                  color: SHELL.INK_MUTED,
                }}
              >
                {intakeShape.routingHint.description}
              </div>
            </div>
          </div>
        )}

        {sourceIntent === "contract-optimization" && (
          <div
            aria-label="Contract optimization ledgers"
            style={CONTRACT_OPTIMIZATION_LEDGER_GRID}
          >
            {CONTRACT_OPTIMIZATION_LEDGER_HINTS.map((item) => (
              <div key={item.label} style={CONTRACT_OPTIMIZATION_LEDGER_CARD}>
                <div style={CONTRACT_OPTIMIZATION_LEDGER_LABEL}>
                  {item.label}
                </div>
                <div style={CONTRACT_OPTIMIZATION_LEDGER_BODY}>{item.body}</div>
              </div>
            ))}
          </div>
        )}

        {contractOptimizationRequiresSelection && (
          <ContractOptimizationSelectionGate
            candidates={contractOptimizationCandidates}
          />
        )}

        {sourceIntent === "contract-optimization" &&
          !contractOptimizationRequiresSelection && (
            <ContractOptimizationLoadedPanel
              context={contractOptimizationContext}
            />
          )}

        {/* Intake fields */}
        {!contractOptimizationRequiresSelection && (
          <div style={{ display: "grid", gap: 0 }}>
            <div style={{ ...SECTION_LABEL, marginBottom: 4 }}>
              Minimum approval packet
            </div>
            {intakeFields.map((field) => {
              const value = intake[field.id];
              const complete = isCapturedApprovalFact(value);
              const isRequired = field.id === "trigger";
              return (
                <label
                  key={field.id}
                  style={{
                    display: "grid",
                    gap: 6,
                    borderTop: `1px solid ${SHELL.CARD_LINE}`,
                    padding: "11px 0",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      gap: 8,
                      alignItems: "flex-start",
                    }}
                  >
                    <div>
                      <div style={FIELD_LABEL}>
                        {field.label}
                        {isRequired && (
                          <span style={{ color: SHELL.PEACH_TEXT }}> *</span>
                        )}
                      </div>
                      <div style={FIELD_PROMPT}>{field.prompt}</div>
                    </div>
                    <span
                      style={{
                        flex: "0 0 auto",
                        ...STATUS_CHIP,
                        background: complete
                          ? SHELL.MINT_BG
                          : isRequired
                            ? SHELL.PEACH_BG
                            : SHELL.PAPER_SOFT,
                        borderColor: complete
                          ? SHELL.MINT_LINE
                          : isRequired
                            ? SHELL.PEACH_LINE
                            : SHELL.CARD_LINE,
                        color: complete
                          ? SHELL.MINT_TEXT
                          : isRequired
                            ? SHELL.PEACH_TEXT
                            : SHELL.INK_MUTED,
                      }}
                    >
                      {complete
                        ? chatFilledFields.has(field.id)
                          ? "From chat"
                          : "Captured"
                        : isRequired
                          ? "Start here"
                          : "Add"}
                    </span>
                  </div>
                  <textarea
                    value={value}
                    onChange={(e) => patchIntake(field.id, e.target.value)}
                    placeholder={field.placeholder}
                    rows={2}
                    style={{
                      width: "100%",
                      boxSizing: "border-box",
                      border: `1px solid ${complete ? SHELL.CARD_LINE : isRequired ? SHELL.PEACH_LINE : SHELL.CARD_LINE}`,
                      borderRadius: 8,
                      background: SHELL.PAPER,
                      color: SHELL.INK,
                      fontFamily: SHELL.SANS,
                      fontSize: 12,
                      lineHeight: 1.45,
                      padding: "8px 10px",
                      resize: "vertical",
                      outline: "none",
                    }}
                  />
                </label>
              );
            })}
          </div>
        )}

        {/* T02 — Category picker */}
        {showCategoryPicker && (
          <details
            open={
              SOURCE_INTAKE_CATEGORY_PICKER_DEFAULT_OPEN ||
              Boolean(selectedCategory)
            }
            style={OPTIONAL_CATEGORY_STYLE}
          >
            <summary style={OPTIONAL_CATEGORY_SUMMARY_STYLE}>
              <div>
                <div style={SECTION_LABEL}>Category</div>
                <div
                  style={{
                    marginTop: 2,
                    fontFamily: SHELL.SANS,
                    fontSize: 11,
                    lineHeight: 1.35,
                    color: SHELL.INK_SOFT,
                  }}
                >
                  Optional. aVa can infer this after the intake facts are clear.
                </div>
              </div>
              {selectedCategory ? (
                <span
                  style={{
                    ...STATUS_CHIP,
                    background: SHELL.MINT_BG,
                    borderColor: SHELL.MINT_LINE,
                    color: SHELL.MINT_TEXT,
                  }}
                >
                  {selectedCategory.label}
                </span>
              ) : (
                <span
                  style={{
                    ...STATUS_CHIP,
                    background: SHELL.PAPER_SOFT,
                    borderColor: SHELL.CARD_LINE,
                    color: SHELL.INK_MUTED,
                  }}
                >
                  Optional
                </span>
              )}
            </summary>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))",
                gap: 6,
                marginTop: 9,
              }}
            >
              {SOURCE_CATEGORIES.map((category) => (
                <CategoryOption
                  key={category.id}
                  category={category}
                  selected={selectedCategoryId === category.id}
                  onSelect={() => {
                    setSelectedCategoryId((prev) =>
                      prev === category.id ? null : category.id,
                    );
                    setSubmitState({ status: "idle" });
                  }}
                />
              ))}
            </div>
          </details>
        )}

        {/* Completion route */}
        <div style={{ display: "grid", gap: 7 }}>
          {!contractOptimizationRequiresSelection &&
            !allFactsCaptured &&
            submitState.status !== "submitting" && (
              <div
                role="status"
                aria-live="polite"
                style={{
                  borderRadius: 8,
                  border: `1px solid ${SHELL.PEACH_LINE}`,
                  background: SHELL.PEACH_BG,
                  padding: "8px 10px",
                  fontFamily: SHELL.SANS,
                  fontSize: 12,
                  color: SHELL.PEACH_TEXT,
                }}
              >
                Capture the five minimum approval facts to open the approval
                route. Review prompts and placeholders do not count.
              </div>
            )}

          {!contractOptimizationRequiresSelection && (
            <IntakeCompletionFooter
              capturedFacts={capturedFacts}
              decisionOwner={decisionOwnerPreview}
              coApprover={coApproverPreview}
              capturedFactsCount={capturedFactsCount}
              totalFactsCount={intakeFields.length}
              submitting={submitState.status === "submitting"}
              draftSaved={draftSaved}
              onOpenEvent={createEvent}
              onSaveDraft={saveDraft}
            />
          )}

          {submitState.status === "error" && (
            <div
              role="alert"
              style={{
                borderRadius: 8,
                border: `1px solid ${SHELL.PEACH_LINE}`,
                background: SHELL.PEACH_BG,
                padding: "8px 10px",
                fontFamily: SHELL.SANS,
                fontSize: 12,
                color: SHELL.PEACH_TEXT,
              }}
            >
              {submitState.message}
            </div>
          )}

          <a
            href="/source"
            style={{
              textAlign: "center",
              fontFamily: SHELL.MONO,
              fontSize: 9,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              color: SHELL.INK_MUTED,
              textDecoration: "none",
            }}
          >
            ← Back to Source portfolio
          </a>
        </div>
      </section>

      {/* Related context — populates from aVa responses as the chat unfolds. */}
      <RelatedContextSection />

      {/* Guidance cards */}
      <details style={GUIDANCE_DETAILS}>
        <summary style={GUIDANCE_SUMMARY}>
          <span style={SECTION_LABEL}>How to use this</span>
          <span style={GUIDANCE_SUMMARY_TEXT}>aVa intake guide</span>
        </summary>
        <div style={{ display: "grid", gap: 6, marginTop: 8 }}>
          {AGENT_GUIDANCE.map((item) => (
            <GuidanceCard key={item.label} {...item} />
          ))}
        </div>
      </details>
    </aside>
  );

  return (
    <AppShell
      // surface stays 'source' (closed SurfaceId enum). The brief-progress
      // cadence directive opts in via surfaceContext.sourceIntakeMode so
      // aVa emits brief-progress artifacts on this canvas. Without sourceIntakeMode
      // the right pane never auto-fills.
      surface="source"
      surfaceContext={{
        sourceIntakeMode: true,
        clientKey,
        clientName,
        sourceIntent,
        sourceSourcingMotion: sourcingMotion,
        context: intakeShape
          ? `Source intake — ${intakeContextLabel} (aVa guided)`
          : "New IT sourcing event intake — aVa guided",
      }}
      topBarProps={{
        tenantName: clientName,
        showLocked: true,
        context: intakeShape
          ? `Source · ${intakeSurfaceLabel}`
          : "Source · New sourcing event",
      }}
      subNav={<SourceSubNav />}
      onArtifact={handleArtifact}
    >
      <main data-testid="source-originate-canvas" style={MAIN_STYLE}>
        <SourceOriginateDock
          clientName={clientName}
          clientKey={clientKey}
          workspace={intakeWorkspace}
          intakeShape={intakeShape}
          intakeFields={intakeFields}
          capturedFacts={capturedFacts}
          onIntakeText={patchIntakeFromText}
        />
        <SourceOnboardingTour
          active={tourActive}
          config={{
            step: 2,
            title: "aVa just needs the trigger.",
            body: (
              <>
                Fill the <strong>Why now / trigger</strong> field first, then
                capture the remaining four approval facts through chat or the
                brief. When you click <strong>Open event</strong> the tour
                follows you to the approval page.
              </>
            ),
            awaitingUserAction: true,
          }}
        />
      </main>
    </AppShell>
  );
}

// ── SourceOriginateDock ───────────────────────────────────────────────────
//
// Thin connector between AgentDock (presentation) and the AtlasPageState
// runtime. Reads `conversation` + `ask` from shared shell state so this
// surface keeps the existing runtime contract untouched while picking up the
// AgentDock chrome, upload, mode picker, and persisted side-rail width.
function SourceOriginateDock({
  clientName,
  clientKey,
  workspace,
  intakeShape,
  intakeFields,
  capturedFacts,
  onIntakeText,
}: {
  clientName: string;
  clientKey: string;
  workspace: ReactNode;
  intakeShape: SourceIntakeShape | null;
  intakeFields: IntakeFieldDefinition[];
  capturedFacts: CapturedFact[];
  onIntakeText?: (text: string) => void;
}) {
  const pageState = useAtlasPageState();

  const thread: ChatMessage[] = useMemo(() => {
    if (!pageState) return [];
    const capturedIds = new Set(capturedFacts.map((fact) => fact.id));
    return pageState.conversation.map((turn) => ({
      id: turn.id,
      role: turn.role,
      body: turn.text,
      at: new Date(turn.timestamp).toISOString(),
      parts:
        turn.role === "agent"
          ? buildAvaIntakeResponseParts({
              body: turn.text,
              fields: intakeFields,
              capturedIds,
              routeLabel: intakeShape?.routingHint.label,
            })
          : undefined,
    }));
  }, [capturedFacts, intakeFields, intakeShape, pageState]);

  const onMessage = (text: string, attachments: AttachmentRef[]) => {
    if (!pageState) return;
    const trimmed = text.trim();
    if (!trimmed && attachments.length === 0) return;
    const fileNote =
      attachments.length > 0
        ? `\n[Attached evidence: ${attachments
            .map((a) => `${a.file_name} (${a.id})`)
            .join("; ")}]`
        : "";
    const message = (trimmed + fileNote).trim();
    onIntakeText?.(message);
    pageState.ask(message);
  };

  // Intent-shaped intake: the conversation starts already pointed at the
  // intent. The prefilled prompt is offered as a one-click starter chip
  // (above the workspace) rather than silently stuffed into the composer, so
  // the practitioner stays in control of the opening turn.
  const intakeWorkspace: ReactNode = intakeShape ? (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        minHeight: 0,
      }}
    >
      <div style={STARTER_PROMPT_BAR}>
        <span
          style={{
            ...STATUS_CHIP,
            background: SHELL.BLUE_BG,
            borderColor: SHELL.BLUE_LINE,
            color: SHELL.INK,
          }}
        >
          {intakeShape.eyebrow}
        </span>
        <button
          type="button"
          onClick={() => pageState?.ask(intakeShape.prefilledPrompt)}
          disabled={!pageState}
          style={STARTER_PROMPT_BUTTON}
        >
          {intakeShape.prefilledPrompt} →
        </button>
      </div>
      <div style={{ flex: 1, minHeight: 0, overflow: "hidden" }}>
        {workspace}
      </div>
    </div>
  ) : (
    workspace
  );

  return (
    <AgentDock
      agent={AVA_INTAKE_AGENT}
      surface="source/new"
      defaultMode="side-rail"
      disableStoredMode
      defaultLeftPercent={45}
      minLeftPx={340}
      surfaceContext={{
        sourceIntakeMode: true,
        clientKey,
        clientName,
        sourceIntent: intakeShape?.intent,
      }}
      initialQuote={
        intakeShape
          ? intakeShape.initialQuote
          : `Ready to stand up a new IT sourcing event for ${clientName}. Tell me the trigger and I will help you capture the five facts needed for approval.`
      }
      thread={thread}
      onMessage={onMessage}
      workspace={intakeWorkspace}
    />
  );
}

// Full-bleed flex shell — no max-width cap; chat lane and intake pane share
// the viewport horizontally and the user can drag the splitter to redistribute.
const MAIN_STYLE: CSSProperties = {
  flex: 1,
  display: "flex",
  flexDirection: "column",
  minWidth: 0,
  minHeight: 0,
  height: "calc(100vh - 64px)",
  overflow: "hidden",
  background: SHELL.PAPER,
};

const INTAKE_PANE_STYLE: CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: 10,
  width: "100%",
  height: "100%",
  minWidth: 0,
  minHeight: 0,
  overflowY: "auto",
  padding: "12px 16px 24px",
};

const INTAKE_PANEL: CSSProperties = {
  border: `1px solid ${SHELL.BLUE_LINE}`,
  borderRadius: 16,
  background: `linear-gradient(145deg, ${SHELL.CARD_WHITE} 0%, ${SHELL.BLUE_BG} 100%)`,
  padding: "13px 14px",
  display: "grid",
  gap: 12,
  boxShadow: "0 14px 32px rgba(12, 26, 58, 0.06)",
};

const CONTEXT_STRIP: CSSProperties = {
  display: "flex",
  flexWrap: "wrap",
  alignItems: "center",
  gap: 5,
  paddingBottom: 10,
  borderBottom: `1px solid ${SHELL.CARD_LINE}`,
};

// Intent-shaped intake: downstream routing hint shown under the header.
const ROUTING_HINT_STYLE: CSSProperties = {
  display: "flex",
  alignItems: "flex-start",
  gap: 9,
  border: `1px solid ${SHELL.MINT_LINE}`,
  borderRadius: 10,
  background: SHELL.MINT_BG,
  padding: "9px 11px",
};

const CONTRACT_OPTIMIZATION_LEDGER_GRID: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
  gap: 8,
};

const CONTRACT_OPTIMIZATION_LEDGER_CARD: CSSProperties = {
  border: `1px solid ${SHELL.CARD_LINE}`,
  borderRadius: 8,
  background: SHELL.CARD_WHITE,
  padding: "8px 9px",
  minWidth: 0,
};

const CONTRACT_OPTIMIZATION_LEDGER_LABEL: CSSProperties = {
  fontFamily: SHELL.MONO,
  fontSize: 8.5,
  letterSpacing: "0.1em",
  textTransform: "uppercase",
  color: SHELL.INK_SOFT,
  fontWeight: 800,
};

const CONTRACT_OPTIMIZATION_LEDGER_BODY: CSSProperties = {
  marginTop: 4,
  fontFamily: SHELL.SANS,
  fontSize: 10.5,
  lineHeight: 1.35,
  color: SHELL.INK_SOFT,
};

const CONTRACT_SELECT_GATE: CSSProperties = {
  border: `1px solid ${SHELL.PEACH_LINE}`,
  borderRadius: 12,
  background: SHELL.CARD_WHITE,
  padding: "12px 12px",
  display: "grid",
  gap: 10,
};

const CONTRACT_SELECT_TITLE: CSSProperties = {
  margin: 0,
  fontFamily: SHELL.SANS,
  fontSize: 16,
  lineHeight: 1.2,
  color: SHELL.INK,
  fontWeight: 800,
};

const CONTRACT_SELECT_BODY: CSSProperties = {
  margin: 0,
  fontFamily: SHELL.SANS,
  fontSize: 12,
  lineHeight: 1.45,
  color: SHELL.INK_SOFT,
};

const CONTRACT_SELECT_LIST: CSSProperties = {
  display: "grid",
  gap: 7,
};

const CONTRACT_SELECT_CARD: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "28px minmax(0, 1fr) auto",
  alignItems: "center",
  gap: 9,
  border: `1px solid ${SHELL.CARD_LINE}`,
  borderRadius: 9,
  background: SHELL.PAPER,
  padding: "9px 10px",
  color: SHELL.INK,
  textDecoration: "none",
};

const CONTRACT_SELECT_RANK: CSSProperties = {
  fontFamily: SHELL.MONO,
  fontSize: 9,
  color: SHELL.INK_MUTED,
  fontWeight: 800,
};

const CONTRACT_SELECT_NAME: CSSProperties = {
  fontFamily: SHELL.SANS,
  fontSize: 12.5,
  fontWeight: 800,
  color: SHELL.INK,
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
};

const CONTRACT_SELECT_REASON: CSSProperties = {
  fontFamily: SHELL.SANS,
  fontSize: 11,
  lineHeight: 1.35,
  color: SHELL.INK_MUTED,
  overflow: "hidden",
  display: "-webkit-box",
  WebkitLineClamp: 2,
  WebkitBoxOrient: "vertical",
};

const CONTRACT_SELECT_VALUE: CSSProperties = {
  fontFamily: SHELL.MONO,
  fontSize: 10,
  color: SHELL.INK_SOFT,
  fontWeight: 800,
  whiteSpace: "nowrap",
};

const CONTRACT_SELECT_EMPTY: CSSProperties = {
  border: `1px dashed ${SHELL.CARD_LINE}`,
  borderRadius: 9,
  background: SHELL.PAPER_SOFT,
  padding: "10px 11px",
  fontFamily: SHELL.SANS,
  fontSize: 12,
  lineHeight: 1.45,
  color: SHELL.INK_MUTED,
};

const CONTRACT_SELECT_EXPLORE_LINK: CSSProperties = {
  justifySelf: "start",
  fontFamily: SHELL.MONO,
  fontSize: 9,
  letterSpacing: "0.08em",
  textTransform: "uppercase",
  color: SHELL.INK,
  textDecoration: "none",
  fontWeight: 800,
};

const LOADED_CONTRACT_PANEL: CSSProperties = {
  border: `1px solid ${SHELL.BLUE_LINE}`,
  borderRadius: 12,
  background: SHELL.CARD_WHITE,
  padding: "12px 12px",
  display: "grid",
  gap: 10,
};

const LOADED_CONTRACT_HEADER: CSSProperties = {
  display: "flex",
  alignItems: "flex-start",
  justifyContent: "space-between",
  gap: 10,
};

const LOADED_CONTRACT_TITLE: CSSProperties = {
  margin: "2px 0 0",
  fontFamily: SHELL.SANS,
  fontSize: 15,
  lineHeight: 1.2,
  color: SHELL.INK,
  fontWeight: 800,
};

const LOADED_CONTRACT_GRID: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
  gap: 8,
};

const LOADED_CONTRACT_FACT: CSSProperties = {
  border: `1px solid ${SHELL.CARD_LINE}`,
  borderRadius: 8,
  background: SHELL.PAPER,
  padding: "8px 9px",
  minWidth: 0,
};

const LOADED_CONTRACT_FACT_LABEL: CSSProperties = {
  fontFamily: SHELL.MONO,
  fontSize: 8.5,
  letterSpacing: "0.08em",
  textTransform: "uppercase",
  color: SHELL.INK_MUTED,
  fontWeight: 800,
};

const LOADED_CONTRACT_FACT_VALUE: CSSProperties = {
  marginTop: 4,
  fontFamily: SHELL.SANS,
  fontSize: 12,
  lineHeight: 1.3,
  color: SHELL.INK,
  fontWeight: 700,
  overflowWrap: "anywhere",
};

const LOADED_CONTRACT_SCOPE: CSSProperties = {
  borderTop: `1px solid ${SHELL.CARD_LINE}`,
  paddingTop: 9,
  fontFamily: SHELL.SANS,
  fontSize: 12,
  lineHeight: 1.45,
  color: SHELL.INK_SOFT,
};

// Intent-shaped intake: one-click starter-prompt bar above the workspace.
const STARTER_PROMPT_BAR: CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 9,
  flexWrap: "wrap",
  padding: "8px 16px",
  borderBottom: `1px solid ${SHELL.CARD_LINE}`,
  background: SHELL.PAPER_SOFT,
  flex: "0 0 auto",
};

const STARTER_PROMPT_BUTTON: CSSProperties = {
  flex: 1,
  minWidth: 200,
  textAlign: "left",
  border: `1px solid ${SHELL.CARD_LINE}`,
  borderRadius: 8,
  background: SHELL.CARD_WHITE,
  color: SHELL.INK,
  fontFamily: SHELL.SANS,
  fontSize: 11.5,
  lineHeight: 1.35,
  padding: "7px 10px",
  cursor: "pointer",
};

const STRIP_TOKEN: CSSProperties = {
  fontFamily: SHELL.MONO,
  fontSize: 8.5,
  letterSpacing: "0.1em",
  textTransform: "uppercase",
  color: SHELL.INK_SOFT,
  fontWeight: 600,
};

const STRIP_DOT: CSSProperties = {
  fontFamily: SHELL.MONO,
  fontSize: 10,
  color: SHELL.INK_MUTED,
  lineHeight: 1,
};

const EYEBROW: CSSProperties = {
  fontFamily: SHELL.MONO,
  fontSize: 8.5,
  letterSpacing: "0.14em",
  textTransform: "uppercase",
  color: SHELL.INK_MUTED,
  fontWeight: 700,
};

const HEADING: CSSProperties = {
  margin: "2px 0 0",
  fontFamily: SHELL.SERIF,
  fontSize: 22,
  lineHeight: 1.1,
  color: SHELL.INK,
  letterSpacing: "-0.02em",
};

const SUBHEAD: CSSProperties = {
  margin: "5px 0 0",
  fontFamily: SHELL.SANS,
  fontSize: 12,
  lineHeight: 1.42,
  color: SHELL.INK_SOFT,
};

const SECTION_LABEL: CSSProperties = {
  fontFamily: SHELL.MONO,
  fontSize: 10.5,
  letterSpacing: "0.12em",
  textTransform: "uppercase",
  color: SHELL.INK_MUTED,
  fontWeight: 700,
};

const OPTIONAL_CATEGORY_STYLE: CSSProperties = {
  borderTop: `1px solid ${SHELL.CARD_LINE}`,
  paddingTop: 11,
};

const OPTIONAL_CATEGORY_SUMMARY_STYLE: CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-start",
  gap: 8,
  cursor: "pointer",
  listStyle: "none",
};

const GUIDANCE_DETAILS: CSSProperties = {
  border: `1px solid ${SHELL.CARD_LINE}`,
  borderRadius: 10,
  background: SHELL.CARD_WHITE,
  padding: "8px 11px",
};

const GUIDANCE_SUMMARY: CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: 10,
  cursor: "pointer",
  listStyle: "none",
};

const GUIDANCE_SUMMARY_TEXT: CSSProperties = {
  fontFamily: SHELL.SANS,
  fontSize: 11,
  color: SHELL.INK_MUTED,
};

const STATUS_CHIP: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  border: "1px solid",
  borderRadius: 4,
  padding: "2px 7px",
  fontFamily: SHELL.MONO,
  fontSize: 10,
  letterSpacing: "0.06em",
  textTransform: "uppercase",
  fontWeight: 700,
  whiteSpace: "nowrap",
};

const FIELD_LABEL: CSSProperties = {
  fontFamily: SHELL.MONO,
  fontSize: 9,
  letterSpacing: "0.1em",
  textTransform: "uppercase",
  color: SHELL.INK_MUTED,
  fontWeight: 700,
};

const FIELD_PROMPT: CSSProperties = {
  marginTop: 2,
  fontFamily: SHELL.SANS,
  fontSize: 11,
  lineHeight: 1.35,
  color: SHELL.INK_SOFT,
};

// ── Related context ───────────────────────────────────────────────────────
//
// Surfaces tenant entities aVa mentions in its responses so the right
// pane shows 'relevant info as we start chatting' (founder feedback
// 2026-05-10). This is rendered inside the AppShell tree so
// useAtlasPageState() returns the live conversation. Parsing is lightweight
// and lexical — picks up vendor names, system names, person names that
// appear in agent text. Capped at the most-recent 6 assistant turns so the
// list stays current rather than accumulating across the whole session.

interface RelatedContextItem {
  kind: "vendor" | "system" | "person" | "amount";
  label: string;
  context: string;
}

const VENDOR_PATTERNS = [
  /\b(FIS Profile|FIS Charlotte|FIS Global|FIS)\b/g,
  /\b(NICE Actimize|NICE CXone|NICE)\b/g,
  /\b(Adenza|AxiomSL|Calypso)\b/g,
  /\b(Wolters Kluwer|OneSumX)\b/g,
  /\b(Cohere Health|Cohere)\b/g,
  /\b(Abridge)\b/g,
  /\b(Paige AI)\b/g,
  /\b(Arcadia)\b/g,
  /\b(Snowflake|Databricks|Salesforce|ServiceNow|Workday|Oracle|Microsoft|Anthropic|OpenAI|Bloomberg|Refinitiv|Black Knight|Verafin|LexisNexis|CrowdStrike|Palo Alto|Splunk|Okta|CyberArk|Zscaler|MetricStream|DocuSign|Hyland|OpenText|Coupa|Tableau|Alteryx|Collibra|Volante|TSYS|ACI Worldwide|Fiserv|BNY Pershing|BlackRock|Envestnet|Murex|Equifax|TransUnion|Adobe|Q2|Bottomline|Fenergo)\b/g,
];

const SYSTEM_HINT_REGEX =
  /\b(?:Epic\s+(?:Hyperspace|Ambulatory|Cogito|Cosmos|Resolute)|Atlas|HealthEdge|FedNow Gateway|Aladdin Wealth|FIS Profile (?:Core|Loan)|TrustPortal|MX\.3|Calypso Treasury|MyChart|HealtheIntent|Innovaccer|Smartsheet|Zoom|Looker|JupyterHub)\b/g;

const PERSON_PATTERNS: Array<{ name: string; role: string; tenant: string }> = [
  // Meridian
  { name: "Dr. Anita Krishnamurthy", role: "CDIO", tenant: "Meridian" },
  { name: "David Park", role: "CFO", tenant: "Meridian" },
  { name: "Sarah O'Brien", role: "COO", tenant: "Meridian" },
  { name: "Dr. Marcus Reid", role: "CPE", tenant: "Meridian" },
  { name: "Dr. Jennifer Wexler", role: "CMIO", tenant: "Meridian" },
  { name: "Patricia Okafor", role: "VP RCM", tenant: "Meridian" },
  { name: "Thomas Hartwell", role: "Plan President", tenant: "Meridian" },
  { name: "Jordan McKenzie", role: "VP Data & Analytics", tenant: "Meridian" },
  { name: "Wei Zhang", role: "VP Infra & Cloud", tenant: "Meridian" },
  { name: "Daniel Reyes", role: "CISO", tenant: "Meridian" },
  // Apex
  { name: "Carlos Rivera", role: "CIO", tenant: "Apex" },
  { name: "Margaret Chen", role: "CFO", tenant: "Apex" },
  { name: "Lynne Stratham", role: "CDO", tenant: "Apex" },
  { name: "Sarah Whitfield", role: "CISO", tenant: "Apex" },
  { name: "Angela Foster", role: "CMO Merch", tenant: "Apex" },
  { name: "David Okonjo", role: "COO", tenant: "Apex" },
  // First Capital
  { name: "Patricia Huang", role: "CIO", tenant: "FS Demo" },
  { name: "James Park", role: "CRO", tenant: "FS Demo" },
  { name: "Michael Torres", role: "CFO", tenant: "FS Demo" },
  { name: "Tobias Aboagye", role: "CISO", tenant: "FS Demo" },
  { name: "Sandra Liu", role: "CDO", tenant: "FS Demo" },
  { name: "Nadia Rahman", role: "CPO", tenant: "FS Demo" },
  {
    name: "Ferris Adekoya-Park",
    role: "VP Model Risk Mgmt",
    tenant: "FS Demo",
  },
];

const AMOUNT_REGEX = /\$\d+(?:\.\d+)?\s*(?:M|B|K|million|billion|thousand)?/g;

function pushItem(
  seen: Map<string, RelatedContextItem>,
  item: RelatedContextItem,
) {
  const key = `${item.kind}:${item.label.toLowerCase()}`;
  if (!seen.has(key)) seen.set(key, item);
}

function snippetAround(text: string, term: string, len = 80): string {
  const idx = text.toLowerCase().indexOf(term.toLowerCase());
  if (idx < 0) return "";
  const start = Math.max(0, idx - 30);
  const end = Math.min(text.length, idx + term.length + len);
  return (
    (start > 0 ? "…" : "") +
    text.slice(start, end).replace(/\s+/g, " ").trim() +
    (end < text.length ? "…" : "")
  );
}

function collectRelated(text: string, seen: Map<string, RelatedContextItem>) {
  for (const re of VENDOR_PATTERNS) {
    re.lastIndex = 0;
    let m: RegExpExecArray | null;
    while ((m = re.exec(text)) !== null) {
      const label = m[1] ?? m[0];
      pushItem(seen, {
        kind: "vendor",
        label,
        context: snippetAround(text, label),
      });
    }
  }
  SYSTEM_HINT_REGEX.lastIndex = 0;
  let sm: RegExpExecArray | null;
  while ((sm = SYSTEM_HINT_REGEX.exec(text)) !== null) {
    pushItem(seen, {
      kind: "system",
      label: sm[0],
      context: snippetAround(text, sm[0]),
    });
  }
  for (const person of PERSON_PATTERNS) {
    if (text.includes(person.name)) {
      pushItem(seen, {
        kind: "person",
        label: person.name,
        context: `${person.role} · ${person.tenant}`,
      });
    }
  }
  AMOUNT_REGEX.lastIndex = 0;
  let am: RegExpExecArray | null;
  let amountCount = 0;
  while ((am = AMOUNT_REGEX.exec(text)) !== null && amountCount < 3) {
    pushItem(seen, {
      kind: "amount",
      label: am[0],
      context: snippetAround(text, am[0]),
    });
    amountCount += 1;
  }
}

function RelatedContextSection() {
  const pageState = useAtlasPageState();

  const items = useMemo<RelatedContextItem[]>(() => {
    if (!pageState) return [];
    const seen = new Map<string, RelatedContextItem>();
    const recentAssistantTurns = pageState.conversation
      .filter((t) => t.role === "agent" && t.text.trim().length > 0)
      .slice(-6);
    for (const turn of recentAssistantTurns) {
      collectRelated(turn.text, seen);
    }
    return [...seen.values()].slice(0, 10);
  }, [pageState]);

  if (items.length === 0) {
    return (
      <section
        aria-label="Related tenant context"
        style={{ display: "grid", gap: 6 }}
      >
        <div style={SECTION_LABEL}>Related context</div>
        <div
          style={{
            border: `1px dashed ${SHELL.CARD_LINE}`,
            borderRadius: 10,
            padding: "14px 14px",
            fontFamily: SHELL.SANS,
            fontSize: 11.5,
            color: SHELL.INK_MUTED,
            lineHeight: 1.5,
            background: SHELL.PAPER_SOFT,
          }}
        >
          As aVa cites vendors, systems, owners, and dollar amounts during the
          conversation, they will surface here so you can see the tenant context
          supports the brief.
        </div>
      </section>
    );
  }

  return (
    <section
      aria-label="Related tenant context"
      style={{ display: "grid", gap: 6 }}
    >
      <div style={SECTION_LABEL}>Related context · live</div>
      <div style={{ display: "grid", gap: 5 }}>
        {items.map((item) => {
          const kindStyle = relatedKindStyle(item.kind);
          return (
            <div
              key={`${item.kind}:${item.label}`}
              style={{
                border: `1px solid ${SHELL.CARD_LINE}`,
                background: SHELL.CARD_WHITE,
                borderRadius: 8,
                padding: "8px 11px",
                display: "grid",
                gap: 3,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span
                  style={{
                    ...STATUS_CHIP,
                    background: kindStyle.bg,
                    borderColor: kindStyle.line,
                    color: kindStyle.color,
                  }}
                >
                  {kindStyle.label}
                </span>
                <span
                  style={{
                    fontFamily: SHELL.SANS,
                    fontSize: 12.5,
                    fontWeight: 700,
                    color: SHELL.INK,
                  }}
                >
                  {item.label}
                </span>
              </div>
              {item.context ? (
                <div
                  style={{
                    fontFamily: SHELL.SANS,
                    fontSize: 11,
                    lineHeight: 1.45,
                    color: SHELL.INK_MUTED,
                  }}
                >
                  {item.context}
                </div>
              ) : null}
            </div>
          );
        })}
      </div>
    </section>
  );
}

function relatedKindStyle(kind: RelatedContextItem["kind"]) {
  switch (kind) {
    case "vendor":
      // No BLUE_TEXT token; INK_SOFT reads cleanly on BLUE_BG.
      return {
        label: "Vendor",
        bg: SHELL.BLUE_BG,
        line: SHELL.BLUE_LINE,
        color: SHELL.INK_SOFT,
      };
    case "system":
      return {
        label: "System",
        bg: SHELL.MINT_BG,
        line: SHELL.MINT_LINE,
        color: SHELL.MINT_TEXT,
      };
    case "person":
      return {
        label: "Person",
        bg: SHELL.PEACH_BG,
        line: SHELL.PEACH_LINE,
        color: SHELL.PEACH_TEXT,
      };
    case "amount":
    default:
      return {
        label: "Amount",
        bg: SHELL.PAPER_SOFT,
        line: SHELL.CARD_LINE,
        color: SHELL.INK_MUTED,
      };
  }
}
