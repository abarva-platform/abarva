"use client";

// StrategicMoveOriginateClient · Strategic Moves Originate (P0)
//
// Two-pane origination workspace: Nexus chat on the left drives a
// reactive 10-section scaffold on the right. Uses /api/chat/agent with
// surface '/strategic-moves/new' and agentName 'Nexus'.
//
// The agent receives the T-P0 phase pack + AH-ORIG-1–6 rules via the
// agent route system prompt. First-message variant (2A/2B) is composed
// server-side and passed in as `initialTurns`.

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  useTransition,
  type Dispatch,
  type SetStateAction,
} from "react";
import { useRouter } from "next/navigation";
import {
  extractArtifacts,
  visibleArtifactPendingText,
} from "@/lib/agent/artifacts";
import type { BriefProgressArtifact, Artifact } from "@/lib/agent/artifacts";
import {
  shapeAgentResponseForSurface,
  shapeStreamingAgentTextForSurface,
} from "@/lib/agent/response-shape";
import { AgentDock, type ChatMessage } from "@/components/agent/AgentDock";
import styles from "./StrategicMoves.module.css";
import { strategicMoveBriefToDiscoveryShape } from "./strategicMoveBriefToDiscoveryShape";
import { resolveStrategicMoveOriginationRedirect } from "./resolveOriginationRedirect";
import type { PhaseTallyRow } from "@/lib/programs/phase-explorer-tallies";

// ── Types ─────────────────────────────────────────────────────────────────────

export type ChatTurn = {
  id: string;
  role: "user" | "assistant";
  agentName?: "Nexus";
  text: string;
};

type ScaffoldFieldId =
  | "problem-statement"
  | "archetype"
  | "sponsor-candidate"
  | "scope-in"
  | "scope-out"
  | "value-hypothesis"
  | "outcomes-success"
  | "discovery-questions"
  | "evidence-family"
  | "foundation-readiness"
  // Extended intake fields — rendered only when `extendedIntakeFieldsEnabled`
  // (moves_extended_intake_fields_v1) is on for the tenant. Always present in
  // ScaffoldFieldId/INITIAL_FIELDS so Record<ScaffoldFieldId, string> stays
  // exhaustive; harmless empty entries for tenants that never render them.
  | "business-segment"
  | "office-lens"
  | "care-type"
  | "value-hypothesis-quant"
  | "value-hypothesis-qual"
  | "stakeholders-list";

interface BriefState {
  programName: string;
  fields: Record<ScaffoldFieldId, string>;
}

const INITIAL_FIELDS: Record<ScaffoldFieldId, string> = {
  "problem-statement": "",
  archetype: "",
  "sponsor-candidate": "",
  "scope-in": "",
  "scope-out": "",
  "value-hypothesis": "",
  "outcomes-success": "",
  "discovery-questions": "",
  "evidence-family": "",
  "foundation-readiness": "",
  "business-segment": "",
  "office-lens": "",
  "care-type": "",
  "value-hypothesis-quant": "",
  "value-hypothesis-qual": "",
  "stakeholders-list": "",
};
const MOVE_NAME_MAX_WORDS = 6;
const MOVE_NAME_MAX_CHARS = 48;

type P0StepId = ScaffoldFieldId | "approve-build";
type P0WorkspaceTab = "steps" | "files" | "intelligence";

interface ScaffoldDef {
  id: ScaffoldFieldId;
  label: string;
  step: number;
  group: "Frame" | "Govern" | "Readiness" | "Segment";
  help: string;
  placeholder: string;
  /** Omitted = free-text textarea (default). "select" renders a dropdown
   *  bound to `options`. */
  fieldType?: "select";
  options?: readonly string[];
}

const SCAFFOLD_DEFS: ScaffoldDef[] = [
  {
    id: "problem-statement",
    label: "Business problem or opportunity",
    step: 1,
    group: "Frame",
    help: "Tell the story in plain English, and say why now — a note, an email thread, or a problem statement is enough.",
    placeholder:
      "Members experience long calls and inconsistent answers because agents navigate multiple systems. Why now: a new leadership mandate and a spike in escalations this quarter.",
  },
  {
    id: "archetype",
    label: "Transformation pattern (archetype)",
    step: 2,
    group: "Frame",
    help: "A practical archetype, not a taxonomy exercise — it routes the right evidence and playbook.",
    placeholder:
      "Contact Center Agent Assist - agent augmentation for member-service operations.",
  },
  {
    id: "sponsor-candidate",
    label: "Executive sponsor and decision authority",
    step: 3,
    group: "Govern",
    help: "Capture the sponsoring role/title and who has authority to approve scope, investment, and design decisions — no named-person resolution required.",
    placeholder:
      "COO as executive sponsor; VP Member Operations and Contact Center Director as operating owners; CDIO as data/platform co-sponsor. Decision authority: COO approves scope and investment; CDIO approves architecture.",
  },
  {
    id: "scope-in",
    label: "In scope",
    step: 4,
    group: "Govern",
    help: "What this Move covers — business areas, cohorts, processes, or systems.",
    placeholder:
      "Claims status, prior auth status, benefits/eligibility, CRM history, agent knowledge lookup for the member-services contact center.",
  },
  {
    id: "scope-out",
    label: "Out of scope",
    step: 5,
    group: "Govern",
    help: "What this Move explicitly excludes — say it plainly so P1 doesn't have to guess.",
    placeholder:
      "Clinical decisions, appeals adjudication, provider contracts, and any function outside member-services contact center operations.",
  },
  {
    id: "value-hypothesis",
    label: "Value hypothesis",
    step: 6,
    group: "Readiness",
    help: "Directional value the Move should create — ranged, not a promise. Name the pain, the direction of value, and why you believe the mechanism works.",
    placeholder:
      "Pain: high handle time and repeat contact. Value direction: reduce avoidable handle time and improve first-call resolution. Mechanism: agent-assist surfaces the right answer from the right system before the agent has to search.",
  },
  {
    id: "outcomes-success",
    label: "Intended outcomes and success criteria",
    step: 7,
    group: "Readiness",
    help: "What outcomes you want, and how P2 discovery will know they're validated.",
    placeholder:
      "Outcomes: lower handle time, fewer transfers, better answer consistency. P2 must validate: baseline handle time/transfer rate, and that the improvement is attributable to agent-assist, not seasonal variation.",
  },
  {
    id: "discovery-questions",
    label: "Discovery questions and hypotheses to test",
    step: 8,
    group: "Readiness",
    help: "What you believe but haven't proven, and what P2 needs to go find out.",
    placeholder:
      "Hypothesis: most repeat contacts trace to 3-4 recurring intents. Questions: which systems do agents actually use per intent? What's the real average handle time by intent today?",
  },
  {
    id: "evidence-family",
    label: "Evidence families to collect",
    step: 9,
    group: "Readiness",
    help: "Name the evidence families P1 and P2 will gather.",
    placeholder:
      "Member-service metrics, call transcripts/intent taxonomy, CRM history, claims/auth/benefits samples, knowledge base, systems inventory, controls, value assumptions.",
  },
  {
    id: "foundation-readiness",
    label: "Foundation readiness, constraints, and dependencies",
    step: 10,
    group: "Readiness",
    help: "Capture the platform, data, control, and governance assumptions P2 must prove, plus any known constraints or dependencies on other work.",
    placeholder:
      "Trusted access to CRM, claims, eligibility/benefits, prior authorization, policy/knowledge, identity/access, audit logs, data freshness, quality, semantic definitions, and PHI controls. Depends on the Q3 CRM migration completing first.",
  },
];

