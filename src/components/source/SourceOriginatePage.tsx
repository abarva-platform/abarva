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
import {
  parseSourceIntakeText,
} from "@/lib/source/intake-summary";
import { buildAvaIntakeResponseParts } from "@/lib/source/ava-intake-response-parts";
type SubmitState =
  | { status: "idle" }
  | { status: "submitting" }
  | { status: "error"; message: string };

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

interface SourceCategory {
  id: string;
  label: string;
  description: string;
  artifactPack: string[];
  inferredEventType: CategoryEventType;
}

const SOURCE_CATEGORIES: SourceCategory[] = [
  {
    id: "ams",
    label: "Application Managed Services",
    description:
      "End-to-end AMS for enterprise applications — SAP, eCommerce, ERP, custom platforms.",
    artifactPack: [
      "RFP package",
      "Scorecard matrix",
      "TCO model",
      "Transition plan",
      "BAFO brief",
    ],
    inferredEventType: "managed_service",
  },
  {
    id: "cloud_infra",
    label: "Cloud & Infrastructure",
    description:
      "Cloud operations, hosting, network, platform, and infrastructure management services.",
    artifactPack: [
      "Cloud assessment",
      "Cost comparison",
      "Migration plan",
      "Vendor brief",
    ],
    inferredEventType: "infrastructure",
  },
  {
    id: "data_analytics",
    label: "Data, Analytics & AI",
    description:
      "Data platforms, analytics pipelines, AI/ML services, and BI tooling.",
    artifactPack: [
      "Platform evaluation",
      "Vendor maturity",
      "TCO model",
      "Architecture review",
    ],
    inferredEventType: "other",
  },
  {
    id: "enterprise_software",
    label: "Enterprise Software",
    description:
      "SaaS, license optimization, enterprise application selection and renegotiation.",
    artifactPack: ["License audit", "Vendor comparison", "Negotiation brief"],
    inferredEventType: "software",
  },
  {
    id: "custom",
    label: "Custom / Multi-tower",
    description:
      "Bespoke or cross-category events. Artifact pack built during strategy phase.",
    artifactPack: [
      "Scope specification",
      "Custom artifact pack (strategy-derived)",
    ],
    inferredEventType: "other",
  },
];

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
          {category.artifactPack.length} suggested artifacts
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
  if (selectedCategory) return selectedCategory.inferredEventType;
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

