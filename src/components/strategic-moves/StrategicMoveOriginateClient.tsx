"use client";

// StrategicMoveOriginateClient · Strategic Moves Originate (P0)
//
// Two-pane origination workspace: Nexus chat on the left drives a
// reactive 7-section scaffold on the right. Uses /api/chat/agent with
// surface '/strategic-moves/new' and agentName 'Nexus'.
//
// The agent receives the T-P0 phase pack + AH-ORIG-1–6 rules via the
// agent route system prompt. First-message variant (2A/2B) is composed
// server-side and passed in as `initialTurns`.

import {
  Component,
  useCallback,
  useEffect,
  useRef,
  useState,
  useTransition,
  type ReactNode,
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
import { DiscoveryCapturePanel } from "../programs/discovery/DiscoveryCapturePanel";
import { strategicMoveBriefToDiscoveryShape } from "./strategicMoveBriefToDiscoveryShape";
import { resolveStrategicMoveOriginationRedirect } from "./resolveOriginationRedirect";
import { MovePhaseExplorer } from "./MovePhaseExplorer";
import type { PhaseTallyRow } from "@/lib/programs/phase-explorer-tallies";
import { useFeature } from "@/lib/features/use-feature";

// ---------------------------------------------------------------------------
// MOVES-UI-004 finder-shell flag gate.
//
// Ports the exact error-boundary-wrapped useFeature() pattern already used
// by MovePhaseExplorer.tsx (this page's rail) and MovesPhaseStandaloneClient
// .tsx's `.mxw-finder-on` block (the phase-workspace pages). `useFeature()`
// resolves the active tenant via `useClientContext()`, which depends on
// Clerk's `useUser()`; every real page render sits under the app's
// <ClerkProvider>, so this always resolves in production. Isolated renders
// (unit tests without that provider stack) fall back to `false`, which
// keeps the "flag off -> byte-for-byte legacy render" guarantee intact even
// when the flag itself can't be evaluated.
//
// Purely presentational: `finderShellEnabled` only toggles the
// `.finderShellOn` ancestor class (see StrategicMoves.module.css) added to
// the root `#orig-page` wrapper. It does not touch wizard state, tab
// switching, validation, or any data fetch.
// ---------------------------------------------------------------------------

class OriginateFinderShellErrorBoundary extends Component<
  { children: ReactNode; fallback: ReactNode },
  { hasError: boolean }
> {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  render() {
    return this.state.hasError ? this.props.fallback : this.props.children;
  }
}

function OriginateFinderShellFlagReader({
  children,
}: {
  children: (finderShellEnabled: boolean) => ReactNode;
}) {
  const finderShellEnabled = useFeature("moves_finder_shell_v1");
  return <>{children(finderShellEnabled)}</>;
}

function OriginateFinderShellGate({
  children,
}: {
  children: (finderShellEnabled: boolean) => ReactNode;
}) {
  return (
    <OriginateFinderShellErrorBoundary fallback={<>{children(false)}</>}>
      <OriginateFinderShellFlagReader>
        {children}
      </OriginateFinderShellFlagReader>
    </OriginateFinderShellErrorBoundary>
  );
}

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
  | "scope-boundary"
  | "evidence-family"
  | "value-hypothesis"
  | "foundation-readiness";

interface BriefState {
  programName: string;
  fields: Record<ScaffoldFieldId, string>;
}

const INITIAL_FIELDS: Record<ScaffoldFieldId, string> = {
  "problem-statement": "",
  archetype: "",
  "sponsor-candidate": "",
  "scope-boundary": "",
  "evidence-family": "",
  "value-hypothesis": "",
  "foundation-readiness": "",
};

const REQUIRED_FIELD_COUNT = Object.keys(INITIAL_FIELDS).length;
const MOVE_NAME_MAX_WORDS = 6;
const MOVE_NAME_MAX_CHARS = 48;

const SCAFFOLD_DEFS: Array<{
  id: ScaffoldFieldId;
  label: string;
  step: number;
}> = [
  { id: "problem-statement", label: "What's the bet / hypothesis", step: 1 },
  { id: "archetype", label: "Archetype classification", step: 2 },
  { id: "sponsor-candidate", label: "Sponsor candidate", step: 3 },
  { id: "scope-boundary", label: "Scope / boundary", step: 4 },
  { id: "evidence-family", label: "Evidence family selection", step: 5 },
  { id: "value-hypothesis", label: "Value hypothesis seed", step: 6 },
  { id: "foundation-readiness", label: "Foundation readiness", step: 7 },
];

type P0TabId = "frame" | "govern" | "readiness";

type P0Question =
  | {
      id: "program-name";
      label: string;
      helper: string;
      placeholder: string;
    }
  | {
      id: ScaffoldFieldId;
      label: string;
      helper: string;
      placeholder: string;
    };

const P0_TABS: Array<{
  id: P0TabId;
  label: string;
  shortLabel: string;
  summary: string;
  questions: P0Question[];
}> = [
  {
    id: "frame",
    label: "Frame the Bet",
    shortLabel: "Frame",
    summary: "Problem, short name, archetype",
    questions: [
      {
        id: "problem-statement",
        label: "What business problem or opportunity are we solving?",
        helper:
          "Tell the story in plain English. A note, email thread, or problem statement is enough.",
        placeholder:
          "Members experience long calls and inconsistent answers because agents navigate multiple systems...",
      },
      {
        id: "program-name",
        label: "What should this Move be called?",
        helper:
          "Keep it short and strategic. aVa can suggest one, but the title should be a few words.",
        placeholder: "Member Service Agent Assist",
      },
      {
        id: "archetype",
        label: "Which transformation pattern does this fit?",
        helper:
          "Use a practical archetype, not a taxonomy exercise. This helps route the right evidence and playbook.",
        placeholder:
          "Contact Center Agent Assist - agent augmentation for member-service operations.",
      },
    ],
  },
  {
    id: "govern",
    label: "Govern the Move",
    shortLabel: "Govern",
    summary: "Sponsor/title and scope",
    questions: [
      {
        id: "sponsor-candidate",
        label: "Which executive role or title should sponsor this?",
        helper:
          "A title is enough at P0. Named person resolution can happen later.",
        placeholder:
          "COO as executive sponsor; VP Member Operations and Contact Center Director as operating owners; CDIO as data/platform co-sponsor.",
      },
      {
        id: "scope-boundary",
        label: "What is in scope, and what is explicitly out?",
        helper:
          "Draw the first practical boundary so P1/P2 can validate instead of boil the ocean.",
        placeholder:
          "In: claims status, prior auth status, benefits/eligibility, CRM history, agent knowledge lookup. Out: clinical decisions, appeals adjudication, provider contracts.",
      },
    ],
  },
  {
    id: "readiness",
    label: "Prove Readiness",
    shortLabel: "Readiness",
    summary: "Evidence, value, foundation",
    questions: [
      {
        id: "evidence-family",
        label: "What evidence should P1/P2 collect?",
        helper:
          "Name the evidence families, not every file. Uploads and parsing come after promotion.",
        placeholder:
          "Member-service metrics, call transcripts/intent taxonomy, CRM history, claims/auth/benefits samples, knowledge base, systems inventory, controls, value assumptions.",
      },
      {
        id: "value-hypothesis",
        label: "What value hypothesis should we validate?",
        helper:
          "Keep it directional. Exact targets can be proven later from client evidence.",
        placeholder:
          "Reduce avoidable handle time, repeat contact, transfers, and manual rework while improving first-call resolution and answer consistency.",
      },
      {
        id: "foundation-readiness",
        label: "What foundations must be ready?",
        helper:
          "Capture the platform, data, control, and governance assumptions that P2 must prove.",
        placeholder:
          "Trusted access to CRM, claims, eligibility/benefits, prior authorization, policy/knowledge, identity/access, audit logs, data freshness, quality, semantic definitions, and PHI controls.",
      },
    ],
  },
];

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
  { id: "scope-boundary", labels: ["scope", "scope boundary"] },
  {
    id: "evidence-family",
    labels: ["evidence family", "evidence families", "evidence"],
  },
  {
    id: "value-hypothesis",
    labels: ["value hypothesis", "value", "outcome hypothesis"],
  },
  {
    id: "foundation-readiness",
    labels: ["foundation readiness", "readiness"],
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
}

export function StrategicMoveOriginateClient({
  tenantName,
  initialTurns,
  originatingIntelligenceSessionId = null,
  discoveryIntakeEnabled = false,
}: Props) {
  const router = useRouter();
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
  const [activeP0Tab, setActiveP0Tab] = useState<P0TabId>("frame");
  const [streaming, setStreaming] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [canvasTab, setCanvasTab] = useState<"brief" | "discovery">("brief");
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
              scopeBoundary: brief.fields["scope-boundary"] || null,
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
                fieldsTotal: REQUIRED_FIELD_COUNT,
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
      updateTurns,
      handleArtifact,
    ],
  );

  const filledCount = Object.values(brief.fields).filter(
    (v) => v.trim().length > 0,
  ).length;
  const requiredFilled = SCAFFOLD_DEFS.filter(
    ({ id }) => brief.fields[id].trim().length > 0,
  ).length;
  const canPromote =
    requiredFilled >= REQUIRED_FIELD_COUNT && !isPending && !streaming;
  const suggestedName = suggestedStrategicMoveName(brief.fields);
  const activeTab = P0_TABS.find((tab) => tab.id === activeP0Tab) ?? P0_TABS[0];
  const activeTabIndex = P0_TABS.findIndex((tab) => tab.id === activeTab.id);
  const completionPercent = Math.round(
    (requiredFilled / REQUIRED_FIELD_COUNT) * 100,
  );
  const originateTallies: PhaseTallyRow[] = [
    {
      phase: 0,
      label: "P0 Originate",
      met: requiredFilled,
      total: REQUIRED_FIELD_COUNT,
      state: "current",
    },
    { phase: 1, label: "P1 Charter", met: 0, total: 5, state: "upcoming" },
    { phase: 2, label: "P2 Discover", met: 0, total: 5, state: "upcoming" },
    { phase: 3, label: "P3 Design", met: 0, total: 5, state: "upcoming" },
    { phase: 4, label: "P4 Roadmap", met: 0, total: 5, state: "upcoming" },
    { phase: 5, label: "P5 Handoff", met: 0, total: 5, state: "upcoming" },
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
  const activeScaffoldQuestions = activeTab.questions.filter(
    (question): question is Extract<P0Question, { id: ScaffoldFieldId }> =>
      question.id !== "program-name",
  );
  const activeTabMet = activeScaffoldQuestions.filter(
    (question) => brief.fields[question.id].trim().length > 0,
  ).length;
  const nextTab = P0_TABS[activeTabIndex + 1] ?? null;
  const previousTab = P0_TABS[activeTabIndex - 1] ?? null;

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
            scopeBoundary: brief.fields["scope-boundary"] || null,
            evidenceFamily: brief.fields["evidence-family"] || null,
            // Origination chat transcript → persisted to turns table
            originationTurns,
            // Discovery Intake (Tier B): persist the captured discovery shape so
            // it carries into the charter. Server gates it by discovery_intake_v2
            // (applyDiscoveryShapeIfEnabled); null when the flag is off here.
            discoveryShape: discoveryIntakeEnabled
              ? strategicMoveBriefToDiscoveryShape(brief.fields)
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
    <OriginateFinderShellGate>
      {(finderShellEnabled) => (
        <div
          id="orig-page"
          className={`${styles.page}${finderShellEnabled ? ` ${styles.finderShellOn}` : ""}`}
        >
          <div id="orig-identity" className={styles.originContextBar}>
            <div className={styles.originContextLeft}>
              <span className={styles.originLabel}>MOVES</span>
              <span className={styles.originBranch}>New Move</span>
              <span
                id="orig-identity-title"
                className={styles.originDraftBadge}
              >
                {brief.programName.trim()
                  ? deriveStrategicMoveName(
                      brief.programName,
                      brief.fields,
                    ).toUpperCase()
                  : requiredFilled > 0
                    ? suggestedName.toUpperCase()
                    : "UNTITLED"}{" "}
                &middot; DRAFT
              </span>
            </div>
            <div className={styles.originContextRight}>
              <span>P0 workflow</span>
              <strong>Phase 1 of 6 · Originate</strong>
            </div>
            <button
              className={styles.originCancel}
              onClick={cancelFlow}
              type="button"
            >
              &#10005; Cancel
            </button>
          </div>

          <section id="orig-grid" className={styles.phaseBody}>
            <MovePhaseExplorer
              moveId="new"
              currentPhase={0}
              tallies={originateTallies}
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
                    fieldsTotal: REQUIRED_FIELD_COUNT,
                  },
                }}
                workspace={
                  <article id="orig-canvas" className={styles.p0Workspace}>
                    <div className={styles.p0Header}>
                      <div className={styles.detailBreadcrumb}>
                        <button
                          className={styles.detailCrumb}
                          onClick={cancelFlow}
                          type="button"
                        >
                          Strategic Moves
                        </button>
                        <span aria-hidden>&rsaquo;</span>
                        <span>{tenantName}</span>
                        <span aria-hidden>&rsaquo;</span>
                        <span>NEW</span>
                      </div>
                      <div className={styles.p0HeaderRow}>
                        <div className={styles.p0TitleBlock}>
                          <div className={styles.p0Eyebrow}>P0 · Originate</div>
                          <h1 className={styles.p0Title}>
                            Shape the Move brief
                          </h1>
                          <p className={styles.p0Subtitle}>
                            Answer seven required questions. Direct fields and
                            aVa both update this same brief in real time.
                          </p>
                        </div>
                        <div
                          id="orig-promote-bar-gate-summary"
                          className={styles.p0ProgressPill}
                        >
                          <span>{requiredFilled} of 7</span>
                          <div className={styles.p0ProgressTrack} aria-hidden>
                            <div
                              className={styles.p0ProgressFill}
                              style={{ width: `${completionPercent}%` }}
                            />
                          </div>
                          <small>{completionPercent}% complete</small>
                        </div>
                      </div>
                    </div>

                    <div
                      className={styles.p0TabStrip}
                      role="tablist"
                      aria-label="Origination question groups"
                    >
                      {P0_TABS.map((tab, index) => {
                        const tabQuestions = tab.questions.filter(
                          (question) => question.id !== "program-name",
                        ) as Array<P0Question & { id: ScaffoldFieldId }>;
                        const met = tabQuestions.filter(
                          (question) =>
                            brief.fields[question.id].trim().length > 0,
                        ).length;
                        const active = tab.id === activeTab.id;
                        return (
                          <button
                            key={tab.id}
                            type="button"
                            role="tab"
                            aria-selected={active}
                            className={`${styles.p0Tab} ${active ? styles.p0TabActive : ""}`}
                            onClick={() => setActiveP0Tab(tab.id)}
                          >
                            <span>
                              {index + 1}. {tab.label}
                            </span>
                            <strong>
                              {met}/{tabQuestions.length}
                            </strong>
                            <small>{tab.summary}</small>
                          </button>
                        );
                      })}
                    </div>

                    {discoveryIntakeEnabled ? (
                      <div
                        id="orig-canvas-tabs"
                        className={styles.p0SubTabs}
                        role="tablist"
                        aria-label="Originate canvas view"
                      >
                        {(["brief", "discovery"] as const).map((tab) => (
                          <button
                            key={tab}
                            role="tab"
                            type="button"
                            aria-selected={canvasTab === tab}
                            id={`orig-canvas-tab-${tab}`}
                            className={`${styles.p0SubTab} ${canvasTab === tab ? styles.p0SubTabActive : ""}`}
                            onClick={() => setCanvasTab(tab)}
                          >
                            {tab === "brief" ? "Brief" : "Discovery"}
                          </button>
                        ))}
                      </div>
                    ) : null}

                    {!discoveryIntakeEnabled || canvasTab === "brief" ? (
                      <div
                        id="orig-canvas-brief"
                        className={styles.p0ActiveWork}
                      >
                        <section className={styles.p0CommandCenter}>
                          <div className={styles.p0CommandHead}>
                            <span>P0 command center</span>
                            <strong>Use the tabs to originate this Move</strong>
                          </div>
                          <div className={styles.p0CommandTable}>
                            <div>
                              <span>Purpose</span>
                              <p>
                                Capture the seven answers that become the
                                governed P1 charter seed.
                              </p>
                            </div>
                            <div>
                              <span>Do now</span>
                              <p>
                                Work left to right: frame the bet, define
                                governance, then prove readiness.
                              </p>
                            </div>
                            <div>
                              <span>Done when</span>
                              <p>
                                All seven answers are captured and promotion
                                creates the P0 gate review.
                              </p>
                            </div>
                            <div>
                              <span>Live state</span>
                              <p>
                                {requiredFilled} of {REQUIRED_FIELD_COUNT}{" "}
                                captured ·{" "}
                                {canPromote ? "ready for P1 gate" : "not ready"}
                              </p>
                            </div>
                          </div>
                        </section>
                        <div className={styles.p0ActiveHead}>
                          <div>
                            <div className={styles.p0Eyebrow}>
                              Active work · {activeTab.shortLabel}
                            </div>
                            <h2 className={styles.p0SectionTitle}>
                              {activeTab.label}
                            </h2>
                          </div>
                          <span className={styles.p0GroupCount}>
                            {activeTabMet} of {activeScaffoldQuestions.length}
                          </span>
                        </div>

                        <div className={styles.p0QuestionGrid}>
                          {activeTab.questions.map((question) => {
                            if (question.id === "program-name") {
                              return (
                                <section
                                  key={question.id}
                                  className={styles.p0QuestionCard}
                                >
                                  <label
                                    className={styles.p0QuestionLabel}
                                    htmlFor="orig-identity-name-input"
                                  >
                                    {question.label}
                                  </label>
                                  <p className={styles.p0QuestionHelp}>
                                    {question.helper}
                                  </p>
                                  <input
                                    id="orig-identity-name-input"
                                    type="text"
                                    placeholder={question.placeholder}
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
                                  <div className={styles.programNameHint}>
                                    Suggested: {suggestedName}
                                  </div>
                                </section>
                              );
                            }

                            const def = SCAFFOLD_DEFS.find(
                              (item) => item.id === question.id,
                            );
                            if (!def) return null;
                            const value = brief.fields[question.id];
                            const filled = value.trim().length > 0;
                            const draftValue = draftFields[question.id];
                            return (
                              <section
                                id={`orig-canvas-brief-section-${def.step}`}
                                key={question.id}
                                className={`${styles.p0QuestionCard} ${filled ? styles.p0QuestionCardDone : ""}`}
                              >
                                <div className={styles.p0QuestionTop}>
                                  <div>
                                    <div className={styles.p0QuestionNumber}>
                                      {String(def.step).padStart(2, "0")}
                                    </div>
                                    <label
                                      className={styles.p0QuestionLabel}
                                      htmlFor={`orig-canvas-brief-section-${def.step}-input`}
                                    >
                                      {question.label}
                                    </label>
                                  </div>
                                  <span
                                    className={styles.p0QuestionStatus}
                                    aria-label={filled ? "Captured" : "Pending"}
                                  >
                                    {filled ? "Captured" : "Pending"}
                                  </span>
                                </div>
                                <p className={styles.p0QuestionHelp}>
                                  {question.helper}
                                </p>
                                {filled ? (
                                  <div
                                    id={`orig-canvas-brief-section-${def.step}-content`}
                                    className={styles.p0CapturedText}
                                  >
                                    {value}
                                  </div>
                                ) : null}
                                <textarea
                                  id={`orig-canvas-brief-section-${def.step}-input`}
                                  className={styles.p0AnswerInput}
                                  value={draftValue}
                                  placeholder={question.placeholder}
                                  rows={4}
                                  onChange={(e) =>
                                    setDraftFields((prev) => ({
                                      ...prev,
                                      [question.id]: e.target.value,
                                    }))
                                  }
                                />
                                <div className={styles.scaffoldActions}>
                                  <button
                                    type="button"
                                    className={styles.scaffoldSaveButton}
                                    onClick={() => saveDraftField(question.id)}
                                    disabled={!draftValue.trim()}
                                  >
                                    {filled
                                      ? "Update section"
                                      : "Submit section"}
                                  </button>
                                  {filled ? (
                                    <button
                                      type="button"
                                      className={styles.scaffoldClearButton}
                                      onClick={() =>
                                        clearBriefField(question.id)
                                      }
                                    >
                                      Clear
                                    </button>
                                  ) : null}
                                </div>
                              </section>
                            );
                          })}
                        </div>

                        <footer
                          id="orig-promote-bar"
                          className={styles.p0Footer}
                        >
                          <div className={styles.p0StepNav}>
                            <button
                              type="button"
                              className={styles.scaffoldClearButton}
                              disabled={!previousTab}
                              onClick={() =>
                                previousTab
                                  ? setActiveP0Tab(previousTab.id)
                                  : null
                              }
                            >
                              Back
                            </button>
                            {nextTab ? (
                              <button
                                type="button"
                                className={styles.scaffoldSaveButton}
                                onClick={() => setActiveP0Tab(nextTab.id)}
                              >
                                Next: {nextTab.shortLabel}
                              </button>
                            ) : null}
                          </div>
                          <div className={styles.p0Promotion}>
                            <div>
                              <strong>
                                {canPromote
                                  ? "Ready to promote"
                                  : `${requiredFilled} of ${REQUIRED_FIELD_COUNT} required sections complete`}
                              </strong>
                              <span
                                id="orig-promote-bar-status-text"
                                className={styles.p0PromotionStatus}
                              >
                                {canPromote
                                  ? "P1 will use this brief as the charter seed."
                                  : "Complete all 7 brief sections to promote."}
                              </span>
                            </div>
                            <button
                              id="orig-promote-bar-promote-btn"
                              className={styles.btnPromote}
                              disabled={!canPromote}
                              onClick={() => void promote()}
                              type="button"
                              aria-disabled={!canPromote}
                            >
                              <span>Promote to P1 Charter</span>
                              <span
                                className={styles.btnPromoteArrow}
                                aria-hidden
                              >
                                &rarr;
                              </span>
                            </button>
                          </div>
                          {submitError ? (
                            <div className={styles.submitError}>
                              {submitError}
                            </div>
                          ) : null}
                        </footer>
                      </div>
                    ) : (
                      <div
                        id="orig-canvas-discovery"
                        className={styles.p0Discovery}
                      >
                        <DiscoveryCapturePanel
                          shape={strategicMoveBriefToDiscoveryShape(
                            brief.fields,
                          )}
                        />
                      </div>
                    )}
                  </article>
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
                  You&rsquo;ve captured {filledCount} of 7 sections (
                  {requiredFilled} of {REQUIRED_FIELD_COUNT} required). Save as
                  a draft to come back, or discard and start fresh.
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
      )}
    </OriginateFinderShellGate>
  );
}