// Default office-lens/care-type options — analytical lenses, not tied to any
// tenant's real org structure, so these are safe to ship as fixed choices.
// Business Segment is different: it's a GROUNDED FACT (the tenant's own
// business units), so its options come from `businessSegmentOptions` (a
// server-supplied, tenant-specific prop) rather than being hardcoded here.
const OFFICE_LENS_OPTIONS = [
  "Front Office",
  "Middle Office",
  "Back Office",
  "Enterprise",
] as const;
const CARE_TYPE_OPTIONS = ["Clinical", "Non-Clinical"] as const;

// Extended intake fields — appended after the base 10 steps (steps 11-16) so
// enabling the flag never renumbers or reorders anything a tenant already
// sees. Business Segment's `options` gets its real value at render time from
// the `businessSegmentOptions` prop; the placeholder list here is a fallback
// only used if that prop is omitted.
const EXTENDED_SCAFFOLD_DEFS: ScaffoldDef[] = [
  {
    id: "business-segment",
    label: "Business segment",
    step: 11,
    group: "Segment",
    help: "Which of the tenant's real business segments this Move belongs to — a grounded fact, not a classification judgment call.",
    placeholder: "",
    fieldType: "select",
    options: [],
  },
  {
    id: "office-lens",
    label: "Front / Middle / Back Office",
    step: 12,
    group: "Segment",
    help: "An analytical lens, not an org chart: is this patient/customer-facing, part of core operations/delivery, back-office support, or does it cut across all three?",
    placeholder: "",
    fieldType: "select",
    options: OFFICE_LENS_OPTIONS,
  },
  {
    id: "care-type",
    label: "Care type",
    step: 13,
    group: "Segment",
    help: "Is this fundamentally about care/service delivery, or the business/operations side?",
    placeholder: "",
    fieldType: "select",
    options: CARE_TYPE_OPTIONS,
  },
  {
    id: "value-hypothesis-quant",
    label: "Value hypothesis — quantified",
    step: 14,
    group: "Segment",
    help: "If this worked, what number would move, and by roughly how much?",
    placeholder:
      "Est. $2-4M/yr in recoverable revenue (rough, unvalidated) — a sponsor estimate, not yet Finance-checked.",
  },
  {
    id: "value-hypothesis-qual",
    label: "Value hypothesis — qualitative",
    step: 15,
    group: "Segment",
    help: "What would feel different day-to-day, even if you can't put a number on it?",
    placeholder:
      "The team trusts the data more; fewer retrospective reviews and rework.",
  },
  {
    id: "stakeholders-list",
    label: "Stakeholders",
    step: 16,
    group: "Segment",
    help: "Who else needs to be involved — who'd use it, approve it, or push back — beyond the named sponsor?",
    placeholder: "Coding team lead; Actuarial; Compliance.",
  },
];

const P0_STAGE_GROUPS: Array<{
  label: "Frame" | "Govern" | "Readiness" | "Segment" | "Approve";
  stepIds: P0StepId[];
}> = [
  { label: "Frame", stepIds: ["problem-statement", "archetype"] },
  {
    label: "Govern",
    stepIds: ["sponsor-candidate", "scope-in", "scope-out"],
  },
  {
    label: "Readiness",
    stepIds: [
      "value-hypothesis",
      "outcomes-success",
      "discovery-questions",
      "evidence-family",
      "foundation-readiness",
    ],
  },
  { label: "Approve", stepIds: ["approve-build"] },
];