function extractEstimatedValue(valueTarget: string): number | undefined {
  const normalized = valueTarget.toLowerCase().replace(/,/g, "");
  const match = normalized.match(
    /\$?\s*(\d+(?:\.\d+)?)\s*(m|million|k|thousand)?/,
  );
  if (!match) return undefined;
  const raw = Number(match[1]);
  if (!Number.isFinite(raw)) return undefined;
  const suffix = match[2];
  if (suffix === "m" || suffix === "million")
    return Math.round(raw * 1_000_000);
  if (suffix === "k" || suffix === "thousand") return Math.round(raw * 1_000);
  return Math.round(raw);
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
  return {
    name: firstNamedOwner || `${clientShortName} decision owner`,
    role: inferApproverRole(firstNamedOwner || trimmed) || "decision owner",
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
): string {
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
      /^(scope boundary|scope|in scope|out of scope|value basis|baseline owner|trigger)\s*:\s*/i,
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
}: SourceOriginatePageProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tourActive = searchParams?.get("tour") === "1";
  const [creationRequestId] = useState(() => createSourceEventRequestId());

  // Iteration-2 punch-list: `/source/new?intent=...` must reshape the intake.
  // When a known intent is present we swap in a tailored field set, a
  // prefilled prompt, a re-worded header, and a downstream routing hint.
  // With no intent (or an unknown one) the generic origination experience is
  // preserved unchanged — fully backward compatible.
  const intakeShape: SourceIntakeShape | null = useMemo(
    () => resolveSourceIntakeShape(searchParams?.get("intent")),
    [searchParams],
  );
  const intakeFields: IntakeFieldDefinition[] =
    intakeShape?.fields ?? INTAKE_FIELDS;

  const [intake, setIntake] = useState<IntakeState>(initialIntakeState);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(
    null,
  );
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
        .filter((field) => intake[field.id].trim().length > 0)
        .map((field) => ({
          id: field.id,
          label: field.label,
          value: intake[field.id].trim(),
        })),
    [intake, intakeFields],
  );
  const capturedFactsCount = capturedFacts.length;
  const allFactsCaptured = capturedFactsCount === intakeFields.length;
  const canCreate = allFactsCaptured && submitState.status !== "submitting";
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
    if (!canCreate) return;
    setSubmitState({ status: "submitting" });

    const eventName = buildEventName(clientShortName, intake, selectedCategory);
    const response = await fetch("/api/v1/source/events", {
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
        categoryLabel: selectedCategory?.label,
        creationRequestId,
        estimatedValueUsd: extractEstimatedValue(intake.valueTarget),
      }),
    });

    const payload = (await response.json().catch(() => null)) as null | {
      event?: { id?: string };
      eventUrl?: string;
      approvalUrl?: string;
      detail?: string;
      error?: string;
    };

    if (!response.ok || !payload?.event?.id) {
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
    const approvalUrl = `/source/events/${payload.event.id}/approval`;
    // Forward the tour into approval; the canvas unlocks after approval.
    const finalUrl = tourActive
      ? approvalUrl + (approvalUrl.includes("?") ? "&tour=1" : "?tour=1")
      : approvalUrl;
    router.push(finalUrl);
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
      <section aria-label="New sourcing event intake" style={INTAKE_PANEL}>
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

        {/* Intake fields */}
        <div style={{ display: "grid", gap: 0 }}>
          <div style={{ ...SECTION_LABEL, marginBottom: 4 }}>Intake basics</div>
          {intakeFields.map((field) => {
            const value = intake[field.id];
            const complete = value.trim().length > 0;
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

        {/* T02 — Category picker */}
        <details
          open={Boolean(selectedCategory)}
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
                Optional. aVa can infer this after the intake facts are
                clear.
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

        {/* Completion route */}
        <div style={{ display: "grid", gap: 7 }}>
          {!allFactsCaptured && submitState.status !== "submitting" && (
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
              Capture the five basics to open the approval route.
            </div>
          )}

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
      <section style={{ display: "grid", gap: 6 }}>
        <div style={SECTION_LABEL}>How to use this</div>
        {AGENT_GUIDANCE.map((item) => (
          <GuidanceCard key={item.label} {...item} />
        ))}
      </section>
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
        sourceIntent: intakeShape?.intent,
        context: intakeShape
          ? `New IT sourcing event intake — ${intakeShape.eyebrow} (aVa guided)`
          : "New IT sourcing event intake — aVa guided",
      }}
      topBarProps={{
        tenantName: clientName,
        showLocked: true,
        context: intakeShape
          ? `Source · New sourcing event · ${intakeShape.eyebrow}`
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
  fontSize: 8.5,
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

const STATUS_CHIP: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  border: "1px solid",
  borderRadius: 4,
  padding: "2px 6px",
  fontFamily: SHELL.MONO,
  fontSize: 7.5,
  letterSpacing: "0.08em",
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
  { name: "Patricia Huang", role: "CIO", tenant: "First Capital" },
  { name: "James Park", role: "CRO", tenant: "First Capital" },
  { name: "Michael Torres", role: "CFO", tenant: "First Capital" },
  { name: "Tobias Aboagye", role: "CISO", tenant: "First Capital" },
  { name: "Sandra Liu", role: "CDO", tenant: "First Capital" },
  { name: "Nadia Rahman", role: "CPO", tenant: "First Capital" },
  {
    name: "Ferris Adekoya-Park",
    role: "VP Model Risk Mgmt",
    tenant: "First Capital",
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
          As aVa cites vendors, systems, owners, and dollar amounts during
          the conversation, they will surface here so you can see the tenant
          context supports the brief.
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