const EXTENDED_STAGE_GROUP: { label: "Segment"; stepIds: P0StepId[] } = {
  label: "Segment",
  stepIds: EXTENDED_SCAFFOLD_DEFS.map((d) => d.id),
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function generateTurnId(): string {
  return `turn-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function applyBriefProgressArtifact(
  fields: Record<ScaffoldFieldId, string>,
  artifact: BriefProgressArtifact,
): Record<ScaffoldFieldId, string> {
  const next = { ...fields };
  for (const f of artifact.fields) {
    const id = f.id as ScaffoldFieldId;
    if (f.status !== "empty" && f.value && id in next) {
      next[id] = f.value;
    }
  }
  return next;
}

const INLINE_FIELD_LABELS: Array<{
  id: ScaffoldFieldId;
  labels: string[];
}> = [
  {
    id: "problem-statement",
    labels: ["business problem", "problem statement", "problem"],
  },
  { id: "archetype", labels: ["archetype", "classification"] },
  {
    id: "sponsor-candidate",
    labels: ["sponsor candidate", "sponsor"],
  },
  { id: "scope-in", labels: ["in scope", "scope in", "scope"] },
  { id: "scope-out", labels: ["out of scope", "scope out"] },
  {
    id: "evidence-family",
    labels: ["evidence family", "evidence families", "evidence"],
  },
  {
    id: "value-hypothesis",
    labels: ["value hypothesis", "value", "outcome hypothesis"],
  },
  {
    id: "outcomes-success",
    labels: ["intended outcomes", "success criteria", "outcomes"],
  },
  {
    id: "discovery-questions",
    labels: ["discovery questions", "hypotheses to test", "hypotheses"],
  },
  {
    id: "foundation-readiness",
    labels: [
      "foundation readiness",
      "readiness",
      "constraints",
      "dependencies",
    ],
  },
];

const INLINE_LABEL_PATTERN = INLINE_FIELD_LABELS.flatMap(({ labels }) => labels)
  .sort((a, b) => b.length - a.length)
  .map((label) => label.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))
  .join("|");

function compactInlineValue(value: string): string {
  return value
    .replace(/\s+/g, " ")
    .replace(/^[-–—:;,\s]+/, "")
    .trim();
}

function inlineArchetype(text: string): string {
  if (
    /\b(kyriba|treasury|cash visibility|payment|bank connectivity|sox)\b/i.test(
      text,
    )
  ) {
    return "Treasury modernization and finance-controls move.";
  }
  if (/\b(vendor|contract|renewal|sourcing|commercial)\b/i.test(text)) {
    return "Vendor and commercial optimization move.";
  }
  if (/\b(ai|agent|copilot|automation|model)\b/i.test(text)) {
    return "AI-enabled operating-model change.";
  }
  if (/\b(data|integration|platform|analytics|lakehouse)\b/i.test(text)) {
    return "Data readiness and platform modernization move.";
  }
  return "";
}

function inlineMoveName(text: string): string {
  const quoted = text.match(
    /\bstrategic\s+move\s+named\s+["“]([^"”]{3,160})["”]/i,
  );
  if (quoted?.[1]) return quoted[1].trim();
  const named = text.match(/\bmove\s+named\s+([^.;\n]{3,160})/i);
  return named?.[1]?.trim() ?? "";
}

function extractInlineP0Fields(text: string): {
  programName: string;
  fields: Partial<Record<ScaffoldFieldId, string>>;
} {
  const fields: Partial<Record<ScaffoldFieldId, string>> = {};
  const matches = Array.from(
    text.matchAll(new RegExp(`\\b(${INLINE_LABEL_PATTERN})\\s*:`, "gi")),
  ).filter((match) => {
    const before = text
      .slice(Math.max(0, (match.index ?? 0) - 7), match.index ?? 0)
      .toLowerCase();
    return !before.endsWith("out of ");
  });

  for (let i = 0; i < matches.length; i += 1) {
    const match = matches[i];
    const label = match[1]?.toLowerCase();
    const mapped = INLINE_FIELD_LABELS.find(({ labels }) =>
      labels.some((candidate) => candidate.toLowerCase() === label),
    );
    if (!mapped || fields[mapped.id]) continue;
    const start = (match.index ?? 0) + match[0].length;
    const end = matches[i + 1]?.index ?? text.length;
    const value = compactInlineValue(text.slice(start, end));
    if (value) fields[mapped.id] = value;
  }

  if (!fields["problem-statement"]) {
    const sentence = compactInlineValue(text)
      .split(/(?<=[.!?])\s+/)
      .find((part) =>
        /\b(kyriba|treasury|business problem|strategic move)\b/i.test(part),
      );
    if (sentence) fields["problem-statement"] = compactInlineValue(sentence);
  }
  if (!fields.archetype) {
    const archetype = inlineArchetype(text);
    if (archetype) fields.archetype = archetype;
  }

  return { programName: inlineMoveName(text), fields };
}

function mergeInlineCapture(
  prev: BriefState,
  capture: ReturnType<typeof extractInlineP0Fields>,
): BriefState {
  if (!capture.programName && Object.keys(capture.fields).length === 0) {
    return prev;
  }
  const nextFields = { ...prev.fields };
  for (const def of SCAFFOLD_DEFS) {
    const value = capture.fields[def.id];
    if (typeof value === "string" && value.trim()) {
      nextFields[def.id] = value.trim();
    }
  }
  return {
    ...prev,
    programName: prev.programName || capture.programName,
    fields: nextFields,
  };
}

function titleCaseMoveName(value: string): string {
  const acronym = new Set(["ai", "ams", "crm", "erp", "phi", "sox", "rpa"]);
  return value
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => {
      const clean = word.replace(/[^a-z0-9&/-]/gi, "");
      if (!clean) return "";
      if (acronym.has(clean.toLowerCase())) return clean.toUpperCase();
      return clean.charAt(0).toUpperCase() + clean.slice(1).toLowerCase();
    })
    .filter(Boolean)
    .join(" ");
}

function compactMoveName(value: string): string {
  const normalized = value
    .replace(/[“”"]/g, "")
    .replace(/[.!?;:,]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  const words = normalized
    .split(/\s+/)
    .filter(
      (word) =>
        !/^(the|a|an|to|for|with|and|or|of|in|on|by|from|this|that|move|strategic)$/i.test(
          word,
        ),
    )
    .slice(0, MOVE_NAME_MAX_WORDS);
  let candidate = titleCaseMoveName(words.join(" "));
  if (candidate.length > MOVE_NAME_MAX_CHARS) {
    candidate = candidate.slice(0, MOVE_NAME_MAX_CHARS).replace(/\s+\S*$/, "");
  }
  return candidate.trim();
}

function suggestedStrategicMoveName(
  fields: Record<ScaffoldFieldId, string>,
): string {
  const source = Object.values(fields).join(" ").toLowerCase();
  if (
    /\b(member|contact center|call center|agent|claims status|eligibility|benefits)\b/.test(
      source,
    )
  ) {
    return "Member Service Agent Assist";
  }
  if (
    /\bprior authorization|prior auth|utilization management|um\b/.test(source)
  ) {
    return "Prior Auth Assist";
  }
  if (/\bclinical|emr|patient|care management|longitudinal\b/.test(source)) {
    return "Clinical Data Foundation";
  }
  if (
    /\bclaim|claims|payment integrity|leakage|fraud|waste|abuse\b/.test(source)
  ) {
    return "Claims Integrity Analytics";
  }
  if (
    /\bkyriba|treasury|cash visibility|payment-control|payment control|sox\b/.test(
      source,
    )
  ) {
    return "Treasury Controls Proof";
  }
  if (
    /\bams|managed services|vendor|sourcing|contract|renewal\b/.test(source)
  ) {
    return "AMS Vendor Optimization";
  }
  if (
    /\blakehouse|databricks|data platform|semantic layer|data foundation\b/.test(
      source,
    )
  ) {
    return "Unified Data Foundation";
  }
  return compactMoveName(fields["problem-statement"]) || "Strategic Move";
}

function deriveStrategicMoveName(
  typed: string,
  fields: Record<ScaffoldFieldId, string>,
): string {
  const typedName = typed.trim();
  if (!typedName) return suggestedStrategicMoveName(fields);
  const wordCount = typedName.split(/\s+/).filter(Boolean).length;
  if (
    wordCount <= MOVE_NAME_MAX_WORDS &&
    typedName.length <= MOVE_NAME_MAX_CHARS
  ) {
    return typedName;
  }
  return suggestedStrategicMoveName({
    ...fields,
    "problem-statement": `${typedName} ${fields["problem-statement"]}`,
  });
}

// ── Component ─────────────────────────────────────────────────────────────────

interface Props {
  tenantName: string;
  initialTurns?: ChatTurn[];
  originatingIntelligenceSessionId?: string | null;
  /** Discovery Intake: when on for the tenant (`discovery_intake_v2`), the
   *  canvas exposes a Brief | Discovery sub-tab. Default off. */
  discoveryIntakeEnabled?: boolean;
  /** Extended Intake Fields: when on for the tenant
   *  (`moves_extended_intake_fields_v1`), the scaffold gains a Segment group
   *  (Business Segment, Office Lens, Care Type, Value Hypothesis quant/qual,
   *  Stakeholders) after the base 10 steps. Default off — off = the scaffold
   *  is byte-identical to today's 10-step flow. */
  extendedIntakeFieldsEnabled?: boolean;
  /** Tenant's real business-segment names (grounded fact — e.g. Meridian's
   *  own segment taxonomy). Only used when `extendedIntakeFieldsEnabled`. */
  businessSegmentOptions?: string[];
}

export function StrategicMoveOriginateClient({
  tenantName,
  initialTurns,
  originatingIntelligenceSessionId = null,
  discoveryIntakeEnabled = false,
  extendedIntakeFieldsEnabled = false,
  businessSegmentOptions = [],
}: Props) {
  const router = useRouter();
  // Tenant-conditional field set: off = these three are identical to the
  // base module constants (same reference-equal-in-spirit arrays), so a
  // tenant without the flag sees exactly today's 10-step P0, unchanged.
  const activeScaffoldDefs: ScaffoldDef[] = extendedIntakeFieldsEnabled
    ? [
        ...SCAFFOLD_DEFS,
        ...EXTENDED_SCAFFOLD_DEFS.map((def) =>
          def.id === "business-segment"
            ? { ...def, options: businessSegmentOptions }
            : def,
        ),
      ]
    : SCAFFOLD_DEFS;
  const activeStageGroups = extendedIntakeFieldsEnabled
    ? [
        ...P0_STAGE_GROUPS.slice(0, -1),
        EXTENDED_STAGE_GROUP,
        P0_STAGE_GROUPS[P0_STAGE_GROUPS.length - 1],
      ]
    : P0_STAGE_GROUPS;
  const activeRequiredFieldCount = activeScaffoldDefs.length;
  const [turns, setTurns] = useState<ChatTurn[]>(
    initialTurns ?? [
      {
        id: "nexus-open-2a",
        role: "assistant",
        agentName: "Nexus",
        text: `Describe the business problem or opportunity in plain English. I will help shape it into a Move brief with the right sponsor, scope, evidence, value hypothesis, and readiness checks.`,
      },
    ],
  );
  const [brief, setBrief] = useState<BriefState>({
    programName: "",
    fields: { ...INITIAL_FIELDS },
  });
  const [draftFields, setDraftFields] = useState<
    Record<ScaffoldFieldId, string>
  >({
    ...INITIAL_FIELDS,
  });
  const [activeP0Step, setActiveP0Step] =
    useState<P0StepId>("problem-statement");
  const [streaming, setStreaming] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [canvasTab, setCanvasTab] = useState<P0WorkspaceTab>("steps");
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const turnsRef = useRef<ChatTurn[]>(turns);
  turnsRef.current = turns;

  // Debounced draft persistence
  useEffect(() => {
    const handle = setTimeout(() => {
      void fetch("/api/programs/origination-draft", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          surface: "/strategic-moves/new",
          state: {
            turns: turns
              .filter((t) => t.text.trim().length > 0)
              .map((t) => ({
                id: t.id,
                role: t.role,
                agentName: t.agentName,
                text: t.text,
              })),
            brief: {
              programName: brief.programName || null,
              problemStatement: brief.fields["problem-statement"] || null,
              targetOutcome: brief.fields["value-hypothesis"] || null,
              timeline: null,
              classification: brief.fields["archetype"] || null,
              matchedPatternId: null,
              sponsor: brief.fields["sponsor-candidate"] || null,
              lead: null,
              crossProgramDependencies: [],
              scopeIn: brief.fields["scope-in"] || null,
              scopeOut: brief.fields["scope-out"] || null,
              outcomesSuccess: brief.fields["outcomes-success"] || null,
              discoveryQuestions: brief.fields["discovery-questions"] || null,
              evidenceFamily: brief.fields["evidence-family"] || null,
              foundationReadiness: brief.fields["foundation-readiness"] || null,
            },
            patternMatch: null,
          },
        }),
      });
    }, 500);
    return () => clearTimeout(handle);
  }, [turns, brief]);

  const updateTurns = useCallback(
    (updater: ChatTurn[] | ((prev: ChatTurn[]) => ChatTurn[])) => {
      const next =
        typeof updater === "function" ? updater(turnsRef.current) : updater;
      turnsRef.current = next;
      setTurns(next);
    },
    [],
  );

  const handleArtifact = useCallback((artifact: Artifact) => {
    if (artifact.type === "brief-progress") {
      const nextArtifactFields = applyBriefProgressArtifact(
        INITIAL_FIELDS,
        artifact as BriefProgressArtifact,
      );
      setBrief((prev) => ({
        ...prev,
        fields: applyBriefProgressArtifact(
          prev.fields,
          artifact as BriefProgressArtifact,
        ),
      }));
      setDraftFields(
        (prev) =>
          ({
            ...prev,
            ...Object.fromEntries(
              Object.entries(nextArtifactFields).filter(([, value]) =>
                value.trim(),
              ),
            ),
          }) as Record<ScaffoldFieldId, string>,
      );
    }
  }, []);

  const saveDraftField = useCallback(
    (id: ScaffoldFieldId) => {
      const value = draftFields[id].trim();
      if (!value) return;
      setBrief((prev) => ({
        ...prev,
        fields: {
          ...prev.fields,
          [id]: value,
        },
      }));
    },
    [draftFields],
  );

  const clearBriefField = useCallback((id: ScaffoldFieldId) => {
    setBrief((prev) => ({
      ...prev,
      fields: {
        ...prev.fields,
        [id]: "",
      },
    }));
    setDraftFields((prev) => ({ ...prev, [id]: "" }));
  }, []);

  const send = useCallback(
    async (messageOverride?: string) => {
      const message = (messageOverride ?? "").trim();
      if (!message || streaming) return;

      const assistantTurnId = generateTurnId();
      updateTurns((prev) => [
        ...prev,
        { id: generateTurnId(), role: "user", text: message },
        {
          id: assistantTurnId,
          role: "assistant",
          agentName: "Nexus",
          text: "",
        },
      ]);
      setStreaming(true);
      setSubmitError(null);
      const inlineCapture = extractInlineP0Fields(message);
      setBrief((prev) => mergeInlineCapture(prev, inlineCapture));
      setDraftFields(
        (prev) =>
          ({
            ...prev,
            ...Object.fromEntries(
              Object.entries(inlineCapture.fields).filter(([, value]) =>
                value?.trim(),
              ),
            ),
          }) as Record<ScaffoldFieldId, string>,
      );

      try {
        const conversationHistory = turnsRef.current
          .filter(
            (t) =>
              t.role === "user" ||
              (t.role === "assistant" && t.text.trim().length > 0),
          )
          .map((t) => ({ role: t.role, content: t.text }));

        const res = await fetch("/api/chat/agent", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            message,
            tenantName,
            agentName: "Nexus",
            surface: "/strategic-moves/new",
            conversationHistory,
            surfaceContext: {
              programName: brief.programName || null,
              brief: {
                fields: brief.fields,
                filledCount: Object.values(brief.fields).filter(
                  (v) => v.trim().length > 0,
                ).length,
                fieldsTotal: activeRequiredFieldCount,
              },
            },
          }),
        });

        if (!res.ok || !res.body) {
          throw new Error(`Agent returned ${res.status}`);
        }

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let pendingBuffer = "";
        let committedVisible = "";
        const seenArtifacts = new Set<string>();
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          pendingBuffer += decoder.decode(value, { stream: true });
          const { visibleText, artifacts, remaining } =
            extractArtifacts(pendingBuffer);
          committedVisible += visibleText;
          pendingBuffer = remaining;

          for (const a of artifacts) {
            const key = JSON.stringify(a);
            if (!seenArtifacts.has(key)) {
              seenArtifacts.add(key);
              handleArtifact(a);
            }
          }

          const display = shapeStreamingAgentTextForSurface(
            "/strategic-moves/new",
            committedVisible + visibleArtifactPendingText(pendingBuffer),
          ).trimEnd();
          updateTurns((prev) =>
            prev.map((t) =>
              t.id === assistantTurnId ? { ...t, text: display } : t,
            ),
          );
        }

        // Flush remaining buffer
        if (pendingBuffer.length > 0) {
          const final = extractArtifacts(pendingBuffer);
          committedVisible +=
            final.visibleText +
            (final.remaining.length > 0
              ? visibleArtifactPendingText(final.remaining)
              : "");
          for (const a of final.artifacts) {
            const key = JSON.stringify(a);
            if (!seenArtifacts.has(key)) {
              seenArtifacts.add(key);
              handleArtifact(a);
            }
          }
        }

        updateTurns((prev) =>
          prev.map((t) =>
            t.id === assistantTurnId
              ? {
                  ...t,
                  text: shapeAgentResponseForSurface(
                    "/strategic-moves/new",
                    committedVisible,
                  ),
                }
              : t,
          ),
        );

        // Deterministic capture reconciliation: brief-progress artifacts keep
        // the UI responsive, but user-provided labeled P0 fields are the source
        // of truth when they conflict. Reconcile after every turn so an artifact
        // cannot leave Promote disabled or overwrite explicit sponsor/scope
        // details with older context.
        try {
          const reconcileRes = await fetch(
            "/api/v1/programs/originate/extract-brief",
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                conversation: [
                  ...conversationHistory,
                  { role: "user", content: message },
                  { role: "assistant", content: committedVisible },
                ],
              }),
            },
          );
          if (reconcileRes.ok) {
            const data = (await reconcileRes.json().catch(() => ({}))) as {
              fields?: Record<string, string>;
            };
            if (data.fields && Object.keys(data.fields).length > 0) {
              setBrief((prev) => {
                const nextFields = { ...prev.fields };
                for (const def of SCAFFOLD_DEFS) {
                  const v = data.fields?.[def.id];
                  if (typeof v === "string" && v.trim()) {
                    nextFields[def.id] = v.trim();
                  }
                }
                return { ...prev, fields: nextFields };
              });
              setDraftFields((prevDraft) => {
                const nextDraft = { ...prevDraft };
                for (const def of SCAFFOLD_DEFS) {
                  const v = data.fields?.[def.id];
                  if (typeof v === "string" && v.trim()) {
                    nextDraft[def.id] = v.trim();
                  }
                }
                return nextDraft;
              });
            }
          }
        } catch {
          // best-effort; manual scaffold + chat remain available
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Agent error";
        updateTurns((prev) =>
          prev.map((t) =>
            t.id === assistantTurnId
              ? {
                  ...t,
                  text: `I encountered an issue: ${msg}. Please try again.`,
                }
              : t,
          ),
        );
      } finally {
        setStreaming(false);
      }
    },
    [
      streaming,
      tenantName,
      brief.programName,
      brief.fields,
      activeRequiredFieldCount,
      updateTurns,
      handleArtifact,
    ],
  );

  const filledCount = Object.values(brief.fields).filter(
    (v) => v.trim().length > 0,
  ).length;
  const requiredFilled = activeScaffoldDefs.filter(
    ({ id }) => brief.fields[id].trim().length > 0,
  ).length;
  const canPromote =
    requiredFilled >= activeRequiredFieldCount && !isPending && !streaming;
  const suggestedName = suggestedStrategicMoveName(brief.fields);
  const completionPercent = Math.round(
    (requiredFilled / activeRequiredFieldCount) * 100,
  );
  const originateTallies: PhaseTallyRow[] = [
    {
      phase: 0,
      label: "P0 Originate",
      met: requiredFilled,
      total: activeRequiredFieldCount,
      state: "current",
    },
    { phase: 1, label: "P1 Charter", met: 0, total: 5, state: "upcoming" },
    {
      phase: 2,
      label: "P2 Current State",
      met: 0,
      total: 5,
      state: "upcoming",
    },
    { phase: 3, label: "P3 Approach", met: 0, total: 4, state: "upcoming" },
    { phase: 4, label: "P4 Plan", met: 0, total: 4, state: "upcoming" },
    { phase: 5, label: "P5 Execute", met: 0, total: 4, state: "upcoming" },
  ];
  const dockThread: ChatMessage[] = turns.map((turn) => ({
    id: turn.id,
    role: turn.role === "assistant" ? "agent" : "user",
    body:
      turn.text || (streaming && turn.role === "assistant" ? "..." : turn.text),
  }));
  const dockSuggestedActions = [
    {
      id: "p0-scope",
      label: "Sharpen the scope boundary",
      body: "Help me sharpen the P0 scope boundary for this Move.",
    },
    {
      id: "p0-evidence",
      label: "Suggest evidence families",
      body: "Suggest the right P0 evidence families for this Move.",
    },
    {
      id: "p0-readiness",
      label: "Draft foundation readiness",
      body: "Draft a concise foundation readiness answer for this P0 Move.",
    },
  ];
  const activeP0Def =
    activeP0Step === "approve-build"
      ? null
      : (activeScaffoldDefs.find((def) => def.id === activeP0Step) ??
        activeScaffoldDefs[0]);
  const evidenceAndReadinessComplete =
    brief.fields["evidence-family"].trim().length > 0 &&
    brief.fields["foundation-readiness"].trim().length > 0;
  const visualStepComplete = (id: P0StepId) => {
    if (id === "approve-build") return canPromote;
    if (id === "evidence-family") return evidenceAndReadinessComplete;
    return brief.fields[id].trim().length > 0;
  };

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key !== "Escape") return;
      e.preventDefault();
      if (showConfirm) {
        setShowConfirm(false);
      } else {
        cancelFlow();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showConfirm]);

  function cancelFlow() {
    if (filledCount === 0 && !brief.programName.trim()) {
      router.push("/strategic-moves");
      return;
    }
    setShowConfirm(true);
  }

  async function promote() {
    setSubmitError(null);
    const finalName = deriveStrategicMoveName(brief.programName, brief.fields);
    startTransition(() => {
      void (async () => {
        // Snapshot origination turns before submit (filter empty turns, cap at 40)
        const originationTurns = turnsRef.current
          .filter((t) => t.text.trim().length > 0)
          .slice(-40)
          .map((t) => ({ role: t.role, text: t.text }));

        const res = await fetch("/api/programs/origination-submit", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            surface: "/strategic-moves/new",
            programName: finalName,
            problemStatement: brief.fields["problem-statement"],
            targetOutcome: brief.fields["value-hypothesis"],
            timeline: brief.fields["foundation-readiness"],
            classification: brief.fields["archetype"],
            sponsor: brief.fields["sponsor-candidate"],
            lead: brief.fields["sponsor-candidate"],
            matchedPatternId: null,
            // Extended scaffold fields
            scopeIn: brief.fields["scope-in"] || null,
            scopeOut: brief.fields["scope-out"] || null,
            outcomesSuccess: brief.fields["outcomes-success"] || null,
            discoveryQuestions: brief.fields["discovery-questions"] || null,
            evidenceFamily: brief.fields["evidence-family"] || null,
            // Origination chat transcript → persisted to turns table
            originationTurns,
            // Discovery Intake (Tier B): persist the captured discovery shape so
            // it carries into the charter. Server gates it by discovery_intake_v2
            // (applyDiscoveryShapeIfEnabled); null when the flag is off here.
            discoveryShape: discoveryIntakeEnabled
              ? strategicMoveBriefToDiscoveryShape(brief.fields)
              : null,
            // Extended intake fields: same pattern as discoveryShape above.
            // Server gates it by moves_extended_intake_fields_v1
            // (applyExtendedIntakeFieldsIfEnabled); null when the flag is off.
            extendedIntake: extendedIntakeFieldsEnabled
              ? {
                  businessSegment: brief.fields["business-segment"] || null,
                  officeLens: brief.fields["office-lens"] || null,
                  careType: brief.fields["care-type"] || null,
                  valueHypothesisQuant:
                    brief.fields["value-hypothesis-quant"] || null,
                  valueHypothesisQual:
                    brief.fields["value-hypothesis-qual"] || null,
                  stakeholders: brief.fields["stakeholders-list"] || null,
                }
              : null,
            // Packet 22: bind Intelligence -> Move handoff into a Decision Dossier.
            originatingIntelligenceSessionId,
            decisionThreadTitle: finalName,
            decisionThreadOwnerRole: brief.fields["sponsor-candidate"] || null,
          }),
        });
        const payload = (await res.json()) as {
          ok?: boolean;
          engagementId?: string;
          redirectTo?: string;
          decisionThreadId?: string | null;
          dossierUrl?: string | null;
          message?: string;
          error?: string;
        };
        if (!res.ok || !payload.engagementId) {
          setSubmitError(payload.message ?? payload.error ?? "Submit failed.");
          return;
        }
        const redirectTo = resolveStrategicMoveOriginationRedirect(payload);
        if (!redirectTo) {
          setSubmitError("Submit succeeded but did not return a route.");
          return;
        }
        router.push(redirectTo);
      })();
    });
  }

  return (
    <div id="orig-page" className={styles.page}>
      <section id="orig-grid" className={styles.phaseBody}>
        <P0OriginationRail
          activeTab={canvasTab}
          moveName={deriveStrategicMoveName(brief.programName, brief.fields)}
          onBack={cancelFlow}
          onApprovals={() => {
            setCanvasTab("steps");
            setActiveP0Step("approve-build");
          }}
          onTabChange={setCanvasTab}
          tallies={originateTallies}
          tenantName={tenantName}
        />
        <div className={styles.phaseBodyMain}>
          <AgentDock
            agent={{
              initials: "aVa",
              mark: "ava",
              name: "aVa",
              role: "Move advisor",
            }}
            surface="/strategic-moves/new"
            defaultMode="collapsed"
            collapsedRestoreMode="expand"
            collapsedSummary={{ label: "aVa", detail: "P0 Originate" }}
            isAgentBusy={streaming}
            thread={dockThread}
            suggestedActions={dockSuggestedActions}
            onMessage={(text) => void send(text)}
            surfaceContext={{
              phase: 0,
              tenantName,
              programName: brief.programName || null,
              brief: {
                fields: brief.fields,
                filledCount: requiredFilled,
                fieldsTotal: activeRequiredFieldCount,
              },
            }}
            workspace={
              <P0OriginationContractCanvas
                activeP0Def={activeP0Def}
                activeP0Step={activeP0Step}
                brief={brief}
                canPromote={canPromote}
                canvasTab={canvasTab}
                completionPercent={completionPercent}
                draftFields={draftFields}
                requiredFilled={requiredFilled}
                requiredFieldCount={activeRequiredFieldCount}
                scaffoldDefs={activeScaffoldDefs}
                stageGroups={activeStageGroups}
                setActiveP0Step={setActiveP0Step}
                setBrief={setBrief}
                setCanvasTab={setCanvasTab}
                setDraftFields={setDraftFields}
                submitError={submitError}
                suggestedName={suggestedName}
                tenantName={tenantName}
                visualStepComplete={visualStepComplete}
                clearBriefField={clearBriefField}
                promote={promote}
                saveDraftField={saveDraftField}
                cancelFlow={cancelFlow}
              />
            }
          />
        </div>
      </section>

      {/* Discard confirmation */}
      {showConfirm ? (
        <div
          className={`${styles.confirmOverlay} ${styles.confirmOverlayShow}`}
          role="presentation"
        >
          <div
            className={styles.confirmDialog}
            role="dialog"
            aria-modal="true"
            aria-labelledby="confirm-discard-title"
          >
            <h3
              id="confirm-discard-title"
              className={styles.confirmDialogTitle}
            >
              Discard this move?
            </h3>
            <p className={styles.confirmDialogBody}>
              You&rsquo;ve captured {filledCount} of {activeRequiredFieldCount}{" "}
              sections ({requiredFilled} of {activeRequiredFieldCount}{" "}
              required). Save as a draft to come back, or discard and start
              fresh.
            </p>
            <div className={styles.confirmActions}>
              <button
                className={styles.confirmBtn}
                onClick={() => setShowConfirm(false)}
                type="button"
              >
                Continue working
              </button>
              <button
                className={`${styles.confirmBtn} ${styles.confirmBtnDanger}`}
                onClick={() => {
                  setShowConfirm(false);
                  setBrief({
                    programName: "",
                    fields: { ...INITIAL_FIELDS },
                  });
                  router.push("/strategic-moves");
                }}
                type="button"
              >
                Discard
              </button>
              <button
                className={`${styles.confirmBtn} ${styles.confirmBtnPrimary}`}
                onClick={() => {
                  setShowConfirm(false);
                  router.push("/strategic-moves");
                }}
                type="button"
              >
                Save as draft
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function P0OriginationRail({
  activeTab,
  moveName,
  onBack,
  onApprovals,
  onTabChange,
  tallies,
  tenantName,
}: {
  activeTab: P0WorkspaceTab;
  moveName: string;
  onBack: () => void;
  onApprovals: () => void;
  onTabChange: (tab: P0WorkspaceTab) => void;
  tallies: PhaseTallyRow[];
  tenantName: string;
}) {
  return (
    <aside
      className={styles.p0ShellRail}
      aria-label={`Move journey: phase 0 of ${tallies.length - 1}`}
    >
      <button type="button" className={styles.p0RailBack} onClick={onBack}>
        &larr; All Moves
      </button>
      <div className={styles.p0RailMoveContext}>
        <h2>{moveName}</h2>
        <p>{tenantName} · Move hypothesis</p>
      </div>

      <div className={styles.p0RailSection}>
        <div className={styles.p0RailSectionLabel}>Phases</div>
        <div className={styles.p0RailRows}>
          {tallies.map((row) => {
            const isCurrent = row.state === "current";
            const isDone = row.state === "done";
            return (
              <div
                key={row.phase}
                className={`${styles.p0RailPhaseRow} ${
                  isCurrent ? styles.p0RailPhaseRowCurrent : ""
                } ${isDone ? styles.p0RailPhaseRowDone : ""}`}
              >
                <span className={styles.p0RailPhaseBadge} aria-hidden>
                  {isDone
                    ? "✓"
                    : row.phase === 0
                      ? "P0"
                      : String(row.phase).padStart(2, "0")}
                </span>
                <span className={styles.p0RailPhaseLabel}>{row.label}</span>
                <span className={styles.p0RailPhaseTally}>
                  {row.total > 0 ? `${row.met} of ${row.total}` : "—"}
                </span>
              </div>
            );
          })}
          <div className={styles.p0RailTower}>
            <span aria-hidden>&rarr;</span> Hands to Tower after P5
          </div>
        </div>
      </div>

      <div className={styles.p0RailSection}>
        <div className={styles.p0RailSectionLabel}>Workspace</div>
        <div className={styles.p0RailWorkspaceRows}>
          <button
            type="button"
            className={
              activeTab === "files" ? styles.p0RailWorkspaceActive : ""
            }
            onClick={() => onTabChange("files")}
          >
            <span aria-hidden>□</span>
            Files & Evidence
          </button>
          <button
            type="button"
            className={
              activeTab === "intelligence" ? styles.p0RailWorkspaceActive : ""
            }
            onClick={() => onTabChange("intelligence")}
          >
            <span aria-hidden>a</span>
            Phase Intelligence
            <small>hidden</small>
          </button>
          <button type="button" onClick={onApprovals}>
            <span aria-hidden>✓</span>
            Approvals
            <small className={styles.p0RailAmberDot} aria-hidden />
          </button>
        </div>
      </div>

      <div className={styles.p0RailFooter}>
        <span>Design contract &rarr;</span>
        <p>aVa guides P0-P4 · Atlas takes over P5 Execute.</p>
      </div>
    </aside>
  );
}

function P0OriginationContractCanvas({
  activeP0Def,
  activeP0Step,
  brief,
  canPromote,
  canvasTab,
  completionPercent,
  draftFields,
  requiredFilled,
  requiredFieldCount,
  scaffoldDefs,
  stageGroups,
  setActiveP0Step,
  setBrief,
  setCanvasTab,
  setDraftFields,
  submitError,
  suggestedName,
  tenantName,
  visualStepComplete,
  clearBriefField,
  promote,
  saveDraftField,
  cancelFlow,
}: {
  activeP0Def: ScaffoldDef | null;
  activeP0Step: P0StepId;
  brief: BriefState;
  canPromote: boolean;
  canvasTab: P0WorkspaceTab;
  completionPercent: number;
  draftFields: Record<ScaffoldFieldId, string>;
  requiredFilled: number;
  requiredFieldCount: number;
  scaffoldDefs: ScaffoldDef[];
  stageGroups: Array<{ label: string; stepIds: P0StepId[] }>;
  setActiveP0Step: Dispatch<SetStateAction<P0StepId>>;
  setBrief: Dispatch<SetStateAction<BriefState>>;
  setCanvasTab: Dispatch<SetStateAction<P0WorkspaceTab>>;
  setDraftFields: Dispatch<SetStateAction<Record<ScaffoldFieldId, string>>>;
  submitError: string | null;
  suggestedName: string;
  tenantName: string;
  visualStepComplete: (id: P0StepId) => boolean;
  clearBriefField: (id: ScaffoldFieldId) => void;
  promote: () => Promise<void>;
  saveDraftField: (id: ScaffoldFieldId) => void;
  cancelFlow: () => void;
}) {
  const isApproveStep = activeP0Step === "approve-build";
  const activeValue = activeP0Def ? brief.fields[activeP0Def.id] : "";
  const activeDraft = activeP0Def ? draftFields[activeP0Def.id] : "";
  const activeFilled = activeP0Def
    ? brief.fields[activeP0Def.id].trim().length > 0
    : canPromote;
  const readinessFilled =
    brief.fields["foundation-readiness"].trim().length > 0;
  const activeStepNumber = isApproveStep
    ? requiredFieldCount
    : (activeP0Def?.step ?? 1);
  const moveName = deriveStrategicMoveName(brief.programName, brief.fields);

  return (
    <article id="orig-canvas" className={styles.p0Workspace}>
      <div className={styles.p0Header}>
        <div className={styles.detailBreadcrumb}>
          <button
            className={styles.detailCrumb}
            onClick={cancelFlow}
            type="button"
          >
            Moves
          </button>
          <span aria-hidden>&rsaquo;</span>
          <span>{tenantName}</span>
          <span aria-hidden>&rsaquo;</span>
          <span>P0 Originate</span>
        </div>
        <div className={styles.p0HeaderRow}>
          <div className={styles.p0TitleBlock}>
            <div className={styles.p0Eyebrow}>P0 · aVa</div>
            <h1 className={styles.p0Title}>P0 Originate</h1>
            <p className={styles.p0Subtitle}>
              Frame the Move — the problem, the archetype, and who owns it —
              before any build begins.
            </p>
          </div>
          <div
            id="orig-promote-bar-gate-summary"
            className={styles.p0ProgressPill}
          >
            <div className={styles.p0ProgressPillHead}>
              <span>
                {requiredFilled} / {requiredFieldCount}
              </span>
              <small>steps ready</small>
            </div>
            <div className={styles.p0ProgressTrack} aria-hidden>
              <div
                className={styles.p0ProgressFill}
                style={{ width: `${completionPercent}%` }}
              />
            </div>
            <small>{completionPercent}% ready · Intake · mandate</small>
          </div>
        </div>
      </div>

      <div
        id="orig-canvas-tabs"
        className={styles.p0ModeTabs}
        role="tablist"
        aria-label="P0 workspace"
      >
        {(["steps", "files", "intelligence"] as const).map((tab) => (
          <button
            key={tab}
            role="tab"
            type="button"
            aria-selected={canvasTab === tab}
            className={`${styles.p0ModeTab} ${
              canvasTab === tab ? styles.p0ModeTabActive : ""
            }`}
            onClick={() => setCanvasTab(tab)}
          >
            {tab === "steps"
              ? "Steps"
              : tab === "files"
                ? "Files"
                : "✦ Intelligence"}
          </button>
        ))}
      </div>

      <div id="orig-canvas-brief" className={styles.p0ActiveWork}>
        {canvasTab === "steps" ? (
          <section className={styles.p0ContractCard} aria-label="P0 steps">
            <aside className={styles.p0ContractNav} aria-label="P0 step list">
              {stageGroups.map((group) => (
                <div key={group.label} className={styles.p0ContractGroup}>
                  <div className={styles.p0ContractGroupLabel}>
                    {group.label}
                  </div>
                  {group.stepIds.map((id) => {
                    const complete = visualStepComplete(id);
                    const selected = activeP0Step === id;
                    const def =
                      id === "approve-build"
                        ? null
                        : scaffoldDefs.find((item) => item.id === id);
                    const label =
                      id === "approve-build"
                        ? "Approve and Build the Charter"
                        : (def?.label ?? id);
                    return (
                      <button
                        key={id}
                        type="button"
                        className={`${styles.p0ContractStep} ${
                          selected ? styles.p0ContractStepActive : ""
                        }`}
                        onClick={() => setActiveP0Step(id)}
                      >
                        <span
                          className={`${styles.p0ContractStepIcon} ${
                            complete ? styles.p0ContractStepIconDone : ""
                          }`}
                          aria-hidden
                        >
                          {complete ? "✓" : ""}
                        </span>
                        <span>{label}</span>
                      </button>
                    );
                  })}
                </div>
              ))}
              <div className={styles.p0ContractNavFoot}>
                {canPromote
                  ? "All steps complete · approve in Approvals"
                  : `${requiredFilled} of ${requiredFieldCount} complete · finish required steps`}
              </div>
            </aside>

            <section className={styles.p0ContractDetail}>
              <div className={styles.p0ContractDetailTop}>
                <span
                  className={`${styles.p0ContractStepIcon} ${
                    activeFilled ? styles.p0ContractStepIconDone : ""
                  }`}
                  aria-hidden
                >
                  {activeFilled ? "✓" : ""}
                </span>
                <span className={styles.p0ContractStepMeta}>
                  Step {activeStepNumber} of {requiredFieldCount}
                </span>
                <h2>
                  {isApproveStep
                    ? "Approve and Build the Charter"
                    : activeP0Def?.label}
                </h2>
                <span className={styles.p0ContractProvide}>Provide</span>
                <span
                  className={`${styles.p0ContractDonePill} ${
                    activeFilled ? styles.p0ContractDonePillOn : ""
                  }`}
                >
                  {activeFilled ? "Done" : "Open"}
                </span>
              </div>

              {isApproveStep ? (
                <P0ApproveDetail
                  canPromote={canPromote}
                  promote={promote}
                  requiredFilled={requiredFilled}
                  requiredFieldCount={requiredFieldCount}
                  submitError={submitError}
                />
              ) : activeP0Def ? (
                <div className={styles.p0ContractForm}>
                  <p>{activeP0Def.help}</p>
                  {activeFilled ? (
                    <div className={styles.p0ContractCaptured}>
                      {activeValue}
                    </div>
                  ) : null}
                  {activeP0Def.id === "problem-statement" ? (
                    <div className={styles.p0ContractNameRow}>
                      <label htmlFor="orig-identity-name-input">
                        Move title
                      </label>
                      <input
                        id="orig-identity-name-input"
                        type="text"
                        placeholder="Member Service Agent Assist"
                        value={brief.programName}
                        onChange={(e) =>
                          setBrief((prev) => ({
                            ...prev,
                            programName: e.target.value,
                          }))
                        }
                        onBlur={() =>
                          setBrief((prev) => ({
                            ...prev,
                            programName: deriveStrategicMoveName(
                              prev.programName,
                              prev.fields,
                            ),
                          }))
                        }
                        maxLength={90}
                        className={styles.p0NameInput}
                      />
                      <small>Suggested: {suggestedName}</small>
                    </div>
                  ) : null}
                  {activeP0Def.fieldType === "select" ? (
                    <select
                      id={`orig-canvas-brief-section-${activeP0Def.step}-input`}
                      className={styles.p0AnswerInput}
                      value={activeDraft}
                      onChange={(e) =>
                        setDraftFields((prev) => ({
                          ...prev,
                          [activeP0Def.id]: e.target.value,
                        }))
                      }
                    >
                      <option value="">Select…</option>
                      {(activeP0Def.options ?? []).map((opt) => (
                        <option key={opt} value={opt}>
                          {opt}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <textarea
                      id={`orig-canvas-brief-section-${activeP0Def.step}-input`}
                      className={styles.p0AnswerInput}
                      value={activeDraft}
                      placeholder={activeP0Def.placeholder}
                      rows={activeP0Def.id === "evidence-family" ? 5 : 6}
                      onChange={(e) =>
                        setDraftFields((prev) => ({
                          ...prev,
                          [activeP0Def.id]: e.target.value,
                        }))
                      }
                    />
                  )}
                  <div className={styles.scaffoldActions}>
                    <button
                      type="button"
                      className={styles.scaffoldSaveButton}
                      onClick={() => saveDraftField(activeP0Def.id)}
                      disabled={!activeDraft.trim()}
                    >
                      {activeFilled ? "Update section" : "Submit section"}
                    </button>
                    {activeFilled ? (
                      <button
                        type="button"
                        className={styles.scaffoldClearButton}
                        onClick={() => clearBriefField(activeP0Def.id)}
                      >
                        Clear
                      </button>
                    ) : null}
                  </div>

                  {activeP0Def.id === "evidence-family" ? (
                    <div className={styles.p0FoundationInset}>
                      <div>
                        <strong>Foundation readiness</strong>
                        <span>{readinessFilled ? "Captured" : "Required"}</span>
                      </div>
                      {readinessFilled ? (
                        <p>{brief.fields["foundation-readiness"]}</p>
                      ) : null}
                      <textarea
                        id="orig-canvas-brief-section-10-input"
                        className={styles.p0AnswerInput}
                        value={draftFields["foundation-readiness"]}
                        placeholder={
                          scaffoldDefs.find(
                            (def) => def.id === "foundation-readiness",
                          )?.placeholder
                        }
                        rows={4}
                        onChange={(e) =>
                          setDraftFields((prev) => ({
                            ...prev,
                            "foundation-readiness": e.target.value,
                          }))
                        }
                      />
                      <div className={styles.scaffoldActions}>
                        <button
                          type="button"
                          className={styles.scaffoldSaveButton}
                          onClick={() => saveDraftField("foundation-readiness")}
                          disabled={!draftFields["foundation-readiness"].trim()}
                        >
                          {readinessFilled
                            ? "Update readiness"
                            : "Submit readiness"}
                        </button>
                        {readinessFilled ? (
                          <button
                            type="button"
                            className={styles.scaffoldClearButton}
                            onClick={() =>
                              clearBriefField("foundation-readiness")
                            }
                          >
                            Clear
                          </button>
                        ) : null}
                      </div>
                    </div>
                  ) : null}
                </div>
              ) : null}
            </section>
          </section>
        ) : canvasTab === "files" ? (
          <section className={styles.p0ContractEmptyPane}>
            <h2>Files</h2>
            <p>
              P0 does not require uploads before approval. Approve and Build
              creates the AI-draft Charter, then P1 opens the file workflow for
              review and client-approved evidence.
            </p>
            <div className={styles.p0EvidencePills}>
              <span>Move charter (AI draft)</span>
              <span>Origination transcript</span>
              <span>P1 evidence plan</span>
            </div>
          </section>
        ) : (
          <section className={styles.p0ContractEmptyPane}>
            <h2>Phase Intelligence</h2>
            <p>
              aVa uses the captured P0 fields to infer the archetype, evidence
              families, readiness assumptions, and value hypothesis. It should
              not fabricate evidence or mark the AI draft authoritative.
            </p>
            <div className={styles.p0EvidencePills}>
              <span>Archetype routing</span>
              <span>Evidence playbook</span>
              <span>Foundation checks</span>
            </div>
          </section>
        )}
      </div>

      <div className={styles.p0ContractMoveName} aria-live="polite">
        <span>Move</span>
        <strong>{moveName}</strong>
      </div>
    </article>
  );
}

function P0ApproveDetail({
  canPromote,
  promote,
  requiredFilled,
  requiredFieldCount,
  submitError,
}: {
  canPromote: boolean;
  promote: () => Promise<void>;
  requiredFilled: number;
  requiredFieldCount: number;
  submitError: string | null;
}) {
  return (
    <div className={styles.p0ContractApprove}>
      <p>
        Approving generates the AI-draft Charter and opens P1. The draft is not
        authoritative until reviewed.
      </p>
      <div className={styles.p0ExpectedEvidence}>
        <span>Evidence expected</span>
        <div>Move charter (AI draft)</div>
      </div>
      <div className={styles.p0ContractActionRow}>
        <button
          id="orig-promote-bar-promote-btn"
          type="button"
          className={styles.p0ApproveBuildButton}
          disabled={!canPromote}
          aria-disabled={!canPromote}
          onClick={() => void promote()}
        >
          Approve and Build <span aria-hidden>&rarr;</span>
        </button>
        <span>
          {canPromote
            ? "All steps complete — runs Approve and Build."
            : `${requiredFilled} of ${requiredFieldCount} complete — finish the remaining P0 answers.`}
        </span>
      </div>
      {submitError ? (
        <div className={styles.submitError}>{submitError}</div>
      ) : null}
    </div>
  );
}
